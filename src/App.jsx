import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  collection,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Settings, 
  Play, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Pause,
  MonitorPlay,
  Library,
  Columns,
  Maximize,
  X,
  Camera,
  QrCode,
  MessageSquare,
  UploadCloud,
  Link2,
  Globe,
  Music,
  Moon,
  Volume2,
  Sparkles,
  Send,
  Maximize2,
  BarChart3,
  CloudRain,
  Heart,
  Flame,
  MonitorOff,
  Move,
  AlertTriangle,
  Database
} from 'lucide-react';

// --- Firebase 配置 ---
// The real Firebase config is loaded at runtime from firebase-config.json.
// Keep API keys out of the repository to avoid GitHub secret scanning alerts.
const DEFAULT_APP_ID = 'exhibition-system-0214';
const firebaseConfig = typeof window !== 'undefined' ? window.FIREBASE_CONFIG : null;
const hasFirebaseConfig = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId && firebaseConfig?.appId);
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const storage = app ? getStorage(app) : null;
const appId = firebaseConfig?.projectId || DEFAULT_APP_ID;

// --- 預設資料設定 ---
const CONTENT_TYPES = [
  { id: 'video', label: '影片', icon: Play },
  { id: 'image', label: '圖片', icon: ImageIcon },
  { id: 'text', label: '文字', icon: Type },
  { id: 'color', label: '純色', icon: Layout },
  { id: 'camera', label: '鏡頭', icon: Camera },
  { id: 'qrcode', label: 'QR', icon: QrCode },
  { id: 'iframe', label: 'Web/3D', icon: Globe },
];

const TRANSITIONS = [
  { id: 'fade', label: '淡入淡出', class: 'animate-in fade-in duration-1000' },
  { id: 'slide-up', label: '向上滑入', class: 'animate-in slide-in-from-bottom-full fade-in duration-1000' },
  { id: 'slide-left', label: '向左滑入', class: 'animate-in slide-in-from-right-full fade-in duration-1000' },
  { id: 'zoom', label: '放大縮放', class: 'animate-in zoom-in-50 fade-in duration-1000' },
];

const OVERLAY_EFFECTS = [
  { id: 'none', label: '關閉' },
  { id: 'snow', label: '飄雪' },
  { id: 'sakura', label: '櫻花' },
  { id: 'matrix', label: '代碼雨' },
  { id: 'gold', label: '金幣雨' },
];

const SCREEN_IDS = ['1', '2', '3'];
const HEARTBEAT_STALE_MS = 12000;
const HEARTBEAT_INTERVAL_MS = 5000;

const DEFAULT_SCENE = {
  id: 'default-1',
  name: '開場畫面',
  duration: 10,
  transition: 'fade',
  isSpanMode: false,
  spanType: 'video',
  spanContent: '',
  bezelGap: 0,
  spanAnimation: false,
  screens: {
    '1': { type: 'color', content: '#1e293b' },
    '2': { type: 'color', content: '#334155' },
    '3': { type: 'color', content: '#1e293b' }
  }
};

const DEFAULT_STATE = {
  timeline: [DEFAULT_SCENE],
  isPlaying: false,
  startTime: Date.now(),
  standbyMode: false,
  marquee: { active: false, text: '歡迎蒞臨！' },
  bgm: { active: false, url: '', volume: 50 },
  fxTrigger: { id: '', timestamp: 0 },
  overlayEffect: 'none',
  bulletChats: { active: false, messages: [] },
  stats: { chatCount: 0, likes: 0 }
};

const inferAssetType = (url = '') => {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogg)$/.test(cleanUrl)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(cleanUrl)) return 'image';
  return 'iframe';
};

const normalizeStaticAssets = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter(asset => asset?.url)
    .map((asset, index) => ({
      id: `static-${asset.id || index}`,
      name: asset.name || asset.url.split('/').pop() || `素材 ${index + 1}`,
      type: asset.type || inferAssetType(asset.url),
      url: asset.url,
      createdAt: 0,
      static: true,
    }));
};

const formatSeconds = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(remainder).padStart(2, '0')}` : `${remainder}s`;
};

const getContentTypeLabel = (type) => CONTENT_TYPES.find(item => item.id === type)?.label || type || '未設定';

const getPlaybackSnapshot = (globalState, now = Date.now()) => {
  const timeline = Array.isArray(globalState.timeline) && globalState.timeline.length > 0 ? globalState.timeline : [DEFAULT_SCENE];
  const totalDuration = timeline.reduce((acc, scene) => acc + (Number(scene?.duration) || 10), 0);
  const paused = !globalState.isPlaying || globalState.standbyMode || totalDuration <= 0;

  if (paused) {
    const scene = timeline[0] || DEFAULT_SCENE;
    return {
      scene,
      sceneIndex: 0,
      totalScenes: timeline.length,
      totalDuration,
      sceneElapsed: 0,
      sceneRemaining: Number(scene?.duration) || 10,
      cycleElapsed: 0,
      sceneProgress: 0,
      cycleProgress: 0,
    };
  }

  const elapsedSecs = Math.max(0, (now - (globalState.startTime || now)) / 1000);
  const cycleElapsed = elapsedSecs % totalDuration;
  let accumulated = 0;
  let sceneIndex = 0;
  let sceneStart = 0;

  for (let i = 0; i < timeline.length; i++) {
    const duration = Number(timeline[i]?.duration) || 10;
    if (cycleElapsed < accumulated + duration) {
      sceneIndex = i;
      sceneStart = accumulated;
      break;
    }
    accumulated += duration;
  }

  const scene = timeline[sceneIndex] || timeline[0] || DEFAULT_SCENE;
  const sceneDuration = Number(scene?.duration) || 10;
  const sceneElapsed = Math.max(0, cycleElapsed - sceneStart);

  return {
    scene,
    sceneIndex,
    totalScenes: timeline.length,
    totalDuration,
    sceneElapsed,
    sceneRemaining: Math.max(0, sceneDuration - sceneElapsed),
    cycleElapsed,
    sceneProgress: Math.min(100, (sceneElapsed / sceneDuration) * 100),
    cycleProgress: Math.min(100, (cycleElapsed / totalDuration) * 100),
  };
};

const getLocalStatusKey = (projectId, screenId) => `projection-display-status-${projectId}-${screenId}`;

export default function App() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('select'); 
  const [screenId, setScreenId] = useState(null);
  const [globalState, setGlobalState] = useState(DEFAULT_STATE);
  const [staticAssets, setStaticAssets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [displayStatuses, setDisplayStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDbMissing, setIsDbMissing] = useState(false);
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    const manifestUrl = new URL('assets/library.json', window.location.href);
    fetch(manifestUrl, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : [])
      .then(data => setStaticAssets(normalizeStaticAssets(Array.isArray(data) ? data : data.assets)))
      .catch(error => console.warn("Static assets manifest not loaded:", error));
  }, []);

  const libraryAssets = useMemo(() => {
    const seen = new Set();
    return [...staticAssets, ...assets].filter(asset => {
      if (!asset?.url || seen.has(asset.url)) return false;
      seen.add(asset.url);
      return true;
    });
  }, [staticAssets, assets]);

  // 1. 初始化 Auth
  useEffect(() => {
    let cancelled = false;
    const enableLocalMode = (reason) => {
      if (cancelled) return;
      console.warn("Switching to local mode:", reason);
      setLocalMode(true);
      setUser({ uid: 'local-mode' });
      setErrorMsg(null);
      setLoading(false);
    };

    const authTimeout = setTimeout(() => {
      enableLocalMode("Firebase auth timed out");
    }, 8000);

    if (!auth) {
      clearTimeout(authTimeout);
      enableLocalMode("Firebase runtime config missing");
      return () => {
        cancelled = true;
        clearTimeout(authTimeout);
      };
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) { 
        console.error("Auth error:", error); 
        enableLocalMode(error.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser || cancelled) return;
      clearTimeout(authTimeout);
      setLocalMode(false);
      setUser(firebaseUser);
    });
    return () => {
      cancelled = true;
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  // 2. 監聽 Firestore 數據
  useEffect(() => {
    if (localMode) {
      setGlobalState(prev => ({
        ...DEFAULT_STATE,
        ...prev,
        timeline: Array.isArray(prev.timeline) && prev.timeline.length > 0 ? prev.timeline : [DEFAULT_SCENE],
      }));
      setLoading(false);
      return;
    }

    if (!user || !db) return;
    
    // 路徑: artifacts -> appId -> public -> data -> appConfig -> globalState
    const stateDoc = doc(db, 'artifacts', appId, 'public', 'data', 'appConfig', 'globalState');
    let dataSettled = false;
    const dataTimeout = setTimeout(() => {
      if (dataSettled) return;
      console.warn("Switching to local mode: Firestore timed out");
      setLocalMode(true);
      setLoading(false);
    }, 8000);
    
    const unsubState = onSnapshot(stateDoc, (docSnap) => {
      dataSettled = true;
      clearTimeout(dataTimeout);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalState({
          ...DEFAULT_STATE,
          ...data,
          timeline: Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : [DEFAULT_SCENE],
          bulletChats: data.bulletChats || { active: false, messages: [] },
          stats: data.stats || { chatCount: 0, likes: 0 }
        });
      } else {
        setDoc(stateDoc, DEFAULT_STATE).catch(e => console.error("Initial setDoc failed:", e));
        setGlobalState(DEFAULT_STATE);
      }
      setLoading(false);
      setIsDbMissing(false);
    }, (err) => {
      dataSettled = true;
      clearTimeout(dataTimeout);
      console.error("Firestore error:", err);
      if (err.message.includes("does not exist") || err.code === "not-found") {
        setIsDbMissing(true);
      } else if (err.code === 'permission-denied') {
        setErrorMsg("資料庫權限不足。請確認 Firestore 是否已設為「測試模式」。");
      } else {
        setErrorMsg(`連線錯誤: ${err.message}`);
      }
      setLoading(false);
    });

    const assetsCol = collection(db, 'artifacts', appId, 'public', 'data', 'assets');
    const unsubAssets = onSnapshot(assetsCol, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAssets(list);
    }, (err) => console.log("Assets listener error:", err));

    return () => { clearTimeout(dataTimeout); unsubState(); unsubAssets(); };
  }, [user, localMode]);

  useEffect(() => {
    if (!user) return;

    if (!localMode && db) {
      const statusCol = collection(db, 'artifacts', appId, 'public', 'data', 'displayStatus');
      return onSnapshot(statusCol, (snap) => {
        const nextStatuses = {};
        snap.forEach(d => {
          nextStatuses[d.id] = { id: d.id, ...d.data() };
        });
        setDisplayStatuses(nextStatuses);
      }, (err) => console.log("Display status listener error:", err));
    }

    const readLocalStatuses = () => {
      const nextStatuses = {};
      SCREEN_IDS.forEach(id => {
        const raw = localStorage.getItem(getLocalStatusKey(appId, id));
        if (!raw) return;
        try {
          nextStatuses[id] = JSON.parse(raw);
        } catch (error) {
          console.warn("Invalid local display status:", error);
        }
      });
      setDisplayStatuses(nextStatuses);
    };

    readLocalStatuses();
    const interval = setInterval(readLocalStatuses, 2000);
    window.addEventListener('storage', readLocalStatuses);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', readLocalStatuses);
    };
  }, [user, localMode]);

  const updateGlobalState = async (updates) => {
    if (!user) return;
    if (localMode) {
      setGlobalState(prev => ({ ...prev, ...updates }));
      return;
    }
    if (!db) {
      setGlobalState(prev => ({ ...prev, ...updates }));
      setLocalMode(true);
      return;
    }
    try {
      const stateDoc = doc(db, 'artifacts', appId, 'public', 'data', 'appConfig', 'globalState');
      await setDoc(stateDoc, updates, { merge: true });
    } catch (error) { console.error("Update error:", error); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-900 flex-col gap-4">
      <RefreshCw className="animate-spin text-blue-500 w-10 h-10" />
      <span className="text-slate-400 font-medium">正在連線至雲端大腦...</span>
    </div>
  );

  // 資料庫未建立的專屬錯誤畫面
  if (isDbMissing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-900 p-10 rounded-[2.5rem] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)] text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center mx-auto">
            <Database size={40} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold">尚未建立資料庫</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            系統偵測到您的 Firebase 專案中尚未建立 <span className="text-blue-400 font-bold">Firestore Database</span>。<br/><br/>
            請前往 Firebase 控制台，點擊左側的「Firestore Database」並點擊「建立資料庫」，選擇「以測試模式啟動」即可完成。
          </p>
          <div className="pt-4">
            <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-2xl font-medium transition-all">
              我已建立完成，重新整理
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
        <div className="bg-slate-900 p-8 rounded-3xl max-w-lg text-center border border-red-500/50 shadow-2xl">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">系統連線異常</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors">重試</button>
        </div>
      </div>
    );
  }

  // --- 選擇模式介面 ---
  if (viewMode === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-4xl w-full space-y-12">
          <header className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-2xl">展覽播控系統</h1>
            <p className="text-blue-500 font-medium tracking-[0.4em] text-sm uppercase">Ultimate Edition V9 (Pro Wall)</p>
          </header>
          
          <div className="grid md:grid-cols-3 gap-6">
            <button onClick={() => setViewMode('controller')} className="flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[2rem] border border-slate-800 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all group">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Settings size={32} /></div>
              <h2 className="text-xl font-semibold mb-2">導演中控台</h2>
              <p className="text-xs text-slate-400 text-center font-light">排程設定與全域特效控場</p>
            </button>

            <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mb-6"><MonitorPlay size={32} /></div>
              <h2 className="text-xl font-semibold mb-6">顯示端設定</h2>
              <div className="grid grid-cols-3 gap-2 w-full">
                {['1', '2', '3'].map(num => (
                  <button key={num} onClick={() => { setScreenId(num); setViewMode('display'); }} className="py-3 bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded-xl font-medium text-sm transition-all">
                    #{num}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setViewMode('chat-client')} className="flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[2rem] border border-slate-800 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all group">
              <div className="w-16 h-16 bg-pink-500/20 text-pink-400 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><MessageSquare size={32} /></div>
              <h2 className="text-xl font-semibold mb-2">觀眾互動端</h2>
              <p className="text-xs text-slate-400 text-center font-light">發送彈幕與累積熱度愛心</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 各模式組件渲染 ---
  if (viewMode === 'chat-client') return <ChatClientView globalState={globalState} updateGlobalState={updateGlobalState} onExit={() => setViewMode('select')} />;
  if (viewMode === 'controller') return <ControllerView globalState={globalState} updateGlobalState={updateGlobalState} assets={libraryAssets} setAssets={setAssets} db={db} storage={storage} appId={appId} localMode={localMode} displayStatuses={displayStatuses} onExit={() => setViewMode('select')} />;
  if (viewMode === 'display') return <DisplayScreen id={screenId} globalState={globalState} db={db} appId={appId} localMode={localMode} onExit={() => setViewMode('select')} />;
  
  return null;
}

// ==========================================
// 子組件：觀眾互動端
// ==========================================
function ChatClientView({ globalState, updateGlobalState, onExit }) {
  const [text, setText] = useState('');
  const [flyHearts, setFlyHearts] = useState([]);
  
  const sendChat = () => {
    if (!text.trim()) return;
    const currentChats = globalState.bulletChats.messages || [];
    const newChat = { id: Date.now(), text: text.trim(), color: ['#fff', '#60a5fa', '#34d399', '#f472b6', '#fbbf24'][Math.floor(Math.random()*5)] };
    updateGlobalState({ 
      bulletChats: { ...globalState.bulletChats, messages: [...currentChats.slice(-19), newChat] },
      stats: { ...globalState.stats, chatCount: (globalState.stats?.chatCount || 0) + 1 }
    });
    setText('');
  };

  const sendLike = () => {
    const id = Date.now() + Math.random();
    setFlyHearts(prev => [...prev, id]);
    setTimeout(() => setFlyHearts(prev => prev.filter(h => h !== id)), 1000);
    updateGlobalState({ stats: { ...globalState.stats, likes: (globalState.stats?.likes || 0) + 1 } });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
      <button onClick={onExit} className="absolute top-6 right-6 text-white/50 hover:text-white"><X/></button>
      {flyHearts.map(id => (
        <Heart key={id} className="absolute text-pink-500 fill-pink-500 animate-in slide-in-from-bottom-10 fade-in zoom-in duration-1000 z-0 pointer-events-none" style={{ left: `${Math.random()*80+10}%`, bottom: '20vh', width: '40px', height: '40px' }} />
      ))}
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-2xl space-y-8 z-10">
        <div className="text-center space-y-3">
          <MessageSquare className="w-16 h-16 text-pink-500 mx-auto" />
          <h1 className="text-2xl font-semibold text-white">展會互動專區</h1>
          <p className="text-slate-400 text-sm font-light">發送留言，或者點擊愛心為展位增加熱度！</p>
        </div>
        <div className="space-y-4">
          <input 
            type="text" value={text} onChange={e => setText(e.target.value)} placeholder="說點什麼吧..." maxLength={30}
            className="w-full bg-slate-900 border border-slate-700 text-white px-6 py-4 rounded-2xl outline-none focus:border-pink-500 transition-colors text-lg text-center"
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          />
          <div className="flex gap-4">
            <button onClick={sendChat} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"><Send size={20}/> 發送彈幕</button>
            <button onClick={sendLike} className="w-20 bg-rose-500 hover:bg-rose-600 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-90 shadow-[0_0_15px_rgba(244,63,94,0.4)]"><Heart size={24} className="fill-white" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 子組件：導演中控台
// ==========================================
function ControllerView({ globalState, updateGlobalState, assets, setAssets, db, storage, appId, localMode, displayStatuses, onExit }) {
  const { timeline, isPlaying, marquee, standbyMode, bgm, bulletChats, overlayEffect, stats } = globalState;
  const [selectedSceneId, setSelectedSceneId] = useState(timeline[0]?.id || null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [inputTarget, setInputTarget] = useState(null); 
  const [now, setNow] = useState(Date.now());

  const activeScene = timeline.find(s => s.id === selectedSceneId) || timeline[0] || DEFAULT_SCENE;
  const playback = useMemo(() => getPlaybackSnapshot(globalState, now), [globalState, now]);
  const connectedScreens = useMemo(() => SCREEN_IDS.map(id => {
    const status = displayStatuses?.[id] || {};
    const lastSeen = Number(status.lastSeen) || 0;
    const online = lastSeen > 0 && now - lastSeen < HEARTBEAT_STALE_MS;
    const ageSeconds = lastSeen > 0 ? Math.max(0, Math.round((now - lastSeen) / 1000)) : null;
    return { id, status, online, ageSeconds };
  }), [displayStatuses, now]);
  const onlineCount = connectedScreens.filter(screen => screen.online).length;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const togglePlay = () => updateGlobalState({ isPlaying: !isPlaying, startTime: Date.now() });
  const toggleStandby = () => updateGlobalState({ standbyMode: !standbyMode });
  const toggleBgm = () => updateGlobalState({ bgm: { ...bgm, active: !bgm.active } });
  const triggerFx = (id) => updateGlobalState({ fxTrigger: { id, timestamp: Date.now() } });
  const toggleChats = () => updateGlobalState({ bulletChats: { ...bulletChats, active: !bulletChats.active } });

  const updateScene = (sceneId, updates) => updateGlobalState({ timeline: timeline.map(s => s.id === sceneId ? { ...s, ...updates } : s) });
  const updateScreenContent = (sceneId, screenId, field, value) => {
    updateGlobalState({ timeline: timeline.map(s => {
      if (s.id !== sceneId) return s;
      return { ...s, screens: { ...s.screens, [screenId]: { ...s.screens[screenId], [field]: value } } };
    })});
  };

  const addScene = () => {
    const newScene = { ...DEFAULT_SCENE, id: Date.now().toString(), name: `新場景 ${timeline.length + 1}` };
    updateGlobalState({ timeline: [...timeline, newScene] });
    setSelectedSceneId(newScene.id);
  };
  const deleteScene = (id) => {
    if (timeline.length <= 1) return alert("至少需要一個場景");
    const newTl = timeline.filter(s => s.id !== id);
    updateGlobalState({ timeline: newTl });
    if (selectedSceneId === id) setSelectedSceneId(newTl[0]?.id);
  };

  const openLib = (target) => { setInputTarget(target); setLibraryOpen(true); };
  const handleLibSelect = (url) => {
    if (!inputTarget) return;
    if (inputTarget.isBgm) updateGlobalState({ bgm: { ...bgm, url } });
    else if (inputTarget.isSpan) updateScene(inputTarget.sceneId, { [inputTarget.field]: url });
    else updateScreenContent(inputTarget.sceneId, inputTarget.screenId, inputTarget.field, url);
    setLibraryOpen(false); setInputTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="text-slate-400 hover:text-slate-800"><RefreshCw size={20} /></button>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">導演控制中心</h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setAnalyticsOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"><BarChart3 size={16} /> 數據儀表板</button>
          <button onClick={() => setLibraryOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><Library size={16} /> 素材庫</button>
          
          <button onClick={toggleStandby} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${standbyMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <Moon size={16} /> {standbyMode ? '休眠模式中' : '啟動休眠'}
          </button>

          <button onClick={togglePlay} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${isPlaying ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isPlaying ? <><Pause size={16} /> 暫停輪播</> : <><Play size={16} /> 全場同步播放</>}
          </button>
        </div>
      </header>

      {/* 全域特效控場區 */}
      <div className="bg-slate-900 text-white px-8 py-4 flex flex-wrap gap-4 items-center shadow-inner relative z-20">
        <div className="font-medium text-[10px] text-slate-400 uppercase tracking-widest flex flex-col justify-center gap-1 w-24"><Sparkles size={14}/> 全域控場</div>
        
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
          <div className="px-2 text-sm font-medium text-indigo-300 flex items-center gap-1"><CloudRain size={14}/> 氛圍</div>
          <select value={overlayEffect || 'none'} onChange={e => updateGlobalState({ overlayEffect: e.target.value })} className="bg-slate-700 text-white border-none outline-none text-xs rounded px-2 py-1 cursor-pointer hover:bg-slate-600 font-medium">
            {OVERLAY_EFFECTS.map(ef => <option key={ef.id} value={ef.id}>{ef.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
          <input type="text" value={marquee.text} onChange={e => updateGlobalState({ marquee: { ...marquee, text: e.target.value } })} placeholder="廣播跑馬燈內容..." className="bg-transparent border-none outline-none text-sm px-3 text-amber-300 w-48 font-medium" />
          <button onClick={() => updateGlobalState({ marquee: { ...marquee, active: !marquee.active } })} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${marquee.active ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{marquee.active ? '停止' : '發送'}</button>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 pr-2">
          <div className="px-2 text-sm font-medium text-pink-300 flex items-center gap-1"><MessageSquare size={14}/> 彈幕</div>
          <button onClick={toggleChats} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${bulletChats.active ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{bulletChats.active ? '開啟中' : '關閉'}</button>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 pl-3 flex-1">
          <Music size={14} className="text-blue-400"/>
          <input type="text" value={bgm.url} onChange={e => updateGlobalState({ bgm: { ...bgm, url: e.target.value } })} placeholder="背景音樂 URL" className="bg-transparent border-none outline-none text-xs text-blue-200 w-24" />
          <button onClick={() => openLib({ isBgm: true })} className="text-[10px] font-medium bg-slate-700 px-2 py-1 rounded">庫</button>
          <button onClick={toggleBgm} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${bgm.active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{bgm.active ? '播放中' : '靜音'}</button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button onClick={() => triggerFx('applause')} className="bg-slate-700 hover:bg-slate-600 text-xs px-2 py-1.5 rounded font-medium transition-colors">👏 掌聲</button>
          <button onClick={() => triggerFx('bell')} className="bg-slate-700 hover:bg-slate-600 text-xs px-2 py-1.5 rounded font-medium transition-colors">🔔 提示</button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-[1800px] mx-auto grid xl:grid-cols-[1.25fr_1fr] gap-4">
          <section className="border border-slate-200 bg-slate-50 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isPlaying && !standbyMode ? 'bg-emerald-500 animate-pulse' : standbyMode ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">播放監控</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {standbyMode ? '休眠模式' : isPlaying ? `第 ${playback.sceneIndex + 1}/${playback.totalScenes} 場：${playback.scene?.name || '未命名場景'}` : '暫停中'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">本場剩餘</div>
                <div className="text-3xl font-black text-slate-900 tabular-nums">{formatSeconds(playback.sceneRemaining)}</div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本場進度</div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${playback.sceneProgress}%` }} />
                </div>
                <div className="mt-2 text-slate-500 tabular-nums">{formatSeconds(playback.sceneElapsed)} / {formatSeconds(playback.scene?.duration || 0)}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">整輪進度</div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${playback.cycleProgress}%` }} />
                </div>
                <div className="mt-2 text-slate-500 tabular-nums">{formatSeconds(playback.cycleElapsed)} / {formatSeconds(playback.totalDuration)}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">目前內容</div>
                <div className="mt-2 text-slate-700 font-medium">
                  {playback.scene?.isSpanMode ? `全景 ${getContentTypeLabel(playback.scene?.spanType)}` : '三螢幕獨立播放'}
                </div>
                <div className="mt-1 text-xs text-slate-400">{isPlaying ? '播放中' : '按下播放後會從第 1 場重新同步'}</div>
              </div>
            </div>
          </section>

          <section className="border border-slate-200 bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">螢幕連線</div>
                <div className="text-lg font-semibold text-slate-900">{onlineCount}/3 在線</div>
              </div>
              {localMode && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded">本機模式</span>}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {connectedScreens.map(({ id, status, online, ageSeconds }) => (
                <div key={id} className={`bg-white border rounded-lg p-3 ${online ? 'border-emerald-200' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MonitorPlay size={16} className={online ? 'text-emerald-600' : 'text-slate-300'} />
                      <span className="font-bold text-slate-800">螢幕 {id}</span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  </div>
                  <div className={`mt-2 text-xs font-bold ${online ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {online ? '已連線' : '未連線'}
                    {ageSeconds !== null && <span className="font-medium text-slate-400"> · {ageSeconds}s 前</span>}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 truncate">{status.sceneName || '尚無回報場景'}</div>
                  <div className="mt-1 text-[11px] text-slate-400 truncate">
                    {status.audioUnlocked === false ? '等待顯示端點擊啟動' : getContentTypeLabel(status.contentType)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden max-w-[1800px] w-full mx-auto">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-600">總流程 (Timeline)</h2>
            <button onClick={addScene} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-blue-600 transition-colors"><Plus size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {timeline.map((scene, idx) => {
              if (!scene) return null;
              return (
                <div key={scene.id} onClick={() => setSelectedSceneId(scene.id)} className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 group ${selectedSceneId === scene.id ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 rounded">#{idx + 1}</span>
                      <span className={`text-sm font-medium ${selectedSceneId === scene.id ? 'text-blue-700' : 'text-slate-700'} truncate w-32`}>{scene.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {scene.duration}s</span>
                    <span className="flex items-center gap-1 bg-slate-100 px-1.5 rounded">{TRANSITIONS.find(t=>t.id===scene.transition)?.label || '特效'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {activeScene && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">場景名稱</label>
                  <input type="text" value={activeScene.name || ''} onChange={(e) => updateScene(activeScene.id, { name: e.target.value })} className="w-full text-xl font-semibold outline-none border-b-2 border-transparent focus:border-blue-400 transition-colors pb-1 text-slate-800" />
                </div>
                
                <div className="w-24 space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase"><Clock size={12} className="inline mr-1"/> 秒數</label>
                  <input type="number" value={activeScene.duration || 1} onChange={(e) => updateScene(activeScene.id, { duration: parseInt(e.target.value) || 1 })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-center text-sm" />
                </div>

                <div className="w-36 space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">轉場特效</label>
                  <select value={activeScene.transition || 'fade'} onChange={e => updateScene(activeScene.id, { transition: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm text-slate-700">
                    {TRANSITIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>

                <div className="w-48 space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">顯示模式</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => updateScene(activeScene.id, { isSpanMode: false })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1 ${!activeScene.isSpanMode ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}><Columns size={12}/> 獨立</button>
                    <button onClick={() => updateScene(activeScene.id, { isSpanMode: true })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1 ${activeScene.isSpanMode ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}><Maximize size={12}/> 全景</button>
                  </div>
                </div>
              </div>

              {activeScene.isSpanMode ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
                  <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                    <span className="font-semibold text-sm text-blue-700 flex items-center gap-2"><Maximize size={16}/> 跨螢全景佈局 (Video Wall)</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-blue-800 cursor-pointer bg-blue-100/50 px-2 py-1 rounded">
                        <input type="checkbox" checked={activeScene.spanAnimation || false} onChange={e => updateScene(activeScene.id, { spanAnimation: e.target.checked })} className="cursor-pointer" />
                        動態漂浮特效 (Ken Burns)
                      </label>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border-b flex gap-6 items-center">
                     <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><MonitorOff size={12}/> 電視實體邊框補償 (Bezel Gap)</label>
                          <span className="text-xs font-mono text-slate-400">{activeScene.bezelGap || 0} px</span>
                        </div>
                        <input type="range" min="0" max="150" value={activeScene.bezelGap || 0} onChange={e => updateScene(activeScene.id, { bezelGap: parseInt(e.target.value) })} className="w-full accent-blue-600" />
                        <p className="text-[10px] text-slate-400 mt-1">如果跨越電視的圖片或文字出現錯位，請微調此拉桿吃掉實體邊框的距離。</p>
                     </div>
                  </div>

                  <div className="p-6 space-y-4">
                     <div className="flex gap-4">
                       <select value={activeScene.spanType || 'video'} onChange={(e) => updateScene(activeScene.id, { spanType: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none text-slate-700">
                          <option value="video">播放影片</option>
                          <option value="image">展示圖片</option>
                          <option value="text">巨型文字 (NEW)</option>
                       </select>
                       <div className="flex-1 relative">
                          <input 
                            type="text" 
                            value={activeScene.spanContent || ''} 
                            onChange={(e) => updateScene(activeScene.id, { spanContent: e.target.value })} 
                            placeholder={activeScene.spanType === 'text' ? "請輸入要橫跨三台螢幕的巨型文字..." : "輸入網址..."}
                            className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" 
                          />
                          {activeScene.spanType !== 'text' && (
                            <button onClick={() => openLib({ sceneId: activeScene.id, isSpan: true, field: 'spanContent' })} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">素材庫</button>
                          )}
                       </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="grid xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  {['1', '2', '3'].map(id => {
                    const screenCfg = activeScene.screens?.[id] || { type: 'color', content: '#000' };
                    return (
                      <div key={id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-5 py-3 bg-slate-50 border-b font-medium text-sm text-slate-700">螢幕 {id}</div>
                        <div className="aspect-video bg-slate-900 relative">
                          {screenCfg.type === 'color' && <div className="absolute inset-0" style={{backgroundColor: screenCfg.content}} />}
                          {screenCfg.type === 'image' && <img src={screenCfg.content} className="w-full h-full object-cover opacity-90" alt="預覽" />}
                          {screenCfg.type === 'video' && <div className="absolute inset-0 flex items-center justify-center text-white/50"><Play size={24} /></div>}
                          {screenCfg.type === 'text' && <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium p-4 text-center">{screenCfg.content || '文字'}</div>}
                          {screenCfg.type === 'camera' && <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-slate-800"><Camera size={32} className="mb-2"/><span className="text-xs font-light">鏡頭實況</span></div>}
                          {screenCfg.type === 'qrcode' && <div className="absolute inset-0 flex items-center justify-center bg-white"><QrCode size={64} className="text-slate-300" /></div>}
                          {screenCfg.type === 'iframe' && <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-slate-800"><Globe size={32} className="mb-2"/><span className="text-xs font-light">網頁/3D 嵌入</span></div>}
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                            {CONTENT_TYPES.map(t => (
                              <button key={t.id} onClick={() => updateScreenContent(activeScene.id, id, 'type', t.id)} className={`py-1.5 rounded-lg text-[10px] font-medium flex flex-col items-center justify-center gap-1 transition-all ${screenCfg.type === t.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                <t.icon size={12} /> {t.label}
                              </button>
                            ))}
                          </div>
                          <div className="relative">
                            {screenCfg.type === 'color' ? (
                              <div className="flex items-center gap-3"><input type="color" value={screenCfg.content || '#000000'} onChange={(e) => updateScreenContent(activeScene.id, id, 'content', e.target.value)} className="w-12 h-10 p-0 border-0 rounded cursor-pointer" /><span className="text-sm font-mono text-slate-500">{screenCfg.content}</span></div>
                            ) : ['camera'].includes(screenCfg.type) ? (
                              <div className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded-xl font-light">將調用顯示端裝置攝影機</div>
                            ) : (
                              <>
                                <input type="text" value={screenCfg.content || ''} onChange={(e) => updateScreenContent(activeScene.id, id, 'content', e.target.value)} placeholder="輸入網址或內容..." className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400 transition-colors" />
                                {['video', 'image', 'iframe'].includes(screenCfg.type) && (
                                  <button onClick={() => openLib({ sceneId: activeScene.id, screenId: id, field: 'content' })} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300 transition-colors">素材庫</button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {libraryOpen && <AssetLibraryModal assets={assets} setAssets={setAssets} db={db} storage={storage} appId={appId} localMode={localMode} onClose={() => setLibraryOpen(false)} onSelect={handleLibSelect} />}
      {analyticsOpen && <AnalyticsModal stats={stats} bulletChats={bulletChats} onClose={() => setAnalyticsOpen(false)} />}
    </div>
  );
}

// ==========================================
// 子組件：數據儀表板 Modal
// ==========================================
function AnalyticsModal({ stats, bulletChats, onClose }) {
  const popularity = Math.min((stats?.chatCount || 0) * 5 + (stats?.likes || 0) * 2, 100);
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <h2 className="font-bold text-lg flex items-center gap-2 text-amber-800"><BarChart3 size={20}/> 展位互動數據儀表板</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-full border shadow-sm transition-colors"><X size={18}/></button>
        </div>
        <div className="p-8 grid grid-cols-2 gap-6 bg-slate-50 flex-1">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
             <MessageSquare size={32} className="text-pink-500 mb-2"/>
             <div className="text-4xl font-black text-slate-800">{stats?.chatCount || 0}</div>
             <div className="text-sm font-medium text-slate-400 mt-1">累計彈幕留言數</div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
             <Heart size={32} className="text-rose-500 mb-2"/>
             <div className="text-4xl font-black text-slate-800">{stats?.likes || 0}</div>
             <div className="text-sm font-medium text-slate-400 mt-1">觀眾按讚熱度</div>
           </div>
           <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm text-slate-700 flex items-center gap-2"><Flame size={16} className="text-orange-500"/> 當前展位熱度指標</span>
                <span className="font-bold text-sm text-orange-500">{popularity}%</span>
             </div>
             <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-rose-500 h-full transition-all duration-1000" style={{ width: `${popularity}%` }} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 子組件：素材庫 Modal
// ==========================================
function AssetLibraryModal({ assets, setAssets, db, storage, appId, localMode, onClose, onSelect }) {
  const [activeTab, setActiveTab] = useState('url'); 
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('video');
  const [selectedFile, setSelectedFile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const handleAddUrl = async () => {
    if (!newUrl || !newName) return;
    setAdding(true);
    if (localMode) {
      setAssets(prev => [...prev, { id: Date.now().toString(), name: newName, url: newUrl, type: newType, createdAt: Date.now() }]);
      setNewUrl('');
      setNewName('');
      setAdding(false);
      return;
    }
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), { name: newName, url: newUrl, type: newType, createdAt: Date.now() }); setNewUrl(''); setNewName(''); } catch (error) { console.error(error); }
    setAdding(false);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setAdding(true);
    if (localMode) {
      const fileType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      setAssets(prev => [...prev, { id: Date.now().toString(), name: newName || selectedFile.name, url: URL.createObjectURL(selectedFile), type: fileType, createdAt: Date.now() }]);
      setSelectedFile(null);
      setNewName('');
      setAdding(false);
      setUploadProgress(null);
      return;
    }
    const fileRef = ref(storage, `artifacts/${appId}/public/data/assets/${Date.now()}_${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(fileRef, selectedFile);
    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
      (error) => { console.error(error); setAdding(false); setUploadProgress(null); }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const fileType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), { name: newName || selectedFile.name, url: downloadURL, type: fileType, createdAt: Date.now() });
        setSelectedFile(null); setNewName(''); setAdding(false); setUploadProgress(null);
      }
    );
  };

  const handleDelete = async (id) => {
    const target = assets.find(asset => asset.id === id);
    if (target?.static) return;
    if (localMode) {
      setAssets(prev => prev.filter(asset => asset.id !== id));
      return;
    }
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', id)); } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-lg flex items-center gap-2 text-slate-800"><Library className="text-blue-500"/> 素材庫</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-full border shadow-sm transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex bg-slate-200/80 p-1 rounded-xl w-fit">
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><UploadCloud size={16} /> 上傳檔案</button>
            <button onClick={() => setActiveTab('url')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Link2 size={16} /> 貼上網址</button>
          </div>
          {activeTab === 'upload' ? (
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <input type="file" accept="video/mp4, image/jpeg, image/png, image/webp" onChange={e => setSelectedFile(e.target.files[0])} className="block w-1/3 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition-colors" />
              <input type="text" placeholder="自訂名稱" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 px-3 py-2 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-blue-100 transition-colors text-slate-800" />
              <div className="flex flex-col w-24">
                <button onClick={handleUploadFile} disabled={adding || !selectedFile} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex justify-center items-center gap-1 w-full hover:bg-blue-700 transition-colors"><UploadCloud size={16}/> 上傳</button>
                {uploadProgress !== null && <div className="w-full bg-slate-200 h-1.5 mt-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div>}
              </div>
            </div>
          ) : (
            <div className="flex gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <select value={newType} onChange={e => setNewType(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-50 outline-none text-sm font-medium border-r border-slate-100 text-slate-700"><option value="video">影片</option><option value="image">圖片</option><option value="iframe">網頁/3D</option></select>
              <input type="text" placeholder="素材名稱" value={newName} onChange={e => setNewName(e.target.value)} className="w-1/4 px-3 py-2 outline-none text-sm border-r border-slate-100 font-medium text-slate-800" />
              <input type="text" placeholder="貼上外部 URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1 px-3 py-2 outline-none text-sm font-medium text-slate-800" />
              <button onClick={handleAddUrl} disabled={adding || !newUrl || !newName} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1 hover:bg-blue-700 transition-colors"><Plus size={16}/> 新增</button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {assets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">素材庫是空的。</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {assets.map(asset => (
                <div key={asset.id} className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-blue-400 hover:shadow-md transition-all group relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-slate-800">
                      {asset.type === 'video' ? <Play size={16} className="text-blue-500"/> : asset.type === 'iframe' ? <Globe size={16} className="text-purple-500" /> : <ImageIcon size={16} className="text-emerald-500"/>}
                      <span className="font-semibold text-sm truncate flex-1">{asset.name}</span>
                      {asset.static && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">STATIC</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">{asset.url}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onSelect(asset.url)} className="flex-1 bg-slate-50 hover:bg-blue-50 text-blue-600 font-medium text-xs py-2.5 rounded-xl transition-colors border border-slate-100 hover:border-blue-200">選用</button>
                    {!asset.static && (
                      <button onClick={() => handleDelete(asset.id)} className="px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-xl border border-transparent hover:border-red-100"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 子組件：全域環境氛圍特效引擎
// ==========================================
function OverlayEffects({ type }) {
  if (!type || type === 'none') return null;
  const getParticleClass = () => {
    switch(type) {
      case 'snow': return 'bg-white rounded-full opacity-80 blur-[1px]';
      case 'sakura': return 'bg-pink-300 rounded-[10px_0px_10px_0px] opacity-90';
      case 'gold': return 'bg-yellow-400 rounded-full border-2 border-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
      case 'matrix': return 'text-green-500 font-mono font-bold text-xl drop-shadow-[0_0_5px_#22c55e] [writing-mode:vertical-rl]';
      default: return '';
    }
  };
  const getParticleContent = () => {
    if (type === 'matrix') {
       const chars = '01展覽播控科技未來';
       return Array.from({length: 5}).map(()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    }
    return '';
  };
  const particles = useMemo(() => Array.from({ length: 40 }).map(() => ({
    left: Math.random() * 100 + 'vw',
    delay: Math.random() * -20 + 's', 
    duration: (type === 'matrix' ? 3 : 5) + Math.random() * 10 + 's',
    size: type === 'matrix' ? 1 : 0.5 + Math.random() * 1.5,
    width: type === 'snow' ? '10px' : type === 'sakura' ? '15px' : type === 'gold' ? '20px' : 'auto',
    height: type === 'snow' ? '10px' : type === 'sakura' ? '15px' : type === 'gold' ? '20px' : 'auto',
  })), [type]);
  return (
    <div className="absolute inset-0 pointer-events-none z-[45] overflow-hidden">
      <style>{`
        @keyframes particle-fall {
          0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) translateX(${type==='snow'?'20px':'0'}) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {particles.map((p, i) => (
        <div key={i} className={`absolute top-[-10vh] ${getParticleClass()}`} style={{ left: p.left, width: p.width, height: p.height, animation: `particle-fall ${p.duration} linear ${p.delay} infinite`, transform: `scale(${p.size})` }}>
          {getParticleContent()}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 子組件：顯示端螢幕
// ==========================================
function DisplayScreen({ id, globalState, db, appId, localMode, onExit }) {
  const { timeline = [DEFAULT_SCENE], isPlaying = false, startTime = Date.now(), marquee, standbyMode, bgm, fxTrigger, bulletChats, overlayEffect } = globalState;
  const [currentScene, setCurrentScene] = useState(timeline[0] || DEFAULT_SCENE);
  const cameraVideoRef = useRef(null);
  const bgmRef = useRef(null);
  const fxRef = useRef(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const handleUnlockAndFullscreen = () => {
    setAudioUnlocked(true);
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    }
  };
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
    else if (document.exitFullscreen) document.exitFullscreen();
  };
  useEffect(() => {
    let animationFrameId;
    if (!isPlaying || standbyMode) { setCurrentScene(timeline[0] || DEFAULT_SCENE); return; }
    const calculateCurrentScene = () => {
      const elapsedSecs = (Date.now() - startTime) / 1000;
      const totalDuration = timeline.reduce((acc, cur) => acc + (Number(cur?.duration) || 10), 0);
      if (totalDuration === 0) return;
      const currentCycleTime = Math.max(0, elapsedSecs % totalDuration);
      let accumulatedTime = 0, activeIdx = 0;
      for (let i = 0; i < timeline.length; i++) {
        accumulatedTime += (Number(timeline[i]?.duration) || 10);
        if (currentCycleTime < accumulatedTime) { activeIdx = i; break; }
      }
      setCurrentScene(timeline[activeIdx] || timeline[0]);
      animationFrameId = requestAnimationFrame(calculateCurrentScene);
    };
    animationFrameId = requestAnimationFrame(calculateCurrentScene);
    return () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); };
  }, [isPlaying, startTime, timeline, standbyMode]);

  useEffect(() => {
    if (!id) return;

    const writeHeartbeat = () => {
      const screenData = currentScene?.screens?.[id] || { type: currentScene?.spanType || 'unknown' };
      const payload = {
        screenId: id,
        lastSeen: Date.now(),
        sceneId: currentScene?.id || '',
        sceneName: currentScene?.name || '未命名場景',
        contentType: currentScene?.isSpanMode ? currentScene?.spanType : screenData.type,
        isSpanMode: Boolean(currentScene?.isSpanMode),
        isPlaying,
        standbyMode,
        audioUnlocked,
        location: window.location.href,
      };

      if (!localMode && db) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'displayStatus', id), payload, { merge: true })
          .catch(error => console.warn("Display heartbeat failed:", error));
        return;
      }

      localStorage.setItem(getLocalStatusKey(appId, id), JSON.stringify(payload));
    };

    writeHeartbeat();
    const heartbeatTimer = setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(heartbeatTimer);
  }, [id, currentScene, isPlaying, standbyMode, audioUnlocked, db, appId, localMode]);

  useEffect(() => {
    let stream = null;
    if (!currentScene.isSpanMode && currentScene.screens?.[id]?.type === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => { stream = s; if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream; })
        .catch(err => console.error("無法取得攝影機", err));
    }
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [currentScene, id]);

  useEffect(() => {
    if (bgmRef.current && audioUnlocked) {
      bgmRef.current.volume = (bgm.volume || 50) / 100;
      if (bgm.active && bgm.url) bgmRef.current.play().catch(e => console.log("Audio failed"));
      else bgmRef.current.pause();
    }
  }, [bgm, audioUnlocked]);

  useEffect(() => {
    if (fxRef.current && audioUnlocked && fxTrigger?.timestamp > 0) {
      const fxUrls = { 'applause': 'https://actions.google.com/sounds/v1/crowds/crowd_cheering.ogg', 'bell': 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' };
      if (fxUrls[fxTrigger.id]) { fxRef.current.src = fxUrls[fxTrigger.id]; fxRef.current.play().catch(e => console.log(e)); }
    }
  }, [fxTrigger, audioUnlocked]);

  useEffect(() => {
    if (!document.getElementById('global-styles')) {
      const style = document.createElement('style');
      style.id = 'global-styles';
      style.innerHTML = `
        @keyframes scroll-left { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
        @keyframes bullet-fly { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100vw); } }
        @keyframes ken-burns { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.15) translate(-2%, -2%); } }
        .animate-marquee { display: inline-block; white-space: nowrap; animation: scroll-left 25s linear infinite; }
        .bullet-msg { position: absolute; white-space: nowrap; animation: bullet-fly 12s linear forwards; font-weight: 600; font-size: 5vh; text-shadow: 2px 2px 10px rgba(0,0,0,0.8); }
        .animate-ken-burns { animation: ken-burns 30s ease-in-out infinite alternate; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (standbyMode) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center cursor-none select-none text-white" onDoubleClick={toggleFullScreen}>
        <div className="text-[15vw] font-mono font-bold text-slate-800 animate-pulse">{new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit'})}</div>
        <div className="text-slate-800 tracking-[1em] uppercase text-2xl mt-4 font-medium">System Standby</div>
        <button onClick={onExit} className="absolute top-0 right-0 w-32 h-32 opacity-0 hover:opacity-20 text-white flex justify-end p-8 z-50"><RefreshCw size={24} /></button>
      </div>
    );
  }

  if (!audioUnlocked) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white z-[999] cursor-pointer" onClick={handleUnlockAndFullscreen}>
        <Maximize2 size={64} className="mb-6 animate-bounce text-blue-500" />
        <h1 className="text-4xl font-bold mb-4 tracking-widest">點擊畫面以啟動全螢幕與音效</h1>
        <p className="text-slate-400 font-light">進入展覽模式 (Click to Enter Fullscreen)</p>
      </div>
    );
  }

  const screenData = currentScene.screens?.[id] || { type: 'color', content: '#000' };
  const transitionClass = TRANSITIONS.find(t => t.id === currentScene.transition)?.class || 'animate-in fade-in duration-1000';
  const bezelGap = currentScene.bezelGap || 0;
  const spanTotalWidth = `calc(300vw + ${bezelGap * 2}px)`;
  const spanLeftOffset = id === '1' ? '0px' : id === '2' ? `calc(-100vw - ${bezelGap}px)` : `calc(-200vw - ${bezelGap * 2}px)`;
  const spanAnimationClass = currentScene.spanAnimation ? 'animate-ken-burns' : '';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-none select-none flex items-center justify-center text-white" onDoubleClick={toggleFullScreen}>
      <audio ref={bgmRef} src={bgm.url} loop />
      <audio ref={fxRef} />

      <div key={currentScene.id} className={`absolute inset-0 flex items-center justify-center w-full h-full ${transitionClass}`}>
        {currentScene.isSpanMode ? (
          <>
            {currentScene.spanType === 'image' && currentScene.spanContent && (
               <div style={{ position: 'absolute', width: spanTotalWidth, height: '100vh', left: spanLeftOffset }}>
                 <img src={currentScene.spanContent} className={`w-full h-full object-cover ${spanAnimationClass}`} />
               </div>
            )}
            {currentScene.spanType === 'video' && currentScene.spanContent && (
               <div style={{ position: 'absolute', width: spanTotalWidth, height: '100vh', left: spanLeftOffset }}>
                 <video src={currentScene.spanContent} autoPlay muted loop playsInline className="w-full h-full object-cover" />
               </div>
            )}
            {currentScene.spanType === 'text' && currentScene.spanContent && (
               <div className="flex items-center justify-center" style={{ position: 'absolute', width: spanTotalWidth, height: '100vh', left: spanLeftOffset }}>
                 <div className={`text-[25vw] font-black text-white text-center leading-none tracking-tight drop-shadow-2xl ${spanAnimationClass}`}>
                   {currentScene.spanContent}
                 </div>
               </div>
            )}
          </>
        ) : (
          <>
            {screenData.type === 'color' && <div className="w-full h-full transition-colors duration-1000" style={{ backgroundColor: screenData.content || '#000' }} />}
            {screenData.type === 'image' && screenData.content && <img src={screenData.content} className="w-full h-full object-cover" />}
            {screenData.type === 'video' && screenData.content && <video src={screenData.content} autoPlay muted loop playsInline className="w-full h-full object-cover" />}
            {screenData.type === 'text' && <div className="text-[10vw] font-semibold text-white text-center leading-tight tracking-tight drop-shadow-2xl px-12">{screenData.content}</div>}
            {screenData.type === 'camera' && <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />}
            {screenData.type === 'qrcode' && (
              <div className="w-full h-full bg-white flex flex-col items-center justify-center p-12">
                 {screenData.content ? (
                   <><img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(screenData.content)}`} className="w-[60vmin] h-[60vmin] shadow-xl rounded-xl" /><p className="mt-12 text-3xl font-bold text-slate-800 tracking-widest uppercase">SCAN TO INTERACT</p></>
                 ) : <p className="text-3xl font-medium text-slate-300">URL REQUIRED</p>}
              </div>
            )}
            {screenData.type === 'iframe' && screenData.content && <iframe src={screenData.content} className="w-full h-full border-none pointer-events-auto bg-white" sandbox="allow-scripts allow-same-origin allow-forms" />}
          </>
        )}
      </div>
      <OverlayEffects type={overlayEffect} />
      {bulletChats?.active && (
        <div className="absolute inset-0 pointer-events-none z-[48] overflow-hidden">
          {bulletChats.messages.map((msg, i) => (
            <div key={msg.id} className="bullet-msg" style={{ top: `${10 + (i * 15) % 70}%`, color: msg.color }}>{msg.text}</div>
          ))}
        </div>
      )}
      {marquee?.active && marquee.text && (
        <div className="absolute bottom-[8vh] left-0 w-full bg-amber-500/95 backdrop-blur-xl py-6 z-[49] shadow-[0_-10px_40px_rgba(245,158,11,0.3)] border-y-4 border-amber-300">
          <div className="animate-marquee"><span className="text-[6vh] font-bold text-slate-900 tracking-widest">{marquee.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {marquee.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {marquee.text}</span></div>
        </div>
      )}
      <div className="absolute bottom-6 left-6 flex items-center gap-3 opacity-10 pointer-events-none z-50">
        <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
        <span className="text-white font-mono text-xs font-medium tracking-widest uppercase drop-shadow-md">SCENE: {currentScene.name} | S: {id}</span>
      </div>
      <div className="absolute top-0 right-0 p-6 flex gap-4 opacity-0 hover:opacity-20 transition-opacity z-[100]">
        <button onClick={toggleFullScreen} className="text-white hover:text-blue-400"><Maximize2 size={24} /></button>
        <button onClick={onExit} className="text-white hover:text-red-400"><RefreshCw size={24} /></button>
      </div>
    </div>
  );
}
