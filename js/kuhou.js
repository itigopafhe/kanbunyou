        const applyRevealState = () => { const c = document.getElementById('kuhou-container'); if (!c) return; Object.keys(activeReveal).forEach(f => c.classList.toggle('reveal-' + f, activeReveal[f])); document.querySelectorAll('#kuhou-reveal-bar .reveal-chip').forEach(chip => chip.classList.toggle('active', !!activeReveal[chip.dataset.reveal])); };

        const renderKuhouList = () => {
            const container = document.getElementById('kuhou-container');
            const query = kuhouSearchQuery.toLowerCase();
            const searchFilteredData = query ? kuhouData.map(group => ({ ...group, subgroups: group.subgroups.filter(sg => { const exHit = (sg.examples||[]).some(ex => (ex.hakubun||'').toLowerCase().includes(query) || (ex.kakikudashi||'').toLowerCase().includes(query) || (ex.translation||'').toLowerCase().includes(query) || (ex.source||'').toLowerCase().includes(query)); return (group.groupTitle||'').toLowerCase().includes(query) || (sg.subgroupTitle||'').toLowerCase().includes(query) || (sg.reading||'').toLowerCase().includes(query) || (sg.meaning||'').toLowerCase().includes(query) || (sg.tags||[]).join(',').toLowerCase().includes(query) || (sg.explanation||'').toLowerCase().includes(query) || (sg.memo||'').toLowerCase().includes(query) || exHit; }) })).filter(group => group.subgroups.length > 0) : kuhouData;
            const allSubgroupsForTagging = searchFilteredData.flatMap(g => g.subgroups);
            const tagFilter = new TagFilter('kuhou-tag-filter-container', allSubgroupsForTagging, (newTags) => { activeKuhouTags = newTags; renderKuhouList(); });
            tagFilter.activeTags = activeKuhouTags; tagFilter.render();
            container.innerHTML = ''; let totalKuhouCount = 0;
            searchFilteredData.forEach((group, groupIndex) => {
                let filteredSubgroups = group.subgroups.filter(subgroup => activeKuhouTags.every(tag => (subgroup.tags || []).includes(tag)));
                if (kuhouShuffleMode) { let order = kuhouShuffleOrder.get(group.groupId); if (!order) { order = shuffle(filteredSubgroups.map(s => s.subgroupId)); kuhouShuffleOrder.set(group.groupId, order); } const byId = new Map(filteredSubgroups.map(s => [s.subgroupId, s])); filteredSubgroups = order.map(id => byId.get(id)).filter(Boolean).concat(filteredSubgroups.filter(s => !order.includes(s.subgroupId))); }
                if (filteredSubgroups.length === 0 && query) return;
                const groupEl = document.createElement('div'); groupEl.className = 'kuhou-group'; groupEl.dataset.groupId = group.groupId;
                const subgroupsHTML = filteredSubgroups.map(subgroup => {
                    totalKuhouCount++;
                    const tagsHTML = (subgroup.tags || []).map(tag => `<span class="card-tag">${highlightHTML(sanitizeHTML(tag), query)}</span>`).join('');
                    const examples = subgroup.examples || [];
                    const readingMatched = matchesQuery(subgroup.reading, query);
                    const meaningMatched = matchesQuery(subgroup.meaning, query);
                    const readingVal = highlightHTML(sanitizeHTML(subgroup.reading || ''), query);
                    const meaningVal = highlightHTML(sanitizeHTML(subgroup.meaning || ''), query);
                    const anyExampleMatch = examples.some(ex => matchesQuery(ex.hakubun, query) || matchesQuery(ex.kakikudashi, query) || matchesQuery(ex.translation, query) || matchesQuery(ex.source, query));
                    const explanationMatched = matchesQuery(subgroup.explanation, query) || matchesQuery(subgroup.memo, query);
                    const shouldOpen = !!query && (readingMatched || meaningMatched || anyExampleMatch || explanationMatched);
                    const summaryInfoHTML = `<div class="subgroup-summary-info">
                        <div class="summary-row"><button class="check-btn sg-check-btn ${subgroup.checked ? 'checked' : ''}" title="この句法をチェック">${subgroup.checked ? '★' : '☆'}</button><span class="subgroup-title">${highlightHTML(sanitizeHTML(subgroup.subgroupTitle), query)}</span></div>
                        ${readingVal ? `<div class="summary-field"><span class="label">読み</span><span class="value ${readingMatched?'':'hidden-blur'} summary-value" data-field="reading">${readingVal}</span></div>` : ''}
                        ${meaningVal ? `<div class="summary-field"><span class="label">訳</span><span class="value ${meaningMatched?'':'hidden-blur'} summary-value" data-field="meaning">${meaningVal}</span></div>` : ''}
                    </div>`;
                    const examplesHTML = examples.map((ex, i) => {
                        const hakuMatch = matchesQuery(ex.hakubun, query);
                        const kakiMatch = matchesQuery(ex.kakikudashi, query);
                        const transMatch = matchesQuery(ex.translation, query);
                        const srcMatch = matchesQuery(ex.source, query);
                        const proc = (raw, matched) => matched ? highlightHTML(sanitizeHTML(raw||''), query) : linkGokuTerms(sanitizeHTML(raw||''));
                        return `
                        <div class="kuhou-example" data-example-idx="${i}">
                            <button class="check-btn ex-check-btn ${ex.checked ? 'checked' : ''}" title="この例文をチェック">${ex.checked ? '★' : '☆'}</button>
                            <div class="kuhou-example-label">例文 ${i+1}</div>
                            <div class="ex-line"><span class="ex-label">白文</span><span class="ex-value">${proc(ex.hakubun, hakuMatch)}</span></div>
                            <div class="ex-line"><span class="ex-label">書き下し</span><span class="ex-value ${kakiMatch?'':'hidden-blur'}" data-field="kakikudashi">${proc(ex.kakikudashi, kakiMatch)}</span></div>
                            <div class="ex-line"><span class="ex-label">日本語訳</span><span class="ex-value ${transMatch?'':'hidden-blur'}" data-field="translation">${proc(ex.translation, transMatch)}</span></div>
                            ${ex.source ? `<div class="ex-source">— ${srcMatch ? highlightHTML(sanitizeHTML(ex.source), query) : sanitizeHTML(ex.source)}</div>` : ''}
                        </div>`;
                    }).join('');
                    const explHTML = subgroup.explanation ? highlightHTML(sanitizeHTML(subgroup.explanation), query) : '';
                    const memoHTML = subgroup.memo ? highlightHTML(sanitizeHTML(subgroup.memo), query) : '';
                    const detailsOpenAttr = (shouldOpen && explanationMatched) ? ' open' : '';
                    const detailsHTML = (subgroup.explanation || subgroup.memo) ? `<details class="details-section"${detailsOpenAttr}><summary>解説・メモ</summary><div class="details-content">${explHTML ? `<p><strong>解説</strong>${explHTML}</p>` : ''}${memoHTML ? `<p><strong>メモ</strong>${memoHTML}</p>` : ''}</div></details>` : '';
                    return `<div class="subgroup" data-subgroup-id="${subgroup.subgroupId}"><details${shouldOpen ? ' open' : ''}><summary class="subgroup-header">${summaryInfoHTML}<div class="actions"><button class="toggle-all-btn">全表示</button><button class="edit-subgroup-btn">編集</button><button class="delete-subgroup-btn delete-btn">削除</button></div></summary><div class="item-card-container"><div class="item-card">${examplesHTML}${detailsHTML}${tagsHTML ? `<div class="card-tags" style="margin-top:10px">${tagsHTML}</div>` : ''}</div></div></details></div>`;
                }).join('');
                if (filteredSubgroups.length === 0 && !query) { groupEl.innerHTML = `<div class="kuhou-group-header"><span class="kuhou-group-title">${highlightHTML(sanitizeHTML(group.groupTitle), query)}</span><div class="actions"><button class="add-subgroup-btn">＋ 句法追加</button><button class="edit-group-btn">編集</button><button class="delete-group-btn delete-btn">削除</button><button class="reorder-group-up-btn reorder-btn" ${groupIndex === 0 ? 'disabled' : ''}>🔼</button><button class="reorder-group-down-btn reorder-btn" ${groupIndex === kuhouData.length - 1 ? 'disabled' : ''}>🔽</button></div></div><div class="subgroup-container" style="padding:15px; color:#888;">句法がありません。</div>`; }
                else { groupEl.innerHTML = `<div class="kuhou-group-header"><span class="kuhou-group-title">${highlightHTML(sanitizeHTML(group.groupTitle), query)}</span><div class="actions"><button class="add-subgroup-btn">＋ 句法追加</button><button class="edit-group-btn">編集</button><button class="delete-group-btn delete-btn">削除</button><button class="reorder-group-up-btn reorder-btn" ${groupIndex === 0 ? 'disabled' : ''}>🔼</button><button class="reorder-group-down-btn reorder-btn" ${groupIndex === kuhouData.length - 1 ? 'disabled' : ''}>🔽</button></div></div><div class="subgroup-container">${subgroupsHTML}</div>`; }
                container.appendChild(groupEl);
            });
            document.getElementById('kuhou-count-display').textContent = `${totalKuhouCount}件表示中`;
            applyRevealState();
        };

        const openTagManager = () => {
            const collectTags = () => { const map = new Map(); kuhouData.forEach(g => g.subgroups.forEach(sg => (sg.tags||[]).forEach(t => map.set(t, (map.get(t)||0)+1)))); return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0], 'ja')); };
            const build = () => {
                const rows = collectTags();
                if (rows.length === 0) return '<p style="color:var(--muted)">タグが登録されていません。</p>';
                return `<div style="display:flex;flex-direction:column;gap:8px">${rows.map(([tag, cnt]) => `<div style="display:flex;gap:8px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:8px" data-tag="${sanitizeHTML(tag)}"><input type="text" class="tag-rename-input" value="${sanitizeHTML(tag)}" style="flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:15px"><span style="color:var(--muted);font-size:12px;min-width:40px;text-align:right">${cnt}件</span><button type="button" class="tag-rename-btn" style="background:var(--secondary-color);color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer">名変更</button><button type="button" class="tag-delete-btn" style="background:var(--danger-color);color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer">削除</button></div>`).join('')}</div>`;
            };
            showModal('タグ管理', `<div id="tag-manager">${build()}</div>`, () => hideModal());
            const container = document.getElementById('tag-manager');
            container.addEventListener('click', e => {
                const row = e.target.closest('[data-tag]'); if (!row) return;
                const oldTag = row.dataset.tag;
                if (e.target.classList.contains('tag-rename-btn')) {
                    const newTag = row.querySelector('.tag-rename-input').value.trim();
                    if (!newTag || newTag === oldTag) return;
                    kuhouData.forEach(g => g.subgroups.forEach(sg => { const idx = (sg.tags||[]).indexOf(oldTag); if (idx > -1) { sg.tags[idx] = newTag; sg.tags = [...new Set(sg.tags)]; } }));
                    saveData(); container.innerHTML = build();
                } else if (e.target.classList.contains('tag-delete-btn')) {
                    if (!confirm(`タグ「${oldTag}」を全ての句法から削除します。よろしいですか？`)) return;
                    kuhouData.forEach(g => g.subgroups.forEach(sg => { if (sg.tags) sg.tags = sg.tags.filter(t => t !== oldTag); }));
                    saveData(); container.innerHTML = build();
                }
            });
        };


        const openGroupForm = (group = null) => { const isEdit = group !== null; const title = isEdit ? 'グループを編集' : '新規グループを追加'; const formHTML = `<form id="group-form-modal"><label>グループ名</label><input type="text" id="group-title" value="${isEdit ? sanitizeHTML(group.groupTitle) : ''}" required></form>`; showModal(title, formHTML, () => { const newTitle = document.getElementById('group-title').value.trim(); if (newTitle) { if (isEdit) { group.groupTitle = newTitle; } else { kuhouData.push({ groupId: Date.now(), groupTitle: newTitle, subgroups: [] }); } saveAndRender(); hideModal(); } }); };
        const openSubgroupForm = (group, subgroup = null) => {
            const isEdit = subgroup !== null; const tags = isEdit ? (subgroup.tags || []).join(', ') : ''; const title = isEdit ? '句法を編集' : '新規句法を追加'; const formSubgroupId = isEdit ? subgroup.subgroupId : Date.now();
            const selectableKuhou = kuhouData.flatMap(g => (g.subgroups || []).map(sg => ({ groupTitle: g.groupTitle, subgroup: sg }))).filter(({ subgroup: sg }) => String(sg.subgroupId) !== String(formSubgroupId));
            const createExHTML = (ex = {}, idx, existingIndex = '') => { const selectedIds = new Set((Array.isArray(ex.usedKuhouIds) ? ex.usedKuhouIds : []).map(String)); const selectorHTML = selectableKuhou.length ? `<details class="used-kuhou-selector"><summary>追加で使用されている句法</summary><div class="used-kuhou-note">所属句法は保存時に自動で含まれます。</div><div class="used-kuhou-options">${selectableKuhou.map(({ groupTitle, subgroup: sg }) => `<label><input type="checkbox" class="ex-used-kuhou" data-subgroup-id="${sanitizeHTML(sg.subgroupId)}" ${selectedIds.has(String(sg.subgroupId)) ? 'checked' : ''}> ${sanitizeHTML(groupTitle)}：${sanitizeHTML(sg.subgroupTitle)}</label>`).join('')}</div></details>` : ''; return `<fieldset class="kuhou-ex-form" data-existing-example-index="${existingIndex}" data-existing-used-kuhou-ids="${sanitizeHTML(JSON.stringify(Array.isArray(ex.usedKuhouIds) ? ex.usedKuhouIds : []))}"><legend>例文${idx!==undefined?' '+(idx+1):''}</legend><button type="button" class="delete-ex-btn delete-btn" style="float:right;">削除</button><label>白文</label><input type="text" class="ex-hakubun" value="${sanitizeHTML(ex.hakubun||'')}"><label>書き下し文</label><input type="text" class="ex-kakikudashi" value="${sanitizeHTML(ex.kakikudashi||'')}"><label>日本語訳</label><input type="text" class="ex-translation" value="${sanitizeHTML(ex.translation||'')}"><label>出典</label><input type="text" class="ex-source" value="${sanitizeHTML(ex.source||'')}">${selectorHTML}</fieldset>`; };
            const examples = (isEdit && Array.isArray(subgroup.examples)) ? subgroup.examples : [];
            const examplesHTML = examples.length ? examples.map((ex,i)=>createExHTML(ex,i,i)).join('') : createExHTML({},0);
            const formHTML = `<form id="subgroup-form-modal">
                <label>句法名</label><input type="text" id="subgroup-title" value="${isEdit ? sanitizeHTML(subgroup.subgroupTitle) : ''}" required placeholder="例: 不">
                <label>読み</label><input type="text" id="subgroup-reading" value="${isEdit ? sanitizeHTML(subgroup.reading || '') : ''}" placeholder="例: 〜せず">
                <label>訳</label><input type="text" id="subgroup-meaning" value="${isEdit ? sanitizeHTML(subgroup.meaning || '') : ''}" placeholder="例: 〜しない">
                <label>タグ(カンマ区切り)</label><input type="text" id="tags" value="${sanitizeHTML(tags)}">
                <label>解説</label><textarea id="sg-explanation">${isEdit ? sanitizeHTML(subgroup.explanation || '') : ''}</textarea>
                <label>メモ</label><textarea id="sg-memo">${isEdit ? sanitizeHTML(subgroup.memo || '') : ''}</textarea>
                <div id="kuhou-examples-container">${examplesHTML}</div>
            </form>`;
            showModal(title, formHTML, () => {
                const form = document.getElementById('subgroup-form-modal'); const newSubgroupTitle = form.querySelector('#subgroup-title').value.trim(); if(!newSubgroupTitle) { alert('句法名は必須です。'); return; }
                const newTags = form.querySelector('#tags').value.split(',').map(t => t.trim()).filter(Boolean);
                const knownIds = new Map(kuhouData.flatMap(g => (g.subgroups || []).map(sg => [String(sg.subgroupId), sg.subgroupId])));
                const newExamples = [...form.querySelectorAll('.kuhou-ex-form')].map(fs => { const existingIndex = fs.dataset.existingExampleIndex; const existing = existingIndex === '' ? {} : (subgroup.examples[Number(existingIndex)] || {}); let existingUsedIds = []; try { existingUsedIds = JSON.parse(fs.dataset.existingUsedKuhouIds || '[]'); } catch (e) {} const selectedIds = [...fs.querySelectorAll('.ex-used-kuhou:checked')].map(input => knownIds.get(input.dataset.subgroupId)).filter(id => id !== undefined); const preservedUnknownIds = existingUsedIds.filter(id => !knownIds.has(String(id)) && String(id) !== String(formSubgroupId)); const additionalUsedIds = [...new Set([...preservedUnknownIds, ...selectedIds])].filter(id => String(id) !== String(formSubgroupId)); const next = { ...existing, hakubun: fs.querySelector('.ex-hakubun').value, kakikudashi: fs.querySelector('.ex-kakikudashi').value, translation: fs.querySelector('.ex-translation').value, source: fs.querySelector('.ex-source').value }; if (additionalUsedIds.length) next.usedKuhouIds = additionalUsedIds; else delete next.usedKuhouIds; return next; }).filter(ex => ex.hakubun || ex.kakikudashi || ex.translation || ex.source);
                const payload = { subgroupTitle: newSubgroupTitle, reading: form.querySelector('#subgroup-reading').value.trim(), meaning: form.querySelector('#subgroup-meaning').value.trim(), tags: newTags, explanation: form.querySelector('#sg-explanation').value, memo: form.querySelector('#sg-memo').value, examples: newExamples };
                if (isEdit) { Object.assign(subgroup, payload); delete subgroup.card; }
                else { group.subgroups.push({ subgroupId: formSubgroupId, ...payload }); }
                saveAndRender(); hideModal();
            }, `<button type="button" id="add-kuhou-ex-btn" class="btn btn-sub-action">＋ 例文を追加</button>`);
            document.getElementById('add-kuhou-ex-btn').addEventListener('click', () => { document.getElementById('kuhou-examples-container').insertAdjacentHTML('beforeend', createExHTML({}, document.querySelectorAll('.kuhou-ex-form').length)); });
            document.getElementById('kuhou-examples-container').addEventListener('click', e => { if (e.target.classList.contains('delete-ex-btn')) { if (document.querySelectorAll('.kuhou-ex-form').length > 1) { e.target.closest('.kuhou-ex-form').remove(); } else { e.target.closest('.kuhou-ex-form').querySelectorAll('input').forEach(i => i.value = ''); } } });
        };

