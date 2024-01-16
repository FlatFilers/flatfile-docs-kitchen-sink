import api from "@flatfile/api";
import { FlatfileEvent, FlatfileListener } from "@flatfile/listener";
import { FlatfileRecord, recordHook } from "@flatfile/plugin-record-hook";
import { configureSpace } from "@flatfile/plugin-space-configure";

export default function (listener: FlatfileListener) {
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
        space: {
          metadata: {
            theme: {
              root: {
                primaryColor: "black",
              },
              sidebar: {
                logo: "https://images.ctfassets.net/hjneo4qi4goj/33l3kWmPd9vgl1WH3m9Jsq/13861635730a1b8af383a8be8932f1d6/flatfile-black.svg",
              },
            },
          },
        },
        documents: [
          {
            title: "Welcome",
            body: `<div>
          <h1 style="margin-bottom: 36px;">Welcome!</h1>
          <h2 style="margin-top: 0px; margin-bottom: 12px;">To get started, follow these steps:</h2>
          <h2 style="margin-bottom: 0px;">1. Step One</h2>
          <p style="margin-top: 0px; margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          <h2 style="margin-bottom: 0px;">2. Step Two</h2>
          <p style="margin-top: 0px; margin-bottom: 8px;">Consectetur libero id faucibus nisl tincidunt eget. Pellentesque elit eget gravida cum sociis natoque penatibus et. Tempor orci eu lobortis elementum nibh.</p>
          </div>`,
          },
        ],
      },
      async (event, workbookIds, tick) => {
        const { spaceId } = event.context;
        // Callback is invoked once the Space and Workbooks are fully configured.
        // Job progress will be at 50% when the callback is invoked.
        tick(51, "Running callback!");

        // Do something...

        await tick(99, "Callback complete!");
      }
    )
  );

  listener.on(
    "job:ready",
    { job: "workbook:submitActionFg" },
    async (event: FlatfileEvent) => {
      const { workbookId, jobId } = event.context;

      try {
        await api.jobs.ack(jobId, {
          info: "Gettin started.",
          progress: 10,
        });

        //make changes after cells in a Sheet have been updated
        console.log("make changes here when an action is clicked");

        //todo: get the workbook and sheets here
        const sheet2 = "us_sh_8XFdltuj";

        await api.jobs.complete(jobId, {
          outcome: {
            message: "Submit is now complete.",
            next: {
              type: "id",
              id: sheet2,
              label: "Next: Review Sheet 2",
            },
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

  listener.on(
    "commit:created",
    { sheet: "Contacts" },
    async (event: FlatfileEvent) => {
      //make changes after cells in a Sheet have been updated
      console.log("made it here");
    }
  );

  listener.use(
    recordHook("contacts", (record: FlatfileRecord) => {
      const value = record.get("firstName");
      if (typeof value === "string") {
        record.set("firstName", value.toLowerCase());
      }

      const email = record.get("email") as string;
      const validEmailAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!validEmailAddress.test(email)) {
        console.log("Invalid email address");
        record.addError("email", "Invalid email address");
      }

      return record;
    })
  );
}
