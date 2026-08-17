        const linkGokuTerms = (sanitizedText) => {
            if (!sanitizedText || !gokuData.length) return sanitizedText;
            const items = [];
            gokuData.forEach(item => { const forms = [item.title, ...(item.variants || [])].filter(Boolean); forms.forEach(f => items.push({ form: f, sanitized: sanitizeHTML(f), id: item.id })); });
            if (items.length === 0) return sanitizedText;
            items.sort((a,b) => b.sanitized.length - a.sanitized.length);
            const byForm = new Map(items.map(i => [i.sanitized, i.id]));
            const re = new RegExp('(' + items.map(i => escapeRegExp(i.sanitized)).join('|') + ')', 'g');
            return sanitizedText.replace(re, (m) => `<span class="goku-link" data-goku-id="${byForm.get(m)}">${m}</span>`);
        };
        const showGokuPopup = (gokuId) => {
            const item = gokuData.find(g => g.id === Number(gokuId)); if (!item) return;
            const displayTitle = [item.title, ...(item.variants || [])].map(sanitizeHTML).join('・');
            const entriesHTML = (item.entries || []).map(e => `<div style="border-top:1px dashed #ddd;padding-top:8px;margin-top:8px"><div style="font-weight:700">${sanitizeHTML(e.reading || '')}<span style="font-weight:normal;color:var(--muted);font-size:12px;margin-left:6px">${sanitizeHTML(e.partOfSpeech || '')}</span></div><ol style="padding-left:20px;margin:6px 0">${(e.meanings||[]).map(m => `<li>${sanitizeHTML(m)}</li>`).join('')}</ol></div>`).join('');
            const content = `<div><h3 style="margin:0 0 8px">${displayTitle}</h3>${entriesHTML}${item.commonMemo?`<div style="margin-top:10px;padding:8px;background:#f7f4ec;border-radius:6px;font-size:13px">${sanitizeHTML(item.commonMemo)}</div>`:''}</div>`;
            modalContainer.innerHTML = `<h2>語句</h2><div class="modal-content">${content}</div><div class="modal-actions"><button id="modal-cancel-btn" class="btn btn-cancel">閉じる</button></div>`;
            modalOverlay.classList.remove('hidden'); modalContainer.classList.remove('hidden'); currentModalSaveHandler = null;
        };

        const renderGokuList = () => {
            const container = document.getElementById('goku-container'); const query = gokuSearchQuery.toLowerCase();
            const searchFilteredGoku = query ? gokuData.filter(item => { return (item.title||'').toLowerCase().includes(query) || (item.variants||[]).some(v => v.toLowerCase().includes(query)) || (item.tags||[]).join(',').toLowerCase().includes(query) || (item.commonMemo||'').toLowerCase().includes(query) || (item.entries||[]).some(entry => (entry.reading||'').toLowerCase().includes(query) || (entry.partOfSpeech||'').toLowerCase().includes(query) || (entry.meanings||[]).join(',').toLowerCase().includes(query) || (entry.example?.hakubun||'').toLowerCase().includes(query) || (entry.example?.kakikudashi||'').toLowerCase().includes(query) || (entry.example?.translation||'').toLowerCase().includes(query))}) : gokuData;
            const tagFilter = new TagFilter('goku-tag-filter-container', searchFilteredGoku, (newTags) => { activeGokuTags = newTags; renderGokuList(); });
            tagFilter.activeTags = activeGokuTags; tagFilter.render();
            const filteredGoku = searchFilteredGoku.filter(item => activeGokuTags.every(tag => (item.tags || []).includes(tag)));
            container.innerHTML = '';
            filteredGoku.forEach(item => {
                const card = document.createElement('div'); card.className = 'item-card goku-card'; card.dataset.gokuId = item.id;
                const displayTitle = [item.title, ...(item.variants || [])].map(sanitizeHTML).join('・');
                const tagsHTML = (item.tags || []).map(tag => `<span class="card-tag">${sanitizeHTML(tag)}</span>`).join('');
                const entriesHTML = (item.entries || []).map(entry => { const sanitizedMeanings = (entry.meanings || []).map(m => `<li>${sanitizeHTML(m)}</li>`).join(''); const exHTML = entry.example?.hakubun ? `<details class="details-section" style="margin-top:0; font-size:0.9em;"><summary>例文</summary><div class="details-content"><p>${sanitizeHTML(entry.example.hakubun)}<br>${sanitizeHTML(entry.example.kakikudashi)}<br>${sanitizeHTML(entry.example.translation)}</p></div></details>` : ''; return `<div class="goku-entry"><div class="goku-entry-header"><span>${sanitizeHTML(entry.reading) || '読み未設定'}</span><span class="goku-entry-pos">${sanitizeHTML(entry.partOfSpeech) || ''}</span></div><ol class="goku-entry-meanings">${sanitizedMeanings}</ol>${exHTML}</div>`}).join('');
                const commonDetailsHTML = (item.commonMemo || item.photo) ? `<details class="details-section"><summary>共通メモ・写真</summary><div class="details-content">${item.commonMemo ? `<p><strong>メモ</strong>${sanitizeHTML(item.commonMemo)}</p>` : ''}${item.photo ? `<p><strong>写真</strong><img src="${item.photo}" alt="関連写真" class="details-photo"></p>`: ''}</div></details>` : '';
                card.innerHTML = `<h3>${displayTitle}</h3>${entriesHTML}<div class="card-tags" style="margin-top:15px;">${tagsHTML}</div>${commonDetailsHTML}<div class="card-actions"><button class="edit-goku-btn">編集</button><button class="delete-goku-btn delete-btn">削除</button></div>`;
                container.appendChild(card);
            });
            document.getElementById('goku-count-display').textContent = `${filteredGoku.length}件表示中 / 全${gokuData.length}件`;
        };

        const processImageFile = (file) => new Promise((resolve, reject) => { const MAX_WIDTH = 800; const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { let width = img.width, height = img.height; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.8)); }; img.onerror = reject; img.src = e.target.result; }; reader.onerror = reject; reader.readAsDataURL(file); });
        const openGokuForm = (gokuItem = null) => {
            const isEdit = gokuItem !== null; const title = isEdit ? '語句を編集' : '新規語句を追加';
            let tempPhotoData = isEdit ? gokuItem.photo || '' : '';
            const createEntryHTML = (entry = {}) => { const ex = entry.example || {}; return `<fieldset class="goku-entry-form"><legend>読み・意味セット</legend><button type="button" class="delete-entry-btn delete-btn" style="float:right;">削除</button><label>読み</label><input type="text" class="goku-reading" value="${sanitizeHTML(entry.reading || '')}"><label>品詞</label><input type="text" class="goku-pos" value="${sanitizeHTML(entry.partOfSpeech || '')}"><label>意味(改行で複数)</label><textarea class="goku-meanings">${sanitizeHTML((entry.meanings || []).join('\n'))}</textarea><fieldset><legend>例文</legend><label>白文</label><input type="text" class="ex-hakubun" value="${sanitizeHTML(ex.hakubun||'')}"><label>書き下し文</label><input type="text" class="ex-kakikudashi" value="${sanitizeHTML(ex.kakikudashi||'')}"><label>現代語訳</label><input type="text" class="ex-translation" value="${sanitizeHTML(ex.translation||'')}"></fieldset></fieldset>`; };
            const entries = (isEdit && Array.isArray(gokuItem.entries) && gokuItem.entries.length > 0) ? gokuItem.entries : [{}];
            const formHTML = `<form id="goku-form-modal"><label>語句（代表表記）</label><input type="text" id="goku-title" value="${isEdit ? sanitizeHTML(gokuItem.title) : ''}" required><label>異体字・類義字(カンマ区切り)</label><input type="text" id="goku-variants" value="${isEdit ? sanitizeHTML((gokuItem.variants || []).join(', ')) : ''}"><div id="goku-entries-container">${entries.map(createEntryHTML).join('')}</div><label>共通メモ</label><textarea id="goku-common-memo">${isEdit ? sanitizeHTML(gokuItem.commonMemo || '') : ''}</textarea><label>タグ(カンマ区切り)</label><input type="text" id="tags" value="${isEdit ? sanitizeHTML((gokuItem.tags || []).join(', ')) : ''}"><fieldset><legend>写真</legend><label for="goku-photo-file">ファイルから選択</label><input type="file" id="goku-photo-file" accept="image/*"><img id="photo-preview" class="${tempPhotoData ? '' : 'hidden'}" src="${tempPhotoData}"><label for="goku-photo-url">または URLを入力</label><input type="text" id="goku-photo-url" value="${tempPhotoData.startsWith('data:') ? '' : sanitizeHTML(tempPhotoData)}" placeholder="https://..."></fieldset></form>`;
            showModal(title, formHTML, () => {
                const form = document.getElementById('goku-form-modal'); const newTitle = form.querySelector('#goku-title').value.trim();
                if (newTitle) {
                    const finalPhotoData = form.querySelector('#goku-photo-url').value.trim() || tempPhotoData;
                    const newVariants = form.querySelector('#goku-variants').value.split(',').map(t => t.trim()).filter(Boolean);
                    const newEntries = [...form.querySelectorAll('.goku-entry-form')].map(fieldset => ({ reading: fieldset.querySelector('.goku-reading').value, partOfSpeech: fieldset.querySelector('.goku-pos').value, meanings: fieldset.querySelector('.goku-meanings').value.trim().split('\n').filter(Boolean), example: { hakubun: fieldset.querySelector('.ex-hakubun').value, kakikudashi: fieldset.querySelector('.ex-kakikudashi').value, translation: fieldset.querySelector('.ex-translation').value } }));
                    if(newEntries.length === 0 || (newEntries.length === 1 && !newEntries[0].reading && newEntries[0].meanings.length === 0) ) { alert('「読み・意味セット」を最低一つは入力してください。'); return; }
                    const newTags = form.querySelector('#tags').value.split(',').map(t => t.trim()).filter(Boolean); 
                    const newCommonMemo = form.querySelector('#goku-common-memo').value;
                    if (isEdit) { Object.assign(gokuItem, {title: newTitle, variants: newVariants, entries: newEntries, tags: newTags, commonMemo: newCommonMemo, photo: finalPhotoData }); } 
                    else { gokuData.push({ id: Date.now(), title: newTitle, variants: newVariants, entries: newEntries, tags: newTags, commonMemo: newCommonMemo, photo: finalPhotoData }); }
                    saveAndRender(); hideModal();
                }
            }, `<div class="left-action"><button type="button" id="add-entry-btn" class="btn btn-sub-action">＋ 読み・意味セットを追加</button></div>`);
            document.getElementById('add-entry-btn').addEventListener('click', () => { document.getElementById('goku-entries-container').insertAdjacentHTML('beforeend', createEntryHTML()); });
            document.getElementById('goku-entries-container').addEventListener('click', e => { if(e.target.classList.contains('delete-entry-btn')) { if (document.querySelectorAll('.goku-entry-form').length > 1) { e.target.closest('.goku-entry-form').remove(); } else { alert('最後のセットは削除できません。'); } } });
            document.getElementById('goku-photo-file').addEventListener('change', async (e) => { const file = e.target.files[0]; if (file) { try { const resizedDataUrl = await processImageFile(file); tempPhotoData = resizedDataUrl; document.getElementById('photo-preview').src = resizedDataUrl; document.getElementById('photo-preview').classList.remove('hidden'); document.getElementById('goku-photo-url').value = ''; } catch (err) { alert('画像の処理に失敗しました。'); } } });
        };
        

