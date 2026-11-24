(function(){
var KEY='shiftpay.v1';
var st={wage:1200,shifts:{},batches:[]};
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);if(o&&o.shifts&&o.batches)st=o;}}catch(e){}
var assets=null;
function idbOpen(){return new Promise(function(res,rej){try{var r=indexedDB.open('shiftpay-files',1);r.onupgradeneeded=function(){r.result.createObjectStore('f')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}})}
function idbPut(id,blob){return idbOpen().then(function(db){return new Promise(function(res,rej){var t=db.transaction('f','readwrite');t.objectStore('f').put(blob,id);t.oncomplete=function(){res()};t.onerror=function(){rej(t.error)}})})}
function idbGet(id){return idbOpen().then(function(db){return new Promise(function(res,rej){var q=db.transaction('f').objectStore('f').get(id);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})})}
function idbDel(id){return idbOpen().then(function(db){return new Promise(function(res,rej){var t=db.transaction('f','readwrite');t.objectStore('f').delete(id);t.oncomplete=function(){res()};t.onerror=function(){rej(t.error)}})})}
try{if(window.claude&&claude.use)claude.use('assets').then(function(a){if(a){assets=a;render()}}).catch(function(){})}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
var rest=0,fare=0,now=new Date(),vy=now.getFullYear(),vm=now.getMonth(),sel=null,picked={};
var $=function(id){return document.getElementById(id)};
function p2(n){return n<10?'0'+n:''+n}
function key(y,m,d){return y+'-'+p2(m+1)+'-'+p2(d)}
function yen(n){return Math.floor(n).toLocaleString('ja-JP')+'円'}
function mins(s){var a=s.s.split(':'),b=s.e.split(':');var x=(+b[0]*60+ +b[1])-(+a[0]*60+ +a[1]);if(x<0)x+=1440;return Math.max(0,x-(+s.b||0))}
function pay(s){return s.a!==undefined?(+s.a||0):mins(s)*(+s.w||0)/60}
function hm(m){return Math.floor(m/60)+'時間'+(m%60?m%60+'分':'')}
function paidMap(){var m={};st.batches.forEach(function(b){b.dates.forEach(function(d){m[d]=b})});return m}
function inMonth(k){return k.indexOf(vy+'-'+p2(vm+1)+'-')===0}
function bm(b){var k=b.m||b.dates[0];return !!k&&inMonth(k)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fd(k){var a=k.split('-');return (+a[1])+'/'+(+a[2])}

function render(){
  $('title').textContent=vy+'年'+(vm+1)+'月';
  var pm=paidMap(),keys=Object.keys(st.shifts).filter(inMonth).sort();
  var exact=0;keys.forEach(function(k){exact+=pay(st.shifts[k])});
  var tot=Math.floor(exact+1e-9),got=0;fare=0;
  st.batches.forEach(function(b){if(bm(b)){got+=b.amount;fare+=b.fare||0}});
  $('tot').textContent=yen(tot);$('got').textContent=yen(got);$('rem').textContent=yen(Math.max(0,tot-got));
  var unpaid=keys.filter(function(k){return !pm[k]}).length;
  rest=tot-got;var se=$('settle');se.hidden=!(keys.length&&unpaid===0&&rest>0);se.textContent='月末の端数 '+yen(rest)+' を受け取る';
  $('sumnote').textContent=keys.length?('出勤'+keys.length+'日（未受取'+unpaid+'日）。受け取りは1,000円単位で、端数は月末にまとめて受け取ります。'+(fare?'（月末に交通費など '+yen(fare)+' も受け取り済み）':'')):'この月のシフトはまだありません。';
  // calendar
  var h='';['日','月','火','水','木','金','土'].forEach(function(w){h+='<div class="dow">'+w+'</div>'});
  var first=new Date(vy,vm,1).getDay(),dim=new Date(vy,vm+1,0).getDate();
  for(var i=0;i<first;i++)h+='<div class="cell empty"></div>';
  var tk=key(now.getFullYear(),now.getMonth(),now.getDate());
  for(var d=1;d<=dim;d++){
    var k=key(vy,vm,d),s=st.shifts[k];
    h+='<button class="cell'+(k===tk?' today':'')+(k===sel?' sel':'')+'" data-k="'+k+'"><span class="n">'+d+'</span>';
    if(s){h+='<span class="t">'+s.s+'-'+s.e+'</span><span class="y">'+yen(pay(s))+'</span><span class="tag '+(pm[k]?'paid':'un')+'">'+(pm[k]?'受取済':'未受取')+'</span>'}
    h+='</button>';
  }
  $('cal').innerHTML=h;
  renderEditor();renderPick();renderEOM();renderHist();
}

function renderEditor(){
  var ed=$('editor');
  if(!sel){ed.style.display='none';return}
  ed.style.display='';
  var s=st.shifts[sel]||{s:'10:00',e:'17:00'},amt=st.shifts[sel]?pay(st.shifts[sel]):'';
  var pm=paidMap(),b=pm[sel],ex=!!st.shifts[sel];
  ed.innerHTML='<h2>'+fd(sel)+' のシフト'+(b?'（'+fd(b.on)+'に受け取り済み）':'')+'</h2>'+
  '<div class="row"><b style="font-size:13px;width:100%">提出したシフト</b><label>開始<input type="time" id="fs" value="'+s.s+'"></label>'+
  '<label>終了<input type="time" id="fe" value="'+s.e+'"></label></div>'+
  '<div class="row"><b style="font-size:13px;width:100%">実際に働いた時間</b><label>開始<input type="time" id="fas" value="'+(s.as||'')+'"></label><label>終了<input type="time" id="fae" value="'+(s.ae||'')+'"></label><span id="aw" class="note" style="margin:0 0 8px"></span></div>'+
  '<div class="row"><label>ポイント<input type="number" id="fp" min="0" step="any" inputmode="decimal" value="'+(s.pt===undefined?'':s.pt)+'"></label><label>この日の給料（円）<input type="number" id="fa" min="0" step="any" inputmode="decimal" value="'+amt+'"></label></div>'+
  '<div class="row"><label style="width:100%">メモ<input type="text" id="fm" style="font:inherit;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:100%" value="'+esc(s.memo||'')+'"></label></div>'+
  '<div class="pv" id="pv"></div>'+
  '<div class="row"><button class="p" id="sv">保存</button>'+
  (ex&&!b?'<button id="daily">この日を日払いで受け取る</button>':'')+
  (ex?'<button class="d" id="del">シフトを削除</button>':'')+'<button id="cl">閉じる</button></div>';
  function cur(){return{s:$('fs').value||'00:00',e:$('fe').value||'00:00',as:$('fas').value,ae:$('fae').value,pt:$('fp').value===''?undefined:+$('fp').value,a:+$('fa').value||0,memo:$('fm').value.trim()}}
  function pv(){var c=cur();$('aw').textContent=c.as&&c.ae?'実労働 '+hm(mins({s:c.as,e:c.ae,b:0})):'';$('pv').textContent='この日の給料 '+yen(pay(c))+'（日払い：'+yen(Math.floor(pay(c)/1000+1e-9)*1000)+'、月末：'+yen(pay(c)-Math.floor(pay(c)/1000+1e-9)*1000)+'）'}
  ['fs','fe','fas','fae','fa'].forEach(function(i){$(i).addEventListener('input',pv)});pv();
  $('sv').onclick=function(){var c=cur();st.shifts[sel]=c;save();render()};
  $('cl').onclick=function(){sel=null;render()};
  if($('del'))$('del').onclick=function(){
    if(b&&!confirm('この日は受け取り済みです。削除しても受け取り履歴は残ります。削除しますか？'))return;
    delete st.shifts[sel];sel=null;save();render()};
  if($('daily'))$('daily').onclick=function(){var c=cur();st.shifts[sel]=c;record([sel],new Date())};
}

function record(dates,on){var t=0;dates.forEach(function(k){t+=pay(st.shifts[k])});if(t<1000){alert('1,000円未満のため受け取れません。数日ためて1,000円以上にしてから受け取ってください。');return}
  var sum=0;dates.forEach(function(k){sum+=pay(st.shifts[k])});
  st.batches.push({id:Date.now()+''+Math.random().toString(36).slice(2,5),dates:dates.sort(),amount:Math.floor((sum+1e-9)/1000)*1000,on:key(on.getFullYear(),on.getMonth(),on.getDate())});
  picked={};save();render();
}

function renderPick(){
  var pm=paidMap(),ks=Object.keys(st.shifts).filter(function(k){return inMonth(k)&&!pm[k]}).sort(),el=$('pick');
  if(!ks.length){el.innerHTML='<p class="empty-msg">受け取っていないシフトはありません。</p>';return}
  var h='<ul class="list">';
  ks.forEach(function(k){var s=st.shifts[k];
    h+='<li><input type="checkbox" data-k="'+k+'" id="c'+k+'"'+(picked[k]?' checked':'')+'><label style="flex-direction:row;font-size:14px;color:var(--ink)" for="c'+k+'">'+fd(k)+'　'+s.s+'-'+s.e+'</label><span class="amt">'+yen(pay(s))+'</span></li>'});
  h+='</ul>';
  var sel2=ks.filter(function(k){return picked[k]}),sum=0;sel2.forEach(function(k){sum+=pay(st.shifts[k])});
  h+='<p class="pv">選んだ'+sel2.length+'日の受け取り額：<b>'+yen(Math.floor(sum/1000+1e-9)*1000)+'</b>（1,000円単位。残りの'+yen(sum-Math.floor(sum/1000+1e-9)*1000)+'は月末）</p>'+
  '<div class="row"><label>受け取った日<input type="date" id="pon" value="'+key(now.getFullYear(),now.getMonth(),now.getDate())+'"></label>'+
  '<button id="all">すべて選ぶ</button><button class="p" id="rec"'+(sum>=1000?'':' disabled')+'>受け取りを記録</button></div>';
  el.innerHTML=h;
  el.querySelectorAll('input[type=checkbox]').forEach(function(c){c.onchange=function(){if(c.checked)picked[c.dataset.k]=1;else delete picked[c.dataset.k];renderPick()}});
  $('all').onclick=function(){ks.forEach(function(k){picked[k]=1});renderPick()};
  $('rec').onclick=function(){var v=$('pon').value.split('-');record(sel2.slice(),v.length===3?new Date(+v[0],+v[1]-1,+v[2]):new Date())};
}

function renderEOM(){
  var el=$('eom'),d0=key(now.getFullYear(),now.getMonth(),now.getDate());
  var ts='font:inherit;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:140px';
  el.innerHTML='<div class="row"><label>端数分（給料）<input type="number" id="es" min="0" step="1" inputmode="numeric" value="'+Math.floor(Math.max(0,rest))+'"></label>'+
  '<label>交通費など（円）<input type="number" id="ef" min="0" step="1" inputmode="numeric" placeholder="0"></label>'+
  '<label>受け取った日<input type="date" id="ed" value="'+d0+'"></label>'+
  '<label>メモ（任意）<input type="text" id="em" style="'+ts+'" placeholder="例：交通費"></label></div>'+
  '<div class="row"><label>明細PDF（任意）'+'<input type="file" id="epdf" accept="application/pdf,.pdf">'+'</label></div>'+
  '<div class="pv" id="et"></div><div class="row"><button class="p" id="eb">月末の受け取りを記録</button></div>'+
  '<p class="note">端数分は「残り」に反映されます。交通費などは給料とは別に記録し、履歴と上部のメモに表示します。</p>';
  function tt(){$('et').innerHTML='実際に受け取った合計：<b>'+yen((+$('es').value||0)+(+$('ef').value||0))+'</b>'}
  $('es').addEventListener('input',tt);$('ef').addEventListener('input',tt);tt();
  $('eb').onclick=function(){
    var s=Math.floor(+$('es').value||0),f=Math.floor(+$('ef').value||0);
    if(s<=0&&f<=0){alert('金額を入力してください。');return}
    var fi=$('epdf'),fl=fi&&fi.files&&fi.files[0];var rec={id:Date.now()+'m',dates:[],m:key(vy,vm,1),amount:s,fare:f,memo:$('em').value.trim(),on:$('ed').value||d0};
    function done(){st.batches.push(rec);save();render()}
    if(fl){var btn=$('eb');btn.disabled=true;btn.textContent='アップロード中…';(assets?assets.upload(fl).then(function(r){return{id:r.id,url:r.url}}):(function(){var i='f'+Date.now();return idbPut(i,fl).then(function(){return{id:i,url:''}})})()).then(function(r){rec.pdf={id:r.id,url:r.url,name:fl.name};done()}).catch(function(){alert('PDFのアップロードに失敗しました。もう一度お試しください。');btn.disabled=false;btn.textContent='月末の受け取りを記録'});return}
    done();return
    save();render()};
}

function renderHist(){
  var bs=st.batches.filter(function(b){return bm(b)}).sort(function(a,b){return a.on<b.on?1:-1}),el=$('hist');
  if(!bs.length){el.innerHTML='<p class="empty-msg">この月の受け取り記録はまだありません。</p>';return}
  var h='<ul class="list">';
  bs.forEach(function(b){h+='<li><div>'+fd(b.on)+' 受け取り<br><small style="color:var(--sub)">'+(b.dates.length?b.dates.map(fd).join('、')+'分':'月末：端数 '+yen(b.amount)+'＋交通費など '+yen(b.fare||0)+(b.memo?'（'+esc(b.memo)+'）':'')+(b.pdf?(b.pdf.url?(/^(\/_blob\/|https:\/\/)/.test(b.pdf.url)?' <a href="'+esc(b.pdf.url)+'" target="_blank" rel="noopener">明細PDFを開く</a>':''):' <a href="#" data-pdf="'+esc(b.pdf.id)+'" data-name="'+esc(b.pdf.name||'')+'">明細PDFを開く</a>'):''))+'</small></div><span class="amt">'+yen(b.amount+(b.fare||0))+'</span><button class="d" data-id="'+esc(b.id)+'">取消</button></li>'});
  el.innerHTML=h+'</ul>';
  el.querySelectorAll('a[data-pdf]').forEach(function(a){a.onclick=function(e){e.preventDefault();idbGet(a.dataset.pdf).then(function(bl){if(!bl){alert('ファイルが見つかりません。');return}var u=URL.createObjectURL(bl),l=document.createElement('a');l.href=u;l.download=a.dataset.name||'meisai.pdf';document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)})}});
  el.querySelectorAll('button').forEach(function(x){x.onclick=function(){
    if(!confirm('この受け取り記録を取り消しますか？（対象の日は未受取に戻ります）'))return;
    var tb=st.batches.filter(function(b){return b.id===x.dataset.id})[0];if(tb&&tb.pdf){if(assets&&tb.pdf.url){try{assets.delete(tb.pdf.id).catch(function(){})}catch(e){}}else if(!tb.pdf.url){idbDel(tb.pdf.id).catch(function(){})}}
    st.batches=st.batches.filter(function(b){return b.id!==x.dataset.id});save();render()}});
}

$('cal').addEventListener('click',function(e){var c=e.target.closest('.cell');if(!c||!c.dataset.k)return;sel=c.dataset.k;render();$('editor').scrollIntoView({behavior:'smooth',block:'nearest'})});
$('settle').onclick=function(){$('eom').scrollIntoView({behavior:'smooth',block:'center'})};
$('prev').onclick=function(){vm--;if(vm<0){vm=11;vy--}sel=null;picked={};render()};
$('next').onclick=function(){vm++;if(vm>11){vm=0;vy++}sel=null;picked={};render()};
render();
})();

if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){})});
}

