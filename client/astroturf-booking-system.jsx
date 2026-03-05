import { useState, useEffect, useRef, useCallback } from "react";

// ─── Static data (outside component — never recreated) ────────────────────
const TURF_PHOTOS = {
  1: ["https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80","https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80","https://images.unsplash.com/photo-1551958219-acbc595d15b4?w=800&q=80","https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"],
  2: ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80","https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&q=80","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80","https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"],
  3: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80","https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80"],
  4: ["https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80","https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80","https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"],
};

const TURFS = [
  { id:1, name:"Accra Sports City",  location:"Cantonments, Accra", lat:5.5913, lng:-0.1775, rating:4.8, pricePerHour:250, surface:"Premium Astro Turf",  capacity:"5-a-side",  amenities:["Floodlights","Changing Rooms","Parking","Canteen"], distance:"1.2 km" },
  { id:2, name:"GreenField Arena",   location:"Osu, Accra",         lat:5.5534, lng:-0.1844, rating:4.5, pricePerHour:180, surface:"Synthetic Grass",      capacity:"7-a-side",  amenities:["Floodlights","Changing Rooms","CCTV"], distance:"2.8 km" },
  { id:3, name:"Labadi Kick Arena",  location:"Labadi, Accra",      lat:5.5502, lng:-0.1365, rating:4.2, pricePerHour:150, surface:"Astro Turf",           capacity:"5-a-side",  amenities:["Floodlights","Parking"], distance:"4.1 km" },
  { id:4, name:"AMA Premier Pitch",  location:"Accra Central",      lat:5.5471, lng:-0.2055, rating:4.6, pricePerHour:200, surface:"FIFA Certified Turf",  capacity:"11-a-side", amenities:["Floodlights","VIP Lounge","Changing Rooms","Parking","Canteen","Medical Room"], distance:"3.5 km" },
];

function makeSlots() {
  return [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(h=>({
    hour:h, label:`${h}:00 - ${h+1}:00`,
    status:Math.random()>0.55?"available":"booked", lockedBy:null,
  }));
}

// Seed enquiries per turf
const SEED_ENQUIRIES = {
  1:[{id:"e1",user:"Kofi A.",msg:"Is parking available on weekends?",time:"2 hrs ago",reply:"Yes, free parking for all bookings!"},{id:"e2",user:"Ama S.",msg:"Can we book for a birthday party event?",time:"1 day ago",reply:"Absolutely! Contact us for group packages."}],
  2:[{id:"e3",user:"Yaw B.",msg:"Do you have changing room facilities?",time:"3 hrs ago",reply:"Yes, clean changing rooms available."}],
  3:[],
  4:[{id:"e4",user:"Abena M.",msg:"Is the VIP lounge included in regular booking?",time:"5 hrs ago",reply:"VIP lounge requires a separate add-on fee of ₵50."}],
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--p:#0d5c3a;--pd:#073d27;--s:#0f4a2e;--s2:#0b3d25;--ac:#00ff87;--ac2:#00d4ff;--tx:#e8f8f0;--mu:rgba(232,248,240,.45);--br:rgba(0,255,135,.13);}
body{background:var(--p);}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--ac);border-radius:4px}
.btn-p{background:linear-gradient(135deg,#00ff87,#00d4ff);color:#073d27;border:none;border-radius:12px;font-weight:800;cursor:pointer;font-family:'Barlow',sans-serif;transition:all .2s}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,255,135,.4)}.btn-p:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-g{background:transparent;border:1.5px solid rgba(0,255,135,.35);color:var(--ac);border-radius:12px;font-weight:700;cursor:pointer;font-family:'Barlow',sans-serif;transition:all .2s}
.btn-g:hover{border-color:var(--ac);background:rgba(0,255,135,.1)}
.card{background:var(--s);border-radius:20px;border:1px solid var(--br)}
.slot-av{background:rgba(0,255,135,.1);border:1.5px solid rgba(0,255,135,.4);color:#00ff87;cursor:pointer;border-radius:10px;padding:7px 4px;font-size:11px;font-weight:700;transition:all .2s;text-align:center}
.slot-av:hover{background:rgba(0,255,135,.25);transform:scale(1.03)}
.slot-bk{background:rgba(255,60,90,.1);border:1.5px solid rgba(255,60,90,.3);color:#ff3c5a;border-radius:10px;padding:7px 4px;font-size:11px;font-weight:700;text-align:center;cursor:not-allowed}
.slot-lm{background:rgba(255,200,0,.15);border:1.5px solid rgba(255,200,0,.6);color:#ffc800;border-radius:10px;padding:7px 4px;font-size:11px;font-weight:700;text-align:center;cursor:pointer;animation:pg 1.5s infinite}
.slot-lo{background:rgba(150,100,255,.1);border:1.5px solid rgba(150,100,255,.3);color:#9664ff;border-radius:10px;padding:7px 4px;font-size:11px;font-weight:700;text-align:center;cursor:not-allowed}
@keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(255,200,0,.3)}50%{box-shadow:0 0 0 6px rgba(255,200,0,0)}}
@keyframes su{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes bounce{0%,100%{transform:translate(-50%,-100%) translateY(0)}50%{transform:translate(-50%,-100%) translateY(-7px)}}
.se{animation:su .3s ease forwards}
.notif{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;padding:11px 22px;border-radius:30px;font-weight:700;font-size:14px;animation:fi .3s;white-space:nowrap}
.ns{background:linear-gradient(135deg,#00ff87,#00d4ff);color:#073d27}.ne{background:linear-gradient(135deg,#ff3c5a,#ff6b35);color:#fff}
input,select,textarea{background:var(--s2);border:1.5px solid rgba(0,255,135,.18);border-radius:12px;color:var(--tx);padding:12px 15px;font-size:14px;width:100%;font-family:'Barlow',sans-serif;outline:none;transition:border .2s}
input:focus,select:focus,textarea:focus{border-color:var(--ac)}
input::placeholder,textarea::placeholder{color:var(--mu)}
textarea{resize:vertical;min-height:80px}
.bdg{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.bg{background:rgba(0,255,135,.15);color:#00ff87;border:1px solid rgba(0,255,135,.3)}
.bb{background:rgba(0,212,255,.15);color:#00d4ff;border:1px solid rgba(0,212,255,.3)}
.bo{background:rgba(255,200,0,.15);color:#ffc800;border:1px solid rgba(255,200,0,.3)}
.ta{border-bottom:2.5px solid var(--ac);color:var(--ac)}
.ps{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.pd{background:linear-gradient(135deg,#00ff87,#00d4ff);color:#073d27}.pa{background:var(--s2);border:2px solid var(--ac);color:var(--ac)}.pi{background:var(--s2);border:2px solid rgba(255,255,255,.15);color:rgba(255,255,255,.3)}
.gs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}.gs::-webkit-scrollbar{display:none}
.gt{min-width:90px;height:66px;border-radius:12px;object-fit:cover;cursor:pointer;border:2.5px solid transparent;transition:all .2s;flex-shrink:0}
.gt.active{border-color:var(--ac)}.gt:hover{transform:scale(1.05)}
.mpn{position:absolute;transform:translate(-50%,-100%);cursor:pointer;filter:drop-shadow(0 4px 8px rgba(0,255,135,.5));animation:bounce 2s infinite}
.shell{font-family:'Barlow','Segoe UI',sans-serif;background:var(--p);min-height:100vh;color:var(--tx)}
.phone{max-width:430px;margin:0 auto;min-height:100vh;position:relative;background:var(--p)}
@media(min-width:900px){
  .shell{display:grid;grid-template-columns:250px 1fr;grid-template-rows:60px 1fr;grid-template-areas:"tb tb" "sb mn";min-height:100vh}
  .phone{display:none!important}.wtb{display:flex!important;grid-area:tb}.wsb{display:flex!important;grid-area:sb}.wmn{display:block!important;grid-area:mn}.mhd,.mbn{display:none!important}
}
@media(max-width:899px){.shell{display:block}.wtb,.wsb,.wmn{display:none!important}.phone{display:block}}
.sni{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:13px;cursor:pointer;font-weight:700;font-size:14px;color:var(--mu);transition:all .2s;margin-bottom:3px;background:none;border:none;width:100%;text-align:left}
.sni:hover{background:rgba(0,255,135,.08);color:var(--tx)}.sni.act{background:rgba(0,255,135,.15);color:var(--ac)}
.tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px}
.auth-bg{position:fixed;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(0,255,135,.08),transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(0,212,255,.06),transparent 60%),var(--pd);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
.enq-bubble{background:var(--s2);border-radius:14px;border:1px solid var(--br);padding:13px 15px;margin-bottom:10px}
.enq-reply{background:rgba(0,255,135,.07);border-left:3px solid var(--ac);border-radius:0 10px 10px 0;padding:9px 12px;margin-top:8px;font-size:12px;color:rgba(232,248,240,.75)}
`;

// ─── Auth Screen (outside App — stable reference) ─────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirm:"" });
  const [err,  setErr]  = useState("");
  const [ok,   setOk]   = useState(false);

  // Simulated user store in memory
  const USERS_KEY = "__turfUsers";
  const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)||"[]"); } catch(e){return[];} };

  const handle = (field) => (e) => setForm(p=>({...p,[field]:e.target.value}));

  const submit = () => {
    setErr("");
    if (mode === "register") {
      if (!form.name||!form.email||!form.phone||!form.password) return setErr("All fields are required.");
      if (form.password !== form.confirm) return setErr("Passwords do not match.");
      if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
      const users = getUsers();
      if (users.find(u=>u.email===form.email)) return setErr("Email already registered. Please log in.");
      const newUser = { id:`U${Date.now()}`, name:form.name, email:form.email, phone:form.phone, password:form.password };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
      setOk(true);
      setTimeout(()=>{ setOk(false); setMode("login"); setForm(p=>({...p,name:"",phone:"",password:"",confirm:""})); }, 1500);
    } else {
      if (!form.email||!form.password) return setErr("Email and password required.");
      const users = getUsers();
      const user = users.find(u=>u.email===form.email&&u.password===form.password);
      if (!user) return setErr("Invalid email or password.");
      onAuth(user);
    }
  };

  return (
    <div className="auth-bg">
      <div style={{width:"100%",maxWidth:400,animation:"su .4s ease"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:60,height:60,background:"linear-gradient(135deg,#00ff87,#00d4ff)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 12px"}}>⚽</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:900,letterSpacing:1}}>TURFFIELD</div>
          <div style={{fontSize:11,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase"}}>Accra Metropolitan Assembly</div>
        </div>

        <div className="card" style={{padding:24}}>
          {/* Mode toggle */}
          <div style={{display:"flex",background:"var(--s2)",borderRadius:12,padding:4,marginBottom:20}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"all .2s",background:mode===m?"linear-gradient(135deg,#00ff87,#00d4ff)":"transparent",color:mode===m?"#073d27":"var(--mu)"}}>
                {m==="login"?"🔑 Sign In":"📝 Register"}
              </button>
            ))}
          </div>

          {ok && <div style={{background:"rgba(0,255,135,.15)",border:"1px solid rgba(0,255,135,.3)",borderRadius:10,padding:"10px 14px",marginBottom:14,color:"#00ff87",fontWeight:700,fontSize:14,textAlign:"center"}}>✅ Account created! Redirecting to login…</div>}
          {err && <div style={{background:"rgba(255,60,90,.12)",border:"1px solid rgba(255,60,90,.3)",borderRadius:10,padding:"10px 14px",marginBottom:14,color:"#ff3c5a",fontWeight:600,fontSize:13}}>{err}</div>}

          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {mode==="register"&&<input placeholder="Full Name" value={form.name} onChange={handle("name")} />}
            <input placeholder="Email Address" type="email" value={form.email} onChange={handle("email")} />
            {mode==="register"&&<input placeholder="Phone Number (0244…)" value={form.phone} onChange={handle("phone")} />}
            <input placeholder="Password" type="password" value={form.password} onChange={handle("password")} />
            {mode==="register"&&<input placeholder="Confirm Password" type="password" value={form.confirm} onChange={handle("confirm")} />}
          </div>

          <button className="btn-p" style={{width:"100%",padding:14,fontSize:15,marginTop:18}} onClick={submit}>
            {mode==="login"?"Sign In →":"Create Account →"}
          </button>

          {mode==="login"&&(
            <div style={{textAlign:"center",marginTop:14,fontSize:13,color:"var(--mu)"}}>
              No account?{" "}
              <span style={{color:"var(--ac)",cursor:"pointer",fontWeight:700}} onClick={()=>{setMode("register");setErr("");}}>Register here</span>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"rgba(255,255,255,.25)"}}>
          🔐 Your data is secure · AMA Certified Platform
        </div>
      </div>
    </div>
  );
}

// ─── TurfCard (outside App — stable reference) ────────────────────────────
function TurfCard({ t, slots, onOpen, web }) {
  const avail = slots[t.id]?.filter(s=>s.status==="available").length ?? 0;
  return (
    <div className="card" style={{overflow:"hidden",cursor:"pointer",transition:"transform .2s,box-shadow .2s"}}
      onMouseEnter={e=>{if(web){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 14px 40px rgba(0,255,135,.15)";}}}
      onMouseLeave={e=>{if(web){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}}
      onClick={()=>onOpen(t)}>
      <div style={{height:148,overflow:"hidden",position:"relative"}}>
        <img src={TURF_PHOTOS[t.id][0]} alt={t.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.background="#0b3d25";}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 50%,rgba(7,61,39,.9))"}} />
        <div style={{position:"absolute",bottom:10,left:12,display:"flex",gap:6}}>
          <span className="bdg bg">{t.capacity}</span>
          <span className="bdg bo">⭐ {t.rating}</span>
        </div>
        <div style={{position:"absolute",top:10,right:10,background:"rgba(7,61,39,.85)",backdropFilter:"blur(8px)",borderRadius:10,padding:"4px 10px",fontSize:11,fontWeight:700,color:"var(--ac)"}}>
          {avail} open
        </div>
      </div>
      <div style={{padding:"13px 15px"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18}}>{t.name}</div>
        <div style={{color:"var(--mu)",fontSize:12,marginTop:2,marginBottom:9}}>📍 {t.location} · {t.distance}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{color:"var(--ac)",fontWeight:900,fontSize:20}}>₵{t.pricePerHour}<span style={{fontSize:11,color:"var(--mu)",fontWeight:400}}>/hr</span></div>
          <button className="btn-p" style={{padding:"8px 15px",fontSize:13}} onClick={e=>{e.stopPropagation();onOpen(t);}}>Book →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery (outside App) ────────────────────────────────────────────────
function Gallery({ turfId }) {
  const [idx, setIdx] = useState(0);
  const photos = TURF_PHOTOS[turfId] || [];
  return (
    <div style={{marginBottom:14}}>
      <div style={{borderRadius:16,overflow:"hidden",height:210,marginBottom:8,position:"relative",background:"var(--s2)"}}>
        <img src={photos[idx]} alt="turf" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.src=TURF_PHOTOS[1][0];}} />
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 55%,rgba(7,61,39,.65))"}} />
        {photos.length>1&&<>
          <button onClick={()=>setIdx(p=>(p-1+photos.length)%photos.length)} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button onClick={()=>setIdx(p=>(p+1)%photos.length)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </>}
        <div style={{position:"absolute",bottom:10,right:12,background:"rgba(0,0,0,.5)",borderRadius:20,padding:"3px 10px",fontSize:11,color:"rgba(255,255,255,.8)"}}>{idx+1}/{photos.length}</div>
      </div>
      <div className="gs">
        {photos.map((src,i)=>(
          <img key={i} src={src} alt={`photo ${i+1}`} className={`gt${i===idx?" active":""}`} onClick={()=>setIdx(i)} onError={e=>{e.target.style.display="none";}} />
        ))}
      </div>
    </div>
  );
}

// ─── Enquiries Section (outside App) ─────────────────────────────────────
function EnquiriesSection({ turfId, user }) {
  const [enquiries, setEnquiries] = useState(SEED_ENQUIRIES[turfId] || []);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!msg.trim()) return;
    const newEnq = {
      id: `e${Date.now()}`,
      user: user?.name || "Guest",
      msg: msg.trim(),
      time: "Just now",
      reply: null,
    };
    setEnquiries(p=>[...p, newEnq]);
    setMsg("");
    setSent(true);
    setTimeout(()=>setSent(false), 3000);
    // Simulate a staff reply after 2s
    setTimeout(()=>{
      setEnquiries(p=>p.map(e=>e.id===newEnq.id?{...e,reply:"Thanks for your enquiry! Our team will get back to you shortly."}:e));
    },2500);
  };

  return (
    <div className="card" style={{padding:16,marginBottom:14}}>
      <div style={{fontWeight:800,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
        💬 Enquiries <span className="bdg bb">{enquiries.length}</span>
      </div>

      {enquiries.length===0&&(
        <div style={{color:"var(--mu)",fontSize:13,textAlign:"center",padding:"14px 0",marginBottom:10}}>No enquiries yet. Be the first to ask!</div>
      )}

      {enquiries.map(e=>(
        <div key={e.id} className="enq-bubble">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,background:"linear-gradient(135deg,var(--ac),var(--ac2))",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:"#073d27",flexShrink:0}}>
                {e.user.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{e.user}</div>
                <div style={{fontSize:11,color:"var(--mu)"}}>{e.time}</div>
              </div>
            </div>
          </div>
          <div style={{fontSize:14,color:"rgba(232,248,240,.85)",marginBottom:e.reply?8:0}}>{e.msg}</div>
          {e.reply&&(
            <div className="enq-reply">
              <div style={{fontWeight:700,color:"var(--ac)",fontSize:11,marginBottom:3}}>🏟️ Turf Manager</div>
              {e.reply}
            </div>
          )}
        </div>
      ))}

      {/* Ask form */}
      <div style={{marginTop:12}}>
        {sent&&<div style={{background:"rgba(0,255,135,.12)",border:"1px solid rgba(0,255,135,.25)",borderRadius:10,padding:"9px 12px",marginBottom:10,color:"#00ff87",fontSize:13,fontWeight:600}}>✅ Enquiry sent! We'll reply shortly.</div>}
        <textarea
          placeholder={user?"Ask a question about this turf…":"Sign in to send an enquiry"}
          value={msg}
          onChange={e=>setMsg(e.target.value)}
          disabled={!user}
          style={{marginBottom:8,opacity:user?1:.6}}
        />
        <button className="btn-p" style={{width:"100%",padding:11,fontSize:14}} onClick={submit} disabled={!user||!msg.trim()}>
          Send Enquiry →
        </button>
        {!user&&<div style={{textAlign:"center",fontSize:12,color:"var(--mu)",marginTop:8}}>Sign in to post an enquiry</div>}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState(null);        // logged-in user
  const [screen,  setScreen]  = useState("home");
  const [tab,     setTab]     = useState("turfs");
  const [turf,    setTurf]    = useState(null);
  const [slot,    setSlot]    = useState(null);
  const [bStep,   setBStep]   = useState(1);
  const [paying,  setPaying]  = useState(false);
  const [paid,    setPaid]    = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [locLoad, setLocLoad] = useState(false);

  // ── SEARCH & FILTER — stable state, NOT inside sub-components ─────────
  const [search,  setSearch]  = useState("");
  const [fCap,    setFCap]    = useState("All");
  const [sort,    setSort]    = useState("distance");

  const [info,    setInfo]    = useState({name:"",phone:"",email:"",date:""});
  const [bkgs,    setBkgs]    = useState([]);
  const [cd,      setCd]      = useState(300);
  const [notif,   setNotif]   = useState(null);
  const cdRef = useRef(null);

  // ── Slots live in a ref-backed state — updated WITHOUT touching UI state
  const [slots, setSlots] = useState(() => {
    const m={}; TURFS.forEach(t=>{m[t.id]=makeSlots();}); return m;
  });

  // ── Live slot simulation — uses functional updater so no stale closure ─
  useEffect(()=>{
    const iv = setInterval(()=>{
      setSlots(prev=>{
        let changed = false;
        const next = {...prev};
        TURFS.forEach(t=>{
          const sl = [...next[t.id]];
          const i  = Math.floor(Math.random()*sl.length);
          if(sl[i].status==="available"&&!sl[i].lockedBy&&Math.random()>.97){
            sl[i]={...sl[i],status:"booked"};
            next[t.id]=sl;
            changed=true;
          }
        });
        return changed ? next : prev; // avoid re-render if nothing changed
      });
    }, 5000);
    return ()=>clearInterval(iv);
  }, []); // ← empty deps — interval is set once, never re-created

  const note = useCallback((msg,type="s")=>{
    setNotif({msg,type});
    setTimeout(()=>setNotif(null),3000);
  },[]);

  const lockSlot = useCallback((tid,hr)=>{
    if(cdRef.current) clearInterval(cdRef.current);
    setCd(300);
    cdRef.current = setInterval(()=>{
      setCd(p=>{
        if(p<=1){
          clearInterval(cdRef.current);
          setSlots(prev=>{ const sl=prev[tid].map(s=>s.hour===hr?{...s,status:"available",lockedBy:null}:s); return {...prev,[tid]:sl}; });
          setSlot(null); setBStep(1); note("Slot lock expired! Re-select.","e"); return 300;
        }
        return p-1;
      });
    },1000);
    setSlots(prev=>{ const sl=prev[tid].map(s=>s.hour===hr?{...s,status:"locked",lockedBy:"you"}:s); return {...prev,[tid]:sl}; });
  },[note]);

  const releaseSlot = useCallback((tid,hr)=>{
    clearInterval(cdRef.current);
    setSlots(prev=>{ const sl=prev[tid].map(s=>s.hour===hr?{...s,status:"available",lockedBy:null}:s); return {...prev,[tid]:sl}; });
  },[]);

  const openTurf = useCallback((t)=>{ setTurf(t); setScreen("detail"); },[]);
  const fmt = s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const getUserLoc=()=>{
    setLocLoad(true);
    navigator.geolocation
      ?navigator.geolocation.getCurrentPosition(
          p=>{setUserLoc({lat:p.coords.latitude,lng:p.coords.longitude});setLocLoad(false);note("📍 Location acquired!");},
          ()=>{setUserLoc({lat:5.5502,lng:-0.2174});setLocLoad(false);note("📍 Using Accra centre");}
        )
      :(setLocLoad(false),note("Geolocation unavailable","e"));
  };

  const doPay=()=>{
    setPaying(true);
    setTimeout(()=>{
      setPaying(false);setPaid(true);
      setSlots(prev=>{ const sl=prev[turf.id].map(s=>s.hour===slot.hour?{...s,status:"booked",lockedBy:null}:s); return {...prev,[turf.id]:sl}; });
      setBkgs(prev=>[...prev,{id:`BK${Date.now()}`,turf:turf.name,slot:slot.label,date:info.date||"Today",amount:turf.pricePerHour,status:"Confirmed"}]);
    },3000);
  };

  // Filtered + searched turfs
  const filtered = TURFS
    .filter(t=>(fCap==="All"||t.capacity.includes(fCap))&&(search===""||t.name.toLowerCase().includes(search.toLowerCase())||t.location.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>sort==="price"?a.pricePerHour-b.pricePerHour:sort==="rating"?b.rating-a.rating:parseFloat(a.distance)-parseFloat(b.distance));

  // ─── Screen: Home ──────────────────────────────────────────────────────
  const Home = ({web=false}) => (
    <>
      {tab==="turfs"&&(
        <div className="se">
          <div style={{marginBottom:14}}>
            {/* Search input reads from App-level state — no remount issue */}
            <input
              placeholder="🔍  Search turfs in Accra…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{marginBottom:8}}
            />
            <div style={{display:"flex",gap:8}}>
              <select value={fCap} onChange={e=>setFCap(e.target.value)} style={{flex:1}}>
                <option value="All">All Sizes</option><option value="5">5-a-side</option><option value="7">7-a-side</option><option value="11">11-a-side</option>
              </select>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{flex:1}}>
                <option value="distance">Nearest</option><option value="rating">Top Rated</option><option value="price">Cheapest</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{width:8,height:8,background:"var(--ac)",borderRadius:"50%",display:"inline-block",boxShadow:"0 0 0 3px rgba(0,255,135,.25)",animation:"pg 1.5s infinite"}} />
            <span style={{fontSize:12,color:"var(--mu)"}}>Live slot availability · updates every 5 s</span>
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--mu)"}}>No turfs match your search.</div>}
          <div className={web?"tg":""} style={web?{}:{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map(t=><TurfCard key={t.id} t={t} slots={slots} onOpen={openTurf} web={web} />)}
          </div>
        </div>
      )}

      {tab==="map"&&(
        <div className="se">
          <div className="card" style={{overflow:"hidden",marginBottom:14}}>
            <div style={{position:"relative",height:web?380:250,background:"linear-gradient(135deg,#061a0d,#0d2e18)"}}>
              {[...Array(10)].map((_,i)=><div key={i} style={{position:"absolute",left:0,right:0,top:`${i*40}px`,height:1,background:"rgba(0,255,135,.05)"}} />)}
              {[...Array(14)].map((_,i)=><div key={i} style={{position:"absolute",top:0,bottom:0,left:`${i*40}px`,width:1,background:"rgba(0,255,135,.05)"}} />)}
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(0,255,135,.1)",fontSize:13,fontWeight:700,letterSpacing:3,pointerEvents:"none"}}>ACCRA METROPOLITAN</div>
              {TURFS.map((t,i)=>{
                const pos=[{left:"36%",top:"40%"},{left:"59%",top:"60%"},{left:"77%",top:"53%"},{left:"25%",top:"67%"}];
                return (
                  <div key={t.id} className="mpn" style={{left:pos[i].left,top:pos[i].top,position:"absolute"}} onClick={()=>openTurf(t)}>
                    <div style={{background:"var(--ac)",color:"#073d27",borderRadius:"50% 50% 50% 0",transform:"rotate(-45deg)",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900}}>
                      <span style={{transform:"rotate(45deg)"}}>⚽</span>
                    </div>
                  </div>
                );
              })}
              {userLoc&&<div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)"}}><div style={{width:13,height:13,background:"var(--ac2)",borderRadius:"50%",boxShadow:"0 0 0 5px rgba(0,212,255,.25)"}} /></div>}
            </div>
            <div style={{padding:14}}>
              <button className={userLoc?"btn-g":"btn-p"} style={{width:"100%",padding:12,fontSize:14}} onClick={getUserLoc} disabled={locLoad}>
                {locLoad?"📡 Getting location…":userLoc?"✅ Location Active — Tap to Refresh":"📍 Enable My Location"}
              </button>
            </div>
          </div>
          {TURFS.map(t=>(
            <div key={t.id} className="card" style={{marginBottom:10,padding:14,display:"flex",gap:12,alignItems:"center",cursor:"pointer"}} onClick={()=>openTurf(t)}>
              <img src={TURF_PHOTOS[t.id][0]} alt={t.name} style={{width:54,height:54,borderRadius:12,objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none";}} />
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15}}>{t.name}</div>
                <div style={{color:"var(--mu)",fontSize:12}}>{t.location} · {t.distance}</div>
                <div style={{color:"var(--ac)",fontWeight:700,fontSize:13,marginTop:2}}>₵{t.pricePerHour}/hr</div>
              </div>
              <button className="btn-g" style={{padding:"8px 11px",fontSize:12}} onClick={e=>{e.stopPropagation();setTurf(t);setScreen("dir");}}>🧭 Go</button>
            </div>
          ))}
        </div>
      )}

      {tab==="recommend"&&(()=>{
        const rec=[...TURFS].sort((a,b)=>b.rating-a.rating);
        return (
          <div className="se">
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,marginBottom:2}}>🎯 Recommended For You</div>
              <div style={{color:"var(--mu)",fontSize:13}}>Based on ratings, proximity & availability</div>
            </div>
            <div style={{background:"linear-gradient(135deg,#0b2e1a,#0d3820)",borderRadius:20,border:"1.5px solid rgba(0,255,135,.3)",padding:18,marginBottom:14,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-10,top:-10,fontSize:80,opacity:.07}}>🏆</div>
              <span className="bdg bo" style={{marginBottom:10,display:"inline-block"}}>⭐ TOP PICK</span>
              <div style={{display:"flex",gap:5,marginBottom:12,borderRadius:12,overflow:"hidden",height:60}}>
                {TURF_PHOTOS[rec[0].id].slice(0,3).map((src,i)=>(
                  <img key={i} src={src} alt="" style={{flex:1,height:"100%",objectFit:"cover",borderRadius:i===0?"10px 0 0 10px":i===2?"0 10px 10px 0":"0"}} onError={e=>{e.target.style.display="none";}} />
                ))}
              </div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900}}>{rec[0].name}</div>
              <div style={{color:"var(--mu)",fontSize:13,marginBottom:12}}>📍 {rec[0].location}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{color:"var(--ac)",fontWeight:900,fontSize:22}}>₵{rec[0].pricePerHour}<span style={{fontSize:12,color:"var(--mu)",fontWeight:400}}>/hr</span></div>
                  <div style={{color:"var(--mu)",fontSize:12}}>{slots[rec[0].id]?.filter(s=>s.status==="available").length} slots open today</div>
                </div>
                <button className="btn-p" style={{padding:"10px 18px"}} onClick={()=>openTurf(rec[0])}>Book Now</button>
              </div>
            </div>
            <div className="card" style={{padding:16,marginBottom:14}}>
              <div style={{fontWeight:800,marginBottom:12,color:"var(--ac2)"}}>🤖 Why We Recommend</div>
              {[{ic:"⭐",tx:`Highest rated in Accra (${rec[0].rating}/5.0)`},{ic:"💰",tx:"Competitive pricing for premium facilities"},{ic:"🏟️",tx:`${rec[0].amenities.length} amenities incl. floodlights`},{ic:"⚡",tx:"High availability — book before it fills up"}].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:9,fontSize:13,color:"rgba(255,255,255,.7)"}}><span>{r.ic}</span><span>{r.tx}</span></div>
              ))}
            </div>
            <div className="card" style={{padding:16}}>
              <div style={{fontWeight:800,marginBottom:12}}>🕐 Best Times to Book</div>
              {[["6–9 AM",85],["12–2 PM",40],["4–6 PM",30],["7–9 PM",15]].map(([t2,p])=>(
                <div key={t2} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:"var(--mu)"}}>{t2}</span>
                    <span style={{color:p<40?"#00ff87":p<70?"#ffc800":"#ff3c5a",fontWeight:700}}>{p}% full</span>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,.07)",borderRadius:3}}><div style={{height:"100%",width:`${p}%`,background:p<40?"#00ff87":p<70?"#ffc800":"#ff3c5a",borderRadius:3}} /></div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </>
  );

  // ─── Screen: Detail ────────────────────────────────────────────────────
  const Detail = () => (
    <div className="se">
      <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:"var(--ac)",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:12,padding:0}}>← Back</button>
      <Gallery turfId={turf.id} />
      <div style={{background:"linear-gradient(135deg,var(--s),var(--s2))",borderRadius:20,padding:18,marginBottom:12,border:"1px solid var(--br)"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,marginBottom:4}}>{turf.name}</div>
        <div style={{color:"var(--mu)",fontSize:13,marginBottom:10}}>📍 {turf.location}</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
          <span className="bdg bg">{turf.capacity}</span>
          <span className="bdg bb">{turf.surface}</span>
          <span className="bdg bo">⭐ {turf.rating}</span>
        </div>
        <div style={{display:"flex",gap:22}}>
          <div><div style={{color:"var(--ac)",fontSize:24,fontWeight:900}}>₵{turf.pricePerHour}</div><div style={{color:"var(--mu)",fontSize:12}}>per hour</div></div>
          <div><div style={{color:"var(--ac2)",fontSize:24,fontWeight:900}}>{turf.distance}</div><div style={{color:"var(--mu)",fontSize:12}}>from you</div></div>
        </div>
      </div>

      <div className="card" style={{padding:14,marginBottom:12}}>
        <div style={{fontWeight:800,marginBottom:9}}>🏟️ Amenities</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {turf.amenities.map(a=><span key={a} className="bdg bg" style={{padding:"6px 11px"}}>✓ {a}</span>)}
        </div>
      </div>

      <button className="btn-g" style={{width:"100%",padding:13,fontSize:14,marginBottom:12}} onClick={()=>setScreen("dir")}>🧭 Get Directions</button>

      {/* Slot Picker */}
      <div className="card" style={{padding:14,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:800}}>⏰ Select Time Slot</div>
          <div style={{display:"flex",gap:7,fontSize:10}}>
            <span style={{color:"#00ff87"}}>■ Free</span>
            <span style={{color:"#ff3c5a"}}>■ Booked</span>
            <span style={{color:"#ffc800"}}>■ Locked</span>
          </div>
        </div>
        <input type="date" style={{marginBottom:10}} onChange={e=>setInfo(p=>({...p,date:e.target.value}))} />
        {!user&&(
          <div style={{background:"rgba(255,200,0,.1)",border:"1px solid rgba(255,200,0,.3)",borderRadius:10,padding:"11px 14px",marginBottom:10,fontSize:13,color:"#ffc800",textAlign:"center"}}>
            🔒 <strong>Sign in required</strong> to book a slot
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {slots[turf.id].map(s=>{
            const mine=s.lockedBy==="you";
            const cls=s.status==="booked"?"slot-bk":s.status==="locked"?(mine?"slot-lm":"slot-lo"):"slot-av";
            return (
              <div key={s.hour} className={cls} onClick={()=>{
                if(!user){note("Please sign in to book","e");return;}
                if(s.status==="available"){ lockSlot(turf.id,s.hour); setSlot(s); note("🔒 Slot locked for 5 mins!"); }
                else if(mine){ setSlot(s); setBStep(1); setScreen("book"); }
              }}>
                {s.label}
                {s.status==="booked"&&<div style={{fontSize:9,marginTop:1}}>Taken</div>}
                {mine&&<div style={{fontSize:9,marginTop:1}}>🔒 Yours</div>}
                {s.status==="locked"&&!mine&&<div style={{fontSize:9,marginTop:1}}>In use</div>}
              </div>
            );
          })}
        </div>
      </div>

      {slot&&(
        <div style={{background:"linear-gradient(135deg,#0d2e18,#061a0d)",border:"1.5px solid rgba(0,255,135,.4)",borderRadius:16,padding:14,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div><div style={{fontWeight:800}}>🔒 Slot Reserved</div><div style={{color:"var(--mu)",fontSize:13}}>{slot.label} — ₵{turf.pricePerHour}</div></div>
            <div style={{textAlign:"center"}}><div style={{color:"#ffc800",fontWeight:900,fontSize:22}}>{fmt(cd)}</div><div style={{color:"var(--mu)",fontSize:10}}>expires</div></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn-p" style={{flex:2,padding:12,fontSize:14}} onClick={()=>{ setBStep(1); setScreen("book"); }}>Proceed to Book →</button>
            <button className="btn-g" style={{flex:1,padding:12,fontSize:13}} onClick={()=>{ releaseSlot(turf.id,slot.hour); setSlot(null); }}>Release</button>
          </div>
        </div>
      )}

      {/* ── Enquiries Section ── */}
      <EnquiriesSection turfId={turf.id} user={user} />
    </div>
  );

  // ─── Screen: Booking ───────────────────────────────────────────────────
  const Book = () => (
    <div className="se">
      <button onClick={()=>setScreen("detail")} style={{background:"none",border:"none",color:"var(--ac)",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:12,padding:0}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",marginBottom:18}}>
        {["Details","Review","Pay"].map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div className={`ps ${bStep>i+1?"pd":bStep===i+1?"pa":"pi"}`}>{bStep>i+1?"✓":i+1}</div>
              <div style={{fontSize:11,color:bStep===i+1?"var(--ac)":"var(--mu)",fontWeight:700}}>{s}</div>
            </div>
            {i<2&&<div style={{flex:1,height:2,background:bStep>i+1?"var(--ac)":"rgba(255,255,255,.1)",margin:"0 5px",marginBottom:14}} />}
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,200,0,.1)",border:"1px solid rgba(255,200,0,.3)",borderRadius:12,padding:"9px 15px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:13,color:"var(--mu)"}}>🔒 Slot reserved for</span>
        <span style={{color:"#ffc800",fontWeight:900}}>{fmt(cd)}</span>
      </div>

      {bStep===1&&(
        <div>
          <div className="card" style={{padding:15,marginBottom:14}}>
            <div style={{fontWeight:800,marginBottom:12}}>👤 Your Details</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input placeholder="Full Name" value={info.name||user?.name||""} onChange={e=>setInfo(p=>({...p,name:e.target.value}))} />
              <input placeholder="Phone Number" value={info.phone||user?.phone||""} onChange={e=>setInfo(p=>({...p,phone:e.target.value}))} />
              <input placeholder="Email Address" type="email" value={info.email||user?.email||""} onChange={e=>setInfo(p=>({...p,email:e.target.value}))} />
            </div>
          </div>
          <button className="btn-p" style={{width:"100%",padding:14,fontSize:15}} onClick={()=>{ if(!info.name&&!user?.name){note("Fill all fields","e");return;} setBStep(2); }}>Continue →</button>
        </div>
      )}

      {bStep===2&&(
        <div>
          <div className="card" style={{padding:17,marginBottom:14}}>
            <div style={{fontWeight:800,marginBottom:12,color:"var(--ac2)"}}>📋 Booking Summary</div>
            {[["Turf",turf.name],["Location",turf.location],["Date",info.date||"Today"],["Time",slot.label],["Duration","1 Hour"],["Name",info.name||user?.name],["Phone",info.phone||user?.phone]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.05)",fontSize:14}}>
                <span style={{color:"var(--mu)"}}>{k}</span><span style={{fontWeight:700}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"13px 0 0",fontSize:18}}>
              <span style={{fontWeight:800}}>Total</span>
              <span style={{fontWeight:900,color:"var(--ac)"}}>₵{turf.pricePerHour}.00</span>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn-g" style={{flex:1,padding:13}} onClick={()=>setBStep(1)}>← Edit</button>
            <button className="btn-p" style={{flex:2,padding:13,fontSize:14}} onClick={()=>setBStep(3)}>Pay with Paystack →</button>
          </div>
        </div>
      )}

      {bStep===3&&!paid&&(
        <div>
          <div className="card" style={{padding:17,marginBottom:12}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{background:"linear-gradient(135deg,#00d4ff,#0088ff)",borderRadius:13,padding:"9px 22px",display:"inline-block",fontWeight:900,fontSize:18,color:"#fff",letterSpacing:1,marginBottom:5}}>💳 PAYSTACK</div>
              <div style={{color:"var(--mu)",fontSize:13}}>Secure Payment Gateway</div>
            </div>
            <div style={{textAlign:"center",background:"rgba(0,255,135,.05)",borderRadius:12,padding:13,marginBottom:13}}>
              <div style={{color:"var(--mu)",fontSize:13}}>Amount to Pay</div>
              <div style={{fontSize:34,fontWeight:900,color:"var(--ac)"}}>₵{turf.pricePerHour}.00</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              <input placeholder="Card Number" defaultValue="4084 0841 0841 0841" />
              <div style={{display:"flex",gap:9}}><input placeholder="MM/YY" defaultValue="12/26" /><input placeholder="CVV" defaultValue="408" /></div>
              <input placeholder="Cardholder Name" value={info.name||user?.name||""} readOnly />
            </div>
            <div style={{marginTop:10,marginBottom:13,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              {["Visa","MasterCard","MTN MoMo","Vodafone Cash"].map(m=><span key={m} className="bdg bb" style={{fontSize:10}}>{m}</span>)}
            </div>
            <button className="btn-p" style={{width:"100%",padding:15,fontSize:16}} onClick={doPay} disabled={paying}>
              {paying?"⏳ Processing…":`Pay ₵${turf.pricePerHour}.00 Now`}
            </button>
            {paying&&<div style={{marginTop:12,height:4,background:"rgba(255,255,255,.1)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,var(--ac2),var(--ac))",width:"70%",borderRadius:2}} /></div>}
          </div>
          <div style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,.25)"}}>🔐 256-bit SSL · Paystack certified</div>
        </div>
      )}

      {paid&&(
        <div style={{textAlign:"center",padding:"36px 14px",animation:"su .5s ease"}}>
          <div style={{fontSize:70,marginBottom:14}}>🎉</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:900,color:"var(--ac)",marginBottom:6}}>BOOKING CONFIRMED!</div>
          <div style={{color:"var(--mu)",marginBottom:18}}>Your slot is secured. See you on the turf!</div>
          <div className="card" style={{padding:14,marginBottom:14,textAlign:"left"}}>
            {[["Booking ID",`BK${Date.now().toString().slice(-6)}`],["Turf",turf.name],["Time",slot.label],["Paid",`₵${turf.pricePerHour}.00`]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.05)",fontSize:14}}>
                <span style={{color:"var(--mu)"}}>{k}</span><span style={{fontWeight:700}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn-p" style={{flex:1,padding:13,fontSize:14}} onClick={()=>setScreen("dir")}>🧭 Directions</button>
            <button className="btn-g" style={{flex:1,padding:13,fontSize:14}} onClick={()=>{ setScreen("home"); setPaid(false); setSlot(null); setBStep(1); }}>Home</button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Screen: Directions ────────────────────────────────────────────────
  const Dir = () => (
    <div className="se">
      <button onClick={()=>setScreen(paid?"home":"detail")} style={{background:"none",border:"none",color:"var(--ac)",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:12,padding:0}}>← Back</button>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,marginBottom:3}}>🧭 Directions</div>
      <div style={{color:"var(--mu)",fontSize:13,marginBottom:14}}>Navigate to {turf?.name}</div>
      <div className="card" style={{overflow:"hidden",marginBottom:14}}>
        <div style={{height:190,background:"linear-gradient(135deg,#061a0d,#0d2e18)",position:"relative"}}>
          {[...Array(7)].map((_,i)=><div key={i} style={{position:"absolute",left:0,right:0,top:`${i*28}px`,height:1,background:"rgba(0,255,135,.05)"}} />)}
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
            <path d="M 80 165 Q 160 88 285 68" stroke="#00ff87" strokeWidth="2.5" strokeDasharray="7,4" fill="none" opacity=".85" />
            <circle cx="80" cy="165" r="7" fill="#00d4ff" /><circle cx="285" cy="68" r="9" fill="#00ff87" />
          </svg>
          <div style={{position:"absolute",left:55,bottom:32,fontSize:11,color:"#00d4ff",fontWeight:700}}>📍 You</div>
          <div style={{position:"absolute",right:48,top:34,fontSize:11,color:"#00ff87",fontWeight:700}}>🏟️ {turf?.name}</div>
        </div>
        <div style={{padding:13}}>
          <div style={{display:"flex",gap:9,marginBottom:11}}>
            <div className="card" style={{flex:1,padding:11,textAlign:"center"}}><div style={{color:"var(--ac)",fontWeight:900,fontSize:18}}>{turf?.distance}</div><div style={{color:"var(--mu)",fontSize:12}}>Distance</div></div>
            <div className="card" style={{flex:1,padding:11,textAlign:"center"}}><div style={{color:"var(--ac2)",fontWeight:900,fontSize:18}}>~{Math.round(parseFloat(turf?.distance||0)*3)} min</div><div style={{color:"var(--mu)",fontSize:12}}>Drive Time</div></div>
          </div>
          <button className="btn-p" style={{width:"100%",padding:12,fontSize:14,marginBottom:8}} onClick={()=>{ window.open(`https://www.google.com/maps/dir/?api=1&destination=${turf?.lat},${turf?.lng}&travelmode=driving`,"_blank"); note("Opening Google Maps…"); }}>🗺️ Open in Google Maps</button>
          <button className="btn-g" style={{width:"100%",padding:10,fontSize:13}} onClick={()=>{ window.open(`https://www.waze.com/ul?ll=${turf?.lat},${turf?.lng}&navigate=yes`,"_blank"); note("Opening Waze…"); }}>🚗 Open in Waze</button>
        </div>
      </div>
      <div className="card" style={{padding:14}}>
        <div style={{fontWeight:800,marginBottom:11}}>📍 Step-by-Step</div>
        {[{ic:"⬆️",tx:`Head toward ${turf?.location.split(",")[0]}`,d:"0.3 km"},{ic:"↪️",tx:"Turn right onto Liberation Road",d:"0.8 km"},{ic:"↩️",tx:"Turn left at the roundabout",d:"0.4 km"},{ic:"⬆️",tx:`Continue — ${turf?.name} on right`,d:turf?.distance},{ic:"🏟️",tx:"Arrive at destination",d:""}].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
            <span style={{fontSize:17}}>{s.ic}</span>
            <div style={{flex:1,fontSize:13,color:"rgba(255,255,255,.8)"}}>{s.tx}</div>
            {s.d&&<span style={{fontSize:12,color:"var(--ac)",fontWeight:700}}>{s.d}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Screen: My Bookings ───────────────────────────────────────────────
  const Bookings = () => (
    <div className="se">
      <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:"var(--ac)",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:12,padding:0}}>← Back</button>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,marginBottom:16}}>📅 My Bookings</div>
      {bkgs.length===0?(
        <div style={{textAlign:"center",padding:"50px 18px"}}>
          <div style={{fontSize:54,marginBottom:12}}>🏟️</div>
          <div style={{fontWeight:800,fontSize:18,marginBottom:5}}>No bookings yet</div>
          <div style={{color:"var(--mu)",marginBottom:18}}>Book your first turf session!</div>
          <button className="btn-p" style={{padding:"12px 26px"}} onClick={()=>setScreen("home")}>Find a Turf</button>
        </div>
      ):bkgs.map(b=>(
        <div key={b.id} className="card" style={{padding:15,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{fontWeight:800}}>{b.turf}</div><span className="bdg bg">{b.status}</span></div>
          <div style={{color:"var(--mu)",fontSize:13,marginBottom:4}}>📅 {b.date} · ⏰ {b.slot}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:7}}>
            <div style={{color:"var(--ac)",fontWeight:900,fontSize:17}}>₵{b.amount}.00</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.22)"}}>ID: {b.id}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ─── Router ────────────────────────────────────────────────────────────
  const View = ({web=false}) => {
    if(screen==="home")              return <Home web={web} />;
    if(screen==="detail"&&turf)      return <Detail />;
    if(screen==="book"&&turf&&slot)  return <Book />;
    if(screen==="dir"&&turf)         return <Dir />;
    if(screen==="bkgs")              return <Bookings />;
    return <Home web={web} />;
  };

  // ─── Nav helpers ───────────────────────────────────────────────────────
  const navTabs = [{t:"turfs",ic:"🏟️",lb:"Browse Turfs"},{t:"map",ic:"🗺️",lb:"Map View"},{t:"recommend",ic:"🎯",lb:"For You"}];
  const mobTabs = [{t:"turfs",ic:"🏟️",lb:"Turfs"},{t:"map",ic:"🗺️",lb:"Map"},{t:"recommend",ic:"🎯",lb:"For You"}];

  return (
    <div className="shell">
      <style>{CSS}</style>

      {/* Auth overlay — shown when not logged in */}
      {!user && <AuthScreen onAuth={(u)=>{ setUser(u); note(`Welcome back, ${u.name}! 👋`); }} />}

      {notif&&<div className={`notif ${notif.type==="s"?"ns":"ne"}`}>{notif.msg}</div>}

      {/* ── WEB top-bar ── */}
      <header className="wtb" style={{display:"none",alignItems:"center",justifyContent:"space-between",padding:"0 28px",background:"var(--pd)",borderBottom:"1px solid var(--br)",position:"sticky",top:0,zIndex:200}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:34,height:34,background:"var(--ac)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚽</div>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:21,fontWeight:900,letterSpacing:1}}>TURFFIELD</div>
            <div style={{fontSize:9,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase",marginTop:-2}}>Accra Metropolitan Assembly</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,background:"var(--ac)",borderRadius:"50%",boxShadow:"0 0 0 3px rgba(0,255,135,.22)",display:"inline-block",animation:"pg 1.5s infinite"}} /><span style={{fontSize:12,color:"var(--mu)"}}>Live</span></div>
          {user&&<div style={{fontSize:13,color:"var(--mu)"}}>👤 {user.name}</div>}
          <button className="btn-g" style={{padding:"7px 14px",fontSize:13}} onClick={()=>setScreen("bkgs")}>
            My Bookings {bkgs.length>0&&<span style={{background:"var(--ac)",color:"#073d27",borderRadius:"50%",padding:"1px 6px",marginLeft:3,fontWeight:900}}>{bkgs.length}</span>}
          </button>
          {user&&<button className="btn-g" style={{padding:"7px 14px",fontSize:13}} onClick={()=>{ setUser(null); setScreen("home"); note("Signed out successfully"); }}>Sign Out</button>}
        </div>
      </header>

      {/* ── WEB sidebar ── */}
      <aside className="wsb" style={{display:"none",flexDirection:"column",padding:"22px 14px",background:"var(--pd)",borderRight:"1px solid var(--br)",position:"sticky",top:60,height:"calc(100vh - 60px)",overflowY:"auto"}}>
        {navTabs.map(item=>(
          <button key={item.t} className={`sni${tab===item.t&&screen==="home"?" act":""}`} onClick={()=>{ setTab(item.t); setScreen("home"); }}>
            <span style={{fontSize:20}}>{item.ic}</span>{item.lb}
          </button>
        ))}
        <div style={{marginTop:"auto",padding:"16px 0",borderTop:"1px solid var(--br)"}}>
          <div style={{fontSize:10,color:"var(--mu)",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>AMA Zones</div>
          {["Accra Central","Osu-Klottey","Ablekuma","Ayawaso","Okaikwei"].map(z=>(
            <div key={z} style={{padding:"7px 10px",borderRadius:10,cursor:"pointer",fontSize:13,color:"var(--mu)",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,255,135,.08)";e.currentTarget.style.color="var(--tx)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="";e.currentTarget.style.color="var(--mu)";}}>
              📍 {z}
            </div>
          ))}
        </div>
      </aside>

      {/* ── WEB main ── */}
      <main className="wmn" style={{display:"none",padding:"28px 32px",background:"var(--p)",minHeight:"calc(100vh - 60px)"}}>
        <View web={true} />
      </main>

      {/* ── MOBILE frame ── */}
      <div className="phone">
        <div className="mhd" style={{background:"linear-gradient(180deg,var(--pd) 0%,transparent 100%)",padding:"16px 16px 0",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,color:"var(--ac)",fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Accra Metro Assembly</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:21,fontWeight:900,letterSpacing:1}}>⚽ TURFFIELD</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {user&&<div style={{fontSize:12,color:"var(--ac)",fontWeight:700}}>👤 {user.name.split(" ")[0]}</div>}
              <button onClick={()=>setScreen("bkgs")} style={{background:"rgba(0,255,135,.1)",border:"1px solid rgba(0,255,135,.2)",borderRadius:12,padding:"7px 11px",color:"var(--ac)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {bkgs.length>0&&<span style={{background:"var(--ac)",color:"#073d27",borderRadius:"50%",padding:"1px 5px",marginRight:4}}>{bkgs.length}</span>}Bookings
              </button>
              {user&&<button onClick={()=>{ setUser(null); note("Signed out"); }} style={{background:"none",border:"1px solid rgba(255,60,90,.3)",borderRadius:10,padding:"7px 10px",color:"#ff3c5a",fontSize:12,fontWeight:700,cursor:"pointer"}}>Out</button>}
            </div>
          </div>
          {screen==="home"&&(
            <div style={{display:"flex",gap:20,borderBottom:"1px solid rgba(255,255,255,.07)"}}>
              {mobTabs.map(item=>(
                <button key={item.t} onClick={()=>setTab(item.t)} style={{background:"none",border:"none",color:tab===item.t?"var(--ac)":"var(--mu)",fontWeight:700,fontSize:12,padding:"7px 0",cursor:"pointer"}} className={tab===item.t?"ta":""}>
                  {item.ic} {item.lb}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{padding:"12px 13px 78px",overflowY:"auto",height:"calc(100vh - 108px)"}}>
          <View web={false} />
        </div>

        {screen==="home"&&(
          <div className="mbn" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(7,61,39,.96)",backdropFilter:"blur(20px)",borderTop:"1px solid var(--br)",display:"flex",padding:"9px 0"}}>
            {mobTabs.map(item=>(
              <button key={item.t} onClick={()=>setTab(item.t)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===item.t?"var(--ac)":"rgba(255,255,255,.35)",fontFamily:"'Barlow',sans-serif",fontWeight:700,fontSize:11,padding:"3px 0"}}>
                <span style={{fontSize:21}}>{item.ic}</span>{item.lb}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
