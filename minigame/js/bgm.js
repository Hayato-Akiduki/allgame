// ================================================================
// BGM SYSTEM
// ================================================================
const bgm = {
  audio: null,
  tracks: [
    {name:'Ten Coins Left',url:'/audio/ten-coins-left.mp3'},
    {name:'ピクセル・パレード',builtin:0},
    {name:'星空チル',builtin:1},
    {name:'Coffee at Midnight',url:'/audio/coffee-at-midnight.mp3',unlockId:'bgm_coffee'},
    {name:'夜を泳ぐ',url:'/audio/yoru-wo-oyogu.mp3',unlockId:'bgm_yoru'},
    {name:'Glass Horizon',url:'/audio/glass-horizon.mp3',unlockId:'bgm_glass'},
    {name:'あしたを追いこす',url:'/audio/ashita-wo-oikosu.mp3',unlockId:'bgm_ashita'},
    {name:'Chasing the Sun Ahead',url:'/audio/chasing-the-sun-ahead.mp3',unlockId:'bgm_chasing'},
    {name:'絆の証',url:'/audio/kizuna-no-akashi.mp3',unlockId:'bgm_kizuna'},
    {name:'Beyond the Prism Sky',url:'/audio/beyond-the-prism-sky.mp3',unlockId:'bgm_prism'},
    {name:'トバシテ・ドーパミン',url:'/audio/tobashite-dopamine.mp3',unlockId:'bgm_dopamine'},
    {name:'最高速の恋',url:'/audio/saisoku-no-koi.mp3',unlockId:'bgm_saisoku'}
  ],
  current: -1,
  selected: 0,
  loading: -1,
  vol: 0.5,
  loop: true,
};

// The default MP3 is bundled with the app. The other tracks are synthesized locally.
const sound = { ctx:null, volume:0.35, auto:true };
try { const saved=JSON.parse(localStorage.getItem('mini-game-sound')||'{}');
  if(Number.isFinite(saved.volume))sound.volume=Math.max(0,Math.min(1,saved.volume));
  if(Number.isFinite(saved.bgm))bgm.vol=Math.max(0,Math.min(1,saved.bgm));
  if(Number.isInteger(saved.track)&&saved.track>=0&&saved.track<bgm.tracks.length)bgm.selected=saved.track;
  if(typeof saved.auto==='boolean')sound.auto=saved.auto;
} catch(e) {}
function saveSound(){try{localStorage.setItem('mini-game-sound',JSON.stringify({volume:sound.volume,bgm:bgm.vol,auto:sound.auto,track:bgm.selected}));}catch(e){}}
function playSfx(kind='click'){
  if(!sound.volume||document.hidden)return;
  try{
    sound.ctx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(sound.ctx.state==='suspended')sound.ctx.resume().catch(()=>{});
    const notes={startup:[523,659,784,1047],click:[660],pop:[587,784],combo:[523,659,784],merge:[440,587,880],clear:[523,659,784,988,1175],fanfare:[523,659,784,1047,1319,1568],warn:[311,277],start:[392,523,784],win:[523,659,784,1047],loss:[330,277,220],level:[523,659,784,1047,1319],gacha:[294,392,523],rare:[523,659,784],ur:[523,659,784,1047,1319],secret:[523,659,784,1047,1319,1568]}[kind]||[660];
    notes.forEach((freq,i)=>{const osc=sound.ctx.createOscillator(),gain=sound.ctx.createGain(),at=sound.ctx.currentTime+i*.09;
      osc.type='triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(sound.volume*.22,at+.005);gain.gain.exponentialRampToValueAtTime(.0001,at+.13);
      osc.connect(gain);gain.connect(sound.ctx.destination);osc.start(at);osc.stop(at+.14);osc.onended=()=>{osc.disconnect();gain.disconnect();};
    });
  }catch(e){}
}
function launchConfetti(count=28){
  try{
    if(!document?.body?.appendChild)return;
    const colors=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9de2'];
    for(let i=0;i<count;i++){
      const el=document.createElement('div');if(!el||!el.style)break;
      el.className='confetti-piece';
      el.style.left=(Math.random()*96+2)+'vw';
      el.style.background=colors[i%colors.length];
      el.style.animationDuration=(1.2+Math.random()*1.1)+'s';
      el.style.animationDelay=(Math.random()*.35)+'s';
      document.body.appendChild(el);
      gameDelay(()=>el.remove?.(),2600);
    }
  }catch(e){}
}
function makeBgm(track){
  const rate=22050,beat=track===0?.25:.375,length=64*beat,count=Math.round(rate*length);
  const data=new ArrayBuffer(44+count*2),view=new DataView(data);
  const str=(at,v)=>{for(let i=0;i<v.length;i++)view.setUint8(at+i,v.charCodeAt(i));};
  str(0,'RIFF');view.setUint32(4,36+count*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,count*2,true);
  const melody=track===0?[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,83,81,79,76,72,77,81,84,81,79,76,74,71,72,76,79,72]:[76,0,79,83,0,79,76,0,74,0,77,81,0,77,74,0,72,0,76,79,0,76,72,0,71,0,74,79,0,74,71,0];
  const roots=[48,53,55,48,57,53,55,48],freq=n=>440*2**((n-69)/12);
  for(let i=0;i<count;i++){const t=i/rate,step=Math.floor(t/beat),phase=t%beat,n=melody[step%32],env=Math.min(1,phase/.012)*Math.max(0,1-phase/(beat*.9));
    const lead=n?Math.sin(2*Math.PI*freq(n)*phase)*env*.19:0;
    const bp=t%(beat*2),bass=Math.sin(2*Math.PI*freq(roots[Math.floor(step/8)])*bp)*Math.min(1,bp/.015)*Math.max(0,1-bp/(beat*2))*.16;
    const kick=track===0?Math.sin(2*Math.PI*(65*phase+3*(1-Math.exp(-phase*25))))*Math.exp(-phase*30)*.10:0;
    const fade=Math.min(1,t/.015,(length-t)/.025);
    view.setInt16(44+i*2,Math.round((lead+bass+kick)*fade*32767),true);
  }
  return URL.createObjectURL(new Blob([data],{type:'audio/wav'}));
}
let startupSoundPlayed=false;
function playStartupSound(){
  if(startupSoundPlayed||document.hidden)return false;
  startupSoundPlayed=true;
  playSfx('startup');
  return true;
}
document.addEventListener('keydown',event=>{
  if(!event.repeat&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&['Enter',' '].includes(event.key))playStartupSound();
});
document.addEventListener('click',event=>{
  if(playStartupSound())return;
  if(event.target.closest('button,.game-card,.bgm-track')&&!event.target.closest('#bgm-modal'))playSfx();
});
let resumeBgmOnVisible=false;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){resumeBgmOnVisible=!!bgm.audio&&!bgm.audio.paused;if(bgm.audio)bgm.audio.pause();if(sound.ctx)sound.ctx.suspend().catch(()=>{});}
  else {if(resumeBgmOnVisible&&bgm.audio)bgm.audio.play().catch(()=>{});resumeBgmOnVisible=false;}
});
function openBgm() {
  document.getElementById('sfx-vol').value=sound.volume;
  document.getElementById('sound-auto').checked=sound.auto;
  document.getElementById('bgm-modal').classList.add('open');
  bgmRenderTracks();
  gameDelay(()=>document.getElementById('bgm-modal-close')?.focus(),50);
}
function closeBgm() {
  document.getElementById('bgm-modal').classList.remove('open');
}

function bgmRenderTracks() {
  const list = document.getElementById('bgm-tracklist');
    list.innerHTML = bgm.tracks.map((t, i) => {const unlocked=!t.unlockId||saveData.ownedBgm.includes(t.unlockId),loading=bgm.loading===i;return `
      <div class="bgm-track ${bgm.current===i?'active':''} ${loading?'loading':''} ${unlocked?'':'locked'}" ${unlocked&&!loading?`onclick="bgmPlay(${i})"`:''} aria-disabled="${!unlocked||loading}">
        <div class="track-icon">${unlocked?(loading?'◌':bgm.current===i ? '▶️' : '🎵'):'🔒'}</div>
        <div class="track-info">
          <div class="track-name">${escapeHtml(t.name)}</div>
          <div class="track-file">${loading?'読み込み中…':unlocked?'クリックで再生':'BGMガチャで入手'}</div>
        </div>
        <div class="track-status">${loading?'準備中':bgm.current===i ? (bgm.audio&&!bgm.audio.paused?'再生中':'一時停止') : ''}</div>
      </div>`;}).join('');
  // 再生中パネル
  const nowPanel = document.getElementById('bgm-now');
  if (bgm.current >= 0 && bgm.audio) {
    nowPanel.style.display = 'block';
    document.getElementById('bgm-now-name').textContent = `${bgm.tracks[bgm.current]?.name || ''}${bgm.loading===bgm.current?'（読み込み中…）':''}`;
    document.getElementById('bgm-vol').value = bgm.vol;
    const loopChk = document.getElementById('bgm-loop');
    if (loopChk) loopChk.checked = bgm.loop;
    const toggleBtn = nowPanel.querySelector('button');
    if (toggleBtn) toggleBtn.textContent = bgm.audio.paused ? '▶ 再生' : '⏸ 一時停止';
  } else {
    nowPanel.style.display = 'none';
  }
  // BGM menu card: keep its icon and description intact while updating the title.
  const btn = document.getElementById('bgm-btn');
  const btnLabel = btn?.querySelector('strong');
  if (bgm.audio && !bgm.audio.paused) {
    if(btnLabel)btnLabel.textContent = 'BGM ▶ 再生中';
    btn.classList.add('playing');
  } else {
    if(btnLabel)btnLabel.textContent = 'BGM';
    btn.classList.remove('playing');
  }
}

let bgmTransition=0;
function fadeBgmVolume(audio,target,token,done){
  const start=audio.volume,steps=10;let step=0;
  const tick=()=>{if(token!==bgmTransition)return;step++;audio.volume=Math.max(0,Math.min(1,start+(target-start)*step/steps));if(step<steps)setTimeout(tick,24);else done?.();};tick();
}
function bgmPlay(idx) {
  if (idx < 0 || idx >= bgm.tracks.length) return;
  if(bgm.tracks[idx].unlockId&&!saveData.ownedBgm.includes(bgm.tracks[idx].unlockId)){showToast('このBGMはまだ入手していません','#ff6b6b');return;}
  const previous=bgm.audio,previousIdx=bgm.current,token=++bgmTransition;
  if(bgm.tracks[idx].builtin!==undefined&&!bgm.tracks[idx].url)bgm.tracks[idx].url=makeBgm(bgm.tracks[idx].builtin);
  const next=new Audio(bgm.tracks[idx].url);next.preload='none';next.volume=0;next.loop=bgm.loop;
  bgm.current=idx;bgm.loading=idx;bgm.audio=next;bgmRenderTracks();
  next.addEventListener('playing',()=>{if(token!==bgmTransition)return;bgm.loading=-1;bgm.selected=idx;saveSound();fadeBgmVolume(next,bgm.vol,token);bgmRenderTracks();});
  next.addEventListener('pause',()=>{if(token===bgmTransition)bgmRenderTracks();});
  const restorePrevious=message=>{if(token!==bgmTransition)return;bgmTransition++;next.pause();bgm.loading=-1;if(previous){bgm.audio=previous;bgm.current=previousIdx;}else{bgm.audio=null;bgm.current=-1;}bgmRenderTracks();showToast(message,'#ff6b6b');};
  next.addEventListener('error',()=>restorePrevious('BGMを読み込めませんでした。通信を確認してください'));
  next.play().then(()=>{if(token!==bgmTransition){next.pause();return;}if(previous&&previous!==next&&!previous.paused)fadeBgmVolume(previous,0,token,()=>{previous.pause();previous.src='';});}).catch(()=>restorePrevious('再生ボタンをもう一度押してください'));
  next.addEventListener('ended', () => {
    if (!bgm.loop) bgmNext();
  });
}

let appEntered=false;
function preferredBgmIndex(){const track=bgm.tracks[bgm.selected];return track&&(!track.unlockId||saveData.ownedBgm.includes(track.unlockId))?bgm.selected:0;}
function enterGameLand() {
  if(appEntered)return;
  appEntered=true;
  startupSoundPlayed=true;
  if(sound.auto)bgmPlay(preferredBgmIndex());
  const splash=document.getElementById('splash-screen');
  splash?.classList.add('dismissed');
  document.body.classList.remove('app-booting');
  splash?.addEventListener('transitionend',()=>splash.remove(),{once:true});
  if(!saveData.profile.onboardingComplete)gameDelay(()=>openProfile(true),480);
}

function bgmNext() {
  if (bgm.tracks.length === 0) return;
  for(let step=1;step<=bgm.tracks.length;step++){const idx=(bgm.current+step)%bgm.tracks.length;if(!bgm.tracks[idx].unlockId||saveData.ownedBgm.includes(bgm.tracks[idx].unlockId)){bgmPlay(idx);return;}}
}

function bgmToggle() {
  if (!bgm.audio) return;
  if (bgm.audio.paused) bgm.audio.play().catch(()=>{});
  else bgm.audio.pause();
  setTimeout(bgmRenderTracks, 100);
}

function bgmStop() {
  bgmTransition++;bgm.loading=-1;
  if (bgm.audio) { bgm.audio.pause(); bgm.audio.currentTime = 0; }
  bgm.current = -1;
  bgmRenderTracks();
}

function bgmSetVol(v) {
  bgm.vol = Math.max(0,Math.min(1,parseFloat(v)||0));
  saveSound();
  if (bgm.audio) bgm.audio.volume = bgm.vol;
}

function bgmSetLoop(v) {
  bgm.loop = v;
  if (bgm.audio) bgm.audio.loop = v;
}

