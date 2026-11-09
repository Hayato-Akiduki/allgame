/**
 * Market Engine - リアルタイム市場シミュレーション
 * 価格生成、板生成、ティック更新、歩み値、ローソク足生成
 */

class MarketEngine {
    constructor(stocks) {
        this.stocks = JSON.parse(JSON.stringify(stocks));
        this.candleData = {}; // symbol -> array of candles { time, open, high, low, close, volume }
        this.currentCandles = {}; // symbol -> current in-progress candle
        this.orderBooks = {}; // symbol -> { asks: [{price, qty, isPlayer}], bids: [...] }
        this.trades = {}; // symbol -> array of recent trades { time, price, qty, type: 'buy'|'sell' }
        this.activeSentiments = {}; // symbol -> { bias: float, duration: ticks }

        // 市場クロック
        this.marketTime = new Date();
        this.marketTime.setHours(9, 0, 0, 0); // 9:00スタート
        this.candleIntervalSec = 15; // 15秒で1本の足（ゲームのテンポを良くするため）
        this.candleTimer = 0;
        this.tickCount = 0;

        this.init();
    }

    init() {
        this.stocks.forEach(stock => {
            const sym = stock.symbol;
            this.candleData[sym] = [];
            this.trades[sym] = [];
            this.activeSentiments[sym] = { bias: 0, duration: 0 };

            // 初期ヒストリカルローソク足を35本事前生成
            this.generateHistoricalCandles(stock, 35);

            // 現在進行中のローソク足
            const lastCandle = this.candleData[sym][this.candleData[sym].length - 1];
            stock.currentPrice = lastCandle.close;
            stock.highPrice = Math.max(stock.highPrice, lastCandle.high);
            stock.lowPrice = Math.min(stock.lowPrice, lastCandle.low);

            this.currentCandles[sym] = {
                time: this.formatTime(this.marketTime),
                timestamp: this.marketTime.getTime(), // 足の開始時刻（売買マーカーの位置特定用）
                open: stock.currentPrice,
                high: stock.currentPrice,
                low: stock.currentPrice,
                close: stock.currentPrice,
                volume: 0
            };

            // 初期板情報を生成
            this.generateOrderBook(stock);
        });
    }

    // 起動時の過去ローソク足をリアルに生成
    generateHistoricalCandles(stock, count) {
        let price = stock.basePrice;
        const sym = stock.symbol;
        const startTime = new Date(this.marketTime.getTime() - count * this.candleIntervalSec * 1000);

        for (let i = 0; i < count; i++) {
            const candleTime = new Date(startTime.getTime() + i * this.candleIntervalSec * 1000);
            const open = price;
            
            // ランダムウォーク + わずかなモメンタム
            const changePct = (Math.random() - 0.495) * stock.volatility * 3;
            const closeRaw = open * (1 + changePct);
            const close = this.roundToTick(closeRaw, stock.tickSize, stock.lowLimit, stock.highLimit);

            const spread = Math.abs(close - open);
            const high = this.roundToTick(Math.max(open, close) + Math.random() * spread * 0.8 + stock.tickSize, stock.tickSize, stock.lowLimit, stock.highLimit);
            const low = this.roundToTick(Math.min(open, close) - Math.random() * spread * 0.8 - stock.tickSize, stock.tickSize, stock.lowLimit, stock.highLimit);

            const volume = Math.floor(1000 + Math.random() * 8000 * (1 + Math.abs(changePct) * 100));

            this.candleData[sym].push({
                time: this.formatTime(candleTime),
                timestamp: candleTime.getTime(),
                open,
                high,
                low,
                close,
                volume
            });

            price = close;
            stock.highPrice = Math.max(stock.highPrice, high);
            stock.lowPrice = Math.min(stock.lowPrice, low);
            stock.volume += volume;
        }
    }

    // 呼値・制限値幅への丸め
    roundToTick(price, tickSize, lowLimit, highLimit) {
        let rounded = Math.round(price / tickSize) * tickSize;
        if (rounded > highLimit) rounded = highLimit;
        if (rounded < lowLimit) rounded = lowLimit;
        return rounded;
    }

    // セッション状態（前場・昼休み・後場・大引け）
    getSession() {
        const h = this.marketTime.getHours();
        const m = this.marketTime.getMinutes();
        const totalMin = h * 60 + m;

        if (totalMin < 9 * 60) return { name: '寄付前', status: 'closed' };
        if (totalMin < 11 * 60 + 30) return { name: '前場 LIVE', status: 'open' };
        if (totalMin < 12 * 60 + 30) return { name: '昼休み', status: 'lunch' };
        if (totalMin < 15 * 60) return { name: '後場 LIVE', status: 'open' };
        return { name: '大引け（終了）', status: 'closed' };
    }

    // 翌営業日へ進む（昨日の終値が本日の基準価格に更新）
    advanceToNextDay() {
        this.marketTime.setDate(this.marketTime.getDate() + 1);
        this.marketTime.setHours(9, 0, 0, 0);
        this.isClosed = false;

        this.stocks.forEach(stock => {
            const sym = stock.symbol;
            stock.basePrice = stock.currentPrice;
            stock.highPrice = stock.currentPrice;
            stock.lowPrice = stock.currentPrice;
            stock.volume = 0;

            const limits = window.getPriceLimits(stock.basePrice);
            stock.highLimit = limits.highLimit;
            stock.lowLimit = limits.lowLimit;
            stock.tickSize = window.getTickSize(stock.basePrice);

            this.currentCandles[sym] = {
                time: this.formatTime(this.marketTime),
                timestamp: this.marketTime.getTime(),
                open: stock.currentPrice,
                high: stock.currentPrice,
                low: stock.currentPrice,
                close: stock.currentPrice,
                volume: 0
            };

            this.generateOrderBook(stock);
        });

        return {
            time: this.formatTime(this.marketTime),
            stocks: this.stocks
        };
    }

    // 時間文字列のフォーマット HH:MM:SS
    formatTime(date) {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    // 窓開け：ニュース等で株価を即座にジャンプさせる（呼値・値幅制限に丸める）
    // 戻り値は実際の変化率
    applyGap(symbol, gapPct) {
        const stock = this.getStock(symbol);
        if (!stock) return 0;

        const before = stock.currentPrice;
        const newPrice = this.roundToTick(before * (1 + gapPct), stock.tickSize, stock.lowLimit, stock.highLimit);
        if (newPrice === before) return 0;

        stock.currentPrice = newPrice;
        stock.highPrice = Math.max(stock.highPrice, newPrice);
        stock.lowPrice = Math.min(stock.lowPrice, newPrice);

        // 窓を開けた瞬間に大口の約定が入ったものとして歩み値・出来高に反映
        const tradeVol = Math.floor(3000 + Math.random() * 5000);
        stock.volume += tradeVol;
        this.trades[symbol].unshift({
            time: this.formatTime(this.marketTime),
            price: newPrice,
            qty: tradeVol,
            type: newPrice > before ? 'buy' : 'sell'
        });
        if (this.trades[symbol].length > 30) {
            this.trades[symbol].pop();
        }

        const candle = this.currentCandles[symbol];
        candle.close = newPrice;
        candle.high = Math.max(candle.high, newPrice);
        candle.low = Math.min(candle.low, newPrice);
        candle.volume += tradeVol;

        this.generateOrderBook(stock);
        return (newPrice - before) / before;
    }

    // センチメント（ニュース等によるバイアス）を設定
    applySentiment(symbol, bias, durationTicks) {
        if (this.activeSentiments[symbol]) {
            this.activeSentiments[symbol] = {
                bias: bias, // 例: +0.02 (強烈な買い気配)
                duration: durationTicks
            };
        }
    }

    // 1ティック更新（0.5秒〜1秒ごとに呼び出し）
    tick() {
        // 大引け（15:00）に到達している場合はティック更新を停止
        const currentSession = this.getSession();
        if (currentSession.status === 'closed' && this.marketTime.getHours() >= 15) {
            this.isClosed = true;
            return {
                time: this.formatTime(this.marketTime),
                stocks: this.stocks,
                session: currentSession,
                isClosed: true
            };
        }

        this.tickCount++;
        this.marketTime.setSeconds(this.marketTime.getSeconds() + 1);

        // 11:30（前場引け）になったら昼休み（12:30後場寄り付き）へ自動ジャンプ
        if (this.marketTime.getHours() === 11 && this.marketTime.getMinutes() === 30 && this.marketTime.getSeconds() === 1) {
            this.marketTime.setHours(12, 30, 0, 0);
        }

        const timeStr = this.formatTime(this.marketTime);
        const updatedStocks = [];

        this.stocks.forEach(stock => {
            const sym = stock.symbol;
            const current = stock.currentPrice;

            // センチメントの減衰と影響
            let bias = 0;
            if (this.activeSentiments[sym].duration > 0) {
                bias = this.activeSentiments[sym].bias;
                this.activeSentiments[sym].duration--;
            }

            // 平均回帰効果（基準価格から乖離しすぎた時の引き戻し）
            const deviation = (stock.basePrice - current) / stock.basePrice;
            const meanRevertForce = deviation * stock.meanReversion * 0.1;

            // ランダムウォーク（正規分布的乱数）
            const u1 = Math.random() || 0.001;
            const u2 = Math.random() || 0.001;
            const randNorm = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // 変動率の計算
            const drift = bias + meanRevertForce;
            const deltaPct = drift + randNorm * stock.volatility;

            let newPrice = current * (1 + deltaPct);
            newPrice = this.roundToTick(newPrice, stock.tickSize, stock.lowLimit, stock.highLimit);

            // 出来高の発生
            const isTraded = Math.random() > 0.2 || newPrice !== current;
            let tradeVol = 0;

            if (isTraded) {
                const baseVol = Math.floor(100 + Math.random() * 800);
                const volMultiplier = (newPrice === stock.highLimit || newPrice === stock.lowLimit) ? 4 : 1;
                tradeVol = baseVol * volMultiplier;
                stock.volume += tradeVol;

                // 歩み値に追加
                const tradeType = newPrice >= current ? 'buy' : 'sell';
                this.trades[sym].unshift({
                    time: timeStr,
                    price: newPrice,
                    qty: tradeVol,
                    type: tradeType
                });
                if (this.trades[sym].length > 30) {
                    this.trades[sym].pop();
                }
            }

            stock.currentPrice = newPrice;
            stock.highPrice = Math.max(stock.highPrice, newPrice);
            stock.lowPrice = Math.min(stock.lowPrice, newPrice);

            // ローソク足の更新
            const currentCandle = this.currentCandles[sym];
            currentCandle.close = newPrice;
            currentCandle.high = Math.max(currentCandle.high, newPrice);
            currentCandle.low = Math.min(currentCandle.low, newPrice);
            currentCandle.volume += tradeVol;

            // 板の更新
            this.generateOrderBook(stock);

            updatedStocks.push(stock);
        });

        // 足の確定チェック（candleIntervalSec 秒ごと）
        this.candleTimer++;
        if (this.candleTimer >= this.candleIntervalSec) {
            this.candleTimer = 0;
            this.stocks.forEach(stock => {
                const sym = stock.symbol;
                this.candleData[sym].push({ ...this.currentCandles[sym] });
                if (this.candleData[sym].length > 100) {
                    this.candleData[sym].shift();
                }
                // 新しい足を開始
                this.currentCandles[sym] = {
                    time: timeStr,
                    timestamp: this.marketTime.getTime(),
                    open: stock.currentPrice,
                    high: stock.currentPrice,
                    low: stock.currentPrice,
                    close: stock.currentPrice,
                    volume: 0
                };
            });
        }

        return {
            time: timeStr,
            stocks: updatedStocks
        };
    }

    // 板情報（気配値）をリアルに生成（上下8本）
    generateOrderBook(stock) {
        const sym = stock.symbol;
        const currentPrice = stock.currentPrice;
        const tick = stock.tickSize;
        const asks = [];
        const bids = [];

        // 前回の気配株数を引き継いで少しずつ変化させる（毎ティック乱数で作り直すと数字がちらつくため）
        if (!this.bookQty) this.bookQty = {};
        const prevQty = this.bookQty[sym] || {};
        const nextQty = {};
        const qtyAt = (p, i) => {
            let qty;
            if (prevQty[p]) {
                qty = prevQty[p] * (0.85 + Math.random() * 0.3);
            } else {
                // 新しく見えた気配値は、現在値に近いほど厚めにランダム生成
                qty = 200 + Math.random() * 2500 + (8 - i) * 200;
            }
            qty = Math.min(6000, Math.max(100, Math.round(qty / 100) * 100));
            nextQty[p] = qty;
            return qty;
        };

        // 売り気配（現在値より上）
        for (let i = 1; i <= 8; i++) {
            const p = currentPrice + i * tick;
            if (p <= stock.highLimit) {
                asks.push({ price: p, qty: qtyAt(p, i), isSpecial: p === stock.highLimit });
            }
        }
        // 売り板は高い順（上から下へ）
        asks.reverse();

        // 買い気配（現在値より下）
        for (let i = 1; i <= 8; i++) {
            const p = currentPrice - i * tick;
            if (p >= stock.lowLimit) {
                bids.push({ price: p, qty: qtyAt(p, i), isSpecial: p === stock.lowLimit });
            }
        }

        this.bookQty[sym] = nextQty;
        this.orderBooks[sym] = {
            currentPrice: currentPrice,
            basePrice: stock.basePrice,
            asks: asks,
            bids: bids,
            highLimit: stock.highLimit,
            lowLimit: stock.lowLimit
        };
    }

    // セーブ用に状態をプレーンなオブジェクトへ変換
    serialize() {
        return {
            stocks: this.stocks,
            candleData: this.candleData,
            currentCandles: this.currentCandles,
            trades: this.trades,
            activeSentiments: this.activeSentiments,
            marketTime: this.marketTime.getTime(),
            candleTimer: this.candleTimer,
            tickCount: this.tickCount,
            isClosed: !!this.isClosed
        };
    }

    // セーブデータから状態を復元（板は保存せず再生成）
    restore(data) {
        this.stocks = data.stocks;
        this.candleData = data.candleData;
        this.currentCandles = data.currentCandles;
        this.trades = data.trades;
        this.activeSentiments = data.activeSentiments;
        this.marketTime = new Date(data.marketTime);
        this.candleTimer = data.candleTimer;
        this.tickCount = data.tickCount;
        this.isClosed = data.isClosed;
        this.bookQty = {};
        this.orderBooks = {};
        this.stocks.forEach(stock => this.generateOrderBook(stock));
    }

    getStock(symbol) {
        return this.stocks.find(s => s.symbol === symbol);
    }
}

window.MarketEngine = MarketEngine;
