(()=>{
  const URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
  const KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
  let db;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
  const toast=m=>{const x=$('toast');if(!x){alert(m);return}x.textContent=m;x.classList.remove('hidden');clearTimeout(window.__hotfixToast);window.__hotfixToast=setTimeout(()=>x.classList.add('hidden'),2800)};

  async function refreshServices(){
    const box=$('serviceList'); if(!box)return;
    const r=await db.from('services').select('id,name,slug,description,result_url,image_url,active,sort_order').order('sort_order').order('name');
    if(r.error)throw r.error;
    const rows=r.data||[];
    const count=$('serviceCount'); if(count)count.textContent=rows.filter(x=>x.active).length;
    box.classList.remove('loading');
    box.innerHTML=rows.length?rows.map(s=>`<div class="card" style="margin:9px 0"><div class="panelhead"><div><b>${esc(s.name)}</b><div class="muted">${esc(s.description||'')}</div></div><span class="pill">${s.active?'Aktif':'Nonaktif'}</span></div><div class="actions" style="margin-top:10px"><button class="btn small" type="button" data-sa="edit" data-id="${s.id}">Edit</button><button class="btn gray small" type="button" data-sa="toggle" data-id="${s.id}">${s.active?'Nonaktifkan':'Aktifkan'}</button><button class="btn danger small" type="button" data-sa="delete" data-id="${s.id}">Hapus</button></div></div>`).join(''):'<div class="muted">Belum ada layanan.</div>';
  }

  async function refreshPrices(){
    const box=$('priceList'); if(!box)return;
    const [s,z,p]=await Promise.all([
      db.from('services').select('id,name,active,sort_order').order('sort_order').order('name'),
      db.from('motor_sizes').select('id,name,active,sort_order').order('sort_order').order('name'),
      db.from('service_prices').select('id,service_id,motor_size_id,price,active').order('created_at')
    ]);
    if(s.error)throw s.error;if(z.error)throw z.error;if(p.error)throw p.error;
    const sm=new Map((s.data||[]).map(x=>[x.id,x]));
    const zm=new Map((z.data||[]).map(x=>[x.id,x]));
    const groups=new Map();
    for(const row of (p.data||[])){
      const size=zm.get(row.motor_size_id); const key=row.motor_size_id;
      if(!groups.has(key))groups.set(key,{name:size?.name||'Size',order:size?.sort_order??999,rows:[]});
      groups.get(key).rows.push({...row,service:sm.get(row.service_id)});
    }
    const html=[...groups.values()].sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name)).map(g=>`<div class="pricecard"><h3>${esc(g.name)}</h3>${g.rows.sort((a,b)=>(a.service?.name||'').localeCompare(b.service?.name||'')).map(r=>`<div class="pricerow"><div><b>${esc(r.service?.name||'Layanan')}</b><div class="muted">${r.service?.active===false?'Layanan nonaktif • ':''}${r.active?'Harga aktif':'Harga nonaktif'}</div></div><div style="text-align:right"><strong>${money(r.price)}</strong><br><button class="btn small" type="button" data-hot-price="edit" data-id="${r.id}">Edit harga</button><button class="btn gray small" type="button" data-hot-price="toggle" data-id="${r.id}">${r.active?'Nonaktifkan':'Aktifkan'}</button></div></div>`).join('')}</div>`).join('');
    box.innerHTML=html||'<div class="muted">Belum ada harga.</div>';
    box.classList.remove('loading');
  }

  async function syncAdminView(){await refreshServices();await refreshPrices()}

  async function saveServiceHot(){
    const id=$('serviceId')?.value||null,name=$('serviceName')?.value.trim(),slug=$('serviceSlug')?.value.trim();
    if(!name||!slug)return toast('Nama dan slug wajib diisi');
    const {error}=await db.rpc('admin_save_service',{p_id:id||null,p_name:name,p_slug:slug,p_description:$('serviceDesc')?.value.trim()||null,p_result_url:$('serviceUrl')?.value.trim()||null,p_image_url:$('serviceImage')?.value.trim()||null,p_sort_order:Number($('serviceSort')?.value)||0,p_active:$('serviceActive')?.checked!==false});
    if(error)throw error;
    toast(id?'Layanan berhasil diubah':'Layanan berhasil ditambahkan');$('serviceEditor')?.classList.add('hidden');await syncAdminView();
  }
  async function toggleServiceHot(id){
    const q=await db.from('services').select('id,active,name').eq('id',id).single();if(q.error)throw q.error;
    const r=await db.rpc('admin_set_service_active',{p_service_id:id,p_active:!q.data.active});if(r.error)throw r.error;
    toast(q.data.active?'Layanan dinonaktifkan':'Layanan diaktifkan');await syncAdminView();
  }
  async function deleteServiceHot(id){
    const q=await db.from('services').select('name').eq('id',id).single();if(q.error)throw q.error;
    if(!confirm('Hapus layanan "'+q.data.name+'"?'))return;
    const r=await db.rpc('admin_delete_service',{p_service_id:id});if(r.error)throw r.error;
    toast('Layanan dihapus');await syncAdminView();
  }
  async function savePriceHot(){
    const id=$('priceId')?.value||null,service_id=$('priceService')?.value,motor_size_id=$('priceSize')?.value,price=Number($('priceValue')?.value),active=$('priceActive')?.checked!==false;
    if(!service_id||!motor_size_id||!Number.isFinite(price)||price<0)return toast('Treatment, size, dan harga wajib benar');
    const r=await db.rpc('admin_save_service_price',{p_id:id||null,p_service_id:service_id,p_motor_size_id:motor_size_id,p_price:price,p_active:active});if(r.error)throw r.error;
    toast('Harga tersimpan');$('priceEditor')?.classList.add('hidden');await refreshPrices();
  }
  async function togglePriceHot(id){
    const q=await db.from('service_prices').select('id,service_id,motor_size_id,price,active').eq('id',id).single();if(q.error)throw q.error;
    const r=await db.rpc('admin_save_service_price',{p_id:id,p_service_id:q.data.service_id,p_motor_size_id:q.data.motor_size_id,p_price:q.data.price,p_active:!q.data.active});if(r.error)throw r.error;
    toast(q.data.active?'Harga dinonaktifkan':'Harga diaktifkan');await refreshPrices();
  }
  function interceptServiceActions(root){
    if(!root)return;
    root.addEventListener('click',e=>{
      const b=e.target.closest('[data-sa],[data-s]');if(!b||!root.contains(b))return;
      const action=b.dataset.sa||b.dataset.s,id=b.dataset.id;
      if(action==='toggle'){e.preventDefault();e.stopImmediatePropagation();toggleServiceHot(id).catch(x=>toast(x.message))}
      else if(action==='delete'){e.preventDefault();e.stopImmediatePropagation();deleteServiceHot(id).catch(x=>toast(x.message))}
      // Edit is not intercepted; the dashboard's normal edit handler runs.
    },true);
  }
  function init(){
    if(!window.supabase?.createClient)return;
    db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    interceptServiceActions($('serviceList'));
    const saveService=$('saveService');if(saveService)saveService.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();saveServiceHot().catch(x=>toast(x.message))},true);
    const priceList=$('priceList');if(priceList)priceList.addEventListener('click',e=>{
      const b=e.target.closest('[data-hot-price]');if(!b||!priceList.contains(b))return;e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.id;
      if(b.dataset.hotPrice==='toggle')return togglePriceHot(id).catch(x=>toast(x.message));
      db.from('service_prices').select('id,service_id,motor_size_id,price,active').eq('id',id).single().then(q=>{
        if(q.error)throw q.error;$('priceId').value=q.data.id;$('priceService').value=q.data.service_id;$('priceSize').value=q.data.motor_size_id;$('priceValue').value=q.data.price;$('priceActive').checked=q.data.active!==false;$('priceEditor').classList.remove('hidden');$('priceEditor').scrollIntoView({behavior:'smooth'});
      }).catch(x=>toast(x.message));
    },true);
    const savePrice=$('savePrice');if(savePrice)savePrice.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();savePriceHot().catch(x=>toast(x.message))},true);
    const tabs=$('tabs');if(tabs)tabs.addEventListener('click',e=>{const b=e.target.closest('.tab');if(b?.dataset.tab==='prices')setTimeout(()=>refreshPrices().catch(x=>toast(x.message)),0)},true);
    Promise.all([refreshServices(),refreshPrices()]).catch(()=>{});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
