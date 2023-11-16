import { FlatfileListener } from "@flatfile/listener";
import { configureSpaceWithJsonSchema } from "@flatfile/plugin-convert-yaml-schema";

export default function (listener: FlatfileListener) {
  listener.use(
    configureSpaceWithYamlSchema([{ sourceUrl: "http://localhost:3000/yaml" }])
  );
}
