# mc-host 

but the name itself craftpanel 

> **A free, open-source Minecraft Server Manager you control from your phone.**
> Built for players who want full server control without paying for hosting panels.

![Version](https://img.shields.io/badge/Minecraft-1.8.9--1.21.1-green)
![Platform](https://img.shields.io/badge/Platform-Java%20%7C%20Bedrock-blue)
![License](https://img.shields.io/badge/License-MIT-purple)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-cyan)

---

##  What is CraftPanel?

CraftPanel is a **mobile-first Minecraft server management app** that lets you create, configure, and control your own Minecraft server entirely from your phone. No expensive hosting panels. No complicated setup. Just open the app and tap Start.

It works with **official Vanilla Java**, Fabric, Forge, Quilt, and NeoForge — and supports **Bedrock crossplay** so your friends on mobile, console, and PC can all join the same server.

---

##  Features

###  Server Management
- **One-tap start/stop** for your Minecraft server
- Supports **Vanilla Java** (official Mojang), Fabric, Forge, Quilt, NeoForge
- Auto-downloads the correct server JAR — no manual setup
- Pick any Minecraft version from **1.8.9 to 1.21.1**
- Live **TPS, RAM, and CPU** monitoring with animated bars
- Real-time **console log** stream directly in the app
- Send any server command from your phone

### World Creation
- Create worlds with custom **name and seed**
- Choose world type: Default, Superflat, Amplified, Large Biomes, Void
- Configure **RAM allocation** (512MB to 8GB)
- World **backup** with one tap

### Mod Management
- **Search and install mods directly from Modrinth** (the largest free mod platform)
- Support for Fabric, Forge, Quilt, and NeoForge mods
- Enable / disable mods without deleting them
- One-tap **update** when new versions are available
- Remove mods anytime
- Filter by type: performance, crossplay, visual, gameplay, utility

### Bedrock Crossplay
- Built-in **Geyser + Floodgate** support
- Java and Bedrock players on the **same server**
- Works with: Minecraft PE (mobile), Xbox, PlayStation, Nintendo Switch, Windows 10/11 Edition
- Separate port display for Java (25565) and Bedrock (19132)

### Network & Sharing
- Displays your **WAN (public) IP** for sharing with friends worldwide
- Displays your **LAN IP** for same-WiFi connections
- Copy server address with one tap
- Step-by-step **connection guide** for both Java and Bedrock players

### Game Rules
- Toggle: Keep Inventory, PvP, Mob Spawning, Fire Spread, Mob Griefing, Daylight Cycle
- Set: Difficulty, Default Gamemode, View Distance, Spawn Protection, Tick Speed, Max Players
- All rules apply **instantly via RCON** — no restart needed

### Player Management
- See all online players with ping, game mode, and client type (Java / Bedrock)
- One-tap **Kick, Ban, Op / De-Op**
- AFK detection display

---

## Project Structure

```
craftpanel/
├── CraftPanel-App.jsx       ← React mobile UI (7 tabs)
├── CraftPanel-Backend.js    ← Node.js backend (server control)
├── package.json             ← Backend dependencies
├── SETUP-GUIDE.md           ← Detailed setup instructions
└── README.md                ← You are here
```

---

## Quick Start

### Requirements
- **Java 17+** → https://adoptium.net
- **Node.js 18+** → https://nodejs.org
- A PC, laptop, or VPS to run the backend

### 1. Clone this repo
```bash
git clone https://github.com/YOUR_USERNAME/craftpanel.git
cd craftpanel
```

### 2. Install backend dependencies
```bash
npm install
```

### 3. Start the backend
```bash
npm start
```

You'll see:
```
╔══════════════════════════════════════════╗
║       CraftPanel Backend v1.0            ║
║  Listening on http://localhost:4000      ║
╚══════════════════════════════════════════╝
```

### 4. Open the app on your phone
- Open `CraftPanel-App.jsx` in a React environment (StackBlitz, CodeSandbox, or local React app)
- Or deploy to **Netlify** for free (see below)

### 5. Connect app to backend
- In the app → **Home → Config**
- Enter: `http://YOUR_IP:4000`
- Tap **Connect**

### 6. Start your server
- Pick server type and Minecraft version
- Configure world settings in **World** tab
- Tap **Start** — the backend downloads and launches everything automatically

---

## 📲 Deploy the App (Free)

### Frontend — Netlify
1. Go to https://netlify.com
2. Drag and drop your project folder
3. Get a live URL like `https://craftpanel-abc.netlify.app`
4. Open on your phone → **Share → Add to Home Screen**
5. Installed like a real app!

### Backend — Railway
1. Go to https://railway.app
2. Connect this GitHub repo
3. Set start command: `node CraftPanel-Backend.js`
4. Railway gives you a public URL — use that in the app config

### Backend — Always-on with PM2 (VPS/PC)
```bash
npm install -g pm2
pm2 start CraftPanel-Backend.js --name craftpanel
pm2 startup
pm2 save
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ping` | Health check |
| GET | `/server/status` | Server running state |
| POST | `/server/start` | Start server |
| POST | `/server/stop` | Stop server |
| POST | `/server/restart` | Restart server |
| POST | `/server/command` | Send RCON command |
| POST | `/server/gamerule` | Set a game rule |
| GET | `/server/players` | List online players |
| GET | `/server/logs` | SSE live log stream |
| GET | `/server/logs/snapshot` | Last 300 log lines |
| GET | `/mods` | List installed mods |
| POST | `/mods/install` | Install mod from Modrinth |
| DELETE | `/mods/:name` | Remove a mod |
| POST | `/server/backup` | Backup world folder |

---

## 🌐 Port Reference

| Port | Protocol | Purpose |
|------|----------|---------|
| `4000` | TCP | CraftPanel backend API |
| `25565` | TCP | Minecraft Java Edition |
| `19132` | UDP | Minecraft Bedrock / Geyser crossplay |
| `25575` | TCP | RCON (internal, don't expose) |

---

## 📱 App Tabs

| Tab | What it does |
|-----|-------------|
| **Home** | Server status, performance stats, server type, version, quick actions |
| **World** | World name, seed, type, RAM allocation |
| **Mods** | Modrinth search, install, enable/disable, update, remove |
| **Players** | Online players, kick, ban, op, client type (Java/Bedrock) |
| **Network** | WAN/LAN IP, ports, connection guide for Java and Bedrock |
| **Rules** | All game rules with toggles, dropdowns, and number controls |
| **Console** | Live server logs + command input |

---

## 🔧 Supported Server Types

| Type | Mods Support | Best For |
|------|-------------|---------|
| 🌿 **Vanilla** | None | Pure official experience |
| 🧵 **Fabric** | Fabric mods | Performance & lightweight mods |
| 🔥 **Forge** | Forge mods | Large modpacks |
| 🪡 **Quilt** | Fabric + Quilt | Fabric fork with extras |
| ⚙️ **NeoForge** | NeoForge mods | Modern Forge replacement |

---

## 🎮 Crossplay Support

CraftPanel uses **Geyser** and **Floodgate** to bridge Bedrock and Java:

| Platform | Can Join? |
|----------|-----------|
| Java PC/Mac/Linux | ✅ Yes (native) |
| Windows 10/11 Bedrock | ✅ Yes via Geyser |
| Minecraft PE (Android/iOS) | ✅ Yes via Geyser |
| Xbox / PlayStation / Switch | ✅ Yes via Geyser |

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Backend unreachable" | Check port 4000 is open in router/firewall |
| Server won't start | Run `java -version` — needs Java 17+ |
| Bedrock can't connect | Open port 19132 **UDP** in your router |
| Mods tab empty | Only works with Fabric/Forge, not Vanilla |
| RCON error | Server may still be loading — wait 30s |
| "Can't keep up" in logs | Increase RAM in World tab |
| White screen in app | Check browser console for errors |

---

## 📋 Useful Commands

```
/list                          → show online players
/tps                           → check server tick rate
/save-all                      → save world immediately
/op PlayerName                 → give operator permissions
/deop PlayerName               → remove operator permissions
/ban PlayerName                → ban a player
/kick PlayerName               → kick a player
/gamemode creative PlayerName  → change gamemode
/give PlayerName diamond 64    → give items
/tp PlayerName X Y Z           → teleport player
/gamerule keepInventory true   → set a game rule
/difficulty hard               → change difficulty
/stop                          → safely shut down server
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Credits

- **Minecraft** — Mojang Studios
- **Geyser** — GeyserMC team (https://geysermc.org)
- **Modrinth** — mod search API (https://modrinth.com)
- **Fabric** — FabricMC (https://fabricmc.net)
- **Forge** — MinecraftForge (https://minecraftforge.net)

---

> Built with ⛏️ by the CraftPanel project.
> Star ⭐ this repo if it helped you!
