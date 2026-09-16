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

/* ---------- v4: diyet tercihleri, malzeme ayrıştırma, alışveriş listesi ---------- */
(function(){
  var F=window.FitKal;
  var low=function(s){return String(s).toLocaleLowerCase('tr-TR');};
  var DIETS={
    vejetaryen:{name:'Vejetaryen', bad:/tavuk|hindi(?!stan)|dana|kıyma|köfte harcı|bonfile|sucuk|pastırma|salam|sosis|jambon|kuşbaşı|kuzu|\beti\b|et suyu|kemik suyu|somon|levrek|balık|ton balığı|karides|midye|hamsi|uskumru|çipura|ançüez/},
    glutensiz:{name:'Glutensiz', bad:/\bun\b|\bunu\b|ekmek|bulgur|makarna|spagetti|erişte|lavaş|tortilla|milföy|yufka|şehriye|irmik|galeta|pide|buğday|arpa|tarhana|kuskus|granola|yulaf|bisküvi|simit|hamur|mantı|noodle|kraker|kepek|çavdar/},
    laktozsuz:{name:'Laktozsuz', bad:/\bsüt\b|sütü|yoğurt|peynir|\blor\b|kefir|tereyağ|krema|kaymak|labne|beşamel|parmesan|mozzarella|kaşar|süzme|ayran|cacık/},
    yumurtasiz:{name:'Yumurtasız', bad:/yumurta/},
    kuruyemissiz:{name:'Kuruyemişsiz', bad:/fındık|fıstık|ceviz|badem|kaju|antep|pekan|kuruyemiş/},
    denizsiz:{name:'Deniz ürünsüz', bad:/somon|levrek|balık|ton balığı|karides|midye|hamsi|uskumru|çipura|ançüez|kalamar/}
  };
  function dietOk(r,keys){
    if(!keys||!keys.length) return true;
    if(!r._ing) r._ing=low(r.title+' | '+r.ingredients.join(' | '));
    for(var i=0;i<keys.length;i++){ var d=DIETS[keys[i]]; if(d&&d.bad.test(r._ing)) return false; }
    return true;
  }
  function dietsFor(r){ return Object.keys(DIETS).filter(function(k){return dietOk(r,[k]);}); }

  var UNIT='g|gr|kg|ml|litre|lt|l|adet|yemek kaşığı|tatlı kaşığı|çay kaşığı|su bardağı|çay bardağı|kahve fincanı|dilim|diş|demet|avuç|tutam|dal|sap|kase|paket|kutu|yaprak|damla|top|parça';
  var RE=new RegExp('^(\\d+\\s*\\/\\s*\\d+|\\d+(?:[.,]\\d+)?(?:\\s*-\\s*\\d+(?:[.,]\\d+)?)?|yarım|çeyrek|bir)\\s+(?:('+UNIT+')\\s+)?(.+)$','i');
  function num(t){
    t=low(t).trim();
    if(t==='yarım') return [0.5]; if(t==='çeyrek') return [0.25]; if(t==='bir') return [1];
    if(t.indexOf('/')>-1){ var p=t.split('/'); return [parseFloat(p[0])/parseFloat(p[1])]; }
    return t.split('-').map(function(x){return parseFloat(x.replace(',','.'));});
  }
  function parse(line){
    var m=String(line).match(RE);
    if(!m) return {raw:line, q:null};
    return {raw:line, q:num(m[1]), unit:m[2]?low(m[2]):'', name:m[3]};
  }
  function fq(v,unit){
    var r;
    if(/^(g|gr|ml)$/.test(unit)) r = v>=20?Math.round(v/5)*5:Math.round(v);
    else if(/^(kg|litre|lt|l)$/.test(unit)) r=Math.round(v*100)/100;
    else r=Math.round(v*4)/4;
    if(r===0) r=/^(g|gr|ml)$/.test(unit)?1:0.25;
    return r%1 ? F.fmt(r,2).replace(/0+$/,'').replace(/,$/,'') : F.fmt(r,0);
  }
  function scale(line,factor){
    var p=parse(line);
    if(!p.q||factor===1) return line;
    return p.q.map(function(v){return fq(v*factor,p.unit);}).join('-')+' '+(p.unit?p.unit+' ':'')+p.name;
  }

  var CATS=[
    ['Et, tavuk ve balık',/tavuk|hindi(?!stan)|dana|kıyma|bonfile|sucuk|kuşbaşı|kuzu|somon|levrek|balık|ton balığı|karides|pastırma/],
    ['Süt ürünleri ve yumurta',/\bsüt\b|sütü|yoğurt|peynir|\blor\b|kefir|tereyağ|krema|labne|kaşar|süzme|yumurta|parmesan|mozzarella/],
    ['Yağ, sos ve baharat',/yağı|sıvı yağ|yağ$|salça|sirke|soya sosu|hardal|\bbal\b|pekmez|\btuz\b|karabiber|pul biber|\bisot\b|kimyon|kekik|tarçın|sumak|baharat|vanilya|kakao|maya|kabartma|nişasta|stevia|akçaağaç|zerdeçal|köri|kırmızı toz biber|toz biber|muskat|biberiye|defne|karanfil|garam|paprika|kişniş tohumu|susam yağı|şeker|tuzu|pekmez/],
    ['Sebze ve meyve',/domates|biber|soğan|sarımsak|patlıcan|kabak|havuç|patates|ıspanak|brokoli|karnabahar|marul|roka|salatalık|limon|elma|muz|çilek|avokado|maydanoz|dereotu|nane|mantar|pancar|kereviz|taze fasulye|bezelye|mısır|lahana|portakal|meyve|zencefil|kişniş|fesleğen|turp|\bnar\b|kivi|armut|üzüm|yaban mersini|frambuaz|ahududu|böğürtlen|pırasa|enginar|bamya|yeşillik|taze soğan|dereotu|hindistan cevizi/],
    ['Bakliyat, tahıl ve ekmek',/mercimek|nohut|kuru fasulye|barbunya|bulgur|pirinç|kinoa|yulaf|makarna|spagetti|erişte|lavaş|tortilla|ekmek|\bun\b|\bunu\b|şehriye|milföy|yufka|granola|edamame|tarhana|irmik|galeta|noodle|pide|lazanya|tam buğday|pirinci/],
    ['Kuruyemiş, tohum ve kuru meyve',/fındık|fıstık|ceviz|badem|kaju|chia|keten|susam|tahin|hurma|kuru üzüm|kuru kayısı|çekirdek|kuruyemiş/]
  ];
  function catOf(name){ var n=low(name); for(var i=0;i<CATS.length;i++) if(CATS[i][1].test(n)) return CATS[i][0]; return 'Diğer'; }
  function cleanName(n){
    n=low(n).replace(/\(.*?\)/g,'').split(',')[0];
    n=n.replace(/\b(orta boy|orta|küçük|büyük|olgun|taze|iri|ince|doğranmış|rendelenmiş|kıyılmış|dilimlenmiş|soyulmuş|çekirdeksiz|yaklaşık)\b/g,' ');
    return n.replace(/\s+/g,' ').trim();
  }
  // items: [{r, factor}] -> {cat: [{name, unit, q:[..] or null}]}
  function grocery(items){
    var map={}, extras={};
    items.forEach(function(it){
      it.r.ingredients.forEach(function(line){
        var p=parse(line);
        if(!p.q){
          low(line).replace(/^servis için\s*/,'').split(/,|\bveya\b/).forEach(function(x){x=x.trim(); if(x) extras[x]=1;});
          return;
        }
        var name=cleanName(p.name), key=name+'|'+p.unit;
        if(/^(sıcak |soğuk |ılık )?su$/.test(name)) return;
        if(!map[key]) map[key]={name:name, unit:p.unit, q:[0,0], cat:catOf(name)};
        var lo=p.q[0]*it.factor, hi=(p.q[1]!=null?p.q[1]:p.q[0])*it.factor;
        map[key].q[0]+=lo; map[key].q[1]+=hi;
      });
    });
    var out={};
    Object.keys(map).forEach(function(k){ var e=map[k]; (out[e.cat]=out[e.cat]||[]).push(e); });
    Object.keys(extras).forEach(function(x){ var c=catOf(x); (out[c]=out[c]||[]); if(!out[c].some(function(e){return e.name===x;})) out[c].push({name:x,unit:'',q:null,cat:c}); });
    Object.keys(out).forEach(function(c){ out[c].sort(function(a,b){return a.name.localeCompare(b.name,'tr');}); });
    return out;
  }
  function buy(v,unit){
    if(/^(g|gr|ml)$/.test(unit)) return v<50?Math.ceil(v/10)*10:Math.ceil(v/50)*50;
    if(/^(adet|diş|demet|dilim|avuç|dal|sap|paket|kutu|top|parça|yaprak)$/.test(unit)||unit==='') return Math.max(1,Math.ceil(v-0.15));
    return Math.ceil(v*2)/2;
  }
  function groceryLine(e){
    if(!e.q) return e.name;
    var a=fq(buy(e.q[0],e.unit),e.unit), b=fq(buy(e.q[1],e.unit),e.unit);
    return (a===b?a:a+'-'+b)+' '+(e.unit?e.unit+' ':'')+e.name;
  }
  var CAT_ORDER=['Sebze ve meyve','Et, tavuk ve balık','Süt ürünleri ve yumurta','Bakliyat, tahıl ve ekmek','Kuruyemiş, tohum ve kuru meyve','Yağ, sos ve baharat','Diğer'];

  F.DIETS=DIETS; F.dietOk=dietOk; F.dietsFor=dietsFor; F.parseIng=parse; F.scaleIng=scale;
  F.grocery=grocery; F.groceryLine=groceryLine; F.CAT_ORDER=CAT_ORDER;
  F.slug=function(s){return low(s).replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/â/g,'a').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');};
})();
