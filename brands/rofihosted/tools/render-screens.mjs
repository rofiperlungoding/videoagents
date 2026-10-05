// Renders every frame of brand/showcase/ui-screens.html to a 1:1 PNG (2x for crispness) in brand/exports/screens.
// Run from the repo root:  node brand/tools/render-screens.mjs
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'exports', 'screens');
mkdirSync(out, { recursive: true });
const require = createRequire('C:/Users/Rofi/Documents/Codes/CatCoder/CatCoder/node_modules/');
const { chromium } = require('playwright');

const frames = {
  'f-home': '01-home', 'f-chat': '02-conversation', 'f-live': '03-live-activity', 'f-settings': '04-settings-memory',
  'f-login': '05-login', 'f-invite': '06-invitation', 'f-landing': '07-landing', 'f-status': '08-status',
  'f-m-home': '09-mobile-home', 'f-m-chat': '10-mobile-conversation', 'f-m-side': '11-mobile-drawer',
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(join(here, '..', 'showcase', 'ui-screens.html')).href + '?z=1');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
for (const [id, name] of Object.entries(frames)) {
  await page.locator('#' + id).screenshot({ path: join(out, name + '.png'), animations: 'disabled' });
  console.log('wrote', name);
}
await browser.close();
