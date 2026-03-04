const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'jjulier';
const REPO_NAME = 'my-site';
const FILE_PATH = 'data/links.json';

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'my-site-bot',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Parse the incoming link data
  let newLink;
  try {
    newLink = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Add timestamp
  newLink.dateAdded = new Date().toISOString();

  try {
    // Get the current file from GitHub
    const file = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`);
    
    // Decode the current links
    const currentLinks = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    
    // Add new link at the top
    currentLinks.unshift(newLink);
    
    // Encode updated content
    const updatedContent = Buffer.from(JSON.stringify(currentLinks, null, 2)).toString('base64');
    
    // Commit back to GitHub
    await githubRequest('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      message: `Add link: ${newLink.title || newLink.url}`,
      content: updatedContent,
      sha: file.sha
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };

  } catch (e) {
    return { statusCode: 500, body: 'Error: ' + e.message };
  }
};