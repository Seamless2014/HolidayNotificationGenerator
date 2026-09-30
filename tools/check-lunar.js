const { chromium } = require('C:/Users/38335/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/38335/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
    headless: true, args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  // 直接加载农历库（本地文件 via http server vendor 路径）
  await page.goto('http://127.0.0.1:8899/vendor/lunar.js', { waitUntil: 'load' }).catch(()=>{});
  // 用 about:blank + addScriptTag 更干净
  await page.goto('about:blank');
  await page.addScriptTag({ path: 'E:/.workbuddy/2026-09-30-14-58-26/holiday-notice/vendor/lunar.js' });
  const r = await page.evaluate(() => {
    if (typeof Solar === 'undefined') return { err: 'Solar not exposed' };
    function probe(ymd) {
      const p = ymd.split('-').map(Number);
      const solar = Solar.fromDate(new Date(p[0], p[1]-1, p[2]));
      const lunar = solar.getLunar();
      return {
        ymd,
        solarFest: solar.getFestivals(),
        lunarFest: lunar.getFestivals(),
        jieQi: lunar.getJieQi(),
        lunarDay: lunar.getDayInChinese(),
        lunarMonth: lunar.getMonthInChinese()
      };
    }
    return [
      '2026-09-28','2026-09-30','2026-10-01','2026-10-02','2026-10-08','2026-10-10',
      '2026-02-16','2026-02-17','2026-01-01','2026-09-25','2026-05-01','2026-06-19','2026-04-04'
    ].map(probe);
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
