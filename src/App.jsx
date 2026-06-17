import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Users, User, X, Flame, Search, Navigation, Star, Sliders,
  Shield, Bell, Phone, MessageCircle, Check, UserPlus, Zap, Music
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const timeAgo = ts => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
};

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
(() => {
  if (document.getElementById("vs-global")) return;
  const s = document.createElement("style");
  s.id = "vs-global";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#06060F;--s1:#0E0E1E;--s2:#161628;
      --p:#9B30FF;--pk:#FF2D78;--cy:#00D4FF;
      --txt:#F2F0FF;--mut:#5A5A88;--bdr:rgba(155,48,255,0.18);
    }
    @keyframes vs-pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.12;transform:scale(1.7)}}
    @keyframes vs-slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes vs-fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes vs-spin{to{transform:rotate(360deg)}}
    ::-webkit-scrollbar{display:none}
    input,button,select,textarea{font-family:'DM Sans',sans-serif}
    input[type=range]{accent-color:var(--p);width:100%;cursor:pointer;height:4px}
    .leaflet-container{background:#06060F !important}
    .leaflet-tile-pane img{filter:brightness(0.85) saturate(0.75)}
    .leaflet-control-attribution{display:none !important}
  `;
  document.head.appendChild(s);
})();

// ─── LEAFLET LOADER ──────────────────────────────────────────────────────────
let _lfPromise = null;
const loadLeaflet = () => {
  if (_lfPromise) return _lfPromise;
  _lfPromise = new Promise(res => {
    if (window.L && window.L.heatLayer) { res(window.L); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    document.head.appendChild(s1);
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js";
      document.head.appendChild(s2);
      s2.onload = () => res(window.L);
      s2.onerror = () => res(window.L); // fallback: map works without heat plugin
    };
  });
  return _lfPromise;
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const CLUBS_SEED = [
  {id:1,name:"Fabric",short:"FAB",area:"Farringdon",city:"London",country:"UK",lat:51.5202,lng:-0.1021,heat:94,voters:1247,likelihood:82,genre:"Techno · House",cap:1500,desc:"Three-room superclub in a former cold store. London's defining techno temple."},
  {id:2,name:"Ministry of Sound",short:"MOS",area:"Elephant & Castle",city:"London",country:"UK",lat:51.4983,lng:-0.1047,heat:89,voters:1803,likelihood:86,genre:"House · Dance",cap:2000,desc:"World-famous venue with one of the finest sound systems ever built."},
  {id:3,name:"XOYO",short:"XYO",area:"Islington",city:"London",country:"UK",lat:51.5365,lng:-0.0942,heat:73,voters:523,likelihood:64,genre:"Mixed · Electronic",cap:800,desc:"Beloved East London venue with eclectic bookings and intimate sweaty atmosphere."},
  {id:4,name:"EGG London",short:"EGG",area:"King's Cross",city:"London",country:"UK",lat:51.5390,lng:-0.1165,heat:67,voters:412,likelihood:61,genre:"Techno · Rave",cap:800,desc:"Underground warehouse with a stunning outdoor terrace and legendary all-dayers."},
  {id:5,name:"Printworks",short:"PWK",area:"Surrey Quays",city:"London",country:"UK",lat:51.4933,lng:-0.0478,heat:81,voters:934,likelihood:74,genre:"Electronic · Art",cap:5000,desc:"Converted printing factory. The press halls are truly one of a kind."},
  {id:6,name:"Fold",short:"FLD",area:"Canning Town",city:"London",country:"UK",lat:51.5033,lng:-0.0097,heat:58,voters:298,likelihood:52,genre:"Techno · Dark",cap:600,desc:"Brutalist East London warehouse. Serious techno, no photos policy."},
  {id:7,name:"Heaven",short:"HVN",area:"Charing Cross",city:"London",country:"UK",lat:51.5074,lng:-0.1229,heat:85,voters:956,likelihood:78,genre:"LGBT+ · Pop",cap:1200,desc:"Iconic LGBTQ+ nightclub under the Arches since 1979. A London institution."},
  {id:8,name:"Village Underground",short:"VLU",area:"Shoreditch",city:"London",country:"UK",lat:51.5245,lng:-0.0791,heat:76,voters:498,likelihood:70,genre:"House · Indie",cap:800,desc:"Brilliant venue in converted Tube cars. Shoreditch indie meets electronic."},
  {id:9,name:"Corsica Studios",short:"COR",area:"Elephant & Castle",city:"London",country:"UK",lat:51.4952,lng:-0.1004,heat:63,voters:278,likelihood:57,genre:"Electronic",cap:600,desc:"Intimate two rooms with some of London's finest underground bookings."},
  {id:10,name:"E1 London",short:"E1L",area:"Whitechapel",city:"London",country:"UK",lat:51.5163,lng:-0.0680,heat:70,voters:387,likelihood:66,genre:"Grime · Bass",cap:900,desc:"East London venue blending art, culture and underground music beautifully."},
  {id:11,name:"Warehouse Project",short:"WHP",area:"Depot Mayfield",city:"Manchester",country:"UK",lat:53.4700,lng:-2.2279,heat:88,voters:1102,likelihood:80,genre:"House · Techno",cap:10000,desc:"Legendary seasonal series inside a vast Victorian railway depot."},
  {id:12,name:"Sankeys",short:"SNK",area:"Ancoats",city:"Manchester",country:"UK",lat:53.4814,lng:-2.2278,heat:72,voters:445,likelihood:65,genre:"Techno · Trance",cap:1200,desc:"Storied Manchester institution with decades of techno and trance history."},
  {id:13,name:"Berghain",short:"BRG",area:"Friedrichshain",city:"Berlin",country:"DE",lat:52.5117,lng:13.4418,heat:98,voters:4213,likelihood:91,genre:"Hard Techno",cap:1500,desc:"The world's most legendary nightclub. 72-hour weekends in a power station."},
  {id:14,name:"Tresor",short:"TRS",area:"Mitte",city:"Berlin",country:"DE",lat:52.5118,lng:13.4034,heat:83,voters:876,likelihood:77,genre:"Techno",cap:800,desc:"The vault. Detroit techno's spiritual European home since 1991."},
  {id:15,name:"Pacha Ibiza",short:"PCH",area:"Port d'Eivissa",city:"Ibiza",country:"ES",lat:38.9075,lng:1.4346,heat:91,voters:2134,likelihood:84,genre:"House · Commercial",cap:3000,desc:"The original Ibiza superclub. Two cherries. Iconic since 1973."},
  {id:16,name:"Ushuaia",short:"USH",area:"Playa d'en Bossa",city:"Ibiza",country:"ES",lat:38.8855,lng:1.3942,heat:87,voters:1567,likelihood:80,genre:"House · EDM",cap:5000,desc:"Open-air mega venue with world-class pool parties and production."},
  {id:17,name:"Avant Gardner",short:"AVG",area:"E. Williamsburg",city:"New York",country:"US",lat:40.7065,lng:-73.9399,heat:83,voters:876,likelihood:75,genre:"Electronic · Rave",cap:5000,desc:"NYC's premier rave complex. The Great Hall is world class."},
  {id:18,name:"Basement NYC",short:"BSM",area:"Lower East Side",city:"New York",country:"US",lat:40.7207,lng:-73.9865,heat:77,voters:542,likelihood:70,genre:"Techno · House",cap:400,desc:"Intimate underground techno room on the Lower East Side."},
  {id:19,name:"Womb",short:"WMB",area:"Shibuya",city:"Tokyo",country:"JP",lat:35.6588,lng:139.6957,heat:80,voters:734,likelihood:73,genre:"House · Electronic",cap:1000,desc:"Tokyo's iconic four-floor club with a legendary mirror ball."},
  {id:20,name:"Ageha",short:"AGH",area:"Shin-Kiba",city:"Tokyo",country:"JP",lat:35.6432,lng:139.8297,heat:75,voters:623,likelihood:68,genre:"Trance · House",cap:4000,desc:"Massive outdoor complex on Tokyo Bay. Island vibes, serious sound."},
  {id:21,name:"Shelter Amsterdam",short:"SHT",area:"Noord",city:"Amsterdam",country:"NL",lat:52.3905,lng:4.8614,heat:71,voters:445,likelihood:63,genre:"Techno",cap:600,desc:"Hidden under the EYE Film Institute. Amsterdam's best-kept secret."},
  {id:22,name:"Paradiso",short:"PRD",area:"Leidseplein",city:"Amsterdam",country:"NL",lat:52.3615,lng:4.8826,heat:69,voters:398,likelihood:62,genre:"Mixed",cap:1500,desc:"Legendary concert hall and club in a converted church since 1968."},
  {id:23,name:"Razzmatazz",short:"RZZ",area:"El Poblenou",city:"Barcelona",country:"ES",lat:41.3980,lng:2.1914,heat:78,voters:567,likelihood:71,genre:"Electronic · Mixed",cap:4500,desc:"Five rooms, five genres. Barcelona's iconic warehouse complex."},
];

const FRIENDS_SEED = [
  {id:1,name:"Sam",handle:"@sam.ldn",age:25,goingTo:1,likelihood:90,online:true},
  {id:2,name:"Maya",handle:"@maya.nts",age:23,goingTo:2,likelihood:75,online:true},
  {id:3,name:"Kai",handle:"@kai.raves",age:27,goingTo:7,likelihood:85,online:true},
  {id:4,name:"Priya",handle:"@priya.sounds",age:24,goingTo:1,likelihood:70,online:false},
  {id:5,name:"Leo",handle:"@leo.techno",age:26,goingTo:5,likelihood:95,online:true},
  {id:6,name:"Zoe",handle:"@zoe.after",age:22,goingTo:null,likelihood:50,online:false},
  {id:7,name:"Tom",handle:"@tom.ldn",age:29,goingTo:3,likelihood:80,online:true},
  {id:8,name:"Nia",handle:"@nia.house",age:24,goingTo:2,likelihood:88,online:true},
];

const NOTIFS_SEED = [
  {id:1,text:"Sam is heading to Fabric tonight",time:"2m",icon:"👤"},
  {id:2,text:"Fabric just hit 1,247 voters — it's ON FIRE",time:"5m",icon:"🔥"},
  {id:3,text:"Maya and Nia both picked Ministry of Sound",time:"12m",icon:"👥"},
  {id:4,text:"Razzmatazz added to the global map",time:"1h",icon:"📍"},
  {id:5,text:"Your pick Fabric is the #1 spot tonight",time:"2h",icon:"⚡"},
  {id:6,text:"Leo set his likelihood for Printworks to 95%",time:"3h",icon:"📊"},
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const heatCol = h => h>=88?"#FF2222":h>=75?"#FF7700":h>=60?"#9B30FF":"#00B4D8";
const likeCol = l => l>=80?"#00FF88":l>=65?"#88FF00":l>=50?"#FFD700":"#FF7700";
const heatLabel = h => h>=88?"ON FIRE 🔥":h>=75?"HOT ⚡":h>=60?"VIBING 💜":"CHILL 🧊";

const Spinner = () => (
  <span style={{display:"inline-block",width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",borderRadius:"50%",animation:"vs-spin 0.7s linear infinite"}} />
);

const Pill = ({children,active,onClick}) => (
  <button onClick={onClick} style={{
    background:active?"linear-gradient(135deg,#9B30FF,#FF2D78)":"rgba(14,14,30,0.9)",
    border:active?"none":"1px solid rgba(155,48,255,0.22)",
    backdropFilter:"blur(16px)", color:active?"white":"var(--mut)",
    padding:"6px 14px", borderRadius:99, fontSize:11, fontWeight:700,
    cursor:"pointer", whiteSpace:"nowrap", letterSpacing:"0.4px", transition:"all 0.2s",
  }}>{children}</button>
);

// ─── LEAFLET CLUB ICON ────────────────────────────────────────────────────────
const mkClubIcon = (L, club, ranked) => {
  const col = heatCol(club.heat);
  const sz = Math.round(10 + club.heat * 0.1);
  const badge = ranked
    ? `<div style="position:absolute;top:-9px;right:-9px;background:${ranked.rank===1?"#FFD700":ranked.rank===2?"#C0C0C0":"#CD7F32"};color:#000;font-size:7px;font-weight:900;padding:1px 5px;border-radius:99px;z-index:2;">#${ranked.rank}</div>`
    : "";
  return L.divIcon({
    html:`<div style="text-align:center;font-family:'DM Sans',sans-serif;">
      <div style="position:relative;display:inline-block;">
        <div style="width:${sz+12}px;height:${sz+12}px;border-radius:50%;background:${col}22;animation:vs-pulse 2s ease-in-out infinite;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);"></div>
        <div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${col};box-shadow:0 0 ${sz*1.4}px ${col};${ranked?"border:2px solid white;":""}position:relative;z-index:1;"></div>
        ${badge}
      </div>
      <div style="margin-top:5px;background:rgba(6,6,15,0.92);border:1px solid ${col}44;color:rgba(255,255,255,0.9);font-size:9px;font-weight:700;padding:2px 7px;border-radius:99px;white-space:nowrap;">${club.name}</div>
    </div>`,
    className:"",
    iconSize:[90,54],
    iconAnchor:[45,27],
  });
};

const mkFriendIcon = (L, friend) => L.divIcon({
  html:`<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#9B30FF,#FF2D78);border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;font-family:'DM Sans',sans-serif;box-shadow:0 2px 10px rgba(155,48,255,0.5);">${friend.name[0]}</div>`,
  className:"",
  iconSize:[26,26],
  iconAnchor:[13,13],
});

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("map");
  const [selected, setSelected] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const [profile, setProfile] = useState({
    name:"", handle:"", phone:"", age:"", gender:"", ethnicity:"",
    city:"", joined:"", genres:[], vibes:[], nights:0, visited:0, friendCount:0,
  });

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user logs in
  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data?.display_name) {
          setProfile({
            name: data.display_name || "",
            handle: data.handle || "",
            phone: data.phone || user.phone || "",
            age: data.age || "",
            gender: data.gender || "",
            ethnicity: data.ethnicity || "",
            city: data.city || "",
            joined: new Date(data.created_at).toLocaleDateString("en-GB",{month:"short",year:"numeric"}),
            genres: data.genres || [],
            vibes: data.vibes || [],
            nights: data.nights_out || 0,
            visited: data.clubs_visited || 0,
            friendCount: 0,
          });
          setOnboarded(true);
        }
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
  }, [user]);

  // Load clubs from Supabase + realtime subscription
  useEffect(() => {
    supabase.from("clubs")
      .select("*, club_stats(voter_count, avg_likelihood, heat_score)")
      .then(({ data }) => {
        if (data?.length) {
          setClubs(data.map(c => ({
            ...c,
            short: c.short_code,
            cap: c.capacity,
            desc: c.description,
            voters: c.club_stats?.voter_count ?? Math.floor(Math.random()*400+80),
            likelihood: Math.round(c.club_stats?.avg_likelihood ?? 55),
            heat: c.club_stats?.heat_score ?? Math.floor(Math.random()*35+40),
          })));
        }
      });
    const ch = supabase.channel("club-stats-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"club_stats"}, p => {
        setClubs(prev => prev.map(c =>
          c.id === p.new.club_id
            ? {...c, voters:p.new.voter_count, likelihood:Math.round(p.new.avg_likelihood), heat:p.new.heat_score}
            : c
        ));
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // Load tonight's picks
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase.from("picks").select("*").eq("user_id",user.id).eq("night_date",today).order("rank")
      .then(({ data }) => {
        if (data) setRankings(data.map(p => ({clubId:p.club_id, rank:p.rank, likelihood:p.likelihood})));
      });
  }, [user]);

  // Load real friends
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase.from("friendships")
      .select(`
        user_a, user_b,
        profile_a:profiles!friendships_user_a_fkey(id, display_name, handle),
        profile_b:profiles!friendships_user_b_fkey(id, display_name, handle)
      `)
      .eq("status","accepted")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .then(async ({ data }) => {
        if (!data?.length) { setFriends([]); return; }
        const friendProfiles = data.map(f => {
          const isA = f.user_a === user.id;
          return isA ? f.profile_b : f.profile_a;
        }).filter(Boolean);
        // Load tonight's #1 pick for each friend
        const ids = friendProfiles.map(p => p.id);
        const { data: picks } = await supabase.from("picks")
          .select("user_id, club_id, likelihood")
          .in("user_id", ids)
          .eq("night_date", today)
          .eq("rank", 1);
        setFriends(friendProfiles.map(p => ({
          id: p.id,
          name: p.display_name || "User",
          handle: p.handle || "",
          goingTo: picks?.find(pk => pk.user_id === p.id)?.club_id ?? null,
          likelihood: picks?.find(pk => pk.user_id === p.id)?.likelihood ?? null,
          online: false,
        })));
      });
  }, [user]);

  // Load notifications + realtime
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id",user.id)
      .order("created_at",{ascending:false}).limit(20)
      .then(({ data }) => {
        if (data?.length) setNotifications(data.map(n => ({id:n.id,text:n.body,time:timeAgo(n.created_at),icon:"🔔",read:n.is_read})));
      });
    const ch = supabase.channel(`notifs-${user.id}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},
        p => setNotifications(prev => [{id:p.new.id,text:p.new.body,time:"now",icon:"🔔",read:false},...prev])
      ).subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);

  const myRank = useCallback(id => rankings.find(r => r.clubId === id), [rankings]);

  const toggleRank = useCallback(async id => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const existing = rankings.find(r => r.clubId === id);
    if (existing) {
      await supabase.from("picks").delete().match({user_id:user.id, club_id:id, night_date:today});
      const updated = rankings.filter(r => r.clubId !== id).map((r,i) => ({...r,rank:i+1}));
      setRankings(updated);
      for (const r of updated) {
        await supabase.from("picks").upsert({user_id:user.id,club_id:r.clubId,rank:r.rank,likelihood:r.likelihood,night_date:today},{onConflict:"user_id,club_id,night_date"});
      }
    } else {
      if (rankings.length >= 3) return;
      const newRank = rankings.length + 1;
      await supabase.from("picks").upsert({user_id:user.id,club_id:id,rank:newRank,likelihood:65,night_date:today},{onConflict:"user_id,club_id,night_date"});
      setRankings(prev => [...prev, {clubId:id, rank:newRank, likelihood:65}]);
    }
  }, [user, rankings]);

  const updateLikelihood = useCallback(async (id, val) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const r = rankings.find(r => r.clubId === id);
    if (r) await supabase.from("picks").upsert({user_id:user.id,club_id:id,rank:r.rank,likelihood:val,night_date:today},{onConflict:"user_id,club_id,night_date"});
    setRankings(prev => prev.map(r => r.clubId===id ? {...r,likelihood:val} : r));
  }, [user, rankings]);

  const handleSelect = useCallback(c => { setSelected(c); setSheetOpen(true); }, []);

  const saveProfile = useCallback(async (updated) => {
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: updated.name,
      handle: updated.handle,
      age: parseInt(updated.age) || null,
      gender: updated.gender,
      ethnicity: updated.ethnicity,
      city: updated.city,
      updated_at: new Date().toISOString(),
    });
    setProfile(updated);
  }, [user]);

  if (authLoading || (user && profileLoading)) return (
    <div style={{height:"100dvh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:48,letterSpacing:5,background:"linear-gradient(135deg,#9B30FF,#FF2D78)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>DRIFT</div>
      <div style={{width:32,height:32,border:"3px solid rgba(155,48,255,0.2)",borderTopColor:"#9B30FF",borderRadius:"50%",animation:"vs-spin 0.8s linear infinite"}} />
    </div>
  );
  if (!user) return <AuthScreen onAuth={u => setUser(u)} />;
  if (!onboarded) return <OnboardingScreen profile={profile} setProfile={setProfile} userId={user.id} onDone={() => setOnboarded(true)} />;

  const totalVoters = clubs.reduce((s,c) => s+c.voters, 0);

  return (
    <div style={{position:"relative",width:"100%",height:"100dvh",maxWidth:430,margin:"0 auto",background:"var(--bg)",overflow:"hidden",fontFamily:"'DM Sans',sans-serif",color:"var(--txt)"}}>

      {/* Notifications panel */}
      {notifOpen && (
        <div style={{position:"absolute",inset:0,zIndex:200,animation:"vs-fadeIn 0.2s"}}>
          <div onClick={() => setNotifOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)"}} />
          <div style={{position:"absolute",top:0,left:0,right:0,background:"var(--s1)",borderRadius:"0 0 22px 22px",border:"1px solid var(--bdr)",padding:"56px 20px 24px",zIndex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,letterSpacing:1}}>Notifications</span>
              <button onClick={() => setNotifOpen(false)} style={{background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} color="var(--mut)"/></button>
            </div>
            {notifications.map(n => (
              <div key={n.id} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:18,flexShrink:0,marginTop:1}}>{n.icon}</div>
                <div>
                  <div style={{fontSize:13,lineHeight:1.45}}>{n.text}</div>
                  <div style={{fontSize:11,color:"var(--mut)",marginTop:3}}>{n.time} ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screens — keep MapTab always mounted to avoid Leaflet re-init */}
      <div style={{position:"absolute",inset:0,bottom:70,visibility:tab==="map"?"visible":"hidden",pointerEvents:tab==="map"?"auto":"none"}}>
        <MapTab clubs={clubs} rankings={rankings} friends={friends} onSelect={handleSelect}
          onNotif={() => setNotifOpen(true)} notifCount={notifications.filter(n=>!n.read).length} totalVoters={totalVoters} />
      </div>
      {tab==="picks" && <div style={{position:"absolute",inset:0,bottom:70,overflowY:"auto"}}><PicksTab clubs={clubs} rankings={rankings} onToggle={toggleRank} onLikelihood={updateLikelihood} /></div>}
      {tab==="friends" && <div style={{position:"absolute",inset:0,bottom:70,overflowY:"auto"}}><FriendsTab friends={friends} clubs={clubs} /></div>}
      {tab==="profile" && <div style={{position:"absolute",inset:0,bottom:70,overflowY:"auto"}}><ProfileTab profile={profile} setProfile={saveProfile} /></div>}

      {sheetOpen && selected && (
        <ClubSheet
          club={selected} myRank={myRank(selected.id)} rankCount={rankings.length}
          onToggle={() => toggleRank(selected.id)}
          onLikelihood={v => updateLikelihood(selected.id, v)}
          onClose={() => setSheetOpen(false)}
        />
      )}

      <BottomNav tab={tab} setTab={setTab} rankCount={rankings.length} />
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
const COUNTRIES = [
  {code:"GB",dial:"+44",flag:"🇬🇧",name:"UK"},
  {code:"US",dial:"+1",flag:"🇺🇸",name:"US"},
  {code:"NG",dial:"+234",flag:"🇳🇬",name:"Nigeria"},
  {code:"GH",dial:"+233",flag:"🇬🇭",name:"Ghana"},
  {code:"ZA",dial:"+27",flag:"🇿🇦",name:"South Africa"},
  {code:"KE",dial:"+254",flag:"🇰🇪",name:"Kenya"},
  {code:"DE",dial:"+49",flag:"🇩🇪",name:"Germany"},
  {code:"FR",dial:"+33",flag:"🇫🇷",name:"France"},
  {code:"ES",dial:"+34",flag:"🇪🇸",name:"Spain"},
  {code:"IT",dial:"+39",flag:"🇮🇹",name:"Italy"},
  {code:"NL",dial:"+31",flag:"🇳🇱",name:"Netherlands"},
  {code:"IE",dial:"+353",flag:"🇮🇪",name:"Ireland"},
  {code:"AU",dial:"+61",flag:"🇦🇺",name:"Australia"},
  {code:"CA",dial:"+1",flag:"🇨🇦",name:"Canada"},
  {code:"JP",dial:"+81",flag:"🇯🇵",name:"Japan"},
  {code:"BR",dial:"+55",flag:"🇧🇷",name:"Brazil"},
  {code:"IN",dial:"+91",flag:"🇮🇳",name:"India"},
  {code:"AE",dial:"+971",flag:"🇦🇪",name:"UAE"},
];

function AuthScreen({ onAuth }) {
  const [step, setStep] = useState("phone");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    if (phone.length < 6) return;
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithOtp({ phone: `${country.dial}${phone}` });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setStep("otp");
  };

  const verifyCode = async () => {
    if (otp.length < 4) return;
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.verifyOtp({ phone: `${country.dial}${phone}`, token: otp, type: "sms" });
    if (e) { setError(e.message); setLoading(false); return; }
    onAuth(data.user);
  };

  return (
    <div style={{height:"100dvh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 32px"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:54,letterSpacing:5,background:"linear-gradient(135deg,#9B30FF,#FF2D78)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>DRIFT</div>
        <div style={{fontSize:12,color:"var(--mut)",marginTop:4,letterSpacing:2,textTransform:"uppercase"}}>Drift Through The Night</div>
      </div>
      <div style={{width:"100%",maxWidth:320}}>
        {step==="phone" ? (
          <>
            <div style={{fontSize:22,fontWeight:700,marginBottom:5}}>Enter your number</div>
            <div style={{fontSize:13,color:"var(--mut)",marginBottom:22}}>We'll send a code to verify it's you</div>
            <div style={{position:"relative",marginBottom:10}}>
              <button onClick={()=>setShowCountries(!showCountries)} style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bdr)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <span style={{fontSize:20}}>{country.flag}</span>
                <span style={{fontSize:14,color:"var(--txt)",flex:1,textAlign:"left"}}>{country.name}</span>
                <span style={{fontSize:14,color:"var(--mut)"}}>{country.dial}</span>
                <span style={{fontSize:10,color:"var(--mut)"}}>▼</span>
              </button>
              {showCountries && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--s1)",border:"1px solid var(--bdr)",borderRadius:14,zIndex:100,maxHeight:220,overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
                  {COUNTRIES.map(c=>(
                    <button key={c.code+c.dial} onClick={()=>{setCountry(c);setShowCountries(false);}} style={{width:"100%",border:"none",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"11px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:country.code===c.code?"rgba(155,48,255,0.15)":"transparent"}}>
                      <span style={{fontSize:18}}>{c.flag}</span>
                      <span style={{fontSize:13,color:"var(--txt)",flex:1,textAlign:"left"}}>{c.name}</span>
                      <span style={{fontSize:13,color:"var(--mut)"}}>{c.dial}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{background:"var(--s1)",border:"1px solid var(--bdr)",borderRadius:14,overflow:"hidden",marginBottom:14,display:"flex",alignItems:"center"}}>
              <span style={{padding:"14px 12px 14px 16px",fontSize:14,color:"var(--mut)",flexShrink:0}}>{country.dial}</span>
              <input type="tel" placeholder="7700 900 123" value={phone}
                onChange={e=>setPhone(e.target.value.replace(/\D/g,""))}
                style={{flex:1,background:"none",border:"none",outline:"none",padding:"14px 16px 14px 0",fontSize:16,color:"var(--txt)"}} />
            </div>
            <button onClick={sendCode} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:phone.length>=6?"linear-gradient(135deg,#9B30FF,#FF2D78)":"rgba(255,255,255,0.05)",color:phone.length>=6?"white":"var(--mut)",fontSize:15,fontWeight:700,cursor:phone.length>=6?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{loading?<Spinner/>:<><Phone size={16}/>Send Code</>}</button>
            {error&&<div style={{marginTop:10,fontSize:12,color:"#FF2D78",textAlign:"center"}}>{error}</div>}
          </>
        ) : (
          <>
            <div style={{fontSize:22,fontWeight:700,marginBottom:5}}>Enter the code</div>
            <div style={{fontSize:13,color:"var(--mut)",marginBottom:22}}>Sent to {country.dial} {phone}</div>
            <div style={{display:"flex",gap:8,marginBottom:16,justifyContent:"center"}}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{width:42,height:50,background:"var(--s1)",border:`1px solid ${otp[i]?"var(--p)":"var(--bdr)"}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700}}>{otp[i]||""}</div>
              ))}
            </div>
            <input type="number" placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.slice(0,6))}
              style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bdr)",borderRadius:14,padding:"14px 16px",fontSize:16,color:"var(--txt)",outline:"none",marginBottom:14,textAlign:"center",letterSpacing:10}} />
            <button onClick={verifyCode} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:otp.length>=4?"linear-gradient(135deg,#9B30FF,#FF2D78)":"rgba(255,255,255,0.05)",color:otp.length>=4?"white":"var(--mut)",fontSize:15,fontWeight:700,cursor:otp.length>=4?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{loading?<Spinner/>:<><Check size={16}/>Verify</>}</button>
            {error&&<div style={{marginTop:10,fontSize:12,color:"#FF2D78",textAlign:"center"}}>{error}</div>}
            <div style={{textAlign:"center",marginTop:14}}>
              <button onClick={()=>setStep("phone")} style={{background:"none",border:"none",color:"var(--mut)",fontSize:13,cursor:"pointer"}}>← Change number</button>
            </div>
          </>
        )}
      </div>
      <div style={{position:"absolute",bottom:28,fontSize:11,color:"rgba(90,90,136,0.5)",textAlign:"center",padding:"0 40px"}}>
        By continuing you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({...profile});
  const [saving, setSaving] = useState(false);

  const steps = [
    {title:"What's your name?",sub:"How should we call you?",field:"name",type:"text",placeholder:"Your first name"},
    {title:"How old are you?",sub:"You must be 18+ to use Drift",field:"age",type:"number",placeholder:"e.g. 24"},
    {title:"Your gender",sub:"Helps personalise your experience",field:"gender",type:"select",
      opts:["Male","Female","Non-binary","Transgender","Genderqueer","Agender","Other","Prefer not to say"]},
    {title:"Your ethnicity",sub:"Used for anonymous crowd analytics only — never linked to your identity",field:"ethnicity",type:"select",
      opts:["White British","White Irish","White Other","Black British","Black Caribbean","Black African","Black Other","Asian British","Asian Indian","Asian Pakistani","Asian Bangladeshi","Asian Chinese","Asian Other","Mixed White & Black Caribbean","Mixed White & Black African","Mixed White & Asian","Mixed Other","Arab","Any other","Prefer not to say"]},
    {title:"Your city",sub:"Where do you go out most?",field:"city",type:"text",placeholder:"e.g. London, Manchester…"},
  ];

  const s = steps[step];
  const go = async () => {
    if (step < steps.length-1) { setStep(n => n+1); return; }
    setSaving(true);
    const handle = `@${draft.name.toLowerCase().replace(/\s+/g,"")}`;
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: draft.name,
      handle,
      age: parseInt(draft.age) || null,
      gender: draft.gender,
      ethnicity: draft.ethnicity,
      city: draft.city,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (!error) { setProfile({...draft, handle}); onDone(); }
  };

  return (
    <div style={{height:"100dvh",background:"var(--bg)",display:"flex",flexDirection:"column",padding:"56px 28px 36px"}}>
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:38,letterSpacing:4,background:"linear-gradient(135deg,#9B30FF,#FF2D78)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:36}}>DRIFT</div>
      <div style={{display:"flex",gap:6,marginBottom:36}}>
        {steps.map((_,i)=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?"linear-gradient(90deg,#9B30FF,#FF2D78)":"rgba(255,255,255,0.08)",transition:"all 0.3s"}} />
        ))}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:27,fontWeight:800,marginBottom:6}}>{s.title}</div>
        <div style={{fontSize:13,color:"var(--mut)",marginBottom:26,lineHeight:1.5}}>{s.sub}</div>
        {s.type==="select" ? (
          <select value={draft[s.field]} onChange={e=>setDraft({...draft,[s.field]:e.target.value})}
            style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bdr)",borderRadius:14,padding:"15px 16px",fontSize:15,color:"var(--txt)",outline:"none"}}>
            {s.opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ):(
          <input type={s.type} placeholder={s.placeholder} value={draft[s.field]}
            onChange={e=>setDraft({...draft,[s.field]:s.type==="number"?parseInt(e.target.value)||"":e.target.value})}
            style={{width:"100%",background:"var(--s1)",border:"1px solid var(--bdr)",borderRadius:14,padding:"15px 16px",fontSize:16,color:"var(--txt)",outline:"none"}} />
        )}
        {s.field==="ethnicity" && (
          <div style={{marginTop:14,background:"rgba(155,48,255,0.07)",borderRadius:12,padding:12,border:"1px solid rgba(155,48,255,0.18)"}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <Shield size={13} color="var(--p)" style={{flexShrink:0,marginTop:1}}/>
              <p style={{fontSize:11,color:"var(--mut)",lineHeight:1.6}}>Ethnic data is aggregated and anonymised. It is never linked to your account and never shared with or sold to third parties.</p>
            </div>
          </div>
        )}
      </div>
      <button onClick={go} disabled={saving} style={{
        width:"100%",padding:16,borderRadius:14,border:"none",
        background:"linear-gradient(135deg,#9B30FF,#FF2D78)",
        color:"white",fontSize:15,fontWeight:700,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:10,
      }}>{saving?<Spinner/>:step<steps.length-1?"Continue →":"Let's go! 🎉"}</button>
    </div>
  );
}

// ─── MAP TAB ──────────────────────────────────────────────────────────────────
function MapTab({ clubs, rankings, friends, onSelect, onNotif, notifCount, totalVoters }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const heatRef = useRef(null);
  const markersRef = useRef({});
  const fMarkersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const myRank = useCallback(id => rankings.find(r => r.clubId === id), [rankings]);

  // Filter clubs by search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    setSearchResults(clubs.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.area?.toLowerCase().includes(q) ||
      c.genre?.toLowerCase().includes(q)
    ).slice(0, 6));
  }, [search, clubs]);

  // Load Leaflet + init map (once)
  useEffect(() => {
    let active = true;
    loadLeaflet().then(L => {
      if (!active || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {center:[51.4816,-3.1791],zoom:14,zoomControl:false,attributionControl:false});
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{subdomains:"abcd",maxZoom:20}).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    });
    return () => {
      active = false;
      // Don't remove map — component stays mounted (visibility:hidden)
    };
  }, []);

  // Heatmap — update in place
  useEffect(() => {
    if (!mapReady) return;
    const L = window.L;
    const data = clubs.map(c => [c.lat, c.lng, c.heat/100 * 1.8]);
    if (heatRef.current) {
      heatRef.current.setLatLngs?.(data);
    } else if (L.heatLayer) {
      heatRef.current = L.heatLayer(data,{radius:38,blur:28,maxZoom:17,gradient:{0.3:"#9B30FF",0.55:"#FF7700",0.75:"#FF3B3B",1:"#FF0000"}}).addTo(mapRef.current);
    }
  }, [clubs, mapReady]);

  // Club markers — update icons in place, add new
  useEffect(() => {
    if (!mapReady) return;
    const L = window.L;
    clubs.forEach(c => {
      const ranked = myRank(c.id);
      const icon = mkClubIcon(L, c, ranked);
      if (markersRef.current[c.id]) {
        markersRef.current[c.id].setIcon(icon);
      } else {
        const m = L.marker([c.lat,c.lng],{icon}).addTo(mapRef.current).on("click",()=>onSelect(c));
        markersRef.current[c.id] = m;
      }
    });
  }, [clubs, rankings, mapReady, myRank, onSelect]);

  // Friend bubbles
  useEffect(() => {
    if (!mapReady) return;
    const L = window.L;
    Object.values(fMarkersRef.current).forEach(m => mapRef.current.removeLayer(m));
    fMarkersRef.current = {};
    friends.filter(f=>f.goingTo).forEach(f => {
      const club = clubs.find(c=>c.id===f.goingTo);
      if (!club) return;
      const off = 0.0008 * ((f.id%5)-2);
      const m = L.marker([club.lat+off,club.lng+off*1.5],{icon:mkFriendIcon(L,f)}).addTo(mapRef.current);
      fMarkersRef.current[f.id] = m;
    });
  }, [friends, clubs, mapReady]);

  const filters = ["all","🔥 hot","techno","house","lgbtq+","worldwide"];
  const hotClubs = [...clubs].sort((a,b)=>b.heat-a.heat).slice(0,6);

  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      {!mapReady && (
        <div style={{position:"absolute",inset:0,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>
          <div style={{textAlign:"center"}}>
            <div style={{width:40,height:40,border:"3px solid rgba(155,48,255,0.25)",borderTopColor:"#9B30FF",borderRadius:"50%",animation:"vs-spin 0.8s linear infinite",margin:"0 auto 14px"}} />
            <div style={{fontSize:13,color:"var(--mut)"}}>Loading map…</div>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{position:"absolute",inset:0,zIndex:1}} />

      {/* Search + Bell */}
      <div style={{position:"absolute",top:16,left:16,right:16,zIndex:30}}>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1,background:"rgba(14,14,30,0.92)",backdropFilter:"blur(20px)",border:"1px solid var(--bdr)",borderRadius:14,padding:"11px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 24px rgba(0,0,0,0.7)"}}>
            <Search size={15} color="var(--mut)"/>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search clubs…"
              style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"var(--txt)",caretColor:"var(--p)"}}
            />
            {search && <button onClick={() => { setSearch(""); setSearchOpen(false); }} style={{background:"none",border:"none",cursor:"pointer",color:"var(--mut)",padding:0,display:"flex"}}><X size={14}/></button>}
          </div>
          <button onClick={onNotif} style={{width:46,height:46,flexShrink:0,borderRadius:14,background:"rgba(14,14,30,0.92)",border:"1px solid var(--bdr)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
            <Bell size={18} color="var(--txt)"/>
            {notifCount>0&&<div style={{position:"absolute",top:9,right:10,width:7,height:7,borderRadius:"50%",background:"#FF2D78"}}/>}
          </button>
        </div>
        {/* Search results dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div style={{marginTop:8,background:"rgba(14,14,30,0.97)",backdropFilter:"blur(20px)",border:"1px solid var(--bdr)",borderRadius:14,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.7)"}}>
            {searchResults.map(c => (
              <button key={c.id} onClick={() => { onSelect(c); setSearch(""); setSearchOpen(false); if(mapRef.current) mapRef.current.flyTo([c.lat,c.lng],16,{duration:1}); }}
                style={{width:"100%",background:"none",border:"none",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:heatCol(c.heat),boxShadow:`0 0 6px ${heatCol(c.heat)}`,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--txt)"}}>{c.name}</div>
                  <div style={{fontSize:11,color:"var(--mut)"}}>{c.area} · {c.genre}</div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:heatCol(c.heat)}}>{c.heat}<span style={{fontSize:9,color:"var(--mut)"}}> heat</span></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{position:"absolute",top:76,left:0,right:0,zIndex:20,padding:"0 16px",display:"flex",gap:8,overflowX:"auto"}}>
        {filters.map(f=><Pill key={f} active={filter===f} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</Pill>)}
      </div>

      {/* Hot strip */}
      <div style={{position:"absolute",bottom:10,left:16,right:16,zIndex:20}}>
        <div style={{background:"rgba(14,14,30,0.93)",backdropFilter:"blur(20px)",border:"1px solid rgba(155,48,255,0.2)",borderRadius:16,padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
            <Flame size={13} color="#FF7700"/>
            <span style={{fontSize:10,fontWeight:800,letterSpacing:1,color:"var(--mut)",textTransform:"uppercase"}}>Hot Tonight</span>
            <span style={{marginLeft:"auto",fontSize:10,color:"var(--mut)"}}>{totalVoters.toLocaleString()} voting</span>
          </div>
          <div style={{display:"flex",gap:10,overflowX:"auto"}}>
            {hotClubs.map(c=>(
              <button key={c.id} onClick={()=>onSelect(c)} style={{
                background:"var(--s2)",border:`1px solid ${heatCol(c.heat)}33`,borderRadius:12,
                padding:"8px 12px",display:"flex",flexDirection:"column",gap:4,
                cursor:"pointer",minWidth:112,textAlign:"left",flexShrink:0,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:heatCol(c.heat),boxShadow:`0 0 6px ${heatCol(c.heat)}`}}/>
                  <span style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                </div>
                <span style={{fontSize:9,color:"var(--mut)"}}>{c.city} · {c.voters.toLocaleString()}</span>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{flex:1,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2}}>
                    <div style={{width:`${c.likelihood}%`,height:"100%",background:likeCol(c.likelihood),borderRadius:2,transition:"width 1s"}}/>
                  </div>
                  <span style={{fontSize:9,color:likeCol(c.likelihood),fontWeight:800}}>{c.likelihood}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLUB SHEET ───────────────────────────────────────────────────────────────
function ClubSheet({ club, myRank, rankCount, onToggle, onLikelihood, onClose }) {
  const isRanked = !!myRank;
  const canAdd = !isRanked && rankCount < 3;
  return (
    <div style={{position:"absolute",inset:0,zIndex:100,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",animation:"vs-fadeIn 0.2s"}}/>
      <div style={{position:"relative",background:"var(--s1)",borderRadius:"22px 22px 0 0",border:"1px solid var(--bdr)",padding:"0 20px 48px",animation:"vs-slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",maxHeight:"82vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:"rgba(255,255,255,0.13)"}}/></div>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,paddingTop:16}}>
          <div style={{width:54,height:54,borderRadius:14,flexShrink:0,background:`linear-gradient(135deg,${heatCol(club.heat)}55,${heatCol(club.heat)}18)`,border:`1px solid ${heatCol(club.heat)}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:900,fontFamily:"'Bebas Neue',cursive",color:"white"}}>{club.short}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:23,letterSpacing:1}}>{club.name}</div>
            <div style={{fontSize:12,color:"var(--mut)",display:"flex",alignItems:"center",gap:4,marginTop:2}}><MapPin size={10}/>{club.area} · {club.city}, {club.country}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><X size={15} color="var(--mut)"/></button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          <span style={{background:`${heatCol(club.heat)}22`,border:`1px solid ${heatCol(club.heat)}44`,color:heatCol(club.heat),fontSize:10,fontWeight:900,padding:"4px 10px",borderRadius:99}}>{heatLabel(club.heat)}</span>
          <span style={{fontSize:11,color:"var(--mut)"}}>{club.genre}</span>
          <span style={{fontSize:11,color:"var(--mut)"}}>Cap. {club.cap.toLocaleString()}</span>
        </div>
        <p style={{marginTop:12,fontSize:13,color:"var(--mut)",lineHeight:1.55}}>{club.desc}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:16}}>
          {[{l:"Voting",v:club.voters.toLocaleString(),c:heatCol(club.heat)},{l:"Going %",v:`${club.likelihood}%`,c:likeCol(club.likelihood)},{l:"Heat",v:`${club.heat}/100`,c:"#FF7700"}].map(s=>(
            <div key={s.l} style={{background:"var(--s2)",borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:s.c,fontFamily:"'Bebas Neue',cursive"}}>{s.v}</div>
              <div style={{fontSize:9,color:"var(--mut)",textTransform:"uppercase",letterSpacing:0.4,marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:10,color:"var(--mut)",textTransform:"uppercase",letterSpacing:0.5}}>Tonight's going probability</span>
            <span style={{fontSize:10,fontWeight:800,color:likeCol(club.likelihood)}}>{club.likelihood}%</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
            <div style={{width:`${club.likelihood}%`,height:"100%",background:likeCol(club.likelihood),borderRadius:3,transition:"width 0.8s"}}/>
          </div>
        </div>
        {isRanked && (
          <div style={{marginTop:16,background:"var(--s2)",borderRadius:14,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600}}>My likelihood of going</span>
              <span style={{fontSize:13,fontWeight:900,color:likeCol(myRank.likelihood)}}>{myRank.likelihood}%</span>
            </div>
            <input type="range" min="0" max="100" step="1" value={myRank.likelihood} onChange={e=>onLikelihood(parseInt(e.target.value))}/>
          </div>
        )}
        <button onClick={onToggle} disabled={!isRanked&&rankCount>=3} style={{
          width:"100%",marginTop:16,padding:15,borderRadius:14,border:"none",
          cursor:isRanked||canAdd?"pointer":"not-allowed",
          background:isRanked?"rgba(255,45,120,0.14)":canAdd?"linear-gradient(135deg,#9B30FF,#FF2D78)":"rgba(255,255,255,0.04)",
          color:isRanked?"#FF2D78":canAdd?"white":"var(--mut)",
          fontSize:14,fontWeight:700,outline:isRanked?"1px solid #FF2D7844":"none",
        }}>
          {isRanked?`Remove (Rank #${myRank.rank})`:canAdd?`Add as My #${rankCount+1} Pick`:"Top 3 Full — Edit in My Picks"}
        </button>
      </div>
    </div>
  );
}

// ─── PICKS TAB ────────────────────────────────────────────────────────────────
function PicksTab({ clubs, rankings, onToggle, onLikelihood }) {
  const ranked = [...rankings].sort((a,b)=>a.rank-b.rank).map(r=>({...clubs.find(c=>c.id===r.clubId),...r}));
  const unranked = clubs.filter(c=>!rankings.find(r=>r.clubId===c.id)).sort((a,b)=>b.heat-a.heat);
  return (
    <div style={{padding:"24px 20px 24px"}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:34,letterSpacing:2}}>My Picks Tonight</h1>
        <p style={{fontSize:13,color:"var(--mut)",marginTop:3}}>Rank your top 3 — votes update the live heatmap</p>
      </div>
      {[1,2,3].map(rank=>{
        const p = ranked.find(c=>c.rank===rank);
        return (
          <div key={rank} style={{marginBottom:12}}>
            <div style={{background:p?"var(--s1)":"transparent",border:`1px solid ${p?`${heatCol(p.heat)}33`:"rgba(255,255,255,0.06)"}`,borderRadius:16,padding:p?16:"14px 16px",minHeight:72,display:"flex",alignItems:p?"flex-start":"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,flexShrink:0,background:p?`${heatCol(p.heat)}1a`:"rgba(255,255,255,0.04)",border:`1px solid ${p?`${heatCol(p.heat)}44`:"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:p?heatCol(p.heat):"var(--mut)",fontFamily:"'Bebas Neue',cursive"}}>#{rank}</div>
              {p?(
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:16,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                      <div style={{fontSize:11,color:"var(--mut)"}}>{p.area} · {p.city}</div>
                    </div>
                    <button onClick={()=>onToggle(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--mut)",padding:4,flexShrink:0}}><X size={15}/></button>
                  </div>
                  <div style={{marginTop:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:11,color:"var(--mut)"}}>My likelihood</span>
                      <span style={{fontSize:11,fontWeight:800,color:likeCol(p.likelihood)}}>{p.likelihood}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={p.likelihood} onChange={e=>onLikelihood(p.id,parseInt(e.target.value))}/>
                  </div>
                </div>
              ):<span style={{fontSize:13,color:"var(--mut)"}}>Tap a club on the map or below to add</span>}
            </div>
          </div>
        );
      })}
      {rankings.length===3&&(
        <div style={{background:"linear-gradient(135deg,rgba(155,48,255,0.12),rgba(255,45,120,0.12))",border:"1px solid rgba(155,48,255,0.25)",borderRadius:14,padding:14,marginBottom:20,textAlign:"center"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Picks live on the heatmap! 🎉</div>
          <div style={{fontSize:11,color:"var(--mut)"}}>Contributing to tonight's crowd predictions</div>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"20px 0 16px"}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontSize:10,color:"var(--mut)",textTransform:"uppercase",letterSpacing:1}}>All Clubs</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>
      {unranked.map(c=>(
        <button key={c.id} onClick={()=>rankings.length<3&&onToggle(c.id)} style={{
          width:"100%",background:"var(--s1)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,
          padding:"12px 14px",display:"flex",alignItems:"center",gap:12,
          cursor:rankings.length<3?"pointer":"default",marginBottom:8,textAlign:"left",
          opacity:rankings.length>=3?0.4:1,transition:"opacity 0.2s",
        }}>
          <div style={{width:7,height:7,borderRadius:"50%",background:heatCol(c.heat),boxShadow:`0 0 6px ${heatCol(c.heat)}`,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
            <div style={{fontSize:11,color:"var(--mut)"}}>{c.city} · {c.voters.toLocaleString()} voting</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:800,color:likeCol(c.likelihood)}}>{c.likelihood}%</div>
            <div style={{fontSize:9,color:"var(--mut)"}}>going</div>
          </div>
          {rankings.length<3&&<div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#9B30FF,#FF2D78)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:20,color:"white",fontWeight:300}}>+</span></div>}
        </button>
      ))}
    </div>
  );
}

// ─── FRIENDS TAB ──────────────────────────────────────────────────────────────
function FriendsTab({ friends, clubs }) {
  const going = friends.filter(f=>f.goingTo);
  const unsure = friends.filter(f=>!f.goingTo);
  return (
    <div style={{padding:"24px 20px"}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:34,letterSpacing:2}}>Friends</h1>
        <p style={{fontSize:13,color:"var(--mut)",marginTop:3}}>{friends.length===0?"No friends yet":going.length+" going out · "+friends.length+" in your crew"}</p>
      </div>
      <div style={{background:"linear-gradient(135deg,rgba(155,48,255,0.1),rgba(255,45,120,0.1))",border:"1px solid rgba(155,48,255,0.22)",borderRadius:14,padding:14,marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
        <UserPlus size={20} color="var(--p)"/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700}}>Invite friends</div>
          <div style={{fontSize:11,color:"var(--mut)"}}>Share your invite link to grow your crew</div>
        </div>
        <button onClick={() => navigator.share?.({title:"Drift",text:"Join me on Drift 🎉",url:window.location.href})} style={{background:"linear-gradient(135deg,#9B30FF,#FF2D78)",border:"none",color:"white",fontSize:12,fontWeight:700,padding:"8px 14px",borderRadius:99,cursor:"pointer"}}>Share</button>
      </div>
      {friends.length === 0 && (
        <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mut)"}}>
          <div style={{fontSize:40,marginBottom:12}}>👥</div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>No friends yet</div>
          <div style={{fontSize:13}}>Share your invite link to add friends and see where they're heading tonight</div>
        </div>
      )}
      {going.length > 0 && <>
        <div style={{fontSize:10,color:"var(--mut)",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Going out tonight</div>
        {going.map(f=>{
          const club=clubs.find(c=>c.id===f.goingTo);
          return (
            <div key={f.id} style={{background:"var(--s1)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:46,height:46,borderRadius:14,flexShrink:0,background:"linear-gradient(135deg,#9B30FF,#FF2D78)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white",position:"relative"}}>
                {(f.name||"?")[0].toUpperCase()}
                {f.online&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#00FF88",border:"2px solid var(--s1)"}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700}}>{f.name} <span style={{fontSize:11,color:"var(--mut)",fontWeight:400}}>{f.handle}</span></div>
                <div style={{fontSize:11,color:"var(--mut)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>→ {club?.name||"somewhere"}{f.likelihood?` · ${f.likelihood}% likely`:""}</div>
              </div>
              <button style={{width:34,height:34,borderRadius:10,background:"rgba(155,48,255,0.12)",border:"1px solid rgba(155,48,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><MessageCircle size={15} color="var(--p)"/></button>
            </div>
          );
        })}
      </>}
      {unsure.length > 0 && <>
        <div style={{fontSize:10,color:"var(--mut)",textTransform:"uppercase",letterSpacing:1,margin:"18px 0 12px"}}>Not sure yet</div>
        {unsure.map(f=>(
          <div key={f.id} style={{background:"var(--s1)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:12,opacity:0.65}}>
            <div style={{width:46,height:46,borderRadius:14,flexShrink:0,background:"var(--s2)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"var(--mut)"}}>{(f.name||"?")[0].toUpperCase()}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700}}>{f.name} <span style={{fontSize:11,color:"var(--mut)",fontWeight:400}}>{f.handle}</span></div>
              <div style={{fontSize:11,color:"var(--mut)"}}>No plans yet tonight</div>
            </div>
            <button style={{width:34,height:34,borderRadius:10,background:"rgba(155,48,255,0.12)",border:"1px solid rgba(155,48,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><MessageCircle size={15} color="var(--p)"/></button>
          </div>
        ))}
      </>}
    </div>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
function ProfileTab({ profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({...profile});
  const save = () => { setProfile({...draft}); setEditing(false); };

  const fields = [
    {k:"name",l:"Name",t:"text"},
    {k:"age",l:"Age",t:"number"},
    {k:"phone",l:"Phone",t:"text"},
    {k:"gender",l:"Gender",t:"select",o:["Male","Female","Non-binary","Transgender","Genderqueer","Agender","Other","Prefer not to say"]},
    {k:"ethnicity",l:"Ethnicity",t:"select",o:["White British","White Irish","White Other","Black British","Black Caribbean","Black African","Black Other","Asian British","Asian Indian","Asian Pakistani","Asian Bangladeshi","Asian Chinese","Asian Other","Mixed White & Black Caribbean","Mixed White & Black African","Mixed White & Asian","Mixed Other","Arab","Any other","Prefer not to say"]},
    {k:"city",l:"City",t:"text"},
  ];

  return (
    <div style={{padding:"0 0 24px"}}>
      <div style={{background:"linear-gradient(180deg,rgba(80,0,120,0.55) 0%,var(--bg) 100%)",padding:"44px 20px 24px",textAlign:"center",borderBottom:"1px solid var(--bdr)"}}>
        <div style={{width:82,height:82,borderRadius:26,margin:"0 auto 12px",background:"linear-gradient(135deg,#9B30FF,#FF2D78)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,fontWeight:900,color:"white",fontFamily:"'Bebas Neue',cursive",boxShadow:"0 0 40px rgba(155,48,255,0.4)"}}>{profile.name[0]}</div>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,letterSpacing:1}}>{profile.name}</div>
        <div style={{fontSize:13,color:"var(--mut)",marginTop:2}}>{profile.handle} · since {profile.joined}</div>
        <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:20}}>
          {[["Nights Out",profile.nights],["Clubs",profile.visited],["Friends",profile.friendCount]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:24}}>{v}</div>
              <div style={{fontSize:9,color:"var(--mut)",textTransform:"uppercase",letterSpacing:0.5,marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"20px 20px 0"}}>
        <div style={{background:"var(--s1)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:10,color:"var(--mut)",textTransform:"uppercase",letterSpacing:1}}>My Profile</span>
            <button onClick={editing?save:()=>setEditing(true)} style={{background:editing?"linear-gradient(135deg,#9B30FF,#FF2D78)":"rgba(155,48,255,0.15)",border:"none",color:editing?"white":"var(--p)",fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:99,cursor:"pointer"}}>{editing?"Save":"Edit"}</button>
          </div>
          {fields.map(f=>(
            <div key={f.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span style={{fontSize:13,color:"var(--mut)"}}>{f.l}</span>
              {editing?(
                f.t==="select"?(
                  <select value={draft[f.k]} onChange={e=>setDraft({...draft,[f.k]:e.target.value})}
                    style={{background:"var(--s2)",border:"1px solid var(--bdr)",color:"var(--txt)",fontSize:12,padding:"4px 8px",borderRadius:8,maxWidth:160}}>
                    {f.o.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                ):(
                  <input type={f.t} value={draft[f.k]} onChange={e=>setDraft({...draft,[f.k]:e.target.value})}
                    style={{background:"var(--s2)",border:"1px solid var(--bdr)",color:"var(--txt)",fontSize:12,padding:"4px 8px",borderRadius:8,width:130,textAlign:"right"}}/>
                )
              ):(
                <span style={{fontSize:13,fontWeight:600}}>{profile[f.k]}</span>
              )}
            </div>
          ))}
        </div>
        <div style={{background:"var(--s1)",borderRadius:16,padding:16,marginBottom:12,border:"1px solid var(--bdr)"}}>
          <div style={{fontSize:10,color:"var(--mut)",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>My Vibes</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {[...profile.genres,...profile.vibes].map(tag=>(
              <span key={tag} style={{background:"rgba(155,48,255,0.14)",border:"1px solid rgba(155,48,255,0.28)",color:"#C080FF",fontSize:12,fontWeight:600,padding:"5px 12px",borderRadius:99}}>{tag}</span>
            ))}
          </div>
        </div>
        <div style={{background:"rgba(155,48,255,0.06)",borderRadius:12,padding:14,border:"1px solid rgba(155,48,255,0.15)"}}>
          <div style={{display:"flex",gap:8,marginBottom:7}}><Shield size={13} color="var(--p)"/><span style={{fontSize:11,fontWeight:700,color:"var(--p)"}}>Data & Privacy</span></div>
          <p style={{fontSize:11,color:"var(--mut)",lineHeight:1.6}}>All demographic data is anonymised and aggregated before being used in crowd analytics. It is never linked to your personal identity and never sold to advertisers or third parties. You can delete your account and all data at any time.</p>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab, rankCount }) {
  const tabs=[
    {id:"map",icon:<Navigation size={20}/>,label:"Explore"},
    {id:"picks",icon:<Star size={20}/>,label:"My Picks",badge:rankCount},
    {id:"friends",icon:<Users size={20}/>,label:"Friends"},
    {id:"profile",icon:<User size={20}/>,label:"Profile"},
  ];
  return (
    <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(8,8,18,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(155,48,255,0.15)",display:"flex",justifyContent:"space-around",padding:"10px 0 22px",zIndex:50}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"4px 16px",color:tab===t.id?"#9B30FF":"var(--mut)",position:"relative",transition:"color 0.2s"}}>
          {t.badge>0&&<div style={{position:"absolute",top:0,right:8,width:17,height:17,borderRadius:"50%",background:"#FF2D78",fontSize:9,fontWeight:900,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>{t.badge}</div>}
          <div style={{filter:tab===t.id?"drop-shadow(0 0 8px #9B30FF)":"none",transition:"filter 0.2s"}}>{t.icon}</div>
          <span style={{fontSize:9,fontWeight:700,letterSpacing:0.4,textTransform:"uppercase"}}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
