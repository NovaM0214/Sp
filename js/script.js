class SpotBonusGenerator {
    constructor() {
        this.personalImages = [];
        this.teamImages = [];
        this.personalGeneratedImages = [];
        this.teamGeneratedImages = [];
        this.currentPage = 'personal';
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupFileUploads();
        this.setupActionButtons();
        this.preloadFrameImages();
        this.setupDropAreas();
        this.setupModal();
        this.setupClearUploadBtns();
    }

    // 预加载框架图片
    preloadFrameImages() {
        this.frameImages = {};
        const frameFiles = ['assets/img/headkuang.png', 'assets/img/上框.png', 'assets/img/下框.png', 'assets/img/两侧框.png'];
        
        frameFiles.forEach(filename => {
            const img = new Image();
            // 设置图片加载属性以保持原始质量
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.frameImages[filename] = img;
            };
            img.src = filename;
        });
    }

    // 设置导航功能
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchPage(btn.dataset.page);
            });
        });
    }

    switchPage(page) {
        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // 切换页面显示
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = 'none';
        });
        document.getElementById(`${page}-page`).style.display = 'block';

        this.currentPage = page;
    }

    // 设置文件上传功能
    setupFileUploads() {
        const personalUpload = document.getElementById('personal-upload');
        const teamUpload = document.getElementById('team-upload');

        personalUpload.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files, 'personal');
        });

        teamUpload.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files, 'team');
        });
    }

    handleFileUpload(files, type) {
        const imageList = type === 'personal' ? this.personalImages : this.teamImages;
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        file: file,
                        name: file.name,
                        src: e.target.result,
                        id: Date.now() + Math.random()
                    };
                    imageList.push(imageData);
                    this.updateImageList(type);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    updateImageList(type) {
        const imageList = type === 'personal' ? this.personalImages : this.teamImages;
        const listElement = document.getElementById(`${type}-image-list`);
        
        listElement.innerHTML = '';
        imageList.forEach(image => {
            const item = document.createElement('div');
            item.className = 'image-item';
            item.innerHTML = `
                <img src="${image.src}" alt="${image.name}" class="image-thumbnail">
                <span class="image-name">${image.name}</span>
                <button class="remove-btn" onclick="generator.removeImage('${type}', '${image.id}')">删除</button>
            `;
            listElement.appendChild(item);
        });
    }

    removeImage(type, id) {
        const imageList = type === 'personal' ? this.personalImages : this.teamImages;
        const index = imageList.findIndex(img => img.id == id);
        if (index > -1) {
            imageList.splice(index, 1);
            this.updateImageList(type);
        }
    }

    // 设置操作按钮功能
    setupActionButtons() {
        // 个人框按钮
        const personalGenerateBtn = document.getElementById('personal-generate');
        const personalDownloadAllBtn = document.getElementById('personal-download-all');
        const personalClearBtn = document.getElementById('personal-clear');
        personalGenerateBtn.addEventListener('click', () => {
            if (personalGenerateBtn.dataset.state === 'clear') {
                this.clearGenerated('personal');
                personalGenerateBtn.textContent = '生成图片';
                personalGenerateBtn.dataset.state = 'generate';
            } else {
                this.generatePersonalImages().then(() => {
                    personalGenerateBtn.textContent = '清除生成';
                    personalGenerateBtn.dataset.state = 'clear';
                });
            }
        });
        personalDownloadAllBtn.addEventListener('click', () => {
            this.downloadAllImages('personal');
        });
        personalClearBtn.addEventListener('click', () => {
            this.clearGenerated('personal');
            personalGenerateBtn.textContent = '生成图片';
            personalGenerateBtn.dataset.state = 'generate';
        });

        // 团队框按钮
        const teamGenerateBtn = document.getElementById('team-generate');
        const teamDownloadAllBtn = document.getElementById('team-download-all');
        const teamClearBtn = document.getElementById('team-clear');
        teamGenerateBtn.addEventListener('click', () => {
            if (teamGenerateBtn.dataset.state === 'clear') {
                this.clearGenerated('team');
                teamGenerateBtn.textContent = '生成图片';
                teamGenerateBtn.dataset.state = 'generate';
            } else {
                this.generateTeamImages().then(() => {
                    teamGenerateBtn.textContent = '清除生成';
                    teamGenerateBtn.dataset.state = 'clear';
                });
            }
        });
        teamDownloadAllBtn.addEventListener('click', () => {
            this.downloadAllImages('team');
        });
        teamClearBtn.addEventListener('click', () => {
            this.clearGenerated('team');
            teamGenerateBtn.textContent = '生成图片';
            teamGenerateBtn.dataset.state = 'generate';
        });
    }

    // 生成个人框图片
    async generatePersonalImages() {
        if (this.personalImages.length === 0) {
            alert('请先上传图片');
            return;
        }

        const progressSection = document.getElementById('personal-progress');
        const progressFill = document.getElementById('personal-progress-fill');
        const progressText = document.getElementById('personal-progress-text');
        
        progressSection.style.display = 'block';
        this.personalGeneratedImages = [];

        const total = this.personalImages.length;
        
        for (let i = 0; i < total; i++) {
            const image = this.personalImages[i];
            const generatedImage = await this.createPersonalFrame(image);
            this.personalGeneratedImages.push(generatedImage);
            
            // 更新进度
            const progress = Math.round(((i + 1) / total) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // 添加小延迟以显示进度
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        progressSection.style.display = 'none';
        this.updatePreview('personal');
    }

    // 工具函数：将文件名后缀替换为 .png
    getPngFileName(name) {
        return name.replace(/\.[^.]+$/, '.png');
    }

    // 创建个人框架
    createPersonalFrame(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', {
                alpha: true, // 允许透明
                desynchronized: false,
                colorSpace: 'srgb'
            });
            // 设置画布尺寸
            canvas.width = 1228;
            canvas.height = 1350;
            // 禁用图像平滑以保持原始质量
            ctx.imageSmoothingEnabled = false;
            const img = new Image();
            img.onload = () => {
                // 不再填充白色背景，保持透明
                // 创建圆形遮罩
                const centerX = canvas.width / 2;
                const centerY = 106 + 510; // 距离顶部106px + 圆形半径510px
                const radius = 510; // 1020px直径的一半
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.clip();
                // 计算等比缩放和居中裁剪参数
                const size = 1020;
                const x = (canvas.width - size) / 2;
                const y = 106;
                // 保持比例填满圆形区域
                const imgRatio = img.width / img.height;
                const targetRatio = 1; // 圆形区域为正方形
                let drawW, drawH, sx, sy, sWidth, sHeight;
                if (imgRatio > targetRatio) {
                    // 图片更宽，按高缩放，左右裁剪
                    drawH = img.height;
                    drawW = img.height * targetRatio;
                    sx = (img.width - drawW) / 2;
                    sy = 0;
                    sWidth = drawW;
                    sHeight = drawH;
                } else {
                    // 图片更高，按宽缩放，上下裁剪
                    drawW = img.width;
                    drawH = img.width / targetRatio;
                    sx = 0;
                    sy = (img.height - drawH) / 2;
                    sWidth = drawW;
                    sHeight = drawH;
                }
                ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, size, size);
                ctx.restore();
                // 绘制前景框架
                if (this.frameImages['assets/img/headkuang.png']) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(this.frameImages['assets/img/headkuang.png'], 0, 0, canvas.width, canvas.height);
                }
                // 生成结果 - 使用最高质量PNG输出，文件名与上传文件名一致，后缀为.png
                const generatedImage = {
                    canvas: canvas,
                    dataUrl: canvas.toDataURL('image/png', 1.0),
                    name: this.getPngFileName(imageData.name),
                    id: Date.now() + Math.random()
                };
                resolve(generatedImage);
            };
            img.src = imageData.src;
        });
    }

    // 生成团队框图片
    async generateTeamImages() {
        if (this.teamImages.length === 0) {
            alert('请先上传图片');
            return;
        }

        const progressSection = document.getElementById('team-progress');
        const progressFill = document.getElementById('team-progress-fill');
        const progressText = document.getElementById('team-progress-text');
        
        progressSection.style.display = 'block';
        this.teamGeneratedImages = [];

        const total = this.teamImages.length;
        
        for (let i = 0; i < total; i++) {
            const image = this.teamImages[i];
            const generatedImage = await this.createTeamFrame(image);
            this.teamGeneratedImages.push(generatedImage);
            
            // 更新进度
            const progress = Math.round(((i + 1) / total) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // 添加小延迟以显示进度
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        progressSection.style.display = 'none';
        this.updatePreview('team');
    }

    // 创建团队框架
    createTeamFrame(imageData) {
        return new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                // 固定参数
                const targetWidth = 1832;
                const targetX = 44;
                const targetY = 85;
                const bottomPadding = 42;
                // 按宽度等比缩放图片
                const scale = targetWidth / tempImg.width;
                const targetHeight = tempImg.height * scale;
                // 画布宽度固定1920，高度为Y+图片高+底部留白
                const canvasWidth = 1920;
                const canvasHeight = targetY + targetHeight + bottomPadding;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', {
                    alpha: true, // 允许透明
                    desynchronized: false,
                    colorSpace: 'srgb'
                });
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                ctx.imageSmoothingEnabled = false;
                // 绘制上传图片
                ctx.drawImage(tempImg, 0, 0, tempImg.width, tempImg.height, targetX, targetY, targetWidth, targetHeight);
                // 绘制框架
                this.drawTeamFrames(ctx, canvas.width, canvas.height);
                // 生成结果 - 使用最高质量PNG输出，文件名与上传文件名一致，后缀为.png
                const generatedImage = {
                    canvas: canvas,
                    dataUrl: canvas.toDataURL('image/png', 1.0),
                    name: this.getPngFileName(imageData.name),
                    id: Date.now() + Math.random()
                };
                resolve(generatedImage);
            };
            tempImg.src = imageData.src;
        });
    }

    // 绘制团队框架 - 3个部分：上框、两侧框、下框，三者首尾衔接
    drawTeamFrames(ctx, width, height) {
        // 计算上框和下框的实际高度
        let topHeight = 0, bottomHeight = 0;
        if (this.frameImages['assets/img/上框.png']) {
            const topFrame = this.frameImages['assets/img/上框.png'];
            topHeight = topFrame.height * (width / topFrame.width);
        }
        if (this.frameImages['assets/img/下框.png']) {
            const bottomFrame = this.frameImages['assets/img/下框.png'];
            bottomHeight = bottomFrame.height * (width / bottomFrame.width);
        }
        // 计算两侧框的实际高度
        const sideHeight = height - topHeight - bottomHeight;
        // 启用高质量图像平滑
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // 1. 绘制上框（顶部对齐）
        if (this.frameImages['assets/img/上框.png']) {
            ctx.drawImage(this.frameImages['assets/img/上框.png'], 0, 0, width, topHeight);
        }
        // 2. 绘制两侧框（紧接上框下方，底端与下框顶端衔接）
        if (this.frameImages['assets/img/两侧框.png'] && sideHeight > 0) {
            ctx.drawImage(this.frameImages['assets/img/两侧框.png'], 0, topHeight, width, sideHeight);
        }
        // 3. 绘制下框（底部对齐）
        if (this.frameImages['assets/img/下框.png']) {
            ctx.drawImage(this.frameImages['assets/img/下框.png'], 0, height - bottomHeight, width, bottomHeight);
        }
    }

    // 拖拽上传区域
    setupDropAreas() {
        const personalDrop = document.getElementById('personal-drop-area');
        const personalInput = document.getElementById('personal-upload');
        personalDrop.addEventListener('click', () => personalInput.click());
        personalDrop.addEventListener('dragover', e => {
            e.preventDefault();
            personalDrop.classList.add('dragover');
        });
        personalDrop.addEventListener('dragleave', e => {
            e.preventDefault();
            personalDrop.classList.remove('dragover');
        });
        personalDrop.addEventListener('drop', e => {
            e.preventDefault();
            personalDrop.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files, 'personal');
        });

        const teamDrop = document.getElementById('team-drop-area');
        const teamInput = document.getElementById('team-upload');
        teamDrop.addEventListener('click', () => teamInput.click());
        teamDrop.addEventListener('dragover', e => {
            e.preventDefault();
            teamDrop.classList.add('dragover');
        });
        teamDrop.addEventListener('dragleave', e => {
            e.preventDefault();
            teamDrop.classList.remove('dragover');
        });
        teamDrop.addEventListener('drop', e => {
            e.preventDefault();
            teamDrop.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files, 'team');
        });
    }

    // 预览大图弹窗
    setupModal() {
        this.modal = document.getElementById('image-modal');
        this.modalImg = document.getElementById('modal-image');
        this.modalClose = document.getElementById('modal-close');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalDownload = document.getElementById('modal-download');
        this.currentModalImage = null;

        this.modalClose.onclick = () => this.hideModal();
        this.modalOverlay.onclick = () => this.hideModal();
        this.modalImg.onclick = e => e.stopPropagation();
        this.modalDownload.onclick = () => {
            if (this.currentModalImage) {
                const link = document.createElement('a');
                link.href = this.currentModalImage.dataUrl;
                link.download = this.currentModalImage.name;
                link.click();
            }
        };
        // 点击弹窗内容外部关闭
        this.modal.addEventListener('click', e => {
            if (e.target === this.modal) this.hideModal();
        });
    }
    showModal(image) {
        this.currentModalImage = image;
        this.modalImg.src = image.dataUrl;
        this.modal.style.display = 'flex';
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 10);
    }
    hideModal() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.modalImg.src = '';
            this.currentModalImage = null;
        }, 200);
    }

    // 更新预览
    updatePreview(type) {
        const generatedImages = type === 'personal' ? this.personalGeneratedImages : this.teamGeneratedImages;
        const previewArea = document.getElementById(`${type}-preview`);
        
        previewArea.innerHTML = '';
        
        generatedImages.forEach(image => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="${image.dataUrl}" alt="${image.name}" class="preview-image">
            `;
            // 点击图片弹出大图
            item.querySelector('.preview-image').onclick = (e) => {
                e.stopPropagation();
                this.showModal(image);
            };
            previewArea.appendChild(item);
        });
        // 按钮状态联动
        const generateBtn = document.getElementById(`${type}-generate`);
        if (generatedImages.length > 0) {
            generateBtn.textContent = '清除生成';
            generateBtn.dataset.state = 'clear';
        } else {
            generateBtn.textContent = '生成图片';
            generateBtn.dataset.state = 'generate';
        }
    }

    // 下载单个图片
    downloadImage(type, id) {
        const generatedImages = type === 'personal' ? this.personalGeneratedImages : this.teamGeneratedImages;
        const image = generatedImages.find(img => img.id == id);
        
        if (image) {
            const link = document.createElement('a');
            link.download = image.name;
            link.href = image.dataUrl;
            link.click();
        }
    }

    // 批量下载所有图片
    async downloadAllImages(type) {
        const generatedImages = type === 'personal' ? this.personalGeneratedImages : this.teamGeneratedImages;
        
        if (generatedImages.length === 0) {
            alert('没有可下载的图片');
            return;
        }

        // 创建ZIP文件
        const zip = new JSZip();
        
        generatedImages.forEach(image => {
            const base64Data = image.dataUrl.split(',')[1];
            zip.file(`${image.name}.png`, base64Data, {base64: true});
        });

        // 生成并下载ZIP文件
        const content = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${type}_images.zip`;
        link.click();
    }

    // 清除历史生成
    clearGenerated(type) {
        if (type === 'personal') {
            this.personalGeneratedImages = [];
            document.getElementById('personal-preview').innerHTML = '';
        } else {
            this.teamGeneratedImages = [];
            document.getElementById('team-preview').innerHTML = '';
        }
    }

    // 清空已上传图片按钮
    setupClearUploadBtns() {
        document.getElementById('personal-clear-upload').onclick = () => {
            this.personalImages = [];
            this.updateImageList('personal');
        };
        document.getElementById('team-clear-upload').onclick = () => {
            this.teamImages = [];
            this.updateImageList('team');
        };
    }
}

// 初始化生成器
const generator = new SpotBonusGenerator();

// 添加JSZip库
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(script); 