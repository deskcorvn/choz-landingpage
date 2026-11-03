#!/usr/bin/env node
/**
 * Tiny static server for the offline stage (built-in http only, no network needed).
 *
 *   node scripts/serve-demo.mjs                      → http://localhost:4173
 *   node scripts/serve-demo.mjs --port 5000
 *   node scripts/serve-demo.mjs --data <run folder>  → serve events.jsonl / headcount.json / summary.json
 *                                                      from another folder (e.g. a fresh run) instead of the bundle
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'demo', 'offline')

const args = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const port = Number(arg('port', process.env.PORT || 4173))
const host = arg('host', '127.0.0.1')
const dataDir = arg('data', null) ? path.resolve(arg('data')) : null
const DATA_FILES = new Set(['events.jsonl', 'headcount.json', 'summary.json'])

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'application/x-ndjson; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`No bundle in ${root}. Build it first: node scripts/build-demo-offline.mjs`)
  process.exit(1)
}

const server = http.createServer((req, res) => {
  let rel
  try {
    rel = decodeURIComponent(new URL(req.url || '/', 'http://x').pathname)
  } catch {
    res.writeHead(400).end('bad request')
    return
  }
  if (rel.endsWith('/')) rel += 'index.html'
  const name = path.posix.basename(rel)
  const base = dataDir && path.posix.dirname(rel) === '/' && DATA_FILES.has(name) ? dataDir : root
  const file = path.resolve(base, `.${path.posix.normalize(rel)}`)
  if (file !== base && !file.startsWith(base + path.sep)) {
    res.writeHead(403).end('forbidden')
    return
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found')
      return
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': st.size,
      'cache-control': 'no-store',
    })
    if (req.method === 'HEAD') return res.end()
    fs.createReadStream(file).pipe(res)
  })
})

server.listen(port, host, () => {
  const shown = host === '127.0.0.1' || host === '0.0.0.0' ? 'localhost' : host
  console.log(`Trạm Z demo: http://${shown}:${port}/`)
  if (dataDir) console.log(`data files from ${dataDir}`)
  console.log('Ctrl+C to stop')
})
