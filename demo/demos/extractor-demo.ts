"use strict";

import api from "@flatfile/api";
import { Client, FlatfileEvent, FlatfileListener } from "@flatfile/listener";

import { DelimiterExtractor } from "@flatfile/plugin-delimiter-extractor";
import { JSONExtractor } from "@flatfile/plugin-json-extractor";
import { ExcelExtractor } from "@flatfile/plugin-xlsx-extractor";
import { XMLExtractor } from "@flatfile/plugin-xml-extractor";
import { ZipExtractor } from "@flatfile/plugin-zip-extractor";

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
                label: "Submit foreground",
                type: "string",
                description: "Submit data to webhook.site",
                primary: true,
              },
            ],
          });

          await api.documents.create(spaceId, {
            title: "About this Extractor Demo",
            body: `# Try Auto-Extraction\n---\nAny file uploaded to Flatfile needs to be extracted from it's original format.\n\nFlatfile's Extractor Plugins make this easy. Whether your incoming data is \`.json\`, \`.xlsx\`, \`.zip\` or any of a multitude of others, simply configure your Listener to use one or more extractor plugins and extraction will be handled automatically upon file upload.\n\nThis Space has been configured to use several extractor plugins.\n\n\`\`\`jsx\nimport { Client, FlatfileListener } from "@flatfile/listener"\n\nimport { DelimiterExtractor } from "@flatfile/plugin-delimiter-extractor";\nimport { JSONExtractor } from "@flatfile/plugin-json-extractor"\nimport { ExcelExtractor } from "@flatfile/plugin-xlsx-extractor"\nimport { XMLExtractor } from "@flatfile/plugin-xml-extractor"\nimport { ZipExtractor } from "@flatfile/plugin-zip-extractor"\n\nexport default function flatfileEventListener(listener: Client) {\n  listener.use(JSONExtractor())\n  listener.use(ExcelExtractor())\n  listener.use(XMLExtractor())\n  listener.use(DelimiterExtractor("txt", { delimiter: "~" }))\n  listener.use(ZipExtractor())\n}\n\`\`\`\`\n\nTo see them work, simply upload a supported file.\n\nThey appropriate plugin will extract data automatically. Once extraction is complete, you can import and map your data into your workbook and it's ready for use.\n\n## Further Documentation\n\nRead more about the possible configurations for each plugin [here](https://flatfile.com/docs/plugins/extractors/).`,
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

  listener.use(JSONExtractor());
  listener.use(ExcelExtractor());
  listener.use(XMLExtractor());
  listener.use(DelimiterExtractor("txt", { delimiter: "~" }));
  listener.use(ZipExtractor());
}
