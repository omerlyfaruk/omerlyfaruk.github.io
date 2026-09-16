(function(){
  var F=window.FitKal, R=window.FITKAL_RECIPES||[], fmt=F.fmt;
  var $=function(id){return document.getElementById(id);};
  var sex='f';
  var state={};
  var goalMode='keep';
  var MODE_TXT={lose:'Kilo verme',keep:'Kilo koruma',gain:'Kilo alma'};
  var FIELDS=['age','height','weight','activity','targetW','goalWeeks','plan','exMin','neck','waist','hip','duration','mainMeals','snacks','dessert','kcalChoice','exAct','exDur'];
  var dietKeys=[], useBf=false;

  // restore saved profile
  try{
    var saved=JSON.parse(localStorage.getItem('fitkal-profile')||'null');
    if(saved){ FIELDS.forEach(function(k){ if(saved[k]!=null&&$(k)) $(k).value=saved[k]; }); if(saved.sex) sex=saved.sex; if(saved.goalMode) goalMode=saved.goalMode; if(saved.diets) dietKeys=saved.diets; if(saved.useBf) useBf=true; }
  }catch(e){}

  function setSex(s){
    sex=s;
    document.querySelectorAll('[data-sex]').forEach(function(x){x.setAttribute('aria-pressed', x.dataset.sex===s);});
    $('hipLbl').hidden = s==='m';
  }
  document.querySelectorAll('[data-sex]').forEach(function(b){b.addEventListener('click',function(){setSex(b.dataset.sex);calc();});});
  setSex(sex);
  function setGoal(g){
    goalMode=g;
    document.querySelectorAll('[data-goal]').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.goal===g);});
    $('goalFields').hidden = g==='keep';
  }
  document.querySelectorAll('[data-goal]').forEach(function(b){b.addEventListener('click',function(){
    setGoal(b.dataset.goal);
    var w=num('weight');
    if(b.dataset.goal==='lose'&&!(num('targetW')<w)) $('targetW').value=Math.round(w*0.92);
    if(b.dataset.goal==='gain'&&!(num('targetW')>w)) $('targetW').value=Math.round(w*1.05);
    calc();
  });});
  setGoal(goalMode);

  var num=function(id){return parseFloat($(id).value);};
  function chip(el,txt,cls){el.textContent=txt;el.className='chip '+cls;}

  function calc(){
    var age=num('age'),h=num('height'),w=num('weight'),act=num('activity'),plan=$('plan').value;
    if(!(age>0&&h>0&&w>0)) return;
    var m=h/100;

    var bmi=w/(m*m);
    $('bmi').textContent=fmt(bmi,1); $('pB').textContent=fmt(bmi,1);
    if(bmi<18.5) chip($('bmiChip'),'Zayıf','warn');
    else if(bmi<25) chip($('bmiChip'),'Normal','ok');
    else if(bmi<30) chip($('bmiChip'),'Fazla kilolu','warn');
    else chip($('bmiChip'),'Obez','bad');
    var stops=[[15,0],[18.5,17],[25,45],[30,70],[40,100]], pos=100, b=Math.min(Math.max(bmi,15),40);
    for(var i=1;i<stops.length;i++){ if(b<=stops[i][0]){ pos=stops[i-1][1]+(b-stops[i-1][0])/(stops[i][0]-stops[i-1][0])*(stops[i][1]-stops[i-1][1]); break; } }
    $('bmiMark').style.left='calc('+pos+'% - 2px)';

    var neck=num('neck'),waist=num('waist'),hip=num('hip'),bf=NaN;
    if(sex==='m'&&waist>neck) bf=495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(h))-450;
    if(sex==='f'&&waist+hip>neck) bf=495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(h))-450;
    if(isFinite(bf)&&bf>2&&bf<70){
      $('fat').textContent=fmt(bf,1);
      var t=sex==='m'?[6,18,25]:[14,25,32];
      if(bf<t[0]) chip($('fatChip'),'Çok düşük','warn'); else if(bf<t[1]) chip($('fatChip'),'Fit','ok'); else if(bf<t[2]) chip($('fatChip'),'Ortalama','warn'); else chip($('fatChip'),'Yüksek','bad');
    } else { $('fat').textContent='—'; chip($('fatChip'),'Ölçüleri kontrol et',''); }

    var bfOk=isFinite(bf)&&bf>2&&bf<70;
    $('useBf').checked=useBf; $('useBf').disabled=!bfOk;
    var bmr, formula;
    if(useBf&&bfOk){ bmr=370+21.6*w*(1-bf/100); formula='Katch–McArdle (yağ oranı %'+fmt(bf,1)+')'; }
    else { bmr=10*w+6.25*h-5*age+(sex==='m'?5:-161); formula='Mifflin–St Jeor denklemi'+(useBf&&!bfOk?' · yağ oranı için ölçüleri gir':''); }
    $('kcalSub').textContent=formula;
    var tdee=bmr*act;

    var floor=sex==='m'?1500:1200, goal=0, pace='', tw=num('targetW'), gw=Math.max(1,Math.round(num('goalWeeks')||1)), perWeek=0, warn='';
    if(goalMode!=='keep'){
      perWeek=(tw-w)/gw;
      if(goalMode==='lose'&&!(tw<w)){ warn='Hedef kilo mevcut kilondan düşük olmalı.'; perWeek=0; }
      else if(goalMode==='gain'&&!(tw>w)){ warn='Hedef kilo mevcut kilondan yüksek olmalı.'; perWeek=0; }
      else {
        var maxLoss=-1, maxGain=0.5;
        if(perWeek<maxLoss){ warn='Haftada 1 kg\'dan hızlı kilo vermek önerilmez. Program haftada 1 kg\'a göre hazırlandı; bu tempoda hedefe yaklaşık '+Math.ceil((w-tw)/1)+' haftada ulaşırsın.'; perWeek=maxLoss; }
        if(perWeek>maxGain){ warn='Haftada 0,5 kg\'dan hızlı kilo almak önerilmez. Program haftada 0,5 kg\'a göre hazırlandı; bu tempoda hedefe yaklaşık '+Math.ceil((tw-w)/0.5)+' haftada ulaşırsın.'; perWeek=maxGain; }
      }
      goal=perWeek*7700/7;
    }
    var raw=tdee+goal, kcal=Math.round(Math.max(raw, floor));
    if(raw<floor) warn=(warn?warn+' ':'')+'Günlük kalori güvenli alt sınır olan '+fmt(floor)+' kcal\'ye sabitlendi.';
    if(goalMode==='keep') pace='Kilonu korumak için günlük ihtiyacın hesaplandı.';
    else if(perWeek) pace='Haftada <b>'+(perWeek>0?'+':'−')+fmt(Math.abs(perWeek),2)+' kg</b> · günlük <b>'+(kcal-tdee>0?'+':'−')+fmt(Math.abs(kcal-tdee))+' kcal</b> · '+fmt(w,1)+' → '+fmt(tw,1)+' kg, '+gw+' hafta';
    $('paceNote').innerHTML=pace+(warn?'<span class="warn">'+warn+'</span>':'');
    $('bmr').textContent=fmt(bmr)+' kcal'; $('tdee').textContent=fmt(tdee)+' kcal';
    $('delta').textContent=(kcal-tdee>0?'+':'')+fmt(kcal-tdee)+' kcal';
    $('kcal').textContent=fmt(kcal); $('pKcal').textContent=fmt(kcal);
    var goalLabel=MODE_TXT[goalMode]+(goalMode!=='keep'&&perWeek?' · '+fmt(w,1)+' → '+fmt(tw,1)+' kg · '+gw+' hafta':'');
    $('pGoal').textContent=goalLabel;

    var ratio=F.PLANS[plan].ratio, P=kcal*ratio[0]/400, C=kcal*ratio[1]/400, Fa=kcal*ratio[2]/900;
    $('mP').textContent=fmt(P)+' g'; $('mC').textContent=fmt(C)+' g'; $('mF').textContent=fmt(Fa)+' g';
    $('pP').textContent=fmt(P)+' g'; $('pC').textContent=fmt(C)+' g'; $('pF').textContent=fmt(Fa)+' g';
    $('mPkg').textContent=fmt(P/w,1)+' g/kg'; $('mFib').textContent=fmt(Math.round(kcal/1000*14))+' g';
    $('bP').style.width=ratio[0]+'%'; $('bC').style.width=ratio[1]+'%'; $('bF').style.width=ratio[2]+'%';
    $('planSub').textContent=F.PLANS[plan].name+' plan'; $('pPlan').textContent=F.PLANS[plan].name;

    var ex=Math.max(num('exMin')||0,0), L=(w*33+ex/30*350)/1000;
    $('water').textContent=fmt(L,1); $('pW').textContent=fmt(L,1)+' L';
    var gl=L/0.2, full=Math.floor(gl);
    $('glasses').innerHTML='<i></i>'.repeat(Math.min(full,40))+(gl-full>=0.5?'<i class="half"></i>':'');
    $('glassTxt').textContent='Yaklaşık '+fmt(Math.round(gl))+' su bardağı (200 ml)';
    waterGoal=Math.round(gl); drawWater();
    var met=parseFloat($('exAct').value), dur=Math.max(num('exDur')||0,0), exK=met*3.5*w/200*dur;
    $('exKcal').textContent=fmt(exK); $('exNote').textContent=$('exAct').options[$('exAct').selectedIndex].text+' · '+fmt(dur)+' dk · MET '+fmt(met,1);

    var lo=18.5*m*m, hi=24.9*m*m, inch=Math.max(h/2.54-60,0);
    $('ideal').textContent=fmt(lo)+'–'+fmt(hi);
    $('devine').textContent=fmt((sex==='m'?50:45.5)+2.3*inch,1)+' kg';
    $('robinson').textContent=fmt(sex==='m'?52+1.9*inch:49+1.7*inch,1)+' kg';
    $('diff').textContent= w<lo ? '+'+fmt(lo-w,1)+' kg' : w>hi ? '−'+fmt(w-hi,1)+' kg' : 'Aralıkta';

    $('plateWho').textContent=(sex==='m'?'Erkek':'Kadın')+' · '+fmt(age)+' yaş · '+fmt(h)+' cm · '+fmt(w,w%1?1:0)+' kg';
    $('sKcal').textContent=fmt(kcal); $('sPlan').textContent=F.PLANS[plan].name; $('sGoal').textContent=goalLabel;

    document.querySelectorAll('#guide article').forEach(function(a){a.classList.toggle('on',a.dataset.plan===plan);});

    var kc=$('kcalChoice').value, progKcal=kc==='auto'?kcal:parseInt(kc,10);
    $('kcalChoice').options[0].textContent='Analizime göre ('+fmt(kcal)+' kcal)';
    $('sKcal').textContent=fmt(progKcal);
    state={kcal:kcal,progKcal:progKcal,plan:plan,goal:kc==='auto'?kcal-tdee:progKcal-tdee,ratio:ratio,goalWeeks:gw,mode:goalMode,label:goalLabel,progLabel:kc==='auto'?goalLabel:''};
    if($('wChart')) drawProgress();
    try{ var o={sex:sex,goalMode:goalMode,diets:dietKeys,useBf:useBf}; FIELDS.forEach(function(k){o[k]=$(k).value;}); localStorage.setItem('fitkal-profile',JSON.stringify(o)); }catch(e){}
  }

  FIELDS.forEach(function(id){ $(id).addEventListener('input',calc); $(id).addEventListener('change',calc); });
  $('useBf').addEventListener('change',function(){ useBf=this.checked; calc(); });

  // ---------- water tracker ----------
  var waterGoal=10;
  function todayKey(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function getWater(){ try{ return parseInt(localStorage.getItem('fitkal-water-'+todayKey())||'0',10)||0; }catch(e){ return 0; } }
  function setWater(n){ try{ localStorage.setItem('fitkal-water-'+todayKey(),String(Math.max(0,n))); }catch(e){} drawWater(); }
  function drawWater(){
    var n=getWater(); $('wCount').textContent=n+' / '+waterGoal;
    $('glasses').querySelectorAll('i').forEach(function(g,i){ g.classList.toggle('drunk', i<n); });
    $('wMsg').textContent = n>=waterGoal ? 'Bugünkü su hedefine ulaştın.' : 'Kalan: '+(waterGoal-n)+' bardak';
  }
  $('wPlus').addEventListener('click',function(){ setWater(getWater()+1); });
  $('wMinus').addEventListener('click',function(){ setWater(getWater()-1); });

  // ---------- diet preferences ----------
  var dietBox=$('diets');
  dietBox.innerHTML=Object.keys(F.DIETS).map(function(k){ return '<label class="dchip"><input type="checkbox" data-diet="'+k+'"'+(dietKeys.indexOf(k)>-1?' checked':'')+'><span>'+F.DIETS[k].name+'</span></label>'; }).join('');
  dietBox.querySelectorAll('input').forEach(function(i){ i.addEventListener('change',function(){
    dietKeys=[].slice.call(dietBox.querySelectorAll('input:checked')).map(function(x){return x.dataset.diet;});
    calc(); dietCount();
  });});
  function dietCount(){
    var n={}; R.forEach(function(r){ if(F.dietOk(r,dietKeys)) n[r.category]=(n[r.category]||0)+1; });
    $('dietNote').textContent = dietKeys.length ? 'Uygun tarif: '+(n.kahvalti||0)+' kahvaltı · '+(n.ana||0)+' ana öğün · '+(n.ara||0)+' ara öğün · '+(n.tatli||0)+' tatlı' : 'Tercih seçmezsen tüm tarifler kullanılır.';
  }
  dietCount();

  // plan recipe counts
  var counts={}; R.forEach(function(r){F.plansFor(r).forEach(function(p){counts[p]=(counts[p]||0)+1;});});
  document.querySelectorAll('[data-count]').forEach(function(s){s.textContent='('+(counts[s.dataset.count]||0)+')';});

  // ---------- program generator ----------
  var DAYNAMES=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
  function buildLayout(main,snacks){
    var mains = main==='3'?[['kahvalti','Kahvaltı',.28],['ana','Öğle',.37],['ana','Akşam',.35]]
              : main==='2ka'?[['kahvalti','Kahvaltı',.45],['ana','Akşam',.55]]
              : [['ana','Öğle',.48],['ana','Akşam',.52]];
    var n=parseInt(snacks,10)||0, snackShare=.10, mainTotal=1-n*snackShare;
    mains=mains.map(function(m){return [m[0],m[1],m[2]*mainTotal];});
    // ara öğünleri ana öğünlerin arasına, sonra akşama yerleştir
    var out=[], gaps=mains.length-1, placed=0;
    mains.forEach(function(m,i){
      out.push(m);
      if(i<gaps&&placed<n){ out.push(['ara','Ara öğün',snackShare]); placed++; }
    });
    while(placed<n){ out.push(['ara','Ara öğün',snackShare]); placed++; }
    return out;
  }
  var MULTS=[0.5,0.75,1,1.25,1.5,1.75,2,2.5];
  var DESSERT_DAYS={0:[],2:[2,5],4:[1,3,5,6]};

  function pick(cat,target,plan,goal,lastUsed,dayIndex,exclude){
    var gap = cat==='ana'?4:3, best=null;
    R.forEach(function(r){
      if(r.category!==cat||exclude.indexOf(r.id)>-1||!F.dietOk(r,dietKeys)) return;
      var mults = cat==='tatli'?[0.5,1]:MULTS;
      mults.forEach(function(mu){
        var k=r.kcal*mu, score=Math.abs(k-target)/target;
        if(F.plansFor(r).indexOf(plan)<0) score+=0.35;
        if(goal<0&&!r.fit) score+=0.2;
        if(mu!==1) score+=0.03*Math.abs(mu-1);
        if(lastUsed[r.id]!=null&&dayIndex-lastUsed[r.id]<gap) score+=2;
        else if(lastUsed[r.id]!=null) score+=0.1;
        score+=Math.random()*0.12;
        if(!best||score<best.score) best={r:r,mu:mu,score:score};
      });
    });
    return best;
  }

  var program=null, curWeek=0, showGrocery=false;
  function generate(){
    calc();
    var dv=$('duration').value, weeks=dv==='goal'?(goalMode==='keep'?4:Math.min(state.goalWeeks,12)):parseInt(dv,10), layout=buildLayout($('mainMeals').value,$('snacks').value), dd=DESSERT_DAYS[$('dessert').value];
    var lastUsed={}, days=[], missing=0;
    for(var d=0; d<weeks*7; d++){
      var dow=d%7, slots=layout.map(function(s){return s.slice();});
      if(dd.indexOf(dow)>-1){
        var idx=-1; for(var i=slots.length-1;i>=0;i--){ if(slots[i][0]==='ara'){idx=i;break;} }
        if(idx>-1) slots[idx]=['tatli','Tatlı',slots[idx][2]];
        else slots.push(['tatli','Tatlı',.08]);
      }
      var targetKcal=state.progKcal; var totalShare=slots.reduce(function(a,s){return a+s[2];},0);
      var meals=[], used=[];
      slots.forEach(function(s){
        var target=targetKcal*s[2]/totalShare;
        var p=pick(s[0],target,state.plan,state.goal,lastUsed,d,used);
        if(!p){ missing++; return; }
        used.push(p.r.id); lastUsed[p.r.id]=d;
        meals.push({slot:s[1],r:p.r,mu:p.mu,t:Math.round(target)});
      });
      days.push({i:d,meals:meals});
    }
    program={weeks:weeks,days:days,kcal:state.progKcal,plan:state.plan,label:state.progLabel,diets:dietKeys.slice(),missing:missing};
    curWeek=0; showGrocery=false; render(); saveProgram();
  }
  function saveProgram(){
    try{ localStorage.setItem('fitkal-program',JSON.stringify({weeks:program.weeks,kcal:program.kcal,plan:program.plan,label:program.label,diets:program.diets,missing:program.missing,days:program.days.map(function(x){return x.meals.map(function(m){return [m.slot,m.r.id,m.mu,m.t||Math.round(m.r.kcal*m.mu)];});})})); }catch(e){}
  }

  function porsiyonTxt(mu){ return mu===1?'1 porsiyon':fmt(mu,2).replace(/,?0+$/,'')+' porsiyon'; }

  var WEEK_COLORS=['#DDF1E4','#FCEFC7','#DCEBF7','#F7DFE8','#E8E0F5','#FBE3D2'];
  function wkColor(w){return WEEK_COLORS[w%WEEK_COLORS.length];}

  function dayStats(day){
    var t={k:0,p:0,c:0,f:0,s:0}; day.meals.forEach(function(m){t.s+=(m.r.sugar||0)*m.mu;t.k+=m.r.kcal*m.mu;t.p+=m.r.protein*m.mu;t.c+=m.r.carbs*m.mu;t.f+=m.r.fat*m.mu;}); return t;
  }

  function render(){
    var out=$('progOut');
    if(!program){return;}
    var html='';
    if(program.weeks>1){
      html+='<div class="weeks" role="tablist">';
      for(var w=0;w<program.weeks;w++) html+='<button type="button" role="tab" data-w="'+w+'" style="--wk:'+wkColor(w)+'" aria-selected="'+(w===curWeek)+'">'+(w+1)+'. hafta</button>';
      html+='</div>';
    } else html+='<div style="height:18px"></div>';
    html+='<div class="days">';
    program.days.slice(curWeek*7,curWeek*7+7).forEach(function(day){
      var t=dayStats(day), rows='';
      day.meals.forEach(function(m,mi){
        rows+='<div class="meal"><span class="slot">'+m.slot+'<button type="button" class="swap" data-d="'+day.i+'" data-m="'+mi+'" title="Bu öğünü değiştir" aria-label="'+m.slot+' öğününü değiştir">↻</button></span><span class="mthumb">'+window.FitKalArt.svg(m.r)+'</span><span><a href="tarifler.html#'+m.r.id+'">'+m.r.title+'</a><span class="por">'+porsiyonTxt(m.mu)+' · porsiyon '+fmt(m.r.kcal)+' kcal'+(m.r.sugar>0?' · şeker '+fmt(m.r.sugar*m.mu)+' g':'')+'</span></span><span class="k">'+fmt(m.r.kcal*m.mu)+'</span></div>';
      });
      var diffPct=Math.round((t.k-program.kcal)/program.kcal*100);
      html+='<article class="day" style="--wk:'+wkColor(curWeek)+'"><div class="day-head"><h3>'+(program.weeks>1?(curWeek+1)+'. hafta · ':'')+DAYNAMES[day.i%7]+'</h3><span>'+fmt(t.k)+' / '+fmt(program.kcal)+' kcal</span></div>'+rows+
        '<div class="day-foot"><span>P <b>'+fmt(t.p)+' g</b></span><span>K <b>'+fmt(t.c)+' g</b></span><span>Y <b>'+fmt(t.f)+' g</b></span><span>Şeker <b>'+fmt(t.s)+' g</b></span><span>Hedeften <b>'+(diffPct>0?'+':'')+diffPct+'%</b></span></div></article>';
    });
    var label=program.weeks===1?'Haftalık':program.weeks===4?'Aylık':program.weeks+' haftalık';
    html+='</div><div class="prog-actions"><button class="btn btn-primary" type="button" id="pdfBtn">'+label+' programı PDF indir</button><button class="btn btn-ghost" type="button" id="groBtn" aria-expanded="'+showGrocery+'">'+(showGrocery?'Alışveriş listesini gizle':(program.weeks>1?(curWeek+1)+'. hafta ':'')+'Alışveriş listesi')+'</button><button class="btn btn-ghost" type="button" id="regen">Yeniden oluştur</button><a class="btn btn-ghost" href="tarifler.html">Tüm tarifler</a></div>'+
      (program.missing?'<p class="note warn-note">Seçtiğin beslenme tercihlerine uyan tarif bulunamadığı için '+program.missing+' öğün boş bırakıldı. Tercihleri azaltmayı ya da öğün düzenini değiştirmeyi dene.</p>':'')+
      (showGrocery?groceryHtml():'')+
      '<p class="note" style="margin-top:12px">PDF, programın tamamını ('+program.weeks+' hafta) içerir. Kaloriler porsiyon başına yaklaşık değerlerdir; porsiyonlar günlük hedefe yaklaşmak için ayarlanmıştır.</p>';
    out.innerHTML=html;
    out.querySelectorAll('.weeks button').forEach(function(b){b.addEventListener('click',function(){curWeek=+b.dataset.w;render();});});
    out.querySelectorAll('.swap').forEach(function(b){b.addEventListener('click',function(){ swapMeal(+b.dataset.d,+b.dataset.m); });});
    $('groBtn').addEventListener('click',function(){ showGrocery=!showGrocery; render(); if(showGrocery) $('grocery').scrollIntoView({behavior:'smooth',block:'start'}); });
    if(showGrocery) bindGrocery();
    $('regen').addEventListener('click',safeGenerate);
    $('pdfBtn').addEventListener('click',downloadPdf);
  }

  function swapMeal(di,mi){
    var day=program.days[di], m=day.meals[mi]; if(!m) return;
    var near={}; program.days.forEach(function(d2){ if(Math.abs(d2.i-di)<=3) d2.meals.forEach(function(x){ near[x.r.id]=1; }); });
    var excl=Object.keys(near); excl.push(m.r.id);
    var cat=m.r.category, target=m.t||m.r.kcal*m.mu;
    var p=pick(cat,target,program.plan,state.goal,{},di,excl)||pick(cat,target,program.plan,state.goal,{},di,day.meals.map(function(x){return x.r.id;}));
    if(!p) return;
    day.meals[mi]={slot:m.slot,r:p.r,mu:p.mu,t:target};
    render(); saveProgram();
    var el=document.querySelector('.swap[data-d="'+di+'"][data-m="'+mi+'"]'); if(el){ el.closest('.meal').classList.add('swapped'); el.focus(); }
  }

  function weekGrocery(w){
    var items=[]; program.days.slice(w*7,w*7+7).forEach(function(d){ d.meals.forEach(function(m){ items.push({r:m.r,factor:m.mu/(m.r.servings||1)}); }); });
    return F.grocery(items);
  }
  function groKey(){ return 'fitkal-grocery-'+curWeek+'-'+program.days.slice(curWeek*7,curWeek*7+7).map(function(d){return d.meals.map(function(m){return m.r.id;}).join('.');}).join('|').length+'-'+(program.days[curWeek*7]&&program.days[curWeek*7].meals[0]?program.days[curWeek*7].meals[0].r.id:''); }
  function groceryHtml(){
    var g=weekGrocery(curWeek), checked={};
    try{ checked=JSON.parse(localStorage.getItem(groKey())||'{}'); }catch(e){}
    var h='<section class="grocery" id="grocery" aria-label="Alışveriş listesi"><div class="gro-head"><h3>'+(program.weeks>1?(curWeek+1)+'. hafta ':'')+'alışveriş listesi</h3><div class="gro-actions"><button type="button" class="btn btn-ghost btn-sm" id="groCopy">Listeyi kopyala</button></div></div>'+
      '<p class="note">Programdaki porsiyonlara göre toplandı. Evde olanları işaretleyerek eleyebilirsin. Miktarlar yaklaşıktır; tuz ve baharatlar miktarsız listelenir.</p><div class="gro-cols">';
    F.CAT_ORDER.forEach(function(c){
      if(!g[c]||!g[c].length) return;
      h+='<div class="gro-cat"><h4>'+c+'</h4><ul>'+g[c].map(function(e){ var line=F.groceryLine(e), k=e.name+'|'+e.unit; return '<li><label><input type="checkbox" data-k="'+k.replace(/"/g,'')+'"'+(checked[k]?' checked':'')+'> <span>'+line+'</span></label></li>'; }).join('')+'</ul></div>';
    });
    return h+'</div></section>';
  }
  function bindGrocery(){
    var box=$('grocery');
    box.querySelectorAll('input[type=checkbox]').forEach(function(i){ i.addEventListener('change',function(){
      var c={}; box.querySelectorAll('input:checked').forEach(function(x){ c[x.dataset.k]=1; });
      try{ localStorage.setItem(groKey(),JSON.stringify(c)); }catch(e){}
    });});
    $('groCopy').addEventListener('click',function(){
      var txt=[].slice.call(box.querySelectorAll('.gro-cat')).map(function(cat){
        return cat.querySelector('h4').textContent+'\n'+[].slice.call(cat.querySelectorAll('li')).filter(function(li){return !li.querySelector('input').checked;}).map(function(li){return '- '+li.textContent.trim();}).join('\n');
      }).join('\n\n');
      var b=this, ok=function(){ b.textContent='Kopyalandı'; setTimeout(function(){ b.textContent='Listeyi kopyala'; },1800); };
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok,function(){ fallbackCopy(txt); ok(); });
      else { fallbackCopy(txt); ok(); }
    });
  }
  function fallbackCopy(t){ var ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} ta.remove(); }

  function alertBox(msg){ var n=document.querySelector('#progOut .note'); if(n) n.textContent=msg; }

  function hexRgb(hex){var n=parseInt(hex.slice(1),16);return [n>>16,n>>8&255,n&255];}
  function mixWhite(hex,t){return hexRgb(hex).map(function(c){return Math.round(c+(255-c)*t);});}
  function loadScript(src,cb,err){var sc=document.createElement('script');sc.src=src;sc.onload=cb;sc.onerror=err;document.head.appendChild(sc);}

  function downloadPdf(){
    var btn=$('pdfBtn'), old=btn.textContent; btn.disabled=true; btn.textContent='PDF hazırlanıyor…';
    function done(msg){ btn.disabled=false; btn.textContent=old; if(msg) alertBox(msg); }
    function go(){
      try{ makePdf(); done(); }catch(e){ if(window.console) console.error(e); done('PDF oluşturulamadı, tekrar dene.'); }
    }
    var need=[];
    if(!(window.jspdf&&window.jspdf.jsPDF)) need.push('vendor/jspdf.umd.min.js');
    if(!window.FITKAL_PDF_FONTS) need.push('vendor/pdf-fonts.js');
    (function next(){ if(!need.length) return go(); loadScript(need.shift(),next,function(){done('PDF aracı yüklenemedi. Bağlantını kontrol edip tekrar dene.');}); })();
  }

  function makePdf(){
    var doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    doc.addFileToVFS('fk-r.ttf',window.FITKAL_PDF_FONTS.regular); doc.addFont('fk-r.ttf','FK','normal');
    doc.addFileToVFS('fk-b.ttf',window.FITKAL_PDF_FONTS.bold); doc.addFont('fk-b.ttf','FK','bold');
    var W=297,H=210,M=10, ink=[19,35,29], muted=[86,104,95], leaf=[46,122,87];
    var planName=F.PLANS[program.plan]?F.PLANS[program.plan].name:'';
    var cols=4, gap=4, boxW=(W-2*M-gap*(cols-1))/cols;
    function txt(t,x,y,o){doc.text(String(t),x,y,o||{});}
    for(var w=0;w<program.weeks;w++){
      if(w>0) doc.addPage();
      var wc=wkColor(w), soft=mixWhite(wc,.35), strong=hexRgb(wc);
      // header
      doc.setFont('FK','bold'); doc.setFontSize(16); doc.setTextColor.apply(doc,ink); txt('Fit',M,M+6);
      doc.setTextColor.apply(doc,leaf); txt('Kal',M+doc.getTextWidth('Fit'),M+6);
      doc.setTextColor.apply(doc,ink); doc.setFontSize(12);
      txt(program.weeks+' haftalık beslenme programı',M+30,M+6);
      doc.setFont('FK','normal'); doc.setFontSize(8.5); doc.setTextColor.apply(doc,muted);
      txt('Günlük hedef: '+fmt(program.kcal)+' kcal  ·  Plan: '+planName+(program.label?'  ·  '+program.label:''),W-M,M+6,{align:'right'});
      // week bar
      doc.setFillColor.apply(doc,strong); doc.roundedRect(M,M+10,W-2*M,9,2,2,'F');
      doc.setFont('FK','bold'); doc.setFontSize(11); doc.setTextColor.apply(doc,ink); txt((w+1)+'. hafta',M+4,M+16.2);
      var days=program.days.slice(w*7,w*7+7), top=M+23, rowH=(H-top-M-6-gap)/2, wk={k:0,p:0,c:0,f:0,s:0};
      days.forEach(function(day,di){
        var t=dayStats(day); ['k','p','c','f','s'].forEach(function(k){wk[k]+=t[k];});
        var x=M+(di%cols)*(boxW+gap), y=top+Math.floor(di/cols)*(rowH+gap);
        doc.setFillColor.apply(doc,soft); doc.setDrawColor(211,223,216); doc.roundedRect(x,y,boxW,rowH,2.5,2.5,'FD');
        doc.setFont('FK','bold'); doc.setFontSize(10); doc.setTextColor.apply(doc,ink); txt(DAYNAMES[day.i%7],x+3,y+6);
        doc.setFontSize(8.5); txt(fmt(t.k)+' kcal',x+boxW-3,y+6,{align:'right'});
        var yy=y+13;
        day.meals.forEach(function(m){
          doc.setDrawColor(201,214,207); doc.setLineDashPattern([0.8,0.8],0); doc.line(x+3,yy-4.2,x+boxW-3,yy-4.2); doc.setLineDashPattern([],0);
          doc.setFont('FK','bold'); doc.setFontSize(6.5); doc.setTextColor.apply(doc,muted); txt(m.slot.toLocaleUpperCase('tr-TR'),x+3,yy);
          doc.setFontSize(8); doc.setTextColor.apply(doc,ink); txt(fmt(m.r.kcal*m.mu),x+boxW-3,yy,{align:'right'});
          doc.setFont('FK','bold'); doc.setFontSize(8);
          var lines=doc.splitTextToSize(m.r.title,boxW-6).slice(0,2);
          lines.forEach(function(l,li){txt(l,x+3,yy+3.6+li*3.4);});
          doc.setFont('FK','normal'); doc.setFontSize(6.8); doc.setTextColor.apply(doc,muted);
          txt(porsiyonTxt(m.mu)+(m.r.sugar>0?' · şeker '+fmt(m.r.sugar*m.mu)+' g':''),x+3,yy+3.6+lines.length*3.4);
          yy+=9.5+lines.length*3.4;
        });
        doc.setFont('FK','normal'); doc.setFontSize(7); doc.setTextColor.apply(doc,muted);
        txt('P '+fmt(t.p)+' g · K '+fmt(t.c)+' g · Y '+fmt(t.f)+' g · Şeker '+fmt(t.s)+' g',x+3,y+rowH-3);
      });
      // week summary box (8th cell)
      var sx=M+3*(boxW+gap), sy=top+(rowH+gap);
      doc.setFillColor.apply(doc,strong); doc.roundedRect(sx,sy,boxW,rowH,2.5,2.5,'F');
      doc.setFont('FK','bold'); doc.setFontSize(10); doc.setTextColor.apply(doc,ink); txt('Hafta özeti',sx+4,sy+8);
      doc.setFont('FK','normal'); doc.setFontSize(8.5);
      var lines2=['Ortalama günlük: '+fmt(wk.k/days.length)+' kcal','Protein: '+fmt(wk.p/days.length)+' g / gün','Karbonhidrat: '+fmt(wk.c/days.length)+' g / gün','Yağ: '+fmt(wk.f/days.length)+' g / gün','Şeker: '+fmt(wk.s/days.length)+' g / gün'];
      lines2.forEach(function(l,i){txt(l,sx+4,sy+16+i*6);});
      doc.setFontSize(7); doc.setTextColor.apply(doc,muted);
      doc.text(doc.splitTextToSize('Su içmeyi unutma. Tarifler: FitKal › Tarifler sayfası.',boxW-8),sx+4,sy+rowH-12);
      // footer
      doc.setFontSize(7); doc.setTextColor.apply(doc,muted);
      txt('Değerler porsiyon başına yaklaşıktır, tıbbi tavsiye değildir. · '+new Date().toLocaleDateString('tr-TR'),M,H-5);
      // grocery page
      doc.addPage();
      doc.setFont('FK','bold'); doc.setFontSize(16); doc.setTextColor.apply(doc,ink); txt('Fit',M,M+6);
      doc.setTextColor.apply(doc,leaf); txt('Kal',M+doc.getTextWidth('Fit'),M+6);
      doc.setFillColor.apply(doc,strong); doc.roundedRect(M,M+10,W-2*M,9,2,2,'F');
      doc.setFont('FK','bold'); doc.setFontSize(11); doc.setTextColor.apply(doc,ink); txt((w+1)+'. hafta alışveriş listesi',M+4,M+16.2);
      var g=weekGrocery(w), gc=4, gw=(W-2*M-gap*(gc-1))/gc, top0=M+28, bottom=H-M-8, col=0, gy=top0, seq=[];
      F.CAT_ORDER.forEach(function(c){ if(g[c]&&g[c].length){ seq.push({h:c}); g[c].forEach(function(e){ seq.push({t:F.groceryLine(e)}); }); } });
      seq.forEach(function(it,ix){
        var need = it.h ? 11 : 4.4;
        if(it.h && gy!==top0 && gy+need+4.4>bottom){ col++; gy=top0; }
        if(!it.h && gy+need>bottom){ col++; gy=top0; }
        if(col>=gc){
          doc.setFont('FK','normal'); doc.setFontSize(7); doc.setTextColor.apply(doc,muted);
          txt('Liste sonraki sayfada devam ediyor.',M,H-5);
          doc.addPage(); col=0; gy=top0;
          doc.setFillColor.apply(doc,strong); doc.roundedRect(M,M+10,W-2*M,9,2,2,'F');
          doc.setFont('FK','bold'); doc.setFontSize(11); doc.setTextColor.apply(doc,ink); txt((w+1)+'. hafta alışveriş listesi (devam)',M+4,M+16.2);
        }
        var gx=M+col*(gw+gap);
        if(it.h){ if(gy!==top0) gy+=3; doc.setFont('FK','bold'); doc.setFontSize(9.5); doc.setTextColor.apply(doc,leaf); txt(it.h,gx,gy); gy+=5.5; }
        else { doc.setFont('FK','normal'); doc.setFontSize(8); doc.setTextColor.apply(doc,ink); doc.setDrawColor(150,165,158); doc.rect(gx,gy-2.6,2.8,2.8); txt(doc.splitTextToSize(it.t,gw-6)[0],gx+4.5,gy); gy+=4.4; }
      });
      doc.setFont('FK','normal'); doc.setFontSize(7); doc.setTextColor.apply(doc,muted);
      txt('Miktarlar programdaki porsiyonlara göre yaklaşık hesaplanmıştır.',M,H-5);
    }
    var total=doc.getNumberOfPages();
    for(var pg=1; pg<=total; pg++){ doc.setPage(pg); doc.setFont('FK','normal'); doc.setFontSize(7); doc.setTextColor.apply(doc,muted); txt('Sayfa '+pg+' / '+total,W-M,H-5,{align:'right'}); }
    var name='fitkal-program-'+program.weeks+'-hafta-'+program.kcal+'kcal.pdf';
    var blob=doc.output('blob'), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},4000);
  }

  function safeGenerate(){
    try{ generate(); }
    catch(e){
      if(window.console) console.error(e);
      $('progOut').innerHTML='<div class="empty" style="margin-top:18px">Program oluşturulamadı. Sayfayı <b>Cmd + Shift + R</b> ile yenileyip tekrar dene.</div>';
    }
  }
  $('genBtn').addEventListener('click',safeGenerate);
  $('duration').addEventListener('change',function(){});
  $('toProgram').addEventListener('click',function(e){ e.preventDefault(); safeGenerate(); $('program').scrollIntoView({behavior:'smooth'}); });

  // ---------- weight progress ----------
  function getW(){ try{ return JSON.parse(localStorage.getItem('fitkal-weights')||'[]'); }catch(e){ return []; } }
  function setW(a){ try{ localStorage.setItem('fitkal-weights',JSON.stringify(a)); }catch(e){} drawProgress(); }
  $('wDate').value=todayKey();
  $('wAdd').addEventListener('click',function(){
    var d=$('wDate').value, v=parseFloat(String($('wVal').value).replace(',','.'));
    if(!d||!(v>20&&v<400)){ $('wErr').textContent='Tarih ve 20–400 kg arasında bir kilo gir.'; return; }
    $('wErr').textContent='';
    var a=getW().filter(function(x){return x.d!==d;}); a.push({d:d,w:Math.round(v*10)/10}); a.sort(function(x,y){return x.d<y.d?-1:1;});
    setW(a); $('wVal').value='';
    if(d===todayKey()){ $('weight').value=Math.round(v*10)/10; calc(); }
  });
  function drawProgress(){
    var a=getW(), box=$('wChart'), list=$('wList');
    if(!a.length){ box.innerHTML='<div class="empty">Henüz kayıt yok. İlk tartı sonucunu ekleyerek başla.</div>'; list.innerHTML=''; $('wStats').innerHTML=''; return; }
    var goalW = goalMode!=='keep' ? num('targetW') : null;
    var vals=a.map(function(x){return x.w;}); if(goalW) vals.push(goalW);
    var mn=Math.floor(Math.min.apply(null,vals)-1), mx=Math.ceil(Math.max.apply(null,vals)+1);
    var W=640,H=220,pl=40,pr=14,pt=14,pb=28, n=a.length;
    var X=function(i){return n===1?pl+(W-pl-pr)/2:pl+i*(W-pl-pr)/(n-1);}, Y=function(v){return pt+(mx-v)/(mx-mn)*(H-pt-pb);};
    var svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Kilo değişim grafiği">';
    var step=Math.max(1,Math.round((mx-mn)/4));
    for(var v=mn; v<=mx; v+=step){ svg+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" class="grid"/><text x="'+(pl-6)+'" y="'+(Y(v)+4)+'" class="axis" text-anchor="end">'+v+'</text>'; }
    if(goalW){ svg+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(goalW)+'" y2="'+Y(goalW)+'" class="goal"/><text x="'+(W-pr)+'" y="'+(Y(goalW)-5)+'" class="axis goalt" text-anchor="end">Hedef '+fmt(goalW,1)+' kg</text>'; }
    var path=a.map(function(x,i){return (i?'L':'M')+X(i).toFixed(1)+' '+Y(x.w).toFixed(1);}).join(' ');
    if(n>1) svg+='<path d="'+path+' L'+X(n-1).toFixed(1)+' '+(H-pb)+' L'+X(0).toFixed(1)+' '+(H-pb)+' Z" class="area"/><path d="'+path+'" class="line"/>';
    a.forEach(function(x,i){ svg+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(x.w).toFixed(1)+'" r="'+(i===n-1?5:3.5)+'" class="pt'+(i===n-1?' last':'')+'"/>'; });
    var lab=function(i){ var p=a[i].d.split('-'); return p[2]+'.'+p[1]; };
    svg+='<text x="'+X(0)+'" y="'+(H-8)+'" class="axis" text-anchor="'+(n===1?'middle':'start')+'">'+lab(0)+'</text>';
    if(n>1) svg+='<text x="'+X(n-1)+'" y="'+(H-8)+'" class="axis" text-anchor="end">'+lab(n-1)+'</text>';
    box.innerHTML=svg+'</svg>';
    var first=a[0].w, last=a[n-1].w, ch=last-first;
    var st='<div><span>Başlangıç</span><strong>'+fmt(first,1)+' kg</strong></div><div><span>Son ölçüm</span><strong>'+fmt(last,1)+' kg</strong></div><div><span>Değişim</span><strong>'+(ch>0?'+':ch<0?'−':'')+fmt(Math.abs(ch),1)+' kg</strong></div>';
    if(goalW) st+='<div><span>Hedefe kalan</span><strong>'+fmt(Math.abs(last-goalW),1)+' kg</strong></div>';
    $('wStats').innerHTML=st;
    list.innerHTML=a.slice().reverse().map(function(x){ var p=x.d.split('-'); return '<li><span>'+p[2]+'.'+p[1]+'.'+p[0]+'</span><b>'+fmt(x.w,1)+' kg</b><button type="button" class="linkbtn" data-del="'+x.d+'" aria-label="'+p[2]+'.'+p[1]+'.'+p[0]+' kaydını sil">Sil</button></li>'; }).join('');
    list.querySelectorAll('[data-del]').forEach(function(b){ b.addEventListener('click',function(){ setW(getW().filter(function(x){return x.d!==b.dataset.del;})); }); });
  }

  calc();
  drawProgress();
  // restore last program
  try{
    var sp=JSON.parse(localStorage.getItem('fitkal-program')||'null');
    if(sp&&sp.days){
      var byId={}; R.forEach(function(r){byId[r.id]=r;});
      program={weeks:sp.weeks,kcal:sp.kcal,plan:sp.plan,label:sp.label,diets:sp.diets||[],missing:sp.missing||0,days:sp.days.map(function(ms,i){return {i:i,meals:ms.filter(function(m){return byId[m[1]];}).map(function(m){return {slot:m[0],r:byId[m[1]],mu:m[2],t:m[3]};})};})};
      render();
    }
  }catch(e){}
})();
