const fs = require('fs');
const path = require('path');

// Read links data
const links = JSON.parse(fs.readFileSync('./data/links.json', 'utf8'));

function formatDate(dateStr) {
  if (!dateStr) return '';
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