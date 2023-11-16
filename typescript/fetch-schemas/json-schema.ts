import { FlatfileListener } from "@flatfile/listener";
import { configureSpaceWithJsonSchema } from "@flatfile/plugin-convert-json-schema";

export default function (listener: FlatfileListener) {
  listener.use(
    configureSpaceWithJsonSchema([
      { sourceUrl: "https://json-schema.org/draft/2020-12/schema" },
    ])
  );
}
