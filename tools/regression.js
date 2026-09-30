/* 海报款回归验证 */
const path = require('path');
const { chromium } = require('C:/Users/38335/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');

const CHROME = 'C:/Users/38335/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'http://127.0.0.1:8899/index.html';
const OUT = 'E:/.workbuddy/2026-09-30-14-58-26';
const TINY_PNG = 'E:/.workbuddy/2026-09-30-14-58-26/test-photo.png';

const fs = require('fs');
// 1x1 红色 PNG（功能测试用）
fs.writeFileSync(TINY_PNG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));

function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; }
function ok(msg) { console.log('PASS:', msg); }

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  console.log('== 1. 打开页面（默认海报款）==');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(600);

  const vis = await page.evaluate(() => ({
    lunarLib: typeof Solar !== 'undefined' && typeof Lunar !== 'undefined',
    posterVisible: !document.getElementById('noticePoster').classList.contains('hidden'),
    officialHidden: document.getElementById('notice').classList.contains('hidden'),
    panelPoster: document.getElementById('panelPoster').style.display !== 'none',
    panelCompanyHidden: document.getElementById('panelCompany').style.display === 'none',
    secCount: document.querySelectorAll('#p-sections .p-section').length,
    fwCount: document.querySelectorAll('#p-sections .p-fw').length
  }));
  vis.lunarLib ? ok('农历库加载') : fail('农历库未加载');
  vis.posterVisible && vis.officialHidden && vis.panelPoster && vis.panelCompanyHidden ? ok('默认海报款，公文面板隐藏') : fail('模板初始状态错误 ' + JSON.stringify(vis));
  vis.secCount === 3 && vis.fwCount === 3 ? ok('3 个板块+烟花装饰') : fail('板块数量 ' + vis.secCount + '/' + vis.fwCount);

  console.log('== 2. 国庆日历农历标注断言 ==');
  const cal = await page.evaluate(() => {
    function of(monthKey, day) {
      const box = document.querySelector('#p-cal .p-month[data-month="' + monthKey + '"]');
      if (!box) return null;
      const cells = [...box.querySelectorAll('.pc-cell')];
      const c = cells.find(x => x.querySelector('.pc-num').textContent === String(day));
      if (!c) return null;
      return {
        lunar: c.querySelector('.pc-lunar').textContent,
        off: c.classList.contains('off'),
        work: c.classList.contains('work'),
        ban: !!c.querySelector('.pc-ban'),
        pad: c.classList.contains('pad')
      };
    }
    return {
      d28: of('2026-10', 28), d1: of('2026-10', 1), d2: of('2026-10', 2),
      d7: of('2026-10', 7), d8: of('2026-10', 8), d10: of('2026-10', 10), d11: of('2026-10', 11),
      s20: of('2026-09', 20),
      offCirclesMain: document.querySelectorAll('#p-cal .p-month[data-month="2026-10"] .pc-cell.off .pc-cir').length,
      offCirclesPad: document.querySelectorAll('#p-cal .pc-cell.pad .pc-cir').length,
      dow: [...document.querySelectorAll('#p-cal .pc-dow')].map(x => x.textContent).join(''),
      monthHeaders: [...document.querySelectorAll('#p-cal .p-month-name')].map(x => x.textContent)
    };
  });
  console.log(JSON.stringify(cal, null, 1));
  cal.dow === '一二三四五六日一二三四五六日' ? ok('周一起始（9月+10月两块）') : fail('星期表头: ' + cal.dow);
  cal.d1 && cal.d1.off && cal.d1.lunar === '国庆节' ? ok('10/1 金圈+国庆节') : fail('10/1: ' + JSON.stringify(cal.d1));
  cal.d2 && cal.d2.off && cal.d2.lunar === '廿二' ? ok('10/2 廿二') : fail('10/2: ' + JSON.stringify(cal.d2));
  cal.d8 && cal.d8.lunar === '寒露' ? ok('10/8 寒露') : fail('10/8: ' + JSON.stringify(cal.d8));
  cal.d10 && cal.d10.work && cal.d10.ban && cal.d10.lunar === '初一' ? ok('10/10 班标+初一') : fail('10/10: ' + JSON.stringify(cal.d10));
  cal.d11 && cal.d11.lunar === '初二' ? ok('10/11 初二') : fail('10/11: ' + JSON.stringify(cal.d11));
  cal.d28 && cal.d28.pad && cal.d28.lunar === '十八' ? ok('上月 28 号补位+十八') : fail('9/28: ' + JSON.stringify(cal.d28));
  cal.d7 && cal.d7.off && cal.d7.lunar === '廿七' ? ok('10/7 廿七') : fail('10/7: ' + JSON.stringify(cal.d7));
  cal.s20 && cal.s20.work && cal.s20.ban && cal.s20.lunar === '初十' ? ok('9/20 班标+初十') : fail('9/20: ' + JSON.stringify(cal.s20));
  cal.offCirclesMain === 7 ? ok('10月主月 7 个金圈') : fail('金圈数 ' + cal.offCirclesMain);
  cal.offCirclesPad === 0 ? ok('补位格无金圈') : fail('补位金圈 ' + cal.offCirclesPad);
  cal.monthHeaders.length === 2 ? ok('跨月显示月份标题') : console.log('NOTE: 月份标题=' + cal.monthHeaders);

  console.log('== 3. 板块 01 自动生成 ==');
  const sec1 = await page.evaluate(() => document.querySelector('#p-sections .p-sec-body').textContent);
  console.log('sec01:', JSON.stringify(sec1));
  sec1.includes('2026年10月1日-7日放假，共7天') && sec1.includes('9月20日、10月10日正常上班')
    ? ok('板块01 自动生成') : fail('板块01 内容: ' + sec1);

  console.log('== 4. 编辑板块标题/内容 ==');
  await page.locator('.sec-row').nth(1).locator('.sec-head input').fill('值班安排');
  await page.locator('.sec-row').nth(1).locator('textarea').fill('值班热线：0371-8888 6666\n值班时间：10月1日-7日 9:00-18:00');
  await page.waitForTimeout(200);
  const sec2 = await page.evaluate(() => document.querySelectorAll('#p-sections .p-sec-body')[1].textContent);
  sec2.includes('0371-8888 6666') ? ok('板块02 编辑联动') : fail('板块02: ' + sec2);

  console.log('== 5. 新增/删除板块 ==');
  await page.click('#btnAddSection');
  await page.waitForTimeout(200);
  let n = await page.evaluate(() => document.querySelectorAll('#p-sections .p-section').length);
  n === 4 ? ok('添加板块 -> 4') : fail('添加后 ' + n);
  const idx4 = await page.evaluate(() => document.querySelectorAll('#p-sections .p-num')[3].textContent);
  idx4 === '04' ? ok('自动编号 04') : fail('编号: ' + idx4);
  await page.locator('.sec-row').nth(3).locator('.sec-del').click();
  await page.waitForTimeout(200);
  n = await page.evaluate(() => document.querySelectorAll('#p-sections .p-section').length);
  n === 3 ? ok('删除板块 -> 3') : fail('删除后 ' + n);

  console.log('== 6. 配图上传 ==');
  await page.setInputFiles('#f-photo', TINY_PNG);
  await page.waitForTimeout(400);
  const src = await page.evaluate(() => document.getElementById('p-photo-img').src.slice(0, 22));
  src.startsWith('data:image/png') ? ok('配图已替换为上传图片') : fail('img src: ' + src);
  await page.click('#btnPhotoClear');
  await page.waitForTimeout(200);
  const src2 = await page.evaluate(() => document.getElementById('p-photo-img').src.slice(0, 26));
  src2.startsWith('data:image/svg+xml') ? ok('清除后恢复默认插图') : fail('清除后: ' + src2);

  console.log('== 7. 海报款截图 ==');
  await page.waitForTimeout(2300); // 等 toast 消失，避免叠在截图上
  await page.locator('#noticePoster').screenshot({ path: path.join(OUT, 'holiday-notice/samples/poster-国庆.png') });
  ok('海报截图已保存');

  console.log('== 8. 导出海报 PNG ==');
  const dl1 = page.waitForEvent('download', { timeout: 30000 });
  await page.click('#btnExport');
  const d1 = await dl1;
  await d1.saveAs(path.join(OUT, 'poster-export-test.png'));
  d1.suggestedFilename().includes('欢度国庆') ? ok('导出文件名: ' + d1.suggestedFilename()) : fail('文件名: ' + d1.suggestedFilename());

  console.log('== 9. 切换公文款回归 ==');
  await page.click('.chip[data-tpl="official"]');
  await page.waitForTimeout(300);
  const off = await page.evaluate(() => ({
    posterHidden: document.getElementById('noticePoster').classList.contains('hidden'),
    officialVisible: !document.getElementById('notice').classList.contains('hidden'),
    offCells: document.querySelectorAll('.m-cell.off').length,
    workCells: document.querySelectorAll('.m-cell.work').length
  }));
  off.posterHidden && off.officialVisible && off.offCells === 7 && off.workCells === 2
    ? ok('公文款回归正常(7休2班)') : fail('公文款 ' + JSON.stringify(off));
  await page.locator('#notice').screenshot({ path: path.join(OUT, 'holiday-notice/samples/official-国庆.png') });

  console.log('== 10. 切换春节(海报款) ==');
  await page.click('.chip[data-tpl="poster"]');
  await page.waitForTimeout(200);
  await page.click('.chip[data-id="chunjie"]');
  await page.waitForTimeout(300);
  const cny = await page.evaluate(() => {
    function of(monthKey, day) {
      const box = document.querySelector('#p-cal .p-month[data-month="' + monthKey + '"]');
      if (!box) return null;
      const c = [...box.querySelectorAll('.pc-cell')].filter(x => !x.classList.contains('pad')).find(x => x.querySelector('.pc-num').textContent === String(day));
      return c ? { lunar: c.querySelector('.pc-lunar').textContent, off: c.classList.contains('off'), work: c.classList.contains('work'), ban: !!c.querySelector('.pc-ban') } : null;
    }
    return {
      sec1: document.querySelector('#p-sections .p-sec-body').textContent,
      d14: of('2026-02', 14), d16: of('2026-02', 16), d17: of('2026-02', 17), d28: of('2026-02', 28),
      monthHeaders: [...document.querySelectorAll('#p-cal .p-month-name')].map(x => x.textContent)
    };
  });
  console.log(JSON.stringify(cny, null, 1));
  cny.sec1.includes('2026年2月15日-23日放假，共9天') ? ok('春节板块01') : fail('春节板块01: ' + cny.sec1);
  cny.d17 && cny.d17.lunar === '春节' && cny.d17.off ? ok('2/17 春节') : fail('2/17: ' + JSON.stringify(cny.d17));
  cny.d16 && cny.d16.lunar === '除夕' ? ok('2/16 除夕') : fail('2/16: ' + JSON.stringify(cny.d16));
  cny.d14 && cny.d14.work && cny.d14.ban ? ok('2/14 班标') : fail('2/14: ' + JSON.stringify(cny.d14));
  cny.d28 && cny.d28.work && cny.d28.ban && cny.d28.lunar === '十二' ? ok('2/28 班标+十二') : fail('2/28: ' + JSON.stringify(cny.d28));
  cny.monthHeaders.length === 0 ? ok('单月不显示月份标题') : console.log('NOTE: 标题=' + cny.monthHeaders);
  await page.locator('#noticePoster').screenshot({ path: path.join(OUT, 'holiday-notice/samples/poster-春节.png') });
  ok('春节海报截图已保存');

  console.log('\n== JS 错误 ==');
  console.log('错误数:', errors.length);
  errors.slice(0, 8).forEach(e => console.log('  ' + e));
  if (errors.length) process.exitCode = 1;

  await browser.close();
  fs.unlinkSync(TINY_PNG);
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
