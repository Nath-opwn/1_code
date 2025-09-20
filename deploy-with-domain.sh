#!/bin/bash

echo "🚀 开始部署流体动力学仿真项目..."

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 发现未提交的更改，正在提交..."
    git add .
    git commit -m "Update domain configuration and deployment settings"
fi

# 推送到GitHub
echo "📤 推送到GitHub仓库..."
git push origin master

echo "✅ 部署配置完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 购买域名 (推荐: fluid-dynamics-sim.com)"
echo "2. 配置DNS解析指向GitHub Pages"
echo "3. 在GitHub仓库设置中启用Pages并配置自定义域名"
echo "4. 等待DNS生效 (通常需要10分钟-24小时)"
echo ""
echo "🌐 域名配置完成后，你的网站将可以通过以下地址访问:"
echo "   https://fluid-dynamics-sim.com"
echo ""
echo "📖 详细设置指南请查看: DOMAIN_SETUP.md" 