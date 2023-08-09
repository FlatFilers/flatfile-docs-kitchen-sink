import { recordHook } from "@flatfile/plugin-record-hook";
import axios from "axios";

export default function flatfileEventListener(listener) {
  listener.use(
    recordHook("contacts", (record) => {
      //FlatfileRecord.compute
      record.compute(
        "email",
        (email, record) =>
          `${record.get("firstName")}${record.get("lastName")}@gmail.com`,
        "Email was generated from first and last name."
      );
      //FlatfileRecord.computeIfPresent
      record.computeIfPresent(
        "email",
        (email) => email.toLowerCase(),
        // optional
        "Email was converted to lowercase."
      );
      //FlatfileRecord.validate
      record.validate(
        "lastName",
        (value) => typeof value === "string" && !/\d/.test(value),
        "Last name cannot contain numbers"
      );
      return record;
    })
  );

  //using GET - first add a column for assignedBeer
  listener.use(
    recordHook("contacts", async (record, event) => {
      try {
        const { payload } = event.payload;

        const getResponse = await axios.get(
          "https://api.sampleapis.com/beers/ale"
        );
        record.set(
          "assignedBeer",
          getResponse.data[Math.floor(Math.random() * 20)].name
        );
        record.addInfo(
          "assignedBeer",
          "Got this from " + getResponse.config.url
        );
      } catch (error) {
        record.set("status", "Failed");
        record.addError(
          "status",
          "Couldn't get assigned beer data from the api."
        );
      } finally {
        // Clean up or perform any necessary actions after the try/catch block
      }

      return record;
    })
  );
  //using POST- first add a column for status
  listener.use(
    recordHook("contacts", async (record, event) => {
      try {
        const { payload } = event.payload;

        const webhookReceiver =
          process.env.WEBHOOK_SITE_URL ||
          "https://webhook.site/c83648d4-bf0c-4bb1-acb7-9c170dad4388";

        const postResponse = await axios.post(
          webhookReceiver,
          {
            ...payload,
            method: "axios",
            record,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        record.set("status", "Success");
        record.addComment(
          "status",
          "Record data sent to " + postResponse.config.url
        );
      } catch (error) {
        record.set("status", "Failed");
        record.addError("status", "Couldn't send record to the destination.");
      } finally {
        // Clean up or perform any necessary actions after the try/catch block
      }

      return record;
    })
  );
}
