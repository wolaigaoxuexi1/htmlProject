# AI生图工具 - 部署说明

## 项目结构

```
ai-image-generator/
├── index.html              # 主页面
├── test.html               # 功能测试页面
├── css/
│   ├── style.css           # 主样式文件
│   └── variables.css       # CSS变量定义
├── js/
│   ├── app.js              # 主应用入口
│   ├── api.js              # API调用模块
│   ├── ui.js               # UI交互逻辑
│   └── utils.js            # 工具函数库
├── docs/
│   └── usage.md            # 使用说明
├── README.md               # 项目文档
└── DEPLOYMENT.md           # 部署说明（本文件）
```

## 本地部署

### 方法一：直接打开文件
1. 下载或克隆项目到本地
2. 用现代浏览器直接打开 `index.html` 文件
3. 在设置中配置硅基流动API密钥
4. 开始使用

### 方法二：本地HTTP服务器
推荐使用本地HTTP服务器以避免跨域问题：

#### 使用Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### 使用Node.js
```bash
# 安装http-server
npm install -g http-server

# 启动服务器
http-server -p 8000
```

#### 使用PHP
```bash
php -S localhost:8000
```

然后访问 `http://localhost:8000`

## 在线部署

### GitHub Pages（详细步骤）

#### 方法一：通过仓库设置部署（推荐）

1. **上传项目到GitHub**
   ```bash
   git add .
   git commit -m "Add AI Image Generator"
   git push origin main
   ```

2. **启用GitHub Pages**
   - 进入GitHub仓库页面
   - 点击 `Settings` 选项卡
   - 在左侧菜单找到 `Pages`
   - 在 "Source" 部分选择 `Deploy from a branch`
   - Branch 选择 `main`，Folder 选择 `/ (root)`
   - 点击 `Save` 按钮

3. **等待部署完成**
   - 部署通常需要2-5分钟
   - 完成后会显示访问链接
   - 链接格式：`https://username.github.io/repository-name`

4. **验证部署**
   - 访问生成的链接
   - 确认所有功能正常工作
   - 测试API调用是否正常

#### 方法二：使用GitHub Actions（高级）

1. **创建工作流文件**
   - 在项目根目录创建 `.github/workflows/deploy.yml`
   - 使用提供的工作流配置

2. **启用GitHub Actions**
   - 在仓库设置的 `Pages` 部分
   - Source 选择 `GitHub Actions`
   - 推送代码后自动触发部署

#### 注意事项

1. **HTTPS要求**
   - GitHub Pages 自动提供HTTPS
   - 确保API调用使用HTTPS

2. **自定义域名（可选）**
   - 在 `Pages` 设置中添加自定义域名
   - 创建 `CNAME` 文件指向您的域名
   - 配置DNS记录

3. **缓存问题**
   - 如果更新后看不到变化，清除浏览器缓存
   - 或在URL后添加 `?v=timestamp` 强制刷新

#### 示例访问链接
- 如果用户名是 `yourname`，仓库名是 `ai-image-generator`
- 访问链接：`https://yourname.github.io/ai-image-generator`

### Netlify
1. 注册Netlify账户
2. 连接GitHub仓库或直接拖拽文件夹
3. 自动部署完成
4. 获得免费的HTTPS域名

### Vercel
1. 注册Vercel账户
2. 导入GitHub仓库
3. 自动构建和部署
4. 获得免费的HTTPS域名

### 阿里云OSS
1. 创建OSS存储桶
2. 开启静态网站托管
3. 上传所有文件
4. 配置自定义域名（可选）

### 腾讯云COS
1. 创建COS存储桶
2. 开启静态网站功能
3. 上传项目文件
4. 配置CDN加速（可选）

## 服务器部署

### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/ai-image-generator;
    index index.html;

    # 启用gzip压缩
    gzip on;
    gzip_types text/css application/javascript text/javascript application/json;

    # 缓存静态资源
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 处理HTML文件
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Apache配置
创建 `.htaccess` 文件：
```apache
# 启用压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# 缓存设置
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# 安全头
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
```

## Docker部署

### Dockerfile
```dockerfile
FROM nginx:alpine

# 复制项目文件
COPY . /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  ai-image-generator:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    volumes:
      - ./logs:/var/log/nginx
```

### 构建和运行
```bash
# 构建镜像
docker build -t ai-image-generator .

# 运行容器
docker run -d -p 8080:80 --name ai-image-generator ai-image-generator

# 或使用docker-compose
docker-compose up -d
```

## 性能优化

### 1. 文件压缩
- 启用gzip压缩
- 压缩CSS和JavaScript文件
- 优化图片资源

### 2. 缓存策略
- 设置适当的缓存头
- 使用CDN加速静态资源
- 启用浏览器缓存

### 3. 代码优化
- 压缩CSS和JavaScript
- 移除未使用的代码
- 使用现代浏览器特性

### 4. 网络优化
- 使用HTTP/2
- 启用Keep-Alive
- 减少HTTP请求数量

## 安全配置

### 1. HTTPS
- 使用SSL证书
- 强制HTTPS重定向
- 配置HSTS头

### 2. 安全头
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 3. API密钥保护
- 提醒用户不要在公共场所输入API密钥
- 使用localStorage安全存储
- 定期提醒用户更换密钥

## 监控和维护

### 1. 错误监控
- 监控JavaScript错误
- 记录API调用失败
- 设置错误报警

### 2. 性能监控
- 监控页面加载时间
- 跟踪用户交互性能
- 分析资源使用情况

### 3. 用户反馈
- 收集用户使用数据
- 分析功能使用频率
- 持续改进用户体验

## 故障排除

### 常见问题

1. **页面无法加载**
   - 检查文件路径是否正确
   - 确认服务器配置正确
   - 查看浏览器控制台错误

2. **API调用失败**
   - 验证API密钥是否正确
   - 检查网络连接
   - 确认API服务状态

3. **样式显示异常**
   - 检查CSS文件是否加载
   - 确认浏览器兼容性
   - 清除浏览器缓存

4. **功能无法使用**
   - 检查JavaScript是否启用
   - 查看控制台错误信息
   - 确认浏览器版本支持

### 调试工具
- 使用 `test.html` 进行功能测试
- 查看浏览器开发者工具
- 检查网络请求状态
- 分析性能指标

## 更新和维护

### 版本更新
1. 备份当前版本
2. 下载新版本文件
3. 更新项目文件
4. 测试功能正常
5. 清除浏览器缓存

### 定期维护
- 检查依赖项更新
- 监控安全漏洞
- 优化性能表现
- 更新文档说明

---

*如有问题，请查看项目文档或提交Issue*
