/**
 * UI交互逻辑模块
 */

class UIManager {
  constructor() {
    this.elements = {};
    this.currentImages = [];
    this.isGenerating = false;
    this.progressInterval = null;
  }

  /**
   * 初始化UI
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSettings();
    this.updateSliderValues();
    this.addTooltips();
    this.setupKeyboardShortcuts();
    this.addPageLoadAnimation();
  }

  /**
   * 缓存DOM元素
   */
  cacheElements() {
    this.elements = {
      // 表单元素
      promptInput: DOM.$('#promptInput'),
      negativePromptInput: DOM.$('#negativePromptInput'),
      imageSizeSelect: DOM.$('#imageSizeSelect'),
      batchSizeInput: DOM.$('#batchSizeInput'),
      stepsInput: DOM.$('#stepsInput'),
      stepsValue: DOM.$('#stepsValue'),
      guidanceInput: DOM.$('#guidanceInput'),
      guidanceValue: DOM.$('#guidanceValue'),
      seedInput: DOM.$('#seedInput'),
      randomSeedBtn: DOM.$('#randomSeedBtn'),
      generateBtn: DOM.$('#generateBtn'),

      // 显示区域
      emptyState: DOM.$('#emptyState'),
      loadingState: DOM.$('#loadingState'),
      resultGrid: DOM.$('#resultGrid'),
      progressFill: DOM.$('#progressFill'),

      // 模态框
      settingsModal: DOM.$('#settingsModal'),
      helpModal: DOM.$('#helpModal'),
      overlay: DOM.$('#overlay'),
      apiKeyInput: DOM.$('#apiKeyInput'),

      // 按钮
      settingsBtn: DOM.$('#settingsBtn'),
      helpBtn: DOM.$('#helpBtn'),
      saveSettings: DOM.$('#saveSettings'),
      cancelSettings: DOM.$('#cancelSettings'),
      closeSettingsModal: DOM.$('#closeSettingsModal'),
      closeHelpModal: DOM.$('#closeHelpModal'),
      closeHelp: DOM.$('#closeHelp')
    };
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 生成按钮
    this.elements.generateBtn.addEventListener('click', () => {
      this.handleGenerate();
    });

    // 随机种子按钮
    this.elements.randomSeedBtn.addEventListener('click', () => {
      this.generateRandomSeed();
    });

    // 滑块值更新
    this.elements.stepsInput.addEventListener('input', (e) => {
      DOM.setText(this.elements.stepsValue, e.target.value);
    });

    this.elements.guidanceInput.addEventListener('input', (e) => {
      DOM.setText(this.elements.guidanceValue, e.target.value);
    });

    // 模态框控制
    this.elements.settingsBtn.addEventListener('click', () => {
      this.showSettingsModal();
    });

    this.elements.helpBtn.addEventListener('click', () => {
      this.showHelpModal();
    });

    this.elements.saveSettings.addEventListener('click', () => {
      this.saveSettings();
    });

    this.elements.cancelSettings.addEventListener('click', () => {
      this.hideSettingsModal();
    });

    this.elements.closeSettingsModal.addEventListener('click', () => {
      this.hideSettingsModal();
    });

    this.elements.closeHelpModal.addEventListener('click', () => {
      this.hideHelpModal();
    });

    this.elements.closeHelp.addEventListener('click', () => {
      this.hideHelpModal();
    });

    this.elements.overlay.addEventListener('click', () => {
      this.hideAllModals();
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // 表单验证
    this.elements.promptInput.addEventListener('input', 
      debounce(() => this.validateForm(), 300)
    );

    // 参数变化时保存设置
    [
      this.elements.imageSizeSelect,
      this.elements.batchSizeInput,
      this.elements.stepsInput,
      this.elements.guidanceInput,
      this.elements.negativePromptInput
    ].forEach(element => {
      element.addEventListener('change', () => {
        this.saveCurrentSettings();
      });
    });
  }

  /**
   * 加载设置
   */
  loadSettings() {
    const settings = Storage.getDefaultSettings();
    const apiKey = Storage.getApiKey();

    // 加载表单设置
    DOM.setValue(this.elements.imageSizeSelect, settings.image_size);
    DOM.setValue(this.elements.batchSizeInput, settings.batch_size);
    DOM.setValue(this.elements.stepsInput, settings.num_inference_steps);
    DOM.setValue(this.elements.guidanceInput, settings.guidance_scale);
    DOM.setValue(this.elements.negativePromptInput, settings.negative_prompt);

    // 加载API密钥
    DOM.setValue(this.elements.apiKeyInput, apiKey);

    this.validateForm();
  }

  /**
   * 保存当前设置
   */
  saveCurrentSettings() {
    const settings = {
      image_size: DOM.getValue(this.elements.imageSizeSelect),
      batch_size: parseInt(DOM.getValue(this.elements.batchSizeInput)),
      num_inference_steps: parseInt(DOM.getValue(this.elements.stepsInput)),
      guidance_scale: parseFloat(DOM.getValue(this.elements.guidanceInput)),
      negative_prompt: DOM.getValue(this.elements.negativePromptInput)
    };

    Storage.saveDefaultSettings(settings);
  }

  /**
   * 更新滑块显示值
   */
  updateSliderValues() {
    DOM.setText(this.elements.stepsValue, DOM.getValue(this.elements.stepsInput));
    DOM.setText(this.elements.guidanceValue, DOM.getValue(this.elements.guidanceInput));
  }

  /**
   * 生成随机种子
   */
  generateRandomSeed() {
    const seed = Random.seed();
    DOM.setValue(this.elements.seedInput, seed);
  }

  /**
   * 验证表单
   */
  validateForm() {
    const prompt = DOM.getValue(this.elements.promptInput).trim();
    const apiKey = Storage.getApiKey();
    
    const isValid = Validator.isValidPrompt(prompt) && Validator.isValidApiKey(apiKey);
    
    this.elements.generateBtn.disabled = !isValid || this.isGenerating;
    
    return isValid;
  }

  /**
   * 处理生成请求
   */
  async handleGenerate() {
    if (!this.validateForm() || this.isGenerating) {
      return;
    }

    const params = this.getFormParams();
    
    try {
      this.setGeneratingState(true);
      this.showLoadingState();
      this.startProgressAnimation();

      const result = await api.generateImage(params);
      
      this.currentImages = result.images;
      this.showResults();
      
      ErrorHandler.showSuccess(`成功生成 ${result.images.length} 张图片`);
    } catch (error) {
      ErrorHandler.showError(error.message);
      this.showEmptyState();
    } finally {
      this.setGeneratingState(false);
      this.stopProgressAnimation();
    }
  }

  /**
   * 获取表单参数
   */
  getFormParams() {
    return {
      prompt: DOM.getValue(this.elements.promptInput).trim(),
      negative_prompt: DOM.getValue(this.elements.negativePromptInput).trim(),
      image_size: DOM.getValue(this.elements.imageSizeSelect),
      batch_size: parseInt(DOM.getValue(this.elements.batchSizeInput)),
      num_inference_steps: parseInt(DOM.getValue(this.elements.stepsInput)),
      guidance_scale: parseFloat(DOM.getValue(this.elements.guidanceInput)),
      seed: DOM.getValue(this.elements.seedInput) ? parseInt(DOM.getValue(this.elements.seedInput)) : null
    };
  }

  /**
   * 设置生成状态
   */
  setGeneratingState(isGenerating) {
    this.isGenerating = isGenerating;
    this.elements.generateBtn.disabled = isGenerating;
    
    if (isGenerating) {
      DOM.setContent(this.elements.generateBtn, `
        <i class="fas fa-spinner fa-spin"></i>
        <span>生成中...</span>
      `);
    } else {
      DOM.setContent(this.elements.generateBtn, `
        <i class="fas fa-magic"></i>
        <span>生成图片</span>
      `);
    }
  }

  /**
   * 显示空状态
   */
  showEmptyState() {
    DOM.hide(this.elements.loadingState);
    DOM.hide(this.elements.resultGrid);
    DOM.show(this.elements.emptyState);
  }

  /**
   * 显示加载状态
   */
  showLoadingState() {
    DOM.hide(this.elements.emptyState);
    DOM.hide(this.elements.resultGrid);
    DOM.show(this.elements.loadingState);
  }

  /**
   * 显示结果
   */
  showResults() {
    DOM.hide(this.elements.emptyState);
    DOM.hide(this.elements.loadingState);
    DOM.show(this.elements.resultGrid);
    
    this.renderImages();
  }

  /**
   * 渲染图片
   */
  renderImages() {
    const html = this.currentImages.map(image => this.createImageCard(image)).join('');
    DOM.setContent(this.elements.resultGrid, html);
    
    // 绑定图片卡片事件
    this.bindImageCardEvents();
  }

  /**
   * 创建图片卡片HTML
   */
  createImageCard(image) {
    const filename = Download.generateFilename(image.prompt, new Date(image.created_at));
    
    return `
      <div class="image-card" data-image-id="${image.id}">
        <div class="image-container">
          <img src="${image.url}" alt="${Formatter.truncateText(image.prompt, 100)}" loading="lazy">
          <div class="image-actions">
            <button class="action-btn download-btn" title="下载图片">
              <i class="fas fa-download"></i>
            </button>
            <button class="action-btn copy-btn" title="复制图片链接">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
        <div class="image-info">
          <div class="image-prompt">${Formatter.truncateText(image.prompt, 80)}</div>
          <div class="image-meta">
            <span>${image.parameters.image_size}</span>
            <span>步数: ${image.parameters.num_inference_steps}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 绑定图片卡片事件
   */
  bindImageCardEvents() {
    // 下载按钮
    DOM.$$('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDownload(btn);
      });
    });

    // 复制链接按钮
    DOM.$$('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCopyLink(btn);
      });
    });
  }

  /**
   * 处理下载
   */
  async handleDownload(btn) {
    const card = btn.closest('.image-card');
    const imageId = card.dataset.imageId;
    const image = this.currentImages.find(img => img.id === imageId);
    
    if (image) {
      const filename = Download.generateFilename(image.prompt, new Date(image.created_at));
      const success = await Download.downloadImage(image.url, filename);
      
      if (success) {
        ErrorHandler.showSuccess('图片下载成功');
      } else {
        ErrorHandler.showError('图片下载失败');
      }
    }
  }

  /**
   * 处理复制链接
   */
  async handleCopyLink(btn) {
    const card = btn.closest('.image-card');
    const imageId = card.dataset.imageId;
    const image = this.currentImages.find(img => img.id === imageId);
    
    if (image) {
      try {
        await navigator.clipboard.writeText(image.url);
        ErrorHandler.showSuccess('图片链接已复制到剪贴板');
      } catch (error) {
        ErrorHandler.showError('复制失败，请手动复制');
      }
    }
  }

  /**
   * 开始进度动画
   */
  startProgressAnimation() {
    let progress = 0;
    this.progressInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      
      this.elements.progressFill.style.width = `${progress}%`;
    }, 500);
  }

  /**
   * 停止进度动画
   */
  stopProgressAnimation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.elements.progressFill.style.width = '100%';
    
    setTimeout(() => {
      this.elements.progressFill.style.width = '0%';
    }, 500);
  }

  /**
   * 显示设置模态框
   */
  showSettingsModal() {
    DOM.setValue(this.elements.apiKeyInput, Storage.getApiKey());
    DOM.show(this.elements.overlay);
    DOM.show(this.elements.settingsModal);
  }

  /**
   * 隐藏设置模态框
   */
  hideSettingsModal() {
    DOM.hide(this.elements.settingsModal);
    DOM.hide(this.elements.overlay);
  }

  /**
   * 显示帮助模态框
   */
  showHelpModal() {
    DOM.show(this.elements.overlay);
    DOM.show(this.elements.helpModal);
  }

  /**
   * 隐藏帮助模态框
   */
  hideHelpModal() {
    DOM.hide(this.elements.helpModal);
    DOM.hide(this.elements.overlay);
  }

  /**
   * 隐藏所有模态框
   */
  hideAllModals() {
    DOM.hide(this.elements.settingsModal);
    DOM.hide(this.elements.helpModal);
    DOM.hide(this.elements.overlay);
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    const apiKey = DOM.getValue(this.elements.apiKeyInput).trim();
    
    if (!apiKey) {
      ErrorHandler.showError('请输入API密钥');
      return;
    }

    try {
      // 验证API密钥
      const isValid = await api.validateApiKey(apiKey);
      if (!isValid) {
        ErrorHandler.showError('API密钥无效，请检查后重试');
        return;
      }

      Storage.setApiKey(apiKey);
      this.hideSettingsModal();
      this.validateForm();
      
      ErrorHandler.showSuccess('设置保存成功');
    } catch (error) {
      ErrorHandler.showError('API密钥验证失败，请检查网络连接');
    }
  }

  /**
   * 处理键盘事件
   */
  handleKeydown(e) {
    // Ctrl/Cmd + Enter 生成图片
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.handleGenerate();
    }

    // Escape 关闭模态框
    if (e.key === 'Escape') {
      this.hideAllModals();
    }
  }

  /**
   * 添加工具提示
   */
  addTooltips() {
    const tooltips = [
      { selector: '#stepsInput', text: '推理步数：越高质量越好，但生成时间越长' },
      { selector: '#guidanceInput', text: '引导系数：控制与提示词的匹配度' },
      { selector: '#seedInput', text: '随机种子：相同种子会生成相似图片' },
      { selector: '#randomSeedBtn', text: '生成随机种子' },
      { selector: '#batchSizeInput', text: '一次生成的图片数量' }
    ];

    tooltips.forEach(({ selector, text }) => {
      const element = DOM.$(selector);
      if (element) {
        element.setAttribute('data-tooltip', text);
        element.classList.add('tooltip');
      }
    });
  }

  /**
   * 设置键盘快捷键
   */
  setupKeyboardShortcuts() {
    // 添加快捷键提示
    const generateBtn = this.elements.generateBtn;
    if (generateBtn) {
      const shortcutText = navigator.platform.includes('Mac') ? 'Cmd+Enter' : 'Ctrl+Enter';
      generateBtn.setAttribute('title', `生成图片 (${shortcutText})`);
    }
  }

  /**
   * 添加页面加载动画
   */
  addPageLoadAnimation() {
    // 为主要元素添加淡入动画
    const animatedElements = [
      '.parameter-panel',
      '.generation-area'
    ];

    animatedElements.forEach((selector, index) => {
      const element = DOM.$(selector);
      if (element) {
        setTimeout(() => {
          element.classList.add('fade-in');
        }, index * 100);
      }
    });
  }

  /**
   * 添加图片懒加载
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('image-loading');
            observer.unobserve(img);
          }
        });
      });

      DOM.$$('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * 添加触摸手势支持
   */
  setupTouchGestures() {
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipeGesture();
    });
  }

  /**
   * 处理滑动手势
   */
  handleSwipeGesture() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // 向上滑动
        console.log('Swipe up detected');
      } else {
        // 向下滑动
        console.log('Swipe down detected');
      }
    }
  }

  /**
   * 添加性能监控
   */
  setupPerformanceMonitoring() {
    // 监控页面加载性能
    window.addEventListener('load', () => {
      if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('页面加载时间:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
      }
    });

    // 监控内存使用（如果支持）
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('内存使用率过高，建议刷新页面');
        }
      }, 30000); // 每30秒检查一次
    }
  }

  /**
   * 添加网络状态监控
   */
  setupNetworkMonitoring() {
    if ('navigator' in window && 'onLine' in navigator) {
      const updateNetworkStatus = () => {
        if (navigator.onLine) {
          ErrorHandler.showSuccess('网络连接已恢复');
        } else {
          ErrorHandler.showError('网络连接已断开，请检查网络设置');
        }
      };

      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);
    }
  }

  /**
   * 添加自动保存功能
   */
  setupAutoSave() {
    const autoSaveInterval = 30000; // 30秒

    setInterval(() => {
      const prompt = DOM.getValue(this.elements.promptInput);
      const negativePrompt = DOM.getValue(this.elements.negativePromptInput);

      if (prompt.trim()) {
        localStorage.setItem('ai_image_generator_draft_prompt', prompt);
        localStorage.setItem('ai_image_generator_draft_negative', negativePrompt);
      }
    }, autoSaveInterval);

    // 页面加载时恢复草稿
    this.restoreDraft();
  }

  /**
   * 恢复草稿
   */
  restoreDraft() {
    const draftPrompt = localStorage.getItem('ai_image_generator_draft_prompt');
    const draftNegative = localStorage.getItem('ai_image_generator_draft_negative');

    if (draftPrompt && !DOM.getValue(this.elements.promptInput)) {
      DOM.setValue(this.elements.promptInput, draftPrompt);
      ErrorHandler.showInfo('已恢复上次编辑的内容');
    }

    if (draftNegative && !DOM.getValue(this.elements.negativePromptInput)) {
      DOM.setValue(this.elements.negativePromptInput, draftNegative);
    }
  }

  /**
   * 清理草稿
   */
  clearDraft() {
    localStorage.removeItem('ai_image_generator_draft_prompt');
    localStorage.removeItem('ai_image_generator_draft_negative');
  }
}

// 创建UI管理器实例
const ui = new UIManager();
