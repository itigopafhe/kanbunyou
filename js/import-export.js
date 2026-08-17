        const goku_preset_kuhou = () => [
            { groupTitle: '否定形', subgroups: [
                { subgroupTitle: '不', reading: '〜せず', meaning: '〜しない', tags: ['基本','否定'], explanation: '動詞・形容詞の打ち消し。', examples: [{ hakubun: '学而不思則罔。', kakikudashi: '学びて思はざれば則ち罔し。', translation: '学んでも考えなければ身につかない。', source: '論語' }] },
                { subgroupTitle: '未', reading: 'いまだ〜ず', meaning: 'まだ〜ない', tags: ['否定'], explanation: '「まだ〜していない」の意。', examples: [{ hakubun: '吾未見好徳如好色者也。', kakikudashi: '吾未だ徳を好むこと色を好むが如き者を見ざるなり。', translation: '徳を色を好むように好む者をまだ見たことがない。', source: '論語' }] },
                { subgroupTitle: '非', reading: '〜にあらず', meaning: '〜ではない', tags: ['否定'], explanation: '名詞の打ち消し。', examples: [{ hakubun: '子非我。', kakikudashi: '子は我にあらず。', translation: 'あなたは私ではない。', source: '荘子' }] },
                { subgroupTitle: '無', reading: '〜なし', meaning: '〜がない', tags: ['否定'], explanation: '存在の打ち消し。', examples: [{ hakubun: '天下無敵。', kakikudashi: '天下に敵なし。', translation: '天下に敵はいない。', source: '' }] }
            ]},
            { groupTitle: '疑問・反語形', subgroups: [
                { subgroupTitle: '何', reading: 'なんぞ〜や', meaning: 'どうして〜か', tags: ['疑問'], explanation: '理由を問う。反語にもなる。', examples: [{ hakubun: '何為者也。', kakikudashi: '何為る者ぞや。', translation: '何をする者か。', source: '' }] },
                { subgroupTitle: '安', reading: 'いづくんぞ〜や', meaning: 'どうして〜か（反語）', tags: ['反語'], explanation: '反語表現でよく使われる。', examples: [{ hakubun: '燕雀安知鴻鵠之志哉。', kakikudashi: '燕雀いづくんぞ鴻鵠の志を知らんや。', translation: '燕や雀にどうして鴻や鵠の志が分かろうか。', source: '史記' }] },
                { subgroupTitle: '豈', reading: 'あに〜や', meaning: 'どうして〜か（反語）', tags: ['反語'], explanation: '強い反語。', examples: [{ hakubun: '豈非天哉。', kakikudashi: 'あに天にあらずや。', translation: 'どうして天命でなかろうか。', source: '' }] }
            ]},
            { groupTitle: '使役形', subgroups: [
                { subgroupTitle: '使', reading: 'AをしてBしむ', meaning: 'AにBさせる', tags: ['使役'], explanation: '使役の基本形。', examples: [{ hakubun: '王使人問之。', kakikudashi: '王人をして之を問はしむ。', translation: '王は人にこれを問わせた。', source: '' }] },
                { subgroupTitle: '令', reading: 'AをしてBしむ', meaning: 'AにBさせる', tags: ['使役'], explanation: '「使」とほぼ同じ用法。', examples: [{ hakubun: '令行禁止。', kakikudashi: '令行はれ禁ぜられ止む。', translation: '命令が行われ禁令が守られる。', source: '' }] }
            ]},
            { groupTitle: '受身形', subgroups: [
                { subgroupTitle: '見', reading: '〜(せ)らる', meaning: '〜される', tags: ['受身'], explanation: '「見」で受身を表す。', examples: [{ hakubun: '信而見疑。', kakikudashi: '信じてしかも疑はる。', translation: '誠実なのに疑われる。', source: '史記' }] },
                { subgroupTitle: '為A所B', reading: 'AのBするところとなる', meaning: 'AにBされる', tags: ['受身'], explanation: '典型的な受身。', examples: [{ hakubun: '為人所笑。', kakikudashi: '人の笑ふところとなる。', translation: '人に笑われる。', source: '' }] }
            ]},
            { groupTitle: '比較形', subgroups: [
                { subgroupTitle: '於（比較）', reading: 'Aより〜', meaning: 'Aより〜だ', tags: ['比較'], explanation: '比較の対象を示す。', examples: [{ hakubun: '青出於藍而青於藍。', kakikudashi: '青は藍より出でて藍より青し。', translation: '青は藍から生まれるが藍より青い。', source: '荀子' }] }
            ]}
        ];
        const kuhouPresets = { '基本句法パック（否定・疑問・使役・受身・比較）': goku_preset_kuhou };

        const exampleAdditionalKuhouColumn = "例文_追加使用句法";
        const makeKuhouReferenceKey = (groupTitle, subgroupTitle) => JSON.stringify([String(groupTitle ?? ""), String(subgroupTitle ?? "")]);
        const getExampleAdditionalKuhouReferences = (example, ownerSubgroup) => {
            const referencesById = new Map();
            kuhouData.forEach(group => (group.subgroups || []).forEach(subgroup => {
                referencesById.set(String(subgroup.subgroupId), [group.groupTitle, subgroup.subgroupTitle]);
            }));
            const ownerId = String(ownerSubgroup.subgroupId);
            const seen = new Set();
            return (Array.isArray(example.usedKuhouIds) ? example.usedKuhouIds : []).reduce((references, id) => {
                if (String(id) === ownerId) return references;
                const reference = referencesById.get(String(id));
                if (!reference) return references;
                const key = makeKuhouReferenceKey(reference[0], reference[1]);
                if (!seen.has(key)) {
                    seen.add(key);
                    references.push(reference);
                }
                return references;
            }, []);
        };
        const parseExampleAdditionalKuhouReferences = (value) => {
            if (!value) return [];
            let parsed = value;
            if (typeof value === "string") {
                try { parsed = JSON.parse(value); } catch { return []; }
            }
            if (!Array.isArray(parsed)) return [];
            return parsed.reduce((references, reference) => {
                if (!Array.isArray(reference) || reference.length !== 2) return references;
                const [groupTitle, subgroupTitle] = reference;
                if (typeof groupTitle !== "string" || typeof subgroupTitle !== "string") return references;
                references.push([groupTitle, subgroupTitle]);
                return references;
            }, []);
        };
        const resolveImportedExampleAdditionalKuhou = () => {
            const subgroupsByReference = new Map();
            kuhouData.forEach(group => (group.subgroups || []).forEach(subgroup => {
                const key = makeKuhouReferenceKey(group.groupTitle, subgroup.subgroupTitle);
                subgroupsByReference.set(key, subgroupsByReference.has(key) ? null : subgroup);
            }));
            kuhouData.forEach(group => (group.subgroups || []).forEach(subgroup => (subgroup.examples || []).forEach(example => {
                if (!Array.isArray(example._additionalKuhouReferences)) return;
                const usedKuhouIds = [];
                const seen = new Set();
                example._additionalKuhouReferences.forEach(([groupTitle, subgroupTitle]) => {
                    const target = subgroupsByReference.get(makeKuhouReferenceKey(groupTitle, subgroupTitle));
                    if (!target || seen.has(String(target.subgroupId))) return;
                    seen.add(String(target.subgroupId));
                    usedKuhouIds.push(target.subgroupId);
                });
                if (usedKuhouIds.length > 0) example.usedKuhouIds = usedKuhouIds;
                delete example._additionalKuhouReferences;
            })));
        };
        const downloadTemplate = (type) => { let data, fileName; if (type === 'kuhou') { data = [
            {"グループ名":"否定形","句法名":"不","読み":"〜せず","訳":"〜しない","タグ":"基本,否定","解説":"単純な打ち消し。動詞・形容詞を打ち消す。","メモ":"","例文_白文":"学而不思則罔","例文_書き下し":"学びて思はざれば則ち罔し","例文_日本語訳":"学んでも考えなければ身につかない","例文_出典":"論語","例文_追加使用句法":""},
            {"グループ名":"否定形","句法名":"不","読み":"","訳":"","タグ":"","解説":"","メモ":"","例文_白文":"過而不改","例文_書き下し":"過ちて改めず","例文_日本語訳":"過ちを犯しても改めない","例文_出典":"論語","例文_追加使用句法":""}
        ]; fileName = "句法テンプレート.xlsx"; } else { data = [{"語句":"則","異体字・類義字":"即,乃,便","読み":"すなはち","品詞":"接続詞","意味":"【則】〜の場合は\n【即】すぐに","タグ":"重要語","共通メモ":"文脈で判断","写真URL":"","例文_白文":"","例文_書き下し":"","例文_現代語訳":""}]; fileName = "語句テンプレート.xlsx"; } XLSX.writeFile(XLSX.utils.book_new_append_json(data, type === 'kuhou' ? '句法一覧' : '語句帳'), fileName); };
        const exportData = (type) => { let data; if (type === 'kuhou') { data = kuhouData.flatMap(g => g.subgroups.flatMap(sg => { const base = { "グループ名": g.groupTitle, "句法名": sg.subgroupTitle, "読み": sg.reading || "", "訳": sg.meaning || "", "タグ": (sg.tags||[]).join(','), "解説": sg.explanation || "", "メモ": sg.memo || "" }; const exs = sg.examples || []; const emptyMeta = { "グループ名": g.groupTitle, "句法名": sg.subgroupTitle, "読み":"", "訳":"", "タグ":"", "解説":"", "メモ":"" }; if (exs.length === 0) return [{ ...base, "例文_白文": "", "例文_書き下し": "", "例文_日本語訳": "", "例文_出典": "", [exampleAdditionalKuhouColumn]: "" }]; return exs.map((ex, i) => ({ ...(i === 0 ? base : emptyMeta), "例文_白文": ex.hakubun||"", "例文_書き下し": ex.kakikudashi||"", "例文_日本語訳": ex.translation||"", "例文_出典": ex.source||"", [exampleAdditionalKuhouColumn]: JSON.stringify(getExampleAdditionalKuhouReferences(ex, sg)) })); })); } else { data = gokuData.flatMap(item => (item.entries||[]).map(entry => ({ "語句": item.title, "異体字・類義字": (item.variants||[]).join(','), "読み": entry.reading, "品詞": entry.partOfSpeech, "意味": (entry.meanings||[]).join('\n'), "タグ": (item.tags||[]).join(','), "共通メモ": item.commonMemo, "写真URL": item.photo, "例文_白文": entry.example?.hakubun, "例文_書き下し": entry.example?.kakikudashi, "例文_現代語訳": entry.example?.translation, })) );} if(data.length === 0) { alert("データ無"); return; } XLSX.writeFile(XLSX.utils.book_new_append_json(data, type === 'kuhou' ? "句法一覧" : "語句帳"), type === 'kuhou' ? "句法データ.xlsx" : "語句データ.xlsx"); };
        const handleKuhouImport = (json, mode) => { const groupMap = new Map(); json.forEach(row => { const groupTitle = row["グループ名"] || "名称未設定"; if (!groupMap.has(groupTitle)) { groupMap.set(groupTitle, { groupId: Date.now() + Math.random(), groupTitle: groupTitle, subgroups: new Map() }); } const group = groupMap.get(groupTitle); const sgTitle = row["句法名"] || "名称未設定"; if (!group.subgroups.has(sgTitle)) { group.subgroups.set(sgTitle, { subgroupId: Date.now() + Math.random(), subgroupTitle: sgTitle, reading: "", meaning: "", explanation: "", memo: "", tags: [], examples: [] }); } const sg = group.subgroups.get(sgTitle); if (row["読み"] && !sg.reading) sg.reading = row["読み"]; if ((row["訳"] || row["現代語訳"]) && !sg.meaning) sg.meaning = row["訳"] || row["現代語訳"]; if (row["解説"] && !sg.explanation) sg.explanation = row["解説"]; if (row["メモ"] && !sg.memo) sg.memo = row["メモ"]; if (row["タグ"] && sg.tags.length === 0) sg.tags = row["タグ"].split(',').map(t=>t.trim()).filter(Boolean); const ex = { hakubun: row["例文_白文"]||row["白文"]||"", kakikudashi: row["例文_書き下し"]||row["書き下し文"]||"", translation: row["例文_日本語訳"]||row["例文_現代語訳"]||"", source: row["例文_出典"]||"" }; if (Object.prototype.hasOwnProperty.call(row, exampleAdditionalKuhouColumn)) ex._additionalKuhouReferences = parseExampleAdditionalKuhouReferences(row[exampleAdditionalKuhouColumn]); if (ex.hakubun || ex.kakikudashi || ex.translation || ex.source) sg.examples.push(ex); }); const newKuhouData = [...groupMap.values()].map(g => ({ groupId: g.groupId, groupTitle: g.groupTitle, subgroups: [...g.subgroups.values()] })); if (mode === 'overwrite') { kuhouData = newKuhouData; } else { newKuhouData.forEach(newGroup => { const existingGroup = kuhouData.find(g => g.groupTitle === newGroup.groupTitle); if (existingGroup) { newGroup.subgroups.forEach(newSg => { const existSg = existingGroup.subgroups.find(s => s.subgroupTitle === newSg.subgroupTitle); if (existSg) { existSg.examples = [...(existSg.examples||[]), ...(newSg.examples||[])]; if (!existSg.reading && newSg.reading) existSg.reading = newSg.reading; if (!existSg.meaning && newSg.meaning) existSg.meaning = newSg.meaning; } else { existingGroup.subgroups.push(newSg); } }); } else { kuhouData.push(newGroup); } }); } resolveImportedExampleAdditionalKuhou(); };
        const handleGokuImport = (json, mode) => { const gokuMap = new Map(); json.forEach(row => { const title = row["語句"] || "名称未設定"; if (!gokuMap.has(title)) { gokuMap.set(title, { id: Date.now() + Math.random(), title: title, variants: (row["異体字・類義字"] || "").split(',').map(t=>t.trim()).filter(Boolean), entries: [], tags: (row["タグ"] || "").split(',').map(t=>t.trim()).filter(Boolean), commonMemo: row["共通メモ"] || "", photo: row["写真URL"] || "" }); } const item = gokuMap.get(title); if(row["読み"] || row["意味"]){ item.entries.push({ reading: row["読み"] || "", partOfSpeech: row["品詞"] || "", meanings: (row["意味"] || "").split('\n').filter(Boolean), example: { hakubun: row["例文_白文"], kakikudashi: row["例文_書き下し"], translation: row["例文_現代語訳"] } }); } }); const newGokuData = [...gokuMap.values()]; if (mode === 'overwrite') { gokuData = newGokuData; } else { newGokuData.forEach(newItem => { const existingItem = gokuData.find(g => g.title === newItem.title); if (existingItem) { existingItem.entries.push(...newItem.entries); if(newItem.variants.length > 0) existingItem.variants = [...new Set([...(existingItem.variants || []), ...newItem.variants])]; if(newItem.tags.length > 0) existingItem.tags = [...new Set([...(existingItem.tags || []), ...newItem.tags])]; } else { gokuData.push(newItem); } }); } };
        const handleFileImport = (e) => { const file = e.target.files[0]; if (!file || !currentImportHandler) return; const importMode = confirm("データをインポートします。「OK」で上書き、「キャンセル」で追加します。"); const reader = new FileReader(); reader.onload = (event) => { try { const data = new Uint8Array(event.target.result); const workbook = XLSX.read(data, {type: 'array'}); const sheetName = workbook.SheetNames[0]; const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]); if (json.length === 0) { alert("データ無"); return; } currentImportHandler(json, importMode ? 'overwrite' : 'append'); saveAndRender(); alert("完了"); } catch (error) { console.error("インポートエラー:", error); alert("失敗"); } finally { importFileInput.value = ''; currentImportHandler = null; } }; reader.readAsArrayBuffer(file); };
        const createShareLink = () => { if (gokuData.length === 0) { alert("共有データ無"); return; } const dataToShare = { goku: gokuData }; const jsonString = JSON.stringify(dataToShare); const compressedString = LZString.compressToEncodedURIComponent(jsonString); const url = `${location.protocol}//${location.host}${location.pathname}#data=${compressedString}`; navigator.clipboard.writeText(url).then(() => alert("リンクをコピーしました"), () => alert("コピー失敗")); };
        const loadFromURL = () => { if (!location.hash.startsWith("#data=")) return; const compressedString = location.hash.substring(6); try { const jsonString = LZString.decompressFromEncodedURIComponent(compressedString); const data = JSON.parse(jsonString); if (data.goku) { if (confirm("共有データを読込？")) { gokuData = data.goku; saveAndRender(); alert("完了"); }} } catch (error) { console.error("URL", error); alert("無効リンク"); } finally { history.replaceState(null, null, ' '); } };
        const showModal = (title, content, onSave, footerContent = '') => { const leftActionHTML = footerContent ? `<div class="left-action">${footerContent}</div>` : ''; modalContainer.innerHTML = `<h2>${sanitizeHTML(title)}</h2><div class="modal-content">${content}</div><div class="modal-actions">${leftActionHTML}<button id="modal-cancel-btn" class="btn btn-cancel">キャンセル</button><button id="modal-save-btn" class="btn btn-save">保存</button></div>`; modalOverlay.classList.remove('hidden'); modalContainer.classList.remove('hidden'); currentModalSaveHandler = onSave; };
        const openPresetLoader = () => {
            const optsHTML = Object.keys(kuhouPresets).map(k => `<label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--line);border-radius:8px;cursor:pointer"><input type="radio" name="preset" value="${sanitizeHTML(k)}" ${Object.keys(kuhouPresets)[0]===k?'checked':''}> ${sanitizeHTML(k)}</label>`).join('');
            const modeHTML = `<fieldset><legend>読み込みモード</legend><label style="display:block;margin-bottom:6px"><input type="radio" name="preset-mode" value="append" checked> 追加（既存データを保持）</label><label style="display:block"><input type="radio" name="preset-mode" value="overwrite"> 上書き（既存の句法データを全て置換）</label></fieldset>`;
            showModal('テンプレート読込', `<form id="preset-form">${optsHTML}${modeHTML}</form>`, () => {
                const form = document.getElementById('preset-form');
                const key = form.querySelector('input[name="preset"]:checked').value;
                const mode = form.querySelector('input[name="preset-mode"]:checked').value;
                const preset = kuhouPresets[key](); if (!preset) return;
                if (mode === 'overwrite') {
                    if (!confirm('既存の句法データを全て置換します。よろしいですか？')) return;
                    kuhouData = preset.map((g, gi) => ({ groupId: Date.now()+gi, groupTitle: g.groupTitle, subgroups: g.subgroups.map((s, si) => ({ subgroupId: Date.now()+gi*1000+si, ...s })) }));
                } else {
                    preset.forEach((newGroup, gi) => {
                        const existing = kuhouData.find(x => x.groupTitle === newGroup.groupTitle);
                        const newSubs = newGroup.subgroups.map((s, si) => ({ subgroupId: Date.now()+gi*1000+si+Math.floor(Math.random()*1000), ...s }));
                        if (existing) newSubs.forEach(ns => { if (!existing.subgroups.some(es => es.subgroupTitle === ns.subgroupTitle)) existing.subgroups.push(ns); });
                        else kuhouData.push({ groupId: Date.now()+gi+Math.floor(Math.random()*10000), groupTitle: newGroup.groupTitle, subgroups: newSubs });
                    });
                }
                saveAndRender(); hideModal();
            });
        };

