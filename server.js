'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_PATH = path.join(ROOT, 'pulse.json');
const INDEX_PATH = path.join(ROOT, 'index.html');

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function weeklyTrend(checkins, project) {
  const byWeek = new Map();
  for (const c of checkins) {
    if (c.project !== project) continue;
    if (!byWeek.has(c.week)) byWeek.set(c.week, []);
    byWeek.get(c.week).push(c.mood);
  }
  return [...byWeek.keys()].sort().map((week) => {
    const moods = byWeek.get(week);
    const sum = moods.reduce((a, b) => a + b, 0);
    return {
      week,
      averageMood: Math.round((sum / moods.length) * 100) / 100,
      count: moods.length,
    };
  });
}

function projectCheckins(data, project, week) {
  const nameById = new Map(data.members.map((m) => [m.id, m.name]));
  return data.checkins
    .filter((c) => c.project === project && c.week === week)
    .map((c) => ({
      member: c.member,
      name: nameById.get(c.member) || c.member,
      mood: c.mood,
      note: c.note,
    }));
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: 'not found' });
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function handlePulse(res, url) {
  const project = url.searchParams.get('project');
  const week = url.searchParams.get('week');

  let data;
  try {
    data = readData();
  } catch (err) {
    sendJson(res, 500, { error: 'failed to read pulse data' });
    return;
  }

  const knownProject = Array.isArray(data.projects) && data.projects.some((p) => p.id === project);
  if (!project || !knownProject) {
    sendJson(res, 400, { error: 'unknown or missing project' });
    return;
  }

  if (week) {
    const checkins = projectCheckins(data, project, week);
    sendJson(res, 200, { project, week, checkins });
    return;
  }

  const trend = weeklyTrend(data.checkins, project);
  sendJson(res, 200, { project, trend });
}

function requestListener(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/pulse') {
    handlePulse(res, url);
    return;
  }

  if (url.pathname === '/pulse.json') {
    serveStatic(res, DATA_PATH, 'application/json; charset=utf-8');
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    serveStatic(res, INDEX_PATH, 'text/html; charset=utf-8');
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

module.exports = { createServer, requestListener };
