import api from "@flatfile/api";
import { FlatfileListener } from "@flatfile/listener";

export default function flatfileEventListener(listener: FlatfileListener) {
  //configure space initially
  listener.on(
    "job:ready",
    { job: "space:configure" },
    async ({ context: { spaceId, environmentId, jobId } }) => {
      try {
        await api.jobs.ack(jobId, {
          info: "Getting started.",
          progress: 10,
        });
        //setting the translation path for the space
        await api.spaces.update(spaceId, {
          environmentId,
          translationsPath:
            "https://raw.githubusercontent.com/FlatFilers/Platform-Translations/kitchen-sink/locales/en/translation.json",
        });
        //documents are using translation keys instead of hardcoding strings
        const document = await api.documents.create(spaceId, {
          title: "myDocument.title",
          body: "myDocument.body",
        });
        await api.spaces.update(spaceId, {
          metadata: {
            sidebarConfig: { defaultPage: { documentId: document.data.id } },
          },
        });
        await api.workbooks.create({
          spaceId,
          environmentId,
          name: "All Data",
          labels: ["pinned"],
          sheets: [
            {
              name: "Floofballs",
              slug: "petslug",
              fields: [
                {
                  key: "id",
                  type: "number",
                  label: "Id or microchip number",
                  description: "The pups Id or microchip number",
                  constraints: [
                    {
                      type: "required",
                    },
                    {
                      type: "unique",
                    },
                  ],
                },
                {
                  key: "full_name",
                  type: "string",
                  label: "Name",
                  description: "The pups full name",
                  constraints: [
                    {
                      type: "required",
                    },
                  ],
                },
                {
                  key: "DOB",
                  type: "date",
                  label: "Date of Birth",
                  description: "The pup's birth date",
                },
                {
                  key: "is_good",
                  type: "boolean",
                  label: "Is good?",
                  description: "Whether the pup is a good puppy",
                },
                {
                  key: "breed",
                  type: "enum",
                  label: "breed",
                  description: "The species of pup",
                  config: {
                    options: [
                      { value: "golden", label: "golden retriever" },
                      { value: "mutt", label: "mutt" },
                      { value: "collie", label: "border collie" },
                      { value: "pug", label: "pug" },
                      { value: "other", label: "other" },
                    ],
                  },
                },
              ],
            },
          ],
          //actions are using translation keys instead of hardcoding strings
          actions: [
            {
              operation: "job:submit",
              mode: "foreground",
              label: "mySubmitAction.label",
              type: "string",
              description: "mySubmitAction.description",
              primary: true,
              tooltip: "mySubmitAction.tooltip",
            },
          ],
        });

        await api.jobs.complete(jobId, {});
      } catch (error) {
        console.error("Error:", error.stack);

        await api.jobs.fail(jobId, {
          outcome: {
            message: ":(",
          },
        });
      }
    }
  );
  listener.on(
    "job:ready",
    { job: "job:submit" },
    async ({ context: { jobId } }) => {
      await api.jobs.complete(jobId, {
        outcome: {
          heading: "mySubmitAction.outcome.heading",
          message: "mySubmitAction.outcome.message",
          next: {
            type: "url",
            url: "https://google.com",
            label: "mySubmitAction.outcome.label",
          },
        },
      });
    }
  );
}
