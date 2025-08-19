/**
 * 主应用入口文件
 */

class AIImageGenerator {
  constructor() {
    this.version = '1.0.0';
    this.initialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.initialized) return;

    try {
      console.log(`AI生图工具 v${this.version} 正在启动...`);

      // 检查浏览器兼容性
      this.checkBrowserCompatibility();

      // 初始化UI
      ui.init();

      // 检查API密钥
      this.checkApiKey();

      // 设置全局错误处理
      this.setupGlobalErrorHandling();

      // 添加页面可见性变化监听
      this.setupVisibilityChangeHandler();

      this.initialized = true;
      console.log('AI生图工具初始化完成');

      // 显示欢迎信息
      this.showWelcomeMessage();

    } catch (error) {
      console.error('应用初始化失败:', error);
      ErrorHandler.showError('应用初始化失败，请刷新页面重试');
    }
  }

  /**
   * 检查浏览器兼容性
   */
  checkBrowserCompatibility() {
    const requiredFeatures = [
      'fetch',
      'localStorage',
      'Promise',
      'async',
      'classList'
    ];

    const missingFeatures = requiredFeatures.filter(feature => {
      switch (feature) {
        case 'fetch':
          return !window.fetch;
        case 'localStorage':
          return !window.localStorage;
        case 'Promise':
          return !window.Promise;
        case 'async':
          return !window.Symbol || !window.Symbol.asyncIterator;
        case 'classList':
          return !document.documentElement.classList;
        default:
          return false;
      }
    });

    if (missingFeatures.length > 0) {
      const message = `您的浏览器不支持以下功能: ${missingFeatures.join(', ')}。请升级到现代浏览器。`;
      alert(message);
      throw new Error(message);
    }

    // 检查是否为HTTPS（API调用需要）
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.warn('建议使用HTTPS协议以确保API调用正常工作');
    }
  }

  /**
   * 检查API密钥
   */
  checkApiKey() {
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      setTimeout(() => {
        ErrorHandler.showInfo('请先在设置中配置您的硅基流动API密钥', 5000);
      }, 1000);
    }
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise错误:', event.reason);
      ErrorHandler.showError('发生了未知错误，请重试');
      event.preventDefault();
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('全局错误:', event.error);
      // 不显示技术错误给用户，只记录到控制台
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        console.error('资源加载错误:', event.target.src || event.target.href);
      }
    }, true);
  }

  /**
   * 设置页面可见性变化处理
   */
  setupVisibilityChangeHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时暂停某些操作
        console.log('页面已隐藏');
      } else {
        // 页面显示时恢复操作
        console.log('页面已显示');
        // 可以在这里检查是否有新的API响应等
      }
    });
  }

  /**
   * 显示欢迎信息
   */
  showWelcomeMessage() {
    const hasShownWelcome = localStorage.getItem('ai_image_generator_welcome_shown');
    if (!hasShownWelcome) {
      setTimeout(() => {
        ErrorHandler.showInfo('欢迎使用AI生图工具！点击右上角的帮助按钮查看使用说明。', 6000);
        localStorage.setItem('ai_image_generator_welcome_shown', 'true');
      }, 2000);
    }
  }

  /**
   * 获取应用信息
   */
  getAppInfo() {
    return {
      name: 'AI生图工具',
      version: this.version,
      description: '基于硅基流动API的AI图像生成工具',
      author: 'AI Assistant',
      repository: 'https://github.com/your-repo/ai-image-generator',
      license: 'MIT',
      dependencies: {
        'SiliconFlow API': 'v1',
        'Font Awesome': '6.4.0'
      },
      features: [
        '文本到图片生成',
        '多种图片尺寸',
        '参数自定义',
        '批量生成',
        '图片下载',
        '响应式设计'
      ]
    };
  }

  /**
   * 获取使用统计
   */
  getUsageStats() {
    const stats = {
      totalGenerations: parseInt(localStorage.getItem('ai_image_generator_total_generations') || '0'),
      totalImages: parseInt(localStorage.getItem('ai_image_generator_total_images') || '0'),
      lastUsed: localStorage.getItem('ai_image_generator_last_used'),
      favoriteSize: localStorage.getItem('ai_image_generator_favorite_size') || '1024x1024'
    };

    return stats;
  }

  /**
   * 更新使用统计
   */
  updateUsageStats(generatedImages) {
    const stats = this.getUsageStats();
    
    stats.totalGenerations += 1;
    stats.totalImages += generatedImages;
    stats.lastUsed = new Date().toISOString();

    localStorage.setItem('ai_image_generator_total_generations', stats.totalGenerations.toString());
    localStorage.setItem('ai_image_generator_total_images', stats.totalImages.toString());
    localStorage.setItem('ai_image_generator_last_used', stats.lastUsed);
  }

  /**
   * 清理应用数据
   */
  clearAppData() {
    const keys = [
      'ai_image_generator_api_key',
      'ai_image_generator_settings',
      'ai_image_generator_welcome_shown',
      'ai_image_generator_total_generations',
      'ai_image_generator_total_images',
      'ai_image_generator_last_used',
      'ai_image_generator_favorite_size'
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('应用数据已清理');
  }

  /**
   * 导出设置
   */
  exportSettings() {
    const settings = {
      version: this.version,
      exportDate: new Date().toISOString(),
      apiKey: Storage.getApiKey(),
      defaultSettings: Storage.getDefaultSettings(),
      usageStats: this.getUsageStats()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-image-generator-settings-${new Date().toISOString().slice(0, 10)}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    ErrorHandler.showSuccess('设置已导出');
  }

  /**
   * 导入设置
   */
  importSettings(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          
          if (settings.apiKey) {
            Storage.setApiKey(settings.apiKey);
          }
          
          if (settings.defaultSettings) {
            Storage.saveDefaultSettings(settings.defaultSettings);
          }
          
          // 重新加载UI设置
          ui.loadSettings();
          
          ErrorHandler.showSuccess('设置已导入');
          resolve(settings);
        } catch (error) {
          ErrorHandler.showError('设置文件格式错误');
          reject(error);
        }
      };
      
      reader.onerror = () => {
        ErrorHandler.showError('文件读取失败');
        reject(new Error('File read failed'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * 检查更新
   */
  async checkForUpdates() {
    try {
      // 这里可以实现版本检查逻辑
      console.log('检查更新中...');
      
      // 模拟检查更新
      const hasUpdate = false;
      
      if (hasUpdate) {
        ErrorHandler.showInfo('发现新版本，请访问项目页面下载最新版本');
      } else {
        console.log('当前已是最新版本');
      }
    } catch (error) {
      console.warn('检查更新失败:', error);
    }
  }

  /**
   * 获取帮助信息
   */
  getHelpInfo() {
    return {
      quickStart: [
        '1. 在设置中配置硅基流动API密钥',
        '2. 输入图片描述（提示词）',
        '3. 调整参数（可选）',
        '4. 点击生成按钮',
        '5. 等待生成完成并下载图片'
      ],
      tips: [
        '使用具体、详细的描述可以获得更好的结果',
        '负面提示词可以排除不想要的内容',
        '推理步数越高质量越好，但生成时间越长',
        '相同的种子值会生成相似的图片',
        '支持中英文提示词'
      ],
      troubleshooting: [
        '如果生成失败，请检查API密钥是否正确',
        '如果图片无法下载，请检查浏览器权限设置',
        '如果页面卡顿，请尝试刷新页面',
        '如果遇到网络错误，请检查网络连接'
      ]
    };
  }
}

// 创建应用实例
const app = new AIImageGenerator();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// 导出应用实例（用于调试）
window.aiImageGenerator = app;
