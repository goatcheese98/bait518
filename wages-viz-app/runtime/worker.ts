import assetPaths from './generated/asset-paths.json' with { type: 'json' }

interface Assets { fetch(request: Request): Promise<Response> }
const immutablePaths = new Set<string>(assetPaths)
const geist = assetPaths.find((file) => /\/geist-[\w-]+\.woff2$/.test(file))
const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

function recovery(status: number): string {
  const unavailable = status === 503
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${unavailable ? 'Temporarily unavailable' : 'Page not found'} · Wage explorer</title><style>
@font-face{font-family:Geist;src:url('${geist}') format('woff2');font-display:swap}
:root{color-scheme:light;--bg:#fff;--fg:#18181b;--mut:#66666f;--line:#e4e4e7;--blue:#3b73d9}
@media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0a0a0b;--fg:#ececee;--mut:#92929b;--line:#242428;--blue:#6f9fe0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 Geist,system-ui,sans-serif}main{max-width:640px;margin:15vh auto;padding:24px}p{color:var(--mut)}h1{font-size:30px;line-height:1.2}a{display:inline-block;color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:10px 16px;min-height:44px;text-underline-offset:4px}a:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
</style></head><body><main><p>WAGE EXPLORER · ${status}</p><h1>${unavailable ? 'Temporarily unavailable' : 'Page not found'}</h1><p>${unavailable ? 'The explorer could not load. Try opening it again.' : 'This address does not have a page. Open the explorer to view the original wage observations.'}</p><a href="/">Open wage explorer</a></main></body></html>`
}

export default {
  async fetch(request: Request, env: { ASSETS: Assets }): Promise<Response> {
    const url = new URL(request.url)
    const navigation = request.headers.get('Accept')?.includes('text/html') && !/\.[^/]+$/.test(url.pathname)
    let response: Response
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response = new Response('Method not allowed\n', { status: 405, headers: { Allow: 'GET, HEAD' } })
    } else {
      try {
        // The app is mounted at / with no client router. Unknown paths are real 404s.
        // Disable asset HTML inference and SPA fallback in wrangler.jsonc as well.
        if (url.pathname === '/') url.pathname = '/index.html'
        response = await env.ASSETS.fetch(new Request(url, request))
      } catch {
        response = new Response('Temporarily unavailable\n', { status: 503 })
      }
      if (response.status === 404 || response.status === 503) {
        response = new Response(navigation ? recovery(response.status) : `${response.status === 404 ? 'Not found' : 'Temporarily unavailable'}\n`, {
          status: response.status,
          headers: { 'Content-Type': navigation ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' },
        })
      }
    }
    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value)
    if (url.protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000')
    const successful = response.status === 200 || response.status === 206 || response.status === 304
    headers.set('Cache-Control', !successful ? 'no-store' : immutablePaths.has(url.pathname)
      ? 'public, max-age=31536000, immutable' : 'no-cache, max-age=0, must-revalidate')
    // Static Assets can infer .csv as application/octet-stream; serve the actual format.
    if (successful && url.pathname.startsWith('/data/') && url.pathname.endsWith('.csv')) {
      headers.set('Content-Type', 'text/csv; charset=utf-8')
    }
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status, statusText: response.statusText, headers,
    })
  },
}
