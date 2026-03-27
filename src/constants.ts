import type {
  Category,
  CategoryMode,
  ContentFilterMode,
  StoredConfig,
  ThumbnailLabelMode
} from "./types";

export const SCRIPT_NAME = "Bilibili SponsorBlock Core";
export const CONFIG_STORAGE_KEY = "bsb_tm_config_v1";
export const STATS_STORAGE_KEY = "bsb_tm_stats_v1";
export const CACHE_STORAGE_KEY = "bsb_tm_cache_v1";
export const BRIDGE_FLAG = "__BSB_TM_PAGE_BRIDGE__";
export const REQUEST_TIMEOUT_MS = 8000;
export const CACHE_TTL_MS = 60 * 60 * 1000;
export const CACHE_MAX_ENTRIES = 1000;
export const CACHE_MAX_SIZE_BYTES = 500 * 1024;
export const VIDEO_SCAN_INTERVAL_MS = 700;
export const TICK_INTERVAL_MS = 200;
export const POI_NOTICE_LEAD_SEC = 6;
export const SEGMENT_REWIND_RESET_SEC = 0.5;
export const DEFAULT_DYNAMIC_REGEX_PATTERN =
  "/618|11(?!1).11(?:日)?|双(?:11|十一|12|十二)|女神节|开学季|年货节|恰(?:个|了|到)?饭|金主|(他|它|她)(?:们)?家(?:的)?|(?:评论区)?(?:领(?:取|张|到)?|抢|送|得|叠)(?:我的)?(?:神|优惠|红包|折扣|福利|无门槛|隐藏|秘密|专属|(?:超)?大(?:额)?|额外)+(?:券|卷|劵|q(?:uan)?)?(?:后|到手|价|使用|下单)?|(?:领|抢|得|送)(?:红包|优惠|券|福利)|(?:优惠|(?:券|卷|劵)后|到手|促销|活动|神)价|(?:淘宝|tb|京东|jd|狗东|拼多多|pdd|天猫|tmall)搜索|(?:随(便|时)|任意)(?:退|退货|换货)|(?:免费|无偿)(?:换(?:个)?新|替换|更换|试用)(?:商品|物品)?|(?:点(?:击)?|戳|来|我)评论区(?:置顶)?|(?:立即|蓝链|链接|🔗)(?:购买|下单)|(?:vx|wx|微信|软件)扫码(?:领)?(?:优惠|红包|券)?|(?:我的)?同款(?:[的]?(?:推荐|好物|商品|入手|购买|拥有|分享|安利)?)|满\\d+|大促|促销|折扣|特价|秒杀|广告|推广|低至|热卖|抢购|新品|豪礼|赠品|密令|(?:饿了么|美(?:团|団)|百度外卖|蜂鸟|达达|UU跑腿|(?:淘宝)?闪购)|(?:点|订|送|吃)(?:外卖|餐)|外卖(?:节|服务|平台|app)/gi";

export const CATEGORY_ORDER: Category[] = [
  "sponsor",
  "selfpromo",
  "interaction",
  "intro",
  "outro",
  "preview",
  "padding",
  "music_offtopic",
  "poi_highlight",
  "exclusive_access"
];

export const CATEGORY_LABELS: Record<Category, string> = {
  sponsor: "广告",
  selfpromo: "自荐",
  interaction: "互动提醒",
  intro: "片头",
  outro: "片尾",
  preview: "预告/回放",
  padding: "填充空段",
  music_offtopic: "音乐无关段",
  poi_highlight: "高光点",
  exclusive_access: "整视频标签"
};

export const CATEGORY_COLORS: Record<Category, string> = {
  sponsor: "#00d400",
  selfpromo: "#ffff00",
  interaction: "#cc00ff",
  intro: "#00ffff",
  outro: "#0202ed",
  preview: "#008fd6",
  padding: "#222222",
  music_offtopic: "#ff9900",
  poi_highlight: "#ff1684",
  exclusive_access: "#008a5c"
};

export const CATEGORY_TEXT_COLORS: Record<Category, string> = {
  sponsor: "#ffffff",
  selfpromo: "#111111",
  interaction: "#ffffff",
  intro: "#111111",
  outro: "#ffffff",
  preview: "#ffffff",
  padding: "#ffffff",
  music_offtopic: "#111111",
  poi_highlight: "#ffffff",
  exclusive_access: "#ffffff"
};

export const MODE_LABELS: Record<CategoryMode, string> = {
  auto: "自动",
  manual: "手动",
  notice: "仅提示",
  off: "关闭"
};

export const CONTENT_FILTER_MODE_LABELS: Record<ContentFilterMode, string> = {
  hide: "隐藏并标记",
  label: "仅标记",
  off: "关闭"
};

export const THUMBNAIL_LABEL_MODE_LABELS: Record<ThumbnailLabelMode, string> = {
  overlay: "缩略图角标",
  off: "关闭"
};

export const DEFAULT_CATEGORY_MODES: Record<Category, CategoryMode> = {
  sponsor: "auto",
  selfpromo: "manual",
  interaction: "manual",
  intro: "manual",
  outro: "manual",
  preview: "notice",
  padding: "auto",
  music_offtopic: "auto",
  poi_highlight: "manual",
  exclusive_access: "notice"
};

export const DEFAULT_CONFIG: StoredConfig = {
  enabled: true,
  serverAddress: "https://www.bsbsb.top",
  enableCache: true,
  noticeDurationSec: 4,
  minDurationSec: 0,
  showPreviewBar: true,
  thumbnailLabelMode: "overlay",
  categoryModes: DEFAULT_CATEGORY_MODES,
  dynamicFilterMode: "off",
  dynamicRegexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN,
  dynamicRegexKeywordMinMatches: 1,
  commentFilterMode: "off",
  commentHideReplies: false
};

export const DEFAULT_STATS = {
  skipCount: 0,
  minutesSaved: 0
};
