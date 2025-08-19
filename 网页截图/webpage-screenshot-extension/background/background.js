// background.js - 后台服务脚本
console.log('网页截图扩展后台脚本已启动');

// 监听来自content script和popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('后台收到消息:', request);

  if (request.action === 'captureVisibleTab') {
    // 截取当前可见标签页
    chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 95  // 提高质量
    }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('截图失败:', chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        console.log('截图成功，数据大小:', Math.round(dataUrl.length / 1024), 'KB');
        sendResponse({
          success: true,
          dataUrl: dataUrl
        });
      }
    });

    // 返回true表示异步响应
    return true;
  }

  // 转发来自content script的截图完成消息到popup
  if (request.action === 'screenshotComplete') {
    console.log('转发截图完成消息到popup');
    // 这个消息会被popup接收
    return false; // 不需要响应
  }
});

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('网页截图扩展已安装，版本:', chrome.runtime.getManifest().version);
  
  if (details.reason === 'install') {
    console.log('首次安装扩展');
    
    // 可以在这里添加首次安装的逻辑
    // 比如打开欢迎页面或设置默认配置
  } else if (details.reason === 'update') {
    console.log('扩展已更新，之前版本:', details.previousVersion);
  }
});

// 监听扩展启动
chrome.runtime.onStartup.addListener(() => {
  console.log('浏览器启动，扩展已激活');
});

// 监听标签页更新，用于检测页面变化
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成时
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('页面加载完成:', tab.url);
    
    // 检查是否是支持截图的页面
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      // 可以在这里添加页面分析逻辑
      console.log('页面支持截图');
    } else {
      console.log('页面不支持截图:', tab.url);
    }
  }
});

// 错误处理
chrome.runtime.onSuspend.addListener(() => {
  console.log('扩展即将被挂起');
});

// 监听扩展图标点击（如果没有popup的话）
chrome.action.onClicked.addListener((tab) => {
  console.log('扩展图标被点击，当前标签页:', tab.url);
  
  // 如果popup无法显示，可以在这里添加备用逻辑
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    // 显示通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '网页截图工具',
      message: '无法在此页面使用截图功能'
    });
  }
});

// 处理未捕获的错误
self.addEventListener('error', (event) => {
  console.error('后台脚本错误:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});

// 定期清理内存（可选）
setInterval(() => {
  // 清理可能的内存泄漏
  if (typeof gc === 'function') {
    gc();
  }
}, 5 * 60 * 1000); // 每5分钟执行一次
