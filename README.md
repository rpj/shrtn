# shrtn

A dead simple URL shortener built with Cloudflare Worker & KV Store.

## Deployment

1. Create a new CF project: `npm create cloudflare@latest -- <YOUR_PROJECT_NAME>`
1. Clone this project into that new directory. Don't replace `wrangler.toml`!
1. Create two new KV namespaces named `shrtn-redirects` & `shrtn-redirects-rev`: `npx wrangler kv namespace create <NAMESPACE_NAME>`.
1. Create a third KV namespace for configuration name `shrtn-config`.
1. Copy the three-line `[[kv_namespaces]]` blocks for each of the above into your `wrangler.toml`.
1. Deploy! `npm run deploy`

## Usage

Create with `/+...` where `...` is the URL to shorten.

### Configurables

These may be set in the `shrtn-config` namespace and if they are, their values will override the defaults found at the top of [index.ts](src/index.ts).

* `ID_ALPHABET`: the character alphabet to use for IDs
* `ID_SMALLEST_SIZE`: the minimum length, in characters, of IDs
