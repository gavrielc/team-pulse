import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = process.env.PULSE_DATA_FILE
  ? path.resolve(process.env.PULSE_DATA_FILE)
  : path.join(process.cwd(), 'pulse.json');

const PAGE_PATH = path.join(process.cwd(), 'index.html');

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function filterCheckins(checkins, { member, project, week }) {
  return checkins.filter((c) => {
    if (member && c.member !== member) return false;
    if (project && c.project !== project) return false;
    if (week && c.week !== week) return false;
    return true;
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function handlePulse(res, url) {
  const member = url.searchParams.get('member') || undefined;
  const project = url.searchParams.get('project') || undefined;
  const week = url.searchParams.get('week') || undefined;

  let data;
  try {
    data = readData();
  } catch (err) {
    sendJson(res, 500, { error: 'failed to read pulse data' });
    return;
  }

  sendJson(res, 200, {
    members: data.members,
    projects: data.projects,
    checkins: filterCheckins(data.checkins, { member, project, week }),
  });
}

function handlePage(res) {
  let html;
  try {
    html = fs.readFileSync(PAGE_PATH, 'utf8');
  } catch (err) {
    sendJson(res, 404, { error: 'not found' });
    return;
  }
  const payload = Buffer.from(html, 'utf8');
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': payload.length,
  });
  res.end(payload);
}

function requestListener(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method not allowed' });
      return;
    }
    handlePage(res);
    return;
  }

  if (url.pathname === '/api/pulse') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method not allowed' });
      return;
    }
    handlePulse(res, url);
    return;
  }

  sendJson(res, 404, { error: 'not found' });
}

function createServer() {
  return http.createServer(requestListener);
}

function main() {
  const port = process.env.PORT || 3000;
  const server = createServer();
  server.listen(port, () => {
    console.log(`team-pulse listening on http://localhost:${port}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createServer, requestListener, filterCheckins };
