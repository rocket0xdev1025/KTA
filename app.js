/* ===== token config: swap these and everything updates ===== */
const CA = "3ztrjd7Z4w58oWqhXh5H2KzAhRVwYNj5omMx6f3Hpump";
const X_URL = "https://x.com/kimchitheft";
const BUY_URL = `http://pump.fun/coin/${CA}`;
const CHART_URL = `https://dexscreener.com/solana/${CA}`;
const IS_LIVE_CA = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(CA);

/* Files still derived from banner.png / logo.png. Add a name to tag it "placeholder art". */
const PLACEHOLDERS = new Set([]);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const A = f => `assets/${f}`;

/* ---------- links, CA, copy ---------- */
$$("[data-ca]").forEach(el => (el.textContent = CA));
$$("[data-buy]").forEach(el => (el.href = BUY_URL));
$$("[data-chart]").forEach(el => (el.href = CHART_URL));
$$("[data-x]").forEach(el => (el.href = X_URL));
$$(".art[data-asset]").forEach(el => PLACEHOLDERS.has(el.dataset.asset) && el.setAttribute("data-ph", ""));

const toast = msg => {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 1800);
};
async function copyCA() {
  try { await navigator.clipboard.writeText(CA); }
  catch {
    const ta = Object.assign(document.createElement("textarea"), { value: CA });
    document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast("CA COPIED");
}
$$("[data-copy]").forEach(b => b.addEventListener("click", copyCA));

/* ---------- hero scenes ---------- */
const SCENES = {
  crew: { kicker: "Scene A · The couple + the pink car", title: "THE CREW", img: "seq-street-1.jpg", target: "#crew",
    text: "She planned the route, the timing and the exit. He planned the snacks. The car is pink because she said so." },
  cargo: { kicker: "Scene B · Him, the jar, a helicopter", title: "THE CARGO", img: "react-jar.png", target: "#cargo",
    text: "One litre of napa cabbage, chili and garlic. Insured for nothing. Guarded like everything." },
  exit: { kicker: "Scene C · The speedboat", title: "THE EXIT", img: "getaway-water.jpg", target: "#getaway",
    text: "Three ways out of the city: street, water, air. Every one of them somehow ends with the jar." },
};
const drawer = $("#drawer");
function openScene(key, scroll = true) {
  $$("[data-scene-btn]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.sceneBtn === key)));
  $$(".hotspots g").forEach(g => g.classList.toggle("on", g.dataset.scene === key));
  const s = SCENES[key];
  drawer.dataset.key = key;
  const img = $(".drawer-art img", drawer);
  img.src = A(s.img); img.alt = s.title;
  $(".kicker", drawer).textContent = s.kicker;
  $("h3", drawer).textContent = s.title;
  $(".drawer-text", drawer).textContent = s.text;
  $(".drawer-copy a", drawer).href = s.target;
  drawer.hidden = false;
  drawer.style.animation = "none"; drawer.offsetHeight; drawer.style.animation = "";
  if (scroll) drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$$("[data-scene-btn]").forEach(b => b.addEventListener("click", () => openScene(b.dataset.sceneBtn)));
$$(".hotspots g").forEach(g => g.addEventListener("click", () => openScene(g.dataset.scene)));
openScene("crew", false);

/* ---------- reveal + scene rail ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .18 });
$$(".reveal").forEach(el => io.observe(el));

const railIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) $$(".rail a").forEach(a => a.classList.toggle("on", a.dataset.rail === e.target.dataset.sceneId));
}), { rootMargin: "-45% 0px -50% 0px" });
$$("[data-scene-id]").forEach(s => railIO.observe(s));

/* ---------- choose the getaway ---------- */
const ROUTES = {
  street: { label: "STREET", sub: "Route 01", img: "getaway-street.jpg",
    talk: [["h", "You drive."], ["m", "Who holds the jar?"], ["h", "We’re taking a taxi."]],
    seq: ["seq-street-1.jpg", "seq-street-2.jpg", "seq-street-3.jpg"] },
  water: { label: "WATER", sub: "Route 02", img: "getaway-water.jpg",
    talk: [["h", "Why did you bring a life jacket that small?"], ["m", "It’s not for us."]],
    seq: ["seq-water-1.jpg", "seq-water-2.jpg", "seq-water-3.jpg"] },
  air: { label: "AIR", sub: "Route 03", img: "getaway-air.jpg",
    talk: [["h", "Travel light."], ["m", "I brought the smaller jar."]],
    seq: ["seq-air-1.jpg", "seq-air-2.jpg", "seq-air-3.jpg"] },
};
let route = "street";
const routesEl = $(".routes");
for (const [key, r] of Object.entries(ROUTES)) {
  const b = document.createElement("button");
  b.className = "route art"; b.dataset.asset = r.img; b.dataset.route = key; b.setAttribute("role", "tab");
  if (PLACEHOLDERS.has(r.img)) b.setAttribute("data-ph", "");
  b.innerHTML = `<img src="${A(r.img)}" alt="" loading="lazy"><span class="lbl"><small>${r.sub}</small>${r.label}</span>`;
  b.addEventListener("click", () => pickRoute(key));
  routesEl.append(b);
}
const talkHTML = lines => lines.map(([who, line]) =>
  `<p><b class="${who}">${who === "h" ? "HER" : "HIM"}</b>${line}</p>`).join("");
function pickRoute(key) {
  route = key;
  $$(".route").forEach(b => b.setAttribute("aria-selected", String(b.dataset.route === key)));
  const talk = $(".route-talk");
  talk.className = "route-talk dialogue";
  talk.innerHTML = talkHTML(ROUTES[key].talk);
}
pickRoute("street");

/* sequence player: one still per line of dialogue (the last line repeats if there are fewer) */
const seq = $("#seq");
let seqI = 0, seqTimer;
function seqShow(i) {
  const r = ROUTES[route], n = r.seq.length;
  seqI = (i + n) % n;
  $$("#seqStage img").forEach((im, k) => im.classList.toggle("on", k === seqI));
  $$("#seqBars i").forEach((b, k) => { b.className = k < seqI ? "done" : k === seqI ? "run" : ""; });
  const [who, line] = r.talk[Math.min(seqI, r.talk.length - 1)];
  $("#seqSub").innerHTML = `<b class="${who}">${who === "h" ? "HER" : "HIM"}</b>${line}`;
  clearTimeout(seqTimer);
  if (seqI < n - 1) seqTimer = setTimeout(() => seqShow(seqI + 1), 3400);
}
$("#play").addEventListener("click", () => {
  const r = ROUTES[route];
  $("#seqStage").innerHTML = r.seq.map(f => `<img src="${A(f)}" alt="">`).join("");
  $("#seqBars").innerHTML = r.seq.map(() => "<i></i>").join("");
  $("#seqTag").textContent = `ILLUSTRATED SEQUENCE · ${r.label}`;
  seq.showModal(); seqShow(0);
});
$("#seqPrev").addEventListener("click", () => seqShow(seqI - 1));
$("#seqNext").addEventListener("click", () => seqShow(seqI + 1));
$("#seqClose").addEventListener("click", () => seq.close());
seq.addEventListener("close", () => clearTimeout(seqTimer));
seq.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") seqShow(seqI + 1);
  if (e.key === "ArrowLeft") seqShow(seqI - 1);
});

/* ---------- spotlight ---------- */
// Measured centres from the asset pack's spotlight-targets.json (1800 x 1100 source pixels).
const SPOT_W = 1800, SPOT_HIT = 130;
const TARGETS = {
  car: { x: 636 / 18, y: 543 / 11, name: "The Car", line: "Expensive. Surprisingly irrelevant." },
  crew: { x: 1376 / 18, y: 353 / 11, name: "The Crew", line: "Suspiciously relaxed." },
  jar: { x: 1215 / 18, y: 812 / 11, name: "The Jar", line: "There it is." },
};
const frame = $("#spotFrame"), seen = new Set();
const setSpot = (x, y) => { frame.style.setProperty("--sx", x + "%"); frame.style.setProperty("--sy", y + "%"); };
function inspect(key) {
  if (seen.has(key)) return;
  seen.add(key);
  const t = TARGETS[key];
  $(`.spot-btns [data-target="${key}"]`).classList.add("seen");
  $("#spotLog").insertAdjacentHTML("beforeend", `<li><b>${t.name}</b><span>${t.line}</span></li>`);
  if (key === "jar") { setTimeout(() => $("#stamp").classList.add("on"), 500); $("#spotReset").hidden = false; }
}
function nearest(x, y) {
  const r = frame.getBoundingClientRect();
  for (const [k, t] of Object.entries(TARGETS)) {
    const dx = (x - t.x) / 100 * r.width, dy = (y - t.y) / 100 * r.height;
    if (Math.hypot(dx, dy) < SPOT_HIT * r.width / SPOT_W) return k;
  }
}
frame.addEventListener("pointermove", e => {
  frame.classList.remove("gliding");
  const r = frame.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
  setSpot(x, y);
  const k = nearest(x, y); if (k) inspect(k);
});
$$(".spot-btns button").forEach(b => b.addEventListener("click", () => {
  const t = TARGETS[b.dataset.target];
  frame.classList.add("gliding"); setSpot(t.x, t.y);
  setTimeout(() => inspect(b.dataset.target), 650);
}));
$("#spotReset").addEventListener("click", () => {
  seen.clear(); $("#spotLog").innerHTML = ""; $("#stamp").classList.remove("on"); $("#spotReset").hidden = true;
  $$(".spot-btns button").forEach(b => b.classList.remove("seen"));
  frame.classList.add("gliding"); setSpot(50, 50);
});

/* ---------- meme maker ---------- */
const MK_SCENES = [["meme-crew.jpg", "Crew"], ["meme-cargo.jpg", "Cargo"], ["meme-exit.jpg", "Exit"]];
const MK_PRESETS = [["the money", "three jars and a spoon"], ["a plan", "emotional support kimchi"], ["the keys", "the wrong lid"]];
const MK_STYLES = [["subtitle", "Blockbuster subtitle"], ["stamp", "Pink stamp"], ["comic", "Comic caption"]];
const mk = { scene: 0, style: "subtitle", a: MK_PRESETS[0][0], b: MK_PRESETS[0][1] };
const imgCache = {};
const loadImg = src => imgCache[src] ||= new Promise(res => {
  const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src;
});

function chipGroup(el, items, isOn, onPick, render) {
  el.innerHTML = "";
  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.innerHTML = render(it);
    b.addEventListener("click", () => { onPick(it, i); sync(); });
    el.append(b);
  });
  const sync = () => [...el.children].forEach((b, i) => b.setAttribute("aria-pressed", String(isOn(items[i], i))));
  sync();
  return sync;
}
chipGroup($("#mkScene"), MK_SCENES, (_, i) => mk.scene === i, (_, i) => { mk.scene = i; draw(); },
  ([f, n]) => `<img src="${A(f)}" alt=""><span>${n.toUpperCase()}</span>`);
[...$("#mkScene").children].forEach(b => b.classList.add("thumb"));
const syncPresets = chipGroup($("#mkPreset"), MK_PRESETS, p => mk.a === p[0] && mk.b === p[1],
  p => { mk.a = p[0]; mk.b = p[1]; $("#mkA").value = p[0]; $("#mkB").value = p[1]; draw(); },
  p => `“${p[0]}” / “${p[1]}”`);
chipGroup($("#mkStyle"), MK_STYLES, s => mk.style === s[0], s => { mk.style = s[0]; draw(); }, s => s[1]);
$("#mkA").value = mk.a; $("#mkB").value = mk.b;
["mkA", "mkB"].forEach(id => $("#" + id).addEventListener("input", e => {
  mk[id === "mkA" ? "a" : "b"] = e.target.value; syncPresets(); draw();
}));

const cv = $("#mkCanvas"), cx = cv.getContext("2d");
function fitText(text, font, size, max) {
  do { cx.font = font.replace("SIZE", size); } while (cx.measureText(text).width > max && --size > 18);
  return size;
}
async function draw() {
  await document.fonts.ready;
  const [im, mark] = await Promise.all([loadImg(A(MK_SCENES[mk.scene][0])), loadImg(A("kta-mark.png"))]);
  const S = 1080, l1 = `She thought we were escaping with ${mk.a.trim() || "…"}`, l2 = `He actually brought ${mk.b.trim() || "…"}`;
  cx.clearRect(0, 0, S, S);
  if (im) cx.drawImage(im, 0, 0, S, S);
  const g = cx.createLinearGradient(0, S * .55, 0, S);
  g.addColorStop(0, "rgba(9,7,14,0)"); g.addColorStop(1, "rgba(9,7,14,.88)");
  cx.fillStyle = g; cx.fillRect(0, S * .55, S, S * .45);
  if (mark) { const h = 120, w = mark.width * h / mark.height; cx.drawImage(mark, 36, 36, w, h); }
  cx.textAlign = "center"; cx.textBaseline = "alphabetic"; cx.lineJoin = "round";

  if (mk.style === "subtitle") {
    [[l1, S - 132], [l2, S - 66]].forEach(([t, y]) => {
      fitText(t, '600 SIZEpx "Barlow Condensed"', 52, S - 120);
      cx.lineWidth = 8; cx.strokeStyle = "#000"; cx.strokeText(t, S / 2, y);
      cx.fillStyle = "#FFF7EA"; cx.fillText(t, S / 2, y);
    });
  } else if (mk.style === "stamp") {
    [[l1.toUpperCase(), S - 170, -2.5], [l2.toUpperCase(), S - 78, 2]].forEach(([t, y, rot]) => {
      const size = fitText(t, '400 SIZEpx "Anton"', 46, S - 180), w = cx.measureText(t).width;
      cx.save(); cx.translate(S / 2, y); cx.rotate(rot * Math.PI / 180);
      cx.fillStyle = "#000"; cx.fillRect(-w / 2 - 22 + 8, -size - 6 + 8, w + 44, size + 30);
      cx.fillStyle = "#FF29B8"; cx.fillRect(-w / 2 - 22, -size - 6, w + 44, size + 30);
      cx.fillStyle = "#FFF7EA"; cx.fillText(t, 0, 4); cx.restore();
    });
  } else {
    [[l1.toUpperCase(), S - 150, "#FFF7EA"], [l2.toUpperCase(), S - 56, "#FF963D"]].forEach(([t, y, c]) => {
      fitText(t, '400 SIZEpx "Anton"', 78, S - 90);
      cx.lineWidth = 16; cx.strokeStyle = "#000"; cx.strokeText(t, S / 2, y);
      cx.fillStyle = c; cx.fillText(t, S / 2, y);
    });
  }
}
draw();

const memeBlob = () => new Promise(r => cv.toBlob(r, "image/png"));
$("#mkDownload").addEventListener("click", () => {
  const a = Object.assign(document.createElement("a"), { href: cv.toDataURL("image/png"), download: "kimchi-theft-auto-meme.png" });
  a.click();
});
$("#mkShare").addEventListener("click", async () => {
  const text = "Kimchi Theft Auto ($KTA): one jar, three getaways.";
  try {
    const file = new File([await memeBlob()], "kimchi-theft-auto-meme.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text });
  } catch (e) { if (e.name === "AbortError") return; }
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  toast("DOWNLOAD THE MEME, THEN ATTACH IT");
});

/* ---------- outtakes + lightbox ---------- */
const OUTTAKES = [
  ["seatbelt", "react-her-done.png", "She was told there would be room."],
  ["grocery", "react-him-bliss.png", "A very expensive grocery run."],
  ["delayed", "react-him-shock.png", "The getaway has been delayed."],
  ["boat", "react-her-smirk.png", "Same destination. More unnecessary drama."],
  ["keys", "react-jar.png", "Responsibilities were divided."],
  ["air", "react-both.png", "Air transport for a side dish."],
];
const GALLERY = [];
$("#strips").innerHTML = OUTTAKES.map(([k, react, cap], i) => {
  const mi = GALLERY.push({ src: A(`out-${k}.jpg`), cap }) - 1;
  const ri = GALLERY.push({ src: A(react), cap }) - 1;
  return `<article class="strip reveal">
    <button class="main settle" data-lb="${mi}" aria-label="Open: ${cap}"><img src="${A(`out-${k}-t.jpg`)}" data-full="${A(`out-${k}.jpg`)}" alt="" loading="lazy"></button>
    <button class="react" data-lb="${ri}" aria-label="Open reaction"><img src="${A(react)}" alt="" loading="lazy"></button>
    <div class="cap sub"><small>OUTTAKE ${String(i + 1).padStart(2, "0")}</small><p>“${cap}”</p></div>
  </article>`;
}).join("");
$$("#strips .reveal").forEach(el => io.observe(el));
// thumbs paint fast; swap to the full image once each strip is near
const upIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { const im = $("img[data-full]", e.target); im.src = im.dataset.full; upIO.unobserve(e.target); }
}), { rootMargin: "400px" });
$$(".strip").forEach(s => upIO.observe(s));

const lb = $("#lb");
let lbI = 0;
function lbShow(i) {
  lbI = (i + GALLERY.length) % GALLERY.length;
  const g = GALLERY[lbI];
  $("#lbImg").src = g.src; $("#lbCap").textContent = `“${g.cap}”`;
  $("#lbDl").href = g.src; $("#lbDl").download = g.src.split("/").pop();
}
$("#strips").addEventListener("click", e => {
  const b = e.target.closest("[data-lb]"); if (!b) return;
  lbShow(+b.dataset.lb); lb.showModal();
});
$("#lbPrev").addEventListener("click", () => lbShow(lbI - 1));
$("#lbNext").addEventListener("click", () => lbShow(lbI + 1));
$("#lbClose").addEventListener("click", () => lb.close());
lb.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") lbShow(lbI + 1);
  if (e.key === "ArrowLeft") lbShow(lbI - 1);
});
let tx = null;
lb.addEventListener("touchstart", e => (tx = e.touches[0].clientX), { passive: true });
lb.addEventListener("touchend", e => {
  if (tx == null) return;
  const dx = e.changedTouches[0].clientX - tx; tx = null;
  if (Math.abs(dx) > 50) lbShow(lbI + (dx < 0 ? 1 : -1));
});
[seq, lb].forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));

/* ---------- chart ---------- */
if (IS_LIVE_CA) {
  $("#chartBody").innerHTML = `<iframe title="$KTA chart on Dexscreener" src="${CHART_URL}?embed=1&theme=dark&info=0" loading="lazy"></iframe>`;
  const badge = $("#chartBadge"); badge.textContent = "Live"; badge.classList.add("live");
}

/* ---------- cyberpunk layer ---------- */
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// scroll progress + wanted level: one star per fifth of the page
const stars = $$(".wanted i"), bar = $(".progress");
function onScroll() {
  const f = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  bar.style.transform = `scaleX(${f})`;
  stars.forEach((st, i) => st.classList.toggle("lit", f > i / 5 + .02));
}
addEventListener("scroll", onScroll, { passive: true }); onScroll();

// decode effect on scene slates as they enter view
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*/<>";
function decode(el) {
  if (calm || el.dataset.done) return;
  el.dataset.done = 1;
  const html = el.innerHTML, text = el.textContent;
  let f = 0;
  const tick = () => {
    const shown = Math.floor(f / 2);
    el.textContent = [...text].map((c, i) => i < shown || c === " " ? c : GLYPHS[Math.random() * GLYPHS.length | 0]).join("");
    if (shown < text.length) { f++; requestAnimationFrame(tick); } else el.innerHTML = html;
  };
  tick();
}
const slateIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && decode(e.target)), { threshold: 1 });
$$(".slate").forEach(el => slateIO.observe(el));

// hero poster tilts toward the pointer
const poster = $(".poster");
if (!calm) {
  poster.addEventListener("pointermove", e => {
    const r = poster.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    poster.style.transform = `perspective(1600px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
  });
  poster.addEventListener("pointerleave", () => (poster.style.transform = ""));
  $$("[data-tilt]").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg) scale(1.02)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

// neon dust drifting up the screen
const fx = $("#fx"), g2 = fx.getContext("2d");
let dots = [];
function sizeFx() {
  fx.width = innerWidth; fx.height = innerHeight;
  dots = Array.from({ length: 46 }, () => ({
    x: Math.random() * fx.width, y: Math.random() * fx.height, r: Math.random() * 1.8 + .4,
    v: Math.random() * .35 + .1, c: Math.random() < .55 ? "255,41,184" : "53,217,255", a: Math.random() * .5 + .2,
  }));
}
function drawFx() {
  g2.clearRect(0, 0, fx.width, fx.height);
  for (const d of dots) {
    d.y -= d.v; if (d.y < -4) { d.y = fx.height + 4; d.x = Math.random() * fx.width; }
    g2.beginPath(); g2.arc(d.x, d.y, d.r, 0, 7);
    g2.fillStyle = `rgba(${d.c},${d.a})`; g2.shadowBlur = 8; g2.shadowColor = `rgb(${d.c})`; g2.fill();
  }
  requestAnimationFrame(drawFx);
}
if (!calm) { sizeFx(); addEventListener("resize", sizeFx); drawFx(); }
