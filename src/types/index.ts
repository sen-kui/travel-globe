export interface Destination {
  rank: number
  nameCN: string
  nameEN: string
  region: string
  isoA3: string      // ISO 3166-1 alpha-3，用于匹配 GeoJSON
  lat: number
  lng: number
  flag: string

  tags: string[]
  visa: string[]
  bestSeason: string[]

  desc: string
  top3: string[]

  flightDirect: number
  flightTransfer: number
  hotel5star: number
  hotel3star: number
  dailyLuxury: number
  dailyBudget: number

  currency: string
  timezone: string
}

export interface FilterState {
  tags: string[]
  visa: string[]
  duration: string
  budget: string
  season: string[]
}

export const TRAVEL_TAGS = [
  '海岛躺平', 'City walk', '文化历史', '绝美自然风光', '美食中心', '户外运动', '购物',
] as const

export const VISA_OPTIONS = ['免签', '落地签/电子签', '需要办签证'] as const

export const DURATION_OPTIONS = ['3天以内', '3-6天', '6-10天', '10天以上'] as const

export const BUDGET_OPTIONS = [
  '¥5000以内', '¥10000以内', '¥20000以内', '¥30000以内', '预算无上限',
] as const

export const SEASON_OPTIONS = ['春（3-5月）', '夏（6-8月）', '秋（9-11月）', '冬（12-2月）'] as const

export const DURATION_DAYS: Record<string, { min: number; max: number; rep: number }> = {
  '3天以内': { min: 1, max: 3, rep: 2 },
  '3-6天': { min: 3, max: 6, rep: 4 },
  '6-10天': { min: 6, max: 10, rep: 7 },
  '10天以上': { min: 10, max: 14, rep: 12 },
}

export const BUDGET_LIMIT: Record<string, number> = {
  '¥5000以内': 5000,
  '¥10000以内': 10000,
  '¥20000以内': 20000,
  '¥30000以内': 30000,
  '预算无上限': Infinity,
}

export const REGION_COLORS: Record<string, string> = {
  '港澳台':     '#60a5fa',
  '东亚':       '#4f8ef7',
  '东南亚':     '#34d399',
  '南亚':       '#f59e0b',
  '中东':       '#a78bfa',
  '高加索':     '#e879f9',
  '中亚':       '#e879f9',
  '东欧/北亚':  '#93c5fd',
  '西欧':       '#60a5fa',
  '南欧':       '#818cf8',
  '中欧':       '#7dd3fc',
  '东欧':       '#a5b4fc',
  '北欧':       '#bfdbfe',
  '西亚/南欧':  '#c4b5fd',
  '北美':       '#f87171',
  '南美':       '#fb923c',
  '北非':       '#fbbf24',
  '东非':       '#fcd34d',
  '南非':       '#fde68a',
  '大洋洲':     '#2dd4bf',
  '国内':       '#f472b6',
}

// 行程生成相关类型
export interface Activity {
  time: string
  name: string
  category: '景点' | '美食' | '购物' | '交通' | '住宿' | string
  desc: string
  tips: string
  mapQuery: string
}

export interface ItineraryDay {
  day: number
  theme: string
  activities: Activity[]
}

export interface Itinerary {
  title: string
  summary: string
  days: ItineraryDay[]
  budgetTips: string
  bestTime: string
}

export interface ItineraryParams {
  days: number
  style: string
  budget: string
}

export const TRAVEL_STYLES = ['综合体验', '文化深度', '自然探索', '美食打卡', '购物休闲'] as const
export const ITINERARY_BUDGETS = ['舒适性价比', '品质中高端', '奢华享受'] as const
export const ITINERARY_DAYS = [2, 3, 4, 5, 6, 7, 10, 14] as const
