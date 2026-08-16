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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
}
boot();
})();
