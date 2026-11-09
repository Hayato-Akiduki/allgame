/**
 * OrderBook Component - リアルタイム板情報（気配値）＆歩み値
 * 本格的なプロ向けターミナル板表示、ワンクリック価格入力対応
 */

class OrderBookComponent {
    constructor(orderBookElId, timeSalesElId, onPriceSelect) {
        this.bookContainer = document.getElementById(orderBookElId);
        this.salesContainer = document.getElementById(timeSalesElId);
        this.onPriceSelect = onPriceSelect; // クリックで発注価格入力
        this.pendingPrice = null;           // 押下時点の価格（押下中に板が再描画されても取りこぼさないため）

        // 板は毎ティック再描画されるため、行ごとではなくコンテナでクリックを受ける（イベント委譲）
        if (this.bookContainer) {
            this.bookContainer.addEventListener('pointerdown', (e) => {
                const row = e.target.closest('.clickable-price');
                this.pendingPrice = row ? parseInt(row.getAttribute('data-price'), 10) : null;
            });
            this.bookContainer.addEventListener('click', (e) => {
                // 押下中に行が差し替わった場合は、押下時点の価格を使う
                const row = e.target.closest('.clickable-price');
                const price = row && row.isConnected
                    ? parseInt(row.getAttribute('data-price'), 10)
                    : this.pendingPrice;
                this.pendingPrice = null;
                if (this.onPriceSelect && Number.isFinite(price)) {
                    this.onPriceSelect(price);
                }
            });
        }
    }

    // 板の表示本数（上下それぞれ3〜8本）。画面の高さが足りない時は本数を減らしてスクロールさせない
    getVisibleLevels() {
        const wrapper = this.bookContainer.parentElement;
        const available = wrapper ? wrapper.clientHeight : 0;
        if (available <= 0) return 8; // 歩み値タブ表示中など、測れない時は最大本数
        const row = this.bookContainer.querySelector('.clickable-price');
        const head = this.bookContainer.querySelector('thead');
        const cp = this.bookContainer.querySelector('.current-price-row');
        const rowH = row ? row.offsetHeight : 22;
        const fixedH = (head ? head.offsetHeight : 24) + (cp ? cp.offsetHeight : 36);
        return Math.max(3, Math.min(8, Math.floor((available - fixedH) / (rowH * 2))));
    }

    render(orderBookData, trades, playerOrders = []) {
        if (!this.bookContainer || !orderBookData) return;

        const { currentPrice, basePrice, highLimit, lowLimit } = orderBookData;
        // 表示領域に収まる本数だけ、現在値に近い気配を表示（現在値が常に中央に見えるように）
        const levels = this.getVisibleLevels();
        const asks = orderBookData.asks.slice(-levels); // 売り板は高い順なので末尾が現在値寄り
        const bids = orderBookData.bids.slice(0, levels);
        const isUp = basePrice ? currentPrice >= basePrice : true;
        const cpClass = basePrice ? (currentPrice > basePrice ? 'text-up' : (currentPrice < basePrice ? 'text-down' : '')) : '';

        // 最大気配株数（ゲージバーの比率用）
        let maxQty = 1000;
        asks.forEach(a => maxQty = Math.max(maxQty, a.qty));
        bids.forEach(b => maxQty = Math.max(maxQty, b.qty));

        // プレイヤーの指値注文を価格別に集計
        const playerBids = {};
        const playerAsks = {};
        playerOrders.forEach(o => {
            if (o.side && o.side.includes('buy')) {
                playerBids[o.price] = (playerBids[o.price] || 0) + o.qty;
            } else if (o.side && o.side.includes('sell')) {
                playerAsks[o.price] = (playerAsks[o.price] || 0) + o.qty;
            }
        });

        // 板のHTML構築
        let html = `
            <table class="orderbook-table">
                <thead>
                    <tr>
                        <th class="col-ask">売気配</th>
                        <th class="col-price">気配値</th>
                        <th class="col-bid">買気配</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // 売り気配（高い順）
        asks.forEach(item => {
            const pct = Math.min(100, (item.qty / maxQty) * 100);
            const myOrderQty = playerAsks[item.price];
            const myOrderBadge = myOrderQty ? `<span class="my-order-tag">自 ${myOrderQty}</span>` : '';
            const isLimit = item.price === highLimit;
            const limitBadge = isLimit ? `<span class="limit-tag">S高</span>` : '';

            html += `
                <tr class="ask-row clickable-price" data-price="${item.price}">
                    <td class="col-ask">
                        <div class="depth-bar ask-bar" style="width: ${pct}%;"></div>
                        <span class="qty-text">${item.qty.toLocaleString()}</span>
                        ${myOrderBadge}
                        ${limitBadge}
                    </td>
                    <td class="col-price text-ask">${item.price.toLocaleString()}</td>
                    <td class="col-bid"></td>
                </tr>
            `;
        });

        // 現在値（スプレッド行）
        html += `
            <tr class="current-price-row">
                <td colspan="3" class="current-price-cell">
                    <span class="cp-label">現在値</span>
                    <span class="cp-value ${cpClass}">${currentPrice.toLocaleString()}</span>
                </td>
            </tr>
        `;

        // 買い気配（高い順、現在値に近い順）
        bids.forEach(item => {
            const pct = Math.min(100, (item.qty / maxQty) * 100);
            const myOrderQty = playerBids[item.price];
            const myOrderBadge = myOrderQty ? `<span class="my-order-tag">自 ${myOrderQty}</span>` : '';
            const isLimit = item.price === lowLimit;
            const limitBadge = isLimit ? `<span class="limit-tag low">S安</span>` : '';

            html += `
                <tr class="bid-row clickable-price" data-price="${item.price}">
                    <td class="col-ask"></td>
                    <td class="col-price text-bid">${item.price.toLocaleString()}</td>
                    <td class="col-bid">
                        <div class="depth-bar bid-bar" style="width: ${pct}%;"></div>
                        <span class="qty-text">${item.qty.toLocaleString()}</span>
                        ${myOrderBadge}
                        ${limitBadge}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        this.bookContainer.innerHTML = html;

        // 歩み値（Time & Sales）の更新
        this.renderTrades(trades);
    }

    renderTrades(trades) {
        if (!this.salesContainer || !trades) return;

        let html = `
            <table class="trades-table">
                <thead>
                    <tr>
                        <th>時刻</th>
                        <th>約定値</th>
                        <th>株数</th>
                    </tr>
                </thead>
                <tbody>
        `;

        trades.slice(0, 15).forEach(t => {
            const colorClass = t.type === 'buy' ? 'text-ask' : 'text-bid';
            html += `
                <tr>
                    <td class="time-col">${t.time}</td>
                    <td class="${colorClass} price-col">${t.price.toLocaleString()}</td>
                    <td class="qty-col">${t.qty.toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        this.salesContainer.innerHTML = html;
    }
}

window.OrderBookComponent = OrderBookComponent;
