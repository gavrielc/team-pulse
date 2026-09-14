import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { computePulseResponse } from "./lib/pulse-api.js";

const DEFAULT_DATA_PATH = path.resolve("pulse.json");
const INDEX_PATH = path.resolve("index.html");

async function loadData(dataPath) {
  const raw = await readFile(dataPath, "utf8");
  return JSON.parse(raw);
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function sendFile(res, filePath, contentType) {
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(body);
  } catch {
    sendJson(res, 404, { error: "not found" });
  }
}

export function createServer(dataPath = DEFAULT_DATA_PATH) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method !== "GET") {
      sendJson(res, 404, { error: "not found" });
      return;
    }

    if (url.pathname === "/") {
      await sendFile(res, INDEX_PATH, "text/html; charset=utf-8");
      return;
    }

    if (url.pathname === "/pulse.json") {
      await sendFile(res, dataPath, "application/json");
      return;
    }

    if (url.pathname !== "/api/pulse") {
      sendJson(res, 404, { error: "not found" });
      return;
    }

    let data;
    try {
      data = await loadData(dataPath);
    } catch {
      sendJson(res, 500, { error: "failed to read pulse data" });
      return;
    }

    const project = url.searchParams.get("project");
    const week = url.searchParams.get("week");
    const { status, body } = computePulseResponse(data, { project, week });
    sendJson(res, status, body);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 8787;
  const dataPath = process.env.PULSE_DATA_PATH
    ? path.resolve(process.env.PULSE_DATA_PATH)
    : DEFAULT_DATA_PATH;

  createServer(dataPath).listen(port, () => {
    console.log(`pulse api listening on :${port}, reading ${dataPath}`);
  });
}
