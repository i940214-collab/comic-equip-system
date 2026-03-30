// Theme, security, and device access module.

// --- 核心變數初始化 ---
window.mockDatabase = window.mockDatabase || [];
window.windowData = window.windowData || null;
window.deletedIds = window.deletedIds || new Set();
window.currentAdminRole = window.currentAdminRole || 'none';
window.superAdminPassword = localStorage.getItem('adminPassword') || 'd101';
window.exhibitionAdminPassword = window.exhibitionAdminPassword || 'y103';
window.lastApproveAdminName = localStorage.getItem('lastApproveAdminName') || '';
window.themeStorageKey = window.themeStorageKey || 'uiNightMode';
window.deviceAccessStorageKeys = window.deviceAccessStorageKeys || {
    config: 'deviceAccessConfig',
    currentId: 'trustedDeviceId',
    session: 'deviceAccessSessionUnlocked'
};
window.deviceAccessConfig = window.deviceAccessConfig || (() => {
    try {
        return JSON.parse(localStorage.getItem(window.deviceAccessStorageKeys.config) || '{"enabled":false,"password":"","trustedDevices":[]}');
    } catch(error) {
        return { enabled: false, password: '', trustedDevices: [] };
    }
})();
window.deviceAccessGateResolver = window.deviceAccessGateResolver || null;

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
window.borrowScannerState = window.borrowScannerState || { buffer: '', lastInputAt: 0, commitTimer: null };
window.borrowScannerCommitDelayMs = window.borrowScannerCommitDelayMs || 120;
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
    lastUpdatedLabel: ''
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
window.teacherList = window.teacherList || [{ empId: 'tf0173', name: '黃建芳', phone: '0928525591', email: 'tf0173@gm.tut.edu.tw', position: '專任', identity: '主任' }, { empId: 't40124', name: '徐碧娟', phone: '0936491480', email: 't40124@gm.tut.edu.tw', position: '兼任', identity: '一般教師' }, { empId: 't40147', name: '俞家燕', phone: '0970053936', email: 't40147@gm.tut.edu.tw', position: '專任', identity: '一般教師' }, { empId: 't40122', name: '陸承石', phone: '0912553056', email: 't40122@gm.tut.edu.tw', position: '專任', identity: '副主任' }, { empId: 's00397', name: '鄭富耀', phone: '0902308837', email: 's00397@gm.tut.edu.tw', position: '其他', identity: '系辦助理' }, { empId: 's00401', name: '吳羽婕', phone: '0902138659', email: 's00401@gm.tut.edu.tw', position: '其他', identity: '系辦助理' }, { empId: 'd12040155', name: '黃振皓', phone: '0928471596', email: 'd12040155@gm.tut.edu.tw', position: '其他', identity: '維修員' }];
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
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} 更新`;
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
    const rangeInlineNode = $('hero-weather-range-inline');
    const rainNode = $('hero-weather-rain');
    const rainInlineNode = $('hero-weather-rain-inline');
    const windNode = $('hero-weather-wind');
    const updatedNode = $('hero-weather-updated');
    const iconNode = $('hero-weather-icon');
    const statusNode = $('hero-weather-status');
    if(conditionNode) conditionNode.textContent = '讀取今日天氣中...';
    if(currentNode) currentNode.textContent = '--';
    if(rangeNode) rangeNode.textContent = '--';
    if(rangeInlineNode) rangeInlineNode.textContent = '--';
    if(rainNode) rainNode.textContent = '--';
    if(rainInlineNode) rainInlineNode.textContent = '--';
    if(windNode) windNode.textContent = '--';
    if(updatedNode) updatedNode.textContent = '同步中';
    if(statusNode) statusNode.textContent = '即時預報';
    if(iconNode) iconNode.innerHTML = '<i data-lucide="cloud-sun" class="h-5 w-5"></i>';
    if(window.lucide) window.lucide.createIcons();
};
window.renderHeroWeatherError = function(message = '今日天氣暫時無法載入') {
    const conditionNode = $('hero-weather-condition');
    const currentNode = $('hero-weather-current');
    const rangeNode = $('hero-weather-range');
    const rangeInlineNode = $('hero-weather-range-inline');
    const rainNode = $('hero-weather-rain');
    const rainInlineNode = $('hero-weather-rain-inline');
    const windNode = $('hero-weather-wind');
    const updatedNode = $('hero-weather-updated');
    const iconNode = $('hero-weather-icon');
    const statusNode = $('hero-weather-status');
    if(conditionNode) conditionNode.textContent = message;
    if(currentNode) currentNode.textContent = '--';
    if(rangeNode) rangeNode.textContent = '--';
    if(rangeInlineNode) rangeInlineNode.textContent = '--';
    if(rainNode) rainNode.textContent = '--';
    if(rainInlineNode) rainInlineNode.textContent = '--';
    if(windNode) windNode.textContent = '--';
    if(updatedNode) updatedNode.textContent = '稍後再試';
    if(statusNode) statusNode.textContent = '網路未連線';
    if(iconNode) iconNode.innerHTML = '<i data-lucide="cloud-off" class="h-5 w-5"></i>';
    if(window.lucide) window.lucide.createIcons();
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
    if($('hero-weather-range-inline')) $('hero-weather-range-inline').textContent = `${window.formatHeroWeatherTemp(payload.tempMax)} / ${window.formatHeroWeatherTemp(payload.tempMin)}`;
    if($('hero-weather-rain')) $('hero-weather-rain').textContent = Number.isFinite(Number(payload.rainChance)) ? `${Math.round(Number(payload.rainChance))}%` : '--';
    if($('hero-weather-rain-inline')) $('hero-weather-rain-inline').textContent = Number.isFinite(Number(payload.rainChance)) ? `${Math.round(Number(payload.rainChance))}%` : '--';
    if($('hero-weather-wind')) $('hero-weather-wind').textContent = window.formatHeroWeatherWind(payload.windMax);
    if($('hero-weather-updated')) $('hero-weather-updated').textContent = window.formatHeroWeatherTime(payload.updatedAt);
    if($('hero-weather-icon')) $('hero-weather-icon').innerHTML = `<i data-lucide="${meta.icon}" class="h-5 w-5"></i>`;
    window.heroWeatherState.lastDate = String(payload.date || '');
    window.heroWeatherState.lastUpdatedLabel = String(payload.updatedAt || '');
    if(window.lucide) window.lucide.createIcons();
};
window.loadHeroWeather = async function(options = {}) {
    const config = window.heroWeatherConfig || {};
    const today = typeof window.getLocalDateString === 'function'
        ? window.getLocalDateString()
        : new Date().toLocaleDateString('sv-SE', { timeZone: config.timezone || 'Asia/Taipei' });
    const cacheMinutes = Number(config.cacheMinutes || 30);
    const cached = window.readHeroWeatherCache();
    if(!options.force && cached && cached.date === today && cached.savedAt && (Date.now() - Number(cached.savedAt) < cacheMinutes * 60 * 1000) && cached.payload) {
        window.renderHeroWeather(cached.payload);
        return cached.payload;
    }
    if(window.heroWeatherState.loading) return null;
    window.heroWeatherState.loading = true;
    window.renderHeroWeatherLoading();
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
        window.renderHeroWeatherError();
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
window.getRetTime = i => i?.returningTime || i?.歸還時間 || '';
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
window.normalizeEquipmentRecord = function(record) {
    const source = record && typeof record === 'object' ? record : {};
    return {
        category: String(source.category || source['分類'] || '').trim(),
        name: String(source.name || source['名稱'] || '').trim(),
        propertyNo: String(source.propertyNo || source['財產編號'] || source['財編'] || '').trim(),
        location: String(source.location || source['存放地點'] || source['地點'] || '').trim()
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
window.normalizeDeviceAccessConfig = function(config) {
    const source = config && typeof config === 'object' ? config : {};
    return {
        enabled: !!source.enabled,
        password: String(source.password || '').trim(),
        trustedDevices: (Array.isArray(source.trustedDevices) ? source.trustedDevices : [])
            .map(window.normalizeTrustedDeviceEntry)
            .filter(item => item.id)
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
window.formatDeviceAccessTime = function(rawValue) {
    const raw = String(rawValue || '').trim();
    if(!raw) return '尚無紀錄';
    const parsed = new Date(raw);
    if(Number.isNaN(parsed.getTime())) return raw;
    return parsed.toLocaleString('zh-TW', { hour12: false });
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
    const currentDevice = window.getCurrentDeviceDescriptor();
    const trustedCurrent = window.getCurrentTrustedDeviceEntry();
    const trustedList = [...(config.trustedDevices || [])].sort((a, b) => String(b.approvedAt || '').localeCompare(String(a.approvedAt || '')));
    panel.innerHTML =
        '<div class="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] backdrop-blur">' +
        '<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">' +
            '<div>' +
                '<h4 class="text-lg font-black text-slate-900">受信任裝置控管</h4>' +
                '<p class="mt-2 text-sm font-medium leading-6 text-slate-500">開啟後，陌生裝置進站前需要輸入密碼；已加入白名單的裝置可直接進入。</p>' +
            '</div>' +
            '<div class="flex flex-wrap gap-2">' +
                '<button type="button" onclick="window.approveCurrentDevice()" class="btn btn-b px-4 py-2.5 text-xs shadow-sm"><i data-lucide="badge-check" class="w-4 h-4"></i> 核准目前裝置</button>' +
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
    const passwordInput = $('device-access-password-input-admin') ? $('device-access-password-input-admin').value.trim() : '';
    const nextConfig = {
        ...prevConfig,
        enabled
    };
    if(passwordInput) nextConfig.password = passwordInput;
    if(enabled && !String(nextConfig.password || '').trim()) return window.showToast('請先設定陌生裝置進站密碼', 'error');
    window.deviceAccessConfig = window.normalizeDeviceAccessConfig(nextConfig);
    window.persistDeviceAccessConfigLocal();
    window.showToast('同步中...', 'success');
    if(await window.saveSettingsToCloud()) {
        if($('device-access-password-input-admin')) $('device-access-password-input-admin').value = '';
        window.renderDeviceAccessAdminPanel();
        window.showToast(enabled ? '裝置門禁設定已更新' : '已關閉裝置門禁');
    } else {
        window.deviceAccessConfig = prevConfig;
        window.persistDeviceAccessConfigLocal();
        window.renderDeviceAccessAdminPanel();
        window.showToast('裝置門禁儲存失敗', 'error');
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
    if(await window.saveSettingsToCloud()) {
        window.renderDeviceAccessAdminPanel();
        window.showToast('目前裝置已加入受信任清單');
    } else {
        window.deviceAccessConfig = prevConfig;
        window.persistDeviceAccessConfigLocal();
        window.renderDeviceAccessAdminPanel();
        window.showToast('裝置核准失敗', 'error');
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
        if(await window.saveSettingsToCloud()) {
            window.renderDeviceAccessAdminPanel();
            window.showToast('裝置已移除');
        } else {
            window.deviceAccessConfig = prevConfig;
            window.persistDeviceAccessConfigLocal();
            window.renderDeviceAccessAdminPanel();
            window.showToast('移除失敗', 'error');
        }
    });
};
