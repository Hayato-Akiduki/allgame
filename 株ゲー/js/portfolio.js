/**
 * Portfolio & Trading Engine
 * 資産管理、現物・信用取引（レバレッジ3倍・空売り）、指値・逆指値（ストップロス）約定判定、
 * エクイティカーブ（資産推移）記録、詳細パフォーマンス分析
 */

class PortfolioManager {
    constructor(initialCash = 10000000) {
        this.initialCash = initialCash;
        this.cash = initialCash;           // 現金残高
        this.positions = [];              // 保有ポジション [{ id, symbol, name, side, qty, avgPrice, timestamp }]
        this.orders = [];                 // 未約定の指値・逆指値注文 [{ id, symbol, name, side, orderType, price, qty, timestamp }]
        this.history = [];                // 取引・決済履歴
        this.totalRealizedPnL = 0;        // 実現損益合計
        this.winTrades = 0;               // 勝ちトレード数
        this.lossTrades = 0;              // 負けトレード数
        this.totalGain = 0;               // 勝ちトレードの合計利益額
        this.totalLoss = 0;               // 負けトレードの合計損失額

        this.peakAsset = initialCash;     // 過去最高の総資産
        this.maxDrawdown = 0;             // 最大ドローダウン額
        this.maxDrawdownPct = 0;          // 最大ドローダウン率
        this.assetHistory = [{ time: '09:00:00', asset: initialCash }]; // 資産推移ログ

        this.marginMultiplier = 3.0;      // 信用取引レバレッジ

        // 称号・実績管理用プロパティ
        this.shortProfit = 0;             // 空売りの累計実現利益
        this.maxSingleGain = 0;           // 1トレードの最大利益
        this.hadDeepDrawdown = false;     // ドローダウン20%超を経験したか
        this.unlockedTrophies = new Set(); // 解除済み実績ID

        this.idSeq = 0;                   // ID採番用の連番（同一ミリ秒内の重複防止）

        // 手数料・税金
        this.feeRate = 0.001;             // 売買手数料率（約定代金の0.1%、税込）
        this.minFee = 100;                // 1約定あたりの最低手数料
        this.taxRate = 0.20315;           // 譲渡益課税（所得税15.315% + 住民税5%）
        this.totalFees = 0;               // 支払った手数料の累計
        this.taxPaid = 0;                 // 源泉徴収済みの税額（損失が出ると還付で減る）

        // ランキング記録用
        this.tradingDay = 1;              // 何営業日目か
        this.startedAt = Date.now();      // このゲームを始めた日時（現実の時刻）
    }

    // 売買手数料（1約定ごと）
    calcFee(amount) {
        return Math.max(this.minFee, Math.round(amount * this.feeRate));
    }

    // 源泉徴収の精算：通算した実現損益に対する税額と徴収済み額の差を、徴収または還付する
    // （特定口座・源泉徴収ありと同じく、損失が出れば徴収済みの税金が戻ってくる）
    settleTax() {
        const targetTax = Math.floor(Math.max(0, this.totalRealizedPnL) * this.taxRate);
        const delta = targetTax - this.taxPaid;
        this.cash -= delta;
        this.taxPaid = targetTax;
        return delta;
    }

    // ストップ高では売り手が、ストップ安では買い手がいないため、成行でも約定しない
    canFill(stock, side) {
        const isBuy = side === 'cash_buy' || side === 'margin_buy' || side === 'margin_close_buy';
        if (isBuy && stock.currentPrice >= stock.highLimit) return false;
        if (!isBuy && stock.currentPrice <= stock.lowLimit) return false;
        return true;
    }

    // セーブ用に状態をプレーンなオブジェクトへ変換
    serialize() {
        const { unlockedTrophies, ...rest } = this;
        return { ...rest, unlockedTrophies: [...unlockedTrophies] };
    }

    // セーブデータから状態を復元
    restore(data) {
        Object.assign(this, data);
        this.unlockedTrophies = new Set(data.unlockedTrophies || []);
    }

    // 一意なIDを生成
    nextId(prefix) {
        this.idSeq++;
        return `${prefix}_${Date.now()}_${this.idSeq}`;
    }

    // 指定銘柄・区分の未約定注文の合計株数
    getPendingOrderQty(symbol, side) {
        return this.orders
            .filter(o => o.symbol === symbol && o.side === side)
            .reduce((sum, o) => sum + o.qty, 0);
    }

    // 新規建て・買い増し時のポジション反映（同一銘柄・同一区分は平均単価で統合）
    // fee: 新規時の手数料（決済時に株数で按分して実現損益に含める）
    addPosition(stock, side, qty, price, timeStr, fee = 0) {
        const existing = this.positions.find(p => p.symbol === stock.symbol && p.side === side);
        if (existing) {
            const totalCost = (existing.avgPrice * existing.qty) + price * qty;
            existing.qty += qty;
            existing.avgPrice = Math.round(totalCost / existing.qty);
            existing.openFee = (existing.openFee || 0) + fee;
        } else {
            this.positions.push({
                id: this.nextId('pos'),
                symbol: stock.symbol,
                name: stock.name,
                side,
                qty,
                avgPrice: price,
                openFee: fee,
                time: timeStr
            });
        }
    }

    // 総資産（現金 ＋ 保有株評価額 ＋ 信用評価損益）
    getTotalAsset(market) {
        let stockVal = 0;
        let unrealizedPnL = 0;

        this.positions.forEach(pos => {
            const stock = market.getStock(pos.symbol);
            if (!stock) return;
            const currentPrice = stock.currentPrice;

            if (pos.side === 'cash_buy') {
                stockVal += currentPrice * pos.qty;
            } else if (pos.side === 'margin_buy') {
                unrealizedPnL += (currentPrice - pos.avgPrice) * pos.qty;
            } else if (pos.side === 'margin_sell') {
                unrealizedPnL += (pos.avgPrice - currentPrice) * pos.qty;
            }
        });

        return this.cash + stockVal + unrealizedPnL;
    }

    // 資産推移スナップショットの記録
    recordAssetSnapshot(market) {
        const total = this.getTotalAsset(market);
        const timeStr = market.formatTime(market.marketTime);

        if (total > this.peakAsset) {
            this.peakAsset = total;
        }
        // 金額と率はピークが異なると最大になる時点がずれるため、別々に最大値を記録
        const drawdown = this.peakAsset - total;
        if (drawdown > this.maxDrawdown) {
            this.maxDrawdown = drawdown;
        }
        const drawdownPct = (drawdown / this.peakAsset) * 100;
        if (drawdownPct > this.maxDrawdownPct) {
            this.maxDrawdownPct = drawdownPct;
        }

        const last = this.assetHistory[this.assetHistory.length - 1];
        if (last && last.time === timeStr) {
            last.asset = Math.round(total);
        } else {
            this.assetHistory.push({ time: timeStr, asset: Math.round(total) });
            if (this.assetHistory.length > 150) {
                this.assetHistory.shift();
            }
        }
    }

    // トレード詳細パフォーマンス統計の取得
    getPerformanceStats(market) {
        const totalTrades = this.winTrades + this.lossTrades;
        const winRate = totalTrades > 0 ? ((this.winTrades / totalTrades) * 100).toFixed(1) : '0.0';
        const profitFactor = this.totalLoss > 0 
            ? (this.totalGain / this.totalLoss).toFixed(2) 
            : (this.totalGain > 0 ? 'MAX' : '0.00');
        const avgGain = this.winTrades > 0 ? Math.round(this.totalGain / this.winTrades) : 0;
        const avgLoss = this.lossTrades > 0 ? Math.round(this.totalLoss / this.lossTrades) : 0;
        const riskRewardRatio = avgLoss > 0 ? (avgGain / avgLoss).toFixed(2) : '-';

        return {
            totalTrades,
            winTrades: this.winTrades,
            lossTrades: this.lossTrades,
            winRate,
            totalRealizedPnL: this.totalRealizedPnL,
            totalGain: this.totalGain,
            totalLoss: this.totalLoss,
            profitFactor,
            avgGain,
            avgLoss,
            riskRewardRatio,
            maxDrawdown: Math.round(this.maxDrawdown),
            maxDrawdownPct: this.maxDrawdownPct.toFixed(2),
            assetHistory: this.assetHistory
        };
    }

    // 保有株・建玉の含み評価損益合計
    getUnrealizedPnL(market) {
        let pnl = 0;
        this.positions.forEach(pos => {
            const stock = market.getStock(pos.symbol);
            if (!stock) return;
            const currentPrice = stock.currentPrice;

            if (pos.side === 'cash_buy') {
                pnl += (currentPrice - pos.avgPrice) * pos.qty;
            } else if (pos.side === 'margin_buy') {
                pnl += (currentPrice - pos.avgPrice) * pos.qty;
            } else if (pos.side === 'margin_sell') {
                pnl += (pos.avgPrice - currentPrice) * pos.qty;
            }
        });
        return pnl;
    }

    // 保有現物株の時価総額
    getTotalStockValue(market) {
        let val = 0;
        this.positions.forEach(pos => {
            if (pos.side === 'cash_buy') {
                const stock = market.getStock(pos.symbol);
                if (stock) val += stock.currentPrice * pos.qty;
            }
        });
        return val;
    }

    // 信用建玉の拘束保証金を計算
    getRequiredMargin() {
        let margin = 0;
        this.positions.forEach(pos => {
            if (pos.side === 'margin_buy' || pos.side === 'margin_sell') {
                margin += (pos.avgPrice * pos.qty) / this.marginMultiplier;
            }
        });
        return margin;
    }

    // 信用新規建可能余力
    getAvailableMargin(market) {
        const totalAsset = this.getTotalAsset(market);
        const usedMargin = this.getRequiredMargin();
        const pendingMargin = this.getPendingMarginOrderAmount();
        const freeEquity = Math.max(0, totalAsset - usedMargin - pendingMargin);
        return freeEquity * this.marginMultiplier;
    }

    // 未約定の信用新規注文が拘束する保証金
    getPendingMarginOrderAmount() {
        let locked = 0;
        this.orders.forEach(o => {
            if (o.side === 'margin_buy' || o.side === 'margin_sell') {
                locked += (o.price * o.qty) / this.marginMultiplier;
            }
        });
        return locked;
    }

    // 未約定注文の拘束資金（返済注文は新たな資金を拘束しない）
    getOrderLockedCash() {
        let locked = this.getPendingMarginOrderAmount();
        this.orders.forEach(o => {
            if (o.side === 'cash_buy') {
                locked += o.price * o.qty + this.calcFee(o.price * o.qty);
            }
        });
        return locked;
    }

    // 取引時間中か（前場・後場のみ発注・決済可能）
    isMarketOpen(market) {
        return !market.isClosed && market.getSession().status === 'open';
    }

    // 発注処理（成行 / 指値 / 逆指値）
    placeOrder(market, { symbol, side, orderType, price, qty }) {
        const stock = market.getStock(symbol);
        if (!stock) return { success: false, message: '銘柄が存在しません' };
        if (!this.isMarketOpen(market)) return { success: false, message: '取引時間外のため発注できません' };
        if (!Number.isInteger(qty) || qty <= 0) return { success: false, message: '株数を指定してください' };
        if (qty % 100 !== 0) return { success: false, message: '株数は100株単位で指定してください' };
        if (orderType !== 'market' && !(Number.isFinite(price) && price > 0)) {
            return { success: false, message: '有効な価格を指定してください' };
        }

        const currentPrice = stock.currentPrice;
        const targetPrice = orderType === 'market' ? currentPrice : price;
        const requiredAmount = targetPrice * qty;

        // 現物買いの資金チェック
        if (side === 'cash_buy') {
            const lockedCash = this.getOrderLockedCash();
            if (this.cash - lockedCash < requiredAmount + this.calcFee(requiredAmount)) {
                return { success: false, message: '現金残高が不足しています' };
            }
        }

        // 信用新規（買い・売り）の余力チェック
        if (side === 'margin_buy' || side === 'margin_sell') {
            const availMargin = this.getAvailableMargin(market);
            if (availMargin < requiredAmount) {
                return { success: false, message: '信用建玉余力が不足しています' };
            }
        }

        // 現物売りの保有チェック
        if (side === 'cash_sell') {
            const holding = this.positions.find(p => p.symbol === symbol && p.side === 'cash_buy');
            const lockedQty = this.getPendingOrderQty(symbol, 'cash_sell');

            if (!holding || (holding.qty - lockedQty) < qty) {
                return { success: false, message: '売却可能な保有株が不足しています' };
            }
        }

        // 信用返済の保有チェック（発注済みの返済注文分を差し引く）
        if (side === 'margin_close_buy') { // 売り建玉を返済買い
            const holding = this.positions.find(p => p.symbol === symbol && p.side === 'margin_sell');
            const lockedQty = this.getPendingOrderQty(symbol, 'margin_close_buy');
            if (!holding || (holding.qty - lockedQty) < qty) {
                return { success: false, message: '返済可能な売り建玉が不足しています' };
            }
        }

        if (side === 'margin_close_sell') { // 買い建玉を返済売り
            const holding = this.positions.find(p => p.symbol === symbol && p.side === 'margin_buy');
            const lockedQty = this.getPendingOrderQty(symbol, 'margin_close_sell');
            if (!holding || (holding.qty - lockedQty) < qty) {
                return { success: false, message: '返済可能な買い建玉が不足しています' };
            }
        }

        // 成行注文の場合：即時約定
        if (orderType === 'market') {
            if (!this.canFill(stock, side)) {
                const reason = currentPrice >= stock.highLimit ? 'ストップ高で売り手がいない' : 'ストップ安で買い手がいない';
                return { success: false, message: `${reason}ため約定しません` };
            }
            return this.executeTrade(market, {
                symbol,
                side,
                qty,
                price: currentPrice
            });
        }

        // 指値 or 逆指値注文の場合：オーダーリストに登録
        const newOrder = {
            id: this.nextId('ord'),
            symbol,
            name: stock.name,
            side,
            orderType, // 'limit' or 'stop'
            price: targetPrice,
            qty,
            time: market.formatTime(market.marketTime)
        };
        this.orders.push(newOrder);

        if (window.soundManager) window.soundManager.playOrder();

        const typeLabel = orderType === 'stop' ? '逆指値(損切)' : '指値';
        return { success: true, message: `${typeLabel}注文を発注しました (${targetPrice}円 / ${qty}株)` };
    }

    // 毎ティックの指値・逆指値約定チェック
    checkLimitOrders(market) {
        const remainingOrders = [];
        const executedOrders = [];

        this.orders.forEach(order => {
            const stock = market.getStock(order.symbol);
            if (!stock) return;

            let isExecuted = false;

            if (order.orderType === 'stop') {
                // 逆指値（ストップロス注文）
                // 買い逆指値：指定価格以上に上昇したら約定
                if (order.side.includes('buy') && stock.currentPrice >= order.price) {
                    isExecuted = true;
                }
                // 売り逆指値：指定価格以下に下落したら約定
                else if (order.side.includes('sell') && stock.currentPrice <= order.price) {
                    isExecuted = true;
                }
            } else {
                // 通常指値
                // 買い指値：指定価格以下になったら約定
                if (order.side.includes('buy') && stock.currentPrice <= order.price) {
                    isExecuted = true;
                }
                // 売り指値：指定価格以上になったら約定
                else if (order.side.includes('sell') && stock.currentPrice >= order.price) {
                    isExecuted = true;
                }
            }

            // 条件を満たしても、ストップ高・安で相手がいなければ約定せず待機
            if (isExecuted && !this.canFill(stock, order.side)) {
                isExecuted = false;
            }

            if (isExecuted) {
                const res = this.executeTrade(market, {
                    symbol: order.symbol,
                    side: order.side,
                    qty: order.qty,
                    price: stock.currentPrice // 成行として現在値で約定
                });
                if (res.success) {
                    executedOrders.push({ ...order, execPrice: stock.currentPrice });
                } else {
                    remainingOrders.push(order);
                }
            } else {
                remainingOrders.push(order);
            }
        });

        this.orders = remainingOrders;
        return executedOrders;
    }

    // 未約定注文をすべて失効させる（当日限り注文の扱い。翌営業日へ進む際に呼び出す）
    expireAllOrders() {
        const count = this.orders.length;
        this.orders = [];
        return count;
    }

    // 注文の取消
    cancelOrder(orderId) {
        const idx = this.orders.findIndex(o => o.id === orderId);
        if (idx !== -1) {
            this.orders.splice(idx, 1);
            if (window.soundManager) window.soundManager.playCancel();
            return { success: true, message: '注文を取り消しました' };
        }
        return { success: false, message: '対象の注文が見つかりません' };
    }

    // 実際の取引約定・ポジション反映（手数料・税金を含む）
    executeTrade(market, { symbol, side, qty, price }) {
        const stock = market.getStock(symbol);
        const timeStr = market.formatTime(market.marketTime);
        const amount = price * qty;
        const fee = this.calcFee(amount);
        const isClose = side === 'cash_sell' || side === 'margin_close_sell' || side === 'margin_close_buy';
        let realizedPnL = 0;
        let tax = 0;

        // 1. 現物買い
        if (side === 'cash_buy') {
            // 逆指値買いなどで発注時より高値で約定する場合に備え、約定時点の残高も確認
            if (this.cash < amount + fee) {
                return { success: false, message: '現金残高が不足しているため約定できません' };
            }
            this.cash -= amount + fee;
            this.addPosition(stock, 'cash_buy', qty, price, timeStr, fee);
        }

        // 2. 信用新規買い・信用新規売り（空売り）
        else if (side === 'margin_buy' || side === 'margin_sell') {
            this.cash -= fee;
            this.addPosition(stock, side, qty, price, timeStr, fee);
        }

        // 3. 決済（現物売り・信用返済売り・信用返済買い）
        else if (isClose) {
            const posSide = { cash_sell: 'cash_buy', margin_close_sell: 'margin_buy', margin_close_buy: 'margin_sell' }[side];
            const posIdx = this.positions.findIndex(p => p.symbol === symbol && p.side === posSide);
            if (posIdx === -1) return { success: false, message: '決済対象のポジションがありません' };
            const pos = this.positions[posIdx];
            if (pos.qty < qty) return { success: false, message: '保有数量を超えて決済できません' };

            // 売り建玉は「高く売って安く買い戻せばプラス」
            const grossPnL = posSide === 'margin_sell'
                ? (pos.avgPrice - price) * qty
                : (price - pos.avgPrice) * qty;
            // 新規時に支払った手数料のうち、今回決済する株数分を損益に按分
            const openFee = Math.round((pos.openFee || 0) * qty / pos.qty);
            realizedPnL = grossPnL - fee - openFee;

            if (side === 'cash_sell') {
                this.cash += amount - fee;      // 売却代金を受け取る
            } else {
                this.cash += grossPnL - fee;    // 信用は差金決済
            }
            this.totalRealizedPnL += realizedPnL;

            // 損益ゼロは勝ち負けどちらにも数えない
            if (realizedPnL > 0) {
                this.winTrades++;
                this.totalGain += realizedPnL;
                if (posSide === 'margin_sell') {
                    this.shortProfit += realizedPnL;
                    this.unlockedTrophies.add('short_success');
                }
            } else if (realizedPnL < 0) {
                this.lossTrades++;
                this.totalLoss += Math.abs(realizedPnL);
            }

            pos.openFee = (pos.openFee || 0) - openFee;
            pos.qty -= qty;
            if (pos.qty <= 0) {
                this.positions.splice(posIdx, 1);
            }

            tax = this.settleTax();
        }

        else {
            return { success: false, message: '不明な注文区分です' };
        }

        this.totalFees += fee;

        // 実績チェック
        if (realizedPnL > 0) {
            this.unlockedTrophies.add('first_win');
            if (realizedPnL > this.maxSingleGain) {
                this.maxSingleGain = realizedPnL;
            }
            if (realizedPnL >= 1000000) {
                this.unlockedTrophies.add('big_hit');
            }
        }

        // 取引履歴に記録（チャートプロット用に秒数・時刻も格納）
        this.history.unshift({
            id: this.nextId('trd'),
            time: timeStr,
            marketTime: timeStr,
            marketSeconds: market.marketTime.getTime(), // Dateは毎ティック書き換わるため値で保持
            symbol,
            name: stock.name,
            side,
            qty,
            price,
            fee,
            tax,
            realizedPnL: isClose ? realizedPnL : null
        });

        if (this.history.length > 80) this.history.pop();

        if (window.soundManager) {
            if (isClose && realizedPnL < 0) {
                window.soundManager.playAlert();
            } else {
                window.soundManager.playExecution();
            }
        }

        let message = `約定しました: ${stock.name} ${qty}株 @ ${price}円（手数料 ${fee.toLocaleString()}円`;
        if (tax > 0) message += ` / 税金 ${tax.toLocaleString()}円`;
        else if (tax < 0) message += ` / 税金還付 ${Math.abs(tax).toLocaleString()}円`;
        message += '）';

        return {
            success: true,
            message,
            pnl: realizedPnL,
            fee,
            tax
        };
    }
    // 保有ポジションのワンクリック返済・売却（force: 強制ロスカット時は時間外でも執行）
    closePosition(posId, market, { force = false } = {}) {
        if (!force && !this.isMarketOpen(market)) {
            return { success: false, message: '取引時間外のため決済できません' };
        }
        const pos = this.positions.find(p => p.id === posId);
        if (!pos) return { success: false, message: 'ポジションが見つかりません' };

        const stock = market.getStock(pos.symbol);
        if (!stock) return { success: false, message: '銘柄が見つかりません' };

        let closeSide;
        if (pos.side === 'cash_buy') closeSide = 'cash_sell';
        else if (pos.side === 'margin_buy') closeSide = 'margin_close_sell';
        else if (pos.side === 'margin_sell') closeSide = 'margin_close_buy';

        if (!force && !this.canFill(stock, closeSide)) {
            const reason = stock.currentPrice >= stock.highLimit ? 'ストップ高で売り手がいない' : 'ストップ安で買い手がいない';
            return { success: false, message: `${reason}ため決済できません` };
        }

        return this.executeTrade(market, {
            symbol: pos.symbol,
            side: closeSide,
            qty: pos.qty,
            price: stock.currentPrice
        });
    }

    // 全ポジション一括返済・売却
    closeAllPositions(market) {
        const results = [];
        const copyPositions = [...this.positions];
        copyPositions.forEach(p => {
            const res = this.closePosition(p.id, market);
            results.push(res);
        });
        return results;
    }

    // 信用取引の保証金維持率（%）を計算
    getMarginMaintenanceRatio(market) {
        let totalMarginValue = 0;
        let marginPnL = 0;

        this.positions.forEach(pos => {
            if (pos.side === 'margin_buy' || pos.side === 'margin_sell') {
                const stock = market.getStock(pos.symbol);
                const curPrice = stock ? stock.currentPrice : pos.avgPrice;
                const posCost = pos.avgPrice * pos.qty;
                totalMarginValue += posCost;

                if (pos.side === 'margin_buy') {
                    marginPnL += (curPrice - pos.avgPrice) * pos.qty;
                } else {
                    marginPnL += (pos.avgPrice - curPrice) * pos.qty;
                }
            }
        });

        if (totalMarginValue === 0) {
            return null; // 信用建玉なし
        }

        // 実質委託保証金 = 現金 + 現物時価 + 信用評価損益
        const effectiveMargin = this.cash + this.getTotalStockValue(market) + marginPnL;
        const ratio = (effectiveMargin / totalMarginValue) * 100;

        return {
            ratio: Math.max(-999, ratio),
            totalMarginValue,
            effectiveMargin,
            marginPnL,
            isWarning: ratio <= 30 && ratio > 20,
            isMarginCall: ratio <= 20
        };
    }

    // 追証チェック＆強制ロスカット執行
    checkMarginCall(market) {
        const marginInfo = this.getMarginMaintenanceRatio(market);
        if (!marginInfo) return null;

        if (marginInfo.isMarginCall) {
            // 🚨 追証発生！全信用ポジションを即座に成行強制決済
            const closedPositions = [];
            const marginPosList = this.positions.filter(p => p.side === 'margin_buy' || p.side === 'margin_sell');

            marginPosList.forEach(pos => {
                const res = this.closePosition(pos.id, market, { force: true });
                if (res.success) {
                    closedPositions.push({ name: pos.name, qty: pos.qty, pnl: res.pnl });
                }
            });

            if (closedPositions.length > 0) {
                if (window.soundManager) window.soundManager.playAlert();
                return {
                    triggered: true,
                    ratio: marginInfo.ratio.toFixed(1),
                    count: closedPositions.length,
                    message: `【🚨 追証発覚・強制ロスカット】保証金維持率が ${marginInfo.ratio.toFixed(1)}% に急低下（20%割れ）したため、すべての信用建玉（${closedPositions.length}件）が市場価格で強制成行決済されました！`
                };
            }
        }
        return null;
    }

    // トレーダーランク・称号システムの判定
    getTraderRank(market) {
        const totalAsset = this.getTotalAsset(market);
        const totalTrades = this.winTrades + this.lossTrades;
        const winRate = totalTrades > 0 ? (this.winTrades / totalTrades) * 100 : 0;

        // 不死鳥トロフィー判定
        if (this.maxDrawdownPct >= 20) this.hadDeepDrawdown = true;
        if (this.hadDeepDrawdown && totalAsset >= this.peakAsset && this.peakAsset > this.initialCash) {
            this.unlockedTrophies.add('comeback');
        }
        // スナイパートロフィー判定
        if (totalTrades >= 10 && winRate >= 70) {
            this.unlockedTrophies.add('high_winrate');
        }

        // 称号ランク階層（上から順に判定）
        const ranks = [
            {
                id: 'whale',
                title: '市場の支配者・機関投資家',
                badge: '🏦 機関投資家',
                icon: '🏦',
                color: '#e11d48',
                desc: '総資産3億円突破。相場を動かす伝説の巨鯨。',
                achieved: totalAsset >= 300000000
            },
            {
                id: 'billion',
                title: '億り人 (億円トレーダー)',
                badge: '👑 億り人',
                icon: '👑',
                color: '#f59e0b',
                desc: '総資産1億円突破。個人投資家の夢を達成。',
                achieved: totalAsset >= 100000000
            },
            {
                id: 'short_king',
                title: '空売りの支配者・ベアマスター',
                badge: '👹 空売りの鬼',
                icon: '👹',
                color: '#8b5cf6',
                desc: '空売り利確累計+200万円以上。下げ相場でも暴利を貪る。',
                achieved: this.shortProfit >= 2000000
            },
            {
                id: 'master',
                title: '百戦錬磨の相場師',
                badge: '🦈 凄腕相場師',
                icon: '🦈',
                color: '#06b6d4',
                desc: '総資産2,500万円突破 ＆ 実現利益+800万円。',
                achieved: totalAsset >= 25000000 && this.totalRealizedPnL >= 8000000
            },
            {
                id: 'surfer',
                title: '波乗りデイトレーダー',
                badge: '🏄 デイトレーダー',
                icon: '🏄',
                color: '#10b981',
                desc: '総資産1,500万円突破。トレンドを捉える鋭い嗅覚。',
                achieved: totalAsset >= 15000000
            },
            {
                id: 'scalper',
                title: '超速スキャルパー',
                badge: '⚡ 敏腕スキャルパー',
                icon: '⚡',
                color: '#3b82f6',
                desc: '取引15回以上 ＆ 勝率60%以上。',
                achieved: totalTrades >= 15 && winRate >= 60
            },
            {
                id: 'novice',
                title: '見習い個人投資家',
                badge: '🔰 見習い個人',
                icon: '🔰',
                color: '#94a3b8',
                desc: '株式投資の世界に足を踏み入れたルーキー。元本1,000万スタート。',
                achieved: true
            }
        ];

        // 現在の最高位ランク
        const currentRank = ranks.find(r => r.achieved) || ranks[ranks.length - 1];

        // 実績トロフィー一覧
        const trophies = [
            { id: 'first_win', name: 'ファーストブラッド', desc: '初めて取引で利確（プラス決済）を達成した', icon: '🎯', unlocked: this.unlockedTrophies.has('first_win') },
            { id: 'short_success', name: '死神の鎌', desc: '空売り（信用売り）で利確を達成した', icon: '📉', unlocked: this.unlockedTrophies.has('short_success') },
            { id: 'big_hit', name: '一撃ミリオン', desc: '1回の決済で利益100万円以上を叩き出した', icon: '💰', unlocked: this.unlockedTrophies.has('big_hit') },
            { id: 'high_winrate', name: '必中スナイパー', desc: '10回以上取引して勝率70%以上を維持した', icon: '🏅', unlocked: this.unlockedTrophies.has('high_winrate') },
            { id: 'comeback', name: '不死鳥（フェニックス）', desc: '資産20%以上の大暴落ドローダウンから生還し、最高資産を更新した', icon: '🦅', unlocked: this.unlockedTrophies.has('comeback') }
        ];

        return {
            currentRank,
            allRanks: ranks,
            trophies,
            unlockedCount: trophies.filter(t => t.unlocked).length
        };
    }
}

window.PortfolioManager = PortfolioManager;
