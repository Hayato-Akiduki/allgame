/**
 * Main Application Controller
 * ゲームループ、UI同期、ユーザー入力ハンドリング
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 各エンジンの初期化
    const market = new MarketEngine(window.INITIAL_STOCKS);
    const portfolio = new PortfolioManager(10000000); // 1000万円スタート
    const chart = new StockChart('mainChartCanvas');

    // 1.5 セーブデータの読み込み（あれば前回の続きから再開）
    const SAVE_KEY = 'kabu_save_v1';
    let savedGame = null;
    try {
        savedGame = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (savedGame && savedGame.version === 1) {
            market.restore(savedGame.market);
            portfolio.restore(savedGame.portfolio);
        } else {
            savedGame = null;
        }
    } catch (e) {
        // 壊れたセーブデータは破棄して新規ゲームで始め直す
        console.warn('セーブデータを読み込めませんでした:', e);
        try { localStorage.removeItem(SAVE_KEY); } catch (e2) { /* 保存不可の環境 */ }
        location.reload();
        return;
    }

    let selectedSymbol = (savedGame && market.getStock(savedGame.selectedSymbol))
        ? savedGame.selectedSymbol
        : market.stocks[0].symbol;
    let gameSpeed = 1; // 1: 通常 (1000ms), 2: 2倍 (500ms), 5: 5倍 (200ms), 0: 一時停止
    let gameTimerId = null;

    // 2. 板情報コンポーネントの初期化
    const orderBook = new OrderBookComponent('orderBookEl', 'timeSalesEl', (price) => {
        // 板をクリックした時：指値価格に自動設定し、指値モードをONにする
        document.getElementById('inputOrderPrice').value = price;
        setOrderType('limit');
        updateCalcTotal();
        showToast('info', '指値価格を設定', `${price.toLocaleString()}円 を指値に入力しました`);
    });

    // 3. ニュースマネージャーの初期化
    let board = null;
    const news = new NewsManager(market, (newsItem) => {
        // ニュースティッカー更新
        const ticker = document.getElementById('tickerText');
        ticker.textContent = `${newsItem.headline} (${newsItem.badge})`;
        ticker.onclick = () => {
            selectStock(newsItem.symbol);
        };

        // 掲示板にもニュース実況を反映
        if (board) {
            board.onNews(newsItem);
        }

        // トースト通知
        showToast('news', newsItem.badge, newsItem.headline);
    });
    if (savedGame && Array.isArray(savedGame.newsHistory)) {
        news.newsHistory = savedGame.newsHistory;
    }

    // ゲーム進行の保存（ブラウザの localStorage に保存。頻繁に呼ばれても1秒に1回まで）
    let lastSaveAt = 0;
    let saveDisabled = false;
    function saveGame(force = false) {
        if (saveDisabled) return;
        const now = Date.now();
        if (!force && now - lastSaveAt < 1000) return;
        lastSaveAt = now;
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                version: 1,
                savedAt: now,
                market: market.serialize(),
                portfolio: portfolio.serialize(),
                newsHistory: news.newsHistory,
                selectedSymbol
            }));
        } catch (e) {
            console.warn('ゲームを保存できませんでした:', e);
        }
    }
    window.addEventListener('beforeunload', () => saveGame(true));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') saveGame(true);
    });

    // 3.5 投資家掲示板マネージャーの初期化
    board = new BoardManager(
        market,
        (symbol) => selectStock(symbol),
        (type, title, msg) => showToast(type, title, msg)
    );

    // 4. 発注フォーム状態
    let orderAccount = 'cash'; // 'cash' | 'margin'
    let orderMode = 'new';     // 'new' | 'close'
    let orderSide = 'buy';     // 'buy' | 'sell'
    let orderType = 'market';   // 'market' | 'limit'

    // --------------------------------------------------------------------------
    // UI更新関数群
    // --------------------------------------------------------------------------

    // 銘柄選択
    function selectStock(symbol) {
        selectedSymbol = symbol;
        const stock = market.getStock(symbol);

        // チャートヘッダー更新
        document.getElementById('chartStockTitle').textContent = `${stock.symbol} ${stock.name}`;
        document.getElementById('stockCategoryDesc').textContent = stock.category;
        document.getElementById('formStockSymbol').textContent = `${stock.symbol} ${stock.name}`;

        // 指値入力フォームの初期値も現在値に合わせる
        document.getElementById('inputOrderPrice').value = stock.currentPrice;
        updateCalcTotal();

        // ウォッチリストのアクティブ表示切替
        renderWatchlist();
        if (board) board.setSelectedStock(symbol);
        updateUI();
    }

    // スパークライン（ミニSVGチャート）生成関数
    function generateSparklineSVG(candles, curPrice, basePrice) {
        if (!candles || candles.length < 2) {
            return `<svg viewBox="0 0 65 22"><line x1="0" y1="11" x2="65" y2="11" stroke="var(--border-color)" stroke-width="1.5" stroke-dasharray="2,2"/></svg>`;
        }
        const recent = candles.slice(-16);
        const prices = recent.map(c => c.close);
        if (curPrice && prices[prices.length - 1] !== curPrice) {
            prices.push(curPrice);
        }

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = (max - min) || 1;
        const w = 65;
        const h = 22;
        const pad = 2;

        const points = prices.map((p, idx) => {
            const x = pad + (idx / (prices.length - 1)) * (w - pad * 2);
            const y = (h - pad) - ((p - min) / range) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const latest = curPrice || prices[prices.length - 1];
        const isUp = latest >= basePrice;
        const strokeColor = isUp ? 'var(--color-up)' : 'var(--color-down)';

        return `<svg viewBox="0 0 65 22">
            <polyline fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
        </svg>`;
    }

    // ウォッチリストのレンダリング
    function renderWatchlist() {
        const container = document.getElementById('watchlistContainer');

        const countEl = document.getElementById('stockCountText');
        if (countEl) countEl.textContent = `${market.stocks.length}銘柄`;

        market.stocks.forEach(stock => {
            const diff = stock.currentPrice - stock.basePrice;
            const diffPct = ((diff / stock.basePrice) * 100).toFixed(2);
            const isUp = diff >= 0;
            const colorClass = isUp ? 'text-up' : 'text-down';
            const sign = isUp ? '+' : '';
            const isActive = stock.symbol === selectedSymbol;

            let card = container.querySelector(`.stock-card[data-symbol="${stock.symbol}"]`);
            if (!card) {
                card = document.createElement('div');
                card.setAttribute('data-symbol', stock.symbol);
                card.innerHTML = `
                    <div class="stock-card-top">
                        <div class="stock-code-name">
                            <span class="stock-symbol">${stock.symbol}</span>
                            <span class="stock-name">${stock.name}</span>
                        </div>
                        <span class="stock-category-badge" style="background-color: ${stock.badgeColor}25; color: ${stock.badgeColor}; border: 1px solid ${stock.badgeColor}50;">
                            ${stock.category}
                        </span>
                    </div>
                    <div class="stock-card-bottom">
                        <span class="stock-price"></span>
                        <div class="stock-sparkline"></div>
                        <span class="stock-change badge-pnl"></span>
                    </div>
                `;
                card.addEventListener('click', () => selectStock(stock.symbol));
                container.appendChild(card);
            }

            card.className = `stock-card ${isActive ? 'active' : ''}`;
            const priceEl = card.querySelector('.stock-price');
            if (priceEl) {
                priceEl.className = `stock-price ${colorClass}`;
                priceEl.textContent = stock.currentPrice.toLocaleString();
            }
            const sparkEl = card.querySelector('.stock-sparkline');
            if (sparkEl) {
                const candles = market.candleData[stock.symbol];
                sparkEl.innerHTML = generateSparklineSVG(candles, stock.currentPrice, stock.basePrice);
            }
            const changeEl = card.querySelector('.stock-change');
            if (changeEl) {
                changeEl.className = `stock-change badge-pnl ${isUp ? 'up' : 'down'}`;
                changeEl.textContent = `${sign}${diff.toLocaleString()} (${sign}${diffPct}%)`;
            }
        });
    }

    // チャート＆板＆ステータスUIの更新
    function updateUI() {
        const stock = market.getStock(selectedSymbol);
        if (!stock) return;

        // 時計 & セッション
        document.getElementById('marketTimeDisplay').textContent = market.formatTime(market.marketTime);
        const session = market.getSession();
        const sessionTextEl = document.getElementById('marketSessionText');
        const nextDayBtn = document.getElementById('nextDayBtn');
        const dot = document.getElementById('marketDot');

        if (session.status === 'open') {
            sessionTextEl.textContent = session.name;
            sessionTextEl.style.color = 'var(--text-secondary)';
            dot.style.backgroundColor = 'var(--color-green)';
            dot.style.boxShadow = '0 0 8px var(--color-green)';
            if (nextDayBtn) nextDayBtn.style.display = 'none';
        } else if (session.status === 'lunch') {
            sessionTextEl.textContent = '昼休み 休場';
            sessionTextEl.style.color = 'var(--color-gold)';
            dot.style.backgroundColor = 'var(--color-gold)';
            dot.style.boxShadow = 'none';
        } else {
            sessionTextEl.textContent = session.name;
            sessionTextEl.style.color = '#ef4444';
            dot.style.backgroundColor = '#64748b';
            dot.style.boxShadow = 'none';
            if (nextDayBtn) nextDayBtn.style.display = 'inline-block';
        }

        // チャート上部ステータス
        const diff = stock.currentPrice - stock.basePrice;
        const diffPct = ((diff / stock.basePrice) * 100).toFixed(2);
        const isUp = diff >= 0;
        const diffEl = document.getElementById('chartDiffDisplay');
        diffEl.className = isUp ? 'text-up' : 'text-down';
        diffEl.textContent = `${isUp ? '+' : ''}${diff.toLocaleString()} (${isUp ? '+' : ''}${diffPct}%)`;

        document.getElementById('chartHighDisplay').textContent = stock.highPrice.toLocaleString();
        document.getElementById('chartLowDisplay').textContent = stock.lowPrice.toLocaleString();
        document.getElementById('chartVolDisplay').textContent = stock.volume.toLocaleString();

        // チャート描画（売買履歴プロット用データも渡す）
        const candles = market.candleData[stock.symbol];
        const curCandle = market.currentCandles[stock.symbol];
        chart.setData(candles, curCandle, stock, portfolio.positions, portfolio.orders, portfolio.history);

        // 板情報描画
        const bookData = market.orderBooks[stock.symbol];
        const trades = market.trades[stock.symbol];
        // 逆指値は条件を満たすまで板に出ないため、指値注文だけを「自」表示の対象にする
        orderBook.render(bookData, trades, portfolio.orders.filter(o => o.symbol === stock.symbol && o.orderType !== 'stop'));

        // 資産サマリー更新
        updateAssetSummary();

        // ポジション一覧・注文一覧の更新
        renderPositions();
        renderOrders();
        renderHistory();

        // 画面更新のたびに進行を保存（内部で1秒に1回までに間引き）
        saveGame();
    }

    // 資産サマリーの更新
    function updateAssetSummary() {
        const totalAsset = portfolio.getTotalAsset(market);
        const unrealizedPnL = portfolio.getUnrealizedPnL(market);
        const assetDiff = totalAsset - portfolio.initialCash;
        const assetDiffPct = ((assetDiff / portfolio.initialCash) * 100).toFixed(2);

        document.getElementById('totalAssetDisplay').textContent = `¥${Math.round(totalAsset).toLocaleString()}`;
        document.getElementById('cashDisplay').textContent = `¥${Math.round(portfolio.cash).toLocaleString()}`;

        // 信用保証金維持率の表示
        const marginRatioItem = document.getElementById('marginRatioItem');
        const marginRatioDisplay = document.getElementById('marginRatioDisplay');
        const marginInfo = portfolio.getMarginMaintenanceRatio(market);
        if (marginInfo && marginRatioItem && marginRatioDisplay) {
            marginRatioItem.style.display = 'flex';
            const ratioVal = marginInfo.ratio.toFixed(1);
            marginRatioDisplay.textContent = `${ratioVal}%`;
            if (marginInfo.ratio <= 20) {
                marginRatioDisplay.className = 'summary-value margin-ratio-danger';
            } else if (marginInfo.ratio <= 30) {
                marginRatioDisplay.className = 'summary-value margin-ratio-warn';
            } else {
                marginRatioDisplay.className = 'summary-value margin-ratio-safe';
            }
        } else if (marginRatioItem) {
            marginRatioItem.style.display = 'none';
        }

        // トレーダー称号・ランクの更新
        const rankInfo = portfolio.getTraderRank(market);
        const rankBadge = document.getElementById('headerRankBadge');
        if (rankBadge && rankInfo) {
            rankBadge.textContent = rankInfo.currentRank.badge;
            rankBadge.style.color = rankInfo.currentRank.color;
        }

        // 評価損益（保有建玉の含み損益合計）
        const pnlEl = document.getElementById('unrealizedPnLDisplay');
        const isUp = unrealizedPnL >= 0;
        const sign = isUp ? '+' : '';
        
        let totalCost = 0;
        portfolio.positions.forEach(p => totalCost += p.avgPrice * p.qty);
        const pnlPct = totalCost > 0 ? ((unrealizedPnL / totalCost) * 100).toFixed(2) : '0.00';

        pnlEl.className = `summary-value ${isUp ? 'text-up' : 'text-down'}`;
        pnlEl.textContent = `${sign}¥${Math.round(unrealizedPnL).toLocaleString()} (${sign}${pnlPct}%)`;

        // 実現損益 & 勝率
        const totalTrades = portfolio.winTrades + portfolio.lossTrades;
        const winRate = totalTrades > 0 ? ((portfolio.winTrades / totalTrades) * 100).toFixed(1) : 0;
        const rIsUp = portfolio.totalRealizedPnL >= 0;
        const rSign = rIsUp ? '+' : '';
        const rEl = document.getElementById('realizedPnLDisplay');
        rEl.className = `summary-value ${rIsUp ? 'text-up' : 'text-down'}`;
        rEl.textContent = `${rSign}¥${Math.round(portfolio.totalRealizedPnL).toLocaleString()} (勝率 ${winRate}%)`;
    }

    // テーブル行の差分更新
    // 毎ティック tbody 全体を作り直すと、押下中の操作ボタンが差し替わってクリックを取りこぼすため、
    // 行をキーで再利用し、変化したデータセルだけを書き換える（操作セルは原則そのまま維持）
    function patchTableRows(tbody, rows, emptyHtml) {
        if (rows.length === 0) {
            if (tbody.dataset.state !== 'empty') {
                tbody.innerHTML = emptyHtml;
                tbody.dataset.state = 'empty';
            }
            return;
        }
        if (tbody.dataset.state !== 'rows') {
            tbody.innerHTML = '';
            tbody.dataset.state = 'rows';
        }

        const existing = new Map();
        Array.from(tbody.children).forEach(tr => existing.set(tr.dataset.key, tr));

        rows.forEach((row, i) => {
            const actionHtml = row.actionHtml || '';
            let tr = existing.get(row.key);
            if (tr) {
                existing.delete(row.key);
                if (tr._actionHtml !== actionHtml) {
                    tr.innerHTML = row.dataHtml + actionHtml;
                } else if (tr._dataHtml !== row.dataHtml) {
                    while (tr.children.length > tr._actionCellCount) {
                        tr.removeChild(tr.firstElementChild);
                    }
                    tr.insertAdjacentHTML('afterbegin', row.dataHtml);
                }
            } else {
                tr = document.createElement('tr');
                tr.dataset.key = row.key;
                tr.innerHTML = row.dataHtml + actionHtml;
            }
            tr._dataHtml = row.dataHtml;
            if (tr._actionHtml !== actionHtml) {
                tr._actionHtml = actionHtml;
                const tmp = document.createElement('tr');
                tmp.innerHTML = actionHtml;
                tr._actionCellCount = tmp.children.length;
            }

            if (tbody.children[i] !== tr) {
                tbody.insertBefore(tr, tbody.children[i] || null);
            }
        });

        existing.forEach(tr => tr.remove());
    }

    // 保有建玉（ポジション）一覧レンダリング
    function renderPositions() {
        const tbody = document.getElementById('positionsTableBody');
        const posBadge = document.getElementById('posCountBadge');
        posBadge.textContent = portfolio.positions.length;

        const rows = portfolio.positions.map(pos => {
            const stock = market.getStock(pos.symbol);
            const currentPrice = stock ? stock.currentPrice : pos.avgPrice;

            let pnl = 0;
            let sideLabel = '';
            let sideBadge = '';

            if (pos.side === 'cash_buy') {
                pnl = (currentPrice - pos.avgPrice) * pos.qty;
                sideLabel = '現物買';
                sideBadge = 'color: #3b82f6;';
            } else if (pos.side === 'margin_buy') {
                pnl = (currentPrice - pos.avgPrice) * pos.qty;
                sideLabel = '信用買(3x)';
                sideBadge = 'color: #ef4444;';
            } else if (pos.side === 'margin_sell') {
                pnl = (pos.avgPrice - currentPrice) * pos.qty;
                sideLabel = '信用売(空売)';
                sideBadge = 'color: #f59e0b;';
            }

            const pnlPct = ((pnl / (pos.avgPrice * pos.qty)) * 100).toFixed(2);
            const isPnlUp = pnl >= 0;
            const sign = isPnlUp ? '+' : '';
            const pnlBadgeClass = isPnlUp ? 'up' : 'down';

            return {
                key: pos.id,
                dataHtml: `<td><strong>${pos.symbol}</strong> ${pos.name}</td>` +
                    `<td style="${sideBadge}; font-weight: 700;">${sideLabel}</td>` +
                    `<td><strong>${pos.qty.toLocaleString()}</strong></td>` +
                    `<td>${pos.avgPrice.toLocaleString()}</td>` +
                    `<td><strong>${currentPrice.toLocaleString()}</strong></td>` +
                    `<td><span class="badge-pnl ${pnlBadgeClass}">${sign}¥${Math.round(pnl).toLocaleString()}</span></td>` +
                    `<td><span class="badge-pnl ${pnlBadgeClass}">${sign}${pnlPct}%</span></td>`,
                actionHtml: `<td style="white-space: nowrap;">` +
                    `<button class="action-btn-sm btn-close-pos" data-posid="${pos.id}" title="現在値で即座に成行決済">成行決済</button>` +
                    `<button class="action-btn-sm btn-limit-close-pos" data-posid="${pos.id}" style="background: #2563eb; margin-left: 4px;" title="返済モードで発注パネルにセット">指値返済</button>` +
                    `</td>`
            };
        });

        patchTableRows(tbody, rows,
            `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 18px;">保有中の建玉はありません</td></tr>`);
    }

    // 指値返済：発注パネルを返済モードにセット
    function setupLimitClose(posId) {
        const pos = portfolio.positions.find(p => p.id === posId);
        if (!pos) return;

        selectStock(pos.symbol);

        if (pos.side === 'cash_buy') {
            setAccount('cash');
            setSide('sell');
            setMode('close');
        } else if (pos.side === 'margin_buy') {
            setAccount('margin');
            setSide('sell');
            setMode('close');
        } else if (pos.side === 'margin_sell') {
            setAccount('margin');
            setSide('buy');
            setMode('close');
        }

        setOrderType('limit');
        document.getElementById('inputOrderQty').value = pos.qty;
        const stock = market.getStock(pos.symbol);
        if (stock) {
            document.getElementById('inputOrderPrice').value = stock.currentPrice;
        }
        updateCalcTotal();
        updateSubmitButton();

        showToast('info', '指値返済設定', `${pos.name} (${pos.qty}株) の返済指値を設定しました。価格を決めて発注してください。`);
    }

    // 建玉一覧のボタン操作（イベント委譲：行の再描画に影響されない）
    document.getElementById('positionsTableBody').addEventListener('click', (e) => {
        const closeBtn = e.target.closest('.btn-close-pos');
        if (closeBtn) {
            const res = portfolio.closePosition(closeBtn.getAttribute('data-posid'), market);
            if (res.success) {
                showToast('alert', '建玉決済', res.message);
                updateUI();
            } else {
                showToast('alert', '決済エラー', res.message);
            }
            return;
        }
        const limitBtn = e.target.closest('.btn-limit-close-pos');
        if (limitBtn) {
            setupLimitClose(limitBtn.getAttribute('data-posid'));
        }
    });

    // 未約定注文一覧レンダリング
    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        const badge = document.getElementById('orderCountBadge');
        badge.textContent = portfolio.orders.length;

        const rows = portfolio.orders.map(o => {
            const stock = market.getStock(o.symbol);
            const currentPrice = stock ? stock.currentPrice : '-';

            let sideText = '';
            if (o.side === 'cash_buy') sideText = '現物買';
            else if (o.side === 'cash_sell') sideText = '現物売';
            else if (o.side === 'margin_buy') sideText = '信用買';
            else if (o.side === 'margin_sell') sideText = '信用売(空売)';
            else if (o.side === 'margin_close_buy') sideText = '返済買';
            else if (o.side === 'margin_close_sell') sideText = '返済売';

            const isStop = o.orderType === 'stop';
            const orderTypeBadge = isStop
                ? `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 700; margin-left: 4px;">逆指値</span>`
                : `<span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 700; margin-left: 4px;">指値</span>`;

            const priceDisplay = isStop
                ? `<span style="color: #f59e0b; font-weight:800; font-size: 13px;">${o.price.toLocaleString()}円</span><span style="font-size: 10px; color: var(--text-muted); display: block;">(トリガー)</span>`
                : `<span style="color: var(--color-gold); font-weight:800; font-size: 13px;">${o.price.toLocaleString()}円</span>`;

            return {
                key: o.id,
                dataHtml: `<td>${o.time}</td>` +
                    `<td><strong>${o.symbol}</strong> ${o.name}</td>` +
                    `<td><span style="font-weight: 700; color: ${o.side.includes('buy') ? 'var(--color-up)' : 'var(--color-down)'};">${sideText}</span> ${orderTypeBadge}</td>` +
                    `<td><strong>${o.qty.toLocaleString()}</strong></td>` +
                    `<td>${priceDisplay}</td>` +
                    `<td><strong>${typeof currentPrice === 'number' ? currentPrice.toLocaleString() : currentPrice}</strong></td>`,
                actionHtml: `<td><button class="action-btn-cancel btn-cancel-order" data-ordid="${o.id}">取消</button></td>`
            };
        });

        patchTableRows(tbody, rows,
            `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 18px;">未約定の注文はありません</td></tr>`);
    }

    // 注文一覧の取消ボタン（イベント委譲）
    document.getElementById('ordersTableBody').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-cancel-order');
        if (!btn) return;
        const res = portfolio.cancelOrder(btn.getAttribute('data-ordid'));
        showToast('info', '注文取消', res.message);
        updateUI();
    });

    // 取引履歴レンダリング
    function renderHistory() {
        const tbody = document.getElementById('historyTableBody');

        const rows = portfolio.history.slice(0, 15).map(h => {
            let sideText = '';
            if (h.side === 'cash_buy') sideText = '現物買';
            else if (h.side === 'cash_sell') sideText = '現物売(決済)';
            else if (h.side === 'margin_buy') sideText = '信用買';
            else if (h.side === 'margin_close_sell') sideText = '返済売(決済)';
            else if (h.side === 'margin_sell') sideText = '信用売(空売)';
            else if (h.side === 'margin_close_buy') sideText = '返済買(決済)';

            let pnlHtml = '-';
            if (h.realizedPnL !== null) {
                const isPnlUp = h.realizedPnL >= 0;
                const sign = isPnlUp ? '+' : '';
                const pnlBadgeClass = isPnlUp ? 'up' : 'down';
                pnlHtml = `<span class="badge-pnl ${pnlBadgeClass}">${sign}¥${Math.round(h.realizedPnL).toLocaleString()}</span>`;
            }

            return {
                key: h.id,
                dataHtml: `<td>${h.time}</td>` +
                    `<td><strong>${h.symbol}</strong> ${h.name}</td>` +
                    `<td><strong style="color: ${h.side.includes('buy') ? 'var(--color-up)' : 'var(--color-down)'};">${sideText}</strong></td>` +
                    `<td><strong>${h.qty.toLocaleString()}</strong></td>` +
                    `<td><strong>${h.price.toLocaleString()}</strong></td>` +
                    `<td>${pnlHtml}</td>`
            };
        });

        patchTableRows(tbody, rows,
            `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 18px;">取引履歴はありません</td></tr>`);
    }

    // 概算代金の計算更新
    function updateCalcTotal() {
        const stock = market.getStock(selectedSymbol);
        if (!stock) return;

        const qty = parseInt(document.getElementById('inputOrderQty').value, 10) || 0;
        const price = orderType === 'market' ? stock.currentPrice : (parseInt(document.getElementById('inputOrderPrice').value, 10) || stock.currentPrice);
        const total = price * qty;

        const calcEl = document.getElementById('calcOrderTotal');
        const fee = total > 0 ? portfolio.calcFee(total) : 0;
        if (orderAccount === 'margin') {
            calcEl.textContent = `¥${total.toLocaleString()} (必要保証金: ¥${Math.round(total / 3).toLocaleString()} / 手数料: ¥${fee.toLocaleString()})`;
        } else {
            calcEl.textContent = `¥${total.toLocaleString()} (手数料: ¥${fee.toLocaleString()})`;
        }
    }

    // --------------------------------------------------------------------------
    // イベントリスナー設定
    // --------------------------------------------------------------------------

    const btnAccCash = document.getElementById('btnAccCash');
    const btnAccMargin = document.getElementById('btnAccMargin');
    const btnModeNew = document.getElementById('btnModeNew');
    const btnModeClose = document.getElementById('btnModeClose');
    const btnSideBuy = document.getElementById('btnSideBuy');
    const btnSideSell = document.getElementById('btnSideSell');
    const btnTypeMarket = document.getElementById('btnTypeMarket');
    const btnTypeLimit = document.getElementById('btnTypeLimit');
    const btnTypeStop = document.getElementById('btnTypeStop');
    const limitPriceRow = document.getElementById('limitPriceRow');
    const labelOrderPrice = document.getElementById('labelOrderPrice');

    function setAccount(acc) {
        orderAccount = acc;
        if (acc === 'cash') {
            btnAccCash.classList.add('active');
            btnAccMargin.classList.remove('active');
            // 現物取引の場合、返済は売り、新規は買いに連動
            if (orderSide === 'buy') setMode('new');
            else setMode('close');
        } else {
            btnAccMargin.classList.add('active');
            btnAccCash.classList.remove('active');
        }
        updateSubmitButton();
        updateCalcTotal();
    }

    function setMode(mode) {
        orderMode = mode;
        if (btnModeNew && btnModeClose) {
            if (mode === 'new') {
                btnModeNew.classList.add('active');
                btnModeClose.classList.remove('active');
            } else {
                btnModeClose.classList.add('active');
                btnModeNew.classList.remove('active');
            }
        }
        updateSubmitButton();
        updateCalcTotal();
    }

    function setSide(side) {
        orderSide = side;
        if (side === 'buy') {
            btnSideBuy.className = 'form-toggle-btn buy-active';
            btnSideSell.className = 'form-toggle-btn';
            if (orderAccount === 'cash') setMode('new');
        } else {
            btnSideSell.className = 'form-toggle-btn sell-active';
            btnSideBuy.className = 'form-toggle-btn';
            if (orderAccount === 'cash') setMode('close');
        }
        updateSubmitButton();
    }

    function setOrderType(type) {
        orderType = type; // 'market' | 'limit' | 'stop'
        btnTypeMarket.classList.toggle('active', type === 'market');
        btnTypeLimit.classList.toggle('active', type === 'limit');
        if (btnTypeStop) btnTypeStop.classList.toggle('active', type === 'stop');

        if (type === 'market') {
            limitPriceRow.style.opacity = '0.5';
            limitPriceRow.style.pointerEvents = 'none';
            if (labelOrderPrice) labelOrderPrice.innerHTML = '指値価格 (円) <span style="font-size: 10px; color: var(--color-accent);">※成行のため指定不要</span>';
        } else if (type === 'limit') {
            limitPriceRow.style.opacity = '1';
            limitPriceRow.style.pointerEvents = 'auto';
            if (labelOrderPrice) labelOrderPrice.innerHTML = '指値価格 (円) <span style="font-size: 10px; color: var(--color-accent);">※板クリックでも入力可</span>';
        } else if (type === 'stop') {
            limitPriceRow.style.opacity = '1';
            limitPriceRow.style.pointerEvents = 'auto';
            if (labelOrderPrice) labelOrderPrice.innerHTML = '逆指値トリガー価格 (円) <span style="font-size: 10px; color: #f59e0b;">※達したら成行自動執行（損切）</span>';
        }
        updateSubmitButton();
        updateCalcTotal();
    }

    btnAccCash.addEventListener('click', () => setAccount('cash'));
    btnAccMargin.addEventListener('click', () => setAccount('margin'));
    if (btnModeNew) btnModeNew.addEventListener('click', () => setMode('new'));
    if (btnModeClose) btnModeClose.addEventListener('click', () => setMode('close'));
    btnSideBuy.addEventListener('click', () => setSide('buy'));
    btnSideSell.addEventListener('click', () => setSide('sell'));
    btnTypeMarket.addEventListener('click', () => setOrderType('market'));
    btnTypeLimit.addEventListener('click', () => setOrderType('limit'));
    if (btnTypeStop) btnTypeStop.addEventListener('click', () => setOrderType('stop'));

    // 発注ボタンテキストの更新
    function updateSubmitButton() {
        const btn = document.getElementById('btnSubmitOrder');
        let text = '';
        let typeStr = '成行';
        if (orderType === 'limit') typeStr = '指値';
        else if (orderType === 'stop') typeStr = '逆指値(損切)';

        if (orderAccount === 'cash') {
            if (orderSide === 'buy') {
                text = `現物【買い】 発注 (${typeStr})`;
                btn.className = 'submit-order-btn btn-buy';
            } else {
                text = `現物【売り】 発注 (${typeStr})`;
                btn.className = 'submit-order-btn btn-sell';
            }
        } else {
            if (orderMode === 'new') {
                if (orderSide === 'buy') {
                    text = `信用【新規買い】 発注 (${typeStr})`;
                    btn.className = 'submit-order-btn btn-buy';
                } else {
                    text = `信用【新規売り・空売り】 発注 (${typeStr})`;
                    btn.className = 'submit-order-btn btn-sell';
                }
            } else {
                if (orderSide === 'buy') {
                    text = `信用【返済買い・買戻】 発注 (${typeStr})`;
                    btn.className = 'submit-order-btn btn-buy';
                } else {
                    text = `信用【返済売り・利確】 発注 (${typeStr})`;
                    btn.className = 'submit-order-btn btn-sell';
                }
            }
        }
        btn.textContent = text;
    }

    // 数量クイックボタン
    document.querySelectorAll('.quick-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const add = parseInt(btn.getAttribute('data-qty'), 10);
            const input = document.getElementById('inputOrderQty');
            const current = parseInt(input.value, 10) || 0;
            input.value = current + add;
            updateCalcTotal();
        });
    });

    document.getElementById('inputOrderQty').addEventListener('input', updateCalcTotal);
    document.getElementById('inputOrderPrice').addEventListener('input', updateCalcTotal);

    // 発注ボタン押下
    document.getElementById('btnSubmitOrder').addEventListener('click', () => {
        const qty = parseInt(document.getElementById('inputOrderQty').value, 10);
        const price = parseInt(document.getElementById('inputOrderPrice').value, 10);

        if (isNaN(qty) || qty <= 0) {
            showToast('alert', '入力エラー', '有効な株数を入力してください');
            return;
        }

        let sideKey = '';
        if (orderAccount === 'cash') {
            sideKey = orderSide === 'buy' ? 'cash_buy' : 'cash_sell';
        } else {
            if (orderMode === 'new') {
                sideKey = orderSide === 'buy' ? 'margin_buy' : 'margin_sell';
            } else {
                sideKey = orderSide === 'buy' ? 'margin_close_buy' : 'margin_close_sell';
            }
        }

        const res = portfolio.placeOrder(market, {
            symbol: selectedSymbol,
            side: sideKey,
            orderType: orderType,
            price: price,
            qty: qty
        });

        if (res.success) {
            showToast('info', '注文完了', res.message);
            if (board && orderType === 'market') {
                const st = market.getStock(selectedSymbol);
                if (st) board.onPlayerLargeTrade(selectedSymbol, sideKey, qty, st.currentPrice);
            }
        } else {
            showToast('alert', '注文エラー', res.message);
            if (window.soundManager) window.soundManager.playAlert();
        }

        updateUI();
    });

    // 全返済・売却ボタン
    document.getElementById('closeAllBtn').addEventListener('click', () => {
        if (portfolio.positions.length === 0) {
            showToast('info', '決済対象なし', '保有中の建玉はありません');
            return;
        }
        if (!portfolio.isMarketOpen(market)) {
            showToast('alert', '決済エラー', '取引時間外のため決済できません');
            return;
        }
        if (confirm('すべての保有ポジション（現物および信用建玉）を成行決済しますか？')) {
            const results = portfolio.closeAllPositions(market);
            showToast('alert', '一括決済完了', `${results.length}件のポジションを一括成行決済しました`);
            updateUI();
        }
    });

    // 音声ON/OFFボタン
    const soundBtn = document.getElementById('soundToggleBtn');
    soundBtn.addEventListener('click', () => {
        if (window.soundManager) {
            const enabled = window.soundManager.toggle();
            setIconButton(soundBtn, enabled ? '🔊' : '🔇', enabled ? '音声ON' : '音声OFF');
            soundBtn.style.color = enabled ? 'var(--text-secondary)' : 'var(--text-muted)';
        }
    });

    // 下部タブ切替
    document.querySelectorAll('.bottom-tabs-panel .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bottom-tabs-panel .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.bottom-tabs-panel .tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'tabAnalytics') {
                setTimeout(renderAnalytics, 50);
            }
        });
    });

    // インジケータートグル (SMA / BB / 売買履歴)
    const btnToggleSMA = document.getElementById('btnToggleSMA');
    const btnToggleBB = document.getElementById('btnToggleBB');
    const btnToggleTrades = document.getElementById('btnToggleTrades');
    if (btnToggleSMA) {
        btnToggleSMA.addEventListener('click', () => {
            const active = chart.toggleSMA();
            btnToggleSMA.classList.toggle('active', active);
        });
    }
    if (btnToggleBB) {
        btnToggleBB.addEventListener('click', () => {
            const active = chart.toggleBB();
            btnToggleBB.classList.toggle('active', active);
        });
    }
    if (btnToggleTrades) {
        btnToggleTrades.addEventListener('click', () => {
            const active = chart.toggleTrades();
            btnToggleTrades.classList.toggle('active', active);
        });
    }

    // 下部パネル拡大・縮小
    const btnExpandBottomPanel = document.getElementById('btnExpandBottomPanel');
    const centerCol = document.querySelector('.center-column');
    if (btnExpandBottomPanel && centerCol) {
        btnExpandBottomPanel.addEventListener('click', () => {
            const isExp = centerCol.classList.toggle('expanded-bottom');
            btnExpandBottomPanel.textContent = isExp ? '⬇ パネル縮小' : '⬆ パネル拡大';
            setTimeout(() => {
                chart.resize();
                renderEquityChart();
            }, 220);
        });
    }

    // ニュース履歴モーダル
    const newsModalOverlay = document.getElementById('newsModalOverlay');
    const btnOpenNewsHistory = document.getElementById('btnOpenNewsHistory');
    const btnCloseNewsModal = document.getElementById('btnCloseNewsModal');
    const newsModalList = document.getElementById('newsModalList');

    function renderNewsModal() {
        if (!news || !news.newsHistory || news.newsHistory.length === 0) {
            newsModalList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">本日まだ速報ニュースは配信されていません</div>`;
            return;
        }
        let html = '';
        news.newsHistory.forEach(item => {
            const isPos = item.type === 'positive';
            const borderColor = isPos ? 'var(--color-up)' : 'var(--color-down)';
            const badgeBg = isPos ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)';
            const badgeColor = isPos ? 'var(--color-up)' : 'var(--color-down)';

            html += `
                <div class="news-history-item" style="border-left: 4px solid ${borderColor}; cursor: pointer; background: var(--bg-panel-sub); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-color); border-left-width: 4px;" data-symbol="${item.symbol}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-family: monospace; font-size: 11px; color: var(--text-muted); font-weight: 700;">${item.time}</span>
                        <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 800;">${item.badge}</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">${item.headline}</div>
                    <div style="font-size: 11px; color: var(--color-accent); margin-top: 5px; font-weight: 600;">👉 クリックして銘柄 ${item.symbol} を表示</div>
                </div>
            `;
        });
        newsModalList.innerHTML = html;

        newsModalList.querySelectorAll('.news-history-item').forEach(el => {
            el.addEventListener('click', () => {
                const sym = el.getAttribute('data-symbol');
                selectStock(sym);
                newsModalOverlay.style.display = 'none';
            });
        });
    }

    if (btnOpenNewsHistory) {
        btnOpenNewsHistory.addEventListener('click', () => {
            renderNewsModal();
            newsModalOverlay.style.display = 'flex';
        });
    }
    if (btnCloseNewsModal) {
        btnCloseNewsModal.addEventListener('click', () => {
            newsModalOverlay.style.display = 'none';
        });
    }
    if (newsModalOverlay) {
        newsModalOverlay.addEventListener('click', (e) => {
            if (e.target === newsModalOverlay) {
                newsModalOverlay.style.display = 'none';
            }
        });
    }

    // --------------------------------------------------------------------------
    // トレーダー称号 ＆ 実績トロフィーモーダル
    // --------------------------------------------------------------------------
    const rankModalOverlay = document.getElementById('rankModalOverlay');
    const btnOpenRankModal = document.getElementById('btnOpenRankModal');
    const btnCloseRankModal = document.getElementById('btnCloseRankModal');
    const rankModalContent = document.getElementById('rankModalContent');

    // --------------------------------------------------------------------------
    // 最高資産ランキング（リセットしても消えないよう、セーブデータとは別に保存）
    // --------------------------------------------------------------------------
    const RANKING_KEY = 'kabu_ranking_v1';
    const RANKING_MAX = 10;

    function loadRanking() {
        try {
            const list = JSON.parse(localStorage.getItem(RANKING_KEY));
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    // 現在のゲームの成績をランキング用の記録にまとめる
    function buildCurrentRun() {
        return {
            peakAsset: Math.round(Math.max(portfolio.peakAsset, portfolio.getTotalAsset(market))),
            finalAsset: Math.round(portfolio.getTotalAsset(market)),
            tradingDays: portfolio.tradingDay || 1,
            trades: portfolio.winTrades + portfolio.lossTrades,
            badge: portfolio.getTraderRank(market).currentRank.badge,
            startedAt: portfolio.startedAt || Date.now(),
            endedAt: Date.now()
        };
    }

    // リセット時に今回のゲームをランキングへ記録（一度も売買していないゲームは記録しない）
    function recordRunToRanking() {
        if (portfolio.history.length === 0) return;
        const list = loadRanking();
        list.push(buildCurrentRun());
        list.sort((a, b) => b.peakAsset - a.peakAsset);
        try {
            localStorage.setItem(RANKING_KEY, JSON.stringify(list.slice(0, RANKING_MAX)));
        } catch (e) {
            console.warn('ランキングを保存できませんでした:', e);
        }
    }

    // ランキング表のHTML（記録済みの成績 ＋ プレイ中のゲームを最高資産順に並べる）
    function renderRankingHtml() {
        const current = { ...buildCurrentRun(), isCurrent: true };
        const all = [...loadRanking(), current].sort((a, b) => b.peakAsset - a.peakAsset);
        const fmtDate = (ms) => new Date(ms).toLocaleDateString('ja-JP');
        const medal = ['🥇', '🥈', '🥉'];

        // 上位10件を表示。プレイ中のゲームが圏外なら、その順位も末尾に表示
        const rows = all.slice(0, RANKING_MAX);
        const currentPos = all.indexOf(current);
        if (currentPos >= RANKING_MAX) rows.push(current);

        let html = `
            <div class="rank-section-title">🏆 最高資産ランキング（TOP${RANKING_MAX}）</div>
            <table class="data-table ranking-table">
                <thead>
                    <tr>
                        <th>順位</th>
                        <th>最高資産</th>
                        <th>最終資産</th>
                        <th>日数</th>
                        <th>取引</th>
                        <th>称号</th>
                        <th>日付</th>
                    </tr>
                </thead>
                <tbody>
        `;
        rows.forEach(r => {
            const pos = all.indexOf(r) + 1;
            const gainPct = ((r.peakAsset / portfolio.initialCash - 1) * 100).toFixed(1);
            const gainClass = r.peakAsset >= portfolio.initialCash ? 'text-up' : 'text-down';
            html += `
                <tr class="${r.isCurrent ? 'ranking-current' : ''}">
                    <td>${medal[pos - 1] || pos + '位'}</td>
                    <td><strong>¥${r.peakAsset.toLocaleString()}</strong> <span class="${gainClass}" style="font-size: 10.5px;">(${gainPct >= 0 ? '+' : ''}${gainPct}%)</span></td>
                    <td>¥${r.finalAsset.toLocaleString()}</td>
                    <td>${r.tradingDays}日</td>
                    <td>${r.trades}回</td>
                    <td style="font-family: inherit;">${r.badge}</td>
                    <td style="font-family: inherit;">${r.isCurrent ? '<span class="ranking-current-tag">プレイ中</span>' : fmtDate(r.endedAt)}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
            <div class="ranking-note">「🔄 リセット」で最初からやり直すと、そのゲームの成績がランキングに記録されます（ランキングはリセットしても消えません）。</div>
        `;
        return html;
    }

    function renderRankModal() {
        if (!rankModalContent) return;
        const rankInfo = portfolio.getTraderRank(market);
        const cur = rankInfo.currentRank;

        let html = `
            <div class="current-rank-card">
                <div class="current-rank-info">
                    <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">現在のトレーダー称号</div>
                    <div class="current-rank-badge" style="color: ${cur.color};">${cur.icon} ${cur.title}</div>
                    <div class="current-rank-desc">${cur.desc}</div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 11px; color: var(--text-muted); display: block;">実績トロフィー</span>
                    <strong style="font-size: 22px; color: var(--color-gold); font-family: monospace;">${rankInfo.unlockedCount} / ${rankInfo.trophies.length}</strong>
                </div>
            </div>

            ${renderRankingHtml()}

            <div class="rank-section-title">🎖️ 全トレーダーランク階層</div>
            <div class="ranks-list">
        `;

        rankInfo.allRanks.forEach(r => {
            const isActive = r.id === cur.id;
            const isAchieved = r.achieved;
            const statusBadge = isActive
                ? `<span style="background: var(--color-gold); color: black; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 4px;">現在</span>`
                : (isAchieved ? `<span style="color: #10b981; font-weight: 700;">✔ 獲得済</span>` : `<span style="color: var(--text-muted);">🔒 未到達</span>`);

            html += `
                <div class="rank-item-row ${isActive ? 'active' : ''} ${!isAchieved ? 'locked' : ''}">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">${r.icon}</span>
                        <div>
                            <strong style="color: ${isAchieved ? r.color : 'inherit'};">${r.title}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${r.desc}</div>
                        </div>
                    </div>
                    <div>${statusBadge}</div>
                </div>
            `;
        });

        html += `
            </div>

            <div class="rank-section-title">🏆 実績トロフィー（アチーブメント）</div>
            <div class="trophy-grid">
        `;

        rankInfo.trophies.forEach(t => {
            html += `
                <div class="trophy-item ${!t.unlocked ? 'locked' : ''}">
                    <div class="trophy-icon">${t.icon}</div>
                    <div class="trophy-info">
                        <div class="trophy-name">${t.name} ${t.unlocked ? '✨' : ''}</div>
                        <div class="trophy-desc">${t.desc}</div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        rankModalContent.innerHTML = html;
    }

    if (btnOpenRankModal) {
        btnOpenRankModal.addEventListener('click', () => {
            renderRankModal();
            rankModalOverlay.style.display = 'flex';
        });
    }
    if (btnCloseRankModal) {
        btnCloseRankModal.addEventListener('click', () => {
            rankModalOverlay.style.display = 'none';
        });
    }
    if (rankModalOverlay) {
        rankModalOverlay.addEventListener('click', (e) => {
            if (e.target === rankModalOverlay) {
                rankModalOverlay.style.display = 'none';
            }
        });
    }

    // --------------------------------------------------------------------------
    // 成績分析 ＆ エクイティカーブ（資産推移）描画
    // --------------------------------------------------------------------------
    const equityCanvas = document.getElementById('equityChartCanvas');
    const equityCtx = equityCanvas ? equityCanvas.getContext('2d') : null;

    function renderEquityChart() {
        if (!equityCanvas || !equityCtx || !portfolio.assetHistory) return;
        const parent = equityCanvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);

        equityCanvas.width = Math.floor(w * dpr);
        equityCanvas.height = Math.floor(h * dpr);
        equityCanvas.style.width = w + 'px';
        equityCanvas.style.height = h + 'px';

        equityCtx.save();
        equityCtx.scale(dpr, dpr);

        const isDark = currentTheme === 'dark';
        const bg = isDark ? '#0f172a' : '#f8fafc';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const baseLineColor = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)';

        // 背景
        equityCtx.fillStyle = bg;
        equityCtx.fillRect(0, 0, w, h);

        const padTop = 18;
        const padBottom = 22;
        const padLeft = 14;
        const padRight = 85;
        const chartW = w - padLeft - padRight;
        const chartH = h - padTop - padBottom;

        if (chartW <= 10 || chartH <= 10) {
            equityCtx.restore();
            return;
        }

        const data = portfolio.assetHistory;
        if (data.length < 1) {
            equityCtx.restore();
            return;
        }

        const assets = data.map(d => d.asset);
        let minVal = Math.min(portfolio.initialCash, ...assets);
        let maxVal = Math.max(portfolio.initialCash, ...assets);
        const margin = (maxVal - minVal) * 0.1 || (portfolio.initialCash * 0.02);
        minVal -= margin;
        maxVal += margin;
        const valRange = (maxVal - minVal) || 1;

        const getY = (val) => padTop + chartH - ((val - minVal) / valRange) * chartH;
        const getX = (idx) => padLeft + (idx / Math.max(1, data.length - 1)) * chartW;

        // 基準線 (1000万円)
        const base10M_Y = getY(portfolio.initialCash);
        equityCtx.strokeStyle = baseLineColor;
        equityCtx.lineWidth = 1;
        equityCtx.setLineDash([4, 4]);
        equityCtx.beginPath();
        equityCtx.moveTo(padLeft, base10M_Y);
        equityCtx.lineTo(w - padRight, base10M_Y);
        equityCtx.stroke();
        equityCtx.setLineDash([]);

        // 基準線ラベル
        equityCtx.fillStyle = textColor;
        equityCtx.font = '10px "Consolas", monospace';
        equityCtx.textAlign = 'left';
        equityCtx.textBaseline = 'middle';
        equityCtx.fillText('元本 ¥10,000,000', w - padRight + 6, base10M_Y);

        // 折れ線 & 領域塗りつぶし
        if (data.length >= 2) {
            const curAsset = data[data.length - 1].asset;
            const isUp = curAsset >= portfolio.initialCash;
            const strokeColor = isUp ? (isDark ? '#ef4444' : '#dc2626') : (isDark ? '#3b82f6' : '#2563eb');
            const gradTopColor = isUp ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.35)';
            const gradBottomColor = isUp ? 'rgba(239, 68, 68, 0.0)' : 'rgba(59, 130, 246, 0.0)';

            // グラデーション塗りつぶし
            const grad = equityCtx.createLinearGradient(0, padTop, 0, padTop + chartH);
            grad.addColorStop(0, gradTopColor);
            grad.addColorStop(1, gradBottomColor);

            equityCtx.beginPath();
            equityCtx.moveTo(getX(0), getY(data[0].asset));
            for (let i = 1; i < data.length; i++) {
                equityCtx.lineTo(getX(i), getY(data[i].asset));
            }
            equityCtx.lineTo(getX(data.length - 1), padTop + chartH);
            equityCtx.lineTo(getX(0), padTop + chartH);
            equityCtx.closePath();
            equityCtx.fillStyle = grad;
            equityCtx.fill();

            // メイン折れ線
            equityCtx.beginPath();
            equityCtx.moveTo(getX(0), getY(data[0].asset));
            for (let i = 1; i < data.length; i++) {
                equityCtx.lineTo(getX(i), getY(data[i].asset));
            }
            equityCtx.strokeStyle = strokeColor;
            equityCtx.lineWidth = 2.2;
            equityCtx.lineJoin = 'round';
            equityCtx.lineCap = 'round';
            equityCtx.stroke();

            // 最新ポイントの点
            const lastX = getX(data.length - 1);
            const lastY = getY(curAsset);
            equityCtx.beginPath();
            equityCtx.arc(lastX, lastY, 4, 0, Math.PI * 2);
            equityCtx.fillStyle = strokeColor;
            equityCtx.fill();
            equityCtx.strokeStyle = isDark ? '#ffffff' : '#000000';
            equityCtx.lineWidth = 1.5;
            equityCtx.stroke();

            // 最新値ラベル
            equityCtx.fillStyle = strokeColor;
            equityCtx.font = 'bold 11px "Consolas", monospace';
            equityCtx.fillText(`¥${Math.round(curAsset).toLocaleString()}`, w - padRight + 6, lastY);
        }

        // 軸ラベル（開始・最新時刻）
        equityCtx.fillStyle = textColor;
        equityCtx.font = '10px "Consolas", monospace';
        equityCtx.textAlign = 'left';
        equityCtx.fillText(data[0].time, padLeft, h - 6);
        equityCtx.textAlign = 'right';
        equityCtx.fillText(data[data.length - 1].time, w - padRight, h - 6);

        equityCtx.restore();
    }

    function renderAnalytics() {
        const stats = portfolio.getPerformanceStats(market);

        const winRateEl = document.getElementById('statWinRate');
        if (winRateEl) {
            winRateEl.textContent = `${stats.winRate}%`;
            winRateEl.className = `stat-val ${parseFloat(stats.winRate) >= 50 ? 'text-up' : 'text-down'}`;
        }

        const winTradesEl = document.getElementById('statWinTrades');
        if (winTradesEl) {
            winTradesEl.textContent = `${stats.winTrades}勝 ${stats.lossTrades}敗 (計${stats.totalTrades}回)`;
        }

        const pfEl = document.getElementById('statProfitFactor');
        if (pfEl) {
            pfEl.textContent = stats.profitFactor;
            const pfVal = parseFloat(stats.profitFactor);
            pfEl.className = `stat-val ${pfVal >= 1.5 ? 'text-up' : (pfVal >= 1.0 ? '' : 'text-down')}`;
        }

        const rrEl = document.getElementById('statRiskReward');
        if (rrEl) {
            rrEl.textContent = stats.riskRewardRatio;
        }

        const avgEl = document.getElementById('statAvgGainLoss');
        if (avgEl) {
            avgEl.textContent = `平均 +¥${stats.avgGain.toLocaleString()} / -¥${stats.avgLoss.toLocaleString()}`;
        }

        const mddEl = document.getElementById('statMaxDrawdown');
        if (mddEl) {
            mddEl.textContent = `-¥${stats.maxDrawdown.toLocaleString()} (${stats.maxDrawdownPct}%)`;
        }

        const feeEl = document.getElementById('statTotalFees');
        if (feeEl) {
            feeEl.textContent = `-¥${Math.round(portfolio.totalFees).toLocaleString()}`;
        }

        const taxEl = document.getElementById('statTaxPaid');
        if (taxEl) {
            taxEl.textContent = `-¥${Math.round(portfolio.taxPaid).toLocaleString()}`;
        }

        renderEquityChart();
    }

    // 板 / 歩み値タブ切替
    const btnShowOrderbook = document.getElementById('btnShowOrderbook');
    const btnShowTrades = document.getElementById('btnShowTrades');
    const orderBookWrapper = document.getElementById('orderBookWrapper');
    const timeSalesWrapper = document.getElementById('timeSalesWrapper');

    btnShowOrderbook.addEventListener('click', () => {
        btnShowOrderbook.classList.add('active');
        btnShowTrades.classList.remove('active');
        orderBookWrapper.style.display = 'block';
        timeSalesWrapper.style.display = 'none';
    });

    btnShowTrades.addEventListener('click', () => {
        btnShowTrades.classList.add('active');
        btnShowOrderbook.classList.remove('active');
        orderBookWrapper.style.display = 'none';
        timeSalesWrapper.style.display = 'block';
    });

    // 速度コントロール
    const speedBtns = [
        document.getElementById('speedPause'),
        document.getElementById('speed1x'),
        document.getElementById('speed2x'),
        document.getElementById('speed5x')
    ];

    function setSpeed(speed) {
        gameSpeed = speed;
        speedBtns.forEach(b => b.classList.remove('active'));

        if (speed === 0) {
            document.getElementById('speedPause').classList.add('active');
            document.getElementById('marketDot').style.backgroundColor = '#64748b';
            document.getElementById('marketDot').style.boxShadow = 'none';
            document.getElementById('marketSessionText').textContent = '一時停止中';
            clearInterval(gameTimerId);
            gameTimerId = null;
        } else {
            const btn = document.querySelector(`.speed-btn[data-speed="${speed}"]`);
            if (btn) btn.classList.add('active');

            // 再開時は現在のセッション（前場・後場・大引け）に合わせて表示を更新
            updateUI();

            startLoop();
        }
    }

    document.getElementById('speedPause').addEventListener('click', () => setSpeed(0));
    document.getElementById('speed1x').addEventListener('click', () => setSpeed(1));
    document.getElementById('speed2x').addEventListener('click', () => setSpeed(2));
    document.getElementById('speed5x').addEventListener('click', () => setSpeed(5));

    // 翌日へ進むボタン
    const nextDayBtn = document.getElementById('nextDayBtn');
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => {
            const expired = portfolio.expireAllOrders();
            market.advanceToNextDay();
            portfolio.tradingDay = (portfolio.tradingDay || 1) + 1;
            showToast('info', '新営業日オープン', '昨日の終値を前日終値として、新しい取引日が開始されました！');
            if (expired > 0) {
                showToast('info', '注文失効', `前日の未約定注文 ${expired}件 は当日限りのため失効しました`);
            }
            if (gameSpeed === 0) setSpeed(1);
            updateUI();
        });
    }

    // --------------------------------------------------------------------------
    // トースト通知機能
    // --------------------------------------------------------------------------
    // アイコン＋ラベル形式のボタン表示を更新（狭い画面ではCSSでラベルを隠しアイコンのみ表示）
    function setIconButton(btn, icon, label) {
        btn.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-label">${label}</span>`;
        btn.setAttribute('aria-label', label);
    }

    function showToast(type, title, msg) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${msg}</div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // --------------------------------------------------------------------------
    // ゲームループ (Game Loop)
    // --------------------------------------------------------------------------
    function gameTick() {
        if (market.isClosed) {
            updateUI();
            return;
        }

        // 1. 市場ティック更新
        const tickRes = market.tick();
        if (tickRes && tickRes.isClosed) {
            showToast('alert', '大引け（本日の取引終了）', '15:00 大引けとなりました。「翌日へ進む」ボタンで翌営業日の取引を開始できます。');
            if (window.soundManager) window.soundManager.playNews();
        }

        // 2. 指値・逆指値注文の約定チェック
        const executed = portfolio.checkLimitOrders(market);
        executed.forEach(exec => {
            const tag = exec.orderType === 'stop' ? '逆指値(損切)約定' : '指値約定';
            showToast('info', tag, `${exec.name} ${exec.qty}株 が ${exec.execPrice.toLocaleString()}円 で約定しました！`);
        });

        // 2.5 信用取引の追証（マージンコール）＆強制ロスカットチェック
        const marginCall = portfolio.checkMarginCall(market);
        if (marginCall && marginCall.triggered) {
            showToast('alert', '🚨 追証・強制決済', marginCall.message);
        }

        // 3. ニュース速報 ＆ 掲示板チェック
        if (!market.isClosed) {
            news.tick();
            if (board) board.tick();
        }

        // 4. 資産スナップショット記録（エクイティカーブ用）
        portfolio.recordAssetSnapshot(market);

        // 5. UI再描画
        renderWatchlist();
        updateUI();

        // 6. 成績分析タブが開いていれば更新
        const activeTab = document.querySelector('.bottom-tabs-panel .tab-btn.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'tabAnalytics') {
            renderAnalytics();
        }
    }

    function startLoop() {
        if (gameTimerId) clearInterval(gameTimerId);
        const intervalMs = Math.round(1000 / gameSpeed);
        gameTimerId = setInterval(gameTick, intervalMs);
    }

    // --------------------------------------------------------------------------
    // テーマ切り替え機能 (ダークモード / ライトモード)
    // --------------------------------------------------------------------------
    const themeBtn = document.getElementById('themeToggleBtn');
    let currentTheme = localStorage.getItem('kabu_theme') || 'dark';

    function applyTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('kabu_theme', theme);

        if (themeBtn) {
            setIconButton(themeBtn, theme === 'dark' ? '☀️' : '🌙', theme === 'dark' ? 'ライト' : 'ダーク');
            themeBtn.title = theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
        }

        if (chart) {
            chart.setTheme(theme);
        }
        renderEquityChart();
    }

    window.addEventListener('resize', () => {
        renderEquityChart();
    });

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            showToast('info', 'テーマ切替', `${newTheme === 'dark' ? 'ダークモード' : 'ライトモード'}に切り替えました`);
        });
    }

    // 初期テーマ適用
    applyTheme(currentTheme);

    // アプリ初期起動
    selectStock(selectedSymbol);
    setSpeed(1);
    updateSubmitButton();

    if (savedGame) {
        const savedAt = new Date(savedGame.savedAt).toLocaleString('ja-JP');
        showToast('info', '前回の続きから再開', `${savedAt} に保存したデータを読み込みました。最初から遊ぶ場合は「リセット」を押してください。`);
        if (news.newsHistory.length > 0) {
            const latest = news.newsHistory[0];
            document.getElementById('tickerText').textContent = `${latest.headline} (${latest.badge})`;
        }
    } else {
        showToast('info', 'ゲーム開始', '資金 10,000,000円 で取引スタート！板やニュースを見ながら取引しましょう。');
    }

    // リセット（セーブデータを消して最初から）
    document.getElementById('resetGameBtn').addEventListener('click', () => {
        if (!confirm('セーブデータを削除して、資金1,000万円の最初の状態からやり直しますか？\n（資産・取引履歴・実績は消えます。今回の最高資産はランキングに記録されます）')) return;
        recordRunToRanking();
        saveDisabled = true; // 再読み込み時の自動保存で消したデータが復活しないように
        try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 保存不可の環境 */ }
        location.reload();
    });
});
