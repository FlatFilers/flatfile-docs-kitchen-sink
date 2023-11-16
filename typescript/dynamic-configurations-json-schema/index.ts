import { Flatfile } from "@flatfile/api";
import type { FlatfileEvent, FlatfileListener } from "@flatfile/listener";
import {
  ModelToSheetConfig,
  PartialWorkbookConfig,
  configureSpaceWithJsonSchema,
} from "@flatfile/plugin-convert-json-schema";

export default function (listener: FlatfileListener) {
  const workbookActions: Flatfile.Action[] = [
    {
      operation: "submitActionFg",
      mode: "foreground",
      label: "Submit data",
      type: "string",
      description: "Submit this data to a webhook.",
      primary: true,
    },
  ];

  const sheetActions: Flatfile.Action[] = [
    {
      operation: "duplicateSheet",
      mode: "foreground",
      label: "Duplicate",
      description: "Duplicate this sheet.",
      primary: true,
    },
  ];

  const callback = async (
    event: FlatfileEvent,
    workbookIds: string[],
    tick: (progress?: number, message?: string) => Promise<Flatfile.JobResponse>
  ) => {
    const { spaceId } = event.context;
    await api.documents.create(spaceId, {
      title: "Welcome",
      body: `<div>
        <h1>Welcome!</h1>
        <h2>To get started, follow these steps:</h2>
        <h2>1. Step One</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        <h3>Remember, if you need any assistance, you can always refer back to this page by clicking "Welcome" in the left-hand sidebar!</h3>
        </div>`,
    });
    await tick(80, "Document created");
  };

  listener.use(
    configureSpaceWithJsonSchema(
      [
        {
          sourceUrl: "http://example.com/schema/customer",
          name: "Custom Customer Sheet Name",
        },
        {
          sourceUrl: "http://example.com/schema/person",
          actions: sheetActions,
        },
        { sourceUrl: "http://example.com/schema/product" },
      ] as ModelToSheetConfig[],
      {
        workbookConfig: {
          name: "Custom JSON Schema Workbook Name",
          actions: workbookActions,
        } as PartialWorkbookConfig,
        debug: true,
      },
      callback
    )
  );
}
