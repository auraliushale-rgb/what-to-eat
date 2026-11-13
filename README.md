# What to Eat

What to Eat 是一个开源的中英双语美食选择工具，适配手机和桌面。你可以用转盘决定早餐、午餐、晚餐、夜宵或茶饮，也可以一键安排一日菜单、查询品牌茶饮、收藏喜欢的条目，并把不想吃的选项从转盘中排除。偏好与历史记录保存在当前浏览器。

[打开 What to Eat](https://auraliushale-rgb.github.io/what-to-eat/)

本项目是温州肯恩大学 ESL 0303 W43 课程作业《Infomercial Group Invention》的一部分，指导老师为 Benjamin Dudley。

## 食品数据库

| 转盘 | 条目数 |
| --- | ---: |
| 早餐 | 79 |
| 午餐 | 96 |
| 晚餐 | 95 |
| 夜宵 | 58 |
| 品牌茶饮 | 269 |
| **合计** | **597** |

茶饮数据库覆盖 12 个品牌，其中 59 款归为奶茶或鲜奶茶。其余条目包括水果茶、纯茶、咖啡、冰淇淋和甜点。各品牌的条目数量和菜单出处见[数据库说明](docs/catalog.md)。

每次转动从当前分类的合格条目中随机选出最多八个候选，再从中等概率抽取结果。只要有其他合格选项，转盘就会避开上一次的结果。一日菜单使用相同的筛选逻辑。

## 本地运行

需要 Node.js 22.12 或更新版本及 npm。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。项目使用 JavaScript、CSS 和 Vite，无需注册账号或启动后端。

```sh
npm test
npm run build
npm run preview
```

## 部署到 GitHub Pages

将源码推送到公开仓库的 `main` 分支，在仓库的 Pages 设置中将部署来源设为 GitHub Actions。部署流程会运行数据库与转盘测试，再构建并发布 `dist/`。Vite 使用相对路径，仓库子路径下可直接打开各页面与转盘。

## 项目贡献者

- 制作者：Silas Huang
- 协助制作：Nike Chen、Yulin Gu、Codex（OpenAI）

欢迎提交改进。增补菜品或修订品牌菜单时，请参考[数据库说明](docs/catalog.md)，保留已有条目的 ID。提交拉取请求前请运行 `npm test` 和 `npm run build`，并为菜单变更附上来源链接。

## 许可证

项目代码和原创文档采用 [MIT 许可证](LICENSE)。品牌与产品名称用于标识菜单来源中的对应商品。
