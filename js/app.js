let kuhouData = [], gokuData = [], activeTab = 'kuhou-list', kuhouSearchQuery = '', gokuSearchQuery = '', activeKuhouTags = [], activeGokuTags = [], currentModalSaveHandler = null, currentImportHandler = null;
const activeReveal = { reading: false, meaning: false, kakikudashi: false, translation: false };
let kuhouShuffleMode = false;
const kuhouShuffleOrder = new Map();
let studyHistory = [];
const modalOverlay = document.getElementById('modal-overlay'), modalContainer = document.getElementById('modal-container'), importFileInput = document.getElementById('import-file-input');
const kuhouSearchBox = document.getElementById('kuhou-search-box'), gokuSearchBox = document.getElementById('goku-search-box');

        const switchView = (tabId) => { activeTab = tabId; if (tabId === 'training' && trainingState.screen !== 'question') trainingState.screen = 'start'; document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `${tabId}-view`)); document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId)); render(); };
        const render = () => { if (activeTab === 'kuhou-list') renderKuhouList(); if (activeTab === 'goku-list') renderGokuList(); if (activeTab === 'training') renderTraining(); };
        

        const hideModal = () => { modalOverlay.classList.add('hidden'); modalContainer.classList.add('hidden'); modalContainer.innerHTML = ''; currentModalSaveHandler = null; };

        document.addEventListener('click', (e) => {
            const { target } = e;
            if (target.closest('.modal-actions')) { if (target.id === 'modal-save-btn' && currentModalSaveHandler) { currentModalSaveHandler(); } if (target.id === 'modal-cancel-btn') { hideModal(); } return; }
            if (target.id === 'modal-overlay') { hideModal(); return; }
            if (target.classList.contains('goku-link')) { const container = target.closest('.ex-value'); if (container && container.classList.contains('hidden-blur')) return; e.stopPropagation(); showGokuPopup(target.dataset.gokuId); return; }
            if (target.classList.contains('sg-check-btn')) { e.preventDefault(); e.stopPropagation(); const sgEl = target.closest('.subgroup'); const groupEl = target.closest('.kuhou-group'); const grp = kuhouData.find(g => g.groupId === Number(groupEl.dataset.groupId)); const sg = grp && grp.subgroups.find(s => s.subgroupId === Number(sgEl.dataset.subgroupId)); if (sg) { sg.checked = !sg.checked; saveData(); target.classList.toggle('checked'); target.textContent = sg.checked ? '★' : '☆'; } return; }
            if (target.classList.contains('ex-check-btn')) { e.preventDefault(); e.stopPropagation(); const exEl = target.closest('.kuhou-example'); const sgEl = target.closest('.subgroup'); const groupEl = target.closest('.kuhou-group'); const grp = kuhouData.find(g => g.groupId === Number(groupEl.dataset.groupId)); const sg = grp && grp.subgroups.find(s => s.subgroupId === Number(sgEl.dataset.subgroupId)); const ex = sg && sg.examples[Number(exEl.dataset.exampleIdx)]; if (ex) { ex.checked = !ex.checked; saveData(); target.classList.toggle('checked'); target.textContent = ex.checked ? '★' : '☆'; } return; }
            if (target.classList.contains('summary-value')) { e.preventDefault(); e.stopPropagation(); target.classList.toggle('hidden-blur'); return; }
            { const exv = target.closest('.ex-value'); if (exv && exv.dataset.field) { exv.classList.toggle('hidden-blur'); return; } }
            if (target.classList.contains('reveal-chip')) { const f = target.dataset.reveal; if (activeReveal[f]) { activeReveal[f] = false; } else { activeReveal[f] = true; } applyRevealState(); return; }
            if (target.closest('.subgroup > details > summary') && !target.closest('.actions')) { return; }
            const kuhouAction = target.closest('.kuhou-action'); if (kuhouAction) { const action = kuhouAction.dataset.action; if (action === 'import') { currentImportHandler = handleKuhouImport; importFileInput.click(); } else if (action === 'export-excel') exportData('kuhou'); else if (action === 'download-template') downloadTemplate('kuhou'); else if (action === 'load-preset') openPresetLoader(); else if (action === 'manage-tags') openTagManager(); else if (action === 'toggle-shuffle') { kuhouShuffleMode = !kuhouShuffleMode; if (!kuhouShuffleMode) kuhouShuffleOrder.clear(); else kuhouShuffleOrder.clear(); document.getElementById('kuhou-shuffle-btn').style.backgroundColor = kuhouShuffleMode ? '#f5b301' : '#555'; document.getElementById('kuhou-shuffle-btn').textContent = kuhouShuffleMode ? '🔀 シャッフル中' : '🔀 シャッフル'; render(); } return; }
            const gokuAction = target.closest('.goku-action'); if (gokuAction) { const action = gokuAction.dataset.action; if (action === 'import') { currentImportHandler = handleGokuImport; importFileInput.click(); } else if (action === 'export-excel') exportData('goku'); else if (action === 'download-template') downloadTemplate('goku'); else if (action === 'share') createShareLink(); return; }
            if (target.id === 'add-group-btn') { openGroupForm(); return; }
            if (target.id === 'add-goku-btn') { openGokuForm(); return; }
            const groupEl = target.closest('.kuhou-group');
            if(groupEl){
                const groupId = Number(groupEl.dataset.groupId); const group = kuhouData.find(g => g.groupId === groupId); if (!group) return;
                const subgroupEl = target.closest('.subgroup');
                if (subgroupEl) {
                    const subgroupId = Number(subgroupEl.dataset.subgroupId); const subgroup = group.subgroups.find(sg => sg.subgroupId === subgroupId); if (!subgroup) return;
                    if (target.classList.contains('toggle-all-btn')) { e.preventDefault(); const sgEl = target.closest('.subgroup'); sgEl.classList.toggle('sg-reveal-all'); target.textContent = sgEl.classList.contains('sg-reveal-all') ? '全非表示' : '全表示'; return; }
                    if (target.classList.contains('edit-subgroup-btn')) { e.preventDefault(); openSubgroupForm(group, subgroup); }
                    else if (target.classList.contains('delete-subgroup-btn')) { e.preventDefault(); if (confirm(`句法「${sanitizeHTML(subgroup.subgroupTitle)}」を削除しますか？`)) { group.subgroups = group.subgroups.filter(sg => sg.subgroupId !== subgroupId); saveAndRender(); } }
                } else {
                    if (target.classList.contains('add-subgroup-btn')) { e.preventDefault(); openSubgroupForm(group); }
                    else if (target.classList.contains('edit-group-btn')) { e.preventDefault(); openGroupForm(group); }
                    else if (target.classList.contains('delete-group-btn')) { e.preventDefault(); if (confirm(`グループ「${sanitizeHTML(group.groupTitle)}」を削除しますか？`)) { kuhouData = kuhouData.filter(g => g.groupId !== groupId); saveAndRender(); } }
                    else if (target.classList.contains('reorder-group-up-btn')) { e.preventDefault(); const i = kuhouData.indexOf(group); if (i > 0) { [kuhouData[i], kuhouData[i-1]] = [kuhouData[i-1], kuhouData[i]]; saveAndRender(); } }
                    else if (target.classList.contains('reorder-group-down-btn')) { e.preventDefault(); const i = kuhouData.indexOf(group); if (i < kuhouData.length - 1) { [kuhouData[i], kuhouData[i+1]] = [kuhouData[i+1], kuhouData[i]]; saveAndRender(); } }
                }
                return;
            }
            const gokuCardEl = target.closest('.goku-card');
            if (gokuCardEl) {
                const gokuId = Number(gokuCardEl.dataset.gokuId); const gokuItem = gokuData.find(g => g.id === gokuId); if (!gokuItem) return;
                if (target.classList.contains('edit-goku-btn')) { openGokuForm(gokuItem); }
                else if (target.classList.contains('delete-goku-btn')) { if (confirm(`語句「${sanitizeHTML(gokuItem.title)}」を削除しますか？`)) { gokuData = gokuData.filter(g => g.id !== gokuId); saveAndRender(); } }
                return;
            }
            if (target.id === 'tr-checked-only-chip') { trainingState.settings.checkedOnly = !trainingState.settings.checkedOnly; renderTraining(); return; }
            if (target.classList.contains('tr-sg-check')) { const q = trainingState.questions[trainingState.idx]; q.subgroup.checked = !q.subgroup.checked; saveData(); renderTraining(); return; }
            if (target.classList.contains('tr-ex-check')) { const q = trainingState.questions[trainingState.idx]; const ex = q.subgroup.examples[q.exIdx]; if (ex) { ex.checked = !ex.checked; saveData(); renderTraining(); } return; }
            if (target.classList.contains('tr-mode-chip')) { const m = target.dataset.mode; const arr = trainingState.settings.modes; const i = arr.indexOf(m); if (i>-1) arr.splice(i,1); else arr.push(m); renderTraining(); return; }
            if (target.classList.contains('tr-tag-chip')) { const t = target.dataset.tag; const arr = trainingState.settings.tags; const i = arr.indexOf(t); if (i>-1) arr.splice(i,1); else arr.push(t); renderTraining(); return; }
            if (target.id === 'tr-start-btn' || target.id === 'tr-retry-btn') { startTraining(); return; }
            if (target.id === 'tr-back-btn') { trainingState.screen = 'start'; renderTraining(); return; }
            if (target.classList.contains('tr-choice') && !trainingState.answered) { const q = trainingState.questions[trainingState.idx]; const pick = target.dataset.choice; trainingState.lastPick = pick; trainingState.lastCorrect = pick === q.answer; if (trainingState.lastCorrect) trainingState.correct++; trainingState.answered = true; renderTraining(); return; }
            if (target.id === 'tr-next-btn') { trainingState.answered = false; trainingState.idx++; if (trainingState.idx >= trainingState.questions.length) trainingState.screen = 'result'; renderTraining(); return; }
            if (target.classList.contains('toggle-visibility')) { const fieldEl = target.closest('.field'); if (fieldEl) { const contentEl = fieldEl.querySelector('.content'); if (contentEl) contentEl.classList.toggle('hidden'); } }
            if (target.classList.contains('toggle-summary')) { e.preventDefault(); e.stopPropagation(); const wrap = target.closest('.summary-field'); const val = wrap && wrap.querySelector('.summary-value'); if (val) val.classList.toggle('hidden-blur'); }
        });
        document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.tab)));
        kuhouSearchBox.addEventListener('input', (e) => { kuhouSearchQuery = e.target.value; render(); });
        gokuSearchBox.addEventListener('input', (e) => { gokuSearchQuery = e.target.value; render(); });
        importFileInput.addEventListener('change', handleFileImport);
        loadData(); loadFromURL(); switchView(activeTab);

