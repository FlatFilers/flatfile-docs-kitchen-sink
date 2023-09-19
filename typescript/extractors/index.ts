import api from "@flatfile/api";
import { FlatfileEvent, FlatfileListener } from "@flatfile/listener";

import { DelimiterExtractor } from "@flatfile/plugin-delimiter-extractor";
import { JSONExtractor } from "@flatfile/plugin-json-extractor";
import { ExcelExtractor } from "@flatfile/plugin-xlsx-extractor";
import { XMLExtractor } from "@flatfile/plugin-xml-extractor";
import { ZipExtractor } from "@flatfile/plugin-zip-extractor";

export default function flatfileEventListener(listener: FlatfileListener) {
  //configure space initially
  listener.on(
    "job:ready",
    { job: "space:configure" },
    async (event: FlatfileEvent) => {
      const { spaceId, environmentId, jobId } = event.context;
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

  //add file support
  listener.use(JSONExtractor());
  listener.use(ExcelExtractor());
  listener.use(XMLExtractor());
  listener.use(DelimiterExtractor("txt", { delimiter: "~" }));
  listener.use(ZipExtractor());
}
