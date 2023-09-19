/**
 * Get your Secret key at: https://platform.flatfile.com/developers and then
 * paste it in Tools > Secrets > FLATFILE_API_KEY.
 */

import api from "@flatfile/api";
import { recordHook } from "@flatfile/plugin-record-hook";
import axios from "axios";

/**
 * Write a basic Flatfile event subscriber. You can do nearly anything
 * that reacts to events inside Flatfile. To start - Click Run
 */

export default function flatfileEventListener(listener) {
  listener.on("**", ({ topic }) => {
    console.log(`Received event: ${topic}`);
  });

  listener.use(
    recordHook("contacts", (record) => {
      const value = record.get("firstName");
      if (typeof value === "string") {
        record.set("firstName", value.toLowerCase());
      }

      const email = record.get("email");
      const validEmailAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!validEmailAddress.test(email)) {
        console.log("Invalid email address");
        record.addError("email", "Invalid email address");
      }

      return record;
    })
  );

  listener.on("job:ready", { job: "workbook:submitAction" }, async (event) => {
    const { jobId, workbookId } = event.context;

    const sheets = await api.sheets.list({ workbookId });

    const records = {};
    for (const [index, element] of sheets.data.entries()) {
      records[`Sheet[${index}]`] = await api.records.get(element.id);
    }

    try {
      await api.jobs.ack(jobId, {
        info: "Starting job to submit action to webhook.site",
        progress: 10,
      });

      const webhookReceiver =
        process.env.WEBHOOK_SITE_URL ||
        "https://webhook.site/c83648d4-bf0c-4bb1-acb7-9c170dad4388"; //update this

      const response = await axios.post(
        webhookReceiver,
        {
          ...event.payload,
          method: "axios",
          sheets,
          records,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        await api.jobs.complete(jobId, {
          outcome: {
            message:
              "Data was successfully submitted to webhook.site. Go check it out at " +
              webhookReceiver +
              ".",
          },
        });
      } else {
        throw new Error("Failed to submit data to webhook.site");
      }
    } catch (error) {
      console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`);

      await api.jobs.fail(jobId, {
        outcome: {
          message:
            "This job failed probably because it couldn't find the webhook.site URL.",
        },
      });
    }
  });

  listener.on(
    "job:ready",
    { job: "space:configure" },
    async ({ context: { spaceId, environmentId, jobId } }) => {
      await api.jobs.ack(jobId, {
        info: "Gettin started.",
        progress: 10,
      });

      await api.workbooks.create({
        spaceId,
        environmentId,
        name: "All Data",
        labels: ["pinned"],
        sheets: [
          {
            name: "Contacts",
            slug: "contacts",
            fields: [
              {
                key: "firstName",
                type: "string",
                label: "First Name",
              },
              {
                key: "lastName",
                type: "string",
                label: "Last Name",
              },
              {
                key: "email",
                type: "string",
                label: "Email",
              },
            ],
            actions: [
              {
                operation: "duplicate",
                mode: "background",
                label: "Duplicate Sheet",
                description: "Duplicate this Sheet and lock down the original.",
              },
            ],
          },
        ],
        actions: [
          {
            operation: "submitActionFg",
            mode: "foreground",
            label: "Submit foreground",
            type: "string",
            description: "Submit data to webhook.site",
            primary: true,
          },
        ],
      });

      await api.jobs.complete(jobId, {
        outcome: {
          message: "This job is now complete.",
        },
      });
    }
  );
}

// You can see the full example used in our getting started guide in ./full-example.js
