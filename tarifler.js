(function(){
  var F=window.FitKal, R=window.FITKAL_RECIPES||[], fmt=F.fmt;
  var $=function(id){return document.getElementById(id);};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  var norm=function(s){return String(s).toLocaleLowerCase('tr-TR');};
  var byId={}; R.forEach(function(r){byId[r.id]=r; r._plans=F.plansFor(r);});
  var st={kat:'',plan:'',fit:false,q:'',sort:''};

  var qs=new URLSearchParams(location.search);
  if(qs.get('kat')) st.kat=qs.get('kat');
  if(qs.get('plan')) st.plan=qs.get('plan');
  $('fPlan').value=st.plan;

  document.querySelectorAll('#cats button').forEach(function(b){
    var k=b.dataset.kat; if(k) b.querySelector('small').textContent=R.filter(function(r){return r.category===k;}).length;
    b.addEventListener('click',function(){st.kat=k;draw();});
  });
  $('fPlan').addEventListener('change',function(){st.plan=this.value;draw();});
  $('fSort').addEventListener('change',function(){st.sort=this.value;draw();});
  $('fFit').addEventListener('change',function(){st.fit=this.checked;draw();});
  $('fQ').addEventListener('input',function(){st.q=norm(this.value.trim());draw();});

  function draw(){
    document.querySelectorAll('#cats button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.kat===st.kat);});
    var list=R.filter(function(r){
      if(st.kat&&r.category!==st.kat) return false;
      if(st.plan&&r._plans.indexOf(st.plan)<0) return false;
      if(st.fit&&!r.fit) return false;
      if(st.q&&norm(r.title+' '+r.desc+' '+r.tags.join(' ')+' '+r.ingredients.join(' ')).indexOf(st.q)<0) return false;
      return true;
    });
    var s={ 'kcal-asc':function(a,b){return a.kcal-b.kcal;}, 'kcal-desc':function(a,b){return b.kcal-a.kcal;}, protein:function(a,b){return b.protein-a.protein;}, time:function(a,b){return a.time-b.time;}, sugar:function(a,b){return a.sugar-b.sugar;} }[st.sort];
    if(s) list=list.slice().sort(s);
    $('count').textContent=list.length+' tarif'+(st.plan?' · '+F.PLANS[st.plan].name+' plana uygun':'');
    $('grid').innerHTML=list.length?list.map(card).join(''):'<div class="empty">Bu filtrelere uyan tarif yok. Filtreleri gevşetmeyi dene.</div>';
    $('grid').querySelectorAll('.rcard').forEach(function(c){c.addEventListener('click',function(){location.hash=c.dataset.id;});});
  }

  function card(r){
    return '<button type="button" class="rcard" data-id="'+r.id+'"><span class="rart">'+window.FitKalArt.svg(r)+'</span><span class="rband '+r.category+'"></span><span class="rbody">'+
      '<span class="rmeta"><span>'+F.CATS[r.category]+'</span><span>'+r.time+' dk</span></span>'+
      '<h3>'+esc(r.title)+'</h3><p>'+esc(r.desc)+'</p>'+
      '<span class="badges">'+(r.fit?'<span class="badge fit">Fit</span>':'')+(r.sugar<=5?'<span class="badge">Düşük şeker</span>':'')+r._plans.map(function(p){return '<span class="badge">'+F.PLANS[p].name+'</span>';}).join('')+'</span>'+
      '<span class="rkcal"><span class="num">'+fmt(r.kcal)+'</span><small>kcal / porsiyon</small></span>'+
      '<span class="rmac"><span>P '+r.protein+' g</span><span>K '+r.carbs+' g</span><span>Y '+r.fat+' g</span>'+(r.sugar>0?'<span class="sug">Şeker '+r.sugar+' g</span>':'')+'</span>'+
      '</span></button>';
  }

  var dlg=$('dlg');
  function openRecipe(id){
    var r=byId[id]; if(!r) return;
    var sh=F.shares(r);
    $('dBody').innerHTML=
      '<div class="rd-art">'+window.FitKalArt.svg(r)+'</div><div class="rd-top"><div><div class="eyebrow">'+F.CATS[r.category]+(r.fit?' · Fit':'')+'</div><h2 id="dTitle" style="margin-top:6px">'+esc(r.title)+'</h2><p style="margin:8px 0 0;color:var(--muted)">'+esc(r.desc)+'</p></div>'+
      '<button class="icon-btn close" type="button" id="dClose" aria-label="Kapat"><svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
      '<div class="rd-stats"><div><span>Porsiyon kalorisi</span><strong>'+fmt(r.kcal)+' kcal</strong></div><div><span>Protein</span><strong>'+r.protein+' g</strong></div><div><span>Karbonhidrat</span><strong>'+r.carbs+' g</strong></div><div><span>Yağ</span><strong>'+r.fat+' g</strong></div><div><span>Şeker</span><strong>'+r.sugar+' g</strong></div></div>'+
      '<div class="macro-bar" style="margin:0"><i style="width:'+Math.round(sh.p*100)+'%;background:var(--beet)"></i><i style="width:'+Math.round(sh.c*100)+'%;background:var(--turmeric)"></i><i style="width:'+Math.round(sh.f*100)+'%;background:var(--sky)"></i></div>'+
      '<div class="note">'+r.servings+' porsiyon · '+r.time+' dk · '+r.difficulty+' · Toplam tarif ≈ '+fmt(r.kcal*r.servings)+' kcal'+(r._plans.length?' · Uygun planlar: '+r._plans.map(function(p){return F.PLANS[p].name;}).join(', '):'')+'</div>'+
      '<div class="rd-cols"><div><h4>Malzemeler</h4><ul>'+r.ingredients.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'+
      '<div><h4>Hazırlanışı</h4><ol>'+r.steps.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div></div>';
    $('dClose').addEventListener('click',closeRecipe);
    if(!dlg.open) dlg.showModal();
  }
  function closeRecipe(){ if(dlg.open) dlg.close(); if(location.hash) history.replaceState(null,'',location.pathname+location.search); }
  dlg.addEventListener('close',function(){ if(location.hash) history.replaceState(null,'',location.pathname+location.search); });
  dlg.addEventListener('click',function(e){ if(e.target===dlg) closeRecipe(); });
  function fromHash(){ var id=location.hash.slice(1); if(id&&byId[id]) openRecipe(id); }
  window.addEventListener('hashchange',fromHash);

  draw(); fromHash();
})();
