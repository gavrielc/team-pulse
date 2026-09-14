'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_PATH = path.join(ROOT, 'pulse.json');

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function filterCheckins(checkins, { project, week }) {
  return checkins.filter((c) => {
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
    checkins: filterCheckins(data.checkins, { project, week }),
  });
}

function requestListener(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

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

if (require.main === module) {
  main();
}

module.exports = { createServer, requestListener, filterCheckins };
