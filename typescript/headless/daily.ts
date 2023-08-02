const { FlatfileClient } = require("@flatfile/api");
const fs = require("fs");
const path = require("path");

// Outside of our deployed listeners, we'll need to configure the api with our key
const api = new FlatfileClient({ token: process.env.FLATFILE_API_KEY });

const dataFilePath = path.join(__dirname, "./inventory.xlsx");
const readStream = fs.createReadStream(dataFilePath);

async function daily() {
  try {
    // To make it easier to find, we'll include the date in our space name
    const date = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const name = `${date} Inventory`;

    // Create a space
    const space = await api.spaces.create({ name });
    const { id: spaceId, environmentId } = space.data;

    // Upload a file to the space
    await api.files.upload(readStream, { spaceId, environmentId });
  } catch (error) {
    console.error(error);
  }
}

daily();
