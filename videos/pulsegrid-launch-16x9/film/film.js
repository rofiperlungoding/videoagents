// PULSEGRID: 20 s launch ad, 16:9. Fictional analytics SaaS; every number is demo data.
// Shotlist: docs/shotlist.md (APPROVED). Marks and SFX: timeline.json (beats on the measured grid).
//
// One container never cuts: the live dot after "live." becomes the Connect button, the sources card, the sync pill,
// the dashboard, the ask panel, the metric card, and finally floods the frame as the cobalt end card.
// The product UI is designed here from scratch (there is no real site to capture).
// Pure function of time: no timers, no Math.random, nothing mutated in run().
(() => {
  const { put, reg, el, frag, scene, sp, spHit, trk, trkObj, seg, clamp, lerp, ease, bt, beatOf, beatAt, leadFor, noise1 } = C;
  const { line, rise, type } = TYPE;
  C.fonts = ['600 100px Display', '500 40px UI', '600 40px UI'];

  const ACC = '#2F5BFF', INK = '#111113', INK2 = '#6B6A66', CARD = '#FFFFFF', TILE = '#F6F5F1', TRACK = '#ECE9E3';
  const B = beatOf;
  // release beat for a spring that must READ on mark m (visual leads, the sound stays on the grid)
  const hitB = (m, preset = 'snappy') => beatAt(bt(m) - leadFor(preset));
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, p) => { const x = rgb(a), y = rgb(b); p = clamp(p); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(',')})`; };
  const trkColor = (t, keys, preset = 'default') =>
    `rgb(${[0, 1, 2].map((i) => Math.round(clamp(trk(t, keys.map(([b, h, p]) => [b, rgb(h)[i], p]), preset), 0, 255))).join(',')})`;
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const px = (v) => `${v.toFixed(2)}px`;
  // a press: the element dips and springs back around beat b
  const press = (t, b, depth = 0.06) => 1 - depth * (sp(t, b - 0.06, 'snappy') - sp(t, b + 0.1, 'snappy'));
  // grow out of nothing: scale 0.86 → 1 with opacity snapping in within a few frames
  // pops snap visible within ~2 frames, so they lead by 2 frames (masked type keeps the kit's longer lead)
  const HIT = 2 / 60;
  const hit = (t, m, preset = 'snappy') => spHit(t, m, preset, HIT);
  const grow = (p, from = 0.86) => ({ s: from + (1 - from) * p, o: clamp(p * 5), hide: p <= 0.001 });

  // ---------------------------------------------------------------- layout (16:9)
  const HX = 140, HS = 230, L1Y = 270, L2Y = 520;        // hook
  const CX = 140, CS = 104, C1Y = 380, C2Y = 490;        // captions, left column
  const SX = 1320, SY = 540;                              // the container's home on the right
  const STATE = {                                         // container size per state
    button: [440, 132, 66], sources: [760, 470, 32], sync: [760, 150, 75],
    dash: [1000, 700, 32], ask: [1000, 640, 32], askField: [1000, 184, 32], metric: [860, 520, 36],
  };
  const R = {};                                           // shared element refs (built once, never mutated in run)

  // ---------------------------------------------------------------- camera (applied to every scene root)
  const nzx = noise1(11), nzy = noise1(23), nzs = noise1(37);
  function camera(t, hud = false) {
    const f = trkObj(t, [
      [0, { x: HX, y: 520 }], [7, { x: SX, y: SY }],
      [20.6, { x: R.anom.x, y: R.anom.y }, 'heavy'], [23.6, { x: SX, y: SY }], [35.8, { x: 960, y: 540 }],
    ], 'heavy');
    const hookPush = 0.04 * ease.inOut(seg(t, 0, 7)) * (1 - sp(t, 7, 'default'));
    const breathe = 0.022 * (0.5 + 0.5 * nzs(t * 0.32)) * sp(t, 8, 'heavy') * (1 - sp(t, 35.8, 'default'));
    const punch = hud ? 0 : trk(t, [[0, 0], [20.6, 0.075, 'heavy'], [23.6, 0, 'default'], [28, 0.05, 'heavy'], [31.8, 0, 'default']]);
    const s = 1 + hookPush + breathe + punch;
    if (hud) return { x: (CX - 960) * (1 - s) + 4 * nzx(t * 0.5), y: (540 - 540) * (1 - s) + 4 * nzy(t * 0.5), s };
    return { x: (f.x - 960) * (1 - s) + 4 * nzx(t * 0.5), y: (f.y - 540) * (1 - s) + 4 * nzy(t * 0.5), s };
  }
  const cam = (t, S, hud = false) => put(S.root, camera(t, hud));

  // ---------------------------------------------------------------- background: paper + dot grid
  scene({
    name: 'bg', from: 'hook', to: 41, cut: false,
    build(root) { el('div', { class: 'dots' }, root); },
    run(t, b, S) { cam(t, S); },
  });

  // ---------------------------------------------------------------- 1–2 · hook: "Your metrics / are late." → "are live."
  scene({
    name: 'hook', from: 'hook', to: 'button', cut: false,
    build(root, S) {
      R.l1 = S.l1 = line(root, 'Your metrics', { x: HX, y: L1Y, size: HS });
      const l2 = R.l2 = S.l2 = el('div', { class: 'line display', style: `left:${HX}px;top:${L2Y}px;font-size:${HS}px` }, root);
      reg(l2);
      S.are = reg(el('span', { class: 'word' }, l2, 'are'), { y: 0 });
      l2.appendChild(document.createTextNode(' '));
      // "late." and "live." share one slot so the swap happens in place
      const slot = el('span', { class: 'word', style: 'display:inline-grid' }, l2);
      S.late = reg(el('span', { style: 'grid-area:1/1;display:inline-block;position:relative' }, slot, 'late.'), { y: 0 });
      S.strike = reg(el('span', { class: 'abs', style: 'left:-0.03em;top:0.5em;width:calc(100% + 0.04em);height:0.08em;border-radius:0.04em;background:var(--accent)' }, S.late), { o: 0 });
      // "live." moves inside a still wrapper; a zero-size probe after it marks the baseline and right edge (pure layout)
      const liveWrap = el('span', { style: 'grid-area:1/1;display:inline-block;white-space:nowrap' }, slot);
      S.live = reg(el('span', { style: 'display:inline-block;color:var(--accent)' }, liveWrap, 'live.'), { y: 0 });
      R.probe = el('span', { style: 'display:inline-block;width:0;height:0' }, liveWrap);
    },
    run(t, b, S) {
      cam(t, S);
      const below = HS * 1.45, above = -HS * 1.45;
      const gone = (y) => y >= below * 0.999 || y <= above * 0.999;
      // word 0 is released before t = 0 so frame 0 already reads
      rise(t, S.l1, [-0.4, 'hook_w2'], B('handoff') + 0.25, { stagger: 0.06 });
      const out = (i) => above * sp(t, B('handoff') + 0.3 + i * 0.03 - 0.14, 'snappy');
      const yAre = below * (1 - spHit(t, 'hook_w3', 'heavy')) + out(0);
      put(S.are, { y: yAre, hide: gone(yAre) });
      // "late." lands, gets struck, then lifts out just before "live." rises into the same slot (sequential swap)
      const yLate = below * (1 - spHit(t, 'hook_w4', 'heavy')) + above * sp(t, B('live') - 0.15, 'snappy');
      put(S.late, { y: yLate, hide: gone(yLate) });
      const st = spHit(t, 'strike', 'snappy', HIT);
      put(S.strike, { o: st > 0.002 ? 1 : 0, sx: st });
      const yLive = below * (1 - spHit(t, 'live', 'heavy')) + out(1);
      put(S.live, { y: yLive, hide: gone(yLive) });
    },
  });

  // live dot position in world px, right after "live." (pure layout: offsets ignore transforms)
  function dotWorld() {
    const r = HS * 0.088;
    return { x: R.l2.offsetLeft + R.probe.offsetLeft + HS * 0.1 + r, y: R.l2.offsetTop + R.probe.offsetTop - HS * 0.27, r };
  }

  // ---------------------------------------------------------------- captions (left column)
  const CAPS = [
    ['Connect', 'everything.', 8.0, 15.5],
    ['Watch it', 'live.', 16.25, 23.5],
    ['Ask it', 'why.', 24.25, 31.5],
    ['Answers in', 'seconds.', 32.25, 35.35],
  ];
  scene({
    name: 'captions', from: 'button', to: 'end', cut: false,
    build(root, S) {
      S.caps = CAPS.map(([a, bb]) => [line(root, a, { x: CX, y: C1Y, size: CS }), line(root, bb, { x: CX, y: C2Y, size: CS, color: 'var(--accent)' })]);
    },
    run(t, b, S) {
      cam(t, S, true);
      S.caps.forEach(([l1, l2], i) => {
        const [, , tin, tout] = CAPS[i];
        rise(t, l1, tin, tout, { stagger: 0.1 });
        rise(t, l2, tin + 0.25, tout + 0.05, { stagger: 0.1 });
      });
    },
  });

  // ---------------------------------------------------------------- 2–10 · the container and everything inside it
  const ICONS = {
    events: '<polyline points="3,15 9,15 12,7 18,23 21,15 27,15"/>',
    payments: '<rect x="3" y="7" width="24" height="16" rx="3"/><line x1="3" y1="12.5" x2="27" y2="12.5"/>',
    warehouse: '<ellipse cx="15" cy="8" rx="10" ry="4"/><path d="M5 8v14c0 2.2 4.5 4 10 4s10-1.8 10-4V8"/><path d="M5 15c0 2.2 4.5 4 10 4s10-1.8 10-4"/>',
  };
  const icon = (name, size = 30, color = INK, sw = 2.4) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 30 30" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  const SPARK = (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 1.5c.7 5.6 4.9 9.8 10.5 10.5-5.6.7-9.8 4.9-10.5 10.5C11.3 16.9 7.1 12.7 1.5 12 7.1 11.3 11.3 7.1 12 1.5z" fill="${color}"/></svg>`;
  const SOURCES = [['events', 'Product events'], ['payments', 'Payments'], ['warehouse', 'Warehouse']];
  // demo data: daily signups, 14 days, the dip on day 8 (Tuesday)
  const SERIES = [118, 126, 131, 129, 138, 142, 147, 151, 109, 128, 140, 149, 156, 163];
  const CH = { x: 44, y: 300, w: 912, h: 356 };
  const ptOf = (i) => ({ x: 22 + (i * (CH.w - 44)) / (SERIES.length - 1), y: 326 - ((SERIES[i] - 95) / 80) * 300 });
  const ANOM_I = 8;
  {
    const p = ptOf(ANOM_I), [w, h] = STATE.dash;
    R.anom = { x: SX - w / 2 + CH.x + p.x, y: SY - h / 2 + CH.y + p.y };
  }
  function smoothPath(pts) {
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }
  const content = (parent, [w, h]) => reg(el('div', { class: 'content', style: `width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px` }, parent), { o: 0 });
  const abs = (parent, style, html = '') => el('div', { class: 'abs', style }, parent, html);
  const T = (parent, text, style) => el('div', { class: 'abs ui', style: `white-space:nowrap;${style}` }, parent, text);

  scene({
    name: 'product', from: 'live_dot', to: 41, pre: 0.5, cut: false,
    build(root, S) {
      S.ring = reg(abs(root, 'border:4px solid var(--accent);border-radius:50%;box-sizing:border-box;transform-origin:50% 50%'), { o: 0 });
      S.box = reg(el('div', { class: 'box' }, root), { o: 0 });
      // colour changes are floods from the centre (an interpolated fill would pass through grey / navy)
      S.inkFill = reg(abs(S.box, `inset:0;width:auto;height:auto;background:${INK}`), { o: 0 });
      S.accFill = reg(abs(S.box, `inset:0;width:auto;height:auto;background:${ACC}`), { o: 0 });

      // button
      S.btn = content(S.box, STATE.button);
      abs(S.btn, 'inset:0;display:flex;align-items:center;justify-content:center;gap:16px;color:#fff;font-weight:600;font-size:40px;letter-spacing:-0.02em',
        `${icon('events', 34, '#fff', 2.8)}<span class="ui">Connect data</span>`);

      // sources card
      S.src = content(S.box, STATE.sources);
      T(S.src, 'Sources', 'left:44px;top:34px;font-size:36px;font-weight:600;letter-spacing:-0.02em');
      S.srcCount = T(S.src, '0 of 3 connected', 'right:44px;left:auto;top:42px;font-size:28px;color:var(--ink-2)');
      reg(S.srcCount);
      S.rows = SOURCES.map(([ic, name], i) => {
        const row = reg(abs(S.src, `left:32px;top:${112 + i * 112}px;width:696px;height:96px;border-radius:22px;background:${TILE};transform-origin:50% 50%`), { o: 0 });
        abs(row, 'left:18px;top:18px;width:60px;height:60px;border-radius:16px;background:#fff;display:grid;place-items:center', icon(ic));
        T(row, name, 'left:98px;top:28px;font-size:32px;font-weight:500;letter-spacing:-0.01em');
        const track = reg(abs(row, `right:22px;left:auto;top:22px;width:92px;height:52px;border-radius:26px;background:${TRACK}`));
        const knob = reg(abs(track, 'left:4px;top:4px;width:44px;height:44px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18)'));
        return { row, track, knob };
      });

      // sync pill
      S.sync = content(S.box, STATE.sync);
      S.spin = reg(abs(S.sync, 'left:46px;top:37px;width:60px;height:60px;transform-origin:30px 30px',
        `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke-width="7" stroke-linecap="round"><circle cx="30" cy="30" r="24" stroke="${TRACK}"/><circle cx="30" cy="30" r="24" stroke="${ACC}" stroke-dasharray="48 200"/></svg>`));
      S.okDot = reg(abs(S.sync, `left:46px;top:37px;width:60px;height:60px;border-radius:50%;background:${ACC};transform-origin:30px 30px;display:grid;place-items:center`,
        '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="8,18 14,24 26,11"/></svg>'), { o: 0 });
      const lab = abs(S.sync, 'left:132px;top:22px;width:560px;height:40px;overflow:hidden');
      S.syncA = reg(T(lab, 'Syncing events…', 'top:2px;font-size:28px;color:var(--ink-2)'), { y: 0 });
      S.syncB = reg(T(lab, `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${ACC};margin-right:12px;vertical-align:2px"></span>Live · 3 sources`, 'top:2px;font-size:28px;font-weight:500;color:var(--ink)'), { y: 60 });
      S.counter = reg(T(S.sync, '0', 'left:132px;top:60px;font-size:44px;font-weight:600;letter-spacing:-0.02em'));
      S.counter.classList.add('tnum');
      abs(S.sync, `left:132px;top:118px;width:582px;height:6px;border-radius:3px;background:${TRACK}`);
      S.bar = reg(abs(S.sync, `left:132px;top:118px;width:582px;height:6px;border-radius:3px;background:${ACC};transform-origin:0 50%`), { sx: 0 });

      // dashboard
      S.dash = content(S.box, STATE.dash);
      T(S.dash, 'Overview', 'left:44px;top:32px;font-size:36px;font-weight:600;letter-spacing:-0.02em');
      T(S.dash, 'Last 14 days', `left:222px;top:34px;font-size:26px;color:var(--ink-2);background:${TILE};border-radius:20px;padding:6px 16px`);
      T(S.dash, `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${ACC};margin-right:12px;vertical-align:2px"></span>Live`, 'right:44px;left:auto;top:38px;font-size:28px;font-weight:500');
      const KPI = [['Revenue', 84200, (v) => `$${(v / 1000).toFixed(1)}k`, '+12.4%', false], ['Active users', 12480, num, '+8.1%', false], ['Signups', 1906, num, '−18.2%', true]];
      S.kpis = KPI.map(([label, target, f, delta, flag], i) => {
        const tile = reg(abs(S.dash, `left:${44 + i * 311}px;top:112px;width:290px;height:156px;border-radius:22px;background:${TILE};transform-origin:50% 50%`), { o: 0 });
        T(tile, label, 'left:24px;top:22px;font-size:28px;color:var(--ink-2)');
        T(tile, delta, `right:22px;left:auto;top:24px;font-size:26px;font-weight:600;color:${flag ? ACC : INK2}`);
        const v = reg(T(tile, f(0), 'left:24px;top:64px;font-size:56px;font-weight:600;letter-spacing:-0.03em'));
        v.classList.add('tnum');
        return { tile, v, target, f };
      });
      const pts = SERIES.map((_, i) => ptOf(i));
      const d = smoothPath(pts);
      S.chart = abs(S.dash, `left:${CH.x}px;top:${CH.y}px;width:${CH.w}px;height:${CH.h}px`,
        `<svg width="${CH.w}" height="${CH.h}" viewBox="0 0 ${CH.w} ${CH.h}" fill="none">
          ${[60, 160, 260].map((y) => `<line x1="0" x2="${CH.w}" y1="${y}" y2="${y}" stroke="${TRACK}" stroke-width="2"/>`).join('')}
          <path class="area" d="${d} L${pts[pts.length - 1].x} ${CH.h} L${pts[0].x} ${CH.h} Z" fill="rgba(47,91,255,0.09)" stroke="none"/>
          <path class="ln" d="${d}" stroke="${ACC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`);
      S.area = reg(S.chart.querySelector('.area'));
      S.ln = reg(S.chart.querySelector('.ln'));
      S.lnLen = S.ln.getTotalLength();
      S.ln.style.strokeDasharray = `${S.lnLen} ${S.lnLen}`;
      S.head = reg(abs(S.chart, `width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:${ACC};box-shadow:0 0 0 5px #fff`), { o: 0 });
      // anomaly: ring on the dip, guide line, tooltip with the Ask why button
      const ap = ptOf(ANOM_I);
      S.guide = reg(abs(S.chart, `left:${ap.x - 1}px;top:${ap.y}px;width:2px;height:${CH.h - ap.y}px;background:repeating-linear-gradient(${ACC} 0 6px, transparent 6px 12px);transform-origin:50% 0`), { o: 0 });
      S.aring = reg(abs(S.chart, `left:${ap.x - 17}px;top:${ap.y - 17}px;width:34px;height:34px;border-radius:50%;border:5px solid ${ACC};background:#fff;box-sizing:border-box;transform-origin:50% 50%`), { o: 0 });
      S.halo = reg(abs(S.chart, `left:${ap.x - 17}px;top:${ap.y - 17}px;width:34px;height:34px;border-radius:50%;border:3px solid ${ACC};box-sizing:border-box;transform-origin:50% 50%`), { o: 0 });
      S.tip = reg(abs(S.chart, `left:${ap.x + 28}px;top:${ap.y - 176}px;width:336px;height:148px;border-radius:20px;background:${INK};transform-origin:0 100%;box-shadow:0 20px 50px -16px rgba(17,17,19,.45)`), { o: 0 });
      T(S.tip, 'Signups −18% · Tue', 'left:24px;top:20px;font-size:30px;font-weight:600;color:#fff;letter-spacing:-0.01em');
      S.why = reg(abs(S.tip, `left:24px;top:72px;height:56px;padding:0 22px;border-radius:28px;background:${ACC};display:flex;align-items:center;gap:10px;transform-origin:50% 50%`,
        `${SPARK(22, '#fff')}<span class="ui" style="font-size:28px;font-weight:600;color:#fff">Ask why</span>`));

      // ask panel
      S.ask = content(S.box, STATE.ask);
      S.ask.style.top = '0px'; S.ask.style.marginTop = '0px';   // anchored to the panel top: the panel grows downward
      const field = abs(S.ask, `left:40px;top:40px;width:920px;height:104px;border-radius:52px;background:${TILE}`);
      abs(field, 'left:32px;top:35px', SPARK(34, ACC));
      const qrow = abs(field, 'left:86px;top:0;height:104px;display:flex;align-items:center;white-space:nowrap');
      S.q = reg(el('span', { class: 'ui', style: 'font-size:34px;font-weight:500;letter-spacing:-0.015em' }, qrow, ''));
      S.caret = reg(el('span', { style: `display:inline-block;width:3px;height:42px;margin-left:3px;background:${ACC}` }, qrow), { o: 0 });
      S.send = reg(abs(field, `right:16px;left:auto;top:16px;width:72px;height:72px;border-radius:50%;background:#D9D5CC;display:grid;place-items:center;transform-origin:50% 50%`,
        '<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><line x1="15" y1="24" x2="15" y2="7"/><polyline points="8,13 15,6 22,13"/></svg>'));
      S.ansLab = reg(abs(S.ask, 'left:44px;top:178px;display:flex;align-items:center;gap:10px', `${SPARK(26, ACC)}<span class="ui" style="font-size:28px;font-weight:600">Pulsegrid</span>`), { o: 0 });
      S.a1 = line(S.ask, 'iOS checkout errors caused', { x: 44, y: 224, size: 54, cls: 'display ans' });
      S.a2 = line(S.ask, '63% of the drop.', { x: 44, y: 288, size: 54, cls: 'display ans', accent: [0] });
      const BARS = [['iOS app', 0.63, ACC], ['Web', 0.24, '#BDB9B0'], ['Android', 0.13, '#BDB9B0']];
      S.bars = BARS.map(([name, v, c], i) => {
        const rowEl = reg(abs(S.ask, `left:44px;top:${384 + i * 52}px;width:760px;height:40px`), { o: 0 });
        T(rowEl, name, 'left:0;top:2px;font-size:28px;color:var(--ink-2)');
        abs(rowEl, `left:156px;top:12px;width:500px;height:16px;border-radius:8px;background:${TRACK}`);
        const fill = reg(abs(rowEl, `left:156px;top:12px;width:${500 * v}px;height:16px;border-radius:8px;background:${c};transform-origin:0 50%`), { sx: 0 });
        T(rowEl, `${Math.round(v * 100)}%`, `left:676px;top:2px;font-size:28px;font-weight:600;color:${i ? INK : ACC}`).classList.add('tnum');
        return { rowEl, fill };
      });
      S.alert = reg(abs(S.ask, `left:700px;top:544px;width:260px;height:68px;border-radius:34px;background:${INK};overflow:hidden;transform-origin:50% 50%`), { o: 0 });
      S.alA = reg(abs(S.alert, 'left:0;top:0;width:260px;height:68px;display:flex;align-items:center;justify-content:center;gap:10px',
        '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18V11a7 7 0 0 1 14 0v7l2 2H4z"/><path d="M11 23h4"/></svg><span class="ui" style="font-size:28px;font-weight:600;color:#fff">Create alert</span>'), { y: 0 });
      S.alB = reg(abs(S.alert, 'left:0;top:0;width:260px;height:68px;display:flex;align-items:center;justify-content:center;gap:10px',
        '<svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5,14 10,19 21,7"/></svg><span class="ui" style="font-size:28px;font-weight:600;color:#fff">Alert on</span>'), { y: 68 });

      // metric card
      S.met = content(S.box, STATE.metric);
      T(S.met, 'Avg. time to answer', 'left:60px;top:52px;font-size:30px;font-weight:500;color:#A5A39D');
      S.big = line(S.met, '3 sec', { x: 54, y: 118, size: 250, color: '#fff', accent: [1] });
      S.was = reg(T(S.met, 'was 3 days', 'left:60px;top:420px;font-size:34px;font-weight:500;color:#A5A39D'), { o: 0 });
      S.wasLine = reg(abs(S.met, `left:54px;top:442px;width:190px;height:4px;border-radius:2px;background:${ACC};transform-origin:0 50%`), { sx: 0 });
    },

    run(t, b, S) {
      cam(t, S);
      const D = dotWorld();
      const K = (cx, cy, [w, h, r]) => ({ x: cx, y: cy, w, h, r });
      const box = trkObj(t, [
        [0, { x: D.x, y: D.y, w: 0, h: 0, r: 0 }],
        [hitB('live_dot'), { x: D.x, y: D.y, w: 2 * D.r, h: 2 * D.r, r: D.r }, 'snappy'],
        [B('handoff'), { x: SX, y: SY, w: 132, h: 132, r: 66 }, 'snappy'],
        [hitB('button'), K(SX, SY, STATE.button), 'snappy'],
        [B('sources'), K(SX, SY, STATE.sources)],
        [B('sync'), K(SX, SY, STATE.sync)],
        [B('dash'), K(SX, SY, STATE.dash)],
        [B('ask'), K(SX, SY, STATE.askField)],
        [B('answer') - 0.3, K(SX, SY, STATE.ask)],
        [B('metric'), K(SX, SY, STATE.metric)],
        [B('end') - 0.12, { x: 960, y: 540, w: 2700, h: 1800, r: 0 }],
      ]);
      const fill = trkColor(t, [[0, ACC], [B('sources'), CARD]]);
      const fl = (p) => ({ o: p > 0.001 ? 1 : 0, clip: `circle(${(76 * p).toFixed(2)}% at 50% 50%)` });
      put(S.inkFill, fl(sp(t, B('metric') - 0.08, 'snappy')));
      put(S.accFill, fl(sp(t, B('end') - 0.2, 'default')));
      const w = Math.max(0, box.w), h = Math.max(0, box.h);
      put(S.box, { o: w > 0.5 ? 1 : 0, x: box.x - w / 2, y: box.y - h / 2, s: press(t, B('click_connect'), 0.05),
        css: { width: px(w), height: px(h), borderRadius: px(Math.max(0, Math.min(box.r, w / 2, h / 2))), background: fill } });

      // live dot pulses on every half beat until the handoff
      if (b >= 5.5 && b < 7.6) {
        const k = Math.floor(b * 2) / 2, tau = (t - bt(k)) / (bt(k + 0.5) - bt(k));
        const on = b >= B('live_dot') && b < B('handoff');
        put(S.ring, { o: on ? 0.55 * (1 - tau) : 0, x: box.x - D.r, y: box.y - D.r, s: 1 + 1.4 * ease.out(tau), css: { width: px(2 * D.r), height: px(2 * D.r) } });
      }

      const swap = (el2, a, z, extra = {}) => {
        const o = Motion.swapAlpha(t, bt(a), bt(z), { lead: 0.16 });
        const away = sp(t, B(z) - 0.32, 'snappy');
        put(el2, { o, hide: o <= 0.001, y: 18 * (1 - sp(t, B(a) + 0.1, 'snappy')), s: 1 - 0.04 * away, ...extra });
        return o;
      };

      // ---- button (b8–10)
      swap(S.btn, 'button', 'sources');

      // ---- sources (b10–12): rows build, toggles flip on the clicks
      if (swap(S.src, 'sources', 'sync') > 0) {
        let on = 0;
        S.rows.forEach((r, i) => {
          put(r.row, grow(sp(t, B('sources') + 0.2 + i * 0.12, 'snappy'), 0.9));
          const k = hit(t, `src_${i + 1}`);
          if (k > 0.5) on++;
          put(r.knob, { x: 40 * k, s: press(t, B(`src_${i + 1}`), 0.12) });
          put(r.track, { css: { background: mix('#ECE9E3', ACC, k) } });
        });
        put(S.srcCount, { text: on === 3 ? '3 connected' : `${on} of 3 connected`, css: { color: on === 3 ? ACC : INK2 } });
      }

      // ---- sync (b12–16): spinner, counter, bar → check + "Live · 3 sources"
      if (swap(S.sync, 'sync', 'dash') > 0) {
        const done = hit(t, 'synced');
        put(S.spin, { r: (t - bt('sync')) * 400, s: 1 - done, hide: done > 0.999 });
        put(S.okDot, grow(done, 0.6));
        put(S.counter, { text: num(2418903 * ease.out(seg(t, 12.75, 14))) + ' events' });
        put(S.bar, { sx: ease.inOut(seg(t, 12.75, 14)) });
        put(S.syncA, { y: -60 * done });
        put(S.syncB, { y: 60 * (1 - done) });
      }

      // ---- dashboard (b16–24): tiles count up, chart draws, the dip gets flagged
      if (swap(S.dash, 'dash', 'ask') > 0) {
        S.kpis.forEach((k, i) => {
          const m = `kpi_${i + 1}`;
          put(k.tile, grow(hit(t, m)));
          put(k.v, { text: k.f(k.target * ease.out(seg(t, B(m), B(m) + 1.5))) });
        });
        const p = ease.inOut(seg(t, 'chart', 'chart_done'));
        put(S.ln, { css: { strokeDashoffset: String(S.lnLen * (1 - p)) }, o: p > 0 ? 1 : 0 });
        put(S.area, { clip: `inset(0 ${(100 * (1 - p)).toFixed(2)}% 0 0)`, o: p > 0 ? 1 : 0 });
        const hp = S.ln.getPointAtLength(S.lnLen * p);
        put(S.head, { o: p > 0.01 && p < 0.995 ? 1 : 0, x: hp.x, y: hp.y });
        const a = hit(t, 'anomaly');
        put(S.aring, grow(a, 0.4));
        put(S.guide, { o: a > 0.002 ? 1 : 0, sy: a });
        if (b > B('anomaly')) {
          const k = Math.floor((b - B('anomaly')) * 2) / 2 + B('anomaly'), tau = clamp((t - bt(k)) / (bt(k + 0.5) - bt(k)));
          put(S.halo, { o: 0.6 * (1 - tau), s: 1 + 1.6 * ease.out(tau) });
        }
        put(S.tip, grow(hit(t, B('anomaly') + 0.12), 0.85));
        put(S.why, { s: press(t, B('click_why'), 0.08) });
      }

      // ---- ask (b24–32): question types, send, the answer builds, alert on
      if (swap(S.ask, 'ask', 'metric') > 0) {
        type(t, S.q, 'Why did signups drop on Tuesday?', 'type_from', 'type_to', S.caret, 'send');
        const ready = sp(t, 'type_to', 'snappy');
        put(S.send, { s: press(t, B('send'), 0.1) * (0.92 + 0.08 * ready), css: { background: mix('#D9D5CC', ACC, ready) } });
        put(S.ansLab, grow(hit(t, 'answer'), 0.9));
        rise(t, S.a1, hitB('answer', 'heavy') + 0.05, null, { preset: 'heavy', stagger: 0.04 });
        rise(t, S.a2, hitB('answer', 'heavy') + 0.3, null, { preset: 'heavy', stagger: 0.05 });
        S.bars.forEach((r, i) => {
          const g = hit(t, `bar_${i + 1}`);
          put(r.rowEl, grow(g, 0.96));
          put(r.fill, { sx: sp(t, B(`bar_${i + 1}`), 'default') });
        });
        const on = spHit(t, 'alert_on', 'snappy', 0.1);   // a colour + label swap reads later than a pop: longer lead
        put(S.alert, { ...grow(spHit(t, B('bar_3') + 0.5, 'snappy'), 0.9), s: (0.9 + 0.1 * spHit(t, B('bar_3') + 0.5, 'snappy')) * press(t, B('click_alert'), 0.08), css: { background: mix(INK, ACC, on) } });
        put(S.alA, { y: -68 * on });
        put(S.alB, { y: 68 * (1 - on) });
      }

      // ---- metric (b32–36): "3 sec" lands, "was 3 days" gets struck
      if (swap(S.met, 'metric', B('end') - 0.12) > 0) {
        rise(t, S.big, [hitB('metric_num', 'heavy'), hitB('metric_num', 'heavy') + 0.35], null, { preset: 'heavy' });
        put(S.was, grow(sp(t, B('metric_num') + 0.6, 'snappy'), 0.95));
        put(S.wasLine, { sx: hit(t, 'metric_was') });
      }
    },
  });

  // ---------------------------------------------------------------- 11 · end card on the cobalt flood
  scene({
    name: 'end', from: 'end', to: 41, pre: 0.2, cut: false,
    build(root, S) {
      S.push = reg(abs(root, 'width:1920px;height:1080px;transform-origin:140px 540px'));
      // a growth line draws across the right half, so the hold is never static
      const pts = [[700, 900], [900, 840], [1060, 870], [1240, 700], [1380, 740], [1560, 520], [1700, 560], [1880, 300]].map(([x, y]) => ({ x, y }));
      S.gl = abs(S.push, 'left:0;top:0;width:1920px;height:1080px',
        `<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none"><path d="${smoothPath(pts)}" stroke="rgba(255,255,255,0.28)" stroke-width="12" stroke-linecap="round"/></svg>`);
      S.glp = reg(S.gl.querySelector('path'));
      S.glLen = S.glp.getTotalLength();
      S.glp.style.strokeDasharray = `${S.glLen} ${S.glLen}`;
      S.glHead = reg(abs(S.push, 'width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:#fff'), { o: 0 });
      S.mark = reg(abs(S.push, `left:140px;top:190px;width:136px;height:136px;border-radius:38px;background:#fff;display:grid;place-items:center;transform-origin:50% 50%`,
        `<svg width="84" height="84" viewBox="0 0 30 30" fill="none" stroke="${ACC}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${ICONS.events}</svg>`), { o: 0 });
      S.word = line(S.push, 'Pulsegrid', { x: 140, y: 350, size: 210, color: '#fff' });
      S.tag = line(S.push, 'Analytics that answers back.', { x: 144, y: 590, size: 64, color: 'rgba(255,255,255,0.88)', cls: 'display ans' });
      S.cta = reg(abs(S.push, `left:140px;top:722px;width:480px;height:148px;border-radius:74px;background:#fff;display:flex;align-items:center;justify-content:center;gap:14px;transform-origin:50% 50%`,
        `<span class="ui" style="font-size:62px;font-weight:600;color:${ACC};letter-spacing:-0.025em">Start free</span><svg width="48" height="48" viewBox="0 0 34 34" fill="none" stroke="${ACC}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="17" x2="27" y2="17"/><polyline points="19,9 27,17 19,25"/></svg>`), { o: 0 });
    },
    run(t, b, S) {
      cam(t, S);
      put(S.push, { s: 1 + 0.045 * ease.inOut(seg(t, 'end', 'done')) });
      const p = ease.inOut(seg(t, B('end') + 0.4, 39.6));
      put(S.glp, { css: { strokeDashoffset: String(S.glLen * (1 - p)) } });
      const hp = S.glp.getPointAtLength(S.glLen * p);
      put(S.glHead, { o: p > 0.06 ? 1 : 0, x: hp.x, y: hp.y });
      put(S.mark, grow(sp(t, B('end') + 0.08, 'heavy'), 0.8));   // in as the flood covers: no flat frame
      rise(t, S.word, 'logo_word', null, { stagger: 0.05 });
      rise(t, S.tag, B('logo_word') + 0.5, null, { stagger: 0.03, preset: 'snappy' });
      const c = hit(t, 'cta');
      const hover = sp(t, 38.8, 'default');
      put(S.cta, { ...grow(c), s: (0.86 + 0.14 * c) * (1 + 0.04 * hover) });
    },
  });

  // ---------------------------------------------------------------- the cursor drives every change
  const CUR = '<svg width="44" height="56" viewBox="0 0 44 56" style="overflow:visible"><path d="M2 2 L2 42 L12.5 32 L20 49 L27 46 L19.5 29.5 L33.5 29.5 Z" fill="#111" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/></svg>';
  const CLICKS = ['click_connect', 'src_1', 'src_2', 'src_3', 'click_why', 'send', 'click_alert'];
  scene({
    name: 'cursor', from: 'button', to: 41, pre: 1, cut: false,
    build(root, S) { S.c = reg(abs(root, 'filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))', CUR), { o: 0 }); },
    run(t, b, S) {
      cam(t, S);
      const [sw, sh] = STATE.sources, toggle = (i) => ({ x: SX + sw / 2 - 32 - 22 - 46 + 14, y: SY - sh / 2 + 112 + i * 112 + 48 + 14 });
      const [dw, dh] = STATE.dash, ap = ptOf(ANOM_I);
      const why = { x: SX - dw / 2 + CH.x + ap.x + 28 + 24 + 90, y: SY - dh / 2 + CH.y + ap.y - 176 + 72 + 34 };
      const [aw, ah] = STATE.ask;
      const fh = STATE.askField[1];
      const send = { x: SX + aw / 2 - 40 - 16 - 36 + 10, y: SY - fh / 2 + 40 + 16 + 36 + 12 };
      const alert = { x: SX - aw / 2 + 700 + 150, y: SY - ah / 2 + 544 + 40 };
      const p = trkObj(t, [
        [0, { x: 2000, y: 1180 }],
        [7.9, { x: SX + 70, y: SY + 26 }],
        [9.85, toggle(0), 'snappy'], [10.65, toggle(1), 'snappy'], [11.15, toggle(2), 'snappy'],
        [12.0, { x: 2080, y: 1160 }],
        [20.6, { x: 1720, y: 1000 }],
        [21.5, why],
        [23.3, { x: 2080, y: 1160 }],
        [25.4, { x: 1800, y: 900 }],
        [26.3, send],
        [27.6, { x: 1790, y: 930 }],
        [29.7, alert],
        [31.3, { x: 2060, y: 1200 }],
        [37.5, { x: 760, y: 1170 }],
        [38.1, { x: 560, y: 820 }],
      ]);
      let down = 0;
      for (const m of CLICKS) down = Math.max(down, sp(t, B(m) - 0.06, 'snappy') - sp(t, B(m) + 0.1, 'snappy'));
      const off = p.x > 1960 || p.y > 1100;
      put(S.c, { o: off ? 0 : 1, x: p.x, y: p.y, s: 1 - 0.14 * down });
    },
  });

  C.start();
})();
