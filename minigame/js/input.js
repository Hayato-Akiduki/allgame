// Shared keyboard and touch support for games.
// - Non-native controls marked role="button" activate with Enter or Space.
// - Items marked data-nav move focus with the arrow keys inside their [data-nav-group].
//   Only one item per group sits in the Tab order, so a big board is a single Tab stop.
// - When a game redraws while the player uses the keyboard, focus returns to the same
//   spot instead of falling back to the top of the page.
// - onGameKey registers a shortcut handler for the running game; it is removed when the
//   game ends or another game starts.

let keyboardMode=false;
document.addEventListener('keydown',e=>{if(!e.ctrlKey&&!e.metaKey&&!e.altKey)keyboardMode=true;},true);
document.addEventListener('pointerdown',()=>{keyboardMode=false;},true);

function isTypingTarget(target){return target instanceof Element&&!!target.closest('input:not([type="range"]):not([type="button"]),textarea,select,[contenteditable="true"]');}
function isPressable(target){return target instanceof Element&&!!target.closest('button,a[href],summary,input,[role="button"]');}
function overlayOpen(){
  if(document.body.classList.contains('result-open'))return true;
  return [...document.querySelectorAll('[aria-modal="true"]')].some(d=>d.getClientRects().length>0);
}

// Returns the key name a game shortcut should react to, or null when the key belongs to
// something else: typing in a field, a modifier combo, a dialog, or Enter/Space on a
// focused button (which the browser already presses, so acting again would double it).
function gameKey(e){
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||isTypingTarget(e.target)||overlayOpen())return null;
  if(!document.body.classList.contains('playing-game'))return null;
  if((e.key==='Enter'||e.key===' ')&&isPressable(e.target))return null;
  return e.key.length===1?e.key.toLowerCase():e.key;
}

// Shortcut handlers for the running game. handler(key, event, type) returns true when it
// used the key. type is 'down' or 'up'; pass {up:true} to also receive key releases
// (needed for held movement keys). Releases are always delivered so a key can't get stuck.
const gameKeyHandlers=new Set();
function onGameKey(handler,{up=false}={}){const entry={handler,up};gameKeyHandlers.add(entry);return ()=>gameKeyHandlers.delete(entry);}
function clearGameKeys(){
  for(const entry of [...gameKeyHandlers])if(entry.up)try{entry.handler('*release*',null,'up');}catch{}
  gameKeyHandlers.clear();lastGameFocus=null;
}
// Held-key tracker for real-time games: keys.left etc. stay true while any bound key is down.
// when() limits presses to the moments the game wants them, so arrows still scroll menus.
function heldKeys(bindings,{when=()=>true}={}){
  const state={},down=new Map();
  for(const name of Object.keys(bindings))state[name]=false;
  const refresh=()=>{for(const [name,list] of Object.entries(bindings))state[name]=list.some(k=>down.get(k));};
  onGameKey((key,e,type)=>{
    if(key==='*release*'){down.clear();refresh();return false;}
    const bound=Object.values(bindings).some(list=>list.includes(key));
    if(!bound)return false;
    if(type==='down'){if(!when())return false;down.set(key,true);}else down.delete(key);
    refresh();return true;
  },{up:true});
  return state;
}

// ---- Arrow-key navigation and roving tab stops ----
const NAV_STEPS={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
const navMemory=new Map();
function navItems(group){return [...group.querySelectorAll('[data-nav]')].filter(n=>!n.disabled&&n.getAttribute('aria-disabled')!=='true'&&n.getClientRects().length>0);}
// Picks the nearest item in the pressed direction, preferring items in the same row/column.
function navNeighbor(group,item,[dx,dy]){
  const r=item.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let best=null,bestScore=Infinity;
  for(const n of navItems(group)){
    if(n===item)continue;
    const b=n.getBoundingClientRect(),x=b.left+b.width/2-cx,y=b.top+b.height/2-cy;
    const along=x*dx+y*dy,across=dx?Math.abs(y):Math.abs(x);
    if(along<4)continue;
    const score=along+across*3;
    if(score<bestScore){best=n;bestScore=score;}
  }
  return best;
}
function rememberNav(item){
  const group=item.closest('[data-nav-group]');if(!group)return;
  const index=navItems(group).indexOf(item);if(index>=0)navMemory.set(group.dataset.navGroup,index);
  for(const n of group.querySelectorAll('[data-nav]'))n.tabIndex=n===item?0:-1;
}
function syncNavGroups(root){
  for(const group of root.querySelectorAll('[data-nav-group]')){
    const items=navItems(group);if(!items.length)continue;
    const current=items.find(n=>n===document.activeElement)||items[Math.min(navMemory.get(group.dataset.navGroup)??0,items.length-1)];
    for(const n of group.querySelectorAll('[data-nav]'))n.tabIndex=n===current?0:-1;
  }
}
document.addEventListener('keydown',e=>{
  const step=NAV_STEPS[e.key];
  if(!step||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
  const item=e.target instanceof Element&&e.target.closest('[data-nav]');if(!item)return;
  const group=item.closest('[data-nav-group]');if(!group)return;
  e.preventDefault();
  const next=navNeighbor(group,item,step);if(next)next.focus();
});
document.addEventListener('keydown',e=>{
  if((e.key!=='Enter'&&e.key!==' ')||e.defaultPrevented||e.repeat)return;
  const t=e.target;
  if(!(t instanceof Element)||!t.matches('[role="button"]')||t.matches('button,a,input')||t.getAttribute('aria-disabled')==='true')return;
  e.preventDefault();t.click();
});

// ---- Keep focus in place when a game redraws ----
let lastGameFocus=null;
const gameScreen=document.getElementById('game-screen');
gameScreen?.addEventListener('focusin',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  if(t.matches('[data-nav]'))rememberNav(t);
  const group=t.closest('[data-nav-group]');
  lastGameFocus={id:t.id||'',group:group?.dataset.navGroup||'',action:t.dataset?.focusKey||''};
});
function restoreGameFocus(){
  if(!keyboardMode||!lastGameFocus||overlayOpen())return;
  const active=document.activeElement;
  if(active&&active!==document.body&&active.isConnected)return;
  const {id,group,action}=lastGameFocus;
  let target=null;
  if(group){const g=gameScreen.querySelector(`[data-nav-group="${CSS.escape(group)}"]`);if(g){const items=navItems(g);target=items[Math.min(navMemory.get(group)??0,items.length-1)];}}
  if(!target&&action)target=gameScreen.querySelector(`[data-focus-key="${CSS.escape(action)}"]`);
  if(!target&&id)target=document.getElementById(id);
  if(target&&gameScreen.contains(target)&&!target.disabled)target.focus({preventScroll:true});
}
let navSyncQueued=false;
if(gameScreen&&typeof MutationObserver==='function')new MutationObserver(()=>{
  if(navSyncQueued)return;navSyncQueued=true;
  queueMicrotask(()=>{navSyncQueued=false;syncNavGroups(gameScreen);restoreGameFocus();});
}).observe(gameScreen,{childList:true,subtree:true});

// Game shortcuts run after the arrow-key navigation above, so a focused board keeps its arrows.
document.addEventListener('keydown',e=>{
  if(!gameKeyHandlers.size)return;
  const key=gameKey(e);if(key===null)return;
  for(const {handler} of [...gameKeyHandlers])if(handler(key,e,'down')){e.preventDefault();return;}
});
document.addEventListener('keyup',e=>{
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  for(const {handler,up} of [...gameKeyHandlers])if(up)handler(key,e,'up');
});
// Releasing every held key when the window loses focus stops movement keys from sticking.
window.addEventListener('blur',()=>{for(const {handler,up} of [...gameKeyHandlers])if(up)handler('*release*',null,'up');});
