# shrtn

A dead simple URL shortener built with Cloudflare Worker & KV Store.

## Deployment

1. Create a new CF project: `npm create cloudflare@latest -- <YOUR_PROJECT_NAME>`
1. Clone this project into that new directory.
1. Create three new KV namespaces named `shrtn-config`, `shrtn-redirects` & `shrtn-redirects-rev`: `npx wrangler kv namespace create <NAMESPACE_NAME>`.
    - If using authorization, create a fourth named `shrtn-auth`.
1. Copy the three-line `[[kv_namespaces]]` blocks for each of the above into your `wrangler.toml`.
1. Deploy! `npm run deploy`

## Usage

Upon successful code creation, the returned `Content-type` is: `text/html` for `GET` or `application/json` for `POST`.

`GET` can still receive JSON by setting `Accept` to `application/json`.

### `GET`

`/+...`, where `...` is the URL to shorten.

**With authorization enabled** add the [authorization credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate#basic_authentication) (base64-encoded `user:pass`) as the first path parameter: `/<authorizationCredentials>/+...`.

You can also pass the traditional [`Authorization`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) header instead.

### `POST`

URLs with fragments (`#...`) cannot be created with above method: instead POST to `/add` with the URL to be shortened as the body (plaintext).

The `Authorization` header is ***required* with authorization enabled**.

### Configurables

These may be set in the `shrtn-config` namespace and if they are, their values will override the defaults found at the top of [config.ts](src/config.ts).

* `ID_ALPHABET`: the character alphabet to use for IDs
* `ID_SMALLEST_SIZE`: the minimum length, in characters, of IDs
* `CODE_CREATE_SUCCESS_MUSTACHE_HTML`: [Mustache](https://mustache.github.io/mustache.5.html) template for the HTML shown upon successful code creation & the right `Accept` header.

#### Authorization

Toggle `AUTH_ENABLED` in [index.ts](./src/index.ts) to enable/disable authorization. Doing so requires redeployment.

The `shrtn-auth` KV namespace should have usernames as keys and passwords as values.