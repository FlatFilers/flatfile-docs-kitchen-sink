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
                actions: [
                  {
                    operation: "duplicate",
                    mode: "background",
                    label: "Duplicate Sheet",
                    type: "string",
                    description:
                      "Duplicate this Sheet and lock down the original.",
                    primary: true,
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
                description: "Submit data to webhook.site",
                primary: true,
              },
            ],
          });

          await api.documents.create(spaceId, {
            title: "About this Theming Demo",
            body: `# Try Theming\n---\nAll Spaces are customizable via theming options enabling you to blend Flatfile seamlessly into your application.\n\nThis Space has been configured to theme new spaces under the given 'theming-demo' namespace with styling appropriate to a customer company.\n\`\`\`jxs\nimport api from "@flatfile/api"\nimport { Client, FlatfileEvent } from "@flatfile/listener"\n\nexport default function flatfileEventListener(listener: Client) {\n  listener.on(\n    "space:created",\n    async ({ context: { spaceId, environmentId } }: FlatfileEvent) => {\n      await api.spaces.update(spaceId, {\n        environmentId,\n        metadata: {\n          theme: {\n            root: {\n              primaryColor: "#74a4a8",\n              fontFamily: "Georgia",\n              buttonBorderRadius: "5px",\n              dangerColor: "#ee7c78",\n              warningColor: "#f7bd1d",\n              successColor: "#74a4a8",\n            },\n            sidebar: {\n              logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRHD-t5vClnQN7-yiojM4GUl0vT1gK7mnOSw&usqp=CAU",\n              textColor: "#ee7c78",\n              titleColor: "#202456",\n              focusBgColor: "#fbfcfb",\n              focusTextColor: "#74a4a8",\n              backgroundColor: "white",\n              footerTextColor: "#202456",\n              borderColor: "#202456",\n            },\n            document: {\n              borderColor: "#ee7c78",\n            },\n            table: {\n              fontFamily: "Georgia",\n              column: {\n                header: {\n                  color: "#ee7c78",\n                  backgroundColor: "#fbfcfb",\n                },\n              },\n              indexColumn: {\n                backgroundColor: "#fbfcfb",\n                color: "#ee7c78",\n                selected: {\n                  backgroundColor: "#fef8e8",\n                },\n              },\n              inputs: {\n                checkbox: {\n                  color: "#f7bd1d",\n                },\n              },\n            },\n          },\n        },\n      });\n    }\n  );\n}\n\`\`\`\`\n\n## Further Documentation\n\nRead more about the possible configurations for theming [here](https://flatfile.com/docs/guides/theming).`,
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

  const blue = "#202456";
  const green = "#74a4a8";
  const warning = "#f7bd1d";
  const danger = "#ee7c78";
  const font = "Georgia";
  const greenBgColor = "#fbfcfb";
  const yellowBgColor = "#fef8e8";

  listener.on(
    "space:created",
    async ({ context: { spaceId, environmentId } }: FlatfileEvent) => {
      await api.spaces.update(spaceId, {
        environmentId,
        metadata: {
          theme: {
            root: {
              primaryColor: green,
              fontFamily: font,
              buttonBorderRadius: "5px",
              dangerColor: danger,
              warningColor: warning,
              successColor: green,
            },
            sidebar: {
              logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRHD-t5vClnQN7-yiojM4GUl0vT1gK7mnOSw&usqp=CAU",
              textColor: danger,
              titleColor: blue,
              focusBgColor: greenBgColor,
              focusTextColor: green,
              backgroundColor: "white",
              footerTextColor: blue,
              borderColor: blue,
            },
            document: {
              borderColor: danger,
            },
            table: {
              fontFamily: font,
              column: {
                header: {
                  color: danger,
                  backgroundColor: greenBgColor,
                },
              },
              indexColumn: {
                backgroundColor: greenBgColor,
                color: danger,
                selected: {
                  backgroundColor: yellowBgColor,
                },
              },
              inputs: {
                checkbox: {
                  color: warning,
                },
              },
            },
          },
        },
      });
    }
  );
}
