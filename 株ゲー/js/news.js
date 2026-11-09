/**
 * News Engine - ニュース速報・決算・IR・マクロ経済イベント生成
 * 銘柄の株価・板にダイレクトに強烈な売買インパクトを与える
 */

const NEWS_TEMPLATES = [
    // ネオバイオファーマ (4592)
    {
        symbol: "4592",
        headline: "【特報】ネオバイオ、次世代難病治療薬の第III相治験で主要評価項目を完全達成！",
        impact: 0.045, // 強烈な買い気配
        duration: 25,
        type: "positive",
        badge: "治験成功"
    },
    {
        symbol: "4592",
        headline: "【急落】ネオバイオ、期待の抗がん剤で予期せぬ副作用発生、治験一時中断を発表",
        impact: -0.042,
        duration: 25,
        type: "negative",
        badge: "治験中断"
    },
    // ロケットミーム宇宙 (3990)
    {
        symbol: "3990",
        headline: "【SNS急騰】大物投資家『ロケットミームの潜在価値は10倍』とツイート、個人投資家のイナゴ買い殺到！",
        impact: 0.055,
        duration: 20,
        type: "positive",
        badge: "SNS買い煽り"
    },
    {
        symbol: "3990",
        headline: "【暴落警報】ロケットミーム、仕手筋が大口売り抜けか。買い板が一瞬で消滅し急降下！",
        impact: -0.05,
        duration: 20,
        type: "negative",
        badge: "梯子外し"
    },
    // トヨモータース (7203)
    {
        symbol: "7203",
        headline: "【決算】トヨモータース、過去最高益を更新！自社株買い5000億円と大幅増配を発表",
        impact: 0.015,
        duration: 30,
        type: "positive",
        badge: "好決算・増配"
    },
    {
        symbol: "7203",
        headline: "【悪材料】トヨモータース、海外主力工場でシステム障害発生。世界全域で操業停止の恐れ",
        impact: -0.018,
        duration: 30,
        type: "negative",
        badge: "操業停止"
    },
    // ソニックエレック (6758)
    {
        symbol: "6758",
        headline: "【新製品】ソニックエレック、次世代新型コンソール機と革新CMOSセンサーの発売を電撃発表！",
        impact: 0.022,
        duration: 25,
        type: "positive",
        badge: "新製品発表"
    },
    {
        symbol: "6758",
        headline: "【懸念】半導体サプライチェーン逼迫により、ソニックエレックの出荷見通し下方修正の報道",
        impact: -0.02,
        duration: 25,
        type: "negative",
        badge: "下方修正懸念"
    },
    // ソフトベンチャーズ (9984)
    {
        symbol: "9984",
        headline: "【AI特需】ソフトベンチャーズ出資の海外AIユニコーン企業、ナスダック新規上場で時価総額15兆円突破！",
        impact: 0.035,
        duration: 25,
        type: "positive",
        badge: "AIブーム"
    },
    {
        symbol: "9984",
        headline: "【下落】ソフトベンチャーズ出資の海外スタートアップが巨額評価損計上、業績への影響懸念",
        impact: -0.03,
        duration: 25,
        type: "negative",
        badge: "評価損計上"
    },
    // メガバンク連合 (8306)
    {
        symbol: "8306",
        headline: "【金融速報】日銀、政策金利の引き上げを電撃決定！利ざや拡大期待で銀行株に猛烈な資金流入",
        impact: 0.025,
        duration: 30,
        type: "positive",
        badge: "利上げ決定"
    },
    {
        symbol: "8306",
        headline: "【マクロ】長期金利急低下、日銀総裁発言で利上げ観測後退。銀行セクターに売り先行",
        impact: -0.022,
        duration: 30,
        type: "negative",
        badge: "金利低下"
    },
    // レーザーフォトニクス (6920)
    {
        symbol: "6920",
        headline: "【半導体】レーザーフォトニクス、次世代EUV検査装置の過去最大規模の受注獲得を発表！",
        impact: 0.036,
        duration: 25,
        type: "positive",
        badge: "大型受注"
    },
    {
        symbol: "6920",
        headline: "【急落】米半導体株指数が大幅安、対中輸出規制強化の報道でレーザーフォトニクスに大口売り",
        impact: -0.034,
        duration: 25,
        type: "negative",
        badge: "半導体規制懸念"
    },
    // ニンテンドリーム (7974)
    {
        symbol: "7974",
        headline: "【大ヒット】ニンテンドリーム、次世代ゲーム機の予約数が世界歴代最多を記録！業績大幅上振れへ",
        impact: 0.024,
        duration: 28,
        type: "positive",
        badge: "新型機大ヒット"
    },
    {
        symbol: "7974",
        headline: "【悲報】ニンテンドリーム、期待の超大型タイトルが品質向上のため来期へ発売延期を発表",
        impact: -0.022,
        duration: 25,
        type: "negative",
        badge: "発売延期"
    },
    // 大和重工ディフェンス (7011)
    {
        symbol: "7011",
        headline: "【国策】防衛省より次世代防衛システム・新型ガスタービンの総額1兆円規模の大型契約を受注！",
        impact: 0.028,
        duration: 28,
        type: "positive",
        badge: "国策大型契約"
    },
    {
        symbol: "7011",
        headline: "【懸念】大和重工ディフェンス、海外プラント事業での追加コスト計上により利益率悪化の報道",
        impact: -0.024,
        duration: 25,
        type: "negative",
        badge: "コスト増懸念"
    },
    // 日本オーシャン郵船 (9101)
    {
        symbol: "9101",
        headline: "【海運特需】国際コンテナ運賃指数が急騰！日本オーシャン郵船が通期上方修正と特別増配を発表",
        impact: 0.030,
        duration: 28,
        type: "positive",
        badge: "上方修正・増配"
    },
    {
        symbol: "9101",
        headline: "【市況悪化】主要航路の運賃急落と燃料費高騰が直撃、海運セクターに機関投資家の利益確定売り",
        impact: -0.028,
        duration: 25,
        type: "negative",
        badge: "運賃市況下落"
    },
    // スリーダイヤ商事 (8058)
    {
        symbol: "8058",
        headline: "【電撃発表】米著名投資家バフェット氏の投資会社、日本の総合商社株の保有比率をさらに引き上げ！",
        impact: 0.020,
        duration: 30,
        type: "positive",
        badge: "バフェット買い増し"
    },
    {
        symbol: "8058",
        headline: "【資源安】原油・銅などの国際資源価格が急落、スリーダイヤ商事の資源部門収益に警戒感",
        impact: -0.018,
        duration: 28,
        type: "negative",
        badge: "資源価格下落"
    },
    // メタビットプラネット (3350)
    {
        symbol: "3350",
        headline: "【暗号資産】ビットコインが史上最高値を大幅更新！メタビットプラネットの保有含み益が爆増し買い殺到！",
        impact: 0.052,
        duration: 22,
        type: "positive",
        badge: "BTC最高値更新"
    },
    {
        symbol: "3350",
        headline: "【急落警報】暗号資産市場で大規模ロスカット連鎖による暴落発生！メタビットプラネットに投げ売り殺到",
        impact: -0.048,
        duration: 22,
        type: "negative",
        badge: "暗号資産急落"
    }
];

class NewsManager {
    constructor(market, onNewNews) {
        this.market = market;
        this.onNewNews = onNewNews; // UI通知コールバック
        this.newsHistory = [];
        this.intervalTicks = 35; // 約35秒ごとにニュース発生判定
        this.tickCounter = 0;

        // ニュース反応の調整パラメータ
        // 想定総変動率 = impact × duration × moveScale × 強さ（強さは毎回ランダム）
        this.moveScale = 0.25;
        this.strengthMin = 0.4;        // 効果の強さの下限（倍率）
        this.strengthMax = 1.3;        // 効果の強さの上限（倍率）
        this.gapShare = 0.7;           // 想定変動のうち発表直後の窓開けで織り込む割合
        this.exhaustionProb = 0.25;    // 材料出尽くし（窓開け後に反転）が起こる確率
        this.exhaustionGiveBack = 0.7; // 出尽くし時に窓開け分を吐き出す割合
    }

    // ニュースへの値動き反応を適用（窓開け → 追随 or 材料出尽くしで反転）
    applyNewsReaction(template) {
        const strength = this.strengthMin + Math.random() * (this.strengthMax - this.strengthMin);
        const expectedMove = template.impact * template.duration * this.moveScale * strength;

        // 発表直後に大部分を織り込んで窓を開ける（プレイヤーは発表前の値段では買えない）
        const gap = this.market.applyGap(template.symbol, expectedMove * this.gapShare);

        // その後の値動き：残りの織り込み、または材料出尽くしによる反転
        const isExhaustion = Math.random() < this.exhaustionProb;
        const followMove = isExhaustion
            ? -gap * this.exhaustionGiveBack
            : expectedMove * (1 - this.gapShare);
        this.market.applySentiment(template.symbol, followMove / template.duration, template.duration);

        return { strength, gap, isExhaustion };
    }

    tick() {
        this.tickCounter++;
        // 一定時間ごと、またはランダムでニュース発生
        if (this.tickCounter >= this.intervalTicks) {
            this.tickCounter = 0;
            // 75%の確率でニュース発生
            if (Math.random() < 0.75) {
                this.triggerRandomNews();
            }
        }
    }

    triggerRandomNews() {
        const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
        const timeStr = this.market.formatTime(this.market.marketTime);

        const newsItem = {
            id: 'news_' + Date.now(),
            time: timeStr,
            ...template
        };

        this.newsHistory.unshift(newsItem);
        if (this.newsHistory.length > 30) this.newsHistory.pop();

        // 窓開け・効果のばらつき・材料出尽くしを含む値動き反応を適用
        newsItem.reaction = this.applyNewsReaction(template);

        // 効果音
        if (window.soundManager) window.soundManager.playNews();

        // UIコールバック呼び出し
        if (this.onNewNews) {
            this.onNewNews(newsItem);
        }

        return newsItem;
    }
}

window.NewsManager = NewsManager;
