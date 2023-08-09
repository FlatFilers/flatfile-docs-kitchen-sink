import api from "@flatfile/api";
import { FlatfileListener, FlatfileEvent, Client } from "@flatfile/listener";

export default function flatfileEventListener(listener: Client) {
  listener.filter({ job: "sheet:duplicate" }, (configure: FlatfileListener) => {
    configure.on("job:ready", async ({ context: { jobId } }: FlatfileEvent) => {
      try {
        await api.jobs.ack(jobId, {
          info: "Getting started.",
          progress: 10,
        });

        // Do your work here

        await api.jobs.complete(jobId, {
          info: "This job is now complete.",
        });
      } catch (error) {
        console.error("Error:", error.stack);

        await api.jobs.fail(jobId, {
          info: "This job did not work.",
        });
      }
    });
  });
}
