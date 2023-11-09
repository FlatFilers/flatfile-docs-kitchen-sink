import api from "@flatfile/api";
import { configureSpace } from "@flatfile/plugin-space-configure";

export default function (listener) {
  listener.use(
    configureSpace(
      {
        workbooks: [
          {
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
                    operation: "sendToPeople",
                    mode: "background",
                    label: "Send to selected People",
                    description: "Send this data to those selected.",
                    requireSelection: true,
                    requireAllValid: false,
                  },
                ],
              },
              {
                name: "Sheet 2",
                slug: "sheet2",
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
                label: "Submit foreground",
                description: "Submit data to webhook.site",
                primary: true,
                constraints: [
                  { type: "hasAllValid" },
                  { type: "hasSelection" },
                ],
              },
            ],
            settings: {
              trackChanges: true,
            },
          },
        ],
      },
      async (event, workbookIds, tick) => {
        const { spaceId } = event.context;
        await api.documents.create(spaceId, {
          title: "Getting Started",
          body:
            "# Welcome\n" +
            "### Say hello to your first customer Space in the new Flatfile!\n" +
            "Let's begin by first getting acquainted with what you're seeing in your Space initially.\n" +
            "---\n",
        });
        await tick(80, "Document created");
      }
    )
  );

  listener.on(
    "job:ready",
    { job: "workbook:submitActionFg" },
    async ({ context: { jobId } }) => {
      try {
        await api.jobs.ack(jobId, {
          info: "Gettin started.",
          progress: 10,
        });

        //make changes after cells in a Sheet have been updated
        console.log("make changes here when an action is clicked");

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

  listener.on("commit:created", { sheet: "Contacts" }, async (event) => {
    //make changes after cells in a Sheet have been updated
    console.log("made it here");
  });
}
