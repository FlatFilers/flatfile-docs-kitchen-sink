import api from "@flatfile/api";
import { FlatfileEvent, FlatfileListener } from "@flatfile/listener";

export default function flatfileEventListener(listener: FlatfileListener) {
  listener.on(
    "job:ready",
    { job: "sheet:duplicate" },
    async (event: FlatfileEvent) => {
      const {
        context: { jobId },
      } = event;
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
    }
  );
}
