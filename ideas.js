// Generates ideas/index.html: each Wikipedia idea as a white poster with a drawing.
//
// Ideas come from the "Wikipedia ideas" note (data/ideas.md), in the same format as the
// link quotes, except the line under the heading is the idea's group (Design, Product...).
// Drawings live in ideas/drawings/<slug>.svg, where the slug comes from the Wikipedia
// page name, for example Hobson%27s_choice becomes hobsons-choice.

const fs = require('fs');
const path = require('path');

const FONTS = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital@0;1&family=Gochi+Hand&display=swap';

function slugFor(url) {
  let page = url.split('/wiki/')[1] || url;
  try { page = decodeURIComponent(page); } catch (e) {}
  return page.split('#')[0].replace(/_?\([^)]*\)/g, '').replace(/['’]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function readDrawing(slug) {
  const file = path.join(__dirname, 'ideas', 'drawings', slug + '.svg');
  if (!fs.existsSync(file)) {
    console.warn('! No drawing yet for ' + slug + ' (ideas/drawings/' + slug + '.svg)');
    return '';
  }
  return fs.readFileSync(file, 'utf8').replace(/<svg /, '<svg aria-hidden="true" focusable="false" ').trim();
}

function generateIdeasPage(ideas) {
  const items = ideas.filter(i => i.quote).map(idea => {
    let excerpt = idea.excerpt;
    let marked = idea.quoteMarked;
    if (!excerpt) {
      excerpt = idea.quote;
      marked = '\u0001' + idea.quote + '\u0002';
      console.warn('i No highlight, using the whole quote: ' + idea.title);
    }
    const slug = slugFor(idea.url);
    return {
      title: idea.title,
      url: idea.url,
      group: idea.author || 'Other',
      quote: idea.quote,
      marked,
      excerpt,
      note: idea.commentary || '',
      drawing: readDrawing(slug),
    };
  });

  const data = JSON.stringify(items).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ideas that mean something</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 18px;
      background: #EEECE7;
      color: #141414;
    }
    a { color: inherit; text-decoration: none; }

    /* A poster. Everything inside is sized in --u, which scales with the poster. */
    .poster {
      container-type: size;
      position: relative;
      display: block;
      background: #fff;
      color: #141414;
      overflow: hidden;
    }
    .poster-inner {
      --u: min(1cqi, 0.75cqb);
      position: absolute;
      inset: 0;
      padding: calc(8 * var(--u));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: calc(5 * var(--u));
      text-align: center;
    }
    .drawing { width: calc(72 * var(--u)); flex: none; }
    .drawing svg { display: block; width: 100%; height: auto; overflow: visible; }
    .drawing svg :is(path, line, rect, circle, ellipse, polyline) {
      fill: none;
      stroke: currentColor;
      stroke-width: 3.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .drawing svg .fill { fill: #fff; }
    .drawing svg .ink { fill: currentColor; stroke: none; }
    .drawing svg .hand {
      font-family: 'Gochi Hand', cursive;
      font-size: 25px;
      text-anchor: middle;
      fill: currentColor;
      stroke: none;
    }
    .quote {
      max-width: calc(76 * var(--u));
      font-size: calc(var(--size) * var(--u));
      line-height: 1.25;
    }
    .quote p { margin: 0; text-wrap: balance; }
    .quote.m-full { text-align: left; }
    .quote.m-full p { text-wrap: pretty; }
    .quote.m-full { color: #9a9893; }
    .quote.m-full mark { background: none; color: #141414; }
    /* The note hangs under the quote like an annotation, so the quote doesn't move. */
    .quote { position: relative; }
    .quote .note {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      padding-top: calc(3 * var(--u));
      font-size: calc(3.6 * var(--u));
      color: #141414;
      font-style: italic;
    }
    .quote .note p { text-wrap: pretty; }
    .quote .note a { text-decoration: underline; text-underline-offset: 0.15em; text-decoration-thickness: 1px; }

    /* Wall */
    .wall-head { padding: 24px 24px 0; }
    .wall-head nav a { margin-right: 20px; color: #0000FF; }
    .wall-head nav a:hover { background: #FBE4EC; }
    h1 { font-size: 34px; font-weight: 400; margin: 48px 24px 8px; }
    h1 em { font-style: italic; }
    .intro { margin: 0 24px 16px; color: #5f5d58; max-width: 560px; }
    h2 { font-size: 24px; font-weight: 400; font-style: italic; margin: 40px 24px 16px; }
    .wall {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      padding: 0 24px;
    }
    .wall .poster {
      aspect-ratio: 1 / 1.33;
      cursor: pointer;
      transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s;
    }
    .wall .poster:hover, .wall .poster:focus-visible {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px -16px rgba(0,0,0,.35);
      outline: none;
    }
    .wall .meta { display: none; }
    footer { margin: 64px 24px 48px; color: #5f5d58; }
    footer a { text-decoration: underline; text-underline-offset: 3px; }

    /* Single poster, filling the screen */
    .single { display: none; }
    body.is-single { overflow: hidden; background: #fff; }
    body.is-single .single { display: block; position: fixed; inset: 0; }
    body.is-single .wall-view { display: none; }
    .single .poster { position: absolute; inset: 0; }
    .single .poster-inner { --u: min(1cqi, 0.6cqb); padding-bottom: calc(12 * var(--u)); }
    .single.fresh .poster { animation: fade .5s ease; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    .meta {
      position: absolute;
      left: 24px;
      bottom: 22px;
      right: 380px;
      line-height: 1.4;
    }
    .meta a:hover { text-decoration: underline; text-underline-offset: 3px; }
    .controls {
      position: fixed;
      right: 24px;
      bottom: 22px;
      display: flex;
      gap: 20px;
      z-index: 2;
    }
    .controls > * { white-space: nowrap; }
    .controls a, .controls button {
      font: inherit;
      color: inherit;
      background: none;
      border: 0;
      padding: 0;
      cursor: pointer;
    }
    .controls a:hover, .controls button:hover, .controls [aria-pressed="true"] {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .controls .count { color: #77756f; font-variant-numeric: tabular-nums; }

    @media (max-width: 640px) {
      .wall-head, .wall { padding-left: 16px; padding-right: 16px; }
      h1, h2, .intro, footer { margin-left: 16px; margin-right: 16px; }
      .wall { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .single .poster-inner { --u: min(1cqi, 0.62cqb); padding: 10cqi 8cqi 34cqi; }
      .meta { left: 16px; right: 16px; bottom: 64px; }
      .controls { left: 16px; right: 16px; gap: 16px; }
      .controls .count { display: none; }
      .controls a { margin-left: auto; }
    }
    @media (prefers-reduced-motion: reduce) {
      .single.fresh .poster { animation: none; }
      .wall .poster { transition: none; }
    }
  </style>
</head>
<body>
  <!-- Makes every drawing's lines a little wobbly, like ink -->
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5"/>
    </filter>
  </svg>

  <div class="wall-view">
    <div class="wall-head">
      <nav>
        <a href="/">Home</a>
        <a href="/links">Links</a>
        <a href="/posters">Posters</a>
        <a href="/ideas">Ideas</a>
      </nav>
    </div>
    <h1>ideas that <em>mean</em> something</h1>
    <p class="intro">Wikipedia pages I keep coming back to, and what they make me think about.</p>
    <main id="wall"></main>
    <footer>Quotes from <a href="https://en.wikipedia.org/">Wikipedia</a>, shared under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Drawings by me, sort of.</footer>
  </div>

  <div class="single" id="single" aria-live="polite"></div>

  <script>
    const ideas = ${data};

    function sizeFor(text, mode) {
      const n = text.length;
      if (mode !== 'poster') return n <= 200 ? 4.2 : n <= 360 ? 3.6 : 3.1;
      return Math.max(3.8, Math.min(6.6, 6.6 - (n - 50) * 0.022)).toFixed(2);
    }

    function esc(s) {
      return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function paras(html) {
      return html.split(/\\n+/).map(t => '<p>' + t.trim() + '</p>').join('');
    }

    function noteHTML(text) {
      return paras(esc(text).replace(/\\[([^\\]]+)\\]\\(([^()\\s]+(?:\\([^()\\s]*\\)[^()\\s]*)?)\\)/g, '<a href="$2">$1</a>'));
    }

    const hasFull = p => p.excerpt !== p.quote;

    function fullHTML(p) {
      return paras(esc(p.marked)).replace(/\\u0001([^]*?)\\u0002/g, '<mark>$1</mark>');
    }

    // Full quote and Note are separate: Note hangs under whichever quote is showing.
    function posterHTML(p, i, tag, full, note) {
      const mode = full ? 'full' : 'poster';
      const body = full ? fullHTML(p) : paras(esc(p.excerpt));
      const attrs = tag === 'a' ? ' href="#' + (i + 1) + '" aria-label="' + esc(p.title) + '"' : '';
      return '<' + tag + ' class="poster"' + attrs + '>' +
        '<div class="poster-inner">' +
          (p.drawing ? '<div class="drawing">' + p.drawing + '</div>' : '') +
          '<div class="quote m-' + mode + '" style="--size:' + sizeFor(full ? p.quote : p.excerpt, mode) + '">' + body +
            (note ? '<div class="note">' + noteHTML(p.note) + '</div>' : '') + '</div>' +
        '</div>' +
        '<div class="meta"><a href="' + esc(p.url) + '">' + esc(p.title) + '</a></div>' +
        '</' + tag + '>';
    }

    // The wall, in groups
    const groups = [];
    ideas.forEach((p, i) => {
      let g = groups.find(g => g.name === p.group);
      if (!g) groups.push(g = { name: p.group, items: [] });
      g.items.push(posterHTML(p, i, 'a'));
    });
    document.getElementById('wall').innerHTML = groups.map(g =>
      '<h2>' + esc(g.name) + '</h2><div class="wall">' + g.items.join('') + '</div>').join('');

    const single = document.getElementById('single');
    let current = -1;
    let full = false;
    let note = false;

    function show(i) {
      single.classList.toggle('fresh', i !== current);
      current = (i + ideas.length) % ideas.length;
      const p = ideas[current];
      // Full quote and Note stay on as you move between ideas, for those that have one.
      const showFull = full && hasFull(p);
      const showNote = note && !!p.note;
      const toggle = (m, on, label) => '<button type="button" data-mode="' + m + '" aria-pressed="' + on + '">' + label + '</button>';
      single.innerHTML = posterHTML(p, current, 'div', showFull, showNote) +
        '<div class="controls">' +
          (hasFull(p) ? toggle('full', showFull, 'Full quote') : '') +
          (p.note ? toggle('note', showNote, 'Note') : '') +
          '<span class="count">' + (current + 1) + ' of ' + ideas.length + '</span>' +
          '<button type="button" data-go="-1">Previous</button>' +
          '<button type="button" data-go="1">Next</button>' +
          '<a href="#">View all</a>' +
        '</div>';
      document.body.classList.add('is-single');
      document.title = p.title + ' – ideas that mean something';
    }

    function go(step) { location.hash = '#' + (((current + step + ideas.length) % ideas.length) + 1); }

    function route() {
      const n = parseInt(location.hash.slice(1), 10);
      if (n >= 1 && n <= ideas.length) {
        show(n - 1);
      } else {
        const was = current;
        current = -1;
        document.body.classList.remove('is-single');
        document.title = 'ideas that mean something';
        if (was >= 0) document.querySelectorAll('.wall .poster')[was]?.focus();
      }
    }

    single.addEventListener('click', e => {
      const m = e.target.closest('[data-mode]');
      if (m) {
        if (m.dataset.mode === 'full') full = m.getAttribute('aria-pressed') !== 'true';
        else note = m.getAttribute('aria-pressed') !== 'true';
        return show(current);
      }
      const btn = e.target.closest('[data-go]');
      if (btn) return go(+btn.dataset.go);
      if (e.target.closest('a, .controls')) return;
      go(e.clientX < window.innerWidth / 3 ? -1 : 1);
    });

    document.addEventListener('keydown', e => {
      if (current < 0) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') location.hash = '';
    });

    let touchX = null;
    single.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    single.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    });

    window.addEventListener('hashchange', route);
    route();
  </script>
</body>
</html>`;
}

module.exports = { generateIdeasPage };
