==================== script.js ====================
const el = sel => document.querySelector(sel);
const nf = new Intl.NumberFormat('id-ID');


function parseIntSafe(v){ return parseInt(String(v||'').replace(/[^0-9]/g,''),10)||0; }
function roundTo(n, step){ return step<=1 ? Math.round(n) : Math.round(n/step)*step; }
function daysBetweenInc(a,b){ if(!a||!b) return 0; const d1=new Date(a+'T00:00:00'); const d2=new Date(b+'T00:00:00'); return Math.floor((d2-d1)/86400000)+1; }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }


// UI refs
const form = el('#calc');
const out = el('#out');
const usedEl = el('#used');
const leftEl = el('#left');
const refundEl = el('#refund');
const detailEl = el('#detail');
const durasi = el('#durasi');
const durasiCustomWrap = el('#durasiCustomWrap');
const durasiCustom = el('#durasiCustom');


durasi.addEventListener('change',()=>{ durasiCustomWrap.style.display = durasi.value==='custom' ? 'block' : 'none'; });


el('#resetBtn').addEventListener('click',()=>{ form.reset(); out.style.display='none'; localStorage.removeItem('refundCalc'); });


// persist
const persistKeys=['wa','produk','email','harga','mulai','kendala','admin'];
persistKeys.forEach(k=>{ const node=el('#'+k); if(node){ node.addEventListener('input', saveLocal); }});
function saveLocal(){ const data=Object.fromEntries(persistKeys.map(k=>[k, el('#'+k)?.value||''])); data.durasi=durasi.value; data.durasiCustom=durasiCustom.value; data.round=el('#round').value; localStorage.setItem('refundCalc', JSON.stringify(data)); }
(function loadLocal(){ try{ const d=JSON.parse(localStorage.getItem('refundCalc')||'{}'); Object.keys(d).forEach(k=>{ const node=el('#'+k); if(node) node.value=d[k]; }); if(durasi.value==='custom') durasiCustomWrap.style.display='block'; }catch(_){} })();


// submit
form.addEventListener('submit', (e)=>{
e.preventDefault();
const price=parseIntSafe(el('#harga').value);
const start=el('#mulai').value; const issue=el('#kendala').value;
const step=parseIntSafe(el('#round').value)||1;
const admin=parseIntSafe(el('#admin').value);
let duration=durasi.value==='custom' ? parseIntSafe(durasiCustom.value) : parseIntSafe(durasi.value);
if(!duration||duration<1){ alert('Masukkan durasi paket yang valid.'); return; }
if(!start||!issue){ alert('Tanggal mulai & tanggal kendala wajib diisi.'); return; }
const used=daysBetweenInc(start,issue); if(used<=0){ alert('Tanggal kendala harus sama atau setelah tanggal mulai.'); return; }
const usedC=clamp(used,0,duration); const left=Math.max(0,duration-usedC);
const refundable=Math.max(0,(left/duration)*price - admin);
const net=Math.max(0, roundTo(refundable, step));
usedEl.innerHTML=`<b>${usedC} hari</b>`; leftEl.innerHTML=`<b>${left} hari</b>`; refundEl.innerHTML=`<b>Rp ${nf.format(net)}</b>`;
const detail=[`Harga: Rp ${nf.format(price)}`,`Durasi Paket: ${duration} hari`,`Dipakai: ${usedC} hari`,`Sisa: ${left} hari (${Math.round((left/duration)*100)}%)`,`Biaya Admin: Rp ${nf.format(admin)}`,`Rounding: ${nf.format(step)}`].join(' • ');
detailEl.textContent=detail; out.style.display='grid'; saveLocal();
});


// copy & share
el('#copyBtn').addEventListener('click',()=>{
const txt = [
'🧾 STRUK REFUND — SAISOKU.ID',
'',
`Produk: ${el('#produk').value}`,
`Harga: Rp ${nf.format(parseIntSafe(el('#harga').value))}`,
`Mulai: ${el('#mulai').value} | Kendala: ${el('#kendala').value}`,
`Durasi: ${(durasi.value==='custom'? durasiCustom.value: durasi.value)} hari`,
'',
`Refund: ${refundEl.textContent}`
].join('
');
navigator.clipboard.writeText(txt).then(()=>alert('Rincian disalin.'));
});


el('#waBtn').addEventListener('click',()=>{
const phoneRaw=el('#wa').value.trim();
const phone=parseIntSafe(phoneRaw) ? '62'+ String(phoneRaw).replace(/^0+/, '') : '';
const message=encodeURIComponent([
'Halo Admin, saya ingin konfirmasi estimasi refund.',
'',
`Produk: ${el('#produk').value}`,
`Email: ${el('#email').value}`,
`Harga: Rp ${nf.format(parseIntSafe(el('#harga').value))}`,
`Mulai: ${el('#mulai').value} | Kendala: ${el('#kendala').value}`,
`Durasi: ${(durasi.value==='custom'? durasiCustom.value: durasi.value)} hari`,
`Hasil: ${refundEl.textContent}`,
`Rincian: ${detailEl.textContent}`
].join('
'));
const url= phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
window.open(url,'_blank');
});


document.querySelector('#y').textContent = new Date().getFullYear();
