// popup.js - 弹窗界面逻辑
document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  const status = document.getElementById('status');
  const result = document.getElementById('result');
  const error = document.getElementById('error');
  const downloadBtn = document.getElementById('downloadBtn');
  const copyBtn = document.getElementById('copyBtn');
  const retryBtn = document.getElementById('retryBtn');
  const progressBar = document.getElementById('progressBar');
  const errorMessage = document.getElementById('errorMessage');
  const togglePreview = document.getElementById('togglePreview');
  const previewArea = document.getElementById('previewArea');
  const previewImage = document.getElementById('previewImage');
  
  let screenshotDataUrl = null;
  let isCapturing = false;
  let captureTimeout = null;
  
  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'screenshotComplete') {
      // 清除超时定时器
      if (captureTimeout) {
        clearTimeout(captureTimeout);
        captureTimeout = null;
      }

      if (message.success) {
        screenshotDataUrl = message.dataUrl;
        showResult();
        setupPreview(message.dataUrl);
      } else {
        showError(message.error || '截图失败');
      }
      isCapturing = false;
    }
  });

  // 截图按钮点击事件
  captureBtn.addEventListener('click', async function() {
    if (isCapturing) return;

    try {
      isCapturing = true;
      showStatus();

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

      if (!tab) {
        throw new Error('无法获取当前标签页');
      }

      // 检查是否是特殊页面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        throw new Error('无法截取浏览器内部页面');
      }

      // 检查并注入content script
      let scriptInjected = false;
      try {
        // 先尝试发送测试消息检查script是否已存在
        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        scriptInjected = true;
        console.log('Content script已存在');
      } catch (pingError) {
        console.log('Content script不存在，开始注入...');

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          });
          scriptInjected = true;
          console.log('Content script注入成功');

          // 等待script初始化
          await sleep(1000);
        } catch (injectError) {
          console.error('Content script注入失败:', injectError);
          throw new Error('无法注入页面脚本，请确保页面已完全加载');
        }
      }

      // 向content script发送截图请求
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'captureFullPage'
        });

        if (!response || !response.received) {
          throw new Error('无法与页面脚本通信，请刷新页面后重试');
        }

        console.log('截图请求已发送，等待完成...');

        // 设置超时处理（30秒）
        captureTimeout = setTimeout(() => {
          if (isCapturing) {
            isCapturing = false;
            showError('截图超时，请重试。如果页面很长，请稍等片刻再试。');
          }
        }, 30000);

      } catch (messageError) {
        console.error('消息发送失败:', messageError);
        throw new Error('无法与页面脚本通信，请刷新页面后重试');
      }

    } catch (error) {
      console.error('截图错误:', error);
      showError(error.message);
      isCapturing = false;
    }
  });

  // 添加sleep函数
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 下载按钮点击事件
  downloadBtn.addEventListener('click', function() {
    if (screenshotDataUrl) {
      downloadImage(screenshotDataUrl);
    }
  });

  // 复制按钮点击事件
  copyBtn.addEventListener('click', async function() {
    if (screenshotDataUrl) {
      await copyImageToClipboard(screenshotDataUrl);
    }
  });

  // 重试按钮点击事件
  retryBtn.addEventListener('click', function() {
    hideError();
    captureBtn.click();
  });

  // 预览切换按钮事件
  togglePreview.addEventListener('click', function() {
    const isHidden = previewArea.classList.contains('hidden');
    if (isHidden) {
      previewArea.classList.remove('hidden');
      togglePreview.textContent = '收起';
    } else {
      previewArea.classList.add('hidden');
      togglePreview.textContent = '展开';
    }
  });

  // 预览图片点击事件（放大查看）
  previewImage.addEventListener('click', function() {
    if (screenshotDataUrl) {
      // 在新标签页中打开图片
      const newTab = window.open();
      newTab.document.write(`
        <html>
          <head><title>截图预览</title></head>
          <body style="margin:0; background:#f0f0f0; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <img src="${screenshotDataUrl}" style="max-width:100%; max-height:100%; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          </body>
        </html>
      `);
    }
  });
  
  // 显示加载状态
  function showStatus() {
    captureBtn.style.display = 'none';
    status.classList.remove('hidden');
    result.classList.add('hidden');
    error.classList.add('hidden');
    
    // 模拟进度条动画
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressBar.style.width = progress + '%';
    }, 200);
    
    // 保存interval ID以便清理
    status.dataset.progressInterval = progressInterval;
  }
  
  // 显示结果
  function showResult() {
    // 清理进度条动画
    const progressInterval = status.dataset.progressInterval;
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // 完成进度条
    progressBar.style.width = '100%';
    
    setTimeout(() => {
      status.classList.add('hidden');
      result.classList.remove('hidden');
      result.classList.add('fade-in');
    }, 500);
  }
  
  // 显示错误
  function showError(message) {
    // 清理进度条动画
    const progressInterval = status.dataset.progressInterval;
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    status.classList.add('hidden');
    captureBtn.style.display = 'flex';
    error.classList.remove('hidden');

    // 根据错误类型提供更友好的提示
    let friendlyMessage = message;
    if (message.includes('Could not establish connection')) {
      friendlyMessage = '无法连接到页面脚本，请刷新页面后重试';
    } else if (message.includes('Extension context invalidated')) {
      friendlyMessage = '扩展需要重新加载，请刷新页面后重试';
    } else if (message.includes('Cannot access')) {
      friendlyMessage = '无法访问此页面，请检查页面权限';
    }

    errorMessage.textContent = friendlyMessage;
  }
  
  // 隐藏错误
  function hideError() {
    error.classList.add('hidden');
  }
  
  // 下载图片
  function downloadImage(dataUrl) {
    try {
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `webpage-screenshot-${timestamp}.png`;
      link.href = dataUrl;
      
      // 创建点击事件
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 显示下载成功提示
      showDownloadSuccess();
      
    } catch (error) {
      console.error('下载失败:', error);
      showError('下载失败，请重试');
    }
  }
  
  // 设置预览
  function setupPreview(dataUrl) {
    previewImage.src = dataUrl;
    previewImage.onload = function() {
      console.log('预览图片加载完成');
    };
  }

  // 复制图片到剪贴板
  async function copyImageToClipboard(dataUrl) {
    try {
      // 将dataURL转换为Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      // 显示成功提示
      showCopySuccess();

    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案：复制dataURL
      try {
        await navigator.clipboard.writeText(dataUrl);
        showCopySuccess();
      } catch (fallbackError) {
        console.error('降级复制也失败:', fallbackError);
        alert('复制失败，请手动保存图片');
      }
    }
  }

  // 显示复制成功提示
  function showCopySuccess() {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span>✅</span><span>已复制</span>';
    copyBtn.disabled = true;

    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.disabled = false;
    }, 2000);
  }

  // 显示下载成功提示
  function showDownloadSuccess() {
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<span>✅</span><span>下载成功</span>';
    downloadBtn.disabled = true;

    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    }, 2000);
  }
  
  // 键盘快捷键支持
  document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter 触发截图
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isCapturing) {
        captureBtn.click();
      }
    }
    
    // Escape 键关闭弹窗
    if (event.key === 'Escape') {
      window.close();
    }
  });
  
  // 初始化时检查当前标签页状态
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const tab = tabs[0];
      
      // 检查是否是特殊页面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        captureBtn.disabled = true;
        captureBtn.innerHTML = '<span>⚠️</span><span>无法截取此页面</span>';
        document.querySelector('.tip').textContent = '⚠️ 无法截取浏览器内部页面';
      }
    }
  });
});
