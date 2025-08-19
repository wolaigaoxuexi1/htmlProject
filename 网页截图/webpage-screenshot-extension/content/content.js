// content.js - 页面内容脚本
(function() {
  'use strict';

  // 防止重复注入
  if (window.screenshotExtensionInjected) {
    return;
  }
  window.screenshotExtensionInjected = true;

  console.log('网页截图扩展内容脚本已加载');
  // 工具：隐藏/恢复固定元素，避免拼接时出现横线（如固定顶部条）
  let __hiddenFixedNodes = [];
  function hideFixedElements() {
    try {
      __hiddenFixedNodes = [];
      const all = document.body.getElementsByTagName('*');
      for (let i = 0; i < all.length; i++) {
        const el = all[i];
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') {
          // 记录原状态
          __hiddenFixedNodes.push({
            el,
            visibility: el.style.visibility,
            pointerEvents: el.style.pointerEvents
          });
          // 隐藏而不触发布局变化
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        }
      }
    } catch (e) {
      console.warn('隐藏固定元素失败', e);
    }
  }
  function restoreFixedElements() {
    try {
      for (const item of __hiddenFixedNodes) {
        item.el.style.visibility = item.visibility;
        item.el.style.pointerEvents = item.pointerEvents;
      }
      __hiddenFixedNodes = [];
    } catch (e) {
      console.warn('恢复固定元素失败', e);
    }
  }

  // 工具：查找主要可滚动容器（很多站点滚的是内部容器，不是window）
  function findMainScrollable() {
    // 优先使用文档滚动元素
    const docEl = document.scrollingElement || document.documentElement;
    const docScrollable = (docEl.scrollHeight - docEl.clientHeight) > 5;

    // 收集候选：overflow为auto/scroll且可滚动的容器
    const candidates = [];
    const all = document.body.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
      if (style.position === 'fixed') continue;
      const diff = el.scrollHeight - el.clientHeight;
      if (diff > 20) {
        candidates.push({ el, score: diff });
      }
    }
    // 选择可滚动高度最大的容器
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0].el;
      // 如果文档本身也可滚动且高度更大，优先文档
      if (docScrollable && (docEl.scrollHeight - docEl.clientHeight) >= (best.scrollHeight - best.clientHeight)) {
        return docEl;
      }
      return best;
    }
    return docEl;
  }

  // 工具：滚动到指定位置（兼容文档和元素）
  function scrollToY(scroller, y) {
    if (!scroller) return;
    if (scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body) {
      window.scrollTo(0, y);
    } else if (typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ top: y, behavior: 'instant' });
    } else {
      scroller.scrollTop = y;
    }
  }


  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request);

    // 响应ping消息，用于检查script是否已注入
    if (request.action === 'ping') {
      sendResponse({pong: true});
      return true;
    }

    if (request.action === 'captureFullPage') {
      // 立即响应表示收到消息
      sendResponse({received: true});

      // 异步执行截图
      captureFullPageScreenshot()
        .then(dataUrl => {
          // 通过runtime.sendMessage发送结果
          chrome.runtime.sendMessage({
            action: 'screenshotComplete',
            success: true,
            dataUrl: dataUrl
          });
        })
        .catch(error => {
          console.error('截图失败:', error);
          chrome.runtime.sendMessage({
            action: 'screenshotComplete',
            success: false,
            error: error.message
          });
        });

      return true; // 保持消息通道开放
    }
  });

  // 截取完整页面
  async function captureFullPageScreenshot() {
    try {
      console.log('开始截取完整页面...');

      // 等待页面完全加载
      await waitForPageLoad();

      // 在截图前隐藏固定/粘性元素，避免拼接横线
      hideFixedElements();

      // 获取页面尺寸
      const pageMetrics = getPageMetrics();
      console.log('页面尺寸:', pageMetrics);

      // 保存原始滚动位置
      const originalScrollTop = window.pageYOffset;
      const originalScrollLeft = window.pageXOffset;

      // 创建canvas用于拼接图片
      const canvas = document.createElement('canvas');
      canvas.width = pageMetrics.viewportWidth;
      canvas.height = pageMetrics.pageHeight;
      const ctx = canvas.getContext('2d');

      // 获取页面背景色
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const backgroundColor = bodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? bodyStyle.backgroundColor
        : htmlStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
        ? htmlStyle.backgroundColor
        : '#ffffff';

      // 设置页面背景色
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 计算需要截图的次数和每次的精确位置
      const viewportHeight = pageMetrics.viewportHeight;
      const pageHeight = pageMetrics.pageHeight;
      const screenshots = [];

      // 选择主要滚动容器
      const scroller = findMainScrollable();
      const totalScrollableHeight = scroller === window || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body
        ? pageHeight
        : scroller.scrollHeight;
      const visibleHeight = scroller === window || scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body
        ? viewportHeight
        : scroller.clientHeight;

      // 计算滚动步骤，确保无重叠
      let currentY = 0;
      let stepIndex = 0;

      while (currentY < totalScrollableHeight) {
        const scrollTop = currentY;
        const remainingHeight = totalScrollableHeight - currentY;
        const captureHeight = Math.min(visibleHeight, remainingHeight);

        // 滚动到指定位置
        scrollToY(scroller, scrollTop);

        // 等待页面稳定
        await sleep(800); // 增加等待时间

        // 等待图片和动态内容加载
        await waitForImages();
        await sleep(200); // 额外等待

        // 截取当前视窗
        const dataUrl = await captureVisibleTab();

        screenshots.push({
          dataUrl: dataUrl,
          offsetY: currentY,
          height: captureHeight
        });

        console.log(`完成第 ${stepIndex + 1} 张截图，位置: ${currentY}, 高度: ${captureHeight}`);

        // 移动到下一个位置，避免重叠
        currentY += visibleHeight;
        stepIndex++;

        // 防止无限循环
        if (stepIndex > 50) {
          console.warn('截图步骤过多，停止截图');
          break;
        }
      }

      // 拼接所有截图
      console.log('开始拼接图片...');
      const dpr = window.devicePixelRatio || 1;
      const scale = (screenshots[0] ? (await loadImage(screenshots[0].dataUrl)).width : canvas.width) / pageMetrics.viewportWidth;

      for (let i = 0; i < screenshots.length; i++) {
        const screenshot = screenshots[i];
        const img = await loadImage(screenshot.dataUrl);

        // 计算实际需要绘制的区域（按DPR/scale精确裁剪）
        const drawY = Math.round(screenshot.offsetY);
        const remainingCanvasHeight = pageHeight - drawY;
        const drawHeight = Math.min(Math.round(img.height / scale), remainingCanvasHeight, visibleHeight);

        // 避免1px缝隙：对第一张之外的拼接起点向上收缩1px
        const safeDrawY = i === 0 ? drawY : Math.max(0, drawY - 1);
        const safeSrcY = i === 0 ? 0 : Math.round(1 * scale);
        const safeDrawHeight = Math.max(0, Math.min(drawHeight, pageHeight - safeDrawY));
        const safeSrcHeight = Math.round(safeDrawHeight * scale);

        if (safeDrawHeight > 0 && safeDrawY < pageHeight) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            img,
            0, safeSrcY, img.width, safeSrcHeight,
            0, safeDrawY, canvas.width, safeDrawHeight
          );
          ctx.imageSmoothingEnabled = true;
        }

        console.log(`拼接第 ${i + 1} 张图片，位置: ${safeDrawY}, 高度: ${safeDrawHeight}`);
      }

      // 恢复原始滚动位置并恢复固定元素
      window.scrollTo(originalScrollLeft, originalScrollTop);
      restoreFixedElements();

      // 返回完整截图
      const finalDataUrl = canvas.toDataURL('image/png');
      console.log('截图完成，图片大小:', Math.round(finalDataUrl.length / 1024), 'KB');

      return finalDataUrl;

    } catch (error) {
      // 确保恢复固定元素
      try { restoreFixedElements(); } catch (e) {}
      console.error('截图过程出错:', error);
      throw new Error(`截图失败: ${error.message}`);
    }
  }

  // 获取页面尺寸信息
  function getPageMetrics() {
    const body = document.body;
    const documentElement = document.documentElement;

    const pageHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      documentElement.clientHeight,
      documentElement.scrollHeight,
      documentElement.offsetHeight
    );

    const pageWidth = Math.max(
      body.scrollWidth,
      body.offsetWidth,
      documentElement.clientWidth,
      documentElement.scrollWidth,
      documentElement.offsetWidth
    );

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    return {
      pageHeight,
      pageWidth,
      viewportHeight,
      viewportWidth
    };
  }

  // 等待页面加载完成
  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  // 等待图片加载完成
  function waitForImages() {
    return new Promise((resolve) => {
      const images = document.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise((imgResolve) => {
          const timeout = setTimeout(() => {
            imgResolve(); // 超时后继续
          }, 2000);

          img.addEventListener('load', () => {
            clearTimeout(timeout);
            imgResolve();
          }, { once: true });

          img.addEventListener('error', () => {
            clearTimeout(timeout);
            imgResolve(); // 错误时也继续
          }, { once: true });
        });
      });

      Promise.all(imagePromises).then(resolve);

      // 最多等待5秒
      setTimeout(resolve, 5000);
    });
  }

  // 截取当前可见区域
  function captureVisibleTab() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'captureVisibleTab'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.dataUrl);
        } else {
          reject(new Error(response?.error || '截图失败'));
        }
      });
    });
  }

  // 加载图片
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = src;
    });
  }

  // 延时函数
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 添加调试信息
  console.log('网页截图扩展内容脚本已加载');
})();
