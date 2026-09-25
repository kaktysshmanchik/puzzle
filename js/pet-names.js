(()=>{
    const root=document.querySelector('[data-pet-name-puzzle]');
    if(!root)return;

    const source=root.querySelector('[data-pet-name-source]');
    const slots=root.querySelector('[data-pet-name-slots]');
    const card=root.querySelector('[data-pet-name-card]');
    const KEY='lorePetNamesV1';
    const names=['My love','My dear','Baby',"Person I'm romantically entangled with",'Babe','Giggles','Sweetheart','Gorgeous','Beautiful','Skittles','KitKat','QAcuitie','Sex kitten'];
    let drag=null;
    let state=load();

    function shuffled(){
        const a=names.map((_,i)=>i);
        for(let i=a.length-1;i;i--){
            const j=Math.floor(Math.random()*(i+1));
            [a[i],a[j]]=[a[j],a[i]];
        }
        return a;
    }

    function load(){
        try{
            const s=JSON.parse(localStorage.getItem(KEY));
            if(s){
                return{
                    placed:s.placed||{},
                    shuffle:Array.isArray(s.shuffle)&&s.shuffle.length===names.length?s.shuffle:shuffled(),
                    flipped:Boolean(s.flipped)
                };
            }
        }catch(_){}
        return{placed:{},shuffle:shuffled(),flipped:false};
    }

    function save(){localStorage.setItem(KEY,JSON.stringify(state));}

    function chip(i){
        const el=document.createElement('div');
        el.className='pet-name-chip';
        el.textContent=names[i];
        el.dataset.name=i;
        el.addEventListener('pointerdown',start);
        return el;
    }

    function render(){
        source.innerHTML='';
        slots.innerHTML='';
        const used=new Set(Object.values(state.placed).map(Number));
        state.shuffle.filter(i=>!used.has(i)).forEach(i=>source.appendChild(chip(i)));

        names.forEach((_,i)=>{
            const slot=document.createElement('div');
            slot.className='pet-name-slot';
            slot.dataset.slot=i;
            const occ=state.placed[i];
            if(occ!==undefined){
                const n=Number(occ),el=chip(n);
                slot.appendChild(el);
                if(n===i){
                    slot.classList.add('is-correct');
                    el.removeEventListener('pointerdown',start);
                }else{
                    slot.classList.add('is-wrong');
                }
            }
            slots.appendChild(slot);
        });

        const won=names.every((_,i)=>Number(state.placed[i])===i);
        source.hidden=won;
        card.hidden=!won;
        card.classList.toggle('is-flipped',won&&state.flipped);
    }

    function start(e){
        if(e.button!==0&&e.pointerType!=='touch')return;
        const el=e.currentTarget;
        const parent=el.closest('.pet-name-slot');
        if(parent&&parent.classList.contains('is-correct'))return;
        e.preventDefault();
        const r=el.getBoundingClientRect();
        drag={el,id:Number(el.dataset.name),from:parent?Number(parent.dataset.slot):null,dx:e.clientX-r.left,dy:e.clientY-r.top,target:null};
        el.style.setProperty('--pet-drag-width',`${r.width}px`);
        document.body.appendChild(el);
        el.classList.add('is-dragging');
        move(e);
        window.addEventListener('pointermove',move,{passive:false});
        window.addEventListener('pointerup',end,{once:true});
        window.addEventListener('pointercancel',end,{once:true});
    }

    function move(e){
        if(!drag)return;
        e.preventDefault();
        drag.el.style.setProperty('--pet-drag-x',`${e.clientX-drag.dx}px`);
        drag.el.style.setProperty('--pet-drag-y',`${e.clientY-drag.dy}px`);
        root.querySelectorAll('.pet-name-slot.is-target').forEach(x=>x.classList.remove('is-target'));
        drag.el.style.visibility='hidden';
        const under=document.elementFromPoint(e.clientX,e.clientY);
        drag.el.style.visibility='';
        const slot=under&&under.closest('.pet-name-slot');
        drag.target=slot&&!slot.classList.contains('is-correct')?slot:null;
        if(drag.target)drag.target.classList.add('is-target');
    }

    function end(){
        if(!drag)return;
        window.removeEventListener('pointermove',move);
        root.querySelectorAll('.pet-name-slot.is-target').forEach(x=>x.classList.remove('is-target'));
        if(drag.from!==null&&Number(state.placed[drag.from])===drag.id)delete state.placed[drag.from];
        if(drag.target){
            const target=Number(drag.target.dataset.slot);
            const displaced=state.placed[target];
            if(displaced!==undefined)delete state.placed[target];
            state.placed[target]=drag.id;
        }
        drag.el.remove();
        drag=null;
        save();
        render();
    }

    card.addEventListener('click',()=>{
        if(card.hidden)return;
        state.flipped=!state.flipped;
        card.classList.toggle('is-flipped',state.flipped);
        save();
    });

    render();
})();
