// ゲーム一覧。id は URL に使う英数字、path はアプリのルートからの相対パス。
// ゲームを追加するときはここに1行足すだけでよい（package.json の build.files も確認）。
// saveKeys … そのゲームが localStorage に保存するときの名前の先頭部分。
//             サイト版の「セーブの書き出し・読み込み」で、ALLGAME のセーブだけを選ぶのに使う。
module.exports = [
  { id: 'money-wars', title: 'コイン・ウォーズ', path: 'MONEY-WARS/起動.html', genre: '対戦ストラテジー', color: '#e0a526', saveKeys: ['coinwars-'] },
  { id: 'spikeline', title: 'Spike Line', path: 'SPIKELINE.html', genre: '3D スポーツ', color: '#ff5470', saveKeys: ['spikeline-'] },
  { id: 'wordle', title: 'Wordle 無限モード', path: 'wordle.html', genre: '単語パズル', color: '#6aaa64', saveKeys: ['w-mode', 'wu-', 'wj-'] },
  { id: 'nawabari', title: 'ナワバリインク', path: 'ナワバリインク.html', genre: '3D アクション', color: '#b44cff', saveKeys: ['nawabari-'] },
  { id: 'cyber-arena', title: 'CYBER ARENA', path: 'ライトFPS/起動用.html', genre: '3D FPS', color: '#00e5ff', saveKeys: ['cyber_arena_'] },
  { id: 'shacho', title: '社長の帳簿', path: '会社経営ゲーム.html', genre: '経営シミュレーション', color: '#c8a46a', saveKeys: ['shacho-'] },
  { id: 'lastline', title: 'ラストライン防衛戦', path: '城攻防戦/起動.html', genre: 'タワーディフェンス', color: '#ff7a1a', saveKeys: ['lastline-'] },
  { id: 'kabu', title: 'PRO TRADER SIMULATOR', path: '株ゲー/起動用.html', genre: '株取引シミュレーション', color: '#22c55e', saveKeys: ['kabu_'] },
  { id: 'kokeniwa', title: '苔庭づくり', path: '苔を増やせ.html', genre: '放置ゲーム', color: '#5f8f4e', saveKeys: ['kokeniwa-'] },
  {
    id: 'minigame', title: 'ミニゲームランド', path: 'minigame/index.html', genre: 'ミニゲーム集（37本）', color: '#4f8cff',
    // オフライン版: ランキングなどの /api/ はアプリ内（app/local-api.js）で処理し、記録はこのPCに保存する
    localApi: true,
    // サイト版では公開中のミニゲームランドへのリンクにする（オンラインランキングが使える）
    webUrl: 'https://mini-game-land.akiduki2ha46.workers.dev/',
  },
  { id: 'tetsu', title: '鉄の大陸', path: '鉄の大陸.html', genre: 'ストラテジー', color: '#8a9bb0', saveKeys: ['tetsu-no-tairiku-'] },
];
