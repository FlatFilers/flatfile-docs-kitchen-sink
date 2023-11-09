import api from "@flatfile/api";
import { automap } from "@flatfile/plugin-automap";
import { recordHook } from "@flatfile/plugin-record-hook";
import { ExcelExtractor } from "@flatfile/plugin-xlsx-extractor";
import nodemailer from "nodemailer";
import { promisify } from "util";

export default function flatfileEventListener(listener) {
  // 1.Create a Workbook
  listener.on("space:created", async (event) => {
    const { spaceId, environmentId } = event.context;

    // Date included in workbook name
    const date = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    await api.workbooks.create({
      spaceId,
      environmentId,
      name: `${date} Inventory`,
      settings: { trackChanges: true },
      sheets: [
        {
          name: `Inventory`,
          slug: "inventory",
          fields: [
            {
              key: "title",
              type: "string",
              label: "Title",
            },
            {
              key: "author",
              type: "string",
              label: "Author",
            },
            {
              key: "isbn",
              type: "string",
              label: "ISBN",
            },
            {
              key: "stock",
              type: "number",
              label: "Stock",
            },
          ],
          actions: [],
        },
        {
          name: `Purchase Order`,
          slug: "purchase-order",
          fields: [
            {
              key: "title",
              type: "string",
              label: "Title",
            },
            {
              key: "author",
              type: "string",
              label: "Author",
            },
            {
              key: "isbn",
              type: "string",
              label: "ISBN",
            },
            {
              key: "purchase",
              type: "number",
              label: "Purchase",
            },
          ],
          actions: [],
        },
      ],
    });
  });

  // 2. Automate Extraction and Mapping
  listener.use(ExcelExtractor({ rawNumbers: true }));
  listener.use(
    automap({
      accuracy: "confident",
      defaultTargetSheet: "Inventory",
      matchFilename: /^.*inventory\.xlsx$/,
      onFailure: console.error,
    })
  );

  // 3. Transform and Validate
  listener.use(
    recordHook("inventory", async (record, event) => {
      const author = record.get("author");
      function validateNameFormat(name) {
        const pattern = /^\s*[\p{L}'-]+\s*,\s*[\p{L}'-]+\s*$/u;
        return pattern.test(name);
      }

      if (!validateNameFormat(author)) {
        const nameSplit = author.split(" ");
        record.set("author", `${nameSplit[1]}, ${nameSplit[0]}`);
        record.addComment("author", "Author name was updated for vendor");
        return record;
      }
    })
  );

  // 4. Automate Egress
  listener.on("commit:completed", async (event) => {
    // Fetch the email and password from the secrets store
    const email = await event.secrets("email");
    const password = await event.secrets("password");

    const { data } = await api.workbooks.get(event.context.workbookId);
    const inventorySheet = data.sheets[0].id;
    const orderSheet = data.sheets[1].id;

    // Update a purchase order sheet
    const currentInventory = await api.records.get(inventorySheet);
    const purchaseInventory = currentInventory.data.records.map((item) => {
      const stockValue = item.values.stock.value;
      const stockOrder = Math.max(3 - stockValue, 0);
      item.values.purchase = {
        value: stockOrder,
        valid: true,
      };
      const { stock, ...fields } = item.values;
      return fields;
    });
    const purchaseOrder = purchaseInventory.filter(
      (item) => item.purchase.value > 0
    );

    await api.records.insert(orderSheet, purchaseOrder);

    // Get the purchase order as a CSV
    const csv = await api.sheets.getRecordsAsCsv(orderSheet);

    // Send the purchase order to the warehouse
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: email,
        pass: password,
      },
    });
    const mailOptions = {
      from: email,
      to: email, // Configure for desired recipient
      subject: "Purchase Order",
      text: "Attached",
      attachments: [
        {
          filename: "orders.csv",
          content: csv,
        },
      ],
    };
    const sendMail = promisify(transporter.sendMail.bind(transporter));
    await sendMail(mailOptions);
  });
}
