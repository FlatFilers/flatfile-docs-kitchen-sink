import api from "@flatfile/api";

export default function flatfileEventListener(listener) {
  //configure space initially
  listener.on(
    "job:ready",
    { job: "space:configure" },
    async ({ context: { spaceId, environmentId, jobId } }) => {
      try {
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
                  description:
                    "Duplicate this Sheet and lock down the original.",
                  requireSelection: false,
                  requireAllValid: true,
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
            message: "Your Space was created.",
          },
        });
      } catch (error) {
        console.error("Error:", error.stack);

        await api.jobs.fail(jobId, {
          outcome: {
            message: "Creating a Space encountered an error. See Event Logs.",
          },
        });
      }
    }
  );

  //update space after created
  //you can also do this during configuration
  listener.on(
    "space:created",
    async ({ context: { spaceId, environmentId } }) => {
      //const updateSpace = await flatfile.spaces.update(spaceId, {});

      const updateSpace = await api.spaces.update(spaceId, {
        environmentId,
        metadata: {
          theme: {
            root: {
              primaryColor: "red",
            },
            sidebar: {
              logo: "https://image.png",
            },
            // See reference for all possible variables
          },
        },
      });
    }
  );
}
