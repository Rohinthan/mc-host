import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:     "#08090d",
  surf:   "#10141c",
  card:   "#171d28",
  card2:  "#1e2535",
  bdr:    "#232d3f",
  bdr2:   "#2c3a52",
  green:  "#22c55e",
  cyan:   "#38bdf8",
  purple: "#a78bfa",
  amber:  "#fbbf24",
  red:    "#f87171",
  orange: "#fb923c",
  pink:   "#f472b6",
  muted:  "#3d4f63",
  sub:    "#6b7e96",
  text:   "#dce8f5",
  white:  "#f1f5f9",
};

// ─── BACKEND CONFIG ──────────────────────────────────────────────────────────
// Change this to your server's IP when running the backend
const API = "http://localhost:4000";

// ─── INITIAL MOCK STATE ──────────────────────────────────────────────────────
const MOCK_PLAYERS = [
  { name:"Steve_Builder", client:"java",    status:"online", ping:42,  gm:"survival",  op:true,  joined:"2m"  },
  { name:"Alex_Miner",   client:"java",    status:"online", ping:77,  gm:"creative",  op:false, joined:"14m" },
  { name:"BedrockKid",   client:"bedrock", status:"online", ping:120, gm:"survival",  op:false, joined:"31m" },
  { name:"NightWalker",  client:"java",    status:"afk",    ping:198, gm:"survival",  op:false, joined:"2h"  },
];

const INIT_MODS = [
  { id:1, name:"Sodium",       type:"performance", loader:"fabric", ver:"0.5.11", latest:"0.5.11", enabled:true,  size:"0.8 MB", desc:"Rendering engine rewrite",       modrinthId:"AANobbMI" },
  { id:2, name:"Lithium",      type:"performance", loader:"fabric", ver:"0.12.7", latest:"0.12.7", enabled:true,  size:"0.6 MB", desc:"General game logic optimization", modrinthId:"gvQqBUqZ" },
  { id:3, name:"Geyser",       type:"crossplay",   loader:"fabric", ver:"2.4.2",  latest:"2.4.3",  enabled:true,  size:"21.3MB", desc:"Bedrock↔Java crossplay bridge",   modrinthId:"wKkoqHrH" },
  { id:4, name:"Floodgate",    type:"crossplay",   loader:"fabric", ver:"2.2.3",  latest:"2.2.3",  enabled:true,  size:"1.1 MB", desc:"Bedrock auth on Java server",     modrinthId:"bWrNNfkb" },
  { id:5, name:"Iris Shaders", type:"visual",      loader:"fabric", ver:"1.7.5",  latest:"1.8.0",  enabled:false, size:"3.2 MB", desc:"Shader pipeline support",         modrinthId:"YL57xq9U" },
  { id:6, name:"Origins",      type:"gameplay",    loader:"fabric", ver:"1.11.0", latest:"1.11.0", enabled:true,  size:"1.8 MB", desc:"Player origin abilities",         modrinthId:"oo6UKjMQ" },
];

const GAME_RULES = [
  { rule:"keepInventory",    type:"bool",   val:false, desc:"Keep items on death" },
  { rule:"doDaylightCycle",  type:"bool",   val:true,  desc:"Enable day/night cycle" },
  { rule:"doMobSpawning",    type:"bool",   val:true,  desc:"Mobs spawn naturally" },
  { rule:"doFireTick",       type:"bool",   val:true,  desc:"Fire spreads and burns" },
  { rule:"mobGriefing",      type:"bool",   val:true,  desc:"Mobs can destroy blocks" },
  { rule:"pvp",              type:"bool",   val:true,  desc:"Player vs Player damage" },
  { rule:"difficulty",       type:"select", val:"normal", opts:["peaceful","easy","normal","hard"], desc:"World difficulty" },
  { rule:"gamemode",         type:"select", val:"survival", opts:["survival","creative","adventure","spectator"], desc:"Default game mode" },
  { rule:"randomTickSpeed",  type:"number", val:3,     min:0, max:100, desc:"Crop/leaf/fire tick speed" },
  { rule:"maxPlayers",       type:"number", val:20,    min:1, max:100, desc:"Max simultaneous players" },
  { rule:"spawnRadius",      type:"number", val:10,    min:0, max:100, desc:"Spawn protection radius" },
  { rule:"viewDistance",     type:"number", val:10,    min:2, max:32,  desc:"Chunk view distance" },
];

const WORLD_TEMPLATES = [
  { id:"default",    icon:"🌍", name:"Default",     desc:"Standard overworld generation" },
  { id:"flat",       icon:"🟫", name:"Superflat",   desc:"Completely flat world" },
  { id:"amplified",  icon:"🏔", name:"Amplified",   desc:"Extreme terrain height" },
  { id:"large_biomes",icon:"🌲",name:"Large Biomes",desc:"Massive biome areas" },
  { id:"void",       icon:"🌌", name:"Void",        desc:"Empty void world" },
];

const LOADERS = [
  { id:"vanilla", icon:"🌿", label:"Vanilla",  color:T.green,  desc:"Official Mojang" },
  { id:"fabric",  icon:"🧵", label:"Fabric",   color:T.cyan,   desc:"Lightweight mods" },
  { id:"forge",   icon:"🔥", label:"Forge",    color:T.orange, desc:"Heavy modding" },
  { id:"quilt",   icon:"🪡", label:"Quilt",    color:T.purple, desc:"Fabric fork" },
  { id:"neoforge",icon:"⚙️", label:"NeoForge", color:T.amber,  desc:"Modern Forge" },
];

const MC_VERSIONS = ["1.21.1","1.21","1.20.6","1.20.4","1.20.1","1.19.4","1.18.2","1.17.1","1.16.5","1.12.2","1.8.9"];

const TABS = [
  { id:"home",    icon:"⊞",  label:"Home"    },
  { id:"world",   icon:"🌍", label:"World"   },
  { id:"mods",    icon:"🧩", label:"Mods"    },
  { id:"players", icon:"♟",  label:"Players" },
  { id:"network", icon:"📡", label:"Network" },
  { id:"rules",   icon:"⚖️", label:"Rules"   },
  { id:"console", icon:"▶",  label:"Console" },
];

// ─── TINY UI ──────────────────────────────────────────────────────────────────
const Dot = ({ s }) => {
  const c = s==="online"?T.green:s==="afk"?T.amber:T.red;
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:c,boxShadow:`0 0 5px ${c}`,marginRight:5,flexShrink:0}}/>;
};

const Tag = ({ children, color=T.cyan, small }) => (
  <span style={{background:color+"1a",color,border:`1px solid ${color}30`,borderRadius:5,fontSize:small?9:10,padding:small?"1px 5px":"2px 7px",fontWeight:700,letterSpacing:.3,whiteSpace:"nowrap"}}>
    {children}
  </span>
);

const Card = ({ children, style, accent }) => (
  <div style={{background:T.card,border:`1px solid ${accent?accent+"44":T.bdr}`,borderRadius:14,padding:14,marginBottom:10,...style}}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{fontSize:10,fontWeight:700,color:T.sub,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>{children}</div>
);

const Pill = ({ children, active, color=T.cyan, onClick }) => (
  <button onClick={onClick} style={{background:active?color+"22":T.card,border:`1px solid ${active?color+"55":T.bdr}`,color:active?color:T.sub,borderRadius:99,padding:"5px 13px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
    {children}
  </button>
);

const IconBtn = ({ icon, label, color=T.cyan, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{background:T.card2,border:`1px solid ${T.bdr}`,color:T.sub,borderRadius:11,padding:"11px 6px",fontSize:11,cursor:disabled?"not-allowed":"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontWeight:600,opacity:disabled?.4:1}}>
    <span style={{fontSize:20}}>{icon}</span>{label}
  </button>
);

const ProgressBar = ({ pct, color, height=5 }) => (
  <div style={{background:T.bdr,borderRadius:99,height,overflow:"hidden"}}>
    <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .8s ease"}}/>
  </div>
);

const Toggle = ({ val, onChange, color=T.green }) => (
  <button onClick={()=>onChange(!val)} style={{width:42,height:24,borderRadius:99,background:val?color:T.muted,border:"none",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
    <div style={{position:"absolute",top:3,left:val?20:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left .2s"}}/>
  </button>
);

function MetricRow({ label, value, pct, color }) {
  return (
    <div style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
        <span>{label}</span>
        <span style={{color,fontWeight:700,fontFamily:"monospace"}}>{value}</span>
      </div>
      <ProgressBar pct={pct} color={color}/>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:toast.color+"22",border:`1px solid ${toast.color}55`,color:toast.color,borderRadius:99,padding:"9px 22px",fontSize:12,fontWeight:700,zIndex:9999,backdropFilter:"blur(10px)",whiteSpace:"nowrap",pointerEvents:"none"}}>
      {toast.msg}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]             = useState("home");
  const [serverOn,setServerOn]   = useState(false);
  const [loader,setLoader]       = useState("fabric");
  const [mcVer,setMcVer]         = useState("1.21.1");
  const [players,setPlayers]     = useState(MOCK_PLAYERS);
  const [mods,setMods]           = useState(INIT_MODS);
  const [rules,setRules]         = useState(GAME_RULES);
  const [log,setLog]             = useState(["[CraftPanel] Ready. Configure and start your server."]);
  const [cmd,setCmd]             = useState("");
  const [toast,setToast]         = useState(null);
  const [selPlayer,setSelPlayer] = useState(null);
  const [modFilter,setModFilter] = useState("all");
  const [crossplay,setCrossplay] = useState(true);
  const [uptime,setUptime]       = useState(0);
  const [tps,setTps]             = useState(20);
  const [ram,setRam]             = useState({used:512,total:2048});
  const [cpu,setCpu]             = useState(12);
  const [worldName,setWorldName] = useState("My World");
  const [worldTemplate,setWorldTemplate] = useState("default");
  const [seed,setSeed]           = useState("");
  const [wanIp]                  = useState("203.0.113.77");
  const [lanIp]                  = useState("192.168.1.42");
  const [javaPort]               = useState(25565);
  const [bedrockPort]            = useState(19132);
  const [searchMod,setSearchMod] = useState("");
  const [modrinthResults,setModrinthResults] = useState([]);
  const [searching,setSearching] = useState(false);
  const [ramAlloc,setRamAlloc]   = useState(2048);
  const [backendMode,setBackendMode] = useState(false); // true = real backend
  const [apiUrl,setApiUrl]       = useState(API);
  const [showApiConfig,setShowApiConfig] = useState(false);
  const logRef = useRef();

  // Live metrics
  useEffect(()=>{
    if (!serverOn) return;
    const t = setInterval(()=>{
      setTps(v=>+Math.max(14,Math.min(20,v+(Math.random()-.5)*.4)).toFixed(1));
      setRam(v=>({...v,used:Math.max(400,Math.min(v.total-100,v.used+Math.round((Math.random()-.48)*25)))}));
      setCpu(v=>Math.max(5,Math.min(95,v+Math.round((Math.random()-.5)*7))));
      setUptime(v=>v+1);
    },1000);
    return ()=>clearInterval(t);
  },[serverOn]);

  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; },[log,tab]);

  const toast_ = (msg,color=T.green)=>{ setToast({msg,color}); setTimeout(()=>setToast(null),2500); };
  const addLog  = useCallback((line)=>setLog(l=>[...l,`[${new Date().toLocaleTimeString("en",{hour12:false})}] ${line}`]),[]);
  const fmt     = s=>{ const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return `${h}h ${m}m ${sec}s`; };

  // ── API helpers ──
  const apiCall = async (path,method="GET",body)=>{
    if (!backendMode) return null;
    try {
      const r = await fetch(apiUrl+path,{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
      return await r.json();
    } catch(e) { toast_("Backend unreachable",T.red); return null; }
  };

  // ── Server control ──
  const startServer = async ()=>{
    addLog(`[Server] Starting ${loader} ${mcVer} — RAM: ${ramAlloc}MB...`);
    if (crossplay) addLog("[Geyser] Bedrock crossplay loading on port "+bedrockPort);
    const r = await apiCall("/server/start","POST",{loader,mcVer,ram:ramAlloc,crossplay,worldName,worldTemplate,seed});
    if (r?.ok || !backendMode) {
      setServerOn(true);
      setTimeout(()=>{ addLog(`[Server] Done! Listening on :${javaPort}`); if(crossplay) addLog(`[Geyser] Bedrock on :${bedrockPort}`); },900);
      toast_("Server started!",T.green);
    }
  };

  const stopServer = async ()=>{
    const r = await apiCall("/server/stop","POST");
    if (r?.ok || !backendMode) {
      setServerOn(false);
      addLog("[Server] Server stopped.");
      toast_("Server stopped",T.red);
    }
  };

  // ── Console command ──
  const sendCmd = async ()=>{
    if (!cmd.trim()) return;
    addLog(`[CMD] /${cmd}`);
    await apiCall("/server/command","POST",{command:cmd});
    setCmd("");
    toast_("Sent",T.cyan);
  };

  // ── Modrinth search ──
  const searchModrinth = async ()=>{
    if (!searchMod.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(searchMod)}&facets=[["project_type:mod"]]&limit=10`);
      const data = await res.json();
      setModrinthResults(data.hits||[]);
    } catch { toast_("Search failed",T.red); }
    setSearching(false);
  };

  const installMod = (hit)=>{
    const exists = mods.find(m=>m.modrinthId===hit.project_id||m.name===hit.title);
    if (exists) { toast_("Already installed",T.amber); return; }
    const newMod = {
      id: Date.now(), name: hit.title, type:"gameplay", loader,
      ver:hit.latest_version||"?", latest:hit.latest_version||"?",
      enabled:true, size:"?", desc:hit.description?.slice(0,60)||"",
      modrinthId:hit.project_id,
    };
    setMods(m=>[...m,newMod]);
    addLog(`[Mods] Installed ${hit.title} from Modrinth`);
    toast_(`Installed ${hit.title}`,T.green);
  };

  // ── Rule update ──
  const updateRule = async (rule,val)=>{
    setRules(rs=>rs.map(r=>r.rule===rule?{...r,val}:r));
    await apiCall("/server/gamerule","POST",{rule,val});
    addLog(`[Rule] ${rule} = ${val}`);
    toast_(`${rule} → ${val}`,T.cyan);
  };

  // ── Kick/Ban/Op ──
  const kickPlayer = async (name)=>{
    await apiCall("/server/command","POST",{command:`kick ${name}`});
    setPlayers(p=>p.filter(x=>x.name!==name));
    addLog(`[CMD] Kicked ${name}`);
    setSelPlayer(null);
    toast_(`Kicked ${name}`,T.amber);
  };
  const banPlayer = async (name)=>{
    await apiCall("/server/command","POST",{command:`ban ${name}`});
    setPlayers(p=>p.filter(x=>x.name!==name));
    addLog(`[CMD] Banned ${name}`);
    setSelPlayer(null);
    toast_(`Banned ${name}`,T.red);
  };
  const opPlayer = async (name,isOp)=>{
    await apiCall("/server/command","POST",{command:`${isOp?"deop":"op"} ${name}`});
    setPlayers(p=>p.map(x=>x.name===name?{...x,op:!x.op}:x));
    setSelPlayer(null);
    toast_(`${isOp?"De-opped":"Opped"} ${name}`,T.amber);
  };

  const ramPct  = (ram.used/ram.total)*100;
  const ramCol  = ramPct<60?T.green:ramPct<80?T.amber:T.red;
  const tpsCol  = tps>=18?T.green:tps>=14?T.amber:T.red;
  const cpuCol  = cpu<60?T.green:cpu<80?T.amber:T.red;
  const curLoader = LOADERS.find(l=>l.id===loader);
  const onlinePlayers = players.filter(p=>p.status==="online");

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.text,fontFamily:"'Inter',system-ui,sans-serif",maxWidth:480,margin:"0 auto",paddingBottom:75}}>
      <Toast toast={toast}/>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{background:T.surf,borderBottom:`1px solid ${T.bdr}`,padding:"13px 16px 11px",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>⛏️</span>
            <div>
              <div style={{fontWeight:800,fontSize:15,letterSpacing:-.4}}>CraftPanel</div>
              <div style={{fontSize:10,color:T.muted,display:"flex",gap:5,alignItems:"center"}}>
                <span style={{background:curLoader?.color+"22",color:curLoader?.color,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>{curLoader?.icon} {curLoader?.label}</span>
                <span>{mcVer}</span>
                {backendMode && <span style={{background:T.green+"22",color:T.green,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700}}>⚡ LIVE</span>}
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Dot s={serverOn?"online":"offline"}/>
            <span style={{fontSize:11,fontWeight:700,color:serverOn?T.green:T.red}}>{serverOn?"ONLINE":"OFFLINE"}</span>
            <button onClick={serverOn?stopServer:startServer} style={{background:serverOn?T.red+"1a":T.green+"1a",border:`1px solid ${serverOn?T.red:T.green}44`,color:serverOn?T.red:T.green,borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              {serverOn?"Stop":"Start"}
            </button>
          </div>
        </div>
      </div>

      <div style={{padding:"12px 13px 0"}}>

        {/* ══ HOME ════════════════════════════════════════════════════════════ */}
        {tab==="home" && <>
          {/* Backend config banner */}
          <div style={{background:backendMode?T.green+"14":T.amber+"14",border:`1px solid ${backendMode?T.green+"44":T.amber+"44"}`,borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:backendMode?T.green:T.amber}}>
                {backendMode?"⚡ Live Backend":"🎮 Demo Mode"}
              </div>
              <div style={{fontSize:10,color:T.sub,marginTop:1}}>
                {backendMode?`Connected: ${apiUrl}`:"Using simulated data"}
              </div>
            </div>
            <button onClick={()=>setShowApiConfig(v=>!v)} style={{background:T.card2,border:`1px solid ${T.bdr}`,color:T.sub,borderRadius:7,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>
              Config
            </button>
          </div>

          {showApiConfig && (
            <Card style={{marginBottom:10}}>
              <SectionLabel>Backend URL</SectionLabel>
              <input value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="http://YOUR_SERVER_IP:4000" style={{width:"100%",background:T.bg,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:8,padding:"9px 12px",fontSize:12,boxSizing:"border-box",marginBottom:8,fontFamily:"monospace"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{ const r=await fetch(apiUrl+"/ping").catch(()=>null); if(r?.ok){setBackendMode(true);toast_("Connected!",T.green);}else{toast_("Cannot reach backend",T.red);} }} style={{flex:1,background:T.green+"18",border:`1px solid ${T.green}33`,color:T.green,borderRadius:8,padding:"8px",fontSize:12,cursor:"pointer",fontWeight:700}}>Connect</button>
                <button onClick={()=>{setBackendMode(false);setShowApiConfig(false);}} style={{flex:1,background:T.card2,border:`1px solid ${T.bdr}`,color:T.sub,borderRadius:8,padding:"8px",fontSize:12,cursor:"pointer",fontWeight:700}}>Demo Mode</button>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
            {[
              {label:"Players",value:serverOn?`${onlinePlayers.length}/${players.length}`:"—",icon:"♟",color:T.cyan},
              {label:"TPS",    value:serverOn?tps:"—",                                       icon:"⚡",color:tpsCol},
              {label:"Uptime", value:serverOn?fmt(uptime):"—",                               icon:"⏱",color:T.purple,small:true},
            ].map(s=>(
              <div key={s.label} style={{background:T.card,border:`1px solid ${T.bdr}`,borderRadius:12,padding:"11px 8px",textAlign:"center"}}>
                <div style={{fontSize:17,marginBottom:3}}>{s.icon}</div>
                <div style={{fontWeight:800,fontSize:s.small?12:17,color:s.color,fontFamily:"monospace",lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:9,color:T.muted,marginTop:3}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Performance */}
          <Card>
            <SectionLabel>Performance</SectionLabel>
            {serverOn ? <>
              <MetricRow label="RAM" value={`${ram.used}/${ram.total} MB`} pct={ramPct} color={ramCol}/>
              <MetricRow label="CPU" value={`${cpu}%`} pct={cpu} color={cpuCol}/>
              <MetricRow label="TPS" value={`${tps}/20`} pct={(tps/20)*100} color={tpsCol}/>
            </> : <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:"10px 0"}}>Start server to see live stats</div>}
          </Card>

          {/* Loader */}
          <Card>
            <SectionLabel>Server Type {serverOn&&<span style={{color:T.amber}}>(stop to change)</span>}</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {LOADERS.map(l=>(
                <button key={l.id} onClick={()=>{if(!serverOn){setLoader(l.id);toast_(`Switched to ${l.label}`,l.color);}}} style={{background:loader===l.id?l.color+"22":T.bg,border:`1.5px solid ${loader===l.id?l.color:T.bdr}`,borderRadius:10,padding:"9px 8px",cursor:serverOn?"not-allowed":"pointer",opacity:serverOn?.5:1,textAlign:"left"}}>
                  <div style={{fontSize:15,marginBottom:2}}>{l.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:loader===l.id?l.color:T.text}}>{l.label}</div>
                  <div style={{fontSize:10,color:T.muted}}>{l.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* MC Version */}
          <Card>
            <SectionLabel>Minecraft Version</SectionLabel>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              {MC_VERSIONS.map(v=>(
                <Pill key={v} active={mcVer===v} onClick={()=>{if(!serverOn){setMcVer(v);toast_(`Version → ${v}`,T.cyan);}}} color={T.cyan}>{v}</Pill>
              ))}
            </div>
          </Card>

          {/* Crossplay */}
          <div style={{background:crossplay?T.cyan+"14":T.card,border:`1px solid ${crossplay?T.cyan+"44":T.bdr}`,borderRadius:14,padding:14,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:crossplay?T.cyan:T.sub}}>📱 Bedrock Crossplay</div>
              <div style={{fontSize:10,color:T.muted,marginTop:1}}>via Geyser + Floodgate · port {bedrockPort}</div>
              {crossplay&&<div style={{fontSize:10,color:T.cyan,marginTop:2}}>🟢 {players.filter(p=>p.client==="bedrock").length} Bedrock online</div>}
            </div>
            <Toggle val={crossplay} onChange={v=>{setCrossplay(v);toast_(v?"Crossplay on":"Crossplay off",v?T.cyan:T.red);}} color={T.cyan}/>
          </div>

          {/* Quick actions */}
          <Card>
            <SectionLabel>Quick Actions</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
              <IconBtn icon="💾" label="Save" onClick={()=>{addLog("[CMD] World saved");toast_("Saved");}}/>
              <IconBtn icon="📢" label="Broadcast" onClick={()=>{addLog("[BROADCAST] Message sent");toast_("Sent");}}/>
              <IconBtn icon="🔄" label="Reload" onClick={()=>{addLog("[Mods] Reloading...");toast_("Reloaded",T.amber);}}/>
              <IconBtn icon="🗂️" label="Backup" onClick={()=>{addLog("[Server] Backup started");toast_("Backup started",T.purple);}}/>
            </div>
          </Card>
        </>}

        {/* ══ WORLD ═══════════════════════════════════════════════════════════ */}
        {tab==="world" && <>
          <Card>
            <SectionLabel>World Name</SectionLabel>
            <input value={worldName} onChange={e=>setWorldName(e.target.value)} disabled={serverOn} style={{width:"100%",background:T.bg,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:8,padding:"10px 12px",fontSize:13,boxSizing:"border-box",opacity:serverOn?.5:1}}/>
          </Card>

          <Card>
            <SectionLabel>Seed (optional)</SectionLabel>
            <input value={seed} onChange={e=>setSeed(e.target.value)} disabled={serverOn} placeholder="Leave empty for random" style={{width:"100%",background:T.bg,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:8,padding:"10px 12px",fontSize:13,boxSizing:"border-box",opacity:serverOn?.5:1}}/>
          </Card>

          <Card>
            <SectionLabel>World Type</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {WORLD_TEMPLATES.map(w=>(
                <button key={w.id} onClick={()=>{if(!serverOn){setWorldTemplate(w.id);toast_(w.name,T.green);}}} style={{background:worldTemplate===w.id?T.green+"22":T.bg,border:`1.5px solid ${worldTemplate===w.id?T.green:T.bdr}`,borderRadius:10,padding:"10px 8px",cursor:serverOn?"not-allowed":"pointer",opacity:serverOn?.5:1,textAlign:"left"}}>
                  <div style={{fontSize:18,marginBottom:3}}>{w.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:worldTemplate===w.id?T.green:T.text}}>{w.name}</div>
                  <div style={{fontSize:10,color:T.muted}}>{w.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>RAM Allocation</SectionLabel>
            <div style={{display:"flex",gap:7,marginBottom:8}}>
              {[512,1024,2048,4096,8192].map(mb=>(
                <button key={mb} onClick={()=>{if(!serverOn){setRamAlloc(mb);toast_(`RAM → ${mb>=1024?mb/1024+"G":mb+"M"}`,T.cyan);}}} style={{flex:1,background:ramAlloc===mb?T.cyan+"22":T.bg,border:`1px solid ${ramAlloc===mb?T.cyan+"55":T.bdr}`,color:ramAlloc===mb?T.cyan:T.muted,borderRadius:8,padding:"7px 0",fontSize:10,fontWeight:700,cursor:serverOn?"not-allowed":"pointer",opacity:serverOn?.4:1}}>
                  {mb>=1024?mb/1024+"G":mb+"M"}
                </button>
              ))}
            </div>
            <MetricRow label="In use" value={`${ram.used} MB`} pct={ramPct} color={ramCol}/>
          </Card>

          {serverOn && (
            <div style={{background:T.amber+"14",border:`1px solid ${T.amber}44`,borderRadius:10,padding:"10px 14px",fontSize:11,color:T.amber,textAlign:"center"}}>
              ⚠️ Stop the server to change world settings
            </div>
          )}
        </>}

        {/* ══ MODS ════════════════════════════════════════════════════════════ */}
        {tab==="mods" && <>
          {/* Modrinth search */}
          <Card accent={T.green}>
            <SectionLabel>🟢 Search Modrinth</SectionLabel>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input value={searchMod} onChange={e=>setSearchMod(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchModrinth()} placeholder="Search mods, plugins..." style={{flex:1,background:T.bg,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:8,padding:"9px 12px",fontSize:12}}/>
              <button onClick={searchModrinth} style={{background:T.green+"22",border:`1px solid ${T.green}44`,color:T.green,borderRadius:8,padding:"0 14px",fontSize:13,cursor:"pointer",fontWeight:700}}>
                {searching?"...":"Search"}
              </button>
            </div>

            {modrinthResults.map(h=>(
              <div key={h.project_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderTop:`1px solid ${T.bdr}`}}>
                <div style={{flex:1,minWidth:0,marginRight:8}}>
                  <div style={{fontWeight:700,fontSize:12,color:T.text}}>{h.title}</div>
                  <div style={{fontSize:10,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.description}</div>
                  <div style={{fontSize:9,color:T.sub,marginTop:2}}>⬇ {(h.downloads/1000).toFixed(0)}k · {h.categories?.slice(0,2).join(", ")}</div>
                </div>
                <button onClick={()=>installMod(h)} style={{background:T.green+"22",border:`1px solid ${T.green}33`,color:T.green,borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:700,flexShrink:0}}>Install</button>
              </div>
            ))}
          </Card>

          {/* Filter */}
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:10}}>
            {["all","performance","crossplay","visual","gameplay","utility"].map(f=>(
              <Pill key={f} active={modFilter===f} onClick={()=>setModFilter(f)} color={T.cyan}>{f}</Pill>
            ))}
          </div>

          <div style={{fontSize:10,color:T.muted,marginBottom:8}}>
            {mods.filter(m=>modFilter==="all"||m.type===modFilter).length} mods installed
          </div>

          {mods.filter(m=>modFilter==="all"||m.type===modFilter).map(m=>{
            const hasUpdate = m.ver!==m.latest;
            const typeColors={performance:T.green,crossplay:T.cyan,visual:T.purple,gameplay:T.orange,utility:T.amber};
            const tc = typeColors[m.type]||T.cyan;
            const lc = m.loader==="fabric"?T.cyan:m.loader==="forge"?T.orange:T.purple;
            return (
              <Card key={m.id} accent={hasUpdate?T.amber:undefined}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:13}}>{m.name}</span>
                      <Tag color={tc} small>{m.type}</Tag>
                      <Tag color={lc} small>{m.loader==="fabric"?"🧵":m.loader==="forge"?"🔥":"🪡"} {m.loader}</Tag>
                    </div>
                    <div style={{fontSize:10,color:T.muted}}>{m.desc}</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:2}}>v{m.ver} · {m.size}</div>
                    {hasUpdate&&<div style={{fontSize:10,color:T.amber,marginTop:2}}>↑ v{m.latest} available</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
                    {hasUpdate&&<button onClick={()=>{setMods(ms=>ms.map(x=>x.id===m.id?{...x,ver:x.latest}:x));toast_(`Updated ${m.name}`,T.green);}} style={{background:T.amber+"18",border:`1px solid ${T.amber}33`,color:T.amber,borderRadius:6,padding:"3px 9px",fontSize:10,cursor:"pointer",fontWeight:700}}>Update</button>}
                    <Toggle val={m.enabled} onChange={v=>{setMods(ms=>ms.map(x=>x.id===m.id?{...x,enabled:v}:x));toast_(v?`Enabled ${m.name}`:`Disabled ${m.name}`);}} color={T.green}/>
                    <button onClick={()=>{setMods(ms=>ms.filter(x=>x.id!==m.id));toast_(`Removed ${m.name}`,T.red);}} style={{background:"transparent",border:"none",color:T.muted,fontSize:10,cursor:"pointer",padding:"2px 4px"}}>✕ Remove</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </>}

        {/* ══ PLAYERS ══════════════════════════════════════════════════════════ */}
        {tab==="players" && <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:T.muted,fontWeight:700}}>{onlinePlayers.length} ONLINE · {players.length} TOTAL</div>
            <div style={{display:"flex",gap:6}}>
              <Tag color={T.cyan}>☕ Java: {players.filter(p=>p.client==="java").length}</Tag>
              <Tag color={T.orange}>📱 Bedrock: {players.filter(p=>p.client==="bedrock").length}</Tag>
            </div>
          </div>

          {players.map(p=>(
            <Card key={p.name} accent={selPlayer?.name===p.name?T.cyan:undefined} style={{cursor:"pointer"}} onClick={()=>setSelPlayer(selPlayer?.name===p.name?null:p)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,background:T.bg,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${T.bdr}`,flexShrink:0}}>
                    {p.client==="bedrock"?"📱":"💻"}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                      <Dot s={p.status}/>{p.name}
                      {p.op&&<Tag color={T.amber} small>OP</Tag>}
                    </div>
                    <div style={{fontSize:10,color:T.muted,marginTop:2}}>
                      {p.client==="bedrock"?"📱 Bedrock":"☕ Java"} · {p.ping}ms · {p.gm} · {p.joined} ago
                    </div>
                  </div>
                </div>
                <Tag color={p.status==="online"?T.green:T.amber}>{p.status}</Tag>
              </div>

              {selPlayer?.name===p.name&&(
                <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                  <button onClick={()=>kickPlayer(p.name)} style={{background:T.amber+"18",border:`1px solid ${T.amber}33`,color:T.amber,borderRadius:8,padding:"8px 0",fontSize:11,cursor:"pointer",fontWeight:700}}>⚡ Kick</button>
                  <button onClick={()=>banPlayer(p.name)}  style={{background:T.red+"18",border:`1px solid ${T.red}33`,color:T.red,borderRadius:8,padding:"8px 0",fontSize:11,cursor:"pointer",fontWeight:700}}>🔨 Ban</button>
                  <button onClick={()=>opPlayer(p.name,p.op)} style={{background:T.amber+"18",border:`1px solid ${T.amber}33`,color:T.amber,borderRadius:8,padding:"8px 0",fontSize:11,cursor:"pointer",fontWeight:700}}>⭐ {p.op?"De-Op":"Op"}</button>
                </div>
              )}
            </Card>
          ))}

          {players.length===0&&(
            <div style={{textAlign:"center",color:T.muted,padding:"50px 0"}}>
              <div style={{fontSize:40,marginBottom:8}}>👤</div>No players online
            </div>
          )}
        </>}

        {/* ══ NETWORK ══════════════════════════════════════════════════════════ */}
        {tab==="network" && <>
          {/* WAN */}
          <Card accent={T.cyan}>
            <SectionLabel>🌐 WAN — Share with friends worldwide</SectionLabel>
            <div style={{background:T.bg,borderRadius:10,padding:"11px 13px",fontFamily:"monospace",fontSize:14,color:T.cyan,border:`1px solid ${T.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span>{wanIp}:{javaPort}</span>
              <button onClick={()=>toast_("Copied!",T.cyan)} style={{background:T.cyan+"22",border:"none",color:T.cyan,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:700}}>COPY</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1,background:T.bg,borderRadius:9,padding:"9px 12px",border:`1px solid ${T.bdr}`}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:2}}>☕ Java Port</div>
                <div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:T.cyan}}>{javaPort}</div>
              </div>
              <div style={{flex:1,background:T.bg,borderRadius:9,padding:"9px 12px",border:`1px solid ${crossplay?T.orange+"55":T.bdr}`}}>
                <div style={{fontSize:10,color:T.muted,marginBottom:2}}>📱 Bedrock Port</div>
                <div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:crossplay?T.orange:T.muted}}>{bedrockPort}</div>
              </div>
            </div>
          </Card>

          {/* LAN */}
          <Card accent={T.purple}>
            <SectionLabel>🏠 LAN — Same Wi-Fi only</SectionLabel>
            <div style={{background:T.bg,borderRadius:10,padding:"11px 13px",fontFamily:"monospace",fontSize:14,color:T.purple,border:`1px solid ${T.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>{lanIp}:{javaPort}</span>
              <button onClick={()=>toast_("Copied!",T.purple)} style={{background:T.purple+"22",border:"none",color:T.purple,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:700}}>COPY</button>
            </div>
          </Card>

          {/* How to connect */}
          <Card>
            <SectionLabel>How to Connect</SectionLabel>
            {[
              {icon:"☕",title:"Java Edition",color:T.cyan,steps:[`Open Minecraft Java`,`Multiplayer → Add Server`,`Enter: ${wanIp}:${javaPort}`]},
              {icon:"📱",title:"Bedrock / Mobile / Console",color:T.orange,steps:[`Open Minecraft Bedrock`,`Play → Servers → Add Server`,`Address: ${wanIp}  Port: ${bedrockPort}`]},
            ].map(g=>(
              <div key={g.title} style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:g.color,marginBottom:5}}>{g.icon} {g.title}</div>
                {g.steps.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:3}}>
                    <span style={{color:g.color,fontWeight:700,fontSize:11,minWidth:14}}>{i+1}.</span>
                    <span style={{fontSize:11,color:T.sub,fontFamily:s.includes(wanIp)?"monospace":undefined}}>{s}</span>
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </>}

        {/* ══ RULES ════════════════════════════════════════════════════════════ */}
        {tab==="rules" && <>
          <div style={{fontSize:10,color:T.muted,marginBottom:10,fontWeight:700}}>GAME RULES & SERVER SETTINGS</div>
          {rules.map(r=>(
            <Card key={r.rule}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:"monospace",color:T.text}}>{r.rule}</div>
                  <div style={{fontSize:10,color:T.muted,marginTop:2}}>{r.desc}</div>
                </div>
                {r.type==="bool"&&(
                  <Toggle val={r.val} onChange={v=>updateRule(r.rule,v)} color={T.green}/>
                )}
                {r.type==="select"&&(
                  <select value={r.val} onChange={e=>updateRule(r.rule,e.target.value)} style={{background:T.bg,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:7,padding:"5px 8px",fontSize:11,flexShrink:0}}>
                    {r.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                )}
                {r.type==="number"&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    <button onClick={()=>r.val>r.min&&updateRule(r.rule,r.val-1)} style={{background:T.card2,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <span style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:T.cyan,minWidth:30,textAlign:"center"}}>{r.val}</span>
                    <button onClick={()=>r.val<r.max&&updateRule(r.rule,r.val+1)} style={{background:T.card2,border:`1px solid ${T.bdr}`,color:T.text,borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </>}

        {/* ══ CONSOLE ══════════════════════════════════════════════════════════ */}
        {tab==="console" && <>
          <div ref={logRef} style={{background:"#06080e",border:`1px solid ${T.bdr}`,borderRadius:14,height:360,overflowY:"auto",padding:"11px 13px",marginBottom:10,fontFamily:"'Fira Mono','Courier New',monospace",fontSize:11}}>
            {log.map((line,i)=>{
              const c = line.includes("WARN")?T.amber:line.includes("JOIN")?T.green:line.includes("CMD")?T.cyan:line.includes("CHAT")?T.purple:line.includes("BROADCAST")?T.orange:line.includes("Rule")?T.pink:"#5a7a96";
              return <div key={i} style={{color:c,lineHeight:1.8}}>{line}</div>;
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,background:T.card,border:`1px solid ${T.bdr}`,borderRadius:10,display:"flex",alignItems:"center",padding:"0 12px",overflow:"hidden"}}>
              <span style={{color:T.muted,fontSize:14,marginRight:6}}>/</span>
              <input value={cmd} onChange={e=>setCmd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendCmd()} placeholder="Enter command..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:T.text,fontSize:13,padding:"13px 0",fontFamily:"monospace"}}/>
            </div>
            <button onClick={sendCmd} style={{background:T.cyan+"22",border:`1px solid ${T.cyan}44`,color:T.cyan,borderRadius:10,padding:"0 16px",fontSize:16,cursor:"pointer"}}>➤</button>
          </div>
          <div style={{display:"flex",gap:7,marginTop:8,flexWrap:"wrap"}}>
            {["list","tps","stop","save-all","reload"].map(c=>(
              <button key={c} onClick={()=>{setCmd(c);}} style={{background:T.card2,border:`1px solid ${T.bdr}`,color:T.sub,borderRadius:7,padding:"5px 11px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>/{c}</button>
            ))}
          </div>
        </>}
      </div>

      {/* ══ BOTTOM NAV ══════════════════════════════════════════════════════════ */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.surf,borderTop:`1px solid ${T.bdr}`,display:"flex",padding:"7px 0 16px",zIndex:20}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0"}}>
              <span style={{fontSize:16,filter:active?"none":"grayscale(1) opacity(.45)"}}>{t.icon}</span>
              <span style={{fontSize:9,color:active?T.cyan:T.muted,fontWeight:active?700:400}}>{t.label}</span>
              {active&&<div style={{width:3,height:3,borderRadius:"50%",background:T.cyan}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
