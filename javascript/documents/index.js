import api from "@flatfile/api";

export default function flatfileEventListener(listener) {
  listener.on("upload:completed", async ({ context: { fileId } }) => {
    const fileName = (await api.files.get(fileId)).data.name;
    const bodyText = `# Welcome
    ### Say hello to your first customer Space in the new Flatfile!
    Let's begin by first getting acquainted with what you're seeing in your Space initially.
    ---
    Your uploaded file, ${fileName}, is located in the Files area.`;

    const doc = await api.documents.create(documentId, {
      title: "Getting Started",
      body: bodyText,
      actions: [
        {
          label: "Submit",
          operation: "contacts:submit",
          description: "Would you like to submit the contact data?",
          tooltip: "Submit the contact data",
          mode: "foreground",
          primary: true,
          confirm: true,
        },
      ],
    });
  });
}
