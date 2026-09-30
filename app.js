/* ===========================================================
   公司放假通知生成器 — 逻辑
   =========================================================== */
(function () {
  'use strict';

  /* ---------------- 基础工具 ---------------- */
  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /** Date -> 'YYYY-MM-DD' */
  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** 'YYYY-MM-DD' -> Date（本地时间零点，避免时区偏移） */
  function parseYmd(s) {
    if (!s) return null;
    var p = String(s).trim().split('-');
    if (p.length !== 3) return null;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function isValidYmd(s) { return !!parseYmd(s); }

  function addDays(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  /** 中文日期：2026年10月1日 */
  function cnDate(d) {
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /** 通知正文里的日期写法：10月1日（周四） */
  function cnDateWeek(d) {
    return (d.getMonth() + 1) + '月' + d.getDate() + '日（周' + WEEK_CN[d.getDay()] + '）';
  }

  function el(id) { return document.getElementById(id); }

  function toast(msg) {
    var t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._tm);
    toast._tm = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  /* ---------------- 应用状态 ---------------- */
  var DATA = window.HOLIDAY_DATA_2026;

  var state = {
    /** 放假日期集合 'YYYY-MM-DD' -> true */
    off: Object.create(null),
    /** 调休上班日期集合 */
    work: Object.create(null),
    /** 查看日历控件时的月份 0-11 */
    editMonth: 9,
    editYear: 2026,
    /** 当前选中的节日 id */
    festival: null,
    /** 配色主题（跟随节日自动匹配时记录当前节日 key） */
    themeKey: 'guoqing',
    /** 背景样式：festival 节日氛围 / plain 纯色 / none 无背景 */
    bgMode: 'festival',
    /** 手动指定主题：'auto' 或节日 key */
    themeOverride: 'auto',
    /** 未上传配图时是否使用节日默认插图 */
    autoPhoto: true,
    /** 模板：poster 海报款 / official 公文款 */
    template: 'poster',
    /** 海报配图 dataURL（null = 默认插图） */
    photo: null,
    /** 海报内容板块 */
    sections: [
      { title: '放假通知', body: '', dirty: false },
      { title: '值班安排', body: '值班热线：400-882-9690\n值班时间：10月1日-10月7日 上午8:00-18:00', dirty: false },
      { title: '温馨提示', body: '（1）放假前请做好工作交接与数据备份，重要资料多渠道保存；\n（2）离开办公室请关闭电脑、空调、照明等电源，锁好门窗；\n（3）假期出行注意人身与财产安全，合理安排返程，确保节后按时到岗。', dirty: false }
    ]
  };

  var THEMES = [
    { id: 'red', name: '红金喜庆' },
    { id: 'blue', name: '商务蓝' },
    { id: 'green', name: '清新绿' },
    { id: 'purple', name: '典雅紫' }
  ];

  /* ---------------- 节日主题 ---------------- */

  var FT = window.FESTIVAL_THEMES || {};

  /** 取当前生效的节日 theme key */
  function currentThemeKey() {
    if (state.themeOverride && state.themeOverride !== 'auto' && FT[state.themeOverride]) {
      return state.themeOverride;
    }
    if (state.festival && FT[state.festival]) return state.festival;
    return state.themeKey || 'guoqing';
  }

  /** 把节日配色写入 CSS 变量（覆盖 [data-theme] 的硬编码值） */
  function applyFestivalColors(key) {
    var t = FT[key];
    if (!t) return;
    var c = t.colors, root = document.documentElement.style;
    root.setProperty('--brand', c.brand);
    root.setProperty('--brand-2', c.brand2);
    root.setProperty('--brand-ink', c.ink);
    root.setProperty('--brand-soft', c.soft);
    root.setProperty('--gold', c.gold);
    root.setProperty('--gold-soft', c.goldSoft);
    root.setProperty('--off-bg', c.circle[0]);
    root.setProperty('--off-bg-2', c.circle[1]);
    root.setProperty('--page-bg', c.pageBg);
    root.setProperty('--cal-lunar', c.lunar);
    // 绶带（内联 SVG，用渐变主色）
    root.setProperty('--p-ribbon-fill', c.brand);

    state.themeKey = key;
    state.theme = key;
  }

  /** 应用背景样式到海报容器 */
  function applyBackground() {
    var inner = document.querySelector('#noticePoster .p-inner');
    if (!inner) return;
    var key = currentThemeKey();

    if (state.bgMode === 'festival' && window.buildFestivalBg) {
      var bg = window.buildFestivalBg(key);
      if (bg) {
        inner.style.backgroundImage = 'url("' + bg + '")';
        inner.style.backgroundSize = '100% 100%';
        inner.style.backgroundRepeat = 'no-repeat';
        inner.style.backgroundColor = FT[key] ? FT[key].colors.pageBg : '#fff';
        return;
      }
    }
    inner.style.backgroundImage = 'none';
    inner.style.backgroundColor = state.bgMode === 'none'
      ? '#ffffff'
      : (FT[key] ? FT[key].colors.pageBg : '#ffffff');
  }

  /** 切换节日主题（配色 + 背景 + 默认文案可选） */
  function applyThemeForFestival(festKey, opts) {
    opts = opts || {};
    applyFestivalColors(festKey);
    applyBackground();

    if (opts.autoText) {
      var t = FT[festKey];
      if (t && t.text) {
        if (opts.autoText.slogan) el('f-p-slogan').value = t.text.slogan;
        if (opts.autoText.title) el('f-p-title').value = t.text.title;
        if (opts.autoText.wish) el('f-p-wish').value = t.text.wish;
        if (opts.autoText.wishEn) el('f-p-wish-en').value = t.text.wishEn;
      }
    }
  }

  /** 主题下拉框选项 */
  function buildThemeSelect() {
    var sel = el('f-theme');
    if (!sel) return;
    sel.innerHTML = '<option value="auto">跟随节日自动匹配</option>';
    // 与内置放假数据同序
    DATA.festivals.forEach(function (f) {
      if (!FT[f.id]) return;
      var o = document.createElement('option');
      o.value = f.id;
      o.textContent = FT[f.id].label + '主题';
      sel.appendChild(o);
    });
  }

  /* ---------------- 海报款：农历标签与装饰 ---------------- */

  /** 公历节日白名单（库中名称 -> 展示名） */
  var SOLAR_FEST_WL = {
    '元旦节': '元旦', '元旦': '元旦',
    '劳动节': '劳动节', '国庆节': '国庆节',
    '妇女节': '妇女节', '植树节': '植树节', '青年节': '青年节',
    '儿童节': '儿童节', '建党节': '建党节', '建军节': '建军节', '教师节': '教师节'
  };

  /** 农历节日白名单 */
  var LUNAR_FEST_WL = {
    '春节': '春节', '除夕': '除夕', '元宵节': '元宵节',
    '端午节': '端午节', '七夕节': '七夕节', '中秋节': '中秋节',
    '重阳节': '重阳节', '腊八节': '腊八节'
  };

  /**
   * 某天的海报日历标签：公历节日 > 农历节日 > 节气 > 农历日
   * 农历数据来自 vendor/lunar.js（lunar-javascript），已核对国办 2026 放假安排
   */
  function lunarLabel(d) {
    try {
      if (typeof Solar === 'undefined' || typeof Lunar === 'undefined') return '';
      var solar = Solar.fromDate(d);
      var lunar = solar.getLunar();
      var sf = solar.getFestivals() || [];
      for (var i = 0; i < sf.length; i++) {
        if (SOLAR_FEST_WL[sf[i]]) return SOLAR_FEST_WL[sf[i]];
      }
      var lf = lunar.getFestivals() || [];
      for (var j = 0; j < lf.length; j++) {
        if (LUNAR_FEST_WL[lf[j]]) return LUNAR_FEST_WL[lf[j]];
      }
      var jq = lunar.getJieQi();
      if (jq) return jq;
      return lunar.getDayInChinese();
    } catch (e) { return ''; }
  }

  /** 板块胶囊上的烟花装饰 */
  var FW_SVG =
    '<svg class="p-fw" viewBox="0 0 64 64">' +
    '<g fill="none" stroke-linecap="round">' +
    '<g stroke="#f5b73c" stroke-width="3">' +
    '<path d="M32 8v9"/><path d="M17 15l6.5 6.5"/><path d="M47 15l-6.5 6.5"/><path d="M12 32h9"/><path d="M43 32h9"/>' +
    '</g>' +
    '<g stroke="#e34d4d" stroke-width="2.5">' +
    '<path d="M22 6l3 7.5"/><path d="M42 6l-3 7.5"/><path d="M12 22l8 3.5"/><path d="M52 22l-8 3.5"/>' +
    '</g>' +
    '</g>' +
    '<circle cx="32" cy="27" r="3" fill="#f5b73c"/>' +
    '<circle cx="21" cy="31" r="2" fill="#e34d4d"/>' +
    '<circle cx="43" cy="31" r="2" fill="#e34d4d"/>' +
    '</svg>';

  /** 默认配图（无上传时）：晴空 + 屋檐剪影（必须带 width/height，否则 html2canvas 导出时无法栅格化） */
  var PLACEHOLDER_PHOTO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="840" height="460" viewBox="0 0 840 460">' +
    '<defs>' +
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#a9d0f0"/><stop offset="1" stop-color="#ddeefb"/>' +
    '</linearGradient>' +
    '<linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#c49a5c"/><stop offset="1" stop-color="#9c763f"/>' +
    '</linearGradient>' +
    '</defs>' +
    '<rect width="840" height="460" fill="url(#sky)"/>' +
    '<circle cx="140" cy="100" r="42" fill="#fdf3d8" opacity=".85"/>' +
    '<ellipse cx="380" cy="110" rx="130" ry="20" fill="#ffffff" opacity=".55"/>' +
    '<ellipse cx="560" cy="70" rx="90" ry="14" fill="#ffffff" opacity=".4"/>' +
    '<ellipse cx="240" cy="180" rx="70" ry="11" fill="#ffffff" opacity=".35"/>' +
    '<path d="M840 150 C 720 165 600 205 500 270 C 440 310 400 370 375 460 L 840 460 Z" fill="url(#roof)"/>' +
    '<path d="M840 190 C 730 205 625 245 535 305 C 480 342 445 395 425 460 L 840 460 Z" fill="#8a6534" opacity=".55"/>' +
    '<path d="M840 150 C 720 165 600 205 500 270 C 460 296 430 336 408 388 L 840 300 Z" fill="#b28849" opacity="0"/>' +
    '<g fill="#7d5a2c">' +
    '<circle cx="806" cy="163" r="9"/><circle cx="770" cy="168" r="8"/><circle cx="736" cy="176" r="8"/>' +
    '<circle cx="703" cy="186" r="7"/><circle cx="672" cy="198" r="7"/><circle cx="643" cy="211" r="6"/>' +
    '<circle cx="616" cy="225" r="6"/><circle cx="591" cy="240" r="5"/>' +
    '</g>' +
    '<path d="M520 258 C 470 300 430 370 410 460 L 470 460 C 486 390 520 330 565 290 Z" fill="#6f8f5e" opacity=".7"/>' +
    '</svg>'
  );

  /* ---------------- 读取表单 ---------------- */
  function parseWorkdays(str) {
    var out = Object.create(null);
    String(str || '')
      .split(/[,，、;；\s]+/)
      .forEach(function (s) {
        s = s.trim();
        if (isValidYmd(s)) out[s] = true;
      });
    return out;
  }

  function fmtWorkdays(map) {
    return Object.keys(map).sort().join(', ');
  }

  function getForm() {
    return {
      company: el('f-company').value.trim(),
      title: el('f-title').value.trim(),
      dept: el('f-dept').value.trim(),
      date: el('f-date').value,
      salutation: el('f-salutation').value.trim(),
      body: el('f-body').value.trim(),
      items: el('f-items').value,
      requirements: el('f-requirements').value,
      duty: el('f-duty').value,
      notes: el('f-notes').value,
      start: el('f-start').value,
      end: el('f-end').value,
      scale: Number(el('f-scale').value) || 3,
      showSeal: el('f-seal').checked,
      showHl: el('f-showHl').checked
    };
  }

  /** 文本域 -> 行数组（去空行） */
  function lines(str) {
    return String(str || '')
      .split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  /* ---------------- 节假日 chips ---------------- */
  function buildFestivalChips() {
    var box = el('festivalChips');
    box.innerHTML = '';
    DATA.festivals.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.id = f.id;
      b.innerHTML = f.name + '<span class="chip-days">' + f.days + '天</span>';
      b.addEventListener('click', function () { applyFestival(f.id); });
      box.appendChild(b);
    });
  }

  function applyFestival(id) {
    var f = null;
    for (var i = 0; i < DATA.festivals.length; i++) {
      if (DATA.festivals[i].id === id) { f = DATA.festivals[i]; break; }
    }
    if (!f) return;

    state.festival = id;

    // 清空并填充放假 / 调休
    state.off = Object.create(null);
    state.work = Object.create(null);
    f.off.forEach(function (d) { state.off[d] = true; });
    f.work.forEach(function (d) { state.work[d] = true; });

    var offDates = f.off.map(parseYmd).filter(Boolean).sort(function (a, b) { return a - b; });
    var first = offDates[0], last = offDates[offDates.length - 1];

    el('f-start').value = ymd(first);
    el('f-end').value = ymd(last);
    el('f-workdays').value = fmtWorkdays(state.work);

    // 标题自动替换节日名
    var title = el('f-title').value;
    var newName = f.name;
    var replaced = title.replace(/(元旦|春节|清明节|劳动节|端午节|中秋节|国庆节)/g, newName);
    if (replaced !== title) el('f-title').value = replaced;

    // 正文自动生成
    var startTxt = cnDateWeek(first);
    var endTxt = cnDateWeek(last);
    var workTxt = f.work.length
      ? f.work.map(function (s) { return cnDateWeek(parseYmd(s)); }).join('、') + '正常上班'
      : '本次假期无需调休';

    el('f-items').value = [
      startTxt + '至' + endTxt + '放假调休，共' + f.days + '天；',
      workTxt + '；',
      '放假期间，各部门要妥善安排好值班和安全保卫工作。'
    ].join('\n');

    // 海报款板块 01 同步（未被手动编辑过时）
    if (state.sections.length && !state.sections[0].dirty) {
      var line1 = first.getFullYear() + '年' + (first.getMonth() + 1) + '月' + first.getDate() + '日';
      if (first.getMonth() === last.getMonth()) {
        line1 += '-' + last.getDate() + '日';
      } else {
        line1 += '-' + last.getFullYear() + '年' + (last.getMonth() + 1) + '月' + last.getDate() + '日';
      }
      line1 += '放假，共' + f.days + '天';
      var wk = f.work.map(function (s) {
        var d = parseYmd(s);
        return d ? (d.getMonth() + 1) + '月' + d.getDate() + '日' : s;
      });
      state.sections[0].body = wk.length
        ? line1 + '\n' + wk.join('、') + '正常上班'
        : line1;
    }

    // 切换日历控件所在月份
    state.editYear = first.getFullYear();
    state.editMonth = first.getMonth();
    syncMonthSelect();

    // 节日主题自动联动：配色 + 背景 + 顶部/落款文案
    if (FT[id]) {
      applyThemeForFestival(id, {
        autoText: { slogan: true, title: true, wish: true, wishEn: true }
      });
    }

    // 显示官方口径参考
    var ref = el('refBox');
    if (ref) {
      ref.className = 'ref-box show';
      ref.innerHTML = '<b>' + f.name + '</b>：' + f.offText + '。' + f.workText +
        '<span class="ref-src">依据《国务院办公厅关于' + DATA.year + '年部分节假日安排的通知》（' + DATA.source + '），' + DATA.sourceDate + '发布</span>';
    }

    markActiveChip(id);
    render();
    toast('已填充「' + f.name + '」放假安排，可在日历中继续微调');
  }

  function markActiveChip(id) {
    var chips = el('festivalChips').querySelectorAll('.chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('active', chips[i].dataset.id === id);
    }
  }

  /* ---------------- 主题（旧 chips 已由节日主题下拉取代） ---------------- */

  function buildThemeChips() {
    // 保留空实现：配色改由「节日主题」下拉 + 节日自动联动控制
  }

  /* ---------------- 日历控件 ---------------- */
  function syncMonthSelect() {
    var sel = el('f-month');
    if (!sel.options.length) {
      var months = [];
      DATA.festivals.forEach(function (f) {
        f.off.forEach(function (d) {
          var p = d.split('-');
          var key = p[0] + '-' + p[1];
          if (months.indexOf(key) === -1) months.push(key);
        });
      });
      // 补齐 2026 全年 12 个月
      for (var m = 1; m <= 12; m++) {
        var k = DATA.year + '-' + pad(m);
        if (months.indexOf(k) === -1) months.push(k);
      }
      months.sort();
      months.forEach(function (k) {
        var p = k.split('-');
        var o = document.createElement('option');
        o.value = k;
        o.textContent = Number(p[0]) + '年' + Number(p[1]) + '月';
        sel.appendChild(o);
      });
    }
    sel.value = state.editYear + '-' + pad(state.editMonth + 1);
  }

  function renderEditCalendar() {
    var grid = el('calGrid');
    grid.innerHTML = '';

    var y = state.editYear, m = state.editMonth;
    el('calTitle').textContent = y + '年' + (m + 1) + '月';

    // 星期表头
    WEEK_CN.forEach(function (w, i) {
      var head = document.createElement('div');
      head.className = 'cal-dow' + (i === 0 || i === 6 ? ' we' : '');
      head.textContent = w;
      grid.appendChild(head);
    });

    var firstDay = new Date(y, m, 1);
    var startDow = firstDay.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var todayKey = ymd(new Date());

    for (var i = 0; i < startDow; i++) {
      var blank = document.createElement('div');
      blank.className = 'cal-day empty';
      grid.appendChild(blank);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dt = new Date(y, m, d);
      var key = ymd(dt);
      var dow = dt.getDay();
      var isWeekend = dow === 0 || dow === 6;
      var isOff = !!state.off[key];
      var isWork = !!state.work[key];

      var cell = document.createElement('div');
      cell.className = 'cal-day';
      if (isWeekend) cell.classList.add('weekend');
      if (isOff) cell.classList.add('off');
      if (isWork) cell.classList.add('work');
      if (key === todayKey) cell.classList.add('today');
      cell.dataset.date = key;

      var num = document.createElement('span');
      num.className = 'd-num';
      num.textContent = d;
      cell.appendChild(num);

      var tag = document.createElement('span');
      tag.className = 'd-tag';
      if (isOff) tag.textContent = '休';
      else if (isWork) tag.textContent = '班';
      else {
        var fname = festNameOf(key);
        if (fname) { tag.textContent = fname; cell.classList.add('holiday-name'); }
      }
      cell.appendChild(tag);

      var span = document.createElement('span');
      span.className = 'hl-row';
      cell.appendChild(span);

      cell.addEventListener('click', function (ev) { cycleDay(ev.currentTarget.dataset.date); });
      grid.appendChild(cell);
    }

    // 行内高亮条：把连续放假日期连起来
    paintRowHighlight(grid, y, m, startDow, daysInMonth);
  }

  /** 该日期是否属于某个法定节日（用于显示节日名） */
  function festNameOf(key) {
    for (var i = 0; i < DATA.festivals.length; i++) {
      var f = DATA.festivals[i];
      if (f.off.indexOf(key) !== -1) return f.name;
    }
    return '';
  }

  function paintRowHighlight(grid, y, m, startDow, daysInMonth) {
    var cells = grid.querySelectorAll('.cal-day:not(.empty)');
    var firstCell = cells[0];
    if (!firstCell) return;

    var cellW = firstCell.offsetWidth;
    var gap = 5;

    // 逐行处理
    var total = startDow + daysInMonth;
    var rows = Math.ceil(total / 7);

    for (var r = 0; r < rows; r++) {
      var segs = [];
      var cur = null;
      for (var c = 0; c < 7; c++) {
        var idx = r * 7 + c;
        var dayNum = idx - startDow + 1;
        var isOff = false;
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          var key = y + '-' + pad(m + 1) + '-' + pad(dayNum);
          isOff = !!state.off[key];
        }
        if (isOff) {
          if (!cur) cur = { s: c, e: c };
          else cur.e = c;
        } else if (cur) { segs.push(cur); cur = null; }
      }
      if (cur) segs.push(cur);
    }
  }

  /** 点击日期：无 -> 放假 -> 调休上班 -> 无 */
  function cycleDay(key) {
    if (!key) return;
    if (state.off[key]) {
      delete state.off[key];
      state.work[key] = true;
    } else if (state.work[key]) {
      delete state.work[key];
    } else {
      state.off[key] = true;
    }
    state.festival = null;
    markActiveChip(null);
    syncRangeFromCalendar();
    render();
  }

  /** 根据日历勾选结果反推开始/结束/天数/调休文本框 */
  function syncRangeFromCalendar() {
    var offKeys = Object.keys(state.off).sort();
    if (offKeys.length) {
      el('f-start').value = offKeys[0];
      el('f-end').value = offKeys[offKeys.length - 1];
    }
    el('f-workdays').value = fmtWorkdays(state.work);
  }

  /* ---------------- 通知单渲染 ---------------- */
  function render() {
    var f = getForm();

    // 头部
    el('n-company').textContent = f.company;
    el('n-title').textContent = f.title;

    // 正文
    el('n-salutation').textContent = f.salutation ? f.salutation + '：' : '';
    el('n-body-para').textContent = f.body;
    el('n-body-para').style.display = f.body ? '' : 'none';

    fillList(el('n-items'), lines(f.items));
    fillList(el('n-requirements'), lines(f.requirements));

    // 假期天数
    var offKeys = Object.keys(state.off).sort();
    var daysCount = offKeys.length;
    el('f-days').value = daysCount;

    // 日历区标题
    var startD = parseYmd(f.start) || (offKeys.length ? parseYmd(offKeys[0]) : null);
    var endD = parseYmd(f.end) || (offKeys.length ? parseYmd(offKeys[offKeys.length - 1]) : null);

    var festName = state.festival ? getFestById(state.festival).name : guessFestName(offKeys);
    el('n-cal-title').textContent = (festName ? festName + '放假安排' : '假期日历') + '（' + DATA.year + '年）';

    var subParts = [];
    if (startD && endD) {
      subParts.push('放假时间：' + cnDate(startD) + ' 至 ' + cnDate(endD) + '，共 ' + daysCount + ' 天');
    }
    var workKeys = Object.keys(state.work).sort();
    if (workKeys.length) {
      subParts.push('调休上班：' + workKeys.map(function (k) { return cnDateWeek(parseYmd(k)); }).join('、'));
    }
    el('n-cal-sub').innerHTML = subParts.map(function (s) { return '<div>' + s + '</div>'; }).join('');

    // 月份日历
    renderNoticeCalendars(offKeys, f.showHl);

    // 值班 / 注意事项
    var dutyArr = lines(f.duty);
    var notesArr = lines(f.notes);
    el('n-duty-card').classList.toggle('active', dutyArr.length > 0);
    el('n-duty-card').style.display = 'block';
    fillList(el('n-duty'), dutyArr);
    el('n-notes-card').classList.toggle('active', notesArr.length > 0);
    el('n-notes-card').style.display = 'block';
    fillList(el('n-notes'), notesArr);

    // 落款
    el('n-dept').textContent = f.dept;
    var dObj = parseYmd(f.date);
    el('n-date').textContent = dObj ? cnDate(dObj) : f.date;
    el('n-seal').classList.toggle('hidden', !f.showSeal);
    el('n-seal-name').textContent = f.company ? squeezeName(f.company) : '公司';

    // 海报款
    applyFestivalColors(currentThemeKey());
    applyBackground();
    renderPosterAll();

    // 日历控件同步
    renderEditCalendar();
  }

  function getFestById(id) {
    for (var i = 0; i < DATA.festivals.length; i++) {
      if (DATA.festivals[i].id === id) return DATA.festivals[i];
    }
    return { name: '' };
  }

  function guessFestName(offKeys) {
    if (!offKeys.length) return '';
    var counts = {};
    offKeys.forEach(function (k) {
      for (var i = 0; i < DATA.festivals.length; i++) {
        if (DATA.festivals[i].off.indexOf(k) !== -1) {
          counts[DATA.festivals[i].name] = (counts[DATA.festivals[i].name] || 0) + 1;
        }
      }
    });
    var best = '', n = 0;
    for (var k in counts) { if (counts[k] > n) { n = counts[k]; best = k; } }
    return best;
  }

  /** 把公司名压缩成印章用短名 */
  function squeezeName(name) {
    var s = String(name).replace(/(有限公司|股份有限公司|有限责任公司|公司|集团)$/g, '');
    s = s.replace(/^[\u4e00-\u9fa5]{2,}省|^[\u4e00-\u9fa5]{2,}市/, '');
    if (s.length > 8) s = s.slice(0, 8);
    return s || name.slice(0, 8);
  }

  function fillList(node, arr) {
    node.innerHTML = '';
    if (!arr.length) { node.style.display = 'none'; return; }
    node.style.display = '';
    arr.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      node.appendChild(li);
    });
  }

  /** 收集通知单需要展示的月份：放假日期所在月 + 调休上班日期所在月 */
  function getNoticeMonths(offKeys) {
    var monthSet = [];
    offKeys.forEach(function (k) { pushMonth(monthSet, k); });
    Object.keys(state.work).forEach(function (k) { pushMonth(monthSet, k); });
    if (!monthSet.length) {
      var st = el('f-start').value;
      if (isValidYmd(st)) pushMonth(monthSet, st);
    }
    monthSet.sort();
    return monthSet;
  }

  /** 渲染通知单里的月份日历（公文款） */
  function renderNoticeCalendars(offKeys, showHl) {
    var wrap = el('n-cal-months');
    wrap.innerHTML = '';

    var monthSet = getNoticeMonths(offKeys);

    wrap.className = 'cal-months' + (monthSet.length === 1 ? ' single' : '');

    monthSet.forEach(function (mk, i) {
      wrap.appendChild(buildMonthCard(mk, showHl, i));
    });
  }

  function pushMonth(arr, key) {
    var p = key.split('-');
    var mk = p[0] + '-' + p[1];
    if (arr.indexOf(mk) === -1) arr.push(mk);
  }

  function buildMonthCard(monthKey, showHl, idx) {
    var p = monthKey.split('-');
    var y = Number(p[0]), m = Number(p[1]) - 1;

    var card = document.createElement('div');
    card.className = 'month-card';

    // 标题
    var head = document.createElement('div');
    head.className = 'month-title';
    var nameEl = document.createElement('span');
    nameEl.className = 'month-name';
    nameEl.textContent = y + '年' + (m + 1) + '月';
    head.appendChild(nameEl);

    // 本月放假天数
    var cnt = 0;
    Object.keys(state.off).forEach(function (k) {
      var q = k.split('-');
      if (Number(q[0]) === y && Number(q[1]) === m + 1) cnt++;
    });
    if (cnt > 0) {
      var badge = document.createElement('span');
      badge.className = 'month-badge';
      badge.textContent = '放假 ' + cnt + ' 天';
      head.appendChild(badge);
    }
    card.appendChild(head);

    // 网格
    var grid = document.createElement('div');
    grid.className = 'm-grid';

    ['日', '一', '二', '三', '四', '五', '六'].forEach(function (w, i) {
      var th = document.createElement('div');
      th.className = 'm-dow' + (i === 0 ? ' sun' : '') + (i === 6 ? ' we' : '');
      th.textContent = w;
      grid.appendChild(th);
    });

    var startDow = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    for (var i = 0; i < startDow; i++) {
      var b = document.createElement('div');
      b.className = 'm-cell blank';
      grid.appendChild(b);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dt = new Date(y, m, d);
      var key = ymd(dt);
      var dow = dt.getDay();
      var isOff = !!state.off[key];
      var isWork = !!state.work[key];

      var cell = document.createElement('div');
      cell.className = 'm-cell';
      if (dow === 0 || dow === 6) cell.classList.add('wk');
      if (isOff) cell.classList.add('off');
      if (isWork) cell.classList.add('work');

      var num = document.createElement('span');
      num.className = 'm-num';
      num.textContent = d;
      cell.appendChild(num);

      var lbl = document.createElement('span');
      lbl.className = 'm-lbl';
      var fname = festNameOf(key);
      if (isOff) lbl.textContent = fname ? fname.slice(0, 2) : '休';
      else if (isWork) lbl.textContent = '班';
      else if (fname) lbl.textContent = fname.slice(0, 2);
      cell.appendChild(lbl);

      // 高亮条
      if (showHl && isOff) {
        var prevOff = d > 1 && !!state.off[ymd(new Date(y, m, d - 1))];
        var nextOff = d < daysInMonth && !!state.off[ymd(new Date(y, m, d + 1))];
        // 只在同一行内相连
        var sameRowPrev = prevOff && (new Date(y, m, d - 1).getDay() !== 6);
        var sameRowNext = nextOff && (dow !== 6);

        if (prevOff && nextOff && sameRowPrev && sameRowNext) cell.classList.add('hl-mid');
        else if (nextOff && sameRowNext) cell.classList.add('hl-start');
        else if (prevOff && sameRowPrev) cell.classList.add('hl-end');
        else cell.classList.add('hl-single');
      }

      grid.appendChild(cell);
    }

    card.appendChild(grid);
    return card;
  }

  /* ---------------- 海报款渲染 ---------------- */

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /** 海报款整体渲染 */
  function renderPosterAll() {
    var slogan = el('f-p-slogan').value.trim();
    var pTitle = el('f-p-title').value.trim() || '欢度国庆';
    var calName = el('f-p-calname').value.trim() || '放假日历';
    var wish = el('f-p-wish').value.trim();
    var wishEn = el('f-p-wish-en').value.trim();

    el('p-slogan').textContent = slogan;
    el('p-title').textContent = pTitle;
    el('p-title2').textContent = pTitle;
    el('p-photo-mark').textContent = pTitle;
    el('p-mark2').textContent = pTitle;
    el('p-ribbon-text').textContent = calName;
    el('p-wish').textContent = wish;
    el('p-wish-en').textContent = wishEn;

    el('p-photo-img').src = resolvePhoto();

    renderPosterCalendar();
    renderPosterSections();
  }

  /** 当前应使用的配图：上传图 > 节日专属插图 > 通用占位图 */
  function resolvePhoto() {
    if (state.photo) return state.photo;
    if (state.autoPhoto) {
      var key = currentThemeKey();
      var t = FT[key];
      var pid = t && t.photo;
      if (pid && window.FESTIVAL_PHOTOS && window.FESTIVAL_PHOTOS[pid]) {
        return window.FESTIVAL_PHOTOS[pid];
      }
    }
    return PLACEHOLDER_PHOTO;
  }

  /** 海报日历（周一开头，含农历 / 节气 / 节日标签） */
  function renderPosterCalendar() {
    var wrap = el('p-cal');
    wrap.innerHTML = '';

    var offKeys = Object.keys(state.off).sort();
    var monthSet = getNoticeMonths(offKeys);
    if (!monthSet.length) monthSet = [state.editYear + '-' + pad(state.editMonth + 1)];

    monthSet.forEach(function (mk) {
      wrap.appendChild(buildPosterMonth(mk, monthSet.length > 1));
    });
  }

  function buildPosterMonth(monthKey, showName) {
    var p = monthKey.split('-');
    var y = Number(p[0]), m = Number(p[1]) - 1;

    var box = document.createElement('div');
    box.className = 'p-month';
    box.dataset.month = monthKey;

    if (showName) {
      var name = document.createElement('div');
      name.className = 'p-month-name';
      name.textContent = y + '年' + (m + 1) + '月';
      box.appendChild(name);
    }

    var grid = document.createElement('div');
    grid.className = 'pc-grid';

    var DOW = ['一', '二', '三', '四', '五', '六', '日'];
    DOW.forEach(function (w) {
      var th = document.createElement('div');
      th.className = 'pc-dow';
      th.textContent = w;
      grid.appendChild(th);
    });

    var firstDow = (new Date(y, m, 1).getDay() + 6) % 7;   // 周一 = 0
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var cells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

    for (var i = 0; i < cells; i++) {
      var dayNum = i - firstDow + 1;
      var d;
      if (dayNum < 1) d = new Date(y, m - 1, prevDays + dayNum);
      else if (dayNum > daysInMonth) d = new Date(y, m + 1, dayNum - daysInMonth);
      else d = new Date(y, m, dayNum);

      var key = ymd(d);
      var isOff = !!state.off[key];
      var isWork = !!state.work[key];
      var isPad = dayNum < 1 || dayNum > daysInMonth;

      var cell = document.createElement('div');
      cell.className = 'pc-cell';
      if (isPad) cell.classList.add('pad');
      if (isOff) cell.classList.add('off');
      if (isWork) cell.classList.add('work');

      var top = document.createElement('div');
      top.className = 'pc-top';

      // 补位格不画金圈/班标，避免与主月重复展示
      if (isOff && !isPad) {
        var cir = document.createElement('div');
        cir.className = 'pc-cir';
        var n1 = document.createElement('span');
        n1.className = 'pc-num';
        n1.textContent = d.getDate();
        cir.appendChild(n1);
        top.appendChild(cir);
      } else {
        var n2 = document.createElement('span');
        n2.className = 'pc-num';
        n2.textContent = d.getDate();
        top.appendChild(n2);
      }

      if (isWork && !isPad) {
        var ban = document.createElement('i');
        ban.className = 'pc-ban';
        ban.textContent = '班';
        top.appendChild(ban);
      }

      cell.appendChild(top);

      var lunar = document.createElement('div');
      lunar.className = 'pc-lunar';
      lunar.textContent = lunarLabel(d);
      cell.appendChild(lunar);

      grid.appendChild(cell);
    }

    box.appendChild(grid);
    return box;
  }

  /** 海报内容板块预览 */
  function renderPosterSections() {
    var box = el('p-sections');
    box.innerHTML = '';

    state.sections.forEach(function (s, i) {
      var sec = document.createElement('div');
      sec.className = 'p-section';

      var cap = document.createElement('div');
      cap.className = 'p-capsule';
      cap.innerHTML = '<span class="p-num">' + pad2(i + 1) + '</span>';
      var t = document.createElement('span');
      t.className = 'p-cap-t';
      t.textContent = s.title || ('板块' + pad2(i + 1));
      cap.appendChild(t);
      cap.insertAdjacentHTML('beforeend', FW_SVG);

      sec.appendChild(cap);

      if (String(s.body || '').trim()) {
        var body = document.createElement('div');
        body.className = 'p-sec-body';
        body.textContent = s.body;
        sec.appendChild(body);
      }

      box.appendChild(sec);
    });
  }

  /* ---------------- 板块编辑器 ---------------- */

  function buildSectionsForm() {
    var list = el('sectionList');
    list.innerHTML = '';

    state.sections.forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'sec-row';

      var head = document.createElement('div');
      head.className = 'sec-head';

      var idx = document.createElement('span');
      idx.className = 'sec-idx';
      idx.textContent = pad2(i + 1);

      var ti = document.createElement('input');
      ti.type = 'text';
      ti.value = s.title;
      ti.placeholder = '板块标题';
      ti.addEventListener('input', function () { s.title = this.value; render(); });

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn btn-mini sec-del';
      del.textContent = '删除';
      del.addEventListener('click', function () {
        if (state.sections.length <= 1) { toast('至少保留一个板块'); return; }
        state.sections.splice(i, 1);
        buildSectionsForm();
        render();
      });

      head.appendChild(idx);
      head.appendChild(ti);
      head.appendChild(del);

      var ta = document.createElement('textarea');
      ta.rows = 3;
      ta.value = s.body;
      ta.placeholder = '板块内容（换行分段，空内容则不显示）';
      ta.addEventListener('input', function () { s.body = this.value; s.dirty = true; render(); });

      row.appendChild(head);
      row.appendChild(ta);
      list.appendChild(row);
    });
  }

  /* ---------------- 模板切换 ---------------- */

  function applyTemplate(tpl) {
    state.template = tpl;

    el('panelPoster').style.display = tpl === 'poster' ? 'block' : 'none';
    ['panelCompany', 'panelBody', 'panelDuty'].forEach(function (id) {
      el(id).style.display = tpl === 'official' ? 'block' : 'none';
    });

    el('noticePoster').classList.toggle('hidden', tpl !== 'poster');
    el('notice').classList.toggle('hidden', tpl !== 'official');

    var chips = el('templateChips').querySelectorAll('.chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('active', chips[i].dataset.tpl === tpl);
    }

    render();
  }

  /* ---------------- 导出 ---------------- */

  /** 当前是否运行在 file:// 本地直开环境（浏览器会拦截此类下载） */
  function isFileProtocol() {
    return location.protocol === 'file:';
  }

  /** dataURL -> Blob */
  function dataURLtoBlob(dataURL) {
    var parts = dataURL.split(',');
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
    var bin = atob(parts[1]);
    var len = bin.length;
    var arr = new Uint8Array(len);
    for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /** 兜底：弹出大图，供右键另存 / 长按保存 / 在新标签打开 */
  function showImageFallback(dataURL, fileName) {
    var mask = document.createElement('div');
    mask.className = 'img-modal-mask';

    var box = document.createElement('div');
    box.className = 'img-modal';

    var head = document.createElement('div');
    head.className = 'img-modal-head';
    var title = document.createElement('span');
    title.className = 'img-modal-title';
    title.textContent = '图片已生成 · ' + fileName;
    var actions = document.createElement('div');
    actions.className = 'img-modal-actions';

    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'btn btn-primary btn-mini';
    openBtn.textContent = '在新标签打开';
    openBtn.addEventListener('click', function () {
      var w = window.open();
      if (w) {
        w.document.write('<title>' + fileName + '</title><body style="margin:0;background:#222"><img src="' + dataURL + '" style="width:100%"></body>');
        w.document.close();
      } else {
        toast('新标签被拦截，请改用右键另存为');
      }
    });

    var dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'btn btn-mini btn-ghost';
    dlBtn.textContent = '再试一次下载';
    dlBtn.addEventListener('click', function () {
      var blob = dataURLtoBlob(dataURL);
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('已再次尝试下载，请查看下载栏');
    });

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-mini btn-ghost';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', function () { document.body.removeChild(mask); });

    actions.appendChild(openBtn);
    actions.appendChild(dlBtn);
    actions.appendChild(closeBtn);
    head.appendChild(title);
    head.appendChild(actions);

    var tip = document.createElement('p');
    tip.className = 'img-modal-tip';
    tip.innerHTML = '浏览器拦住了自动下载。请在上方图片上 <b>右键 → 图片另存为</b> 保存；' +
      '或点击「在新标签打开」后再右键保存。<br>' +
      '建议：使用文件夹中的「一键启动.bat」通过本地服务打开，下载将直接生效。';

    var img = document.createElement('img');
    img.className = 'img-modal-img';
    img.src = dataURL;
    img.alt = fileName;

    box.appendChild(head);
    box.appendChild(tip);
    box.appendChild(img);
    mask.appendChild(box);
    mask.addEventListener('click', function (e) { if (e.target === mask) document.body.removeChild(mask); });
    document.body.appendChild(mask);
  }

  function exportImage() {
    var node = el('capture');
    var f = getForm();

    if (typeof html2canvas !== 'function') {
      toast('图片库未加载，请检查 vendor/html2canvas.min.js');
      return;
    }

    var btn = el('btnExport');
    btn.disabled = true;
    btn.textContent = '正在生成…';

    // 临时取消容器高度限制，确保完整截图
    var scrollBox = document.querySelector('.preview-scroll');
    var oldMax = scrollBox.style.maxHeight;
    var oldOver = scrollBox.style.overflow;
    scrollBox.style.maxHeight = 'none';
    scrollBox.style.overflow = 'visible';

    html2canvas(node, {
      scale: f.scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight
    }).then(function (canvas) {
      scrollBox.style.maxHeight = oldMax;
      scrollBox.style.overflow = oldOver;

      var name;
      if (state.template === 'poster') {
        name = (el('f-p-title').value.trim() || '放假通知') + '-放假通知.png';
      } else {
        name = (f.title || '放假通知') + '.png';
      }
      name = name.replace(/[\\/:*?"<>|]/g, '_');
      var dataURL = canvas.toDataURL('image/png');

      btn.disabled = false;
      btn.textContent = '下载图片';

      // file:// 直接打开时浏览器会静默拦截下载，直接走兜底弹窗
      if (isFileProtocol()) {
        toast('本地直开模式下载受限，已为你打开图片预览');
        showImageFallback(dataURL, name);
        return;
      }

      try {
        var blob = dataURLtoBlob(dataURL);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        toast('图片已生成，请查看浏览器下载目录');
      } catch (e) {
        // 下载链路异常时兜底
        showImageFallback(dataURL, name);
      }
    }).catch(function (err) {
      scrollBox.style.maxHeight = oldMax;
      scrollBox.style.overflow = oldOver;
      btn.disabled = false;
      btn.textContent = '下载图片';
      console.error(err);
      toast('生成失败：' + (err && err.message ? err.message : '未知错误'));
    });
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    // 所有输入实时联动
    var ids = ['f-company', 'f-title', 'f-dept', 'f-date', 'f-salutation',
      'f-body', 'f-items', 'f-requirements', 'f-duty', 'f-notes', 'f-start', 'f-end'];
    ids.forEach(function (id) {
      el(id).addEventListener('input', function () {
        // 手动改日期或调休时，取消节日高亮选中
        if (id === 'f-start' || id === 'f-end') {
          state.festival = null;
          markActiveChip(null);
        }
        render();
      });
    });

    el('f-workdays').addEventListener('input', function () {
      state.work = parseWorkdays(el('f-workdays').value);
      state.festival = null;
      markActiveChip(null);
      render();
    });

    el('f-scale').addEventListener('change', render);

    el('f-seal').addEventListener('change', render);
    el('f-showHl').addEventListener('change', render);

    // 背景样式
    el('f-bgmode').addEventListener('change', function () {
      state.bgMode = this.value;
      applyBackground();
      renderPosterAll();
    });

    // 配色主题手动覆盖
    el('f-theme').addEventListener('change', function () {
      state.themeOverride = this.value;
      applyFestivalColors(currentThemeKey());
      applyBackground();
      renderPosterAll();
    });

    // 节日默认插图开关
    el('f-autophoto').addEventListener('change', function () {
      state.autoPhoto = this.checked;
      renderPosterAll();
    });

    el('f-month').addEventListener('change', function () {
      var p = this.value.split('-');
      state.editYear = Number(p[0]);
      state.editMonth = Number(p[1]) - 1;
      renderEditCalendar();
    });

    el('btnPrevMonth').addEventListener('click', function () {
      state.editMonth--;
      if (state.editMonth < 0) { state.editMonth = 11; state.editYear--; }
      syncMonthSelect();
      renderEditCalendar();
    });

    el('btnNextMonth').addEventListener('click', function () {
      state.editMonth++;
      if (state.editMonth > 11) { state.editMonth = 0; state.editYear++; }
      syncMonthSelect();
      renderEditCalendar();
    });

    el('btnClearCal').addEventListener('click', function () {
      state.off = Object.create(null);
      state.work = Object.create(null);
      state.festival = null;
      markActiveChip(null);
      el('f-workdays').value = '';
      render();
      toast('已清空日历标记');
    });

    el('btnSelectRange').addEventListener('click', function () {
      var s = parseYmd(el('f-start').value);
      var e = parseYmd(el('f-end').value);
      if (!s || !e) { toast('请先填写完整的假期开始与结束日期'); return; }
      if (e < s) { var t = s; s = e; e = t; }
      if ((e - s) / 86400000 > 60) { toast('区间过长（超过60天），请检查日期'); return; }

      state.off = Object.create(null);
      var cur = s;
      while (cur <= e) {
        state.off[ymd(cur)] = true;
        cur = addDays(cur, 1);
      }
      el('f-workdays').value = fmtWorkdays(state.work);
      render();
      toast('已按区间框选 ' + Object.keys(state.off).length + ' 天');
    });

    el('btnExport').addEventListener('click', exportImage);
    el('btnPrint').addEventListener('click', function () { window.print(); });

    // 模板切换
    var tchips = el('templateChips').querySelectorAll('.chip');
    for (var i = 0; i < tchips.length; i++) {
      tchips[i].addEventListener('click', function () {
        applyTemplate(this.dataset.tpl);
      });
    }

    // 海报字段
    ['f-p-slogan', 'f-p-title', 'f-p-calname', 'f-p-wish', 'f-p-wish-en'].forEach(function (id) {
      el(id).addEventListener('input', renderPosterAll);
    });

    // 配图上传
    el('f-photo').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast('请选择图片文件'); return; }
      if (file.size > 8 * 1024 * 1024) { toast('图片过大（超过 8MB），请压缩后再上传'); return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        state.photo = e.target.result;
        renderPosterAll();
        toast('配图已更新');
      };
      reader.readAsDataURL(file);
    });

    el('btnPhotoClear').addEventListener('click', function () {
      state.photo = null;
      el('f-photo').value = '';
      renderPosterAll();
      toast('已恢复默认插图');
    });

    // 板块增删（行内输入/删除在 buildSectionsForm 中绑定）
    el('btnAddSection').addEventListener('click', function () {
      if (state.sections.length >= 6) { toast('最多 6 个板块'); return; }
      state.sections.push({ title: '板块标题', body: '', dirty: true });
      buildSectionsForm();
      render();
    });

    el('btnReset').addEventListener('click', function () {
      if (!confirm('确定重置为默认内容吗？当前填写的内容将丢失。')) return;
      location.reload();
    });

    // 窗口尺寸变化时重绘日历控件（保证高亮条位置准确）
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(renderEditCalendar, 150);
    });
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    document.documentElement.setAttribute('data-theme', 'red');

    buildFestivalChips();
    buildThemeSelect();
    buildSectionsForm();

    // 默认海报款，默认加载国庆节
    applyTemplate('poster');
    applyFestival('guoqing');

    bind();
    syncMonthSelect();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
