        const getDefaultKuhouData = () => [ { groupId: 1, groupTitle: "否定形", subgroups: [
            { subgroupId: 101, subgroupTitle: "不", reading: "〜せず", meaning: "〜しない", tags: ["基本", "否定"], explanation: "単純な打ち消し。動詞・形容詞を打ち消して「〜ず」と読む。", memo: "", examples: [
                { hakubun: "学而不思則罔。", kakikudashi: "学びて思はざれば則ち罔し。", translation: "学んでも考えなければ、身につかない。", source: "論語" },
                { hakubun: "過而不改。", kakikudashi: "過ちて改めず。", translation: "過ちを犯しても改めない。", source: "論語" }
            ]},
            { subgroupId: 102, subgroupTitle: "非", reading: "〜に あらず", meaning: "〜ではない", tags: ["否定"], explanation: "名詞を打ち消す。「〜にあらず」と読む。", memo: "", examples: [
                { hakubun: "子非我。", kakikudashi: "子は我にあらず。", translation: "あなたは私ではない。", source: "荘子" }
            ]}
        ]}, { groupId: 2, groupTitle: "使役形", subgroups: [
            { subgroupId: 201, subgroupTitle: "使", reading: "AをしてBしむ", meaning: "AにBさせる", tags: ["使役"], explanation: "使役の基本形。", memo: "", examples: [
                { hakubun: "王使人問之。", kakikudashi: "王人をして之を問はしむ。", translation: "王が家来にこれを質問させた。", source: "" }
            ]}
        ]} ];
        const getDefaultGokuData = () => [ { id: 1, title: '則', variants: ['即', '乃', '便'], tags: ["重要語", "接続詞"], commonMemo: '文脈によって使われる漢字が異なるが、意味のニュアンスも少しずつ違う。', entries: [{ reading: "すなはち", partOfSpeech: "接続詞", meanings: ["【則】前件が後件の理由・条件となる場合。「〜ならば」「〜の場合は」。", "【即】二つのものがイコールである、またはすぐに行動が移る場合。「まさに」「すぐに」。", "【乃】意外な結果や、前件を受けてようやく後件が起こる場合。「そこでようやく」「意外にも」。"]}]} ];

        const loadData = () => {
            try { const storedKuhou = localStorage.getItem('kanbunKuhou'); kuhouData = storedKuhou ? JSON.parse(storedKuhou) : getDefaultKuhouData();
                kuhouData.forEach(g => (g.subgroups||[]).forEach(sg => {
                    if (sg.reading === undefined) sg.reading = '';
                    const c = sg.card || {};
                    if (sg.explanation === undefined) sg.explanation = c.explanation || '';
                    if (sg.memo === undefined) sg.memo = c.memo || '';
                    if (sg.meaning === undefined) sg.meaning = c.translation || '';
                    let examples;
                    if (Array.isArray(sg.examples)) {
                        examples = sg.examples;
                    } else {
                        examples = Array.isArray(c.examples) ? c.examples.slice() : [];
                        if (examples.length === 0 && c.example && (c.example.hakubun || c.example.kakikudashi || c.example.translation || c.example.source)) examples = [c.example];
                        if (c.hakubun || c.kakikudashi || c.translation || c.source) {
                            const first = { hakubun: c.hakubun || '', kakikudashi: c.kakikudashi || '', translation: c.translation || '', source: c.source || '' };
                            if (!examples.some(ex => ex.hakubun === first.hakubun && ex.kakikudashi === first.kakikudashi)) examples.unshift(first);
                        }
                    }
                    sg.examples = examples;
                    if (sg.checked === undefined) sg.checked = false;
                    sg.examples.forEach(ex => { if (ex.checked === undefined) ex.checked = false; });
                    delete sg.card;
                }));
            } catch (e) { console.error("句法データの読み込みに失敗。データを初期化します。", e); kuhouData = getDefaultKuhouData(); }
            try {
                const storedGoku = localStorage.getItem('kanbunGoku'); let rawGokuData = storedGoku ? JSON.parse(storedGoku) : getDefaultGokuData();
                gokuData = rawGokuData.map(item => { if (item.entries && Array.isArray(item.entries)) return item; return { id: item.id, title: item.title, tags: item.tags || [], commonMemo: item.memo || "", photo: item.photo || "", entries: [{ reading: item.reading || "", partOfSpeech: "", meanings: (item.meanings || []).map(m=>(typeof m === 'string' ? m : m.text)), example: item.example || {} }] }; });
            } catch (e) { console.error("語句データの読み込みに失敗。データを初期化します。", e); gokuData = getDefaultGokuData(); }
            try { studyHistory = JSON.parse(localStorage.getItem('kanbunHistory') || '[]'); } catch(e) { studyHistory = []; }
        };
        const saveData = () => { localStorage.setItem('kanbunKuhou', JSON.stringify(kuhouData)); localStorage.setItem('kanbunGoku', JSON.stringify(gokuData)); };
        const saveAndRender = () => { saveData(); render(); };

