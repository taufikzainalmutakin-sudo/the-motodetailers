// Service CRUD safety layer for THE MOTODETAILERS admin dashboard.
// This file can be loaded by admin-dashboard.html if needed.
(function(){
  const SUPABASE_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
  const SUPABASE_KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const $=id=>document.getElementById(id);
  const toast=t=>{const x=$('toast');if(!x)return; x.textContent=t;x.classList.remove('hidden');setTimeout(()=>x.classList.add('hidden'),2600)};
  let services=[];
  async function loadServicesSafe(){
    const {data,error}=await db.from('services').select('*').order('sort_order');
    if(error){toast('Gagal memuat layanan: '+error.message);return;}
    services=data||[];
    const list=$('serviceList'); if(!list)return;
    list.innerHTML=services.map(s=>`<div class="card" style="margin:8px 0"><div class="panelhead"><div><b>${esc(s.name)}</b><div class="muted">${esc(s.description||'')}</div></div><span class="pill">${s.active?'Aktif':'Nonaktif'}</span></div><div class="row-actions" style="margin-top:10px"><button class="btn small" type="button" data-service-action="edit" data-id="${s.id}">Edit</button><button class="btn gray small" type="button" data-service-action="toggle" data-id="${s.id}">${s.active?'Nonaktifkan':'Aktifkan'}</button><button class="btn danger small" type="button" data-service-action="delete" data-id="${s.id}">Hapus</button></div></div>`).join('')||'<div class="empty">Belum ada layanan.</div>';
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function openServiceSafe(id){
    const editor=$('serviceEditor'); if(!editor)return;
    const s=id?services.find(x=>x.id===id):null;
    $('serviceId').value=s?.id||''; $('serviceTitle').textContent=s?'Edit layanan':'Tambah layanan';
    $('serviceName').value=s?.name||''; $('serviceSlug').value=s?.slug||''; $('serviceDesc').value=s?.description||'';
    $('serviceUrl').value=s?.result_url||''; $('serviceImage').value=s?.image_url||''; $('serviceSort').value=s?.sort_order??0; $('serviceActive').checked=s?.active!==false;
    editor.classList.remove('hidden'); editor.scrollIntoView({behavior:'smooth',block:'start'}); setTimeout(()=>$('serviceName')?.focus(),200);
  }
  async function saveServiceSafe(){
    const name=$('serviceName').value.trim(), slug=$('serviceSlug').value.trim();
    if(!name||!slug){toast('Nama dan slug wajib diisi');return;}
    const obj={name,slug,description:$('serviceDesc').value.trim()||null,result_url:$('serviceUrl').value.trim()||null,image_url:$('serviceImage').value.trim()||null,sort_order:Number($('serviceSort').value)||0,active:$('serviceActive').checked};
    const id=$('serviceId').value;
    const q=id?db.from('services').update(obj).eq('id',id):db.from('services').insert(obj);
    const {error}=await q;
    if(error){toast('Gagal menyimpan layanan: '+error.message);return;}
    toast(id?'Layanan berhasil diubah':'Layanan berhasil ditambahkan');
    $('serviceEditor').classList.add('hidden'); await loadServicesSafe();
  }
  async function toggleServiceSafe(id){
    const s=services.find(x=>x.id===id); if(!s)return;
    const {error}=await db.from('services').update({active:!s.active}).eq('id',id);
    if(error){toast('Gagal mengubah status: '+error.message);return;}
    toast(!s.active?'Layanan diaktifkan':'Layanan dinonaktifkan'); await loadServicesSafe();
  }
  async function deleteServiceSafe(id){
    const s=services.find(x=>x.id===id); if(!s)return;
    if(!confirm(`Hapus layanan "${s.name}"?`))return;
    const {error}=await db.from('services').delete().eq('id',id);
    if(error){toast('Gagal menghapus layanan: '+error.message);return;}
    toast('Layanan dihapus'); await loadServicesSafe();
  }
  function closeServiceSafe(){const e=$('serviceEditor');if(e)e.classList.add('hidden')}
  function bind(){
    $('addServiceBtn')?.addEventListener('click',()=>openServiceSafe());
    $('saveServiceBtn')?.addEventListener('click',saveServiceSafe);
    $('cancelServiceBtn')?.addEventListener('click',closeServiceSafe);
    $('serviceList')?.addEventListener('click',e=>{const b=e.target.closest('[data-service-action]');if(!b)return;const id=b.dataset.id;const a=b.dataset.serviceAction;if(a==='edit')openServiceSafe(id);else if(a==='toggle')toggleServiceSafe(id);else if(a==='delete')deleteServiceSafe(id);});
    window.openService=openServiceSafe;window.editService=openServiceSafe;window.toggleService=toggleServiceSafe;window.deleteService=deleteServiceSafe;window.saveService=saveServiceSafe;
    loadServicesSafe();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
