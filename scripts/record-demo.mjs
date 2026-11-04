// Record the stage at 1920×1080 to a video file, for reviewers who watch instead of opening the page.
//   node scripts/serve-demo.mjs &   (offline bundle on http://localhost:4173)
//   node scripts/record-demo.mjs [url] [out.webm] [normal|slow|brief|present]
//     normal:  scenes + conclusion cards + both final pages (about 100 s)
//     slow:    the same at ×3 (about 260 s)
//     brief:   the 30-second version (?brief=1 is added to the url) + final pages (about 50 s)
//     present: ?pace=slow — scenes ×1.6 and 8-second cards, for a presenter talking over it (about 148 s)
// Uses the installed Microsoft Edge through Playwright (no browser download).
import { chromium } from '@playwright/test'
import { mkdirSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const mode = process.argv[4] || 'normal'
let url = process.argv[2] || 'http://localhost:4173/?autoplay=1'
if (mode === 'brief' && !/[?&]brief=/.test(url)) url += (url.includes('?') ? '&' : '?') + 'brief=1'
if (mode === 'present' && !/[?&]pace=/.test(url)) url += (url.includes('?') ? '&' : '?') + 'pace=slow'
const out = resolve(process.argv[3] || 'F:/_tmp/tram-z-demo.webm')
const dir = resolve(dirname(out), '_rec')
mkdirSync(dir, { recursive: true })

// day play (45 s) + 7 cards × 5 s = 80 s; final screen 2 pages × 8 s; margin.
// present: play 45 s × 1.6 = 72 s + 7 cards × 8 s = 128 s.
const WAIT = { normal: 80_000 + 16_000 + 4_000, slow: 240_000 + 16_000 + 6_000, brief: 30_000 + 16_000 + 4_000, present: 128_000 + 16_000 + 4_000 }

const browser = await chromium.launch({ channel: 'msedge' })
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir, size: { width: 1920, height: 1080 } },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(url)
if (mode === 'slow') await page.getByTitle('Chậm ×3').click()
await page.waitForTimeout(WAIT[mode] ?? WAIT.normal)
const video = page.video()
await context.close()
await browser.close()
renameSync(await video.path(), out)
console.log(out)
if (errors.length) console.log('console errors:', errors.length, errors.slice(0, 5))
else console.log('console clean')
