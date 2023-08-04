# Headless Automation With Flatfile

This directory provides an example of a completely headless workflow using Flatfile. To see this in action we'll first run a listener, and then run an action via script.

The first simulates your deployed agent. \
The second represents your ingress automation. In this demo, we've named our automation `daily.ts`.

Within this demo you can find examples of:

- Dynamic space creation and configuration
- Automated extraction of data
- Automated mapping of data into a workbook
- Using a record hook to transform data
- Using Secrets to fetch sensitive data for use in your code

## Dependencies

Before trying this demo please ensure you have the following dependencies installed:

- Node.js
- NPM

You'll also need a Flatfile account. Head over to flatfile.com to create one and start developing for free!

And once you have an account, head over to the Developer Settings in your dashboard and add secrets named `email` and `password`.

## Installation

Clone this repository and navigate to the project directory.

Install the required Node.js packages by running the following command:

```bash
npm install
```

## Configuration

To simulate an ingress automation, you'll also need to configure a local environment variable named `FLATFILE_API_KEY`. This is because ingress automations can be anything! Send data to Flatfile via script, cron, our cloud function triggered by an event. Once the data had been uploaded, your Flatfile agent will handle the rest.

```bash
export FLATFILE_API_KEY=your_secret_key
```

To see the entire flow, you should also update the recipient email address for the egress example.

## How It Works

In our scenario, we receive inventory updates from multiple stores every day. We're going to use Flatfile to clean up the incoming data and automate purchase orders based on those reports.

### Listener Configurations

1. Create a Workbook \
   When a new space is created, a `space:created` listener will generate a new Workbook with sheet definitions to structure our incoming data.

2. Automate Extraction and Mapping \
   Flatfile's `xlsx-extractor` and `automap` plugins automatically extract data from the incoming excel file and map it to our sheet fields. \
   For further information on these plugins, please see our [plugins documentation](https://flatfile.com/docs/plugins/overview).

3. Transform and Validate \
   Using Flatfile's `RecordHook` plugin we transform/validate incoming data.

4. Automate Egress \
   Once the mapping job is completed, this script runs an egress job: generating and emailing a purchase order that lives right next to the inventory report we used to determine our purchase.

### Usage

First, run the listener.

```javascript
npx flatfile develop index.ts
```

Then, run the automation script.

```
node daily.ts
```

## Note

This demo is intended as a basic example. Flatfile is a powerful platform that can be configured to your specific use case.
