// ================================================================
// SAVE/LOAD SYSTEM
// ================================================================
const GAME_DEFS = [
  { id:'memory',    icon:'🧠', title:'神経衰弱',           desc:'ペアを見つけよう！記憶力を鍛える定番カード',      tag:'パズル',    color:'#4d96ff' },
  { id:'reaction',  icon:'⚡', title:'反応速度テスト',     desc:'緑になったら即クリック！反射神経を試せ',           tag:'反射',      color:'#ffd93d' },
  { id:'quiz',      icon:'❓', title:'雑学クイズ',         desc:'全98問の難問からランダム10問！解説を読んで知識を増やそう',           tag:'クイズ',    color:'#6bcb77' },
  { id:'blackjack', icon:'🃏', title:'ブラックジャック',   desc:'21に近い数を目指せ！所持ポイントを賭けよう',       tag:'カード',    color:'#ff6b6b' },
  { id:'solitaire', icon:'♠️', title:'ソリティア',           desc:'1枚めくりのクロンダイク。4組のカードを完成させよう', tag:'カード',    color:'#6bcb77' },
  { id:'hangman',   icon:'🔤', title:'ハングマン',         desc:'隠された単語を当てろ！失敗は6回まで',             tag:'言葉',      color:'#c77dff' },
  { id:'slide',     icon:'🔢', title:'スライドパズル',     desc:'数字を合わせて2048を目指すパズル！',               tag:'パズル',    color:'#ff9de2' },
  { id:'roulette',  icon:'🎡', title:'ルーレット',         desc:'ポイントを賭けてルーレットを回そう',               tag:'運',        color:'#ff6b6b' },
  { id:'shiritori', icon:'🗣️', title:'しりとり',          desc:'10秒制限！AIとしりとり対決しよう',                tag:'言葉',      color:'#6bcb77' },
  { id:'tetris',    icon:'🧱', title:'テトリス',           desc:'落ちてくるブロックを積んでラインを消せ！',         tag:'パズル',    color:'#ffd93d' },
  { id:'breakout',  icon:'🏓', title:'ブロック崩し',       desc:'パドルでボールを操りブロックを全部壊せ！',         tag:'アクション',color:'#ff9de2' },
  { id:'monster',   icon:'⚔️', title:'モンスター討伐',    desc:'敵を倒してレベルアップしよう',         tag:'RPG',       color:'#ff6b6b' },
  { id:'runner',    icon:'🏃', title:'ランナー',          desc:'障害物をジャンプで避けて走り続けろ！横スクロール',  tag:'アクション',color:'#6bcb77' },
  { id:'shooting',    icon:'🛸', title:'スペースシューター', desc:'迫り来る敵を撃ち落とせ！スマホ/PC対応', tag:'アクション', color:'#4d96ff' },
  { id:'minesweeper', icon:'💣', title:'マインスイーパー',   desc:'地雷を避けて安全なマスを全て開けよう', tag:'パズル', color:'#ff6b6b' },
  { id:'slot',        icon:'🎰', title:'スロット',          desc:'3つのリールを揃えてポイントを稼げ！',           tag:'運',        color:'#ffd93d' },
  { id:'pinball',     icon:'🟣', title:'ピンボール',        desc:'宇宙の盤面で狙い撃ち！レーンとミッションで高得点', tag:'アクション', color:'#ff9de2' },
  { id:'snake',       icon:'🐍', title:'Snake',             desc:'エサを食べて伸び続けろ！壁と自分の体に注意',          tag:'アーケード', color:'#6bcb77' },
  { id:'aimtrainer',  icon:'🎯', title:'エイム練習',        desc:'FPS風エイムトレーナー！精度・速度・連続ヒットを鍛えよう', tag:'アクション', color:'#ff6b6b' },
  { id:'simon',       icon:'🎵', title:'サイモンゲーム',      desc:'光るボタンの順番を覚えて、どこまで再現できるか挑戦！',       tag:'記憶',       color:'#4d96ff' },
  { id:'typing',      icon:'⌨️', title:'タイピングラッシュ',  desc:'30秒で英単語を次々入力！正確さとコンボで高得点を狙え',       tag:'言葉',       color:'#6bcb77' },
  { id:'sokoban',     icon:'📦', title:'倉庫番',              desc:'箱を押してすべてのゴールへ！12の倉庫を攻略しよう',            tag:'パズル',     color:'#ffd93d' },
  { id:'reversi',     icon:'🟢', title:'リバーシ',            desc:'石を挟んでひっくり返せ！CPU戦と2人対戦に対応',                 tag:'ボード',     color:'#6bcb77' },
  { id:'lightsout',   icon:'💡', title:'ライツアウト',        desc:'押したマスと上下左右が反転！すべてのライトを消そう',           tag:'パズル',     color:'#ffd93d' },
  { id:'pong',        icon:'🏓', title:'Pong',                 desc:'パドルを操ってCPUと対戦！ラリーを続けて7点先取を目指せ',        tag:'アーケード', color:'#4d96ff' },
  { id:'fighter',     icon:'🥊', title:'ミニ格闘アリーナ',       desc:'攻撃・ガード・ジャンプを使い分けてCPUをKOしよう！',              tag:'アクション', color:'#ff6b6b' },
];
GAME_DEFS.push({id:'watersort',icon:'🧪',title:'ウォーターソート',desc:'液体を移して同じ色を集めよう！時間制限なしの整理パズル',tag:'パズル',color:'#47c9dc'});
GAME_DEFS.push(
  {id:'pinpull',icon:'🗝️',title:'ピン抜きパズル',desc:'水で溶岩を冷やして宝物を届けよう！抜く順番がカギ',tag:'パズル',color:'#ffd93d'},
  {id:'gaterunner',icon:'👥',title:'数字ゲートランナー',desc:'人数を暗算して得なゲートを選び、最後のボスを突破しよう！',tag:'アクション',color:'#47c9dc'}
);
GAME_DEFS.push(
  {id:'fruitmerge',icon:'🍉',title:'フルーツマージ',desc:'同じフルーツをぶつけて進化させよう！巨大スイカを目指す落下パズル',tag:'パズル',color:'#ff6b6b'},
  {id:'whackamole',icon:'🔨',title:'モグラたたきラッシュ',desc:'黄金モグラを狙い撃ち！爆弾を避けてコンボとフィーバーで稼ごう',tag:'反射',color:'#ffd93d'},
  {id:'blockpuzzle',icon:'🧩',title:'ナンバーブロック',desc:'8×8盤面に3つのブロックを配置して縦横ラインを一気に消去！',tag:'パズル',color:'#4d96ff'},
  {id:'highlow',icon:'🃏',title:'ハイ＆ロー・ストリーク',desc:'次のカードがHIGHかLOWか予想！連勝を伸ばすかドロップするか選べ',tag:'カード',color:'#c77dff'},
  {id:'hitblow',icon:'🔍',title:'ヒット＆ブロー',desc:'隠された数字を推理！3桁・4桁モードで「ヒット」と「ブロー」から答えを絞り込もう',tag:'パズル',color:'#47c9dc'}
);
const GAME_RULES = {
  hitblow:{goal:'0〜9の重複しない数字でできた3桁（または4桁）の答えを当てます。',controls:'数字キーで予想を入力して「決定」。キーボードの0〜9・Backspace・Enterも使えます。下のメモで数字に✕や○を付けて整理できます。',score:'数字と位置が合えば「ヒット」、数字だけ合えば「ブロー」。3桁は10回、4桁は12回以内に当てるとクリア。少ない回数ほど高得点で、4桁は3桁の2倍です。'},
  fruitmerge:{goal:'同じフルーツ同士をぶつけて合体させ、より大きなフルーツ（スイカ🍉）とハイスコアを目指します。',controls:'画面の左右ドラッグ／タップ、マウス移動＋クリック、または←→／A・DキーとSpace／Enterで落とします。',score:'合体するほど高得点。300点以上（またはスイカ完成）で勝利扱いとなり、いつでも「精算して終了」で記録できます。'},
  whackamole:{goal:'30秒間で穴から出るモグラをできるだけ多く叩きます。',controls:'穴をタップ／クリック、またはキーボードの1〜9キーで叩きます。💣爆弾を叩くと減点＆コンボリセット！',score:'通常モグラ20点、👑黄金モグラ60点＋残り時間延長。連続ヒットでコンボ倍率が上がり、350点以上で勝利です。'},
  blockpuzzle:{goal:'配られる3つのブロックを8×8盤面に置き、縦または横の1列を揃えて消します。',controls:'下のピースを選んでから盤面のマスをタップ／クリックします。1試合につき1回「ピース入替」が使えます。',score:'配置点＋ライン消去ボーナス（複数列同時消しで大幅アップ）。置ける場所がなくなると終了し、300点以上で勝利です。'},
  highlow:{goal:'場に出ているトランプ（A＝1〜K＝13）より、次のカードが大きいか小さいかを連続で当てます。',controls:'「▲ HIGH」「▼ LOW」「🎯 SAME（同数・4倍ボーナス）」を選びます。3連勝以上から「💰 ドロップ」で勝利確定も可能！',score:'連勝するほど獲得スコアが倍増。1回だけミスを防ぐシールド付き。3連勝以上のドロップまたは10連勝完走で勝利です。'},
  pinpull:{goal:'全12ステージで、宝物をすべて探検家に届けます。',controls:'番号の付いたピンをタップして抜きます。水1で溶岩1を冷やせます。溶岩が探検家や宝物に触れると失敗。一手戻す・やり直す・ヒント付きです。',score:'時間制限なし。全ステージで250点を基本に、失敗1回につき15点、ヒント1回につき10点減点。最低80点です。'},
  gaterunner:{goal:'区間ごとに、今の人数で両方のゲートを計算して多く残る方を選び、最後のボスを倒します。コースとボスの人数は毎回変わり、ボスは全区間で最善を選んだ人数の7割です。',controls:'画面の左右ボタン、コースのタップ・ドラッグ、←→／A・Dキーでレーンを選びます。2段のゲートは上から順に計算し、割り算と×1.5は切り捨てです。敵の人数分だけ仲間が減ります。',score:'クリア時は180点＋生き残った人数。人数が0になると終了し、通過した区間に応じた得点になります。'},
  sudoku:{goal:'縦・横・太線の3×3の枠に、1〜9を重複しないように入れます。',controls:'マスを選び、数字ボタンかキーボードで入力。メモ・消去・一手戻す・ヒントが使えます。',score:'時間制限なし。完成でクリア。通常200点、やさしい140点を基本に、ヒント1回につき10点減点します。'},
  minigolf:{goal:'全3ホールでボールをカップに入れます。',controls:'ボールを引っぱって離すと、引いた方向と逆にショット。角度と強さのスライダーでも操作できます。',score:'時間制限や打数制限はありません。少ない打数で全ホールを回るほど高得点です。'},
  watersort:{goal:'すべての容器を空、または同じ色4つで満たします。',controls:'移す元、移す先の順にタップ。同じ色の上か空の容器に注げます。一手戻す・やり直すが使えます。',score:'全12ステージでクリア。後半ほど色と容器が増えます。時間制限はなく、少ない手数ほど高得点です。'},
  memory:{goal:'同じ絵柄のカードをすべて見つけます。',controls:'カードをクリック／タップして2枚ずつめくります。',score:'少ない手数ほど高得点。最低50ptです。'},
  reaction:{goal:'合図が出てから、できるだけ早く反応します。',controls:'「今！」と表示された瞬間にエリアをクリック／タップします。合図前はフライングです。',score:'5回の平均反応時間からスコアを計算します。'},
  quiz:{goal:'歴史・科学・漢字・言葉の本来の意味・ネット文化などの難問98問から、ランダムな10問に挑戦する4択クイズです。',controls:'回答後に正解と解説を確認し、「次の問題へ」で進みます。時間制限はありません。',score:'1問15点、最大150点。7問以上正解で勝利です。'},
  blackjack:{goal:'カードの合計を21に近づけ、ディーラーを上回ります。',controls:'ヒットでカード追加、スタンドで勝負します。Aは1または11として扱われます。',score:'勝利でベット額を獲得、敗北でベット額を失います。同点は引き分けです。'},
  solitaire:{goal:'すべてのカードを、スート別にAからKの順で4つの組札へ移します。',controls:'カードを選び、移動先を押します。場札の裏カードや山札を押すとめくれます。選択中のカードをもう一度押すと解除します。',score:'クリア時、短い時間・少ない手数ほど高得点です。「ヒント」も利用できます。'},
  hangman:{goal:'ヒントを頼りに隠された英単語を完成させます。',controls:'画面のアルファベットを選択します。',score:'6回間違える前に完成すると勝利。残り回数が多いほど高得点です。'},
  slide:{goal:'同じ数字を合わせて「2048」を作ります。',controls:'方向キー、盤面スワイプ、または画面の矢印ボタンで全タイルを移動します。3回まで1手戻せます。',score:'結合した数字が加算されます。256タイル以上または1,000点以上で勝利判定になります。'},
  roulette:{goal:'赤・黒・緑から停止する色を予想します。',controls:'色とベット額を選んでスピンします。',score:'赤・黒は的中でベット額分、緑は17倍分を獲得します。現実のお金は使用しません。'},
  shiritori:{goal:'CPUと交互に、直前の末尾文字から始まる言葉を答えます。',controls:'10秒以内に言葉を入力して送信します。',score:'「ん」で終わる、時間切れ、使用済み単語で敗北。継続ターン数で得点します。'},
  tetris:{goal:'ブロックを横一列に揃えて消し続けます。',controls:'←→移動、↑回転、↓落下、Spaceでハードドロップ、C／Shiftでホールド。画面ボタン・スワイプにも対応します。',score:'同時に消したラインが多いほど高得点。上まで積み上がると終了です。'},
  breakout:{goal:'ボールを落とさず、すべてのブロックを壊します。',controls:'マウスまたは指でパドルを移動し、クリックで開始します。',score:'ブロック破壊で加点。全破壊で次レベルへ進み、ボールが速くなります。'},
  monster:{goal:'連続するモンスターを倒し、より高いステージを目指します。',controls:'攻撃・魔法・シールド・回復スキルを選びます。スキルにはMPを消費します。',score:'敵撃破で得点。敵は瀕死で凶暴化し、4行動ごとに強攻撃を使います。'},
  runner:{goal:'障害物を避けて、できるだけ長く走ります。',controls:'Space、↑、クリック、タップでジャンプ。空中でもう一度押すと2段ジャンプします。',score:'走行距離がそのままスコアになります。衝突すると終了です。'},
  shooting:{goal:'敵に接触せず、迫ってくる宇宙船を撃破します。',controls:'PCは方向キー、スマホはドラッグで移動。射撃は自動です。',score:'敵1体につき5pt。敵との接触で終了します。'},
  minesweeper:{goal:'地雷以外のすべてのマスを開きます。',controls:'開くモードと旗モード切替、長押し旗立て、開いた数字マスクリックでの周囲一括オープンに対応。',score:'安全なマスをすべて開くと難易度に応じたスコア（300〜650pt）を獲得します。'},
  slot:{goal:'3つのリールを止めて絵柄を揃えます。',controls:'ベット後にスピンし、STOPを1つずつ押します。',score:'絵柄に応じた倍率で払い戻されます。ベットを超える配当で勝利扱いです。'},
  pinball:{goal:'3球でバンパー・レーン・4つのターゲットを狙う宇宙ピンボールです。',controls:'←→またはZ・M、左右ボタンで操作。Spaceか発射ボタンで打ち出します。発射後12秒またはその球が無得点なら落下を救済します。',score:'バンパー100点、ターゲット150点、上部レーン250点。4つのターゲットを点灯すると1,000点です。'},
  snake:{goal:'エサを食べてヘビを長く成長させます。',controls:'方向キー、画面ボタン、スマホのスワイプで方向転換します。',score:'エサ1個につき10点。壁または自分の体との衝突で終了します。'},
  aimtrainer:{goal:'複数のモードで照準の速さと正確さを鍛えます。',controls:'マウス移動とクリック、またはスマホのタップでターゲットを撃ちます。',score:'命中、反応速度、コンボから得点を計算し、結果画面で命中率も確認できます。'},
  simon:{goal:'毎ラウンド長くなる光の順番を記憶し、同じ順番で再現します。',controls:'4色のボタンをクリック／タップします。PCでは1〜4キーでも入力できます。',score:'1入力10ptにラウンドボーナスを加算。ラウンド12を再現すると完全クリアです。'},
  typing:{goal:'30秒間に表示される英単語をできるだけ多く入力します。',controls:'難易度を選び、表示と同じ単語をキーボードで入力します。単語が完成すると自動で次へ進みます。',score:'文字数、難易度、連続正解で加点。500点以上で勝利となり、正確率も結果に表示されます。'},
  sokoban:{goal:'箱を押して、すべての黄色いゴールに載せながら12ステージを攻略します。',controls:'方向キー／WASD、画面の矢印、盤面スワイプで移動します。「1手戻す」とステージのリセットも使えます。',score:'少ない移動・箱押しでクリアするほど高得点。全12ステージ攻略で勝利です。'},
  reversi:{goal:'相手の石を自分の石で挟んで裏返し、最終的に多くの石を残します。',controls:'光る印があるマスをクリック／タップして石を置きます。CPU対戦ではあなたが黒です。',score:'両者が置けなくなると終了。黒の勝利時は石数差に応じて得点します。'},
  lightsout:{goal:'点灯しているライトをすべて消します。',controls:'マスをクリック／タップすると、そのマスと上下左右の点灯状態が反転します。1手戻す・リセットも利用できます。',score:'少ない手数ほど高得点。盤面が大きい難易度ほど基本点が高くなります。'},
  pong:{goal:'ボールを打ち返してCPUより先に7点を獲得します。',controls:'W／Sまたは↑／↓キーで移動。マウスや指ではキャンバス上を上下に動かします。',score:'打ち返すたびにラリー得点が増加。7点先取で勝利し、難易度ボーナスも加算されます。'},
  fighter:{goal:'制限時間内にCPUの体力を0にしてKOします。',controls:'A／Dで移動、Wでジャンプ、Jで弱攻撃、Kで強攻撃、Lでガード。画面ボタンにも対応します。',score:'命中・残り体力・残り時間・難易度から得点を計算。時間切れ時は残り体力が多い側の勝利です。'}
};

function openRules(focusId=''){
  const modal=document.getElementById('rules-modal'),search=document.getElementById('rules-search');search.value='';modal.classList.add('open');renderRules('');
  if(focusId)requestAnimationFrame(()=>document.getElementById(`rule-${focusId}`)?.scrollIntoView({block:'center'}));else gameDelay(()=>search.focus(),50);
}
function closeRules(){document.getElementById('rules-modal').classList.remove('open');}
function renderRules(query=''){
  const q=query.trim().toLocaleLowerCase('ja'),grid=document.getElementById('rules-grid');
  const list=GAME_DEFS.filter(g=>`${g.title} ${g.tag} ${g.desc} ${Object.values(GAME_RULES[g.id]||{}).join(' ')}`.toLocaleLowerCase('ja').includes(q));
  grid.innerHTML=list.length?list.map(g=>{const r=GAME_RULES[g.id]||{goal:g.desc,controls:'画面の案内に従って操作します。',score:'結果画面で確認できます。'};const playingThis=document.body.classList.contains('playing-game')&&activeGameId===g.id;return `<article class="rule-card" id="rule-${g.id}"><div class="rule-card-head"><span class="rule-card-icon">${g.icon}</span><div><h3>${escapeHtml(g.title)}</h3><div class="rule-tag">${escapeHtml(g.tag)}</div></div></div><div class="rule-section"><strong>目的：</strong>${escapeHtml(r.goal)}</div><div class="rule-section"><strong>操作：</strong>${escapeHtml(r.controls)}</div><div class="rule-section"><strong>勝敗・得点：</strong>${escapeHtml(r.score)}</div><button class="btn btn-sm mt" onclick="closeRules();${playingThis?'':`startGame('${g.id}')`}">${playingThis?'ゲームに戻る':'このゲームを遊ぶ'}</button></article>`;}).join(''):'<div class="rules-empty">該当するゲームがありません</div>';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeRules();closeProfile();closeBgm();}});
// === ここから差し替え ===(gemini2回目)
const BASE_NAMES = ['ビギナー', 'アマチュア', 'プレイヤー', 'にゃんこ', 'プロ', 'マスター', 'グランドマスター', 'レジェンド', '神', 'ゲーム神'];
// 11〜99レベル用の接頭辞（10レベルごとに切り替わる）
const TIERS = ['超', '超絶', '極', '絶', '幻', '覇王', '魔王', '超越', '星'];
const ASCENSION_TIERS = ['星界', '銀河', '宇宙', '次元', '時空', '神話', '創世', '無限', '永劫'];
const MAX_LEVEL = 1000;

// 1000レベルまでの名前を自動生成する関数
function getLvName(lv) {
  if (lv >= MAX_LEVEL) return '👑 永劫のゲーム神 (MAX)';
  if (lv <= 10) return BASE_NAMES[lv - 1];
  if (lv >= 100) {
    const tierIdx=Math.min(ASCENSION_TIERS.length-1,Math.floor((lv-100)/100));
    const within=(lv-100)%100, rank=BASE_NAMES[Math.min(9,Math.floor(within/10))];
    return `${ASCENSION_TIERS[tierIdx]}の${rank} ${within%10+1}`;
  }
  // 11〜99レベルは接頭辞＋数字で自動生成（例: 野獣 1、覇王 9）
  const tierIdx = Math.floor((lv - 11) / 10); // 10レベルごとの区切り
  const subLv = BASE_NAMES[(lv - 11) % 10];
  const tierName = TIERS[tierIdx] || '未知';
  return `${tierName} ${subLv}`;
}

// 1000レベルまでの必要XP。Lv.100以降は緩やかな長期成長にする
function getXpNeeded(lv) {
  const TABLE = [100, 200, 350, 550, 800, 1100, 1500, 2000, 2700, 3500];
  if (lv <= 10) return TABLE[lv - 1];
  if (lv >= MAX_LEVEL) return 0;
  if (lv >= 100) return 312830 + (lv-99)*2500 + Math.floor(Math.pow(lv-99,1.35)*120);
  return 3500 + (lv - 10) * 800 + Math.floor(Math.pow(lv - 10, 2) * 30);
}

// レベルに応じたXP獲得倍率を計算する関数
function getXpMult(lv) {
  const TABLE = [1.0, 1.0, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0, 2.5, 3.0];
  if (lv <= 10) return TABLE[lv - 1];
  if (lv >= MAX_LEVEL) return 0;
  if (lv < 100) return Math.min(10.0, 3.0 + (lv - 10) * 0.08);
  return Math.min(25,10+(lv-100)*(15/900));
}

const DAILY_MISSIONS = [
  {id:'play3', label:'3種類のゲームをプレイ', key:'uniqueGames', target:3, reward:80},
  {id:'win2', label:'2回勝利する', key:'wins', target:2, reward:120},
  {id:'score300', label:'ゲーム報酬を合計150pt獲得', key:'score', target:150, reward:150},
];
const ACHIEVEMENTS = [
  {id:'first_play', icon:'🎮', name:'ゲームスタート', desc:'初めてゲームを遊ぶ', reward:30, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+(g.plays||0),0)>=1},
  {id:'plays10', icon:'🕹️', name:'遊び盛り', desc:'合計10回プレイする', reward:100, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+(g.plays||0),0)>=10},
  {id:'plays50', icon:'🎪', name:'ゲームランド常連', desc:'合計50回プレイする', reward:300, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+(g.plays||0),0)>=50},
  {id:'plays200', icon:'🏟️', name:'伝説の常連', desc:'合計200回プレイする', reward:1000, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+(g.plays||0),0)>=200},
  {id:'first_win', icon:'🌱', name:'はじめの一勝', desc:'初めて勝利する', reward:50, test:s=>s.wins>=1},
  {id:'wins10', icon:'🏆', name:'勝利の常連', desc:'10回勝利する', reward:150, test:s=>s.wins>=10},
  {id:'wins25', icon:'🥇', name:'勝利コレクター', desc:'25回勝利する', reward:350, test:s=>s.wins>=25},
  {id:'wins100', icon:'🏰', name:'百戦錬磨', desc:'100回勝利する', reward:1200, test:s=>s.wins>=100},
  {id:'explorer5', icon:'🧭', name:'ゲーム探検家', desc:'5種類のゲームを遊ぶ', reward:200, test:s=>Object.keys(s.gameStats||{}).length>=5},
  {id:'explorer15', icon:'🗺️', name:'ジャンル横断者', desc:'15種類のゲームを遊ぶ', reward:500, test:s=>Object.keys(s.gameStats||{}).length>=15},
  {id:'explorer25', icon:'🚀', name:'大冒険家', desc:'25種類のゲームを遊ぶ', reward:900, test:s=>Object.keys(s.gameStats||{}).length>=25},
  {id:'explorer_all', icon:'🌍', name:'全ゲーム制覇への道', desc:'すべてのゲームを遊ぶ', reward:1500, test:s=>GAME_DEFS.every(g=>(s.gameStats?.[g.id]?.plays||0)>0)},
  {id:'score1000', icon:'💰', name:'ポイント長者', desc:'累計1,000ptを稼ぐ', reward:250, test:s=>(s.pointsEarned||0)>=1000},
  {id:'score5000', icon:'💎', name:'ポイント富豪', desc:'累計5,000ptを稼ぐ', reward:600, test:s=>(s.pointsEarned||0)>=5000},
  {id:'score20000', icon:'👛', name:'ポイント王', desc:'累計20,000ptを稼ぐ', reward:1800, test:s=>(s.pointsEarned||0)>=20000},
  {id:'streak3', icon:'🔥', name:'連勝開始', desc:'3連勝する', reward:120, test:s=>s.streak>=3},
  {id:'streak5', icon:'🚀', name:'止まらない5連勝', desc:'5連勝する', reward:300, test:s=>s.streak>=5},
  {id:'streak10', icon:'⚡', name:'無敗の10連勝', desc:'10連勝する', reward:800, test:s=>s.streak>=10},
  {id:'level10', icon:'👑', name:'熟練プレイヤー', desc:'レベル10に到達する', reward:500, test:s=>s.level>=10},
  {id:'level100', icon:'🌟', name:'星界への到達者', desc:'レベル100に到達する', reward:2000, test:s=>s.level>=100},
  {id:'level500', icon:'🌌', name:'次元の超越者', desc:'レベル500に到達する', reward:5000, test:s=>s.level>=500},
  {id:'level1000', icon:'♾️', name:'永劫のゲーム神', desc:'最高レベルに到達する', reward:10000, test:s=>s.level>=MAX_LEVEL},
  {id:'mastery10', icon:'⭐', name:'多才なゲーマー', desc:'マスタリーレベル合計10', reward:300, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+([150,400,850,1500,2500].filter(x=>(g.masteryXp||0)>=x).length),0)>=10},
  {id:'mastery30', icon:'🌠', name:'マスタリー職人', desc:'マスタリーレベル合計30', reward:900, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+([150,400,850,1500,2500].filter(x=>(g.masteryXp||0)>=x).length),0)>=30},
  {id:'mastery60', icon:'💫', name:'グランドマスターへの道', desc:'マスタリーレベル合計60', reward:2000, test:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+([150,400,850,1500,2500].filter(x=>(g.masteryXp||0)>=x).length),0)>=60},
  {id:'challenge1', icon:'🎯', name:'最初の挑戦', desc:'ランダム挑戦を1回達成する', reward:100, test:s=>(s.challengeClears||0)>=1},
  {id:'challenge5', icon:'🎲', name:'挑戦者', desc:'ランダム挑戦を5回達成する', reward:250, test:s=>(s.challengeClears||0)>=5},
  {id:'challenge20', icon:'🏅', name:'挑戦の達人', desc:'ランダム挑戦を20回達成する', reward:1000, test:s=>(s.challengeClears||0)>=20},
  {id:'themes3', icon:'🎨', name:'着せ替え好き', desc:'テーマを3種類所有する', reward:300, test:s=>(s.ownedThemes||[]).length>=3},
  {id:'themes6', icon:'🌈', name:'カラーコーディネーター', desc:'テーマを6種類所有する', reward:700, test:s=>(s.ownedThemes||[]).length>=6},
  {id:'avatars5', icon:'😎', name:'アイコンコレクター', desc:'アイコンを5種類所有する', reward:250, test:s=>(s.ownedAvatars||[]).length>=5},
  {id:'avatars15', icon:'🎭', name:'スターアイコンズ', desc:'アイコンを15種類所有する', reward:600, test:s=>(s.ownedAvatars||[]).length>=15},
  {id:'avatars_all', icon:'🪞', name:'七変化', desc:'すべてのアイコンを所有する', reward:1500, test:s=>(s.ownedAvatars||[]).length>=AVATAR_ITEMS.length},
  {id:'gacha10', icon:'🎁', name:'ガチャ愛好家', desc:'コレクションガチャを累計10回引く', reward:300, test:s=>(s.gachaDraws||0)>=10},
  {id:'bgm3', icon:'🎧', name:'サウンドコレクター', desc:'BGMガチャで3曲以上入手する', reward:400, test:s=>(s.ownedBgm||[]).length>=3},
];
// Progress shown on the achievement list. ACH_GOALS maps each achievement to [metric, goal].
const ACH_METRICS={
  plays:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+(g.plays||0),0),
  wins:s=>s.wins||0,
  games:s=>Object.keys(s.gameStats||{}).length,
  allGames:s=>GAME_DEFS.filter(g=>(s.gameStats?.[g.id]?.plays||0)>0).length,
  points:s=>s.pointsEarned||0,
  streak:s=>s.streak||0,
  level:s=>s.level||1,
  mastery:s=>Object.values(s.gameStats||{}).reduce((n,g)=>n+([150,400,850,1500,2500].filter(x=>(g.masteryXp||0)>=x).length),0),
  challenge:s=>s.challengeClears||0,
  themes:s=>(s.ownedThemes||[]).length,
  avatars:s=>(s.ownedAvatars||[]).length,
  gacha:s=>s.gachaDraws||0,
  bgm:s=>(s.ownedBgm||[]).length,
};
const ACH_GOALS={first_play:['plays',1],plays10:['plays',10],plays50:['plays',50],plays200:['plays',200],first_win:['wins',1],wins10:['wins',10],wins25:['wins',25],wins100:['wins',100],explorer5:['games',5],explorer15:['games',15],explorer25:['games',25],explorer_all:['allGames',()=>GAME_DEFS.length],score1000:['points',1000],score5000:['points',5000],score20000:['points',20000],streak3:['streak',3],streak5:['streak',5],streak10:['streak',10],level10:['level',10],level100:['level',100],level500:['level',500],level1000:['level',()=>MAX_LEVEL],mastery10:['mastery',10],mastery30:['mastery',30],mastery60:['mastery',60],challenge1:['challenge',1],challenge5:['challenge',5],challenge20:['challenge',20],themes3:['themes',3],themes6:['themes',6],avatars5:['avatars',5],avatars15:['avatars',15],avatars_all:['avatars',()=>AVATAR_ITEMS.length],gacha10:['gacha',10],bgm3:['bgm',3]};
const ACH_HINTS={plays:'どのゲームでも1回遊ぶごとにカウント',wins:'ゲームで勝利・クリアするとカウント',games:'まだ遊んでいないゲームに挑戦しよう',allGames:'まだ遊んでいないゲームに挑戦しよう',points:'ゲーム報酬・ミッション・実績などで稼いだ累計（使っても減りません）',streak:'負けると連勝数がリセットされます',level:'ゲームで経験値（XP）を貯めてレベルアップ',mastery:'同じゲームを遊ぶとマスタリーが上がります（1ゲーム最大Lv.5）',challenge:'ミッションの「挑戦」タブのお題を達成',themes:'ショップで購入、またはガチャで入手',avatars:'ショップで購入、またはガチャで入手',gacha:'コレクションガチャを引く',bgm:'BGMガチャで曲を入手'};
function achievementProgress(a,s){const g=ACH_GOALS[a.id];if(!g)return null;const goal=typeof g[1]==='function'?g[1]():g[1];return{cur:Math.min(ACH_METRICS[g[0]](s),goal),goal,hint:ACH_HINTS[g[0]]};}
let achievementFilter='all';
function setAchievementFilter(f){if(!['all','locked','unlocked'].includes(f))return;achievementFilter=f;renderAchievementList();}
function renderAchievementList(){
  const achEl=document.getElementById('achievement-list');if(!achEl)return;
  const owned=new Set(saveData.achievements);
  const list=ACHIEVEMENTS.filter(a=>achievementFilter==='all'||(achievementFilter==='unlocked')===owned.has(a.id));
  achEl.innerHTML=list.length?list.map(a=>{const done=owned.has(a.id),p=achievementProgress(a,saveData);
    return `<div class="achievement-badge ${done?'unlocked':''}"><div class="achievement-head"><span class="achievement-icon" aria-hidden="true">${a.icon}</span><strong>${escapeHtml(a.name)}</strong><span class="mission-reward">${done?'✅ 解除済':'+'+a.reward.toLocaleString()+'pt'}</span></div><div class="achievement-desc">解除条件：${escapeHtml(a.desc)}</div>${p&&!done?`<div class="mission-progress"><span style="width:${p.cur/p.goal*100}%"></span></div><div class="achievement-meta"><span>${p.cur.toLocaleString()} / ${p.goal.toLocaleString()}</span><span>💡 ${escapeHtml(p.hint)}</span></div>`:''}</div>`;}).join(''):'<div class="meta-sub" style="padding:12px 0;text-align:center">該当する実績はありません</div>';
  document.querySelectorAll('[data-ach-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.achFilter===achievementFilter)));
  const countEl=document.getElementById('achievement-count');if(countEl)countEl.textContent=`解除 ${saveData.achievements.length} / ${ACHIEVEMENTS.length}`;
}
const THEMES = {
  default:{name:'ミッドナイト',desc:'落ち着いた定番テーマ',price:0,colors:['#ff6b6b','#ffd93d','#4d96ff'],vars:{'--bg':'#0f0e17','--surface':'#1a1828','--surface2':'#252336','--accent1':'#ff6b6b','--accent2':'#ffd93d','--accent3':'#6bcb77','--accent4':'#4d96ff','--accent5':'#c77dff'}},
  ocean:{name:'ディープオーシャン',desc:'深海をイメージしたブルー',price:500,colors:['#00b4d8','#90e0ef','#0077b6'],vars:{'--bg':'#061923','--surface':'#0b2735','--surface2':'#12394a','--accent1':'#ff708d','--accent2':'#90e0ef','--accent3':'#56d8a6','--accent4':'#00b4d8','--accent5':'#7b9cff'}},
  forest:{name:'フォレストキャンプ',desc:'自然を感じる深緑と若葉色',price:800,colors:['#80ed99','#57cc99','#22577a'],vars:{'--bg':'#071a14','--surface':'#102a20','--surface2':'#193d2d','--accent1':'#ff7b7b','--accent2':'#c7f9cc','--accent3':'#80ed99','--accent4':'#38a3a5','--accent5':'#57cc99'}},
  sunset:{name:'サンセット',desc:'夕焼け色のあたたかいテーマ',price:1200,colors:['#ff6b6b','#ffb347','#9b5de5'],vars:{'--bg':'#21111b','--surface':'#321827','--surface2':'#462238','--accent1':'#ff6b6b','--accent2':'#ffb347','--accent3':'#74d680','--accent4':'#f15bb5','--accent5':'#9b5de5'}},
  sakura:{name:'サクラミルク',desc:'桜とミルクを合わせた柔らかな配色',price:1600,colors:['#ffafcc','#ffc8dd','#bde0fe'],vars:{'--bg':'#24151d','--surface':'#38232e','--surface2':'#4b3040','--accent1':'#ff8fab','--accent2':'#ffc8dd','--accent3':'#a8e6cf','--accent4':'#bde0fe','--accent5':'#cdb4db'}},
  cyber:{name:'サイバーパンク',desc:'近未来の電脳都市をイメージした高彩度テーマ',price:2000,colors:['#ff2a85','#00f0ff','#fcee09'],vars:{'--bg':'#070510','--surface':'#140c24','--surface2':'#22153b','--accent1':'#ff2a85','--accent2':'#fcee09','--accent3':'#00f59b','--accent4':'#00f0ff','--accent5':'#b829ff'}},
  neon:{name:'ネオンアーケード',desc:'光るゲームセンターのネオンカラー',price:2500,colors:['#00f5d4','#fee440','#f15bb5'],vars:{'--bg':'#080812','--surface':'#121225','--surface2':'#20203a','--accent1':'#f15bb5','--accent2':'#fee440','--accent3':'#00f5d4','--accent4':'#00bbf9','--accent5':'#9b5de5'}},
  retro:{name:'レトロピクセル',desc:'懐かしの携帯ゲーム機風グリーン＆アンバー配色',price:3200,colors:['#9bbc0f','#8bac0f','#306230'],vars:{'--bg':'#0f1f0f','--surface':'#193019','--surface2':'#254425','--accent1':'#ff8c42','--accent2':'#c7f064','--accent3':'#8bac0f','--accent4':'#57a773','--accent5':'#9bbc0f'}},
  royal:{name:'ロイヤルパープル',desc:'王冠を思わせる紫と金の配色',price:3800,colors:['#ffd60a','#9d4edd','#5a189a'],vars:{'--bg':'#12091d','--surface':'#211033','--surface2':'#351852','--accent1':'#ff758f','--accent2':'#ffd60a','--accent3':'#72efdd','--accent4':'#7b2cbf','--accent5':'#c77dff'}},
  mono:{name:'モノクローム',desc:'白とグレーでまとめた硬派なテーマ',price:5000,colors:['#ffffff','#adb5bd','#495057'],vars:{'--bg':'#0b0c0d','--surface':'#191b1d','--surface2':'#292c2f','--accent1':'#f07178','--accent2':'#f8f9fa','--accent3':'#adb5bd','--accent4':'#6c757d','--accent5':'#dee2e6'}},
  crystal:{name:'クリスタルパレス',desc:'氷の宮殿のように透き通るシルバー＆シアンテーマ',price:6000,colors:['#a5f3fc','#38bdf8','#c084fc'],vars:{'--bg':'#07131e','--surface':'#0f2437','--surface2':'#183650','--accent1':'#fb7185','--accent2':'#fde047','--accent3':'#34d399','--accent4':'#38bdf8','--accent5':'#c084fc'}},
  candy:{name:'キャンディポップ',desc:'お菓子のように明るいカラフル配色',price:7000,colors:['#ff70a6','#ff9770','#70d6ff'],vars:{'--bg':'#1b1020','--surface':'#2d1836','--surface2':'#43234f','--accent1':'#ff70a6','--accent2':'#ffd670','--accent3':'#70e000','--accent4':'#70d6ff','--accent5':'#e76bf3'}},
  galaxy:{name:'ギャラクシー',desc:'最高ランクの宇宙テーマ',price:10000,colors:['#7b2cbf','#4cc9f0','#f72585'],vars:{'--bg':'#050510','--surface':'#10102a','--surface2':'#1b1b44','--accent1':'#f72585','--accent2':'#4cc9f0','--accent3':'#72efdd','--accent4':'#4361ee','--accent5':'#b5179e'}},
  gachaAurora:{name:'オーロラドリーム',desc:'ガチャ限定の幻想的な光のテーマ',price:0,gachaOnly:true,colors:['#80ffdb','#72efdd','#c77dff'],vars:{'--bg':'#07151b','--surface':'#102630','--surface2':'#193a45','--accent1':'#ff8fab','--accent2':'#80ffdb','--accent3':'#72efdd','--accent4':'#4d96ff','--accent5':'#c77dff'}},
  gachaVoid:{name:'ヴォイドレジェンド',desc:'UR限定の深い宇宙テーマ',price:0,gachaOnly:true,colors:['#f72585','#7209b7','#4cc9f0'],vars:{'--bg':'#03010a','--surface':'#100522','--surface2':'#241044','--accent1':'#f72585','--accent2':'#4cc9f0','--accent3':'#72efdd','--accent4':'#4361ee','--accent5':'#b5179e'}},
  gachaSecret:{name:'シークレットプリズム',desc:'奇跡を引いた者だけが使える虹色テーマ',price:0,gachaOnly:true,colors:['#ff6b6b','#ffd93d','#4d96ff'],vars:{'--bg':'#090414','--surface':'#1b1030','--surface2':'#31205a','--accent1':'#ff70a6','--accent2':'#ffd670','--accent3':'#70e000','--accent4':'#70d6ff','--accent5':'#e76bf3'}},
};
// Light versions of each theme. Accents are deeper than in dark mode so they stay readable as text on light backgrounds.
const lightTheme=(bg,surface2,a1,a2,a3,a4,a5,extra={})=>({'--bg':bg,'--surface':'#ffffff','--surface2':surface2,'--accent1':a1,'--accent2':a2,'--accent3':a3,'--accent4':a4,'--accent5':a5,...extra});
const THEME_LIGHT = {
  default:lightTheme('#f4f3fa','#ecebf5','#e5484d','#b07800','#2b9348','#2f6fe0','#9440d6'),
  ocean:lightTheme('#eef7fb','#e0eff6','#e0446a','#0a7f99','#138a62','#0284c7','#4f5fd6',{'--text':'#0f2733','--text2':'#4b6370'}),
  forest:lightTheme('#f0f7f2','#e1efe6','#d64545','#8a6d00','#2b8a50','#2a8587','#3c9a6e',{'--text':'#11261b','--text2':'#4a6155'}),
  sunset:lightTheme('#fdf3f1','#f8e4e3','#e0484d','#c26a00','#3d8f4a','#d6338f','#8040d0',{'--text':'#2e1620','--text2':'#6d5560'}),
  sakura:lightTheme('#fdf2f6','#f8e3ec','#d9467a','#b0577e','#2f8f6a','#3b78c4','#8a5fb0',{'--text':'#2e1824','--text2':'#6d5663'}),
  cyber:lightTheme('#f3f1fa','#e9e5f6','#e0186f','#9a7d00','#00875a','#0082a8','#9b1fe0',{'--text':'#16102a','--text2':'#575070'}),
  neon:lightTheme('#f2f2fa','#e6e6f4','#d6338f','#9e8400','#00876f','#0077c2','#7d3fd0'),
  retro:lightTheme('#eef3e2','#dfe8c9','#c9561a','#5e7d00','#4b7a0a','#2f7a4f','#587d0c',{'--surface':'#f8fbef','--text':'#1d2a12','--text2':'#4c5a3c'}),
  royal:lightTheme('#f6f1fb','#ece2f6','#d6456a','#a87b00','#12897a','#6a24b0','#9440d6',{'--text':'#22123a','--text2':'#5f5272'}),
  mono:lightTheme('#f2f2f2','#e6e6e6','#d1424b','#858585','#7d8288','#495057','#333333',{'--text':'#111111','--text2':'#555555'}),
  crystal:lightTheme('#eef6fb','#e0eef6','#e0485f','#a37f00','#10875d','#0a7fc2','#8a4fd6',{'--text':'#0f2232','--text2':'#4b6070'}),
  candy:lightTheme('#fdf1f7','#f7e2ef','#d93a7a','#b07000','#3a8a00','#0a86b8','#b23cc4',{'--text':'#2b1530','--text2':'#6a5470'}),
  galaxy:lightTheme('#f1f1fb','#e4e4f6','#d61f6e','#0a87b0','#128a78','#3651d6','#9a1590'),
  gachaAurora:lightTheme('#edf8f7','#ddf0ee','#d6456a','#0d8a6c','#128a7c','#2f6fe0','#9440d6',{'--text':'#0f2529','--text2':'#4a6266'}),
  gachaVoid:lightTheme('#f2eff9','#e6e0f4','#d61f6e','#0a87b0','#128a78','#3651d6','#8a13a0'),
  gachaSecret:lightTheme('#f7f2fb','#efe4f6','#d93a7a','#b07000','#3a8a00','#0a86b8','#b23cc4'),
};
const COLOR_MODE_KEY='mgl_color_mode';
const COLOR_MODES={auto:'自動',light:'ライト',dark:'ダーク'};
let colorMode='auto';
try { const m=localStorage.getItem(COLOR_MODE_KEY); if(COLOR_MODES[m]) colorMode=m; } catch(e) {}
const systemLightQuery=window.matchMedia?window.matchMedia('(prefers-color-scheme: light)'):null;
function resolvedColorMode(){ return colorMode==='auto'?(systemLightQuery&&systemLightQuery.matches?'light':'dark'):colorMode; }
const SCORE_RULES_VERSION = 1;
const AVATAR_ITEMS = [
  {icon:'🎮',name:'ゲームパッド',price:0},{icon:'🙂',name:'スマイル',price:0},{icon:'🐣',name:'ひよこ',price:0},
  {icon:'🦊',name:'キツネ',price:300},{icon:'🐱',name:'ネコ',price:300},{icon:'🐶',name:'イヌ',price:400},
  {icon:'🐼',name:'パンダ',price:500},{icon:'🐸',name:'カエル',price:500},{icon:'🍉',name:'スイカ',price:600},
  {icon:'🔨',name:'ハンマー',price:700},{icon:'🤖',name:'ロボット',price:800},{icon:'👻',name:'ゴースト',price:800},
  {icon:'🧩',name:'パズルピース',price:900},{icon:'🧙',name:'魔法使い',price:1000},{icon:'🃏',name:'ジョーカー',price:1100},
  {icon:'🥷',name:'忍者',price:1200},{icon:'⚔️',name:'聖剣',price:1400},{icon:'🐉',name:'ドラゴン',price:1600},
  {icon:'🛸',name:'UFO',price:2000},{icon:'👑',name:'キング',price:2500},{icon:'👾',name:'スペースモンスター',price:3000},
  {icon:'🚀',name:'ロケット',price:4000},
  {icon:'🐹',name:'ハムスター',price:0,gachaOnly:true},{icon:'🐰',name:'ウサギ',price:0,gachaOnly:true},{icon:'🐧',name:'ペンギン',price:0,gachaOnly:true},{icon:'🐵',name:'モンキー',price:0,gachaOnly:true},{icon:'🐙',name:'オクトパス',price:0,gachaOnly:true},{icon:'🦁',name:'ライオン',price:0,gachaOnly:true},
  {icon:'🦄',name:'ユニコーン',price:0,gachaOnly:true},{icon:'🦈',name:'シャーク',price:0,gachaOnly:true},{icon:'🦖',name:'恐竜',price:0,gachaOnly:true},{icon:'🧛',name:'ヴァンパイア',price:0,gachaOnly:true},{icon:'🧚',name:'フェアリー',price:0,gachaOnly:true},{icon:'🌠',name:'流星の化身',price:0,gachaOnly:true},{icon:'💠',name:'奇跡のプリズム',price:0,gachaOnly:true}
];
const GACHA_RATES={N:.6,R:.3,SR:.089,UR:.01,SECRET:.001};
const GACHA_MEDALS={N:1,R:3,SR:10,UR:30,SECRET:100};
const GACHA_EXCHANGE_COST={N:15,R:50,SR:180,UR:800};
const GACHA_ITEMS=[
  {id:'n_hamster',rarity:'N',type:'avatar',icon:'🐹',name:'ハムスター'},{id:'n_rabbit',rarity:'N',type:'avatar',icon:'🐰',name:'ウサギ'},{id:'n_penguin',rarity:'N',type:'avatar',icon:'🐧',name:'ペンギン'},{id:'n_monkey',rarity:'N',type:'avatar',icon:'🐵',name:'モンキー'},{id:'n_octopus',rarity:'N',type:'avatar',icon:'🐙',name:'オクトパス'},{id:'n_lion',rarity:'N',type:'avatar',icon:'🦁',name:'ライオン'},
  {id:'r_unicorn',rarity:'R',type:'avatar',icon:'🦄',name:'ユニコーン'},{id:'r_shark',rarity:'R',type:'avatar',icon:'🦈',name:'シャーク'},{id:'r_dino',rarity:'R',type:'avatar',icon:'🦖',name:'恐竜'},{id:'r_blue',rarity:'R',type:'frame',icon:'🔵',name:'ブルーフレーム',frameClass:'frame-blue'},{id:'r_red',rarity:'R',type:'frame',icon:'🔴',name:'レッドフレーム',frameClass:'frame-red'},{id:'r_rookie',rarity:'R',type:'title',icon:'🏷️',name:'称号「ラッキールーキー」',title:'ラッキールーキー'},{id:'r_challenger',rarity:'R',type:'title',icon:'🔥',name:'称号「チャレンジャー」',title:'チャレンジャー'},
  {id:'sr_vampire',rarity:'SR',type:'avatar',icon:'🧛',name:'ヴァンパイア'},{id:'sr_fairy',rarity:'SR',type:'avatar',icon:'🧚',name:'フェアリー'},{id:'sr_neon',rarity:'SR',type:'frame',icon:'💚',name:'ネオンフレーム',frameClass:'frame-neon'},{id:'sr_gold',rarity:'SR',type:'frame',icon:'🟡',name:'ゴールドフレーム',frameClass:'frame-gold'},{id:'sr_emerald',rarity:'SR',type:'frame',icon:'🟢',name:'エメラルドフレーム',frameClass:'frame-emerald'},{id:'sr_collector',rarity:'SR',type:'title',icon:'🎖️',name:'称号「コレクター」',title:'コレクター'},{id:'sr_arcade',rarity:'SR',type:'title',icon:'🕹️',name:'称号「アーケードマスター」',title:'アーケードマスター'},{id:'sr_aurora',rarity:'SR',type:'theme',icon:'🌈',name:'オーロラドリーム',themeId:'gachaAurora'},
  {id:'ur_meteor',rarity:'UR',type:'avatar',icon:'🌠',name:'流星の化身'},{id:'ur_cosmic',rarity:'UR',type:'frame',icon:'🌌',name:'コズミックフレーム',frameClass:'frame-cosmic'},{id:'ur_rainbow',rarity:'UR',type:'frame',icon:'✨',name:'プリズムレインボーフレーム',frameClass:'frame-rainbow'},{id:'ur_legend',rarity:'UR',type:'title',icon:'👑',name:'称号「ガチャレジェンド」',title:'ガチャレジェンド'},{id:'ur_omnipotent',rarity:'UR',type:'title',icon:'⚡',name:'称号「全知全能の覇者」',title:'全知全能の覇者'},{id:'ur_void',rarity:'UR',type:'theme',icon:'🪐',name:'ヴォイドレジェンド',themeId:'gachaVoid'},
  {id:'secret_prism',rarity:'SECRET',type:'bundle',icon:'💠',name:'奇跡のプリズムセット',avatar:'💠',frameClass:'frame-secret',title:'奇跡を引いた者',themeId:'gachaSecret'}
];
const BGM_GACHA_RATES={R:.6,SR:.3,SSR:.09,UR:.01};
const BGM_GACHA_ITEMS=[
  {id:'bgm_coffee',rarity:'R',icon:'☕',name:'Coffee at Midnight'},
  {id:'bgm_yoru',rarity:'R',icon:'🌙',name:'夜を泳ぐ'},
  {id:'bgm_glass',rarity:'R',icon:'🪟',name:'Glass Horizon'},
  {id:'bgm_ashita',rarity:'SR',icon:'🌅',name:'あしたを追いこす'},
  {id:'bgm_chasing',rarity:'SR',icon:'☀️',name:'Chasing the Sun Ahead'},
  {id:'bgm_kizuna',rarity:'SR',icon:'🤝',name:'絆の証'},
  {id:'bgm_prism',rarity:'SSR',icon:'🌈',name:'Beyond the Prism Sky'},
  {id:'bgm_dopamine',rarity:'SSR',icon:'⚡',name:'トバシテ・ドーパミン'},
  {id:'bgm_saisoku',rarity:'UR',icon:'💘',name:'最高速の恋'}
];
const PROFILE_AVATARS = AVATAR_ITEMS.map(a=>a.icon);
const FREE_AVATARS = AVATAR_ITEMS.filter(a=>a.price===0).map(a=>a.icon);
let activeGameId='', activeGameStartedAt=0, selectedProfileAvatar='🎮', rankingGame='memory', rankingMode='game', onboardingMode=false;
let gameSearchText='',gameTagFilter='すべて',favoriteOnly=false,gameSortMode='default';
let saveData = {
  level:1, xp:0, totalScore:0, wins:0, streak:0, highscores:{}, dailyBonus:0,
  gameStats:{}, achievements:[], ownedThemes:['default'], ownedAvatars:[...FREE_AVATARS], activeTheme:'default',
  daily:{date:'',plays:0,wins:0,score:0,claimed:[],games:[],uniqueGames:0},
  profile:{id:'',username:'プレイヤー',avatar:'🎮',createdAt:'',onboardingComplete:false}, scoreHistory:[], activeChallenge:null, challengeClears:0, favoriteGames:[],
  gachaInventory:[],gachaMedals:0,gachaDraws:0,gachaFreeUsed:false,ownedBgm:[],bgmGachaDraws:0,activeFrame:'',activeTitle:''
};

function localDateKey(){
  const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}
function getDailyPickupGame(){
  const key=Number(localDateKey())||20260101;
  return GAME_DEFS[key%GAME_DEFS.length]||GAME_DEFS[0];
}
function normalizeSave(){
  saveData.level=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(saveData.level)||1)));
  saveData.xp=Math.max(0,Math.floor(Number(saveData.xp)||0));if(saveData.level>=MAX_LEVEL)saveData.xp=0;
  saveData.highscores=saveData.highscores||{}; saveData.gameStats=saveData.gameStats||{};
  saveData.achievements=Array.isArray(saveData.achievements)?saveData.achievements:[];
  saveData.ownedThemes=Array.isArray(saveData.ownedThemes)?saveData.ownedThemes:['default'];
  if(!saveData.ownedThemes.includes('default'))saveData.ownedThemes.unshift('default');
  if(!THEMES[saveData.activeTheme]||!saveData.ownedThemes.includes(saveData.activeTheme))saveData.activeTheme='default';
  if(!saveData.daily||saveData.daily.date!==localDateKey())saveData.daily={date:localDateKey(),plays:0,wins:0,score:0,claimed:[],games:[],uniqueGames:0};
  saveData.daily.claimed=Array.isArray(saveData.daily.claimed)?saveData.daily.claimed:[];
  saveData.daily.games=Array.isArray(saveData.daily.games)?[...new Set(saveData.daily.games)].filter(id=>GAME_DEFS.some(game=>game.id===id)):[];
  saveData.daily.uniqueGames=saveData.daily.games.length;
  saveData.scoreHistory=Array.isArray(saveData.scoreHistory)?saveData.scoreHistory:[];
  saveData.recentGames=[...new Set((Array.isArray(saveData.recentGames)?saveData.recentGames:saveData.scoreHistory.map(entry=>entry.gameId)).map(id=>['trivia','animequiz'].includes(id)?'quiz':id))].filter(id=>GAME_DEFS.some(g=>g.id===id)).slice(0,4);
  saveData.challengeClears=Number(saveData.challengeClears)||0;
  saveData.pointsEarned=Math.max(0,Math.floor(Number(saveData.pointsEarned)||0));
  if(['trivia','animequiz'].includes(saveData.activeChallenge?.gameId))saveData.activeChallenge=null;
  if(Array.isArray(saveData.favoriteGames))saveData.favoriteGames=[...new Set(saveData.favoriteGames.map(id=>['trivia','animequiz'].includes(id)?'quiz':id))];
  saveData.favoriteGames=Array.isArray(saveData.favoriteGames)?saveData.favoriteGames.filter(id=>GAME_DEFS.some(g=>g.id===id)):[];
  saveData.gachaInventory=Array.isArray(saveData.gachaInventory)?saveData.gachaInventory.filter(id=>GACHA_ITEMS.some(item=>item.id===id)):[];
  saveData.gachaMedals=Math.max(0,Math.floor(Number(saveData.gachaMedals)||0));
  saveData.gachaDraws=Math.max(0,Math.floor(Number(saveData.gachaDraws)||0));
  saveData.gachaFreeUsed=!!saveData.gachaFreeUsed;
  saveData.ownedBgm=Array.isArray(saveData.ownedBgm)?[...new Set(saveData.ownedBgm)].filter(id=>BGM_GACHA_ITEMS.some(item=>item.id===id)):[];
  saveData.bgmGachaDraws=Math.max(0,Math.floor(Number(saveData.bgmGachaDraws)||0));
  delete saveData.cloudCode;
  if(!saveData.gachaInventory.includes(saveData.activeFrame))saveData.activeFrame='';
  if(!saveData.gachaInventory.includes(saveData.activeTitle))saveData.activeTitle='';
  saveData.profile=saveData.profile||{};
  if(!saveData.profile.id)saveData.profile.id=(globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`local-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  if(!saveData.profile.username)saveData.profile.username='プレイヤー';
  if(!PROFILE_AVATARS.includes(saveData.profile.avatar))saveData.profile.avatar='🎮';
  saveData.ownedAvatars=Array.isArray(saveData.ownedAvatars)?saveData.ownedAvatars.filter(a=>PROFILE_AVATARS.includes(a)):[...FREE_AVATARS];
  FREE_AVATARS.forEach(a=>{if(!saveData.ownedAvatars.includes(a))saveData.ownedAvatars.push(a);});
  if(!saveData.ownedAvatars.includes(saveData.profile.avatar))saveData.ownedAvatars.push(saveData.profile.avatar);
  if(!saveData.profile.createdAt)saveData.profile.createdAt=new Date().toISOString();
  if(typeof saveData.profile.onboardingComplete!=='boolean')saveData.profile.onboardingComplete=saveData.profile.username!=='プレイヤー';
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const THEME_VAR_KEYS=['--bg','--surface','--surface2','--accent1','--accent2','--accent3','--accent4','--accent5','--text','--text2'];
function applyTheme(){
  const id=THEMES[saveData.activeTheme]?saveData.activeTheme:'default';
  const mode=resolvedColorMode();
  const vars=mode==='light'?(THEME_LIGHT[id]||THEME_LIGHT.default):THEMES[id].vars;
  const root=document.documentElement;
  root.dataset.mode=mode;
  // Clear first so values a theme doesn't set fall back to the stylesheet's mode defaults.
  THEME_VAR_KEYS.forEach(k=>root.style.removeProperty(k));
  Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content',vars['--bg']);
}
function setColorMode(mode){
  if(!COLOR_MODES[mode])return;
  colorMode=mode;
  try { localStorage.setItem(COLOR_MODE_KEY,mode); } catch(e) {}
  applyTheme();
  renderColorModeControls();
}
function colorModeControlHtml(){
  return `<div class="mode-switch" role="radiogroup" aria-label="表示モード">${Object.entries(COLOR_MODES).map(([id,label])=>`<button type="button" role="radio" aria-checked="${colorMode===id}" class="${colorMode===id?'active':''}" onclick="setColorMode('${id}')">${{auto:'📱',light:'☀️',dark:'🌙'}[id]} ${label}</button>`).join('')}</div>`;
}
function renderColorModeControls(){
  document.querySelectorAll('[data-color-mode-control]').forEach(el=>{el.innerHTML=colorModeControlHtml();});
}
if(systemLightQuery){
  const onSystemChange=()=>{ if(colorMode==='auto') applyTheme(); };
  if(systemLightQuery.addEventListener) systemLightQuery.addEventListener('change',onSystemChange);
  else if(systemLightQuery.addListener) systemLightQuery.addListener(onSystemChange);
}
function activeFrameClass(){return GACHA_ITEMS.find(item=>item.id===saveData.activeFrame)?.frameClass||'';}
function activeTitleText(){return GACHA_ITEMS.find(item=>item.id===saveData.activeTitle)?.title||'';}
function checkMetaProgress(){
  normalizeSave();
  let notices=[];
  DAILY_MISSIONS.forEach(m=>{
    if(saveData.daily[m.key]>=m.target&&!saveData.daily.claimed.includes(m.id)){
      saveData.daily.claimed.push(m.id); saveData.totalScore+=m.reward; trackEarned(m.reward);
      notices.push(`📅 ${m.label}達成！ +${m.reward}pt`);
    }
  });
  if(DAILY_MISSIONS.every(m=>saveData.daily.claimed.includes(m.id))&&!saveData.daily.claimed.includes('daily_complete')){
    saveData.daily.claimed.push('daily_complete');
    saveData.totalScore+=150; trackEarned(150);
    saveData.gachaMedals=(saveData.gachaMedals||0)+3;
    notices.push('🎁 デイリー全達成ボーナス！ +150pt ＆ 🪙3メダル');
  }
  ACHIEVEMENTS.forEach(a=>{
    if(!saveData.achievements.includes(a.id)&&a.test(saveData)){
      saveData.achievements.push(a.id); saveData.totalScore+=a.reward; trackEarned(a.reward);
      notices.push(`${a.icon} 実績「${a.name}」解除！ +${a.reward}pt`);
    }
  });
  persistSave(); updateUI();
  if(notices.length)setTimeout(()=>showToast(notices[0], '#c77dff'),150);
}
function trackGameStart(gameId){
  normalizeSave(); saveData.daily.plays++;
  if(!saveData.daily.games.includes(gameId)){saveData.daily.games.push(gameId);saveData.daily.uniqueGames=saveData.daily.games.length;}
  saveData.recentGames=[gameId,...saveData.recentGames.filter(id=>id!==gameId)].slice(0,4);
  const stat=saveData.gameStats[gameId]||(saveData.gameStats[gameId]={plays:0,wins:0,masteryXp:0});stat.masteryXp=stat.masteryXp||0;stat.plays++;
  checkMetaProgress();
}
function getMastery(gameId){const xp=saveData.gameStats?.[gameId]?.masteryXp||0,steps=[150,400,850,1500,2500];let level=steps.filter(n=>xp>=n).length;return {xp,level,next:steps[level]||null};}
function recordGameResult(gameId,score,won,details={}){
  normalizeSave();
  const entry={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,playerId:saveData.profile.id,username:saveData.profile.username,gameId:gameId||activeGameId,score:Math.max(0,Math.round(Number(score)||0)),won:!!won,playedAt:new Date().toISOString(),durationMs:activeGameStartedAt?Date.now()-activeGameStartedAt:0,rulesVersion:SCORE_RULES_VERSION,details};
  saveData.scoreHistory.unshift(entry);saveData.scoreHistory=saveData.scoreHistory.slice(0,200);
  const stat=saveData.gameStats[entry.gameId]||(saveData.gameStats[entry.gameId]={plays:0,wins:0,masteryXp:0});const before=getMastery(entry.gameId).level;
  stat.masteryXp=(stat.masteryXp||0)+(won?Math.min(220,25+Math.round(entry.score*.08)):8);const after=getMastery(entry.gameId).level;
  if(after>before)setTimeout(()=>showToast(`⭐ マスタリーLv.${after}にアップ！`,'#ffd93d'),250);
  const ch=saveData.activeChallenge;
  if(ch&&!ch.completed&&ch.gameId===entry.gameId&&((ch.type==='win'&&entry.won)||(ch.type==='score'&&entry.score>=ch.target))){ch.completed=true;saveData.challengeClears++;saveData.totalScore+=ch.reward;trackEarned(ch.reward);setTimeout(()=>showToast(`🎲 チャレンジ達成！ +${ch.reward}pt`,'#c77dff'),400);}
  persistSave();submitOnlineScore(entry);return entry;
}
function buildScoreSubmission(entry){
  return {playerId:entry.playerId,username:entry.username,avatar:saveData.profile.avatar,level:saveData.level,totalPoints:saveData.totalScore,totalEarnedPoints:saveData.pointsEarned,gameId:entry.gameId,score:entry.score,won:entry.won,playedAt:entry.playedAt,durationMs:entry.durationMs,rulesVersion:entry.rulesVersion};
}
function buildProfileSubmission(){return {playerId:saveData.profile.id,username:saveData.profile.username,avatar:saveData.profile.avatar,level:saveData.level,totalPoints:saveData.totalScore,totalEarnedPoints:saveData.pointsEarned};}
let onlineSessionPromise=null;
async function ensureOnlineSession(){
  if(!onlineSessionPromise)onlineSessionPromise=(async()=>{
    const response=await fetch('/api/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
    if(!response.ok)throw new Error('Session unavailable');
    const session=await response.json();
    saveData.profile.id=session.playerId;persistSave();
    return session;
  })().catch(error=>{onlineSessionPromise=null;throw error;});
  return onlineSessionPromise;
}
async function onlinePost(path,body){
  await ensureOnlineSession();
  const send=()=>fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let response=await send();
  if(response.status===401){onlineSessionPromise=null;await ensureOnlineSession();response=await send();}
  if(!response.ok)throw new Error(response.status===429?'送信が多いため、1分ほど待ってください':'送信できませんでした');
  return response;
}
async function syncOnlineProfile(){
  if(!saveData.profile.onboardingComplete)return;
  try{await onlinePost('/api/profile',buildProfileSubmission());}catch(error){showToast('プロフィールをオンラインに反映できませんでした','#ff6b6b');}
}
async function submitOnlineScore(entry){
  try{
    const response=await onlinePost('/api/scores',buildScoreSubmission(entry));
    if(!response.ok)throw new Error('送信できませんでした');
    if(rankingMode!=='game'||entry.gameId===rankingGame)renderLocalRanking(rankingGame);
  }catch(error){
    showToast('オンライン順位への送信を後で再試行してください','#ff6b6b');
  }
}
function startRandomChallenge(){
  const pool=GAME_DEFS.filter(g=>!['blackjack','roulette','slot'].includes(g.id)),g=pool[Math.floor(Math.random()*pool.length)],hs=saveData.highscores[g.id]||0;
  const scoreMode=hs>0&&Math.random()<.55;saveData.activeChallenge={id:`challenge-${Date.now()}`,gameId:g.id,type:scoreMode?'score':'win',target:scoreMode?Math.max(10,Math.round(hs*.75)):0,reward:120,completed:false};persistSave();startGame(g.id);
}
function abandonChallenge(){saveData.activeChallenge=null;persistSave();renderHome();}
function challengeText(ch){const g=GAME_DEFS.find(x=>x.id===ch.gameId);return `${g?.icon||'🎮'} ${g?.title||ch.gameId}：${ch.type==='win'?'1回勝利':ch.target.toLocaleString()+'点以上'}`;}
function copyPlayerCard(){
  const best=Object.entries(saveData.gameStats).sort((a,b)=>getMastery(b[0]).level-getMastery(a[0]).level)[0],game=GAME_DEFS.find(g=>g.id===best?.[0]);
  const text=`${saveData.profile.avatar} ${saveData.profile.username}\nLv.${saveData.level} ${getLvName(saveData.level)}\n勝利 ${saveData.wins}回 / ${saveData.totalScore.toLocaleString()}pt\n得意ゲーム: ${game?.title||'未設定'}\n#ミニゲームランド`;
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>showToast('プレイヤーカードをコピーしました','#6bcb77'));else{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('プレイヤーカードをコピーしました','#6bcb77');}
}
let profileReturnFocus=null;
function handleProfileKey(event){
  if(event.key==='Escape'){event.stopPropagation();closeProfile();}
  if(event.key==='Tab'){
    const controls=[...document.getElementById('profile-modal').querySelectorAll('button,input,summary,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
}
function openProfile(required=false){
  profileReturnFocus=document.activeElement;
  document.getElementById('profile-top-close').hidden=required;
  onboardingMode=required;
  normalizeSave();selectedProfileAvatar=saveData.profile.avatar;
  const stats=Object.values(saveData.gameStats),plays=stats.reduce((n,s)=>n+(s.plays||0),0);
  const favorite=Object.entries(saveData.gameStats).sort((a,b)=>(b[1].plays||0)-(a[1].plays||0))[0];
  const favoriteName=GAME_DEFS.find(g=>g.id===favorite?.[0])?.title||'まだなし';
  const masteryTotal=GAME_DEFS.reduce((n,g)=>n+getMastery(g.id).level,0);
  document.getElementById('profile-modal-title').textContent=required?'🎮 はじめまして！':'👤 プレイヤープロフィール';
  document.getElementById('profile-close-btn').style.display=required?'none':'inline-block';
  document.getElementById('profile-save-btn').textContent=required?'この名前で始める':'保存';
  document.getElementById('profile-modal-content').innerHTML=`
    ${required?'<p style="color:var(--text2);font-size:13px;line-height:1.7;margin-bottom:14px">最初にランキングで使うユーザーネームとアイコンを決めてください。本名やメールアドレスは入力しないでください。</p>':''}
    <div class="player-card"><div class="player-card-main"><div class="profile-avatar ${activeFrameClass()}" id="profile-avatar-preview">${selectedProfileAvatar}</div><div><strong style="font-size:18px">${escapeHtml(saveData.profile.username)}</strong>${activeTitleText()?`<div style="color:var(--accent2);font-size:11px;font-weight:900">✦ ${escapeHtml(activeTitleText())}</div>`:''}<div style="color:var(--accent2);font-weight:700">Lv.${saveData.level} ${escapeHtml(getLvName(saveData.level))}</div><div class="meta-sub">得意：${escapeHtml(favoriteName)} ／ ID: ${escapeHtml(saveData.profile.id.slice(0,8))}</div></div></div></div>
    <div class="profile-stats"><div class="profile-stat"><strong>${plays}</strong><span>プレイ</span></div><div class="profile-stat"><strong>${saveData.wins}</strong><span>勝利</span></div><div class="profile-stat"><strong>${masteryTotal}</strong><span>マスタリー合計</span></div></div>
    ${required?'':`<details style="margin-bottom:20px"><summary style="cursor:pointer;font-size:14px;padding:12px 0">ゲームごとのマスタリー</summary>${GAME_DEFS.map(g=>`<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px"><span>${g.icon} ${escapeHtml(g.title)}</span><span style="white-space:nowrap;color:var(--text2)">Lv.${getMastery(g.id).level} / 5</span></div>`).join('')}</details>`}
    <button class="btn btn-purple btn-sm" style="width:100%;margin-bottom:14px" onclick="copyPlayerCard()">📋 カード情報をコピー</button>
    <label class="meta-sub" for="profile-name">ユーザーネーム（1〜16文字）</label><input id="profile-name" maxlength="16" value="${escapeHtml(saveData.profile.username)}" style="width:100%;margin:5px 0 10px">
    <div class="meta-sub">所有しているアイコン</div><div class="avatar-picker">${saveData.ownedAvatars.map(a=>`<button class="avatar-option ${a===selectedProfileAvatar?'selected':''}" onclick="selectProfileAvatar('${a}')" aria-label="${escapeHtml(AVATAR_ITEMS.find(x=>x.icon===a)?.name||'アイコン')}">${a}</button>`).join('')}</div>
    ${required?'':'<button class="btn btn-warn btn-sm" style="width:100%;margin-bottom:12px" onclick="closeProfile();openShop()">🛍️ アイコンをショップで見る</button>'}
    <div class="privacy-note">世界ランキングには、入力した名前・アイコン・ランダム生成ID・ゲーム名・得点・プレイ日時・プレイ時間が送信されます。メールアドレスや住所は収集しません。</div>`;
  document.getElementById('profile-modal').classList.add('open');
  document.getElementById('profile-modal-content').scrollTop=0;
  gameDelay(()=>document.getElementById('profile-name')?.focus(),100);
}
function selectProfileAvatar(avatar){selectedProfileAvatar=avatar;document.getElementById('profile-avatar-preview').textContent=avatar;document.querySelectorAll('.avatar-option').forEach(b=>b.classList.toggle('selected',b.textContent===avatar));}
function saveProfile(){
  const input=document.getElementById('profile-name'),name=input.value.trim();
  if(name.length<1||name.length>16||/[<>]/.test(name)){showToast('名前は1〜16文字で、< > は使用できません', '#ff6b6b');return;}
  if(onboardingMode&&name==='プレイヤー'){showToast('自分のユーザーネームを入力してください', '#ff6b6b');input.focus();return;}
  saveData.profile.username=name;saveData.profile.avatar=selectedProfileAvatar;saveData.profile.onboardingComplete=true;onboardingMode=false;persistSave();updateUI();renderHome();syncOnlineProfile();closeProfile();showToast('プロフィールを保存しました', '#6bcb77');
}
function closeProfile(){if(onboardingMode)return;document.getElementById('profile-modal').classList.remove('open');profileReturnFocus?.focus();}
function buyTheme(id){
  const theme=THEMES[id]; if(!theme)return;
  if(saveData.ownedThemes.includes(id)){saveData.activeTheme=id;applyTheme();persistSave();renderHome();renderShopPage();return;}
  if(saveData.totalScore<theme.price){showToast('ポイントが足りません', '#ff6b6b');return;}
  saveData.totalScore-=theme.price;saveData.ownedThemes.push(id);saveData.activeTheme=id;
  applyTheme();persistSave();checkMetaProgress();syncOnlineProfile();renderHome();renderShopPage();showToast(`🎨 ${theme.name}を購入！`,theme.colors[0]);
}
function buyAvatar(icon){
  const item=AVATAR_ITEMS.find(a=>a.icon===icon);if(!item)return;
  if(saveData.ownedAvatars.includes(icon)){saveData.profile.avatar=icon;selectedProfileAvatar=icon;persistSave();updateUI();renderShopPage();syncOnlineProfile().then(()=>renderLocalRanking(rankingGame));showToast(`${icon} ${item.name}を設定しました`,'#6bcb77');return;}
  if(saveData.totalScore<item.price){showToast('ポイントが足りません','#ff6b6b');return;}
  saveData.totalScore-=item.price;saveData.ownedAvatars.push(icon);saveData.profile.avatar=icon;selectedProfileAvatar=icon;persistSave();checkMetaProgress();updateUI();renderShopPage();syncOnlineProfile().then(()=>renderLocalRanking(rankingGame));showToast(`${icon} ${item.name}を購入！`,'#ffd93d');
}
function rollGachaRarity(rPlusOnly=false){
  const entries=Object.entries(GACHA_RATES).filter(([rarity])=>!rPlusOnly||rarity!=='N');
  const total=entries.reduce((sum,[,rate])=>sum+rate,0),roll=Math.random()*total;let cursor=0;
  for(const [rarity,rate] of entries){cursor+=rate;if(roll<cursor)return rarity;}return entries[entries.length-1][0];
}
function rollGachaItem(rPlusOnly=false){
  const rarity=rollGachaRarity(rPlusOnly),pool=GACHA_ITEMS.filter(item=>item.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}
function grantGachaItem(item){
  if(saveData.gachaInventory.includes(item.id)){const medals=GACHA_MEDALS[item.rarity];saveData.gachaMedals+=medals;return {item,isNew:false,medals};}
  saveData.gachaInventory.push(item.id);
  if(item.type==='avatar'&&!saveData.ownedAvatars.includes(item.icon))saveData.ownedAvatars.push(item.icon);
  if(item.type==='theme'&&!saveData.ownedThemes.includes(item.themeId))saveData.ownedThemes.push(item.themeId);
  if(item.type==='bundle'){
    if(!saveData.ownedAvatars.includes(item.avatar))saveData.ownedAvatars.push(item.avatar);
    if(!saveData.ownedThemes.includes(item.themeId))saveData.ownedThemes.push(item.themeId);
  }
  return {item,isNew:true,medals:0};
}
const GACHA_RARITY_ORDER=['N','R','SR','SSR','UR','SECRET'];
function gachaActionButton(result,kind){
  if(kind==='bgm')return `<button class="btn btn-purple" onclick="playBgmReward('${result.item.id}')">▶ このBGMを再生</button>`;
  const labels={avatar:'このアイコンを使う',frame:'このフレームを使う',title:'この称号を使う',theme:'このテーマを使う',bundle:'このセットを使う'};
  return `<button class="btn btn-purple" onclick="useGachaReward('${result.item.id}')">${labels[result.item.type]||'このアイテムを使う'}</button>`;
}
function gachaResultCards(results,kind){
  return `<div class="gacha-results" aria-live="polite">${results.map((result,i)=>`<div class="gacha-result rarity-${result.item.rarity}" style="animation-delay:${i*.06}s"><span class="gacha-item-rarity">${result.item.rarity}</span><div class="gacha-result-icon">${result.item.icon}</div><strong>${escapeHtml(result.item.name)}</strong><small>${result.isNew?'NEW!':kind==='bgm'?'重複・獲得なし':`重複 +${result.medals}メダル`}</small>${gachaActionButton(result,kind)}</div>`).join('')}</div>`;
}
function closeGachaReveal(){document.getElementById('gacha-reveal')?.remove();}
function showGachaReveal(results,kind){
  closeGachaReveal();if(!results.length)return;
  const best=results.reduce((a,b)=>GACHA_RARITY_ORDER.indexOf(a.item.rarity)>GACHA_RARITY_ORDER.indexOf(b.item.rarity)?a:b),overlay=document.createElement('div');
  overlay.id='gacha-reveal';overlay.className=`gacha-reveal rarity-${best.item.rarity}`;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','ガチャ結果');
  overlay.innerHTML=`<section class="gacha-reveal-box"><p class="meta-sub">タップしてスキップできます</p><div class="gacha-reveal-orb">?</div><h2>抽選中…</h2></section>`;
  document.body.appendChild(overlay);playSfx('gacha');let revealed=false;
  const reveal=()=>{if(revealed||!overlay.isConnected)return;revealed=true;overlay.classList.add('revealed');playSfx(best.item.rarity==='SECRET'?'secret':['UR','SSR'].includes(best.item.rarity)?'ur':best.item.rarity==='SR'?'rare':'win');overlay.querySelector('.gacha-reveal-box').innerHTML=`<p class="gacha-item-rarity">最高レア度 ${best.item.rarity}</p><h2>${best.item.rarity==='SECRET'?'💠 奇跡の結果！':'🎉 ガチャ結果'}</h2>${gachaResultCards(results,kind)}<div class="modal-btns"><button class="btn" onclick="closeGachaReveal()">結果を閉じる</button></div>`;overlay.querySelector('button')?.focus();};
  overlay.addEventListener('click',event=>{if(!revealed)reveal();else if(event.target===overlay)closeGachaReveal();});
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape')closeGachaReveal();});
  gameDelay(reveal,900);
}
function useGachaReward(id){closeGachaReveal();equipGachaItem(id);}
function playBgmReward(id){const index=bgm.tracks.findIndex(track=>track.unlockId===id);closeGachaReveal();if(index>=0)bgmPlay(index);}
function drawGacha(count){
  normalizeSave();const isFree=count===1&&!saveData.gachaFreeUsed,cost=isFree?0:count===10?4500:500;
  if(saveData.totalScore<cost){showToast(`ポイントが足りません（必要 ${cost.toLocaleString()}pt）`,'#ff6b6b');return;}
  saveData.totalScore-=cost;if(isFree)saveData.gachaFreeUsed=true;
  const items=Array.from({length:count},()=>rollGachaItem(false));
  if(count===10&&items.every(item=>item.rarity==='N'))items[items.length-1]=rollGachaItem(true);
  const results=items.map(grantGachaItem);saveData.gachaDraws+=count;
  persistSave();updateUI();syncOnlineProfile();renderShopPage(results);showGachaReveal(results,'collection');
  const best=results.reduce((a,b)=>['N','R','SR','UR','SECRET'].indexOf(a.item.rarity)>['N','R','SR','UR','SECRET'].indexOf(b.item.rarity)?a:b);
  showToast(best.item.rarity==='SECRET'?'💠 SECRET！奇跡のプリズムセット獲得！':`🎁 ${count}回ガチャを引きました` ,best.item.rarity==='UR'?'#ffd93d':'#c77dff');
}
function equipGachaItem(id){
  const item=GACHA_ITEMS.find(x=>x.id===id);if(!item||!saveData.gachaInventory.includes(id))return;
  if(item.type==='avatar'){saveData.profile.avatar=item.icon;selectedProfileAvatar=item.icon;}
  if(item.type==='frame')saveData.activeFrame=id;
  if(item.type==='title')saveData.activeTitle=id;
  if(item.type==='theme'){saveData.activeTheme=item.themeId;applyTheme();}
  if(item.type==='bundle'){saveData.profile.avatar=item.avatar;selectedProfileAvatar=item.avatar;saveData.activeFrame=id;saveData.activeTitle=id;saveData.activeTheme=item.themeId;applyTheme();}
  persistSave();updateUI();renderShopPage();syncOnlineProfile().then(()=>renderLocalRanking(rankingGame));showToast(`${item.icon} ${item.name}を使用中`,'#6bcb77');
}
function exchangeGachaItem(id){
  normalizeSave();const item=GACHA_ITEMS.find(x=>x.id===id),cost=item&&GACHA_EXCHANGE_COST[item.rarity];
  if(!item||!cost||item.rarity==='SECRET')return;
  if(saveData.gachaInventory.includes(id)){showToast('このアイテムはすでに持っています','#4d96ff');return;}
  if(saveData.gachaMedals<cost){showToast(`メダルが足りません（必要 ${cost}枚）`,'#ff6b6b');return;}
  saveData.gachaMedals-=cost;grantGachaItem(item);persistSave();updateUI();syncOnlineProfile();renderShopPage();
  showToast(`🪙 ${item.name}と交換しました！`,'#ffd93d');
}
function gachaItemActive(item){
  if(item.type==='avatar')return saveData.profile.avatar===item.icon;
  if(item.type==='frame')return saveData.activeFrame===item.id;
  if(item.type==='title')return saveData.activeTitle===item.id;
  if(item.type==='theme')return saveData.activeTheme===item.themeId;
  return item.type==='bundle'&&saveData.activeFrame===item.id&&saveData.activeTitle===item.id&&saveData.activeTheme===item.themeId;
}
function renderGacha(results=[]){
  const el=document.getElementById('gacha-area');if(!el)return;
  const rates=Object.entries(GACHA_RATES).map(([rarity,rate])=>`<div class="gacha-rate rarity-${rarity}"><strong>${rarity}</strong>${(rate*100).toFixed(rarity==='SECRET'?1:rarity==='SR'?1:0)}%</div>`).join('');
  const resultHtml=results.length?gachaResultCards(results,'collection'):'';
  const exchangeItems=GACHA_ITEMS.filter(item=>item.rarity!=='SECRET');
  el.innerHTML=`<div class="gacha-panel"><h3>✨ ミニゲームランド・コレクション</h3><p class="meta-sub">限定アイコン・フレーム・称号・テーマが登場。能力差はなく、見た目を楽しむガチャです。</p><div class="gacha-wallet"><span>💰 ${saveData.totalScore.toLocaleString()}pt</span><span>🪙 ${saveData.gachaMedals.toLocaleString()}メダル</span><span>🎟️ 累計 ${saveData.gachaDraws.toLocaleString()}回</span></div><div class="gacha-actions"><button class="btn btn-purple" onclick="drawGacha(1)">${saveData.gachaFreeUsed?'1回引く　500pt':'初回無料で1回引く'}</button><button class="btn btn-warn" onclick="drawGacha(10)">10連　4,500pt<br><small>R以上1個確定</small></button></div><div class="gacha-rates">${rates}</div><div class="privacy-note">天井・最高レア確定はありません。重複時は N:1／R:3／SR:10／UR:30／SECRET:100 メダルに変換されます。現実のお金は使用しません。</div>${resultHtml}</div><h2 class="shop-section-title">🪙 ガチャメダル交換所</h2><p class="meta-sub" style="margin:-5px 0 12px">重複でもらったメダルで未獲得品を選べます。SECRETはガチャだけの特別景品です。</p><div class="gacha-collection">${exchangeItems.map(item=>{const owned=saveData.gachaInventory.includes(item.id),cost=GACHA_EXCHANGE_COST[item.rarity];return `<article class="gacha-collection-card rarity-${item.rarity}"><div class="gacha-result-icon">${item.icon}</div><div class="gacha-collection-info"><strong>${escapeHtml(item.name)}</strong><small>${item.rarity}・交換 ${cost}メダル</small></div><button class="btn ${owned?'btn-success':'btn-warn'}" ${owned?'disabled':''} onclick="exchangeGachaItem('${item.id}')">${owned?'所持済':cost+'枚'}</button></article>`;}).join('')}</div><h2 class="shop-section-title">📚 ガチャコレクション <span class="meta-sub">${saveData.gachaInventory.length}/${GACHA_ITEMS.length}</span></h2><div class="gacha-collection">${GACHA_ITEMS.map(item=>{const owned=saveData.gachaInventory.includes(item.id),active=gachaItemActive(item);return `<article class="gacha-collection-card rarity-${item.rarity} ${owned?'':'locked'}"><div class="gacha-result-icon">${owned?item.icon:'❔'}</div><div class="gacha-collection-info"><strong>${owned?escapeHtml(item.name):`${item.rarity} 未獲得`}</strong><small>${item.rarity}・${item.type==='avatar'?'アイコン':item.type==='frame'?'フレーム':item.type==='title'?'称号':item.type==='theme'?'テーマ':'限定セット'}</small></div>${owned?`<button class="btn ${active?'btn-success':'btn-purple'}" ${active?'disabled':''} onclick="equipGachaItem('${item.id}')">${active?'使用中':'使う'}</button>`:''}</article>`;}).join('')}</div>`;
}
function rollBgmGachaItem(){
  const roll=Math.random();let cursor=0,rarity='R';
  for(const [key,rate] of Object.entries(BGM_GACHA_RATES)){cursor+=rate;if(roll<cursor){rarity=key;break;}}
  const pool=BGM_GACHA_ITEMS.filter(item=>item.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}
function grantBgmGachaItem(item){
  if(saveData.ownedBgm.includes(item.id))return {item,isNew:false};
  saveData.ownedBgm.push(item.id);return {item,isNew:true};
}
function drawBgmGacha(count){
  normalizeSave();count=count===10?10:1;const cost=count*500;
  if(saveData.totalScore<cost){showToast(`ポイントが足りません（必要 ${cost.toLocaleString()}pt）`,'#ff6b6b');return;}
  saveData.totalScore-=cost;
  const results=Array.from({length:count},()=>grantBgmGachaItem(rollBgmGachaItem()));
  saveData.bgmGachaDraws+=count;persistSave();updateUI();syncOnlineProfile();renderBgmGacha(results);bgmRenderTracks();showGachaReveal(results,'bgm');
  const newCount=results.filter(result=>result.isNew).length;
  showToast(newCount?`🎧 新しいBGMを${newCount}曲入手！`:'重複しました（獲得アイテムなし）',newCount?'#6bcb77':'#8d8aa5');
}
function renderBgmGacha(results=[]){
  const el=document.getElementById('bgm-gacha-area');if(!el)return;
  const rates=Object.entries(BGM_GACHA_RATES).map(([rarity,rate])=>`<div class="gacha-rate rarity-${rarity}"><strong>${rarity}</strong>${rate*100}%</div>`).join('');
  const resultHtml=results.length?gachaResultCards(results,'bgm'):'';
  el.innerHTML=`<div class="gacha-panel"><h3>🎼 ミュージックコレクション</h3><p class="meta-sub">全9曲のBGM専用ガチャです。入手した曲は「その他 → BGM」から再生できます。</p><div class="gacha-wallet"><span>💰 ${saveData.totalScore.toLocaleString()}pt</span><span>🎧 ${saveData.ownedBgm.length}/${BGM_GACHA_ITEMS.length}曲</span><span>🎟️ 累計 ${saveData.bgmGachaDraws.toLocaleString()}回</span></div><div class="gacha-actions"><button class="btn btn-purple" onclick="drawBgmGacha(1)">1回引く　500pt</button><button class="btn btn-warn" onclick="drawBgmGacha(10)">10回引く　5,000pt<br><small>レア確定なし</small></button></div><div class="gacha-rates">${rates}</div><div class="privacy-note">天井・確定枠はありません。同じ曲が出た場合、ポイント・メダル・アイテムなどの補償はありません。現実のお金は使用しません。</div>${resultHtml}</div><h2 class="shop-section-title">🎵 楽曲一覧 <span class="meta-sub">${saveData.ownedBgm.length}/${BGM_GACHA_ITEMS.length}</span></h2><div class="gacha-collection">${BGM_GACHA_ITEMS.map(item=>{const owned=saveData.ownedBgm.includes(item.id);return `<article class="gacha-collection-card rarity-${item.rarity} ${owned?'':'locked'}"><div class="gacha-result-icon">${owned?item.icon:'🔒'}</div><div class="gacha-collection-info"><strong>${escapeHtml(item.name)}</strong><small>${item.rarity}・${owned?'入手済み':'未入手'}</small></div>${owned?`<button class="btn btn-purple" onclick="playBgmReward('${item.id}')">再生する</button>`:''}</article>`;}).join('')}</div>`;
}
function renderShopPage(gachaResults=[]){
  renderGacha(gachaResults);
  renderBgmGacha();
  const el=document.getElementById('shop-grid');if(!el)return;
  el.innerHTML=Object.entries(THEMES).filter(([,t])=>!t.gachaOnly).map(([id,t])=>{
    const owned=saveData.ownedThemes.includes(id),active=saveData.activeTheme===id;
    return `<article class="shop-card ${active?'active':''}"><h3>${active?'✅ ':owned?'🎨 ':'🔒 '}${escapeHtml(t.name)}</h3><p>${escapeHtml(t.desc||'カラーテーマ')}</p><div class="theme-dots">${t.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</div><button class="btn ${active?'btn-success':owned?'btn-purple':'btn-warn'}" ${active?'disabled':''} onclick="buyTheme('${id}')">${active?'使用中':owned?'このテーマを使う':t.price.toLocaleString()+'ptで購入'}</button></article>`;
  }).join('');
  const avatarEl=document.getElementById('avatar-shop-grid');if(!avatarEl)return;
  avatarEl.innerHTML=AVATAR_ITEMS.filter(item=>!item.gachaOnly).map(item=>{
    const owned=saveData.ownedAvatars.includes(item.icon),active=saveData.profile.avatar===item.icon;
    return `<article class="shop-card avatar-shop-card ${active?'active':''}"><div class="avatar-shop-icon">${item.icon}</div><h3>${escapeHtml(item.name)}</h3><p>${item.price===0?'最初から使える無料アイコン':'プロフィールとランキングで使えるアイコン'}</p><button class="btn ${active?'btn-success':owned?'btn-purple':'btn-warn'}" ${active?'disabled':''} onclick="buyAvatar('${item.icon}')">${active?'使用中':owned?'このアイコンを使う':item.price.toLocaleString()+'ptで購入'}</button></article>`;
  }).join('');
}
function openShop(){
  goHome();document.getElementById('home').style.display='none';document.getElementById('shop-page').style.display='block';document.getElementById('back-btn').style.display='inline-block';document.body?.classList.add('has-back');setTaskbarActive('shop');renderShopPage();window.scrollTo({top:0,behavior:'smooth'});
}
function openStorePage(name){
  if(!['gacha','bgm-gacha','items'].includes(name))return;
  openShop();
  document.getElementById('shop-page').style.display='none';
  document.getElementById(`${name}-page`).style.display='block';
}

function loadSave() {
  try {
    const raw = localStorage.getItem('minigameland_save');
    const d = raw ? JSON.parse(raw) : null;
    if (d) Object.assign(saveData, d);
    // Saves from before lifetime tracking start from the current balance.
    if (!Number.isFinite(d?.pointsEarned)) saveData.pointsEarned = Math.max(0, Math.floor(Number(saveData.totalScore) || 0));
    normalizeSave(); applyTheme();
    const today = localDateKey();
    if (saveData.dailyBonus !== today) {
      saveData.dailyBonus = today; saveData.totalScore += 50; trackEarned(50);
      setTimeout(() => showToast('🌅 デイリーボーナス +50pt！', '#ffd93d'), 800);
      persistSave();
    }
  } catch(e) {}
  renderColorModeControls();
  updateUI();syncOnlineProfile();
}
function persistSave() {
  try { localStorage.setItem('minigameland_save', JSON.stringify(saveData)); } catch(e) {}
}

function updateUI() {
  document.getElementById('lv-num').textContent = saveData.level;
  document.getElementById('lv-num').style.fontSize=saveData.level>=1000?'16px':saveData.level>=100?'18px':'22px';
  document.getElementById('tb-lv').textContent = saveData.level >= MAX_LEVEL ? 'MAX' : 'Lv.' + saveData.level;
  document.getElementById('tb-pt').textContent = saveData.totalScore.toLocaleString() + ' pt';
  document.getElementById('stat-wins').textContent = saveData.wins;
  document.getElementById('stat-total').textContent = saveData.totalScore.toLocaleString();
  const profileBtn=document.getElementById('profile-btn');
  if(profileBtn){
    const profileName=saveData.profile?.username||'プレイヤー';
    profileBtn.textContent=saveData.profile?.avatar||'🎮';
    profileBtn.setAttribute('aria-label',`${profileName}のプロフィールを開く`);
    profileBtn.title=`${profileName}${activeTitleText()?`・${activeTitleText()}`:''}`;
  }

  const lvName = getLvName(saveData.level);
  document.getElementById('lv-name').textContent = lvName + (saveData.streak >= 3 ? ` 🔥×${saveData.streak}` : '');

  // レベル1000（カンスト）の時の表示処理
  if (saveData.level >= MAX_LEVEL) {
    document.getElementById('lv-bar').style.width = '100%';
    document.getElementById('lv-xp-text').textContent = 'MAX LEVEL';
  } else {
    const xpNeeded = getXpNeeded(saveData.level);
    const pct = Math.min(100, Math.round(saveData.xp / xpNeeded * 100));
    document.getElementById('lv-bar').style.width = pct + '%';
    document.getElementById('lv-xp-text').textContent = saveData.xp + ' / ' + xpNeeded + ' XP';
  }
}

let collectionView='avatars';
function collectionCatalog(){
  return {
    avatars:AVATAR_ITEMS.map(item=>({...item,id:item.icon,owned:saveData.ownedAvatars.includes(item.icon),source:item.gachaOnly?'gacha':'items'})),
    titles:GACHA_ITEMS.filter(item=>item.type==='title'||item.type==='bundle').map(item=>({...item,owned:saveData.gachaInventory.includes(item.id),source:'gacha'})),
    frames:GACHA_ITEMS.filter(item=>item.type==='frame'||item.type==='bundle').map(item=>({...item,owned:saveData.gachaInventory.includes(item.id),source:'gacha'})),
    bgm:BGM_GACHA_ITEMS.map(item=>({...item,owned:saveData.ownedBgm.includes(item.id),source:'bgm-gacha'}))
  };
}
function setCollectionView(name){if(!['avatars','titles','frames','bgm'].includes(name))return;collectionView=name;renderCollectionPage();}
function equipCollectionAvatar(icon){if(!saveData.ownedAvatars.includes(icon))return;buyAvatar(icon);renderCollectionPage();}
function equipCollectionItem(id){equipGachaItem(id);renderCollectionPage();}
function renderCollectionPage(){
  const grid=document.getElementById('collection-grid'),summary=document.getElementById('collection-summary');if(!grid||!summary)return;
  const catalog=collectionCatalog(),all=Object.values(catalog).flat(),owned=all.filter(item=>item.owned).length,current=catalog[collectionView];
  summary.innerHTML=`<div class="collection-summary-card"><strong>${owned} / ${all.length}</strong><span>全体の収集数</span></div><div class="collection-summary-card"><strong>${Math.round(owned/all.length*100)}%</strong><span>図鑑達成率</span></div>`;
  document.querySelectorAll('[data-collection-tab]').forEach(button=>{const selected=button.dataset.collectionTab===collectionView;button.setAttribute('aria-pressed',String(selected));button.style.background=selected?'var(--accent4)':'';button.style.color=selected?'#fff':'';});
  grid.innerHTML=current.map(item=>{
    const active=collectionView==='avatars'?saveData.profile.avatar===item.icon:collectionView==='titles'?saveData.activeTitle===item.id:collectionView==='frames'?saveData.activeFrame===item.id:collectionView==='bgm'&&bgm.current>=0&&bgm.tracks[bgm.current]?.unlockId===item.id;
    const icon=item.owned?item.icon:'❔',source=item.source==='items'?'ショップ':item.source==='bgm-gacha'?'BGMガチャ':'コレクションガチャ';
    const action=item.owned?(collectionView==='avatars'?`onclick="equipCollectionAvatar('${item.icon}')"`:collectionView==='bgm'?`onclick="playBgmReward('${item.id}');renderCollectionPage()"`:`onclick="equipCollectionItem('${item.id}')"`):`onclick="${item.source==='items'?'openStorePage(\'items\')':item.source==='bgm-gacha'?'openStorePage(\'bgm-gacha\')':'openStorePage(\'gacha\')'}"`;
    const label=active?'使用中':item.owned?(collectionView==='bgm'?'再生する':'使う'):`${source}へ`;
    return `<article class="collection-card ${item.owned?'':'locked'}"><div class="collection-card-icon ${collectionView==='frames'&&item.owned?'profile-avatar '+(item.frameClass||'frame-secret'):''}">${icon}</div><strong>${escapeHtml(item.name)}</strong><small>${item.rarity?item.rarity+'・':''}${item.owned?'入手済み':`未入手・${source}`}</small><button class="btn ${active?'btn-success':item.owned?'btn-purple':'btn-warn'}" ${active?'disabled':''} ${action}>${label}</button></article>`;
  }).join('');
}

function renderMetaDashboard(){
  normalizeSave();
  const allDailyDone=DAILY_MISSIONS.every(m=>saveData.daily.claimed.includes(m.id));
  const missionEl=document.getElementById('daily-missions');
  if(missionEl)missionEl.innerHTML=DAILY_MISSIONS.map(m=>{
    const value=Math.min(saveData.daily[m.key],m.target), done=saveData.daily.claimed.includes(m.id);
    return `<div class="mission-item ${done?'done':''}"><div class="mission-head"><span>${done?'✅':'○'} ${m.label}</span><span class="mission-reward">${done?'受取済':'+'+m.reward+'pt'}</span></div><div class="mission-progress"><span style="width:${value/m.target*100}%"></span></div><div class="meta-sub" style="margin-top:4px">${value} / ${m.target}</div></div>`;
  }).join('')+`<div class="mission-item ${allDailyDone?'done':''}" style="margin-top:10px;border-style:dashed"><div class="mission-head"><span>🎁 デイリー全達成コンプリートボーナス</span><span class="mission-reward">${allDailyDone?'受取済':'+150pt ＆ 🪙3メダル'}</span></div><div class="meta-sub" style="margin-top:4px">${DAILY_MISSIONS.filter(m=>saveData.daily.claimed.includes(m.id)).length} / ${DAILY_MISSIONS.length} 達成</div></div>`;
  const widgetEl=document.getElementById('home-daily-widget');
  if(widgetEl){
    const pickup=getDailyPickupGame();
    const doneCount=DAILY_MISSIONS.filter(m=>saveData.daily.claimed.includes(m.id)).length;
    widgetEl.innerHTML=`<div class="pickup-card" role="button" tabindex="0" onclick="startGame('${pickup.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();startGame('${pickup.id}');}"><div class="pickup-icon">${pickup.icon}</div><div class="pickup-body"><span class="pickup-badge">🔥 本日のピックアップ（報酬+20%）</span><div class="pickup-title">${escapeHtml(pickup.title)}</div><div class="pickup-desc">${escapeHtml(pickup.desc)}</div></div></div><div class="daily-mini-box"><div class="daily-mini-head"><span>📅 デイリーミッション (${doneCount}/${DAILY_MISSIONS.length})</span><button class="section-link" type="button" onclick="openFeaturePage('daily')">詳細 →</button></div><div class="daily-mini-pills">${DAILY_MISSIONS.map(m=>{const d=saveData.daily.claimed.includes(m.id);return `<span class="daily-mini-pill ${d?'done':''}">${d?'✅':'○'} ${escapeHtml(m.label)}</span>`;}).join('')}</div><div class="meta-sub">${allDailyDone?'🎉 全達成ボーナス獲得済み！':'3つすべて達成で +150pt ＆ 🪙3メダル！'}</div></div>`;
  }
  renderAchievementList();
  renderLocalRanking(rankingGame);
  const challengeEl=document.getElementById('random-challenge');
  if(challengeEl){const ch=saveData.activeChallenge;challengeEl.innerHTML=ch?`<div class="challenge-box"><div class="challenge-game">${ch.completed?'✅':'挑戦中'} ${challengeText(ch)}</div><div class="meta-sub">報酬 +${ch.reward}pt ／ 累計クリア ${saveData.challengeClears}回</div><div class="flex-center mt">${ch.completed?'<button class="btn btn-warn btn-sm" onclick="startRandomChallenge()">次の挑戦</button>':`<button class="btn btn-sm" onclick="startGame('${ch.gameId}')">挑戦する</button>`}<button class="btn btn-sm" style="background:var(--surface2)" onclick="abandonChallenge()">変更</button></div></div>`:`<div class="meta-sub" style="margin-bottom:10px">ゲームと目標をランダムに選びます。達成報酬は120pt！</div><button class="btn btn-purple" style="width:100%" onclick="startRandomChallenge()">🎲 挑戦を選ぶ</button>`;}
}

async function renderLocalRanking(gameId){
  rankingGame=gameId||rankingGame;
  const el=document.getElementById('local-ranking');if(!el)return;
  const requestedGame=rankingGame,requestedMode=rankingMode;
  const tabs=`<div class="ranking-mode-tabs"><button class="ranking-mode-tab ${requestedMode==='game'?'active':''}" onclick="setRankingMode('game')">🎮 ゲーム別</button><button class="ranking-mode-tab ${requestedMode==='level'?'active':''}" onclick="setRankingMode('level')">⭐ レベル</button><button class="ranking-mode-tab ${requestedMode==='points'?'active':''}" onclick="setRankingMode('points')">💰 所持pt</button><button class="ranking-mode-tab ${requestedMode==='earned'?'active':''}" onclick="setRankingMode('earned')">🏆 累計スコア</button></div>`;
  const gameSelect=requestedMode==='game'?`<div class="ranking-controls"><select onchange="renderLocalRanking(this.value)" aria-label="ランキングのゲーム">${GAME_DEFS.map(g=>`<option value="${g.id}" ${g.id===requestedGame?'selected':''}>${g.icon} ${g.title}</option>`).join('')}</select></div>`:'';
  const controls=tabs+gameSelect;
  el.innerHTML=controls+'<div class="meta-sub" style="padding:12px 0;text-align:center">順位を読み込み中…</div>';
  try{
    const query=requestedMode==='game'?`gameId=${encodeURIComponent(requestedGame)}&rulesVersion=${SCORE_RULES_VERSION}`:`type=${requestedMode}`;
    const response=await fetch(`/api/rankings?${query}`,{cache:'no-store'});
    if(!response.ok)throw new Error('取得できませんでした');
    const data=await response.json();
    if(rankingGame!==requestedGame||rankingMode!==requestedMode)return;
    const rows=Array.isArray(data.rows)?data.rows:[];
    const value=r=>requestedMode==='level'?`Lv.${Number(r.level).toLocaleString()}`:requestedMode==='points'?`${Number(r.totalPoints).toLocaleString()} pt`:requestedMode==='earned'?Number(r.totalScore).toLocaleString():Number(r.score).toLocaleString();
    const date=r=>new Date(requestedMode==='game'?r.playedAt:r.updatedAt).toLocaleDateString('ja-JP');
    const note=requestedMode==='game'?`ルール v${SCORE_RULES_VERSION}・プレイヤー別ベスト上位10人`:requestedMode==='level'?'レベル上位10人（同レベルは所持ポイント順）':requestedMode==='earned'?'全ゲームで記録したスコアの累計 上位10人':'現在の所持ポイント上位10人';
    el.innerHTML=controls+`${rows.length?rows.map((r,i)=>`<div class="ranking-row"><span class="ranking-rank">${i+1}</span><span>${escapeHtml(r.avatar||'🎮')} ${escapeHtml(r.username||'プレイヤー')}<br><span class="meta-sub">更新 ${date(r)}</span></span><span class="ranking-score">${value(r)}</span></div>`).join(''):'<div class="meta-sub" style="padding:18px 0;text-align:center">まだ記録がありません。ゲームを遊ぶと登録されます。</div>'}<div class="meta-sub" style="margin-top:8px">${note}</div>`;
  }catch(error){
    if(rankingGame!==requestedGame||rankingMode!==requestedMode)return;
    el.innerHTML=controls+'<div class="meta-sub" style="padding:12px 0;text-align:center">順位を取得できませんでした。時間をおいて再度お試しください。</div>';
  }
}
function setRankingMode(mode){if(!['game','level','points','earned'].includes(mode))return;rankingMode=mode;renderLocalRanking(rankingGame);}

function renderGameFilters(){
  const tags=['すべて',...new Set(GAME_DEFS.map(g=>g.tag))],row=document.getElementById('game-filters');
  if(row)row.innerHTML=tags.map(t=>`<button class="filter-chip ${gameTagFilter===t?'active':''}" onclick="setGameTag('${t}')">${escapeHtml(t)}</button>`).join('');
  const fav=document.getElementById('favorite-filter');if(fav){fav.classList.toggle('active',favoriteOnly);fav.textContent=`${favoriteOnly?'★':'☆'} お気に入り (${saveData.favoriteGames.length})`;}
}
function renderGameGrid(gridId='games-grid',gamesList=null){
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  const query=gameSearchText.trim().toLocaleLowerCase('ja');
  let list=gamesList?[...gamesList]:GAME_DEFS.filter(g=>(gameTagFilter==='すべて'||g.tag===gameTagFilter)&&(!favoriteOnly||saveData.favoriteGames.includes(g.id))&&`${g.title} ${g.desc} ${g.tag}`.toLocaleLowerCase('ja').includes(query));
  if(gridId==='games-grid'&&!gamesList){
    if(gameSortMode==='highscore')list.sort((a,b)=>(saveData.highscores[b.id]||0)-(saveData.highscores[a.id]||0));
    else if(gameSortMode==='mastery')list.sort((a,b)=>getMastery(b.id).xp-getMastery(a.id).xp);
    else if(gameSortMode==='plays')list.sort((a,b)=>(saveData.gameStats?.[b.id]?.plays||0)-(saveData.gameStats?.[a.id]?.plays||0));
    else if(gameSortMode==='unplayed')list.sort((a,b)=>(saveData.gameStats?.[a.id]?.plays||0)-(saveData.gameStats?.[b.id]?.plays||0));
  }
  const pickup=getDailyPickupGame();
  list.forEach(g => {
    const hs = saveData.highscores[g.id] || 0;
    const mastery = getMastery(g.id);
    const plays = saveData.gameStats?.[g.id]?.plays || 0;
    const stars = '★'.repeat(mastery.level) + '☆'.repeat(5 - mastery.level);

    const card = document.createElement('div');
    card.className = 'game-card';card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`${g.title}を遊ぶ`);
    card.style.cssText = `--card-color:${g.color}`;
    const favorite=saveData.favoriteGames.includes(g.id);
    card.innerHTML = `<button class="favorite-btn ${favorite?'active':''}" aria-label="${favorite?'お気に入りから外す':'お気に入りに追加'}" onclick="event.stopPropagation();toggleFavorite('${g.id}')">${favorite?'★':'☆'}</button><span class="game-icon">${g.icon}</span><div class="game-title">${g.title}${pickup?.id===g.id?' <span class="pickup-badge" style="font-size:10px;padding:1px 6px;vertical-align:middle">PICKUP</span>':''}</div><div class="game-desc">${g.desc}</div><div class="game-meta"><span class="game-tag">${g.tag}</span><span class="game-hs">最高: <span>${hs.toLocaleString()}</span></span></div><div class="card-submeta"><span class="card-mastery" title="マスタリー Lv.${mastery.level}">${stars}</span><span>${plays?`プレイ ${plays}回`:'✨ 未プレイ'}</span></div>`;
    card.onclick = () => startGame(g.id);
    card.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target===card){e.preventDefault();startGame(g.id);}};
    grid.appendChild(card);
  });
  if(!list.length)grid.innerHTML=gridId==='favorite-games-grid'?'<div class="games-empty">ゲームの★を押すと、ここからすぐ遊べます。<br><button class="btn btn-sm mt" onclick="openGameLibrary()">お気に入りを探す</button></div>':'<div class="games-empty">条件に合うゲームがありません。検索や絞り込みを変更してください。</div>';
  if(gridId==='games-grid')renderGameFilters();
}
function renderHomeGames(){
  const recent=(saveData.recentGames||[]).map(id=>GAME_DEFS.find(g=>g.id===id)).filter(Boolean).slice(0,4);
  document.getElementById('recent-games-title').textContent=recent.length?'最近遊んだゲーム':'まずはこの4本';
  renderGameGrid('recent-games-grid',recent.length?recent:['memory','quiz','pinball','slide'].map(id=>GAME_DEFS.find(g=>g.id===id)).filter(Boolean));
  renderGameGrid('favorite-games-grid',saveData.favoriteGames.map(id=>GAME_DEFS.find(g=>g.id===id)).filter(Boolean).slice(0,6));
}
let homeView='simple';
function setHomeView(view){
  if(!['simple','all','random'].includes(view))return;
  homeView=view;
  document.querySelectorAll('[data-home-view]').forEach(tab=>{
    const selected=tab.dataset.homeView===view;
    tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
  });
  for(const [mode,id] of [['simple','home-simple'],['all','library-page'],['random','home-random']])document.getElementById(id).hidden=mode!==view;
  if(view==='all')renderGameGrid();
}
function handleHomeTabKey(event){
  const modes=['simple','all','random'];
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const index=modes.indexOf(homeView);
  const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;
  setHomeView(modes[next]);document.getElementById(`home-tab-${modes[next]}`).focus();
}
function openGameLibrary(onlyFavorites=false){
  favoriteOnly=onlyFavorites;gameSearchText='';gameTagFilter='すべて';
  goHome();setHomeView('all');window.scrollTo({top:0,behavior:'smooth'});
}
function playRandomGame(){startGame(GAME_DEFS[Math.floor(Math.random()*GAME_DEFS.length)].id);}
function setGameSearch(value){gameSearchText=value;renderGameGrid();}
function setGameTag(tag){gameTagFilter=tag;renderGameGrid();}
function setGameSort(mode){if(!['default','highscore','mastery','plays','unplayed'].includes(mode))return;gameSortMode=mode;renderGameGrid();}
function toggleFavoriteFilter(){favoriteOnly=!favoriteOnly;renderGameGrid();}
function toggleFavorite(gameId){
  const i=saveData.favoriteGames.indexOf(gameId);if(i>=0)saveData.favoriteGames.splice(i,1);else saveData.favoriteGames.push(gameId);
  persistSave();renderGameGrid();renderHomeGames();showToast(i>=0?'お気に入りから外しました':'お気に入りに追加しました',i>=0?'#a7a9be':'#ffd93d');
}
function renderHome() {
  setHomeView(homeView);
  const search=document.getElementById('game-search');if(search)search.value=gameSearchText;
  const sortEl=document.getElementById('game-sort');if(sortEl)sortEl.value=gameSortMode;
  renderGameGrid();
  renderHomeGames();
  renderMetaDashboard();
  updateUI();
}

function addXP(baseXp) {
  if (saveData.level >= MAX_LEVEL) return 0; // カンスト時はXPを獲得しない

  const mult = getXpMult(saveData.level);
  const streakBonus = saveData.streak >= 3 ? 1 + (saveData.streak - 2) * 0.1 : 1;
  const finalXp = Math.round(baseXp * mult * streakBonus);
  saveData.xp += finalXp;

  let leveled = false;
  // 一気に複数レベル上がる場合のループ
  while (saveData.level < MAX_LEVEL) {
    const needed = getXpNeeded(saveData.level);
    if (saveData.xp >= needed) {
      saveData.xp -= needed;
      saveData.level++;
      leveled = true;
    } else {
      break;
    }
  }

  // 1000を超えないようにストッパーをかける
  if (saveData.level >= MAX_LEVEL) {
    saveData.level = MAX_LEVEL;
    saveData.xp = 0;
  }

  if (leveled) showLvUp();
  persistSave();
  updateUI();
  return finalXp;
}

// 賭けゲームは入出金をそのまま反映し、通常ゲームはスコアを一定範囲の報酬へ換算する。
// これによりゲームごとのスコア桁数が違っても、ショップ・ガチャの経済が崩れにくくなる。
const DIRECT_POINT_GAMES = new Set(['blackjack','roulette','slot','pachinko']);

// 長さや難しさが異なるゲームを、1プレイあたりおおむね同じ価値にそろえる。
const GAME_REWARD_BALANCE = {
  reaction:{mult:.65,cap:70},quiz:{mult:1.55,cap:90},hangman:{mult:1.05,cap:95},
  solitaire:{mult:1.35,cap:150},sokoban:{mult:1.25,cap:145},reversi:{mult:1.15,cap:135},
  minesweeper:{mult:1.15,cap:135},pong:{mult:1.1,cap:130},fighter:{mult:1.1,cap:130},
  memory:{mult:1.05,cap:125},shiritori:{mult:1.05,cap:125},simon:{mult:1.05,cap:125},
  fruitmerge:{mult:1.15,cap:140},whackamole:{mult:1.0,cap:125},blockpuzzle:{mult:1.15,cap:135},highlow:{mult:1.1,cap:135}
};
function rewardVarietyMultiplier(gameId) {
  const recent=(saveData.scoreHistory||[]).slice(0,2);
  if(!recent.length||!gameId)return 1;
  if(recent[0].gameId!==gameId)return 1.1;
  return recent.length>1&&recent[1].gameId===gameId ? .8 : 1;
}
function gamePointReward(score, won=false, gameId='') {
  const raw = Math.max(0, Number(score) || 0);
  const balance=GAME_REWARD_BALANCE[gameId]||{mult:1,cap:120};
  if (raw <= 0) return won ? Math.round(30*rewardVarietyMultiplier(gameId)) : 0;
  if (won) return Math.min(balance.cap,Math.round((30+Math.sqrt(raw)*1.5)*balance.mult*rewardVarietyMultiplier(gameId)));
  return Math.min(25,Math.round((5+Math.sqrt(raw)*.35)*Math.min(1,balance.mult)));
}

// Lifetime points earned (never decreases when spending). Slot and pachinko take the bet up front,
// so only the part of a payout above the outstanding stake counts.
const casinoStake={slot:0,pachinko:0};
function trackEarned(n){saveData.pointsEarned=Math.max(0,Math.floor(Number(saveData.pointsEarned)||0))+Math.max(0,Math.round(Number(n)||0));}
function trackCasinoBet(gameId,bet){casinoStake[gameId]=(casinoStake[gameId]||0)+Math.max(0,Number(bet)||0);}
function addScore(n, gameId, won=false) {
  const raw = Math.max(0, Number(n) || 0);
  if (raw <= 0 && !won) return 0;
  const pickupBonus = (!DIRECT_POINT_GAMES.has(gameId) && getDailyPickupGame()?.id === gameId) ? 1.2 : 1;
  const reward = DIRECT_POINT_GAMES.has(gameId) ? raw : Math.round(gamePointReward(raw, won, gameId) * pickupBonus);
  if(resultSession?.gameId===gameId)resultSession.points+=reward;
  saveData.totalScore += reward;
  if(gameId in casinoStake){const stake=casinoStake[gameId];trackEarned(reward-stake);casinoStake[gameId]=Math.max(0,stake-reward);}else trackEarned(reward);
  normalizeSave(); saveData.daily.score += reward;
  if (gameId && raw > (saveData.highscores[gameId] || 0)) { saveData.highscores[gameId] = raw; }
  document.getElementById('tb-pt').textContent = saveData.totalScore.toLocaleString() + ' pt';
  document.getElementById('stat-total').textContent = saveData.totalScore.toLocaleString();
  checkMetaProgress();
  return reward;
}

let resultSession=null;
let resultTimer=null;
function presentGameResult(gameId,score,won,forceFinal=false,headingOverride=''){
  const session=resultSession;
  if(!session||session.gameId!==gameId||(gameId==='monster'&&won))return;
  clearTimeout(resultTimer);
  const betting=DIRECT_POINT_GAMES.has(gameId);
  if(betting&&!forceFinal){
    if(gameId==='pachinko')return;
    const roundNet=saveData.totalScore-session.wallet;
    session.wallet=saveData.totalScore;
    resultTimer=gameDelay(()=>showCasinoRoundActions(gameId,roundNet),0);
    return;
  }
  if(resultSession!==session||!document.body.classList.contains('playing-game'))return;
  const game=GAME_DEFS.find(g=>g.id===gameId),net=saveData.totalScore-(forceFinal?session.initialWallet:session.wallet);
  const heading=headingOverride||(betting?(net>0?'🎉 勝利！':net<0?'ゲーム終了':'🤝 引き分け'):won?'🎉 クリア！':'ゲームオーバー');
  const achievements=saveData.achievements.filter(id=>!session.achievements.includes(id)).length;
  const missions=saveData.daily.claimed.filter(id=>!session.missions.includes(id)).length;
  const isNewRecord=!betting&&score>session.best&&score>0;
  if(isNewRecord||won)launchConfetti(isNewRecord?36:20);
  const mastery=getMastery(gameId);
  const masteryBar=mastery.next?Math.min(100,Math.round(mastery.xp/mastery.next*100)):100;
  document.getElementById('unified-result')?.remove();
  const overlay=document.createElement('div');overlay.id='unified-result';overlay.className='result-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','unified-result-title');
  overlay.innerHTML=`<section class="result-box">${isNewRecord?'<div class="new-record-badge">✨ NEW RECORD! ✨</div>':''}<p class="result-game">${escapeHtml(game?.title||gameId)}</p><h2 id="unified-result-title" tabindex="-1">${heading}</h2>${session.detailHtml||''}<p>${betting?'今回の収支':'今回のスコア'}</p><div class="result-score">${betting?(net>=0?'+':'')+net.toLocaleString()+'pt':Number(score).toLocaleString()}</div>${betting?'':`<p>${score>session.best?'🏆 自己ベスト更新！':'自己ベスト '+session.best.toLocaleString()}${score>session.best&&session.best>0?'（前回 '+session.best.toLocaleString()+'）':''}</p>`}<div class="profile-stats" style="margin-top:20px;grid-template-columns:1fr 1fr"><div class="profile-stat"><strong>+${session.points.toLocaleString()}pt</strong><span>${betting?'獲得':'ゲーム報酬'}</span></div><div class="profile-stat"><strong>+${session.xp.toLocaleString()} XP</strong><span>獲得経験値</span></div></div><div class="mission-item" style="margin-top:12px;text-align:left"><div class="mission-head"><span>⭐ マスタリー Lv.${mastery.level}/5 (${'★'.repeat(mastery.level)+'☆'.repeat(5-mastery.level)})</span><span class="meta-sub">${mastery.next?`${mastery.xp}/${mastery.next} XP`:'MAX'}</span></div><div class="mission-progress"><span style="width:${masteryBar}%"></span></div></div>${achievements||missions?`<p>🏅 実績 ${achievements}件 ／ 📅 ミッション ${missions}件達成</p>`:''}<div class="modal-btns">${betting?'':`<button class="btn" onclick="startGame('${gameId}')">もう一度</button>`}<button class="btn result-home-btn" onclick="goHome()">ホームへ</button></div></section>`;
  setUnifiedResultMode(true);document.body.appendChild(overlay);overlay.querySelector('h2').focus();
}
function setUnifiedResultMode(open){
  const screen=document.getElementById('game-screen');document.body.classList.toggle('result-open',open);updateQuitBar();
  if(open){screen.setAttribute('inert','');screen.setAttribute('aria-hidden','true');}
  else{screen.removeAttribute('inert');screen.removeAttribute('aria-hidden');}
}
function showCasinoRoundActions(gameId,roundNet){
  if(resultSession?.gameId!==gameId||!document.body.classList.contains('playing-game'))return;
  document.getElementById('casino-round-actions')?.remove();
  const buttons=`<button class="btn" onclick="continueCasinoGame('${gameId}')">もう一度</button><button class="btn btn-danger" onclick="finishCasinoSession('${gameId}')">終了</button>`;
  const nativeResult=gameId==='blackjack'?document.querySelector('#game-screen .result-box'):null;
  let box;
  if(nativeResult){box=document.createElement('div');box.id='casino-round-actions';box.className='modal-btns casino-round-buttons';box.innerHTML=buttons;nativeResult.appendChild(box);}
  else{box=document.createElement('section');box.id='casino-round-actions';box.className='casino-round-actions';box.innerHTML=`<strong>今回の収支 ${(roundNet>=0?'+':'')+roundNet.toLocaleString()}pt</strong><div class="modal-btns">${buttons}</div>`;document.getElementById('game-screen').appendChild(box);}
  document.getElementById('rl-spin-btn')?.setAttribute('disabled','');
  document.getElementById('slot-spin-btn')?.setAttribute('disabled','');
  box.querySelector('button')?.focus();
}
function continueCasinoGame(gameId){
  document.getElementById('casino-round-actions')?.remove();
  if(gameId==='blackjack'&&typeof window.bjNext==='function')window.bjNext();
  else{
    const spinId=gameId==='roulette'?'rl-spin-btn':gameId==='slot'?'slot-spin-btn':'';
    if(spinId)document.getElementById(spinId)?.removeAttribute('disabled');
  }
}
function finishCasinoSession(gameId){
  document.getElementById('casino-round-actions')?.remove();
  const session=resultSession;if(!session||session.gameId!==gameId)return;
  session.finished=true;presentGameResult(gameId,saveData.totalScore-session.initialWallet,saveData.totalScore>=session.initialWallet,true);
}
function claimTerminalResult(gameId,won){
  const session=resultSession;if(!session||session.gameId!==gameId)return false;
  const repeatable=DIRECT_POINT_GAMES.has(gameId)||(gameId==='monster'&&won);
  if(!repeatable&&session.finished)return false;
  if(!repeatable)session.finished=true;
  return true;
}
function recordWin(gameId, score) {
  if(!claimTerminalResult(gameId,true))return 0;
  playSfx('win');
  normalizeSave();
  saveData.wins++;
  saveData.streak = (saveData.streak || 0) + 1;
  saveData.daily.wins++;
  const stat=saveData.gameStats[gameId]||(saveData.gameStats[gameId]={plays:0,wins:0});stat.wins++;
  document.getElementById('stat-wins').textContent = saveData.wins;
  const points = addScore(score, gameId, true);
  const gained = addXP(score);
  if(resultSession?.gameId===gameId)resultSession.xp+=gained;
  recordGameResult(gameId,score,true);
  checkMetaProgress();
  if (!DIRECT_POINT_GAMES.has(gameId) && points > 0) showToast(`🎮 ゲーム報酬 +${points}pt`);
  presentGameResult(gameId,score,true);
  return gained;
}

// Ends a game without a win or loss (draws, local two-player matches): no reward, streak kept.
function recordNeutral(gameId,heading) { if(!claimTerminalResult(gameId,false))return 0;recordGameResult(gameId,0,false);checkMetaProgress();presentGameResult(gameId,0,false,false,heading);return 0; }
// Ends a run the player chose to stop: keeps the score so far, shows the result, and
// leaves the win streak alone (stopping is not a loss).
function recordQuit(gameId,score=0) { if(!claimTerminalResult(gameId,false))return 0;score=Math.max(0,Math.round(Number(score)||0));if(score>0)addScore(score,gameId);recordGameResult(gameId,score,false);checkMetaProgress();presentGameResult(gameId,score,false,false,'🏁 ここで終了');return 0; }
// Games that can't otherwise be ended early set el._quit; the bar above the game calls it.
function updateQuitBar(){
  const bar=document.getElementById('game-quit-bar'),gs=document.getElementById('game-screen');if(!bar||!gs)return;
  bar.hidden=!(document.body.classList.contains('playing-game')&&!document.body.classList.contains('result-open')&&typeof gs._quit==='function'&&resultSession&&!resultSession.finished);document.body.classList.toggle('has-quit',!bar.hidden);
}
function quitGame(){
  const gs=document.getElementById('game-screen');
  if(typeof gs._quit!=='function'||!resultSession||resultSession.finished)return;
  if(!confirm('ここで終了して、今までの成績で結果を表示しますか？'))return;
  gs._quit();updateQuitBar();
}
function recordLoss(score=0,gameId=activeGameId) { if(!claimTerminalResult(gameId,false))return 0;playSfx('loss'); saveData.streak=0;recordGameResult(gameId,score,false);checkMetaProgress();presentGameResult(gameId,score,false);return 0; }

function showLvUp() {
  playSfx('level');
  showToast(`🎉 レベルアップ！ Lv.${saveData.level} ${getLvName(saveData.level)}`, '#c77dff');
}

let toastTimer = null;
function showToast(msg, color) {
  const toast = document.getElementById('lvup-toast');
  toast.textContent = msg; toast.style.setProperty('--notice-color',color || 'var(--accent4)');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function xpResultHtml(score, gameId) {
  if (saveData.level >= MAX_LEVEL) return `<div class="xp-gain">MAX LEVEL</div>`;
  const mult = getXpMult(saveData.level);
  const streakBonus = saveData.streak >= 3 ? 1 + (saveData.streak - 2) * 0.1 : 1;
  const xp = Math.round(score * mult * streakBonus);
  let bonusTxt = '';
  if (mult > 1) bonusTxt += ` Lv.倍率×${mult.toFixed(1)}`;
  if (saveData.streak >= 3) bonusTxt += ` 🔥連勝×${saveData.streak}`;
  return `<div class="xp-gain">+${xp} XP${bonusTxt}</div>`;
}
// === ここまで差し替え ===(gemini)

// NAVIGATION
const gameTimeouts=new Set();
function gameDelay(fn,ms){const id=setTimeout(()=>{gameTimeouts.delete(id);fn();},ms);gameTimeouts.add(id);return id;}
function clearGameTimeouts(){gameTimeouts.forEach(clearTimeout);gameTimeouts.clear();}
function setTaskbarActive(name){document.querySelectorAll('.taskbar-item').forEach(button=>button.classList.toggle('active',button.dataset.taskbar===name));}
function setMissionView(name){
  if(!['daily','challenge','achievements'].includes(name))return;
  for(const kind of ['daily','challenge','achievements'])document.getElementById(`hub-${kind}`).hidden=kind!==name;
  document.querySelectorAll('[data-mission-tab]').forEach(button=>{
    const selected=button.dataset.missionTab===name;
    button.setAttribute('aria-pressed',String(selected));
    button.style.background=selected?'var(--accent4)':'';
    button.style.color=selected?'#fff':'';
  });
}
function openFeaturePage(name){
  if(!['daily','achievements','ranking','challenge','more','collection'].includes(name))return;
  if(['daily','achievements','challenge'].includes(name)){setMissionView(name);name='daily';}
  goHome();document.getElementById('home').style.display='none';document.getElementById(`${name}-page`).style.display='block';document.getElementById('back-btn').style.display='inline-block';document.body?.classList.add('has-back');setTaskbarActive(name==='collection'?'more':name);renderMetaDashboard();if(name==='collection')renderCollectionPage();window.scrollTo({top:0,behavior:'smooth'});
}
function goHome() {
  clearTimeout(resultTimer);resultSession=null;document.getElementById('unified-result')?.remove();setUnifiedResultMode(false);
  document.body.classList.remove('playing-game');
  setTaskbarActive('home');
  document.getElementById('home').style.display = 'block';
  document.getElementById('game-screen').style.display = 'none';
  document.querySelectorAll('.app-page').forEach(page=>page.style.display='none');
  document.getElementById('back-btn').style.display='none';document.body?.classList.remove('has-back');
  clearGameKeys();
  document.removeEventListener('keydown', slideKeyHandler);
  document.removeEventListener('keydown', tetrisKeyHandler);
  clearInterval(tetrisInterval);
  clearInterval(shiriTimerInterval);
  clearInterval(breakoutInterval);
  clearGameTimeouts();
  cancelAnimationFrame(runnerRAF);
  cancelAnimationFrame(rouletteRAF);
  cancelAnimationFrame(shootRAF);
  // パチンコ・スロットのcleanup
  const gs2 = document.getElementById('game-screen');
  if (gs2._cleanup)      { gs2._cleanup();      gs2._cleanup      = null; }
  if (gs2._slotCleanup) { gs2._slotCleanup(); gs2._slotCleanup = null; }
  if (gs2._aimCleanup)  { gs2._aimCleanup();  gs2._aimCleanup  = null; }
  delete gs2.dataset.game;gs2._quit=null;updateQuitBar();
  renderHome();
}
function startGame(name) {
  clearTimeout(resultTimer);document.getElementById('unified-result')?.remove();setUnifiedResultMode(false);
  if(name==='trivia'||name==='animequiz')name='quiz';
  resultSession={gameId:name,best:saveData.highscores[name]||0,points:0,xp:0,wallet:saveData.totalScore,initialWallet:saveData.totalScore,achievements:[...saveData.achievements],missions:[...saveData.daily.claimed],finished:false};
  playSfx('start');
  if(sound.auto&&bgm.current<0)bgmPlay(preferredBgmIndex());
  document.body.classList.add('playing-game');
  setTaskbarActive('');
  document.getElementById('home').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';
  document.querySelectorAll('.app-page').forEach(page=>page.style.display='none');
  document.getElementById('back-btn').style.display='inline-block';document.body?.classList.add('has-back');
  clearGameKeys();
  document.removeEventListener('keydown', slideKeyHandler);
  document.removeEventListener('keydown', tetrisKeyHandler);
  clearInterval(tetrisInterval);
  clearInterval(shiriTimerInterval);
  clearInterval(breakoutInterval);
  clearGameTimeouts();
  cancelAnimationFrame(runnerRAF);
  cancelAnimationFrame(rouletteRAF);
  cancelAnimationFrame(shootRAF);
  const gs = document.getElementById('game-screen');
  // パチンコ・スロットのcleanup
  if (gs._cleanup)      { gs._cleanup();      gs._cleanup      = null; }
  if (gs._slotCleanup) { gs._slotCleanup(); gs._slotCleanup = null; }
  if (gs._aimCleanup)  { gs._aimCleanup();  gs._aimCleanup  = null; }
  gs.innerHTML = '';gs._quit=null;
  gs.dataset.game = name;
  activeGameId=name;activeGameStartedAt=Date.now();
  trackGameStart(name);
  games[name](gs);updateQuitBar();
  const ch=saveData.activeChallenge;
  if(ch&&!ch.completed&&ch.gameId===name)gs.insertAdjacentHTML('afterbegin',`<div class="challenge-active"><span>🎲 ${challengeText(ch)}</span><strong style="color:var(--accent2)">+${ch.reward}pt</strong></div>`);
  const pickup=getDailyPickupGame();
  gs.insertAdjacentHTML('afterbegin',`<div class="game-quick-bar">${pickup?.id===name?'<span class="pickup-badge" style="margin:0;align-self:center">🔥 本日のピックアップ (+20%pt)</span>':''}<button class="game-quick-btn" type="button" onclick="openRules('${name}')">📖 ルール</button><button class="game-quick-btn" type="button" onclick="startGame('${name}')">🔄 リスタート</button></div>`);
}

// ================================================================
// GAMES
// ================================================================
const MEMORY_EMOJIS = ['🍕','🍣','🎸','🌸','🦊','🏀','🎩','🌈'];
const games = {};
