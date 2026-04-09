// Theme, security, and device access module.

// --- 核心變數初始化 ---
window.mockDatabase = window.mockDatabase || [];
window.windowData = window.windowData || null;
window.deletedIds = window.deletedIds || new Set();
window.currentAdminRole = window.currentAdminRole || 'none';
window.adminAuthStorageKey = window.adminAuthStorageKey || 'adminAuthSession';
window.adminPrivateSettingsBootstrapStorageKey = window.adminPrivateSettingsBootstrapStorageKey || 'adminPrivateSettingsBootstrap';
window.privateTeacherListStorageKey = window.privateTeacherListStorageKey || 'teacherListPrivate';
window.pendingAdminTargetTab = window.pendingAdminTargetTab || '';
window.superAdminPassword = window.superAdminPassword || 'd101';
window.exhibitionAdminPassword = window.exhibitionAdminPassword || 'y103';
window.lastApproveAdminName = localStorage.getItem('lastApproveAdminName') || '';
window.themeStorageKey = window.themeStorageKey || 'uiNightMode';
window.deviceAccessStorageKeys = window.deviceAccessStorageKeys || {
    config: 'deviceAccessConfig',
    currentId: 'trustedDeviceId',
    session: 'deviceAccessSessionUnlocked'
};
window.deviceAccessConfig = window.deviceAccessConfig || (() => {
    return { enabled: false, password: '', trustedDevices: [], faceRecognition: { enabled: false, allowPasswordFallback: true, profiles: [] } };
})();
window.deviceAccessGateResolver = window.deviceAccessGateResolver || null;
window.faceAuthState = window.faceAuthState || {
    mode: 'idle',
    stream: null,
    samples: [],
    editingProfileId: '',
    pendingRole: '',
    cameraReady: false,
    busy: false,
    autoLoopTimer: null,
    autoLoopEnabled: false,
    verificationHistory: [],
    lastObservedDescriptor: [],
    lastObservedDescriptorVariants: [],
    lastObservedProfileId: '',
    lastObservedAt: 0,
    lastStrongProfileId: '',
    lastStrongAt: 0,
    lastStrongScore: 0,
    trackedCropBoxRatio: null,
    trackedFaceRatio: 0,
    trackedUsedDetector: false,
    trackedAt: 0,
    lastDetectorAt: 0
};

window.currentReturnId = null;
window.currentApproveId = null;
window.currentEditStatusId = null;
window.confirmActionCallbackLocal = null;
window.editingExhibitionId = null;
window.editingExhibitionOriginalSpace = '';
window.editingExhibitionBorrowerUnit = '';

window.currentReportFilter = window.currentReportFilter || 'all';
window.autoRefreshActive = false;
window.autoRefreshTimer = null;
window.heroWeatherRefreshTimer = window.heroWeatherRefreshTimer || null;
window.lastKnownDateStr = window.lastKnownDateStr || '';
window.heroWeatherCacheKey = window.heroWeatherCacheKey || 'heroWeatherCache';
window.heroWeatherConfig = window.heroWeatherConfig || {
    label: '校區今日天氣',
    latitude: 23.0379,
    longitude: 120.2426,
    timezone: 'Asia/Taipei',
    cacheMinutes: 30,
    refreshMinutes: 15
};
window.heroWeatherState = window.heroWeatherState || {
    loading: false,
    lastDate: '',
    lastUpdatedLabel: '',
    lastPayload: null
};
window.exhibitionAnnouncement = window.exhibitionAnnouncement || '';
window.exhibitionBlockedRanges = window.exhibitionBlockedRanges || JSON.parse(localStorage.getItem('exhibitionBlockedRanges') || '[]');
window.currentTeacherScheduleTeacherKey = window.currentTeacherScheduleTeacherKey || '';
window.currentAdminTeacherScheduleKey = window.currentAdminTeacherScheduleKey || '';
window.teacherScheduleEditContext = window.teacherScheduleEditContext || null;
window.teacherScheduleGeminiApiKey = window.teacherScheduleGeminiApiKey || '';
window.teacherScheduleAiState = window.teacherScheduleAiState || { isProcessing: false, progress: '', errorMsg: '', successMsg: '', parsedDataList: [] };
window.teacherScheduleTemplateDayMap = window.teacherScheduleTemplateDayMap || [null, 5, 4, 3, 2, 1];
window.teacherScheduleSettingsChunkSize = window.teacherScheduleSettingsChunkSize || 30000;
window.cloudSettingsMaxCharsPerField = window.cloudSettingsMaxCharsPerField || 47000;
window.lastSettingsSaveError = window.lastSettingsSaveError || '';
window.currentClassroomApprovalLink = window.currentClassroomApprovalLink || '';
window.currentClassroomApprovalRecordId = window.currentClassroomApprovalRecordId || '';
window.currentExhibitionAdminLink = window.currentExhibitionAdminLink || '';
window.loadingOverlayDepth = window.loadingOverlayDepth || 0;
window.securityLockdown = window.securityLockdown || false;
window.securityTabLockTimer = window.securityTabLockTimer || null;
window.securityHiddenLockMs = window.securityHiddenLockMs || 60000;
window.securityAllowedFetchHosts = window.securityAllowedFetchHosts || new Set(['script.google.com', 'script.googleusercontent.com', 'generativelanguage.googleapis.com', 'api.open-meteo.com']);
window.securityAllowedFetchHosts.add('api.open-meteo.com');
window.securityAllowedAssetHosts = window.securityAllowedAssetHosts || new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.tailwindcss.com', 'unpkg.com', 'cdn.sheetjs.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net']);
window.teacherScheduleLongPressMs = window.teacherScheduleLongPressMs || 320;
window.teacherScheduleDragThreshold = window.teacherScheduleDragThreshold || 12;
window.teacherScheduleBoardDirty = window.teacherScheduleBoardDirty || false;
window.teacherScheduleDragState = window.teacherScheduleDragState || {
    pointerId: null,
    pressTimer: null,
    sourceCell: null,
    sourceScheduleKey: '',
    sourceDay: 0,
    sourcePeriodId: '',
    sourceEntryId: '',
    sourceHadEntry: false,
    startX: 0,
    startY: 0,
    dragging: false,
    targetCell: null,
    suppressClickUntil: 0
};

window.getAdminAuthSession = function() {
    try {
        const raw = sessionStorage.getItem(window.adminAuthStorageKey);
        if(!raw) return null;
        const parsed = JSON.parse(raw);
        if(!parsed || typeof parsed !== 'object') {
            sessionStorage.removeItem(window.adminAuthStorageKey);
            return null;
        }
        const expiresAt = Number(parsed.expiresAt || 0);
        if(expiresAt && expiresAt <= Date.now()) {
            sessionStorage.removeItem(window.adminAuthStorageKey);
            return null;
        }
        return parsed;
    } catch(error) {
        try { sessionStorage.removeItem(window.adminAuthStorageKey); } catch(storageError) {}
        return null;
    }
};
window.setAdminAuthSession = function(sessionData) {
    const payload = sessionData && typeof sessionData === 'object' ? sessionData : {};
    const nextSession = {
        token: String(payload.token || payload.authToken || '').trim(),
        role: String(payload.role || '').trim(),
        expiresAt: Number(payload.expiresAt || 0) || (Date.now() + (1000 * 60 * 60 * 8)),
        offline: !!payload.offline
    };
    if(!nextSession.role) return null;
    try {
        sessionStorage.setItem(window.adminAuthStorageKey, JSON.stringify(nextSession));
    } catch(error) {}
    return nextSession;
};
window.clearAdminAuthSession = function() {
    try { sessionStorage.removeItem(window.adminAuthStorageKey); } catch(error) {}
    try { sessionStorage.removeItem(window.adminPrivateSettingsBootstrapStorageKey); } catch(error) {}
};
window.setAdminPrivateSettingsBootstrap = function(settingData) {
    if(!settingData || typeof settingData !== 'object') return;
    try {
        sessionStorage.setItem(window.adminPrivateSettingsBootstrapStorageKey, JSON.stringify(settingData));
    } catch(error) {}
};
window.readAdminPrivateSettingsBootstrap = function() {
    try {
        const raw = sessionStorage.getItem(window.adminPrivateSettingsBootstrapStorageKey);
        if(!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch(error) {
        return null;
    }
};
window.getAdminAuthToken = function() {
    const session = window.getAdminAuthSession();
    return session ? String(session.token || '').trim() : '';
};
window.getAdminAuthRole = function() {
    const session = window.getAdminAuthSession();
    return session ? String(session.role || '').trim() : '';
};
window.hasAdminAuth = function(requiredRole = '') {
    const session = window.getAdminAuthSession();
    if(!session || !session.role) return false;
    if(!requiredRole) return true;
    const normalizedRole = String(requiredRole || '').trim();
    if(normalizedRole === 'super') return session.role === 'super';
    if(normalizedRole === 'exhibition') return session.role === 'exhibition' || session.role === 'super';
    return session.role === normalizedRole;
};
window.resetPrivateSensitiveState = function() {
    window.teacherList = [];
    window.studentList = [];
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig({
        enabled: false,
        password: '',
        trustedDevices: [],
        faceRecognition: {
            enabled: false,
            allowPasswordFallback: true,
            profiles: []
        }
    });
    try { localStorage.removeItem(window.deviceAccessStorageKeys.config); } catch(error) {}
};
window.handleAdminAuthFailure = function(message = '管理員登入已失效，請重新登入。') {
    window.clearAdminAuthSession();
    window.currentAdminRole = 'none';
    window.resetPrivateSensitiveState();
    if(typeof window.showToast === 'function') window.showToast(message, 'error');
};
window.buildGasActionUrl = function(action, params = {}, includeAuth = false) {
    const gasUrl = $('gas-url') ? $('gas-url').value.trim() : '';
    if(!gasUrl.startsWith('http')) return '';
    const searchParams = new URLSearchParams();
    searchParams.set('action', String(action || '').trim());
    Object.keys(params || {}).forEach(key => {
        if(params[key] == null || params[key] === '') return;
        searchParams.set(key, String(params[key]));
    });
    if(includeAuth) {
        const authToken = window.getAdminAuthToken();
        if(authToken) searchParams.set('authToken', authToken);
    }
    const separator = gasUrl.includes('?') ? '&' : '?';
    return gasUrl + separator + searchParams.toString();
};
window.fetchPrivateCloudAction = async function(action, payload = {}) {
    const gasUrl = $('gas-url') ? $('gas-url').value.trim() : '';
    const authToken = window.getAdminAuthToken ? window.getAdminAuthToken() : '';
    if(!gasUrl.startsWith('http')) throw new Error('尚未設定雲端同步網址');
    if(!authToken) throw new Error('管理員登入已失效，請重新登入後再試。');
    const response = await fetch(gasUrl, {
        method: 'POST',
        body: JSON.stringify({
            action: String(action || '').trim(),
            authToken,
            ...((payload && typeof payload === 'object') ? payload : {})
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const result = await response.json();
    if(result && result.status === 'error' && String(result.message || result.error || '').indexOf('未授權') !== -1) {
        window.handleAdminAuthFailure('管理員登入已失效，請重新登入後再同步後台資料。');
    }
    return result;
};

const existingAdminAuthSession = window.getAdminAuthSession();
if(existingAdminAuthSession && existingAdminAuthSession.role && window.currentAdminRole === 'none') {
    window.currentAdminRole = existingAdminAuthSession.role;
}

window.currentEquipPage = window.currentEquipPage || 1;
window.equipSearchTerm = window.equipSearchTerm || '';
window.equipSortBy = window.equipSortBy || 'category';
window.equipSortDesc = window.equipSortDesc || false;
window.equipItemsPerPage = 15;
window.selectedEquipmentIds = window.selectedEquipmentIds || new Set();

if (!window.roomSchedules) { window.roomSchedules = JSON.parse(localStorage.getItem('roomSchedules')) || {}; }
if (!window.teacherSchedules) { window.teacherSchedules = JSON.parse(localStorage.getItem('teacherSchedules')) || []; }
window.borrowRecordOverrides = window.borrowRecordOverrides || JSON.parse(localStorage.getItem('borrowRecordOverrides') || '{}');

// --- 預設清單資料 ---
window.teacherList = window.teacherList || [];
window.studentList = window.studentList || [];
window.equipmentList = window.equipmentList || [{ category: '電腦器材', name: '三腳架', propertyNo: '6010160107-2', location: 'D201' }, { category: '電腦器材', name: '三腳架', propertyNo: '6010160107-3', location: 'D201' }, { category: '電腦器材', name: '三腳架', propertyNo: '6010160107-4', location: 'D201' }];
window.keyList = window.keyList || ['D001 普通教室', 'D002', 'D201', 'D1002', 'E201', 'L401', 'L402', 'Y103', 'Y103-1', 'Y205', 'Y205研究室', 'Y103-1 展覽空間', 'Y棟一樓走廊【櫥窗】'];
window.classList = window.classList || ['四漫一A', '四漫一B', '四漫一C', '漫畫系'];
window.periodList = window.periodList || Array.from({length: 12}, (_, i) => ({ id: `${i+1}`, name: `第${i+1}節`, start: '00:00', end: '00:00' }));
window.periodList[4] = { id: '中午', name: '中午', start: '12:00', end: '13:30' };
window.teacherScheduleWeekdays = window.teacherScheduleWeekdays || [
    { id: 1, label: '一', fullLabel: '星期一' },
    { id: 2, label: '二', fullLabel: '星期二' },
    { id: 3, label: '三', fullLabel: '星期三' },
    { id: 4, label: '四', fullLabel: '星期四' },
    { id: 5, label: '五', fullLabel: '星期五' }
];

// --- DOM 工具函式 ---
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const show = id => { if($(id)) { $(id).classList.remove('hidden'); $(id).style.display = 'flex'; } };
const hide = id => { if($(id)) { $(id).classList.add('hidden'); $(id).style.display = 'none'; } };
window.isNightModeEnabled = function() {
    try {
        return localStorage.getItem(window.themeStorageKey) === '1';
    } catch(error) {
        return document.body.classList.contains('night-mode');
    }
};
window.syncNightModeToggle = function() {
    const button = $('theme-toggle-btn');
    const iconShell = $('theme-toggle-icon-shell');
    const enabled = document.body.classList.contains('night-mode');
    const label = enabled ? '切換為日間模式' : '切換為夜間模式';
    if(button) {
        button.classList.toggle('is-active', enabled);
        button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
    }
    if(iconShell) {
        iconShell.innerHTML = '<i data-lucide="' + (enabled ? 'sun-medium' : 'moon-star') + '" class="w-5 h-5"></i>';
        if(window.lucide) window.lucide.createIcons();
    }
};
window.getHeroWeatherMeta = function(code, isDay = true) {
    const weatherCode = Number(code);
    if(weatherCode === 0) return { label: '晴朗', icon: isDay ? 'sun-medium' : 'moon-star' };
    if(weatherCode === 1) return { label: '大致晴朗', icon: isDay ? 'cloud-sun' : 'cloud-moon' };
    if(weatherCode === 2) return { label: '晴時多雲', icon: isDay ? 'cloud-sun' : 'cloud-moon' };
    if(weatherCode === 3) return { label: '陰天', icon: 'cloud' };
    if([45, 48].includes(weatherCode)) return { label: '有霧', icon: 'cloud-fog' };
    if([51, 53, 55, 56, 57].includes(weatherCode)) return { label: '毛毛雨', icon: 'cloud-drizzle' };
    if([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { label: '降雨', icon: 'cloud-rain' };
    if([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { label: '降雪', icon: 'snowflake' };
    if([95, 96, 99].includes(weatherCode)) return { label: '雷雨', icon: 'cloud-lightning' };
    return { label: '天氣資料更新中', icon: 'cloud-sun' };
};
window.formatHeroWeatherTemp = function(value) {
    const temp = Number(value);
    if(Number.isNaN(temp)) return '--';
    return `${Math.round(temp)}°C`;
};
window.formatHeroWeatherWind = function(value) {
    const speed = Number(value);
    if(Number.isNaN(speed)) return '--';
    return `${Math.round(speed)} km/h`;
};
window.formatHeroWeatherTime = function(rawValue) {
    if(!rawValue) return '剛剛更新';
    const date = new Date(String(rawValue).replace('T', ' ').replace(/-/g, '/'));
    if(Number.isNaN(date.getTime())) return '今日更新';
    const payloadDate = date.toLocaleDateString('sv-SE', { timeZone: (window.heroWeatherConfig && window.heroWeatherConfig.timezone) || 'Asia/Taipei' });
    const today = typeof window.getLocalDateString === 'function'
        ? window.getLocalDateString()
        : new Date().toLocaleDateString('sv-SE', { timeZone: (window.heroWeatherConfig && window.heroWeatherConfig.timezone) || 'Asia/Taipei' });
    const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    if(payloadDate !== today) {
        return `${payloadDate.replace(/-/g, '/')} ${timeLabel}`;
    }
    return `${timeLabel} 更新`;
};
window.readHeroWeatherCache = function() {
    try {
        return JSON.parse(localStorage.getItem(window.heroWeatherCacheKey) || 'null');
    } catch(error) {
        return null;
    }
};
window.writeHeroWeatherCache = function(payload) {
    try {
        localStorage.setItem(window.heroWeatherCacheKey, JSON.stringify(payload));
    } catch(error) {}
};
window.renderHeroWeatherLoading = function() {
    const conditionNode = $('hero-weather-condition');
    const currentNode = $('hero-weather-current');
    const rangeNode = $('hero-weather-range');
    const rainNode = $('hero-weather-rain');
    const rainInlineNode = $('hero-weather-rain-inline');
    const windNode = $('hero-weather-wind');
    const updatedNode = $('hero-weather-updated');
    const iconNode = $('hero-weather-icon');
    const statusNode = $('hero-weather-status');
    if(conditionNode) conditionNode.textContent = '讀取今日天氣中...';
    if(currentNode) currentNode.textContent = '--';
    if(rangeNode) rangeNode.textContent = '--';
    if(rainNode) rainNode.textContent = '--';
    if(rainInlineNode) rainInlineNode.textContent = '--';
    if(windNode) windNode.textContent = '--';
    if(updatedNode) updatedNode.textContent = '同步中';
    if(statusNode) statusNode.textContent = '即時預報';
    if(iconNode) iconNode.innerHTML = '<i data-lucide="cloud-sun" class="h-5 w-5"></i>';
    if(window.lucide) window.lucide.createIcons();
};
window.renderHeroWeatherError = function(message = '今日天氣暫時無法載入', options = {}) {
    const conditionNode = $('hero-weather-condition');
    const currentNode = $('hero-weather-current');
    const rangeNode = $('hero-weather-range');
    const rainNode = $('hero-weather-rain');
    const rainInlineNode = $('hero-weather-rain-inline');
    const windNode = $('hero-weather-wind');
    const updatedNode = $('hero-weather-updated');
    const iconNode = $('hero-weather-icon');
    const statusNode = $('hero-weather-status');
    const fallbackStatus = options.statusLabel || ((typeof navigator !== 'undefined' && navigator && navigator.onLine === false) ? '網路未連線' : '天氣服務異常');
    const fallbackUpdated = options.updatedLabel || '稍後再試';
    const fallbackIcon = options.icon || ((typeof navigator !== 'undefined' && navigator && navigator.onLine === false) ? 'cloud-off' : 'cloud');
    if(conditionNode) conditionNode.textContent = message;
    if(currentNode) currentNode.textContent = '--';
    if(rangeNode) rangeNode.textContent = '--';
    if(rainNode) rainNode.textContent = '--';
    if(rainInlineNode) rainInlineNode.textContent = '--';
    if(windNode) windNode.textContent = '--';
    if(updatedNode) updatedNode.textContent = fallbackUpdated;
    if(statusNode) statusNode.textContent = fallbackStatus;
    if(iconNode) iconNode.innerHTML = `<i data-lucide="${fallbackIcon}" class="h-5 w-5"></i>`;
    if(window.lucide) window.lucide.createIcons();
};
window.renderHeroWeatherCachedFallback = function(payload, options = {}) {
    if(!payload) return false;
    const fallbackPayload = {
        ...payload,
        statusLabel: options.statusLabel || '離線快取'
    };
    window.renderHeroWeather(fallbackPayload);
    if($('hero-weather-updated')) {
        $('hero-weather-updated').textContent = options.updatedLabel
            || (window.formatHeroWeatherTime(payload.updatedAt) + ' · 快取');
    }
    if($('hero-weather-icon') && options.icon) {
        $('hero-weather-icon').innerHTML = `<i data-lucide="${options.icon}" class="h-5 w-5"></i>`;
    }
    if(window.lucide) window.lucide.createIcons();
    return true;
};
window.renderHeroWeather = function(payload) {
    if(!payload) {
        window.renderHeroWeatherError();
        return;
    }
    const meta = window.getHeroWeatherMeta(payload.weatherCode, payload.isDay);
    if($('hero-weather-location')) $('hero-weather-location').textContent = payload.locationLabel || window.heroWeatherConfig.label;
    if($('hero-weather-status')) $('hero-weather-status').textContent = payload.statusLabel || '即時預報';
    if($('hero-weather-condition')) $('hero-weather-condition').textContent = meta.label;
    if($('hero-weather-current')) $('hero-weather-current').textContent = window.formatHeroWeatherTemp(payload.currentTemp);
    if($('hero-weather-range')) $('hero-weather-range').textContent = `${window.formatHeroWeatherTemp(payload.tempMax)} / ${window.formatHeroWeatherTemp(payload.tempMin)}`;
    if($('hero-weather-rain')) $('hero-weather-rain').textContent = Number.isFinite(Number(payload.rainChance)) ? `${Math.round(Number(payload.rainChance))}%` : '--';
    if($('hero-weather-rain-inline')) $('hero-weather-rain-inline').textContent = Number.isFinite(Number(payload.rainChance)) ? `${Math.round(Number(payload.rainChance))}%` : '--';
    if($('hero-weather-wind')) $('hero-weather-wind').textContent = window.formatHeroWeatherWind(payload.windMax);
    if($('hero-weather-updated')) $('hero-weather-updated').textContent = window.formatHeroWeatherTime(payload.updatedAt);
    if($('hero-weather-icon')) $('hero-weather-icon').innerHTML = `<i data-lucide="${meta.icon}" class="h-5 w-5"></i>`;
    window.heroWeatherState.lastDate = String(payload.date || '');
    window.heroWeatherState.lastUpdatedLabel = String(payload.updatedAt || '');
    window.heroWeatherState.lastPayload = payload;
    if(window.lucide) window.lucide.createIcons();
};
window.loadHeroWeather = async function(options = {}) {
    const config = window.heroWeatherConfig || {};
    const today = typeof window.getLocalDateString === 'function'
        ? window.getLocalDateString()
        : new Date().toLocaleDateString('sv-SE', { timeZone: config.timezone || 'Asia/Taipei' });
    const cacheMinutes = Number(config.cacheMinutes || 30);
    const cached = window.readHeroWeatherCache();
    const fallbackPayload = (window.heroWeatherState && window.heroWeatherState.lastPayload) || (cached && cached.payload) || null;
    if(!options.force && cached && cached.date === today && cached.savedAt && (Date.now() - Number(cached.savedAt) < cacheMinutes * 60 * 1000) && cached.payload) {
        window.renderHeroWeather(cached.payload);
        return cached.payload;
    }
    if(window.heroWeatherState.loading) return null;
    window.heroWeatherState.loading = true;
    if(!fallbackPayload) window.renderHeroWeatherLoading();
    try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(config.latitude));
        url.searchParams.set('longitude', String(config.longitude));
        url.searchParams.set('timezone', String(config.timezone || 'Asia/Taipei'));
        url.searchParams.set('forecast_days', '1');
        url.searchParams.set('current', 'temperature_2m,weather_code,is_day');
        url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max');
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if(!response.ok) throw new Error(`Weather HTTP ${response.status}`);
        const data = await response.json();
        const current = data && data.current ? data.current : {};
        const daily = data && data.daily ? data.daily : {};
        const payload = {
            locationLabel: String(config.label || '校區今日天氣'),
            statusLabel: '當日預報',
            date: Array.isArray(daily.time) ? String(daily.time[0] || today) : today,
            updatedAt: String(current.time || ''),
            weatherCode: Array.isArray(daily.weather_code) ? Number(daily.weather_code[0]) : Number(current.weather_code),
            isDay: Number(current.is_day) !== 0,
            currentTemp: Number(current.temperature_2m),
            tempMax: Array.isArray(daily.temperature_2m_max) ? Number(daily.temperature_2m_max[0]) : NaN,
            tempMin: Array.isArray(daily.temperature_2m_min) ? Number(daily.temperature_2m_min[0]) : NaN,
            rainChance: Array.isArray(daily.precipitation_probability_max) ? Number(daily.precipitation_probability_max[0]) : NaN,
            windMax: Array.isArray(daily.wind_speed_10m_max) ? Number(daily.wind_speed_10m_max[0]) : NaN
        };
        window.renderHeroWeather(payload);
        window.writeHeroWeatherCache({
            date: payload.date,
            savedAt: Date.now(),
            payload
        });
        return payload;
    } catch(error) {
        console.warn('loadHeroWeather failed:', error);
        const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
        if(fallbackPayload) {
            window.renderHeroWeatherCachedFallback(fallbackPayload, {
                statusLabel: offline ? '離線快取' : '暫用前次資料',
                updatedLabel: offline ? (window.formatHeroWeatherTime(fallbackPayload.updatedAt) + ' · 離線') : (window.formatHeroWeatherTime(fallbackPayload.updatedAt) + ' · 前次資料'),
                icon: offline ? 'cloud-off' : 'cloud'
            });
            return fallbackPayload;
        }
        window.renderHeroWeatherError('今天天氣暫時無法載入', {
            statusLabel: offline ? '網路未連線' : '天氣服務異常',
            updatedLabel: offline ? '請檢查網路' : '稍後再試',
            icon: offline ? 'cloud-off' : 'cloud'
        });
        return null;
    } finally {
        window.heroWeatherState.loading = false;
    }
};
window.refreshHeroWeatherIfNeeded = function() {
    const today = typeof window.getLocalDateString === 'function'
        ? window.getLocalDateString()
        : new Date().toLocaleDateString('sv-SE', { timeZone: (window.heroWeatherConfig && window.heroWeatherConfig.timezone) || 'Asia/Taipei' });
    if(window.heroWeatherState.lastDate !== today) {
        window.loadHeroWeather({ force: true }).catch(error => {
            console.warn('refreshHeroWeatherIfNeeded failed:', error);
        });
    }
};
window.startHeroWeatherAutoRefresh = function() {
    const refreshMinutes = Number((window.heroWeatherConfig && window.heroWeatherConfig.refreshMinutes) || 15);
    const refreshMs = refreshMinutes * 60 * 1000;
    if(window.heroWeatherRefreshTimer || !Number.isFinite(refreshMs) || refreshMs < 60000) return;
    window.heroWeatherRefreshTimer = setInterval(() => {
        if(document.hidden || window.securityLockdown) return;
        window.loadHeroWeather({ force: true }).catch(error => {
            console.warn('hero weather auto refresh failed:', error);
        });
    }, refreshMs);
};
window.stopHeroWeatherAutoRefresh = function() {
    if(window.heroWeatherRefreshTimer) {
        clearInterval(window.heroWeatherRefreshTimer);
        window.heroWeatherRefreshTimer = null;
    }
};
window.applyNightMode = function(enabled, options = {}) {
    const nextEnabled = !!enabled;
    document.body.classList.toggle('night-mode', nextEnabled);
    document.documentElement.style.colorScheme = nextEnabled ? 'dark' : 'light';
    if(options.persist !== false) {
        try {
            localStorage.setItem(window.themeStorageKey, nextEnabled ? '1' : '0');
        } catch(error) {}
    }
    window.syncNightModeToggle();
    if(options.toast) window.showToast(nextEnabled ? '已開啟夜間模式' : '已切回日間模式');
};
window.toggleNightMode = function() {
    window.applyNightMode(!document.body.classList.contains('night-mode'), { toast: true });
};

window.closeSecurityAlert = function() { hide('security-alert-modal'); };
window.raiseSecurityAlert = function(title, message, lock = false) {
    if($('security-alert-title')) $('security-alert-title').innerText = title || '安全保護已啟動';
    if($('security-alert-message')) $('security-alert-message').innerText = message || '系統偵測到可疑行為，已暫時鎖定敏感功能。';
    show('security-alert-modal');
    window.stopAutoRefresh();
    if(lock) window.securityLockdown = true;
    if(window.lucide) window.lucide.createIcons();
};
window.lockSensitiveSession = function(reason = '偵測到視窗離開過久，已自動鎖定後台敏感資料。') {
    if(window.currentAdminRole === 'none' && !$('admin-tab')?.classList.contains('active')) return;
    $$('.mod-w').forEach(el => {
        if(el && el.id !== 'security-alert-modal') {
            el.classList.add('hidden');
            el.style.display = 'none';
        }
    });
    if(typeof window.closeExhibitionScheduleEditor === 'function') window.closeExhibitionScheduleEditor();
    window.currentAdminRole = 'none';
    window.switchTab('borrow-tab');
    window.showToast('安全模式已鎖定', 'success');
    window.raiseSecurityAlert('敏感資料已鎖定', reason, false);
};
window.resetHiddenSecurityTimer = function() {
    if(window.securityTabLockTimer) {
        clearTimeout(window.securityTabLockTimer);
        window.securityTabLockTimer = null;
    }
    if(document.hidden && $('admin-tab') && $('admin-tab').classList.contains('active')) {
        window.securityTabLockTimer = setTimeout(() => {
            window.lockSensitiveSession();
        }, window.securityHiddenLockMs);
    }
};
window.runSecurityIntegrityCheck = function() {
    const badAssets = Array.from(document.querySelectorAll('script[src],link[href]')).filter(node => {
        const ref = node.tagName === 'SCRIPT' ? node.getAttribute('src') : node.getAttribute('href');
        if(!ref) return false;
        let url;
        try { url = new URL(ref, window.location.href); } catch(err) { return false; }
        if(!/^https?:$/i.test(url.protocol)) return false;
        if(url.origin === window.location.origin) return false;
        return !window.securityAllowedAssetHosts.has(url.hostname);
    });
    if(badAssets.length) {
        const asset = badAssets[0].getAttribute('src') || badAssets[0].getAttribute('href') || '未知來源';
        window.raiseSecurityAlert('偵測到未授權外部資源', '頁面載入了未在白名單內的資源：' + asset + '。系統已停止自動更新，請先確認檔案是否被竄改。', true);
    }
};
window.installNetworkGuard = function() {
    if(window.__networkGuardInstalled || !window.fetch) return;
    window.__networkGuardInstalled = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function(input, init) {
        if(window.securityLockdown) {
            return Promise.reject(new Error('Security lockdown active'));
        }
        let url;
        try {
            const raw = typeof input === 'string' ? input : (input && input.url ? input.url : '');
            url = new URL(raw, window.location.href);
        } catch(err) {
            return nativeFetch(input, init);
        }
        if(url.protocol === 'http:') {
            window.raiseSecurityAlert('已阻擋不安全連線', '系統只允許 HTTPS 外部連線，已阻擋：' + url.href, true);
            return Promise.reject(new Error('Blocked insecure request'));
        }
        if(/^https?:$/i.test(url.protocol) && url.origin !== window.location.origin && !window.securityAllowedFetchHosts.has(url.hostname)) {
            window.raiseSecurityAlert('已阻擋可疑外傳連線', '這個頁面嘗試連到未授權網域：' + url.hostname + '。為避免資料外流，系統已中止請求。', true);
            return Promise.reject(new Error('Blocked outbound request'));
        }
        return nativeFetch(input, init);
    };
};

// --- 資料讀取 Helper ---
window.getId = i => i?.ID || i?.id || '';
window.getBorrower = i => i?.borrower || i?.借用人 || '';
window.getEquip = i => i?.equipment || i?.設備名稱 || '';
window.getStatus = i => i?.status || i?.狀態 || '';
window.getTime = i => i?.time || i?.借用時間 || '';
window.getExpDate = i => i?.expectedReturnDate || i?.預計歸還日期 || '';
window.getRetTime = i => i?.returningTime || i?.returnTime || i?.returnedAt || i?.歸還時間 || i?.實際歸還時間 || i?.實際歸還 || '';
window.getQty = i => i?.quantity || i?.數量 || 1;
window.getRequestRef = i => i?.requestRef || i?.申請參照 || '';
window.normalizeBorrowRecordOverrides = function(rawOverrides) {
    const source = rawOverrides && typeof rawOverrides === 'object' && !Array.isArray(rawOverrides) ? rawOverrides : {};
    const normalized = {};
    Object.keys(source).forEach(key => {
        const item = source[key];
        if(!item || typeof item !== 'object' || Array.isArray(item)) return;
        const recordId = String(key || '').trim();
        if(!recordId) return;
        const next = {};
        if(item.borrower !== undefined) next.borrower = String(item.borrower || '').trim();
        if(item.equipment !== undefined) next.equipment = String(item.equipment || '').trim();
        if(item.expectedReturnDate !== undefined) next.expectedReturnDate = String(item.expectedReturnDate || '').trim();
        if(item.time !== undefined) next.time = String(item.time || '').trim();
        if(item.quantity !== undefined) {
            const qty = Number(item.quantity);
            next.quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
        }
        if(item.status !== undefined) next.status = String(item.status || '').trim();
        if(Object.keys(next).length) normalized[recordId] = next;
    });
    return normalized;
};
window.applyBorrowRecordOverridesToData = function(records) {
    const list = Array.isArray(records) ? records : [];
    const overrides = window.normalizeBorrowRecordOverrides(window.borrowRecordOverrides);
    window.borrowRecordOverrides = overrides;
    return list.map(record => {
        if(!record || typeof record !== 'object') return record;
        const override = overrides[String(window.getId(record))];
        if(!override) return record;
        const merged = { ...record };
        if(override.borrower !== undefined) { merged.borrower = override.borrower; merged.借用人 = override.borrower; }
        if(override.equipment !== undefined) { merged.equipment = override.equipment; merged.設備名稱 = override.equipment; }
        if(override.expectedReturnDate !== undefined) { merged.expectedReturnDate = override.expectedReturnDate; merged.預計歸還日期 = override.expectedReturnDate; }
        if(override.time !== undefined) { merged.time = override.time; merged.借用時間 = override.time; }
        if(override.quantity !== undefined) { merged.quantity = override.quantity; merged.數量 = override.quantity; }
        if(override.status !== undefined) { merged.status = override.status; merged.狀態 = override.status; }
        return merged;
    });
};
window.buildTeacherScheduleSettingsPayload = function() {
    const raw = JSON.stringify(window.teacherSchedules || []);
    const chunkSize = Math.max(Number(window.teacherScheduleSettingsChunkSize) || 30000, 12000);
    if(raw.length <= chunkSize) {
        return [{ category:'__SYSTEM_SETTINGS__', name:'TEACHER_SCHEDULES', propertyNo:raw, location:'SYSTEM' }];
    }
    const chunks = [];
    const total = Math.ceil(raw.length / chunkSize);
    for(let index = 0; index < total; index += 1) {
        chunks.push({
            category:'__SYSTEM_SETTINGS__',
            name:'TEACHER_SCHEDULES__PART__' + String(index + 1).padStart(3, '0'),
            propertyNo: raw.slice(index * chunkSize, (index + 1) * chunkSize),
            location:'SYSTEM'
        });
    }
    chunks.push({
        category:'__SYSTEM_SETTINGS__',
        name:'TEACHER_SCHEDULES_META',
        propertyNo: JSON.stringify({ version: 2, total }),
        location:'SYSTEM'
    });
    return chunks;
};
window.readTeacherScheduleSettingsFromEquipment = function(eqRaw) {
    const settings = Array.isArray(eqRaw) ? eqRaw : [];
    const partEntries = settings
        .filter(entry => /^TEACHER_SCHEDULES__PART__\d+$/.test(String(entry && entry.name || '')))
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if(partEntries.length) {
        const joined = partEntries.map(entry => String(entry.propertyNo || '')).join('');
        if(!joined) return [];
        const parsed = JSON.parse(joined);
        return Array.isArray(parsed) ? parsed : [];
    }
    const single = settings.find(entry => entry && entry.name === 'TEACHER_SCHEDULES');
    if(!single) return [];
    const parsedSingle = typeof single.propertyNo === 'string' ? JSON.parse(single.propertyNo) : single.propertyNo;
    return Array.isArray(parsedSingle) ? parsedSingle : [];
};
window.parseCloudSettingsField = function(rawValue) {
    if(rawValue == null) return null;
    if(typeof rawValue !== 'string') return rawValue;
    try {
        return JSON.parse(rawValue);
    } catch(error) {
        return rawValue;
    }
};
window.normalizeBooleanFlag = function(value) {
    if(value === true || value === false) return value;
    if(typeof value === 'number') return value !== 0;
    const normalized = String(value == null ? '' : value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on', '是', '要', '常借', '常借設備'].includes(normalized);
};
window.normalizeEquipmentRecord = function(record) {
    const source = record && typeof record === 'object' ? record : {};
    return {
        category: String(source.category || source['分類'] || '').trim(),
        name: String(source.name || source['名稱'] || '').trim(),
        propertyNo: String(source.propertyNo || source['財產編號'] || source['財編'] || '').trim(),
        location: String(source.location || source['存放地點'] || source['地點'] || '').trim(),
        frequentBorrow: window.normalizeBooleanFlag(
            source.frequentBorrow != null
                ? source.frequentBorrow
                : (source.isCommonBorrow != null
                    ? source.isCommonBorrow
                    : (source.frontVisible != null
                        ? source.frontVisible
                        : source['常借設備']))
        )
    };
};
window.normalizeTrustedDeviceEntry = function(entry) {
    const source = entry && typeof entry === 'object' ? entry : {};
    return {
        id: String(source.id || '').trim(),
        name: String(source.name || '').trim(),
        browser: String(source.browser || '').trim(),
        platform: String(source.platform || '').trim(),
        screen: String(source.screen || '').trim(),
        approvedAt: String(source.approvedAt || '').trim(),
        approvedBy: String(source.approvedBy || '').trim(),
        lastUnlockAt: String(source.lastUnlockAt || '').trim()
    };
};
window.getFaceMemoryGroupLimit = function() {
    return 3;
};
window.encodeFaceDescriptorVector = function(values, mode = 'i16') {
    const source = window.normalizeFaceDescriptorVector(values);
    if(!source.length || typeof btoa !== 'function') return '';
    const normalizedMode = mode === 'i8' ? 'i8' : 'i16';
    const scale = normalizedMode === 'i8' ? 127 : 32767;
    const typedArray = normalizedMode === 'i8'
        ? new Int8Array(source.length)
        : new Int16Array(source.length);
    for(let index = 0; index < source.length; index += 1) {
        const value = Math.max(-1, Math.min(1, Number(source[index]) || 0));
        typedArray[index] = Math.max(-scale, Math.min(scale, Math.round(value * scale)));
    }
    const bytes = new Uint8Array(typedArray.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for(let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, offset + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return normalizedMode + ':' + btoa(binary);
};
window.decodeFaceDescriptorVector = function(value) {
    if(Array.isArray(value)) return window.normalizeFaceDescriptorVector(value);
    const raw = String(value || '').trim();
    if(!raw) return [];
    const separatorIndex = raw.indexOf(':');
    if(separatorIndex <= 0 || typeof atob !== 'function') return [];
    const mode = raw.slice(0, separatorIndex);
    const encoded = raw.slice(separatorIndex + 1);
    if(!encoded) return [];
    try {
        const binary = atob(encoded);
        const bytes = new Uint8Array(binary.length);
        for(let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }
        let descriptor = [];
        if(mode === 'i8') {
            const typed = new Int8Array(bytes.buffer);
            descriptor = Array.from(typed, value => Number(value) / 127);
        } else if(mode === 'i16') {
            const typed = new Int16Array(bytes.buffer);
            descriptor = Array.from(typed, value => Number(value) / 32767);
        }
        return window.normalizeFaceDescriptorVector(descriptor);
    } catch(error) {
        return [];
    }
};
window.buildFaceMemoryDescriptors = function(sampleDescriptors, sampleWeights = [], maxGroups = window.getFaceMemoryGroupLimit()) {
    const descriptors = (Array.isArray(sampleDescriptors) ? sampleDescriptors : [])
        .map(window.normalizeFaceDescriptorVector)
        .filter(item => item.length);
    if(!descriptors.length) return [];
    const weights = descriptors.map((_, index) => Math.max(0.3, Number(sampleWeights[index]) || 0.3));
    const memories = [];
    const averageDescriptor = window.averageWeightedFaceDescriptors(descriptors, weights);
    if(averageDescriptor.length) memories.push(averageDescriptor);
    const ranked = descriptors.map((descriptor, index) => ({
        descriptor,
        weight: weights[index],
        diversity: averageDescriptor.length ? Math.max(0, 1 - window.compareFaceDescriptors(descriptor, averageDescriptor)) : 1
    })).sort((left, right) => {
        if(right.diversity !== left.diversity) return right.diversity - left.diversity;
        return right.weight - left.weight;
    });
    ranked.forEach(item => {
        if(memories.length >= Math.max(1, Number(maxGroups) || 1)) return;
        const tooClose = memories.some(memory => window.compareFaceDescriptors(memory, item.descriptor) > 0.9925);
        if(!tooClose) memories.push(item.descriptor);
    });
    if(memories.length === 1 && descriptors.length > 1) {
        const fallback = ranked.find(item => window.compareFaceDescriptors(memories[0], item.descriptor) < 0.997);
        if(fallback) memories.push(fallback.descriptor);
    }
    return memories.slice(0, Math.max(1, Number(maxGroups) || 1));
};
window.normalizeFaceProfileEntry = function(entry) {
    const source = entry && typeof entry === 'object' ? entry : {};
    const memoryDescriptors = (Array.isArray(source.memoryDescriptors) ? source.memoryDescriptors : [])
        .map(sample => window.decodeFaceDescriptorVector(sample))
        .filter(sample => sample.length);
    const sampleDescriptors = (Array.isArray(source.sampleDescriptors) ? source.sampleDescriptors : [])
        .map(sample => window.decodeFaceDescriptorVector(sample))
        .filter(sample => sample.length);
    const legacyMemoryDescriptors = (Array.isArray(source.legacyMemoryDescriptors) ? source.legacyMemoryDescriptors : [])
        .map(sample => window.decodeFaceDescriptorVector(sample))
        .filter(sample => sample.length);
    const legacySampleDescriptors = (Array.isArray(source.legacySampleDescriptors) ? source.legacySampleDescriptors : [])
        .map(sample => window.decodeFaceDescriptorVector(sample))
        .filter(sample => sample.length);
    const descriptor = window.decodeFaceDescriptorVector(source.descriptor);
    const legacyDescriptor = window.decodeFaceDescriptorVector(source.legacyDescriptor);
    const mergedDescriptor = descriptor.length
        ? descriptor
        : (sampleDescriptors.length
            ? window.averageFaceDescriptors(sampleDescriptors)
            : (memoryDescriptors.length ? window.averageFaceDescriptors(memoryDescriptors) : []));
    const mergedLegacyDescriptor = legacyDescriptor.length
        ? legacyDescriptor
        : (legacySampleDescriptors.length
            ? window.averageFaceDescriptors(legacySampleDescriptors)
            : (legacyMemoryDescriptors.length ? window.averageFaceDescriptors(legacyMemoryDescriptors) : []));
    const descriptorVersion = Number(source.descriptorVersion) || (mergedDescriptor.length >= 300 ? 2 : 1);
    const normalizedMemoryDescriptors = memoryDescriptors.length
        ? memoryDescriptors
        : window.buildFaceMemoryDescriptors(sampleDescriptors, [], window.getFaceMemoryGroupLimit());
    const normalizedLegacyMemoryDescriptors = legacyMemoryDescriptors.length
        ? legacyMemoryDescriptors
        : window.buildFaceMemoryDescriptors(legacySampleDescriptors, [], Math.max(1, window.getFaceMemoryGroupLimit() - 1));
    return {
        id: String(source.id || '').trim(),
        name: String(source.name || '').trim(),
        descriptorVersion,
        descriptor: mergedDescriptor,
        legacyDescriptor: mergedLegacyDescriptor,
        memoryDescriptors: normalizedMemoryDescriptors,
        legacyMemoryDescriptors: normalizedLegacyMemoryDescriptors,
        sampleDescriptors: sampleDescriptors.length
            ? sampleDescriptors
            : (normalizedMemoryDescriptors.length ? normalizedMemoryDescriptors : (mergedDescriptor.length ? [mergedDescriptor] : [])),
        legacySampleDescriptors: legacySampleDescriptors.length
            ? legacySampleDescriptors
            : (normalizedLegacyMemoryDescriptors.length ? normalizedLegacyMemoryDescriptors : (mergedLegacyDescriptor.length ? [mergedLegacyDescriptor] : [])),
        preview: String(source.preview || '').trim(),
        sampleCount: Math.max(
            Number(source.sampleCount) || 0,
            sampleDescriptors.length,
            legacySampleDescriptors.length,
            normalizedMemoryDescriptors.length,
            normalizedLegacyMemoryDescriptors.length,
            mergedDescriptor.length ? 1 : 0,
            mergedLegacyDescriptor.length ? 1 : 0
        ),
        registeredAt: String(source.registeredAt || '').trim(),
        updatedAt: String(source.updatedAt || '').trim(),
        lastVerifiedAt: String(source.lastVerifiedAt || '').trim()
    };
};
window.normalizeFaceRecognitionConfig = function(config) {
    const source = config && typeof config === 'object' ? config : {};
    const threshold = Number(source.threshold);
    return {
        enabled: !!source.enabled,
        allowPasswordFallback: source.allowPasswordFallback !== false,
        threshold: Number.isFinite(threshold) ? Math.min(0.97, Math.max(0.8, threshold)) : 0.86,
        profiles: (Array.isArray(source.profiles) ? source.profiles : [])
            .map(window.normalizeFaceProfileEntry)
            .filter(item => item.id && item.name && (
                item.descriptor.length
                || item.sampleDescriptors.length
                || item.legacyDescriptor.length
                || item.legacySampleDescriptors.length
            ))
    };
};
window.normalizeDeviceAccessConfig = function(config) {
    const source = config && typeof config === 'object' ? config : {};
    return {
        enabled: !!source.enabled,
        password: String(source.password || '').trim(),
        trustedDevices: (Array.isArray(source.trustedDevices) ? source.trustedDevices : [])
            .map(window.normalizeTrustedDeviceEntry)
            .filter(item => item.id),
        faceRecognition: window.normalizeFaceRecognitionConfig(source.faceRecognition)
    };
};
window.createDeviceAccessId = function(prefix = 'device') {
    if(window.crypto && typeof window.crypto.randomUUID === 'function') return prefix + '-' + window.crypto.randomUUID();
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
};
window.ensureCurrentDeviceId = function() {
    const key = window.deviceAccessStorageKeys.currentId;
    let currentId = localStorage.getItem(key) || '';
    if(!currentId) {
        currentId = window.createDeviceAccessId('trusted');
        localStorage.setItem(key, currentId);
    }
    return currentId;
};
window.getDeviceAccessBrowserName = function() {
    const ua = navigator.userAgent || '';
    if(/edg\//i.test(ua)) return 'Microsoft Edge';
    if(/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
    if(/chrome\//i.test(ua) && !/edg\//i.test(ua)) return 'Chrome';
    if(/safari\//i.test(ua) && !/chrome\//i.test(ua)) return 'Safari';
    if(/firefox\//i.test(ua)) return 'Firefox';
    return 'Unknown Browser';
};
window.getDeviceAccessPlatformName = function() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    if(/iphone/i.test(ua)) return 'iPhone';
    if(/ipad/i.test(ua)) return 'iPad';
    if(/android/i.test(ua)) return 'Android';
    if(/mac/i.test(platform) || /macintosh/i.test(ua)) return 'Mac';
    if(/win/i.test(platform) || /windows/i.test(ua)) return 'Windows';
    if(/linux/i.test(platform) || /linux/i.test(ua)) return 'Linux';
    return platform || 'Unknown Device';
};
window.getCurrentDeviceDescriptor = function() {
    const deviceId = window.ensureCurrentDeviceId();
    const browser = window.getDeviceAccessBrowserName();
    const platform = window.getDeviceAccessPlatformName();
    const screenText = window.screen ? (window.screen.width + 'x' + window.screen.height) : 'unknown';
    return {
        id: deviceId,
        name: platform + ' / ' + browser,
        browser,
        platform,
        screen: screenText,
        approvedAt: '',
        approvedBy: '',
        lastUnlockAt: ''
    };
};
window.getCurrentTrustedDeviceEntry = function() {
    const currentId = window.ensureCurrentDeviceId();
    const config = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    return (config.trustedDevices || []).find(item => item.id === currentId) || null;
};
window.isCurrentDeviceTrusted = function() {
    return !!window.getCurrentTrustedDeviceEntry();
};
window.isDeviceAccessSessionUnlocked = function() {
    try {
        return sessionStorage.getItem(window.deviceAccessStorageKeys.session) === window.ensureCurrentDeviceId();
    } catch(error) {
        return false;
    }
};
window.markDeviceAccessSessionUnlocked = function() {
    try {
        sessionStorage.setItem(window.deviceAccessStorageKeys.session, window.ensureCurrentDeviceId());
    } catch(error) {}
};
window.persistDeviceAccessConfigLocal = function() {
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    localStorage.setItem(window.deviceAccessStorageKeys.config, JSON.stringify(window.deviceAccessConfig));
};
window.buildDeviceAccessCloudConfig = function(config, options = {}) {
    const normalized = window.normalizeDeviceAccessConfig(config || window.deviceAccessConfig);
    const descriptorEncoding = options.descriptorEncoding === 'i8' ? 'i8' : 'i16';
    const memoryLimit = Math.max(1, Number(options.memoryLimit) || window.getFaceMemoryGroupLimit());
    return {
        enabled: normalized.enabled,
        password: normalized.password,
        trustedDevices: Array.isArray(normalized.trustedDevices)
            ? normalized.trustedDevices.map(window.normalizeTrustedDeviceEntry).filter(item => item.id)
            : [],
        faceRecognition: {
            ...window.normalizeFaceRecognitionConfig(normalized.faceRecognition),
            profiles: (Array.isArray(normalized.faceRecognition && normalized.faceRecognition.profiles)
                ? normalized.faceRecognition.profiles
                : []
            ).map(profile => {
                const normalizedProfile = window.normalizeFaceProfileEntry(profile);
                return {
                    id: normalizedProfile.id,
                    name: normalizedProfile.name,
                    descriptorVersion: normalizedProfile.descriptorVersion || 2,
                    descriptor: window.encodeFaceDescriptorVector(normalizedProfile.descriptor, descriptorEncoding),
                    legacyDescriptor: window.encodeFaceDescriptorVector(normalizedProfile.legacyDescriptor, descriptorEncoding),
                    memoryDescriptors: (Array.isArray(normalizedProfile.memoryDescriptors)
                        ? normalizedProfile.memoryDescriptors
                        : window.buildFaceMemoryDescriptors(normalizedProfile.sampleDescriptors, [], memoryLimit)
                    )
                        .slice(0, memoryLimit)
                        .map(memory => window.encodeFaceDescriptorVector(memory, descriptorEncoding))
                        .filter(Boolean),
                    legacyMemoryDescriptors: (Array.isArray(normalizedProfile.legacyMemoryDescriptors)
                        ? normalizedProfile.legacyMemoryDescriptors
                        : window.buildFaceMemoryDescriptors(
                            normalizedProfile.legacySampleDescriptors,
                            [],
                            Math.max(1, memoryLimit - 1)
                        )
                    )
                        .slice(0, Math.max(1, memoryLimit - 1))
                        .map(memory => window.encodeFaceDescriptorVector(memory, descriptorEncoding))
                        .filter(Boolean),
                    sampleDescriptors: [],
                    legacySampleDescriptors: [],
                    sampleCount: normalizedProfile.sampleCount,
                    preview: '',
                    registeredAt: normalizedProfile.registeredAt,
                    updatedAt: normalizedProfile.updatedAt,
                    lastVerifiedAt: normalizedProfile.lastVerifiedAt
                };
            })
        }
    };
};
window.saveDeviceAccessConfigToCloud = async function() {
    window.lastSettingsSaveError = '';
    window.persistDeviceAccessConfigLocal();
    const gasUrl = $('gas-url') ? $('gas-url').value.trim() : '';
    if(!gasUrl.startsWith('http')) return true;
    const authToken = window.getAdminAuthToken();
    if(!authToken) {
        window.lastSettingsSaveError = '需要管理員重新登入後才能同步裝置與人臉門禁設定。';
        return false;
    }
    try {
        const maxChars = Math.max(Number(window.cloudSettingsMaxCharsPerField) || 47000, 22000);
        const payloadOptions = [
            { descriptorEncoding: 'i16', memoryLimit: window.getFaceMemoryGroupLimit() },
            { descriptorEncoding: 'i8', memoryLimit: window.getFaceMemoryGroupLimit() },
            { descriptorEncoding: 'i8', memoryLimit: 2 },
            { descriptorEncoding: 'i8', memoryLimit: 1 }
        ];
        let cloudConfig = null;
        let expectedConfig = null;
        let payload = '';
        for(const option of payloadOptions) {
            const candidateConfig = window.buildDeviceAccessCloudConfig(window.deviceAccessConfig, option);
            const candidatePayload = JSON.stringify(candidateConfig);
            if(candidatePayload.length <= maxChars) {
                cloudConfig = candidateConfig;
                expectedConfig = window.normalizeDeviceAccessConfig(candidateConfig);
                payload = candidatePayload;
                break;
            }
        }
        if(!cloudConfig || !payload || !expectedConfig) {
            window.lastSettingsSaveError = '人臉辨識資料超過雲端同步上限，請減少已註冊人臉數量後再試。';
            return false;
        }
        const equipmentPayload = JSON.stringify({
            version: 5,
            items: [],
            itemsStoredInSheet: true,
            itemCount: Array.isArray(window.equipmentList) ? window.equipmentList.length : 0,
            system: {
                periods: Array.isArray(window.periodList) ? window.periodList : [],
                roomSchedules: window.roomSchedules || {},
                exhibitionAnnouncement: window.exhibitionAnnouncement || '',
                exhibitionBlockedRanges: Array.isArray(window.exhibitionBlockedRanges) ? window.exhibitionBlockedRanges : [],
                borrowRecordOverrides: typeof window.normalizeBorrowRecordOverrides === 'function'
                    ? window.normalizeBorrowRecordOverrides(window.borrowRecordOverrides)
                    : (window.borrowRecordOverrides || {}),
                deviceAccess: cloudConfig,
                campusMapConfig: typeof window.normalizeCampusMapConfig === 'function'
                    ? window.normalizeCampusMapConfig(window.campusMapConfig)
                    : (window.campusMapConfig || null)
            }
        });
        const equipmentSheetPayload = JSON.stringify(Array.isArray(window.equipmentList) ? window.equipmentList : []);
        const response = await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveSettings',
                authToken,
                deviceAccess: payload,
                equipment: equipmentPayload,
                equipmentSheet: equipmentSheetPayload
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const result = await response.json();
        if(result.status !== 'success') {
            if(String(result.message || result.error || '').indexOf('未授權') !== -1) {
                window.handleAdminAuthFailure('管理員登入已失效，請重新登入後再同步門禁設定。');
            }
            window.lastSettingsSaveError = result.message || result.error || '雲端回傳儲存失敗。';
            return false;
        }
        const verifyJson = typeof window.fetchPrivateCloudAction === 'function'
            ? await window.fetchPrivateCloudAction('getSettings', { t: Date.now() })
            : await (await fetch(window.buildGasActionUrl('getSettings', { t: Date.now() }, true))).json();
        const verifyData = verifyJson && verifyJson.data ? verifyJson.data : {};
        const parsedRows = typeof window.buildParsedCloudSettingsRows === 'function'
            ? window.buildParsedCloudSettingsRows(verifyData)
            : {};
        const verifiedRawConfig = parsedRows && parsedRows.deviceAccess && typeof parsedRows.deviceAccess === 'object'
            ? parsedRows.deviceAccess
            : (verifyData && verifyData.deviceAccess
                ? window.parseCloudSettingsField(verifyData.deviceAccess)
                : (parsedRows && parsedRows.equipment && parsedRows.equipment.system && parsedRows.equipment.system.deviceAccess
                    ? parsedRows.equipment.system.deviceAccess
                    : null));
        const verifiedConfig = verifiedRawConfig ? window.normalizeDeviceAccessConfig(verifiedRawConfig) : null;
        if(JSON.stringify(verifiedConfig) !== JSON.stringify(expectedConfig)) {
            window.lastSettingsSaveError = '雲端已回應成功，但臉部與裝置門禁設定沒有成功寫回。';
            return false;
        }
        return true;
    } catch(error) {
        window.lastSettingsSaveError = error && error.message ? error.message : '寫入雲端時發生未知錯誤。';
        return false;
    }
};
window.formatDeviceAccessTime = function(rawValue) {
    const raw = String(rawValue || '').trim();
    if(!raw) return '尚無紀錄';
    const parsed = new Date(raw);
    if(Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString('zh-TW', { hour12: false });
};
window.getCurrentFaceRecognitionConfig = function() {
    return window.normalizeDeviceAccessConfig(window.deviceAccessConfig).faceRecognition;
};
window.getFaceDetectorInstance = function() {
    if(typeof window.FaceDetector !== 'function') return null;
    if(!window.__faceDetectorInstance) {
        window.__faceDetectorInstance = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    }
    return window.__faceDetectorInstance;
};
window.createFaceCanvas = function(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
};
window.getReusableFaceCanvas = function(key, width, height) {
    const poolKey = String(key || 'default');
    window.__faceCanvasPool = window.__faceCanvasPool || {};
    let canvas = window.__faceCanvasPool[poolKey];
    if(!canvas) {
        canvas = document.createElement('canvas');
        window.__faceCanvasPool[poolKey] = canvas;
    }
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(height));
    if(canvas.width !== nextWidth) canvas.width = nextWidth;
    if(canvas.height !== nextHeight) canvas.height = nextHeight;
    return canvas;
};
window.getFaceMinimumDetectedRatio = function() {
    return 0.095;
};
window.getFaceFarDistanceRatioThreshold = function() {
    return 0.145;
};
window.getFaceAdaptiveCropVariants = function(usedDetector = false, maxVariants = 3, context = {}) {
    const farDistanceDetected = !!(context && context.farDistanceDetected);
    const presets = farDistanceDetected
        ? (usedDetector
            ? [
                { scale: 0.56, offsetX: 0, offsetY: -0.05 },
                { scale: 0.68, offsetX: 0, offsetY: -0.03 },
                { scale: 0.8, offsetX: 0.015, offsetY: 0.005 },
                { scale: 0.94, offsetX: 0, offsetY: 0.025 },
                { scale: 1.08, offsetX: 0, offsetY: 0.04 }
            ]
            : [
                { scale: 0.6, offsetX: 0, offsetY: -0.045 },
                { scale: 0.72, offsetX: 0, offsetY: -0.025 },
                { scale: 0.86, offsetX: 0.015, offsetY: 0.008 },
                { scale: 1, offsetX: 0.02, offsetY: 0.02 },
                { scale: 1.12, offsetX: 0, offsetY: 0.045 }
            ])
        : (usedDetector
            ? [
                { scale: 1, offsetX: 0, offsetY: 0 },
                { scale: 0.88, offsetX: 0, offsetY: -0.03 },
                { scale: 1.12, offsetX: 0, offsetY: 0.035 },
                { scale: 0.96, offsetX: 0.02, offsetY: 0.01 }
            ]
            : [
                { scale: 1, offsetX: 0, offsetY: 0 },
                { scale: 0.9, offsetX: 0, offsetY: -0.025 },
                { scale: 1.14, offsetX: 0, offsetY: 0.04 },
                { scale: 0.98, offsetX: 0.018, offsetY: 0.01 }
            ]);
    return presets.slice(0, Math.max(1, Number(maxVariants) || 3));
};
window.normalizeFaceCropBox = function(sourceWidth, sourceHeight, cropBox) {
    const width = Math.max(1, Number(sourceWidth) || 1);
    const height = Math.max(1, Number(sourceHeight) || 1);
    const requestedSize = Math.max(1, Number(cropBox && cropBox.size) || 1);
    const size = Math.min(requestedSize, width, height);
    const requestedX = Number(cropBox && cropBox.x) || 0;
    const requestedY = Number(cropBox && cropBox.y) || 0;
    return {
        x: Math.max(0, Math.min(width - size, requestedX)),
        y: Math.max(0, Math.min(height - size, requestedY)),
        size
    };
};
window.drawFaceCropCanvas = function(sourceCanvas, cropBox, canvasKey = 'face-crop-preview', options = {}) {
    const safeCropBox = window.normalizeFaceCropBox(sourceCanvas.width, sourceCanvas.height, cropBox);
    const faceCanvas = window.getReusableFaceCanvas(canvasKey, 176, 176);
    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    ctx.imageSmoothingEnabled = options.imageSmoothing !== false;
    if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = options.imageSmoothing === false ? 'low' : 'high';
    ctx.drawImage(
        sourceCanvas,
        safeCropBox.x,
        safeCropBox.y,
        safeCropBox.size,
        safeCropBox.size,
        0,
        0,
        faceCanvas.width,
        faceCanvas.height
    );
    return { canvas: faceCanvas, cropBox: safeCropBox };
};
window.getFaceRegistrationRequiredSamples = function() {
    return 3;
};
window.getFaceRegistrationSampleLimit = function() {
    return 5;
};
window.getFaceVerificationAttemptCount = function(autoMode = false) {
    return autoMode ? 3 : 4;
};
window.getFaceVerificationRequiredMatches = function() {
    return 2;
};
window.getCurrentFaceDescriptorVersion = function() {
    return 2;
};
window.getFaceVerificationFrameCount = function(autoMode = false) {
    return autoMode ? 2 : 3;
};
window.getFaceVerificationFrameGapMs = function(autoMode = false) {
    return autoMode ? 36 : 60;
};
window.getFaceVerificationAttemptDelayMs = function(autoMode = false) {
    return autoMode ? 55 : 110;
};
window.getFaceVerificationRetryDelayMs = function(autoMode = false) {
    return autoMode ? 180 : 0;
};
window.getFaceVerificationMinimumQuality = function(autoMode = false) {
    return autoMode ? 0.41 : 0.47;
};
window.getFaceVerificationStrongMargin = function(autoMode = false) {
    return autoMode ? 0.0048 : 0.0042;
};
window.getFaceVerificationStrongConsistency = function(autoMode = false) {
    return autoMode ? 0.74 : 0.7;
};
window.getFaceVerificationWeakMargin = function() {
    return 0.0035;
};
window.getFaceVerificationSubjectContinuityThreshold = function() {
    return 0.9865;
};
window.getFaceVerificationFastPassStableMatches = function() {
    return 2;
};
window.getFaceVerificationFastPassQuality = function() {
    return 0.5;
};
window.getFaceVerificationFastPassConsistency = function() {
    return 0.75;
};
window.getFaceVerificationSoftThresholdOffset = function() {
    return 0.022;
};
window.getFaceVerificationQuickPassScoreBonus = function() {
    return 0.008;
};
window.getFaceVerificationQuickPassMargin = function() {
    return 0.0075;
};
window.getFaceVerificationImmediatePassStrongCount = function() {
    return 2;
};
window.getFaceVerificationImmediatePassMargin = function() {
    return 0.0065;
};
window.getFaceVerificationImmediatePassQuality = function() {
    return 0.48;
};
window.getFaceVerificationIdentityResetStrongCount = function() {
    return 2;
};
window.getFaceVerificationIdentityResetMargin = function() {
    return 0.008;
};
window.getFaceVerificationIdentityResetScore = function() {
    return 0.872;
};
window.getFaceVerificationIdentitySwitchSimilarity = function() {
    return 0.942;
};
window.getFaceVerificationIdentitySwitchQuality = function() {
    return 0.42;
};
window.getFaceVerificationHistoryTtlMs = function() {
    return 9000;
};
window.getFaceVerificationHistoryLimit = function() {
    return 10;
};
window.getFaceVerificationProfileLockTtlMs = function() {
    return 2600;
};
window.getFaceVerificationObservedLockTtlMs = function() {
    return 1400;
};
window.getFaceCaptureMaxDimension = function() {
    return 960;
};
window.getFaceBlurWarningThreshold = function() {
    return 0.118;
};
window.getFaceBlurCriticalThreshold = function() {
    return 0.096;
};
window.getFaceRegistrationBlurMinimumEdgeStrength = function() {
    return 0.115;
};
window.getFaceRegistrationBestFrameMinimumQuality = function() {
    return 0.52;
};
window.getFaceRegistrationBestFrameMinimumEdgeStrength = function() {
    return 0.102;
};
window.getFaceTrackingTtlMs = function() {
    return 1500;
};
window.getFaceDetectorRefreshMs = function() {
    return window.faceAuthState && window.faceAuthState.mode === 'verify' ? 320 : 380;
};
window.getFaceTrackedCropExpansion = function() {
    return 1.14;
};
window.getFaceTrackedCropMinimumQuality = function() {
    return 0.5;
};
window.clearFaceTrackingState = function() {
    if(!window.faceAuthState) return;
    window.faceAuthState.trackedCropBoxRatio = null;
    window.faceAuthState.trackedFaceRatio = 0;
    window.faceAuthState.trackedUsedDetector = false;
    window.faceAuthState.trackedAt = 0;
    window.faceAuthState.lastDetectorAt = 0;
};
window.rememberFaceTrackingCrop = function(cropBox, sourceWidth, sourceHeight, options = {}) {
    if(!window.faceAuthState || !cropBox) return;
    const width = Math.max(1, Number(sourceWidth) || 1);
    const height = Math.max(1, Number(sourceHeight) || 1);
    const normalized = window.normalizeFaceCropBox(width, height, cropBox);
    const now = Date.now();
    window.faceAuthState.trackedCropBoxRatio = {
        x: Number((normalized.x / width).toFixed(6)),
        y: Number((normalized.y / height).toFixed(6)),
        size: Number((normalized.size / Math.min(width, height)).toFixed(6))
    };
    window.faceAuthState.trackedFaceRatio = Number(options.faceRatio || 0);
    window.faceAuthState.trackedUsedDetector = !!options.usedDetector;
    window.faceAuthState.trackedAt = now;
    if(options.usedDetector) window.faceAuthState.lastDetectorAt = now;
};
window.getTrackedFaceCropCandidate = function(sourceWidth, sourceHeight) {
    if(!window.faceAuthState || !window.faceAuthState.trackedCropBoxRatio) return null;
    const now = Date.now();
    if((now - Number(window.faceAuthState.trackedAt || 0)) > window.getFaceTrackingTtlMs()) return null;
    const width = Math.max(1, Number(sourceWidth) || 1);
    const height = Math.max(1, Number(sourceHeight) || 1);
    const ratios = window.faceAuthState.trackedCropBoxRatio;
    const baseSize = Math.max(1, (Number(ratios.size) || 0) * Math.min(width, height));
    if(!baseSize) return null;
    const expandedSize = baseSize * window.getFaceTrackedCropExpansion();
    const centerX = ((Number(ratios.x) || 0) * width) + (baseSize / 2);
    const centerY = ((Number(ratios.y) || 0) * height) + (baseSize / 2);
    return window.normalizeFaceCropBox(width, height, {
        x: centerX - (expandedSize / 2),
        y: centerY - (expandedSize / 2),
        size: expandedSize
    });
};
window.shouldRefreshTrackedFaceDetector = function() {
    if(!window.faceAuthState) return true;
    return (Date.now() - Number(window.faceAuthState.lastDetectorAt || 0)) >= window.getFaceDetectorRefreshMs();
};
window.getFaceLowLightBrightnessThreshold = function() {
    return 0.34;
};
window.getFaceLowLightContrastThreshold = function() {
    return 0.17;
};
window.shouldUseLowLightFaceEnhancement = function(metrics) {
    const brightness = Number(metrics && metrics.brightness);
    const contrast = Number(metrics && metrics.contrast);
    const edgeStrength = Number(metrics && metrics.edgeStrength);
    if(!Number.isFinite(brightness)) return false;
    if(brightness < 0.25) return true;
    if(brightness < window.getFaceLowLightBrightnessThreshold() && contrast < 0.24) return true;
    if(brightness < 0.4 && contrast < window.getFaceLowLightContrastThreshold()) return true;
    return brightness < 0.31 && edgeStrength < 0.14;
};
window.getAdjustedFaceQualityThreshold = function(baseThreshold, capturedDescriptor, autoMode = false) {
    let threshold = Number(baseThreshold) || 0;
    if(capturedDescriptor && typeof capturedDescriptor === 'object') {
        if(capturedDescriptor.lowLightEnhanced) threshold -= autoMode ? 0.055 : 0.065;
        else if(capturedDescriptor.lowLightDetected) threshold -= autoMode ? 0.032 : 0.04;
        if(capturedDescriptor.farDistanceEnhanced) threshold -= autoMode ? 0.048 : 0.058;
        else if(capturedDescriptor.farDistanceDetected) threshold -= autoMode ? 0.028 : 0.036;
        if(Number(capturedDescriptor.brightness || 0) < 0.24) threshold -= autoMode ? 0.01 : 0.012;
    }
    const floor = autoMode ? 0.32 : 0.37;
    return Number(Math.max(floor, threshold).toFixed(4));
};
window.enhanceFaceCanvasForLowLight = function(faceCanvas, canvasKey = 'face-low-light-enhanced') {
    const sourceCanvas = faceCanvas;
    const enhancedCanvas = window.getReusableFaceCanvas(canvasKey, sourceCanvas.width, sourceCanvas.height);
    const ctx = enhancedCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0, enhancedCanvas.width, enhancedCanvas.height);
    const imageData = ctx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height);
    const data = imageData.data;
    let lumaSum = 0;
    let pixelCount = 0;
    for(let index = 0; index < data.length; index += 4) {
        lumaSum += ((data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114)) / 255;
        pixelCount += 1;
    }
    const meanLuma = lumaSum / Math.max(pixelCount, 1);
    const gamma = meanLuma < 0.22 ? 0.66 : (meanLuma < 0.3 ? 0.74 : 0.82);
    const contrastBoost = meanLuma < 0.26 ? 1.18 : 1.12;
    const shadowLift = meanLuma < 0.22 ? 0.11 : (meanLuma < 0.3 ? 0.08 : 0.05);
    for(let index = 0; index < data.length; index += 4) {
        for(let channel = 0; channel < 3; channel += 1) {
            const normalized = Math.max(0, Math.min(1, (data[index + channel] || 0) / 255));
            const gammaAdjusted = Math.pow(normalized, gamma);
            const contrastAdjusted = ((gammaAdjusted - 0.5) * contrastBoost) + 0.5 + shadowLift;
            data[index + channel] = Math.max(0, Math.min(255, Math.round(contrastAdjusted * 255)));
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return enhancedCanvas;
};
window.enhanceFaceCanvasForDistance = function(faceCanvas, canvasKey = 'face-distance-enhanced') {
    const sourceCanvas = faceCanvas;
    const enhancedCanvas = window.getReusableFaceCanvas(canvasKey, sourceCanvas.width, sourceCanvas.height);
    const ctx = enhancedCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0, enhancedCanvas.width, enhancedCanvas.height);
    const imageData = ctx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height);
    const source = new Uint8ClampedArray(imageData.data);
    const data = imageData.data;
    const width = enhancedCanvas.width;
    const height = enhancedCanvas.height;
    for(let y = 1; y < height - 1; y += 1) {
        for(let x = 1; x < width - 1; x += 1) {
            const baseIndex = ((y * width) + x) * 4;
            for(let channel = 0; channel < 3; channel += 1) {
                const center = source[baseIndex + channel];
                const north = source[baseIndex - (width * 4) + channel];
                const south = source[baseIndex + (width * 4) + channel];
                const west = source[baseIndex - 4 + channel];
                const east = source[baseIndex + 4 + channel];
                const blur = ((center * 4) + north + south + west + east) / 8;
                const sharpened = center + ((center - blur) * 1.18);
                const contrasted = ((sharpened / 255 - 0.5) * 1.12) + 0.5;
                data[baseIndex + channel] = Math.max(0, Math.min(255, Math.round(contrasted * 255)));
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return enhancedCanvas;
};
window.normalizeFaceDescriptorVector = function(values) {
    const source = Array.isArray(values) ? values.map(value => Number(value)).filter(value => Number.isFinite(value)) : [];
    if(!source.length) return [];
    const mean = source.reduce((sum, value) => sum + value, 0) / source.length;
    const centered = source.map(value => value - mean);
    const length = Math.sqrt(centered.reduce((sum, value) => sum + (value * value), 0)) || 1;
    return centered.map(value => Number((value / length).toFixed(5)));
};
window.averageFaceDescriptors = function(descriptorList) {
    const list = Array.isArray(descriptorList) ? descriptorList.filter(item => Array.isArray(item) && item.length) : [];
    if(!list.length) return [];
    const minLength = list.reduce((shortest, item) => Math.min(shortest, item.length), list[0].length);
    const merged = new Array(minLength).fill(0);
    list.forEach(item => {
        for(let index = 0; index < minLength; index += 1) merged[index] += Number(item[index] || 0);
    });
    return window.normalizeFaceDescriptorVector(merged.map(value => value / list.length));
};
window.averageWeightedFaceDescriptors = function(descriptorList, weights) {
    const list = Array.isArray(descriptorList) ? descriptorList.filter(item => Array.isArray(item) && item.length) : [];
    if(!list.length) return [];
    const normalizedWeights = Array.isArray(weights) ? weights : [];
    const minLength = list.reduce((shortest, item) => Math.min(shortest, item.length), list[0].length);
    const merged = new Array(minLength).fill(0);
    let weightSum = 0;
    list.forEach((item, itemIndex) => {
        const weight = Math.max(0.2, Number(normalizedWeights[itemIndex] || 1));
        weightSum += weight;
        for(let index = 0; index < minLength; index += 1) {
            merged[index] += Number(item[index] || 0) * weight;
        }
    });
    if(weightSum <= 0) return window.averageFaceDescriptors(list);
    return window.normalizeFaceDescriptorVector(merged.map(value => value / weightSum));
};
window.compareFaceDescriptors = function(leftDescriptor, rightDescriptor) {
    const left = Array.isArray(leftDescriptor) ? leftDescriptor : [];
    const right = Array.isArray(rightDescriptor) ? rightDescriptor : [];
    const length = Math.min(left.length, right.length);
    if(!length) return 0;
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for(let index = 0; index < length; index += 1) {
        const leftValue = Number(left[index] || 0);
        const rightValue = Number(right[index] || 0);
        dot += leftValue * rightValue;
        leftNorm += leftValue * leftValue;
        rightNorm += rightValue * rightValue;
    }
    const divider = Math.sqrt(leftNorm) * Math.sqrt(rightNorm) || 1;
    return dot / divider;
};
window.resolveCapturedDescriptorForProfile = function(capturedDescriptor, profile) {
    const descriptorVersion = Number(profile && profile.descriptorVersion) || (Array.isArray(profile && profile.descriptor) && profile.descriptor.length >= 300 ? 2 : 1);
    if(Array.isArray(capturedDescriptor)) return capturedDescriptor;
    if(!capturedDescriptor || typeof capturedDescriptor !== 'object') return [];
    if(descriptorVersion <= 1 && Array.isArray(capturedDescriptor.legacyDescriptor) && capturedDescriptor.legacyDescriptor.length) {
        return capturedDescriptor.legacyDescriptor;
    }
    if(Array.isArray(capturedDescriptor.descriptor) && capturedDescriptor.descriptor.length) {
        return capturedDescriptor.descriptor;
    }
    if(Array.isArray(capturedDescriptor.legacyDescriptor) && capturedDescriptor.legacyDescriptor.length) {
        return capturedDescriptor.legacyDescriptor;
    }
    return [];
};
window.resolveCapturedDescriptorCandidatesForProfile = function(capturedDescriptor, profile) {
    const descriptorVersion = Number(profile && profile.descriptorVersion) || (Array.isArray(profile && profile.descriptor) && profile.descriptor.length >= 300 ? 2 : 1);
    if(Array.isArray(capturedDescriptor)) return [capturedDescriptor];
    if(!capturedDescriptor || typeof capturedDescriptor !== 'object') return [];
    const preferred = descriptorVersion <= 1
        ? (
            (Array.isArray(capturedDescriptor.legacyDescriptorVariants) && capturedDescriptor.legacyDescriptorVariants.length
                ? capturedDescriptor.legacyDescriptorVariants
                : (Array.isArray(capturedDescriptor.legacyDescriptor) && capturedDescriptor.legacyDescriptor.length ? [capturedDescriptor.legacyDescriptor] : []))
        )
        : (
            (Array.isArray(capturedDescriptor.descriptorVariants) && capturedDescriptor.descriptorVariants.length
                ? capturedDescriptor.descriptorVariants
                : (Array.isArray(capturedDescriptor.descriptor) && capturedDescriptor.descriptor.length ? [capturedDescriptor.descriptor] : []))
        );
    const fallback = descriptorVersion <= 1
        ? (Array.isArray(capturedDescriptor.descriptorVariants) && capturedDescriptor.descriptorVariants.length ? capturedDescriptor.descriptorVariants : [])
        : (Array.isArray(capturedDescriptor.legacyDescriptorVariants) && capturedDescriptor.legacyDescriptorVariants.length ? capturedDescriptor.legacyDescriptorVariants : []);
    return preferred.concat(fallback)
        .filter(item => Array.isArray(item) && item.length)
        .filter((descriptor, index, list) => list.findIndex(other => window.compareFaceDescriptors(descriptor, other) > 0.9992) === index);
};
window.getLegacyFaceDescriptorVariantList = function(capturedDescriptor) {
    if(Array.isArray(capturedDescriptor)) return [];
    if(!capturedDescriptor || typeof capturedDescriptor !== 'object') return [];
    return (Array.isArray(capturedDescriptor.legacyDescriptorVariants) && capturedDescriptor.legacyDescriptorVariants.length
        ? capturedDescriptor.legacyDescriptorVariants
        : (Array.isArray(capturedDescriptor.legacyDescriptor) && capturedDescriptor.legacyDescriptor.length ? [capturedDescriptor.legacyDescriptor] : []))
        .filter(item => Array.isArray(item) && item.length);
};
window.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
};
window.scoreFaceDescriptorVariantSets = function(queryDescriptors, candidateDescriptors) {
    const queries = (Array.isArray(queryDescriptors) ? queryDescriptors : []).filter(item => Array.isArray(item) && item.length);
    const candidates = (Array.isArray(candidateDescriptors) ? candidateDescriptors : []).filter(item => Array.isArray(item) && item.length);
    if(!queries.length || !candidates.length) return null;
    const variantResults = queries.map(queryDescriptor => {
        const scored = candidates
            .map(candidate => window.compareFaceDescriptors(queryDescriptor, candidate))
            .filter(value => Number.isFinite(value))
            .sort((left, right) => right - left);
        if(!scored.length) return null;
        const topScores = scored.slice(0, Math.min(scored.length, 3));
        const averageTop = topScores.reduce((sum, value) => sum + value, 0) / topScores.length;
        const spread = topScores.length > 1 ? Math.max(0, topScores[0] - topScores[topScores.length - 1]) : 0;
        const consistency = Math.max(0, 1 - Math.min(1, spread / 0.12));
        return {
            score: (scored[0] * 0.56) + (averageTop * 0.29) + (consistency * 0.15),
            best: scored[0],
            averageTop,
            consistency,
            spread
        };
    }).filter(Boolean).sort((left, right) => right.score - left.score);
    const bestVariant = variantResults[0];
    if(!bestVariant) return null;
    return {
        ...bestVariant,
        score: variantResults.length > 1
            ? (bestVariant.score * 0.82) + ((variantResults[1].score || 0) * 0.18)
            : bestVariant.score
    };
};
window.scoreFaceAgainstProfile = function(capturedDescriptor, profile) {
    const modernQueryDescriptors = window.getFaceDescriptorVariantList(capturedDescriptor);
    const modernCandidates = [];
    if(profile && Array.isArray(profile.memoryDescriptors)) {
        profile.memoryDescriptors.forEach(memory => {
            if(Array.isArray(memory) && memory.length) modernCandidates.push(memory);
        });
    }
    if(profile && Array.isArray(profile.sampleDescriptors)) {
        profile.sampleDescriptors.forEach(sample => {
            if(Array.isArray(sample) && sample.length) modernCandidates.push(sample);
        });
    }
    if(profile && Array.isArray(profile.descriptor) && profile.descriptor.length) {
        modernCandidates.push(profile.descriptor);
    }
    const legacyQueryDescriptors = window.getLegacyFaceDescriptorVariantList(capturedDescriptor);
    const legacyCandidates = [];
    if(profile && Array.isArray(profile.legacyMemoryDescriptors)) {
        profile.legacyMemoryDescriptors.forEach(memory => {
            if(Array.isArray(memory) && memory.length) legacyCandidates.push(memory);
        });
    }
    if(profile && Array.isArray(profile.legacySampleDescriptors)) {
        profile.legacySampleDescriptors.forEach(sample => {
            if(Array.isArray(sample) && sample.length) legacyCandidates.push(sample);
        });
    }
    if(profile && Array.isArray(profile.legacyDescriptor) && profile.legacyDescriptor.length) {
        legacyCandidates.push(profile.legacyDescriptor);
    }
    const modernResult = window.scoreFaceDescriptorVariantSets(modernQueryDescriptors, modernCandidates);
    const legacyResult = window.scoreFaceDescriptorVariantSets(legacyQueryDescriptors, legacyCandidates);
    if(!modernResult && !legacyResult) return { score: 0, best: 0, averageTop: 0 };
    if(modernResult && legacyResult) {
        const agreement = Math.max(0, 1 - Math.min(1, Math.abs(modernResult.score - legacyResult.score) / 0.08));
        return {
            score: Math.min(0.9995, (modernResult.score * 0.82) + (legacyResult.score * 0.18) + (agreement * 0.018)),
            best: (modernResult.best * 0.8) + (legacyResult.best * 0.2),
            averageTop: (modernResult.averageTop * 0.8) + (legacyResult.averageTop * 0.2),
            consistency: (modernResult.consistency * 0.76) + (legacyResult.consistency * 0.24),
            spread: Math.min(modernResult.spread, legacyResult.spread),
            modernScore: modernResult.score,
            legacyScore: legacyResult.score,
            agreement
        };
    }
    return modernResult || legacyResult || { score: 0, best: 0, averageTop: 0 };
};
window.findBestFaceProfileMatch = function(capturedDescriptor, profiles) {
    const ranked = (Array.isArray(profiles) ? profiles : []).map(profile => {
        const scoreResult = window.scoreFaceAgainstProfile(capturedDescriptor, profile);
        return {
            profile,
            score: scoreResult.score,
            best: scoreResult.best,
            averageTop: scoreResult.averageTop,
            consistency: scoreResult.consistency || 0,
            spread: scoreResult.spread || 0
        };
    }).filter(item => item.profile && Number.isFinite(item.score))
      .sort((left, right) => right.score - left.score);
    const best = ranked[0] || null;
    const runnerUp = ranked[1] || null;
    return {
        best,
        runnerUp,
        margin: best ? (best.score - (runnerUp ? runnerUp.score : 0)) : 0,
        ranked
    };
};
window.appendFaceDescriptorScaleFeatures = function(target, grayscale, targetSize, blockCount) {
    if(!Array.isArray(target) || !(grayscale instanceof Float32Array) || !targetSize || !blockCount) return;
    const blockSize = targetSize / blockCount;
    for(let blockY = 0; blockY < blockCount; blockY += 1) {
        for(let blockX = 0; blockX < blockCount; blockX += 1) {
            let valueSum = 0;
            let absoluteSum = 0;
            let gradientXSum = 0;
            let gradientYSum = 0;
            let contrastSum = 0;
            let pixels = 0;
            for(let innerY = 0; innerY < blockSize; innerY += 1) {
                for(let innerX = 0; innerX < blockSize; innerX += 1) {
                    const x = (blockX * blockSize) + innerX;
                    const y = (blockY * blockSize) + innerY;
                    const index = (y * targetSize) + x;
                    const center = grayscale[index];
                    const left = grayscale[(y * targetSize) + Math.max(0, x - 1)];
                    const right = grayscale[(y * targetSize) + Math.min(targetSize - 1, x + 1)];
                    const top = grayscale[(Math.max(0, y - 1) * targetSize) + x];
                    const bottom = grayscale[(Math.min(targetSize - 1, y + 1) * targetSize) + x];
                    const gradX = right - left;
                    const gradY = bottom - top;
                    valueSum += center;
                    absoluteSum += Math.abs(center);
                    gradientXSum += gradX;
                    gradientYSum += gradY;
                    contrastSum += Math.abs(gradX) + Math.abs(gradY);
                    pixels += 1;
                }
            }
            target.push(valueSum / pixels);
            target.push(absoluteSum / pixels);
            target.push(gradientXSum / pixels);
            target.push(gradientYSum / pixels);
            target.push(contrastSum / pixels);
        }
    }
};
window.buildFaceDescriptorProjection = function(grayscale, targetSize, segmentCount, axis = 'horizontal') {
    const features = [];
    const segments = Math.max(1, Number(segmentCount) || 1);
    const horizontal = axis !== 'vertical';
    const majorSize = horizontal ? targetSize : targetSize;
    const minorSize = horizontal ? targetSize : targetSize;
    const segmentSize = majorSize / segments;
    for(let segmentIndex = 0; segmentIndex < segments; segmentIndex += 1) {
        let valueSum = 0;
        let contrastSum = 0;
        let count = 0;
        const start = Math.floor(segmentIndex * segmentSize);
        const end = Math.min(targetSize, Math.ceil((segmentIndex + 1) * segmentSize));
        for(let major = start; major < end; major += 1) {
            for(let minor = 0; minor < minorSize; minor += 1) {
                const x = horizontal ? minor : major;
                const y = horizontal ? major : minor;
                const index = (y * targetSize) + x;
                const center = grayscale[index];
                const neighbor = horizontal
                    ? grayscale[(Math.min(targetSize - 1, y + 1) * targetSize) + x]
                    : grayscale[(y * targetSize) + Math.min(targetSize - 1, x + 1)];
                valueSum += center;
                contrastSum += Math.abs(neighbor - center);
                count += 1;
            }
        }
        features.push(valueSum / Math.max(count, 1));
        features.push(contrastSum / Math.max(count, 1));
    }
    return features;
};
window.buildLegacyFaceDescriptor = function(faceCanvas) {
    const targetSize = 32;
    const blockCount = 8;
    const blockSize = targetSize / blockCount;
    const workingCanvas = window.getReusableFaceCanvas('face-legacy-descriptor', targetSize, targetSize);
    const ctx = workingCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(faceCanvas, 0, 0, targetSize, targetSize);
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize).data;
    const grayscale = new Float32Array(targetSize * targetSize);
    for(let index = 0; index < grayscale.length; index += 1) {
        const pixelIndex = index * 4;
        grayscale[index] = (
            (imageData[pixelIndex] * 0.299) +
            (imageData[pixelIndex + 1] * 0.587) +
            (imageData[pixelIndex + 2] * 0.114)
        ) / 255;
    }
    const mean = grayscale.reduce((sum, value) => sum + value, 0) / grayscale.length;
    let variance = 0;
    for(let index = 0; index < grayscale.length; index += 1) {
        variance += Math.pow(grayscale[index] - mean, 2);
    }
    const std = Math.sqrt(variance / grayscale.length) || 1;
    for(let index = 0; index < grayscale.length; index += 1) {
        grayscale[index] = (grayscale[index] - mean) / std;
    }
    const descriptor = [];
    for(let blockY = 0; blockY < blockCount; blockY += 1) {
        for(let blockX = 0; blockX < blockCount; blockX += 1) {
            let valueSum = 0;
            let gradientXSum = 0;
            let gradientYSum = 0;
            let pixels = 0;
            for(let innerY = 0; innerY < blockSize; innerY += 1) {
                for(let innerX = 0; innerX < blockSize; innerX += 1) {
                    const x = (blockX * blockSize) + innerX;
                    const y = (blockY * blockSize) + innerY;
                    const index = (y * targetSize) + x;
                    const center = grayscale[index];
                    const left = grayscale[(y * targetSize) + Math.max(0, x - 1)];
                    const right = grayscale[(y * targetSize) + Math.min(targetSize - 1, x + 1)];
                    const top = grayscale[(Math.max(0, y - 1) * targetSize) + x];
                    const bottom = grayscale[(Math.min(targetSize - 1, y + 1) * targetSize) + x];
                    valueSum += center;
                    gradientXSum += right - left;
                    gradientYSum += bottom - top;
                    pixels += 1;
                }
            }
            descriptor.push(valueSum / pixels);
            descriptor.push(gradientXSum / pixels);
            descriptor.push(gradientYSum / pixels);
        }
    }
    return {
        descriptor: window.normalizeFaceDescriptorVector(descriptor)
    };
};
window.buildFaceDescriptor = function(faceCanvas, options = {}) {
    const lowLightEnhanced = !!(options && options.lowLightEnhanced);
    const farDistanceEnhanced = !!(options && options.farDistanceEnhanced);
    const targetSize = 48;
    const workingCanvas = window.getReusableFaceCanvas('face-primary-descriptor', targetSize, targetSize);
    const ctx = workingCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(faceCanvas, 0, 0, targetSize, targetSize);
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize).data;
    const grayscale = new Float32Array(targetSize * targetSize);
    for(let index = 0; index < grayscale.length; index += 1) {
        const pixelIndex = index * 4;
        grayscale[index] = (
            (imageData[pixelIndex] * 0.299) +
            (imageData[pixelIndex + 1] * 0.587) +
            (imageData[pixelIndex + 2] * 0.114)
        ) / 255;
    }
    const mean = grayscale.reduce((sum, value) => sum + value, 0) / grayscale.length;
    let variance = 0;
    for(let index = 0; index < grayscale.length; index += 1) {
        variance += Math.pow(grayscale[index] - mean, 2);
    }
    const std = Math.sqrt(variance / grayscale.length) || 1;
    let edgeStrength = 0;
    let edgeCount = 0;
    for(let y = 0; y < targetSize; y += 1) {
        for(let x = 0; x < targetSize; x += 1) {
            const index = (y * targetSize) + x;
            const left = grayscale[(y * targetSize) + Math.max(0, x - 1)];
            const right = grayscale[(y * targetSize) + Math.min(targetSize - 1, x + 1)];
            const top = grayscale[(Math.max(0, y - 1) * targetSize) + x];
            const bottom = grayscale[(Math.min(targetSize - 1, y + 1) * targetSize) + x];
            edgeStrength += Math.abs(right - left) + Math.abs(bottom - top);
            edgeCount += 2;
        }
    }
    const averageEdgeStrength = edgeStrength / Math.max(edgeCount, 1);
    for(let index = 0; index < grayscale.length; index += 1) {
        grayscale[index] = (grayscale[index] - mean) / std;
    }
    const descriptor = [];
    window.appendFaceDescriptorScaleFeatures(descriptor, grayscale, targetSize, 6);
    window.appendFaceDescriptorScaleFeatures(descriptor, grayscale, targetSize, 8);
    descriptor.push(...window.buildFaceDescriptorProjection(grayscale, targetSize, 12, 'horizontal'));
    descriptor.push(...window.buildFaceDescriptorProjection(grayscale, targetSize, 12, 'vertical'));
    let qualityScore = 1;
    const hints = [];
    const lowLightDetected = window.shouldUseLowLightFaceEnhancement({
        brightness: mean,
        contrast: std,
        edgeStrength: averageEdgeStrength
    });
    const farDistanceDetected = Number(options && options.faceRatio || 1) < window.getFaceFarDistanceRatioThreshold();
    const blurDetected = averageEdgeStrength < window.getFaceBlurWarningThreshold();
    const motionBlurDetected = averageEdgeStrength < window.getFaceBlurCriticalThreshold()
        || (averageEdgeStrength < 0.104 && std < 0.19);
    if(mean < 0.2) {
        qualityScore -= lowLightEnhanced ? 0.11 : 0.24;
        hints.push('畫面偏暗');
    } else if(mean > 0.86) {
        qualityScore -= 0.16;
        hints.push('畫面過亮');
    }
    if(std < 0.16) {
        qualityScore -= lowLightEnhanced ? 0.16 : 0.28;
        hints.push('對比不足');
    }
    if(motionBlurDetected) {
        qualityScore -= (lowLightEnhanced || farDistanceEnhanced) ? 0.16 : 0.24;
        hints.push('鏡頭晃動');
    } else if(blurDetected) {
        qualityScore -= (lowLightEnhanced || farDistanceEnhanced) ? 0.12 : 0.2;
        hints.push('畫面偏糊');
    }
    if(lowLightEnhanced) {
        qualityScore += lowLightDetected ? 0.06 : 0.03;
        hints.unshift('已啟用弱光增強');
    }
    if(farDistanceEnhanced) {
        qualityScore += farDistanceDetected ? 0.065 : 0.03;
        hints.unshift('已啟用遠距增強');
    } else if(farDistanceDetected) {
        qualityScore -= 0.03;
        hints.push('距離偏遠');
    }
    return {
        descriptor: window.normalizeFaceDescriptorVector(descriptor),
        brightness: Number(mean.toFixed(4)),
        contrast: Number(std.toFixed(4)),
        edgeStrength: Number(averageEdgeStrength.toFixed(4)),
        qualityScore: Number(Math.max(0, Math.min(1, qualityScore)).toFixed(4)),
        qualityMessage: hints.length ? hints.join('、') : '畫面品質穩定',
        lowLightDetected,
        lowLightEnhanced,
        blurDetected,
        motionBlurDetected,
        farDistanceDetected,
        farDistanceEnhanced
    };
};
window.detectFaceCropFromCanvas = async function(sourceCanvas, options = {}) {
    const detector = window.getFaceDetectorInstance();
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    let cropBox = null;
    let usedDetector = false;
    let usedTracking = false;
    let faceRatio = 1;
    let farDistanceDetected = false;
    const forceDetector = !!(options && options.forceDetector);
    const trackedCropBox = !forceDetector ? window.getTrackedFaceCropCandidate(width, height) : null;
    const shouldUseDetector = !!detector && (forceDetector || !trackedCropBox || window.shouldRefreshTrackedFaceDetector());
    let detectorError = null;
    if(shouldUseDetector) {
        try {
            const detections = await detector.detect(sourceCanvas);
            if(detections.length !== 1 || !detections[0] || !detections[0].boundingBox) {
                throw new Error(detections.length > 1 ? '請保持畫面中只有一張臉' : '鏡頭裡沒有偵測到清楚的人臉');
            }
            const boundingBox = detections[0].boundingBox;
            faceRatio = Math.max(
                Number(boundingBox.width || 0) / Math.max(width, 1),
                Number(boundingBox.height || 0) / Math.max(height, 1)
            );
            if(faceRatio < window.getFaceMinimumDetectedRatio()) throw new Error('請再靠近鏡頭一點，讓臉部更清楚');
            farDistanceDetected = faceRatio < window.getFaceFarDistanceRatioThreshold();
            const cropPadding = farDistanceDetected ? (faceRatio < 0.12 ? 1.08 : 1.18) : 1.5;
            const size = Math.min(Math.max(boundingBox.width, boundingBox.height) * cropPadding, Math.min(width, height));
            const centerX = boundingBox.x + (boundingBox.width / 2);
            const centerY = boundingBox.y + (boundingBox.height / 2);
            cropBox = window.normalizeFaceCropBox(width, height, {
                x: centerX - (size / 2),
                y: centerY - (size * (farDistanceDetected ? 0.47 : 0.42)),
                size
            });
            usedDetector = true;
            window.rememberFaceTrackingCrop(cropBox, width, height, {
                faceRatio,
                usedDetector: true
            });
        } catch(error) {
            detectorError = error;
        }
    }
    if(!cropBox && trackedCropBox) {
        cropBox = trackedCropBox;
        faceRatio = Number(window.faceAuthState && window.faceAuthState.trackedFaceRatio || 0);
        farDistanceDetected = faceRatio > 0 && faceRatio < window.getFaceFarDistanceRatioThreshold();
        usedTracking = true;
        window.rememberFaceTrackingCrop(cropBox, width, height, {
            faceRatio,
            usedDetector: false
        });
    }
    if(!cropBox && detectorError) {
        throw detectorError;
    }
    if(!cropBox && !detector) {
        const fallbackSize = Math.min(width, height) * 0.72;
        cropBox = window.normalizeFaceCropBox(width, height, {
            x: (width - fallbackSize) / 2,
            y: Math.min(height - fallbackSize, (height - fallbackSize) / 2.3),
            size: fallbackSize
        });
    }
    if(!cropBox) {
        throw new Error('鏡頭裡沒有偵測到清楚的人臉');
    }
    const faceCanvasResult = window.drawFaceCropCanvas(sourceCanvas, cropBox, 'face-crop-preview');
    return { canvas: faceCanvasResult.canvas, cropBox, usedDetector, usedTracking, faceRatio, farDistanceDetected };
};
window.captureFaceDescriptorFromVideo = async function(videoElementOrId, options = {}) {
    const video = typeof videoElementOrId === 'string' ? $(videoElementOrId) : videoElementOrId;
    if(!video || !video.videoWidth || !video.videoHeight) throw new Error('鏡頭尚未準備完成');
    const maxDimension = Math.max(360, Number(options && options.maxDimension) || window.getFaceCaptureMaxDimension());
    const captureScale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight, 1));
    const captureWidth = Math.max(1, Math.round(video.videoWidth * captureScale));
    const captureHeight = Math.max(1, Math.round(video.videoHeight * captureScale));
    const sourceCanvas = window.getReusableFaceCanvas('face-video-source', captureWidth, captureHeight);
    sourceCanvas.getContext('2d', { willReadFrequently: true }).drawImage(video, 0, 0, sourceCanvas.width, sourceCanvas.height);
    const buildRankedCandidates = function(faceCropResult) {
        const adaptiveScale = options && options.adaptiveScale !== false;
        const defaultVariantCount = adaptiveScale ? (faceCropResult.farDistanceDetected ? 5 : 3) : 1;
        const maxScaleVariants = Math.max(1, Number(options && options.maxScaleVariants) || defaultVariantCount);
        const candidateVariants = adaptiveScale
            ? window.getFaceAdaptiveCropVariants(faceCropResult.usedDetector, maxScaleVariants, faceCropResult)
            : [{ scale: 1, offsetX: 0, offsetY: 0 }];
        return candidateVariants.map((variant, index) => {
            const nextSize = faceCropResult.cropBox.size * Math.max(0.72, Number(variant && variant.scale) || 1);
            const nextCropBox = window.normalizeFaceCropBox(sourceCanvas.width, sourceCanvas.height, {
                x: faceCropResult.cropBox.x - ((nextSize - faceCropResult.cropBox.size) / 2) + (faceCropResult.cropBox.size * (Number(variant && variant.offsetX) || 0)),
                y: faceCropResult.cropBox.y - ((nextSize - faceCropResult.cropBox.size) / 2) + (faceCropResult.cropBox.size * (Number(variant && variant.offsetY) || 0)),
                size: nextSize
            });
            const canvasResult = window.drawFaceCropCanvas(sourceCanvas, nextCropBox, 'face-crop-preview-' + index, {
                imageSmoothing: !(faceCropResult.farDistanceDetected && Number(variant && variant.scale || 1) <= 0.8)
            });
            const baseDescriptorResult = window.buildFaceDescriptor(canvasResult.canvas, {
                faceRatio: faceCropResult.faceRatio
            });
            const candidateList = [{
                canvas: canvasResult.canvas,
                descriptorResult: baseDescriptorResult,
                enhanced: false
            }];
            if(window.shouldUseLowLightFaceEnhancement(baseDescriptorResult)) {
                const enhancedCanvas = window.enhanceFaceCanvasForLowLight(canvasResult.canvas, 'face-crop-preview-low-light-' + index);
                candidateList.push({
                    canvas: enhancedCanvas,
                    descriptorResult: window.buildFaceDescriptor(enhancedCanvas, { lowLightEnhanced: true, faceRatio: faceCropResult.faceRatio }),
                    enhanced: true
                });
            }
            if(faceCropResult.farDistanceDetected) {
                const enhancedDistanceCanvas = window.enhanceFaceCanvasForDistance(canvasResult.canvas, 'face-crop-preview-distance-' + index);
                candidateList.push({
                    canvas: enhancedDistanceCanvas,
                    descriptorResult: window.buildFaceDescriptor(enhancedDistanceCanvas, {
                        farDistanceEnhanced: true,
                        faceRatio: faceCropResult.faceRatio
                    }),
                    enhanced: true
                });
            }
            return candidateList.map(candidate => {
                const legacyDescriptorResult = window.buildLegacyFaceDescriptor(candidate.canvas);
                return {
                    descriptor: candidate.descriptorResult.descriptor,
                    legacyDescriptor: legacyDescriptorResult.descriptor,
                    qualityScore: candidate.descriptorResult.qualityScore,
                    qualityMessage: candidate.descriptorResult.qualityMessage,
                    brightness: candidate.descriptorResult.brightness,
                    contrast: candidate.descriptorResult.contrast,
                    edgeStrength: candidate.descriptorResult.edgeStrength,
                    lowLightDetected: !!candidate.descriptorResult.lowLightDetected,
                    lowLightEnhanced: !!candidate.descriptorResult.lowLightEnhanced,
                    blurDetected: !!candidate.descriptorResult.blurDetected,
                    motionBlurDetected: !!candidate.descriptorResult.motionBlurDetected,
                    farDistanceDetected: !!candidate.descriptorResult.farDistanceDetected,
                    farDistanceEnhanced: !!candidate.descriptorResult.farDistanceEnhanced,
                    faceRatio: Number(faceCropResult.faceRatio || 0),
                    preview: candidate.canvas.toDataURL('image/jpeg', 0.72)
                };
            });
        }).flat().filter(item => Array.isArray(item.descriptor) && item.descriptor.length)
            .sort((left, right) => (Number(right.qualityScore) || 0) - (Number(left.qualityScore) || 0));
    };
    let faceCrop = await window.detectFaceCropFromCanvas(sourceCanvas, options.detectOptions || {});
    let rankedCandidates = buildRankedCandidates(faceCrop);
    let primaryCandidate = rankedCandidates[0];
    if(faceCrop.usedTracking && (!primaryCandidate || Number(primaryCandidate.qualityScore || 0) < window.getFaceTrackedCropMinimumQuality())) {
        faceCrop = await window.detectFaceCropFromCanvas(sourceCanvas, {
            ...(options.detectOptions || {}),
            forceDetector: true
        });
        rankedCandidates = buildRankedCandidates(faceCrop);
        primaryCandidate = rankedCandidates[0];
    }
    if(!primaryCandidate) throw new Error('鏡頭尚未擷取到可用的人臉樣本');
    const descriptorVariants = rankedCandidates
        .map(item => item.descriptor)
        .filter((descriptor, index, list) => list.findIndex(other => window.compareFaceDescriptors(descriptor, other) > 0.9992) === index);
    const legacyDescriptorVariants = rankedCandidates
        .map(item => item.legacyDescriptor)
        .filter(item => Array.isArray(item) && item.length)
        .filter((descriptor, index, list) => list.findIndex(other => window.compareFaceDescriptors(descriptor, other) > 0.9992) === index);
    const topCandidates = rankedCandidates.slice(0, Math.min(rankedCandidates.length, 2));
    const blendedQuality = topCandidates.reduce((sum, item, index) => sum + ((Number(item.qualityScore) || 0) * (index === 0 ? 0.68 : 0.32)), 0);
    return {
        descriptor: primaryCandidate.descriptor,
        legacyDescriptor: primaryCandidate.legacyDescriptor,
        descriptorVariants,
        legacyDescriptorVariants,
        qualityScore: Number(Math.max(0, Math.min(1, blendedQuality || Number(primaryCandidate.qualityScore) || 0)).toFixed(4)),
        qualityMessage: primaryCandidate.qualityMessage,
        brightness: primaryCandidate.brightness,
        contrast: primaryCandidate.contrast,
        edgeStrength: primaryCandidate.edgeStrength,
        lowLightDetected: !!primaryCandidate.lowLightDetected,
        lowLightEnhanced: !!primaryCandidate.lowLightEnhanced,
        blurDetected: !!primaryCandidate.blurDetected,
        motionBlurDetected: !!primaryCandidate.motionBlurDetected,
        farDistanceDetected: !!primaryCandidate.farDistanceDetected,
        farDistanceEnhanced: !!primaryCandidate.farDistanceEnhanced,
        faceRatio: Number(primaryCandidate.faceRatio || faceCrop.faceRatio || 0),
        preview: primaryCandidate.preview,
        usedDetector: faceCrop.usedDetector
    };
};
window.captureStableFaceDescriptorFromVideo = async function(videoElementOrId, options = {}) {
    const frameCount = Math.max(1, Number(options.frameCount) || 3);
    const gapMs = Math.max(40, Number(options.gapMs) || 90);
    const minFrames = Math.max(1, Number(options.minFrames) || Math.min(frameCount, 2));
    const allowEarlyStop = options.allowEarlyStop !== false;
    const earlyStopMinFrames = Math.max(minFrames, Number(options.earlyStopMinFrames) || 2);
    const earlyStopQualityScore = Math.max(0.45, Number(options.earlyStopQualityScore) || 0.62);
    const earlyStopSimilarity = Math.max(0.985, Number(options.earlyStopSimilarity) || 0.992);
    const capturedFrames = [];
    const captureErrors = [];
    let usedDetector = false;
    for(let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        try {
            const captured = await window.captureFaceDescriptorFromVideo(videoElementOrId, options.captureOptions || {});
            if(Array.isArray(captured.descriptor) && captured.descriptor.length) {
                capturedFrames.push({
                    descriptor: captured.descriptor,
                    legacyDescriptor: Array.isArray(captured.legacyDescriptor) && captured.legacyDescriptor.length ? captured.legacyDescriptor : [],
                    descriptorVariants: Array.isArray(captured.descriptorVariants) ? captured.descriptorVariants.filter(item => Array.isArray(item) && item.length) : [],
                    legacyDescriptorVariants: Array.isArray(captured.legacyDescriptorVariants) ? captured.legacyDescriptorVariants.filter(item => Array.isArray(item) && item.length) : [],
                    weight: Math.max(0.35, Number(captured.qualityScore) || 0.35),
                    qualityScore: Number(captured.qualityScore) || 0,
                    preview: captured.preview || '',
                    qualityMessage: String(captured.qualityMessage || '').trim(),
                    blurDetected: !!captured.blurDetected,
                    motionBlurDetected: !!captured.motionBlurDetected,
                    edgeStrength: Number(captured.edgeStrength) || 0
                });
                usedDetector = usedDetector || !!captured.usedDetector;
                if(allowEarlyStop && capturedFrames.length >= earlyStopMinFrames) {
                    const qualityAverage = capturedFrames.reduce((sum, item) => sum + (Number(item.qualityScore) || 0), 0) / Math.max(capturedFrames.length, 1);
                    const similarity = capturedFrames.length >= 2
                        ? window.compareFaceDescriptors(capturedFrames[capturedFrames.length - 1].descriptor, capturedFrames[capturedFrames.length - 2].descriptor)
                        : 0;
                    if(qualityAverage >= earlyStopQualityScore && (capturedFrames.length === 1 || similarity >= earlyStopSimilarity)) {
                        break;
                    }
                }
            }
        } catch(error) {
            captureErrors.push(error && error.message ? error.message : '樣本擷取失敗');
        }
        if(frameIndex < frameCount - 1) await window.sleep(gapMs);
    }
    if(capturedFrames.length < minFrames) throw new Error(captureErrors[0] || '鏡頭尚未擷取到足夠的可用臉部樣本');
    const rankedFrames = capturedFrames.slice().sort((left, right) => {
        if((Number(right.qualityScore) || 0) !== (Number(left.qualityScore) || 0)) {
            return (Number(right.qualityScore) || 0) - (Number(left.qualityScore) || 0);
        }
        if((Number(right.edgeStrength) || 0) !== (Number(left.edgeStrength) || 0)) {
            return (Number(right.edgeStrength) || 0) - (Number(left.edgeStrength) || 0);
        }
        if(left.motionBlurDetected !== right.motionBlurDetected) {
            return left.motionBlurDetected ? 1 : -1;
        }
        if(left.blurDetected !== right.blurDetected) {
            return left.blurDetected ? 1 : -1;
        }
        return 0;
    });
    const bestFrame = rankedFrames[0] || null;
    const bestQuality = Number(bestFrame && bestFrame.qualityScore || 0);
    const bestEdgeStrength = Number(bestFrame && bestFrame.edgeStrength || 0);
    const minimumSelectedQuality = Math.max(0.42, bestQuality - (options.relaxedSelection ? 0.16 : 0.12));
    const minimumSelectedEdge = Math.max(0.088, bestEdgeStrength - (options.relaxedSelection ? 0.03 : 0.022));
    let selectedFrames = rankedFrames.filter(frame => {
        const frameQuality = Number(frame.qualityScore) || 0;
        const frameEdgeStrength = Number(frame.edgeStrength) || 0;
        if(frameQuality >= minimumSelectedQuality) return true;
        if(frameEdgeStrength >= minimumSelectedEdge) return true;
        return !frame.motionBlurDetected && frameQuality >= 0.46;
    }).slice(0, Math.max(minFrames, Math.min(rankedFrames.length, options.relaxedSelection ? 3 : 2)));
    if(selectedFrames.length < minFrames) selectedFrames = rankedFrames.slice(0, minFrames);
    const descriptors = selectedFrames.map(item => item.descriptor).filter(item => Array.isArray(item) && item.length);
    const legacyFrames = selectedFrames.filter(item => Array.isArray(item.legacyDescriptor) && item.legacyDescriptor.length);
    const weights = selectedFrames.map(item => Math.max(0.35, Number(item.weight) || 0.35));
    const mergedDescriptor = window.averageWeightedFaceDescriptors(descriptors, weights);
    const mergedLegacyDescriptor = legacyFrames.length
        ? window.averageWeightedFaceDescriptors(legacyFrames.map(item => item.legacyDescriptor), legacyFrames.map(item => Math.max(0.35, Number(item.weight) || 0.35)))
        : [];
    const qualityScores = selectedFrames.map(item => Number(item.qualityScore) || 0);
    const qualityMessages = selectedFrames.map(item => String(item.qualityMessage || '').trim()).filter(Boolean);
    const blurFlags = selectedFrames.map(item => !!item.blurDetected);
    const motionBlurFlags = selectedFrames.map(item => !!item.motionBlurDetected);
    const edgeStrengths = selectedFrames.map(item => Number(item.edgeStrength) || 0);
    const averageQuality = qualityScores.reduce((sum, value) => sum + value, 0) / Math.max(qualityScores.length, 1);
    const qualityMessage = (bestFrame && bestFrame.qualityMessage) || (qualityMessages.length ? qualityMessages.sort((left, right) => left.length - right.length)[0] : '畫面品質穩定');
    const blurDetected = blurFlags.filter(Boolean).length >= Math.max(1, Math.ceil(blurFlags.length / 2));
    const motionBlurDetected = motionBlurFlags.filter(Boolean).length >= Math.max(1, Math.ceil(motionBlurFlags.length / 2));
    const averageEdgeStrength = edgeStrengths.reduce((sum, value) => sum + value, 0) / Math.max(edgeStrengths.length, 1);
    const descriptorVariants = selectedFrames.flatMap(item => item.descriptorVariants || []);
    const legacyDescriptorVariants = selectedFrames.flatMap(item => item.legacyDescriptorVariants || []);
    const uniqueDescriptorVariants = [mergedDescriptor].concat(descriptorVariants)
        .filter(item => Array.isArray(item) && item.length)
        .filter((descriptor, index, list) => list.findIndex(other => window.compareFaceDescriptors(descriptor, other) > 0.9992) === index)
        .slice(0, 4);
    const uniqueLegacyDescriptorVariants = [mergedLegacyDescriptor].concat(legacyDescriptorVariants)
        .filter(item => Array.isArray(item) && item.length)
        .filter((descriptor, index, list) => list.findIndex(other => window.compareFaceDescriptors(descriptor, other) > 0.9992) === index)
        .slice(0, 4);
    return {
        descriptor: mergedDescriptor,
        legacyDescriptor: mergedLegacyDescriptor,
        descriptorVariants: uniqueDescriptorVariants,
        legacyDescriptorVariants: uniqueLegacyDescriptorVariants,
        qualityScore: Number(((averageQuality * 0.72) + (bestQuality * 0.28)).toFixed(4)),
        qualityMessage,
        edgeStrength: Number(averageEdgeStrength.toFixed(4)),
        blurDetected,
        motionBlurDetected,
        preview: bestFrame && bestFrame.preview ? bestFrame.preview : '',
        usedDetector,
        bestFrameQualityScore: Number(bestQuality.toFixed(4)),
        bestFrameEdgeStrength: Number(bestEdgeStrength.toFixed(4)),
        bestFrameBlurDetected: !!(bestFrame && bestFrame.blurDetected),
        bestFrameMotionBlurDetected: !!(bestFrame && bestFrame.motionBlurDetected),
        bestFrameQualityMessage: (bestFrame && bestFrame.qualityMessage) || qualityMessage,
        capturedFrameCount: capturedFrames.length,
        selectedFrameCount: selectedFrames.length
    };
};
window.getFaceAuthShellIdByStatusId = function(statusId) {
    const id = String(statusId || '').trim();
    if(id === 'face-registration-status') return 'face-registration-video-shell';
    if(id === 'face-verification-status') return 'face-verification-video-shell';
    return '';
};
window.setFaceAuthVisualState = function(statusId, nextState = 'idle') {
    const shellId = window.getFaceAuthShellIdByStatusId(statusId);
    if(!shellId) return;
    const shell = $(shellId);
    if(!shell) return;
    shell.setAttribute('data-face-state', String(nextState || 'idle'));
};
window.resolveFaceAuthVisualState = function(statusId, message, tone, options = {}) {
    if(options && options.visualState) return options.visualState;
    const text = String(message || '').trim();
    if(text.includes('準備鏡頭') || text.includes('清空樣本')) return 'idle';
    if(tone === 'success') {
        if(text.includes('鏡頭已啟動')) return 'scanning';
        return 'success';
    }
    if(tone === 'error') return 'error';
    if(tone === 'warning') return 'warning';
    return 'scanning';
};
window.setFaceAuthStatus = function(targetId, message, tone = 'info', options = {}) {
    const node = $(targetId);
    if(!node) return;
    node.textContent = String(message || '').trim();
    node.dataset.tone = tone;
    window.setFaceAuthVisualState(targetId, window.resolveFaceAuthVisualState(targetId, message, tone, options));
};
window.getFaceDescriptorVariantList = function(capturedDescriptor) {
    if(Array.isArray(capturedDescriptor)) return [capturedDescriptor];
    if(!capturedDescriptor || typeof capturedDescriptor !== 'object') return [];
    return (Array.isArray(capturedDescriptor.descriptorVariants) && capturedDescriptor.descriptorVariants.length
        ? capturedDescriptor.descriptorVariants
        : (Array.isArray(capturedDescriptor.descriptor) && capturedDescriptor.descriptor.length ? [capturedDescriptor.descriptor] : []))
        .filter(item => Array.isArray(item) && item.length);
};
window.compareFaceDescriptorVariantSets = function(leftVariants, rightVariants) {
    const leftList = (Array.isArray(leftVariants) ? leftVariants : []).filter(item => Array.isArray(item) && item.length);
    const rightList = (Array.isArray(rightVariants) ? rightVariants : []).filter(item => Array.isArray(item) && item.length);
    if(!leftList.length || !rightList.length) return 0;
    let bestScore = 0;
    leftList.forEach(left => {
        rightList.forEach(right => {
            bestScore = Math.max(bestScore, window.compareFaceDescriptors(left, right));
        });
    });
    return bestScore;
};
window.clearFaceVerificationHistory = function() {
    if(window.faceAuthState) {
        window.faceAuthState.verificationHistory = [];
        window.faceAuthState.lastObservedDescriptor = [];
        window.faceAuthState.lastObservedDescriptorVariants = [];
        window.faceAuthState.lastObservedProfileId = '';
        window.faceAuthState.lastObservedAt = 0;
        window.faceAuthState.lastStrongProfileId = '';
        window.faceAuthState.lastStrongAt = 0;
        window.faceAuthState.lastStrongScore = 0;
    }
};
window.rememberFaceVerificationStrongMatch = function(profileId = '', score = 0) {
    if(!window.faceAuthState) return;
    const normalizedId = String(profileId || '').trim();
    if(!normalizedId) return;
    window.faceAuthState.lastStrongProfileId = normalizedId;
    window.faceAuthState.lastStrongAt = Date.now();
    window.faceAuthState.lastStrongScore = Number(score) || 0;
};
window.getFaceVerificationLockedProfileId = function(autoMode = false) {
    if(!window.faceAuthState || !autoMode) return '';
    const now = Date.now();
    const strongId = String(window.faceAuthState.lastStrongProfileId || '').trim();
    if(strongId && (now - Number(window.faceAuthState.lastStrongAt || 0)) <= window.getFaceVerificationProfileLockTtlMs()) {
        return strongId;
    }
    const observedId = String(window.faceAuthState.lastObservedProfileId || '').trim();
    if(observedId && (now - Number(window.faceAuthState.lastObservedAt || 0)) <= window.getFaceVerificationObservedLockTtlMs()) {
        return observedId;
    }
    return '';
};
window.getFaceVerificationRuntimeConfig = function(autoMode = false) {
    const lockedProfileId = window.getFaceVerificationLockedProfileId(autoMode);
    const fastTracked = !!lockedProfileId;
    const baseMinimumQuality = window.getFaceVerificationMinimumQuality(autoMode);
    return {
        lockedProfileId,
        fastTracked,
        attemptTotal: autoMode ? (fastTracked ? 1 : 2) : 3,
        frameCount: autoMode ? (fastTracked ? 1 : 2) : 2,
        frameGapMs: autoMode ? (fastTracked ? 18 : 28) : 48,
        attemptDelayMs: autoMode ? (fastTracked ? 18 : 36) : 78,
        retryDelayMs: autoMode ? (fastTracked ? 90 : 120) : 0,
        minimumQuality: fastTracked ? Math.max(0.35, baseMinimumQuality - 0.05) : baseMinimumQuality,
        earlyStopMinFrames: autoMode ? 1 : 2,
        earlyStopQualityScore: autoMode ? (fastTracked ? 0.56 : 0.64) : 0.62,
        earlyStopSimilarity: autoMode ? (fastTracked ? 0.988 : 0.992) : 0.99,
        maxScaleVariants: autoMode ? (fastTracked ? 2 : 3) : 4,
        captureMaxDimension: autoMode ? (fastTracked ? 720 : 840) : 900
    };
};
window.getRecentFaceVerificationHistory = function() {
    if(!window.faceAuthState) return [];
    const now = Date.now();
    const ttl = window.getFaceVerificationHistoryTtlMs();
    const history = Array.isArray(window.faceAuthState.verificationHistory) ? window.faceAuthState.verificationHistory : [];
    const filtered = history.filter(item => item && (now - Number(item.at || 0)) <= ttl);
    window.faceAuthState.verificationHistory = filtered;
    return filtered;
};
window.appendFaceVerificationHistory = function(observations) {
    if(!window.faceAuthState) return;
    const existing = window.getRecentFaceVerificationHistory();
    const appended = existing.concat(Array.isArray(observations) ? observations : []);
    const maxItems = window.getFaceVerificationHistoryLimit();
    window.faceAuthState.verificationHistory = appended.slice(Math.max(0, appended.length - maxItems));
};
window.getFaceVerificationSubjectContinuity = function(capturedDescriptor) {
    if(!window.faceAuthState) return 0;
    const variants = window.getFaceDescriptorVariantList(capturedDescriptor);
    if(!variants.length) return 0;
    const previousVariants = (Array.isArray(window.faceAuthState.lastObservedDescriptorVariants) && window.faceAuthState.lastObservedDescriptorVariants.length)
        ? window.faceAuthState.lastObservedDescriptorVariants
        : (Array.isArray(window.faceAuthState.lastObservedDescriptor) && window.faceAuthState.lastObservedDescriptor.length ? [window.faceAuthState.lastObservedDescriptor] : []);
    if(!previousVariants.length) return 0;
    return Number(window.compareFaceDescriptorVariantSets(variants, previousVariants) || 0);
};
window.hasFaceVerificationSubjectChanged = function(capturedDescriptor, minimumQuality = window.getFaceVerificationIdentitySwitchQuality()) {
    if(!window.faceAuthState) return false;
    const variants = window.getFaceDescriptorVariantList(capturedDescriptor);
    if(!variants.length) return false;
    if(Number(capturedDescriptor && capturedDescriptor.qualityScore || 0) < minimumQuality) return false;
    const previousVariants = (Array.isArray(window.faceAuthState.lastObservedDescriptorVariants) && window.faceAuthState.lastObservedDescriptorVariants.length)
        ? window.faceAuthState.lastObservedDescriptorVariants
        : (Array.isArray(window.faceAuthState.lastObservedDescriptor) && window.faceAuthState.lastObservedDescriptor.length ? [window.faceAuthState.lastObservedDescriptor] : []);
    if(!previousVariants.length) return false;
    const similarity = window.compareFaceDescriptorVariantSets(variants, previousVariants);
    return similarity > 0 && similarity < window.getFaceVerificationIdentitySwitchSimilarity();
};
window.rememberFaceVerificationSubject = function(capturedDescriptor, profileId = '') {
    if(!window.faceAuthState) return;
    const variants = window.getFaceDescriptorVariantList(capturedDescriptor).slice(0, 4);
    window.faceAuthState.lastObservedDescriptorVariants = variants;
    window.faceAuthState.lastObservedDescriptor = variants[0] || [];
    window.faceAuthState.lastObservedProfileId = String(profileId || '').trim();
    window.faceAuthState.lastObservedAt = Date.now();
};
window.groupFaceVerificationObservations = function(observations) {
    const groups = {};
    (Array.isArray(observations) ? observations : []).forEach(item => {
        if(!item || !item.profile || !item.profile.id) return;
        const profileId = item.profile.id;
        if(!groups[profileId]) {
            groups[profileId] = {
                profile: item.profile,
                strongCount: 0,
                weakCount: 0,
                allCount: 0,
                scores: [],
                qualities: [],
                margins: [],
                latestAt: 0
            };
        }
        const group = groups[profileId];
        group.profile = item.profile || group.profile;
        group.allCount += 1;
        if(item.strong) group.strongCount += 1;
        if(item.weak) group.weakCount += 1;
        group.scores.push(Number(item.score) || 0);
        group.qualities.push(Number(item.qualityScore) || 0);
        group.margins.push(Number(item.margin) || 0);
        group.latestAt = Math.max(group.latestAt, Number(item.at || 0));
    });
    return Object.values(groups).map(group => {
        const avgScore = group.scores.reduce((sum, value) => sum + value, 0) / Math.max(group.scores.length, 1);
        const avgQuality = group.qualities.reduce((sum, value) => sum + value, 0) / Math.max(group.qualities.length, 1);
        const avgMargin = group.margins.reduce((sum, value) => sum + value, 0) / Math.max(group.margins.length, 1);
        const strongRate = group.strongCount / Math.max(group.allCount, 1);
        return {
            ...group,
            avgScore,
            avgQuality,
            avgMargin,
            strongRate
        };
    }).sort((left, right) => {
        if(right.strongCount !== left.strongCount) return right.strongCount - left.strongCount;
        if(right.weakCount !== left.weakCount) return right.weakCount - left.weakCount;
        if(right.avgScore !== left.avgScore) return right.avgScore - left.avgScore;
        return right.latestAt - left.latestAt;
    });
};
window.evaluateFaceVerificationWindow = function(observations, threshold, softThreshold, requiredMatches) {
    const groupedMatches = window.groupFaceVerificationObservations(observations);
    const bestMatch = groupedMatches[0] || null;
    const bestAverageScore = bestMatch ? bestMatch.avgScore : 0;
    const bestAverageMargin = bestMatch ? bestMatch.avgMargin : 0;
    const bestAverageQuality = bestMatch ? bestMatch.avgQuality : 0;
    const bestStrongCount = bestMatch ? bestMatch.strongCount : 0;
    const bestWeakCount = bestMatch ? bestMatch.weakCount : 0;
    const passed = !!(bestMatch && (
        (bestStrongCount >= requiredMatches && bestAverageScore >= threshold - 0.004 && bestAverageMargin >= 0.004) ||
        (bestStrongCount >= 1 && bestWeakCount >= 4 && bestAverageScore >= softThreshold + 0.004 && bestAverageMargin >= 0.0055)
    ));
    const quickPassed = !!(bestMatch &&
        bestStrongCount >= requiredMatches &&
        bestAverageScore >= threshold + window.getFaceVerificationQuickPassScoreBonus() &&
        bestAverageMargin >= window.getFaceVerificationQuickPassMargin() &&
        bestAverageQuality >= 0.54
    );
    return {
        groupedMatches,
        bestMatch,
        bestAverageScore,
        bestAverageMargin,
        bestAverageQuality,
        bestStrongCount,
        bestWeakCount,
        passed,
        quickPassed
    };
};
window.hasFaceVerificationImmediatePass = function(observations, threshold) {
    const requiredStrong = window.getFaceVerificationImmediatePassStrongCount();
    const recentStrong = (Array.isArray(observations) ? observations : [])
        .filter(item => item && item.profile && item.profile.id && item.strong)
        .slice(-requiredStrong);
    if(recentStrong.length < requiredStrong) return false;
    const profileId = recentStrong[0] && recentStrong[0].profile ? recentStrong[0].profile.id : '';
    if(!profileId || recentStrong.some(item => !item.profile || item.profile.id !== profileId)) return false;
    const avgScore = recentStrong.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / recentStrong.length;
    const avgMargin = recentStrong.reduce((sum, item) => sum + (Number(item.margin) || 0), 0) / recentStrong.length;
    const avgQuality = recentStrong.reduce((sum, item) => sum + (Number(item.qualityScore) || 0), 0) / recentStrong.length;
    return avgScore >= Math.max(0.82, threshold - 0.003)
        && avgMargin >= window.getFaceVerificationImmediatePassMargin()
        && avgQuality >= window.getFaceVerificationImmediatePassQuality();
};
window.hasFaceVerificationStableFastPass = function(observations, threshold, autoMode = false) {
    const requiredStrong = window.getFaceVerificationFastPassStableMatches();
    const recentStrong = (Array.isArray(observations) ? observations : [])
        .filter(item => item && item.profile && item.profile.id && item.strong)
        .slice(-requiredStrong);
    if(recentStrong.length < requiredStrong) return false;
    const profileId = recentStrong[0] && recentStrong[0].profile ? recentStrong[0].profile.id : '';
    if(!profileId || recentStrong.some(item => !item.profile || item.profile.id !== profileId)) return false;
    const avgScore = recentStrong.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / recentStrong.length;
    const avgMargin = recentStrong.reduce((sum, item) => sum + (Number(item.margin) || 0), 0) / recentStrong.length;
    const avgQuality = recentStrong.reduce((sum, item) => sum + (Number(item.qualityScore) || 0), 0) / recentStrong.length;
    const avgConsistency = recentStrong.reduce((sum, item) => sum + (Number(item.consistency) || 0), 0) / recentStrong.length;
    const stableCount = recentStrong.filter(item => item.subjectStable !== false).length;
    return stableCount >= requiredStrong
        && avgScore >= Math.max(0.835, threshold + (autoMode ? 0.001 : 0.0025))
        && avgMargin >= Math.max(window.getFaceVerificationQuickPassMargin(), window.getFaceVerificationStrongMargin(autoMode))
        && avgQuality >= window.getFaceVerificationFastPassQuality()
        && avgConsistency >= window.getFaceVerificationFastPassConsistency();
};
window.hasFaceVerificationLockedProfileFastPass = function(observations, lockedProfileId, threshold, autoMode = false) {
    const normalizedId = String(lockedProfileId || '').trim();
    if(!normalizedId) return false;
    const latestStrong = (Array.isArray(observations) ? observations : [])
        .filter(item => item && item.profile && item.profile.id === normalizedId && item.strong)
        .slice(-1)[0];
    if(!latestStrong) return false;
    return (latestStrong.subjectStable !== false)
        && Number(latestStrong.score || 0) >= Math.max(0.842, threshold - 0.003)
        && Number(latestStrong.margin || 0) >= Math.max(0.006, window.getFaceVerificationStrongMargin(autoMode) - 0.0004)
        && Number(latestStrong.qualityScore || 0) >= 0.45
        && Number(latestStrong.consistency || 0) >= Math.max(0.66, window.getFaceVerificationStrongConsistency(autoMode) - 0.06);
};
window.shouldResetFaceVerificationHistory = function(historyEvaluation, currentEvaluation, threshold) {
    const historyBest = historyEvaluation && historyEvaluation.bestMatch;
    const currentBest = currentEvaluation && currentEvaluation.bestMatch;
    if(!historyBest || !currentBest || !historyBest.profile || !currentBest.profile) return false;
    if(historyBest.profile.id === currentBest.profile.id) return false;
    const currentStrongEnough = Number(currentEvaluation.bestStrongCount || 0) >= window.getFaceVerificationIdentityResetStrongCount();
    const currentScoreGood = Number(currentEvaluation.bestAverageScore || 0) >= Math.max(threshold, window.getFaceVerificationIdentityResetScore());
    const currentMarginGood = Number(currentEvaluation.bestAverageMargin || 0) >= window.getFaceVerificationIdentityResetMargin();
    const historyLooksWeaker = Number(historyEvaluation.bestStrongCount || 0) < Number(currentEvaluation.bestStrongCount || 0)
        || Number(historyEvaluation.bestAverageScore || 0) <= Number(currentEvaluation.bestAverageScore || 0) - 0.006;
    return currentStrongEnough && currentScoreGood && currentMarginGood && historyLooksWeaker;
};
window.renderFaceRegistrationSamples = function() {
    const shell = $('face-registration-samples');
    if(!shell) return;
    const samples = Array.isArray(window.faceAuthState.samples) ? window.faceAuthState.samples : [];
    const maxSamples = window.getFaceRegistrationSampleLimit();
    const minSamples = window.getFaceRegistrationRequiredSamples();
    shell.innerHTML = Array.from({ length: maxSamples }, (_, index) => {
        const sample = samples[index];
        if(!sample || !sample.preview) return '<div class="face-auth-sample"><div class="face-auth-sample-empty">待擷取樣本</div></div>';
        return '<div class="face-auth-sample"><img src="' + sample.preview + '" alt="Face sample ' + (index + 1) + '"></div>';
    }).join('');
    if($('face-registration-count')) $('face-registration-count').textContent = Math.min(samples.length, maxSamples) + ' / ' + maxSamples;
    if($('btn-face-registration-save')) $('btn-face-registration-save').disabled = samples.length < minSamples;
    window.renderFaceRegistrationGuide();
};
window.stopFaceAuthStream = function() {
    if(window.faceAuthState && window.faceAuthState.autoLoopTimer) {
        clearTimeout(window.faceAuthState.autoLoopTimer);
        window.faceAuthState.autoLoopTimer = null;
        window.faceAuthState.autoLoopEnabled = false;
    }
    if(window.faceAuthState && window.faceAuthState.stream) {
        window.faceAuthState.stream.getTracks().forEach(track => track.stop());
    }
    if(window.faceAuthState) {
        window.faceAuthState.stream = null;
        window.faceAuthState.cameraReady = false;
        window.faceAuthState.busy = false;
    }
    window.clearFaceTrackingState();
    ['face-registration-video', 'face-verification-video'].forEach(id => {
        if($(id)) $(id).srcObject = null;
    });
    window.setFaceAuthVisualState('face-registration-status', 'idle');
    window.setFaceAuthVisualState('face-verification-status', 'idle');
};
window.stopFaceVerificationAutoLoop = function() {
    if(window.faceAuthState && window.faceAuthState.autoLoopTimer) {
        clearTimeout(window.faceAuthState.autoLoopTimer);
        window.faceAuthState.autoLoopTimer = null;
    }
    if(window.faceAuthState) window.faceAuthState.autoLoopEnabled = false;
};
window.scheduleFaceVerificationAutoLoop = function(delay = 260) {
    if(!window.faceAuthState || !window.faceAuthState.autoLoopEnabled) return;
    if(window.faceAuthState.autoLoopTimer) clearTimeout(window.faceAuthState.autoLoopTimer);
    window.faceAuthState.autoLoopTimer = setTimeout(async () => {
        if(window.faceAuthState.mode !== 'verify' || !window.faceAuthState.autoLoopEnabled) return;
        if(window.faceAuthState.busy) {
            window.scheduleFaceVerificationAutoLoop(90);
            return;
        }
        const result = await window.verifyFaceForAdminAccess({ auto: true });
        if(window.faceAuthState.mode !== 'verify' || !window.faceAuthState.autoLoopEnabled) return;
        if(result && result.passed) return;
        window.scheduleFaceVerificationAutoLoop(result && result.retryDelay ? result.retryDelay : 120);
    }, Math.max(70, Number(delay) || 120));
};
window.startFaceVerificationAutoLoop = function() {
    if(!window.faceAuthState) return;
    window.faceAuthState.autoLoopEnabled = true;
    window.scheduleFaceVerificationAutoLoop(70);
};
window.startFaceAuthCamera = async function(videoId, statusId) {
    window.stopFaceAuthStream();
    if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        window.setFaceAuthStatus(statusId, '目前瀏覽器無法使用鏡頭，請改用密碼備援', 'error');
        return false;
    }
    const expectedMode = window.faceAuthState.mode;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        if(window.faceAuthState.mode !== expectedMode) {
            stream.getTracks().forEach(track => track.stop());
            return false;
        }
        const video = $(videoId);
        if(!video) {
            stream.getTracks().forEach(track => track.stop());
            return false;
        }
        video.srcObject = stream;
        const playResult = video.play();
        if(playResult && typeof playResult.then === 'function') await playResult.catch(() => {});
        window.faceAuthState.stream = stream;
        window.faceAuthState.cameraReady = true;
        window.setFaceAuthStatus(statusId, typeof window.FaceDetector === 'function' ? '鏡頭已啟動，可開始擷取或驗證' : '鏡頭已啟動，請把臉保持在中央', 'success');
        return true;
    } catch(error) {
        console.warn('startFaceAuthCamera failed:', error);
        window.setFaceAuthStatus(statusId, '無法開啟鏡頭，請檢查權限或改用密碼備援', 'error');
        return false;
    }
};
window.formatFaceProfileInitials = function(name) {
    const raw = String(name || '').trim();
    if(!raw) return 'FACE';
    if(raw.length <= 2) return raw;
    return raw.slice(0, 2);
};
window.getFaceProfileById = function(profileId) {
    const config = window.getCurrentFaceRecognitionConfig();
    return (config.profiles || []).find(item => item.id === String(profileId || '').trim()) || null;
};
window.getFaceRegistrationGuideSteps = function() {
    return [
        {
            id: 'front',
            label: '正面',
            title: '請正對鏡頭',
            hint: '把整顆頭放進框內，保持 1 秒再擷取。',
            buttonLabel: '擷取正面',
            symbol: '◎',
            description: '把整顆頭維持在導引框內，先建立基準樣本。'
        },
        {
            id: 'left',
            label: '左轉',
            title: '請往左轉頭',
            hint: '鼻尖和下巴微微往左移，讓左側輪廓更明顯。',
            buttonLabel: '擷取左轉',
            symbol: '←',
            description: '臉部微微往左轉，讓系統記住左側輪廓。'
        },
        {
            id: 'right',
            label: '右轉',
            title: '請往右轉頭',
            hint: '頭部輕輕往右側轉，補足另一側臉部輪廓。',
            buttonLabel: '擷取右轉',
            symbol: '→',
            description: '臉部微微往右轉，補足另一側輪廓。'
        },
        {
            id: 'up',
            label: '抬頭',
            title: '請微微抬頭',
            hint: '讓額頭和眉骨稍微往上露出，不要離開框線。',
            buttonLabel: '擷取抬頭',
            symbol: '↑',
            description: '頭輕輕往上抬，讓額頭與上輪廓更完整。'
        },
        {
            id: 'down',
            label: '低頭',
            title: '請微微低頭',
            hint: '讓下巴往下收一點，補齊下顎和臉型角度。',
            buttonLabel: '擷取低頭',
            symbol: '↓',
            description: '頭微微往下低，補齊下巴與臉型角度。'
        }
    ];
};
window.getCurrentFaceRegistrationGuideStep = function(sampleCount = null) {
    const steps = window.getFaceRegistrationGuideSteps();
    const count = sampleCount == null
        ? ((window.faceAuthState && Array.isArray(window.faceAuthState.samples)) ? window.faceAuthState.samples.length : 0)
        : Number(sampleCount || 0);
    return steps[Math.min(Math.max(0, count), steps.length - 1)] || steps[0];
};
window.renderFaceRegistrationGuide = function() {
    const steps = window.getFaceRegistrationGuideSteps();
    const samples = Array.isArray(window.faceAuthState && window.faceAuthState.samples) ? window.faceAuthState.samples : [];
    const currentIndex = Math.min(samples.length, steps.length - 1);
    const currentStep = steps[currentIndex] || steps[0];
    const complete = samples.length >= steps.length;
    const guideShell = $('face-registration-video-shell');
    if(guideShell) guideShell.dataset.guideStep = complete ? 'complete' : currentStep.id;
    const progressShell = $('face-registration-progress');
    if(progressShell) {
        progressShell.innerHTML = steps.map((step, index) => {
            const classes = [
                'face-auth-progress-item',
                index < samples.length ? 'is-complete' : '',
                index === currentIndex && samples.length < steps.length ? 'is-active' : ''
            ].filter(Boolean).join(' ');
            return '<div class="' + classes + '">' +
                '<div class="face-auth-progress-dot">' + (index < samples.length ? '' : String(index + 1)) + '</div>' +
                '<div class="face-auth-progress-copy">' +
                '<strong>' + window.escapeHtml(step.label) + '</strong>' +
                '<span>' + window.escapeHtml(step.description) + '</span>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    if($('face-registration-guide-label')) {
        $('face-registration-guide-label').textContent = complete ? '頭部掃描完成' : currentStep.title;
    }
    if($('face-registration-guide-hint')) {
        $('face-registration-guide-hint').textContent = complete
            ? '五個角度都已完成，可直接儲存註冊或重拍。'
            : currentStep.hint;
    }
    if($('face-registration-guide-direction')) {
        $('face-registration-guide-direction').textContent = complete ? '✓' : (currentStep.symbol || '◎');
    }
    if($('face-registration-support')) {
        $('face-registration-support').textContent = complete
            ? '五個頭部角度都已完成，可直接儲存註冊或重拍'
            : ('目前步驟：' + currentStep.label + '。' + currentStep.description + ' 建議保持整顆頭在框內。');
    }
    if($('face-registration-footer-step')) {
        $('face-registration-footer-step').textContent = complete
            ? '五個角度已完成，可直接儲存'
            : ('目前步驟：' + currentStep.label);
    }
    if($('face-registration-footer-hint')) {
        $('face-registration-footer-hint').textContent = complete
            ? '樣本已收齊，現在可以直接儲存註冊，或先清空樣本重新拍一次。'
            : ('已擷取 ' + samples.length + ' / ' + steps.length + ' 張。' + currentStep.description);
    }
    if($('btn-face-registration-capture')) {
        $('btn-face-registration-capture').innerHTML = '<i data-lucide="camera" class="w-4 h-4"></i> ' + window.escapeHtml(complete ? '已完成五步' : currentStep.buttonLabel);
        $('btn-face-registration-capture').disabled = complete;
    }
    if(window.lucide) window.lucide.createIcons();
};
window.validateFaceRegistrationGuideStep = function(result, samples) {
    const existingSamples = Array.isArray(samples) ? samples : [];
    const currentStep = window.getCurrentFaceRegistrationGuideStep(existingSamples.length);
    if(!existingSamples.length) return { ok: true, step: currentStep };
    const frontSample = existingSamples[0];
    const lastSample = existingSamples[existingSamples.length - 1];
    const similarityToFront = frontSample && Array.isArray(frontSample.descriptor)
        ? window.compareFaceDescriptors(result.descriptor, frontSample.descriptor)
        : 0;
    const similarityToLast = lastSample && Array.isArray(lastSample.descriptor)
        ? window.compareFaceDescriptors(result.descriptor, lastSample.descriptor)
        : 0;
    if((currentStep.id === 'left' || currentStep.id === 'right') && similarityToFront > 0.9915 && similarityToLast > 0.9925) {
        return { ok: false, step: currentStep, message: '這一張和正面太接近，請把頭再往' + currentStep.label.replace('轉', '') + '側轉一點再擷取' };
    }
    if((currentStep.id === 'up' || currentStep.id === 'down') && similarityToFront > 0.9928 && similarityToLast > 0.9935) {
        return { ok: false, step: currentStep, message: '角度變化還不夠，請再' + currentStep.label + '一點，讓整顆頭部輪廓更明顯' };
    }
    return { ok: true, step: currentStep };
};
window.handleFaceRegistrationBackdrop = function(event) {
    if(event && event.target && event.target.id === 'face-registration-modal') window.closeFaceRegistrationModal();
};
window.handleFaceVerificationBackdrop = function(event) {
    if(event && event.target && event.target.id === 'face-verification-modal') window.closeFaceVerificationModal();
};
window.resetFaceRegistrationSamples = function() {
    window.faceAuthState.samples = [];
    window.renderFaceRegistrationSamples();
    const nextStep = window.getCurrentFaceRegistrationGuideStep(0);
    window.setFaceAuthStatus(
        'face-registration-status',
        window.faceAuthState.cameraReady ? ('已清空樣本，請先完成「' + nextStep.label + '」') : '正在準備鏡頭',
        window.faceAuthState.cameraReady ? 'info' : 'warning'
    );
};
window.openFaceRegistrationModal = async function(profileId = '') {
    if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以註冊人臉', 'error');
    const profile = window.getFaceProfileById(profileId);
    window.faceAuthState.mode = 'register';
    window.faceAuthState.editingProfileId = profile ? profile.id : '';
    window.faceAuthState.pendingRole = '';
    window.faceAuthState.samples = [];
    window.clearFaceTrackingState();
    if($('face-registration-name')) $('face-registration-name').value = profile ? profile.name : '';
    if($('face-registration-modal-title')) $('face-registration-modal-title').innerText = profile ? '更新管理員人臉' : '註冊管理員人臉';
    if($('face-registration-modal-copy')) $('face-registration-modal-copy').innerText = profile
        ? '請依序重新完成正面、左右轉頭、抬頭與低頭。系統會用多角度頭部樣本重建辨識記憶，更新後也會同步到雲端。'
        : '請像頭部掃描一樣，依序完成正面、左轉、右轉、抬頭與低頭。系統會用這五個角度建立更完整的人臉記憶，並同步到雲端供其他設備使用。';
    window.setFaceAuthVisualState('face-registration-status', 'idle');
    window.renderFaceRegistrationSamples();
    show('face-registration-modal');
    if(window.lucide) window.lucide.createIcons();
    await window.startFaceAuthCamera('face-registration-video', 'face-registration-status');
};
window.closeFaceRegistrationModal = function() {
    window.stopFaceAuthStream();
    window.faceAuthState.mode = 'idle';
    window.faceAuthState.editingProfileId = '';
    window.faceAuthState.samples = [];
    window.setFaceAuthVisualState('face-registration-status', 'idle');
    hide('face-registration-modal');
};
window.captureFaceRegistrationSample = async function() {
    if(window.faceAuthState.busy) return;
    const maxSamples = window.getFaceRegistrationSampleLimit();
    if((window.faceAuthState.samples || []).length >= maxSamples) return window.showToast('樣本已達上限，可直接儲存註冊', 'error');
    window.faceAuthState.busy = true;
    const currentStep = window.getCurrentFaceRegistrationGuideStep();
    window.setFaceAuthStatus('face-registration-status', '正在擷取「' + currentStep.label + '」樣本...', 'info');
    try {
        const result = await window.captureStableFaceDescriptorFromVideo('face-registration-video', {
            frameCount: 4,
            gapMs: 90,
            minFrames: 2,
            relaxedSelection: true,
            earlyStopMinFrames: 2,
            earlyStopQualityScore: 0.58,
            earlyStopSimilarity: 0.989
        });
        const bestFrameQualityScore = Number(result.bestFrameQualityScore || result.qualityScore || 0);
        const bestFrameEdgeStrength = Number(result.bestFrameEdgeStrength || result.edgeStrength || 0);
        const registrationBestFrameMinimumQuality = window.getFaceRegistrationBestFrameMinimumQuality();
        const registrationBestFrameMinimumEdgeStrength = window.getFaceRegistrationBestFrameMinimumEdgeStrength();
        const severeMotionBlurDetected = !!result.motionBlurDetected
            && !!result.bestFrameMotionBlurDetected
            && bestFrameQualityScore < registrationBestFrameMinimumQuality
            && bestFrameEdgeStrength < registrationBestFrameMinimumEdgeStrength;
        if(severeMotionBlurDetected) {
            throw new Error('這張樣本有明顯晃動，請把臉停住 1 秒再重新擷取');
        }
        const severeBlurDetected = (result.blurDetected || !!result.bestFrameBlurDetected)
            && bestFrameQualityScore < Math.max(0.49, registrationBestFrameMinimumQuality - 0.01)
            && bestFrameEdgeStrength < Math.max(window.getFaceRegistrationBlurMinimumEdgeStrength(), registrationBestFrameMinimumEdgeStrength);
        if(severeBlurDetected) {
            throw new Error('這張樣本太糊，請靠近一點並保持鏡頭穩定後再試一次');
        }
        const registrationMinimumQuality = window.getAdjustedFaceQualityThreshold(0.56, result, false);
        const averageQualityScore = Number(result.qualityScore || 0);
        if(averageQualityScore < registrationMinimumQuality && bestFrameQualityScore < (registrationMinimumQuality + 0.035)) {
            throw new Error('目前樣本品質不足：' + (result.bestFrameQualityMessage || result.qualityMessage || '請調整光線與距離'));
        }
        const hasTooSimilarSample = (window.faceAuthState.samples || []).some(sample => {
            return window.compareFaceDescriptors(sample.descriptor, result.descriptor) > 0.994;
        });
        if(hasTooSimilarSample) {
            throw new Error('這張樣本和前一張太接近，請稍微換角度或距離再擷取');
        }
        const guidedValidation = window.validateFaceRegistrationGuideStep(result, window.faceAuthState.samples || []);
        if(!guidedValidation.ok) {
            throw new Error(guidedValidation.message || '目前角度變化不足，請調整頭部角度後再擷取');
        }
        window.faceAuthState.samples.push({
            preview: result.preview,
            descriptor: result.descriptor,
            legacyDescriptor: result.legacyDescriptor,
            qualityScore: result.qualityScore,
            guideStepId: currentStep.id
        });
        window.renderFaceRegistrationSamples();
        const nextStep = window.getCurrentFaceRegistrationGuideStep((window.faceAuthState.samples || []).length);
        window.setFaceAuthStatus(
            'face-registration-status',
            (window.faceAuthState.samples || []).length >= maxSamples
                ? ('五個頭部角度都已完成，品質 ' + Math.round((Number(result.qualityScore) || 0) * 100) + '%')
                : ('已完成「' + currentStep.label + '」，接著請完成「' + nextStep.label + '」'),
            'success'
        );
    } catch(error) {
        window.setFaceAuthStatus('face-registration-status', error && error.message ? error.message : '擷取失敗，請再試一次', 'error');
    } finally {
        window.faceAuthState.busy = false;
    }
};
window.saveRegisteredFaceProfile = async function() {
    if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以註冊人臉', 'error');
    const name = $('face-registration-name') ? $('face-registration-name').value.trim() : '';
    const samples = Array.isArray(window.faceAuthState.samples) ? window.faceAuthState.samples : [];
    const minSamples = window.getFaceRegistrationRequiredSamples();
    if(!name) return window.showToast('請先填寫管理員名稱', 'error');
    if(samples.length < minSamples) return window.showToast('請至少擷取 ' + minSamples + ' 張樣本再儲存', 'error');
    const prevConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const nextProfiles = [...(prevConfig.faceRecognition && prevConfig.faceRecognition.profiles || [])];
    const profileId = window.faceAuthState.editingProfileId || window.createDeviceAccessId('face');
    const nowIso = new Date().toISOString();
    const sampleEntries = samples
        .map(item => ({
            descriptor: Array.isArray(item && item.descriptor) ? item.descriptor : [],
            legacyDescriptor: Array.isArray(item && item.legacyDescriptor) ? item.legacyDescriptor : [],
            weight: Math.max(0.35, Number(item && item.qualityScore) || 0.35)
        }))
        .filter(item => item.descriptor.length || item.legacyDescriptor.length);
    const sampleDescriptors = sampleEntries.map(item => item.descriptor).filter(item => item.length);
    const legacySampleDescriptors = sampleEntries.map(item => item.legacyDescriptor).filter(item => item.length);
    const sampleWeights = sampleEntries.map(item => item.weight);
    const legacySampleWeights = sampleEntries
        .filter(item => item.legacyDescriptor.length)
        .map(item => item.weight);
    const memoryDescriptors = window.buildFaceMemoryDescriptors(sampleDescriptors, sampleWeights, window.getFaceMemoryGroupLimit());
    const legacyMemoryDescriptors = window.buildFaceMemoryDescriptors(
        legacySampleDescriptors,
        legacySampleWeights,
        Math.max(1, window.getFaceMemoryGroupLimit() - 1)
    );
    const profile = {
        id: profileId,
        name,
        descriptorVersion: window.getCurrentFaceDescriptorVersion(),
        descriptor: window.averageWeightedFaceDescriptors(sampleDescriptors, sampleWeights),
        legacyDescriptor: window.averageWeightedFaceDescriptors(
            legacySampleDescriptors,
            legacySampleWeights
        ),
        memoryDescriptors,
        legacyMemoryDescriptors,
        sampleDescriptors: sampleDescriptors,
        legacySampleDescriptors,
        sampleCount: samples.length,
        preview: String(samples[0] && samples[0].preview || '').trim(),
        registeredAt: nowIso,
        updatedAt: nowIso,
        lastVerifiedAt: window.getFaceProfileById(profileId)?.lastVerifiedAt || ''
    };
    const existingIndex = nextProfiles.findIndex(item => item.id === profileId);
    if(existingIndex >= 0) {
        profile.registeredAt = nextProfiles[existingIndex].registeredAt || nowIso;
        profile.lastVerifiedAt = nextProfiles[existingIndex].lastVerifiedAt || '';
        nextProfiles[existingIndex] = profile;
    } else {
        nextProfiles.unshift(profile);
    }
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig({
        ...prevConfig,
        faceRecognition: {
            ...(prevConfig.faceRecognition || {}),
            profiles: nextProfiles
        }
    });
    window.persistDeviceAccessConfigLocal();
    window.showToast('正在同步人臉資料到雲端...', 'success');
    const canShowLoading = typeof window.showLoadingOverlay === 'function' && typeof window.hideLoadingOverlay === 'function';
    let loadingShown = false;
    try {
        if(canShowLoading) {
            window.showLoadingOverlay('正在儲存人臉辨識資料並同步到雲端，請稍候一下。', '人臉資料處理中');
            loadingShown = true;
        }
        if(await window.saveDeviceAccessConfigToCloud()) {
            window.closeFaceRegistrationModal();
            window.renderDeviceAccessAdminPanel();
            window.showToast(existingIndex >= 0 ? '管理員人臉已更新，其他設備可同步使用' : '管理員人臉已註冊，其他設備可同步使用');
        } else {
            window.deviceAccessConfig = prevConfig;
            window.persistDeviceAccessConfigLocal();
            window.renderDeviceAccessAdminPanel();
            window.showToast('人臉註冊儲存失敗' + (window.lastSettingsSaveError ? '：' + window.lastSettingsSaveError : ''), 'error');
        }
    } finally {
        if(loadingShown) window.hideLoadingOverlay();
    }
};
window.removeFaceProfile = function(profileId) {
    if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以移除人臉資料', 'error');
    const currentConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const target = (currentConfig.faceRecognition && currentConfig.faceRecognition.profiles || []).find(item => item.id === String(profileId || '').trim());
    if(!target) return window.showToast('找不到這筆人臉資料', 'error');
    window.openConfirmModal('移除人臉註冊', '確定要移除「' + (target.name || '這位管理員') + '」的人臉資料嗎？移除後，下次登入只能改用備援密碼。', async () => {
        const prevConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
        window.deviceAccessConfig = window.normalizeDeviceAccessConfig({
            ...prevConfig,
            faceRecognition: {
                ...(prevConfig.faceRecognition || {}),
                profiles: (prevConfig.faceRecognition && prevConfig.faceRecognition.profiles || []).filter(item => item.id !== target.id)
            }
        });
        window.persistDeviceAccessConfigLocal();
        window.showToast('正在同步人臉資料到雲端...', 'success');
        if(await window.saveDeviceAccessConfigToCloud()) {
            window.renderDeviceAccessAdminPanel();
            window.showToast('人臉資料已移除');
        } else {
            window.deviceAccessConfig = prevConfig;
            window.persistDeviceAccessConfigLocal();
            window.renderDeviceAccessAdminPanel();
            window.showToast('移除失敗' + (window.lastSettingsSaveError ? '：' + window.lastSettingsSaveError : ''), 'error');
        }
    });
};
window.updateFaceVerificationPanel = function() {
    const config = window.getCurrentFaceRecognitionConfig();
    if($('face-verification-profile-count')) $('face-verification-profile-count').textContent = '共 ' + (config.profiles || []).length + ' 位已註冊管理員';
    if($('btn-face-verification-fallback')) {
        $('btn-face-verification-fallback').classList.toggle('hidden', !config.allowPasswordFallback);
    }
    if($('face-verification-match')) {
        $('face-verification-match').classList.add('hidden');
        $('face-verification-match').innerHTML = '';
    }
};
window.openFaceVerificationModal = async function(role) {
    window.faceAuthState.mode = 'verify';
    window.faceAuthState.pendingRole = String(role || '').trim();
    window.stopFaceVerificationAutoLoop();
    window.clearFaceVerificationHistory();
    window.clearFaceTrackingState();
    window.updateFaceVerificationPanel();
    if($('face-verification-support')) $('face-verification-support').textContent = typeof window.FaceDetector === 'function'
        ? '鏡頭開啟後請保持正面 1 到 2 秒，系統會自動連續辨識'
        : '目前會使用中央構圖比對，請把臉保持在中央並停留 1 到 2 秒';
    window.setFaceAuthVisualState('face-verification-status', 'idle');
    show('face-verification-modal');
    if(window.lucide) window.lucide.createIcons();
    const ready = await window.startFaceAuthCamera('face-verification-video', 'face-verification-status');
    if(ready) {
        window.setFaceAuthStatus('face-verification-status', '鏡頭已啟動，正在自動辨識中...', 'info');
        window.startFaceVerificationAutoLoop();
    }
};
window.closeFaceVerificationModal = function() {
    window.stopFaceVerificationAutoLoop();
    window.stopFaceAuthStream();
    window.faceAuthState.mode = 'idle';
    window.faceAuthState.pendingRole = '';
    window.clearFaceVerificationHistory();
    window.clearFaceTrackingState();
    if($('face-verification-match')) {
        $('face-verification-match').classList.add('hidden');
        $('face-verification-match').innerHTML = '';
    }
    window.setFaceAuthVisualState('face-verification-status', 'idle');
    hide('face-verification-modal');
};
window.safeHideModalElement = function(id) {
    try {
        if(typeof hide === 'function') {
            hide(id);
            return;
        }
    } catch(error) {}
    const node = typeof $ === 'function' ? $(id) : document.getElementById(id);
    if(!node) return;
    node.classList.add('hidden');
    node.style.display = 'none';
};
window.finalizeAdminAccess = function(role) {
    const nextRole = String(role || window.faceAuthState.pendingRole || '').trim();
    try { window.stopFaceAuthStream(); } catch(error) {}
    window.safeHideModalElement('password-modal');
    window.safeHideModalElement('face-verification-modal');
    window.faceAuthState.mode = 'idle';
    window.faceAuthState.pendingRole = '';
    try { window.clearFaceVerificationHistory(); } catch(error) {}
    try { window.clearFaceTrackingState(); } catch(error) {}
    try { window.setFaceAuthVisualState('face-verification-status', 'idle'); } catch(error) {}
    if(!nextRole) return;
    window.currentAdminRole = nextRole;
    const targetTab = window.pendingAdminTargetTab || 'admin-tab';
    window.pendingAdminTargetTab = '';
    let switched = false;
    try {
        if(typeof window.switchTab === 'function') {
            window.switchTab(targetTab);
            switched = true;
        }
    } catch(error) {
        console.warn('switchTab failed during admin finalize:', error);
    }
    if(!switched) {
        try {
            const adminTab = typeof $ === 'function' ? $('admin-tab') : document.getElementById('admin-tab');
            if(adminTab) {
                document.querySelectorAll('.tab-content').forEach(el => {
                    el.classList.remove('active');
                    el.style.display = 'none';
                });
                adminTab.classList.add('active');
                adminTab.style.display = 'block';
                document.body.classList.add('admin-fullscreen-mode');
            }
            if(typeof window.applyAdminRoleUI === 'function') window.applyAdminRoleUI();
        } catch(error) {
            console.warn('Admin fallback tab activation failed:', error);
        }
    }
    const loadPromise = typeof window.loadSettingsFromCloud === 'function'
        ? window.loadSettingsFromCloud({ privateMode: true, silent: true })
        : Promise.resolve();
    Promise.resolve(loadPromise)
        .then(() => typeof window.fetchData === 'function' ? window.fetchData(true, { privateMode: true }) : null)
        .catch(error => {
            console.warn('Admin private data preload failed:', error);
        });
};
window.usePasswordFallbackForAdminAccess = function() {
    const config = window.getCurrentFaceRecognitionConfig();
    if(!config.allowPasswordFallback) return window.showToast('目前已關閉密碼備援放行', 'error');
    const pendingRole = window.faceAuthState.pendingRole;
    if(!pendingRole) return window.showToast('目前沒有待放行的後台登入', 'error');
    window.showToast('已改用密碼備援放行');
    window.finalizeAdminAccess(pendingRole);
};
window.verifyFaceForAdminAccess = async function(options = {}) {
    if(window.faceAuthState.busy) return;
    const autoMode = !!(options && options.auto);
    const config = window.getCurrentFaceRecognitionConfig();
    const profiles = Array.isArray(config.profiles) ? config.profiles : [];
    if(!profiles.length) {
        if(!autoMode) window.showToast('目前還沒有任何已註冊人臉', 'error');
        return { passed: false, retryDelay: 1800 };
    }
    window.faceAuthState.busy = true;
    window.setFaceAuthStatus('face-verification-status', autoMode ? '正在自動辨識中...' : '正在進行多幀鏡頭驗證...', 'info');
    try {
        const attempts = [];
        const runtimeConfig = window.getFaceVerificationRuntimeConfig(autoMode);
        const attemptTotal = runtimeConfig.attemptTotal;
        const requiredMatches = window.getFaceVerificationRequiredMatches();
        const threshold = Number(config.threshold || 0.86);
        const softThreshold = Math.max(0.78, threshold - window.getFaceVerificationSoftThresholdOffset());
        const frameCount = runtimeConfig.frameCount;
        const frameGapMs = runtimeConfig.frameGapMs;
        const attemptDelayMs = runtimeConfig.attemptDelayMs;
        const retryDelayMs = runtimeConfig.retryDelayMs;
        const minimumQuality = runtimeConfig.minimumQuality;
        const strongMarginThreshold = window.getFaceVerificationStrongMargin(autoMode);
        const strongConsistencyThreshold = window.getFaceVerificationStrongConsistency(autoMode);
        const weakMarginThreshold = window.getFaceVerificationWeakMargin();
        const subjectContinuityThreshold = window.getFaceVerificationSubjectContinuityThreshold();
        const lockedProfileId = runtimeConfig.lockedProfileId;
        const currentObservations = [];
        let baseHistory = window.getRecentFaceVerificationHistory();
        let historyEvaluation = baseHistory.length
            ? window.evaluateFaceVerificationWindow(baseHistory, threshold, softThreshold, requiredMatches)
            : null;
        let evaluation = historyEvaluation;
        for(let attemptIndex = 0; attemptIndex < attemptTotal; attemptIndex += 1) {
            window.setFaceAuthStatus('face-verification-status', (autoMode ? '自動辨識中，正在進行第 ' : '正在進行第 ') + (attemptIndex + 1) + ' / ' + attemptTotal + ' 次比對...', 'info');
            const captured = await window.captureStableFaceDescriptorFromVideo('face-verification-video', {
                frameCount,
                gapMs: frameGapMs,
                minFrames: autoMode ? 1 : 2,
                allowEarlyStop: true,
                earlyStopMinFrames: runtimeConfig.earlyStopMinFrames,
                earlyStopQualityScore: runtimeConfig.earlyStopQualityScore,
                earlyStopSimilarity: runtimeConfig.earlyStopSimilarity,
                captureOptions: {
                    adaptiveScale: true,
                    maxScaleVariants: runtimeConfig.maxScaleVariants,
                    maxDimension: runtimeConfig.captureMaxDimension
                }
            });
            const effectiveMinimumQuality = window.getAdjustedFaceQualityThreshold(minimumQuality, captured, autoMode);
            const bestFrameQualityScore = Number(captured.bestFrameQualityScore || captured.qualityScore || 0);
            const qualityAccepted = Number(captured.qualityScore || 0) >= effectiveMinimumQuality
                || bestFrameQualityScore >= (effectiveMinimumQuality + 0.04);
            const subjectChanged = window.hasFaceVerificationSubjectChanged(captured, Math.max(0.36, effectiveMinimumQuality - 0.02));
            if(subjectChanged) {
                window.clearFaceVerificationHistory();
                window.clearFaceTrackingState();
                baseHistory = [];
                historyEvaluation = null;
                currentObservations.length = 0;
                attempts.length = 0;
                if(autoMode) {
                    window.setFaceAuthStatus('face-verification-status', '偵測到新的人臉，正在重新鎖定辨識...', 'info', { visualState: 'scanning' });
                }
            }
            if(!qualityAccepted) {
                attempts.push({
                    matched: false,
                    strong: false,
                    weak: false,
                    reason: captured.bestFrameQualityMessage || captured.qualityMessage || '畫面品質不足',
                    qualityScore: captured.qualityScore || 0
                });
            } else {
                const matchResult = window.findBestFaceProfileMatch(captured, profiles);
                const bestMatch = matchResult.best;
                const runnerUp = matchResult.runnerUp;
                const margin = Number(matchResult.margin || 0);
                const ambiguous = !!(runnerUp && margin < 0.009 && bestMatch && bestMatch.score < threshold + 0.028);
                const subjectContinuity = window.getFaceVerificationSubjectContinuity(captured);
                const subjectStable = !subjectContinuity || subjectContinuity >= subjectContinuityThreshold;
                const strongMatch = !!(
                    bestMatch
                    && bestMatch.score >= threshold
                    && margin >= strongMarginThreshold
                    && Number(bestMatch.consistency || 0) >= strongConsistencyThreshold
                    && subjectStable
                    && !ambiguous
                );
                const weakMatch = !!(
                    bestMatch
                    && bestMatch.score >= softThreshold
                    && margin >= weakMarginThreshold
                    && Number(bestMatch.consistency || 0) >= Math.max(0.58, strongConsistencyThreshold - 0.12)
                );
                if(strongMatch && bestMatch && bestMatch.profile && bestMatch.profile.id) {
                    window.rememberFaceVerificationStrongMatch(bestMatch.profile.id, bestMatch.score);
                }
                attempts.push({
                    matched: strongMatch,
                    strong: strongMatch,
                    weak: weakMatch,
                    profile: bestMatch ? bestMatch.profile : null,
                    score: bestMatch ? bestMatch.score : 0,
                    best: bestMatch ? bestMatch.best : 0,
                    averageTop: bestMatch ? bestMatch.averageTop : 0,
                    consistency: bestMatch ? bestMatch.consistency : 0,
                    margin,
                    subjectContinuity,
                    subjectStable,
                    qualityScore: captured.qualityScore || 0,
                    reason: ambiguous ? '和其他已註冊人臉太接近，請正對鏡頭再試一次' : (bestMatch ? '' : '沒有找到可比對的人臉')
                });
                if(bestMatch && bestMatch.profile && bestMatch.profile.id) {
                    currentObservations.push({
                        at: Date.now(),
                        profile: bestMatch.profile,
                        score: Number(bestMatch.score) || 0,
                        margin,
                        qualityScore: Number(captured.qualityScore) || 0,
                        consistency: Number(bestMatch.consistency) || 0,
                        subjectContinuity: Number(subjectContinuity) || 0,
                        subjectStable,
                        strong: strongMatch,
                        weak: weakMatch
                    });
                }
            }
            if(qualityAccepted) {
                const latestObservedProfile = currentObservations.length
                    ? (currentObservations[currentObservations.length - 1].profile && currentObservations[currentObservations.length - 1].profile.id)
                    : '';
                window.rememberFaceVerificationSubject(captured, latestObservedProfile);
            }
            const currentEvaluation = currentObservations.length
                ? window.evaluateFaceVerificationWindow(currentObservations, threshold, softThreshold, requiredMatches)
                : null;
            evaluation = window.evaluateFaceVerificationWindow(
                baseHistory.concat(currentObservations),
                threshold,
                softThreshold,
                requiredMatches
            );
            if(baseHistory.length && currentEvaluation && window.shouldResetFaceVerificationHistory(historyEvaluation, currentEvaluation, threshold)) {
                window.clearFaceVerificationHistory();
                window.clearFaceTrackingState();
                baseHistory = [];
                historyEvaluation = null;
                evaluation = currentEvaluation;
                if(autoMode) {
                    window.setFaceAuthStatus('face-verification-status', '已偵測到新的臉部，正在快速重新辨識...', 'info', { visualState: 'scanning' });
                }
            }
            if(currentEvaluation && window.hasFaceVerificationImmediatePass(currentObservations, threshold)) {
                evaluation = {
                    ...currentEvaluation,
                    passed: true,
                    quickPassed: true
                };
                break;
            }
            if(currentEvaluation && window.hasFaceVerificationLockedProfileFastPass(currentObservations, lockedProfileId, threshold, autoMode)) {
                evaluation = {
                    ...currentEvaluation,
                    passed: true,
                    quickPassed: true
                };
                break;
            }
            if(currentEvaluation && window.hasFaceVerificationStableFastPass(currentObservations, threshold, autoMode)) {
                evaluation = {
                    ...currentEvaluation,
                    passed: true,
                    quickPassed: true
                };
                break;
            }
            if(evaluation.quickPassed) break;
            if(attemptIndex < attemptTotal - 1) await window.sleep(attemptDelayMs);
        }
        const verificationWindow = baseHistory.concat(currentObservations);
        evaluation = evaluation || window.evaluateFaceVerificationWindow(verificationWindow, threshold, softThreshold, requiredMatches);
        const bestMatch = evaluation.bestMatch;
        const bestAverageScore = evaluation.bestAverageScore;
        const bestAverageMargin = evaluation.bestAverageMargin;
        const bestStrongCount = evaluation.bestStrongCount;
        const bestWeakCount = evaluation.bestWeakCount;
        const passed = evaluation.passed || evaluation.quickPassed;
        if(!passed) {
            window.appendFaceVerificationHistory(currentObservations);
            const goodFrames = attempts.filter(item => item.profile && item.profile.id && item.weak).length;
            const qualityFailures = attempts.filter(item => !item.matched && item.reason).map(item => item.reason);
            if($('face-verification-match')) {
                $('face-verification-match').classList.remove('hidden');
                if(bestMatch && bestWeakCount > 0) {
                    $('face-verification-match').innerHTML = '<strong>' + (autoMode ? '持續追蹤中' : '尚未通過') + '</strong>目前最接近的是「' + window.escapeHtml(bestMatch.profile.name) + '」，最近 ' + verificationWindow.length + ' 次觀測中已有 ' + bestWeakCount + ' 次接近成功。' + window.escapeHtml(qualityFailures[0] || '請維持正面 1 到 2 秒，系統會繼續追蹤。');
                } else {
                    $('face-verification-match').innerHTML = '<strong>' + (autoMode ? '尚未辨識完成' : '驗證未通過') + '</strong>' + attemptTotal + ' 次取樣中只有 ' + goodFrames + ' 次接近成功。' + window.escapeHtml(qualityFailures[0] || '請調整角度、光線後再試一次。');
                }
            }
            window.setFaceAuthStatus('face-verification-status', autoMode ? '尚未通過，系統會延續剛才的追蹤結果自動再次比對...' : '比對未通過，請正對鏡頭後重新驗證', autoMode ? 'warning' : 'error');
            return { passed: false, retryDelay: retryDelayMs };
        }
        window.clearFaceVerificationHistory();
        const nowIso = new Date().toISOString();
        const prevConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
        window.deviceAccessConfig = window.normalizeDeviceAccessConfig({
            ...prevConfig,
            faceRecognition: {
                ...(prevConfig.faceRecognition || {}),
                profiles: (prevConfig.faceRecognition && prevConfig.faceRecognition.profiles || []).map(profile => (
                    profile.id === bestMatch.profile.id
                        ? { ...profile, lastVerifiedAt: nowIso }
                        : profile
                ))
            }
        });
        window.persistDeviceAccessConfigLocal();
        if($('face-verification-match')) {
            $('face-verification-match').classList.remove('hidden');
            $('face-verification-match').innerHTML = '<strong>' + (autoMode ? '自動辨識成功' : '比對成功') + '</strong>已確認為「' + window.escapeHtml(bestMatch.profile.name) + '」，最近 ' + verificationWindow.length + ' 次觀測中有 ' + bestWeakCount + ' 次穩定命中，平均相似度 ' + Math.round(bestAverageScore * 100) + '%。';
        }
        window.setFaceAuthStatus('face-verification-status', '鏡頭驗證成功，正在放行後台...', 'success');
        const approvedRole = window.faceAuthState.pendingRole;
        setTimeout(() => {
            window.finalizeAdminAccess(approvedRole);
        }, 240);
        return { passed: true, retryDelay: 0 };
    } catch(error) {
        window.setFaceAuthStatus('face-verification-status', error && error.message ? error.message : '驗證失敗，請再試一次', autoMode ? 'warning' : 'error');
        return { passed: false, retryDelay: window.getFaceVerificationRetryDelayMs(autoMode) };
    } finally {
        window.faceAuthState.busy = false;
    }
};
window.handleAdminEntryAfterPassword = function(role) {
    let config = { enabled: false, profiles: [], allowPasswordFallback: true };
    try {
        config = typeof window.getCurrentFaceRecognitionConfig === 'function'
            ? (window.getCurrentFaceRecognitionConfig() || config)
            : ((window.deviceAccessConfig && window.deviceAccessConfig.faceRecognition) || config);
    } catch(error) {
        console.warn('Face recognition config bootstrap failed:', error);
    }
    window.safeHideModalElement('password-modal');
    if(config.enabled && Array.isArray(config.profiles) && config.profiles.length && typeof window.openFaceVerificationModal === 'function') {
        Promise.resolve(window.openFaceVerificationModal(role)).catch(error => {
            console.warn('Face verification modal bootstrap failed:', error);
            window.finalizeAdminAccess(role);
        });
        return;
    }
    if(config.enabled && !(config.profiles || []).length && typeof window.showToast === 'function') {
        window.showToast('尚未註冊管理員人臉，先以密碼備援放行', 'error');
    }
    window.finalizeAdminAccess(role);
};
window.openDeviceAccessModal = function() {
    const deviceInfo = window.getCurrentDeviceDescriptor();
    if($('device-access-current-device')) {
        $('device-access-current-device').innerHTML =
            '<div class="font-black text-slate-800">' + window.escapeHtml(deviceInfo.name) + '</div>' +
            '<div class="mt-1 text-xs font-medium text-slate-500">解析度：' + window.escapeHtml(deviceInfo.screen) + ' ｜ 裝置代碼：' + window.escapeHtml(deviceInfo.id.slice(0, 12)) + '...</div>';
    }
    if($('device-access-password')) $('device-access-password').value = '';
    show('device-access-modal');
    if(window.lucide) window.lucide.createIcons();
    setTimeout(() => { if($('device-access-password')) $('device-access-password').focus(); }, 60);
};
window.closeDeviceAccessModal = function(force = false) {
    if(!force) {
        const config = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
        if(config.enabled && !window.isCurrentDeviceTrusted() && !window.isDeviceAccessSessionUnlocked()) return;
    }
    hide('device-access-modal');
};
window.enforceDeviceAccessGate = function(options = {}) {
    const bypass = !!(options && options.bypass);
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    window.persistDeviceAccessConfigLocal();
    if(bypass || !window.deviceAccessConfig.enabled || window.isCurrentDeviceTrusted() || window.isDeviceAccessSessionUnlocked()) {
        window.closeDeviceAccessModal(true);
        return Promise.resolve(true);
    }
    window.openDeviceAccessModal();
    return new Promise(resolve => {
        window.deviceAccessGateResolver = resolve;
    });
};
window.submitDeviceAccessPassword = function() {
    const config = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const expectedPassword = String(config.password || '').trim() || window.superAdminPassword;
    const inputPassword = $('device-access-password') ? $('device-access-password').value.trim() : '';
    if(!expectedPassword) return window.showToast('尚未設定裝置進站密碼', 'error');
    if(inputPassword !== expectedPassword) return window.showToast('裝置驗證密碼錯誤', 'error');
    window.markDeviceAccessSessionUnlocked();
    window.closeDeviceAccessModal(true);
    window.showToast('裝置驗證通過');
    const resolver = window.deviceAccessGateResolver;
    window.deviceAccessGateResolver = null;
    if(typeof resolver === 'function') resolver(true);
};
window.renderDeviceAccessAdminPanel = function() {
    const panel = $('device-access-admin-panel');
    if(!panel) return;
    const canManage = window.currentAdminRole === 'super' && !window.isExhibitionAdminRouteMode();
    if(!canManage) {
        panel.innerHTML = '';
        return;
    }
    const config = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const faceConfig = window.normalizeFaceRecognitionConfig(config.faceRecognition);
    const currentDevice = window.getCurrentDeviceDescriptor();
    const trustedCurrent = window.getCurrentTrustedDeviceEntry();
    const trustedList = [...(config.trustedDevices || [])].sort((a, b) => String(b.approvedAt || '').localeCompare(String(a.approvedAt || '')));
    const faceProfiles = [...(faceConfig.profiles || [])].sort((a, b) => String(b.updatedAt || b.registeredAt || '').localeCompare(String(a.updatedAt || a.registeredAt || '')));
    const faceProfilesHtml = faceProfiles.length
        ? faceProfiles.map(profile => (
            '<div class="face-profile-card">' +
                '<div class="face-profile-head">' +
                    '<div class="face-profile-preview">' +
                        (profile.preview
                            ? '<img src="' + profile.preview + '" alt="' + window.escapeHtml(profile.name) + '">'
                            : window.escapeHtml(window.formatFaceProfileInitials(profile.name))) +
                    '</div>' +
                    '<div class="face-profile-meta">' +
                        '<div class="face-profile-name">' + window.escapeHtml(profile.name) + '</div>' +
                        '<div class="face-profile-copy">更新時間：' + window.escapeHtml(window.formatDeviceAccessTime(profile.updatedAt || profile.registeredAt)) + '</div>' +
                        '<div class="face-profile-copy">記憶模組：' + ((Array.isArray(profile.memoryDescriptors) && profile.memoryDescriptors.length) ? profile.memoryDescriptors.length : 1) + ' 組 / 樣本 ' + (profile.sampleCount || (Array.isArray(profile.sampleDescriptors) ? profile.sampleDescriptors.length : 0) || 1) + ' 張</div>' +
                    '</div>' +
                '</div>' +
                '<div class="face-profile-log">最近驗證：' + window.escapeHtml(window.formatDeviceAccessTime(profile.lastVerifiedAt)) + '</div>' +
                '<div class="face-profile-actions">' +
                    '<button type="button" onclick="window.openFaceRegistrationModal(\'' + window.escapeHtml(profile.id) + '\')" class="btn btn-g px-3 py-2 text-xs shadow-none"><i data-lucide="refresh-cw" class="w-4 h-4"></i> 重新註冊</button>' +
                    '<button type="button" onclick="window.removeFaceProfile(\'' + window.escapeHtml(profile.id) + '\')" class="btn btn-r px-3 py-2 text-xs shadow-none"><i data-lucide="trash-2" class="w-4 h-4"></i> 移除</button>' +
                '</div>' +
            '</div>'
        )).join('')
        : '<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">目前還沒有任何註冊人臉。請先按上方「註冊人臉」，再開啟登入鏡頭驗證。</div>';
    panel.innerHTML =
        '<div class="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] backdrop-blur">' +
        '<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">' +
            '<div>' +
                '<h4 class="text-lg font-black text-slate-900">受信任裝置與後台臉部識別</h4>' +
                '<p class="mt-2 text-sm font-medium leading-6 text-slate-500">同一份門禁設定會一起管理首頁的裝置白名單，以及管理員登入後台時的鏡頭驗證。</p>' +
            '</div>' +
            '<div class="flex flex-wrap gap-2">' +
                '<button type="button" onclick="window.approveCurrentDevice()" class="btn btn-b px-4 py-2.5 text-xs shadow-sm"><i data-lucide="badge-check" class="w-4 h-4"></i> 核准目前裝置</button>' +
                '<button type="button" onclick="window.openFaceRegistrationModal()" class="btn btn-g px-4 py-2.5 text-xs"><i data-lucide="camera" class="w-4 h-4"></i> 註冊人臉</button>' +
                '<button type="button" onclick="window.saveDeviceAccessSettings()" class="btn btn-g px-4 py-2.5 text-xs"><i data-lucide="save" class="w-4 h-4"></i> 儲存門禁設定</button>' +
            '</div>' +
        '</div>' +
        '<div class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">' +
            '<div class="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">' +
                '<div class="flex items-start justify-between gap-3">' +
                    '<div>' +
                        '<div class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">目前裝置</div>' +
                        '<div class="mt-2 text-base font-black text-slate-900">' + window.escapeHtml(currentDevice.name) + '</div>' +
                        '<div class="mt-2 text-sm font-medium leading-6 text-slate-500">瀏覽器：' + window.escapeHtml(currentDevice.browser) + ' ｜ 解析度：' + window.escapeHtml(currentDevice.screen) + '</div>' +
                        '<div class="mt-1 text-xs font-medium text-slate-400">裝置代碼：' + window.escapeHtml(currentDevice.id) + '</div>' +
                    '</div>' +
                    '<span class="rounded-full px-3 py-1 text-xs font-black ' + (trustedCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') + '">' + (trustedCurrent ? '已受信任' : '尚未受信任') + '</span>' +
                '</div>' +
                '<div class="mt-4 grid gap-3 md:grid-cols-2">' +
                    '<div class="rounded-2xl border border-white bg-white px-4 py-3"><div class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">白名單狀態</div><div class="mt-2 text-sm font-bold text-slate-700">' + (trustedCurrent ? '此裝置已由管理員認可' : '此裝置目前仍需陌生裝置密碼') + '</div></div>' +
                    '<div class="rounded-2xl border border-white bg-white px-4 py-3"><div class="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">最近放行</div><div class="mt-2 text-sm font-bold text-slate-700">' + window.escapeHtml(window.formatDeviceAccessTime(trustedCurrent ? trustedCurrent.lastUnlockAt : '')) + '</div></div>' +
                '</div>' +
            '</div>' +
            '<div class="rounded-[1.35rem] border border-slate-200 bg-white p-4">' +
                '<label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">' +
                    '<div>' +
                        '<div class="text-sm font-black text-slate-900">啟用陌生裝置進站驗證</div>' +
                        '<div class="mt-1 text-xs font-medium text-slate-500">開啟後，未列入白名單的裝置進首頁就會先要求輸入密碼。</div>' +
                    '</div>' +
                    '<input type="checkbox" id="device-access-enabled-toggle" class="h-5 w-5 rounded border-slate-300 text-blue-600" ' + (config.enabled ? 'checked' : '') + '>' +
                '</label>' +
                '<div class="mt-4">' +
                    '<label class="lbl text-slate-700">陌生裝置進站密碼</label>' +
                    '<input type="password" id="device-access-password-input-admin" class="inp font-mono" placeholder="' + window.escapeHtml(config.password ? '已設定，留空代表沿用目前密碼' : '請輸入新的進站密碼') + '">' +
                '</div>' +
                '<p class="mt-3 text-xs font-medium leading-6 text-slate-400">提醒：這是站台進入密碼，不等同後台管理員密碼。若沒有雲端同步網址，裝置白名單只會存在本機瀏覽器。</p>' +
            '</div>' +
        '</div>' +
        '<div class="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4">' +
            '<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">' +
                '<div>' +
                    '<div class="text-sm font-black text-slate-900">後台臉部識別管理</div>' +
                    '<p class="mt-2 text-sm font-medium leading-6 text-slate-500">先在這裡註冊管理員臉部，再決定是否在登入後啟用鏡頭驗證。密碼仍會保留成備援放行方式。</p>' +
                '</div>' +
                '<div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">' +
                    '目前已註冊 <span class="text-blue-600">' + faceProfiles.length + '</span> 位管理員' +
                '</div>' +
            '</div>' +
            '<div class="mt-4 grid gap-3 md:grid-cols-2">' +
                '<label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">' +
                    '<div>' +
                        '<div class="text-sm font-black text-slate-900">啟用登入後鏡頭驗證</div>' +
                        '<div class="mt-1 text-xs font-medium text-slate-500">管理員密碼正確後，再打開鏡頭確認是否為已註冊臉部。</div>' +
                    '</div>' +
                    '<input type="checkbox" id="face-recognition-enabled-toggle" class="h-5 w-5 rounded border-slate-300 text-blue-600" ' + (faceConfig.enabled ? 'checked' : '') + '>' +
                '</label>' +
                '<label class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">' +
                    '<div>' +
                        '<div class="text-sm font-black text-slate-900">允許密碼備援放行</div>' +
                        '<div class="mt-1 text-xs font-medium text-slate-500">若鏡頭無法使用或臉部比對失敗，可直接改回原本密碼放行。</div>' +
                    '</div>' +
                    '<input type="checkbox" id="face-recognition-fallback-toggle" class="h-5 w-5 rounded border-slate-300 text-blue-600" ' + (faceConfig.allowPasswordFallback ? 'checked' : '') + '>' +
                '</label>' +
            '</div>' +
            '<div class="mt-5 face-profile-grid">' + faceProfilesHtml + '</div>' +
        '</div>' +
        '<div class="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4">' +
            '<div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">' +
                '<div class="text-sm font-black text-slate-900">已核准裝置清單</div>' +
                '<div class="text-xs font-bold text-slate-400">共 ' + trustedList.length + ' 台</div>' +
            '</div>' +
            '<div class="mt-4 grid gap-3">' +
                (trustedList.length
                    ? trustedList.map(entry => (
                        '<div class="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">' +
                            '<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">' +
                                '<div class="min-w-0">' +
                                    '<div class="flex flex-wrap items-center gap-2"><div class="text-sm font-black text-slate-800">' + window.escapeHtml(entry.name || '未命名裝置') + '</div>' + (entry.id === currentDevice.id ? '<span class="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-700">目前這台</span>' : '') + '</div>' +
                                    '<div class="mt-2 text-xs font-medium leading-6 text-slate-500">平台：' + window.escapeHtml(entry.platform || '未記錄') + ' ｜ 瀏覽器：' + window.escapeHtml(entry.browser || '未記錄') + ' ｜ 解析度：' + window.escapeHtml(entry.screen || '未記錄') + '</div>' +
                                    '<div class="mt-1 text-xs font-medium leading-6 text-slate-400">核准時間：' + window.escapeHtml(window.formatDeviceAccessTime(entry.approvedAt)) + ' ｜ 最近放行：' + window.escapeHtml(window.formatDeviceAccessTime(entry.lastUnlockAt)) + '</div>' +
                                '</div>' +
                                '<button type="button" onclick="window.removeTrustedDevice(\'' + window.escapeHtml(entry.id) + '\')" class="btn btn-r px-3 py-2 text-xs shadow-none"><i data-lucide="trash-2" class="w-4 h-4"></i> 移除</button>' +
                            '</div>' +
                        '</div>'
                    )).join('')
                    : '<div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">目前還沒有任何受信任裝置，請先在欲常用的機器上按「核准目前裝置」。</div>'
                ) +
            '</div>' +
        '</div>' +
        '</div>';
    if(window.lucide) window.lucide.createIcons();
};
window.saveDeviceAccessSettings = async function() {
    if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以設定裝置門禁', 'error');
    const prevConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const enabled = !!($('device-access-enabled-toggle') && $('device-access-enabled-toggle').checked);
    const faceEnabled = !!($('face-recognition-enabled-toggle') && $('face-recognition-enabled-toggle').checked);
    const allowPasswordFallback = !!($('face-recognition-fallback-toggle') && $('face-recognition-fallback-toggle').checked);
    const passwordInput = $('device-access-password-input-admin') ? $('device-access-password-input-admin').value.trim() : '';
    const nextConfig = {
        ...prevConfig,
        enabled,
        faceRecognition: {
            ...(prevConfig.faceRecognition || {}),
            enabled: faceEnabled,
            allowPasswordFallback,
            profiles: (prevConfig.faceRecognition && prevConfig.faceRecognition.profiles || [])
        }
    };
    if(passwordInput) nextConfig.password = passwordInput;
    if(enabled && !String(nextConfig.password || '').trim()) return window.showToast('請先設定陌生裝置進站密碼', 'error');
    if(faceEnabled && !(nextConfig.faceRecognition.profiles || []).length) return window.showToast('請先註冊至少 1 位管理員人臉', 'error');
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig(nextConfig);
    window.persistDeviceAccessConfigLocal();
    window.showToast('同步中...', 'success');
    if(await window.saveDeviceAccessConfigToCloud()) {
        if($('device-access-password-input-admin')) $('device-access-password-input-admin').value = '';
        window.renderDeviceAccessAdminPanel();
        window.showToast((enabled || faceEnabled) ? '裝置與臉部門禁設定已更新' : '已關閉裝置與臉部門禁');
    } else {
        window.deviceAccessConfig = prevConfig;
        window.persistDeviceAccessConfigLocal();
        window.renderDeviceAccessAdminPanel();
        window.showToast('裝置與臉部門禁儲存失敗' + (window.lastSettingsSaveError ? '：' + window.lastSettingsSaveError : ''), 'error');
    }
};
window.approveCurrentDevice = async function() {
    if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以核准裝置', 'error');
    const prevConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const currentDevice = window.getCurrentDeviceDescriptor();
    const nowIso = new Date().toISOString();
    const trustedDevices = [...(prevConfig.trustedDevices || [])];
    const existingIndex = trustedDevices.findIndex(item => item.id === currentDevice.id);
    const approvedEntry = {
        ...currentDevice,
        approvedAt: existingIndex >= 0 ? (trustedDevices[existingIndex].approvedAt || nowIso) : nowIso,
        approvedBy: '後台管理員',
        lastUnlockAt: nowIso
    };
    if(existingIndex >= 0) trustedDevices[existingIndex] = approvedEntry;
    else trustedDevices.unshift(approvedEntry);
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig({ ...prevConfig, trustedDevices });
    window.persistDeviceAccessConfigLocal();
    window.markDeviceAccessSessionUnlocked();
    window.showToast('同步中...', 'success');
    if(await window.saveDeviceAccessConfigToCloud()) {
        window.renderDeviceAccessAdminPanel();
        window.showToast('目前裝置已加入受信任清單');
    } else {
        window.deviceAccessConfig = prevConfig;
        window.persistDeviceAccessConfigLocal();
        window.renderDeviceAccessAdminPanel();
        window.showToast('裝置核准失敗' + (window.lastSettingsSaveError ? '：' + window.lastSettingsSaveError : ''), 'error');
    }
};
window.removeTrustedDevice = function(deviceId) {
    if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以移除裝置', 'error');
    const currentConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
    const target = (currentConfig.trustedDevices || []).find(item => item.id === String(deviceId || '').trim());
    if(!target) return window.showToast('找不到該裝置', 'error');
    window.openConfirmModal('移除受信任裝置', '確定要移除「' + (target.name || '這台裝置') + '」嗎？移除後，下次進站會重新要求輸入密碼。', async () => {
        const prevConfig = window.normalizeDeviceAccessConfig(window.deviceAccessConfig);
        window.deviceAccessConfig = window.normalizeDeviceAccessConfig({
            ...prevConfig,
            trustedDevices: (prevConfig.trustedDevices || []).filter(item => item.id !== target.id)
        });
        window.persistDeviceAccessConfigLocal();
        window.showToast('同步中...', 'success');
        if(await window.saveDeviceAccessConfigToCloud()) {
            window.renderDeviceAccessAdminPanel();
            window.showToast('裝置已移除');
        } else {
            window.deviceAccessConfig = prevConfig;
            window.persistDeviceAccessConfigLocal();
            window.renderDeviceAccessAdminPanel();
            window.showToast('移除失敗' + (window.lastSettingsSaveError ? '：' + window.lastSettingsSaveError : ''), 'error');
        }
    });
};
