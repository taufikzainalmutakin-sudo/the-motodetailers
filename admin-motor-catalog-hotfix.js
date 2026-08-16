(()=>{
'use strict';
const SUPABASE_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const SUPABASE_KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
function boot(){
  if(!window.supabase?.createClient) return setTimeout(boot,100);
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=id=>document.getElementById(id);
  let editingId=null, loadingEdit=null;
  function injectFields(){
    const editor=$('motorEditor'),active=$('motorActive')?.closest('label');
    if(!editor||!active) return false;
    if($('motorCatalogExtraFields')) return true;
    const wrap=document.createElement('div');wrap.id='motorCatalogExtraFields';wrap.className='grid';
    wrap.innerHTML='<div><label>Tahun mulai</label><input id="motorYearStart" class="input" type="number" min="1900" max="2100" placeholder="Contoh: 2020"></div><div><label>Tahun akhir</label><input id="motorYearEnd" class="input" type="number" min="1900" max="2100" placeholder="Kosongkan jika masih berjalan"></div><div style="grid-column:1/-1"><label>Catatan</label><textarea id="motorNotes" class="input" rows="3" placeholder="Catatan khusus motor, varian, tahun, atau pengecualian..."></textarea></div>';
    active.parentNode.insertBefore(wrap,active);return true;
  }
  function clearExtra(){injectFields();if($('motorYearStart'))$('motorYearStart').value='';if($('motorYearEnd'))$('motorYearEnd').value='';if($('motorNotes'))$('motorNotes').value='';}
  async function loadExtra(id){injectFields();if(!id){clearExtra();return;}const r=await db.from('motor_catalog').select('year_start,year_end,notes').eq('id',id).maybeSingle();if(r.error)throw r.error;if($('motorYearStart'))$('motorYearStart').value=r.data?.year_start??'';if($('motorYearEnd'))$('motorYearEnd').value=r.data?.year_end??'';if($('motorNotes'))$('motorNotes').value=r.data?.notes??'';}
  function numOrNull(v){v=String(v??'').trim();if(!v)return null;const n=Number(v);return Number.isInteger(n)?n:null;}
  async function saveMotor(){
    injectFields();if(loadingEdit)await loadingEdit.catch(()=>{});
    const id=editingId,brand=$('motorBrand')?.value.trim()||'',model=$('motorModel')?.value.trim()||'',motor_size_id=$('motorSize')?.value||null,sort_order=Number($('motorSort')?.value)||0,active=$('motorActive')?.checked!==false,year_start=numOrNull($('motorYearStart')?.value),year_end=numOrNull($('motorYearEnd')?.value),notes=$('motorNotes')?.value.trim()||null;
    if(!brand||!model)return window.alert('Brand dan model wajib diisi');
    if(year_start!==null&&year_end!==null&&year_end<year_start)return window.alert('Tahun akhir tidak boleh lebih kecil dari tahun mulai');
    const row={brand,model,motor_size_id,year_start,year_end,notes,sort_order,active};
    const r=id?await db.from('motor_catalog').update(row).eq('id',id):await db.from('motor_catalog').insert(row);if(r.error)throw r.error;
    const toast=$('toast');if(toast){toast.textContent=id?'Data motor diperbarui':'Motor ditambahkan';toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),2200)}
    $('motorEditor')?.classList.add('hidden');document.querySelector('[data-tab="motors"]')?.click();
  }
  function hook(){
    if(!injectFields())return setTimeout(hook,100);const rows=$('motorRows'),add=$('addMotor'),save=$('saveMotor');if(!rows||!add||!save)return setTimeout(hook,100);
    if(!rows.dataset.catalogHotfix){rows.dataset.catalogHotfix='1';rows.addEventListener('click',e=>{const b=e.target.closest('[data-m="edit"]');if(!b)return;editingId=b.dataset.id||null;loadingEdit=loadExtra(editingId).catch(err=>{console.error('[TMD motor catalog]',err);window.alert('Catatan motor gagal dimuat: '+(err?.message||err))});},true);}
    if(!add.dataset.catalogHotfix){add.dataset.catalogHotfix='1';add.addEventListener('click',()=>{editingId=null;loadingEdit=null;setTimeout(clearExtra,0)},true);}
    if(!save.dataset.catalogHotfix){save.dataset.catalogHotfix='1';save.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();saveMotor().catch(err=>{console.error('[TMD motor catalog]',err);window.alert('Motor gagal disimpan: '+(err?.message||err))});},true);}
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function money(v){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0)}
  let incomeMotor=null;
  let incomeSearchTimer=null;
  function setIncomeSelected(m){
    incomeMotor=m;
    $('incomeMotorSearch').value=`${m.brand} ${m.model}`;
    $('incomeMotorResults').classList.add('hidden');
    $('incomeSelectedMotor').textContent=`Motor dipilih: ${m.brand} ${m.model} — ${m.motor_sizes?.name||'-'}`;
    $('incomeSelectedMotor').classList.remove('hidden');
    $('incomeMotorSize').innerHTML=`<option value="${m.motor_size_id||''}">${esc(m.motor_sizes?.name||'Size tidak tersedia')}</option>`;
    $('incomeMotorSize').disabled=true;
    loadIncomeTreatments(m.motor_size_id).catch(err=>{console.error('[TMD income motor catalog]',err);window.alert('Pricelist motor gagal dimuat: '+(err?.message||err))});
  }
  async function searchIncomeMotor(){
    const input=$('incomeMotorSearch');if(!input)return;
    const q=input.value.trim();
    clearTimeout(incomeSearchTimer);
    incomeSearchTimer=setTimeout(async()=>{
      if(q.length<2){$('incomeMotorResults').classList.add('hidden');return;}
      const r=await db.from('motor_catalog').select('id,brand,model,motor_size_id,active,sort_order,year_start,year_end,notes,motor_sizes(name)').eq('active',true).or(`brand.ilike.%${q}%,model.ilike.%${q}%`).order('brand').order('sort_order').order('model').limit(100);
      if(r.error)throw r.error;
      const found=r.data||[];
      $('incomeMotorResults').innerHTML=found.length?found.map(m=>`<div class="search-result" data-income-motor="${m.id}"><b>${esc(m.brand)} ${esc(m.model)}</b><div class="muted">${esc(m.motor_sizes?.name||'-')}</div></div>`).join(''):'<div class="empty">Motor tidak ditemukan di katalog.</div>';
      $('incomeMotorResults').classList.remove('hidden');
    },120);
  }
  async function loadIncomeTreatments(sizeId){
    if(!sizeId){$('incomeTreatments').innerHTML='<div class="empty">Motor ini belum punya size katalog.</div>';updateIncomeTotal();return;}
    const r=await db.from('service_prices').select('id,service_id,motor_size_id,price,active,services(name,active,sort_order)').eq('motor_size_id',sizeId).eq('active',true);
    if(r.error)throw r.error;
    const rows=(r.data||[]).filter(x=>x.services?.active).sort((a,b)=>(a.services?.sort_order??0)-(b.services?.sort_order??0)||(a.services?.name||'').localeCompare(b.services?.name||''));
    $('incomeTreatments').innerHTML=rows.length?rows.map(p=>`<label class="income-item"><input type="checkbox" data-income-hotfix-price="${p.id}" data-service-id="${p.service_id}" data-price="${p.price}"><b>${esc(p.services.name)}</b><span style="float:right;color:#0757d9;font-weight:900">${money(p.price)}</span></label>`).join(''):'<div class="empty">Belum ada pricelist aktif untuk size motor ini.</div>';
    updateIncomeTotal();
  }
  function updateIncomeTotal(){let total=0;document.querySelectorAll('[data-income-hotfix-price]:checked').forEach(x=>total+=Number(x.dataset.price)||0);$('incomeTotal').textContent=money(total)}
  function resetIncome(){incomeMotor=null;}
  async function saveIncome(){
    if(!incomeMotor)return window.alert('Pilih motor dari katalog dulu');
    const customer=$('incomeCustomer').value.trim();if(!customer)return window.alert('Nama customer wajib diisi');
    const sizeId=incomeMotor.motor_size_id;if(!sizeId)return window.alert('Motor belum punya size');
    const items=[...document.querySelectorAll('[data-income-hotfix-price]:checked')].map(x=>({service_id:x.dataset.serviceId,service_price_id:x.dataset.incomeHotfixPrice}));
    if(!items.length)return window.alert('Pilih minimal satu treatment');
    const date=$('incomeDate').value,time=$('incomeTime').value;if(!date||!time)return window.alert('Tanggal dan jam pemasukan wajib diisi');
    const paidAt=new Date(`${date}T${time}:00+07:00`).toISOString();
    const r=await db.rpc('admin_create_income_record',{p_customer_name:customer,p_phone:$('incomePhone').value.trim()||null,p_motor_catalog_id:incomeMotor.id,p_motor_brand:incomeMotor.brand,p_motor_model:incomeMotor.model,p_motor_size_id:sizeId,p_items:items,p_notes:$('incomeNotes').value.trim()||null,p_paid_at:paidAt});
    if(r.error)throw r.error;
    const toast=$('toast');if(toast){toast.textContent='Pemasukan berhasil dicatat';toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),2600)}
    $('incomeEditor').classList.add('hidden');resetIncome();
    const refresh=$('refreshIncome');if(refresh)refresh.click();
  }
  function incomeHook(){
    const input=$('incomeMotorSearch'),results=$('incomeMotorResults'),treatments=$('incomeTreatments'),save=$('saveIncome'),add=$('addIncome'),cancel=$('cancelIncome');
    if(!input||!results||!treatments||!save||!add||!cancel)return setTimeout(incomeHook,100);
    if(!input.dataset.catalogIncomeHotfix){input.dataset.catalogIncomeHotfix='1';input.addEventListener('input',e=>{e.stopImmediatePropagation();searchIncomeMotor().catch(err=>{console.error('[TMD income motor catalog]',err);window.alert('Pencarian motor gagal: '+(err?.message||err))})},true);}
    if(!results.dataset.catalogIncomeHotfix){results.dataset.catalogIncomeHotfix='1';results.addEventListener('click',async e=>{const b=e.target.closest('[data-income-motor]');if(!b)return;e.stopImmediatePropagation();const r=await db.from('motor_catalog').select('id,brand,model,motor_size_id,active,sort_order,year_start,year_end,notes,motor_sizes(name)').eq('id',b.dataset.incomeMotor).maybeSingle();if(r.error)throw r.error;if(!r.data||r.data.active!==true)return window.alert('Motor tidak aktif atau sudah tidak tersedia di katalog.');setIncomeSelected(r.data)},true);}
    if(!treatments.dataset.catalogIncomeHotfix){treatments.dataset.catalogIncomeHotfix='1';treatments.addEventListener('change',e=>{e.stopImmediatePropagation();updateIncomeTotal()},true);}
    if(!save.dataset.catalogIncomeHotfix){save.dataset.catalogIncomeHotfix='1';save.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();saveIncome().catch(err=>{console.error('[TMD income motor catalog]',err);window.alert('Pemasukan gagal disimpan: '+(err?.message||err))})},true);}
    if(!add.dataset.catalogIncomeHotfix){add.dataset.catalogIncomeHotfix='1';add.addEventListener('click',()=>{resetIncome()},true);}
    if(!cancel.dataset.catalogIncomeHotfix){cancel.dataset.catalogIncomeHotfix='1';cancel.addEventListener('click',()=>{resetIncome()},true);}
  }
  function startIncomeHook(){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',incomeHook,{once:true});else incomeHook();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
  startIncomeHook();
}
boot();
})();
