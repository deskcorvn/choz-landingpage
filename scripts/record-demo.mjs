// Record the stage at 1920×1080 to a video file, for reviewers who watch instead of opening the page.
//   node scripts/serve-demo.mjs &   (offline bundle on http://localhost:4173)
//   node scripts/record-demo.mjs [url] [out.webm] [slow]   (slow: press ×3 first, the day takes 90 s)
// Uses the installed Microsoft Edge through Playwright (no browser download).
import { chromium } from '@playwright/test'
import { mkdirSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const url = process.argv[2] || 'http://localhost:4173/?autoplay=1'
const out = resolve(process.argv[3] || 'F:/_tmp/tram-z-demo.webm')
const slow = process.argv[4] === 'slow'
const dir = resolve(dirname(out), '_rec')
mkdirSync(dir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge' })
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir, size: { width: 1920, height: 1080 } },
})
const page = await context.newPage()
await page.goto(url)
if (slow) await page.getByTitle('Chậm ×3').click()
await page.waitForTimeout(slow ? 101_000 : 41_000) // day (30 s, or 90 s slowed) + 8 s final table + margin
const video = page.video()
await context.close()
await browser.close()
renameSync(await video.path(), out)
console.log(out)
