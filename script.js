const $ = s => document.querySelector(s);
const nf = new Intl.NumberFormat('id-ID');

function onlyInt(v){ return parseInt(String(v||'').replace(/[^0-9]/g,''),10)||0; }
function roundTo(n, step){ return step<=1 ? Math.round(n) : Math.round(n/step)*step; }
function daysInc(a,b){ if(!a||!b) return 0; const d1=new Date(a+'T00:00:00'); const d2=new Date(b+'T00:00:00'); return Math.floor((d2-d1)/86400000)+1; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

const durasi = $('#durasi'), durasiCustomWrap = $('#durasiCustomWrap'), durasiCustom = $('#durasiCustom');
durasi.addEventListener('change',()=>{ durasiCustomWrap.style.display = durasi.value==='custom' ? 'block' : 'none'; });

// Preset Produk → set durasi 30 jika cocok
$('#produk')?.addEventListener('change', e=>{
  const name = e.target.value.toLowerCase();
  const presets = ['netflix','viu premium','youtube premium','spotify premium','prime video','bein connect'];
  if (presets.includes(name)) { durasi.value='30'; durasi.dispatchEvent(new Event('change')); }
});

// Formatter Rupiah saat ketik (harga & admin)
['harga','admin'].forEach(id=>{
  const el = $('#'+id); if(!el) return;
  el.addEventListener('input', ()=>{
    const raw = String(el.value).replace(/[^0-9]/g,'');
    el.dataset.raw = raw;
    el.value = raw ? nf.format(+raw) : '';
  });
});
function getRp(id){ const el=$('#'+id); return el? onlyInt(el.dataset.raw || el.value) : 0; }

// Reset
$('#resetBtn').addEventListener('click', ()=>{ $('#calc').reset(); $('#out').style.display='none'; });

// Hitung
$('#calc').addEventListener('submit', e=>{
  e.preventDefault();
  const price = getRp('harga');
  const start = $('#mulai').value, issue = $('#kendala').value;
  let duration = durasi.value==='custom' ? onlyInt(durasiCustom.value) : onlyInt(durasi.value);
  const admin = getRp('admin'), step = onlyInt($('#round').value)||1;
  if(!price || !start || !issue || !duration) return alert('Lengkapi data.');

  const used = clamp(daysInc(start,issue), 0, duration);
  const left = Math.max(0, duration - used);
  const gross = Math.max(0, (left/duration) * price - admin);
  const net = Math.max(0, roundTo(gross, step));

  $('#used').innerHTML   = `<b>${used} hari</b>`;
  $('#left').innerHTML   = `<b>${left} hari</b>`;
  $('#refund').innerHTML = `<b>Rp ${nf.format(net)}</b>`;
  $('#detail').textContent = [
    `Harga: Rp ${nf.format(price)}`,
    `Durasi: ${duration} hari`,
    `Dipakai: ${used} hari`,
    `Sisa: ${left} hari (${Math.round((left/duration)*100)}%)`,
    `Admin: Rp ${nf.format(admin)}`,
    `Rounding: ${nf.format(step)}`
  ].join(' • ');
  $('#out').style.display='grid';
});

// Copy & WhatsApp
$('#copyBtn').addEventListener('click', ()=>{
  const txt =
`🧾 STRUK REFUND — SAISOKU.ID

Produk: ${$('#produk').value}
Harga: Rp ${nf.format(getRp('harga'))}
Mulai: ${$('#mulai').value} | Kendala: ${$('#kendala').value}
Durasi: ${durasi.value==='custom'? durasiCustom.value : durasi.value} hari

Refund: ${$('#refund').textContent}`;
  navigator.clipboard.writeText(txt).then(()=>alert('✅ Disalin'));
});
$('#waBtn').addEventListener('click', ()=>{
  const phone = $('#wa').value.replace(/[^0-9]/g,'').replace(/^0+/,'');
  const url = `https://wa.me/${phone? '62'+phone : ''}?text=${encodeURIComponent($('#detail').textContent + '\\n\\n' + 'Refund: ' + $('#refund').textContent)}`;
  window.open(url,'_blank');
});

$('#y').textContent = new Date().getFullYear();
