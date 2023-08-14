"use strict";

import api from "@flatfile/api";
import { Client, FlatfileEvent, FlatfileListener } from "@flatfile/listener";

export default function flatfileEventListener(listener: Client) {
  listener.filter({ job: "space:configure" }, (configure: FlatfileListener) => {
    configure.on(
      "job:ready",
      async ({ context: { spaceId, environmentId, jobId } }: FlatfileEvent) => {
        try {
          await api.jobs.ack(jobId, {
            info: `Starting Job: ${jobId}`,
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
              },
            ],
            actions: [
              {
                operation: "submitActionFg",
                mode: "foreground",
                label: "Submit",
                type: "string",
                description: "Submit Data",
                primary: true,
              },
            ],
          });

          await api.documents.create(spaceId, {
            title: "About this Dynamic Demo",
            body: `# Try Dynamic Configuration\n---\n\n This Space has been dynamically configured.\n\nThe automatic configuration was triggered by passing an **autoConfigure: true** parameter on Space Creation. This triggers the publication of a **space:configure** event that your Listener can receive and act upon.\n\nThis Space was dynamically created with the following code.\n\n\`\`\`jsx\nimport api from "@flatfile/api";\nimport { Client, FlatfileEvent, FlatfileListener } from "@flatfile/listener";\n\nexport default function flatfileEventListener(listener: Client) {\n  listener.filter({ job: "space:configure" }, (configure: FlatfileListener) => {\n    configure.on(\n      "job:ready",\n      async ({ context: { spaceId, environmentId, jobId } }: FlatfileEvent) => {\n        try {\n          await api.jobs.ack(jobId, {\n            info: "Starting Job.",\n            progress: 10,\n          });\n\n          await api.workbooks.create({\n            spaceId,\n            environmentId,\n            name: "All Data",\n            labels: ["pinned"],\n            sheets: [\n              {\n                name: "Contacts",\n                slug: "contacts",\n                fields: [\n                  {\n                    key: "firstName",\n                    type: "string",\n                    label: "First Name",\n                  },\n                  {\n                    key: "lastName",\n                    type: "string",\n                    label: "Last Name",\n                  },\n                  {\n                    key: "email",\n                    type: "string",\n                    label: "Email",\n                  },\n                ],\n              },\n            ],\n            actions: [\n              {\n                operation: "submitActionFg",\n                mode: "foreground",\n                label: "Submit",\n                type: "string",\n                description: "Submit Data",\n                primary: true,\n              },\n            ],\n          });\n\n          await api.jobs.complete(jobId, {\n            outcome: {\n              message: "Job completed.",\n            },\n          });\n        } catch (error) {\n          console.error("Error: ", error.stack);\n\n          await api.jobs.fail(jobId, {\n            outcome: {\n              message: "Job encountered an error.",\n            },\n          });\n        }\n      }\n    );\n  });\n\n  listener.filter(\n    { job: "workbook:submitActionFg" },\n    (configure: FlatfileListener) => {\n      configure.on(\n        "job:ready",\n        async ({ context: { jobId } }: FlatfileEvent) => {\n          console.log("My job is running", jobId);\n          try {\n            await api.jobs.ack(jobId, {\n              info: "Starting Job.",\n              progress: 10,\n            });\n\n            // Custom Code Here\n\n            await api.jobs.complete(jobId, {\n              outcome: {\n                message: "Job completed.",\n              },\n            });\n          } catch (error) {\n            console.error("Error:", error.stack);\n\n            await api.jobs.fail(jobId, {\n              outcome: {\n                message: "Job encountered an error.",\n              },\n            });\n          }\n        }\n      );\n    }\n  );\n}\n\`\`\`\`\n\n## Further Documentation\n\nRead more about dynamic configuration [here](https://flatfile.com/docs/guides/dynamic-configurations).`,
          });

          await api.jobs.complete(jobId, {
            outcome: {
              message: `Job ${jobId} completed.`,
            },
          });
        } catch (error: any) {
          console.error("Error: ", error.stack);

          await api.jobs.fail(jobId, {
            outcome: {
              message: `Job ${jobId} encountered an error.`,
            },
          });
        }
      }
    );
  });

  listener.filter(
    { job: "workbook:submitActionFg" },
    (configure: FlatfileListener) => {
      configure.on(
        "job:ready",
        async ({ context: { jobId } }: FlatfileEvent) => {
          console.log("My job is running", jobId);
          try {
            await api.jobs.ack(jobId, {
              info: `Starting Job: ${jobId}`,
              progress: 10,
            });

            // Custom Code Here

            await api.jobs.complete(jobId, {
              outcome: {
                message: `Job ${jobId} completed.`,
              },
            });
          } catch (error: any) {
            console.error("Error:", error.stack);

            await api.jobs.fail(jobId, {
              outcome: {
                message: `Job ${jobId} encountered an error.`,
              },
            });
          }
        }
      );
    }
  );
}
