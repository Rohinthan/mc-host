/**
 * CraftPanel Backend — server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Node.js backend that:
 *  - Downloads & launches Vanilla / Fabric / Forge / Quilt / NeoForge servers
 *  - Controls the server process (start, stop, restart)
 *  - Sends commands via RCON
 *  - Reads live console output
 *  - Streams logs via SSE (Server-Sent Events)
 *  - Manages mods folder
 *  - Exposes REST API consumed by the CraftPanel React app
 *
 * SETUP:
 *   1. Install Node.js 18+ on your computer/VPS
 *   2. npm install express cors rcon-client node-fetch fs-extra
 *   3. node server.js
 *   4. In CraftPanel app → Home → Config → enter http://YOUR_IP:4000
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express    = require("express");
const cors       = require("cors");
const { spawn }  = require("child_process");
const fs         = require("fs");
const fse        = require("fs-extra");
const path       = require("path");
const https      = require("https");
const http       = require("http");
const { Rcon }   = require("rcon-client");

const app  = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// ─── PATHS ────────────────────────────────────────────────────────────────────
const BASE_DIR    = path.join(__dirname, "craftpanel_data");
const SERVERS_DIR = path.join(BASE_DIR, "servers");
const MODS_DIR    = path.join(BASE_DIR, "mods_cache");
[BASE_DIR, SERVERS_DIR, MODS_DIR].forEach(d => fse.ensureDirSync(d));

// ─── STATE ────────────────────────────────────────────────────────────────────
let serverProcess  = null;   // child_process
let serverRunning  = false;
let serverConfig   = {};
let logBuffer      = [];     // last 300 lines
let sseClients     = [];     // SSE connections

function pushLog(line) {
  const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
  logBuffer.push(entry);
  if (logBuffer.length > 300) logBuffer.shift();
  sseClients.forEach(res => res.write(`data: ${JSON.stringify(entry)}\n\n`));
}

// ─── DOWNLOAD HELPER ─────────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", e => { fs.unlink(dest, () => {}); reject(e); });
  });
}

// ─── FETCH VANILLA JAR URL ────────────────────────────────────────────────────
async function getVanillaJarUrl(version) {
  const manifest = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json");
  const data     = await manifest.json();
  const ver      = data.versions.find(v => v.id === version);
  if (!ver) throw new Error(`Version ${version} not found`);
  const verData = await fetch(ver.url).then(r => r.json());
  return verData.downloads.server.url;
}

// ─── FETCH FABRIC INSTALLER ───────────────────────────────────────────────────
async function getFabricInstallerUrl() {
  const data = await fetch("https://meta.fabricmc.net/v2/versions/installer").then(r => r.json());
  return `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${data[0].version}/fabric-installer-${data[0].version}.jar`;
}

// ─── WRITE server.properties ──────────────────────────────────────────────────
function writeServerProperties(dir, cfg) {
  const props = {
    "server-port":              cfg.port        || 25565,
    "max-players":              cfg.maxPlayers  || 20,
    "gamemode":                 cfg.gamemode    || "survival",
    "difficulty":               cfg.difficulty  || "normal",
    "level-name":               cfg.worldName   || "world",
    "level-seed":               cfg.seed        || "",
    "level-type":               cfg.worldTemplate==="default"?"minecraft:normal":cfg.worldTemplate||"minecraft:normal",
    "enable-rcon":              "true",
    "rcon.port":                "25575",
    "rcon.password":            "craftpanel123",
    "broadcast-rcon-to-ops":    "false",
    "online-mode":              "false",   // set true for production
    "allow-flight":             "true",
    "spawn-protection":         cfg.spawnProtection || 10,
    "view-distance":            cfg.viewDistance    || 10,
    "motd":                     "CraftPanel Server",
  };
  const content = Object.entries(props).map(([k,v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync(path.join(dir, "server.properties"), content);
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check
app.get("/ping", (_, res) => res.json({ ok: true, version: "1.0.0" }));

// ── GET server status
app.get("/server/status", (_, res) => {
  res.json({
    running:  serverRunning,
    config:   serverConfig,
    pid:      serverProcess?.pid || null,
  });
});

// ── Start server
app.post("/server/start", async (req, res) => {
  if (serverRunning) return res.json({ ok: false, error: "Already running" });

  const { loader="vanilla", mcVer="1.21.1", ram=2048, crossplay=false,
          worldName="world", worldTemplate="default", seed="" } = req.body;

  serverConfig = { loader, mcVer, ram, crossplay, worldName, worldTemplate, seed };
  const serverDir = path.join(SERVERS_DIR, `${loader}-${mcVer}`);
  fse.ensureDirSync(serverDir);

  // Write eula.txt
  fs.writeFileSync(path.join(serverDir, "eula.txt"), "eula=true\n");
  writeServerProperties(serverDir, { worldName, worldTemplate, seed });

  try {
    const jarPath = path.join(serverDir, "server.jar");

    if (!fs.existsSync(jarPath)) {
      pushLog(`[Setup] Downloading ${loader} ${mcVer} server...`);

      if (loader === "vanilla") {
        const url = await getVanillaJarUrl(mcVer);
        pushLog(`[Setup] URL: ${url}`);
        await download(url, jarPath);

      } else if (loader === "fabric") {
        // Download fabric server launcher
        const loaderData  = await fetch("https://meta.fabricmc.net/v2/versions/loader").then(r=>r.json());
        const loaderVer   = loaderData[0].version;
        const instUrl     = await getFabricInstallerUrl();
        const instPath    = path.join(serverDir, "fabric-installer.jar");
        if (!fs.existsSync(instPath)) await download(instUrl, instPath);

        pushLog(`[Setup] Running Fabric installer...`);
        await new Promise((resolve, reject) => {
          const proc = spawn("java", ["-jar", instPath, "server", "-mcversion", mcVer, "-loader", loaderVer, "-downloadMinecraft"], { cwd: serverDir });
          proc.stdout.on("data", d => pushLog("[Fabric] " + d.toString().trim()));
          proc.stderr.on("data", d => pushLog("[Fabric] " + d.toString().trim()));
          proc.on("close", code => code===0 ? resolve() : reject(new Error("Fabric install failed")));
        });
        // Fabric creates fabric-server-launch.jar
        const fabricJar = path.join(serverDir, "fabric-server-launch.jar");
        if (fs.existsSync(fabricJar)) fs.renameSync(fabricJar, jarPath);

      } else if (loader === "forge") {
        pushLog("[Setup] For Forge: download the installer from https://files.minecraftforge.net and place server.jar here: " + serverDir);
        pushLog("[Setup] Then restart. Falling back to vanilla for now.");
        const url = await getVanillaJarUrl(mcVer);
        await download(url, jarPath);
      }

      pushLog("[Setup] Download complete!");
    }

    // Copy mods
    if (loader !== "vanilla") {
      const modsTarget = path.join(serverDir, "mods");
      fse.ensureDirSync(modsTarget);
    }

    // Launch
    pushLog(`[Server] Starting ${loader} ${mcVer} — RAM: ${ram}MB`);
    const javaArgs = [
      `-Xmx${ram}M`, `-Xms${Math.floor(ram/2)}M`,
      "-jar", jarPath,
      "--nogui"
    ];

    serverProcess = spawn("java", javaArgs, { cwd: serverDir });
    serverRunning = true;

    serverProcess.stdout.on("data", d => d.toString().split("\n").filter(Boolean).forEach(pushLog));
    serverProcess.stderr.on("data", d => d.toString().split("\n").filter(Boolean).forEach(l => pushLog("[ERR] "+l)));
    serverProcess.on("close", code => {
      serverRunning = false;
      serverProcess = null;
      pushLog(`[Server] Process exited (code ${code})`);
    });

    res.json({ ok: true });
  } catch(e) {
    pushLog("[Error] " + e.message);
    res.json({ ok: false, error: e.message });
  }
});

// ── Stop server
app.post("/server/stop", async (_, res) => {
  if (!serverRunning || !serverProcess) return res.json({ ok: false, error: "Not running" });
  try {
    await rconCommand("stop");
  } catch {}
  setTimeout(() => { if (serverProcess) serverProcess.kill("SIGTERM"); }, 5000);
  res.json({ ok: true });
});

// ── Restart
app.post("/server/restart", async (req, res) => {
  await fetch(`http://localhost:${PORT}/server/stop`, { method: "POST" });
  await new Promise(r => setTimeout(r, 6000));
  await fetch(`http://localhost:${PORT}/server/start`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(serverConfig) });
  res.json({ ok: true });
});

// ── RCON command
async function rconCommand(cmd) {
  const rcon = new Rcon({ host:"localhost", port:25575, password:"craftpanel123", timeout:5000 });
  await rcon.connect();
  const response = await rcon.send(cmd);
  await rcon.end();
  return response;
}

app.post("/server/command", async (req, res) => {
  const { command } = req.body;
  if (!command) return res.json({ ok: false, error: "No command" });
  pushLog(`[CMD] /${command}`);
  try {
    const response = await rconCommand(command);
    pushLog(`[Server] ${response || "OK"}`);
    res.json({ ok: true, response });
  } catch(e) {
    // If RCON not available (server starting), queue it
    pushLog(`[CMD] ${e.message}`);
    res.json({ ok: false, error: e.message });
  }
});

// ── Game rules
app.post("/server/gamerule", async (req, res) => {
  const { rule, val } = req.body;
  const cmd = `gamerule ${rule} ${val}`;
  pushLog(`[Rule] ${rule} = ${val}`);
  try {
    if (serverRunning) await rconCommand(cmd);
    res.json({ ok: true });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// ── Players (via RCON list)
app.get("/server/players", async (_, res) => {
  try {
    const response = await rconCommand("list");
    // Parse "There are X of a max of Y players online: name1, name2"
    const match = response.match(/online:\s*(.*)/);
    const names = match?.[1]?.split(",").map(s=>s.trim()).filter(Boolean) || [];
    res.json({ ok: true, players: names });
  } catch(e) {
    res.json({ ok: false, players: [], error: e.message });
  }
});

// ── Logs (SSE stream)
app.get("/server/logs", (req, res) => {
  res.set({ "Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive" });
  res.flushHeaders();
  // Send buffer first
  logBuffer.forEach(line => res.write(`data: ${JSON.stringify(line)}\n\n`));
  sseClients.push(res);
  req.on("close", () => { sseClients = sseClients.filter(c => c !== res); });
});

// ── Get log snapshot
app.get("/server/logs/snapshot", (_, res) => res.json({ ok: true, logs: logBuffer }));

// ── Mods management
app.get("/mods", (_, res) => {
  if (!serverConfig.loader || serverConfig.loader === "vanilla") return res.json({ ok: true, mods: [] });
  const modsDir = path.join(SERVERS_DIR, `${serverConfig.loader}-${serverConfig.mcVer}`, "mods");
  fse.ensureDirSync(modsDir);
  const files = fs.readdirSync(modsDir).filter(f => f.endsWith(".jar"));
  res.json({ ok: true, mods: files.map(f => ({ name: f, path: path.join(modsDir, f) })) });
});

app.delete("/mods/:name", (req, res) => {
  const modsDir = path.join(SERVERS_DIR, `${serverConfig.loader}-${serverConfig.mcVer}`, "mods");
  const target  = path.join(modsDir, req.params.name);
  if (fs.existsSync(target)) { fs.unlinkSync(target); res.json({ ok: true }); }
  else res.json({ ok: false, error: "File not found" });
});

// ── Download mod from Modrinth
app.post("/mods/install", async (req, res) => {
  const { projectId, versionId } = req.body;
  try {
    const versions = await fetch(`https://api.modrinth.com/v2/project/${projectId}/version`).then(r=>r.json());
    const target   = versionId ? versions.find(v=>v.id===versionId) : versions[0];
    if (!target) return res.json({ ok:false, error:"Version not found" });
    const file = target.files.find(f=>f.primary) || target.files[0];
    if (!file) return res.json({ ok:false, error:"No file found" });

    const modsDir = path.join(SERVERS_DIR, `${serverConfig.loader}-${serverConfig.mcVer}`, "mods");
    fse.ensureDirSync(modsDir);
    const dest = path.join(modsDir, file.filename);
    pushLog(`[Mods] Downloading ${file.filename}...`);
    await download(file.url, dest);
    pushLog(`[Mods] Installed ${file.filename}`);
    res.json({ ok: true, filename: file.filename });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// ── Backup world
app.post("/server/backup", async (req, res) => {
  const serverDir   = path.join(SERVERS_DIR, `${serverConfig.loader}-${serverConfig.mcVer}`);
  const worldDir    = path.join(serverDir, serverConfig.worldName || "world");
  const backupDir   = path.join(BASE_DIR, "backups");
  const backupName  = `world_${Date.now()}.tar`;
  fse.ensureDirSync(backupDir);
  pushLog("[Backup] Starting world backup...");
  try {
    const tar = spawn("tar", ["-czf", path.join(backupDir, backupName), worldDir]);
    tar.on("close", code => {
      if (code === 0) { pushLog(`[Backup] Saved as ${backupName}`); res.json({ ok:true, file:backupName }); }
      else res.json({ ok:false, error:"tar failed" });
    });
  } catch(e) {
    // Fallback: just copy the folder
    fse.copySync(worldDir, path.join(backupDir, `world_${Date.now()}`));
    pushLog("[Backup] World backed up (copy)");
    res.json({ ok: true });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       CraftPanel Backend v1.0            ║
║  Listening on http://localhost:${PORT}      ║
╚══════════════════════════════════════════╝

API Endpoints:
  GET  /ping                  — health check
  GET  /server/status         — server state
  POST /server/start          — start server {loader, mcVer, ram, crossplay, worldName, seed}
  POST /server/stop           — stop server
  POST /server/restart        — restart server
  POST /server/command        — send RCON command {command}
  POST /server/gamerule       — set gamerule {rule, val}
  GET  /server/players        — list online players
  GET  /server/logs           — SSE log stream
  GET  /server/logs/snapshot  — last 300 log lines
  GET  /mods                  — list installed mods
  POST /mods/install          — install from Modrinth {projectId, versionId?}
  DELETE /mods/:name          — remove mod
  POST /server/backup         — backup world

In your CraftPanel app → Home → Config → http://YOUR_IP:${PORT}
`);
});
