/** Factual survey options — onboarding Q1–Q11 (non-GL-RTS) */

export const PORTFOLIO_ASSET_KEYS = [
  'domestic_equity',
  'us_equity',
  'bond',
  'cash',
  'crypto',
  'other',
] as const;

export type PortfolioAssetKey = (typeof PORTFOLIO_ASSET_KEYS)[number];

export const PORTFOLIO_ASSET_LABELS: Record<PortfolioAssetKey, string> = {
  domestic_equity: '국내 주식·ETF',
  us_equity: '해외 주식·ETF',
  bond: '채권·채권형',
  cash: '현금·예금·MMF',
  crypto: '가상자산',
  other: '기타',
};

export const INFO_SOURCE_OPTIONS = [
  { value: 'news_portal', label: '뉴스 포털·경제지' },
  { value: 'youtube_creator', label: '유튜브·크리에이터' },
  { value: 'community', label: '커뮤니티·텔레그램·디스코드' },
  { value: 'broker_app', label: '증권사 앱·리서치' },
  { value: '13f_sec', label: '미국 13F·증권공시' },
  { value: 'macro_data', label: '매크로 데이터(한국은행·미연준)' },
  { value: 'friends', label: '지인·오프라인' },
  { value: 'other', label: '기타' },
] as const;
