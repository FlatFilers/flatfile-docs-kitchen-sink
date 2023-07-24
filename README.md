# flatfile-docs-kitchen-sink

This repo includes all of the examples from the [Flatfile docs](https://flatfile.com/docs/).

## Setup Local Environment Variables

Rename `.env.example` to `.env` and update to your creds. This file should look like:

- FLATFILE_ENVIRONMENT_ID=us_env_1234
- FLATFILE_API_KEY=sk_1234
- WEBHOOK_SITE_URL=https://webhook.site/1234

## Developing

If using javascript, run `npx flatfile develop javascript/<path-to-file>.js` to start a local listener.

If using typescript, run `npx flatfile develop typescript/<path-to-file>.ts` to start a local listener.

## Deploying

Use `npx flatfile deploy <file name>` to deploy your listener to Flatfile.

## See all code examples

To see all of the code examples from the docs, head to the [flatfile-docs-kitchen-sink](https://github.com/FlatFilers/flatfile-docs-kitchen-sink) repo.
