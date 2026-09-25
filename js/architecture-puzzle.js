(()=>{
  const root=document.querySelector('[data-architecture-puzzle]');
  if(!root)return;

  const IMG='assets/images/lore/architecture.jpg';
  const COLS=4,ROWS=3,COUNT=COLS*ROWS,KEY='loreArchitecturePuzzleV1';
  const stage=root.querySelector('[data-architecture-stage]');
  const tray=root.querySelector('[data-architecture-tray]');
  const board=root.querySelector('[data-architecture-board]');
  const layer=root.querySelector('[data-architecture-pieces]');
  const card=root.querySelector('[data-architecture-card]');
  let drag=null;
  let state=load();

  if(new URLSearchParams(location.search).get('reset')==='1'){
    localStorage.removeItem(KEY);
    state=freshState();
  }

  function freshState(){
    return{positions:{},locked:{},shuffle:shuffle([...Array(COUNT).keys()]),complete:false,flipped:false};
  }

  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(KEY));
      if(saved&&saved.positions&&saved.locked){
        return{
          positions:saved.positions||{},
          locked:saved.locked||{},
          shuffle:Array.isArray(saved.shuffle)&&saved.shuffle.length===COUNT?saved.shuffle:shuffle([...Array(COUNT).keys()]),
          complete:Boolean(saved.complete),
          flipped:Boolean(saved.flipped)
        };
      }
    }catch(_){}
    return freshState();
  }

  function save(){localStorage.setItem(KEY,JSON.stringify(state));}

  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  function preload(){
    const img=new Image();
    img.onload=()=>{
      board.style.aspectRatio=`${img.naturalWidth||4} / ${img.naturalHeight||3}`;
      card.style.aspectRatio=`${img.naturalWidth||4} / ${img.naturalHeight||3}`;
      requestAnimationFrame(()=>{render();window.addEventListener('resize',onResize);});
    };
    img.onerror=()=>requestAnimationFrame(()=>{render();window.addEventListener('resize',onResize);});
    img.src=IMG;
  }

  function metrics(){
    const sr=stage.getBoundingClientRect(),br=board.getBoundingClientRect(),tr=tray.getBoundingClientRect();
    const pw=br.width/COLS,ph=br.height/ROWS;
    return{sr,br,tr,pw,ph,boardX:br.left-sr.left,boardY:br.top-sr.top};
  }

  function defaultPosition(orderIndex,pw,ph){
    const tr=tray.getBoundingClientRect(),sr=stage.getBoundingClientRect();
    const pad=10;
    const usableW=Math.max(pw,tr.width-pad*2);
    const perRow=Math.max(1,Math.floor((usableW+12)/(pw+12)));
    const col=orderIndex%perRow,row=Math.floor(orderIndex/perRow);
    const x=tr.left-sr.left+pad+col*(pw+12);
    const y=tr.top-sr.top+pad+row*(ph+12);
    return{x,y};
  }

  function piece(id,m){
    const el=document.createElement('div');
    const col=id%COLS,row=Math.floor(id/COLS);
    el.className='architecture-piece';
    el.dataset.piece=id;
    el.setAttribute('role','img');
    el.setAttribute('aria-label',`Puzzle piece ${id+1}`);
    el.style.width=`${m.pw}px`;
    el.style.height=`${m.ph}px`;
    el.style.backgroundImage=`url("${IMG}")`;
    el.style.backgroundSize=`${COLS*100}% ${ROWS*100}%`;
    el.style.backgroundPosition=`${COLS===1?0:(col/(COLS-1))*100}% ${ROWS===1?0:(row/(ROWS-1))*100}%`;

    if(state.locked[id]){
      el.classList.add('is-locked');
      setPos(el,m.boardX+col*m.pw,m.boardY+row*m.ph);
    }else{
      const saved=state.positions[id];
      let p;
      if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)){
        p={x:saved.x*m.sr.width,y:saved.y*m.sr.height};
      }else{
        p=defaultPosition(state.shuffle.indexOf(id),m.pw,m.ph);
      }
      setPos(el,clamp(p.x,0,Math.max(0,m.sr.width-m.pw)),clamp(p.y,0,Math.max(0,m.sr.height-m.ph)));
      el.addEventListener('pointerdown',startDrag);
    }
    return el;
  }

  function sizeTray(){
    const br=board.getBoundingClientRect(),tr=tray.getBoundingClientRect();
    if(!br.width||!br.height||!tr.width)return;
    const pw=br.width/COLS,ph=br.height/ROWS,pad=10,gap=12;
    const perRow=Math.max(1,Math.floor((tr.width-pad*2+gap)/(pw+gap)));
    const rows=Math.ceil(COUNT/perRow);
    tray.style.height=`${pad*2+rows*ph+Math.max(0,rows-1)*gap}px`;
  }

  function render(){
    layer.innerHTML='';
    card.hidden=!state.complete;
    tray.hidden=state.complete;
    board.classList.toggle('is-complete',state.complete);
    card.classList.toggle('is-flipped',state.flipped);
    if(state.complete){
      layer.hidden=true;
      board.hidden=true;
      card.hidden=false;
      return;
    }
    layer.hidden=false;
    tray.hidden=false;
    board.hidden=false;
    card.hidden=true;
    sizeTray();
    const m=metrics();
    for(let id=0;id<COUNT;id++)layer.appendChild(piece(id,m));
  }

  function setPos(el,x,y){el.style.transform=`translate(${x}px,${y}px)`;el.dataset.x=x;el.dataset.y=y;}
  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}

  function startDrag(e){
    if(e.button!==0&&e.pointerType!=='touch')return;
    const el=e.currentTarget;
    if(el.classList.contains('is-locked'))return;
    e.preventDefault();
    const sr=stage.getBoundingClientRect();
    const r=el.getBoundingClientRect();
    drag={el,id:Number(el.dataset.piece),dx:e.clientX-r.left,dy:e.clientY-r.top,sr};
    el.classList.add('is-dragging');
    el.setPointerCapture?.(e.pointerId);
    window.addEventListener('pointermove',moveDrag,{passive:false});
    window.addEventListener('pointerup',endDrag,{once:true});
    window.addEventListener('pointercancel',endDrag,{once:true});
  }

  function moveDrag(e){
    if(!drag)return;
    e.preventDefault();
    const m=metrics();
    const x=clamp(e.clientX-m.sr.left-drag.dx,0,Math.max(0,m.sr.width-m.pw));
    const y=clamp(e.clientY-m.sr.top-drag.dy,0,Math.max(0,m.sr.height-m.ph));
    setPos(drag.el,x,y);
    const target=correctTarget(drag.id,m);
    const d=Math.hypot(x-target.x,y-target.y);
    drag.el.classList.toggle('is-near-target',d<=snapDistance(m));
  }

  function snapDistance(m){return Math.max(22,Math.min(m.pw,m.ph)*0.34);}
  function correctTarget(id,m){return{x:m.boardX+(id%COLS)*m.pw,y:m.boardY+Math.floor(id/COLS)*m.ph};}

  function endDrag(){
    if(!drag)return;
    window.removeEventListener('pointermove',moveDrag);
    const m=metrics();
    const x=Number(drag.el.dataset.x)||0,y=Number(drag.el.dataset.y)||0;
    const target=correctTarget(drag.id,m);
    if(Math.hypot(x-target.x,y-target.y)<=snapDistance(m)){
      state.locked[drag.id]=true;
      delete state.positions[drag.id];
      setPos(drag.el,target.x,target.y);
      drag.el.classList.remove('is-dragging','is-near-target');
      drag.el.classList.add('is-locked');
      drag.el.removeEventListener('pointerdown',startDrag);
    }else{
      state.positions[drag.id]={x:m.sr.width?x/m.sr.width:0,y:m.sr.height?y/m.sr.height:0};
      drag.el.classList.remove('is-dragging','is-near-target');
    }
    drag=null;
    state.complete=[...Array(COUNT).keys()].every(id=>state.locked[id]);
    save();
    if(state.complete){
      root.classList.add('just-completed');
      setTimeout(()=>{root.classList.remove('just-completed');render();},260);
    }
  }

  function onResize(){
    if(drag)return;
    render();
  }

  card.addEventListener('click',()=>{
    if(!state.complete)return;
    state.flipped=!state.flipped;
    card.classList.toggle('is-flipped',state.flipped);
    save();
  });

  preload();
})();
