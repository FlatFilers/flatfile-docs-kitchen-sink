import { Client } from "@flatfile/listener";
import { recordHook, FlatfileRecord } from "@flatfile/plugin-record-hook";
export default function flatfileEventListener(listener: Client) {
  listener.use(
    recordHook("contacts", (record: FlatfileRecord) => {
      const firstName = record.get("firstName") as string;

      record.setMetadata({
        firstNameLength: firstName?.length ?? 0,
      });

      return record;
    })
  );
}
