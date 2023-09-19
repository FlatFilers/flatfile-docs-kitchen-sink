import api from "@flatfile/api";
import { responseRejectionHandler } from "@flatfile/util-response-rejection";
import axios from "axios";

export default function flatfileEventListener(listener) {
  listener.on(
    "job:ready",
    { job: "workbook:submitActionFg" },
    async ({ context: { jobId, workbookId }, payload }) => {
      const { data: workbook } = await api.workbooks.get(workbookId);
      const { data: workbookSheets } = await api.sheets.list({ workbookId });

      const sheets = [];
      for (const [_, element] of workbookSheets.entries()) {
        const { data: records } = await api.records.get(element.id);
        sheets.push({
          ...element,
          ...records,
        });
      }

      try {
        await api.jobs.ack(jobId, {
          info: "Starting job to submit action to webhook.site",
          progress: 10,
        });

        console.log(JSON.stringify(sheets, null, 2));

        const webhookReceiver =
          process.env.WEBHOOK_SITE_URL ||
          "https://webhook.site/c83648d4-bf0c-4bb1-acb7-9c170dad4388"; //update this

        const response = await axios.post(
          webhookReceiver,
          {
            ...payload,
            method: "axios",
            workbook: {
              ...workbook,
              sheets,
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          const rejections = response.data.rejections;
          if (rejections) {
            const totalRejectedRecords = await responseRejectionHandler(
              rejections
            );
            return await api.jobs.complete(jobId, {
              outcome: {
                next: {
                  type: "id",
                  id: rejections.id,
                  label: "See rejections...",
                },
                message: `Data was submission was partially successful. ${totalRejectedRecords} record(s) were rejected.`,
              },
            });
          }
          return await api.jobs.complete(jobId, {
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
    }
  );
}
