    // ===== ユーティリティ関数 =====
    const sanitizeHTML = (str) => { if (!str) return ''; const temp = document.createElement('div'); temp.textContent = str; return temp.innerHTML; };
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchesQuery = (raw, query) => !!raw && !!query && String(raw).toLowerCase().includes(query.toLowerCase());
    const highlightHTML = (sanitizedText, query) => { if (!query || !sanitizedText) return sanitizedText; const q = sanitizeHTML(query); if (!q) return sanitizedText; try { const re = new RegExp(escapeRegExp(q), 'gi'); return sanitizedText.replace(re, m => `<mark>${m}</mark>`); } catch(e) { return sanitizedText; } };
    XLSX.utils.book_new_append_json = (data, sheetName="Sheet1") => { const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(data); XLSX.utils.book_append_sheet(wb, ws, sheetName); return wb; };

    class TagFilter {
        constructor(containerId, items, onFilterChange) { this.container = document.getElementById(containerId); if (!this.container) { return; } this.container.className = 'tag-filter-system-container'; this.allItems = items; this.onFilterChange = onFilterChange; this.activeTags = []; }
        _extractAllTags() { return [...new Set(this.allItems.flatMap(item => item.tags || []))].sort((a, b) => a.localeCompare(b, 'ja')); }
        _handleTagClick(tag) { if (tag === 'all') { this.activeTags = []; } else { const index = this.activeTags.indexOf(tag); if (index > -1) { this.activeTags.splice(index, 1); } else { this.activeTags.push(tag); } } this.render(); if (typeof this.onFilterChange === 'function') { this.onFilterChange(this.activeTags); } }
        render() { this.container.innerHTML = ''; const allTags = this._extractAllTags(); if (allTags.length === 0) {this.container.style.display = 'none'; return;} this.container.style.display = 'block'; const allBtn = document.createElement('button'); allBtn.className = 'tag-filter-btn'; allBtn.textContent = 'すべて表示'; if (this.activeTags.length === 0) { allBtn.classList.add('active'); } allBtn.addEventListener('click', () => this._handleTagClick('all')); this.container.appendChild(allBtn); allTags.forEach(tag => { const btn = document.createElement('button'); btn.className = 'tag-filter-btn'; btn.textContent = tag; if (this.activeTags.includes(tag)) { btn.classList.add('active'); } btn.addEventListener('click', () => this._handleTagClick(tag)); this.container.appendChild(btn); }); }
    }

