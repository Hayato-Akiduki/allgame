
// ================================================================
// GAME: PINBALL (操作型ピンボール)
// ================================================================
games.pinball = function(el) {
  const W=420,H=640,R=8,STEP=1/120;
  let ball,score=0,lives=3,running=true,raf,last=0,acc=0,time=0,saveUntil=0,launchTime=0,servedScore=0,mission=0;
  const held={left:false,right:false},pointers=new Map();
  const bumpers=[{x:145,y:170,r:25},{x:255,y:170,r:25},{x:200,y:245,r:28}];
  const targets=[{x:45,y:280,r:13,lit:false},{x:355,y:280,r:13,lit:false},{x:80,y:350,r:13,lit:false},{x:320,y:350,r:13,lit:false}];
  const rails=[[25,110,25,445],[375,110,375,445],[25,110,80,55],[80,55,320,55],[320,55,375,110],
    [25,445,105,545],[375,445,295,545], [60,425,110,500],[340,425,290,500]];
  // 70px flippers leave about two balls of open space between the tips at rest.
  const FLIP_LEN=70;
  const flippers=[{x:105,y:545,side:1,angle:.28,omega:0,key:'left',len:FLIP_LEN},{x:295,y:545,side:-1,angle:.28,omega:0,key:'right',len:FLIP_LEN}];
  el.innerHTML=`<div class="game-header"><h2>🚀 スペース・ピンボール</h2><p>← → / Z・Mでフリッパー。先端で打つと反対側、根元で打つと同じ側を狙えます。</p></div>
    <div class="info-row"><div class="info-box"><div class="ib-val" id="pin-score">0</div><div class="ib-label">スコア</div></div><div class="info-box"><div class="ib-val" id="pin-lives">●●●</div><div class="ib-label">残りボール</div></div><div class="info-box"><div class="ib-val" id="pin-mission">0 / 4</div><div class="ib-label">点灯ターゲット</div></div></div>
    <canvas id="pin-canvas" width="420" height="640" aria-label="宇宙をテーマにしたピンボール盤面" style="display:block;margin:auto;max-width:100%;border-radius:18px;touch-action:none"></canvas>
    <p id="pin-status" role="status" style="text-align:center;min-height:1.5em">発射後12秒・無得点の落下はボールを救済</p>
    <div class="pin-controls"><button class="btn" id="pin-left" style="touch-action:none;user-select:none">◀ 左</button><button class="btn btn-warn" id="pin-launch">● 発射</button><button class="btn" id="pin-right" style="touch-action:none;user-select:none">右 ▶</button></div>
    <p class="meta-sub" style="text-align:center">4つのターゲット点灯で1,000点。上部レーン通過で250点。<br>発射後12秒、またはその球が無得点なら落ちても残球は減りません。</p><div id="pin-msg"></div>`;
  const canvas=el.querySelector('#pin-canvas'),ctx=canvas.getContext('2d');
  function hud(){el.querySelector('#pin-score').textContent=score.toLocaleString();el.querySelector('#pin-lives').textContent='●'.repeat(lives)+'○'.repeat(3-lives);el.querySelector('#pin-mission').textContent=targets.filter(t=>t.lit).length+' / 4';}
  function say(text){el.querySelector('#pin-status').textContent=text;}
  function reset(){ball={x:397,y:575,vx:0,vy:0,ready:true,launching:false,lane:false};held.left=held.right=false;hud();}
  function launch(){if(!running||!ball.ready)return;ball.ready=false;ball.launching=true;launchTime=0;saveUntil=time+12;servedScore=score;say('発射！12秒間ボールセーブ');}
  function award(n){score+=n;hud();}
  function segment(ax,ay,bx,by,r=4,restitution=.78){
    const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((ball.x-ax)*dx+(ball.y-ay)*dy)/(dx*dx+dy*dy)));
    let nx=ball.x-ax-t*dx,ny=ball.y-ay-t*dy,d=Math.hypot(nx,ny);
    if(d>=R+r)return null;
    if(d<.001){nx=-dy;ny=dx;d=Math.hypot(nx,ny);}nx/=d;ny/=d;
    ball.x=ax+t*dx+nx*(R+r+.1);ball.y=ay+t*dy+ny*(R+r+.1);
    const dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=(1+restitution)*dot*nx;ball.vy-=(1+restitution)*dot*ny;}
    return t;
  }
  function circle(b,target){
    let dx=ball.x-b.x,dy=ball.y-b.y,d=Math.hypot(dx,dy);if(d>=R+b.r)return;
    const nx=d?dx/d:0,ny=d?dy/d:-1;ball.x=b.x+nx*(R+b.r+.2);ball.y=b.y+ny*(R+b.r+.2);
    const dot=ball.vx*nx+ball.vy*ny;
    if(dot<0){ball.vx-=2*dot*nx;ball.vy-=2*dot*ny;ball.vx+=nx*90;ball.vy+=ny*90;
      if(!b.hit||time-b.hit>.12){b.hit=time;award(target?150:100);
        if(target&&!b.lit){b.lit=true;if(targets.every(t=>t.lit)){mission++;award(1000);targets.forEach(t=>t.lit=false);say('ミッション達成！ +1,000');}hud();}
      }
    }
  }
  function step(dt){
    time+=dt;
    for(const f of flippers){const goal=held[f.key]?-.5:.28,old=f.angle;f.angle+=Math.max(-dt*11,Math.min(dt*11,goal-f.angle));f.omega=(f.angle-old)/dt;}
    if(ball.ready)return;
    if(ball.launching){
      launchTime+=dt;
      // The shooter lane delivers the ball along a repeatable path into the playfield.
      if(launchTime<.85){ball.y=575-510*launchTime/.85;ball.x=397;}
      else{const t=Math.min(1,(launchTime-.85)/.45);ball.x=397-147*t;ball.y=65-25*Math.sin(t*Math.PI);if(t===1){ball.launching=false;ball.vx=-145;ball.vy=170;}}
      return;
    }
    ball.vy+=410*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    rails.forEach(r=>segment(...r));
    bumpers.forEach(b=>circle(b,false));targets.forEach(b=>circle(b,true));
    // Gate rewards an upward shot once, then rearms when the ball leaves the upper table.
    if(ball.y<105&&!ball.lane){ball.lane=true;award(250);say('オービット通過 +250');}if(ball.y>150)ball.lane=false;
    for(const f of flippers){
      const bx=f.x+f.side*f.len*Math.cos(f.angle),by=f.y+f.len*Math.sin(f.angle);
      const falling=ball.vy>0,t=segment(f.x,f.y,bx,by,9,.35);
      if(t!==null&&held[f.key]&&(f.omega<-.1||falling)&&ball.y<f.y+8){
        // Contact location controls aim. A raised flipper is less powerful than a timed stroke.
        const power=f.omega<-.1?690:450;ball.vy=-power;ball.vx=f.side*(t-.38)*470;
      }
    }
    const speed=Math.hypot(ball.vx,ball.vy);if(speed>850){ball.vx*=850/speed;ball.vy*=850/speed;}
    if(ball.y>H+R){
      if(time<saveUntil||score===servedScore){reset();say('ボールセーブ！ 残球そのままで再発射');}
      else{lives--;hud();if(lives===0)end();else{reset();say('次のボールを発射しよう');}}
    }
  }
  function line(ax,ay,bx,by,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}
  function disc(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function label(text,x,y,color='#b6d5ff',size=12){ctx.fillStyle=color;ctx.font=`bold ${size}px sans-serif`;ctx.textAlign='center';ctx.fillText(text,x,y);}
  function draw(){
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#16284c');bg.addColorStop(1,'#070d20');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    for(let i=0;i<65;i++)disc(18+(i*73)%380,20+(i*113)%520,i%3===0?1.4:.6,'#6585b2');
    ctx.strokeStyle='#233b65';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(200,270,130,180,-.25,0,Math.PI*2);ctx.stroke();
    label('SPACE  PATROL',200,325,'#47709e',22);label('ORBIT  +250',200,93,'#72e8ff',13);
    rails.forEach(r=>{line(...r,'#284777',11);line(...r,'#8abadd',3);});
    line(385,110,385,620,'#486080',3);label('↑',398,490,'#ffd875',20);
    bumpers.forEach(b=>{disc(b.x,b.y,b.r+6,'#304d71');disc(b.x,b.y,b.r,time-b.hit<.12?'#fff':'#53d9ed');disc(b.x,b.y,b.r-8,'#193253');label('100',b.x,b.y+5,'#dcfbff',14);});
    targets.forEach((b,i)=>{disc(b.x,b.y,b.r+3,b.lit?'#ffe494':'#496383');disc(b.x,b.y,b.r-2,b.lit?'#ebae39':'#26344f');label(String(i+1),b.x,b.y+4,b.lit?'#172136':'#a9c0dc');});
    label('4 TARGETS = 1,000',200,380,'#e6bf73',13);
    for(const f of flippers){const bx=f.x+f.side*f.len*Math.cos(f.angle),by=f.y+f.len*Math.sin(f.angle);line(f.x,f.y,bx,by,'#314063',24);line(f.x,f.y,bx,by,held[f.key]?'#ffe39a':'#dceafa',17);disc(f.x,f.y,5,'#659bc9');}
    label('BALL SAVE',200,480,!ball.ready&&time<saveUntil?'#70efbd':'#3d5570',15);
    label(ball.ready?'SPACE / 発射':time<saveUntil?`${Math.ceil(saveUntil-time)}秒`:'',200,501,'#e5f1ff',13);
    disc(ball.x+2,ball.y+3,R+1,'#050a16');const shine=ctx.createRadialGradient(ball.x-3,ball.y-3,1,ball.x,ball.y,R);shine.addColorStop(0,'#fff');shine.addColorStop(.45,'#dce5ef');shine.addColorStop(1,'#667b98');disc(ball.x,ball.y,R,shine);
    label('MISSION '+(mission+1),200,615,'#7097c4');
  }
  function loop(stamp){if(!running)return;if(!last)last=stamp;acc+=Math.min((stamp-last)/1000,.05);last=stamp;while(acc>=STEP&&running){step(STEP);acc-=STEP;}draw();if(running)raf=requestAnimationFrame(loop);}
  function end(){running=false;cancelAnimationFrame(raf);if(score>0)recordWin('pinball',score);else recordLoss(0,'pinball');el.querySelector('#pin-msg').innerHTML=`<div class="result-box"><div class="result-score">${score.toLocaleString()}</div><p>ミッション達成 ${mission}回</p><button class="btn mt" onclick="startGame('pinball')">もう一度</button></div>`;}
  const keyState={};
  function sync(){held.left=!!(keyState.ArrowLeft||keyState.KeyZ||[...pointers.values()].includes('left'));held.right=!!(keyState.ArrowRight||keyState.KeyM||[...pointers.values()].includes('right'));}
  function keys(e){if(['ArrowLeft','ArrowRight','KeyZ','KeyM','Space'].includes(e.code)){e.preventDefault();keyState[e.code]=e.type==='keydown';sync();if(e.code==='Space'&&e.type==='keydown'&&!e.repeat)launch();}}
  function release(){Object.keys(keyState).forEach(k=>delete keyState[k]);pointers.clear();sync();last=0;acc=0;}
  for(const side of ['left','right']){const button=el.querySelector('#pin-'+side);button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,side);sync();};button.onpointerup=button.onpointercancel=button.onlostpointercapture=e=>{pointers.delete(e.pointerId);sync();};}
  el.querySelector('#pin-launch').onclick=launch;
  document.addEventListener('keydown',keys);document.addEventListener('keyup',keys);window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);
  reset();raf=requestAnimationFrame(loop);
  el._cleanup=()=>{running=false;cancelAnimationFrame(raf);release();document.removeEventListener('keydown',keys);document.removeEventListener('keyup',keys);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};
};
