import api, { Flatfile } from "@flatfile/api";
import { FlatfileListener } from "@flatfile/listener";
import { automap } from "@flatfile/plugin-automap";
import { recordHook } from "@flatfile/plugin-record-hook";
import { ExcelExtractor } from "@flatfile/plugin-xlsx-extractor";
import nodemailer from "nodemailer";
import { promisify } from "util";

import fs from "fs";
import path from "path";

export default function flatfileEventListener(listener: FlatfileListener) {
  // 1.Create a Workbook

  let workbook: Flatfile.WorkbookResponse;
  listener.on("job:ready", { job: "space:configure" }, async (event) => {
    const { spaceId, environmentId, jobId } = event.context;

    // Date included in workbook name
    const date = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    try {
      workbook = await api.workbooks.create({
        spaceId,
        environmentId,
        name: `${date} Inventory`,
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
      api.secrets.upsert({
        name: "email",
        value: "stringEmail",
        environmentId,
        spaceId,
      });
      api.secrets.upsert({
        name: "password",
        // Use whatever method fits your use case to store your password securely
        value: "stringPass",
        environmentId,
        spaceId,
      });

      await api.files.upload(
        fs.createReadStream(path.resolve(__dirname, "./inventory.xlsx")),
        {
          spaceId,
          environmentId,
        }
      );

      await api.jobs.complete(jobId, {
        outcome: {
          message: "Your Space was created.",
        },
      });
    } catch (err) {
      console.error(err);

      await api.jobs.fail(jobId, {
        outcome: {
          message: "Creating a Space encountered an error. See Event Logs.",
        },
      });
    }
  });

  // 2. Automate Extraction and Mapping
  listener.use(ExcelExtractor({ rawNumbers: true }));

  listener.on(
    "job:completed",
    { operation: "extract-plugin-excel" },
    async (event) => {
      try {
        const { fileId } = event.context;
        const file = await api.files.get(fileId);
        const fileWorkbookId = file.data.workbookId;
        if (!fileWorkbookId) throw new Error("Workbook does not have an id");
        const fileWorkbook = await api.workbooks.get(fileWorkbookId);

        const workbookId = workbook.data.id;
        const sheets = (await api.workbooks.get(workbookId)).data.sheets;
        if (!sheets) throw new Error("Workbook does not have any sheets");
        const sheetId = sheets[0].id;

        const fileWorkbookSheets = fileWorkbook.data.sheets;
        if (!fileWorkbookId || !fileWorkbookSheets)
          throw new Error("Workbook does not have an id");
        const sourceSheetId = fileWorkbookSheets[0].id;
        await api.jobs.create({
          type: "workbook",
          operation: "map",
          source: fileWorkbookId,
          destination: workbookId,
          status: "planning",
          config: {
            destinationSheetId: sheetId,
            sourceSheetId: sourceSheetId,
          },
          trigger: "immediate",
        });
      } catch (err) {
        console.dir(err, { depth: null });
      }
    }
  );

  listener.use(
    automap({
      accuracy: "confident",
      defaultTargetSheet: "Inventory",
      matchFilename: /^.*inventory\.xlsx$/,
      debug: true,
      onFailure: (err) => console.error(err),
    })
  );

  // 3. Transform and Validate
  listener.use(
    recordHook("inventory", async (record) => {
      const author = record.get("author") as string;
      function validateNameFormat(name: string) {
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
  listener.on("job:completed", { job: "workbook:map" }, async (event) => {
    // Fetch the email and password from the secrets store
    const email = await event.secrets("email");
    const password = await event.secrets("password");

    const { data } = await api.workbooks.get(event.context.workbookId);
    const { sheets } = data;
    if (!sheets) throw new Error("Workbook does not have any sheets");
    const inventorySheet = sheets[0].id;
    const orderSheet = sheets[1].id;

    // Update a purchase order sheet
    const currentInventory = await api.records.get(inventorySheet);
    const purchaseInventory = currentInventory.data.records.map((item) => {
      try {
        if (!item.values.stock.value)
          throw new Error("Stock value is not defined");
        const stockValue =
          typeof item.values.stock.value === "string"
            ? parseInt(item.values.stock.value)
            : item.values.stock.value;
        console.dir(typeof stockValue);
        if (!stockValue || typeof stockValue !== "number") {
          console.dir(stockValue);
          throw new Error(
            "Stock value is not a number, check that it is defiend in the sheet and that it is a number"
          );
        }

        const stockOrder = Math.max(3 - stockValue, 0);
        item.values.purchase = {
          value: stockOrder,
          valid: true,
        };
      } catch (err: any) {
        console.error(err);
        item.values.purchase = {
          value: undefined,
          valid: false,
        };
      } finally {
        const { stock, ...fields } = item.values;
        return fields;
      }
    });
    const purchaseOrder = purchaseInventory.filter(
      (item) =>
        typeof item.purchase.value === "number" && item.purchase.value > 0
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
      to: "warehouse@books.com", // Configure for desired recipient
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
