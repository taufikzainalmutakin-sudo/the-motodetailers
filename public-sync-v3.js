(()=>{
'use strict';
const URL='https://nbsmkxarkpesjiftmbwm.supabase.co',KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
let db,services=[],sizes=[],motors=[],prices=[],timer;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
const norm=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const findPrice=(sid,zid)=>{const p=prices.find(x=>x.service_id===sid&&x.motor_size_id===zid&&x.active!==false);return p?Number(p.price):null};
async function loadSdk(){if(window.supabase?.createClient)return;await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function fetchData(){
 const [s,z,m,p]=await Promise.all([
  db.from('services').select('id,name,slug,description,result_url,image_url,active,sort_order').eq('active',true).order('sort_order').order('name'),
  db.from('motor_sizes').select('id,name,active,sort_order').eq('active',true).order('sort_order').order('name'),
  db.from('motor_catalog').select('id,brand,model,motor_size_id,active,sort_order').eq('active',true).order('brand').order('sort_order').limit(5000),
  db.from('service_prices').select('id,service_id,motor_size_id,price,active').eq('active',true)
 ]);
 for(const r of [s,z,m,p])if(r.error)throw r.error;
 services=s.data||[];sizes=z.data||[];motors=m.data||[];prices=p.data||[];
}
function renderServices(){const box=document.querySelector('.services');if(!box)return;box.innerHTML=services.length?services.map(s=>{const body=`<h3>${esc(s.name)}</h3><p>${esc(s.description||'')}</p>`;return s.result_url?`<a class="service service-link" href="${esc(s.result_url)}" target="_blank" rel="noopener noreferrer">${body}</a>`:`<div class="service">${body}</div>`}).join(''):'<div class="service"><h3>Belum ada layanan aktif</h3><p>Silakan cek kembali nanti.</p></div>'}
function renderPrices(){const section=$('pricelist');if(!section)return;const buttons=section.querySelector('.size-buttons'),table=$('priceTable');if(!buttons||!table)return;const current=buttons.querySelector('.size-btn.active')?.dataset.sizeId||buttons.querySelector('.size-btn.active')?.dataset.size;buttons.innerHTML=sizes.map((s,i)=>`<button class="size-btn${(current===s.id||current===s.name||(!current&&i===0))?' active':''}" data-size-id="${esc(s.id)}" type="button">${esc(s.name)}</button>`).join('');const show=id=>{const z=sizes.find(x=>x.id===id)||sizes.find(x=>x.name===id)||sizes[0];if(!z){table.innerHTML='<p class="note">Belum ada size motor.</p>';return}table.innerHTML=`<h3>${esc(z.name)} Motorcycle</h3><div class="pricegrid">${services.map(s=>{const p=findPrice(s.id,z.id);return `<div class="priceitem"><span>${esc(s.name)}</span><b>${p==null?'Belum tersedia':money(p)}</b></div>`}).join('')}</div>`;buttons.querySelectorAll('.size-btn').forEach(b=>b.classList.toggle('active',b.dataset.sizeId===z.id))};buttons.querySelectorAll('.size-btn').forEach(b=>b.onclick=()=>show(b.dataset.sizeId));show(current||sizes[0]?.id)}
function score(m,q){const n=norm(q),c=n.replace(/\s/g,''),full=norm(`${m.brand} ${m.model}`),model=norm(m.model),brand=norm(m.brand),compact=full.replace(/\s/g,'');let x=0;if(full===n)x+=10000;if(model===n)x+=9500;if(compact===c)x+=9000;if(model.startsWith(n))x+=8000;if(model.includes(n))x+=6500;if(compact.includes(c))x+=6000;if(brand.startsWith(n))x+=3000;return x}
function bindSearch(){const input=$('search'),box=$('results');if(!input||!box)return;const render=q=>{q=String(q||'').trim();if(q.length<2){box.innerHTML='<p class="note">Ketik minimal 2 karakter untuk mencari.</p>';return}const hits=motors.map(m=>({m,x:score(m,q)})).filter(a=>a.x>0).sort((a,b)=>b.x-a.x).slice(0,50).map(a=>a.m);if(!hits.length){box.innerHTML='<div class="result"><strong>Motor tidak ditemukan.</strong><div class="note">Coba ketik nama model lain.</div></div>';return}box.innerHTML=hits.map(m=>{const z=sizes.find(s=>s.id===m.motor_size_id);const rows=services.map(s=>{const p=findPrice(s.id,m.motor_size_id);return `<div class="priceitem"><span>${esc(s.name)}</span><b>${p==null?'Belum tersedia':money(p)}</b></div>`}).join('');return `<div class="result"><strong>${esc(m.brand)} ${esc(m.model)}</strong><span class="pill">${esc(z?.name||'-')}</span><div style="margin-top:10px">${rows}</div></div>`}).join('')};input.oninput=e=>render(e.target.value);render(input.value)}
function renderAll(){renderServices();renderPrices();bindSearch()}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>fetchData().then(renderAll).catch(e=>console.error('[TMD public v3]',e)),300)}
function subscribe(){db.channel('tmd-public-v3').on('postgres_changes',{event:'*',schema:'public',table:'services'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'service_prices'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'motor_catalog'},schedule).on('postgres_changes',{event:'*',schema:'public',table:'motor_sizes'},schedule).subscribe();setInterval(()=>{if(document.visibilityState==='visible')schedule()},5000)}
async function init(){try{await loadSdk();db=supabase.createClient(URL,KEY);await fetchData();renderAll();subscribe()}catch(e){console.error('[TMD public v3]',e);const box=document.querySelector('.services');if(box)box.innerHTML='<div class="service"><h3>Data belum dapat dimuat</h3><p>Silakan refresh halaman.</p></div>';const t=$('priceTable');if(t)t.innerHTML='<p class="note">Pricelist belum dapat dimuat.</p>'}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
