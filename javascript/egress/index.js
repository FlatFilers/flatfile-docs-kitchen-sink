import api from "@flatfile/api";
import axios from "axios";

export default function flatfileEventListener(listener) {
  //workbook-level action
  listener.on(
    "job:ready",
    { job: "workbook:submitActionFg" },
    async (event) => {
      const { jobId, workbookId } = event.context;
      const payload = event.payload;
      const { data: sheets } = await api.sheets.list({ workbookId });

      const records = {};
      for (const [index, element] of sheets.entries()) {
        records[`Sheet[${index}]`] = await api.records.get(element.id);
      }

      try {
        await api.jobs.ack(jobId, {
          info: "Starting job to submit action to webhook.site",
          progress: 10,
        });

        console.log(JSON.stringify(records, null, 2));

        const webhookReceiver = await event.secrets("WEBHOOK_SITE_URL"); // TODO: set a Flatfile Secret on your account to point to your webhook

        const response = await axios.post(
          webhookReceiver,
          {
            ...payload,
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
    }
  );
}
