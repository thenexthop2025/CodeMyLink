class QRCodeGenerator {
    constructor() {
        this.urlInput = document.getElementById('url-input');
        this.generateBtn = document.getElementById('generate-btn');
        this.outputSection = document.getElementById('output-section');
        this.errorMessage = document.getElementById('error-message');
        this.qrCanvas = document.getElementById('qr-canvas');
        this.downloadBtn = document.getElementById('download-btn');
        this.copyBtn = document.getElementById('copy-btn');
        
        // new controls
        this.sizeInput = document.getElementById('size-input');
        this.marginInput = document.getElementById('margin-input');
        this.ecInput = document.getElementById('ec-input');
        this.fgInput = document.getElementById('fg-input');
        this.bgInput = document.getElementById('bg-input');
        this.logoInput = document.getElementById('logo-input');
        this.logoScale = document.getElementById('logo-scale');
        this.historyEl = document.getElementById('history');
        this.downloadPngBtn = document.getElementById('download-png');
        this.downloadSvgBtn = document.getElementById('download-svg');
        this.clearHistoryBtn = document.getElementById('clear-history');
        
        this.logoImage = null;
        this.currentUrl = '';
        
        this.init();
    }
    
    init() {
        this.generateBtn.addEventListener('click', () => this.generateQRCode());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateQRCode();
            }
        });
        this.downloadBtn.addEventListener('click', () => this.downloadQRCode());
        this.copyBtn.addEventListener('click', () => this.copyUrl());
        
        // controls listeners
        [this.sizeInput, this.marginInput, this.ecInput, this.fgInput, this.bgInput, this.logoScale]
            .forEach(el => el && el.addEventListener('change', () => {/* defer */}));
        this.logoInput && this.logoInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            this.logoImage = await this.readImageFile(file);
        });
        const applyBtn = document.getElementById('apply-settings');
        applyBtn && applyBtn.addEventListener('click', () => this.applyOnly());
        this.downloadPngBtn && this.downloadPngBtn.addEventListener('click', () => this.downloadQRCode());
        this.downloadSvgBtn && this.downloadSvgBtn.addEventListener('click', () => this.downloadSVG());
        this.clearHistoryBtn && this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // 输入验证
        this.urlInput.addEventListener('input', () => this.validateInput());
        
        // 初始化历史
        this.renderHistory();
        
        // PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }

    async readImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = () => { img.src = reader.result; };
            reader.onerror = reject;
            img.onload = () => resolve(img);
            img.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    validateInput() {
        const raw = this.urlInput.value.trim();
        const url = this.normalizeUrl(raw);
        const isValid = this.isValidUrl(url);
        
        this.generateBtn.disabled = !isValid;
        this.generateBtn.style.opacity = isValid ? '1' : '0.6';
        
        if (raw && !isValid) {
            this.showError('请输入有效的URL');
        } else {
            this.hideError();
        }
    }
    
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    
    normalizeUrl(input) {
        if (!input) return input;
        if (/^https?:\/\//i.test(input)) return input;
        if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input)) return `https://${input}`;
        return input;
    }
    
    async applyOnly() {
        const applyBtn = document.getElementById('apply-settings');
        const applyStatus = document.getElementById('apply-status');
        if (applyBtn) { applyBtn.classList.add('loading'); applyBtn.textContent = '应用设置'; }
        // 保存当前参数到本地，供生成时读取
        const params = {
            size: parseInt(this.sizeInput?.value || '256', 10),
            margin: parseInt(this.marginInput?.value || '16', 10),
            ec: this.ecInput?.value || 'M',
            fg: this.fgInput?.value || '#000000',
            bg: this.bgInput?.value || '#FFFFFF',
            logoPct: parseInt(this.logoScale?.value || '22', 10)
        };
        localStorage.setItem('qr_params', JSON.stringify(params));
        setTimeout(() => {
            if (applyBtn) { applyBtn.classList.remove('loading'); applyBtn.classList.add('success'); applyBtn.textContent = '应用设置'; }
            this.showSuccess('设置已保存，点击“生成QR码”生效');
            if (applyStatus) { applyStatus.textContent = ''; }
        }, 200);
    }

    async generateQRCode(options = {}) {
        const { silentInvalid = false, fromApply = false } = options;
        const raw = this.urlInput.value.trim();
        if (!raw) {
            this.showError('请输入URL后再生成');
            this.urlInput.classList.add('input-error');
            this.urlInput.focus();
            setTimeout(()=> this.urlInput.classList.remove('input-error'), 500);
            return;
        }
        const url = this.normalizeUrl(raw);
        
        if (!this.isValidUrl(url)) {
            if (!silentInvalid) this.showError('请输入有效的URL');
            const applyStatus = document.getElementById('apply-status');
            if (silentInvalid && applyStatus) { applyStatus.textContent = '请先填写有效URL'; applyStatus.classList.remove('ok'); applyStatus.classList.add('warn'); }
            this.urlInput.classList.add('input-error');
            setTimeout(()=> this.urlInput.classList.remove('input-error'), 500);
            return;
        }
        
        // 读取最近一次应用的参数（若有）
        let applied = {};
        try { applied = JSON.parse(localStorage.getItem('qr_params') || '{}'); } catch {}
        
        let size = parseInt((applied.size ?? this.sizeInput?.value) || '256', 10);
        let margin = parseInt((applied.margin ?? this.marginInput?.value) || '16', 10);
        const ecKey = (applied.ec ?? this.ecInput?.value) || 'M';
        const fg = (applied.fg ?? this.fgInput?.value) || '#000000';
        const bg = (applied.bg ?? this.bgInput?.value) || '#FFFFFF';
        const logoPct = Math.min(40, Math.max(8, parseInt((applied.logoPct ?? this.logoScale?.value) || '22', 10)));
        
        if (typeof QRCode === 'undefined') { this.showError('本地QR库未加载'); return; }
        
        size = Math.min(1024, Math.max(128, size));
        margin = Math.min(Math.floor(size / 3), Math.max(0, margin));
        const ecMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
        const correctLevel = ecMap[ecKey] || QRCode.CorrectLevel.M;
        
        this.currentUrl = url;
        this.hideError();
        
        const applyBtn = document.getElementById('apply-settings');
        const applyStatus = document.getElementById('apply-status');
        if (fromApply && applyBtn) { 
            applyBtn.classList.remove('success');
            applyBtn.classList.add('loading'); 
            applyBtn.textContent = '应用中...';
            if (applyStatus) applyStatus.textContent = '正在应用设置';
        }
        
        this.generateBtn.classList.add('loading');
        this.generateBtn.textContent = '生成中...';
        this.generateBtn.disabled = true;
        
        try {
            if (!this.qrCanvas) throw new Error('Canvas元素未找到');
            const innerSize = size - margin * 2;
            this.qrCanvas.width = size;
            this.qrCanvas.height = size;
            const ctx = this.qrCanvas.getContext('2d');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, size, size);
            
            // 使用库生成内部QR到临时canvas
            const temp = document.createElement('div');
            new QRCode(temp, { text: url, width: innerSize, height: innerSize, colorDark: fg, colorLight: bg, correctLevel });
            await new Promise(r => setTimeout(r, 0));
            const img = temp.querySelector('img');
            const srcCanvas = temp.querySelector('canvas');
            if (img && img.src) {
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
                ctx.drawImage(img, margin, margin, innerSize, innerSize);
            } else if (srcCanvas) {
                ctx.drawImage(srcCanvas, margin, margin, innerSize, innerSize);
            } else {
                throw new Error('生成失败');
            }
            
            // 绘制中心Logo（按innerSize）
            if (this.logoImage) {
                const logoSize = Math.floor((logoPct / 100) * innerSize);
                const x = Math.floor((size - logoSize) / 2);
                const y = Math.floor((size - logoSize) / 2);
                const pad = Math.max(4, Math.floor(logoSize * 0.1));
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
                ctx.drawImage(this.logoImage, x, y, logoSize, logoSize);
            }
            
            this.outputSection.style.display = 'block';
            this.outputSection.scrollIntoView({ behavior: 'smooth' });
            this.outputSection.classList.remove('flash');
            // trigger reflow then add flash
            void this.outputSection.offsetWidth;
            this.outputSection.classList.add('flash');
            
            this.pushHistory({ url, size, fg, bg, correctLevelKey: ecKey, time: Date.now() });
            this.renderHistory();
            const wrap = document.getElementById('history-wrap');
            const summary = document.getElementById('history-summary');
            if (summary) { summary.classList.remove('summary-flash'); void summary.offsetWidth; summary.classList.add('summary-flash'); }
        } catch (error) {
            console.error('生成QR码失败:', error);
            this.showError('生成QR码失败，请重试');
        } finally {
            this.generateBtn.classList.remove('loading');
            this.generateBtn.textContent = '生成QR码';
            this.generateBtn.disabled = false;
            if (fromApply && applyBtn) { 
                applyBtn.classList.remove('loading'); 
                applyBtn.classList.add('success');
                applyBtn.textContent = '应用设置'; 
                this.showSuccess('已应用设置并生成');
            }
        }
    }

    downloadQRCode() {
        if (!this.currentUrl) return;
        try {
            const link = document.createElement('a');
            link.download = `qrcode-${Date.now()}.png`;
            link.href = this.qrCanvas.toDataURL('image/png');
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            this.showSuccess('QR码已下载');
        } catch (e) { this.showError('下载失败，请重试'); }
    }

    downloadSVG() {
        if (!this.currentUrl) return;
        const size = parseInt(this.sizeInput?.value || '256', 10);
        const fg = this.fgInput?.value || '#000000';
        const bg = this.bgInput?.value || '#FFFFFF';
        const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${size}px;height:${size}px;background:${bg};display:flex;align-items:center;justify-content:center"><img src="${this.qrCanvas.toDataURL('image/png')}" style="width:100%;height:100%;image-rendering:pixelated"/></div></foreignObject></svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `qrcode-${Date.now()}.svg`; a.click();
        URL.revokeObjectURL(url);
    }

    // History
    pushHistory(entry) {
        const list = JSON.parse(localStorage.getItem('qr_history') || '[]');
        list.unshift(entry);
        localStorage.setItem('qr_history', JSON.stringify(list.slice(0, 24)));
    }
    clearHistory() {
        localStorage.removeItem('qr_history');
        this.renderHistory();
    }
    renderHistory() {
        if (!this.historyEl) return;
        const list = JSON.parse(localStorage.getItem('qr_history') || '[]');
        const summary = document.getElementById('history-summary');
        if (summary) summary.textContent = `历史记录 (${list.length})`;
        if (!list.length) { this.historyEl.innerHTML = ''; return; }
        this.historyEl.innerHTML = list.map(item => {
            const dt = new Date(item.time).toLocaleString();
            return `<div class="item"><div class="thumb"><img alt="预览" src=""/></div><div class="meta">${item.url}</div><div class="meta">${dt}</div></div>`;
        }).join('');
        const thumbs = this.historyEl.querySelectorAll('.item');
        thumbs.forEach((el, idx) => {
            const canvas = document.createElement('canvas');
            canvas.width = 180; canvas.height = 180;
            const t = JSON.parse(localStorage.getItem('qr_history') || '[]')[idx];
            const temp = document.createElement('div');
            new QRCode(temp, { text: t.url, width: 180, height: 180, colorDark: t.fg, colorLight: t.bg, correctLevel: QRCode.CorrectLevel[t.correctLevelKey] });
            setTimeout(() => {
                const img = temp.querySelector('img');
                const srcCanvas = temp.querySelector('canvas');
                const ctx = canvas.getContext('2d');
                if (img && img.src) { img.onload = () => { ctx.drawImage(img,0,0,180,180); el.querySelector('img').src = canvas.toDataURL('image/png'); }; }
                else if (srcCanvas) { ctx.drawImage(srcCanvas,0,0,180,180); el.querySelector('img').src = canvas.toDataURL('image/png'); }
                el.addEventListener('click', () => { this.urlInput.value = t.url; this.generateQRCode(); });
            }, 0);
        });
        // NOTE: do not auto-open here; keep collapsed by default on page load
    }
    
    async copyUrl() {
        if (!this.currentUrl) return;
        
        try {
            await navigator.clipboard.writeText(this.currentUrl);
            this.showSuccess('URL已复制到剪贴板');
        } catch (error) {
            console.error('复制失败:', error);
            // 降级方案
            this.fallbackCopyTextToClipboard(this.currentUrl);
        }
    }
    
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showSuccess('URL已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
            this.showError('复制失败，请手动复制');
        }
        
        document.body.removeChild(textArea);
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        this.errorMessage.style.display = 'none';
    }
    
    showSuccess(message) {
        // 创建临时成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查QRCode库是否加载
    if (typeof QRCode === 'undefined') {
        console.error('QRCode库未加载');
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff4444;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 9999;
            font-weight: bold;
        `;
        errorDiv.textContent = 'QR码库加载失败，请检查网络连接或刷新页面';
        document.body.appendChild(errorDiv);
        return;
    }
    
    new QRCodeGenerator();
});

// 添加一些实用功能
document.addEventListener('DOMContentLoaded', () => {
    // 自动聚焦到输入框
    const urlInput = document.getElementById('url-input');
    urlInput.focus();
    
    // 添加示例URL点击功能
    const examples = [
        'https://www.google.com',
        'https://github.com',
        'https://www.baidu.com'
    ];
    
    // 可以添加示例按钮（可选）
    const addExampleButtons = () => {
        const inputGroup = document.querySelector('.input-group');
        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'examples';
        exampleDiv.innerHTML = `
            <p style="margin: 10px 0 5px 0; color: #666; font-size: 0.9rem;">快速示例：</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                ${examples.map(url => 
                    `<button class="example-btn" data-url="${url}">${url.replace('https://', '')}</button>`
                ).join('')}
            </div>
        `;
        
        // 添加示例按钮样式
        const exampleStyle = document.createElement('style');
        exampleStyle.textContent = `
            .example-btn {
                background: #f0f0f0;
                border: 1px solid #ddd;
                padding: 5px 10px;
                border-radius: 6px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .example-btn:hover {
                background: #e0e0e0;
                border-color: #667eea;
            }
        `;
        document.head.appendChild(exampleStyle);
        
        inputGroup.appendChild(exampleDiv);
        
        // 添加点击事件
        exampleDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('example-btn')) {
                urlInput.value = e.target.dataset.url;
                urlInput.dispatchEvent(new Event('input'));
            }
        });
    };
    
    // 取消注释下面这行来启用示例按钮
    // addExampleButtons();
});
