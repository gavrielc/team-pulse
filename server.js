const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const WEEK_RE = /^\d{4}-W\d{2}$/;
const PULSE_JSON_PATH = path.join(__dirname, 'pulse.json');
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');

function loadData() {
  return JSON.parse(fs.readFileSync(PULSE_JSON_PATH, 'utf8'));
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'not found' });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handlePulse(res, query) {
  const data = loadData();
  const project = query.get('project');
  const week = query.get('week');

  if (project !== null && !data.projects.some((p) => p.id === project)) {
    sendJson(res, 404, { error: `unknown project: ${project}` });
    return;
  }

  if (week !== null && !WEEK_RE.test(week)) {
    sendJson(res, 400, { error: `invalid week: ${week}` });
    return;
  }

  const checkins = data.checkins.filter((c) => {
    if (project !== null && c.project !== project) return false;
    if (week !== null && c.week !== week) return false;
    return true;
  });

  sendJson(res, 200, {
    members: data.members,
    projects: data.projects,
    checkins,
  });
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method not allowed' });
      return;
    }

    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/api/pulse') {
      handlePulse(res, url.searchParams);
      return;
    }

    if (url.pathname === '/') {
      sendFile(res, INDEX_HTML_PATH, 'text/html');
      return;
    }

    if (url.pathname === '/pulse.json') {
      sendFile(res, PULSE_JSON_PATH, 'application/json');
      return;
    }

    sendJson(res, 404, { error: 'not found' });
  });
}

function main() {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`pulse server listening on ${port}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { createServer };
