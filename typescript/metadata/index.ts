import { FlatfileListener } from "@flatfile/listener";
import { FlatfileRecord, recordHook } from "@flatfile/plugin-record-hook";

export default function flatfileEventListener(listener: FlatfileListener) {
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
