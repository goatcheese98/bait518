// @vitest-environment node
import { describe, expect, it } from 'vitest'
import worker from '../../../runtime/worker'
import paths from '../../../runtime/generated/asset-paths.json' with { type: 'json' }

describe('status-aware production response policy', () => {
  it('does not immutable-cache an error even at an exact build-listed fingerprint', async () => {
    const response = await worker.fetch(new Request(`https://example.test${paths[0]}`), {
      ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) },
    })
    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000')
    expect(await response.text()).toBe('Not found\n')
  })
  it('returns an honest recoverable 503 when local asset access fails', async () => {
    const response = await worker.fetch(new Request('https://example.test/', { headers: { Accept: 'text/html' } }), {
      ASSETS: { fetch: async () => { throw new Error('Asset failure') } },
    })
    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toContain('Open wage explorer')
  })
  it('keeps data failures non-HTML and allows revalidated recovery without altering bytes', async () => {
    const request = new Request('https://example.test/data/source.csv')
    const failed = await worker.fetch(request, {
      ASSETS: { fetch: async () => { throw new Error('Asset failure') } },
    })
    expect(failed.status).toBe(503)
    expect(failed.headers.get('Cache-Control')).toBe('no-store')
    expect(await failed.text()).toBe('Temporarily unavailable\n')
    const recovered = await worker.fetch(request, { ASSETS: { fetch: async () => new Response('Year,Value\n2025,0\n') } })
    expect(recovered.status).toBe(200)
    expect(recovered.headers.get('Cache-Control')).toBe('no-cache, max-age=0, must-revalidate')
    expect(await recovered.text()).toBe('Year,Value\n2025,0\n')
  })
})
