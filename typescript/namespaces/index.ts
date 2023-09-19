import api from "@flatfile/api";
import { FlatfileEvent, FlatfileListener } from "@flatfile/listener";

export default function flatfileEventListener(listener: FlatfileListener) {
  listener.namespace(["space:red"], (red: FlatfileListener) => {
    red.on(
      "job:ready",
      { job: "space:configure" },
      async (event: FlatfileEvent) => {
        const { spaceId, environmentId, jobId } = event.context;
        try {
          await api.jobs.ack(jobId, {
            info: "Gettin started.",
            progress: 10,
          });

          //create your workbooks here

          await api.documents.create(spaceId, {
            title: "Getting Started in the Contacts Space",
            body: "# Welcome to your swanky new Red Space\n" + "---\n",
          });

          await api.spaces.update(spaceId, {
            environmentId,
            metadata: {
              theme: {
                root: {
                  primaryColor: "red",
                },
                sidebar: {
                  backgroundColor: "red",
                  textColor: "white",
                  activeTextColor: "midnightblue",
                },
                // See reference for all possible variables
              },
            },
          });

          await api.jobs.complete(jobId, {
            outcome: {
              message: "This job is now complete.",
            },
          });
        } catch (error) {
          console.error("Error:", error.stack);

          await api.jobs.fail(jobId, {
            outcome: {
              message: "This job encountered an error.",
            },
          });
        }
      }
    );
  });
}
