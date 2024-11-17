import { customAlphabet } from 'nanoid';
import { AutoRouter, html } from 'itty-router';
import { Request } from '@cloudflare/workers-types';
import config from './config';
import mustache from 'mustache';

const AUTH_ENABLED = true;
const CREATE_PATH_PRE = '/+';

async function createRedirectForThisUrl(createForUrl: string, request: Request, env: Env) {
  const getConfig = config.bind(null, env);

  try {
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

    console.log(`Created new short code '${redirect}' for URL ${createForUrl}`);
    await Promise.all([
      env.shrtn_redirects.put(redirect, createForUrl),
      env.shrtn_redirects_rev.put(createForUrl, redirect)
    ]);
  }

  if (request.method === 'POST' || request.headers.get('accept')?.trim().indexOf('application/json') === 0) {
    return { redirect };
  }

  return html(mustache.render(await getConfig('CODE_CREATE_SUCCESS_MUSTACHE_HTML') as string, { redirect }));
}

async function shortCode(request: Request, env: Env) {
  const redirect = await env.shrtn_redirects.get(request.params.code);

  if (redirect) {
    return Response.redirect(redirect);
  }

  return new Response(request.params.code, { status: 404 });
}

async function checkAuth(request: Request, env: Env) {
  let auth = request.headers.get('Authorization');

  if (!auth) {
    const urlPath = (new URL(request.url)).pathname.slice(1);
    const firstSlashIndex = urlPath.indexOf('/');

    if (firstSlashIndex !== -1 && urlPath[firstSlashIndex + 1] === CREATE_PATH_PRE[1]) {
      auth = `Basic ${urlPath.slice(0, firstSlashIndex)}`;
    }
  }

  if (!auth || auth.indexOf('Basic ') !== 0) {
    return new Response(null, { status: 401, headers: { 'WWW-Authenticate': 'Basic' } });
  }

  const authToken = auth.replace('Basic ', '');
  const authStr = Buffer.from(authToken, 'base64').toString();
  const [user, passphrase] = authStr.split(':');

  if (!user?.length || !passphrase?.length || passphrase !== (await env.shrtn_auth.get(user))) {
    console.error(`Bad user "${user}", passphrase "${passphrase}"`, request.url, request.headers);
    return new Response(null, { status: 403 });
  }
}

const router = AutoRouter().get("/:code", shortCode);

if (AUTH_ENABLED) {
  console.log('Authorization enabled');
  router.all("*", checkAuth);
}

router
  .post("/add", async (request: Request, env: Env) => createRedirectForThisUrl(
    Buffer((await request.body?.getReader().read())?.value)?.toString('utf8'),
    request, env
  ))
  .get(`${CREATE_PATH_PRE}*`, async (request: Request, env: Env) => {
    const slicePoint = request.url.indexOf(CREATE_PATH_PRE);

    if (slicePoint === -1) {
      return new Response(request.url, { status: 404 });
    }

    return createRedirectForThisUrl(request.url.slice(slicePoint + CREATE_PATH_PRE.length), request, env);
  });

export default router;