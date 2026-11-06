/* InviteAura backend — zero-dependency Node.js server.
   Run:  node server.js        (PORT env, default 3000)
   APIs:
     GET  /api/config/:slug        -> weddings/<slug>.json
     GET  /api/weddings            -> list of weddings
     POST /api/weddings            -> save config (Admin), slug generated
     POST /api/rsvp                -> save RSVP
     GET  /api/rsvp?weddingId=     -> list RSVPs
     POST /api/wishes              -> save wish
     GET  /api/wishes?weddingId=   -> list wishes
     GET  /api/stats?weddingId=    -> attending counts
   Static: serves index.html, admin.html, js/, weddings/, wedding.config.json
   Database: data/*.json files (swap with Firebase/Supabase later — see README). */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA = path.join(ROOT, "data");
const WEDDINGS = path.join(ROOT, "weddings");
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(WEDDINGS, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

function readJSON(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); }
function appendJSON(name, item) {
  const file = path.join(DATA, name);
  const list = readJSON(file, []);
  list.push({ ...item, createdAt: new Date().toISOString() });
  writeJSON(file, list);
  return list;
}
const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "wedding";
const safeSlug = (s) => { const v = slugify(s); return /^[a-z0-9-]+$/.test(v) ? v : "wedding"; };

function send(res, code, body, type = "application/json") {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(data);
}
function bodyJSON(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on("data", (c) => { size += c.length; if (size > 1e6) { reject(new Error("too large")); req.destroy(); } chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks)) : {}); } catch { reject(new Error("invalid json")); } });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  const p = u.pathname;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return send(res, 204, "");

  try {
    /* ---------- API ---------- */
    if (p.startsWith("/api/")) {
      if (req.method === "GET" && p.startsWith("/api/config/")) {
        const slug = safeSlug(p.split("/").pop());
        const file = path.join(WEDDINGS, slug + ".json");
        if (fs.existsSync(file)) return send(res, 200, readJSON(file, {}));
        const def = path.join(ROOT, "wedding.config.json");
        if (fs.existsSync(def)) return send(res, 200, readJSON(def, {}));
        return send(res, 404, { error: "wedding not found" });
      }
      if (req.method === "GET" && p === "/api/weddings") {
        const files = fs.readdirSync(WEDDINGS).filter((f) => f.endsWith(".json"));
        return send(res, 200, files.map((f) => ({ slug: f.replace(".json", ""), ...readJSON(path.join(WEDDINGS, f), {}) })));
      }
      if (req.method === "POST" && p === "/api/weddings") {
        const cfg = await bodyJSON(req);
        if (!cfg.groomName || !cfg.brideName || !cfg.weddingDate) return send(res, 400, { error: "groomName, brideName, weddingDate required" });
        const slug = safeSlug(cfg.weddingId || `${cfg.groomName}-${cfg.brideName}`);
        cfg.weddingId = slug;
        writeJSON(path.join(WEDDINGS, slug + ".json"), cfg);
        return send(res, 201, { slug, url: `/?wedding=${slug}`, config: cfg });
      }
      if (p === "/api/rsvp") {
        if (req.method === "POST") {
          const d = await bodyJSON(req);
          if (!d.name || !d.attending) return send(res, 400, { error: "name and attending required" });
          appendJSON("rsvps.json", { weddingId: d.weddingId || "default", name: String(d.name).slice(0, 120), phone: String(d.phone || "").slice(0, 40), attending: d.attending === "no" ? "no" : "yes", guests: Math.min(20, parseInt(d.guests) || 1), meal: String(d.meal || "").slice(0, 40), message: String(d.message || "").slice(0, 500) });
          return send(res, 201, { ok: true });
        }
        if (req.method === "GET") {
          const id = u.searchParams.get("weddingId") || "default";
          return send(res, 200, readJSON(path.join(DATA, "rsvps.json"), []).filter((r) => (r.weddingId || "default") === id));
        }
      }
      if (p === "/api/wishes") {
        if (req.method === "POST") {
          const d = await bodyJSON(req);
          if (!d.name || !d.message) return send(res, 400, { error: "name and message required" });
          appendJSON("wishes.json", { weddingId: d.weddingId || "default", name: String(d.name).slice(0, 80), message: String(d.message).slice(0, 500) });
          return send(res, 201, { ok: true });
        }
        if (req.method === "GET") {
          const id = u.searchParams.get("weddingId") || "default";
          return send(res, 200, readJSON(path.join(DATA, "wishes.json"), []).filter((w) => (w.weddingId || "default") === id));
        }
      }
      if (req.method === "GET" && p === "/api/stats") {
        const id = u.searchParams.get("weddingId") || "default";
        const list = readJSON(path.join(DATA, "rsvps.json"), []).filter((r) => (r.weddingId || "default") === id);
        return send(res, 200, {
          attending: list.filter((r) => r.attending === "yes").length,
          regret: list.filter((r) => r.attending === "no").length,
          guests: list.filter((r) => r.attending === "yes").reduce((a, r) => a + (r.guests || 0), 0),
          total: list.length,
        });
      }
      return send(res, 404, { error: "unknown api route" });
    }

    /* ---------- Static ---------- */
    let filePath = p === "/" ? "/index.html" : p;
    // Pretty URL: /kasun-shanika  ->  index.html?wedding=kasun-shanika
    if (!path.extname(filePath)) {
      const slug = safeSlug(filePath.replace(/^\//, ""));
      if (fs.existsSync(path.join(WEDDINGS, slug + ".json"))) {
        return send(res, 200, fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), "text/html");
      }
      filePath = "/index.html";
    }
    const full = path.normalize(path.join(ROOT, filePath));
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(res, 404, "Not found", "text/plain");
    send(res, 200, fs.readFileSync(full), MIME[path.extname(full)] || "application/octet-stream");
  } catch (err) {
    return send(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => console.log(`💍 InviteAura running at http://localhost:${PORT}  (admin: /admin.html)`));
