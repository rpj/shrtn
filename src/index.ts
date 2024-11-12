import { customAlphabet } from 'nanoid';
import { AutoRouter, html } from 'itty-router';
import { Request } from '@cloudflare/workers-types';

const CREATE_PATH_PRE = '/+';
const CONFIGURABLES_DEFAULTS: { [key: string]: string | number } = {
  ID_ALPHABET: '1234567890abcdefghijklmnopqrstuvwxyz',
  ID_SMALLEST_SIZE: 2,
};

async function configurable(env: Env, configName: string) {
  return (await env.shrtn_config.get(configName)) ?? CONFIGURABLES_DEFAULTS[configName];
}

async function createRedirectForThisUrl(createForUrl: string, request: Request, env: Env) {
  const getConfig = configurable.bind(null, env);

  try {
    // may be better libraries for this, but :shrug:...
    new URL(createForUrl);
  } catch {
    return new Response(`"${createForUrl}" is not a valid URL!`, { status: 500 });
  }

  let redirect = await env.shrtn_redirects_rev.get(createForUrl);
  if (!redirect) {
    let curSize: number = await getConfig('ID_SMALLEST_SIZE') as number;
    while (!redirect) {
      const newTry = customAlphabet(await getConfig('ID_ALPHABET') as string, curSize++)();
      if (!(await env.shrtn_redirects.get(newTry))) {
        redirect = newTry;
      }
    }
  }

  console.log(`Created new short code '${redirect}' for URL ${createForUrl}`);
  await env.shrtn_redirects.put(redirect, createForUrl);
  await env.shrtn_redirects_rev.put(createForUrl, redirect);

  if (request.headers.get('accept')?.trim().indexOf('application/json') === 0) {
    return { redirect };
  }

  return html(`<!DOCTYPE html><html><head><title>shrtn /${redirect}</title></head><body>
		<a href="/${redirect}"><span id="a"></span>/${redirect}</a><script>
		document.addEventListener('DOMContentLoaded', () => 
			(document.getElementById('a').innerText = window.location.origin));
		</script></body></html>`);
}

async function shortCode(request: Request, env: Env) {
  const redirect = await env.shrtn_redirects.get(request.params.code);

  if (redirect) {
    return Response.redirect(redirect);
  }

  return new Response(request.params.code, { status: 404 });
}

const router = AutoRouter();

router
  .get("/:code", shortCode)
  .post("/add", async (request: Request, env: Env) => createRedirectForThisUrl(
    Buffer((await request.body?.getReader().read())?.value)?.toString('utf8'),
    request, env
  ))
  .get(CREATE_PATH_PRE + "*", async (request: Request, env: Env) => {
    const slicePoint = request.url.indexOf(CREATE_PATH_PRE);
    if (slicePoint === -1) {
      return new Response(request.url, { status: 404 });
    }
    return createRedirectForThisUrl(request.url.slice(slicePoint + CREATE_PATH_PRE.length), request, env);
  });

export default router;
