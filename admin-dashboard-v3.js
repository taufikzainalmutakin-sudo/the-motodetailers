(()=>{
'use strict';
const URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const $=id=>document.getElementById(id);
let db;
const toast=m=>{const x=$('toast');if(!x){alert(m);return}x.textContent=m;x.classList.remove('hidden');clearTimeout(window.__tmdv3);window.__tmdv3=setTimeout(()=>x.classList.add('hidden'),2600)};
const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const money=v=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
let services=[],sizes=[],prices=[];

function ensurePriceStyles(){
 const id='tmd-v3-price-styles';
 if(document.getElementById(id))return;
 const style=document.createElement('style');
 style.id=id;
 style.textContent=`
   #priceList .pricerow{align-items:flex-start;flex-wrap:wrap}
   #priceList .price-actions{flex:1 1 190px;min-width:0;text-align:right}
   #priceList .price-action-buttons{display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:6px;margin-top:7px}
   #priceList .price-action-buttons .btn{display:inline-block!important;visibility:visible!important;opacity:1!important;margin:0!important;white-space:nowrap}
   #priceList .price-action-buttons .btn.danger{display:inline-block!important;background:#dc2626!important;color:#fff!important}
   @media(max-width:600px){
     #priceList .pricerow{display:flex;gap:8px}
     #priceList .price-actions{width:100%;flex-basis:100%;text-align:left}
     #priceList .price-action-buttons{justify-content:flex-start}
   }
 `;
 document.head.appendChild(style);
}

async function getData(){
 const [s,z,p]=await Promise.all([
  db.from('services').select('id,name,active,sort_order,slug,description,result_url,image_url').order('sort_order').order('name'),
  db.from('motor_sizes').select('id,name,active,sort_order').order('sort_order').order('name'),
  db.from('service_prices').select('id,service_id,motor_size_id,price,active').order('created_at')
 ]);
 for(const r of [s,z,p]) if(r.error) throw r.error;
 services=s.data||[]; sizes=z.data||[]; prices=p.data||[];
}
function ensurePriceTab(){
 const tabs=$('tabs'); if(!tabs)return;
 if(!tabs.querySelector('[data-tab="prices"]')){
  const b=document.createElement('button');b.className='tab';b.dataset.tab='prices';b.type='button';b.textContent='Pricelist';tabs.appendChild(b);
 }
 const main=$('prices'); if(!main){
  const sec=document.createElement('section');sec.id='prices';sec.className='tabpage hidden';
  sec.innerHTML='<div class="panel"><div class="head"><h2>Pricelist</h2><button id="addPrice" class="btn">+ Harga</button></div><p class="muted">Edit harga langsung tersimpan ke database.</p><div id="priceList" class="pricegrid"><div class="loading">Memuat...</div></div><div id="priceEditor" class="panel editor hidden"><h3 id="priceTitle">Tambah harga</h3><input type="hidden" id="priceId"><label>Treatment</label><select id="priceService" class="input"></select><label>Size</label><select id="priceSize" class="input"></select><label>Harga</label><input id="priceValue" class="input" type="number" min="0" step="1000"><label><input id="priceActive" type="checkbox" checked> Aktif</label><div class="actions"><button id="savePrice" class="btn">Simpan</button><button id="cancelPrice" class="btn gray">Batal</button></div></div></div>';
  const wrap=document.querySelector('main.wrap');if(wrap)wrap.appendChild(sec);
 }
}
function fillSelects(){
 const ss=$('priceService'),zs=$('priceSize');
 if(ss)ss.innerHTML=services.map(s=>`<option value="${s.id}">${esc(s.name)}${s.active?'':' (Nonaktif)'}</option>`).join('');
 if(zs)zs.innerHTML=sizes.map(z=>`<option value="${z.id}">${esc(z.name)}${z.active===false?' (Nonaktif)':''}</option>`).join('');
}
function renderPrices(){
 const box=$('priceList');if(!box)return;
 ensurePriceStyles();
 const sm=new Map(services.map(s=>[s.id,s])),zm=new Map(sizes.map(z=>[z.id,z]));
 const groups=new Map();
 for(const p of prices){const z=zm.get(p.motor_size_id);const key=p.motor_size_id;if(!groups.has(key))groups.set(key,{name:z?.name||'Size',order:z?.sort_order??999,rows:[]});groups.get(key).rows.push({...p,service:sm.get(p.service_id)});}
 box.innerHTML=[...groups.values()].sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name)).map(g=>`<div class="pricecard"><h3>${esc(g.name)}</h3>${g.rows.sort((a,b)=>(a.service?.name||'').localeCompare(b.service?.name||'')).map(p=>`<div class="pricerow"><div><b>${esc(p.service?.name||'Layanan')}</b><div class="muted">${p.active?'Aktif':'Nonaktif'}</div></div><div class="price-actions"><strong>${money(p.price)}</strong><div class="price-action-buttons"><button type="button" class="btn small" data-v3-price="edit" data-id="${p.id}">Edit harga</button><button type="button" class="btn gray small" data-v3-price="toggle" data-id="${p.id}">${p.active?'Nonaktifkan':'Aktifkan'}</button><button type="button" class="btn danger small" data-v3-price="delete" data-id="${p.id}">Hapus</button></div></div></div>`).join('')}</div>`).join('')||'<div class="muted">Belum ada harga.</div>';
 fillSelects();
}
async function refreshPrices(){await getData();ensurePriceTab();renderPrices();}
function openPrice(id=''){
 const p=prices.find(x=>x.id===id);if(!$('priceEditor'))return;
 $('priceId').value=p?.id||'';$('priceTitle').textContent=p?'Edit harga':'Tambah harga';
 fillSelects();$('priceService').value=p?.service_id||services.find(s=>s.active)?.id||services[0]?.id||'';$('priceSize').value=p?.motor_size_id||sizes.find(z=>z.active!==false)?.id||sizes[0]?.id||'';$('priceValue').value=p?.price??0;$('priceActive').checked=p?.active!==false;$('priceEditor').classList.remove('hidden');$('priceEditor').scrollIntoView({behavior:'smooth'});
}
async function savePrice(){
 const id=$('priceId').value||null,service_id=$('priceService').value,motor_size_id=$('priceSize').value,price=Number($('priceValue').value),active=$('priceActive').checked;
 if(!service_id||!motor_size_id||!Number.isFinite(price)||price<0)return toast('Treatment, size, dan harga wajib benar');
 const r=await db.rpc('admin_save_service_price',{p_id:id,p_service_id:service_id,p_motor_size_id:motor_size_id,p_price:price,p_active:active});if(r.error)throw r.error;
 toast('Harga tersimpan');$('priceEditor').classList.add('hidden');await refreshPrices();
}
async function togglePrice(id){
 const p=prices.find(x=>x.id===id);if(!p)return;
 const r=await db.rpc('admin_save_service_price',{p_id:id,p_service_id:p.service_id,p_motor_size_id:p.motor_size_id,p_price:p.price,p_active:!p.active});if(r.error)throw r.error;
 toast(p.active?'Harga dinonaktifkan':'Harga diaktifkan');await refreshPrices();
}
async function deletePrice(id){
 if(!confirm('Hapus harga ini?'))return;
 const r=await db.rpc('admin_delete_service_price',{p_price_id:id});
 if(r.error)throw r.error;
 toast('Harga dihapus');
 await refreshPrices();
}
async function toggleService(id){
 const q=await db.from('services').select('id,name,active').eq('id',id).single();if(q.error)throw q.error;
 const r=await db.rpc('admin_set_service_active',{p_service_id:id,p_active:!q.data.active});if(r.error)throw r.error;
 toast(q.data.active?'Layanan dinonaktifkan':'Layanan diaktifkan');
 await refreshPrices();
}
function hook(){
 ensurePriceStyles();
 ensurePriceTab();
 const tabs=$('tabs');
 if(tabs)tabs.addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;if(b.dataset.tab==='prices'){e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tabpage').forEach(x=>x.classList.toggle('hidden',x.id!=='prices'));refreshPrices().catch(x=>toast(x.message));}},true);
 const serviceList=$('serviceList');
 if(serviceList)serviceList.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;const id=b.dataset.id;if(b.dataset.s==='toggle'){e.preventDefault();e.stopImmediatePropagation();toggleService(id).catch(x=>toast(x.message));}},true);
 const priceList=$('priceList');
 if(priceList)priceList.addEventListener('click',e=>{const b=e.target.closest('[data-v3-price]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.id;const a=b.dataset.v3Price;if(a==='edit')openPrice(id);else if(a==='toggle')togglePrice(id).catch(x=>toast(x.message));else if(a==='delete')deletePrice(id).catch(x=>toast(x.message));},true);
 const add=$('addPrice');if(add)add.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openPrice();},true);
 const save=$('savePrice');if(save)save.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();savePrice().catch(x=>toast(x.message));},true);
 const cancel=$('cancelPrice');if(cancel)cancel.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();$('priceEditor')?.classList.add('hidden');},true);
}
async function init(){try{if(!window.supabase?.createClient)return;db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});hook();await refreshPrices();}catch(e){console.error('[TMD admin v3]',e);toast('Pricelist belum bisa dimuat: '+(e?.message||e));}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
