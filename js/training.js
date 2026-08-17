        const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
        const recordSession = (total, correct) => { const t = todayStr(); const entry = studyHistory.find(h => h.date === t); if (entry) { entry.total += total; entry.correct += correct; } else { studyHistory.push({ date: t, total, correct }); } localStorage.setItem('kanbunHistory', JSON.stringify(studyHistory)); };

        const trainingModes = { title2reading: '句法名 → 読み', title2meaning: '句法名 → 訳', hakubun2kakikudashi: '白文 → 書き下し', hakubun2translation: '白文 → 日本語訳', kakikudashi2translation: '書き下し → 日本語訳' };
        const kuhouTrainingModes = ['title2reading', 'title2meaning'];
        const exampleTrainingModes = ['hakubun2kakikudashi', 'hakubun2translation', 'kakikudashi2translation'];
        const trainingState = { screen: 'start', settings: { modes: ['title2reading', 'title2meaning', 'kakikudashi2translation'], count: 10, tags: [], checkedOnly: false }, questions: [], idx: 0, correct: 0, answered: false, lastCorrect: false };
        const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        const getAllSubgroups = () => kuhouData.flatMap(g => (g.subgroups || []).map(sg => ({ group: g, sg })));
        const getExampleUsedKuhouIds = (example, ownerSubgroup) => [...new Set([ownerSubgroup?.subgroupId, ...(Array.isArray(example?.usedKuhouIds) ? example.usedKuhouIds : [])].filter(id => id !== undefined && id !== null && id !== ''))];
        const getExampleUsedKuhou = (example, ownerSubgroup) => { const usedIds = new Set(getExampleUsedKuhouIds(example, ownerSubgroup).map(String)); return getAllSubgroups().filter(({ sg }) => usedIds.has(String(sg.subgroupId))); };
        const renderKuhouExplanation = (group, subgroup, index = null) => { const heading = index === null ? `${sanitizeHTML(group.groupTitle)} — ${sanitizeHTML(subgroup.subgroupTitle)}` : `${index}. ${sanitizeHTML(subgroup.subgroupTitle)}`; return `<div class="tr-used-kuhou"><strong>${heading}</strong>${subgroup.reading ? `<div>読み: ${sanitizeHTML(subgroup.reading)}</div>` : ''}${subgroup.meaning ? `<div>意味: ${sanitizeHTML(subgroup.meaning)}</div>` : ''}${subgroup.explanation ? `<div>解説: ${sanitizeHTML(subgroup.explanation)}</div>` : ''}</div>`; };
        const renderExampleExplanation = (question) => { const example = question.example || question.subgroup.examples?.[question.exIdx] || {}; const fields = [['白文', example.hakubun], ['書き下し', example.kakikudashi], ['現代語訳', example.translation]].filter(([, value]) => value); if (example.source) fields.push(['出典', example.source]); const usedKuhou = getExampleUsedKuhou(example, question.subgroup); return `<div class="tr-explanation tr-example-explanation">${fields.map(([label, value]) => `<div class="tr-example-field"><span>${label}</span><div>${sanitizeHTML(value)}</div></div>`).join('')}${usedKuhou.length ? `<div class="tr-used-kuhou-section"><div class="tr-used-kuhou-title">この例文で使われている句法</div>${usedKuhou.map(({ group, sg }, index) => renderKuhouExplanation(group, sg, index + 1)).join('')}</div>` : ''}</div>`; };
        const buildQuestion = (mode, pool) => {
            const shuffled = shuffle(pool);
            const checkedOnly = trainingState.settings.checkedOnly;
            const questionType = exampleTrainingModes.includes(mode) ? 'example' : 'kuhou';
            const pickTarget = (item) => {
                const { sg } = item;
                const findEx = (fn) => (sg.examples || []).find(ex => fn(ex) && (!checkedOnly || ex.checked));
                if (checkedOnly && questionType === 'kuhou' && !sg.checked) return null;
                if (mode === 'title2reading') return sg.reading ? { prompt: sg.subgroupTitle, answer: sg.reading, distractorField: 'reading', exIdx: -1, example: null } : null;
                if (mode === 'title2meaning') return sg.meaning ? { prompt: sg.subgroupTitle, answer: sg.meaning, distractorField: 'meaning', exIdx: -1, example: null } : null;
                if (mode === 'hakubun2kakikudashi') { const example = findEx(ex => ex.hakubun && ex.kakikudashi); return example ? { prompt: example.hakubun, answer: example.kakikudashi, distractorField: 'exKakikudashi', exIdx: sg.examples.indexOf(example), example } : null; }
                if (mode === 'hakubun2translation') { const example = findEx(ex => ex.hakubun && ex.translation); return example ? { prompt: example.hakubun, answer: example.translation, distractorField: 'exTranslation', exIdx: sg.examples.indexOf(example), example } : null; }
                if (mode === 'kakikudashi2translation') { const example = findEx(ex => ex.kakikudashi && ex.translation); return example ? { prompt: example.kakikudashi, answer: example.translation, distractorField: 'exTranslation', exIdx: sg.examples.indexOf(example), example } : null; }
                return null;
            };
            for (const item of shuffled) {
                const t = pickTarget(item); if (!t) continue;
                const distractors = []; const seen = new Set([t.answer]);
                for (const other of shuffled) {
                    if (other === item) continue;
                    let val = null;
                    if (t.distractorField === 'exTranslation') { const ex = (other.sg.examples||[]).find(e => e.translation && e.translation !== t.answer); if (ex) val = ex.translation; }
                    else if (t.distractorField === 'exKakikudashi') { const ex = (other.sg.examples||[]).find(e => e.kakikudashi && e.kakikudashi !== t.answer); if (ex) val = ex.kakikudashi; }
                    else val = other.sg[t.distractorField];
                    if (val && !seen.has(val)) { distractors.push(val); seen.add(val); if (distractors.length >= 3) break; }
                }
                if (distractors.length < 3) continue;
                const choices = shuffle([t.answer, ...distractors]);
                return { questionType, mode, prompt: t.prompt, answer: t.answer, choices, subgroup: item.sg, group: item.group, exIdx: t.exIdx, example: t.example };
            }
            return null;
        };
        const buildQuestions = () => {
            const { modes, count, tags } = trainingState.settings;
            let pool = getAllSubgroups();
            if (tags.length) pool = pool.filter(({ sg }) => tags.every(t => (sg.tags||[]).includes(t)));
            const questions = [];
            for (let i = 0; i < count; i++) {
                const mode = modes[Math.floor(Math.random() * modes.length)];
                const q = buildQuestion(mode, pool);
                if (q) questions.push(q);
            }
            return questions;
        };
        const renderTraining = () => {
            const c = document.getElementById('training-container');
            if (trainingState.screen === 'start') {
                const allTags = [...new Set(getAllSubgroups().flatMap(({ sg }) => sg.tags || []))].sort((a,b)=>a.localeCompare(b,'ja'));
                const renderModeChips = (modes) => modes.map(key => `<button class="tr-chip tr-mode-chip ${trainingState.settings.modes.includes(key) ? 'active' : ''}" data-mode="${key}">${trainingModes[key]}</button>`).join('');
                const tagChips = allTags.length ? allTags.map(t => `<button class="tr-chip tr-tag-chip ${trainingState.settings.tags.includes(t) ? 'active' : ''}" data-tag="${sanitizeHTML(t)}">${sanitizeHTML(t)}</button>`).join('') : '<span style="color:var(--muted);font-size:13px">タグ未登録</span>';
                c.innerHTML = `${renderHistoryStats()}<div class="training-card"><h2>句法トレーニング（4択）</h2>
                    <div class="tr-section"><div class="tr-label">出題モード（複数選択可）</div><div class="tr-mode-group"><div class="tr-mode-group-label">句法</div><div class="tr-chips">${renderModeChips(kuhouTrainingModes)}</div></div><div class="tr-mode-group"><div class="tr-mode-group-label">例文</div><div class="tr-chips">${renderModeChips(exampleTrainingModes)}</div></div></div>
                    <div class="tr-section"><div class="tr-label">タグで絞り込み（AND、任意）</div><div class="tr-chips">${tagChips}</div></div>
                    <div class="tr-section"><div class="tr-label">出題範囲</div><div class="tr-chips"><button class="tr-chip" id="tr-checked-only-chip" style="${trainingState.settings.checkedOnly ? 'background:#f5b301;color:#fff;border-color:#f5b301' : ''}">★ チェック済みのみ</button></div></div>
                    <div class="tr-section"><div class="tr-label">問題数</div><input type="number" class="tr-count-input" id="tr-count" min="1" max="50" value="${trainingState.settings.count}"></div>
                    <button class="btn tr-start-btn" id="tr-start-btn">スタート</button></div>`;
            } else if (trainingState.screen === 'question') {
                const q = trainingState.questions[trainingState.idx];
                if (!q) { trainingState.screen = 'result'; renderTraining(); return; }
                const progress = ((trainingState.idx) / trainingState.questions.length) * 100;
                const questionLabel = trainingModes[q.mode];
                const choicesHTML = q.choices.map(ch => `<button class="tr-choice" data-choice="${sanitizeHTML(ch)}" ${trainingState.answered ? 'disabled' : ''}>${sanitizeHTML(ch)}</button>`).join('');
                const currentEx = q.questionType === 'example' ? (q.example || q.subgroup.examples?.[q.exIdx]) : null;
                const explainHTML = trainingState.answered ? `${q.questionType === 'example' ? renderExampleExplanation(q) : `<div class="tr-explanation">${renderKuhouExplanation(q.group, q.subgroup)}</div>`}<button class="btn tr-next-btn" id="tr-next-btn">${trainingState.idx + 1 >= trainingState.questions.length ? '結果を見る' : '次の問題 →'}</button>` : '';
                const checkRow = `<div class="tr-check-row"><button class="tr-check-toggle tr-sg-check ${q.subgroup.checked ? 'checked' : ''}">${q.subgroup.checked ? '★' : '☆'} 句法「${sanitizeHTML(q.subgroup.subgroupTitle)}」</button>${currentEx ? `<button class="tr-check-toggle tr-ex-check ${currentEx.checked ? 'checked' : ''}">${currentEx.checked ? '★' : '☆'} この例文</button>` : ''}</div>`;
                c.innerHTML = `<div class="training-card"><div class="tr-progress"><div style="width:${progress}%"></div></div><div class="tr-question-meta"><span>${trainingState.idx + 1} / ${trainingState.questions.length}</span><span>正解: ${trainingState.correct}</span></div>${checkRow}<div class="tr-question">${sanitizeHTML(questionLabel)}</div><div class="tr-question-body">${sanitizeHTML(q.prompt)}</div><div class="tr-choices">${choicesHTML}</div>${explainHTML}</div>`;
                if (trainingState.answered) {
                    c.querySelectorAll('.tr-choice').forEach(btn => { if (btn.dataset.choice === q.answer) btn.classList.add('correct'); else if (btn.dataset.choice === trainingState.lastPick && !trainingState.lastCorrect) btn.classList.add('wrong'); });
                }
            } else if (trainingState.screen === 'result') {
                const total = trainingState.questions.length;
                if (!trainingState.recorded && total > 0) { recordSession(total, trainingState.correct); trainingState.recorded = true; }
                const pct = total ? Math.round(trainingState.correct / total * 100) : 0;
                c.innerHTML = `<div class="training-card"><h2>結果</h2><div class="tr-result-score">${trainingState.correct} / ${total}</div><div class="tr-result-label">正答率 ${pct}%</div><div class="tr-result-actions"><button class="btn btn-cancel" id="tr-back-btn">設定に戻る</button><button class="btn tr-start-btn" id="tr-retry-btn" style="width:auto">もう一度</button></div></div>`;
            }
        };
        const startTraining = () => {
            const countEl = document.getElementById('tr-count'); if (countEl) trainingState.settings.count = Math.max(1, Math.min(50, Number(countEl.value) || 10));
            if (trainingState.settings.modes.length === 0) { alert('出題モードを1つ以上選択してください。'); return; }
            const qs = buildQuestions();
            if (qs.length === 0) { alert('条件に合う問題を作れません。句法データ（例文・読み・訳）が4件以上必要です。'); return; }
            trainingState.questions = qs; trainingState.idx = 0; trainingState.correct = 0; trainingState.answered = false; trainingState.screen = 'question'; trainingState.recorded = false; renderTraining();
        };
        const renderHistoryStats = () => {
            const totalQuestions = studyHistory.reduce((a,h)=>a+h.total,0);
            const totalCorrect = studyHistory.reduce((a,h)=>a+h.correct,0);
            const overallPct = totalQuestions ? Math.round(totalCorrect/totalQuestions*100) : 0;
            const dates = new Set(studyHistory.map(h=>h.date));
            let streak = 0; const d = new Date();
            while (true) { const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; if (dates.has(s)) { streak++; d.setDate(d.getDate()-1); } else break; }
            const last14 = []; const t = new Date();
            for (let i=13;i>=0;i--){ const dt=new Date(t); dt.setDate(dt.getDate()-i); const s=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; const e=studyHistory.find(h=>h.date===s); last14.push({date:s, total:e?e.total:0, correct:e?e.correct:0, label: `${dt.getMonth()+1}/${dt.getDate()}` }); }
            const maxTotal = Math.max(1, ...last14.map(d=>d.total));
            const bars = last14.map(d => { const h = d.total ? Math.max(4, (d.total/maxTotal)*60) : 2; const pct = d.total ? Math.round(d.correct/d.total*100) : 0; const color = d.total ? (pct >= 80 ? '#4caf50' : pct >= 50 ? '#f5b301' : '#e57373') : '#e0dccf'; return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0"><div style="width:100%;height:60px;display:flex;align-items:flex-end;justify-content:center"><div style="width:70%;height:${h}px;background:${color};border-radius:3px 3px 0 0" title="${d.date}: ${d.correct}/${d.total}"></div></div><div style="font-size:9px;color:var(--muted);white-space:nowrap">${d.label}</div></div>`; }).join('');
            return `<div class="training-card" style="margin-bottom:12px"><h2 style="margin-bottom:10px">学習履歴</h2><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px"><div><div style="font-size:11px;color:var(--muted)">累計問題</div><div style="font-size:20px;font-weight:700">${totalQuestions}</div></div><div><div style="font-size:11px;color:var(--muted)">累計正答率</div><div style="font-size:20px;font-weight:700">${overallPct}%</div></div><div><div style="font-size:11px;color:var(--muted)">連続学習日数</div><div style="font-size:20px;font-weight:700">${streak}日</div></div></div><div style="display:flex;gap:2px;align-items:flex-end">${bars}</div><div style="font-size:11px;color:var(--muted);text-align:center;margin-top:4px">直近14日</div></div>`;
        };

