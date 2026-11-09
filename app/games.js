// ゲーム一覧。id は URL に使う英数字、path はアプリのルートからの相対パス。
// ゲームを追加するときはここに1行足すだけでよい（package.json の build.files も確認）。
module.exports = [
  { id: 'money-wars', title: 'コイン・ウォーズ', path: 'MONEY-WARS/起動.html', genre: '対戦ストラテジー', color: '#e0a526' },
  { id: 'spikeline', title: 'Spike Line', path: 'SPIKELINE.html', genre: '3D スポーツ', color: '#ff5470' },
  { id: 'wordle', title: 'Wordle 無限モード', path: 'wordle.html', genre: '単語パズル', color: '#6aaa64' },
  { id: 'nawabari', title: 'ナワバリインク', path: 'ナワバリインク.html', genre: '3D アクション', color: '#b44cff' },
  { id: 'cyber-arena', title: 'CYBER ARENA', path: 'ライトFPS/起動用.html', genre: '3D FPS', color: '#00e5ff' },
  { id: 'shacho', title: '社長の帳簿', path: '会社経営ゲーム.html', genre: '経営シミュレーション', color: '#c8a46a' },
  { id: 'lastline', title: 'ラストライン防衛戦', path: '城攻防戦/起動.html', genre: 'タワーディフェンス', color: '#ff7a1a' },
  { id: 'kabu', title: 'PRO TRADER SIMULATOR', path: '株ゲー/起動用.html', genre: '株取引シミュレーション', color: '#22c55e' },
  { id: 'kokeniwa', title: '苔庭づくり', path: '苔を増やせ.html', genre: '放置ゲーム', color: '#5f8f4e' },
  {
    id: 'minigame', title: 'ミニゲームランド', path: 'minigame/index.html', genre: 'ミニゲーム集（37本）', color: '#4f8cff',
    // オフライン版: ランキングなどの /api/ はアプリ内（app/local-api.js）で処理し、記録はこのPCに保存する
    localApi: true,
    // サイト版では公開中のミニゲームランドへのリンクにする（オンラインランキングが使える）
    webUrl: 'https://mini-game-land.akiduki2ha46.workers.dev/',
  },
  { id: 'tetsu', title: '鉄の大陸', path: '鉄の大陸.html', genre: 'ストラテジー', color: '#8a9bb0' },
  {
    id: 'japan-drive', title: '日本一周ドライブ3D', path: 'native/japandrive/JapanDrive3D.exe', genre: '3D ドライブ（別ウィンドウで起動）', color: '#e8433b',
    // C# で作った exe。ALLGAME の中では表示できないので、別ウィンドウで起動する
    native: true,
  },
];
