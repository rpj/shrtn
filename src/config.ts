const CONFIGURABLES_DEFAULTS: { [key: string]: string | number | boolean } = {
  ID_ALPHABET: '1234567890abcdefghijklmnopqrstuvwxyz',
  ID_SMALLEST_SIZE: 2,
  CODE_CREATE_SUCCESS_MUSTACHE_HTML: `
    <!DOCTYPE html>
      <html>
        <head>
          <title>shrtn /{{ redirect }}</title>
        </head>
      <body>
		    <a href="/{{ redirect }}"><span id="a"></span>/{{ redirect }}</a>
        <script>
          document.addEventListener('DOMContentLoaded', () => 
            (document.getElementById('a').innerText = window.location.origin));
        </script>
      </body>
    </html>
  `
};

export default async function config(env: Env, configName: string) {
  return (await env.shrtn_config.get(configName)) ?? CONFIGURABLES_DEFAULTS[configName];
}