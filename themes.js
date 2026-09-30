/**
 * 节日主题配置
 * 每个节日一套：配色 + 背景图案 + 装饰元素 + 默认文案 + 默认配图
 *
 * 配色字段（均为可读性调优后的值）：
 *   brand    主色（标题、强调、日历金圈起始色）
 *   brand2   渐变亮端
 *   ink      深色（印章、深字）
 *   soft     浅底（次级卡片背景）
 *   gold     点缀色（撒金、高亮条）
 *   goldSoft 点缀浅底
 *   circle   日历金圈渐变（起 / 止）
 *   lunar    日历农历字颜色
 *   pageBg   海报页背景（氛围底纹的基色）
 */

/* ---------------- 背景图案（内联 SVG data URI，随配色动态生成） ---------------- */

/** 把 SVG 片段包装为 data URI（必须带 width/height，否则 html2canvas 无法栅格化） */
function svgURI(inner, w, h, bg) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
    '" viewBox="0 0 ' + w + ' ' + h + '">' +
    (bg ? '<rect width="' + w + '" height="' + h + '" fill="' + bg + '"/>' : '') +
    inner + '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * 生成节日氛围背景：四角装饰 + 淡色纹样平铺
 * @param {object} cfg 主题配色
 * @param {string} corner 角落装饰 SVG（已按 220x220 设计）
 * @param {string} tile 平铺纹样 SVG（已按 120x120 设计，透明度很低）
 */
function makeAmbientBg(cfg, corner, tile) {
  var W = 880, H = 1160;
  var inner =
    (tile ? '<defs><pattern id="t" width="120" height="120" patternUnits="userSpaceOnUse">' + tile + '</pattern></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#t)"/>' : '') +
    // 左上
    '<g opacity="0.5">' + corner + '</g>' +
    // 右上（镜像）
    '<g opacity="0.5" transform="translate(' + W + ',0) scale(-1,1)">' + corner + '</g>' +
    // 左下
    '<g opacity="0.32" transform="translate(0,' + H + ') scale(1,-1)">' + corner + '</g>' +
    // 右下
    '<g opacity="0.32" transform="translate(' + W + ',' + H + ') scale(-1,-1)">' + corner + '</g>';
  return svgURI(inner, W, H, cfg.pageBg);
}

/* ---------------- 角落装饰（220x220 视口） ---------------- */

/** 祥云 + 灯笼（春节） */
var CORNER_CNY =
  '<g transform="translate(0,0)">' +
  // 灯笼
  '<g transform="translate(150,18)">' +
  '<path d="M28 0v14" stroke="#c8a24a" stroke-width="2.6" fill="none"/>' +
  '<ellipse cx="28" cy="42" rx="22" ry="25" fill="#e8453c"/>' +
  '<ellipse cx="28" cy="42" rx="10" ry="25" fill="#f0736a" opacity=".55"/>' +
  '<rect x="19" y="14" width="18" height="5" rx="2" fill="#c8a24a"/>' +
  '<rect x="19" y="65" width="18" height="5" rx="2" fill="#c8a24a"/>' +
  '<path d="M28 70v14" stroke="#c8a24a" stroke-width="2.4"/>' +
  '<path d="M22 84l6 12 6-12z" fill="#c8a24a"/>' +
  '</g>' +
  // 祥云
  '<g fill="#e8a0a0" opacity=".5">' +
  '<path d="M10 176c-8 0-13-6-13-13s6-13 14-12c2-9 10-15 19-15 8 0 15 4 18 11 3-2 7-3 11-3 10 0 18 8 18 18 0 1 0 2-1 3 6 2 10 8 10 15 0 9-8 16-18 16z"/>' +
  '<path d="M0 208c0-9 8-16 17-15 2-8 10-14 18-14 9 0 17 6 19 14 3-1 6-1 9 0 8 2 13 9 13 17z" opacity=".7"/>' +
  '</g>' +
  '</g>';

/** 烟花（国庆） */
var CORNER_NAT =
  '<g transform="translate(60,10)">' +
  '<g stroke-linecap="round" fill="none">' +
  '<g stroke="#f0c85a" stroke-width="3">' +
  '<path d="M60 56V20"/><path d="M60 56L36 26"/><path d="M60 56L84 26"/>' +
  '<path d="M60 56L20 46"/><path d="M60 56L100 46"/>' +
  '<path d="M60 56L28 76"/><path d="M60 56L92 76"/>' +
  '</g>' +
  '<g stroke="#ffe9a8" stroke-width="2" opacity=".85">' +
  '<path d="M60 56V8"/><path d="M60 56L18 34"/><path d="M60 56L102 34"/>' +
  '<path d="M60 56L14 62"/><path d="M60 56L106 62"/>' +
  '<path d="M60 56L34 92"/><path d="M60 56L86 92"/>' +
  '</g>' +
  '</g>' +
  '<circle cx="60" cy="56" r="5" fill="#ffe9a8"/>' +
  '<g fill="#ffd873" opacity=".9">' +
  '<circle cx="30" cy="18" r="2.6"/><circle cx="92" cy="16" r="2.2"/>' +
  '<circle cx="12" cy="78" r="2.4"/><circle cx="108" cy="80" r="2.6"/>' +
  '<circle cx="60" cy="104" r="2.2"/><circle cx="44" cy="42" r="1.8"/>' +
  '</g>' +
  '</g>' +
  // 五角星
  '<g transform="translate(14,140)">' +
  '<path d="M22 0l6.6 13.4L43 15l-10.5 10.2L35 40l-13-6.9L9 40l2.5-14.8L1 15l14.4-1.6z" fill="#f0c85a" opacity=".85"/>' +
  '</g>';

/** 龙舟 + 粽叶（端午） */
var CORNER_DW =
  '<g transform="translate(0,10)">' +
  // 粽叶
  '<g transform="translate(8,10)" fill="#5aa96f" opacity=".85">' +
  '<path d="M40 0c22 14 30 40 22 66-14-8-26-26-30-46z"/>' +
  '<path d="M40 0c-22 14-30 40-22 66 14-8 26-26 30-46z" opacity=".75"/>' +
  '<path d="M40 6v54" stroke="#2f7a48" stroke-width="2" fill="none" opacity=".7"/>' +
  '</g>' +
  // 龙舟
  '<g transform="translate(96,54)">' +
  '<path d="M0 26c14-14 40-20 66-16 12 2 22 6 30 12-10 6-22 10-36 12-22 3-46 0-60-8z" fill="#3f9e5e"/>' +
  '<path d="M0 26l-14-6 6 14z" fill="#2f7a48"/>' +
  '<path d="M96 22c6-4 12-2 14 4-8 2-14 0-14-4z" fill="#e5a83c"/>' +
  '<g stroke="#e5a83c" stroke-width="2.4" stroke-linecap="round">' +
  '<path d="M22 22l6-14"/><path d="M44 18l6-14"/><path d="M66 16l6-14"/>' +
  '</g>' +
  '<g fill="#f2d9a0" opacity=".9">' +
  '<path d="M10 32h76" stroke="#e5a83c" stroke-width="1.6"/>' +
  '</g>' +
  '</g>' +
  // 水波
  '<g stroke="#7fc79a" stroke-width="2.6" fill="none" opacity=".6">' +
  '<path d="M0 170c14-10 28 10 42 0s28 10 42 0 28 10 42 0 28 10 42 0"/>' +
  '<path d="M0 194c14-10 28 10 42 0s28 10 42 0 28 10 42 0 28 10 42 0" opacity=".7"/>' +
  '</g>' +
  '</g>';

/** 圆月 + 桂花枝（中秋） */
var CORNER_MID =
  '<g transform="translate(0,0)">' +
  // 月亮
  '<g transform="translate(146,16)">' +
  '<circle cx="40" cy="40" r="38" fill="#f7dc9a" opacity=".92"/>' +
  '<circle cx="40" cy="40" r="48" fill="#f7dc9a" opacity=".2"/>' +
  '<g fill="#eed08a" opacity=".55">' +
  '<circle cx="28" cy="30" r="7"/><circle cx="52" cy="48" r="5"/><circle cx="38" cy="56" r="4"/>' +
  '</g>' +
  '</g>' +
  // 玉兔剪影
  '<g transform="translate(120,74)" fill="#c9a45e" opacity=".8">' +
  '<ellipse cx="18" cy="20" rx="14" ry="10"/>' +
  '<circle cx="34" cy="14" r="7"/>' +
  '<path d="M31 8c-2-8 0-12 3-12s4 5 2 12z"/>' +
  '<path d="M36 8c0-8 3-11 5-10s2 6-2 11z"/>' +
  '<path d="M6 20c-6-2-8-8-6-14 4 4 8 8 8 12z" opacity=".7"/>' +
  '</g>' +
  // 桂花枝
  '<g transform="translate(12,140)">' +
  '<path d="M0 60C20 40 44 20 78 8" stroke="#a8916a" stroke-width="2.6" fill="none"/>' +
  '<g fill="#f0c85a" opacity=".9">' +
  '<circle cx="26" cy="34" r="6"/><circle cx="42" cy="24" r="5"/>' +
  '<circle cx="58" cy="16" r="5.5"/><circle cx="72" cy="10" r="4.5"/>' +
  '</g>' +
  '<g fill="#3f7a5a" opacity=".75">' +
  '<path d="M20 40c10-8 20-4 22 4-10 4-18 2-22-4z"/>' +
  '<path d="M52 20c10-8 20-4 22 4-10 4-18 2-22-4z"/>' +
  '</g>' +
  '</g>' +
  '</g>';

/** 柳枝 + 细雨（清明） */
var CORNER_QM =
  '<g transform="translate(0,0)">' +
  '<g stroke="#7fb08a" stroke-width="3" fill="none" stroke-linecap="round">' +
  '<path d="M20 0c6 30 4 62-4 92"/>' +
  '<g stroke-width="2" opacity=".9">' +
  '<path d="M17 14c-10 4-18 12-22 22"/>' +
  '<path d="M18 34c-10 4-18 12-22 22"/>' +
  '<path d="M18 54c-10 4-18 12-22 22"/>' +
  '<path d="M16 26c10 2 18 8 24 18"/>' +
  '<path d="M16 48c10 2 18 8 24 18"/>' +
  '</g>' +
  '</g>' +
  '<g fill="#8fc49a" opacity=".8">' +
  '<ellipse cx="-2" cy="42" rx="10" ry="4" transform="rotate(-30)"/>' +
  '<ellipse cx="-2" cy="62" rx="9" ry="3.6" transform="rotate(-30)"/>' +
  '<ellipse cx="42" cy="52" rx="10" ry="4" transform="rotate(28)"/>' +
  '</g>' +
  // 细雨
  '<g stroke="#a8c8d8" stroke-width="2" stroke-linecap="round" opacity=".7">' +
  '<path d="M70 30l-5 14"/><path d="M96 52l-5 14"/><path d="M124 26l-5 14"/>' +
  '<path d="M150 62l-5 14"/><path d="M182 40l-5 14"/><path d="M86 92l-5 14"/>' +
  '<path d="M138 108l-5 14"/><path d="M58 124l-5 14"/>' +
  '</g>' +
  '</g>';

/** 齿轮 + 劳动工具（劳动节） */
var CORNER_LD =
  '<g transform="translate(0,0)">' +
  '<g transform="translate(28,20)">' +
  '<g fill="#d98a5a" opacity=".85">' +
  '<path d="M56 0l8 0 2 12 10 4 10-7 6 6-7 10 4 10 12 2 0 8-12 2-4 10 7 10-6 6-10-7-10 4-2 12-8 0-2-12-10-4-10 7-6-6 7-10-4-10-12-2 0-8 12-2 4-10-7-10 6-6 10 7 10-4z"/>' +
  '</g>' +
  '<circle cx="60" cy="52" r="30" fill="' + '#f7f2ec"/>' +
  '<circle cx="60" cy="52" r="17" fill="#d98a5a" opacity=".65"/>' +
  '<circle cx="60" cy="52" r="9" fill="#f7f2ec"/>' +
  '</g>' +
  // 扳手
  '<g transform="translate(136,120)" fill="#c9a45e" opacity=".85">' +
  '<path d="M0 0c-8 0-15 7-15 15 0 3 1 6 3 9L-2 14l6 6-10 10c3 2 6 3 9 3 8 0 15-7 15-15 0-2 0-3-1-5l16-16-4-4L3-3c-1-1-2-1-3-1z"/>' +
  '</g>' +
  '<g stroke="#e5a83c" stroke-width="2.4" fill="none" opacity=".7">' +
  '<path d="M12 168h60"/><path d="M24 190h44"/>' +
  '</g>' +
  '</g>';

/** 气球 + 烟花（元旦） */
var CORNER_NY =
  '<g transform="translate(0,0)">' +
  '<g transform="translate(34,10)">' +
  '<ellipse cx="26" cy="30" rx="20" ry="25" fill="#e8735a"/>' +
  '<ellipse cx="19" cy="22" rx="6" ry="9" fill="#f8a892" opacity=".7"/>' +
  '<path d="M26 55l4 8-8 0z" fill="#c9a45e"/>' +
  '<path d="M26 63c8 10-8 14 0 24 8 10-6 14 0 22" stroke="#c9a45e" stroke-width="1.8" fill="none"/>' +
  '</g>' +
  '<g transform="translate(112,30)">' +
  '<ellipse cx="24" cy="28" rx="18" ry="23" fill="#e8c05a"/>' +
  '<ellipse cx="18" cy="20" rx="5" ry="8" fill="#f7e2a0" opacity=".75"/>' +
  '<path d="M24 51l4 7-8 0z" fill="#c9a45e"/>' +
  '<path d="M24 58c8 10-8 14 0 24" stroke="#c9a45e" stroke-width="1.8" fill="none"/>' +
  '</g>' +
  '<g stroke-linecap="round" fill="none" opacity=".9">' +
  '<g stroke="#f0c85a" stroke-width="2.4">' +
  '<path d="M16 128v-18"/><path d="M16 128L2 114"/><path d="M16 128L30 114"/>' +
  '<path d="M16 128L0 132"/><path d="M16 128L32 132"/>' +
  '</g>' +
  '</g>' +
  '<circle cx="16" cy="128" r="3.6" fill="#ffe9a8"/>' +
  '</g>';

/** 平铺淡纹（各节日符号，透明度极低） */
var TILES = {
  cny: '<g fill="#ffffff" opacity="0.055"><path d="M30 20h60v10H30z"/><path d="M52 8h16v34H52z"/><g transform="rotate(45 90 90)"><path d="M70 85h40v10H70z"/><path d="M85 70h10v40H85z"/></g><circle cx="20" cy="100" r="7"/><circle cx="60" cy="60" r="5"/></g>',
  nat: '<g fill="#ffffff" opacity="0.05"><path d="M60 18l7.6 15.4L84 35.6l-12 11.7L74.8 66 60 58 45.2 66l2.8-18.7-12-11.7 16.4-2.2z"/><circle cx="22" cy="96" r="4"/><circle cx="100" cy="24" r="5"/></g>',
  dw: '<g fill="#ffffff" opacity="0.055"><path d="M60 24c18 12 24 34 18 56-12-8-20-22-24-40z"/><path d="M60 24c-18 12-24 34-18 56 12-8 20-22 24-40z"/><path d="M20 100c10-7 20 7 30 0s20 7 30 0" stroke="#ffffff" stroke-width="3" fill="none" opacity=".7"/></g>',
  mid: '<g fill="#ffffff" opacity="0.055"><circle cx="60" cy="52" r="30"/><path d="M30 96c14-10 30-6 36 6-16 6-30 2-36-6z"/><circle cx="24" cy="20" r="4"/><circle cx="102" cy="88" r="5"/></g>',
  qm: '<g stroke="#ffffff" opacity="0.06" fill="none" stroke-width="3" stroke-linecap="round"><path d="M30 14v40"/><path d="M30 30c-10 4-16 12-18 22"/><path d="M30 44c10 4 16 12 18 22"/><path d="M86 70v34"/><path d="M86 84c-8 4-14 10-16 18"/><path d="M86 96c8 4 14 10 16 18"/></g>',
  ld: '<g fill="#ffffff" opacity="0.055"><path d="M60 26l6 0 1.4 10 8 3 7-6 4 4-6 7 3 8 10 1.4v6l-10 1.4-3 8 6 7-4 4-7-6-8 3-1.4 10-6 0-1.4-10-8-3-7 6-4-4 6-7-3-8-10-1.4v-6l10-1.4 3-8-6-7 4-4 7 6 8-3z"/><circle cx="60" cy="60" r="11" fill="#fff"/></g>',
  ny: '<g fill="#ffffff" opacity="0.05"><circle cx="40" cy="40" r="16"/><circle cx="86" cy="80" r="12"/><path d="M108 20v10M103 25h10" stroke="#ffffff" stroke-width="3" fill="none"/></g>'
};

/* ---------------- 7 套法定节假日主题 ---------------- */

window.FESTIVAL_THEMES = {

  /* ===== 元旦 ===== */
  yuandan: {
    key: 'yuandan',
    label: '元旦',
    colors: {
      brand: '#1f6fb2', brand2: '#3d9bd9', ink: '#155083',
      soft: '#e9f3fb', gold: '#e8b64a', goldSoft: '#fdf5e2',
      circle: ['#5cb3e6', '#2a80c4'],
      lunar: '#e0973c', pageBg: '#f4f9fe'
    },
    text: {
      slogan: '新年伊始 万象更新',
      title: '元旦快乐',
      wish: '元旦快乐',
      wishEn: '2026 NEW YEAR'
    },
    corner: CORNER_NY,
    tile: TILES.ny,
    photo: 'newyear'
  },

  /* ===== 春节 ===== */
  chunjie: {
    key: 'chunjie',
    label: '春节',
    colors: {
      brand: '#c8102e', brand2: '#e8453c', ink: '#8f0a1f',
      soft: '#fdecef', gold: '#d4a03a', goldSoft: '#fdf3e0',
      circle: ['#f9c440', '#ef8f1f'],
      lunar: '#e8973c', pageBg: '#fff8f5'
    },
    text: {
      slogan: '恭贺新禧 阖家团圆',
      title: '恭贺新禧',
      wish: '新春快乐',
      wishEn: '2026 CHINESE NEW YEAR'
    },
    corner: CORNER_CNY,
    tile: TILES.cny,
    photo: 'cny'
  },

  /* ===== 清明节 ===== */
  qingming: {
    key: 'qingming',
    label: '清明节',
    colors: {
      brand: '#3f7d6a', brand2: '#5fa88e', ink: '#2b5c4d',
      soft: '#e8f3ee', gold: '#a8b86a', goldSoft: '#f2f6e6',
      circle: ['#8fc9b0', '#4f9a7e'],
      lunar: '#7f9a5f', pageBg: '#f5faf7'
    },
    text: {
      slogan: '慎终追远 春和景明',
      title: '清明安康',
      wish: '清明安康',
      wishEn: '2026 QINGMING'
    },
    corner: CORNER_QM,
    tile: TILES.qm,
    photo: 'spring'
  },

  /* ===== 劳动节 ===== */
  laodong: {
    key: 'laodong',
    label: '劳动节',
    colors: {
      brand: '#b8451f', brand2: '#d9703c', ink: '#8c3414',
      soft: '#fdefe8', gold: '#d9a03a', goldSoft: '#fdf4e2',
      circle: ['#f0b455', '#d97b25'],
      lunar: '#cf8a3c', pageBg: '#fef9f5'
    },
    text: {
      slogan: '致敬劳动 奋斗光荣',
      title: '劳动节快乐',
      wish: '劳动节快乐',
      wishEn: '2026 LABOUR DAY'
    },
    corner: CORNER_LD,
    tile: TILES.ld,
    photo: 'labour'
  },

  /* ===== 端午节 ===== */
  duanwu: {
    key: 'duanwu',
    label: '端午节',
    colors: {
      brand: '#1f7a55', brand2: '#3f9e6e', ink: '#155c3e',
      soft: '#e8f5ee', gold: '#d4a83a', goldSoft: '#fdf5e0',
      circle: ['#7fc98a', '#3f9e5e'],
      lunar: '#c9973c', pageBg: '#f4faf6'
    },
    text: {
      slogan: '粽香四溢 端午安康',
      title: '端午安康',
      wish: '端午安康',
      wishEn: '2026 DRAGON BOAT FESTIVAL'
    },
    corner: CORNER_DW,
    tile: TILES.dw,
    photo: 'duanwu'
  },

  /* ===== 中秋节 ===== */
  zhongqiu: {
    key: 'zhongqiu',
    label: '中秋节',
    colors: {
      brand: '#8a5a1f', brand2: '#b8853c', ink: '#6b4415',
      soft: '#faf3e4', gold: '#d9a83a', goldSoft: '#fdf6e4',
      circle: ['#f0c85a', '#d9952e'],
      lunar: '#c09040', pageBg: '#fdfaf3'
    },
    text: {
      slogan: '月满中秋 阖家团圆',
      title: '中秋团圆',
      wish: '中秋节快乐',
      wishEn: '2026 MID-AUTUMN FESTIVAL'
    },
    corner: CORNER_MID,
    tile: TILES.mid,
    photo: 'moon'
  },

  /* ===== 国庆节 ===== */
  guoqing: {
    key: 'guoqing',
    label: '国庆节',
    colors: {
      brand: '#c01722', brand2: '#e8453c', ink: '#8f0a18',
      soft: '#fdecec', gold: '#f0c85a', goldSoft: '#fdf3e0',
      circle: ['#f9c440', '#ef8f1f'],
      lunar: '#e8973c', pageBg: '#fff8f6'
    },
    text: {
      slogan: '欢度国庆 共谱华章',
      title: '欢度国庆',
      wish: '国庆节快乐',
      wishEn: '2026 NATIONAL DAY'
    },
    corner: CORNER_NAT,
    tile: TILES.nat,
    photo: 'national'
  }
};

/** 生成某节日的氛围背景 dataURI */
window.buildFestivalBg = function (key) {
  var t = window.FESTIVAL_THEMES[key];
  if (!t) return '';
  return makeAmbientBg(t.colors, t.corner, t.tile);
};

/**
 * 节日专属「默认配图」（用户未上传时使用）
 * 每个节日一幅主题插画，尺寸必须显式声明，否则 html2canvas 无法栅格化
 */
window.FESTIVAL_PHOTOS = {

  /* 国庆：晴空 + 华表屋檐 + 五星红旗 */
  national: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fcbee"/><stop offset="1" stop-color="#dcefFB"/></linearGradient>' +
    '<linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a15c"/><stop offset="1" stop-color="#9a743c"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    '<circle cx="150" cy="100" r="44" fill="#fdf3d8" opacity=".8"/>' +
    '<ellipse cx="400" cy="112" rx="132" ry="19" fill="#fff" opacity=".5"/>' +
    '<ellipse cx="600" cy="70" rx="88" ry="13" fill="#fff" opacity=".38"/>' +
    // 红旗
    '<g transform="translate(120,180)">' +
    '<path d="M0 0v170" stroke="#8a6534" stroke-width="7"/>' +
    '<path d="M4 6c60-22 110 26 170 4v74c-60 22-110-26-170-4z" fill="#d81e26"/>' +
    '<g fill="#f5d24a"><path d="M44 22l5.4 11 12-1.6-8.6 8.4 2.6 11.8-11.4-6-11.4 6 2.6-11.8-8.6-8.4 12 1.6z"/>' +
    '<circle cx="80" cy="24" r="3.4"/><circle cx="96" cy="40" r="3.4"/><circle cx="88" cy="62" r="3.4"/><circle cx="64" cy="64" r="3.4"/></g>' +
    '</g>' +
    // 屋檐
    '<path d="M840 168C716 184 596 226 496 292c-60 40-100 100-124 168h468z" fill="url(#rf)"/>' +
    '<path d="M840 208C726 224 620 264 530 324c-54 36-88 88-108 136h418z" fill="#8a6534" opacity=".5"/>' +
    '<g fill="#7d5a2c"><circle cx="806" cy="182" r="9"/><circle cx="770" cy="188" r="8"/><circle cx="736" cy="196" r="8"/>' +
    '<circle cx="703" cy="206" r="7"/><circle cx="672" cy="218" r="7"/><circle cx="643" cy="231" r="6"/>' +
    '<circle cx="616" cy="245" r="6"/><circle cx="591" cy="260" r="5"/></g>' +
    '<path d="M560 268c-50 42-90 112-110 192h60c16-70 50-130 95-170z" fill="#6f8f5e" opacity=".6"/>',
    840, 460),

  /* 春节：灯笼 + 窗花 + 红梅枝 */
  cny: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9e2"/><stop offset="1" stop-color="#fff6ef"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    '<g opacity=".3" fill="#e8a0a0"><circle cx="120" cy="90" r="60"/><circle cx="720" cy="380" r="80"/></g>' +
    // 灯笼串
    '<path d="M0 40C120 90 300 90 420 40s300-50 420 0" stroke="#c8a24a" stroke-width="2.6" fill="none"/>' +
    (function () {
      var lamps = '';
      [150, 300, 420, 560, 700].forEach(function (x, i) {
        var y = i === 2 ? 66 : 62;
        lamps += '<g transform="translate(' + x + ',' + y + ')">' +
          '<path d="M0-6v14" stroke="#c8a24a" stroke-width="2.4"/>' +
          '<ellipse cx="0" cy="42" rx="30" ry="34" fill="#e8453c"/>' +
          '<ellipse cx="-8" cy="38" rx="12" ry="32" fill="#f0736a" opacity=".5"/>' +
          '<rect x="-13" y="8" width="26" height="6" rx="2.6" fill="#c8a24a"/>' +
          '<rect x="-13" y="70" width="26" height="6" rx="2.6" fill="#c8a24a"/>' +
          '<path d="M0 78v16" stroke="#c8a24a" stroke-width="2.4"/>' +
          '<path d="M-7 94l7 14 7-14z" fill="#c8a24a"/>' +
          '<text x="0" y="50" font-size="24" fill="#f5d24a" text-anchor="middle" font-family="serif">福</text>' +
          '</g>';
      });
      return lamps;
    })() +
    // 红梅枝
    '<g transform="translate(20,300)">' +
    '<path d="M0 160C60 110 140 70 240 46" stroke="#8a5a3a" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<path d="M120 92c-30-12-50-30-56-56" stroke="#8a5a3a" stroke-width="4.4" fill="none" stroke-linecap="round"/>' +
    '<g fill="#e8453c"><circle cx="66" cy="38" r="12"/><circle cx="98" cy="70" r="10"/>' +
    '<circle cx="150" cy="72" r="13"/><circle cx="200" cy="56" r="11"/><circle cx="234" cy="44" r="9"/></g>' +
    '<g fill="#f5d24a"><circle cx="66" cy="38" r="4.6"/><circle cx="150" cy="72" r="5"/><circle cx="200" cy="56" r="4.4"/></g>' +
    '</g>' +
    // 窗花
    '<g transform="translate(700,300)" opacity=".55" fill="none" stroke="#d8453c" stroke-width="3">' +
    '<rect x="0" y="0" width="110" height="110" rx="6"/>' +
    '<path d="M55 8v94M8 55h94"/><circle cx="55" cy="55" r="26"/><circle cx="55" cy="55" r="13"/>' +
    '<path d="M20 20l70 70M90 20l-70 70"/>' +
    '</g>',
    840, 460),

  /* 劳动节：厂房 + 齿轮 + 麦穗 */
  labour: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeedd"/><stop offset="1" stop-color="#fff9f3"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    // 厂房剪影
    '<g fill="#d9703c" opacity=".85">' +
    '<path d="M60 460V250l90-52 90 52v210z"/>' +
    '<path d="M240 460V220l110 62V220l110 62V220l110 62v178z"/>' +
    '<path d="M600 460V268l80-46 80 46v192z"/>' +
    '</g>' +
    '<g fill="#b8451f" opacity=".55">' +
    '<path d="M300 300h34v34h-34zM356 300h34v34h-34zM412 300h34v34h-34z"/>' +
    '<path d="M300 356h34v34h-34zM356 356h34v34h-34zM412 356h34v34h-34z"/>' +
    '<path d="M96 300h30v30H96zM156 300h30v30h-30zM96 352h30v30H96zM156 352h30v30h-30z"/>' +
    '</g>' +
    // 大齿轮
    '<g transform="translate(360,120)">' +
    '<g fill="#e8a15c">' +
    '<path d="M82 0h16l3 22 18 7 18-13 11 11-13 18 7 18 22 3v16l-22 3-7 18 13 18-11 11-18-13-18 7-3 22H82l-3-22-18-7-18 13-11-11 13-18-7-18-22-3V82l22-3 7-18-13-18 11-11 18 13 18-7z"/>' +
    '</g>' +
    '<circle cx="90" cy="90" r="46" fill="#fff9f3"/>' +
    '<circle cx="90" cy="90" r="24" fill="#e8a15c"/>' +
    '</g>' +
    // 麦穗
    '<g transform="translate(60,60)" fill="#d9a03a" opacity=".9">' +
    '<path d="M20 200C34 150 40 100 34 40" stroke="#d9a03a" stroke-width="4" fill="none"/>' +
    '<ellipse cx="26" cy="60" rx="10" ry="18" transform="rotate(-20 26 60)"/>' +
    '<ellipse cx="44" cy="86" rx="10" ry="18" transform="rotate(20 44 86)"/>' +
    '<ellipse cx="22" cy="110" rx="10" ry="18" transform="rotate(-20 22 110)"/>' +
    '<ellipse cx="42" cy="136" rx="10" ry="18" transform="rotate(20 42 136)"/>' +
    '</g>',
    840, 460),

  /* 端午：龙舟 + 江水 + 粽叶 */
  duanwu: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2f4fa"/><stop offset="1" stop-color="#f6fcfa"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    '<circle cx="700" cy="80" r="40" fill="#fdf3d8" opacity=".75"/>' +
    '<path d="M0 210c120-24 200 24 320 0s200 24 320 0 160 16 200 6v244H0z" fill="#cfe9f2" opacity=".7"/>' +
    '<path d="M0 260c120-26 200 26 320 0s200 26 320 0 160 18 200 6v194H0z" fill="#a9d4e4" opacity=".75"/>' +
    // 龙舟
    '<g transform="translate(230,230)">' +
    '<path d="M0 60c40-40 116-58 192-46 36 6 64 18 88 36-30 18-64 30-104 36-64 9-134 0-176-24z" fill="#2f8f56"/>' +
    '<path d="M0 60c40-40 116-58 192-46 36 6 64 18 88 36-30 18-64 30-104 36-64 9-134 0-176-24z" fill="none" stroke="#1f6b3e" stroke-width="3"/>' +
    '<path d="M0 60L-38 44 6 88z" fill="#1f6b3e"/>' +
    '<path d="M280 50c14-12 34-8 42 8-20 8-40 4-42-8z" fill="#e5a83c"/>' +
    '<circle cx="300" cy="42" r="5" fill="#8a4a1f"/>' +
    '<g stroke="#e5a83c" stroke-width="5" stroke-linecap="round">' +
    '<path d="M56 46L74 6"/><path d="M114 34L132-8"/><path d="M172 26L190-16"/><path d="M228 24L246-18"/>' +
    '</g>' +
    '<g fill="#f2d9a0" opacity=".85"><path d="M22 74h250" stroke="#f2d9a0" stroke-width="3"/></g>' +
    '<g fill="#e5a83c"><circle cx="86" cy="66" r="5"/><circle cx="146" cy="60" r="5"/><circle cx="206" cy="58" r="5"/></g>' +
    '</g>' +
    // 水花
    '<g stroke="#7fbcd0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8">' +
    '<path d="M180 340c16-12 32 12 48 0s32 12 48 0"/><path d="M420 360c16-12 32 12 48 0s32 12 48 0"/>' +
    '</g>' +
    // 粽叶
    '<g transform="translate(60,120)">' +
    '<path d="M44 0c24 16 33 44 24 72-15-9-28-28-33-50z" fill="#3f9e5e"/>' +
    '<path d="M44 0C20 16 11 44 20 72c15-9 28-28 33-50z" fill="#5aa96f" opacity=".85"/>' +
    '<path d="M44 8v58" stroke="#2f7a48" stroke-width="2.4" fill="none"/>' +
    '</g>',
    840, 460),

  /* 中秋：圆月 + 桂树 + 玉兔 + 远山 */
  moon: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d4a72"/><stop offset="1" stop-color="#8a7ba8"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    '<circle cx="620" cy="120" r="74" fill="#f7e2ac" opacity=".28"/>' +
    '<circle cx="620" cy="120" r="56" fill="#f7e2ac" opacity=".95"/>' +
    '<g fill="#e6cd90" opacity=".5"><circle cx="602" cy="104" r="10"/><circle cx="640" cy="132" r="7"/><circle cx="618" cy="146" r="6"/></g>' +
    // 远山
    '<path d="M0 340l150-96 130 74 140-92 160 96 120-56 140 74v120H0z" fill="#2c3a5e" opacity=".8"/>' +
    '<path d="M0 380l180-70 160 60 180-72 180 76 140-40v126H0z" fill="#1f2b49" opacity=".85"/>' +
    // 桂树
    '<g transform="translate(90,150)">' +
    '<path d="M40 220V120" stroke="#5a4630" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M40 160c-24-14-40-32-46-56M40 140c26-14 44-34 50-58" stroke="#5a4630" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<g fill="#3f6b4a" opacity=".9"><circle cx="10" cy="96" r="26"/><circle cx="42" cy="66" r="30"/><circle cx="80" cy="92" r="25"/></g>' +
    '<g fill="#f0c85a"><circle cx="0" cy="86" r="4.6"/><circle cx="24" cy="60" r="4"/><circle cx="52" cy="46" r="4.6"/>' +
    '<circle cx="78" cy="76" r="4"/><circle cx="94" cy="102" r="4.4"/></g>' +
    '</g>' +
    // 玉兔
    '<g transform="translate(470,300)" fill="#f0e0b8">' +
    '<ellipse cx="34" cy="34" rx="30" ry="20"/>' +
    '<circle cx="66" cy="26" r="14"/>' +
    '<path d="M60 14c-4-16 0-24 6-24s8 10 4 24z"/>' +
    '<path d="M70 14c0-16 6-22 10-20s4 12-4 22z"/>' +
    '<ellipse cx="14" cy="46" rx="9" ry="7"/>' +
    '</g>' +
    '<g fill="#e6cd90"><circle cx="486" cy="322" r="3"/></g>',
    840, 460),

  /* 元旦：烟花 + 气球 + 城市天际线 */
  newyear: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e3a5f"/><stop offset="1" stop-color="#5a7fa8"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    '<g fill="#fff" opacity=".7"><circle cx="80" cy="50" r="2.6"/><circle cx="200" cy="30" r="2"/><circle cx="330" cy="62" r="2.4"/>' +
    '<circle cx="470" cy="26" r="2.2"/><circle cx="610" cy="54" r="2.6"/><circle cx="750" cy="34" r="2"/></g>' +
    // 烟花
    (function () {
      var out = '';
      [[560, 120, '#f5d24a'], [720, 180, '#7fd0f0'], [380, 90, '#f0907a']].forEach(function (p) {
        var cx = p[0], cy = p[1], c = p[2];
        out += '<g stroke="' + c + '" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9">';
        for (var i = 0; i < 8; i++) {
          var a = i * Math.PI / 4;
          out += '<path d="M' + cx + ' ' + cy + 'L' + (cx + Math.cos(a) * 46) + ' ' + (cy + Math.sin(a) * 46) + '"/>';
        }
        out += '</g><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + c + '"/>';
      });
      return out;
    })() +
    // 城市天际线
    '<g fill="#12253c" opacity=".9">' +
    '<rect x="0" y="300" width="70" height="160"/><rect x="80" y="256" width="56" height="204"/>' +
    '<rect x="146" y="320" width="72" height="140"/><rect x="228" y="240" width="62" height="220"/>' +
    '<rect x="300" y="290" width="80" height="170"/><rect x="390" y="268" width="58" height="192"/>' +
    '<rect x="458" y="318" width="76" height="142"/><rect x="544" y="252" width="64" height="208"/>' +
    '<rect x="618" y="300" width="72" height="160"/><rect x="700" y="272" width="60" height="188"/>' +
    '<rect x="770" y="310" width="70" height="150"/>' +
    '</g>' +
    '<g fill="#f5d24a" opacity=".85">' +
    (function () {
      var s = '';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 16; c++) {
        if ((r * 7 + c * 3) % 5 < 2) s += '<rect x="' + (12 + c * 52) + '" y="' + (272 + r * 40) + '" width="10" height="13"/>';
      }
      return s;
    })() +
    '</g>' +
    // 气球
    '<g transform="translate(70,60)">' +
    '<ellipse cx="26" cy="30" rx="20" ry="25" fill="#e8735a"/>' +
    '<ellipse cx="19" cy="22" rx="6" ry="9" fill="#f8a892" opacity=".7"/>' +
    '<path d="M26 55l4 8-8 0z" fill="#c9a45e"/>' +
    '<path d="M26 63c10 12-8 16 2 28" stroke="#e8d0a0" stroke-width="1.8" fill="none"/>' +
    '</g>',
    840, 460),

  /* 清明：烟雨 + 柳枝 + 远山 */
  spring: svgURI(
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbeaf0"/><stop offset="1" stop-color="#f2f8f4"/></linearGradient></defs>' +
    '<rect width="840" height="460" fill="url(#s)"/>' +
    // 远山（三层）
    '<path d="M0 300l140-88 120 66 150-96 160 92 130-56 140 74v168H0z" fill="#b8d4c4" opacity=".75"/>' +
    '<path d="M0 340l170-76 150 62 170-80 170 78 180-48v184H0z" fill="#9cc4ae" opacity=".8"/>' +
    '<path d="M0 390l200-60 180 50 190-64 270 66v88H0z" fill="#7fb08a" opacity=".85"/>' +
    // 烟雨
    '<g stroke="#a8c8d8" stroke-width="2.4" stroke-linecap="round" opacity=".6">' +
    (function () {
      var s = '';
      for (var i = 0; i < 30; i++) {
        var x = 20 + (i % 10) * 82 + (i % 3) * 14;
        var y = 30 + Math.floor(i / 10) * 62 + (i % 4) * 12;
        s += '<path d="M' + x + ' ' + y + 'l-7 22"/>';
      }
      return s;
    })() +
    '</g>' +
    // 雾气
    '<g fill="#ffffff" opacity=".5"><ellipse cx="200" cy="300" rx="200" ry="26"/><ellipse cx="640" cy="326" rx="220" ry="22"/></g>' +
    // 柳枝
    '<g transform="translate(40,0)">' +
    '<path d="M40 0c14 52 10 106-6 156" stroke="#6f9e78" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<g stroke="#7fb08a" stroke-width="3" fill="none" stroke-linecap="round">' +
    '<path d="M38 26c-16 6-28 20-34 36"/><path d="M42 56c-16 6-28 20-34 36"/>' +
    '<path d="M40 86c-16 6-28 20-34 36"/><path d="M36 46c16 4 28 14 36 30"/>' +
    '<path d="M34 76c16 4 28 14 36 30"/><path d="M32 106c16 4 28 14 36 30"/>' +
    '</g>' +
    '<g fill="#8fc49a"><ellipse cx="8" cy="66" rx="13" ry="5" transform="rotate(-32 8 66)"/>' +
    '<ellipse cx="12" cy="96" rx="12" ry="4.6" transform="rotate(-32 12 96)"/>' +
    '<ellipse cx="76" cy="80" rx="13" ry="5" transform="rotate(30 76 80)"/></g>' +
    '</g>',
    840, 460)
};
