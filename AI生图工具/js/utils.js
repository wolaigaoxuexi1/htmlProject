/**
 * 工具函数库
 */

// 本地存储管理
const Storage = {
  // 获取API密钥
  getApiKey() {
    return localStorage.getItem('ai_image_generator_api_key') || '';
  },

  // 设置API密钥
  setApiKey(apiKey) {
    localStorage.setItem('ai_image_generator_api_key', apiKey);
  },

  // 获取默认设置
  getDefaultSettings() {
    const defaultSettings = {
      image_size: '1024x1024',
      batch_size: 1,
      num_inference_steps: 20,
      guidance_scale: 7.5,
      negative_prompt: ''
    };

    const saved = localStorage.getItem('ai_image_generator_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to parse saved settings:', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  },

  // 保存默认设置
  saveDefaultSettings(settings) {
    localStorage.setItem('ai_image_generator_settings', JSON.stringify(settings));
  }
};

// DOM操作工具
const DOM = {
  // 获取元素
  $(selector) {
    return document.querySelector(selector);
  },

  // 获取所有元素
  $$(selector) {
    return document.querySelectorAll(selector);
  },

  // 添加类名
  addClass(element, className) {
    if (element) {
      element.classList.add(className);
    }
  },

  // 移除类名
  removeClass(element, className) {
    if (element) {
      element.classList.remove(className);
    }
  },

  // 切换类名
  toggleClass(element, className) {
    if (element) {
      element.classList.toggle(className);
    }
  },

  // 显示元素
  show(element) {
    this.removeClass(element, 'hidden');
  },

  // 隐藏元素
  hide(element) {
    this.addClass(element, 'hidden');
  },

  // 设置元素内容
  setContent(element, content) {
    if (element) {
      element.innerHTML = content;
    }
  },

  // 设置元素文本
  setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  },

  // 设置元素值
  setValue(element, value) {
    if (element) {
      element.value = value;
    }
  },

  // 获取元素值
  getValue(element) {
    return element ? element.value : '';
  }
};

// 验证工具
const Validator = {
  // 验证API密钥格式
  isValidApiKey(apiKey) {
    return typeof apiKey === 'string' && apiKey.trim().length > 0;
  },

  // 验证提示词
  isValidPrompt(prompt) {
    return typeof prompt === 'string' && prompt.trim().length > 0;
  },

  // 验证数字范围
  isInRange(value, min, max) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  // 验证整数
  isInteger(value) {
    const num = parseInt(value);
    return !isNaN(num) && num.toString() === value.toString();
  }
};

// 格式化工具
const Formatter = {
  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 格式化时间
  formatTime(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  },

  // 截断文本
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
};

// 随机数工具
const Random = {
  // 生成随机整数
  integer(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 生成随机种子
  seed() {
    return this.integer(0, 9999999999);
  },

  // 生成UUID
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// 下载工具
const Download = {
  // 下载图片
  async downloadImage(url, filename) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || `ai-generated-${Date.now()}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  },

  // 生成文件名
  generateFilename(prompt, timestamp) {
    const cleanPrompt = prompt
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .toLowerCase()
      .substring(0, 30); // 限制长度
    
    const date = new Date(timestamp);
    const dateStr = date.toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    return `${cleanPrompt}-${dateStr}.png`;
  }
};

// 错误处理工具
const ErrorHandler = {
  // 显示错误消息
  showError(message, duration = 5000) {
    this.showNotification(message, 'error', duration);
  },

  // 显示成功消息
  showSuccess(message, duration = 3000) {
    this.showNotification(message, 'success', duration);
  },

  // 显示信息消息
  showInfo(message, duration = 3000) {
    this.showNotification(message, 'info', duration);
  },

  // 显示通知
  showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // 添加样式
    this.addNotificationStyles();

    // 添加到页面
    document.body.appendChild(notification);

    // 添加关闭事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // 自动移除
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
  },

  // 获取图标
  getIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  },

  // 移除通知
  removeNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        notification.parentNode.removeChild(notification);
      }, 300);
    }
  },

  // 添加通知样式
  addNotificationStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 500px;
        animation: slideIn 0.3s ease-out;
      }
      
      .notification-success { border-left: 4px solid #10b981; }
      .notification-error { border-left: 4px solid #ef4444; }
      .notification-warning { border-left: 4px solid #f59e0b; }
      .notification-info { border-left: 4px solid #3b82f6; }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      
      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
        border-radius: 4px;
      }
      
      .notification-close:hover {
        background-color: #f3f4f6;
      }
      
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
  }
};

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
