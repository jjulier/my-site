const fs = require('fs');
const path = require('path');

// Read links from the Obsidian note (copied into data/links.md by publish.sh)
const { parseLinks } = require('./notes');
const links = parseLinks(fs.readFileSync('./data/links.md', 'utf8'));

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function generateLinksPage(links) {
  const articles = links.map(link => {
    const safeTitle = (link.title || link.url).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const quote = link.quote ? `<blockquote>${link.quote.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</blockquote>` : '';
    const commentary = link.commentary ? `<p>${link.commentary.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '';
    const meta = [link.author, formatDate(link.date)].filter(Boolean).join(', ');

    return `  <article>
    <h2><a href="${link.url}">${safeTitle}</a></h2>
    ${quote}
    ${meta ? `<p>${meta}</p>` : ''}
    ${commentary}
  </article>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>link quote notes</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>

  <nav>
    <a href="/">Home</a>
    <a href="/links">Links</a>
  </nav>

  <h1><a href="#">link</a> <span class="word-quote">quote</span> notes</h1>

${articles}

  <hr>
  <footer>
    <p>Notes made by <a href="https://bsky.app/profile/joejulier.bsky.social">Joe Julier</a></p>
  </footer>

</body>
</html>`;
}

// Write the output
fs.writeFileSync('./links/index.html', generateLinksPage(links));
console.log('✓ Built links/index.html');

// Posters: each quote as a poster, showing the ==highlighted== excerpt
const { generatePostersPage } = require('./posters');
fs.mkdirSync('./posters', { recursive: true });
fs.writeFileSync('./posters/index.html', generatePostersPage(links));
console.log('✓ Built posters/index.html from ' + links.length + ' links');

// Ideas: Wikipedia pages as white posters with drawings, from the "Wikipedia ideas" note
if (fs.existsSync('./data/ideas.md')) {
  const { generateIdeasPage } = require('./ideas');
  const ideas = parseLinks(fs.readFileSync('./data/ideas.md', 'utf8'));
  fs.writeFileSync('./ideas/index.html', generateIdeasPage(ideas));
  console.log('✓ Built ideas/index.html from ' + ideas.length + ' ideas');
}
