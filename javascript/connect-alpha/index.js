import { mergePlugin } from "@flatfile/plugin-connect-via-merge";

export default function flatfileEventListener(listener) {
  listener.use(mergePlugin());
}
