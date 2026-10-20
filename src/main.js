import './style.css';
import { gsap } from 'gsap';
import { config } from './config.js';
import { Cat, CAT_SIZE, FEET } from './cats.js';
import { toUri, mountPlayer } from './spotify.js';

// background music that plays softly during the whole experience
let bgPlayer = null;
async function startBgMusic() {
  if (!config.bgMusic) return;
  const uri = toUri(config.bgMusic);
  if (!uri) return;
  const bgEl = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'bg-player', style: 'position:fixed;left:-999px;width:1px;height:1px' }));
  bgPlayer = await mountPlayer(bgEl, uri, () => {});
  bgPlayer.setVolume(0.15);
  bgPlayer.play();
}

const $ = (s) => document.querySelector(s);
const COLORS = ['#c4553a', '#e2a22b', '#8a9a5b', '#e9a58f', '#6b3a4a'];
const rand = gsap.utils.random;

/* ---------- drifting paper cut-outs ---------- */
const shapes = [
  'border-radius:50% 50% 50% 0', // petal
  'border-radius:50%',           // dot
  'clip-path:polygon(50% 0,100% 100%,0 100%)', // triangle
  'border-radius:60% 40% 55% 45% / 45% 60% 40% 55%', // pebble
];
// the inner <i> drifts on its own; its wrapper gets shoved away from the cursor
const drifters = [];
for (let i = 0; i < 72; i++) {
  const wrap = document.createElement('span'), el = document.createElement('i');
  const s = rand(10, 34);
  wrap.className = 'drifter';
  wrap.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%`;
  el.style.cssText = `width:${s}px;height:${s}px;background:${rand(COLORS)};${rand(shapes)}`;
  wrap.append(el);
  $('#drift').append(wrap);
  gsap.to(el, { y: rand(-90, 90), x: rand(-60, 60), rotation: rand(-180, 180), duration: rand(5, 11), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  const to = (prop) => gsap.quickTo(wrap, prop, { duration: rand(.6, 1.1), ease: 'power3.out' });
  drifters.push({ wrap, el, x: to('x'), y: to('y'), r: to('rotation') });
}

// a small pink heart that never lets the cursor catch it
const heart = document.body.appendChild(Object.assign(document.createElement('div'), {
  id: 'heart',
  innerHTML: '<svg viewBox="0 0 24 22" width="26" height="24"><path d="M12 21C5 15.5 1 11.8 1 7a5.5 5.5 0 0 1 11-1 5.5 5.5 0 0 1 11 1c0 4.8-4 8.5-11 14z"/></svg>',
}));
let hx = 0, hy = 0, heartOut = false;
gsap.set(heart, { autoAlpha: 0 });
const heartX = gsap.quickTo(heart, 'x', { duration: .5, ease: 'power3.out' });
const heartY = gsap.quickTo(heart, 'y', { duration: .5, ease: 'power3.out' });

// it pops out next to the first box, so she can't miss it
function spawnHeart(nearEl) {
  const r = nearEl.getBoundingClientRect();
  hx = r.right + 50; hy = r.top + 10;
  gsap.set(heart, { x: hx, y: hy });
  gsap.fromTo(heart, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .8, ease: 'elastic.out(1,.4)', onComplete: () => (heartOut = true) });
  // a little hello hop
  gsap.to(heart, { y: hy - 26, duration: .25, yoyo: true, repeat: 3, delay: .9, ease: 'power2.out' });
}

// it leaves a trail of tiny hearts wherever it runs
let lastDrop = null;
gsap.ticker.add(() => {
  if (!heartOut) return;
  const x = gsap.getProperty(heart, 'x'), y = gsap.getProperty(heart, 'y');
  if (lastDrop && Math.hypot(x - lastDrop.x, y - lastDrop.y) < 22) return;
  lastDrop = { x, y };
  const t = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'trail', innerHTML: heart.innerHTML }));
  gsap.set(t, { x: x + rand(-3, 3), y: y + rand(-3, 3), rotation: rand(-25, 25), scale: rand(.6, .9), opacity: .5 });
  gsap.to(t, { y: `-=${rand(8, 20)}`, scale: 0, opacity: 0, duration: rand(1, 1.4), ease: 'power1.in', onComplete: () => t.remove() });
});

function flee() {
  if (!heartOut) return;
  const dx = hx - mouse.x, dy = hy - mouse.y, dist = Math.hypot(dx, dy) || 1;
  if (dist > 130) return;
  const m = 50, STEP = 150, clamp = gsap.utils.clamp;
  const inBounds = (ux, uy) => [clamp(m, innerWidth - m, hx + ux * STEP), clamp(m, innerHeight - m, hy + uy * STEP)];
  // straight away from the cursor, then the two sideways escapes; take whichever ends up farthest from it
  const ux = dx / dist, uy = dy / dist;
  const [nx, ny] = [[ux, uy], [-uy, ux], [uy, -ux]]
    .map(([a, b]) => inBounds(a, b))
    .reduce((best, p) => (Math.hypot(p[0] - mouse.x, p[1] - mouse.y) > Math.hypot(best[0] - mouse.x, best[1] - mouse.y) ? p : best));
  hx = nx; hy = ny;
  heartX(hx); heartY(hy);
  gsap.fromTo(heart.firstChild, { scaleX: 1.4, scaleY: .7 }, { scaleX: 1, scaleY: 1, duration: .5, ease: 'elastic.out(1,.35)' });
}

const PUSH_RADIUS = 190, PUSH = 120;
let mouse = null, pushFrame = 0;
function push() {
  pushFrame = 0;
  if (mouse) flee();
  for (const d of drifters) {
    if (!mouse) { d.x(0); d.y(0); d.r(0); continue; }
    // measure where the shape would be without the push, so it doesn't feed back on itself
    const b = d.el.getBoundingClientRect();
    const dx = b.left + b.width / 2 - gsap.getProperty(d.wrap, 'x') - mouse.x;
    const dy = b.top + b.height / 2 - gsap.getProperty(d.wrap, 'y') - mouse.y;
    const dist = Math.hypot(dx, dy) || 1;
    const f = dist < PUSH_RADIUS ? (1 - dist / PUSH_RADIUS) ** 1.5 * PUSH : 0;
    d.x((dx / dist) * f); d.y((dy / dist) * f); d.r(dx > 0 ? f : -f);
  }
}
const schedulePush = () => (pushFrame ||= requestAnimationFrame(push));
addEventListener('pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; schedulePush(); });
document.addEventListener('pointerleave', () => { mouse = null; schedulePush(); });
// keep pushing while the shapes drift into a resting cursor
setInterval(() => mouse && schedulePush(), 120);

/* ---------- 1. lock ---------- */
const pw = $('#pw'), slotsEl = $('#slots');
const target = config.password.toLowerCase();
function drawSlots() {
  slotsEl.innerHTML = '';
  const len = Math.max(target.length, pw.value.length);
  for (let i = 0; i < len; i++) {
    const d = document.createElement('div');
    d.className = 'slot' + (pw.value[i] ? ' on' : '');
    d.textContent = pw.value[i] || '';
    slotsEl.append(d);
  }
}
drawSlots();
slotsEl.addEventListener('click', () => pw.focus());
pw.addEventListener('input', () => {
  drawSlots();
  const last = slotsEl.children[pw.value.length - 1];
  if (last) gsap.fromTo(last, { y: -14, rotation: rand(-12, 12) }, { y: 0, rotation: 0, duration: .4, ease: 'elastic.out(1,.4)' });
});
pw.focus();
gsap.from('#lock > *', { y: 40, opacity: 0, rotation: rand(-3, 3), stagger: .12, duration: .9, ease: 'back.out(1.6)' });

$('#hintBtn').onclick = () => {
  $('#hint').textContent = config.hint;
  gsap.fromTo('#hint', { opacity: 0, y: 10 }, { opacity: 1, y: 0 });
};

$('#lockForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (pw.value.trim().toLowerCase() === target) return unlock();
  gsap.fromTo('#slots', { x: -14 }, { x: 0, duration: .6, ease: 'elastic.out(1,.15)' });
  gsap.fromTo('.slot', { color: '#3b2418' }, { color: '#c4553a', duration: .6 });
  pw.value = ''; drawSlots();
  $('#hint').textContent = 'hmm, not quite. try again?';
});

function confetti(x, y, n = 36) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    const s = rand(8, 16);
    c.style.cssText = `position:fixed;z-index:40;pointer-events:none;left:${x}px;top:${y}px;width:${s}px;height:${s * rand(.4, 1)}px;background:${rand(COLORS)};border-radius:${rand([2, 50])}%`;
    document.body.append(c);
    gsap.to(c, { x: rand(-260, 260), y: rand(-300, 120), rotation: rand(-540, 540), duration: rand(.9, 1.6), ease: 'power2.out' });
    gsap.to(c, { y: '+=500', opacity: 0, delay: .7, duration: 1, ease: 'power1.in', onComplete: () => c.remove() });
  }
}

function unlock() {
  confetti(innerWidth / 2, innerHeight / 2, 60);
  gsap.to('.slot', { y: -24, stagger: .05, yoyo: true, repeat: 1, duration: .2 });
  gsap.to('#lock', {
    delay: .9, duration: .9, ease: 'power3.inOut', clipPath: 'circle(0% at 50% 50%)',
    onComplete: () => { $('#lock').classList.remove('active'); startBgMusic(); showGifts(); },
  });
  gsap.set('#lock', { clipPath: 'circle(150% at 50% 50%)' });
}

/* ---------- 2. gifts, revealed one at a time ---------- */
const GIFTS = {
  music: { label: 'press play', c: '#c4553a', r: '#f2c46d', cls: 'tall', cat: 'cat2' },   // black cat
  letter: { label: 'read me', c: '#8a9a5b', r: '#e2a22b', cls: '', cat: 'cat1' },         // ginger cat
  cats: { label: 'last one', c: '#6b3a4a', r: '#e9a58f', cls: 'short', cat: 'cat5' },     // fluffy cat; opens empty, then cats pop out
};
const order = config.order.filter((id) => GIFTS[id]);
const STAGES = { first: ['Something showed up', 'for you.'], middle: ['Oh? There\'s', 'another one.'], last: ['Last one,', 'promise.'] };
const CAT_ON_LID = 38; // nudges the cat right so it naps beside the bow, not on it
const opened = new Set();
let spots = [], revealed = 0;

function showGifts() {
  $('#gifts').classList.add('active');
  $('#giftsHi').textContent = `happy birthday, ${config.name}!`;
  gsap.from('#giftsHi', { opacity: 0, y: 30, duration: .9 });
  // fixed spots so the row never jumps around; with 3 gifts the first lands in the middle
  spots = order.map(() => $('#shelf').appendChild(Object.assign(document.createElement('div'), { className: 'spot' })));
  if (spots.length === 3) spots = [spots[1], spots[0], spots[2]];
  revealNext();
}

function setStage(i) {
  const [a, b] = STAGES[i === order.length - 1 && i > 0 ? 'last' : i === 0 ? 'first' : 'middle'];
  const h = $('#stage');
  gsap.to(h, {
    opacity: 0, y: -16, duration: i ? .3 : 0,
    onComplete: () => {
      h.innerHTML = `${a}<br /><em>${b}</em>`;
      gsap.fromTo(h, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: 'back.out(2)' });
    },
  });
}

function knock(box) {
  const k = Object.assign(document.createElement('span'), { className: 'knock', textContent: rand(['knock knock', '*rustle*', 'psst']) });
  box.parentElement.append(k);
  gsap.fromTo(k, { opacity: 0, y: 0 }, { opacity: 1, y: -30, duration: .5, onComplete: () => gsap.to(k, { opacity: 0, delay: .5, onComplete: () => k.remove() }) });
}

function revealNext() {
  const i = revealed++, id = order[i], g = GIFTS[id];
  setStage(i);

  const b = document.createElement('button');
  b.className = `gift ${g.cls}`;
  b.disabled = true;
  b.style.cssText = `--c:${g.c};--r:${g.r}`;
  b.innerHTML = `<div class="shadow"></div><div class="box"><div class="body"></div><div class="lid"></div></div><span class="tag">${g.label}</span>`;
  spots[i].append(b);

  const box = b.querySelector('.box'), lid = b.querySelector('.lid'), tag = b.querySelector('.tag');
  const cat = new Cat(g.cat);
  b.append(cat.el); // sibling of .box, so box squash/shake doesn't stretch the cat
  b.onclick = () => (b.classList.contains('opened') ? openModal(id) : openGift(b, id, cat));
  b.onmouseenter = () => {
    if (b.disabled) return;
    cat.meow();
    if (!b.classList.contains('opened')) gsap.fromTo(lid, { rotation: 0 }, { rotation: -6, y: -6, duration: .25, yoyo: true, repeat: 1 });
  };

  // the cat starts off-screen to the right, standing on the floor
  const h = box.offsetHeight;
  const runFrom = innerWidth - b.getBoundingClientRect().left + 40;
  gsap.set(cat.el, { x: runFrom, y: h - FEET });
  cat.face('left');

  const shake = { keyframes: [{ rotation: -7 }, { rotation: 6 }, { rotation: -4 }, { rotation: 0 }], duration: .35, ease: 'none' };
  gsap.timeline({ delay: i ? .5 : .4 })
    .from(b.querySelector('.shadow'), { scaleX: 0, opacity: 0, duration: .7, ease: 'power2.out' })
    .from(box, { y: -innerHeight, rotation: rand(-20, 20), duration: 1.1, ease: 'bounce.out' }, '<.25')
    .to(box, { ...shake, onStart: () => knock(box) }, '+=.5')
    .to(box, shake, '+=.35')
    // here comes the cat
    .add(() => cat.play('run'), '+=.2')
    .to(cat.el, { x: CAT_SIZE * .6, duration: Math.max(.6, runFrom / 650), ease: 'none' })
    .to(cat.el, { x: CAT_ON_LID, duration: .45, ease: 'none' })
    .to(cat.el, { keyframes: [{ y: -FEET - 60, duration: .25, ease: 'power2.out' }, { y: -FEET, duration: .2, ease: 'power2.in' }] }, '<')
    .add(() => { cat.rest = 'sleeping1'; cat.play('laying', { then: 'sleeping1' }); })
    .to(box, { scaleY: .94, duration: .08, yoyo: true, repeat: 1 }, '<')
    .fromTo(tag, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'steps(10)' }, '+=.3')
    .add(() => { b.disabled = false; b.classList.add('ready'); if (i === 0) spawnHeart(b); });
}

function openGift(el, id, cat) {
  el.disabled = true;
  const box = el.querySelector('.box'), lid = el.querySelector('.lid'), r = el.getBoundingClientRect();
  const h = box.offsetHeight;
  gsap.timeline({ onComplete: () => { el.classList.add('opened'); id === 'cats' ? popCats(el) : (el.disabled = false, openModal(id)); } })
    // the cat wakes up and hops down to the front of the box
    .add(() => { cat.face('left'); cat.play('run'); })
    .to(cat.el, { x: -60, duration: .5, ease: 'none' })
    .to(cat.el, { keyframes: [{ y: -FEET - 70, duration: .22, ease: 'power2.out' }, { y: h - FEET, duration: .28, ease: 'power2.in' }] }, '<')
    .add(() => { cat.face('right'); cat.rest = 'sitting'; cat.play('licking1', { then: 'sitting' }); })
    // then the lid pops
    .to(box, { scaleX: 1.12, scaleY: .9, duration: .12 }, '+=.1')
    .to(box, { scaleX: 1, scaleY: 1, duration: .5, ease: 'elastic.out(1,.3)' })
    .to(lid, { y: -90, rotation: -38, x: -24, duration: .45, ease: 'back.out(2)' }, '<.1')
    .add(() => confetti(r.left + r.width / 2, r.top + 20, 28), '<.2')
    // and settles ajar on the back of the box, out of the heading's way
    .to(lid, { y: -14, x: -26, rotation: -14, duration: .5, ease: 'bounce.out' });
}

/* ---------- the last box: empty… then cats ---------- */
function popCats(el) {
  opened.add('cats');
  const box = el.querySelector('.box'), r = box.getBoundingClientRect();
  const layer = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'pop' }));
  const skins = Object.values(GIFTS).map((g) => g.cat);
  const N = innerWidth < 600 ? 9 : 15, floor = innerHeight - FEET - 8;
  const mouthX = r.left + r.width / 2 - CAT_SIZE / 2, mouthY = r.top - FEET + 20;

  // a beat of "huh, nothing in here" before anything moves
  const note = Object.assign(document.createElement('span'), { className: 'knock', textContent: 'huh. it\'s empty…' });
  el.append(note);
  gsap.fromTo(note, { opacity: 0, y: 0 }, { opacity: 1, y: -34, duration: .5 });
  gsap.to(box, { keyframes: [{ rotation: -2 }, { rotation: 2 }, { rotation: 0 }], duration: .5, delay: .9 });
  gsap.to(note, { opacity: 0, delay: 1.5, duration: .3, onStart: () => (note.textContent = 'wait…'), onComplete: () => note.remove() });

  const tl = gsap.timeline({ delay: 1.9, onComplete: () => finale() });
  tl.add(rainCats, 0); // the sky opens up at the same moment the box does
  for (let i = 0; i < N; i++) {
    const cat = new Cat(rand(skins));
    layer.append(cat.el);
    const tx = rand(-20, innerWidth - CAT_SIZE + 20), dir = tx > mouthX ? 'right' : 'left';
    cat.face(dir);
    cat.play('idle');
    gsap.set(cat.el, { x: mouthX, y: mouthY, scale: 0, opacity: 0, transformOrigin: '50% 100%' });
    const peak = mouthY - rand(160, 320);
    tl.add(() => confetti(r.left + r.width / 2, r.top, 6), i * .2)
      .to(cat.el, { scale: 1, opacity: 1, duration: .2 }, i * .2)
      .to(cat.el, { x: tx, duration: rand(.9, 1.3), ease: 'power1.out' }, i * .2)
      .to(cat.el, { keyframes: [{ y: peak, duration: .4, ease: 'power2.out' }, { y: floor + rand(-6, 6), duration: .55, ease: 'bounce.out' }] }, i * .2)
      .add(() => {
        const [move, rest] = rand([['laying', 'sleeping1'], ['licking1', 'sitting'], ['meow', 'sitting'], ['idle', 'sitting']]);
        cat.rest = rest; cat.play(move, { then: rest });
      }, i * .2 + 1.2);
  }
}

/* ---------- the finale: it's raining cats ---------- */
function afterGift() {
  if (revealed < order.length && opened.size === revealed) return revealNext();
  if (opened.size === order.length) finale();
}

function finale() {
  if ($('#allDone').textContent) return;
  setTimeout(() => {
    gsap.to('#stage', { opacity: 0, y: -16, duration: .3, onComplete: () => { $('#stage').innerHTML = 'That\'s everything.<br /><em>Happy birthday.</em>'; gsap.to('#stage', { opacity: 1, y: 0, duration: .6, ease: 'back.out(2)' }); } });
    $('#allDone').textContent = `p.s. thank you for being you, ${config.name}. 🧡`;
    gsap.fromTo('#allDone', { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, ease: 'back.out(2)', duration: .8, delay: .4 });
  }, 300);
}

function rainCats() {
  const rain = document.body.appendChild(Object.assign(document.createElement('div'), { id: 'rain' }));
  const skins = Object.values(GIFTS).map((g) => g.cat);
  const N = 46, LANDERS = innerWidth < 600 ? 4 : 7;
  for (let i = 0; i < N; i++) {
    const cat = new Cat(rand(skins));
    rain.append(cat.el);
    cat.play(rand(['run', 'meow', 'idle', 'licking1']));
    cat.face(rand(['left', 'right']));
    const k = i - (N - LANDERS); // >= 0 for the few that land and stay
    if (k >= 0) {
      gsap.set(cat.el, { x: ((k + .5) / LANDERS) * innerWidth - CAT_SIZE / 2, y: -CAT_SIZE, rotation: rand(-120, 120) });
      const [move, rest] = rand([['laying', 'sleeping1'], ['licking1', 'sitting'], ['meow', 'sitting']]);
      gsap.timeline({ delay: 4.6 + k * .3 })
        .to(cat.el, { y: innerHeight - FEET - 6, rotation: 0, duration: 1.2, ease: 'bounce.out' })
        .add(() => { cat.rest = rest; cat.play(move, { then: rest }); });
    } else {
      gsap.set(cat.el, { x: rand(-60, innerWidth - CAT_SIZE + 60), y: -CAT_SIZE - rand(0, 120), rotation: rand(-180, 180), scale: rand(.6, 1.1) });
      gsap.to(cat.el, {
        y: innerHeight + 60, rotation: `+=${rand(-360, 360)}`, duration: rand(1.6, 2.8), ease: 'power1.in', delay: rand(0, 5),
        onComplete: () => cat.destroy(),
      });
    }
  }
}

/* ---------- 3. modal contents ---------- */
const modal = $('#modal'), body = $('#paperBody');
let player = null, musicToken = 0;

function openModal(id) {
  body.innerHTML = '';
  views[id](body);
  modal.classList.add('show');
  gsap.fromTo('#paper', { y: 80, rotation: rand(-6, 6), scale: .85, opacity: 0 }, { y: 0, rotation: rand(-1, 1), scale: 1, opacity: 1, duration: .7, ease: 'back.out(1.5)' });
  opened.add(id);
}
function closeModal() {
  musicToken++;
  if (player) { player.destroy(); player = null; }
  gsap.to('#paper', {
    y: 60, opacity: 0, duration: .25,
    onComplete: () => {
      modal.classList.remove('show');
      body.innerHTML = '';
      afterGift();
    },
  });
}
$('#close').onclick = closeModal;
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.contains('show') && closeModal());

const views = {
  music(root) {
    const songs = config.songs.map((s) => ({ ...s, uri: toUri(s.url) }));
    root.innerHTML = `<div class="player"><h3>a tiny mixtape</h3><div class="disc"></div>
      <ol class="tracks">${songs.map((s, i) => `<li><button class="track" data-i="${i}" ${s.uri ? '' : 'disabled'}>
        <b>A${i + 1}</b><span>${s.note}${s.uri ? '' : '<small>add a Spotify link in config.js</small>'}</span></button></li>`).join('')}</ol>
      <div class="embed"><div id="spot"></div></div>
      <p class="note">pick a song, then hit play</p></div>`;
    const disc = root.querySelector('.disc'), cards = [...root.querySelectorAll('.track')];
    gsap.from(cards, { x: -30, opacity: 0, stagger: .12, duration: .5, delay: .3, ease: 'back.out(2)' });

    const first = songs.findIndex((s) => s.uri);
    if (first < 0) return;
    const pick = (i) => cards.forEach((c, j) => c.classList.toggle('on', i === j));
    pick(first);
    const token = musicToken;
    mountPlayer(root.querySelector('#spot'), songs[first].uri, (playing) => disc.classList.toggle('spin', playing)).then((c) => {
      if (token !== musicToken) return c.destroy(); // closed before Spotify finished loading
      player = c;
      cards.forEach((card) => (card.onclick = () => {
        const i = +card.dataset.i;
        pick(i);
        c.loadUri(songs[i].uri);
        c.play();
      }));
    });
  },
  letter(root) {
    const pages = config.letter, last = pages.length - 1;
    root.innerHTML = `<div class="letter"><h3>Dear ${config.name},</h3><div class="page"></div>
      <div class="pager"><button class="link" id="prev">← back</button><span class="dots">${pages.map(() => '<i></i>').join('')}</span><button class="link" id="next">turn the page →</button></div></div>`;
    const page = root.querySelector('.page'), prev = root.querySelector('#prev'), next = root.querySelector('#next'), dots = [...root.querySelectorAll('.dots i')];
    let at = 0;
    const show = (i, dir = 1) => {
      at = i;
      page.innerHTML = pages[i].map((t) => `<p>${t}</p>`).join('') + (i === last ? `<p class="sig">— ${config.from}</p>` : '');
      dots.forEach((d, j) => d.classList.toggle('on', j === i));
      prev.style.visibility = i === 0 ? 'hidden' : 'visible';
      next.style.visibility = i === last ? 'hidden' : 'visible';
      gsap.fromTo(page, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'power2.out' });
      gsap.to(page.querySelectorAll('p'), { opacity: 1, y: 0, startAt: { y: 12 }, stagger: .7, delay: .35, duration: .7 });
    };
    prev.onclick = () => at > 0 && show(at - 1, -1);
    next.onclick = () => at < last && show(at + 1, 1);
    show(0);
  },
};
