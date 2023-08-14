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

          await api.documents.create(spaceId, {
            title: "About this Documents Demo",
            body: `# About this Documents Demo\n---\nDocuments are ways of storing information right inside your Space. Provide guidance or reference for your customers without leaving Flatfile.\n\nThis Space has been configured with multiple documents upon creation.\n\`\`\`jsx\nimport api from "@flatfile/api"\nimport { Client, FlatfileEvent, FlatfileListener } from "@flatfile/listener"\n\nexport default function flatfileEventListener(listener: Client) {\n  listener.filter({ job: "space:configure" }, (configure: FlatfileListener) => {\n    configure.on(\n      "job:ready",\n      async ({ context: { spaceId, environmentId, jobId } }: FlatfileEvent) => {\n        try {\n          await api.jobs.ack(jobId, {\n            info: "Starting Job.",\n            progress: 10,\n          });\n\n          await api.documents.create(spaceId, {\n            title: "About this Documents Demo",\n            body: "Document text here.",\n          });\n\n          await api.documents.create(spaceId, {\n            title: "Configure multiple Documents",\n            body: "Document text here.",\n          });\n\n          await api.jobs.complete(jobId, {\n            outcome: {\n              message: "Job completed.",\n            },\n          });\n        } catch (error) {\n          console.error("Error: ", error.stack);\n\n          await api.jobs.fail(jobId, {\n            outcome: {\n              message: "Job encountered an error.",\n            },\n          });\n        }\n      }\n    );\n  });\n}\n\`\`\`\`\n`,
          });

          await api.documents.create(spaceId, {
            title: "Configure multiple Documents",
            body: `# Configure multiple Document\n---\nAs this example demonstrates, you many create as many Documents are you need.\n## Further Documentation\n\nRead more about Documents [here](https://flatfile.com/docs/guides/documents).`,
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
}
