杭州市主城区城市食物环境可视化平台 - 部署说明

文件说明：
- index.html：网页入口
- style.css：页面样式
- app.js：地图、热力图、CSV读取、检索和点选数值逻辑
- food_environment.csv：默认演示数据
- LOGO.png：页面右下角合作单位标识

Render 部署：
1. 将本文件夹内所有文件上传到 GitHub 仓库根目录。
2. Render 新建 Static Site。
3. Build Command 留空。
4. Publish Directory 填 .
5. 部署完成后访问 Render 生成的网址。

功能说明：
- 默认自动读取 food_environment.csv。
- 左侧支持上传/替换 CSV 数据。
- 支持 2019、2023、2025 三期数据切换。
- 支持线上/线下、正餐/快餐、四类指标切换。
- 支持小区关键词、行政区/属性字段、数值范围筛选。
- 检索结果以橙色点位高亮显示。
- 点击小区点位可查看该小区当前指标和三期数值。
