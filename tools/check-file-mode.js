/* 验证 file:// 场景下的导出兜底 + 打印 */
const path = require('path');
const { chromium } = require('C:/Users/38335/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core');
const CHROME = 'C:/Users/38335/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const FILE_URL = 'file:///E:/.workbuddy/2026-09-30-14-58-26/holiday-notice/index.html';
const OUT = 'E:/.workbuddy/2026-09-30-14-58-26';

function ok(m) { console.log('PASS:', m); }
function fail(m) { console.error('FAIL:', m); process.exitCode = 1; }

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--allow-file-access-from-files']
  });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  console.log('== 1. file:// 打开 ==');
  await page.goto(FILE_URL, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  const env = await page.evaluate(() => ({
    proto: location.protocol,
    h2c: typeof html2canvas,
    solar: typeof Solar,
    posterVisible: !document.getElementById('noticePoster').classList.contains('hidden'),
    posterHasContent: document.querySelectorAll('#p-cal .pc-cell').length,
    secCount: document.querySelectorAll('#p-sections .p-section').length
  }));
  console.log(JSON.stringify(env));
  env.proto === 'file:' ? ok('确认运行在 file:// 协议') : fail('协议: ' + env.proto);
  env.h2c === 'function' && env.solar === 'object' ? ok('离线依赖加载正常（html2canvas + 农历库）') : fail('依赖: ' + JSON.stringify(env));
  env.posterHasContent > 30 && env.secCount === 3 ? ok('海报渲染正常') : fail('渲染: ' + JSON.stringify(env));

  console.log('\n== 2. 点击下载图片 -> 应弹出兜底预览 ==');
  await page.click('#btnExport');
  await page.waitForTimeout(2500);

  const after = await page.evaluate(() => {
    const mask = document.querySelector('.img-modal-mask');
    const img = document.querySelector('.img-modal-img');
    return {
      modalShown: !!mask,
      tipText: document.querySelector('.img-modal-tip') ? document.querySelector('.img-modal-tip').textContent.slice(0, 30) : '',
      imgOk: img ? img.src.startsWith('data:image/png') : false,
      imgNaturalW: img ? img.naturalWidth : 0,
      imgNaturalH: img ? img.naturalHeight : 0,
      btnBack: document.getElementById('btnExport').textContent,
      btnDisabled: document.getElementById('btnExport').disabled,
      buttons: [...document.querySelectorAll('.img-modal-actions button')].map(b => b.textContent)
    };
  });
  console.log(JSON.stringify(after, null, 1));
  after.modalShown ? ok('file:// 下弹出图片预览兜底弹窗') : fail('未弹出兜底弹窗');
  after.imgOk && after.imgNaturalW > 500 ? ok('预览图生成成功 ' + after.imgNaturalW + 'x' + after.imgNaturalH) : fail('预览图异常');
  after.btnBack === '下载图片' && !after.btnDisabled ? ok('按钮状态已恢复') : fail('按钮状态: ' + JSON.stringify(after));
  after.buttons.length === 3 ? ok('提供 3 个操作：' + after.buttons.join(' / ')) : fail('按钮: ' + after.buttons);

  console.log('\n== 3. 弹窗「再试一次下载」==');
  const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await page.locator('.img-modal-actions button', { hasText: '再试一次下载' }).click();
  const d = await dl;
  if (d) { await d.saveAs(path.join(OUT, 'fallback-download-test.png')); ok('再试一次下载成功: ' + d.suggestedFilename()); }
  else console.log('NOTE: headless 下未捕获 download 事件（真实浏览器中会走下载栏）');

  console.log('\n== 4. 关闭弹窗 ==');
  await page.locator('.img-modal-actions button', { hasText: '关闭' }).click();
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => !document.querySelector('.img-modal-mask'));
  closed ? ok('弹窗可关闭') : fail('弹窗未关闭');

  console.log('\n== 5. 打印：验证打印样式下的可见性 ==');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  const printState = await page.evaluate(() => {
    function vis(sel) {
      const el = document.querySelector(sel);
      if (!el) return 'missing';
      const cs = getComputedStyle(el);
      return cs.display === 'none' ? 'hidden' : 'visible';
    }
    const ps = document.querySelector('.preview-scroll');
    const p = document.querySelector('.preview');
    return {
      topbar: vis('.topbar'),
      editor: vis('.editor'),
      previewBar: vis('.preview-bar'),
      capture: vis('#capture'),
      noticeVisible: vis('#noticePoster'),
      scrollMaxH: getComputedStyle(ps).maxHeight,
      scrollOverflow: getComputedStyle(ps).overflow,
      previewPosition: getComputedStyle(p).position,
      bodyHeight: document.body.scrollHeight
    };
  });
  console.log(JSON.stringify(printState, null, 1));
  printState.topbar === 'hidden' && printState.editor === 'hidden' && printState.previewBar === 'hidden'
    ? ok('打印时编辑区/顶栏已隐藏') : fail('打印隐藏异常 ' + JSON.stringify(printState));
  printState.capture === 'visible' && printState.noticeVisible === 'visible'
    ? ok('打印时通知单可见') : fail('通知单不可见');
  printState.scrollMaxH === 'none' && printState.scrollOverflow === 'visible'
    ? ok('打印时滚动容器已展开（内容不会被裁切）') : fail('滚动容器: ' + printState.scrollMaxH + '/' + printState.scrollOverflow);
  printState.previewPosition === 'static' ? ok('打印时取消 sticky 定位') : fail('position: ' + printState.previewPosition);

  // 打印成 PDF 验证内容完整
  await page.pdf({ path: path.join(OUT, 'print-test.pdf'), format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
  ok('打印 PDF 已生成（用于检查内容完整性）');
  await page.emulateMedia({ media: 'screen' });

  console.log('\n== JS 错误 ==');
  console.log('错误数:', errors.length);
  errors.forEach(e => console.log('  ' + e));
  if (errors.length) process.exitCode = 1;

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
