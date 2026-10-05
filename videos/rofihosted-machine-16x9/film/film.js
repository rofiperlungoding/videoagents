// rofihosted · "The Machine" · 16:9 · 33 s, cut to the supplied track (118.25 BPM, fitted grid in beats.json).
// Apple-product-film grammar: macro rim light on the chassis, the USB-C port, the reveal on a desk, the screen waking,
// an exploded view of the software stack, the real UI at work, the night, the slams, the lockup.
// The tablet is drawn here (no product photography exists); every UI piece is rebuilt in English from the real screens.
// 2D transforms only (iso views are 2D matrices). Pure function of time: no timers, no Math.random, nothing mutated in run().
(() => {
  const { W, H, put, reg, el, scene, sp, spHit, trk, trkObj, seg, clamp, lerp, ease, bt, beatOf, beatAt, noise1, mulberry32 } = C;
  const { rise } = TYPE;
  C.fonts = ['600 100px Display', '400 40px UI', '600 40px UI', '400 30px Mono', '700 30px Mono'];
  const B = beatOf;
  const HIT = 2 / 60;
  const hit = (t, m, preset = 'snappy') => spHit(t, m, preset, HIT);
  // a settled spring snaps to exactly 1: text at a sub-pixel scale rasterises differently depending on the previous frame
  const settle = (p) => (Math.abs(1 - p) < 0.004 ? 1 : p);
  const grow = (p, from = 0.86) => { p = settle(p); return { s: from + (1 - from) * p, o: clamp(p * 5), hide: p <= 0.001 }; };
  const blur = (v) => (v > 0.05 ? `blur(${v.toFixed(2)}px)` : 'none');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const LIME = '#a3e635', INK = '#14310a', BG = '#0a0b0d';
  const X0 = 140;                                              // left margin for type
  let markN = 0;
  const MARK = (fill = LIME, ink = INK, id = `mk${markN++}`) => `<svg viewBox="0 0 64 64" width="100%" height="100%"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><circle cx="46" cy="18" r="9.5" fill="#000"/></mask></defs><rect width="64" height="64" rx="16" fill="${fill}"/><rect x="16" y="16" width="32" height="32" rx="10" fill="none" stroke="${ink}" stroke-width="7" mask="url(#${id})"/><circle cx="46" cy="18" r="5" fill="${ink}"/></svg>`;
  const lineL = (parent, text, o) => TYPE.line(parent, text, { x: o.x ?? X0, y: o.y, size: o.size, color: o.color, accent: o.accent });

  // ---------------------------------------------------------------- the tablet (16:10 landscape, aluminium frame, black glass)
  function tablet(parent, w, h, style = '') {
    const r = 0.052 * h, rim = Math.max(3, 0.012 * h), bez = 0.045 * h;
    const T = { w, h, rim, bez };
    T.el = reg(el('div', { class: 'abs', style: `width:${w}px;height:${h}px;${style}` }, parent));
    T.body = el('div', { class: 'abs', style: `width:${w}px;height:${h}px;border-radius:${r}px;overflow:hidden;
      background:linear-gradient(140deg,#5a5f66 0%,#2a2d32 18%,#16181b 46%,#30343a 70%,#121315 100%);
      box-shadow:0 ${0.08 * h}px ${0.2 * h}px -${0.04 * h}px rgba(0,0,0,.85)` }, T.el);
    T.spec = reg(el('div', { class: 'abs', style: `left:0;top:${-h}px;width:${0.18 * w}px;height:${3 * h}px;
      background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0))` }, T.body), { o: 0 });
    T.glass = el('div', { class: 'abs', style: `left:${rim}px;top:${rim}px;width:${w - 2 * rim}px;height:${h - 2 * rim}px;border-radius:${r - rim}px;
      background:#040506;overflow:hidden` }, T.body);
    el('div', { class: 'abs', style: `left:${w / 2 - rim - 0.006 * h}px;top:${bez * 0.42}px;width:${0.012 * h}px;height:${0.012 * h}px;border-radius:50%;background:#15181c` }, T.glass);
    T.screen = reg(el('div', { class: 'abs', style: `left:${bez}px;top:${bez}px;width:${w - 2 * rim - 2 * bez}px;height:${h - 2 * rim - 2 * bez}px;
      border-radius:${0.012 * h}px;background:#020203;overflow:hidden` }, T.glass));
    T.sw = w - 2 * rim - 2 * bez; T.sh = h - 2 * rim - 2 * bez;
    T.sheen = el('div', { class: 'abs', style: `left:0;top:0;width:${w}px;height:${h}px;border-radius:${r}px;pointer-events:none;
      background:linear-gradient(125deg,rgba(255,255,255,.07),rgba(255,255,255,0) 38%)` }, T.el);
    return T;
  }
  // a light band crossing the aluminium rim (the glass covers the inside, so only the rim catches it)
  function rimSweep(t, T, b0, b1) {
    const u = seg(t, b0, b1);
    put(T.spec, { o: u > 0 && u < 1 ? 1 : 0, x: lerp(-0.3 * T.w, 1.2 * T.w, ease.inOut(u)), r: 24 });
  }

  // ---------------------------------------------------------------- 1 · macro: the corner of the chassis  (open → 4)
  scene({
    name: 'edge', from: 'hook', to: 'port',
    build(root, S) {
      el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:radial-gradient(ellipse 60% 70% at 78% 30%, #1d1712 0%, ${BG} 70%)` }, root);
      S.cam = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.T = tablet(S.cam, 5200, 3250, 'left:1060px;top:250px');
      S.a = lineL(root, 'This is', { y: 330, size: 150 });
      S.b = lineL(root, 'a tablet.', { y: 500, size: 150, accent: [1] });
    },
    run(t, b, S) {
      put(S.cam, { s: 1.08 - 0.08 * ease.out(seg(t, 'hook', 'port')), x: -40 * seg(t, 'hook', 'port'), css: { transformOrigin: '1200px 400px' } });
      rimSweep(t, S.T, -1.4, 3.2);
      rise(t, S.a, ['t1', -1.2], B('port') - 0.3); rise(t, S.b, ['t2', -0.3], B('port') - 0.25);
    },
  });

  // ---------------------------------------------------------------- 2 · macro: side profile, USB-C, specs  (4 → 12)
  const SPECS = [['8 cores.', 'Unisoc T618', 'spec1'], ['3 GB of RAM.', 'shared by nothing else', 'spec2'], ['ARM64.', 'real Linux, via Termux', 'spec3']];
  scene({
    name: 'port', from: 'port', to: 'desk',
    build(root, S) {
      el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:radial-gradient(ellipse 70% 60% at 50% 70%, #19140f 0%, ${BG} 72%)` }, root);
      S.cam = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      // the bottom edge of the tablet, 7 mm thick, filling the frame
      S.bar = el('div', { class: 'abs', style: `left:-200px;top:600px;width:2320px;height:150px;border-radius:75px;
        background:linear-gradient(180deg,#8a9098 0%,#3b3f45 22%,#1d1f23 55%,#2c3035 80%,#0c0d0f 100%);box-shadow:0 40px 80px -20px rgba(0,0,0,.9)` }, S.cam);
      S.spec = reg(el('div', { class: 'abs', style: 'left:0;top:0;width:260px;height:150px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0))' }, S.bar), { o: 0 });
      S.bar.style.overflow = 'hidden';
      el('div', { class: 'abs', style: 'left:1100px;top:50px;width:210px;height:54px;border-radius:27px;background:#050506;box-shadow:inset 0 3px 6px rgba(0,0,0,.9), 0 1px 0 rgba(255,255,255,.18)' }, S.bar,
        '<div style="position:absolute;left:40px;top:22px;width:130px;height:10px;border-radius:4px;background:#2a2c30"></div>');
      [560, 1720].forEach((x) => el('div', { class: 'abs', style: `left:${x}px;top:70px;width:220px;height:12px;background:radial-gradient(circle at 6px 6px,#050506 3.5px,transparent 4px);background-size:16px 12px` }, S.bar));
      // the cable rises into the port
      S.plug = reg(el('div', { class: 'abs', style: 'left:845px;top:748px;width:240px;height:520px;transform-origin:120px 0;scale:1.4' }, S.cam,
        `<div class="abs" style="left:66px;top:0;width:108px;height:34px;border-radius:12px 12px 6px 6px;background:linear-gradient(90deg,#6d727a,#c9ced6 45%,#5a5e65)"></div>
         <div class="abs" style="left:30px;top:30px;width:180px;height:150px;border-radius:26px;background:linear-gradient(90deg,#141518,#2b2e33 40%,#0f1012)"></div>
         <div class="abs" style="left:92px;top:176px;width:56px;height:360px;background:linear-gradient(90deg,#0c0d0f,#25282c 45%,#0a0a0c)"></div>`));
      S.specs = SPECS.map(([a, sub]) => ({ big: lineL(root, a, { y: 170, size: 190 }), sub: reg(el('div', { class: 'abs mono', style: `left:${X0 + 8}px;top:410px;font-size:38px;color:var(--ink-2)` }, root, sub), { o: 0 }) }));
    },
    run(t, b, S) {
      put(S.cam, { x: lerp(260, -300, ease.inOut(seg(t, 'port', 'desk'))), s: 1.05 + 0.05 * seg(t, 'port', 'desk'), css: { transformOrigin: '960px 700px' } });
      const u = seg(t, 5, 9.5); put(S.spec, { o: u > 0 && u < 1 ? 1 : 0, x: lerp(-300, 2400, ease.inOut(u)) });
      const p = hit(t, 'plug', 'default');
      put(S.plug, { y: lerp(420, 0, p) });
      SPECS.forEach(([, , m], i) => {
        const out = i < 2 ? B(SPECS[i + 1][2]) - 0.18 : B('desk') - 0.25;
        rise(t, S.specs[i].big, m, out, { preset: 'heavy' });
        const sp_ = sp(t, B(m) + 0.3, 'snappy') - sp(t, out - 0.12, 'snappy');
        put(S.specs[i].sub, { o: clamp(sp_ * 5), hide: sp_ <= 0.001, y: 18 * (1 - clamp(sp_)) });
      });
    },
  });

  // ---------------------------------------------------------------- 3–4 · the desk, the screen wakes, "Look closer."  (12 → 24)
  const TW = 1180, TH = 738;
  scene({
    name: 'desk', from: 'desk', to: 'itsa',
    build(root, S) {
      S.room = el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:
        radial-gradient(ellipse 55% 75% at 12% 0%, rgba(255,186,110,.20), rgba(255,186,110,0) 70%),
        linear-gradient(180deg, ${BG} 0%, #0c0c0d 66%, #1a130d 67%, #0d0a08 100%)` }, root);
      S.cam = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.spill = reg(el('div', { class: 'abs', style: 'left:640px;top:520px;width:1500px;height:620px;border-radius:50%;background:radial-gradient(closest-side,rgba(163,230,53,.30),rgba(163,230,53,0))' }, S.cam), { o: 0 });
      S.shadow = el('div', { class: 'abs', style: 'left:700px;top:950px;width:1260px;height:90px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.85),rgba(0,0,0,0))' }, S.cam);
      S.T = tablet(S.cam, TW, TH, `left:${1300 - TW / 2}px;top:${560 - TH / 2}px`);
      // stand
      el('div', { class: 'abs', style: `left:${1300 - 120}px;top:${560 + TH / 2 - 6}px;width:240px;height:66px;border-radius:0 0 18px 18px;background:linear-gradient(180deg,#24272b,#101113)` }, S.cam);
      // screen: OLED black → the mark blooms → telemetry
      const sc = S.T.screen;
      S.glow = reg(el('div', { class: 'abs', style: `left:${S.T.sw / 2 - 300}px;top:${S.T.sh / 2 - 300}px;width:600px;height:600px;border-radius:50%;background:radial-gradient(closest-side,rgba(200,245,110,.45),rgba(200,245,110,0))` }, sc), { o: 0 });
      S.mk = reg(el('div', { class: 'abs', style: `left:${S.T.sw / 2 - 70}px;top:${S.T.sh / 2 - 90}px;width:140px;height:140px` }, sc, MARK()), { o: 0 });
      S.tele = reg(el('div', { class: 'abs mono', style: `left:0;top:${S.T.sh / 2 + 80}px;width:${S.T.sw}px;text-align:center;font-size:24px;color:var(--ink-3);white-space:pre` }, sc), { o: 0 });
      S.l1 = lineL(root, "On a student's", { y: 380, size: 104 });
      S.l2 = lineL(root, 'desk.', { y: 500, size: 104 });
      S.c1 = lineL(root, 'Look', { y: 380, size: 132 });
      S.c2 = lineL(root, 'closer.', { y: 520, size: 132, accent: [0] });
    },
    run(t, b, S) {
      // pull back from the macro, then a slow push; from 22 the camera dives into the screen
      const pull = sp(t, 'desk', 'heavy');
      const dive = ease.expoIn(seg(t, 22, 'itsa'));
      const s = lerp(1.55, 1, pull) * (1 + 0.035 * seg(t, 12, 22)) * (1 + 7 * dive);
      const fx = 1300, fy = 560;
      put(S.cam, { s, x: (960 - fx) * clamp(dive * 3), y: (540 - fy) * clamp(dive * 3), css: { transformOrigin: `${fx}px ${fy}px` } });
      rimSweep(t, S.T, 12.3, 15.6);
      const wake = hit(t, 'wake', 'default'), bloom = sp(t, 'bloom', 'heavy');
      put(S.T.screen, { css: { background: wake > 0.01 ? BG : '#020203' } });
      put(S.mk, grow(wake, 0.6));
      put(S.glow, { o: clamp(bloom) * (0.8 + 0.2 * Math.sin(b * Math.PI)), s: 0.6 + 0.6 * bloom });
      put(S.spill, { o: 0.15 * clamp(wake) + 0.6 * bloom });
      const n = clamp(Math.floor((b - B('bloom')) * 2) + 1, 0, 3);
      put(S.tele, { o: b >= B('bloom') + 0.5 ? 1 : 0, text: ['● online · uptime 41d 06:12', 'gateway ok · tunnel ok · memory ok', 'ARM64 · 8 cores · 38 °C'].slice(0, n).join('\n') });
      rise(t, S.l1, 'desk1', B('closer') - 0.3); rise(t, S.l2, B('desk1') + 0.25, B('closer') - 0.3);
      rise(t, S.c1, 'closer', B('itsa') - 0.6); rise(t, S.c2, B('closer') + 0.3, B('itsa') - 0.55);
    },
  });

  // ---------------------------------------------------------------- 5 · "It's not just a tablet." → "It's a" … (silence) … "real server."  (24 → 32)
  scene({
    name: 'itsa', from: 'itsa', to: 'drop',
    build(root, S) {
      S.bok = reg(el('div', { class: 'abs', style: 'left:1180px;top:200px;width:560px;height:560px;filter:blur(40px);opacity:.35' }, root, MARK()));
      S.n1 = lineL(root, "It's not", { y: 330, size: 150 });
      S.n2 = lineL(root, 'just a tablet.', { y: 500, size: 150, color: 'var(--ink-2)' });
      S.a = lineL(root, "It's a", { y: 400, size: 190 });
      S.car = reg(el('div', { class: 'abs', style: `left:${X0 + 560}px;top:420px;width:12px;height:180px;background:${LIME}` }, root), { o: 0 });
    },
    run(t, b, S) {
      rise(t, S.n1, 'itsa', B('impact1') - 0.25); rise(t, S.n2, B('itsa') + 0.5, B('impact1') - 0.22);
      rise(t, S.a, 'impact1', null);
      const silent = b >= B('gap');
      put(S.car, { o: b >= B('impact1') + 0.6 && Math.floor(b * 2) % 2 === 0 ? 1 : 0 });
      put(S.bok, { o: silent ? 0 : 0.35, x: -60 * seg(t, 'itsa', 'drop'), s: 1 + 0.1 * seg(t, 'itsa', 'drop') });
      put(S.root, { s: 1 + 0.09 * ease.inOut(seg(t, 'itsa', 'gap')) + (silent ? 0.03 : 0), css: { transformOrigin: '300px 500px' } });
    },
  });

  // ---------------------------------------------------------------- 6 · "a real server." + exploded view of the stack  (32 → 40)
  const LAYERS = [['Linux on ARM64', 'Termux · 24/7'], ['Isolated sandbox', 'Alpine containers'], ['Model gateway', 'Rust · OpenAI-compatible'],
    ['Nightly memory', 'tidied while you sleep'], ['Cloudflare Tunnel', '0 open ports']];
  const ISO = (x, y) => `translate(${x}px, ${y}px) rotate(-30deg) skewX(30deg) scale(1, 0.86)`;  // 2D isometric plate
  scene({
    name: 'stack', from: 'drop', to: 'work',
    build(root, S) {
      el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:radial-gradient(ellipse 50% 60% at 70% 55%, #12160d 0%, ${BG} 70%)` }, root);
      S.a = lineL(root, "It's a", { y: 120, size: 120 });
      S.b = lineL(root, 'real server.', { y: 236, size: 120, accent: [0, 1] });
      S.st = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.plates = [];
      const fills = ['linear-gradient(135deg,#454a51,#1b1d20)', '#10130e', '#0f1110', '#101114', '#0d1012', '#0a0b0d'];
      for (let i = 0; i < 6; i++) {
        const p = el('div', { class: 'abs', style: `left:0;top:0;width:640px;height:400px;border-radius:34px;background:${fills[i]};border:2px solid #2a2e35;
          transform-origin:0 0;box-shadow:0 40px 60px -20px rgba(0,0,0,.8)` }, S.st);
        if (i === 1) p.innerHTML = '<div class="abs" style="left:250px;top:130px;width:140px;height:140px;border-radius:14px;background:#1d2119;border:2px solid #3a4130"></div>';
        if (i >= 2 && i <= 4) p.style.backgroundImage = 'radial-gradient(circle at 2px 2px, rgba(163,230,53,.18) 1.5px, transparent 2px)', p.style.backgroundSize = '28px 28px';
        if (i === 5) p.innerHTML = `<div class="abs" style="left:250px;top:130px;width:140px;height:140px">${MARK()}</div>`;
        S.plates.push(reg(p));
      }
      S.labels = LAYERS.map(([a, b2], i) => {
        const g = reg(el('div', { class: 'abs', style: `left:${X0}px;top:${440 + i * 108}px;white-space:nowrap` }, root,
          `<span style="font-family:Display;font-weight:600;font-size:46px;letter-spacing:-.02em;color:var(--ink)">${a}</span>
           <span class="mono" style="font-size:26px;color:var(--ink-3);margin-left:18px">${b2}</span>`), { o: 0 });
        const ln = reg(el('div', { class: 'abs', style: `left:0;top:${470 + i * 108}px;height:2px;background:${LIME};transform-origin:0 0` }, root), { o: 0 });
        return { g, ln };
      });
    },
    run(t, b, S) {
      rise(t, S.a, B('drop') - 0.5, B('work') - 0.35); rise(t, S.b, 'drop', B('work') - 0.3, { stagger: 0.06 });
      // plates: flat stack at first, each layer above the chassis lifts on its beat; all collapse on 'collapse'
      const col = sp(t, 'collapse', 'heavy');
      const enter = sp(t, B('drop') + 0.2, 'heavy');
      S.plates.forEach((p, i) => {
        let lift = 0;
        for (let j = 1; j <= Math.min(i, 5); j++) lift += 64 * sp(t, B('l' + j) - 0.1, 'default');
        lift *= 1 - col;
        const active = i >= 1 && b >= B('l' + i) && b < (i < 5 ? B('l' + (i + 1)) : B('collapse'));
        put(p, { o: clamp(enter * 3), css: { transform: ISO(1120, 640 + 260 * (1 - enter) - lift - i * 14), borderColor: active ? LIME : '#2a2e35' } });
      });
      S.labels.forEach(({ g, ln }, i) => {
        const p = hit(t, 'l' + (i + 1), 'snappy') * (1 - col);
        put(g, { o: clamp(p * 5), hide: p <= 0.001, x: -20 * (1 - p) });
        // leader line from the label to its plate
        const len = 300 * clamp(p * 1.2);
        put(ln, { o: p > 0.01 ? 0.8 : 0, x: 760, css: { width: len + 'px' } });
      });
      put(S.st, { s: 1 + 0.03 * seg(t, 'drop', 'work'), css: { transformOrigin: '1300px 600px' } });
    },
  });

  // ---------------------------------------------------------------- 7–8 · the real UI at work, then the night, then the uptime  (40 → 56)
  const REQ = 'Find 3 recent papers on edge computing. Summarize them in Word.';
  const STEPS = [['WEB', 'edge computing 2025', '0.8s'], ['PAGE', 'arxiv.org · survey', '1.2s'], ['WRITE', 'Chapter 2.docx', '0.4s'], ['SANDBOX', 'gcc fcfs.c -o fcfs && ./fcfs', '1.315s']];
  const CW = 1200, CH = 750, CX0 = 1250, CY0 = 540;
  scene({
    name: 'work', from: 'work', to: 'no1',
    build(root, S) {
      S.room = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:radial-gradient(ellipse 55% 75% at 12% 0%, rgba(255,186,110,.16), rgba(255,186,110,0) 70%), ${BG}` }, root));
      S.cam = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.T = tablet(S.cam, CW, CH, `left:${CX0 - CW / 2}px;top:${CY0 - CH / 2}px`);
      const sc = S.T.screen, sw = S.T.sw;
      sc.style.background = BG;
      S.ui = reg(el('div', { class: 'abs', style: `width:${sw}px;height:${S.T.sh}px` }, sc));
      el('div', { class: 'abs', style: 'left:34px;top:26px;display:flex;align-items:center;gap:12px;font-size:24px;font-weight:600' }, S.ui,
        `<span style="width:34px;height:34px;display:inline-block">${MARK()}</span>rofihosted`);
      S.greet = reg(el('div', { class: 'abs serif', style: `left:0;top:170px;width:${sw}px;text-align:center;font-size:64px;color:var(--ink)` }, S.ui, 'Evening, Rofi'));
      S.comp = reg(el('div', { class: 'abs', style: `left:${sw / 2 - 380}px;top:290px;width:760px;min-height:76px;box-sizing:border-box;padding:20px 90px 20px 30px;border-radius:38px;background:#15171b;border:1.5px solid #2a2d33;font-size:26px;line-height:1.35;color:var(--ink)` }, S.ui));
      S.ctext = reg(el('div', {}, S.comp));
      S.send = reg(el('div', { class: 'abs', style: `left:auto;top:auto;right:14px;bottom:12px;width:52px;height:52px;border-radius:50%;background:${LIME};display:flex;align-items:center;justify-content:center` }, S.comp,
        `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`));
      S.bub = reg(el('div', { class: 'abs', style: `left:auto;right:60px;top:84px;max-width:560px;padding:16px 22px;border-radius:24px;background:#202329;border:1.5px solid #2c3036;font-size:24px;line-height:1.35;color:var(--ink)` }, S.ui, esc(REQ)), { o: 0 });
      S.act = reg(el('div', { class: 'abs', style: 'left:60px;top:226px;font-size:23px;color:var(--ink-2);white-space:nowrap' }, S.ui), { o: 0 });
      S.card = reg(el('div', { class: 'abs', style: `left:60px;top:270px;width:${sw - 120}px;height:250px;border-radius:22px;background:#111316;border:1.5px solid #22252b` }, S.ui), { o: 0 });
      S.rows = STEPS.map(([tag, d, tm], i) => reg(el('div', { class: 'abs mono', style: `left:0;top:${16 + i * 56}px;width:${sw - 120}px;height:50px;font-size:24px` }, S.card,
        `<span class="tag abs" style="left:26px;top:10px;font-size:22px">${tag}</span><span class="abs" style="left:170px;top:9px;color:var(--ink-2)">${esc(d)}</span><span class="abs" style="left:auto;right:26px;top:9px;color:var(--ink-3)">${tm}</span>`), { o: 0 }));
      // night: the room goes dark, the screen dims, memory tidies itself; morning: the uptime
      S.dark = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:#000` }, root), { o: 0 });
      S.dot = reg(el('div', { class: 'abs', style: `width:22px;height:22px;border-radius:50%;background:${LIME};box-shadow:0 0 40px 12px rgba(200,245,110,.55)` }, root), { o: 0 });
      S.mem = reg(el('div', { class: 'abs mono', style: `left:${CX0 - 300}px;top:${CY0 - 60}px;width:600px;font-size:26px;line-height:44px;color:var(--ink-2);white-space:pre` }, root), { o: 0 });
      S.clock = reg(el('div', { class: 'abs mono', style: `left:${CX0 - 300}px;top:${CY0 - 150}px;width:600px;font-size:34px;color:var(--ink-3)` }, root), { o: 0 });
      S.caps = [['It reads.', 's1'], ['It writes.', 's3'], ['It runs code.', 's4']].map(([c, m]) => ({ L: lineL(root, c, { y: 430, size: 84 }), m }));
      S.n1 = lineL(root, 'While you sleep,', { y: 390, size: 76 });
      S.n2 = lineL(root, 'it tidies its memory.', { y: 478, size: 76, color: 'var(--ink-2)' });
      S.pct = reg(el('div', { class: 'abs display', style: `left:${X0}px;top:350px;font-size:150px;color:var(--ink)` }, root), { o: 0 });
      S.pctl = reg(el('div', { class: 'abs mono', style: `left:${X0 + 8}px;top:530px;font-size:28px;color:var(--ink-2)` }, root, 'uptime · 90 days · checked every minute'), { o: 0 });
      S.bars = Array.from({ length: 45 }, (_, i) => reg(el('div', { class: 'abs', style: `left:${X0 + 8 + i * 10}px;top:600px;width:7px;height:56px;border-radius:3px;background:${i === 22 ? '#f5b82e' : '#4ade80'};transform-origin:50% 100%` }, root), { o: 0 }));
    },
    run(t, b, S) {
      const night = sp(t, 'night', 'default') - sp(t, B('up_from') - 0.5, 'heavy');
      const enter = sp(t, 'work', 'heavy');
      put(S.cam, { s: lerp(1.25, 1, enter) * (1 + 0.03 * seg(t, 40, 56)), x: 40 * (1 - enter), css: { transformOrigin: `${CX0}px ${CY0}px` } });
      rimSweep(t, S.T, 40.2, 43);
      // typing → send → bubble + activity
      const sent = b >= B('send');
      const n = Math.floor(seg(t, 'type_from', 'type_to') * REQ.length + 1e-6);
      const car = !sent && (n < REQ.length || Math.floor(b * 2) % 2 === 0) ? '<span class="caret" style="height:1em"></span>' : '';
      put(S.ctext, { html: sent ? '<span style="color:var(--ink-3)">Reply…</span>' : n === 0 ? '<span style="color:var(--ink-3)">What can I do for you?</span>' + car : esc(REQ.slice(0, n)) + car });
      put(S.send, { s: 1 - 0.14 * (sp(t, B('send') - 0.08, 'snappy') - sp(t, B('send') + 0.12, 'snappy')) });
      const down = sp(t, B('send') + 0.05, 'default');
      put(S.comp, { y: lerp(0, S.T.sh - 290 - 110, down) });
      const hp = sp(t, B('send') - 0.1, 'default');
      put(S.greet, { y: -120 * hp, o: 1 - clamp(hp * 1.5), clip: C.inset(0, 0, 100 * clamp(hp * 1.2), 0) });
      const bp = settle(sp(t, B('send') + 0.2, 'default'));
      put(S.bub, { ...grow(bp, 0.85), y: 80 * (1 - bp), css: { transformOrigin: '100% 100%' } });
      const spark = ['✻', '✳', '✺', '✹'][Math.floor(Math.max(0, b) * 2) % 4];
      put(S.act, { o: clamp(sp(t, B('send') + 0.4, 'snappy') * 5), html: `<span style="color:var(--lime-1)">${spark}</span> Simmering for <span style="color:var(--ink)">Rofi…</span>` });
      const op = sp(t, B('s1') - 0.4, 'default');
      put(S.card, { o: op > 0.001 ? 1 : 0, clip: C.inset(50 * (1 - op), 0, 50 * (1 - op), 0, 22) });
      S.rows.forEach((r, i) => { const p = hit(t, 's' + (i + 1), 'snappy'); put(r, { o: clamp(p * 5), hide: p <= 0.001, y: 16 * (1 - p) }); });
      // captions on the left, sequential
      S.caps.forEach(({ L, m }, i) => rise(t, L, m, i < 2 ? B(S.caps[i + 1].m) - 0.25 : B('night') - 0.3));
      // night
      put(S.dark, { o: 0.7 * night });
      const dimDot = night > 0.01;
      const pulse = 0.6 + 0.4 * Math.sin(b * Math.PI);
      put(S.dot, { o: dimDot ? night * pulse : 0, x: CX0 + CW / 2 - 70, y: CY0 - CH / 2 + 26 });
      const hh = Math.floor(lerp(23 * 60 + 41, 30 * 60 + 58, ease.inOut(seg(t, 'night', B('up_from') - 0.5)))) % (24 * 60);
      put(S.clock, { o: night, text: `${String(Math.floor(hh / 60)).padStart(2, '0')}:${String(hh % 60).padStart(2, '0')}` });
      const mn = clamp(Math.floor(b - B('sleep1')) + 1, 0, 3);
      put(S.mem, { o: night, text: ['memory  merged 3 notes', 'memory  thesis topic: edge computing', 'memory  tidy · done'].slice(0, mn).join('\n') });
      rise(t, S.n1, 'sleep1', B('up_from') - 0.4); rise(t, S.n2, 'sleep2', B('up_from') - 0.35);
      // morning: uptime counts up, 90 bars sweep in
      const up = sp(t, 'up_from', 'heavy');
      const v = 90 + 9.94 * ease.out(seg(t, 'up_from', 'up_to'));
      put(S.pct, { o: clamp(up * 5), hide: up <= 0.001, y: 30 * (1 - clamp(up)), text: v.toFixed(2) + '%' });
      put(S.pctl, { o: clamp(up * 5), hide: up <= 0.001 });
      S.bars.forEach((bar, i) => { const p = sp(t, B('up_from') + i * 0.04, 'snappy'); put(bar, { o: p > 0.01 ? 1 : 0, sy: Math.max(0.02, p) }); });
    },
  });

  // ---------------------------------------------------------------- 9 · the track's stutter hits: three slams  (57 → 60)
  const SLAMS = [['no1', 'No subscription.', BG, '#f7f8f8'], ['no2', 'No telemetry.', LIME, INK], ['no3', 'Just yours.', BG, LIME]];
  SLAMS.forEach(([m, text, bg, fg], i) => scene({
    name: m, from: m, to: i < 2 ? SLAMS[i + 1][0] : 'tag',
    build(root, S) {
      root.style.background = bg;
      S.box = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.L = TYPE.line(S.box, text, { x: 0, y: 430, size: 190, color: fg });
      S.L.el.style.left = '50%'; S.L.el.style.marginLeft = `-${text.length * 0.27 * 190}px`;
    },
    run(t, b, S) {
      const p = spHit(t, m, 'snappy');
      put(S.box, { s: lerp(1.3, 1, p) + 0.03 * seg(t, m, B(m) + 1), css: { transformOrigin: '960px 540px' } });
      rise(t, S.L, B(m) - 0.08, null, { preset: 'snappy', stagger: 0.03 });
    },
  }));

  // ---------------------------------------------------------------- 10 · tagline → lockup → URL on the horizon glow  (60 → end)
  scene({
    name: 'end', from: 'tag', to: 'done', post: 1,
    build(root, S) {
      S.g = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      el('div', { class: 'abs', style: `left:-240px;top:${H - 380}px;width:2400px;height:900px;border-radius:50%;background:radial-gradient(closest-side, rgba(200,245,110,.5), rgba(163,230,53,.16) 45%, rgba(163,230,53,0) 72%)` }, S.g);
      el('div', { class: 'abs', style: `left:${960 - 2000}px;top:${H - 150}px;width:4000px;height:4000px;border-radius:50%;background:${BG};border-top:4px solid rgba(214,250,140,.95);box-shadow:0 -10px 70px rgba(200,245,110,.55)` }, S.g);
      S.t1 = TYPE.line(root, 'One tablet. A real server.', { x: 0, y: 300, size: 120, accent: [2, 3, 4] });
      S.t1.el.style.left = '50%'; S.t1.el.style.marginLeft = '-760px';
      S.lock = reg(el('div', { class: 'abs', style: `left:0;top:520px;width:${W}px;height:140px;display:flex;justify-content:center;align-items:center;gap:40px` }, root));
      S.mk = reg(el('span', { style: 'width:150px;height:150px;display:inline-block;position:relative' }, S.lock, MARK()), { o: 0 });
      S.wm = reg(el('img', { src: '../assets/brand/wordmark-white.svg', style: `width:${Math.round(100 * 157 / 41.6)}px;height:100px` }, S.lock));
      S.url = reg(el('div', { class: 'abs mono', style: `left:0;top:720px;width:${W}px;text-align:center;font-size:60px;color:var(--lime-1);white-space:pre` }, root));
    },
    run(t, b, S) {
      const L = sp(t, 'tag', 'heavy');
      put(S.g, { y: (1 - L) * 420, o: clamp(L * 1.4) });
      rise(t, S.t1, B('tag') - 0.1, null, { stagger: 0.07 });
      put(S.mk, grow(spHit(t, 'lockup', 'snappy', 4 / 60), 0.5));
      const wp = sp(t, B('lockup') + 0.15, 'default');
      put(S.wm, { clip: C.inset(0, 100 - 100 * clamp(wp), 0, 0), x: -30 * (1 - wp), hide: wp <= 0.001 });
      const U = 'rofihosted.space', n = Math.floor(seg(t, 'url', B('url') + 1.5) * U.length + 1e-6);
      const car = b >= B('url') - 0.3 && (n < U.length || Math.floor(b * 2) % 2 === 0) ? '<span class="caret"></span>' : '';
      put(S.url, { html: esc(U.slice(0, n)) + car + `<span class="ghost">${U.slice(n)}</span>` });
      put(S.root, { s: 1 + 0.03 * seg(t, 'tag', 'done') });
    },
  });

  // ---------------------------------------------------------------- grain + vignette
  scene({
    name: 'fx', from: 'hook', to: 'done', post: 1, cut: false,
    build(root, S) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), img = g.createImageData(256, 256), r = mulberry32(2024);
      for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      S.grain = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background-image:url(${c.toDataURL()});opacity:.05;mix-blend-mode:overlay` }, root));
      el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:radial-gradient(ellipse 72% 72% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,.45) 100%)` }, root);
    },
    run(t, b, S) {
      const r = mulberry32(Math.round(t * 60) + 1);
      put(S.grain, { css: { backgroundPosition: `${Math.floor(r() * 256)}px ${Math.floor(r() * 256)}px` } });
    },
  });

  C.start();
})();
