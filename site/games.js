// ゲーム一覧。サイトを組み立てるとき（scripts/build-site.js）とトップページの表示に使う。
// ゲームを追加するときは、ゲームのファイルをこのフォルダに置いて、ここに1行足す。
// id       … URL に使う英数字（例: cyber-arena → /allgame/cyber-arena/）
// path     … ゲームの入口の HTML（このフォルダからの相対パス）。フォルダ入りのゲームはフォルダごとサイトに入る
// icon     … トップページのタイルに出す絵文字
// color    … タイルや背景に使う色
// saveKeys … そのゲームが localStorage に保存するときの名前の先頭部分。
//             「セーブの書き出し・読み込み」で ALLGAME のセーブだけを選ぶのに使う
// webUrl   … 別のサイトにあるゲーム。サイトには入れず、リンクにする
module.exports = [
  { id: 'money-wars', icon: '🪙', title: 'コイン・ウォーズ', path: 'MONEY-WARS/起動.html', genre: '対戦ストラテジー', color: '#e0a526', saveKeys: ['coinwars-'] },
  { id: 'spikeline', icon: '🏐', title: 'Spike Line', path: 'SPIKELINE.html', genre: '3D スポーツ', color: '#ff5470', saveKeys: ['spikeline-'] },
  { id: 'wordle', icon: '🔤', title: 'Wordle 無限モード', path: 'wordle.html', genre: '単語パズル', color: '#6aaa64', saveKeys: ['w-mode', 'wu-', 'wj-'] },
  { id: 'nawabari', icon: '🎨', title: 'ナワバリインク', path: 'ナワバリインク.html', genre: '3D アクション', color: '#b44cff', saveKeys: ['nawabari-'] },
  { id: 'cyber-arena', icon: '🎯', title: 'CYBER ARENA', path: 'ライトFPS/起動用.html', genre: '3D FPS', color: '#00e5ff', saveKeys: ['cyber_arena_'] },
  { id: 'shacho', icon: '📒', title: '社長の帳簿', path: '会社経営ゲーム.html', genre: '経営シミュレーション', color: '#c8a46a', saveKeys: ['shacho-'] },
  { id: 'lastline', icon: '🏰', title: 'ラストライン防衛戦', path: '城攻防戦/起動.html', genre: 'タワーディフェンス', color: '#ff7a1a', saveKeys: ['lastline-'] },
  { id: 'kabu', icon: '📈', title: 'PRO TRADER SIMULATOR', path: '株ゲー/起動用.html', genre: '株取引シミュレーション', color: '#22c55e', saveKeys: ['kabu_'] },
  { id: 'kokeniwa', icon: '🌿', title: '苔庭づくり', path: '苔を増やせ.html', genre: '放置ゲーム', color: '#5f8f4e', saveKeys: ['kokeniwa-'] },
  { id: 'minigame', icon: '🎲', title: 'ミニゲームランド', genre: 'ミニゲーム集（37本）', color: '#4f8cff', webUrl: 'https://mini-game-land.akiduki2ha46.workers.dev/' },
  { id: 'tetsu', icon: '⚙️', title: '鉄の大陸', path: '鉄の大陸.html', genre: 'ストラテジー', color: '#8a9bb0', saveKeys: ['tetsu-no-tairiku-'] },
];
