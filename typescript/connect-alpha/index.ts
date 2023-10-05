import type { FlatfileListener } from "@flatfile/listener";
import { mergePlugin } from "@flatfile/plugin-connect-via-merge";

export default function flatfileEventListener(listener: FlatfileListener) {
  listener.use(mergePlugin());
}
