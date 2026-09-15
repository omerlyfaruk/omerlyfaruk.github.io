/* FitKal – özgün, kod ile üretilen tarif kapak görselleri.
   Bir tarifte r.img (ör. "img/ana-01.jpg") tanımlıysa gerçek fotoğraf kullanılır. */
(function(){
  function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  var low=function(s){return String(s).toLocaleLowerCase('tr-TR');};

  var BG={ana:['#DCEFE3','#C3E2CF'],kahvalti:['#FBEBC9','#F6DDA6'],ara:['#DCEAF4','#C6DCEC'],tatli:['#F6DDE6','#EDC6D4']};

  // malzeme anahtar kelimesi -> renk(ler)
  var FOOD=[
    [/somon/, ['#F08A5D','#F4A57D']],
    [/levrek|balık|ton balı/, ['#C9CFD4','#E2E6EA']],
    [/karides/, ['#F29A76','#F6B596']],
    [/tavuk|hindi/, ['#E3B27A','#D39A5E']],
    [/dana|kıyma|köfte|bonfile|kuşbaşı|sucuk|kuzu/, ['#8A4B35','#A45D41']],
    [/patlıcan/, ['#5B3A63','#7A4E82']],
    [/yumurta|omlet|menemen|çılbır/, ['#F7C948','#FFF4D6']],
    [/mercimek|ezogelin|havuç|tatlı patates|balkabağı|kabak tatlı/, ['#E98A3C','#F2A65A']],
    [/kakao|çikolata|hurma|brownie/, ['#6B4331','#8A5A43']],
    [/çilek|orman meyve|ahududu|vişne/, ['#D6415A','#E9677C']],
    [/avokado|guacamole/, ['#8DB35A','#C9D77A']],
    [/ıspanak|brokoli|kabak|salatalık|marul|roka|bezelye|edamame|taze fasulye|yeşil/, ['#5E9E4B','#7DB861']],
    [/nohut|humus|falafel|bulgur|kinoa|pirinç|risotto|yulaf|granola|makarna|spagetti|erişte|mantı|lavaş|ekmek|tost|dürüm|pankek|milföy|börek|gözleme|fasulye/, ['#E6C891','#D8B474']],
    [/patates|mısır/, ['#F2D27A','#E8BF55']],
    [/mantar/, ['#B59A7E','#CDB79E']],
    [/muz/, ['#F4D35E','#F8E08E']],
    [/yoğurt|lor|peynir|cacık|süt|sütlaç|krema|beşamel/, ['#FAF6EC','#EFE8D6']],
    [/elma|armut/, ['#E9C46A','#D8573C']],
    [/ceviz|fındık|badem|fıstık|kuruyemiş/, ['#B5835A','#C99A6E']],
    [/pancar|nar/, ['#9B2D4A','#B8456A']],
    [/domates|salça|ezme|kırmızı biber/, ['#D9483B','#E8664F']],
    [/limon/, ['#F5E050','#FFF0A0']]
  ];


  function type(r){
    var t=low(r.title);
    if(/smoothie|shake/.test(t)) return 'glass';
    if(/çorba|ezogelin|tarhana|minestrone/.test(t)) return 'soup';
    if(/pizza|lahmacun/.test(t)) return 'pizza';
    if(/mantı/.test(t)) return 'manti';
    if(/karnıyarık|imam bayıldı|hünkar/.test(t)) return 'eggplant';
    if(/dolma/.test(t)) return 'dolma';
    if(/köfte/.test(t)&&!/mercimek/.test(t)) return 'meatballs';
    if(/mercimek köfte|falafel/.test(t)) return 'meatballs';
    if(/şiş/.test(t)) return 'skewer';
    if(/menemen|çılbır|sucuklu yumurta|domates soslu yumurta|poşe/.test(t)) return 'skillet';
    if(/lazanya|musakka|turta|frittata|fırın omlet|ratatuy/.test(t)) return 'tray';
    if(/somon|levrek|bonfile/.test(t)&&!/taco/.test(t)) return 'fish';
    if(/köri|sote|stroganoff|nohut|fasulye|güveç|orman kebabı|bolonez/.test(t)&&!/cips|salata/.test(t)) return /bolonez/.test(t)?'pasta':'stew';
    if(/pilav|risotto/.test(t)) return 'rice';
    if(/taco|dürüm|fajita|rulo|sandviç|tost|gözleme|börek|kanepe/.test(t)) return 'wrap';
    if(/pankek|kaygana|yumurtalı ekmek/.test(t)) return 'stack';
    if(/top|kurabiye|bar|brownie|muffin|tart|dilim|çubuk|cips|elma/.test(t)) return 'bites';
    if(/salata|bowl|kase|puding|yulaf|parfe|cacık|humus|guacamole|granola|dondurma|sütlaç|chia|patlamış|kuruyemiş|edamame|karışım|pancar|tatlısı|tabağı/.test(t)) return 'bowl';
    if(/spagetti|makarna|erişte|pad thai/.test(t)) return 'pasta';
    return 'plate';
  }

  function colors(r){
    var title=low(r.title), text=low(r.ingredients.join(' ')), out=[];
    FOOD.forEach(function(f){ if(f[0].test(title)) out.push(f[1]); });
    FOOD.forEach(function(f){ if(!f[0].test(title)&&f[0].test(text)) out.push(f[1]); });
    if(!out.length) out.push(['#E6C891','#D8B474']);
    return out.slice(0,5);
  }

  function leaf(x,y,s,rot,c){return '<path d="M0 0 C '+(s*.6)+' '+(-s*.5)+' '+(s*1.4)+' '+(-s*.3)+' '+(s*1.8)+' 0 C '+(s*1.4)+' '+(s*.3)+' '+(s*.6)+' '+(s*.5)+' 0 0Z" fill="'+c+'" transform="translate('+x+' '+y+') rotate('+rot+')"/>';}

  function scatter(rand,cols,cx,cy,rad,n,minR,maxR){
    var s='';
    for(var i=0;i<n;i++){
      var a=rand()*Math.PI*2, d=Math.sqrt(rand())*rad, x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d*.92;
      var c=cols[i%cols.length], rr=minR+rand()*(maxR-minR), kind=rand();
      if(kind<.45) s+='<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rr.toFixed(1)+'" fill="'+c[0]+'"/><circle cx="'+(x-rr*.3).toFixed(1)+'" cy="'+(y-rr*.3).toFixed(1)+'" r="'+(rr*.35).toFixed(1)+'" fill="#fff" opacity=".22"/>';
      else if(kind<.8) s+='<rect x="'+(x-rr).toFixed(1)+'" y="'+(y-rr*.7).toFixed(1)+'" width="'+(rr*2).toFixed(1)+'" height="'+(rr*1.4).toFixed(1)+'" rx="'+(rr*.4).toFixed(1)+'" fill="'+c[1]+'" transform="rotate('+Math.round(rand()*90)+' '+x.toFixed(1)+' '+y.toFixed(1)+')"/>';
      else s+='<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="'+(rr*1.3).toFixed(1)+'" ry="'+(rr*.7).toFixed(1)+'" fill="'+c[0]+'" transform="rotate('+Math.round(rand()*180)+' '+x.toFixed(1)+' '+y.toFixed(1)+')"/>';
    }
    return s;
  }

  function svg(r){
    if(r.img) return '<img src="'+r.img+'" alt="'+r.title.replace(/"/g,'')+'" loading="lazy">';
    var rand=rng(hash(r.id)), bg=BG[r.category]||BG.ana, cols=colors(r), ty=type(r);
    var W=400,H=250,cx=200,cy=128, s='';
    s+='<defs><linearGradient id="g'+r.id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+bg[0]+'"/><stop offset="1" stop-color="'+bg[1]+'"/></linearGradient></defs>';
    s+='<rect width="'+W+'" height="'+H+'" fill="url(#g'+r.id+')"/>';
    // arka plan dokusu
    for(var i=0;i<14;i++){ s+='<circle cx="'+(rand()*W).toFixed(0)+'" cy="'+(rand()*H).toFixed(0)+'" r="'+(2+rand()*5).toFixed(1)+'" fill="#fff" opacity="'+(.18+rand()*.2).toFixed(2)+'"/>'; }
    // peçete + çatal
    s+='<rect x="18" y="58" width="70" height="140" rx="10" fill="#fff" opacity=".55" transform="rotate(-8 53 128)"/>';
    s+='<g transform="translate(330 60) rotate(12)" fill="#9AA7A0" opacity=".8"><rect x="8" y="30" width="6" height="110" rx="3"/><rect x="0" y="0" width="4" height="36" rx="2"/><rect x="9" y="0" width="4" height="36" rx="2"/><rect x="18" y="0" width="4" height="36" rx="2"/><rect x="0" y="30" width="22" height="10" rx="5"/></g>';
    var shadow='<ellipse cx="'+(cx+6)+'" cy="'+(cy+10)+'" rx="112" ry="100" fill="#13231D" opacity=".10"/>';

    var plateCols=[['#FBFAF6','#E7E2D6'],['#F3F6F8','#C9D6DF'],['#FFF8EE','#E9D3B5'],['#EEF3EC','#C8D8C3']], pcol=plateCols[Math.floor(rand()*plateCols.length)];
    function plate(){return shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="'+pcol[0]+'"/><circle cx="'+cx+'" cy="'+cy+'" r="86" fill="none" stroke="'+pcol[1]+'" stroke-width="3"/>';}
    function herbs(n,spread){var o='';for(var h=0;h<n;h++) o+=leaf(cx-spread+rand()*spread*2,cy-spread+rand()*spread*2,9+rand()*5,rand()*360,rand()<.5?'#4F8F3F':'#6BAA55');return o;}
    if(ty==='meatballs'){
      var mc=cols[0][0]; s+=plate();
      if(/mercimek|falafel/.test(low(r.title))) mc=/falafel/.test(low(r.title))?'#9A6B3C':'#E98A3C';
      for(var mb=0;mb<7;mb++){var ma=mb/7*6.28+rand()*.3, mr=mb===6?0:48, mx=cx-8+Math.cos(ma)*mr*(mb<6?1:0), my=cy+Math.sin(ma)*mr*(mb<6?.85:0);
        s+='<ellipse cx="'+mx.toFixed(1)+'" cy="'+my.toFixed(1)+'" rx="21" ry="17" fill="'+mc+'"/><ellipse cx="'+(mx-6).toFixed(1)+'" cy="'+(my-6).toFixed(1)+'" rx="7" ry="4" fill="#fff" opacity=".2"/>';}
      s+=scatter(rand,cols.slice(1).length?cols.slice(1):[['#5E9E4B','#7DB861']],cx+60,cy+40,20,6,4,7)+herbs(4,40);
    } else if(ty==='manti'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="'+pcol[0]+'"/><circle cx="'+cx+'" cy="'+cy+'" r="84" fill="#FAF6EC"/>';
      for(var d=0;d<34;d++){var da=rand()*6.28, dr=Math.sqrt(rand())*66, dx=cx+Math.cos(da)*dr, dy=cy+Math.sin(da)*dr;s+='<path d="M'+(dx-8)+' '+(dy+4)+' Q'+dx+' '+(dy-12)+' '+(dx+8)+' '+(dy+4)+' Z" fill="#E6C891" stroke="#D2AE6F" stroke-width="1"/>';}
      s+='<path d="M140 100 q30 -20 60 0 t60 10" stroke="#C0392B" stroke-width="9" fill="none" stroke-linecap="round" opacity=".75"/><path d="M150 160 q30 14 70 -4" stroke="#C0392B" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>'+herbs(5,50);
    } else if(ty==='eggplant'){
      s+=plate();
      [[-34,-6,-20],[34,6,20]].forEach(function(o){
        s+='<g transform="translate('+(cx+o[0])+' '+(cy+o[1])+') rotate('+o[2]+')"><ellipse rx="30" ry="72" fill="#5B3A63"/><ellipse rx="20" ry="60" fill="#E8C9A0"/>';
        s+=scatter(rand,/hünkar/.test(low(r.title))?[['#8A4B35','#A45D41']]:[['#8A4B35','#A45D41'],['#D9483B','#E8664F']],0,0,16,9,4,7)+'<rect x="-5" y="-86" width="10" height="18" rx="4" fill="#4F8F3F"/></g>';
      });
      s+=herbs(3,30);
    } else if(ty==='dolma'){
      s+=plate(); var green=/mantar/.test(low(r.title))?['#B59A7E','#CDB79E']:['#6FAE4E','#8CC46A'];
      for(var dp=0;dp<5;dp++){var pa=dp/5*6.28-1, px=cx+Math.cos(pa)*48, py=cy+Math.sin(pa)*42;
        s+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="26" fill="'+green[0]+'"/><circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="17" fill="'+green[1]+'"/>'+scatter(rand,[cols[0],['#D9483B','#E8664F']],px,py,10,5,3,5);}
    } else if(ty==='skewer'){
      s+=plate();
      [-26,26].forEach(function(off){
        s+='<g transform="translate('+cx+' '+(cy+off)+') rotate(-12)"><rect x="-96" y="-2" width="192" height="4" rx="2" fill="#A27B52"/>';
        for(var ch=0;ch<6;ch++){var c4=ch%2?cols[0][0]:(cols[1]||['#6FAE4E'])[0]; s+='<rect x="'+(-78+ch*27)+'" y="-14" width="22" height="28" rx="6" fill="'+c4+'"/>';}
        s+='</g>';
      });
      s+=herbs(3,60);
    } else if(ty==='skillet'){
      s+='<rect x="286" y="118" width="110" height="18" rx="9" fill="#2F3A36" transform="rotate(-18 286 127)"/>';
      s+='<circle cx="'+(cx-10)+'" cy="'+(cy+4)+'" r="104" fill="#2F3A36"/><circle cx="'+(cx-10)+'" cy="'+(cy+4)+'" r="92" fill="#3B4843"/>';
      var sauce=/çılbır/.test(low(r.title))?'#FAF6EC':'#C8452F';
      s+='<circle cx="'+(cx-10)+'" cy="'+(cy+4)+'" r="84" fill="'+sauce+'"/>';
      if(/çılbır/.test(low(r.title))) s+='<path d="M130 90 q40 -10 80 10 t60 0" stroke="#C0392B" stroke-width="8" fill="none" opacity=".7" stroke-linecap="round"/>';
      for(var e=0;e<3;e++){var ex=cx-10+[-36,30,-2][e], ey=cy+4+[-18,-8,36][e]; s+='<ellipse cx="'+ex+'" cy="'+ey+'" rx="24" ry="20" fill="#FFFDF6"/><circle cx="'+(ex+2)+'" cy="'+(ey-1)+'" r="10" fill="#F2B51F"/>';}
      if(/sucuk/.test(low(r.title))) for(var su=0;su<6;su++) s+='<circle cx="'+(cx-70+rand()*120)+'" cy="'+(cy-50+rand()*110)+'" r="9" fill="#8E2F25" stroke="#6D2019" stroke-width="2"/>';
      s+=scatter(rand,[['#5E9E4B','#7DB861'],['#E8664F','#D9483B']],cx-10,cy+4,60,8,3,6);
    } else if(ty==='tray'){
      s+='<rect x="70" y="38" width="260" height="176" rx="18" fill="#13231D" opacity=".10" transform="translate(6 8)"/>';
      s+='<rect x="70" y="38" width="260" height="176" rx="18" fill="#FFFFFF"/><rect x="84" y="52" width="232" height="148" rx="10" fill="'+(cols[0][1])+'"/>';
      var layers=/lazanya|musakka/.test(low(r.title));
      if(layers){ for(var ly=0;ly<5;ly++) s+='<rect x="84" y="'+(62+ly*28)+'" width="232" height="10" fill="'+(ly%2?'#D9483B':'#F2E3B8')+'" opacity=".8"/>'; }
      s+=scatter(rand,cols,200,126,80,24,5,10)+herbs(5,70);
      s+='<path d="M92 60 q20 8 40 0" stroke="#fff" stroke-width="4" opacity=".35" fill="none"/>';
    } else if(ty==='fish'){
      s+=plate(); var t2=low(r.title), fc=cols[0];
      if(/bonfile/.test(t2)) s+='<ellipse cx="'+(cx-10)+'" cy="'+(cy-6)+'" rx="56" ry="38" fill="#7A3E2B"/><path d="M150 110 l60 -24 M156 130 l60 -24 M164 150 l56 -22" stroke="#4A2419" stroke-width="5" opacity=".6"/>';
      else if(/levrek/.test(t2)) s+='<ellipse cx="'+(cx-10)+'" cy="'+(cy-4)+'" rx="70" ry="28" fill="#C9CFD4"/><path d="M'+(cx+56)+' '+(cy-4)+' l30 -22 l0 44 z" fill="#B3BAC0"/><circle cx="'+(cx-58)+'" cy="'+(cy-10)+'" r="4" fill="#2F3A36"/><path d="M150 118 q40 16 90 0" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>';
      else s+='<rect x="'+(cx-70)+'" y="'+(cy-34)+'" width="110" height="58" rx="16" fill="'+fc[0]+'" transform="rotate(-10 '+cx+' '+cy+')"/><path d="M150 110 q10 20 0 40 M172 104 q10 20 0 40 M194 98 q10 20 0 40" stroke="#fff" stroke-width="3" fill="none" opacity=".45" transform="rotate(-10 '+cx+' '+cy+')"/>';
      s+='<ellipse cx="'+(cx+10)+'" cy="'+(cy+54)+'" rx="44" ry="16" fill="#F5E050" opacity=".0"/>';
      s+=scatter(rand,cols.slice(1).length?cols.slice(1):[['#5E9E4B','#7DB861']],cx+10,cy+56,40,10,5,9);
      s+='<circle cx="'+(cx+62)+'" cy="'+(cy-34)+'" r="16" fill="#F5E050"/><circle cx="'+(cx+62)+'" cy="'+(cy-34)+'" r="11" fill="#FFF0A0"/>'+herbs(3,40);
    } else if(ty==='stew'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#C8643B"/><circle cx="'+cx+'" cy="'+cy+'" r="92" fill="#A94E2C"/>';
      var base=/köri/.test(low(r.title))?'#E0A43A':/stroganoff/.test(low(r.title))?'#C9A27A':/taze fasulye/.test(low(r.title))?'#7DAA55':'#C0452F';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="80" fill="'+base+'"/>';
      s+=scatter(rand,cols,cx,cy,62,20,6,11)+herbs(4,40);
    } else if(ty==='rice'){
      s+=plate(); var grain=/bulgur/.test(low(r.title))?'#D8B474':/risotto/.test(low(r.title))?'#F2E6C4':/karnabahar/.test(low(r.title))?'#F4F1E6':'#F7F3E8';
      s+='<ellipse cx="'+(cx-14)+'" cy="'+cy+'" rx="60" ry="50" fill="'+grain+'"/>';
      for(var g2=0;g2<60;g2++){var ga=rand()*6.28, gr=Math.sqrt(rand())*50; s+='<ellipse cx="'+(cx-14+Math.cos(ga)*gr).toFixed(1)+'" cy="'+(cy+Math.sin(ga)*gr*.85).toFixed(1)+'" rx="3.2" ry="1.4" fill="#fff" opacity=".6" transform="rotate('+Math.round(rand()*180)+' '+(cx-14+Math.cos(ga)*gr).toFixed(1)+' '+(cy+Math.sin(ga)*gr*.85).toFixed(1)+')"/>';}
      s+=scatter(rand,cols,cx-14,cy,40,10,4,8)+scatter(rand,cols.slice(0,2),cx+58,cy+30,22,5,6,10)+herbs(3,30);
    } else if(ty==='glass'){
      var c=cols[0];
      s+='<ellipse cx="'+cx+'" cy="222" rx="60" ry="10" fill="#13231D" opacity=".12"/>';
      s+='<path d="M150 40 L250 40 L236 218 Q200 228 164 218 Z" fill="#fff" opacity=".7"/>';
      s+='<path d="M156 78 L244 78 L234 212 Q200 220 166 212 Z" fill="'+c[0]+'"/>';
      s+='<path d="M156 78 L244 78 L242 100 L158 100Z" fill="'+c[1]+'" opacity=".7"/>';
      s+='<rect x="214" y="10" width="8" height="120" rx="4" fill="#E2A42B" transform="rotate(14 218 70)"/>';
      if(cols[1]) s+='<circle cx="186" cy="72" r="14" fill="'+cols[1][0]+'"/>';
      s+=leaf(226,74,16,-30,'#5E9E4B');
    } else if(ty==='soup'){
      var c2=cols[0];
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#F4F1EA"/><circle cx="'+cx+'" cy="'+cy+'" r="104" fill="none" stroke="#DCD6C8" stroke-width="3"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="80" fill="'+c2[0]+'"/><circle cx="'+cx+'" cy="'+cy+'" r="80" fill="none" stroke="'+c2[1]+'" stroke-width="8" opacity=".6"/>';
      s+='<path d="M150 118 q20 -14 40 0 t40 0" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>';
      s+=scatter(rand,cols.slice(1).length?cols.slice(1):[['#fff','#fff']],cx,cy,50,9,3,7);
      for(var k=0;k<5;k++) s+=leaf(cx-30+rand()*60,cy-20+rand()*40,9,rand()*360,'#4F8F3F');
      s+='<path d="M176 128 q24 18 48 0" stroke="#fff" stroke-width="3" fill="none" opacity=".25"/>';
    } else if(ty==='pizza'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#D8B474"/><circle cx="'+cx+'" cy="'+cy+'" r="90" fill="#D9483B"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="88" fill="#F2D27A" opacity=".35"/>';
      s+=scatter(rand,cols,cx,cy,74,22,5,10);
      for(var p=0;p<4;p++){var ang=p*Math.PI/4;s+='<line x1="'+(cx+Math.cos(ang)*104)+'" y1="'+(cy+Math.sin(ang)*104)+'" x2="'+(cx-Math.cos(ang)*104)+'" y2="'+(cy-Math.sin(ang)*104)+'" stroke="#B8894F" stroke-width="2" opacity=".5"/>';}
      for(var q=0;q<5;q++) s+=leaf(cx-60+rand()*120,cy-60+rand()*120,10,rand()*360,'#4F8F3F');
    } else if(ty==='wrap'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#FBFAF6"/><circle cx="'+cx+'" cy="'+cy+'" r="86" fill="none" stroke="#E7E2D6" stroke-width="3"/>';
      [[-40,-8,-18],[38,10,20]].forEach(function(o){
        s+='<g transform="translate('+(cx+o[0])+' '+(cy+o[1])+') rotate('+o[2]+')">';
        s+='<path d="M-42 20 Q-42 -46 0 -46 Q42 -46 42 20 Z" fill="#E6C891"/>';
        s+=scatter(rand,cols,0,-8,26,9,4,8);
        s+='<path d="M-46 22 L46 22 Q40 40 0 40 Q-40 40 -46 22Z" fill="#D8B474"/></g>';
      });
      s+=leaf(cx-8,cy+60,14,-20,'#5E9E4B');
    } else if(ty==='stack'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#FBFAF6"/>';
      for(var st=0;st<4;st++) s+='<ellipse cx="'+cx+'" cy="'+(cy+24-st*12)+'" rx="68" ry="40" fill="'+(st%2?'#D8A15E':'#E6B874')+'" stroke="#C48A48" stroke-width="2"/>';
      s+='<path d="M150 80 q20 26 50 16 q30 -10 50 14" stroke="#9A5B2E" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>';
      s+=scatter(rand,cols,cx,cy-24,34,8,5,9);
    } else if(ty==='bites'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#FBFAF6"/><circle cx="'+cx+'" cy="'+cy+'" r="86" fill="none" stroke="#E7E2D6" stroke-width="3"/>';
      var c3=cols[0], bar=/bar|brownie|tart/.test(low(r.title));
      for(var b=0;b<5;b++){
        var a=b/5*Math.PI*2+rand()*.4, x=cx+Math.cos(a)*48, y=cy+Math.sin(a)*44;
        if(bar) s+='<rect x="'+(x-24)+'" y="'+(y-16)+'" width="48" height="32" rx="6" fill="'+c3[0]+'" transform="rotate('+Math.round(rand()*60-30)+' '+x+' '+y+')"/>';
        else s+='<circle cx="'+x+'" cy="'+y+'" r="23" fill="'+c3[0]+'"/><circle cx="'+(x-7)+'" cy="'+(y-7)+'" r="8" fill="#fff" opacity=".18"/>';
      }
      s+=scatter(rand,cols.slice(1).length?cols.slice(1):cols,cx,cy,70,12,2,5);
    } else if(ty==='pasta'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#FBFAF6"/>';
      var pc=/kabak spagetti/.test(low(r.title))?'#9CC56B':'#EBCB82';
      for(var n=0;n<16;n++){var rr=20+rand()*56, a0=rand()*6.28;s+='<path d="M'+(cx+Math.cos(a0)*rr)+' '+(cy+Math.sin(a0)*rr)+' A '+rr+' '+rr+' 0 0 1 '+(cx+Math.cos(a0+2)*rr)+' '+(cy+Math.sin(a0+2)*rr)+'" stroke="'+pc+'" stroke-width="7" fill="none" stroke-linecap="round"/>';}
      s+=scatter(rand,cols,cx,cy,40,12,5,10);
      for(var l=0;l<3;l++) s+=leaf(cx-20+rand()*40,cy-20+rand()*40,12,rand()*360,'#4F8F3F');
    } else if(ty==='bowl'){
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#EEF2EF"/><circle cx="'+cx+'" cy="'+cy+'" r="104" fill="none" stroke="#CFD8D2" stroke-width="4"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="86" fill="'+cols[cols.length-1][1]+'" opacity=".55"/>';
      // bölümlü dizilim
      var parts=Math.min(cols.length,5);
      for(var pi=0;pi<parts;pi++){
        var ang2=pi/parts*Math.PI*2-1.2, px=cx+Math.cos(ang2)*44, py=cy+Math.sin(ang2)*40;
        s+=scatter(rand,[cols[pi]],px,py,22,7,5,10);
      }
      s+=leaf(cx-6,cy-4,16,rand()*360,'#4F8F3F')+leaf(cx+8,cy+6,12,rand()*360,'#6BAA55');
    } else {
      s+=shadow+'<circle cx="'+cx+'" cy="'+cy+'" r="104" fill="#FBFAF6"/><circle cx="'+cx+'" cy="'+cy+'" r="86" fill="none" stroke="#E7E2D6" stroke-width="3"/>';
      var main=cols[0], side=cols.slice(1);
      s+='<ellipse cx="'+(cx-18)+'" cy="'+(cy-4)+'" rx="52" ry="40" fill="'+main[0]+'"/><ellipse cx="'+(cx-26)+'" cy="'+(cy-14)+'" rx="22" ry="12" fill="#fff" opacity=".18"/>';
      s+='<path d="M'+(cx-60)+' '+(cy-10)+' q18 -12 36 0 t36 0" stroke="'+main[1]+'" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>';
      s+=scatter(rand,side.length?side:[['#5E9E4B','#7DB861']],cx+46,cy+14,34,11,5,10);
      s+=leaf(cx-30,cy-30,14,-30,'#4F8F3F')+leaf(cx-10,cy-34,10,40,'#6BAA55');
    }
    return '<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+r.title.replace(/"/g,'')+' görseli" preserveAspectRatio="xMidYMid slice">'+s+'</svg>';
  }
  window.FitKalArt={svg:svg};
})();
