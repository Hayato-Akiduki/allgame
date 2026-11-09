/**
 * Bulletin Board Engine (投資家掲示板 - Yahoo!ファイナンス掲示板 ＆ 5ch市況実況風)
 * 株価変動・速報ニュース・大口注文にリアルタイム反応するNPC投資家コメント生成と、
 * プレイヤー自身の書き込み（買い煽り・売り煽り）によるイナゴ投資家誘導ギミック
 */

const BOARD_USER_NAMES = [
    "名無しの億り人", "イナゴ特攻隊長", "塩漬け職人", "専業デイトレーダーK",
    "空売り機関のバイト", "退職金オールイン爺", "AIアルゴ監視員", "株歴20年のプロ養分",
    "信用二階建てマン", "損切りできないマン", "ストップ高ハンター", "配当貴族になり隊",
    "板読みの鬼", "逆神インジケーター", "丸の内サラリーマン", "含み損バフェット"
];

const STOCK_SPECIFIC_COMMENTS = {
    "7203": {
        bull: [
            "さすが世界のトヨモータース、押し目は全部拾われるな",
            "円安メリットと自社株買いの安心感よ。ガチホ一択！",
            "大型株に資金回ってきた！ここからは手堅く上値追いでしょ",
            "配当もらいながら値上がりも狙える王道銘柄"
        ],
        bear: [
            "上値が重すぎる…機関の利確売りが降ってきてるな",
            "大型株は値動きマイルドすぎてデイトレには向かんわ",
            "為替が少し円高に振れただけでアルゴ売りが飛んでくるな"
        ],
        neutral: [
            "今日も2850円前後での攻防か、手堅いけど退屈ではある",
            "日経平均の寄与度高いから他銘柄の指標として見てる",
            "ここはNISAで放置する銘柄であってガチャガチャ触る所じゃないw"
        ]
    },
    "6758": {
        bull: [
            "ソニックの新型センサー好調らしいぞ！ハイテク買い戻しきた！",
            "外資系証券が目標株価引き上げ！15,000円目指す展開か",
            "ナスダック先物強いし、主力ハイテクのここには追い風だな"
        ],
        bear: [
            "値がさ株だから1ティック動くだけで含み損エグいんだが…",
            "半導体サイクル一旦ピークアウトか？戻り売り圧力が強い",
            "信用買い残ちょっと溜まりすぎじゃない？上値重そう"
        ],
        neutral: [
            "板が薄くなると急にスプレッド開くから指値必須だな",
            "ゲーム部門の発表待ちで様子見ムードかな"
        ]
    },
    "9984": {
        bull: [
            "AIバブル再燃きたあああ！孫さんの先見の明を信じろ！！",
            "ボラ高すぎて脳汁出るwww 一撃で数十万抜ける神銘柄！",
            "ショートカバー（踏み上げ）始まったぞ！空売り勢燃料ありがとう！"
        ],
        bear: [
            "上げ下げ激しすぎて往復ビンタ食らったわ…アルゴ汚いぞ",
            "海外AI株が崩れたらここも一撃でナイアガラだから怖すぎる",
            "高値掴みしたイナゴが投げ始めたな、一旦下掘るぞ"
        ],
        neutral: [
            "今日も事実上の日経平均レバレッジETFとして機能してるなw",
            "スキャルピング専用銘柄。持ち越しはギャンブルすぎる"
        ]
    },
    "4592": {
        bull: [
            "治験通過したら時価総額10倍だぞ！？こんな安いところで売るやつおりゅ？",
            "大口がこっそり下値で集めてる動き！IR出る前の怪しい買い気配きた！",
            "バイオ特有の連騰モード入ったらS高3連発コース！！🚀",
            "プラ転きたあああ！ここから一気にストップ高まで突き抜けろ！"
        ],
        bear: [
            "またいつもの行ってこいチャートかよ…バイオ株はこれだから怖い",
            "治験失敗したら紙屑なのによう買えるわw",
            "新株予約権の希薄化懸念あるし、上がったところは全部売りぶつけられるぞ"
        ],
        neutral: [
            "宝くじ枠として100株だけ握ってる。当たればデカい、外れれば半値w",
            "ここは板の気配見て反射神経で飛び乗るマネーゲーム会場です"
        ]
    },
    "3990": {
        bull: [
            "🚀ロケットミーム宇宙へ発射準備完了！！乗り遅れるなイナゴども！！",
            "SNSでインフルエンサーが煽り始めたぞ！買い板が分厚くなってきた！",
            "仕手筋の本気買いきたあああ！空売りしてるやつ全員宇宙のチリになるぞwww",
            "値動き軽すぎて一瞬で+10%いくな、これぞ令和のマネーゲーム！"
        ],
        bear: [
            "おい、大口が上でこっそり売り抜けてるぞ…梯子外しくるぞ逃げろ！！",
            "売上ほぼゼロで宇宙開発（笑）とか典型的な仕手株やんけ",
            "買い板が一瞬で消えた！？これが噂のナイアガラか…阿鼻叫喚www",
            "高値で飛びついたイナゴが全員焼き尽くされてて草"
        ],
        neutral: [
            "今日も仕手筋とイナゴの騙し合いバトルが熱いな（高みの見物）",
            "秒単位でトレンド変わるから瞬き厳禁だぞここ"
        ]
    },
    "8306": {
        bull: [
            "金利のある世界きたー！メガバンクは持ってるだけで勝てる時代！",
            "利ざや改善で今期も最高益更新確実視。押し目は機関が全部買ってる",
            "高配当＋増配期待で売る理由が見当たらないんだよなぁ"
        ],
        bear: [
            "利上げ織り込み済みで材料出尽くし売りが出てるな",
            "長期金利がちょっと下がるとすぐ売られるから油断ならん",
            "ここ数日上げた分の利益確定売りに押されてるね"
        ],
        neutral: [
            "日銀の総裁会見までは大きなポジション取りづらいな",
            "値動き落ち着いてるから信用3倍で抜くのにちょうどいい"
        ]
    },
    "6920": {
        bull: [
            "さすが売買代金王者のレーザー！一撃で10万円抜けるボラが最高すぎるw",
            "EUV検査装置は世界独占シェアだからな、押し目は外資が全部拾ってるぞ",
            "米SOX指数（半導体）爆上げきた！今日は踏み上げ祭りだあああ🚀"
        ],
        bear: [
            "超値がさ株だから逆行くと一瞬で致命傷食らう…損切り遅れたら即退場だぞ",
            "信用買い残が多すぎるわ、機関の空売りアルゴに完全に狙われてる",
            "1ティック10円でも100株で1000円動くから心臓に悪い…"
        ],
        neutral: [
            "デイトレの主戦場！板の回転スピードが他銘柄と段違いだな",
            "スキャルピングで数ティック抜くだけでも十分な日当になる銘柄"
        ]
    },
    "7974": {
        bull: [
            "ニンテンドリームのIP力は世界最強！新型機の続報出たら青天井だぞ",
            "円安メリット＋デジタル売上比率上昇で利益率えぐいことになってる",
            "海外ファンドの買いが入ってきたな、8000円台定着は時間の問題"
        ],
        bear: [
            "新作発表の材料出尽くしで一旦利確売りに押されてるな",
            "ハードの切り替え時期は業績の端境期になるから上値重いよ",
            "7900円の壁が厚すぎる…跳ね返されてばかりじゃん"
        ],
        neutral: [
            "世界中で愛される優良株だし、暴落した時だけ拾うのが正解",
            "次のダイレクト発表がいつ来るか、みんなソワソワして待ってるな"
        ]
    },
    "7011": {
        bull: [
            "国策に売りなし！！防衛予算拡大で大和重工は10年安泰の長期上昇トレンド！",
            "ガスタービンと宇宙・防衛のテーマ性が強すぎる、機関投資家がガチ買いしてる",
            "押し目待ちに押し目なし！高値ブレイクしたら一気に走るぞ"
        ],
        bear: [
            "さすがにここ1年で上がりすぎだろ、高値警戒感で利確売りが出てる",
            "機関の空売り残が増えてきたな、一旦調整の下げが来そう",
            "国策とはいえPER高くなりすぎじゃない？飛びつき買いは危険"
        ],
        neutral: [
            "100株20万円ちょっとで買えるから個人にも大人気の銘柄だな",
            "防衛・宇宙・エネルギー全部乗せだからテーマ株としての強さは本物"
        ]
    },
    "9101": {
        bull: [
            "コンテナ運賃市況が再騰してきた！今期も上方修正＆増配ガチャ確定か！？",
            "配当利回りバグってるwww 下がっても高配当狙いの買いが入るから強い！",
            "海運株に資金回ってきたぞ！ボラ高くてデイトレでも最高に稼げる！"
        ],
        bear: [
            "海運は市況株だから運賃下がり始めたらナイアガラだぞ、気をつけろ",
            "配当権利落ち後の下げがエグいから高値掴みすると何年も助からんぞ",
            "中東・紅海情勢のニュースひとつで乱高下するから持ち越し怖い"
        ],
        neutral: [
            "5円刻みで板が動くから指値の順番待ちとタイミングが重要だな",
            "高配当目当ての長期勢とデイトレ勢が激しくぶつかり合う銘柄"
        ]
    },
    "8058": {
        bull: [
            "バフェットお墨付きの総合商社筆頭！累進配当＋自社株買いで死角なし！",
            "資源高＆インフレ時代にはスリーダイヤ商事を持っておけば間違いない",
            "下値が本当に堅いな、機関投資家のコア銘柄として買われ続けてる"
        ],
        bear: [
            "原油と銅が下がるとアルゴ連動で売られるから今日は厳しいか",
            "手堅いけど値動きがゆっくりすぎて短期で爆益狙う銘柄ではないな",
            "円高方向に振れると商社セクター全体が重くなるね"
        ],
        neutral: [
            "5円刻みでゆったり動くから初心者でも安心してトレードできる優良株",
            "トヨモータースと並んでポートフォリオの安定剤にぴったり"
        ]
    },
    "3350": {
        bull: [
            "ビットコイン爆上げきたあああ！！メタビットS高3連発コース突入！！🚀",
            "株価400円台だから1000株・5000株単位で一気に仕込める！テンバガー候補！！",
            "暗号資産トレジャリー戦略が世界に注目された！イナゴ全員集合ーー！！"
        ],
        bear: [
            "BTCちょっと垂れただけで株は倍速で暴落するやんけwww 怖すぎ！！",
            "新株予約権の行使で株数ジャブジャブ希薄化してるのによう買うわ…",
            "典型的なマネーゲーム銘柄、逃げ遅れたら資産半分になるぞ😱"
        ],
        neutral: [
            "低位株で100株4万円ちょっとだからお遊び枠でロット張るには最高におもしろいw",
            "ロケットミームと並ぶ二大カジノ銘柄、板の気配だけで動く世界"
        ]
    }
};

const PRICE_ACTION_COMMENTS = {
    surge: [
        "うおおおお！？急に大口の買い入ったぞ！！",
        "ブレイクきたあああああ！！乗れ乗れー！🚀",
        "強すぎるwww 空売り勢息してるかー！？",
        "特買い気配！？なんか漏れてるのかこれ！？",
        "踏み上げ相場突入！売り方の買い戻しでさらに加速するぞ！",
        "ガチホ大勝利！！さっき狼狽売りしたやつおりゅ？w"
    ],
    plunge: [
        "ぎゃあああああ！？ナイアガラきたあああああ😱",
        "おいおい底が抜けたぞ！誰だよさっき買い煽ってたやつ出てこい！！",
        "ぶん投げ連鎖きた…追証回避の成行売りが止まらん…",
        "梯子外しエグすぎるだろ…一瞬で含み益が吹き飛んだ…",
        "空売り大正解！！気持ちよく落ちていくなぁ📉",
        "落ちるナイフは素手で掴むなよ、まだ掘るぞこれ"
    ],
    limitHigh: [
        "㊗️ストップ高到達きたああああああ！！🎉🚀",
        "S高張り付き！！売り物完全に枯れたな、明日もGU確定か！",
        "ストップ高でお祭り騒ぎ！！ホルダー全員おめでとう！！"
    ],
    limitLow: [
        "ストップ安張り付き…買い板が消滅して逃げられない…😭",
        "S安到達…これ明日も寄らないパターンじゃね…？",
        "ストップ安で阿鼻叫喚…信用買い勢が全員退場コース…"
    ]
};

const PLAYER_PRESETS = {
    bull: [
        "大口が下値で集めてる！ここから急騰・S高コースくるぞ🚀",
        "好材料漏れてるっぽい？買い板が急に厚くなってきたぞ！",
        "空売り燃料たっぷり！踏み上げ相場が始まるぞ、乗り遅れるな！"
    ],
    bear: [
        "上で大口が売り抜けてるぞ…梯子外しの暴落に気をつけろ😱",
        "チャート完全に天井圏。ここからの買いは高値掴みの養分だぞ",
        "悪材料の噂出てるな…今のうちに利確・損切りして逃げた方がいい"
    ],
    neutral: [
        "板の気配が怪しいな、しばらく様子見が正解か",
        "アルゴの揺さぶりが激しいから指値でじっくり待つわ",
        "前場の動き見てからエントリー方向決めるかな"
    ]
};

class BoardManager {
    constructor(market, onSelectStock, onShowToast) {
        this.market = market;
        this.onSelectStock = onSelectStock;
        this.onShowToast = onShowToast;

        this.posts = [];               // 全投稿リスト (最新が先頭)
        this.postCounter = 100;        // レス番号カウンタ
        this.filterMode = 'stock';     // 'stock' (選択銘柄のみ) | 'all' (全銘柄総合)
        this.selectedSymbol = market.stocks[0].symbol;
        this.playerStance = 'bull';    // 'bull' | 'bear' | 'neutral'
        this.isExpanded = false;       // 下部パネル拡大状態

        // 銘柄ごとの前回価格・状態記録（急騰急落検知用）
        this.lastPrices = {};
        this.cooldownTicks = 0;        // プレイヤー煽りクールダウン
        this.spamCount = 0;            // 短時間の連続煽り回数（逆効果リスク用）
        this.unreadCount = 0;          // 未読バッジ用
        this.pendingReplies = [];      // 遅延発生するNPC返信・ニュース反応キュー

        this.market.stocks.forEach(s => {
            this.lastPrices[s.symbol] = s.currentPrice;
        });

        this.initInitialPosts();
        this.bindUI();
    }

    // 初期書き込みの生成
    initInitialPosts() {
        const timeStr = this.market.formatTime(this.market.marketTime);
        this.market.stocks.forEach(stock => {
            const specific = STOCK_SPECIFIC_COMMENTS[stock.symbol];
            if (!specific) return;

            // 各銘柄に初期レスを2件ずつ入れておく
            this.addPost({
                symbol: stock.symbol,
                name: this.randomItem(BOARD_USER_NAMES),
                stance: 'neutral',
                text: this.randomItem(specific.neutral),
                time: timeStr,
                isInitial: true
            });

            const isBull = Math.random() > 0.45;
            this.addPost({
                symbol: stock.symbol,
                name: this.randomItem(BOARD_USER_NAMES),
                stance: isBull ? 'bull' : 'bear',
                text: this.randomItem(isBull ? specific.bull : specific.bear),
                time: timeStr,
                isInitial: true
            });
        });
        this.unreadCount = 0;
    }

    bindUI() {
        const btnFilterStock = document.getElementById('btnBoardFilterStock');
        const btnFilterAll = document.getElementById('btnBoardFilterAll');
        const btnExpand = document.getElementById('btnExpandBottomPanel');

        if (btnFilterStock && btnFilterAll) {
            btnFilterStock.addEventListener('click', () => {
                this.filterMode = 'stock';
                btnFilterStock.classList.add('active');
                btnFilterAll.classList.remove('active');
                this.render();
            });
            btnFilterAll.addEventListener('click', () => {
                this.filterMode = 'all';
                btnFilterAll.classList.add('active');
                btnFilterStock.classList.remove('active');
                this.render();
            });
        }

        // 下部パネルの高さ拡大/標準トグル
        if (btnExpand) {
            btnExpand.addEventListener('click', () => {
                this.isExpanded = !this.isExpanded;
                const centerCol = document.querySelector('.center-column');
                if (centerCol) {
                    centerCol.classList.toggle('expanded-bottom', this.isExpanded);
                }
                btnExpand.textContent = this.isExpanded ? '⬇ 標準サイズ' : '⬆ パネル拡大';
            });
        }

        // プレイヤースタンス切替ボタン
        const stanceBtns = document.querySelectorAll('.board-stance-btn');
        stanceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                stanceBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.playerStance = btn.getAttribute('data-stance');
                this.updateInputPlaceholder();
            });
        });

        // 投稿実行
        const btnPost = document.getElementById('btnBoardSubmit');
        const inputEl = document.getElementById('inputBoardComment');

        if (btnPost) {
            btnPost.addEventListener('click', () => this.handlePlayerPost());
        }
        if (inputEl) {
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handlePlayerPost();
                }
            });
        }

        // タブが開かれたら未読バッジをリセット
        const boardTabBtn = document.querySelector('.tab-btn[data-tab="tabBoard"]');
        if (boardTabBtn) {
            boardTabBtn.addEventListener('click', () => {
                this.unreadCount = 0;
                this.updateBadge();
                this.render();
            });
        }

        this.updateInputPlaceholder();
    }

    updateInputPlaceholder() {
        const inputEl = document.getElementById('inputBoardComment');
        if (!inputEl) return;
        if (this.playerStance === 'bull') {
            inputEl.placeholder = '買い煽りコメントを入力（空欄のまま投稿で定型ポジトークを書き込み）...';
        } else if (this.playerStance === 'bear') {
            inputEl.placeholder = '売り煽りコメントを入力（空欄のまま投稿で定型ネガトークを書き込み）...';
        } else {
            inputEl.placeholder = '銘柄についてのコメントを入力（空欄で定型コメント）...';
        }
    }

    setSelectedStock(symbol) {
        this.selectedSymbol = symbol;
        const stock = this.market.getStock(symbol);
        const labelEl = document.getElementById('boardStockLabel');
        if (labelEl && stock) {
            labelEl.textContent = `${stock.symbol} ${stock.name}`;
        }
        this.render();
    }

    // 毎ティック更新
    tick() {
        if (this.cooldownTicks > 0) {
            this.cooldownTicks--;
            this.updateCooldownUI();
        }
        if (this.market.tickCount % 25 === 0 && this.spamCount > 0) {
            this.spamCount = Math.max(0, this.spamCount - 1);
        }

        // 予約された遅延返信・ニュース反応を処理
        for (let i = this.pendingReplies.length - 1; i >= 0; i--) {
            const item = this.pendingReplies[i];
            item.delay--;
            if (item.delay <= 0) {
                this.addPost(item.post);
                this.pendingReplies.splice(i, 1);
            }
        }

        // 各銘柄の急変動チェック＆ランダム雑談生成
        this.market.stocks.forEach(stock => {
            const prevPrice = this.lastPrices[stock.symbol] || stock.currentPrice;
            const changePct = (stock.currentPrice - prevPrice) / prevPrice;
            this.lastPrices[stock.symbol] = stock.currentPrice;

            // ストップ高・ストップ安張り付き反応
            if (stock.currentPrice === stock.highLimit && Math.random() < 0.15) {
                this.addPost({
                    symbol: stock.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: 'bull',
                    text: this.randomItem(PRICE_ACTION_COMMENTS.limitHigh)
                });
                return;
            }
            if (stock.currentPrice === stock.lowLimit && Math.random() < 0.15) {
                this.addPost({
                    symbol: stock.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: 'bear',
                    text: this.randomItem(PRICE_ACTION_COMMENTS.limitLow)
                });
                return;
            }

            // 1ティックで大きく動いた場合、即座に実況コメントが流れる
            if (changePct >= 0.008 && Math.random() < 0.55) {
                this.addPost({
                    symbol: stock.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: 'bull',
                    text: this.randomItem(PRICE_ACTION_COMMENTS.surge)
                });
            } else if (changePct <= -0.008 && Math.random() < 0.55) {
                this.addPost({
                    symbol: stock.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: 'bear',
                    text: this.randomItem(PRICE_ACTION_COMMENTS.plunge)
                });
            }
        });

        // 定期的な銘柄別コメント発生（約4〜5秒に1回どこかの銘柄で書き込み）
        if (Math.random() < 0.28) {
            // 選択中の銘柄の書き込み頻度を少し高めにする
            const targetStock = Math.random() < 0.45
                ? this.market.getStock(this.selectedSymbol)
                : this.randomItem(this.market.stocks);

            if (targetStock) {
                const diffPct = (targetStock.currentPrice - targetStock.basePrice) / targetStock.basePrice;
                const specific = STOCK_SPECIFIC_COMMENTS[targetStock.symbol];
                let stance = 'neutral';
                const r = Math.random();

                if (diffPct > 0.015) {
                    stance = r < 0.65 ? 'bull' : (r < 0.85 ? 'bear' : 'neutral');
                } else if (diffPct < -0.015) {
                    stance = r < 0.65 ? 'bear' : (r < 0.85 ? 'bull' : 'neutral');
                } else {
                    stance = r < 0.4 ? 'bull' : (r < 0.8 ? 'bear' : 'neutral');
                }

                const pool = specific ? specific[stance] : PRICE_ACTION_COMMENTS.surge;
                this.addPost({
                    symbol: targetStock.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: stance,
                    text: this.randomItem(pool)
                });
            }
        }
    }

    // 速報ニュース発生時の実況ラッシュ
    onNews(newsItem) {
        const isPos = newsItem.type === 'positive';
        const reactions = isPos ? [
            `【速報】${newsItem.badge}きたあああああ！！超絶好材料！！`,
            `うおおおニュース出たぞ！！成行買い急げー！！🚀`,
            `ガチホしてて本当に良かった…ここからストップ高までぶっ飛ぶぞ！`
        ] : [
            `【悲報】${newsItem.badge}の悪材料ニュース出たぞ…逃げろ！！😱`,
            `ぎゃあああ材料悪すぎる！！買い板にぶつけろー！！`,
            `終わった…梯子外されてナイアガラ確定演出じゃん…`
        ];

        reactions.forEach((text, idx) => {
            this.pendingReplies.push({
                delay: idx + 1,
                post: {
                    symbol: newsItem.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: isPos ? 'bull' : 'bear',
                    text: text
                }
            });
        });
    }

    // プレイヤーが大口注文を出した時の板監視NPCの反応
    onPlayerLargeTrade(symbol, side, qty, price) {
        if (qty < 1000) return;
        const isBuy = side.includes('buy');
        if (Math.random() < 0.65) {
            this.pendingReplies.push({
                delay: 1,
                post: {
                    symbol: symbol,
                    name: "板読みの鬼",
                    stance: isBuy ? 'bull' : 'bear',
                    text: isBuy
                        ? `ん？いま ${price.toLocaleString()}円 で ${qty.toLocaleString()}株 の大口買いが入ったな…誰か集めてるぞ！`
                        : `おい、いま ${price.toLocaleString()}円 に ${qty.toLocaleString()}株 の大口売りぶつけられたぞ！大口が抜けてるかも`
                }
            });
        }
    }

    // プレイヤーによるコメント投稿＆イナゴ誘導ギミック
    handlePlayerPost() {
        const inputEl = document.getElementById('inputBoardComment');
        const stock = this.market.getStock(this.selectedSymbol);
        if (!stock) return;

        let rawText = inputEl ? inputEl.value.trim() : '';
        let effectiveStance = this.playerStance;

        // 空欄なら定型文を使用
        if (!rawText) {
            rawText = this.randomItem(PLAYER_PRESETS[this.playerStance]);
        } else {
            // 自由入力テキストからポジ/ネガワードも自動判定補助
            if (effectiveStance === 'neutral') {
                if (/(買|上|S高|ストップ高|急騰|神|ガチホ|プラ転|ロケット|超絶)/.test(rawText)) {
                    effectiveStance = 'bull';
                } else if (/(売|下|S安|ストップ安|暴落|逃げ|オワコン|ナイアガラ|損切|天井)/.test(rawText)) {
                    effectiveStance = 'bear';
                }
            }
        }

        if (inputEl) inputEl.value = '';
        if (window.soundManager) window.soundManager.playOrder();

        const postNo = this.addPost({
            symbol: stock.symbol,
            name: "あなた (専業トレーダー)",
            stance: effectiveStance,
            text: rawText,
            isPlayer: true
        });

        // 買い煽り or 売り煽りの場合、相場へのイナゴ影響判定
        if (effectiveStance === 'bull' || effectiveStance === 'bear') {
            this.evaluateInagoImpact(stock, effectiveStance, postNo);
        } else {
            // 様子見コメントへの通常返信
            if (Math.random() < 0.6) {
                this.pendingReplies.push({
                    delay: 2,
                    post: {
                        symbol: stock.symbol,
                        name: this.randomItem(BOARD_USER_NAMES),
                        stance: 'neutral',
                        text: `>>${postNo} たしかに今は方向感見極めたいところですね`
                    }
                });
            }
        }
    }

    // イナゴ投資家の反応＆株価・板への影響計算
    evaluateInagoImpact(stock, stance, postNo) {
        const isBull = stance === 'bull';

        // クールダウン中または連投しすぎた場合は「ポジトーク乙」と逆張りされる確率上昇
        if (this.cooldownTicks > 0 || this.spamCount >= 3) {
            this.spamCount++;
            this.pendingReplies.push({
                delay: 1,
                post: {
                    symbol: stock.symbol,
                    name: "AIアルゴ監視員",
                    stance: isBull ? 'bear' : 'bull',
                    text: `>>${postNo} 連投煽り必死すぎwww 掲示板で必死な煽りが出た時は逆張りが鉄則！`
                }
            });

            // 逆効果（反対方向に少しバイアスがかかる）
            const backfireBias = (isBull ? -1 : 1) * (stock.volatility * 1.8);
            this.market.applySentiment(stock.symbol, backfireBias, 8);

            if (this.onShowToast) {
                this.onShowToast('alert', '煽り逆効果（逆張り発生）', `連続投稿を見透かされ、掲示板勢に逆張り注文を浴びせられました！`);
            }
            return;
        }

        this.cooldownTicks = 10; // 10ティックのクールダウン
        this.spamCount++;
        this.updateCooldownUI();

        // 銘柄ごとのSNS・掲示板感応度（仕手株・新興株ほどイナゴが釣れやすい）
        const sensitivityMap = {
            "3990": 0.78, // ロケットミーム宇宙（超高確率でイナゴ反応）
            "3350": 0.76, // メタビットプラネット（暗号資産・低位株でイナゴ超高感度）
            "4592": 0.72, // ネオバイオファーマ
            "9984": 0.62, // ソフトベンチャーズ
            "6920": 0.60, // レーザーフォトニクス（デイトレ人気で反応良）
            "9101": 0.56, // 日本オーシャン郵船
            "7011": 0.54, // 大和重工ディフェンス
            "7974": 0.50, // ニンテンドリーム
            "6758": 0.50, // ソニックエレック
            "8306": 0.45, // メガバンク連合
            "8058": 0.43, // スリーダイヤ商事
            "7203": 0.42  // トヨモータース（大型株なので慎重）
        };

        const successProb = sensitivityMap[stock.symbol] || 0.55;
        const roll = Math.random();

        if (roll < successProb) {
            // 大成功：イナゴ投資家が群がり株価・歩み値にインパクト！
            const dir = isBull ? 1 : -1;
            const impactStrength = Math.max(0.006, stock.volatility * 2.8) * dir;
            const existing = this.market.activeSentiments[stock.symbol];
            const combinedBias = (existing && existing.duration > 0)
                ? existing.bias * 0.5 + impactStrength
                : impactStrength;

            this.market.applySentiment(stock.symbol, combinedBias, 12);

            // イナゴたちの追随レスを予約
            const bullReplies = [
                `>>${postNo} マジか！？乗り遅れるな、成行で飛び乗ったわ！！🚀`,
                `>>${postNo} 有能情報サンクス！買い板厚くなってきたしイナゴ突撃ー！！`,
                `>>${postNo} 信じて1000株買い増ししたぞ！ストップ高連れてってくれ！`
            ];
            const bearReplies = [
                `>>${postNo} ヤバそう…今のうちに全部成行で投げたわ😱`,
                `>>${postNo} マジかよ、暴落来る前に空売り仕掛けた！情報感謝！`,
                `>>${postNo} 怖くなって利確逃げしたわ…ナイアガラ注意だな`
            ];

            const replies = isBull ? bullReplies : bearReplies;
            this.pendingReplies.push({
                delay: 1,
                post: {
                    symbol: stock.symbol,
                    name: "イナゴ特攻隊長",
                    stance: stance,
                    text: this.randomItem(replies)
                }
            });
            if (Math.random() < 0.7) {
                this.pendingReplies.push({
                    delay: 3,
                    post: {
                        symbol: stock.symbol,
                        name: this.randomItem(BOARD_USER_NAMES),
                        stance: stance,
                        text: isBull
                            ? `掲示板見てイナゴ買い集まってきたな！勢い出てきたぞ📈`
                            : `掲示板の書き込み見て狼狽売りが出始めたな…📉`
                    }
                });
            }

            if (this.onShowToast) {
                this.onShowToast(
                    'news',
                    `🦗 イナゴ投資家が反応！ (${stock.name})`,
                    isBull
                        ? `あなたの買い煽りに個人投資家が群がり、買い注文が殺到しています！`
                        : `あなたの売り煽りで狼狽売りが誘発され、売り圧力が高まっています！`
                );
            }
        } else if (roll < successProb + 0.30) {
            // 懐疑的・様子見（無風）
            this.pendingReplies.push({
                delay: 2,
                post: {
                    symbol: stock.symbol,
                    name: this.randomItem(BOARD_USER_NAMES),
                    stance: 'neutral',
                    text: `>>${postNo} ポジトーク乙w まぁ板の動き見てから判断するわ`
                }
            });
        } else {
            // 小幅な逆張り反応
            const counterStance = isBull ? 'bear' : 'bull';
            const counterBias = (isBull ? -1 : 1) * (stock.volatility * 1.2);
            this.market.applySentiment(stock.symbol, counterBias, 6);

            this.pendingReplies.push({
                delay: 2,
                post: {
                    symbol: stock.symbol,
                    name: "空売り機関のバイト",
                    stance: counterStance,
                    text: isBull
                        ? `>>${postNo} イナゴが買い煽り始めたってことは天井だな。売りぶつけますw`
                        : `>>${postNo} 売り煽りが出たところこそ絶好の押し目買いチャンス！拾わせてもらうぞ`
                }
            });
        }
    }

    updateCooldownUI() {
        const btn = document.getElementById('btnBoardSubmit');
        if (!btn) return;
        if (this.cooldownTicks > 0) {
            btn.textContent = `書き込む (煽りCD:${this.cooldownTicks}s)`;
        } else {
            btn.textContent = `書き込む`;
        }
    }

    // 投稿オブジェクトを追加
    addPost({ symbol, name, stance, text, time, isPlayer = false, isInitial = false }) {
        this.postCounter++;
        const stock = this.market.getStock(symbol);
        const postTime = time || this.market.formatTime(this.market.marketTime);
        const userId = isPlayer ? 'YOU777' : this.generateId(name);

        const newPost = {
            no: this.postCounter,
            symbol,
            stockName: stock ? stock.name : symbol,
            name,
            userId,
            stance, // 'bull' | 'bear' | 'neutral'
            text,
            time: postTime,
            isPlayer,
            likes: isPlayer ? 1 : Math.floor(Math.random() * 8),
            dislikes: Math.floor(Math.random() * 3)
        };

        this.posts.unshift(newPost);
        if (this.posts.length > 120) {
            this.posts.pop();
        }

        // 掲示板タブが非アクティブなら未読カウントを増やす
        const boardTab = document.getElementById('tabBoard');
        const isCurrentFilterMatch = (this.filterMode === 'all' || symbol === this.selectedSymbol);
        if (!isInitial && boardTab && !boardTab.classList.contains('active')) {
            if (isCurrentFilterMatch) {
                this.unreadCount++;
                this.updateBadge();
            }
        }

        if (isCurrentFilterMatch) {
            this.render();
        } else {
            this.updateBadge();
        }
        return newPost.no;
    }

    updateBadge() {
        const badge = document.getElementById('boardCountBadge');
        if (!badge) return;
        if (this.unreadCount > 0) {
            badge.textContent = `+${this.unreadCount > 99 ? '99' : this.unreadCount}`;
            badge.classList.add('has-unread');
        } else {
            const count = this.getFilteredPosts().length;
            badge.textContent = count;
            badge.classList.remove('has-unread');
        }
    }

    getFilteredPosts() {
        if (this.filterMode === 'all') {
            return this.posts;
        }
        return this.posts.filter(p => p.symbol === this.selectedSymbol);
    }

    // 掲示板UIの描画
    render() {
        const listEl = document.getElementById('boardPostList');
        if (!listEl) return;

        const filtered = this.getFilteredPosts();
        this.updateSentimentMeter(filtered);
        this.updateBadge();

        if (filtered.length === 0) {
            listEl.innerHTML = `<div class="board-empty">まだこの銘柄への書き込みはありません。最初のコメントを投稿してみましょう！</div>`;
            return;
        }

        let html = '';
        filtered.slice(0, 40).forEach(post => {
            let stanceLabel = '様子見';
            let stanceClass = 'stance-neutral';
            if (post.stance === 'bull') {
                stanceLabel = '強く買いたい';
                stanceClass = 'stance-bull';
            } else if (post.stance === 'bear') {
                stanceLabel = '強く売りたい';
                stanceClass = 'stance-bear';
            }

            // アンカー (>>105) のハイライト変換
            const escapedText = this.escapeHtml(post.text).replace(
                /&gt;&gt;(\d+)/g,
                '<span class="board-anchor">&gt;&gt;$1</span>'
            );

            html += `
                <div class="board-post-item ${post.isPlayer ? 'player-post' : ''}">
                    <div class="board-post-header">
                        <div class="board-post-meta">
                            <span class="board-post-no">#${post.no}</span>
                            <span class="board-stock-tag" data-sym="${post.symbol}" title="クリックでこの銘柄を表示">${post.symbol} ${post.stockName}</span>
                            <span class="board-stance-badge ${stanceClass}">${stanceLabel}</span>
                            <span class="board-post-user ${post.isPlayer ? 'is-player' : ''}">${this.escapeHtml(post.name)}</span>
                            <span class="board-post-id">ID:${post.userId}</span>
                        </div>
                        <div class="board-post-right">
                            <span class="board-post-time">${post.time}</span>
                            <button class="board-vote-btn btn-like" data-no="${post.no}" title="そう思う">👍 ${post.likes}</button>
                            <button class="board-vote-btn btn-dislike" data-no="${post.no}" title="そう思わない">👎 ${post.dislikes}</button>
                        </div>
                    </div>
                    <div class="board-post-body">${escapedText}</div>
                </div>
            `;
        });

        listEl.innerHTML = html;

        // 銘柄タグクリックでその銘柄にジャンプ
        listEl.querySelectorAll('.board-stock-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const sym = tag.getAttribute('data-sym');
                if (sym && this.onSelectStock) {
                    this.onSelectStock(sym);
                }
            });
        });

        // 👍 / 👎 ボタン
        listEl.querySelectorAll('.btn-like').forEach(btn => {
            btn.addEventListener('click', () => {
                const no = parseInt(btn.getAttribute('data-no'), 10);
                const post = this.posts.find(p => p.no === no);
                if (post) {
                    post.likes++;
                    this.render();
                }
            });
        });
        listEl.querySelectorAll('.btn-dislike').forEach(btn => {
            btn.addEventListener('click', () => {
                const no = parseInt(btn.getAttribute('data-no'), 10);
                const post = this.posts.find(p => p.no === no);
                if (post) {
                    post.dislikes++;
                    this.render();
                }
            });
        });
    }

    // 強気・弱気センチメントメーターの更新
    updateSentimentMeter(posts) {
        const bullBar = document.getElementById('boardMeterBull');
        const bearBar = document.getElementById('boardMeterBear');
        const meterText = document.getElementById('boardMeterText');
        if (!bullBar || !bearBar || !meterText) return;

        let bulls = 0;
        let bears = 0;
        posts.slice(0, 25).forEach(p => {
            if (p.stance === 'bull') bulls++;
            else if (p.stance === 'bear') bears++;
        });

        const total = bulls + bears;
        const bullPct = total > 0 ? Math.round((bulls / total) * 100) : 50;
        const bearPct = 100 - bullPct;

        bullBar.style.width = `${bullPct}%`;
        bearBar.style.width = `${bearPct}%`;
        meterText.innerHTML = `<span class="text-up">買いたい ${bullPct}%</span> vs <span class="text-down">売りたい ${bearPct}%</span>`;
    }

    generateId(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash |= 0;
        }
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let res = '';
        let seed = Math.abs(hash) + 12345;
        for (let i = 0; i < 6; i++) {
            res += chars[seed % chars.length];
            seed = Math.floor(seed / 3) + i * 17;
        }
        return res;
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}

window.BoardManager = BoardManager;
