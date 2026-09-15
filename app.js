(function(){
  var F=window.FitKal, R=window.FITKAL_RECIPES||[], fmt=F.fmt;
  var $=function(id){return document.getElementById(id);};
  var sex='f';
  var state={};
  var goalTxt={'-500':'Kilo verme','0':'Kilo koruma','300':'Kilo alma'};
  var FIELDS=['age','height','weight','activity','goal','plan','exMin','neck','waist','hip'];

  // restore saved profile
  try{
    var saved=JSON.parse(localStorage.getItem('fitkal-profile')||'null');
    if(saved){ FIELDS.forEach(function(k){ if(saved[k]!=null&&$(k)) $(k).value=saved[k]; }); if(saved.sex) sex=saved.sex; }
  }catch(e){}

  function setSex(s){
    sex=s;
    document.querySelectorAll('.seg button').forEach(function(x){x.setAttribute('aria-pressed', x.dataset.sex===s);});
    $('hipLbl').hidden = s==='m';
  }
  document.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){setSex(b.dataset.sex);calc();});});
  setSex(sex);

  var num=function(id){return parseFloat($(id).value);};
  function chip(el,txt,cls){el.textContent=txt;el.className='chip '+cls;}

  function calc(){
    var age=num('age'),h=num('height'),w=num('weight'),act=num('activity'),goal=num('goal'),plan=$('plan').value;
    if(!(age>0&&h>0&&w>0)) return;
    var m=h/100;

    var bmi=w/(m*m);
    $('bmi').textContent=fmt(bmi,1);
    if(bmi<18.5) chip($('bmiChip'),'Zayıf','warn');
    else if(bmi<25) chip($('bmiChip'),'Normal','ok');
    else if(bmi<30) chip($('bmiChip'),'Fazla kilolu','warn');
    else chip($('bmiChip'),'Obez','bad');
    var stops=[[15,0],[18.5,17],[25,45],[30,70],[40,100]], pos=100, b=Math.min(Math.max(bmi,15),40);
    for(var i=1;i<stops.length;i++){ if(b<=stops[i][0]){ pos=stops[i-1][1]+(b-stops[i-1][0])/(stops[i][0]-stops[i-1][0])*(stops[i][1]-stops[i-1][1]); break; } }
    $('bmiMark').style.left='calc('+pos+'% - 2px)';

    var bmr=10*w+6.25*h-5*age+(sex==='m'?5:-161), tdee=bmr*act;
    var kcal=Math.round(Math.max(tdee+goal, sex==='m'?1500:1200));
    $('bmr').textContent=fmt(bmr)+' kcal'; $('tdee').textContent=fmt(tdee)+' kcal';
    $('delta').textContent=(kcal-tdee>0?'+':'')+fmt(kcal-tdee)+' kcal';
    $('kcal').textContent=fmt(kcal); $('pKcal').textContent=fmt(kcal);
    $('pGoal').textContent=goalTxt[String(goal)];

    var ratio=F.PLANS[plan].ratio, P=kcal*ratio[0]/400, C=kcal*ratio[1]/400, Fa=kcal*ratio[2]/900;
    $('mP').textContent=fmt(P)+' g'; $('mC').textContent=fmt(C)+' g'; $('mF').textContent=fmt(Fa)+' g';
    $('pP').textContent=fmt(P)+' g'; $('pC').textContent=fmt(C)+' g'; $('pF').textContent=fmt(Fa)+' g';
    $('bP').style.width=ratio[0]+'%'; $('bC').style.width=ratio[1]+'%'; $('bF').style.width=ratio[2]+'%';
    $('planSub').textContent=F.PLANS[plan].name+' plan'; $('pPlan').textContent=F.PLANS[plan].name;

    var ex=Math.max(num('exMin')||0,0), L=(w*33+ex/30*350)/1000;
    $('water').textContent=fmt(L,1); $('pW').textContent=fmt(L,1)+' L';
    var gl=L/0.2, full=Math.floor(gl);
    $('glasses').innerHTML='<i></i>'.repeat(Math.min(full,40))+(gl-full>=0.5?'<i class="half"></i>':'');
    $('glassTxt').textContent='Yaklaşık '+fmt(Math.round(gl))+' su bardağı (200 ml)';

    var lo=18.5*m*m, hi=24.9*m*m, inch=Math.max(h/2.54-60,0);
    $('ideal').textContent=fmt(lo)+'–'+fmt(hi);
    $('devine').textContent=fmt((sex==='m'?50:45.5)+2.3*inch,1)+' kg';
    $('robinson').textContent=fmt(sex==='m'?52+1.9*inch:49+1.7*inch,1)+' kg';
    $('diff').textContent= w<lo ? '+'+fmt(lo-w,1)+' kg' : w>hi ? '−'+fmt(w-hi,1)+' kg' : 'Aralıkta';

    var neck=num('neck'),waist=num('waist'),hip=num('hip'),bf=NaN;
    if(sex==='m'&&waist>neck) bf=495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(h))-450;
    if(sex==='f'&&waist+hip>neck) bf=495/(1.29579-0.35004*Math.log10(waist+hip-neck)+0.22100*Math.log10(h))-450;
    if(isFinite(bf)&&bf>2&&bf<70){
      $('fat').textContent=fmt(bf,1);
      var t=sex==='m'?[6,18,25]:[14,25,32];
      if(bf<t[0]) chip($('fatChip'),'Çok düşük','warn'); else if(bf<t[1]) chip($('fatChip'),'Fit','ok'); else if(bf<t[2]) chip($('fatChip'),'Ortalama','warn'); else chip($('fatChip'),'Yüksek','bad');
    } else { $('fat').textContent='—'; chip($('fatChip'),'Ölçüleri kontrol et',''); }

    $('plateWho').textContent=(sex==='m'?'Erkek':'Kadın')+' · '+fmt(age)+' yaş · '+fmt(h)+' cm · '+fmt(w,w%1?1:0)+' kg';
    $('sKcal').textContent=fmt(kcal); $('sPlan').textContent=F.PLANS[plan].name; $('sGoal').textContent=goalTxt[String(goal)];

    document.querySelectorAll('#guide article').forEach(function(a){a.classList.toggle('on',a.dataset.plan===plan);});

    state={kcal:kcal,plan:plan,goal:goal,ratio:ratio};
    try{ var o={sex:sex}; FIELDS.forEach(function(k){o[k]=$(k).value;}); localStorage.setItem('fitkal-profile',JSON.stringify(o)); }catch(e){}
  }

  FIELDS.forEach(function(id){ $(id).addEventListener('input',calc); $(id).addEventListener('change',calc); });

  // plan recipe counts
  var counts={}; R.forEach(function(r){F.plansFor(r).forEach(function(p){counts[p]=(counts[p]||0)+1;});});
  document.querySelectorAll('[data-count]').forEach(function(s){s.textContent='('+(counts[s.dataset.count]||0)+')';});

  // ---------- program generator ----------
  var DAYNAMES=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
  var LAYOUTS={
    5:[['kahvalti','Kahvaltı',.25],['ara','Ara öğün',.10],['ana','Öğle',.30],['ara','Ara öğün',.10],['ana','Akşam',.25]],
    4:[['kahvalti','Kahvaltı',.27],['ana','Öğle',.33],['ara','Ara öğün',.12],['ana','Akşam',.28]],
    3:[['kahvalti','Kahvaltı',.30],['ana','Öğle',.35],['ana','Akşam',.35]]
  };
  var MULTS=[0.5,0.75,1,1.25,1.5,1.75,2];
  var DESSERT_DAYS={0:[],2:[2,5],4:[1,3,5,6]};

  function pick(cat,target,plan,goal,lastUsed,dayIndex,exclude){
    var gap = cat==='ana'?4:3, best=null;
    R.forEach(function(r){
      if(r.category!==cat||exclude.indexOf(r.id)>-1) return;
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

  var program=null, curWeek=0;
  function generate(){
    calc();
    var weeks=parseInt($('duration').value,10), layout=LAYOUTS[$('meals').value], dd=DESSERT_DAYS[$('dessert').value];
    var lastUsed={}, days=[];
    for(var d=0; d<weeks*7; d++){
      var dow=d%7, slots=layout.map(function(s){return s.slice();});
      if(dd.indexOf(dow)>-1){
        var idx=-1; for(var i=slots.length-1;i>=0;i--){ if(slots[i][0]==='ara'){idx=i;break;} }
        if(idx>-1) slots[idx]=['tatli','Tatlı',slots[idx][2]];
        else slots.push(['tatli','Tatlı',.08]);
      }
      var totalShare=slots.reduce(function(a,s){return a+s[2];},0);
      var meals=[], used=[];
      slots.forEach(function(s){
        var target=state.kcal*s[2]/totalShare;
        var p=pick(s[0],target,state.plan,state.goal,lastUsed,d,used);
        if(!p) return;
        used.push(p.r.id); lastUsed[p.r.id]=d;
        meals.push({slot:s[1],r:p.r,mu:p.mu});
      });
      days.push({i:d,meals:meals});
    }
    program={weeks:weeks,days:days,kcal:state.kcal,plan:state.plan};
    curWeek=0; render();
    try{ localStorage.setItem('fitkal-program',JSON.stringify({weeks:weeks,kcal:state.kcal,plan:state.plan,days:days.map(function(x){return x.meals.map(function(m){return [m.slot,m.r.id,m.mu];});})})); }catch(e){}
  }

  function porsiyonTxt(mu){ return mu===1?'1 porsiyon':fmt(mu,2).replace(/,?0+$/,'')+' porsiyon'; }

  function render(){
    var out=$('progOut');
    if(!program){return;}
    var html='';
    if(program.weeks>1){
      html+='<div class="weeks" role="tablist">';
      for(var w=0;w<program.weeks;w++) html+='<button type="button" role="tab" data-w="'+w+'" aria-selected="'+(w===curWeek)+'">'+(w+1)+'. hafta</button>';
      html+='</div>';
    } else html+='<div style="height:18px"></div>';
    html+='<div class="days">';
    program.days.slice(curWeek*7,curWeek*7+7).forEach(function(day){
      var k=0,p=0,c=0,f=0, rows='';
      day.meals.forEach(function(m){
        var mk=m.r.kcal*m.mu; k+=mk; p+=m.r.protein*m.mu; c+=m.r.carbs*m.mu; f+=m.r.fat*m.mu;
        rows+='<div class="meal"><span class="slot">'+m.slot+'</span><span><a href="tarifler.html#'+m.r.id+'">'+m.r.title+'</a><span class="por">'+porsiyonTxt(m.mu)+' · porsiyon '+fmt(m.r.kcal)+' kcal</span></span><span class="k">'+fmt(mk)+'</span></div>';
      });
      var diffPct=Math.round((k-program.kcal)/program.kcal*100);
      html+='<article class="day"><div class="day-head"><h3>'+(program.weeks>1?(curWeek+1)+'. hafta · ':'')+DAYNAMES[day.i%7]+'</h3><span>'+fmt(k)+' / '+fmt(program.kcal)+' kcal</span></div>'+rows+
        '<div class="day-foot"><span>P <b>'+fmt(p)+' g</b></span><span>K <b>'+fmt(c)+' g</b></span><span>Y <b>'+fmt(f)+' g</b></span><span>Hedeften <b>'+(diffPct>0?'+':'')+diffPct+'%</b></span></div></article>';
    });
    html+='</div><div class="prog-actions"><button class="btn btn-primary" type="button" id="regen">Yeniden oluştur</button><button class="btn btn-ghost" type="button" id="printBtn">Yazdır / PDF kaydet</button><a class="btn btn-ghost" href="tarifler.html">Tüm tarifler</a></div>'+
      '<p class="note" style="margin-top:12px">Kaloriler porsiyon başına yaklaşık değerlerdir. Porsiyon miktarları günlük hedefe yaklaşmak için ayarlanmıştır.</p>';
    out.innerHTML=html;
    out.querySelectorAll('.weeks button').forEach(function(b){b.addEventListener('click',function(){curWeek=+b.dataset.w;render();});});
    $('regen').addEventListener('click',generate);
    $('printBtn').addEventListener('click',function(){window.print();});
  }

  $('genBtn').addEventListener('click',generate);
  $('toProgram').addEventListener('click',function(e){ e.preventDefault(); generate(); $('program').scrollIntoView({behavior:'smooth'}); });

  calc();
  // restore last program
  try{
    var sp=JSON.parse(localStorage.getItem('fitkal-program')||'null');
    if(sp&&sp.days){
      var byId={}; R.forEach(function(r){byId[r.id]=r;});
      program={weeks:sp.weeks,kcal:sp.kcal,plan:sp.plan,days:sp.days.map(function(ms,i){return {i:i,meals:ms.filter(function(m){return byId[m[1]];}).map(function(m){return {slot:m[0],r:byId[m[1]],mu:m[2]};})};})};
      render();
    }
  }catch(e){}
})();
