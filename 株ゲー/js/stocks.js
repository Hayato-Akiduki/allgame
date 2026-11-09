/**
 * 銘柄マスターデータ定義
 * 日本の株式市場をモデルにした個性豊かな銘柄群
 */

// 日本株の値幅制限（呼値とストップ高・安の幅）を計算
function getPriceLimits(basePrice) {
    let limit;
    if (basePrice < 100) limit = 30;
    else if (basePrice < 200) limit = 50;
    else if (basePrice < 500) limit = 80;
    else if (basePrice < 700) limit = 100;
    else if (basePrice < 1000) limit = 150;
    else if (basePrice < 1500) limit = 300;
    else if (basePrice < 2000) limit = 400;
    else if (basePrice < 3000) limit = 500;
    else if (basePrice < 5000) limit = 700;
    else if (basePrice < 7000) limit = 1000;
    else if (basePrice < 10000) limit = 1500;
    else if (basePrice < 15000) limit = 3000;
    else if (basePrice < 20000) limit = 4000;
    else if (basePrice < 30000) limit = 5000;
    else limit = 7000;

    return {
        highLimit: basePrice + limit,
        lowLimit: Math.max(1, basePrice - limit),
        range: limit
    };
}

// 呼値（株価の刻み値）
function getTickSize(price) {
    if (price <= 3000) return 1;
    if (price <= 5000) return 5;
    if (price <= 30000) return 10;
    return 50;
}

const INITIAL_STOCKS = [
    {
        symbol: "7203",
        name: "トヨモータース",
        sector: "輸送用機器",
        category: "安定大型株",
        badgeColor: "#3b82f6", // blue
        basePrice: 2850,
        currentPrice: 2850,
        openPrice: 2850,
        highPrice: 2850,
        lowPrice: 2850,
        volume: 0,
        volatility: 0.0018, // 低〜中ボラ
        meanReversion: 0.08, // 平均回帰性高め（手堅い）
        description: "日本を代表する自動車メーカー。業績安定、配当利回り良好。値動きは穏やかで手堅いデイトレ向き。"
    },
    {
        symbol: "6758",
        name: "ソニックエレック",
        sector: "電気機器",
        category: "主力ハイテク",
        badgeColor: "#8b5cf6", // purple
        basePrice: 13200,
        currentPrice: 13200,
        openPrice: 13200,
        highPrice: 13200,
        lowPrice: 13200,
        volume: 0,
        volatility: 0.0028,
        meanReversion: 0.05,
        description: "ゲーム、エンタメ、半導体センサーを展開するハイテク巨人。日経平均や米ナスダックとの連動性が高い。"
    },
    {
        symbol: "9984",
        name: "ソフトベンチャーズ",
        sector: "情報・通信",
        category: "AI・急成長投資",
        badgeColor: "#ec4899", // pink
        basePrice: 8400,
        currentPrice: 8400,
        openPrice: 8400,
        highPrice: 8400,
        lowPrice: 8400,
        volume: 0,
        volatility: 0.0045, // 高ボラ
        meanReversion: 0.03,
        description: "世界的AIベンチャーへ巨額投資を行うコングロマリット。海外市況やAI関連ニュースで激しく上下する。"
    },
    {
        symbol: "4592",
        name: "ネオバイオファーマ",
        sector: "医薬品",
        category: "激動バイオベンチャー",
        badgeColor: "#ef4444", // red
        basePrice: 620,
        currentPrice: 620,
        openPrice: 620,
        highPrice: 620,
        lowPrice: 620,
        volume: 0,
        volatility: 0.0085, // 超高ボラ
        meanReversion: 0.01,
        description: "難病治療薬の開発を行う創薬ベンチャー。治験成否の材料が出るとストップ高・ストップ安の連続となるギャンブル銘柄。"
    },
    {
        symbol: "3990",
        name: "ロケットミーム宇宙",
        sector: "サービス・宇宙",
        category: "仕手・SNSイナゴ株",
        badgeColor: "#f59e0b", // amber
        basePrice: 1450,
        currentPrice: 1450,
        openPrice: 1450,
        highPrice: 1450,
        lowPrice: 1450,
        volume: 0,
        volatility: 0.0095, // 極大ボラ
        meanReversion: 0.005,
        description: "民間ロケット開発を標榜する新興企業。SNSで買い煽りが入ると急騰するが、大口の梯子外しで一瞬で暴落する危険銘柄。"
    },
    {
        symbol: "8306",
        name: "メガバンク連合",
        sector: "銀行業",
        category: "金利敏感・高配当",
        badgeColor: "#10b981", // emerald
        basePrice: 1680,
        currentPrice: 1680,
        openPrice: 1680,
        highPrice: 1680,
        lowPrice: 1680,
        volume: 0,
        volatility: 0.0022,
        meanReversion: 0.06,
        description: "国内最大のメガバンクグループ。金利動向や金融政策決定会合の発表に極めて敏感に反応する。"
    },
    {
        symbol: "6920",
        name: "レーザーフォトニクス",
        sector: "電気機器",
        category: "値がさ半導体主力",
        badgeColor: "#06b6d4", // cyan
        basePrice: 21500,
        currentPrice: 21500,
        openPrice: 21500,
        highPrice: 21500,
        lowPrice: 21500,
        volume: 0,
        volatility: 0.0048,
        meanReversion: 0.025,
        description: "最先端EUV半導体検査装置で世界独占シェアを誇る超値がさ株。売買代金は常に市場トップクラスでデイトレの主戦場。"
    },
    {
        symbol: "7974",
        name: "ニンテンドリーム",
        sector: "その他製品",
        category: "エンタメ・IP王者",
        badgeColor: "#e11d48", // rose
        basePrice: 7900,
        currentPrice: 7900,
        openPrice: 7900,
        highPrice: 7900,
        lowPrice: 7900,
        volume: 0,
        volatility: 0.0026,
        meanReversion: 0.05,
        description: "世界中にファンを持つゲーム・エンタメの絶対王者。新型ハード発表や新作タイトルの初動売上速報で大きく動く。"
    },
    {
        symbol: "7011",
        name: "大和重工ディフェンス",
        sector: "機械",
        category: "国策・防衛・重工",
        badgeColor: "#0ea5e9", // sky
        basePrice: 2180,
        currentPrice: 2180,
        openPrice: 2180,
        highPrice: 2180,
        lowPrice: 2180,
        volume: 0,
        volatility: 0.0032,
        meanReversion: 0.045,
        description: "防衛装備品やガスタービン、次世代エネルギーを手掛ける重工の雄。防衛予算拡大や大型インフラ受注ニュースに強い。"
    },
    {
        symbol: "9101",
        name: "日本オーシャン郵船",
        sector: "海運業",
        category: "超高配当・海運市況",
        badgeColor: "#0284c7", // ocean blue
        basePrice: 4850,
        currentPrice: 4850,
        openPrice: 4850,
        highPrice: 4850,
        lowPrice: 4850,
        volume: 0,
        volatility: 0.0036,
        meanReversion: 0.04,
        description: "世界規模のコンテナ船・ばら積み船を展開する大手海運。国際情勢による運賃市況の変動や増配・還元発表で激しく動く。"
    },
    {
        symbol: "8058",
        name: "スリーダイヤ商事",
        sector: "卸売業",
        category: "総合商社・資源",
        badgeColor: "#14b8a6", // teal
        basePrice: 3250,
        currentPrice: 3250,
        openPrice: 3250,
        highPrice: 3250,
        lowPrice: 3250,
        volume: 0,
        volatility: 0.0020,
        meanReversion: 0.07,
        description: "資源エネルギーから食料まで手掛ける総合商社の筆頭。海外著名投資家の買い増し観測や資源価格の上昇が追い風となる。"
    },
    {
        symbol: "3350",
        name: "メタビットプラネット",
        sector: "情報・通信",
        category: "暗号資産・超絶ボラ",
        badgeColor: "#f97316", // orange
        basePrice: 420,
        currentPrice: 420,
        openPrice: 420,
        highPrice: 420,
        lowPrice: 420,
        volume: 0,
        volatility: 0.0092,
        meanReversion: 0.008,
        description: "財務資産としてビットコインを大量保有する異色の低位株。暗号資産の急騰・急落に連動してストップ高・安を繰り返す。"
    }
];

// 初期設定の付与
INITIAL_STOCKS.forEach(stock => {
    const limits = getPriceLimits(stock.basePrice);
    stock.highLimit = limits.highLimit;
    stock.lowLimit = limits.lowLimit;
    stock.tickSize = getTickSize(stock.basePrice);
});

window.INITIAL_STOCKS = INITIAL_STOCKS;
window.getPriceLimits = getPriceLimits;
window.getTickSize = getTickSize;
