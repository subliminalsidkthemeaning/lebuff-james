'use strict';
function physics() {
  const fold=(v,span)=>{const m=((v%(2*span))+2*span)%(2*span);return m<=span?m:2*span-m;};
  function plan(x,y,w,h,rng=Math.random){
    const duration=480+rng()*420;
    const choose=(p,span,speed)=>{
      const sign=rng()<.5?-1:1;
      let k=Math.round((p+sign*speed*duration)/span);
      if(k*span===p)k+=sign;
      return k*span;
    };
    const scale=Math.max(.32,Math.min(1.4,Math.min(w,h)/500));
    const tx=choose(x,w,(80+rng()*35)*scale);
    const ty=choose(y,h,(48+rng()*30)*scale);
    return {x,y,w,h,duration,tx,ty,vx:(tx-x)/duration,vy:(ty-y)/duration};
  }
  const at=(p,t)=>{const elapsed=Math.min(p.duration,Math.max(0,t));return {x:fold(elapsed===p.duration?p.tx:p.x+p.vx*elapsed,p.w),y:fold(elapsed===p.duration?p.ty:p.y+p.vy*elapsed,p.h)};};
  function crossings(p,a,b,axis){
    const span=axis==='x'?p.w:p.h;
    const start=p[axis], velocity=p[axis==='x'?'vx':'vy'];
    const value=t=>t===p.duration?p[axis==='x'?'tx':'ty']:start+velocity*t;
    const old=value(a)/span, next=value(b)/span;
    const epsilon=1e-9;
    return velocity>0?Math.max(0,Math.floor(next+epsilon)-Math.floor(old+epsilon)):Math.max(0,Math.ceil(old-epsilon)-Math.ceil(next-epsilon));
  }
  return {plan,at,crossings};
}
function screen(physics){
  const {plan,at,crossings}=physics();
  const screen=document.getElementById('screen'), image=document.getElementById('lebron');
  let segment=null, elapsed=0, last=null, hue=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function tint(){
    hue=(hue+45+Math.floor(Math.random()*260))%360;
    image.style.filter='grayscale(1) sepia(1) saturate(3.8) hue-rotate('+hue+'deg)';
  }
  function resize(){
    const width=screen.clientWidth,height=screen.clientHeight;
    if(width<2||height<2)return;
    const size=Math.min(width-1,height-1,Math.max(44,Math.min(150,Math.round(Math.min(width,height)*.22))));
    image.style.width=size+'px'; image.style.height=size+'px';
    const w=width-size,h=height-size;
    const old=segment?at(segment,elapsed):null;
    const x=old?Math.min(w,Math.max(0,old.x/segment.w*w)):w*(.1+Math.random()*.8);
    const y=old?Math.min(h,Math.max(0,old.y/segment.h*h)):h*(.1+Math.random()*.8);
    segment=plan(x,y,w,h);elapsed=0;last=null;
    render();
  }
  function render(){
    if(!segment)return;
    const pos=reduced.matches?{x:segment.w/2,y:segment.h/2}:at(segment,elapsed);
    image.style.transform='translate3d('+pos.x+'px,'+pos.y+'px,0)';
    image.style.visibility='visible';
  }
  function frame(now){
    const dt=last===null?0:Math.min(.1,Math.max(0,(now-last)/1000));
    last=now;
    if(segment&&!document.hidden&&!reduced.matches){
      let remaining=dt;
      while(remaining>0){
        const before=elapsed, step=Math.min(remaining,segment.duration-elapsed);
        elapsed=Math.min(segment.duration,elapsed+step);remaining-=step;
        const count=crossings(segment,before,elapsed,'x')+crossings(segment,before,elapsed,'y');
        if(count)tint();
        if(elapsed>=segment.duration){const p=at(segment,elapsed);segment=plan(p.x,p.y,segment.w,segment.h);elapsed=0;}
      }
    }
    render();requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',()=>{last=null;});
  window.addEventListener('resize',resize);
  reduced.addEventListener('change',()=>{last=null;render();});
  resize();requestAnimationFrame(frame);
  if(new URLSearchParams(location.search).has('frame_id')){
    import('./discord-sdk.js').then(({connect})=>connect()).catch(error=>console.warn('Discord connection:',error.message));
  }
}
screen(physics);
