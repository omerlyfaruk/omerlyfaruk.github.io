(function(){
  var F=window.FitKal, R=window.FITKAL_RECIPES||[], fmt=F.fmt;
  var $=function(id){return document.getElementById(id);};
  var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  var norm=function(s){return String(s).toLocaleLowerCase('tr-TR');};
  var byId={}; R.forEach(function(r){byId[r.id]=r; r._plans=F.plansFor(r);});
  var st={kat:'',plan:'',fit:false,q:'',sort:'',diets:[]};

  var qs=new URLSearchParams(location.search);
  if(qs.get('kat')) st.kat=qs.get('kat');
  if(qs.get('plan')) st.plan=qs.get('plan');
  $('fPlan').value=st.plan;

  document.querySelectorAll('#cats button').forEach(function(b){
    var k=b.dataset.kat;
    b.addEventListener('click',function(){st.kat=k;draw();});
  });
  $('fDiets').innerHTML=Object.keys(F.DIETS).map(function(k){ return '<label class="dchip"><input type="checkbox" data-diet="'+k+'"><span>'+F.DIETS[k].name+'</span></label>'; }).join('');
  $('fDiets').querySelectorAll('input').forEach(function(i){ i.addEventListener('change',function(){ st.diets=[].slice.call($('fDiets').querySelectorAll('input:checked')).map(function(x){return x.dataset.diet;}); draw(); }); });
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
      if(st.diets.length&&!F.dietOk(r,st.diets)) return false;
      if(st.q&&norm(r.title+' '+r.desc+' '+r.tags.join(' ')+' '+r.ingredients.join(' ')).indexOf(st.q)<0) return false;
      return true;
    });
    var s={ 'kcal-asc':function(a,b){return a.kcal-b.kcal;}, 'kcal-desc':function(a,b){return b.kcal-a.kcal;}, protein:function(a,b){return b.protein-a.protein;}, time:function(a,b){return a.time-b.time;}, sugar:function(a,b){return a.sugar-b.sugar;} }[st.sort];
    if(s) list=list.slice().sort(s);
    $('count').textContent=list.length+' tarif'+(st.plan?' · '+F.PLANS[st.plan].name+' plana uygun':'')+(st.diets.length?' · '+st.diets.map(function(k){return F.DIETS[k].name;}).join(', '):'');
    $('grid').innerHTML=list.length?list.map(card).join(''):'<div class="empty">Bu filtrelere uyan tarif yok. Filtreleri gevşetmeyi dene.</div>';
    $('grid').querySelectorAll('.rcard').forEach(function(c){c.addEventListener('click',function(){location.hash=c.dataset.id;});});
  }

  function card(r){
    return '<button type="button" class="rcard plain" data-id="'+r.id+'"><span class="rbody">'+
      '<span class="rmeta"><span>'+F.CATS[r.category]+(r.fit?' · Fit':'')+'</span><span>'+r.time+' dk</span></span>'+
      '<h3>'+esc(r.title)+'</h3>'+
      '<span class="rkcal"><span class="num">'+fmt(r.kcal)+'</span><small>kcal</small></span>'+
      '<span class="rmac"><span>P '+r.protein+'</span><span>K '+r.carbs+'</span><span>Y '+r.fat+'</span><span>Ş '+r.sugar+'</span></span>'+
      '</span></button>';
  }

  var dlg=$('dlg');
  var cur=null, curServ=1;
  function ingHtml(r,n){ var f=n/r.servings; return r.ingredients.map(function(x){return '<li>'+esc(F.scaleIng(x,f))+'</li>';}).join(''); }
  function openRecipe(id){
    var r=byId[id]; if(!r) return;
    cur=r; curServ=r.servings;
    var diets=F.dietsFor(r);
    $('dBody').innerHTML=
      '<div class="rd-top"><div><div class="eyebrow">'+F.CATS[r.category]+(r.fit?' · Fit':'')+'</div><h2 id="dTitle" style="margin-top:6px">'+esc(r.title)+'</h2><p style="margin:8px 0 0;color:var(--muted)">'+esc(r.desc)+'</p></div>'+
      '<button class="icon-btn close" type="button" id="dClose" aria-label="Kapat"><svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
      '<div class="rd-stats"><div><span>Porsiyon kalorisi</span><strong>'+fmt(r.kcal)+' kcal</strong></div><div><span>Protein</span><strong>'+r.protein+' g</strong></div><div><span>Karbonhidrat</span><strong>'+r.carbs+' g</strong></div><div><span>Yağ</span><strong>'+r.fat+' g</strong></div><div><span>Şeker</span><strong>'+r.sugar+' g</strong></div></div>'+
      '<div class="note">'+r.time+' dk · '+r.difficulty+(r._plans.length?' · Uygun planlar: '+r._plans.map(function(p){return F.PLANS[p].name;}).join(', '):'')+'</div>'+
      (diets.length?'<div class="note">'+diets.map(function(k){return F.DIETS[k].name;}).join(' · ')+'</div>':'')+
      '<div class="rd-tools"><div class="stepper" role="group" aria-label="Porsiyon sayısı"><button type="button" class="icon-btn sm" id="sMinus" aria-label="Porsiyonu azalt">−</button><span><b id="sN">'+curServ+'</b> porsiyon · <b id="sK">'+fmt(r.kcal*curServ)+'</b> kcal</span><button type="button" class="icon-btn sm" id="sPlus" aria-label="Porsiyonu artır">+</button></div>'+
      '<div class="rd-acts"><button type="button" class="btn btn-ghost btn-sm" id="dCopy">Bağlantıyı kopyala</button><button type="button" class="btn btn-ghost btn-sm" id="dPrint">Yazdır</button></div></div>'+
      '<div class="rd-cols"><div><h4>Malzemeler</h4><ul id="dIng">'+ingHtml(r,curServ)+'</ul></div>'+
      '<div><h4>Hazırlanışı</h4><ol>'+r.steps.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div></div>'+
      '<p class="note">Değerler porsiyon başına yaklaşıktır. Alerjin varsa ürün etiketlerini kontrol et.</p>';
    $('dClose').addEventListener('click',closeRecipe);
    function setServ(n){ curServ=Math.max(1,Math.min(20,n)); $('sN').textContent=curServ; $('sK').textContent=fmt(r.kcal*curServ); $('dIng').innerHTML=ingHtml(r,curServ); }
    $('sMinus').addEventListener('click',function(){setServ(curServ-1);});
    $('sPlus').addEventListener('click',function(){setServ(curServ+1);});
    $('dPrint').addEventListener('click',function(){ document.body.classList.add('printing-recipe'); window.print(); setTimeout(function(){document.body.classList.remove('printing-recipe');},500); });
    $('dCopy').addEventListener('click',function(){
      var url=location.href.replace(/[#?].*$/,'').replace(/tarifler\.html$/,'')+'tarif/'+F.slug(r.title)+'.html', b=this;
      var ok=function(){ b.textContent='Kopyalandı'; setTimeout(function(){b.textContent='Bağlantıyı kopyala';},1800); };
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok,ok); else ok();
    });
    if(!dlg.open) dlg.showModal();
  }
  function closeRecipe(){ if(dlg.open) dlg.close(); if(location.hash) history.replaceState(null,'',location.pathname+location.search); }
  dlg.addEventListener('close',function(){ if(location.hash) history.replaceState(null,'',location.pathname+location.search); });
  dlg.addEventListener('click',function(e){ if(e.target===dlg) closeRecipe(); });
  function fromHash(){ var id=location.hash.slice(1); if(id&&byId[id]) openRecipe(id); }
  window.addEventListener('hashchange',fromHash);

  draw(); fromHash();
})();
