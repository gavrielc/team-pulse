import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = process.env.PULSE_DATA_FILE
  ? path.resolve(process.env.PULSE_DATA_FILE)
  : path.join(process.cwd(), 'pulse.json');

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

function buildDigest(data) {
  const latestWeek = data.checkins.reduce(
    (max, c) => (max === null || c.week > max ? c.week : max),
    null
  );

  if (latestWeek === null) {
    return { week: null, projects: [] };
  }

  const nameById = new Map(data.projects.map((p) => [p.id, p.name]));
  const byProject = new Map();
  for (const c of data.checkins) {
    if (c.week !== latestWeek) continue;
    if (!byProject.has(c.project)) byProject.set(c.project, []);
    byProject.get(c.project).push(c.mood);
  }

  const projects = data.projects
    .filter((p) => byProject.has(p.id))
    .map((p) => {
      const moods = byProject.get(p.id);
      const avgMood = Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10;
      const membersCheckedIn = moods.length;
      const name = nameById.get(p.id) || p.id;
      return {
        id: p.id,
        name,
        avgMood,
        membersCheckedIn,
        summary: `${name}: avg mood ${avgMood} across ${membersCheckedIn} check-ins`,
      };
    });

  return { week: latestWeek, projects };
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

function handleDigest(res) {
  let data;
  try {
    data = readData();
  } catch (err) {
    sendJson(res, 500, { error: 'failed to read pulse data' });
    return;
  }

  sendJson(res, 200, buildDigest(data));
}

function handlePage(res) {
  const pagePath = path.join(process.cwd(), 'index.html');
  let html;
  try {
    html = fs.readFileSync(pagePath, 'utf8');
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

  if (url.pathname === '/api/digest') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method not allowed' });
      return;
    }
    handleDigest(res);
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

export { createServer, requestListener, filterCheckins, buildDigest };
