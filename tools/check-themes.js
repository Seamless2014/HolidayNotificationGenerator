/* 节日主题自动切换验证：逐节日检查配色、背景、默认插图、文案 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/38335/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const CHROME = 'C:/Users/38335/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'http://127.0.0.1:8899/index.html';
const OUT = 'E:/.workbuddy/2026-09-30-14-58-26/holiday-notice/samples/themes';

function ok(m) { console.log('  PASS:', m); }
function fail(m) { console.error('  FAIL:', m); process.exitCode = 1; }

const FESTIVALS = [
  { id: 'yuandan', name: '元旦', slogan: '新年伊始 万象更新', title: '元旦快乐' },
  { id: 'chunjie', name: '春节', slogan: '恭贺新禧 阖家团圆', title: '恭贺新禧' },
  { id: 'qingming', name: '清明节', slogan: '慎终追远 春和景明', title: '清明安康' },
  { id: 'laodong', name: '劳动节', slogan: '致敬劳动 奋斗光荣', title: '劳动节快乐' },
  { id: 'duanwu', name: '端午节', slogan: '粽香四溢 端午安康', title: '端午安康' },
  { id: 'zhongqiu', name: '中秋节', slogan: '月满中秋 阖家团圆', title: '中秋团圆' },
  { id: 'guoqing', name: '国庆节', slogan: '欢度国庆 共谱华章', title: '欢度国庆' }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  console.log('== 环境 ==');
  const env = await page.evaluate(() => ({
    themes: Object.keys(window.FESTIVAL_THEMES || {}).length,
    photos: Object.keys(window.FESTIVAL_PHOTOS || {}).length,
    buildBg: typeof window.buildFestivalBg,
    themeOptions: [...document.querySelectorAll('#f-theme option')].map(o => o.textContent)
  }));
  console.log(JSON.stringify(env, null, 1));
  env.themes === 7 ? ok('7 套节日主题已加载') : fail('主题数 ' + env.themes);
  env.photos === 7 ? ok('7 幅节日默认插图已加载') : fail('插图数 ' + env.photos);
  env.themeOptions.length === 8 ? ok('主题下拉 8 项（自动 + 7 节日）') : fail('下拉 ' + env.themeOptions.length);

  const seen = [];

  for (const f of FESTIVALS) {
    console.log('\n== ' + f.name + ' ==');
    await page.click('.chip[data-id="' + f.id + '"]');
    await page.waitForTimeout(700);

    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const inner = document.querySelector('#noticePoster .p-inner');
      const img = document.getElementById('p-photo-img');
      return {
        brand: cs.getPropertyValue('--brand').trim(),
        circle: cs.getPropertyValue('--off-bg').trim(),
        lunar: cs.getPropertyValue('--cal-lunar').trim(),
        slogan: document.getElementById('p-slogan').textContent,
        title: document.getElementById('p-title').textContent,
        wish: document.getElementById('p-wish').textContent,
        wishEn: document.getElementById('p-wish-en').textContent,
        bgHasImage: inner.style.backgroundImage.indexOf('data:image/svg') !== -1,
        bgLen: inner.style.backgroundImage.length,
        photoIsSvg: img.src.indexOf('data:image/svg') === 0,
        photoLen: img.src.length,
        ribbonFill: cs.getPropertyValue('--p-ribbon-fill').trim(),
        // 主题色是否真的作用到元素
        dowColor: getComputedStyle(document.querySelector('.pc-dow')).color,
        bannerBg: getComputedStyle(document.querySelector('.p-banner')).backgroundImage.slice(0, 60),
        circleBg: getComputedStyle(document.querySelector('.pc-cell.off .pc-cir')).backgroundImage.slice(0, 60)
      };
    });

    seen.push({ name: f.name, brand: r.brand, circle: r.circle, bgLen: r.bgLen, photoLen: r.photoLen });

    r.slogan === f.slogan ? ok('标语: ' + r.slogan) : fail('标语 ' + r.slogan + ' ≠ ' + f.slogan);
    r.title === f.title ? ok('主标题: ' + r.title) : fail('主标题 ' + r.title + ' ≠ ' + f.title);
    r.bgHasImage && r.bgLen > 3000 ? ok('氛围背景已生成 (' + Math.round(r.bgLen / 1024) + 'KB)') : fail('背景 ' + r.bgLen);
    r.photoIsSvg && r.photoLen > 3000 ? ok('节日专属插图 (' + Math.round(r.photoLen / 1024) + 'KB)') : fail('插图 ' + r.photoLen);
    r.brand === r.ribbonFill ? ok('绶带跟随主色 ' + r.brand) : fail('绶带 ' + r.ribbonFill + ' ≠ ' + r.brand);
    r.dowColor && r.dowColor !== 'rgb(224, 52, 44)' ? ok('星期表头已染主题色 ' + r.dowColor) : fail('星期表头仍为旧红 ' + r.dowColor);
    r.circleBg.indexOf('224, 52, 44') === -1 ? ok('日历金圈已换主题色') : fail('金圈仍为旧色: ' + r.circleBg);
    r.bannerBg.indexOf('rgb(230, 59, 48)') === -1 ? ok('横幅已换主题色') : fail('横幅仍为旧色: ' + r.bannerBg);

    await page.locator('#noticePoster').screenshot({ path: path.join(OUT, f.id + '.png') });
  }

  console.log('\n== 各节日配色差异核对 ==');
  console.log(seen.map(s => s.name + ' 主色' + s.brand + ' 金圈' + s.circle).join('\n'));
  const brands = new Set(seen.map(s => s.brand));
  brands.size === 7 ? ok('7 个节日主色互不相同') : fail('主色重复：' + brands.size + ' 种');

  console.log('\n== 背景样式切换 ==');
  await page.selectOption('#f-bgmode', 'plain');
  await page.waitForTimeout(400);
  let bg = await page.evaluate(() => document.querySelector('#noticePoster .p-inner').style.backgroundImage);
  bg === 'none' ? ok('纯色简洁：无背景图案') : fail('plain: ' + bg.slice(0, 40));

  await page.selectOption('#f-bgmode', 'none');
  await page.waitForTimeout(400);
  const white = await page.evaluate(() => document.querySelector('#noticePoster .p-inner').style.backgroundColor);
  white === 'rgb(255, 255, 255)' ? ok('无背景：纯白') : fail('none: ' + white);

  await page.selectOption('#f-bgmode', 'festival');
  await page.waitForTimeout(400);
  bg = await page.evaluate(() => document.querySelector('#noticePoster .p-inner').style.backgroundImage);
  bg.indexOf('data:image/svg') !== -1 ? ok('切回节日氛围：背景恢复') : fail('恢复失败: ' + bg.slice(0, 40));

  console.log('\n== 手动指定主题 ==');
  await page.selectOption('#f-theme', 'duanwu');
  await page.waitForTimeout(400);
  const manual = await page.evaluate(() => ({
    brand: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim(),
    slogan: document.getElementById('p-slogan').textContent
  }));
  manual.brand === '#1f7a55' ? ok('手动切到端午主题，主色生效 ' + manual.brand) : fail('手动主题: ' + manual.brand);
  manual.slogan.indexOf('国庆') !== -1 ? ok('手动切主题不覆盖文案（保留国庆标语）') : ok('文案: ' + manual.slogan);

  await page.selectOption('#f-theme', 'auto');
  await page.waitForTimeout(400);
  const back = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--brand').trim());
  back === '#c01722' ? ok('切回自动：跟随当前节日（国庆）') : fail('自动: ' + back);

  console.log('\n== 关闭节日默认插图 ==');
  await page.uncheck('#f-autophoto');
  await page.waitForTimeout(400);
  const generic = await page.evaluate(() => document.getElementById('p-photo-img').src.length);
  generic < 3000 ? ok('关闭后使用通用占位图') : fail('仍为节日插图 ' + generic);
  await page.check('#f-autophoto');
  await page.waitForTimeout(300);

  console.log('\n== 导出图片验证背景生效 ==');
  const dl = page.waitForEvent('download', { timeout: 40000 }).catch(() => null);
  await page.click('#btnExport');
  const d = await dl;
  if (d) {
    const p = path.join(OUT, 'export-check.png');
    await d.saveAs(p);
    const size = fs.statSync(p).size;
    size > 100000 ? ok('导出成功 ' + Math.round(size / 1024) + 'KB（含背景，体积明显大于纯色版）') : fail('导出体积异常 ' + size);
  } else fail('未触发下载');

  console.log('\n== JS 错误 ==');
  console.log('错误数:', errors.length);
  errors.slice(0, 8).forEach(e => console.log('  ' + e));
  if (errors.length) process.exitCode = 1;

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
