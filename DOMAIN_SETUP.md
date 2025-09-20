# 自定义域名设置指南

## 概述
本指南将帮助你为流体动力学仿真项目设置自定义域名访问。

## 推荐域名选项
1. **fluid-dynamics-sim.com** (推荐)
2. **fluidlab.tech**
3. **physicsim.net**
4. **hydro-lab.com**
5. **flowsim.org**

## 域名购买平台推荐
- **阿里云** (中国用户推荐)
- **腾讯云** (中国用户推荐)
- **Namecheap** (国际用户推荐)
- **Cloudflare** (提供免费SSL和CDN)
- **GoDaddy** (知名度高)

## 设置步骤

### 1. 购买域名
1. 选择域名注册商
2. 搜索并购买心仪的域名
3. 完成域名注册

### 2. 配置DNS解析
在域名管理面板中添加以下DNS记录：

```
类型: A
名称: @
值: 185.199.108.153

类型: A  
名称: @
值: 185.199.109.153

类型: A
名称: @
值: 185.199.110.153

类型: A
名称: @
值: 185.199.111.153

类型: CNAME
名称: www
值: your-username.github.io
```

### 3. GitHub Pages设置
1. 推送代码到GitHub仓库
2. 进入仓库设置 → Pages
3. 在"Custom domain"中输入你的域名
4. 等待DNS验证完成
5. 启用"Enforce HTTPS"

### 4. 验证部署
访问你的域名，确认网站正常运行。

## 中国用户特别说明

### 备案要求
- 如果使用中国大陆服务器，需要进行ICP备案
- GitHub Pages无需备案

### 推荐配置
```bash
# 使用阿里云DNS解析
类型: CNAME
主机记录: @
记录值: your-username.github.io
TTL: 600

类型: CNAME  
主机记录: www
记录值: your-username.github.io
TTL: 600
```

## 常见问题

### Q: DNS解析需要多长时间生效？
A: 通常需要10分钟到24小时，具体取决于DNS服务商。

### Q: 如何验证DNS是否生效？
A: 使用命令 `nslookup your-domain.com` 或在线DNS检查工具。

### Q: 为什么访问域名显示404？
A: 检查CNAME文件是否正确，GitHub Pages设置是否完成。

## 安全建议
1. 启用HTTPS
2. 使用强密码保护域名账户
3. 启用两步验证
4. 定期检查域名状态

## 成本估算
- 域名注册: ¥50-200/年
- DNS解析: 免费-¥50/年
- SSL证书: 免费(Let's Encrypt)

## 联系支持
如遇问题，请联系相应服务商的技术支持。 