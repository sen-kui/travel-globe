# 🌍 旅行地球 · Travel Globe

> 在一个可交互的 3D 地球上，找到你的下一个目的地，让 AI 为你规划专属旅行方案。

---

## ✨ 核心体验

**旋转地球 → 筛选目的地 → 点击国家 → AI 生成行程**

- 🗺️ **3D 交互地球** — 基于 WebGL 渲染，点击任意国家飞行定位，筛选结果实时按地区高亮
- 🔍 **五维智能筛选** — 玩法类型 × 签证要求 × 行程天数 × 人均预算 × 最佳季节，多维交叉过滤
- 🤖 **AI 专属行程** — 选好天数、风格、预算，大模型生成每日详细计划，含实用 tips 和地图直达链接
- 🗄️ **68 个目的地** — 覆盖 20 个地区，每条数据含费用参考、签证、最佳季节等完整字段

---

## 🖥️ 界面布局

```
┌──────────────────────────────────────────────────────────────┐
│  🌍 旅行地球   AI 驱动的旅行规划        点击地球上的国家开始探索 │
├───────────┬────────────────────────────────┬─────────────────┤
│           │                                │  🇯🇵 日本        │
│  筛选面板  │                                │  Japan  东亚 #4  │
│  ───────  │                                │                  │
│  玩法类型  │         3D 地球               │  秩序感下的物哀美  │
│  [海岛躺平]│       （WebGL 渲染）           │  学，樱花开落…    │
│  [文化历史]│                                │                  │
│           │  筛选高亮 · 点击飞行定位        │  必去打卡 ───    │
│  签证要求  │                                │  费用参考 ───    │
│  ○ 免签   │                                │  最佳季节 ───    │
│  ○ 落地签  │                                │                  │
│           │                                │ [AI 生成专属行程] │
│  找到 12  │                                │                  │
│  个目的地  │                                │                  │
└───────────┴────────────────────────────────┴─────────────────┘
```

---

## 🔧 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite 8 + TypeScript 6 |
| 3D 地球 | [react-globe.gl](https://github.com/vasturiano/react-globe.gl)（Three.js / WebGL）|
| 样式 | Tailwind CSS v4 · 玻璃拟态暗色主题 |
| AI 模型 | kimi-k2.6（OpenAI Chat Completions 兼容接口）|
| API 层 | Vercel Serverless Function · SSE 流式响应 |
| 地图数据 | Natural Earth 110m GeoJSON · ISO A3 国家匹配 |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
git clone <repo-url>
cd travel-globe
pnpm install
```

### 2. 配置 API

创建 `.env.local`：

```env
QWEN_API_KEY=你的 API Key
QWEN_BASE_URL=https://你的模型服务地址/v1
QWEN_MODEL=kimi-k2.6
# 如有自定义请求头（按需填写）
MAAS_USER_EMAIL=你的邮箱
MAAS_APP_ID=qs-api
```

支持任何兼容 OpenAI Chat Completions 接口的模型服务。

### 3. 启动开发服务器

```bash
node_modules/.bin/vite
```

打开 [http://localhost:5173](http://localhost:5173)，无需额外启动后端——`/api/itinerary` 由 Vite 内嵌中间件处理。

---

## 🌐 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 导入仓库
3. 在 Dashboard → Settings → Environment Variables 添加上述环境变量
4. 推送触发自动部署

`vercel.json` 已配置好 Serverless Function 路由，开箱即用。

---

## 📁 项目结构

```
travel-globe/
├── api/
│   └── itinerary.ts          # Vercel Serverless Function（AI 行程生成）
├── src/
│   ├── components/
│   │   ├── Globe.tsx          # 3D 地球：GeoJSON 渲染 + 点击/筛选联动
│   │   ├── FilterPanel.tsx    # 左侧筛选面板
│   │   ├── CountryCard.tsx    # 右侧目的地详情 + 行程参数配置
│   │   └── ItineraryModal.tsx # AI 行程展示弹窗（骨架屏 → 结构化卡片）
│   ├── data/
│   │   └── destinations.ts    # 68 个目的地完整数据
│   ├── hooks/
│   │   └── useItinerary.ts    # SSE 流式消费 + JSON 提取
│   ├── types/index.ts         # 类型定义 + 筛选常量
│   └── App.tsx                # 全局状态 + 布局编排
└── vite.config.ts             # Vite 配置（含开发 API 中间件）
```

---

## 🗄️ 目的地数据

每条记录包含 **17 个字段**，分四类：

| 类别 | 字段说明 |
|------|------|
| **地理** | `isoA3`（Globe 国家匹配）、`lat/lng`（飞行定位）、`region`（地区颜色） |
| **展示** | `nameCN/EN`、`flag`、`rank`、`desc`（文学化一句话文案）、`top3`（必去打卡） |
| **筛选** | `tags`（玩法标签）、`visa`（签证类型）、`bestSeason`（最佳季节） |
| **费用** | 直飞/中转机票、五星/经济酒店均价、奢华/经济日均花销、`currency`、`timezone` |

覆盖地区：港澳台 · 东亚 · 东南亚 · 南亚 · 中东 · 高加索 · 中亚 · 东欧/北亚 · 西欧 · 南欧 · 中欧 · 北欧 · 北美 · 南美 · 北非 · 东非 · 南非 · 大洋洲

---

## 🤖 AI 行程生成

```
用户选好目的地 + 天数 / 风格 / 预算
         ↓
构建 Prompt（目的地元数据 + 用户参数 + JSON 格式约束）
         ↓
调用大模型（SSE 流式输出）
         ↓
前端展示骨架屏动画，静默消化模型推理过程
         ↓
输出完成 → 提取 JSON → 渲染结构化行程
每个活动附 Google Maps 跳转链接
```

**工程细节**：kimi-k2.6 为推理模型，输出（含思考过程）全部在非标准字段 `reasoning_content`，最终 JSON 以代码块形式出现在推理末尾。提取策略：优先匹配 ` ```json ``` ` 代码块，兜底遍历字符取**最后一个**完整 `{}` 对象。

---

## License

MIT
