// Generates posters/index.html: each link quote as a poster, with a wall view.

// Each poster gets one classic typeface and a background and ink colour that suit it.
const STYLES = [
  { font: "'Bodoni Moda', serif",          bg: '#6B1E1E', ink: '#F3E9D7', italic: false },
  { font: "'EB Garamond', serif",          bg: '#F2EBDD', ink: '#1C1A17', italic: true  },
  { font: "'Libre Caslon Text', serif",    bg: '#1F3A2E', ink: '#ECE4CF', italic: false },
  { font: "'Playfair Display', serif",     bg: '#D9A441', ink: '#2A1E0E', italic: false },
  { font: "'Cormorant Garamond', serif",   bg: '#18233A', ink: '#F1E6D2', italic: true  },
  { font: "'Bodoni Moda', serif",          bg: '#EED6CF', ink: '#5A1F2B', italic: true  },
  { font: "'Playfair Display', serif",     bg: '#1E3FAE', ink: '#F5F0E6', italic: true  },
  { font: "'DM Serif Display', serif",     bg: '#151413', ink: '#EDE6D6', italic: false },
  { font: "'Libre Caslon Text', serif",    bg: '#B9C3A5', ink: '#1F2A1C', italic: true  },
  { font: "'EB Garamond', serif",          bg: '#C8432B', ink: '#FBF3E6', italic: false },
  { font: "'DM Serif Display', serif",     bg: '#E4DCCB', ink: '#23314F', italic: true  },
  { font: "'Cormorant Garamond', serif",   bg: '#3B2A22', ink: '#E9D9BF', italic: false },
];

const FONTS = 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=DM+Serif+Display:ital@0;1&family=EB+Garamond:ital@0;1&family=Libre+Caslon+Text:ital@0;1&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap';

// Quotes that are really code or prompts (markdown headings, lists) need a highlighted excerpt.
function looksLikeCode(text) {
  return /^\s*(#{1,6}\s|[-*]\s|---)/m.test(text);
}

// The poster shows the ==highlighted== part of the quote in the note.
// Without a highlight, use the whole quote if it's short, or the first sentence.
function fallbackExcerpt(link) {
  const quote = link.quote;
  if (looksLikeCode(quote)) {
    console.warn('! No poster: highlight part of the quote for ' + link.title);
    return null;
  }
  if (quote.length <= 160) return quote;
  const first = (quote.match(/^[^]*?[.!?](?=\s|$)/) || [quote])[0];
  console.warn((first.length <= 200 ? 'i No highlight, using the first sentence: ' : '! No highlight and the quote is long: ') + link.title);
  return first.length <= 200 ? first : quote;
}

function generatePostersPage(links) {
  const posters = links.filter(l => l.quote).map(link => {
    let excerpt = link.excerpt;
    let marked = link.quoteMarked;
    if (!excerpt) {
      excerpt = fallbackExcerpt(link);
      if (!excerpt) return null;
      marked = link.quote.replace(excerpt, '\u0001' + excerpt + '\u0002');
    }
    return { quote: link.quote, marked, excerpt, title: link.title || link.url, url: link.url, author: link.author || '' };
  }).filter(Boolean).map((p, i) => ({ ...p, style: i % STYLES.length }));

  const data = JSON.stringify({ posters, styles: STYLES }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>link quote posters</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      background: #F4F1EA;
      color: #1C1A17;
    }
    a { color: inherit; text-decoration: none; }

    /* A poster. Everything inside is sized in --u, which scales with the poster. */
    .poster {
      container-type: size;
      position: relative;
      background: var(--bg);
      color: var(--ink);
      overflow: hidden;
    }
    .poster-inner {
      --u: min(1cqi, 0.72cqb);
      position: absolute;
      inset: 0;
      padding: calc(9 * var(--u));
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-family: var(--font);
    }
    .quote {
      max-width: calc(84 * var(--u));
      font-size: calc(var(--size) * var(--u));
      line-height: 1.22;
      letter-spacing: -0.005em;
      font-style: var(--style);
      hyphens: manual;
    }
    .quote p { margin: 0; text-wrap: pretty; }
    .quote p + p { margin-top: 0.6em; }
    .quote.short p { text-wrap: balance; }
    .quote.full { color: color-mix(in srgb, var(--ink) 42%, var(--bg)); }
    .quote.full mark { background: none; color: var(--ink); }

    /* Wall */
    .wall-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 24px;
      padding: 24px 24px 0;
    }
    .wall-head nav a { margin-right: 20px; color: #0000FF; }
    .wall-head nav a:hover { background: #FBE4EC; }
    h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 48px 24px 32px;
    }
    h1 em { font-weight: 400; }
    .wall {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      padding: 0 24px 64px;
    }
    .wall .poster {
      aspect-ratio: 1 / 1.33;
      cursor: pointer;
      transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s;
    }
    .wall .poster:hover, .wall .poster:focus-visible {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px -14px rgba(0,0,0,.45);
      outline: none;
    }
    .wall .meta { display: none; }

    /* Single poster, filling the screen */
    .single { display: none; }
    body.is-single { overflow: hidden; }
    body.is-single .single { display: block; position: fixed; inset: 0; }
    body.is-single .wall-view { display: none; }
    .single .poster { position: absolute; inset: 0; }
    .single .poster-inner { --u: min(1cqi, 0.62cqb); align-items: flex-start; padding-left: max(calc(9 * var(--u)), calc(50cqi - 46 * var(--u))); }
    .meta {
      position: absolute;
      left: 24px;
      bottom: 22px;
      right: 280px;
      font-family: 'Playfair Display', serif;
      font-style: normal;
      line-height: 1.4;
    }
    .meta a:hover { text-decoration: underline; text-underline-offset: 3px; }
    .meta .author { opacity: .7; }
    .controls {
      position: fixed;
      right: 24px;
      bottom: 22px;
      display: flex;
      gap: 20px;
      color: var(--ink);
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
    .controls a:hover, .controls button:hover { text-decoration: underline; text-underline-offset: 3px; }
    .controls .count { opacity: .7; font-variant-numeric: tabular-nums; }
    .single.fresh .poster { animation: fade .5s ease; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 640px) {
      .wall-head, .wall { padding-left: 16px; padding-right: 16px; }
      h1 { margin-left: 16px; margin-right: 16px; }
      .wall { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .single .poster-inner { --u: min(1cqi, 0.6cqb); padding: 12cqi 8cqi 30cqi; }
      .meta { left: 16px; right: 16px; bottom: 64px; }
      .controls { left: 16px; right: 16px; bottom: 22px; gap: 16px; justify-content: flex-start; }
      .controls .count { display: none; }
      .controls a { margin-left: auto; }
    }
    @media (prefers-reduced-motion: reduce) {
      .single .poster { animation: none; }
      .wall .poster { transition: none; }
    }
  </style>
</head>
<body>

  <div class="wall-view">
    <div class="wall-head">
      <nav>
        <a href="/">Home</a>
        <a href="/links">Links</a>
        <a href="/posters">Posters</a>
        <a href="/ideas">Ideas</a>
      </nav>
    </div>
    <h1>link <em>quote</em> posters</h1>
    <main class="wall" id="wall"></main>
  </div>

  <div class="single" id="single" aria-live="polite"></div>

  <script>
    const { posters, styles } = ${data};

    function sizeFor(text) {
      const n = text.length;
      if (n <= 110) return 8.4;
      if (n <= 200) return 6.6;
      if (n <= 280) return 5.8;
      if (n <= 380) return 5.0;
      if (n <= 480) return 4.4;
      return 3.9;
    }

    function esc(s) {
      return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    // The full quote, as paragraphs, with the poster's excerpt marked.
    function fullHTML(p) {
      return esc(p.marked).split(/\\n+/).map(t => '<p>' + t.trim() + '</p>').join('')
        .replace(/\u0001([^]*?)\u0002/g, (m, x) => '<mark>' + x.split('</p><p>').join('</mark></p><p><mark>') + '</mark>');
    }

    function posterHTML(p, i, tag, full) {
      const s = styles[p.style];
      const text = full ? p.quote : p.excerpt;
      const paras = full ? fullHTML(p) : p.excerpt.split(/\\n+/).map(t => '<p>' + esc(t.trim()) + '</p>').join('');
      const vars = '--bg:' + s.bg + ';--ink:' + s.ink + ';--font:' + s.font +
        ';--style:' + (s.italic ? 'italic' : 'normal') + ';--size:' + sizeFor(text);
      const attrs = tag === 'a' ? ' href="#' + (i + 1) + '" aria-label="Poster ' + (i + 1) + ': ' + esc(p.title) + '"' : '';
      return '<' + tag + ' class="poster" style="' + vars + '"' + attrs + '>' +
        '<div class="poster-inner"><div class="quote' + (full ? ' full' : '') + (text.length < 160 ? ' short' : '') + '">' + paras + '</div></div>' +
        '<div class="meta"><a href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
        (p.author ? '<br><span class="author">' + esc(p.author) + '</span>' : '') + '</div>' +
        '</' + tag + '>';
    }

    document.getElementById('wall').innerHTML = posters.map((p, i) => posterHTML(p, i, 'a')).join('');

    const single = document.getElementById('single');
    let current = -1;
    let full = false;

    function show(i) {
      single.classList.toggle('fresh', i !== current);
      if (i !== current) full = false;
      current = (i + posters.length) % posters.length;
      const p = posters[current];
      const s = styles[p.style];
      single.innerHTML = posterHTML(p, current, 'div', full) +
        '<div class="controls" style="--ink:' + s.ink + '">' +
          (p.excerpt !== p.quote ? '<button type="button" data-full>' + (full ? 'Excerpt' : 'Full quote') + '</button>' : '') +
          '<span class="count">' + (current + 1) + ' of ' + posters.length + '</span>' +
          '<button type="button" data-go="-1">Previous</button>' +
          '<button type="button" data-go="1">Next</button>' +
          '<a href="#">View all</a>' +
        '</div>';
      document.body.classList.add('is-single');
      document.title = posters[current].title + ' – link quote posters';
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', s.bg);
    }

    function go(step) { location.hash = '#' + (((current + step + posters.length) % posters.length) + 1); }

    function route() {
      const n = parseInt(location.hash.slice(1), 10);
      if (n >= 1 && n <= posters.length) {
        show(n - 1);
      } else {
        const was = current;
        current = -1;
        document.body.classList.remove('is-single');
        document.title = 'link quote posters';
        if (was >= 0) document.querySelectorAll('.wall .poster')[was]?.focus({ preventScroll: false });
      }
    }

    single.addEventListener('click', e => {
      if (e.target.closest('[data-full]')) { full = !full; return show(current); }
      const btn = e.target.closest('[data-go]');
      if (btn) return go(+btn.dataset.go);
      if (e.target.closest('a, .controls')) return;
      // Click the left third to go back, anywhere else to go forward.
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

module.exports = { generatePostersPage };
