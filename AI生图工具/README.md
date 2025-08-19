# AI生图工具 - 网页应用设计文档

## 项目概述

AI生图工具是一个基于Web的人工智能图像生成应用，用户可以通过文本描述生成高质量的图像。本应用使用硅基流动(SiliconFlow)的AI生图API，提供简洁易用的纯前端界面。

## 功能设计

### 核心功能 (P0 - 唯一实现功能)

1. **文本到图片生成 (Text-to-Image)**
   - 支持中英文提示词输入
   - 调用硅基流动API生成图片
   - 使用Kwai-Kolors/Kolors模型 (固定模型)
   - 支持负面提示词 (negative_prompt)

2. **图片预览和下载**
   - 高清图片预览
   - 图片下载功能 (PNG格式)
   - 生成结果展示
   - 图片URL有效期1小时

3. **基础参数设置**
   - 图片尺寸选择 (推荐尺寸: 1024x1024, 960x1280, 768x1024, 720x1440, 720x1280)
   - 生成数量设置 (1-4张)
   - 推理步数调节 (1-100步，默认20)
   - 引导系数设置 (0-20，默认7.5)
   - 随机种子控制 (可选)

## 页面设计

### 主界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                        顶部导航栏                            │
│  [AI生图工具]                              [设置] [帮助]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────┐   │
│  │             │  │                                     │   │
│  │   参数设置   │  │         图片生成区域                 │   │
│  │             │  │                                     │   │
│  │ • 提示词输入 │  │     [生成的图片显示区域]             │   │
│  │ • 模型选择   │  │                                     │   │
│  │ • 尺寸选择   │  │     [生成状态/进度显示]             │   │
│  │ • 生成步数   │  │                                     │   │
│  │ • 引导系数   │  │     [生成按钮] [下载按钮]           │   │
│  │             │  │                                     │   │
│  └─────────────┘  └─────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 页面结构

1. **主页面 (单页应用)**
   - 简洁的两栏布局：参数设置 + 生成区域
   - 专注于核心生图功能

2. **设置弹窗**
   - API Key配置
   - 默认参数设置

3. **帮助弹窗**
   - 使用说明
   - API文档链接

## 目录结构

```
ai-image-generator/
├── index.html                        # 主页面
├── css/
│   ├── style.css                     # 主样式文件
│   └── variables.css                 # CSS变量定义
├── js/
│   ├── app.js                        # 主应用逻辑
│   ├── api.js                        # 硅基流动API调用
│   ├── ui.js                         # UI交互逻辑
│   └── utils.js                      # 工具函数
├── assets/
│   ├── images/                       # 图标和图片资源
│   └── fonts/                        # 字体文件
├── docs/
│   └── usage.md                      # 使用说明
├── .gitignore
└── README.md
```

## 技术框架

### 前端技术栈 (纯前端应用)

- **基础技术**: HTML5 + CSS3 + 原生JavaScript (ES6+)
- **HTTP客户端**: Fetch API
- **样式**: CSS Variables + Flexbox/Grid
- **图标**: SVG图标或Font Awesome
- **本地存储**: localStorage (保存API Key和设置)

### AI模型集成

- **硅基流动API**: 主要的AI生图服务
  - 使用Kwai-Kolors/Kolors模型 (固定模型，无需选择)
  - 支持高质量图像生成
  - API文档: https://docs.siliconflow.cn/cn/api-reference/images/images-generations

### 部署方案

- **静态网站**: 可直接部署到任何静态网站托管服务
- **本地运行**: 直接用浏览器打开index.html即可使用
- **在线部署**: GitHub Pages, Netlify, Vercel等

## UI设计规范

### 设计原则

1. **简洁性**: 界面简洁明了，突出核心功能
2. **一致性**: 统一的视觉语言和交互模式
3. **可访问性**: 支持键盘导航和屏幕阅读器
4. **响应式**: 适配各种屏幕尺寸

### 色彩规范

```css
/* 主色调 */
--primary-color: #6366f1;          /* 靛蓝色 - 主要按钮、链接 */
--primary-light: #a5b4fc;          /* 浅靛蓝 - 悬停状态 */
--primary-dark: #4338ca;           /* 深靛蓝 - 激活状态 */

/* 辅助色 */
--secondary-color: #64748b;        /* 灰蓝色 - 次要文本 */
--accent-color: #f59e0b;           /* 琥珀色 - 强调元素 */

/* 状态色 */
--success-color: #10b981;          /* 成功状态 */
--warning-color: #f59e0b;          /* 警告状态 */
--error-color: #ef4444;            /* 错误状态 */
--info-color: #3b82f6;             /* 信息状态 */

/* 中性色 */
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;

/* 背景色 */
--bg-primary: #ffffff;             /* 主背景 */
--bg-secondary: #f8fafc;           /* 次要背景 */
--bg-tertiary: #f1f5f9;            /* 第三级背景 */
```

### 字体规范

```css
/* 字体族 */
--font-family-base: 'Inter', 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* 字体大小 */
--font-size-xs: 0.75rem;           /* 12px */
--font-size-sm: 0.875rem;          /* 14px */
--font-size-base: 1rem;            /* 16px */
--font-size-lg: 1.125rem;          /* 18px */
--font-size-xl: 1.25rem;           /* 20px */
--font-size-2xl: 1.5rem;           /* 24px */
--font-size-3xl: 1.875rem;         /* 30px */
--font-size-4xl: 2.25rem;          /* 36px */

/* 字重 */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 间距规范

```css
/* 间距系统 (基于 4px) */
--spacing-1: 0.25rem;              /* 4px */
--spacing-2: 0.5rem;               /* 8px */
--spacing-3: 0.75rem;              /* 12px */
--spacing-4: 1rem;                 /* 16px */
--spacing-5: 1.25rem;              /* 20px */
--spacing-6: 1.5rem;               /* 24px */
--spacing-8: 2rem;                 /* 32px */
--spacing-10: 2.5rem;              /* 40px */
--spacing-12: 3rem;                /* 48px */
--spacing-16: 4rem;                /* 64px */
```

### 组件规范

1. **按钮**
   - 圆角: 8px
   - 高度: 40px (默认), 32px (小), 48px (大)
   - 内边距: 16px 24px

2. **输入框**
   - 圆角: 6px
   - 高度: 40px
   - 边框: 1px solid var(--gray-300)
   - 聚焦: 边框变为主色调

3. **卡片**
   - 圆角: 12px
   - 阴影: 0 1px 3px rgba(0, 0, 0, 0.1)
   - 内边距: 24px

## 开发方案

### 开发环境搭建

1. **本地开发**
   ```bash
   # 克隆或创建项目目录
   mkdir ai-image-generator
   cd ai-image-generator

   # 创建基础文件结构
   mkdir css js assets docs
   touch index.html css/style.css js/app.js
   ```

2. **API配置**
   - 获取硅基流动API Key
   - 在应用中配置API Key (通过设置界面)

### 硅基流动API集成

#### 核心接口调用

1. **生成图片**
   ```javascript
   // API调用示例
   const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${apiKey}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       model: 'Kwai-Kolors/Kolors',
       prompt: '一只可爱的小猫',
       negative_prompt: '', // 可选的负面提示词
       image_size: '1024x1024',
       batch_size: 1,
       num_inference_steps: 20,
       guidance_scale: 7.5,
       seed: 123456789 // 可选的随机种子
     })
   });
   ```

2. **支持的参数**
   - model: 固定为 "Kwai-Kolors/Kolors"
   - prompt: 提示词 (必需)
   - negative_prompt: 负面提示词 (可选)
   - image_size: 图片尺寸 (必需，推荐值见下方)
   - batch_size: 生成数量 (1-4，默认1)
   - num_inference_steps: 推理步数 (1-100，默认20)
   - guidance_scale: 引导系数 (0-20，默认7.5)
   - seed: 随机种子 (0-9999999999，可选)

3. **推荐的图片尺寸**
   - "1024x1024" (1:1 正方形)
   - "960x1280" (3:4 竖屏)
   - "768x1024" (3:4 竖屏)
   - "720x1440" (1:2 长竖屏)
   - "720x1280" (9:16 手机竖屏)

### 本地存储设计

使用localStorage保存用户设置和API配置：
```javascript
// 存储结构
{
  "apiKey": "用户的API密钥",
  "defaultSettings": {
    "image_size": "1024x1024",
    "batch_size": 1,
    "num_inference_steps": 20,
    "guidance_scale": 7.5,
    "negative_prompt": ""
  }
}
```

## 功能优先级和开发顺序

### 开发阶段: 核心功能实现 (1-2周)
**目标**: 实现P0核心功能的完整AI生图工具

#### 第一步: 基础框架搭建 (1-2天)
- [ ] 创建HTML页面结构
- [ ] 设计CSS样式和布局
- [ ] 实现基础的UI组件

#### 第二步: API集成 (2-3天)
- [ ] 集成硅基流动API
- [ ] 实现API Key配置功能
- [ ] 处理API调用和错误处理

#### 第三步: 核心功能开发 (2-3天)
- [ ] 提示词输入和验证
- [ ] 参数设置界面
- [ ] 图片生成和显示
- [ ] 图片下载功能

#### 第四步: 用户体验优化 (1-2天)
- [ ] 加载状态和进度显示
- [ ] 错误提示和处理
- [ ] 响应式设计适配
- [ ] 本地设置保存

#### 第五步: 测试和完善 (1天)
- [ ] 功能测试
- [ ] 界面优化
- [ ] 文档完善

**最终交付物**: 功能完整的P0版本AI生图工具

## 技术实现要点

### API调用安全

1. **API Key保护**
   - 使用localStorage安全存储
   - 不在代码中硬编码API Key
   - 提供API Key配置界面

2. **错误处理**
   - 网络错误处理
   - API限制和配额提示
   - 友好的错误信息显示

### 性能优化

1. **图片处理**
   - 图片懒加载
   - 适当的图片压缩
   - 缓存机制

2. **用户体验**
   - 加载状态指示
   - 响应式设计
   - 快速的界面响应

## 部署说明

### 本地使用
1. 下载项目文件
2. 用浏览器打开index.html
3. 在设置中配置硅基流动API Key
4. 开始使用

### 在线部署
1. 上传到静态网站托管服务
2. 确保HTTPS访问(API调用需要)
3. 配置域名和SSL证书

---

*本文档将随着项目开发进度持续更新和完善。*
