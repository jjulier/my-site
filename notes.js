// Reads links from the Obsidian note (data/links.md).
//
// Each link is a section:
//
//   ## [Title](https://example.com)
//   Author, 2026-03-17
//
//   > The quote, with ==the poster excerpt== highlighted.
//
//   Optional notes, shown on the links page.

const DATE = /^\d{4}(-\d{2}){0,2}$/;

function parseMeta(line) {
  const at = line.lastIndexOf(',');
  const tail = at >= 0 ? line.slice(at + 1).trim() : line.trim();
  if (DATE.test(tail)) return { author: at >= 0 ? line.slice(0, at).trim() : '', date: tail };
  return { author: line.trim(), date: '' };
}

function parseSection(text) {
  const lines = text.split('\n');
  const heading = lines.shift().match(/^\[(.*)\]\((.*)\)\s*$/);
  if (!heading) return null;
  const link = { title: heading[1].trim(), url: heading[2].trim(), author: '', date: '', quote: '', commentary: '' };

  const quote = [];
  const rest = [];
  let metaDone = false;
  for (const line of lines) {
    if (/^>/.test(line)) {
      quote.push(line.replace(/^> ?/, ''));
      metaDone = true;
    } else if (!metaDone && line.trim()) {
      Object.assign(link, parseMeta(line));
      metaDone = true;
    } else if (quote.length) {
      rest.push(line);
    }
  }

  // ==highlights== mark the poster excerpt. Keep the quote clean, and a marked copy for the poster.
  const raw = quote.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const highlights = [...raw.matchAll(/==([^]+?)==/g)].map(m => m[1].trim());
  link.quote = raw.replace(/==([^]+?)==/g, '$1');
  link.quoteMarked = raw.replace(/==([^]+?)==/g, '\u0001$1\u0002');
  link.excerpt = highlights.join(' … ');
  link.commentary = rest.join('\n').trim();
  return link;
}

function parseLinks(md) {
  return md.split(/^## (?=\[)/m).slice(1).map(parseSection).filter(Boolean);
}

module.exports = { parseLinks };
