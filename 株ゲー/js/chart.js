/**
 * Chart Component - 高機能HTML5 Canvas ローソク足チャート
 * 陽線・陰線、ヒゲ、出来高バー、SMA5/SMA20移動平均線、現在値ライン、建玉ライン、十字線
 * 高DPI（Retina）完全対応、ダーク/ライトモード切り替え対応
 */

class StockChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.currentCandle = null;
        this.stock = null;
        this.positions = []; // プレイヤーの建玉ライン表示用
        this.orders = [];    // プレイヤーの指値ライン表示用
        this.tradeHistory = []; // プレイヤーの売買約定履歴表示用

        this.theme = 'dark'; // 'dark' | 'light'
        this.showSMA = true;
        this.showBB = false;
        this.showTrades = true; // 売買履歴プロット表示
        this.mousePos = null;
        this.isHovering = false;

        this.padding = { top: 28, right: 70, bottom: 26, left: 12 };
        this.volumeHeightRatio = 0.22; // 下部22%が出来高

        this.dpr = window.devicePixelRatio || 1;
        this.cssWidth = 600;
        this.cssHeight = 400;

        this.initEvents();
        this.resize();
    }

    setTheme(theme) {
        this.theme = theme;
        this.render();
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        if (window.ResizeObserver && this.canvas.parentElement) {
            new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
        }

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.isHovering = true;
            this.render();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.render();
        });
    }

    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        this.dpr = window.devicePixelRatio || 1;
        this.cssWidth = Math.floor(rect.width);
        this.cssHeight = Math.floor(rect.height);

        // 高DPI対応: キャンバス内部解像度を拡大し、CSSサイズを指定
        this.canvas.width = Math.floor(rect.width * this.dpr);
        this.canvas.height = Math.floor(rect.height * this.dpr);
        this.canvas.style.width = this.cssWidth + 'px';
        this.canvas.style.height = this.cssHeight + 'px';

        this.render();
    }

    setData(candles, currentCandle, stock, positions = [], orders = [], tradeHistory = []) {
        this.data = candles || [];
        this.currentCandle = currentCandle;
        this.stock = stock;
        this.positions = positions;
        this.orders = orders;
        this.tradeHistory = tradeHistory;
        this.render();
    }

    toggleSMA() {
        this.showSMA = !this.showSMA;
        this.render();
        return this.showSMA;
    }

    toggleBB() {
        this.showBB = !this.showBB;
        this.render();
        return this.showBB;
    }

    toggleTrades() {
        this.showTrades = !this.showTrades;
        this.render();
        return this.showTrades;
    }

    // ボリンジャーバンド (20, ±2σ)
    calculateBollingerBands(candles, period = 20, multiplier = 2) {
        const bands = [];
        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) {
                bands.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += candles[i - j].close;
                }
                const mean = sum / period;

                let varianceSum = 0;
                for (let j = 0; j < period; j++) {
                    varianceSum += Math.pow(candles[i - j].close - mean, 2);
                }
                const stdDev = Math.sqrt(varianceSum / period);

                bands.push({
                    upper: mean + multiplier * stdDev,
                    middle: mean,
                    lower: mean - multiplier * stdDev
                });
            }
        }
        return bands;
    }

    // 単純移動平均線（SMA）の計算
    calculateSMA(candles, period) {
        const sma = [];
        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < period; j++) {
                    sum += candles[i - j].close;
                }
                sma.push(sum / period);
            }
        }
        return sma;
    }

    render() {
        if (!this.canvas || !this.stock) return;
        const ctx = this.ctx;
        const dpr = this.dpr;
        const width = this.cssWidth;
        const height = this.cssHeight;

        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.scale(dpr, dpr);

        // テーマ配色
        const isDark = this.theme === 'dark';
        const colors = {
            grid: isDark ? '#1f293d' : '#e2e8f0',
            gridText: isDark ? '#94a3b8' : '#475569',
            candleUp: isDark ? '#f87171' : '#dc2626',
            candleDown: isDark ? '#60a5fa' : '#2563eb',
            volUp: isDark ? 'rgba(248, 113, 113, 0.45)' : 'rgba(220, 38, 38, 0.4)',
            volDown: isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(37, 99, 235, 0.4)',
            sma5: '#eab308',
            sma20: isDark ? '#c084fc' : '#9333ea',
            bbBand: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(147, 51, 234, 0.06)',
            bbLine: isDark ? 'rgba(192, 132, 252, 0.55)' : 'rgba(147, 51, 234, 0.5)',
            crosshair: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.4)',
            badgeBg: isDark ? '#334155' : '#e2e8f0',
            badgeText: isDark ? '#ffffff' : '#0f172a',
            tooltipBg: isDark ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            tooltipBorder: isDark ? '#374151' : '#cbd5e1',
            tooltipText: isDark ? '#e2e8f0' : '#1e293b',
            legendText: isDark ? '#94a3b8' : '#64748b'
        };

        // 表示する全キャンドル（確定足＋現在進行中の足）
        const allCandles = [...this.data];
        if (this.currentCandle) {
            allCandles.push(this.currentCandle);
        }

        if (allCandles.length === 0) {
            ctx.restore();
            return;
        }

        // 表示本数（38〜42本で視認性高め）
        const maxDisplayCandles = 40;
        const displayCandles = allCandles.slice(-maxDisplayCandles);

        // 価格の最小・最大を算出
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVol = 0;

        displayCandles.forEach(c => {
            minPrice = Math.min(minPrice, c.low);
            maxPrice = Math.max(maxPrice, c.high);
            maxVol = Math.max(maxVol, c.volume);
        });

        // 余裕を持たせる（マージン）
        const priceMargin = (maxPrice - minPrice) * 0.1 || (minPrice * 0.02);
        minPrice -= priceMargin;
        maxPrice += priceMargin;
        maxVol = Math.max(maxVol, 100);

        const chartWidth = width - this.padding.left - this.padding.right;
        const totalHeight = height - this.padding.top - this.padding.bottom;
        const volAreaHeight = totalHeight * this.volumeHeightRatio;
        const priceAreaHeight = totalHeight - volAreaHeight - 15;

        // Y座標変換
        const getY = (price) => {
            return this.padding.top + priceAreaHeight - ((price - minPrice) / (maxPrice - minPrice)) * priceAreaHeight;
        };

        const getVolY = (vol) => {
            const bottom = height - this.padding.bottom;
            return bottom - (vol / maxVol) * volAreaHeight;
        };

        // 背景グリッド描画
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;

        // 水平グリッド線 & 価格ラベル
        const gridLines = 5;
        ctx.fillStyle = colors.gridText;
        ctx.font = '600 11px "Consolas", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= gridLines; i++) {
            const price = minPrice + (maxPrice - minPrice) * (i / gridLines);
            const y = getY(price);

            ctx.beginPath();
            ctx.moveTo(this.padding.left, y);
            ctx.lineTo(width - this.padding.right, y);
            ctx.stroke();

            ctx.fillText(price.toFixed(0), width - this.padding.right + 8, y);
        }

        // キャンドル描画の幅
        const candleCount = displayCandles.length;
        const slotWidth = chartWidth / maxDisplayCandles;
        const candleWidth = Math.max(4, slotWidth * 0.72);

        // 移動平均線の計算
        const sma5 = this.calculateSMA(allCandles, 5).slice(-maxDisplayCandles);
        const sma20 = this.calculateSMA(allCandles, 20).slice(-maxDisplayCandles);

        // 出来高バーの描画
        displayCandles.forEach((c, idx) => {
            const x = this.padding.left + idx * slotWidth + slotWidth / 2;
            const volY = getVolY(c.volume);
            const volH = (height - this.padding.bottom) - volY;
            const isUp = c.close >= c.open;

            ctx.fillStyle = isUp ? colors.volUp : colors.volDown;
            ctx.fillRect(x - candleWidth / 2, volY, candleWidth, volH);
        });

        // ボリンジャーバンドの描画 (±2σ)
        if (this.showBB) {
            const bbData = this.calculateBollingerBands(allCandles, 20, 2).slice(-maxDisplayCandles);
            const upperPoints = [];
            const lowerPoints = [];

            bbData.forEach((b, idx) => {
                if (b !== null) {
                    const x = this.padding.left + idx * slotWidth + slotWidth / 2;
                    upperPoints.push({ x, y: getY(b.upper) });
                    lowerPoints.push({ x, y: getY(b.lower) });
                }
            });

            if (upperPoints.length > 0) {
                // 帯（リボン）の塗りつぶし
                ctx.fillStyle = colors.bbBand;
                ctx.beginPath();
                ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
                upperPoints.forEach(p => ctx.lineTo(p.x, p.y));
                for (let i = lowerPoints.length - 1; i >= 0; i--) {
                    ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
                }
                ctx.closePath();
                ctx.fill();

                // 上下バンドライン
                const drawBBLine = (points) => {
                    ctx.strokeStyle = colors.bbLine;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 2]);
                    ctx.beginPath();
                    points.forEach((p, i) => {
                        if (i === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    });
                    ctx.stroke();
                    ctx.setLineDash([]);
                };

                drawBBLine(upperPoints);
                drawBBLine(lowerPoints);
            }
        }

        // 移動平均線を描画 (SMA 20: 紫, SMA 5: 黄色)
        if (this.showSMA) {
            const drawLine = (dataPoints, color) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                let started = false;

                dataPoints.forEach((val, idx) => {
                    if (val !== null) {
                        const x = this.padding.left + idx * slotWidth + slotWidth / 2;
                        const y = getY(val);
                        if (!started) {
                            ctx.moveTo(x, y);
                            started = true;
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                });
                ctx.stroke();
            };

            drawLine(sma20, colors.sma20);
            drawLine(sma5, colors.sma5);
        }

        // ローソク足の描画（日本式：陽線＝赤、陰線＝青）
        displayCandles.forEach((c, idx) => {
            const x = this.padding.left + idx * slotWidth + slotWidth / 2;
            const isUp = c.close >= c.open;
            const bodyColor = isUp ? colors.candleUp : colors.candleDown;

            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);

            // ヒゲ（高値・安値）
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // 実体（始値・終値）
            const top = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            ctx.fillStyle = bodyColor;
            ctx.fillRect(x - candleWidth / 2, top, candleWidth, bodyHeight);
        });

        // 現在値の水平ライン＆バッジ
        const currentY = getY(this.stock.currentPrice);
        const isUpOverall = this.stock.currentPrice >= this.stock.basePrice;
        const priceColor = isUpOverall ? colors.candleUp : colors.candleDown;

        ctx.strokeStyle = priceColor;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(this.padding.left, currentY);
        ctx.lineTo(width - this.padding.right, currentY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 現在値バッジ（右軸）
        ctx.fillStyle = priceColor;
        const badgeW = 64;
        const badgeH = 20;
        ctx.fillRect(width - this.padding.right + 2, currentY - badgeH / 2, badgeW, badgeH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Consolas", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.stock.currentPrice.toFixed(0), width - this.padding.right + 6, currentY);

        // プレイヤーの建玉ライン（ポジションがあれば表示）
        this.positions.forEach(pos => {
            if (pos.symbol === this.stock.symbol) {
                const isBuy = pos.side && pos.side.includes('buy');
                const lineColor = isBuy ? '#10b981' : '#f97316';
                const posY = getY(pos.avgPrice);
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 1.8;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.moveTo(this.padding.left, posY);
                ctx.lineTo(width - this.padding.right, posY);
                ctx.stroke();
                ctx.setLineDash([]);

                // ラベル
                ctx.fillStyle = lineColor;
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`建玉(${isBuy ? '買' : '売'}): ${pos.avgPrice.toFixed(0)} (${pos.qty}株)`, this.padding.left + 5, posY - 5);
            }
        });

        // 未約定の指値注文ライン
        this.orders.forEach(order => {
            if (order.symbol === this.stock.symbol) {
                const ordY = getY(order.price);
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([6, 3]);
                ctx.beginPath();
                ctx.moveTo(this.padding.left, ordY);
                ctx.lineTo(width - this.padding.right, ordY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`指値: ${order.price} (${order.qty}株)`, this.padding.left + 5, ordY - 5);
            }
        });

        // プレイヤーの約定売買履歴プロット (エントリー▲▼ / 決済●)
        if (this.showTrades && this.tradeHistory && this.tradeHistory.length > 0) {
            const currentStockTrades = this.tradeHistory.filter(t => t.symbol === this.stock.symbol);
            
            currentStockTrades.forEach(trd => {
                // 約定時刻を含むローソク足（開始時刻 ≦ 約定時刻 となる最後の足）を検索
                let bestIdx = -1;
                for (let i = displayCandles.length - 1; i >= 0; i--) {
                    if (displayCandles[i].timestamp <= trd.marketSeconds) {
                        bestIdx = i;
                        break;
                    }
                }

                // 表示範囲より前の約定は描画しない
                if (bestIdx === -1) return;
                const candle = displayCandles[bestIdx];
                const markerX = this.padding.left + bestIdx * slotWidth + slotWidth / 2;
                
                const isBuy = trd.side && trd.side.includes('buy');
                const isClose = trd.side && (trd.side.includes('close') || trd.side === 'cash_sell');

                if (isClose) {
                    // 決済ポイント：約定価格の高さにサークル
                    const markerY = getY(trd.price);
                    const isWin = trd.realizedPnL !== null ? trd.realizedPnL >= 0 : true;
                    const markerColor = isWin ? '#ef4444' : '#3b82f6';

                    ctx.fillStyle = markerColor;
                    ctx.beginPath();
                    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // 小型テキスト
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 8px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(isWin ? '+' : '-', markerX, markerY);
                } else if (isBuy) {
                    // 買いエントリー：安値の直下に上向き三角 ▲
                    const markerY = getY(candle ? candle.low : trd.price) + 12;
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.moveTo(markerX, markerY - 6);
                    ctx.lineTo(markerX + 5, markerY + 4);
                    ctx.lineTo(markerX - 5, markerY + 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    // 空売りエントリー：高値の直上に下向き三角 ▼
                    const markerY = getY(candle ? candle.high : trd.price) - 12;
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.moveTo(markerX, markerY + 6);
                    ctx.lineTo(markerX + 5, markerY - 4);
                    ctx.lineTo(markerX - 5, markerY - 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }

        // 十字線（クロスヘア）とツールチップ
        if (this.isHovering && this.mousePos) {
            const mx = this.mousePos.x;
            const my = this.mousePos.y;

            if (mx >= this.padding.left && mx <= width - this.padding.right &&
                my >= this.padding.top && my <= height - this.padding.bottom) {

                ctx.strokeStyle = colors.crosshair;
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);

                // 垂直線
                ctx.beginPath();
                ctx.moveTo(mx, this.padding.top);
                ctx.lineTo(mx, height - this.padding.bottom);
                ctx.stroke();

                // 水平線
                ctx.beginPath();
                ctx.moveTo(this.padding.left, my);
                ctx.lineTo(width - this.padding.right, my);
                ctx.stroke();
                ctx.setLineDash([]);

                // マウス位置の価格
                const hoverPrice = maxPrice - ((my - this.padding.top) / priceAreaHeight) * (maxPrice - minPrice);
                ctx.fillStyle = colors.badgeBg;
                ctx.fillRect(width - this.padding.right + 2, my - 10, 64, 20);
                ctx.fillStyle = colors.badgeText;
                ctx.font = 'bold 11px "Consolas", monospace';
                ctx.fillText(hoverPrice.toFixed(0), width - this.padding.right + 6, my);

                // 最寄りのキャンドル情報を特定
                const slotIdx = Math.floor((mx - this.padding.left) / slotWidth);
                if (slotIdx >= 0 && slotIdx < displayCandles.length) {
                    const c = displayCandles[slotIdx];
                    this.drawTooltip(ctx, c, colors);
                }
            }
        }

        // 左上の銘柄情報・インジケーター凡例
        this.drawHeaderInfo(ctx, colors);

        ctx.restore();
    }

    drawHeaderInfo(ctx, colors) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        let offset = this.padding.left + 8;

        if (this.showSMA) {
            ctx.fillStyle = colors.sma5;
            ctx.fillText('● SMA(5)', offset, 8);
            offset += 65;

            ctx.fillStyle = colors.sma20;
            ctx.fillText('● SMA(20)', offset, 8);
            offset += 75;
        }

        if (this.showBB) {
            ctx.fillStyle = colors.bbLine;
            ctx.fillText('● BB(±2σ)', offset, 8);
            offset += 75;
        }

        if (this.showTrades) {
            ctx.fillStyle = '#10b981';
            ctx.fillText('▲買', offset, 8);
            offset += 28;
            ctx.fillStyle = '#f97316';
            ctx.fillText('▼売', offset, 8);
            offset += 28;
            ctx.fillStyle = '#ef4444';
            ctx.fillText('●決済', offset, 8);
            offset += 48;
        }

        ctx.fillStyle = colors.legendText;
        ctx.fillText('出来高 (Vol)', offset, 8);
    }

    drawTooltip(ctx, candle, colors) {
        const diff = candle.close - candle.open;
        const diffPct = ((diff / candle.open) * 100).toFixed(2);
        const color = diff >= 0 ? colors.candleUp : colors.candleDown;

        ctx.fillStyle = colors.tooltipBg;
        ctx.strokeStyle = colors.tooltipBorder;
        ctx.lineWidth = 1;
        const tw = 300;
        const th = 24;
        ctx.fillRect(this.padding.left + 240, 5, tw, th);
        ctx.strokeRect(this.padding.left + 240, 5, tw, th);

        ctx.font = '11.5px "Consolas", monospace';
        ctx.fillStyle = colors.tooltipText;
        ctx.fillText(`O:${candle.open} H:${candle.high} L:${candle.low} C:`, this.padding.left + 246, 10);
        ctx.fillStyle = color;
        ctx.fillText(`${candle.close} (${diff >= 0 ? '+' : ''}${diffPct}%)`, this.padding.left + 406, 10);
    }
}

window.StockChart = StockChart;
