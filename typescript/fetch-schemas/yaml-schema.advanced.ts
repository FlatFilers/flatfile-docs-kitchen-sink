import api, { Flatfile } from "@flatfile/api";
import type { FlatfileEvent, FlatfileListener } from "@flatfile/listener";
import {
  PartialWorkbookConfig,
} from "@flatfile/plugin-convert-json-schema";
import type { ModelToSheetConfig } from "@flatfile/util-fetch-schema";
import { configureSpaceWithYamlSchema } from "@flatfile/plugin-convert-yaml-schema";

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
    configureSpaceWithYamlSchema(
      [
        {
          sourceUrl:
            "https://raw.githubusercontent.com/FlatFilers/flatfile-docs-kitchen-sink/main/typescript/fetch-schemas/example-schemas/yaml/person.yml",
          name: "Custom Person Sheet Name",
          actions: sheetActions,
        },
        {
          sourceUrl:
            "https://raw.githubusercontent.com/FlatFilers/flatfile-docs-kitchen-sink/main/typescript/fetch-schemas/example-schemas/yaml/product.yml",
        },
      ] as ModelToSheetConfig[],
      {
        workbookConfig: {
          name: "Custom YAML Schema Workbook Name",
          actions: workbookActions,
        } as PartialWorkbookConfig,
        debug: true,
      },
      callback
    )
  );
}
