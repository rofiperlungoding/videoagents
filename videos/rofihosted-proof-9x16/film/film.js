// rofihosted · "The Proof" · 60 s · 9:16 · 112 BPM. Shotlist: docs/shotlist.md (APPROVED). Marks + SFX: timeline.json.
//
// One object carries the first half: the logo mark builds from its status dot, grows into the tablet, then shrinks
// back into the network node the camera dives through into the phone. Product UI is REBUILT in English element by
// element from brands/rofihosted/assets/app.css + the exported screens (assets/site/*.png show Indonesian demo chats).
// 2D transforms only (CSS 3D breaks seek determinism): tilts are skew + scale.
// Pure function of time: no timers, no Math.random, nothing mutated in run().
(() => {
  const { W, H, put, reg, el, scene, sp, spHit, trk, trkObj, seg, clamp, lerp, ease, bt, beatOf, beatAt, leadFor, noise1, mulberry32 } = C;
  const { rise } = TYPE;
  C.fonts = ['700 100px Display', '400 40px UI', '600 40px UI', '400 30px Mono', '700 30px Mono'];   // Serif: loaded via fonts.ready (its space-probe returns empty)

  const B = beatOf;
  const HIT = 2 / 60;                                           // pops snap visible within ~2 frames
  const hit = (t, m, preset = 'snappy') => spHit(t, m, preset, HIT);
  const grow = (p, from = 0.86) => ({ s: from + (1 - from) * p, o: clamp(p * 5), hide: p <= 0.001 });
  const blur = (v) => (v > 0.05 ? `blur(${v.toFixed(2)}px)` : 'none');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const CX = W / 2;
  const LIME = '#a3e635', INK = '#14310a', BG = '#0a0b0d';
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixc = (a, b, p) => { const x = rgb(a), y = rgb(b); p = clamp(p); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(',')})`; };
  let markN = 0;
  const MARK_SVG = (fill = LIME, ink = INK, id = `mk${markN++}`) => `<svg viewBox="0 0 64 64" width="100%" height="100%"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><circle cx="46" cy="18" r="9.5" fill="#000"/></mask></defs><rect width="64" height="64" rx="16" fill="${fill}"/><rect x="16" y="16" width="32" height="32" rx="10" fill="none" stroke="${ink}" stroke-width="7" mask="url(#${id})"/><circle cx="46" cy="18" r="5" fill="${ink}"/></svg>`;

  // centred masked line → { el, words, size } (works with TYPE.rise)
  function cline(parent, text, o) {
    const wrap = el('div', { class: 'abs', style: `left:0;top:${o.y}px;width:${W}px;text-align:center` }, parent);
    const ln = el('div', { class: `cl ${o.cls || 'display'}`, style: `font-size:${o.size}px;${o.color ? `color:${o.color};` : ''}${o.css || ''}` }, wrap);
    const parts = text.split(' ');
    const words = parts.map((w, i) => {
      const s = el('span', { class: 'word' }, ln, esc(w));
      if (o.accent && o.accent.includes(i)) s.style.color = o.accColor || 'var(--accent)';
      if (i < parts.length - 1) ln.appendChild(document.createTextNode(' '));
      return reg(s, { y: 0 });
    });
    reg(wrap); reg(ln);
    return { el: wrap, ln, words, size: o.size };
  }
  // centred typewriter whose layout never moves: untyped characters are laid out but transparent
  function ctext(parent, text, o) {
    const e = el('div', { class: `abs ${o.cls || 'display'}`, style: `left:0;top:${o.y}px;width:${W}px;text-align:center;white-space:pre;font-size:${o.size}px;${o.css || ''}` }, parent);
    reg(e, { o: 0 });
    return { el: e, text };
  }
  function ctype(t, T, b0, b1, caretOn = true, caretOff = Infinity) {
    const n = Math.floor(seg(t, b0, b1) * T.text.length + 1e-6), b = beatAt(t);
    const blink = n < T.text.length || Math.floor(b * 2) % 2 === 0;
    const car = caretOn && b < B(caretOff) && blink ? '<span class="caret"></span>' : '';
    put(T.el, { o: b >= B(b0) - 0.5 ? 1 : 0, html: esc(T.text.slice(0, n)) + car + `<span class="ghost">${esc(T.text.slice(n))}</span>` });
    return n;
  }
  const push = (t, S, a, b, k = 0.04) => put(S.root, { s: 1 + k * ease.inOut(seg(t, a, b)) });

  // ================================================================ 1–2 · hook + the rent  (0 → 14)
  const HOOK_A = 'Your AI lives on\n', HOOK_B = "someone else's\nserver.";
  const FRAGS = [
    { text: '$20 / month', icon: '◔', x: 520, y: 300 },
    { text: 'Rate limit reached', icon: '⚠', x: 90, y: 1150 },
    { text: 'Your chats → training data', icon: '↗', x: 170, y: 1370 },
  ];
  scene({
    name: 'rent', from: 'hook', to: 'stop',
    build(root, S) {
      S.frags = FRAGS.map((f, i) => {
        const p = el('div', { class: 'pill', style: `left:${f.x}px;top:${f.y}px;color:var(--ink-2)` }, root,
          `<span style="color:var(--ink-3);font-size:40px">${f.icon}</span><span>${esc(f.text)}</span>`);
        return reg(p);
      });
      S.block = el('div', { class: 'abs display', style: `left:96px;top:600px;font-size:124px;line-height:1.06;white-space:pre;width:900px` }, root);
      reg(S.block);
    },
    run(t, b, S) {
      // typing: frame 0 already shows the first letters (line 1 released before t = 0)
      const nA = Math.floor(seg(t, 'type1_from', 'type1_to') * HOOK_A.length + 1e-6);
      const nB = Math.floor(seg(t, 'type2_from', 'type2_to') * HOOK_B.length + 1e-6);
      const sel = hit(t, 'select', 'snappy');
      const blink = (nA < HOOK_A.length || (nB > 0 && nB < HOOK_B.length)) || Math.floor(b * 2) % 2 === 0;
      const car = b < 8 && blink ? '<span class="caret"></span>' : '';
      let html = esc(HOOK_A.slice(0, nA));
      if (nB > 0) {
        const typed = HOOK_B.slice(0, nB), split = typed.indexOf('\n');
        const inner = split < 0 ? esc(typed) : esc(typed.slice(0, split + 1)) + `<span class="sv">${esc(typed.slice(split + 1))}</span>`;
        html += `<span class="sel" style="background-size:${(sel * 100).toFixed(2)}% 100%;color:${sel > 0.5 ? INK : 'var(--ink)'}">${inner}</span>`;
      }
      html += car + `<span class="ghost">${esc(HOOK_A.slice(nA) + HOOK_B.slice(nB))}</span>`;
      // the block recedes behind the fragments (8), comes back sharp (12.75), then the camera dives through "server."
      const back = sp(t, 'frag1', 'heavy') - sp(t, 12.75, 'heavy');
      const k = ease.expoIn(seg(t, 'dive', 'stop'));
      const sv = S.block.querySelector('.sv');
      const tx = sv ? sv.offsetLeft + sv.offsetWidth * 0.45 : 300, ty = sv ? sv.offsetTop + sv.offsetHeight * 0.55 : 300;
      // scale about "server." and carry it to the frame centre (block origin is its top-left at 96, 640)
      const s = (1 - 0.18 * back) * (1 + 0.035 * seg(t, 0, 8)) * (1 + 60 * k);
      const q = ease.inOut(seg(t, 13, 'stop'));
      const X = lerp(96 + tx, CX, q) - 96 - s * tx, Y = lerp(600 + ty - 230 * back, H / 2, q) - 600 - s * ty;
      put(S.block, { html, x: X, y: Y, s, filter: blur(7 * back + 30 * k),
        css: { transformOrigin: '0 0', color: mixc('#f7f8f8', '#686d77', back * 0.6) } });
      // fragments: drift blurred at depth, then fly forward one per 2 beats and past the camera
      const nz = noise1(5);
      S.frags.forEach((f, i) => {
        const inB = B('frag' + (i + 1)), outB = i < 2 ? B('frag' + (i + 2)) : B('dive');
        const fwd = hit(t, inB, 'default'), gone = sp(t, outB - 0.03, 'default');
        const F = FRAGS[i], w = 40 * F.text.length * 0.55 + 140;
        const homeX = F.x + 18 * nz(t * 0.4 + i * 7), homeY = F.y + 14 * nz(t * 0.3 + i * 13);
        const tgtX = CX - w / 2, tgtY = 1060 + (i - 1) * 50;
        const x = lerp(homeX, tgtX, fwd), y = lerp(homeY, tgtY, fwd) + gone * (i % 2 ? 500 : -500);
        const sc = lerp(0.8, 1.35, fwd) * (1 + 3.2 * gone);
        put(f, { x: x - F.x, y: y - F.y, s: sc, o: lerp(0.75, 1, fwd) * (1 - clamp(gone * 1.4)), filter: blur(lerp(5, 0, fwd) + 26 * gone),
          css: { transformOrigin: `${w / 2}px 50px`, color: fwd > 0.5 ? 'var(--ink)' : 'var(--ink-2)' } });
      });
    },
  });

  // "Stop renting." on lime: the dive came through the lime selection, the line pulls into focus
  scene({
    name: 'stop', from: 'stop', to: 'meet',
    build(root, S) {
      root.style.background = LIME;
      S.l1 = cline(root, 'Stop', { y: 640, size: 230, color: INK });
      S.l2 = cline(root, 'renting.', { y: 880, size: 230, color: INK });
    },
    run(t, b, S) {
      const f = sp(t, 'stop', 'heavy'), sharp = sp(t, 'stop_sharp', 'heavy');
      put(S.root, { s: lerp(1.5, 1.08, f) - 0.06 * sharp + 0.03 * seg(t, 15, 16) });
      [S.l1, S.l2].forEach((L) => put(L.el, { filter: blur(lerp(26, 9, f) * (1 - sharp)) }));
    },
  });

  // ================================================================ glow: lime horizon / eclipse behind hero moments
  function buildGlow(root) {
    const g = el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:${H}px` }, root);
    el('div', { class: 'abs', style: `left:-560px;top:${H - 520}px;width:2200px;height:1200px;border-radius:50%;
      background:radial-gradient(closest-side, rgba(200,245,110,.55), rgba(163,230,53,.20) 45%, rgba(163,230,53,0) 72%)` }, g);
    el('div', { class: 'abs', style: `left:${CX - 1500}px;top:${H - 210}px;width:3000px;height:3000px;border-radius:50%;background:${BG};
      border-top:4px solid rgba(214,250,140,.95);box-shadow:0 -10px 70px rgba(200,245,110,.55), inset 0 30px 60px -30px rgba(200,245,110,.35)` }, g);
    return reg(g);
  }
  const glowLevel = (t) => trk(t, [[0, 0], [16, 1, 'heavy'], [22, 0.55, 'default'], [30, 0.85, 'default'], [38, 0.5, 'default'], [44, 0.2, 'default'], [46.5, 0, 'snappy']]);
  scene({
    name: 'glow', from: 'meet', to: 'phone',
    build(root, S) { S.g = buildGlow(root); },
    run(t, b, S) {
      const L = glowLevel(t), nz = noise1(77);
      put(S.g, { y: (1 - L) * 520 + 10 * nz(t * 0.5), o: clamp(L * 1.4), css: { transformOrigin: '50% 100%' } });
      put(S.root, netCam(t));
    },
  });

  // ================================================================ 3 · "Meet" → mark → "rofihosted"  (16 → 24)
  scene({
    name: 'meet', from: 'meet', to: 'build1',
    build(root, S) {
      S.meet = cline(root, 'Meet', { y: 400, size: 250 });
      // the real wordmark (assets/brand/wordmark-white.svg, 157 × 41.6) rises through a mask
      const NW = 640, NH = NW * 41.6 / 157;
      S.nmask = el('div', { class: 'abs', style: `left:${CX - NW / 2}px;top:1050px;width:${NW}px;height:${NH + 16}px;overflow:hidden` }, root);
      S.nimg = reg(el('img', { src: '../assets/brand/wordmark-white.svg', style: `position:absolute;left:0;top:0;width:${NW}px;height:${NH}px` }, S.nmask));
      S.NH = NH;
    },
    run(t, b, S) {
      // giant motion-blurred "Meet" shrinks into place on the drop
      const m = spHit(t, 'meet', 'heavy');
      put(S.meet.el, { s: lerp(4.2, 1, m), y: lerp(240, 0, m), filter: blur(lerp(34, 0, clamp(m * 1.15))), css: { transformOrigin: `${CX}px 520px` } });
      put(S.meet.words[0], { y: b >= B('meet_out') - 0.2 ? -S.meet.size * 1.45 * sp(t, B('meet_out') - 0.2, 'snappy') : 0 });
      const ny = S.NH * 1.45 * (1 - spHit(t, 'word', 'heavy')) - S.NH * 1.45 * sp(t, B('meet_out') - 0.14, 'snappy');
      put(S.nimg, { y: ny, hide: Math.abs(ny) >= S.NH * 1.449 });
      put(S.root, { s: 1 + 0.03 * seg(t, 16, 24) });
    },
  });

  // ================================================================ the mark → tablet → node (18 → 48)
  // Geometry from assets/brand/mark.svg (viewBox 12.5 → 51.5): frame stroke 7/39, outer radius 13.5/39, status dot r 5/39 at
  // (33.5, 5.5)/39 from the frame's top-left, with a notch r 9.5/39 cut out of the frame around it.
  const MK = { // [beat, {x, y, w, h, m}] ; m = 0 mark, 1 tablet
    keys: [[0, { x: CX, y: 860, w: 210, h: 210, m: 0 }], [22, { x: CX, y: 1200, w: 170, h: 170, m: 0 }, 'heavy'],
      [30, { x: CX, y: 880, w: 900, h: 590, m: 1 }, 'heavy'], [40, { x: CX, y: 820, w: 160, h: 160, m: 0 }, 'heavy']],
  };
  const markGeo = (t) => trkObj(t, MK.keys, 'heavy');
  // camera for the network shot: pull back on 40, dive into the phone node from into_phone
  const PHONE_NODE = { x: 230, y: 420 };
  function netCam(t) {
    const k = ease.expoIn(seg(t, 'into_phone', 'phone'));
    const s = (1 + 0.25 * (1 - sp(t, 'network', 'heavy')) * (beatAt(t) >= 40 ? 1 : 0)) * (1 + 13 * k);
    const fx = lerp(CX, PHONE_NODE.x, ease.inOut(seg(t, 'into_phone', 47.4))), fy = lerp(H / 2, PHONE_NODE.y, ease.inOut(seg(t, 'into_phone', 47.4)));
    return { x: (CX - fx) * s, y: (H / 2 - fy) * s, s };   // point (fx, fy) → frame centre (scene roots scale about the centre)
  }
  scene({
    name: 'mark', from: 'mark', to: 'phone', pre: 0.15, cut: false,
    build(root, S) {
      S.wrap = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.frame = reg(el('div', { class: 'abs', style: 'box-sizing:border-box;border-style:solid;overflow:hidden' }, S.wrap));
      S.screen = reg(el('div', { class: 'abs', style: 'left:0;top:0;width:856px;height:546px' }, S.frame), { o: 0 });
      buildTabletScreen(S.screen, S);
      S.sweep = reg(el('div', { class: 'abs', style: 'left:0;top:-200px;width:220px;height:1000px;background:linear-gradient(90deg,rgba(200,245,110,0),rgba(200,245,110,.16),rgba(200,245,110,0))' }, S.frame), { o: 0 });
      S.notch = reg(el('div', { class: 'abs', style: `border-radius:50%;background:${BG}` }, S.wrap));
      S.dot = reg(el('div', { class: 'abs', style: `border-radius:50%;background:${LIME}` }, S.wrap));
      S.bloom = reg(el('div', { class: 'abs', style: 'border-radius:50%;background:radial-gradient(closest-side,rgba(200,245,110,.55),rgba(200,245,110,0))' }, S.wrap), { o: 0 });
    },
    run(t, b, S) {
      const g = markGeo(t), m = clamp(g.m);
      const bw = lerp(7 / 39 * g.w, 20, m), rad = lerp(13.5 / 39 * g.w, 54, m);
      const dr = lerp(5 / 39 * g.w, 9, m), nr = lerp(9.5 / 39 * g.w, 0, m);
      const dx = lerp(33.5 / 39 * g.w, g.w - 46, m), dy = lerp(5.5 / 39 * g.h, 10, m);
      const L = g.x - g.w / 2, T = g.y - g.h / 2;
      // build from the dot: the dot pops on 'mark', the frame grows out of it half a beat later
      const pDot = hit(t, 'mark', 'snappy'), pFrame = sp(t, B('mark') + 0.4, 'default');
      // swing-in for the tablet (fake 3D in 2D: skew + squash settling flat)
      const swing = sp(t, 29.6, 'default') - sp(t, 31.4, 'heavy');
      const sk = 9 * swing, sq = 1 - 0.14 * swing;
      const border = mixc(LIME, '#2a2e35', m);
      put(S.frame, { css: { left: L + 'px', top: T + 'px', width: g.w + 'px', height: g.h + 'px', borderWidth: bw + 'px', borderRadius: rad + 'px',
        borderColor: border, background: mixc(BG, '#0d0f11', m), boxShadow: m > 0.02 ? `0 0 0 2px rgba(163,230,53,${(0.55 * m).toFixed(3)}), 0 60px 140px -40px rgba(0,0,0,.9)` : 'none',
        transformOrigin: `${dx}px ${dy}px`, transform: `skewY(${(-sk).toFixed(3)}deg) scale(${(pFrame * sq).toFixed(5)}, ${pFrame.toFixed(5)})` } });
      const dotX = L + dx, dotY = T + dy;
      const nzr = nr * pFrame;
      put(S.notch, { css: { left: dotX - nzr + 'px', top: dotY - nzr + 'px', width: 2 * nzr + 'px', height: 2 * nzr + 'px', transform: 'none' } });
      // the status dot breathes on every beat from the tablet on (it is the server's heartbeat)
      const beatPulse = b >= 32 ? Math.exp(-((b % 1) * 6)) : 0;
      const dsz = dr * (0.86 + 0.14 * pDot) * (1 + 0.25 * beatPulse);
      put(S.dot, { o: clamp(pDot * 5), hide: pDot <= 0.001, css: { left: dotX - dsz + 'px', top: dotY - dsz + 'px', width: 2 * dsz + 'px', height: 2 * dsz + 'px', transform: 'none' } });
      const bl = 70 + 40 * beatPulse;
      put(S.bloom, { o: clamp(pDot) * (0.5 + 0.5 * beatPulse), css: { left: dotX - bl + 'px', top: dotY - bl + 'px', width: 2 * bl + 'px', height: 2 * bl + 'px', transform: 'none' } });
      // screen wakes on 'tablet'; the glass sweep crosses when it lands
      const wake = hit(t, 'tablet', 'default') * (1 - sp(t, B('network') - 0.4, 'snappy'));
      put(S.screen, { o: clamp(wake * 4), hide: wake <= 0.001, css: { transform: `scale(${(g.w - 2 * bw) / 856}, ${(g.h - 2 * bw) / 546})`, transformOrigin: '0 0' } });
      runTabletScreen(t, b, S, wake);
      const sw = seg(t, B('tablet') + 0.15, B('tablet') + 1.4);
      put(S.sweep, { o: sw > 0 && sw < 1 ? 1 : 0, x: lerp(-300, 1100, ease.inOut(sw)), r: 20 });
      // camera: slow pull back during the word build, network camera after that
      const pull = b < 32 ? (1 + 0.06 * (1 - ease.out(seg(t, 22, 30)))) : 1;
      const nc = netCam(t);
      put(S.root, { x: nc.x, y: nc.y, s: nc.s * pull });
    },
  });

  // tablet screen: rofihosted telemetry, in the product's own faces (Mono for telemetry, Display for the big number)
  const LOGS = ['gateway   200  /v1/chat        142ms', 'tunnel    ok   app.rofihosted.space', 'memory    tidy 3 notes merged', 'sandbox   run  gcc fcfs.c      1.3s',
    'gateway   200  /v1/chat         98ms', 'health    ok   all services', 'web       get  arxiv.org      0.8s', 'gateway   200  /v1/chat        131ms'];
  function buildTabletScreen(sc, S) {
    sc.innerHTML = `
      <div class="abs" style="left:34px;top:28px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600;color:var(--ink)">
        <span style="width:40px;height:40px;display:inline-block">${MARK_SVG()}</span>rofihosted</div>
      <div class="abs mono" style="left:560px;top:34px;font-size:26px;color:var(--lime-1)">● online</div>
      <div class="abs mono" style="left:34px;top:104px;font-size:24px;color:var(--ink-3);letter-spacing:.08em">UPTIME</div>
      <div class="abs display" data-k="up" style="left:30px;top:132px;font-size:92px;color:var(--ink)">41d 06:12:09</div>
      ${[['CPU', '23%'], ['TEMP', '38°C'], ['RAM', '5.1 GB'], ['TUNNEL', '0 ports']].map(([k, v], i) =>
        `<div class="abs mono" style="left:${34 + i * 205}px;top:262px;font-size:22px;color:var(--ink-3);letter-spacing:.08em">${k}</div>
         <div class="abs mono" style="left:${34 + i * 205}px;top:292px;font-size:32px;color:var(--ink)">${v}</div>`).join('')}
      <div class="abs" style="left:34px;top:358px;width:788px;height:1.5px;background:var(--line)"></div>
      <div class="abs mono" data-k="log" style="left:34px;top:376px;width:788px;height:160px;overflow:hidden;font-size:25px;line-height:38px;color:var(--ink-2);white-space:pre"></div>`;
    S.up = reg(sc.querySelector('[data-k=up]')); S.log = reg(sc.querySelector('[data-k=log]'));
  }
  function runTabletScreen(t, b, S, wake) {
    const sec = 6 * 3600 + 12 * 60 + 9 + Math.floor(Math.max(0, t - bt('tablet')));
    const hh = String(Math.floor(sec / 3600)).padStart(2, '0'), mm = String(Math.floor(sec / 60) % 60).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0');
    put(S.up, { text: `41d ${hh}:${mm}:${ss}` });
    const n = clamp(Math.floor((b - B('tablet')) * 2) + 1, 0, LOGS.length);
    put(S.log, { text: LOGS.slice(Math.max(0, n - 4), n).join('\n') });
  }

  // ================================================================ 4 · word build: "A personal AI server running on one tablet."
  scene({
    name: 'build', from: 'build1', to: 'tablet_frame', post: 0.6,
    build(root, S) {
      S.a = cline(root, 'A personal', { y: 330, size: 132 });
      S.b = cline(root, 'AI server', { y: 476, size: 132 });
      S.c = cline(root, 'running on', { y: 640, size: 132, color: 'var(--ink-2)' });
      S.d = cline(root, 'one tablet.', { y: 786, size: 132, accent: [0, 1] });
    },
    run(t, b, S) {
      const out = B('tablet_frame') - 0.3;
      rise(t, S.a, [24, 24.5], out); rise(t, S.b, [25, 25.5], out);
      rise(t, S.c, [27, 27.5], out); rise(t, S.d, [28, 28.5], out);
      put(S.root, { s: lerp(1.1, 0.97, ease.out(seg(t, 24, 30))) });
    },
  });

  // ================================================================ 5 · hardware HUD + "[ One tablet. A real server. ]"
  const HUDS = [
    { k: 'hud1', html: 'ARM64 <b>·</b> Unisoc T618', x: 100, y: 340, lx: 210, ly0: 585, ly1: 400 },
    { k: 'hud2', html: '24/7 <b>·</b> self-healing', x: 500, y: 450, lx: 850, ly0: 585, ly1: 510 },
    { k: 'hud3', html: 'Cloudflare Tunnel <b>·</b> 0 open ports', x: 100, y: 1262, lx: 300, ly0: 1175, ly1: 1250 },
    { k: 'hud4', html: 'Model gateway <b>·</b> 3 models', x: 350, y: 1352, lx: 790, ly0: 1175, ly1: 1340 },
  ];
  scene({
    name: 'hw', from: 'tablet', to: 'network',
    build(root, S) {
      S.h = HUDS.map((h) => {
        const ln = reg(el('div', { class: 'abs', style: `left:${h.lx - 1.5}px;width:3px;background:var(--accent)` }, root), { o: 0 });
        const tip = reg(el('div', { class: 'abs', style: `left:${h.lx - 7}px;top:${h.ly1 - 7}px;width:14px;height:14px;border-radius:50%;background:var(--accent)` }, root), { o: 0 });
        const tx = reg(el('div', { class: 'hud', style: `left:${h.x}px;top:${h.y}px` }, root, h.html), { o: 0 });
        return { ln, tip, tx, h };
      });
      S.hero1 = cline(root, 'One tablet.', { y: 1250, size: 100 });
      S.hero2 = cline(root, 'A real server.', { y: 1366, size: 100, accent: [2] });
      S.bl = reg(el('div', { class: 'abs display', style: 'left:0;top:1222px;font-size:250px;font-weight:300;color:var(--accent);line-height:1' }, root, '['), { o: 0 });
      S.br = reg(el('div', { class: 'abs display', style: 'left:0;top:1222px;font-size:250px;font-weight:300;color:var(--accent);line-height:1' }, root, ']'), { o: 0 });
    },
    run(t, b, S) {
      const leave = sp(t, B('network') - 0.45, 'snappy');
      S.h.forEach(({ ln, tip, tx, h }, i) => {
        const p = spHit(t, h.k, 'snappy', 4 / 60), out = i >= 2 ? sp(t, B('bracket1') - 0.3, 'snappy') : leave;
        const len = Math.abs(h.ly1 - h.ly0) * clamp(p * 1.3) * (1 - out);
        const top = Math.min(h.ly0, h.ly0 + Math.sign(h.ly1 - h.ly0) * len);
        put(ln, { o: len > 1 ? 1 : 0, css: { top: top + 'px', height: len + 'px' } });
        put(tip, { ...grow(p * (1 - out), 0.3) });
        const tp = spHit(t, h.k, 'snappy', 3 / 60) * (1 - out);
        put(tx, { o: clamp(tp * 5), hide: tp <= 0.001, x: (i % 2 ? 24 : -24) * (1 - tp), clip: C.inset(0, 100 - 100 * clamp(tp * 1.1), 0, 0) });
      });
      rise(t, S.hero1, B('bracket1') + 0.1, B('network') - 0.35, { preset: 'heavy' });
      rise(t, S.hero2, B('bracket1') + 0.25, B('network') - 0.3, { preset: 'heavy' });
      const bk = hit(t, 'bracket1', 'snappy'), bo = sp(t, B('network') - 0.4, 'snappy');
      const gap = lerp(240, 0, bk) + 300 * bo;
      put(S.bl, { o: bk > 0.01 && bo < 0.99 ? 1 : 0, x: 70 - gap });
      put(S.br, { o: bk > 0.01 && bo < 0.99 ? 1 : 0, x: 930 + gap });
      put(S.root, { s: 1 + 0.025 * seg(t, 32, 40) });
    },
  });

  // ================================================================ 6 · reach: node network + Cloudflare Tunnel, dive into the phone
  const LAPTOP_NODE = { x: 840, y: 450 };
  scene({
    name: 'net', from: 'network', to: 'phone',
    build(root, S) {
      const svg = el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root);
      svg.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;overflow:visible">
        <path id="pa" d="M ${CX} 740 C 470 560, 300 600, ${PHONE_NODE.x} 540" fill="none" stroke="${LIME}" stroke-width="4" stroke-linecap="round"/>
        <path id="pb" d="M ${CX} 740 C 640 560, 800 620, ${LAPTOP_NODE.x} 540" fill="none" stroke="${LIME}" stroke-width="4" stroke-linecap="round"/>
        <path id="pc" d="M ${CX} 740 C 470 560, 300 600, ${PHONE_NODE.x} 540" fill="none" stroke="rgba(200,245,110,.25)" stroke-width="18" stroke-linecap="round"/></svg>`;
      S.pa = reg(svg.querySelector('#pa')); S.pb = reg(svg.querySelector('#pb')); S.pc = reg(svg.querySelector('#pc'));
      // phone node: a tiny phone in rofihosted's dark UI (its screen is what the camera dives into)
      S.phone = reg(el('div', { class: 'abs', style: `left:${PHONE_NODE.x - 62}px;top:${PHONE_NODE.y - 110}px;width:124px;height:220px;border-radius:26px;background:#0b0c0e;border:3px solid #30343b;box-shadow:0 0 0 2px rgba(163,230,53,.5)` }, root,
        `<div class="abs" style="left:36px;top:58px;width:46px;height:46px">${MARK_SVG()}</div><div class="abs" style="left:18px;top:150px;width:82px;height:22px;border-radius:11px;background:#1d2025"></div><div class="abs" style="left:84px;top:152px;width:18px;height:18px;border-radius:50%;background:${LIME}"></div>`), { o: 0 });
      S.laptop = reg(el('div', { class: 'abs', style: `left:${LAPTOP_NODE.x - 110}px;top:${LAPTOP_NODE.y - 80}px;width:220px;height:150px` }, root,
        `<div class="abs" style="left:20px;top:0;width:180px;height:122px;border-radius:14px;background:#0b0c0e;border:3px solid #30343b;box-shadow:0 0 0 2px rgba(163,230,53,.5)"><div class="abs" style="left:68px;top:34px;width:44px;height:44px">${MARK_SVG()}</div></div><div class="abs" style="left:0;top:126px;width:220px;height:14px;border-radius:0 0 10px 10px;background:#30343b"></div>`), { o: 0 });
      S.lyou = reg(el('div', { class: 'hud', style: `left:${PHONE_NODE.x - 40}px;top:${PHONE_NODE.y + 128}px;color:var(--ink-2)` }, root, 'you'), { o: 0 });
      S.lfr = reg(el('div', { class: 'hud', style: `left:${LAPTOP_NODE.x - 72}px;top:${LAPTOP_NODE.y + 92}px;color:var(--ink-2)` }, root, 'friends'), { o: 0 });
      S.ltun = reg(el('div', { class: 'hud', style: `left:0;width:${W}px;text-align:center;top:930px;font-size:32px;color:var(--lime-1)` }, root, 'Cloudflare Tunnel'), { o: 0 });
      S.pulse = [0, 1].map(() => reg(el('div', { class: 'abs', style: 'width:26px;height:26px;border-radius:50%;background:#e6ffb0;box-shadow:0 0 30px 10px rgba(200,245,110,.6)' }, root), { o: 0 }));
      S.r1 = cline(root, 'Reached from', { y: 1090, size: 116 });
      S.r2 = cline(root, 'anywhere.', { y: 1216, size: 116, accent: [0] });
      S.r3 = reg(el('div', { class: 'hud', style: `left:0;width:${W}px;text-align:center;top:1376px;font-size:44px;color:var(--ink-2)` }, root, 'No open ports.'), { o: 0 });
    },
    run(t, b, S) {
      const L = 640;
      const da = hit(t, 'node_phone', 'default'), db = hit(t, 'node_laptop', 'default');
      put(S.pa, { css: { strokeDasharray: L, strokeDashoffset: L * (1 - da) } });
      put(S.pb, { css: { strokeDasharray: L, strokeDashoffset: L * (1 - db) } });
      const tun = hit(t, 'tunnel', 'default');
      put(S.pc, { o: tun * 0.9, css: { strokeDasharray: L, strokeDashoffset: L * (1 - tun) } });
      put(S.phone, grow(hit(t, 'node_phone', 'snappy'), 0.5));
      put(S.laptop, grow(hit(t, 'node_laptop', 'snappy'), 0.5));
      [[S.lyou, 'node_phone'], [S.lfr, 'node_laptop'], [S.ltun, 'tunnel']].forEach(([e, m]) => {
        const p = sp(t, B(m) + 0.25, 'snappy'); put(e, { o: clamp(p * 5), hide: p <= 0.001, y: 16 * (1 - p) });
      });
      // light pulses travel the tunnel from the tablet to both devices, every beat from 'tunnel'
      [S.pa, S.pb].forEach((path, i) => {
        const ph = (b - B('tunnel')) % 1, on = b >= B('tunnel') && b < B('into_phone');
        if (!on) { put(S.pulse[i], { o: 0 }); return; }
        const pt = path.getPointAtLength(ease.inOut(ph) * path.getTotalLength());
        put(S.pulse[i], { o: Math.sin(Math.PI * ph), x: pt.x - 13, y: pt.y - 13 });
      });
      rise(t, S.r1, B('reach') - 0.15, null); rise(t, S.r2, B('reach') + 0.1, null);
      const nr = sp(t, B('reach') + 0.75, 'snappy'); put(S.r3, { o: clamp(nr * 5), hide: nr <= 0.001, y: 20 * (1 - nr) });
      put(S.root, netCam(t));
    },
  });

  // ================================================================ 7–8 · the phone: request → live activity → verified file  (48 → 68)
  // Rebuilt from 09-mobile-home / 10-mobile-conversation / 03-live-activity (app.css): composer pill with a lime send
  // button, user bubble on surface-3, "Simmering for Rofi…" activity with mono step tags, DOCX file card, Fraunces reply.
  const REQ = 'Find 3 recent papers on edge computing. Summarize them in Word.';
  const STEPS = [['WEB', 'edge computing 2025', '0.8s'], ['PAGE', 'arxiv.org · survey', '1.2s'],
    ['PAGE', 'ieee.org · offloading', '0.9s'], ['MEMORY', 'thesis: edge computing', '0.1s']];
  const PX = 70, PY = 440, PW = 940, PH = 1100;              // the phone screen on the stage
  const CLIP = '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#686d77" stroke-width="2" stroke-linecap="round"><path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/></svg>';
  const ARROW = `<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  scene({
    name: 'phone', from: 'phone', to: 'chat',
    build(root, S) {
      S.cam = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.panel = el('div', { class: 'abs', style: `left:${PX}px;top:${PY}px;width:${PW}px;height:${PH}px;border-radius:64px;background:#0b0c0e;border:2px solid #23262c;overflow:hidden;box-shadow:0 60px 160px -40px rgba(0,0,0,.9)` }, S.cam);
      el('div', { class: 'abs', style: 'left:40px;top:34px;width:44px;height:36px;border:3px solid #686d77;border-radius:9px;box-sizing:border-box' }, S.panel,
        '<div style="position:absolute;left:10px;top:3px;bottom:3px;width:3px;background:#686d77"></div>');
      // home
      S.home = reg(el('div', { class: 'abs', style: `left:0;top:0;width:${PW}px;height:${PH}px` }, S.panel));
      el('div', { class: 'abs', style: `left:0;top:230px;width:${PW}px;display:flex;justify-content:center;align-items:center;gap:26px` }, S.home,
        `<span style="width:92px;height:92px;display:inline-block">${MARK_SVG()}</span><span class="serif" style="font-size:88px;color:var(--ink)">Evening, Rofi</span>`);
      S.chips = ["Check my unread email", "What's on my calendar today?"].map((c, i) =>
        reg(el('div', { class: 'abs', style: `left:44px;top:${600 + i * 92}px;padding:16px 30px;border:1.5px solid #2a2d33;border-radius:40px;font-size:34px;color:var(--ink-2);white-space:nowrap` }, S.home, c)));
      // composer
      S.comp = reg(el('div', { class: 'abs', style: `left:36px;top:380px;width:${PW - 72}px;box-sizing:border-box;min-height:116px;padding:30px 128px 30px 96px;border-radius:58px;background:#15171b;border:1.5px solid #2a2d33;font-size:38px;line-height:1.32;color:var(--ink)` }, S.panel));
      el('div', { class: 'abs', style: 'left:34px;top:36px' }, S.comp, CLIP);
      S.ctext = reg(el('div', {}, S.comp));
      S.send = reg(el('div', { class: 'abs', style: `left:auto;top:auto;right:22px;bottom:20px;width:76px;height:76px;border-radius:50%;background:${LIME};display:flex;align-items:center;justify-content:center` }, S.comp, ARROW));
      // conversation
      S.bub = reg(el('div', { class: 'abs', style: 'left:auto;right:40px;top:108px;max-width:740px;padding:26px 34px;border-radius:36px;background:#202329;border:1.5px solid #2c3036;font-size:40px;line-height:1.32;color:var(--ink)' }, S.panel, esc(REQ)), { o: 0 });
      S.act = reg(el('div', { class: 'abs', style: 'left:40px;top:372px;font-size:34px;color:var(--ink-2);white-space:nowrap' }, S.panel), { o: 0 });
      S.card = reg(el('div', { class: 'abs', style: 'left:36px;top:440px;width:868px;height:380px;border-radius:30px;background:#111316;border:1.5px solid #22252b;overflow:hidden' }, S.panel), { o: 0 });
      S.rows = STEPS.map(([tag, d, tm], i) => reg(el('div', { class: 'abs mono', style: `left:0;top:${22 + i * 86}px;width:868px;height:80px;font-size:37px` }, S.card,
        `<span class="tag abs" style="left:30px;top:12px;font-size:33px">${tag}</span><span class="abs" style="left:218px;top:10px;color:var(--ink-2)">${esc(d)}</span><span class="abs" style="left:auto;right:30px;top:13px;color:var(--ink-3)">${tm}</span>`), { o: 0 }));
      S.ans = reg(el('div', { class: 'abs serif', style: 'left:40px;top:446px;font-size:46px;color:var(--ink)' }, S.panel, 'Done. Three sources, every link opens.'), { o: 0 });
      S.file = reg(el('div', { class: 'abs', style: 'left:36px;top:540px;width:868px;height:164px;border-radius:30px;background:#111316;border:1.5px solid #2a2d33' }, S.panel,
        `<div class="abs mono" style="left:30px;top:32px;width:100px;height:100px;border-radius:20px;background:#1b1e23;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:var(--lime-1)">DOCX</div>
         <div class="abs" style="left:158px;top:34px;font-size:38px;font-weight:600;color:var(--ink);white-space:nowrap">Chapter 2 – Edge Computing.docx</div>`), { o: 0 });
      S.badge = reg(el('div', { class: 'abs', style: 'left:158px;top:94px;font-size:32px;color:var(--ink-2);white-space:nowrap' }, S.file));
      S.chk = reg(el('span', { class: 'abs', style: 'left:470px;top:88px;font-size:40px;font-weight:700;color:var(--ok)' }, S.file, '✓'), { o: 0 });
      // captions (outside the camera) over a scrim, so they never sit on busy UI
      el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:560px;background:linear-gradient(${BG} 62%, rgba(10,11,13,0))` }, root);
      S.cap1 = cline(root, 'It searches.', { y: 268, size: 104 });
      S.cap2 = cline(root, 'It reads.', { y: 268, size: 104 });
      S.ver = cline(root, 'verified', { y: 268, size: 104, accent: [0] });
      S.vl = reg(el('div', { class: 'abs display', style: 'left:0;top:248px;font-size:150px;font-weight:300;color:var(--accent);line-height:1' }, root, '['), { o: 0 });
      S.vr = reg(el('div', { class: 'abs display', style: 'left:0;top:248px;font-size:150px;font-weight:300;color:var(--accent);line-height:1' }, root, ']'), { o: 0 });
    },
    run(t, b, S) {
      // arrive: the dive lands on the phone and settles
      // macro zoom onto the verified badge, back out on the bracket
      // the camera follows the active part of the UI (composer → bubble + steps → file card), Numtera-style macro moves
      const f = trkObj(t, [[0, { x: CX, y: 1000, s: 1.7 }], [B('phone') - 0.05, { x: CX, y: PY + 420, s: 1.15 }, 'heavy'],
        [B('send') + 0.2, { x: CX, y: PY + 520, s: 1.1 }, 'heavy'], [B('step3'), { x: CX, y: PY + 600, s: 1.14 }, 'heavy'],
        [B('file') - 0.2, { x: CX, y: PY + 560, s: 1.15 }, 'heavy']], 'heavy');
      const z = sp(t, B('v1') - 0.3, 'heavy') - sp(t, B('bracket2') - 0.2, 'default');
      const bx = PX + 36 + 330, by = PY + 540 + 112;              // the verified badge
      const fx = lerp(f.x, bx, z), fy = lerp(f.y, by, z), s0 = f.s * (1 + 0.45 * z) * (1 + 0.02 * seg(t, 48, 68));
      put(S.cam, { s: s0, x: CX - fx * s0, y: 1010 - fy * s0, css: { transformOrigin: '0 0' } });
      // typing the request, send, the composer drops to the bottom as "Reply…"
      const sent = b >= B('send');
      const n = Math.floor(seg(t, 'type3_from', 'type3_to') * REQ.length + 1e-6);
      const caret = !sent && (n < REQ.length || Math.floor(b * 2) % 2 === 0) ? '<span class="caret" style="height:1em"></span>' : '';
      put(S.ctext, { html: sent ? '<span style="color:var(--ink-3)">Reply…</span>' : n === 0 ? '<span style="color:var(--ink-3)">What can I do for you?</span>' + caret : esc(REQ.slice(0, n)) + caret });
      const press = 1 - 0.14 * (sp(t, B('send') - 0.08, 'snappy') - sp(t, B('send') + 0.12, 'snappy'));
      put(S.send, { s: press });
      const down = sp(t, B('send') + 0.05, 'default');
      put(S.comp, { y: lerp(0, PH - 380 - 146, down) });
      // home lifts away through the top of the screen
      const hp = sp(t, B('send') - 0.1, 'default');
      put(S.home, { y: -300 * hp, clip: C.inset(0, 0, 100 * clamp(hp * 1.2), 0) });
      // user bubble grows out of the composer
      const bp = sp(t, B('send') + 0.25, 'default');
      put(S.bub, { ...grow(bp, 0.8), y: 160 * (1 - bp), css: { transformOrigin: '100% 100%' } });
      // activity: header + rows; the card opens from its centre line (split), rows land on the beat
      const spark = ['✻', '✳', '✺', '✹'][Math.floor(Math.max(0, b) * 2) % 4];
      const secs = Math.max(1, Math.floor(t - bt('send')));
      const done = b >= B('file') - 0.3;
      put(S.act, { html: done ? `<span style="color:var(--lime-1)">✻</span> Searched the web, read 3 pages <span class="mono" style="color:var(--ink-3);font-size:28px">· 18s ›</span>`
        : `<span style="color:var(--lime-1)">${spark}</span> Simmering for <span style="color:var(--ink)">Rofi…</span> <span class="mono" style="color:var(--ink-3);font-size:28px">${secs}s</span>`,
        o: clamp(sp(t, 'split', 'snappy') * 5) });
      const op = hit(t, 'split', 'default'), cl = sp(t, B('file') - 0.1, 'snappy');
      const half = 50 * (1 - clamp(op)) ;
      put(S.card, { o: op > 0.001 && cl < 0.999 ? 1 : 0, clip: C.inset(half, 0, Math.max(half, 100 * cl), 0, 30) });
      S.rows.forEach((r, i) => { const p = hit(t, 'step' + (i + 1), 'snappy'); put(r, { o: clamp(p * 5), hide: p <= 0.001, y: 26 * (1 - p) }); });
      // file card lands, badge counts 1/3 → 3/3, the ✓ pops
      const fp = spHit(t, 'file', 'default', 0);
      put(S.file, { ...grow(fp, 0.9), y: 60 * (1 - fp) - 104 * cl * 0 });
      const v = b >= B('v3') ? 3 : b >= B('v2') ? 2 : b >= B('v1') ? 1 : 0;
      put(S.badge, { html: v === 0 ? 'checking links…' : `<span style="color:${v === 3 ? 'var(--ok)' : 'var(--ink)'}">${v}/3</span> links verified` });
      put(S.chk, grow(hit(t, 'v3', 'snappy'), 0.4));
      const ap = sp(t, 'answer', 'default');
      put(S.ans, { o: clamp(ap * 5), hide: ap <= 0.001, y: 30 * (1 - ap), clip: C.inset(0, 100 - 100 * clamp(ap * 1.15), 0, 0) });
      // captions: one idea at a time, swaps are sequential
      rise(t, S.cap1, 'searches', B('reads') - 0.3);
      rise(t, S.cap2, 'reads', B('file') - 0.3);
      rise(t, S.ver, B('bracket2') - 0.1, null, { preset: 'heavy' });
      const bk = hit(t, 'bracket2', 'snappy'), gap = lerp(380, 0, bk);
      put(S.vl, { o: bk > 0.01 ? 1 : 0, x: 214 - gap }); put(S.vr, { o: bk > 0.01 ? 1 : 0, x: 716 + gap });
    },
  });

  // ================================================================ 9 · "It doesn't just chat." → lime flood → "It does the work."  (68 → 76)
  const CMD = '$ gcc fcfs.c -o fcfs && ./fcfs';
  scene({
    name: 'work', from: 'chat', to: 'close',
    build(root, S) {
      S.a1 = cline(root, "It doesn't", { y: 560, size: 150 });
      S.a2 = cline(root, 'just chat.', { y: 720, size: 150, color: 'var(--ink-2)' });
      S.dot = reg(el('div', { class: 'abs', style: `left:${CX - 22}px;top:948px;width:44px;height:44px;border-radius:50%;background:${LIME};box-shadow:0 0 50px 14px rgba(200,245,110,.45)` }, root), { o: 0 });
      S.flood = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:${LIME}` }, root), { o: 0 });
      S.b1 = cline(S.flood, 'It does', { y: 300, size: 172, color: INK });
      S.b2 = cline(S.flood, 'the work.', { y: 486, size: 172, color: INK });
      S.term = reg(el('div', { class: 'abs', style: 'left:90px;top:760px;width:900px;height:230px;border-radius:34px;background:#0d0f11;box-shadow:0 50px 120px -30px rgba(20,49,10,.6)' }, S.flood,
        `<div class="abs mono" style="left:40px;top:36px;font-size:27px"><span class="tag">SANDBOX</span> <span style="color:var(--ink-3)">· isolated</span></div>`), { o: 0 });
      S.cmd = reg(el('div', { class: 'abs mono', style: 'left:40px;top:118px;font-size:37px;color:var(--ink);white-space:pre' }, S.term));
      S.lab = reg(el('div', { class: 'abs mono', style: `left:90px;top:1060px;font-size:33px;color:${INK}` }, S.flood, 'compiling in an isolated sandbox…'), { o: 0 });
      S.track = reg(el('div', { class: 'abs', style: 'left:90px;top:1120px;width:900px;height:58px;border-radius:29px;background:rgba(20,49,10,.16);overflow:hidden' }, S.flood), { o: 0 });
      S.fill = reg(el('div', { class: 'abs', style: `left:0;top:0;height:58px;border-radius:29px;background:${INK}` }, S.track));
      S.pct = reg(el('div', { class: 'abs mono', style: `left:90px;width:900px;text-align:right;top:1196px;font-size:30px;color:${INK}` }, S.flood), { o: 0 });
      S.ok = reg(el('div', { class: 'abs display', style: `left:0;width:${W}px;text-align:center;top:1236px;font-size:128px;color:${INK}` }, S.flood, '✓ 1.315 s'), { o: 0 });
    },
    run(t, b, S) {
      rise(t, S.a1, 'chat'); rise(t, S.a2, B('chat') + 0.3);
      put(S.dot, grow(hit(t, B('flood') - 0.5, 'snappy'), 0.2));
      const f = hit(t, 'flood', 'default');
      put(S.flood, { o: f > 0.001 ? 1 : 0, clip: `circle(${lerp(22, 2300, f).toFixed(1)}px at ${CX}px 970px)` });
      rise(t, S.b1, 'work'); rise(t, S.b2, B('work') + 0.3);
      const tp = sp(t, B('cmd_from') - 0.4, 'default');
      put(S.term, { o: clamp(tp * 5), hide: tp <= 0.001, y: 140 * (1 - tp), s: 0.94 + 0.06 * tp });
      const n = Math.floor(seg(t, 'cmd_from', 'cmd_to') * CMD.length + 1e-6);
      put(S.cmd, { html: esc(CMD.slice(0, n)) + (b < B('compiled') && (n < CMD.length || Math.floor(b * 2) % 2 === 0) ? '<span class="caret"></span>' : '') });
      const cp = sp(t, B('compile') - 0.1, 'snappy');
      [S.lab, S.track, S.pct].forEach((e) => put(e, { o: clamp(cp * 5), hide: cp <= 0.001, y: 24 * (1 - cp) }));
      const pr = ease.inOut(seg(t, 'compile', B('compiled') - 0.1));
      put(S.fill, { css: { width: (900 * pr).toFixed(1) + 'px' } });
      put(S.pct, { text: Math.round(pr * 100) + '%' });
      put(S.ok, grow(hit(t, 'compiled', 'snappy'), 0.7));
      put(S.root, { s: 1 + 0.035 * seg(t, 68, 76) });
    },
  });

  // ================================================================ 10 · "Close the tab." → "It keeps working."  (76 → 84)
  function miniTablet(parent, x, y, w, h) {
    const tb = el('div', { class: 'abs', style: `left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;border:16px solid #2a2e35;border-radius:44px;background:#0b0d0f;box-shadow:0 0 0 2px rgba(163,230,53,.45),0 60px 140px -40px rgba(0,0,0,.9)` }, parent);
    return reg(tb);
  }
  scene({
    name: 'always', from: 'close', to: 'and',
    build(root, S) {
      S.c1 = cline(root, 'Close the tab.', { y: 290, size: 112 });
      S.c2 = cline(root, 'It keeps working.', { y: 290, size: 96, accent: [2] });
      S.ph = reg(el('div', { class: 'abs', style: 'left:320px;top:520px;width:440px;height:900px;border-radius:56px;background:#0b0c0e;border:3px solid #2a2d33;overflow:hidden;box-shadow:0 60px 140px -40px rgba(0,0,0,.9)' }, root,
        `<div class="abs" style="left:auto;right:22px;top:70px;max-width:330px;padding:14px 18px;border-radius:20px;background:#202329;font-size:19px;line-height:1.3;color:var(--ink)">${esc(REQ)}</div>
         <div class="abs" style="left:22px;top:210px;font-size:18px;color:var(--ink-2)"><span style="color:var(--lime-1)">✻</span> Searched the web, read 3 pages</div>
         <div class="abs serif" style="left:22px;top:250px;font-size:22px;color:var(--ink)">Done. Three sources, every link opens.</div>
         <div class="abs" style="left:18px;top:296px;width:398px;height:86px;border-radius:18px;background:#111316;border:1.5px solid #2a2d33">
           <div class="abs mono" style="left:14px;top:16px;width:54px;height:54px;border-radius:12px;background:#1b1e23;color:var(--lime-1);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center">DOCX</div>
           <div class="abs" style="left:82px;top:16px;font-size:18px;font-weight:600;white-space:nowrap">Chapter 2 – Edge Computing.docx</div>
           <div class="abs" style="left:82px;top:46px;font-size:16px;color:var(--ink-2)"><span style="color:var(--ok)">3/3</span> links verified ✓</div></div>
         <div class="abs" style="left:18px;top:auto;bottom:22px;width:398px;height:64px;border-radius:32px;background:#15171b;border:1.5px solid #2a2d33;font-size:20px;color:var(--ink-3);line-height:64px;text-indent:28px">Reply…</div>`));
      S.off = reg(el('div', { class: 'abs', style: 'left:0;top:0;width:440px;height:900px;background:#000' }, S.ph), { o: 0 });
      S.tab = miniTablet(root, 160, 760, 760, 500);
      S.tab.innerHTML = `<div class="abs" style="left:0;top:150px;width:728px;display:flex;justify-content:center;align-items:center;gap:22px">
          <span style="width:84px;height:84px;display:inline-block">${MARK_SVG()}</span>
          <span class="mono" style="font-size:34px;color:var(--lime-1)">working…</span></div>
        <div class="abs mono" style="left:0;top:270px;width:728px;text-align:center;font-size:26px;color:var(--ink-3)">summarizing 3 papers · uptime 41d</div>`;
      S.tdot = reg(el('div', { class: 'abs', style: `left:684px;top:-6px;width:20px;height:20px;border-radius:50%;background:${LIME};box-shadow:0 0 30px 10px rgba(200,245,110,.5)` }, S.tab));
      S.notif = reg(el('div', { class: 'abs', style: 'left:70px;top:480px;width:940px;height:156px;border-radius:40px;background:rgba(32,35,41,.96);border:1.5px solid #30343b;box-shadow:0 40px 100px -30px rgba(0,0,0,.9)' }, root,
        `<div class="abs" style="left:30px;top:34px;width:88px;height:88px">${MARK_SVG()}</div>
         <div class="abs" style="left:146px;top:30px;font-size:29px;color:var(--ink-3)">rofihosted · now</div>
         <div class="abs" style="left:146px;top:76px;font-size:36px;font-weight:600;color:var(--ink);white-space:nowrap">Chapter 2 is ready · <span style="color:var(--ok)">3/3</span> verified</div>`), { o: 0 });
    },
    run(t, b, S) {
      rise(t, S.c1, 'close', B('keeps') - 0.3); rise(t, S.c2, 'keeps');
      const off = hit(t, 'sleep', 'snappy');
      put(S.off, { o: off > 0.001 ? 1 : 0, clip: C.inset(0, 0, 100 - 100 * off, 0) });
      // the camera pans down: the phone leaves up, the tablet in the dark rises into frame
      const pan = sp(t, B('keeps') + 0.5, 'heavy');
      put(S.ph, { y: -1300 * pan + 40 * (1 - sp(t, 'close', 'default')), s: 1 - 0.1 * pan });
      put(S.tab, { y: lerp(1100, 0, pan) });
      const pulse = Math.exp(-((Math.max(0, b) % 1) * 5));
      put(S.tdot, { s: 1 + 0.5 * pulse });
      const np = hit(t, 'notif', 'default');
      put(S.notif, { o: np > 0.001 ? 1 : 0, y: lerp(-70, 0, np), s: 0.92 + 0.08 * np, css: { transformOrigin: '50% 0' } });
      put(S.root, { s: 1 + 0.035 * seg(t, 76, 84) });
    },
  });

  // ================================================================ 11 · "And… it remembers you." + the real Memory panel  (84 → 92)
  const MEM = ['Writes lab reports in a fixed format', 'Thesis topic: edge computing', 'Prefers real, verified references'];
  scene({
    name: 'memory', from: 'and', to: 'they',
    build(root, S) {
      S.grp = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.and = cline(S.grp, 'And', { y: 300, size: 280 });
      S.rem = cline(S.grp, 'it remembers you.', { y: 610, size: 104, cls: 'serif', accent: [2], accColor: 'var(--lime-1)' });
      S.card = reg(el('div', { class: 'panel', style: 'left:70px;top:830px;width:940px;height:600px;overflow:hidden' }, root,
        `<div class="abs" style="left:44px;top:40px;font-size:28px;color:var(--ink-3)">Settings › <span style="color:var(--ink-2)">Memory</span></div>
         <div class="abs" style="left:44px;top:88px;font-size:46px;font-weight:600;color:var(--ink)">What it remembers</div>`), { o: 0 });
      S.rows = MEM.map((m, i) => reg(el('div', { class: 'abs', style: `left:44px;top:${176 + i * 96}px;width:852px;height:96px;border-bottom:1.5px solid #2a2d33;font-size:42px;line-height:84px;color:var(--ink);white-space:nowrap` }, S.card, esc(m)), { o: 0 }));
      S.night = reg(el('div', { class: 'abs', style: 'left:44px;top:500px;font-size:32px;color:var(--ink-3)' }, S.card, 'Tidied every night · <span style="color:var(--lime-1)">yours alone.</span>'), { o: 0 });
    },
    run(t, b, S) {
      const a = spHit(t, 'and', 'heavy');
      put(S.and.el, { s: lerp(4, 1, a), filter: blur(lerp(34, 0, clamp(a * 1.1))), css: { transformOrigin: `${CX}px 440px` } });
      // words rise spaced, then tighten
      rise(t, S.rem, 'remembers', null, { stagger: 0.18 });
      const tight = sp(t, B('remembers') + 0.3, 'heavy');
      put(S.rem.ln, { css: { letterSpacing: lerp(0.3, -0.01, tight).toFixed(4) + 'em' } });
      const cp = sp(t, B('mem1') - 0.6, 'default');
      put(S.grp, { y: trk(t, [[0, 330], [B('mem1') - 0.75, 0, 'heavy']]) });
      put(S.card, { o: clamp(cp * 5), hide: cp <= 0.001, y: 160 * (1 - cp) });
      S.rows.forEach((r, i) => { const p = hit(t, 'mem' + (i + 1), 'snappy'); put(r, { o: clamp(p * 5), hide: p <= 0.001, y: 30 * (1 - p), clip: C.inset(0, 0, 0, 0) }); });
      const np = sp(t, 'nightly', 'snappy'); put(S.night, { o: clamp(np * 5), hide: np <= 0.001, y: 20 * (1 - np) });
      put(S.root, { s: 1 + 0.04 * seg(t, 84, 92) });
    },
  });

  // ================================================================ 12 · "They rent you the cloud." → "We put it on your desk." + status  (92 → 100)
  scene({
    name: 'turn', from: 'they', to: 'no1',
    build(root, S) {
      S.grp = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px` }, root));
      S.t1 = cline(S.grp, 'They rent you', { y: 300, size: 124, color: 'var(--ink-3)' });
      S.t2 = cline(S.grp, 'the cloud.', { y: 440, size: 124, color: 'var(--ink-3)' });
      S.we = reg(el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:700px` }, S.grp));
      S.w1 = cline(S.we, 'We put it on', { y: 300, size: 130 });
      S.w2 = cline(S.we, 'your desk.', { y: 444, size: 130, accent: [0, 1] });
      S.st = reg(el('div', { class: 'panel', style: 'left:70px;top:720px;width:940px;height:560px' }, root,
        `<div class="abs" style="left:44px;top:58px;width:22px;height:22px;border-radius:50%;background:var(--ok)"></div>
         <div class="abs serif" style="left:84px;top:36px;font-size:54px;color:var(--ink)">All systems operational</div>
         <div class="abs" style="left:44px;top:120px;font-size:27px;color:var(--ink-3)">Checked from outside every minute · 90-day history</div>
         <div class="abs" style="left:0;top:184px;width:940px;height:1.5px;background:#26292f"></div>
         <div class="abs" style="left:44px;top:216px;font-size:36px;font-weight:600;color:var(--ink)">Assistant</div>
         <div class="abs" style="left:44px;top:264px;font-size:26px;color:var(--ink-3)">Hermes gateway</div>
         <div class="abs" style="left:auto;right:44px;top:222px;font-size:30px;font-weight:600;color:var(--ok)">● Operational</div>
         <div class="abs mono" style="left:44px;top:446px;width:852px;font-size:24px;color:var(--ink-3);display:flex;justify-content:space-between"><span>90 days ago</span><span>99.94% uptime</span><span>Today</span></div>`), { o: 0 });
      S.bars = Array.from({ length: 45 }, (_, i) => reg(el('div', { class: 'abs', style: `left:${44 + i * 19}px;top:326px;width:15px;height:96px;border-radius:5px;background:${i === 22 ? '#f5b82e' : '#4ade80'};transform-origin:50% 100%` }, S.st), { o: 0 }));
    },
    run(t, b, S) {
      rise(t, S.t1, 'they', B('we') - 0.12); rise(t, S.t2, B('they') + 0.4, B('we') - 0.12);
      rise(t, S.w1, B('we') - 0.05, null, { stagger: 0.05 }); rise(t, S.w2, B('we') + 0.15, null, { stagger: 0.05 });
      const w = spHit(t, 'we', 'heavy');
      put(S.we, { s: lerp(2.6, 1, w), filter: blur(lerp(22, 0, clamp(w * 1.1))), css: { transformOrigin: `${CX}px 480px` } });
      put(S.grp, { y: trk(t, [[0, 360], [B('uptime') - 0.7, 0, 'heavy']]) });
      const cp = sp(t, B('uptime') - 0.5, 'default');
      put(S.st, { o: clamp(cp * 5), hide: cp <= 0.001, y: 180 * (1 - cp) });
      S.bars.forEach((bar, i) => { const p = sp(t, B('uptime') + i * 0.035, 'snappy'); put(bar, { o: p > 0.01 ? 1 : 0, sy: Math.max(0.02, p) }); });
      put(S.root, { s: 1 + 0.035 * seg(t, 92, 100) });
    },
  });

  // ================================================================ 13 · slams, then one silent beat: "Don't rent the future."  (100 → 104)
  const SLAMS = [['no1', 'No', 'subscriptions.', BG, '#f7f8f8', 120], ['no2', 'No', 'telemetry.', LIME, INK, 150], ['no3', 'Your', 'silicon.', BG, LIME, 176]];
  SLAMS.forEach(([m, a, c, bg, fg, size], i) => scene({
    name: m, from: m, to: i < 2 ? SLAMS[i + 1][0] : 'future',
    build(root, S) {
      root.style.background = bg;
      S.box = reg(el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:${H}px` }, root));
      S.l1 = cline(S.box, a, { y: 800 - size, size, color: fg });
      S.l2 = cline(S.box, c, { y: 800 + 0.08 * size, size, color: fg });
    },
    run(t, b, S) {
      const p = spHit(t, m, 'snappy');
      put(S.box, { s: lerp(1.35, 1, p) + 0.04 * seg(t, m, B(m) + 1), css: { transformOrigin: `${CX}px 820px` } });
      rise(t, S.l1, B(m) - 0.08, null, { preset: 'snappy' }); rise(t, S.l2, B(m) - 0.02, null, { preset: 'snappy' });
    },
  }));
  scene({
    name: 'future', from: 'future', to: 'host',
    build(root, S) {
      S.bgw = reg(el('div', { class: 'abs display', style: `left:-200px;top:520px;font-size:560px;color:#2a2d33;white-space:nowrap` }, root, 'future'));
      S.f1 = cline(root, "Don't rent", { y: 700, size: 136 });
      S.f2 = cline(root, 'the future.', { y: 852, size: 136 });
    },
    run(t, b, S) {
      put(S.bgw, { x: -120 * seg(t, 'future', 'host'), filter: 'blur(14px)' });
      rise(t, S.f1, B('future') - 0.05, null); rise(t, S.f2, B('future') + 0.12, null);
      put(S.root, { s: 1.04 - 0.04 * seg(t, 'future', 'host') });
    },
  });

  // ================================================================ 14–15 · "Host it." → logo → tagline + URL  (104 → 112)
  const TAG = 'One tablet.\nA real server.', URL = 'rofihosted.space', WORD = 'rofihosted';
  scene({
    name: 'host', from: 'host', to: 'done',
    build(root, S) {
      S.g = buildGlow(root);
      S.host = reg(el('div', { class: 'abs', style: `left:0;top:0;width:${W}px;height:900px` }, root));
      S.h = cline(S.host, 'Host it.', { y: 470, size: 214, accent: [0, 1] });
      S.lock = reg(el('div', { class: 'abs', style: `left:0;top:930px;width:${W}px;height:170px;display:flex;justify-content:center;align-items:center;gap:52px` }, root));
      S.mk = reg(el('span', { style: 'width:170px;height:170px;display:inline-block;position:relative' }, S.lock, MARK_SVG()), { o: 0 });
      S.ring = reg(el('span', { class: 'abs', style: 'left:98px;top:24px;width:48px;height:48px;border-radius:50%;border:4px solid #d6fa8c' }, S.mk), { o: 0 });
      S.wm = reg(el('img', { src: '../assets/brand/wordmark-white.svg', style: `width:${Math.round(110 * 157 / 41.6)}px;height:110px` }, S.lock));
      S.tag = ctext(root, TAG, { y: 800, size: 110, css: 'line-height:1.1' });
      S.url = ctext(root, URL, { y: 1140, size: 78, cls: 'mono', css: 'color:var(--lime-1)' });
    },
    run(t, b, S) {
      const L = trk(t, [[0, 0], [104, 1, 'heavy'], [108, 0.55, 'default']]);
      put(S.g, { y: (1 - L) * 520, o: clamp(L * 1.4) });
      const hp = spHit(t, 'host', 'heavy');
      put(S.host, { s: lerp(1.7, 1, hp), filter: blur(lerp(20, 0, clamp(hp * 1.1))), css: { transformOrigin: `${CX}px 580px` } });
      rise(t, S.h, B('host') - 0.1, B('tagline_from') - 0.35, { stagger: 0.06 });
      // lockup: mark pops, the wordmark types beside it, then the lockup lifts to the top for the end card
      const mp = hit(t, 'logo_mark', 'snappy');
      put(S.mk, grow(mp, 0.5));
      const wp = sp(t, 'logo_word', 'default');
      put(S.wm, { clip: C.inset(0, 100 - 100 * clamp(wp), 0, 0), x: -40 * (1 - wp), hide: wp <= 0.001 });
      const up = sp(t, B('tagline_from') - 0.4, 'heavy');
      put(S.lock, { y: lerp(0, -560, up), s: lerp(1, 0.8, up), css: { transformOrigin: `${CX}px 85px` } });
      ctype(t, S.tag, 'tagline_from', 'tagline_to', true, 'url');
      ctype(t, S.url, 'url', B('url') + 1, true, Infinity);
      // the status dot pulses on the last beat
      const pr = clamp((b - 111) / 0.9);
      put(S.ring, { o: b >= 111 ? 1 - pr : 0, s: 1 + 1.6 * ease.out(pr) });
      put(S.root, { s: 1 + 0.03 * seg(t, 104, 112) });
    },
  });

  // ================================================================ film grain (seeded, ~3 %) + vignette over everything
  scene({
    name: 'fx', from: 0, to: 'done', cut: false,
    build(root, S) {
      root.style.pointerEvents = 'none';
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), img = g.createImageData(256, 256), r = mulberry32(2024);
      for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      S.grain = reg(el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background-image:url(${c.toDataURL()});opacity:.05;mix-blend-mode:overlay` }, root));
      el('div', { class: 'abs', style: `width:${W}px;height:${H}px;background:radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,.42) 100%)` }, root);
    },
    run(t, b, S) {
      const r = mulberry32(Math.round(t * 60) + 1);
      put(S.grain, { css: { backgroundPosition: `${Math.floor(r() * 256)}px ${Math.floor(r() * 256)}px` } });
    },
  });

  C.start();
})();
