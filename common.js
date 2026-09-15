(function(){
  // theme toggle
  var btn=document.getElementById('themeBtn');
  if(btn) btn.addEventListener('click',function(){
    var r=document.documentElement;
    var cur=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    r.dataset.theme=cur==='dark'?'light':'dark';
    try{localStorage.setItem('fitkal-theme',r.dataset.theme);}catch(e){}
  });
  try{var t=localStorage.getItem('fitkal-theme'); if(t) document.documentElement.dataset.theme=t;}catch(e){}

  var PLANS={
    dengeli:{name:'Dengeli',ratio:[30,40,30]},
    'dusuk-karb':{name:'Düşük karbonhidrat',ratio:[35,25,40]},
    'yuksek-karb':{name:'Yüksek karbonhidrat',ratio:[25,55,20]},
    'yuksek-protein':{name:'Yüksek protein',ratio:[40,35,25]}
  };
  var CATS={kahvalti:'Kahvaltı',ana:'Ana öğün',ara:'Ara öğün',tatli:'Tatlı'};

  function shares(r){
    var tot=4*r.protein+4*r.carbs+9*r.fat||1;
    return {p:4*r.protein/tot,c:4*r.carbs/tot,f:9*r.fat/tot};
  }
  // which macro plans a recipe suits
  function plansFor(r){
    var s=shares(r), out=[];
    if(s.c>=0.28&&s.c<=0.55&&s.f<=0.40&&s.p>=0.15) out.push('dengeli');
    if(s.c<=0.30) out.push('dusuk-karb');
    if(s.c>=0.45&&s.f<=0.35) out.push('yuksek-karb');
    if(s.p>=0.30) out.push('yuksek-protein');
    return out;
  }
  var fmt=function(n,d){return Number(n).toLocaleString('tr-TR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});};
  window.FitKal={PLANS:PLANS,CATS:CATS,plansFor:plansFor,shares:shares,fmt:fmt};
})();
