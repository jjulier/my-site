const https = require('https');
const fs = require('fs');

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTseVaGceR6EcRjpB6FgHrGCGeVfxmZWXbrZJI1nst0iCq_pTv-0-ONKd-NxhCH26NFkBEEteWllz8/pub?gid=0&single=true&output=csv';

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i+1];
    if (inQuote) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

https.get(CSV_URL, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = parseCSV(data);
    const headers = rows[0].map(h => h.toLowerCase().trim());

    const idx = {
      title: headers.indexOf('title'),
      url: headers.indexOf('url'),
      author: headers.indexOf('author'),
      date: headers.indexOf('date'),
      commentary: headers.indexOf('commentary'),
      quote: headers.indexOf('quote'),
      tags: headers.indexOf('tags'),
      source: headers.indexOf('source'),
      dateAdded: headers.indexOf('date added'),
    };

    const links = rows.slice(1).filter(r => r.some(c => c)).map(r => ({
      title: r[idx.title] || '',
      url: r[idx.url] || '',
      author: r[idx.author] || '',
      date: r[idx.date] || '',
      commentary: r[idx.commentary] || '',
      quote: r[idx.quote] || '',
      tags: r[idx.tags] || '',
      source: r[idx.source] || '',
      dateAdded: r[idx.dateAdded] || '',
    }));

    fs.writeFileSync('./data/links.json', JSON.stringify(links, null, 2));
    console.log(`✓ Migrated ${links.length} links to data/links.json`);
  });
}).on('error', e => console.error('Error:', e.message));