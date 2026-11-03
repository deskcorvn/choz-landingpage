#!/usr/bin/env node
/**
 * Bundle the /demo stage into public/demo/offline/ as a static site that needs no Next, no database and no
 * network: index.html + stage.js + stage.css + Geist fonts + copies of events.jsonl, headcount.json, summary.json.
 *
 *   node scripts/build-demo-offline.mjs     (pnpm demo:offline)
 *   node scripts/serve-demo.mjs             (pnpm demo:serve → http://localhost:4173)
 */
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'demo', 'offline')
const requireHere = createRequire(path.join(root, 'package.json'))

/** esbuild is not a direct dependency: it comes with tsx (pnpm does not hoist it), so resolve it through tsx. */
async function loadEsbuild() {
  try {
    return await import('esbuild')
  } catch {
    const viaTsx = createRequire(requireHere.resolve('tsx'))
    return viaTsx('esbuild')
  }
}

const DATA = ['events.jsonl', 'headcount.json', 'summary.json']
const FONTS = [
  ['node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2', 'Geist-Variable.woff2'],
  ['node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2', 'GeistMono-Variable.woff2'],
]

const INDEX = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Một ngày của Trạm Z · Chợ Z</title>
<link rel="icon" href="logo.svg" type="image/svg+xml">
<style>
@font-face { font-family: 'Geist'; src: url(fonts/Geist-Variable.woff2) format('woff2'); font-weight: 100 900; font-display: block; }
@font-face { font-family: 'Geist Mono'; src: url(fonts/GeistMono-Variable.woff2) format('woff2'); font-weight: 100 900; font-display: block; }
:root { --font-geist-sans: 'Geist'; --font-geist-mono: 'Geist Mono'; }
html, body { margin: 0; background: #12070a; }
</style>
<link rel="stylesheet" href="stage.css">
</head>
<body>
<div id="root"></div>
<script src="stage.js"></script>
</body>
</html>
`

async function main() {
  const esbuild = await loadEsbuild()
  await fs.rm(out, { recursive: true, force: true })
  await fs.mkdir(path.join(out, 'fonts'), { recursive: true })

  const result = await esbuild.build({
    absWorkingDir: root,
    entryPoints: [path.join(root, 'src/components/tram-z-stage/offline-entry.tsx')],
    outfile: path.join(out, 'stage.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020', 'chrome100', 'edge100', 'firefox100', 'safari15'],
    jsx: 'automatic',
    minify: true,
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'warning',
    metafile: true,
  })

  for (const f of DATA) await fs.copyFile(path.join(root, 'public', 'demo', f), path.join(out, f))
  await fs.copyFile(path.join(root, 'public/images/miniapp/logo.svg'), path.join(out, 'logo.svg'))
  for (const [from, to] of FONTS) await fs.copyFile(path.join(root, from), path.join(out, 'fonts', to))
  await fs.writeFile(path.join(out, 'index.html'), INDEX, 'utf8')

  const files = Object.entries(result.metafile.outputs).map(
    ([f, o]) => `${path.relative(root, path.resolve(root, f))} ${(o.bytes / 1024).toFixed(0)} KB`,
  )
  console.log(`demo offline bundle → ${path.relative(root, out)}\n  ${files.join('\n  ')}\n  + ${DATA.join(', ')}, logo.svg, fonts/`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
