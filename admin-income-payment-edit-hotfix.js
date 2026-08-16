(()=>{
'use strict';
const SUPABASE_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const SUPABASE_KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
function boot(){
  if(!window.supabase?.createClient)return setTimeout(boot,100);
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
  const norm=v=>String(v??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  let editId=null,saving=false;
  function toast(msg){const t=$('toast');if(t){t.textContent=msg;t.classList.remove('hidden');clearTimeout(window.__tmdIncomeToast);window.__tmdIncomeToast=setTimeout(()=>t.classList.add('hidden'),2600)}else window.alert(msg)}
  function ensurePaymentField(){
    const time=$('incomeTime');if(!time?.parentElement)return false;
    let select=$('incomePaymentMethod');
    if(!select){
      const wrap=document.createElement('div');wrap.dataset.incomePaymentWrap='1';
      wrap.innerHTML='<label>Metode pembayaran</label><select id="incomePaymentMethod" class="input"><option value="Tunai">Tunai</option><option value="Transfer Bank">Transfer Bank</option><option value="QRIS">QRIS</option><option value="Debit/Kartu">Debit/Kartu</option><option value="E-Wallet">E-Wallet</option><option value="Lainnya">Lainnya</option></select>';
      time.parentElement.insertAdjacentElement('afterend',wrap);return true;
    }
    const label=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()==='Metode pembayaran');
    if(label&&label.parentElement!==select.parentElement){
      const wrap=document.createElement('div');wrap.dataset.incomePaymentWrap='1';
      label.remove();select.remove();wrap.append(label,select);time.parentElement.insertAdjacentElement('afterend',wrap);
    }
    return true;
  }
  async function findMotor(){
    const q=norm($('incomeMotorSearch')?.value);if(!q)return null;
    const r=await db.from('motor_catalog').select('id,brand,model,motor_size_id,active,sort_order,motor_sizes(name)').eq('active',true).limit(1000);
    if(r.error)throw r.error;const rows=r.data||[];
    return rows.find(m=>norm(`${m.brand} ${m.model}`)===q)||rows.find(m=>norm(`${m.brand} ${m.model}`).includes(q))||null;
  }
  async function loadTreatments(sizeId,selectedIds){
    const box=$('incomeTreatments');if(!box)return;
    if(!sizeId){box.innerHTML='<div class="empty">Motor ini belum punya size katalog.</div>';return}
    const ids=[...(selectedIds||[])];const r=await db.from('service_prices').select('id,service_id,motor_size_id,price,active,services(name,active,sort_order)').eq('motor_size_id',sizeId).eq('active',true);
    if(r.error)throw r.error;
    const rows=(r.data||[]).filter(x=>x.services?.active).sort((a,b)=>(a.services?.sort_order??0)-(b.services?.sort_order??0)||(a.services?.name||'').localeCompare(b.services?.name||''));
    box.innerHTML=rows.length?rows.map(p=>`<label class="income-item"><input type="checkbox" data-income-price="${p.id}" data-service-id="${p.service_id}" data-price="${p.price}" ${ids.includes(p.id)?'checked':''}><b>${esc(p.services.name)}</b><span style="float:right;color:#0757d9;font-weight:900">${money(p.price)}</span></label>`).join(''):'<div class="empty">Belum ada pricelist aktif untuk size motor ini.</div>';
    updateTotal();
  }
  function updateTotal(){let total=0;document.querySelectorAll('[data-income-price]:checked').forEach(x=>total+=Number(x.dataset.price)||0);if($('incomeTotal'))$('incomeTotal').textContent=money(total)}
  function setFormDateTime(iso){const d=iso?new Date(iso):new Date();const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).reduce((o,x)=>(o[x.type]=x.value,o),{});$('incomeDate').value=`${p.year}-${p.month}-${p.day}`;$('incomeTime').value=`${p.hour}:${p.minute}`}
  function setMotorForm(m){if(!m)return;$('incomeMotorSearch').value=`${m.brand} ${m.model}`;$('incomeMotorResults').classList.add('hidden');$('incomeSelectedMotor').textContent=`Motor dipilih: ${m.brand} ${m.model} — ${m.motor_sizes?.name||'-'}`;$('incomeSelectedMotor').classList.remove('hidden');$('incomeMotorSize').innerHTML=`<option value="${m.motor_size_id||''}">${esc(m.motor_sizes?.name||'Size tidak tersedia')}</option>`;$('incomeMotorSize').disabled=true}
  function setMode(edit){const title=$('incomeEditor')?.querySelector('h3');if(title)title.textContent=edit?'Edit catatan pemasukan':'Catat pemasukan treatment';if($('saveIncome'))$('saveIncome').textContent=edit?'Simpan Perubahan':'Simpan Pemasukan'}
  function decorateRecords(){const list=$('incomeList');if(!list)return;list.querySelectorAll('.record').forEach(record=>{const del=record.querySelector('[data-income-delete]');if(!del||record.querySelector('[data-income-edit]'))return;const b=document.createElement('button');b.className='btn small';b.type='button';b.dataset.incomeEdit=del.dataset.incomeDelete;b.textContent='Edit catatan';del.parentElement.insertBefore(b,del)})}
  async function fetchRecord(id){const r=await db.from('income_records').select('id,customer_name,phone,motor_catalog_id,motor_brand,motor_model,motor_size_id,motor_size_name,total_amount,notes,paid_at,payment_method,income_items(id,service_id,service_price_id,motor_size_id,treatment_name,price)').eq('id',id).maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('Catatan pemasukan tidak ditemukan');return r.data}
  async function openEdit(id){editId=id;const rec=await fetchRecord(id);ensurePaymentField();$('incomeCustomer').value=rec.customer_name||'';$('incomePhone').value=rec.phone||'';$('incomeNotes').value=rec.notes||'';$('incomePaymentMethod').value=rec.payment_method||'Tunai';setFormDateTime(rec.paid_at);const motor=rec.motor_catalog_id?await db.from('motor_catalog').select('id,brand,model,motor_size_id,active,motor_sizes(name)').eq('id',rec.motor_catalog_id).maybeSingle():{data:null,error:null};if(motor.error)throw motor.error;setMotorForm(motor.data||{id:rec.motor_catalog_id,brand:rec.motor_brand,model:rec.motor_model,motor_size_id:rec.motor_size_id,motor_sizes:{name:rec.motor_size_name}});await loadTreatments(rec.motor_size_id,(rec.income_items||[]).map(x=>x.service_price_id).filter(Boolean));setMode(true);$('incomeEditor').classList.remove('hidden');$('incomeEditor').scrollIntoView({behavior:'smooth'})}
  function resetNew(){editId=null;setMode(false);if($('incomePaymentMethod'))$('incomePaymentMethod').value='Tunai'}
  function replaceSaveButton(){
    const old=$('saveIncome');if(!old||old.dataset.tmdReplaced)return old;
    const fresh=old.cloneNode(true);fresh.dataset.tmdReplaced='1';old.replaceWith(fresh);return fresh;
  }
  async function save(e){if(e){e.preventDefault();e.stopImmediatePropagation()}if(saving)return;saving=true;try{
      const motor=await findMotor();if(!motor)return toast('Pilih motor dari katalog dulu');
      const customer=$('incomeCustomer').value.trim();if(!customer)return toast('Nama customer wajib diisi');
      if(!motor.motor_size_id)return toast('Motor belum punya size');
      const items=[...document.querySelectorAll('[data-income-price]:checked')].map(x=>({service_id:x.dataset.serviceId,service_price_id:x.dataset.incomePrice}));if(!items.length)return toast('Pilih minimal satu treatment');
      const date=$('incomeDate').value,time=$('incomeTime').value;if(!date||!time)return toast('Tanggal dan jam pemasukan wajib diisi');
      const payment=$('incomePaymentMethod')?.value||'Tunai';const paidAt=new Date(`${date}T${time}:00+07:00`).toISOString();
      const payload={p_customer_name:customer,p_phone:$('incomePhone').value.trim()||null,p_motor_catalog_id:motor.id,p_motor_brand:motor.brand,p_motor_model:motor.model,p_motor_size_id:motor.motor_size_id,p_items:items,p_notes:$('incomeNotes').value.trim()||null,p_paid_at:paidAt,p_payment_method:payment};
      const r=await db.rpc(editId?'admin_update_income_record':'admin_create_income_record',editId?{p_income_id:editId,...payload}:payload);if(r.error)throw r.error;
      toast(editId?'Catatan pemasukan diperbarui':'Pemasukan berhasil dicatat');$('incomeEditor').classList.add('hidden');resetNew();const refresh=$('refreshIncome');if(refresh)refresh.click();
    }catch(e2){console.error('[TMD income payment/edit]',e2);toast(e2?.message||'Pemasukan gagal disimpan')}finally{saving=false}}
  function addPaymentText(){
    document.querySelectorAll('.record').forEach(record=>{
      const texts=[...record.querySelectorAll('[data-income-payment-text]')];
      texts.slice(1).forEach(x=>x.remove());
      if(texts.length||record.dataset.incomePaymentPending)return;
      const del=record.querySelector('[data-income-delete]');if(!del)return;
      record.dataset.incomePaymentPending='1';const id=del.dataset.incomeDelete;
      db.from('income_records').select('payment_method').eq('id',id).maybeSingle().then(r=>{
        delete record.dataset.incomePaymentPending;if(r.error||!r.data)return;
        const top=record.querySelector('.record-top > div');if(!top)return;
        [...top.querySelectorAll('[data-income-payment-text]')].slice(1).forEach(x=>x.remove());
        if(top.querySelector('[data-income-payment-text]'))return;
        const el=document.createElement('div');el.className='muted';el.dataset.incomePaymentText='1';el.textContent=`Metode pembayaran: ${r.data.payment_method||'Tunai'}`;top.appendChild(el);
      }).catch(()=>{delete record.dataset.incomePaymentPending});
    });
  }
  function patchRender(){const list=$('incomeList');if(!list||list.dataset.incomePaymentPatch)return;list.dataset.incomePaymentPatch='1';new MutationObserver(()=>{decorateRecords();addPaymentText()}).observe(list,{childList:true,subtree:true});decorateRecords();addPaymentText()}
  function hook(){if(!$('incomeEditor')||!$('incomeList')||!$('saveIncome')||!$('addIncome'))return setTimeout(hook,100);ensurePaymentField();const saveBtn=replaceSaveButton();if(!saveBtn)return;saveBtn.addEventListener('click',save,true);$('addIncome').addEventListener('click',()=>{resetNew();ensurePaymentField()},true);$('cancelIncome').addEventListener('click',resetNew,true);$('incomeTreatments').addEventListener('change',updateTotal,true);$('incomeList').addEventListener('click',e=>{const b=e.target.closest('[data-income-edit]');if(b){e.preventDefault();e.stopImmediatePropagation();openEdit(b.dataset.incomeEdit).catch(err=>toast(err?.message||'Catatan gagal dimuat'))}},true);patchRender()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
}
boot();
})();
