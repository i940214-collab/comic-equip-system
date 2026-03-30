// Teacher schedule module.

    window.serializeTeacherSchedulesForCurriculum = function() {
        const grouped = new Map();
        (window.teacherSchedules || []).forEach(entry => {
            const scheduleKey = String(entry && entry.scheduleKey || '').trim();
            const day = Number(entry && entry.day);
            const periodId = String(entry && entry.periodId || '').trim();
            if(!scheduleKey || !day || !periodId) return;
            if(!grouped.has(scheduleKey)) grouped.set(scheduleKey, []);
            grouped.get(scheduleKey).push([
                day,
                periodId,
                String(entry && entry.courseName || '').trim(),
                String(entry && entry.location || '').trim()
            ]);
        });
        const teachers = Array.from(grouped.entries())
            .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'zh-Hant'))
            .map(([scheduleKey, items]) => [
                scheduleKey,
                items.sort((a, b) => {
                    if(Number(a[0]) !== Number(b[0])) return Number(a[0]) - Number(b[0]);
                    return window.getTeacherSchedulePeriodOrder(a[1]) - window.getTeacherSchedulePeriodOrder(b[1]);
                })
            ]);
        return JSON.stringify({ v: 1, f: 'curriculum-v1', t: teachers });
    };
    window.deserializeTeacherSchedulesFromCurriculum = function(rawValue) {
        const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        if(Array.isArray(parsed)) return parsed;
        if(!parsed || typeof parsed !== 'object') return null;
        if(parsed.f !== 'curriculum-v1' || !Array.isArray(parsed.t)) return null;
        const result = [];
        parsed.t.forEach(group => {
            if(!Array.isArray(group) || group.length < 2) return;
            const scheduleKey = String(group[0] || '').trim();
            const items = Array.isArray(group[1]) ? group[1] : [];
            if(!scheduleKey) return;
            items.forEach(item => {
                if(!Array.isArray(item) || item.length < 2) return;
                const day = Number(item[0]);
                const periodId = String(item[1] || '').trim();
                if(!day || !periodId) return;
                result.push({
                    scheduleKey,
                    day,
                    periodId,
                    courseName: String(item[2] || '').trim(),
                    location: String(item[3] || '').trim()
                });
            });
        });
        return result;
    };
    window.hasTeacherScheduleCloudPayload = function(settingData, parsedRows, eqRaw) {
        const settingsData = settingData && typeof settingData === 'object' ? settingData : {};
        const rows = parsedRows && typeof parsedRows === 'object' ? parsedRows : {};
        if(rows.curriculum != null && rows.curriculum !== '') return true;
        if(Object.keys(settingsData).some(key => /^teacherSchedules(?:__PART__\d+|_\d{3})$/i.test(key))) return true;
        if(Array.isArray(eqRaw) && eqRaw.some(entry => entry && (entry.name === 'TEACHER_SCHEDULES' || /^TEACHER_SCHEDULES__PART__\d+$/.test(String(entry.name || ''))))) return true;
        return ['equipment', 'teachers', 'keys', 'classes'].some(key => {
            const value = rows[key];
            return value && typeof value === 'object' && !Array.isArray(value) && typeof value.teacherSchedulePart === 'string';
        });
    };
    window.buildCloudSettingsRows = function() {
        const maxChars = Math.max(Number(window.cloudSettingsMaxCharsPerField) || 47000, 22000);
        const curriculumPayload = window.serializeTeacherSchedulesForCurriculum();
        if(curriculumPayload.length > maxChars) {
            throw new Error('curriculum 這一列的可存字數仍不足，請再擴充後端或改成獨立工作表。');
        }
        return {
            equipment: JSON.stringify({
                version: 5,
                items: Array.isArray(window.equipmentList) ? window.equipmentList : [],
                system: {
                    periods: Array.isArray(window.periodList) ? window.periodList : [],
                    roomSchedules: window.roomSchedules || {},
                    exhibitionAnnouncement: window.exhibitionAnnouncement || '',
                    exhibitionBlockedRanges: Array.isArray(window.exhibitionBlockedRanges) ? window.exhibitionBlockedRanges : [],
                    borrowRecordOverrides: window.normalizeBorrowRecordOverrides(window.borrowRecordOverrides),
                    deviceAccess: window.normalizeDeviceAccessConfig(window.deviceAccessConfig)
                }
            }),
            teachers: JSON.stringify({
                version: 4,
                list: Array.isArray(window.teacherList) ? window.teacherList : []
            }),
            keys: JSON.stringify({
                version: 4,
                list: Array.isArray(window.keyList) ? window.keyList : []
            }),
            classes: JSON.stringify({
                version: 5,
                list: Array.isArray(window.classList) ? window.classList : [],
                students: Array.isArray(window.studentList) ? window.studentList : []
            }),
            curriculum: curriculumPayload
        };
    };
    window.buildParsedCloudSettingsRows = function(settingData) {
        const source = settingData && typeof settingData === 'object' ? settingData : {};
        return {
            equipment: window.parseCloudSettingsField(source.equipment),
            equipmentSheet: window.parseCloudSettingsField(source.equipmentSheet),
            teachers: window.parseCloudSettingsField(source.teachers),
            keys: window.parseCloudSettingsField(source.keys),
            classes: window.parseCloudSettingsField(source.classes),
            curriculum: window.parseCloudSettingsField(source.curriculum)
        };
    };
    window.readTeacherScheduleSettingsFromCloudData = function(settingData, parsedRows, eqRaw) {
        const settingsData = settingData && typeof settingData === 'object' ? settingData : {};
        const rows = parsedRows && typeof parsedRows === 'object' ? parsedRows : {};
        try {
            const curriculumParsed = window.deserializeTeacherSchedulesFromCurriculum(rows.curriculum);
            if(Array.isArray(curriculumParsed)) return curriculumParsed;
        } catch(error) {}
        const extraPartKeys = Object.keys(settingsData)
            .filter(key => /^teacherSchedules(?:__PART__\d+|_\d{3})$/i.test(key))
            .sort((a, b) => a.localeCompare(b));
        if(extraPartKeys.length) {
            const joinedExtraParts = extraPartKeys.map(key => String(settingsData[key] || '')).join('');
            if(joinedExtraParts) {
                const parsedExtra = JSON.parse(joinedExtraParts);
                return Array.isArray(parsedExtra) ? parsedExtra : [];
            }
        }
        const wrappedParts = ['equipment', 'teachers', 'keys', 'classes']
            .map(key => rows[key])
            .filter(value => value && typeof value === 'object' && !Array.isArray(value) && typeof value.teacherSchedulePart === 'string')
            .map(value => value.teacherSchedulePart);
        if(wrappedParts.some(Boolean)) {
            const joinedWrappedParts = wrappedParts.join('');
            if(joinedWrappedParts) {
                const parsedWrapped = JSON.parse(joinedWrappedParts);
                return Array.isArray(parsedWrapped) ? parsedWrapped : [];
            }
        }
        return window.readTeacherScheduleSettingsFromEquipment(eqRaw);
    };
    window.extractTeacherApprovalNameFromStatus = function(statusText) {
        const match = String(statusText || '').match(/教師同意:\s*([^()]+)/);
        return match ? match[1].trim() : '';
    };
    window.isTeacherApprovalWaiting = function(item) {
        const st = window.getStatus(item);
        return window.isTeacherApprovalClassroomRequest(item) && (st === '待審核' || st === '待老師回覆');
    };
    window.isAdminApprovalWaiting = function(item) {
        const st = window.getStatus(item);
        return window.isTeacherApprovalClassroomRequest(item) && st.startsWith('待管理員審核');
    };
    window.isPendingReviewStatus = function(item) {
        const st = window.getStatus(item);
        return st === '待審核' || st === '待老師回覆' || st.startsWith('待管理員審核');
    };

    // --- 核心格式化 ---
    window.getLocalDateString = function() { 
        const d = new Date(); 
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); 
    };

    window.applyBorrowDefaultDates = function(force = false) {
        const today = window.getLocalDateString();
        const keyReturnInput = $('expectedReturnDate-key');
        if(keyReturnInput && (force || !keyReturnInput.value)) keyReturnInput.value = today;
    };

    window.showToast = function(msg, type='success') { 
        const t=$('toast'); if(!t) return; 
        t.innerText=msg; 
        t.style.backgroundColor=type==='success'?'#10b981':'#ef4444'; 
        t.classList.remove('translate-y-20', 'opacity-0'); 
        setTimeout(()=>t.classList.add('translate-y-20', 'opacity-0'), 3000); 
    };

    window.showLoadingOverlay = function(message = '資料同步中，請稍候一下。', title = '系統處理中') {
        const overlay = $('global-loading-overlay');
        if(!overlay) return;
        window.loadingOverlayDepth = (window.loadingOverlayDepth || 0) + 1;
        if($('global-loading-title')) $('global-loading-title').innerText = title;
        if($('global-loading-message')) $('global-loading-message').innerText = message;
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    };

    window.hideLoadingOverlay = function(force = false) {
        const overlay = $('global-loading-overlay');
        if(force) window.loadingOverlayDepth = 0;
        else window.loadingOverlayDepth = Math.max((window.loadingOverlayDepth || 0) - 1, 0);
        if(!overlay || window.loadingOverlayDepth > 0) return;
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    };

    window.maskPhone = function(p) { 
        return (!p || p.length <= 6) ? p : p.substring(0, 2) + "****" + p.substring(p.length - 4); 
    };

    window.normalizeTeacherEmpId = function(value) {
        return String(value || '')
            .trim()
            .replace(/\s+/g, '')
            .toLowerCase();
    };

    window.normalizeBorrowProfileCode = function(value) {
        return window.normalizeTeacherEmpId(value).replace(/[^a-z0-9_-]/g, '');
    };

    window.getStudentClassName = function(student) {
        return String(student && (student.className || student.class || student.department) || '').trim();
    };

    window.normalizeContactPhone = function(value) {
        const raw = String(value ?? '').trim();
        if(!raw) return '';
        const digits = raw.replace(/\D/g, '');
        if(/^9\d{8}$/.test(digits)) return `0${digits}`;
        if(/^09\d{8}$/.test(digits) && !raw.startsWith('0')) return digits;
        return raw;
    };

    window.normalizeStudentRecord = function(student) {
        const source = student && typeof student === 'object' ? student : {};
        return {
            name: String(source.name || '').trim(),
            studentId: String(source.studentId || source.id || '').trim(),
            className: window.getStudentClassName(source),
            phone: window.normalizeContactPhone(source.phone || ''),
            email: String(source.email || '').trim()
        };
    };

    window.findBorrowProfileByCode = function(code) {
        const normalized = window.normalizeBorrowProfileCode(code);
        if(!normalized) return null;
        const teacher = (window.teacherList || []).find(item => window.normalizeBorrowProfileCode(item && item.empId) === normalized);
        const student = (window.studentList || []).map(window.normalizeStudentRecord).find(item => window.normalizeBorrowProfileCode(item.studentId) === normalized);
        if(student) {
            return {
                kind: 'student',
                code: student.studentId,
                name: student.name,
                phone: student.phone,
                unit: student.className,
                email: student.email,
                raw: student
            };
        }
        if(teacher) {
            return {
                kind: 'teacher',
                code: String(teacher.empId || '').trim(),
                name: String(teacher.name || '').trim(),
                phone: String(teacher.phone || '').trim(),
                unit: String(teacher.department || '漫畫系').trim(),
                email: String(teacher.email || '').trim(),
                raw: teacher
            };
        }
        return null;
    };

    window.findBorrowProfileByName = function(name) {
        const normalizedName = String(name || '').trim();
        if(!normalizedName) return null;
        const teacher = (window.teacherList || []).find(item => String(item && item.name || '').trim() === normalizedName);
        if(teacher) {
            return {
                kind: 'teacher',
                code: String(teacher.empId || '').trim(),
                name: String(teacher.name || '').trim(),
                phone: String(teacher.phone || '').trim(),
                unit: String(teacher.department || '漫畫系').trim(),
                email: String(teacher.email || '').trim(),
                raw: teacher
            };
        }
        const student = (window.studentList || []).map(window.normalizeStudentRecord).find(item => item.name === normalizedName);
        if(student) {
            return {
                kind: 'student',
                code: student.studentId,
                name: student.name,
                phone: student.phone,
                unit: student.className,
                email: student.email,
                raw: student
            };
        }
        return null;
    };

    window.setBorrowResponsibleTeacherMode = function(type, isTeacherBorrower) {
        if(type !== 'classroom' && type !== 'exhibition') return;
        const container = $(`resp-teacher-container-${type}`) || $('resp-teacher-container');
        const input = $(`responsible-teacher-${type}`);
        if(!container || !input) return;
        if(isTeacherBorrower) {
            input.required = false;
            input.value = '';
            hide(container.id);
        } else {
            input.required = true;
            show(container.id);
        }
    };

    window.applyBorrowProfileToForm = function(type, profile) {
        if(!profile) return false;
        const codeInput = $(`borrower-code-${type}`);
        const nameInput = $(`borrower-${type}`);
        const phoneInput = $(`borrower-phone-${type}`);
        let classInput = $(`borrower-class-${type}`);
        const targetClass = profile.kind === 'teacher' ? '漫畫系' : String(profile.unit || '').trim();
        if(codeInput && profile.code) codeInput.value = profile.code;
        if(nameInput) {
            nameInput.value = profile.name || '';
            nameInput.dataset.borrowerKind = profile.kind || '';
        }
        if(phoneInput) phoneInput.value = profile.phone || '';
        if(classInput && targetClass) {
            if(profile.kind !== 'teacher') window.ensureClassEntry(targetClass);
            classInput.dataset.pendingValue = targetClass;
            window.initClassSelect();
            classInput = $(`borrower-class-${type}`);
            classInput.value = targetClass;
            classInput.dataset.pendingValue = targetClass;
        }
        window.setBorrowResponsibleTeacherMode(type, profile.kind === 'teacher');
        return true;
    };

    window.formatBorrowerCell = function(bor, id, full=false) {
        let n=bor||'', p='', rt='', cl=''; 
        const rM=n.match(/ \((?:負責|負責老師):\s*(.*?)\)/); if(rM){rt=rM[1];n=n.replace(rM[0],'');} 
        const pM=n.match(/ \((.*?)\)$/); if(pM){p=pM[1];n=n.replace(pM[0],'');} 
        const cM=n.match(/^\[(.*?)\]\s*-?\s*/); if(cM){cl=cM[1];n=n.replace(cM[0],'').trim();} n=n||'未填寫';
        let h='<div class="flex-c gap-0.5"><span class="font-bold text-gray-800 text-[15px] leading-snug">' + (cl?cl+' - ':'') + n + '</span>'; 
        if(rt) h+='<span class="text-[11px] text-gray-500 font-bold mt-0.5">負責: ' + rt + '</span>'; 
        if(p) h+='<span class="text-[12px] text-gray-500 font-bold flex-r gap-1 mt-0.5"><i data-lucide="phone" class="w-3.5 h-3.5"></i> ' + (full?p:window.maskPhone(p)) + '</span>'; 
        if(id) h+='<span class="text-[11px] text-gray-400 font-normal tracking-wide">#' + String(id).slice(-4).toLowerCase() + '</span>'; 
        return h+'</div>';
    };

    window.isUpcoming = function(i) {
        const eq=window.getEquip(i), st=window.getStatus(i);
        if(st.includes('已歸還') || st.includes('已拒絕') || st.includes('刪除')) return false;
        if(st.includes('預約')) return true;
        if(eq && (eq.includes('[預借教室]')||eq.includes('[展覽空間]')) && (st.startsWith('借用中')||st.startsWith('剩遙控器')||window.isPendingReviewStatus(i))){
            const m=eq.match(/\((\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})~(\d{2}:\d{2})\)/)||eq.match(/\((\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\)/);
            if(m) return new Date() < new Date(m[1].replace(/-/g, '/') + ' ' + (m[2]&&m[2].includes(':')?m[2]+':00':'00:00:00'));
        } return false;
    };

    window.checkIsOverdue = function(i) {
        const exp=window.getExpDate(i), st=window.getStatus(i);
        if(!exp || st.includes('已歸還') || st.includes('已拒絕') || st.includes('刪除') || window.isPendingReviewStatus(i)) return false;
        if(window.isUpcoming(i)) return false;
        const t=new Date(); t.setHours(0,0,0,0); const d=new Date(exp); d.setHours(0,0,0,0); return t>d;
    };

    window.getStatusBadge = function(i) { 
        const ov=window.checkIsOverdue(i), st=window.getStatus(i), bc="px-3 py-1.5 text-[12px] font-bold rounded-full inline-block text-center whitespace-nowrap"; 
        if(ov) return '<span class="' + bc + ' bg-red-100 text-red-600">已逾期</span>'; 
        if(window.isTeacherApprovalWaiting(i)) return '<span class="' + bc + ' bg-blue-100 text-blue-600">待老師回覆</span>';
        if(window.isAdminApprovalWaiting(i)) return '<span class="' + bc + ' bg-indigo-100 text-indigo-600">待管理員審核</span>';
        if(st==='待審核') return '<span class="' + bc + ' bg-blue-100 text-blue-600">待審核</span>'; 
        if(window.isUpcoming(i) || st.includes('預約')) return '<span class="' + bc + ' bg-purple-100 text-purple-600">已核准預約</span>'; 
        if(st.startsWith('借用中')) return '<span class="' + bc + ' bg-yellow-100 text-yellow-700">' + st + '</span>'; 
        if(st.startsWith('剩遙控器')) return '<span class="' + bc + ' bg-orange-100 text-orange-600">剩遙控器</span>'; 
        if(st==='已拒絕') return '<span class="' + bc + ' bg-gray-200 text-gray-500">已拒絕</span>'; 
        return '<span class="' + bc + ' bg-green-100 text-green-700">已歸還</span>'; 
    };

    window.formatEquipmentCell = function(eq, qty) { 
        let b='', c=eq||''; 
        if(c.includes('[預借教室]')){b='<span class="inline-flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px] font-bold mb-1"><i data-lucide="door-open" class="w-3 h-3 mr-1"></i> 教室</span>';c=c.replace('[預借教室]','').trim();} 
        else if(c.includes('[展覽空間]')){b='<span class="inline-flex items-center text-pink-600 bg-pink-50 px-2 py-0.5 rounded text-[11px] font-bold mb-1"><i data-lucide="image" class="w-3 h-3 mr-1"></i> 展覽</span>';c=c.replace('[展覽空間]','').trim();} 
        else if(c.includes('[鑰匙]')){b='<span class="inline-flex items-center text-teal-600 bg-teal-50 px-2 py-0.5 rounded text-[11px] font-bold mb-1"><i data-lucide="key" class="w-3 h-3 mr-1"></i> 鑰匙</span>';c=c.replace('[鑰匙]','').trim();} 
        else{b='<span class="inline-flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold mb-1"><i data-lucide="monitor-speaker" class="w-3 h-3 mr-1"></i> 設備</span>';} 
        let dt=''; const accs=c.match(/\(\+(.*?)\)/g); 
        if(accs) accs.forEach(a=>{ dt+='<span class="bg-gray-100 text-[10px] font-bold text-gray-500 px-1.5 py-0.5 rounded mr-1 mt-1 inline-block">' + a.replace(/[()]/g,'') + '</span>'; c=c.replace(a,'').trim(); }); 
        return '<div class="flex-c items-start">' + b + '<div class="font-bold text-gray-800 text-[14px] mt-0.5">' + c + ' <span class="text-gray-400 font-medium text-[13px] ml-0.5">x' + (qty||1) + '</span></div>' + (dt?'<div class="flex flex-wrap mt-1">' + dt + '</div>':'') + '</div>'; 
    };

    window.formatTimeSplit = function(timeStr) {
        if(!timeStr) return '-'; const parts = timeStr.split(' ');
        if(parts.length >= 2) return '<div class="text-[13px] font-bold text-gray-600 tracking-wide">' + parts[0].replace(/-/g,'/') + '<br><span class="text-[11px] text-gray-400 font-normal">' + parts[1].substring(0,5) + '</span></div>';
        return '<div class="text-[13px] font-bold text-gray-600 tracking-wide">' + timeStr.replace(/-/g,'/') + '</div>';
    };

    window.escapeHtml = function(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    window.makeTeacherScheduleKey = function(teacher, index = 0) {
        const preferred = String((teacher && (teacher.scheduleKey || teacher.empId || teacher.name)) || '').trim().toLowerCase();
        const base = preferred
            .normalize('NFKD')
            .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/^-+|-+$/g, '');
        return base || ('teacher-' + (index + 1));
    };

    window.getTeacherSchedulePeriodOrder = function(periodId) {
        const idx = (window.periodList || []).findIndex(period => String(period.id) === String(periodId));
        return idx >= 0 ? idx : 999;
    };

    window.ensureTeacherScheduleTeacherDefaults = function() {
        const seenKeys = new Set();
        window.teacherList = (window.teacherList || []).map((teacher, index) => {
            const nextTeacher = { ...teacher };
            if(!nextTeacher.department) nextTeacher.department = '漫畫系';
            let baseKey = window.makeTeacherScheduleKey(nextTeacher, index);
            let scheduleKey = baseKey;
            let duplicateIndex = 2;
            while(seenKeys.has(scheduleKey)) {
                scheduleKey = baseKey + '-' + duplicateIndex;
                duplicateIndex += 1;
            }
            seenKeys.add(scheduleKey);
            nextTeacher.scheduleKey = scheduleKey;
            return nextTeacher;
        });

        window.teacherSchedules = (window.teacherSchedules || [])
            .map((entry, index) => ({
                id: entry && entry.id ? String(entry.id) : 'ts-' + Date.now() + '-' + index,
                scheduleKey: String((entry && (entry.scheduleKey || entry.teacherId || entry.teacherKey)) || ''),
                day: Number(entry && entry.day),
                periodId: String((entry && (entry.periodId || entry.period)) || ''),
                courseName: String((entry && entry.courseName) || '').trim(),
                location: String((entry && entry.location) || '').trim()
            }))
            .filter(entry => entry.scheduleKey && seenKeys.has(entry.scheduleKey) && entry.day >= 1 && entry.day <= 5 && entry.periodId)
            .sort((a, b) => {
                const teacherOrder = a.scheduleKey.localeCompare(b.scheduleKey, 'zh-Hant');
                if(teacherOrder !== 0) return teacherOrder;
                if(a.day !== b.day) return a.day - b.day;
                return window.getTeacherSchedulePeriodOrder(a.periodId) - window.getTeacherSchedulePeriodOrder(b.periodId);
            });
    };

    window.getTeacherByScheduleKey = function(scheduleKey) {
        return (window.teacherList || []).find(teacher => teacher.scheduleKey === scheduleKey) || null;
    };

    window.getTeacherSchedulePublicTeachers = function() {
        return (window.teacherList || []).filter(teacher => String(teacher && teacher.position || '').trim() !== '其他');
    };

    window.getTeacherScheduleEntries = function(scheduleKey) {
        return (window.teacherSchedules || []).filter(entry => entry.scheduleKey === scheduleKey);
    };

    window.findTeacherScheduleEntry = function(scheduleKey, day, periodId) {
        return (window.teacherSchedules || []).find(entry => entry.scheduleKey === scheduleKey && Number(entry.day) === Number(day) && String(entry.periodId) === String(periodId)) || null;
    };

    window.sortTeacherScheduleEntries = function(entries) {
        return (Array.isArray(entries) ? entries : []).sort((a, b) => {
            const teacherOrder = String(a && a.scheduleKey || '').localeCompare(String(b && b.scheduleKey || ''), 'zh-Hant');
            if(teacherOrder !== 0) return teacherOrder;
            if(Number(a && a.day) !== Number(b && b.day)) return Number(a && a.day) - Number(b && b.day);
            return window.getTeacherSchedulePeriodOrder(a && a.periodId) - window.getTeacherSchedulePeriodOrder(b && b.periodId);
        });
    };

    window.clearTeacherScheduleDragTimer = function() {
        const state = window.teacherScheduleDragState || {};
        if(state.pressTimer) {
            clearTimeout(state.pressTimer);
            state.pressTimer = null;
        }
    };

    window.getTeacherScheduleCellFromPoint = function(clientX, clientY) {
        const board = $('teacher-schedule-admin-board');
        if(!board) return null;
        const element = document.elementFromPoint(clientX, clientY);
        const cell = element && typeof element.closest === 'function'
            ? element.closest('#teacher-schedule-admin-board [data-schedule-cell=\"true\"]')
            : null;
        return board.contains(cell) ? cell : null;
    };

    window.setTeacherScheduleDragTarget = function(nextTarget) {
        const state = window.teacherScheduleDragState || {};
        if(state.targetCell === nextTarget) return;
        if(state.targetCell) state.targetCell.classList.remove('drag-target');
        state.targetCell = nextTarget || null;
        if(state.targetCell) state.targetCell.classList.add('drag-target');
    };

    window.resetTeacherScheduleDragVisuals = function() {
        const state = window.teacherScheduleDragState || {};
        const board = $('teacher-schedule-admin-board');
        if(board) board.classList.remove('teacher-schedule-admin-board-dragging');
        if(state.sourceCell) state.sourceCell.classList.remove('drag-source');
        if(state.targetCell) state.targetCell.classList.remove('drag-target');
    };

    window.removeTeacherScheduleDragListeners = function() {
        window.removeEventListener('pointermove', window.handleTeacherScheduleDragPointerMove);
        window.removeEventListener('pointerup', window.handleTeacherScheduleDragPointerUp);
        window.removeEventListener('pointercancel', window.handleTeacherScheduleDragPointerCancel);
    };

    window.resetTeacherScheduleDragState = function(options = {}) {
        const state = window.teacherScheduleDragState || {};
        window.clearTeacherScheduleDragTimer();
        window.removeTeacherScheduleDragListeners();
        window.resetTeacherScheduleDragVisuals();
        state.pointerId = null;
        state.sourceCell = null;
        state.sourceScheduleKey = '';
        state.sourceDay = 0;
        state.sourcePeriodId = '';
        state.sourceEntryId = '';
        state.sourceHadEntry = false;
        state.startX = 0;
        state.startY = 0;
        state.dragging = false;
        state.targetCell = null;
        if(options.suppressClick) {
            state.suppressClickUntil = Date.now() + 400;
        }
    };

    window.syncTeacherScheduleDraftUi = function() {
        const saveBtn = $('teacher-schedule-drag-save-btn');
        const dirtyBadge = $('teacher-schedule-drag-dirty-badge');
        if(saveBtn) {
            if(window.teacherScheduleBoardDirty) show('teacher-schedule-drag-save-btn');
            else hide('teacher-schedule-drag-save-btn');
        }
        if(dirtyBadge) {
            if(window.teacherScheduleBoardDirty) show('teacher-schedule-drag-dirty-badge');
            else hide('teacher-schedule-drag-dirty-badge');
        }
        if(window.lucide) window.lucide.createIcons();
    };

    window.setTeacherScheduleBoardDirty = function(isDirty) {
        window.teacherScheduleBoardDirty = !!isDirty;
        window.syncTeacherScheduleDraftUi();
    };

    window.findTeacherScheduleMatches = function(query) {
        const keyword = String(query || '').trim().toLowerCase();
        if(!keyword) return [];
        return window.getTeacherSchedulePublicTeachers().filter(teacher => {
            const haystack = [teacher.name, teacher.empId, teacher.department, teacher.position]
                .map(value => String(value || '').toLowerCase())
                .join(' ');
            return haystack.includes(keyword);
        });
    };

    window.getTeacherScheduleSummary = function(scheduleKey) {
        const entries = window.getTeacherScheduleEntries(scheduleKey);
        const dayCount = new Set(entries.map(entry => Number(entry.day))).size;
        const locationCount = new Set(entries.map(entry => entry.location).filter(Boolean)).size;
        return {
            totalSessions: entries.length,
            totalDays: dayCount,
            totalLocations: locationCount
        };
    };

    window.buildTeacherScheduleGridHtml = function(scheduleKey, editable = false) {
        const entries = window.getTeacherScheduleEntries(scheduleKey);
        let html = '<div class="teacher-schedule-table-shell"><table class="teacher-schedule-grid"><thead><tr><th>節次</th>';
        (window.teacherScheduleWeekdays || []).forEach(day => {
            html += '<th>' + window.escapeHtml(day.label) + '</th>';
        });
        html += '</tr></thead><tbody>';

        (window.periodList || []).forEach(period => {
            const timeText = period.start && period.end && !(period.start === '00:00' && period.end === '00:00')
                ? window.escapeHtml(period.start + ' - ' + period.end)
                : '時間待設定';
            html += '<tr><td class="teacher-schedule-period"><div class="text-[1rem] font-black text-slate-700">' + window.escapeHtml(period.name || period.id) + '</div><div class="mt-1 text-[0.72rem] font-bold text-slate-400">' + timeText + '</div></td>';
            (window.teacherScheduleWeekdays || []).forEach(day => {
                const entry = entries.find(item => Number(item.day) === Number(day.id) && String(item.periodId) === String(period.id));
                const cellClass = editable ? 'teacher-schedule-cell is-editable' : 'teacher-schedule-cell';
                const slotClass = entry ? 'teacher-schedule-slot filled' : 'teacher-schedule-slot empty';
                let slotHtml = '<span>尚未排課</span>';
                if(entry) {
                    slotHtml = '<div class="w-full text-center"><div class="teacher-schedule-course">' + window.escapeHtml(entry.courseName) + '</div>' + (entry.location ? '<div class="teacher-schedule-location">' + window.escapeHtml(entry.location) + '</div>' : '') + '</div>';
                }
                const actionAttrs = editable
                    ? ' data-schedule-cell="true" data-schedule-key="' + window.escapeHtml(scheduleKey) + '" data-day="' + window.escapeHtml(day.id) + '" data-period-id="' + window.escapeHtml(period.id) + '" data-entry-id="' + window.escapeHtml(entry ? entry.id : '') + '" data-has-entry="' + (entry ? '1' : '0') + '" onpointerdown="window.handleTeacherScheduleCellPointerDown(event,this)" onclick="window.handleTeacherScheduleCellClick(event,this)"'
                    : '';
                html += '<td class="' + cellClass + '"' + actionAttrs + '><div class="' + slotClass + '">' + slotHtml + '</div></td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    };

    window.buildTeacherSchedulePreviewGridHtml = function(entries) {
        const safeEntries = Array.isArray(entries) ? entries : [];
        let html = '<div class="teacher-schedule-table-shell"><table class="teacher-schedule-grid"><thead><tr><th>節次</th>';
        (window.teacherScheduleWeekdays || []).forEach(day => {
            html += '<th>' + window.escapeHtml(day.label) + '</th>';
        });
        html += '</tr></thead><tbody>';
        (window.periodList || []).forEach(period => {
            const timeText = period.start && period.end && !(period.start === '00:00' && period.end === '00:00')
                ? window.escapeHtml(period.start + ' - ' + period.end)
                : '時間待設定';
            html += '<tr><td class="teacher-schedule-period"><div class="text-[1rem] font-black text-slate-700">' + window.escapeHtml(period.name || period.id) + '</div><div class="mt-1 text-[0.72rem] font-bold text-slate-400">' + timeText + '</div></td>';
            (window.teacherScheduleWeekdays || []).forEach(day => {
                const entry = safeEntries.find(item => Number(item.day) === Number(day.id) && String(item.periodId) === String(period.id));
                const slotClass = entry ? 'teacher-schedule-slot filled' : 'teacher-schedule-slot empty';
                let slotHtml = '<span>尚未排課</span>';
                if(entry) {
                    slotHtml = '<div class="w-full text-center"><div class="teacher-schedule-course">' + window.escapeHtml(entry.courseName) + '</div>' + (entry.location ? '<div class="teacher-schedule-location">' + window.escapeHtml(entry.location) + '</div>' : '') + '</div>';
                }
                html += '<td class="teacher-schedule-cell"><div class="' + slotClass + '">' + slotHtml + '</div></td>';
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    };

    window.startTeacherScheduleDrag = function() {
        const state = window.teacherScheduleDragState || {};
        if(!state.sourceCell || !state.sourceHadEntry) return;
        const board = $('teacher-schedule-admin-board');
        state.dragging = true;
        if(board) board.classList.add('teacher-schedule-admin-board-dragging');
        state.sourceCell.classList.add('drag-source');
        window.setTeacherScheduleDragTarget(state.sourceCell);
        window.clearTeacherScheduleDragTimer();
        if(navigator.vibrate) {
            try { navigator.vibrate(16); } catch(error) {}
        }
    };

    window.handleTeacherScheduleCellPointerDown = function(event, cell) {
        if(window.currentAdminRole !== 'super') return;
        if(!cell || !cell.dataset) return;
        if(event.pointerType === 'mouse' && event.button !== 0) return;
        window.resetTeacherScheduleDragState();
        const state = window.teacherScheduleDragState || {};
        state.pointerId = event.pointerId;
        state.sourceCell = cell;
        state.sourceScheduleKey = String(cell.dataset.scheduleKey || '');
        state.sourceDay = Number(cell.dataset.day);
        state.sourcePeriodId = String(cell.dataset.periodId || '');
        state.sourceEntryId = String(cell.dataset.entryId || '');
        state.sourceHadEntry = cell.dataset.hasEntry === '1';
        state.startX = event.clientX;
        state.startY = event.clientY;
        window.addEventListener('pointermove', window.handleTeacherScheduleDragPointerMove, { passive: false });
        window.addEventListener('pointerup', window.handleTeacherScheduleDragPointerUp, { passive: false });
        window.addEventListener('pointercancel', window.handleTeacherScheduleDragPointerCancel, { passive: false });
        if(state.sourceHadEntry) {
            state.pressTimer = setTimeout(() => window.startTeacherScheduleDrag(), window.teacherScheduleLongPressMs);
        }
    };

    window.handleTeacherScheduleDragPointerMove = function(event) {
        const state = window.teacherScheduleDragState || {};
        if(state.pointerId == null || event.pointerId !== state.pointerId) return;
        const movedDistance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
        if(!state.dragging) {
            if(movedDistance > window.teacherScheduleDragThreshold) {
                window.clearTeacherScheduleDragTimer();
            }
            return;
        }
        event.preventDefault();
        window.setTeacherScheduleDragTarget(window.getTeacherScheduleCellFromPoint(event.clientX, event.clientY));
    };

    window.handleTeacherScheduleCellClick = function(event, cell) {
        const state = window.teacherScheduleDragState || {};
        if((state.suppressClickUntil || 0) > Date.now()) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        window.openTeacherScheduleEditor(cell);
        return true;
    };

    window.moveTeacherScheduleEntry = async function(sourceMeta, targetMeta) {
        if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以移動課表', 'error');
        const sourceScheduleKey = String(sourceMeta && sourceMeta.scheduleKey || '').trim();
        const sourceDay = Number(sourceMeta && sourceMeta.day);
        const sourcePeriodId = String(sourceMeta && sourceMeta.periodId || '').trim();
        const targetScheduleKey = String(targetMeta && targetMeta.scheduleKey || '').trim();
        const targetDay = Number(targetMeta && targetMeta.day);
        const targetPeriodId = String(targetMeta && targetMeta.periodId || '').trim();
        if(!sourceScheduleKey || !sourceDay || !sourcePeriodId || !targetScheduleKey || !targetDay || !targetPeriodId) return;
        if(sourceScheduleKey === targetScheduleKey && sourceDay === targetDay && sourcePeriodId === targetPeriodId) return;

        const nextSchedules = (window.teacherSchedules || []).map(entry => ({ ...entry }));
        const sourceIndex = nextSchedules.findIndex(entry => entry.scheduleKey === sourceScheduleKey && Number(entry.day) === sourceDay && String(entry.periodId) === sourcePeriodId);
        if(sourceIndex < 0) return window.showToast('原課程不存在，請重新整理後再試', 'error');
        const targetIndex = nextSchedules.findIndex(entry => entry.scheduleKey === targetScheduleKey && Number(entry.day) === targetDay && String(entry.periodId) === targetPeriodId);
        const sourceEntry = { ...nextSchedules[sourceIndex], scheduleKey: targetScheduleKey, day: targetDay, periodId: targetPeriodId };
        const hasTargetEntry = targetIndex >= 0;

        if(hasTargetEntry) {
            nextSchedules[targetIndex] = { ...nextSchedules[targetIndex], scheduleKey: sourceScheduleKey, day: sourceDay, periodId: sourcePeriodId };
        }
        nextSchedules[sourceIndex] = sourceEntry;
        window.teacherSchedules = window.sortTeacherScheduleEntries(nextSchedules);
        localStorage.setItem('teacherSchedules', JSON.stringify(window.teacherSchedules || []));
        window.setTeacherScheduleBoardDirty(true);
        window.syncTeacherScheduleViews();
        window.showToast(hasTargetEntry ? '已暫存課程對調，記得按右上方儲存' : '已暫存課程移動，記得按右上方儲存');
    };

    window.commitTeacherScheduleBoardChanges = async function() {
        if(!window.teacherScheduleBoardDirty) return window.showToast('目前沒有需要儲存的拖移變更', 'error');
        window.showLoadingOverlay('正在同步拖移後的課表，請稍候一下。', '儲存課表變更');
        const saved = await window.saveSettingsToCloud();
        window.hideLoadingOverlay(true);
        if(saved) {
            window.setTeacherScheduleBoardDirty(false);
            window.syncTeacherScheduleViews();
            window.showToast('課表拖移變更已儲存');
            return;
        }
        window.syncTeacherScheduleViews();
        window.showToast(window.lastSettingsSaveError || '課表儲存失敗', 'error');
    };

    window.handleTeacherScheduleDragPointerUp = async function(event) {
        const state = window.teacherScheduleDragState || {};
        if(state.pointerId == null || event.pointerId !== state.pointerId) return;
        const wasDragging = !!state.dragging;
        const sourceMeta = {
            scheduleKey: state.sourceScheduleKey,
            day: state.sourceDay,
            periodId: state.sourcePeriodId
        };
        const targetCell = wasDragging ? (state.targetCell || window.getTeacherScheduleCellFromPoint(event.clientX, event.clientY)) : null;
        const targetMeta = targetCell ? {
            scheduleKey: String(targetCell.dataset.scheduleKey || ''),
            day: Number(targetCell.dataset.day),
            periodId: String(targetCell.dataset.periodId || '')
        } : null;
        window.resetTeacherScheduleDragState({ suppressClick: wasDragging });
        if(wasDragging && targetMeta) {
            await window.moveTeacherScheduleEntry(sourceMeta, targetMeta);
        }
    };

    window.handleTeacherScheduleDragPointerCancel = function(event) {
        const state = window.teacherScheduleDragState || {};
        if(state.pointerId == null || (event && event.pointerId != null && event.pointerId !== state.pointerId)) return;
        window.resetTeacherScheduleDragState({ suppressClick: !!state.dragging });
    };

    window.normalizeTeacherScheduleAiPeriodId = function(rawValue) {
        const raw = String(rawValue || '').trim();
        if(!raw) return '';
        const periods = window.periodList || [];
        const chineseNumberMap = {
            '一': '1',
            '二': '2',
            '三': '3',
            '四': '4',
            '五': '5',
            '六': '6',
            '七': '7',
            '八': '8',
            '九': '9',
            '十': '10',
            '十一': '11',
            '十二': '12'
        };
        let match = periods.find(period => String(period.id) === raw || String(period.name) === raw);
        if(match) return String(match.id);
        if(raw.includes('中午')) {
            match = periods.find(period => String(period.id).includes('中午') || String(period.name).includes('中午'));
            if(match) return String(match.id);
        }
        const normalized = raw.replace(/^第\s*/,'').replace(/\s*節$/,'').trim();
        match = periods.find(period => String(period.id) === normalized);
        if(match) return String(match.id);
        if(chineseNumberMap[normalized]) {
            match = periods.find(period => String(period.id) === chineseNumberMap[normalized]);
            if(match) return String(match.id);
        }
        const chineseMatch = normalized.match(/^(十|十一|十二|[一二三四五六七八九])$/);
        if(chineseMatch && chineseNumberMap[chineseMatch[1]]) {
            match = periods.find(period => String(period.id) === chineseNumberMap[chineseMatch[1]]);
            if(match) return String(match.id);
        }
        const digitMatch = normalized.match(/\d+/);
        if(digitMatch) {
            match = periods.find(period => String(period.id) === digitMatch[0]);
            if(match) return String(match.id);
        }
        return '';
    };

    window.mergeTeacherScheduleAiParsedData = function(currentList, incomingList) {
        const mergedMap = new Map();
        [...(currentList || []), ...(incomingList || [])].forEach(item => {
            if(!item || !item.scheduleKey) return;
            if(!mergedMap.has(item.scheduleKey)) {
                mergedMap.set(item.scheduleKey, {
                    teacherName: item.teacherName || '未知老師',
                    department: item.department || '未指定系所',
                    scheduleKey: item.scheduleKey,
                    isNewTeacher: !!item.isNewTeacher,
                    schedules: []
                });
            }
            const target = mergedMap.get(item.scheduleKey);
            target.teacherName = item.teacherName || target.teacherName;
            target.department = item.department || target.department;
            target.isNewTeacher = target.isNewTeacher && !!item.isNewTeacher;
            const slotMap = new Map();
            [...(target.schedules || []), ...(item.schedules || [])].forEach(schedule => {
                if(!schedule || !schedule.periodId) return;
                slotMap.set(schedule.day + '-' + schedule.periodId, schedule);
            });
            target.schedules = Array.from(slotMap.values()).sort((a, b) => {
                if(Number(a.day) !== Number(b.day)) return Number(a.day) - Number(b.day);
                return window.getTeacherSchedulePeriodOrder(a.periodId) - window.getTeacherSchedulePeriodOrder(b.periodId);
            });
        });
        return Array.from(mergedMap.values());
    };

    window.mapTeacherScheduleAiResults = function(parsedJsonArray) {
        const existingTeachers = window.teacherList || [];
        const reservedKeys = new Set(existingTeachers.map(teacher => teacher.scheduleKey));
        const processed = [];
        (parsedJsonArray || []).forEach((parsedTeacher, teacherIndex) => {
            const teacherName = String((parsedTeacher && (parsedTeacher.teacherName || parsedTeacher.name)) || '').trim();
            if(!teacherName) return;
            const matchedTeacher = existingTeachers.find(teacher => String(teacher.name || '').trim() === teacherName);
            const matchedProcessed = processed.find(item => item.teacherName === teacherName);
            let scheduleKey = matchedTeacher ? matchedTeacher.scheduleKey : (matchedProcessed ? matchedProcessed.scheduleKey : '');
            if(!scheduleKey) {
                const baseKey = window.makeTeacherScheduleKey({ name: teacherName }, existingTeachers.length + teacherIndex);
                scheduleKey = baseKey;
                let suffix = 2;
                while(reservedKeys.has(scheduleKey)) {
                    scheduleKey = baseKey + '-' + suffix;
                    suffix += 1;
                }
                reservedKeys.add(scheduleKey);
            }
            const schedules = (parsedTeacher.schedules || parsedTeacher.schedule || []).map((item, index) => {
                const periodId = window.normalizeTeacherScheduleAiPeriodId(item.periodId || item.period || item.periodName || item.section);
                const day = Number(item.day || item.weekday || item.weekDay);
                if(!periodId || !day || day < 1 || day > 5) return null;
                return {
                    id: 'ai-' + Date.now() + '-' + teacherIndex + '-' + index + '-' + Math.random().toString(36).slice(2, 6),
                    scheduleKey,
                    day,
                    periodId,
                    courseName: String(item.courseName || item.course || '未命名課程').trim() || '未命名課程',
                    location: String(item.location || item.classroom || '未指定').trim() || '未指定'
                };
            }).filter(Boolean);
            processed.push({
                teacherName,
                department: String((parsedTeacher && parsedTeacher.department) || (matchedTeacher && matchedTeacher.department) || '漫畫系').trim() || '漫畫系',
                scheduleKey,
                isNewTeacher: !matchedTeacher,
                schedules
            });
        });
        return processed.filter(item => item.teacherName && item.schedules.length > 0);
    };

    window.renderTeacherScheduleAiState = function() {
        const status = $('teacher-schedule-ai-status');
        const preview = $('teacher-schedule-ai-preview');
        const aiState = window.teacherScheduleAiState || { isProcessing: false, progress: '', errorMsg: '', successMsg: '', parsedDataList: [] };
        if(status) {
            let statusHtml = '';
            if(aiState.isProcessing) {
                statusHtml = '<div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700"><div class="flex items-center gap-2 font-black"><i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i> 正在處理課表匯入</div><div class="mt-2 leading-6">' + window.escapeHtml(aiState.progress || '請稍候，正在處理檔案...') + '</div></div>';
            } else if(aiState.errorMsg) {
                statusHtml = '<div class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><div class="flex items-center gap-2 font-black"><i data-lucide="triangle-alert" class="w-4 h-4"></i> 解析失敗</div><div class="mt-2 leading-6">' + window.escapeHtml(aiState.errorMsg) + '</div></div>';
            } else if(aiState.successMsg) {
                statusHtml = '<div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><div class="flex items-center gap-2 font-black"><i data-lucide="badge-check" class="w-4 h-4"></i> 匯入完成</div><div class="mt-2 leading-6">' + window.escapeHtml(aiState.successMsg) + '</div></div>';
            }
            status.innerHTML = statusHtml;
        }
        if(preview) {
            if(!(aiState.parsedDataList || []).length) {
                preview.innerHTML = '';
            } else {
                preview.innerHTML =
                    '<div class="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">' +
                        '<div class="flex flex-col gap-3 border-b border-emerald-100 pb-4 md:flex-row md:items-center md:justify-between">' +
                            '<div>' +
                                '<div class="text-sm font-black text-emerald-800">匯入預覽</div>' +
                                '<p class="mt-1 text-sm font-medium text-emerald-700">已整理出 ' + (aiState.parsedDataList || []).length + ' 位教師的課表。確認無誤後，按上方「匯入解析結果」即可寫入正式資料。</p>' +
                            '</div>' +
                            '<button type="button" onclick="window.clearTeacherScheduleAiPreview()" class="btn btn-g px-4 py-2 text-xs"><i data-lucide="x" class="w-4 h-4"></i> 清空預覽</button>' +
                        '</div>' +
                        '<div class="mt-4 space-y-4 max-h-[720px] overflow-y-auto pr-1">' +
                            (aiState.parsedDataList || []).map(item => (
                                '<div class="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm">' +
                                    '<div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">' +
                                        '<div>' +
                                            '<div class="text-lg font-black text-slate-900">' + window.escapeHtml(item.teacherName || '未知老師') + '</div>' +
                                            '<div class="mt-1 text-sm font-medium text-slate-500">' + window.escapeHtml(item.department || '未指定系所') + '</div>' +
                                        '</div>' +
                                        '<div class="flex flex-wrap gap-2">' +
                                            (item.isNewTeacher ? '<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">新教師</span>' : '<span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">對應既有教師</span>') +
                                            '<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">' + (item.schedules || []).length + ' 節</span>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="mt-4">' + window.buildTeacherSchedulePreviewGridHtml(item.schedules || []) + '</div>' +
                                '</div>'
                            )).join('') +
                        '</div>' +
                    '</div>';
            }
        }
        if(window.lucide) window.lucide.createIcons();
    };

    window.triggerTeacherScheduleAiImport = function() {
        if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以使用課表匯入', 'error');
        if($('teacher-schedule-ai-input')) $('teacher-schedule-ai-input').click();
    };

    window.triggerTeacherScheduleExcelImport = function() {
        if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以使用課表匯入', 'error');
        if($('teacher-schedule-excel-input')) $('teacher-schedule-excel-input').click();
    };

    window.readTeacherScheduleAiFileAsBase64 = function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => {
                const result = event && event.target ? String(event.target.result || '') : '';
                resolve(result.split(',')[1] || '');
            };
            reader.onerror = err => reject(err);
            reader.readAsDataURL(file);
        });
    };

    window.readTeacherScheduleWorkbook = function(file) {
        return new Promise((resolve, reject) => {
            if(!window.XLSX) return reject(new Error('Excel 模組尚未載入，請重新整理後再試'));
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = new Uint8Array(event && event.target ? event.target.result : []);
                    resolve(window.XLSX.read(data, { type: 'array' }));
                } catch(err) {
                    reject(err);
                }
            };
            reader.onerror = err => reject(err);
            reader.readAsArrayBuffer(file);
        });
    };

    window.normalizeTeacherScheduleImportText = function(value) {
        return String(value == null ? '' : value).replace(/\r/g, '\n').replace(/\u3000/g, ' ').normalize('NFKC').trim();
    };

    window.compactTeacherScheduleImportText = function(value) {
        return window.normalizeTeacherScheduleImportText(value).toLowerCase().replace(/\s+/g, '');
    };

    window.matchTeacherScheduleExcelDay = function(value) {
        const normalized = window.compactTeacherScheduleImportText(value);
        if(!normalized) return 0;
        const dayMatchers = [
            { day: 1, patterns: [/^一$/, /^星期一$/, /^週一$/, /^禮拜一$/, /^礼拜一$/, /^mon$/, /^monday$/] },
            { day: 2, patterns: [/^二$/, /^星期二$/, /^週二$/, /^禮拜二$/, /^礼拜二$/, /^tue$/, /^tues$/, /^tuesday$/] },
            { day: 3, patterns: [/^三$/, /^星期三$/, /^週三$/, /^禮拜三$/, /^礼拜三$/, /^wed$/, /^wednesday$/] },
            { day: 4, patterns: [/^四$/, /^星期四$/, /^週四$/, /^禮拜四$/, /^礼拜四$/, /^thu$/, /^thur$/, /^thurs$/, /^thursday$/] },
            { day: 5, patterns: [/^五$/, /^星期五$/, /^週五$/, /^禮拜五$/, /^礼拜五$/, /^fri$/, /^friday$/] }
        ];
        const matched = dayMatchers.find(item => item.patterns.some(pattern => pattern.test(normalized)));
        return matched ? matched.day : 0;
    };

    window.findTeacherScheduleExcelDayHeader = function(rows) {
        let best = null;
        const maxRows = Math.min(rows.length, 18);
        for(let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const dayMap = new Map();
            row.forEach((cell, colIndex) => {
                const day = window.matchTeacherScheduleExcelDay(cell);
                if(day && !dayMap.has(day)) dayMap.set(day, colIndex);
            });
            const dayColumns = Array.from(dayMap.entries()).sort((a, b) => a[1] - b[1]).map(([day, colIndex]) => ({ day, colIndex }));
            if(dayColumns.length < 3) continue;
            const score = dayColumns.length * 100 - rowIndex;
            if(!best || score > best.score) best = { rowIndex, dayColumns, score };
        }
        return best;
    };

    window.findTeacherScheduleExcelPeriodColumn = function(rows, headerMeta) {
        const firstDayCol = headerMeta && headerMeta.dayColumns && headerMeta.dayColumns.length
            ? Math.min(...headerMeta.dayColumns.map(item => item.colIndex))
            : 0;
        let best = { colIndex: -1, score: 0 };
        const maxCols = Math.max(1, firstDayCol);
        for(let colIndex = 0; colIndex < maxCols; colIndex += 1) {
            let score = 0;
            for(let rowIndex = (headerMeta.rowIndex || 0) + 1; rowIndex < Math.min(rows.length, (headerMeta.rowIndex || 0) + 40); rowIndex += 1) {
                const row = rows[rowIndex] || [];
                if(window.normalizeTeacherScheduleAiPeriodId(row[colIndex])) score += 1;
            }
            if(score > best.score) best = { colIndex, score };
        }
        return best.score >= 2 ? best.colIndex : -1;
    };

    window.findTeacherScheduleExcelListHeader = function(rows) {
        const headerMatchers = {
            teacher: ['教師', '老師', '姓名', 'teacher'],
            department: ['系所', '單位', 'department', 'dept'],
            day: ['星期', '週次', 'weekday', 'day'],
            period: ['節次', '節', 'period', 'section'],
            course: ['課程', '課名', '科目', 'course', 'subject'],
            location: ['教室', '地點', '位置', 'location', 'classroom']
        };
        const maxRows = Math.min(rows.length, 12);
        for(let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const header = {};
            row.forEach((cell, colIndex) => {
                const compact = window.compactTeacherScheduleImportText(cell);
                if(!compact) return;
                Object.keys(headerMatchers).forEach(key => {
                    if(header[key] !== undefined) return;
                    if(headerMatchers[key].some(word => compact.includes(word.toLowerCase()))) header[key] = colIndex;
                });
            });
            if(header.day !== undefined && header.period !== undefined && header.course !== undefined) {
                header.rowIndex = rowIndex;
                return header;
            }
        }
        return null;
    };

    window.parseTeacherScheduleExcelCellValue = function(value) {
        const text = window.normalizeTeacherScheduleImportText(value);
        if(!text) return null;
        const compact = text.replace(/\s+/g, '');
        if(!compact || /^[-—–]+$/.test(compact) || compact === '尚未排課' || compact === '無') return null;
        const parsed = window.parseTeacherScheduleCellText(text);
        if(parsed) return parsed;
        const meaningful = compact.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '');
        if(meaningful.length < 2) return null;
        const location = window.extractTeacherScheduleLocation(text);
        const courseName = location ? text.replace(location, ' ').replace(/\s+/g, ' ').trim() : text.replace(/\s+/g, ' ').trim();
        return {
            courseName: courseName || '未命名課程',
            location: location || '未指定'
        };
    };

    window.findTeacherScheduleTeacherByNameLike = function(rawName) {
        const compact = window.compactTeacherScheduleImportText(rawName);
        if(!compact) return null;
        return (window.teacherList || []).find(teacher => {
            const target = window.compactTeacherScheduleImportText(teacher.name);
            return target && (compact === target || compact.includes(target) || target.includes(compact));
        }) || null;
    };

    window.resolveTeacherScheduleImportTeacher = function(rawName, selectedTeacher, sheetName) {
        const directName = window.normalizeTeacherScheduleImportText(rawName);
        const matchedByName = window.findTeacherScheduleTeacherByNameLike(directName);
        if(matchedByName) return matchedByName;
        if(directName) return { name: directName, department: '' };
        if(selectedTeacher) return selectedTeacher;
        const matchedBySheet = window.findTeacherScheduleTeacherByNameLike(sheetName);
        if(matchedBySheet) return matchedBySheet;
        const fallbackName = window.normalizeTeacherScheduleImportText(sheetName);
        return fallbackName ? { name: fallbackName, department: '' } : null;
    };

    window.mergeTeacherScheduleRawImportResults = function(currentList, incomingList) {
        const mergedMap = new Map();
        [...(currentList || []), ...(incomingList || [])].forEach(item => {
            if(!item || !item.teacherName) return;
            const key = item.teacherName + '|' + (item.department || '');
            if(!mergedMap.has(key)) {
                mergedMap.set(key, {
                    teacherName: item.teacherName,
                    department: item.department || '漫畫系',
                    schedules: []
                });
            }
            const target = mergedMap.get(key);
            const slotMap = new Map([...(target.schedules || []), ...((item.schedules || []))].map(schedule => [schedule.day + '-' + schedule.periodId, schedule]));
            target.schedules = Array.from(slotMap.values()).sort((a, b) => {
                if(Number(a.day) !== Number(b.day)) return Number(a.day) - Number(b.day);
                return window.getTeacherSchedulePeriodOrder(a.periodId) - window.getTeacherSchedulePeriodOrder(b.periodId);
            });
        });
        return Array.from(mergedMap.values()).filter(item => item.schedules.length);
    };

    window.shouldBindExcelImportToSelectedTeacher = function(rawResult) {
        if(!Array.isArray(rawResult) || !rawResult.length) return true;
        return rawResult.every(item => {
            const name = window.normalizeTeacherScheduleImportText(item && item.teacherName);
            return !name || name === '未命名老師' || name === '未知老師';
        });
    };

    window.parseTeacherScheduleExcelListSheet = function(rows, selectedTeacher, sheetName) {
        const header = window.findTeacherScheduleExcelListHeader(rows);
        if(!header) return [];
        let parsedResults = [];
        for(let rowIndex = header.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            if(!row.some(cell => window.normalizeTeacherScheduleImportText(cell))) continue;
            const day = window.matchTeacherScheduleExcelDay(row[header.day]);
            const periodId = window.normalizeTeacherScheduleAiPeriodId(row[header.period]);
            const cellText = header.location !== undefined
                ? [row[header.course], row[header.location]].filter(Boolean).join('\n')
                : row[header.course];
            const parsedCell = window.parseTeacherScheduleExcelCellValue(cellText);
            if(!day || !periodId || !parsedCell) continue;
            const teacherInfo = window.resolveTeacherScheduleImportTeacher(header.teacher !== undefined ? row[header.teacher] : '', selectedTeacher, sheetName);
            if(!teacherInfo || !teacherInfo.name) continue;
            parsedResults = window.mergeTeacherScheduleRawImportResults(parsedResults, [{
                teacherName: teacherInfo.name,
                department: window.normalizeTeacherScheduleImportText(header.department !== undefined ? row[header.department] : '') || teacherInfo.department || '漫畫系',
                schedules: [{
                    day,
                    periodId,
                    courseName: parsedCell.courseName,
                    location: parsedCell.location
                }]
            }]);
        }
        return parsedResults;
    };

    window.parseTeacherScheduleExcelGridSheet = function(rows, selectedTeacher, sheetName) {
        const headerMeta = window.findTeacherScheduleExcelDayHeader(rows);
        if(!headerMeta) return [];
        const periodCol = window.findTeacherScheduleExcelPeriodColumn(rows, headerMeta);
        const teacherInfo = window.resolveTeacherScheduleImportTeacher('', selectedTeacher, sheetName);
        const schedules = [];
        for(let rowIndex = headerMeta.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            if(!row.some(cell => window.normalizeTeacherScheduleImportText(cell))) continue;
            let periodId = '';
            const searchCols = periodCol >= 0 ? [periodCol] : Array.from({ length: Math.min(4, row.length) }, (_, idx) => idx);
            for(let index = 0; index < searchCols.length; index += 1) {
                periodId = window.normalizeTeacherScheduleAiPeriodId(row[searchCols[index]]);
                if(periodId) break;
            }
            if(!periodId) continue;
            headerMeta.dayColumns.forEach(dayMeta => {
                const parsedCell = window.parseTeacherScheduleExcelCellValue(row[dayMeta.colIndex]);
                if(!parsedCell) return;
                schedules.push({
                    day: dayMeta.day,
                    periodId,
                    courseName: parsedCell.courseName,
                    location: parsedCell.location
                });
            });
        }
        if(!schedules.length) return [];
        return [{
            teacherName: (teacherInfo && teacherInfo.name) || '未命名老師',
            department: (teacherInfo && teacherInfo.department) || '漫畫系',
            schedules
        }];
    };

    window.parseTeacherScheduleExcelFile = async function(file, selectedTeacher) {
        const workbook = await window.readTeacherScheduleWorkbook(file);
        let parsedResults = [];
        (workbook.SheetNames || []).forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            if(!sheet) return;
            const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
            if(!rows.length) return;
            const listResults = window.parseTeacherScheduleExcelListSheet(rows, selectedTeacher, sheetName);
            const gridResults = listResults.length ? [] : window.parseTeacherScheduleExcelGridSheet(rows, selectedTeacher, sheetName);
            parsedResults = window.mergeTeacherScheduleRawImportResults(parsedResults, listResults.length ? listResults : gridResults);
        });
        return parsedResults;
    };

    window.extractTeacherScheduleJsonPayload = function(textOutput) {
        const text = String(textOutput || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        if(!text) return [];
        try {
            const direct = JSON.parse(text);
            return Array.isArray(direct) ? direct : [direct];
        } catch(_) {}
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if(arrayMatch) {
            const parsedArray = JSON.parse(arrayMatch[0]);
            return Array.isArray(parsedArray) ? parsedArray : [parsedArray];
        }
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if(objectMatch) {
            const parsedObject = JSON.parse(objectMatch[0]);
            return Array.isArray(parsedObject) ? parsedObject : [parsedObject];
        }
        return [];
    };

    window.canvasToBase64 = function(canvas, mimeType = 'image/jpeg', quality = 0.94) {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        return dataUrl.split(',')[1] || '';
    };

    window.prepareTeacherScheduleGeminiCanvas = function(sourceCanvas) {
        const maxWidth = 2200;
        const maxHeight = 3200;
        const scale = Math.min(1, maxWidth / sourceCanvas.width, maxHeight / sourceCanvas.height);
        if(scale >= 0.999) return sourceCanvas;
        const target = window.createCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
        const ctx = target.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, target.width, target.height);
        ctx.drawImage(sourceCanvas, 0, 0, target.width, target.height);
        return target;
    };

    window.getTeacherScheduleGeminiParts = async function(file) {
        const lowerName = String(file && file.name || '').toLowerCase();
        const isPdf = file && (file.type === 'application/pdf' || lowerName.endsWith('.pdf'));
        if(isPdf) {
            const pages = await window.renderTeacherSchedulePdfPages(file);
            return pages.slice(0, 3).map((page, index) => {
                const preparedCanvas = window.prepareTeacherScheduleGeminiCanvas(page.canvas);
                return {
                    label: page.label || (file.name + '｜第 ' + (index + 1) + ' 頁'),
                    mimeType: 'image/jpeg',
                    data: window.canvasToBase64(preparedCanvas, 'image/jpeg', 0.94)
                };
            });
        }
        const mimeType = file.type || 'image/jpeg';
        const base64Data = await window.readTeacherScheduleAiFileAsBase64(file);
        return [{ label: file.name, mimeType, data: base64Data }];
    };

    window.processTeacherScheduleWithGemini = async function(fileParts, selectedTeacher) {
        const apiKey = String(window.teacherScheduleGeminiApiKey || '').trim();
        if(!apiKey) throw new Error('Gemini API Key 尚未設定');
        const normalizedParts = Array.isArray(fileParts) ? fileParts.filter(part => part && part.data && part.mimeType) : [];
        if(!normalizedParts.length) throw new Error('沒有可供 Gemini 分析的檔案內容');
        const teacherPrompt = (window.teacherList || []).map(teacher => teacher.name + (teacher.department ? '（' + teacher.department + '）' : '')).join('、');
        const periodPrompt = (window.periodList || []).map(period => {
            const timeText = period.start && period.end && !(period.start === '00:00' && period.end === '00:00') ? period.start + '-' + period.end : '時間未設定';
            return '- periodId: "' + period.id + '"，名稱: "' + period.name + '"，時間: "' + timeText + '"';
        }).join('\n');
        const selectedTeacherPrompt = selectedTeacher
            ? '本次後台目前選取的教師是：' + selectedTeacher.name + (selectedTeacher.department ? '（' + selectedTeacher.department + '）' : '') + '。若檔案內容是單一教師課表，teacherName 必須直接使用這個名字，不要自行猜測同姓或相近姓名；department 也請優先使用這位教師的系所。'
            : '若檔案內容看起來是單一教師課表，請盡量辨識出正確教師姓名；若和現有名單相同，請直接使用現有名稱。';
        const promptText =
            '請分析這份教師課表檔案。附件可能是課表 PDF 轉成的高解析頁面圖片。請回傳嚴格 JSON，不要加入任何 Markdown、說明句或註解。\n' +
            selectedTeacherPrompt + '\n' +
            '現有教師名單：' + (teacherPrompt || '目前尚無教師名單') + '。\n' +
            '系統節次如下：\n' + periodPrompt + '\n' +
            '請輸出 JSON Array，每個物件格式：\n' +
            '[{"teacherName":"老師姓名","department":"系所名稱","schedules":[{"day":1,"periodId":"1","courseName":"課程名稱","location":"L401"}]}]\n' +
            '規則：\n' +
            '1. 只輸出星期一到星期五，忽略星期六。\n' +
            '2. 只輸出實際有課的節次，不要輸出空白格。\n' +
            '3. periodId 必須對應系統節次 id，例如 1、2、3、4、中午、6、7、8、9、10。\n' +
            '4. courseName 請只保留課名，不要把星期、時間、教師姓名、節次編號、亂碼、括號雜訊帶進去。\n' +
            '5. location 盡量抓出教室代碼，例如 L401、Y205；若真的沒有再填「未指定」。\n' +
            '6. 若檔案只有一位老師，請只回傳一位老師。\n' +
            '7. 同一門課若連續佔多個節次，請分別輸出對應節次，但課名要保持一致。\n' +
            '8. 若辨識不清，也請依格線位置、星期欄與節次欄推斷最合理的課表結果。\n' +
            '9. 若發現文字像是時間、星期標題、頁首頁尾或系統欄位，請不要當成 courseName。';
        const requestParts = [{ text: promptText }];
        normalizedParts.forEach((part, index) => {
            requestParts.push({ text: '附件 ' + (index + 1) + '：' + (part.label || ('課表頁面 ' + (index + 1))) });
            requestParts.push({ inlineData: { mimeType: part.mimeType, data: part.data } });
        });
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: requestParts
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.2,
                    responseMimeType: 'application/json'
                }
            })
        });
        if(!response.ok) throw new Error('Gemini API 請求失敗：' + response.status);
        const result = await response.json();
        const outputText = ((((result || {}).candidates || [])[0] || {}).content || {}).parts
            ? ((((result || {}).candidates || [])[0] || {}).content.parts || []).map(part => part && part.text ? part.text : '').join('\n').trim()
            : '';
        const parsed = window.extractTeacherScheduleJsonPayload(outputText);
        if(!parsed.length) throw new Error('Gemini 沒有回傳可解析的課表 JSON');
        return parsed;
    };

    window.bindTeacherScheduleImportToSelectedTeacher = function(rawResult, selectedTeacher) {
        if(!selectedTeacher || !Array.isArray(rawResult) || !rawResult.length) return rawResult;
        const slotMap = new Map();
        rawResult.forEach(item => {
            (item && (item.schedules || item.schedule) || []).forEach(schedule => {
                const day = Number(schedule.day || schedule.weekday || schedule.weekDay);
                const periodId = String(schedule.periodId || schedule.period || schedule.periodName || schedule.section || '').trim();
                if(!day || !periodId) return;
                const key = day + '-' + periodId;
                slotMap.set(key, {
                    day,
                    periodId,
                    courseName: String(schedule.courseName || schedule.course || '未命名課程').trim() || '未命名課程',
                    location: String(schedule.location || schedule.classroom || '未指定').trim() || '未指定'
                });
            });
        });
        if(!slotMap.size) return rawResult;
        return [{
            teacherName: selectedTeacher.name,
            department: selectedTeacher.department || '漫畫系',
            schedules: Array.from(slotMap.values()).sort((a, b) => {
                if(Number(a.day) !== Number(b.day)) return Number(a.day) - Number(b.day);
                return window.getTeacherSchedulePeriodOrder(a.periodId) - window.getTeacherSchedulePeriodOrder(b.periodId);
            })
        }];
    };

    window.getTeacherScheduleTemplateGridMeta = function(pageCanvas) {
        const periodIds = window.getTeacherScheduleTemplatePeriodIds();
        const detectedGrid = window.detectTeacherScheduleTemplateGrid(pageCanvas);
        const dayBounds = detectedGrid && detectedGrid.dayBounds && detectedGrid.dayBounds.length >= 7
            ? detectedGrid.dayBounds
            : [0.23, 0.313, 0.396, 0.479, 0.562, 0.645, 0.728].map(ratio => pageCanvas.width * ratio);
        const rowBounds = detectedGrid && detectedGrid.rowBounds && detectedGrid.rowBounds.length >= 11
            ? detectedGrid.rowBounds
            : [0.102, 0.183, 0.264, 0.344, 0.425, 0.506, 0.587, 0.668, 0.749, 0.829, 0.91].map(ratio => pageCanvas.height * ratio);
        return { periodIds, dayBounds, rowBounds };
    };

    window.prepareTeacherScheduleGeminiCellCanvas = function(sourceCanvas) {
        const minWidth = 900;
        const minHeight = 520;
        const scale = Math.max(1, Math.min(4.2, minWidth / sourceCanvas.width, minHeight / sourceCanvas.height));
        const target = window.createCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
        const ctx = target.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, target.width, target.height);
        ctx.drawImage(sourceCanvas, 0, 0, target.width, target.height);
        const imageData = ctx.getImageData(0, 0, target.width, target.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const adjusted = gray > 238 ? 255 : Math.max(0, Math.min(255, gray * 0.9));
            data[i] = adjusted;
            data[i + 1] = adjusted;
            data[i + 2] = adjusted;
        }
        ctx.putImageData(imageData, 0, 0);
        return target;
    };

    window.buildTeacherScheduleGeminiCellTasks = function(pageCanvas, fileLabel) {
        const { periodIds, dayBounds, rowBounds } = window.getTeacherScheduleTemplateGridMeta(pageCanvas);
        const tasks = [];
        for(let rowIndex = 0; rowIndex < periodIds.length; rowIndex += 1) {
            for(let day = 1; day <= 5; day += 1) {
                const left = dayBounds[day];
                const right = dayBounds[day + 1];
                const top = rowBounds[rowIndex];
                const bottom = rowBounds[rowIndex + 1];
                const crop = window.cropCanvas(pageCanvas, {
                    x: left + (right - left) * 0.05,
                    y: top + (bottom - top) * 0.08,
                    width: (right - left) * 0.9,
                    height: (bottom - top) * 0.84
                });
                if(window.getTeacherScheduleCanvasInkRatio(crop) < 0.0045) continue;
                const prepared = window.prepareTeacherScheduleGeminiCellCanvas(crop);
                const weekday = (window.teacherScheduleWeekdays || []).find(item => Number(item.id) === day);
                const period = (window.periodList || []).find(item => String(item.id) === String(periodIds[rowIndex]));
                tasks.push({
                    day,
                    periodId: periodIds[rowIndex],
                    label: (fileLabel || '課表') + '｜' + (weekday ? weekday.fullLabel : ('星期' + day)) + '｜' + (period ? period.name : periodIds[rowIndex]),
                    imageMimeType: 'image/png',
                    imageData: window.canvasToBase64(prepared, 'image/png')
                });
            }
        }
        return tasks;
    };

    window.processTeacherScheduleCellBatchWithGemini = async function(cellBatch, selectedTeacher) {
        const apiKey = String(window.teacherScheduleGeminiApiKey || '').trim();
        if(!apiKey) throw new Error('Gemini API Key 尚未設定');
        if(!Array.isArray(cellBatch) || !cellBatch.length) return [];
        const locationPrompt = (window.keyList || []).map(item => String(item || '').replace(/^\[.*?\]\s*/, '').trim()).filter(Boolean).join('、');
        const selectedTeacherPrompt = selectedTeacher
            ? '目前後台選定的教師是：' + selectedTeacher.name + (selectedTeacher.department ? '（' + selectedTeacher.department + '）' : '') + '。請專注辨識課程內容，不需要猜教師姓名。'
            : '請專注辨識課程內容，不需要猜教師姓名。';
        const promptText =
            '你會收到多張「單一課表儲存格」圖片，每張圖只對應一個已知的星期與節次。請只辨識每格真正的課程內容，並回傳嚴格 JSON Array，不要加入 Markdown 或額外說明。\n' +
            selectedTeacherPrompt + '\n' +
            '常見教室代碼：' + (locationPrompt || 'L401、L402、Y103') + '。\n' +
            '輸出格式：' +
            '[{"index":0,"empty":false,"courseName":"課程名稱","location":"L401"}]\n' +
            '規則：\n' +
            '1. index 必須對應我提供的 index。\n' +
            '2. 如果該格沒有課、內容太模糊、或只有空白，請回傳 empty=true，courseName/location 皆留空字串。\n' +
            '3. courseName 只保留課名，不要帶入星期、時間、教師姓名、節次、亂碼、教室代碼或頁首頁尾內容。\n' +
            '4. location 只保留教室代碼，例如 L401、L402、Y103；若看不出來就留空。\n' +
            '5. 若同一格有兩行，通常上面是課名、下面是教室。\n' +
            '6. 不要亂猜，不確定時寧可回傳 empty=true 或較短但可信的課名。';
        const requestParts = [{ text: promptText }];
        cellBatch.forEach((cell, index) => {
            requestParts.push({ text: 'index=' + index + '，' + cell.label + '，day=' + cell.day + '，periodId=' + cell.periodId });
            requestParts.push({ inlineData: { mimeType: cell.imageMimeType, data: cell.imageData } });
        });
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: requestParts
                }],
                generationConfig: {
                    temperature: 0.05,
                    topP: 0.15,
                    responseMimeType: 'application/json'
                }
            })
        });
        if(!response.ok) throw new Error('Gemini 儲存格辨識失敗：' + response.status);
        const result = await response.json();
        const outputText = ((((result || {}).candidates || [])[0] || {}).content || {}).parts
            ? ((((result || {}).candidates || [])[0] || {}).content.parts || []).map(part => part && part.text ? part.text : '').join('\n').trim()
            : '';
        const parsed = window.extractTeacherScheduleJsonPayload(outputText);
        if(!parsed.length) throw new Error('Gemini 沒有回傳可解析的儲存格 JSON');
        return parsed;
    };

    window.normalizeTeacherScheduleGeminiCellResults = function(rawItems, cellBatch) {
        const normalized = [];
        const rawList = Array.isArray(rawItems) ? rawItems : [];
        rawList.forEach((item, fallbackIndex) => {
            const index = Number(item && item.index);
            const cell = cellBatch[Number.isInteger(index) && cellBatch[index] ? index : fallbackIndex];
            if(!cell) return;
            const empty = !!(item && (item.empty === true || item.isEmpty === true));
            let courseName = String((item && (item.courseName || item.course || item.text)) || '').trim();
            let location = String((item && (item.location || item.classroom)) || '').trim();
            if(location) courseName = courseName.replace(location, ' ').replace(/\s+/g, ' ').trim();
            const extractedLocation = window.extractTeacherScheduleLocation(courseName);
            if(!location && extractedLocation) {
                location = extractedLocation;
                courseName = courseName.replace(extractedLocation, ' ').replace(/\s+/g, ' ').trim();
            }
            courseName = courseName
                .replace(/^(課名|課程|科目)[:：]?\s*/,'')
                .replace(/^(星期[一二三四五]|第?[一二三四五六七八九十\d]+節)\s*/g, '')
                .replace(/[|｜]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const meaningful = courseName.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '');
            if(empty || meaningful.length < 2) return;
            normalized.push({
                day: cell.day,
                periodId: cell.periodId,
                courseName,
                location: location || '未指定'
            });
        });
        return normalized;
    };

    window.parseTeacherScheduleFileWithGeminiCells = async function(file, selectedTeacher) {
        const pages = await window.getTeacherScheduleImportPages(file);
        const allSchedules = [];
        for(let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
            const page = pages[pageIndex];
            const cellTasks = window.buildTeacherScheduleGeminiCellTasks(page.canvas, page.label);
            if(!cellTasks.length) continue;
            const batchSize = 4;
            for(let start = 0; start < cellTasks.length; start += batchSize) {
                const batch = cellTasks.slice(start, start + batchSize);
                window.teacherScheduleAiState.progress = '正在解析 ' + page.label + ' 的課表格子（' + (start + 1) + ' - ' + Math.min(start + batchSize, cellTasks.length) + ' / ' + cellTasks.length + '）';
                window.renderTeacherScheduleAiState();
                const batchRaw = await window.processTeacherScheduleCellBatchWithGemini(batch, selectedTeacher);
                allSchedules.push(...window.normalizeTeacherScheduleGeminiCellResults(batchRaw, batch));
            }
        }
        const uniqueSchedules = Array.from(new Map(allSchedules.map(item => [item.day + '-' + item.periodId, item])).values()).sort((a, b) => {
            if(Number(a.day) !== Number(b.day)) return Number(a.day) - Number(b.day);
            return window.getTeacherSchedulePeriodOrder(a.periodId) - window.getTeacherSchedulePeriodOrder(b.periodId);
        });
        if(!uniqueSchedules.length) return [];
        const teacher = selectedTeacher || { name: '未命名老師', department: '漫畫系' };
        return [{
            teacherName: teacher.name || '未命名老師',
            department: teacher.department || '漫畫系',
            schedules: uniqueSchedules
        }];
    };

    window.readTeacherScheduleFileAsArrayBuffer = function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event && event.target ? event.target.result : null);
            reader.onerror = err => reject(err);
            reader.readAsArrayBuffer(file);
        });
    };

    window.createCanvas = function(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width));
        canvas.height = Math.max(1, Math.round(height));
        return canvas;
    };

    window.rotateCanvas = function(sourceCanvas, degrees) {
        const turns = (((degrees / 90) % 4) + 4) % 4;
        if(turns === 0) return sourceCanvas;
        const target = window.createCanvas(turns % 2 === 0 ? sourceCanvas.width : sourceCanvas.height, turns % 2 === 0 ? sourceCanvas.height : sourceCanvas.width);
        const ctx = target.getContext('2d');
        ctx.translate(target.width / 2, target.height / 2);
        ctx.rotate(turns * Math.PI / 2);
        ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
        return target;
    };

    window.cropCanvas = function(sourceCanvas, rect) {
        const x = Math.max(0, Math.round(rect.x));
        const y = Math.max(0, Math.round(rect.y));
        const width = Math.min(sourceCanvas.width - x, Math.max(1, Math.round(rect.width)));
        const height = Math.min(sourceCanvas.height - y, Math.max(1, Math.round(rect.height)));
        const target = window.createCanvas(width, height);
        target.getContext('2d').drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
        return target;
    };

    window.normalizeTeacherScheduleCanvas = function(canvas) {
        return canvas.width > canvas.height ? window.rotateCanvas(canvas, -90) : canvas;
    };

    window.prepareTeacherScheduleOcrCanvas = function(sourceCanvas, options = {}) {
        const scale = options.scale || 2.8;
        const threshold = typeof options.threshold === 'number' ? options.threshold : 208;
        const target = window.createCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
        const ctx = target.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, target.width, target.height);
        ctx.drawImage(sourceCanvas, 0, 0, target.width, target.height);
        const imageData = ctx.getImageData(0, 0, target.width, target.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
            const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            const value = gray > threshold ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);
        return target;
    };

    window.getTeacherScheduleCanvasInkRatio = function(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let darkCount = 0;
        const total = imageData.length / 4;
        for(let i = 0; i < imageData.length; i += 4) {
            if(imageData[i] < 180) darkCount += 1;
        }
        return total ? darkCount / total : 0;
    };

    window.getTeacherScheduleProjection = function(canvas, direction, bounds = {}, threshold = 205) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const x1 = Math.max(0, Math.round(bounds.x1 || 0));
        const y1 = Math.max(0, Math.round(bounds.y1 || 0));
        const x2 = Math.min(canvas.width, Math.round(bounds.x2 || canvas.width));
        const y2 = Math.min(canvas.height, Math.round(bounds.y2 || canvas.height));
        const width = Math.max(1, x2 - x1);
        const height = Math.max(1, y2 - y1);
        const data = ctx.getImageData(x1, y1, width, height).data;
        const result = new Array(direction === 'vertical' ? width : height).fill(0);
        for(let y = 0; y < height; y += 1) {
            for(let x = 0; x < width; x += 1) {
                const idx = (y * width + x) * 4;
                const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
                if(gray < threshold) {
                    if(direction === 'vertical') result[x] += 1;
                    else result[y] += 1;
                }
            }
        }
        return result;
    };

    window.findTeacherScheduleLineCenters = function(projection, minStrength, offset = 0) {
        const centers = [];
        let start = -1;
        for(let index = 0; index <= projection.length; index += 1) {
            const value = index < projection.length ? projection[index] : 0;
            if(value >= minStrength) {
                if(start === -1) start = index;
            } else if(start !== -1) {
                const end = index - 1;
                centers.push(Math.round((start + end) / 2) + offset);
                start = -1;
            }
        }
        return centers;
    };

    window.findTeacherScheduleBestGapRun = function(positions, gapCount, minGap) {
        if(!Array.isArray(positions) || positions.length < gapCount + 1) return null;
        let best = null;
        for(let start = 0; start <= positions.length - (gapCount + 1); start += 1) {
            const slice = positions.slice(start, start + gapCount + 1);
            const gaps = [];
            let isValid = true;
            for(let i = 0; i < slice.length - 1; i += 1) {
                const gap = slice[i + 1] - slice[i];
                gaps.push(gap);
                if(gap < minGap) {
                    isValid = false;
                    break;
                }
            }
            if(!isValid) continue;
            const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
            const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length;
            const deviation = Math.sqrt(variance);
            const score = mean - deviation * 2.4;
            if(!best || score > best.score) {
                best = { start, slice, gaps, score, mean, deviation };
            }
        }
        return best;
    };

    window.detectTeacherScheduleTemplateGrid = function(pageCanvas) {
        const verticalProjection = window.getTeacherScheduleProjection(pageCanvas, 'vertical', {
            x1: pageCanvas.width * 0.08,
            x2: pageCanvas.width * 0.94,
            y1: pageCanvas.height * 0.08,
            y2: pageCanvas.height * 0.93
        }, 214);
        const verticalLines = window.findTeacherScheduleLineCenters(verticalProjection, Math.max(60, pageCanvas.height * 0.42), pageCanvas.width * 0.08);
        const verticalRun = window.findTeacherScheduleBestGapRun(verticalLines, 6, pageCanvas.width * 0.055);
        if(!verticalRun) return null;

        const dayBounds = verticalRun.slice;
        const horizontalProjection = window.getTeacherScheduleProjection(pageCanvas, 'horizontal', {
            x1: dayBounds[0],
            x2: dayBounds[dayBounds.length - 1],
            y1: pageCanvas.height * 0.08,
            y2: pageCanvas.height * 0.95
        }, 214);
        const horizontalLines = window.findTeacherScheduleLineCenters(horizontalProjection, Math.max(60, (dayBounds[dayBounds.length - 1] - dayBounds[0]) * 0.48), pageCanvas.height * 0.08);
        const horizontalRun = window.findTeacherScheduleBestGapRun(horizontalLines, 10, pageCanvas.height * 0.035);
        if(!horizontalRun) return null;

        return {
            dayBounds,
            rowBounds: horizontalRun.slice
        };
    };

    window.loadTeacherScheduleImageCanvas = function(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                const canvas = window.createCanvas(image.naturalWidth, image.naturalHeight);
                canvas.getContext('2d').drawImage(image, 0, 0);
                URL.revokeObjectURL(url);
                resolve([{ canvas: window.normalizeTeacherScheduleCanvas(canvas), label: file.name }]);
            };
            image.onerror = err => {
                URL.revokeObjectURL(url);
                reject(err);
            };
            image.src = url;
        });
    };

    window.renderTeacherSchedulePdfPages = async function(file) {
        if(!window.pdfjsLib) throw new Error('PDF 模組尚未載入，請重新整理後再試一次。');
        if(window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        const arrayBuffer = await window.readTeacherScheduleFileAsArrayBuffer(file);
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: true });
        const pdf = await loadingTask.promise;
        const pages = [];
        for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 4.6 });
            const canvas = window.createCanvas(viewport.width, viewport.height);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            pages.push({ canvas: window.normalizeTeacherScheduleCanvas(canvas), label: file.name + '｜第 ' + pageNumber + ' 頁' });
        }
        return pages;
    };

    window.getTeacherScheduleImportPages = async function(file) {
        const lowerName = String(file && file.name || '').toLowerCase();
        const isPdf = file && (file.type === 'application/pdf' || lowerName.endsWith('.pdf'));
        return isPdf ? window.renderTeacherSchedulePdfPages(file) : window.loadTeacherScheduleImageCanvas(file);
    };

    window.normalizeTeacherScheduleOcrText = function(text) {
        return String(text || '')
            .normalize('NFKC')
            .replace(/[|｜]/g, ' ')
            .replace(/\s+/g, '')
            .trim();
    };

    window.findBestTeacherScheduleMatch = function(rawText) {
        const normalizedRaw = window.normalizeTeacherScheduleOcrText(rawText);
        if(!normalizedRaw) return null;
        let bestTeacher = null;
        let bestScore = 0;
        (window.teacherList || []).forEach(teacher => {
            const target = window.normalizeTeacherScheduleOcrText(teacher.name);
            if(!target) return;
            let score = 0;
            if(normalizedRaw.includes(target)) score = target.length + 10;
            else {
                const uniqueChars = Array.from(new Set(target.split('')));
                score = uniqueChars.filter(char => normalizedRaw.includes(char)).length;
            }
            if(score > bestScore) {
                bestScore = score;
                bestTeacher = teacher;
            }
        });
        return bestScore >= 2 ? bestTeacher : null;
    };

    window.extractTeacherScheduleNameCandidate = function(rawText) {
        const compact = window.normalizeTeacherScheduleOcrText(rawText);
        const explicit = compact.match(/([\u4e00-\u9fff]{2,4})老師/);
        if(explicit) return explicit[1];
        const candidates = compact.match(/[\u4e00-\u9fff]{2,4}/g) || [];
        const blacklist = ['教師課表', '授課時數', '台南應用科技大學', '學年度', '授課時間表', '星期六', '星期五', '星期四', '星期三', '星期二', '星期一', '資產'];
        return candidates.find(item => !blacklist.some(word => item === word || word.includes(item))) || '';
    };

    window.runTeacherScheduleOcr = async function(worker, canvas, parameters = {}) {
        if(worker.setParameters) await worker.setParameters(parameters);
        const result = await worker.recognize(canvas);
        return String(result && result.data && result.data.text || '').trim();
    };

    window.matchTeacherSchedulePageTeacher = async function(worker, pageCanvas, fileLabel) {
        const teacherArea = window.cropCanvas(pageCanvas, {
            x: pageCanvas.width * 0.008,
            y: pageCanvas.height * 0.11,
            width: pageCanvas.width * 0.16,
            height: pageCanvas.height * 0.77
        });
        const teacherSamples = [
            window.rotateCanvas(teacherArea, 90),
            window.rotateCanvas(teacherArea, -90),
            window.rotateCanvas(window.cropCanvas(teacherArea, {
                x: teacherArea.width * 0.05,
                y: teacherArea.height * 0.02,
                width: teacherArea.width * 0.9,
                height: teacherArea.height * 0.96
            }), 90)
        ];
        const rawTexts = [];
        for(let index = 0; index < teacherSamples.length; index += 1) {
            const sample = teacherSamples[index];
            const prepared = window.prepareTeacherScheduleOcrCanvas(sample, { scale: 3.6, threshold: index === 0 ? 214 : 224 });
            rawTexts.push(await window.runTeacherScheduleOcr(worker, prepared, { tessedit_pageseg_mode: index === 1 ? '5' : '6', preserve_interword_spaces: '1' }));
        }
        rawTexts.push(String(fileLabel || '').replace(/\.[^.]+$/, ''));
        const matchedTeacher = window.findBestTeacherScheduleMatch(rawTexts.join(' '));
        if(matchedTeacher) {
            return {
                teacherName: matchedTeacher.name,
                department: matchedTeacher.department || '漫畫系',
                scheduleKey: matchedTeacher.scheduleKey
            };
        }
        const selectedTeacher = window.getTeacherByScheduleKey(window.currentAdminTeacherScheduleKey);
        const extractedName = window.extractTeacherScheduleNameCandidate(rawTexts.join(' ')) || String(fileLabel || '未命名老師').replace(/\.[^.]+$/, '');
        if(selectedTeacher && (!extractedName || /^資產/i.test(extractedName) || /^\d+$/.test(extractedName))) {
            return {
                teacherName: selectedTeacher.name,
                department: selectedTeacher.department || '漫畫系',
                scheduleKey: selectedTeacher.scheduleKey
            };
        }
        return {
            teacherName: extractedName || '未命名老師',
            department: '漫畫系',
            scheduleKey: ''
        };
    };

    window.extractTeacherScheduleLocation = function(text) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        const locationMatch = normalized.match(/(Y棟一樓走廊【櫥窗】|[A-Z]{1,2}\d{3,4}(?:-\d+)?(?:\s*展覽空間)?)/i);
        return locationMatch ? locationMatch[1].replace(/\s+/g, ' ').trim() : '';
    };

    window.parseTeacherScheduleCellText = function(rawText) {
        const lines = String(rawText || '')
            .split(/\n+/)
            .map(line => line.replace(/[|｜]/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(Boolean);
        if(!lines.length) return null;
        const mergedText = lines.join(' ').trim();
        const location = window.extractTeacherScheduleLocation(mergedText);
        let courseName = mergedText;
        if(location) courseName = courseName.replace(location, ' ').replace(/\s+/g, ' ').trim();
        courseName = courseName.replace(/^(星期[一二三四五六日]|第?[一二三四五六七八九十\d]+節)\s*/g, '').trim();
        const meaningfulText = courseName.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '');
        if(meaningfulText.length < 3) return null;
        return {
            courseName: courseName || '未命名課程',
            location: location || '未指定'
        };
    };

    window.readTeacherScheduleCellContent = async function(worker, cropCanvas) {
        const variants = [
            (() => {
                const target = window.createCanvas(cropCanvas.width * 3.8, cropCanvas.height * 3.8);
                const ctx = target.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, target.width, target.height);
                ctx.drawImage(cropCanvas, 0, 0, target.width, target.height);
                return target;
            })(),
            window.prepareTeacherScheduleOcrCanvas(cropCanvas, { scale: 3.4, threshold: 208 }),
            window.prepareTeacherScheduleOcrCanvas(cropCanvas, { scale: 3.6, threshold: 226 })
        ];
        let bestText = '';
        for(let index = 0; index < variants.length; index += 1) {
            const text = await window.runTeacherScheduleOcr(worker, variants[index], {
                tessedit_pageseg_mode: index === 0 ? '6' : (index === 1 ? '11' : '4'),
                preserve_interword_spaces: '1'
            });
            if(text.replace(/\s+/g, '').length > bestText.replace(/\s+/g, '').length) bestText = text;
            if(bestText.replace(/\s+/g, '').length >= 6) break;
        }
        return window.parseTeacherScheduleCellText(bestText);
    };

    window.getTeacherScheduleTemplatePeriodIds = function() {
        const ids = (window.periodList || []).slice(0, 10).map(period => String(period.id));
        return ids.length === 10 ? ids : ['1', '2', '3', '4', '中午', '6', '7', '8', '9', '10'];
    };

    window.parseTeacherScheduleTemplateCanvas = async function(worker, pageCanvas, fileLabel) {
        const teacherInfo = await window.matchTeacherSchedulePageTeacher(worker, pageCanvas, fileLabel);
        const { periodIds, dayBounds, rowBounds } = window.getTeacherScheduleTemplateGridMeta(pageCanvas);
        const schedules = [];

        for(let rowIndex = 0; rowIndex < periodIds.length; rowIndex += 1) {
            for(let day = 1; day <= 5; day += 1) {
                const left = dayBounds[day];
                const right = dayBounds[day + 1];
                const top = rowBounds[rowIndex];
                const bottom = rowBounds[rowIndex + 1];
                const crop = window.cropCanvas(pageCanvas, {
                    x: left + (right - left) * 0.1,
                    y: top + (bottom - top) * 0.12,
                    width: (right - left) * 0.82,
                    height: (bottom - top) * 0.76
                });
                if(window.getTeacherScheduleCanvasInkRatio(crop) < 0.008) continue;
                const parsedCell = await window.readTeacherScheduleCellContent(worker, crop);
                if(!parsedCell) continue;
                schedules.push({
                    day,
                    periodId: periodIds[rowIndex],
                    courseName: parsedCell.courseName,
                    location: parsedCell.location
                });
            }
        }

        if(!schedules.length) return null;
        return {
            teacherName: teacherInfo.teacherName,
            department: teacherInfo.department || '漫畫系',
            schedules
        };
    };

    window.parseTeacherScheduleTemplateFile = async function(file) {
        if(!window.Tesseract) throw new Error('OCR 模組尚未載入，請確認目前網路可讀取外部腳本後重新整理頁面。');
        const pages = await window.getTeacherScheduleImportPages(file);
        const worker = await window.Tesseract.createWorker('chi_tra+eng');
        try {
            const parsedResults = [];
            for(let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
                const page = pages[pageIndex];
                window.teacherScheduleAiState.progress = '正在辨識 ' + page.label + '（第 ' + (pageIndex + 1) + ' / ' + pages.length + ' 頁）';
                window.renderTeacherScheduleAiState();
                const parsed = await window.parseTeacherScheduleTemplateCanvas(worker, page.canvas, page.label);
                if(parsed) parsedResults.push(parsed);
            }
            return parsedResults;
        } finally {
            if(worker && worker.terminate) await worker.terminate();
        }
    };

    window.handleTeacherScheduleExcelImport = async function(event) {
        if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以使用課表匯入', 'error');
        const files = Array.from((event && event.target && event.target.files) || []);
        if(!files.length) return;
        window.teacherScheduleAiState = { isProcessing: true, progress: '', errorMsg: '', successMsg: '', parsedDataList: [] };
        window.renderTeacherScheduleAiState();
        let mergedResults = [];
        try {
            const selectedTeacher = window.getTeacherByScheduleKey(window.currentAdminTeacherScheduleKey);
            for(let index = 0; index < files.length; index += 1) {
                const file = files[index];
                window.teacherScheduleAiState.progress = '正在解析 Excel ' + (index + 1) + ' / ' + files.length + '：' + file.name;
                window.renderTeacherScheduleAiState();
                let rawResult = await window.parseTeacherScheduleExcelFile(file, selectedTeacher);
                if(selectedTeacher && window.shouldBindExcelImportToSelectedTeacher(rawResult)) {
                    rawResult = window.bindTeacherScheduleImportToSelectedTeacher(rawResult, selectedTeacher);
                }
                const mapped = window.mapTeacherScheduleAiResults(rawResult);
                mergedResults = window.mergeTeacherScheduleAiParsedData(mergedResults, mapped);
                window.teacherScheduleAiState.parsedDataList = mergedResults;
                window.renderTeacherScheduleAiState();
            }
            if(!mergedResults.length) {
                window.teacherScheduleAiState.errorMsg = 'Excel 內沒有找到可辨識的課表資料。請確認內容包含星期、節次與課程欄位，或使用週課表格式再試一次。';
            }
        } catch(error) {
            window.teacherScheduleAiState.errorMsg = 'Excel 匯入失敗：' + (error && error.message ? error.message : '未知錯誤');
        } finally {
            window.teacherScheduleAiState.isProcessing = false;
            window.teacherScheduleAiState.progress = '';
            if(event && event.target) event.target.value = '';
            window.renderTeacherScheduleAiState();
        }
    };

    window.handleTeacherScheduleAiImport = async function(event) {
        if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以使用課表匯入', 'error');
        const files = Array.from((event && event.target && event.target.files) || []);
        if(!files.length) return;
        window.teacherScheduleAiState = { isProcessing: true, progress: '', errorMsg: '', successMsg: '', parsedDataList: [] };
        window.renderTeacherScheduleAiState();
        let mergedResults = [];
        try {
            const selectedTeacher = window.getTeacherByScheduleKey(window.currentAdminTeacherScheduleKey);
            for(let index = 0; index < files.length; index += 1) {
                const file = files[index];
                window.teacherScheduleAiState.progress = '正在處理檔案 ' + (index + 1) + ' / ' + files.length + '：' + file.name + '（Gemini AI）';
                window.renderTeacherScheduleAiState();
                let rawResult = [];
                try {
                    rawResult = await window.parseTeacherScheduleFileWithGeminiCells(file, selectedTeacher);
                    rawResult = window.bindTeacherScheduleImportToSelectedTeacher(rawResult, selectedTeacher);
                    if(!rawResult.length) throw new Error('cell-gemini-empty');
                } catch(aiCellError) {
                    try {
                        window.teacherScheduleAiState.progress = '單格 Gemini 未取得有效結果，改用整頁 Gemini：' + file.name;
                        window.renderTeacherScheduleAiState();
                        const geminiParts = await window.getTeacherScheduleGeminiParts(file);
                        rawResult = await window.processTeacherScheduleWithGemini(geminiParts, selectedTeacher);
                        rawResult = window.bindTeacherScheduleImportToSelectedTeacher(rawResult, selectedTeacher);
                        if(!rawResult.length) throw new Error('page-gemini-empty');
                    } catch(aiPageError) {
                        window.teacherScheduleAiState.progress = 'Gemini AI 未取得有效結果，改用固定版型備援：' + file.name;
                        window.renderTeacherScheduleAiState();
                        rawResult = await window.parseTeacherScheduleTemplateFile(file);
                        rawResult = window.bindTeacherScheduleImportToSelectedTeacher(rawResult, selectedTeacher);
                    }
                }
                const mapped = window.mapTeacherScheduleAiResults(rawResult);
                mergedResults = window.mergeTeacherScheduleAiParsedData(mergedResults, mapped);
                window.teacherScheduleAiState.parsedDataList = mergedResults;
                window.renderTeacherScheduleAiState();
            }
            if(!mergedResults.length) {
                window.teacherScheduleAiState.errorMsg = 'AI 與備援辨識都未能取得有效課表。建議先在後台選好教師，再重新上傳同一份 PDF。';
            }
        } catch(error) {
            window.teacherScheduleAiState.errorMsg = '課表解析失敗：' + (error && error.message ? error.message : '未知錯誤');
        } finally {
            window.teacherScheduleAiState.isProcessing = false;
            window.teacherScheduleAiState.progress = '';
            if(event && event.target) event.target.value = '';
            window.renderTeacherScheduleAiState();
        }
    };

    window.clearTeacherScheduleAiPreview = function() {
        window.teacherScheduleAiState = { isProcessing: false, progress: '', errorMsg: '', successMsg: '', parsedDataList: [] };
        window.renderTeacherScheduleAiState();
    };

    window.confirmTeacherScheduleAiImport = async function() {
        const parsedDataList = (window.teacherScheduleAiState && window.teacherScheduleAiState.parsedDataList) || [];
        if(!parsedDataList.length) return window.showToast('目前沒有可匯入的解析結果', 'error');
        parsedDataList.forEach(item => {
            const existingTeacherIndex = (window.teacherList || []).findIndex(teacher => teacher.scheduleKey === item.scheduleKey || teacher.name === item.teacherName);
            if(existingTeacherIndex >= 0) {
                if(!window.teacherList[existingTeacherIndex].department && item.department) {
                    window.teacherList[existingTeacherIndex].department = item.department;
                }
            } else {
                (window.teacherList = window.teacherList || []).push({
                    name: item.teacherName,
                    empId: '',
                    department: item.department || '漫畫系',
                    position: '專任',
                    identity: '一般教師',
                    phone: '',
                    email: '',
                    scheduleKey: item.scheduleKey
                });
            }
            window.teacherSchedules = (window.teacherSchedules || []).filter(schedule => schedule.scheduleKey !== item.scheduleKey);
            window.teacherSchedules.push(...(item.schedules || []).map(schedule => ({ ...schedule })));
        });
        window.showToast('同步中...', 'success');
        if(await window.saveSettingsToCloud()) {
            window.setTeacherScheduleBoardDirty(false);
            window.teacherScheduleAiState = { isProcessing: false, progress: '', errorMsg: '', successMsg: '成功匯入 ' + parsedDataList.length + ' 位教師的課表。', parsedDataList: [] };
            window.syncTeacherScheduleViews();
            window.renderAdminTeachers();
            window.renderTeacherScheduleAiState();
            window.showToast('課表已匯入');
        } else {
            window.teacherScheduleAiState.errorMsg = '課表已解析，但寫入正式資料失敗。' + (window.lastSettingsSaveError ? ' 原因：' + window.lastSettingsSaveError : '');
            window.renderTeacherScheduleAiState();
            window.showToast('匯入失敗', 'error');
        }
    };

    window.closeTeacherScheduleSearchResults = function() {
        const results = $('teacher-schedule-search-results');
        if(results) {
            results.classList.add('hidden');
            results.style.display = 'none';
        }
    };

    window.renderTeacherScheduleSearchResults = function(query) {
        const results = $('teacher-schedule-search-results');
        if(!results) return;
        const matches = window.findTeacherScheduleMatches(query).slice(0, 8);
        if(!String(query || '').trim()) {
            window.closeTeacherScheduleSearchResults();
            return;
        }
        if(matches.length === 0) {
            results.innerHTML = '<div class="px-4 py-4 text-center text-sm font-bold text-slate-400">查無符合的教師資料</div>';
        } else {
            results.innerHTML = matches.map(teacher => (
                '<button type="button" class="teacher-schedule-result" data-schedule-key="' + window.escapeHtml(teacher.scheduleKey) + '" onclick="window.selectTeacherScheduleTeacher(this.dataset.scheduleKey)">' +
                    '<div class="min-w-0">' +
                        '<div class="truncate text-[0.98rem] font-black text-slate-800">' + window.escapeHtml(teacher.name || '未命名教師') + '</div>' +
                        '<div class="mt-1 truncate text-xs font-medium text-slate-500">' + window.escapeHtml(teacher.department || '未指定系所') + '</div>' +
                    '</div>' +
                '</button>'
            )).join('');
        }
        results.classList.remove('hidden');
        results.style.display = 'block';
    };

    window.handleTeacherScheduleSearchInput = function() {
        const input = $('teacher-schedule-search-input');
        window.renderTeacherScheduleSearchResults(input ? input.value : '');
    };

    window.selectTeacherScheduleTeacher = function(scheduleKey) {
        const teacher = window.getTeacherByScheduleKey(scheduleKey);
        if(!teacher) return window.showToast('找不到教師資料', 'error');
        window.currentTeacherScheduleTeacherKey = scheduleKey;
        if($('teacher-schedule-search-input')) $('teacher-schedule-search-input').value = teacher.name || '';
        window.closeTeacherScheduleSearchResults();
        window.renderTeacherSchedulePublicView();
    };

    window.clearTeacherScheduleSelection = function() {
        window.currentTeacherScheduleTeacherKey = '';
        if($('teacher-schedule-search-input')) $('teacher-schedule-search-input').value = '';
        window.closeTeacherScheduleSearchResults();
        window.renderTeacherSchedulePublicView();
    };

    window.submitTeacherScheduleLookup = function(event) {
        if(event && event.preventDefault) event.preventDefault();
        const query = $('teacher-schedule-search-input') ? $('teacher-schedule-search-input').value.trim() : '';
        const matches = window.findTeacherScheduleMatches(query);
        if(matches.length === 0) return window.showToast('查無符合的教師資料', 'error');
        const normalizedQuery = query.toLowerCase();
        const exact = matches.find(teacher => [teacher.name, teacher.empId, teacher.department].some(value => String(value || '').toLowerCase() === normalizedQuery));
        window.selectTeacherScheduleTeacher((exact || matches[0]).scheduleKey);
    };

    window.renderTeacherSchedulePublicView = function() {
        const selectedShell = $('teacher-schedule-selected-shell');
        const emptyState = $('teacher-schedule-empty-state');
        const board = $('teacher-schedule-public-board');
        const teacher = window.getTeacherByScheduleKey(window.currentTeacherScheduleTeacherKey);
        const isPublicTeacher = teacher && String(teacher.position || '').trim() !== '其他';

        if(!teacher || !isPublicTeacher) {
            window.currentTeacherScheduleTeacherKey = '';
            if(selectedShell) {
                selectedShell.classList.add('hidden');
                selectedShell.style.display = 'none';
            }
            if(emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.style.display = 'block';
            }
            if(board) board.innerHTML = '';
            return;
        }

        const summary = window.getTeacherScheduleSummary(teacher.scheduleKey);
        if($('teacher-schedule-selected-name')) $('teacher-schedule-selected-name').innerText = (teacher.name || '未命名教師') + ' 的課表';
        if($('teacher-schedule-selected-meta')) {
            $('teacher-schedule-selected-meta').innerText = (teacher.department || '未指定系所') + ' ｜ ' + (teacher.position || '未設定職位');
        }
        if(board) {
            board.innerHTML =
                '<div class="grid gap-4 md:grid-cols-3">' +
                    '<div class="teacher-schedule-summary-card"><div class="text-[0.74rem] font-black uppercase tracking-[0.2em] text-blue-500">本週排課</div><div class="mt-3 text-3xl font-black text-slate-900">' + summary.totalSessions + '</div><p class="mt-2 text-sm font-medium text-slate-500">以節次為單位計算。</p></div>' +
                    '<div class="teacher-schedule-summary-card"><div class="text-[0.74rem] font-black uppercase tracking-[0.2em] text-blue-500">授課日數</div><div class="mt-3 text-3xl font-black text-slate-900">' + summary.totalDays + '</div><p class="mt-2 text-sm font-medium text-slate-500">本週實際上課的天數。</p></div>' +
                    '<div class="teacher-schedule-summary-card"><div class="text-[0.74rem] font-black uppercase tracking-[0.2em] text-blue-500">授課地點</div><div class="mt-3 text-3xl font-black text-slate-900">' + summary.totalLocations + '</div><p class="mt-2 text-sm font-medium text-slate-500">已填入的不同教室或場域。</p></div>' +
                '</div>' +
                window.buildTeacherScheduleGridHtml(teacher.scheduleKey, false);
        }
        if(selectedShell) {
            selectedShell.classList.remove('hidden');
            selectedShell.style.display = 'block';
        }
        if(emptyState) {
            emptyState.classList.add('hidden');
            emptyState.style.display = 'none';
        }
        if(window.lucide) window.lucide.createIcons();
    };

    window.populateAdminTeacherScheduleSelect = function() {
        const select = $('schedule-admin-teacher-select');
        if(!select) return;
        if((window.teacherList || []).length === 0) {
            select.innerHTML = '<option value="">目前沒有教師資料</option>';
            return;
        }
        select.innerHTML = (window.teacherList || []).map(teacher => (
            '<option value="' + window.escapeHtml(teacher.scheduleKey) + '">' + window.escapeHtml((teacher.name || '未命名教師') + '｜' + (teacher.department || '未指定系所')) + '</option>'
        )).join('');
        if(!window.currentAdminTeacherScheduleKey && window.teacherList[0]) {
            window.currentAdminTeacherScheduleKey = window.teacherList[0].scheduleKey;
        }
        if(window.currentAdminTeacherScheduleKey) {
            select.value = window.currentAdminTeacherScheduleKey;
        }
    };

    window.renderAdminTeacherScheduleSection = function() {
        const board = $('teacher-schedule-admin-board');
        const caption = $('schedule-admin-teacher-caption');
        window.resetTeacherScheduleDragState();
        window.populateAdminTeacherScheduleSelect();
        window.renderTeacherScheduleAiState();
        window.syncTeacherScheduleDraftUi();
        const teacher = window.getTeacherByScheduleKey(window.currentAdminTeacherScheduleKey);

        if(!teacher) {
            if(caption) caption.innerText = '請先建立教師資料，再開始編輯課表。';
            if(board) board.innerHTML = '<div class="room-detail-empty">目前沒有可編輯的教師資料</div>';
            return;
        }

        if($('schedule-admin-teacher-select')) $('schedule-admin-teacher-select').value = teacher.scheduleKey;
        if(caption) {
            caption.innerHTML =
                '<div class="font-black text-slate-800">' + window.escapeHtml(teacher.name || '未命名教師') + '</div>' +
                '<div class="mt-2 text-sm font-medium text-slate-500">系所：' + window.escapeHtml(teacher.department || '未指定系所') + '</div>' +
                '<div class="mt-1 text-sm font-medium text-slate-500">職號：' + window.escapeHtml(teacher.empId || '未設定') + ' ｜ 職位：' + window.escapeHtml(teacher.position || '未設定') + '</div>';
        }
        if(board) board.innerHTML = window.buildTeacherScheduleGridHtml(teacher.scheduleKey, true);
        if(window.lucide) window.lucide.createIcons();
    };

    window.handleAdminTeacherScheduleSelect = function() {
        const select = $('schedule-admin-teacher-select');
        window.currentAdminTeacherScheduleKey = select ? select.value : '';
        window.renderAdminTeacherScheduleSection();
    };

    window.openTeacherScheduleEditor = function(cell) {
        if(window.currentAdminRole !== 'super') return window.showToast('只有後台管理員可以編輯課表', 'error');
        if(!cell || !cell.dataset) return;
        const scheduleKey = cell.dataset.scheduleKey;
        const day = Number(cell.dataset.day);
        const periodId = String(cell.dataset.periodId);
        const teacher = window.getTeacherByScheduleKey(scheduleKey);
        const period = (window.periodList || []).find(item => String(item.id) === periodId);
        const weekday = (window.teacherScheduleWeekdays || []).find(item => Number(item.id) === day);
        const entry = window.findTeacherScheduleEntry(scheduleKey, day, periodId);
        if(!teacher || !period || !weekday) return;

        window.teacherScheduleEditContext = {
            scheduleKey,
            day,
            periodId,
            entryId: entry ? entry.id : ''
        };
        if($('teacher-schedule-editor-title')) $('teacher-schedule-editor-title').innerText = (teacher.name || '未命名教師') + '｜' + weekday.fullLabel + ' ' + (period.name || period.id);
        if($('teacher-schedule-editor-subtitle')) {
            const timeText = period.start && period.end && !(period.start === '00:00' && period.end === '00:00')
                ? period.start + ' - ' + period.end
                : '時間待設定';
            $('teacher-schedule-editor-subtitle').innerText = (teacher.department || '未指定系所') + ' ｜ ' + timeText;
        }
        if($('teacher-schedule-editor-course')) $('teacher-schedule-editor-course').value = entry ? (entry.courseName || '') : '';
        if($('teacher-schedule-editor-location')) $('teacher-schedule-editor-location').value = entry ? (entry.location || '') : '';
        if($('teacher-schedule-editor-delete')) {
            if(entry) show('teacher-schedule-editor-delete');
            else hide('teacher-schedule-editor-delete');
        }
        show('teacher-schedule-editor-modal');
        setTimeout(() => { if($('teacher-schedule-editor-course')) $('teacher-schedule-editor-course').focus(); }, 60);
    };

    window.closeTeacherScheduleEditor = function() {
        window.teacherScheduleEditContext = null;
        hide('teacher-schedule-editor-modal');
    };

    window.saveTeacherScheduleEntry = async function() {
        const context = window.teacherScheduleEditContext;
        if(!context) return;
        const courseName = $('teacher-schedule-editor-course') ? $('teacher-schedule-editor-course').value.trim() : '';
        const location = $('teacher-schedule-editor-location') ? $('teacher-schedule-editor-location').value.trim() : '';
        if(!courseName) return window.showToast('請輸入課程名稱', 'error');

        const existingIndex = (window.teacherSchedules || []).findIndex(entry => {
            if(context.entryId) return entry.id === context.entryId;
            return entry.scheduleKey === context.scheduleKey && Number(entry.day) === Number(context.day) && String(entry.periodId) === String(context.periodId);
        });
        const nextEntry = {
            id: existingIndex >= 0 ? window.teacherSchedules[existingIndex].id : 'ts-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            scheduleKey: context.scheduleKey,
            day: Number(context.day),
            periodId: String(context.periodId),
            courseName,
            location
        };

        if(existingIndex >= 0) window.teacherSchedules[existingIndex] = nextEntry;
        else window.teacherSchedules.push(nextEntry);

        window.showToast('同步中...', 'success');
        if(await window.saveSettingsToCloud()) {
            window.setTeacherScheduleBoardDirty(false);
            window.closeTeacherScheduleEditor();
            window.syncTeacherScheduleViews();
            window.showToast('課表已更新');
        } else {
            window.showToast('課表同步失敗', 'error');
        }
    };

    window.deleteTeacherScheduleEntry = async function() {
        const context = window.teacherScheduleEditContext;
        if(!context || !context.entryId) return;
        window.teacherSchedules = (window.teacherSchedules || []).filter(entry => entry.id !== context.entryId);
        window.showToast('同步中...', 'success');
        if(await window.saveSettingsToCloud()) {
            window.setTeacherScheduleBoardDirty(false);
            window.closeTeacherScheduleEditor();
            window.syncTeacherScheduleViews();
            window.showToast('課表已刪除');
        } else {
            window.showToast('刪除失敗', 'error');
        }
    };

    window.clearAdminTeacherScheduleEntries = function() {
        const teacher = window.getTeacherByScheduleKey(window.currentAdminTeacherScheduleKey);
        if(!teacher) return window.showToast('請先選擇教師', 'error');
        window.openConfirmModal('清空課表', '確定要清空 ' + (teacher.name || '該教師') + ' 的全部課表嗎？', async () => {
            window.teacherSchedules = (window.teacherSchedules || []).filter(entry => entry.scheduleKey !== teacher.scheduleKey);
            window.showToast('同步中...', 'success');
            if(await window.saveSettingsToCloud()) {
                window.setTeacherScheduleBoardDirty(false);
                window.syncTeacherScheduleViews();
                window.showToast('已清空教師課表');
            } else {
                window.showToast('清空失敗', 'error');
            }
        });
    };

    window.syncTeacherScheduleViews = function() {
        window.ensureTeacherScheduleTeacherDefaults();
        if(window.currentTeacherScheduleTeacherKey && !window.getTeacherByScheduleKey(window.currentTeacherScheduleTeacherKey)) {
            window.currentTeacherScheduleTeacherKey = '';
        }
        if(window.currentAdminTeacherScheduleKey && !window.getTeacherByScheduleKey(window.currentAdminTeacherScheduleKey)) {
            window.currentAdminTeacherScheduleKey = '';
        }
        if(!window.currentAdminTeacherScheduleKey && (window.teacherList || [])[0]) {
            window.currentAdminTeacherScheduleKey = window.teacherList[0].scheduleKey;
        }
        window.renderTeacherSchedulePublicView();
        if($('admin-tab') && $('admin-tab').classList.contains('active') && $('teacher-schedule-section') && !$('teacher-schedule-section').classList.contains('hidden')) {
            window.renderAdminTeacherScheduleSection();
        }
    };

    window.ensureTeacherScheduleTeacherDefaults();
