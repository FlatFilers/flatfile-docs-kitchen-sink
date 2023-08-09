export default function flatfileEventListener(listener) {
  listener.use(
    recordHook("contacts", (record) => {
      const firstName = record.get("firstName");

      record.setMetadata({
        firstNameLength: firstName?.length ?? 0,
      });

      return record;
    })
  );
}
