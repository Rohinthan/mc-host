# mc-host — Full Setup Guide

> Manage your Minecraft server from your phone.
> Vanilla Java · Fabric · Forge · Quilt · NeoForge
> Crossplay (Bedrock + Java) · Modrinth Mods · WAN/LAN sharing

---

## What You Get

| File | What it is |
|---|---|
| `CraftPanel-App.jsx` | React mobile app (the UI on your phone) |
| `CraftPanel-Backend.js` | Node.js server that runs on your PC/VPS |
| `package.json` | Backend dependencies |

---

## Part 1 — Run the Backend (your PC or VPS)

The backend is what actually **downloads, starts, and controls** your Minecraft server.
Your phone app connects to it over the internet.

### Requirements
- A PC, laptop, or VPS (Linux/Windows/Mac)
- **Java 17+** installed → https://adoptium.net
- **Node.js 18+** installed → https://nodejs.org

### Step-by-step

```bash
# 1. Make a folder for mc-host
mkdir craftpanel && cd craftpanel

# 2. Put these files in it:
#    CraftPanel-Backend.js
#    package.json

# 3. Install dependencies
npm install

# 4. Start the backend
npm start
```

You should see:
```
╔══════════════════════════════════════════╗
║       CraftPanel Backend v1.0            ║
║  Listening on http://localhost:4000      ║
╚══════════════════════════════════════════╝
```

---

## Part 2 — Open Your Port (so your phone can reach the backend)

### If running on your HOME PC:

You need to forward ports in your router so your phone can connect from outside WiFi.

| Port | Purpose |
|---|---|
| `4000` | CraftPanel app talks to backend |
| `25565` | Minecraft Java players connect |
| `19132` | Minecraft Bedrock/mobile players (UDP) |

**How to port forward:**
1. Open your router admin page — usually `192.168.1.1` in browser
2. Find "Port Forwarding" or "Virtual Servers"
3. Add entries for ports 4000, 25565, 19132 pointing to your PC's local IP
4. Your local IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) → look for `192.168.x.x`

**Find your public WAN IP:**
- Go to https://whatismyip.com
- This is the IP you share with friends and put in your app

### If running on a VPS (recommended for always-on):

Popular free/cheap options:
- **Oracle Cloud Free Tier** — completely free, 4 cores, 24GB RAM ARM server
- **Hetzner** — €4/month, very fast
- **DigitalOcean** — $6/month

On a VPS, open firewall ports:
```bash
# Ubuntu/Debian
sudo ufw allow 4000
sudo ufw allow 25565
sudo ufw allow 19132/udp

# Or with iptables
sudo iptables -A INPUT -p tcp --dport 4000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 25565 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 19132 -j ACCEPT
```

Your VPS already has a public IP — use that in the app.

---

## Part 3 — Run the App on Your Phone

### Option A: Use it directly in Claude (easiest, no setup)
The app already runs in the Claude artifact panel.
Tap the **expand icon** (⤢) to go fullscreen on mobile.

### Option B: Host it as a PWA (install to home screen like a real app)

**Using Netlify (free, takes ~5 min):**

1. Go to https://stackblitz.com/fork/react
2. Delete the default `App.jsx` content and paste in `CraftPanel-App.jsx`
3. Click **Share → Download** or connect to GitHub
4. Go to https://netlify.com → "Add new site" → drag your project folder
5. Netlify gives you a URL like `https://craftpanel-abc123.netlify.app`
6. Open that URL on your phone
7. Tap **Share → Add to Home Screen** (iPhone) or **Install App** (Android)
8. Done — it's on your home screen like a real app!

### Option C: Full React project on your PC

```bash
npx create-react-app craftpanel-app
cd craftpanel-app
# Replace src/App.js with CraftPanel-App.jsx content
npm start
# Opens in browser at localhost:3000
```

---

## Part 4 — Connect App to Backend

1. Open CraftPanel on your phone
2. Tap **Home** tab
3. Tap **Config** button (top right of the demo/live banner)
4. Enter your backend URL:
   - Home PC: `http://YOUR_WAN_IP:4000`
   - VPS: `http://YOUR_VPS_IP:4000`
   - Same WiFi only: `http://192.168.1.42:4000`
5. Tap **Connect** — you should see "LIVE" badge appear

---

## Part 5 — Start Your First Server

1. Go to **Home** tab in the app
2. Pick **Server Type**: Vanilla / Fabric / Forge / Quilt
3. Pick **Minecraft Version** (e.g. 1.21.1)
4. Go to **World** tab — set world name, type, seed, RAM
5. Toggle **Bedrock Crossplay** on if you want mobile/console friends
6. Tap **Start** in the header

The backend will:
- Automatically download the server JAR from Mojang
- Accept the EULA
- Write `server.properties`
- Start the Java process
- Stream logs to your app's Console tab in real time

First start may take 1-2 minutes (downloading files).

---

## Part 6 — Install Mods (Fabric/Forge only)

1. Go to **Mods** tab
2. Search any mod name in the **Modrinth** search box
3. Tap **Install** — the backend downloads the `.jar` directly into your mods folder
4. Restart the server

**Crossplay mods (auto-included in demo):**
- **Geyser** — bridges Bedrock ↔ Java
- **Floodgate** — lets Bedrock players join without Java account

---

## Part 7 — Share with Friends

Go to **Network** tab in the app:

- **WAN address** — share this with anyone worldwide
- **LAN address** — share this with people on your WiFi
- **Bedrock port** — for mobile/console players

**Java friends:** Add server → `YOUR_IP:25565`
**Bedrock/mobile friends:** Servers tab → Add → address: `YOUR_IP`, port: `19132`

---

## Geyser Crossplay Setup (manual)

If you want full crossplay, install Geyser as a mod (Fabric) or plugin:

1. Download from https://geysermc.org/download
2. Place in `mods/` folder (Fabric) or `plugins/` (Spigot/Paper — not vanilla)
3. Also download **Floodgate** and place in same folder
4. Restart server
5. Bedrock players connect to port `19132`

For **vanilla Java server**, Geyser runs as a standalone proxy:
```bash
java -jar Geyser-Standalone.jar
# Edit config.yml: set remote.address to your server IP
```

---

## Game Rules (in-app)

Go to **Rules** tab to toggle:
- Keep Inventory, PvP, Mob Spawning, Fire Spread, Mob Griefing
- Difficulty, Game Mode, View Distance
- Tick speed, Spawn radius, Max players

All changes are sent as `/gamerule` commands via RCON in real time.

---

## Keeping Server Running 24/7 (VPS)

```bash
# Install pm2 process manager
npm install -g pm2

# Start backend with pm2
pm2 start CraftPanel-Backend.js --name craftpanel

# Auto-start on reboot
pm2 startup
pm2 save
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Backend unreachable" | Check port 4000 is open in firewall/router |
| Server won't start | Make sure Java 17+ is installed: `java -version` |
| Bedrock can't connect | Open port 19132 **UDP** in router/firewall |
| Mods not loading | Only works with Fabric/Forge, not Vanilla |
| RCON error | Server may still be starting — wait 30s and retry |
| "Can't keep up" in logs | Increase RAM allocation in World tab |

---

## File Structure (after first run)

```
craftpanel/
├── CraftPanel-Backend.js
├── package.json
└── craftpanel_data/
    ├── servers/
    │   └── fabric-1.21.1/
    │       ├── server.jar
    │       ├── server.properties
    │       ├── eula.txt
    │       ├── world/
    │       └── mods/
    │           ├── sodium-0.5.11.jar
    │           ├── geyser-2.4.2.jar
    │           └── ...
    └── backups/
        └── world_1718123456789/
```

---

## Quick Command Reference

```
/list          — show online players
/tps           — server tick rate
/save-all      — save world now
/gamemode creative PlayerName
/give PlayerName minecraft:diamond 64
/tp PlayerName X Y Z
/ban PlayerName
/op PlayerName
/gamerule keepInventory true
/difficulty hard
/stop          — graceful shutdown
```

---

Made with mc-host
