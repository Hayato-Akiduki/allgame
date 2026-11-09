
// ================================================================
// MINI FIGHTER
// ================================================================
games.fighter = function(el) {
  const W=760,H=470,FLOOR=338,ROUND_TIME=60,GROUND_Y=408;
  const modes={easy:{name:'ビギナー',reaction:.018,damage:.75,bonus:1},normal:{name:'ノーマル',reaction:.032,damage:1,bonus:1.35},hard:{name:'ハード',reaction:.052,damage:1.25,bonus:1.8}};
  let mode=modes.normal,canvas,ctx,raf=0,last=0,time=ROUND_TIME,running=false,finished=false,hits=0;
  let particles=[],popups=[],keys={left:false,right:false,guard:false},clock=0,shake=0,cam={x:0,z:1},banner=null;
  const makeFighter=(x,team,facing,isCpu=false)=>({x,y:FLOOR-82,w:48,h:82,vx:0,vy:0,team,facing,isCpu,hp:100,trail:100,guard:false,attack:null,attackTime:0,cooldown:0,hitDone:false,stun:0,walk:0});
  const TEAMS={blue:{main:'#3d8bff',dark:'#1d4fae',glove:'#2563eb',skin:'#f4c8a0',hair:'#2b2233'},red:{main:'#ff5a5a',dark:'#a3232c',glove:'#dc2626',skin:'#d9a27a',hair:'#1f1a1a'}};
  let player,cpu;

  el.innerHTML=`<div class="game-header"><h2>🥊 ミニ格闘アリーナ</h2><p>間合いとガードを使い、CPUをKOしよう！</p></div>
    <div id="fighter-setup" class="result-box fighter-setup"><div class="fighter-vs"><span class="fv blue">🥊<b>YOU</b></span><strong>VS</strong><span class="fv red">🥊<b>CPU</b></span></div><h3>難易度を選択</h3><p class="meta-sub">難しいほどCPUの反応と攻撃力が上がり、スコア倍率も増加します。</p>
      <div class="flex-center mt" style="flex-wrap:wrap"><button class="btn btn-success" onclick="fighterStart('easy')">ビギナー</button><button class="btn btn-warn" onclick="fighterStart('normal')">ノーマル</button><button class="btn btn-danger" onclick="fighterStart('hard')">ハード</button></div></div>
    <div id="fighter-play" style="display:none"><canvas id="fighter-canvas" width="${W}" height="${H}" aria-label="格闘ゲーム対戦画面"></canvas>
      <div class="fighter-controls"><div class="fighter-control-group"><button class="btn fighter-key fk-move" data-hold="left" aria-label="左へ移動">◀</button><button class="btn fighter-key fk-move" data-action="jump" aria-label="ジャンプ">▲</button><button class="btn fighter-key fk-move" data-hold="right" aria-label="右へ移動">▶</button></div>
      <div class="fighter-control-group"><button class="btn fighter-key fk-light" data-action="light">👊<small>弱</small></button><button class="btn fighter-key fk-heavy" data-action="heavy">💥<small>強</small></button><button class="btn fighter-key fk-guard" data-hold="guard">🛡️<small>防</small></button></div></div>
      <div class="tet-hint">PC：A / D 移動　W ジャンプ　J 弱攻撃　K 強攻撃　L ガード</div><div id="fighter-result"></div></div>`;

  function start(id){
    mode=modes[id]||modes.normal;player=makeFighter(150,'blue',1);cpu=makeFighter(562,'red',-1,true);
    time=ROUND_TIME;hits=0;particles=[];popups=[];clock=0;shake=0;cam={x:0,z:1};banner={text:'READY',until:.7,next:{text:'FIGHT!',until:1.4}};
    running=true;finished=false;last=performance.now();
    el.querySelector('#fighter-setup').style.display='none';el.querySelector('#fighter-play').style.display='block';
    canvas=el.querySelector('#fighter-canvas');ctx=canvas.getContext('2d');bindButtons();raf=requestAnimationFrame(loop);
  }
  window.fighterStart=start;
  function attack(f,type){
    if(!running||f.stun>0||f.cooldown>0||f.attack)return;
    const heavy=type==='heavy';f.attack=type;f.attackTime=heavy?.38:.22;f.cooldown=heavy?.72:.38;f.hitDone=false;f.guard=false;
  }
  function jump(f){if(running&&f.y>=FLOOR-f.h-1&&f.stun<=0){f.vy=-440;f.guard=false;}}
  function strike(attacker,target){
    if(attacker.hitDone||!attacker.attack)return;
    const range=attacker.attack==='heavy'?78:62,dx=(target.x+target.w/2)-(attacker.x+attacker.w/2);
    if(Math.sign(dx)===attacker.facing&&Math.abs(dx)<range&&Math.abs(target.y-attacker.y)<55){
      attacker.hitDone=true;const heavy=attacker.attack==='heavy',base=heavy?18:9,blocked=target.guard&&Math.sign(-dx)===target.facing;
      const damage=Math.max(1,Math.round(base*(attacker.isCpu?mode.damage:1)*(blocked?.25:1)));
      target.hp=Math.max(0,target.hp-damage);target.vx=attacker.facing*(blocked?95:190);target.stun=blocked?.08:(heavy?.28:.16);
      if(!attacker.isCpu)hits++;
      const hx=target.x+target.w/2-attacker.facing*10,hy=target.y+(heavy?22:30);
      for(let i=0;i<(blocked?6:heavy?16:10);i++){const a=Math.random()*Math.PI*2,s=80+Math.random()*(heavy?260:170);particles.push({x:hx,y:hy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:.25+Math.random()*.25,color:blocked?'#9ad8ff':i%3?'#fff3b0':'#ffb347'});}
      popups.push({x:hx,y:hy-28,text:blocked?'GUARD':heavy?'SMASH!':'HIT!',color:blocked?'#9ad8ff':heavy?'#ffb347':'#fff',life:.7});
      shake=Math.max(shake,blocked?.06:heavy?.22:.1);
      if(target.hp<=0)finish(attacker===player,'KO');
    }
  }
  function updateFighter(f,dt){
    f.cooldown=Math.max(0,f.cooldown-dt);f.stun=Math.max(0,f.stun-dt);if(f.attack){f.attackTime-=dt;if(f.attackTime<=0)f.attack=null;}
    f.vy+=980*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.pow(.015,dt);
    if(f.y>FLOOR-f.h){f.y=FLOOR-f.h;f.vy=0;}f.x=Math.max(20,Math.min(W-20-f.w,f.x));
    f.walk+=Math.abs(f.vx)*dt*.09;f.trail+=(f.hp-f.trail)*Math.min(1,dt*2.2);
  }
  function cpuThink(dt){
    if(!running||cpu.stun>0)return;const dx=player.x-cpu.x,dist=Math.abs(dx);cpu.facing=dx>=0?1:-1;
    if(player.attack&&dist<85&&Math.random()<mode.reaction*3){cpu.guard=true;cpu.vx=0;return;}
    cpu.guard=false;if(dist>68)cpu.vx=Math.sign(dx)*115;else if(dist<45)cpu.vx=-Math.sign(dx)*80;
    if(dist<82&&Math.random()<mode.reaction){attack(cpu,Math.random()<.35?'heavy':'light');}
    if(dist>150&&Math.random()<mode.reaction*.08)jump(cpu);
  }
  function update(dt){
    time=Math.max(0,time-dt);if(time<=0){finish(player.hp>=cpu.hp,'TIME');return;}
    if(player.stun<=0&&!player.attack){player.guard=keys.guard;if(keys.left)player.vx=-180;if(keys.right)player.vx=180;if(keys.left!==keys.right)player.facing=keys.right?1:-1;}
    cpuThink(dt);updateFighter(player,dt);updateFighter(cpu,dt);strike(player,cpu);strike(cpu,player);
    const overlap=Math.min(player.x+player.w,cpu.x+cpu.w)-Math.max(player.x,cpu.x);if(overlap>0){const push=(player.x<cpu.x?1:-1)*overlap/2;player.x-=push;cpu.x+=push;}
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=420*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);
    popups.forEach(p=>{p.y-=50*dt;p.life-=dt;});popups=popups.filter(p=>p.life>0);
  }
  // ---------- drawing ----------
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function updateCamera(dt){
    const a=player.x+player.w/2,b=cpu.x+cpu.w/2,spread=Math.abs(a-b)+260;
    const z=Math.max(1,Math.min(1.85,W/spread)),x=Math.max(0,Math.min(W-W/z,(a+b)/2-W/(2*z)));
    const k=Math.min(1,dt*4);cam.z+=(z-cam.z)*k;cam.x+=(x-cam.x)*k;
  }
  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#1b1440');sky.addColorStop(.6,'#2b1c55');sky.addColorStop(1,'#120c24');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const px=-cam.x*.25;
    // spotlights
    for(const [sx,c] of [[140,'rgba(120,170,255,.16)'],[380,'rgba(255,230,160,.14)'],[620,'rgba(255,120,150,.16)']]){
      const x=sx+px,sway=Math.sin(clock*.8+sx)*40,g=ctx.createLinearGradient(x,0,x+sway,GROUND_Y);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-10,0);ctx.lineTo(x+10,0);ctx.lineTo(x+sway+120,GROUND_Y);ctx.lineTo(x+sway-120,GROUND_Y);ctx.closePath();ctx.fill();
    }
    // crowd silhouettes
    for(let row=0;row<3;row++){
      ctx.fillStyle=['#2a1f4d','#22183f','#1a1233'][row];const y=250+row*26;
      for(let i=-1;i<26;i++){const x=i*34+(row%2)*17+px*(1+row*.3)%34,bob=Math.sin(clock*(4+row)+i*1.7)*(running?3:1);
        ctx.beginPath();ctx.arc(x,y-14+bob,11,0,Math.PI*2);ctx.fill();roundRect(x-14,y-4+bob,28,40,10);ctx.fill();}
    }
    ctx.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<10;i++){const x=(i*83+40+px*2)%W,y=230+((i*37)%40);if(Math.sin(clock*3+i*2)>.85){ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();}}
  }
  function toScreen(){ctx.setTransform(cam.z,0,0,cam.z,-cam.x*cam.z+(shake>0?(Math.random()-.5)*shake*60:0),GROUND_Y-FLOOR*cam.z+(shake>0?(Math.random()-.5)*shake*40:0));}
  function drawRing(){
    // mat
    const mat=ctx.createLinearGradient(0,FLOOR,0,FLOOR+90);mat.addColorStop(0,'#4b6fd8');mat.addColorStop(1,'#26398a');ctx.fillStyle=mat;ctx.fillRect(-200,FLOOR,W+400,140);
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-200,FLOOR,W+400,4);
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(W/2,FLOOR+34,120,22,0,0,Math.PI*2);ctx.stroke();
    // ropes and posts
    for(const x of [6,W-6]){ctx.fillStyle='#d8d8e6';roundRect(x-6,FLOOR-150,12,152,4);ctx.fill();ctx.fillStyle='#ff5a5a';ctx.fillRect(x-7,FLOOR-154,14,10);}
    ['#ff7a7a','#f4f4ff','#7aa8ff'].forEach((c,i)=>{const y=FLOOR-128+i*36;ctx.strokeStyle=c;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(6,y);ctx.quadraticCurveTo(W/2,y+8,W-6,y);ctx.stroke();});
  }
  function limb(x1,y1,x2,y2,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function arm(sx,sy,gx,gy,t,bend){const mx=(sx+gx)/2,my=(sy+gy)/2+bend;ctx.strokeStyle=t.skin;ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(mx,my);ctx.lineTo(gx,gy);ctx.stroke();
    const g=ctx.createRadialGradient(gx-2,gy-3,1,gx,gy,9);g.addColorStop(0,'#ffffff');g.addColorStop(.25,t.glove);g.addColorStop(1,t.dark);ctx.fillStyle=g;ctx.beginPath();ctx.arc(gx,gy,9,0,Math.PI*2);ctx.fill();}
  function drawFighter(f){
    const t=TEAMS[f.team],cx=f.x+f.w/2,feet=f.y+f.h,air=feet<FLOOR-2,ko=finished&&f.hp<=0;
    // shadow stays on the floor while jumping
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(cx,FLOOR+3,30-(FLOOR-feet)*.06,7,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(cx,feet);ctx.scale(f.facing,1);
    if(ko){ctx.translate(-10,0);ctx.rotate(-Math.PI/2*.92);ctx.translate(0,8);}
    const bob=running&&!f.attack?Math.sin(clock*6+(f.isCpu?1:0))*1.5:0,lean=f.stun>0?-.22:f.attack==='heavy'?.18:f.attack==='light'?.06:0;
    // legs
    const step=Math.sin(f.walk)*(Math.abs(f.vx)>25&&!air?9:0);
    const kneeL=air?[-6,-18]:[-7+step*.4,-17],kneeR=air?[10,-20]:[8-step*.4,-17];
    limb(-6,-34,kneeL[0],kneeL[1],t.skin,9);limb(kneeL[0],kneeL[1],air?-12:-9+step,air?-6:0,t.skin,8);
    limb(6,-34,kneeR[0],kneeR[1],t.skin,9);limb(kneeR[0],kneeR[1],air?4:10-step,air?-8:0,t.skin,8);
    ctx.fillStyle='#22222c';ctx.beginPath();ctx.ellipse(air?-12:-9+step,0,7,4,0,0,Math.PI*2);ctx.ellipse(air?4:10-step,0,7,4,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(0,-34);ctx.rotate(lean);ctx.translate(0,34+bob);
    // shorts and torso
    ctx.fillStyle=t.dark;roundRect(-14,-42,28,14,5);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-14,-36,28,2.5);
    ctx.fillStyle=t.skin;roundRect(-12,-64,24,25,9);ctx.fill();
    ctx.fillStyle=t.main;roundRect(-12,-60,24,20,6);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-4,-58,3,16);
    // back arm
    const guard=f.guard,atk=f.attack,stun=f.stun>0&&!ko;
    let back=[6,-66],front=[16,-62];
    if(guard){back=[14,-72];front=[17,-60];}else if(atk==='light'){back=[5,-64];front=[36,-62];}else if(atk==='heavy'){back=[2,-58];front=[42,-68];}else if(stun){back=[-6,-44];front=[10,-42];}
    arm(-4,-58,back[0],back[1]+(guard||atk?0:bob*.5),t,6);
    // head
    ctx.fillStyle=t.skin;ctx.beginPath();ctx.arc(2,-74,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=t.hair;ctx.beginPath();ctx.arc(1,-77,11,Math.PI*1.05,Math.PI*1.95);ctx.fill();
    ctx.fillStyle=t.main;ctx.fillRect(-9,-79,22,4);
    ctx.fillStyle='#1b1b24';if(ko||stun){ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('x',8,-71);}else{ctx.beginPath();ctx.ellipse(8,-74,1.8,2.6,0,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#7a3b2e';ctx.lineWidth=1.6;ctx.beginPath();if(atk)ctx.arc(9,-67,2.5,0,Math.PI);else ctx.moveTo(6,-67),ctx.lineTo(10,-67);ctx.stroke();
    // front arm
    arm(6,-58,front[0],front[1]+(guard||atk?0:bob),t,atk?2:7);
    if(atk==='heavy'){ctx.strokeStyle='rgba(255,220,150,.7)';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(front[0]-14-i*6,front[1]-6+i*6);ctx.lineTo(front[0]-30-i*6,front[1]-6+i*6);ctx.stroke();}}
    ctx.restore();
    if(guard){ctx.strokeStyle='rgba(154,216,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(14,-56,30,-1.25,1.25);ctx.stroke();ctx.fillStyle='rgba(154,216,255,.14)';ctx.fill();}
    ctx.restore();
    if(stun){for(let i=0;i<3;i++){const a=clock*6+i*2.1;ctx.fillStyle='#ffe066';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('★',cx+Math.cos(a)*16,f.y-4+Math.sin(a)*5);}}
  }
  function hpBar(x,y,w,f,right){
    const t=TEAMS[f.team];ctx.fillStyle='rgba(8,6,20,.7)';roundRect(x-3,y-3,w+6,24,10);ctx.fill();
    const fill=w*f.hp/100,trail=w*f.trail/100;
    ctx.fillStyle='#ffd27a';roundRect(right?x+w-trail:x,y,Math.max(0,trail),18,8);ctx.fill();
    const g=ctx.createLinearGradient(0,y,0,y+18);g.addColorStop(0,'#ffffff');g.addColorStop(.18,f.hp<30?'#ff5d5d':t.main);g.addColorStop(1,f.hp<30?'#a3232c':t.dark);
    ctx.fillStyle=g;if(fill>0){roundRect(right?x+w-fill:x,y,fill,18,8);ctx.fill();}
  }
  function drawHud(){
    ctx.setTransform(1,0,0,1,0,0);
    hpBar(24,30,290,player,false);hpBar(W-314,30,290,cpu,true);
    ctx.font='900 17px sans-serif';ctx.textBaseline='alphabetic';ctx.fillStyle='#cfe0ff';ctx.textAlign='left';ctx.fillText('🥊 YOU',26,22);
    ctx.fillStyle='#ffd0d0';ctx.textAlign='right';ctx.fillText(`CPU・${mode.name} 🥊`,W-26,22);
    ctx.fillStyle='rgba(8,6,20,.8)';ctx.beginPath();ctx.arc(W/2,40,30,0,Math.PI*2);ctx.fill();ctx.strokeStyle=time<10?'#ff5d5d':'#ffd84d';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=time<10?'#ff7a7a':'#fff';ctx.font='900 28px sans-serif';ctx.textAlign='center';ctx.fillText(Math.ceil(time),W/2,50);
    let text=null;
    if(finished)text=finishBanner;else if(banner&&clock<banner.until)text=banner.text;else if(banner&&banner.next&&clock<banner.next.until)text=banner.next.text;
    if(text){
      const big=text.length<8;ctx.font=`900 ${big?84:60}px sans-serif`;ctx.textAlign='center';ctx.lineWidth=10;ctx.strokeStyle='rgba(20,10,40,.85)';ctx.strokeText(text,W/2,H/2-10);
      const g=ctx.createLinearGradient(0,H/2-80,0,H/2);g.addColorStop(0,'#fff6c2');g.addColorStop(1,'#ffb020');ctx.fillStyle=g;ctx.fillText(text,W/2,H/2-10);
    }
  }
  let finishBanner='K.O.';
  function draw(){
    ctx.setTransform(1,0,0,1,0,0);drawBackground();toScreen();drawRing();
    [player,cpu].sort((a,b)=>(a.attack?1:0)-(b.attack?1:0)).forEach(drawFighter);
    particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life*4);ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.03,p.y-p.vy*.03);ctx.stroke();});
    popups.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life*2.5);ctx.font='900 22px sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='rgba(20,10,40,.9)';ctx.strokeText(p.text,p.x,p.y);ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y);});
    ctx.globalAlpha=1;drawHud();
  }
  function loop(now){if(!running)return;const dt=Math.min(.032,(now-last)/1000);last=now;clock+=dt;shake=Math.max(0,shake-dt);update(dt);if(running){updateCamera(dt);draw();raf=requestAnimationFrame(loop);}}
  function finish(won,reason){
    if(finished)return;finished=true;running=false;cancelAnimationFrame(raf);shake=0;
    finishBanner=reason==='KO'?'K.O.':'TIME UP';draw();
    const score=won?Math.round((hits*18+player.hp*5+time*8)*mode.bonus):Math.round(hits*5);
    if(won)recordWin('fighter',score);else recordLoss(score,'fighter');
    el.querySelector('#fighter-result').innerHTML=`<div class="result-box mt"><div class="result-score">${won?'🏆 WIN':'💥 LOSE'}</div><p>${reason}・スコア ${score.toLocaleString()}pt　命中 ${hits}回</p>${won?xpResultHtml(score,'fighter'):''}<button class="btn btn-danger mt" onclick="startGame('fighter')">もう一度</button></div>`;
  }
  function key(e,on){const k=e.key.toLowerCase();if(['a','d','w','j','k','l','arrowleft','arrowright','arrowup'].includes(k))e.preventDefault();if(k==='a'||k==='arrowleft')keys.left=on;if(k==='d'||k==='arrowright')keys.right=on;if(k==='l')keys.guard=on;if(on&&(k==='w'||k==='arrowup'))jump(player);if(on&&k==='j')attack(player,'light');if(on&&k==='k')attack(player,'heavy');}
  const down=e=>key(e,true),up=e=>key(e,false);document.addEventListener('keydown',down);document.addEventListener('keyup',up);
  function bindButtons(){el.querySelectorAll('[data-hold]').forEach(b=>{const name=b.dataset.hold,on=e=>{e.preventDefault();keys[name]=true;b.classList.add('held');},off=e=>{e.preventDefault();keys[name]=false;b.classList.remove('held');};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});el.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();const a=b.dataset.action;a==='jump'?jump(player):attack(player,a);}));}
  el._cleanup=()=>{running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',down);document.removeEventListener('keyup',up);delete window.fighterStart;};
};
