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
  function normalizeMotorSearch(v){
    return String(v??'').toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  }
  async function searchIncomeMotor(){
    const input=$('incomeMotorSearch');if(!input)return;
    const q=input.value.trim();
    clearTimeout(incomeSearchTimer);
    incomeSearchTimer=setTimeout(async()=>{
      if(q.length<2){$('incomeMotorResults').classList.add('hidden');return}
      const needle=normalizeMotorSearch(q);
      const r=await db.from('motor_catalog').select('id,brand,model,motor_size_id,active,sort_order,year_start,year_end,notes,motor_sizes(name)').eq('active',true).order('brand').order('sort_order').order('model').limit(1000);
      if(r.error)throw r.error;
      const found=(r.data||[]).filter(m=>normalizeMotorSearch(`${m.brand} ${m.model}`).includes(needle));
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
  function portfolioPublicUrl(path){return path?`${SUPABASE_URL}/storage/v1/object/public/tmd-portfolio/${String(path).split('/').map(encodeURIComponent).join('/')}`:''}
  function portfolioSafeName(v){return String(v||'file').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-120)||'file'}
  function portfolioToast(msg){const t=$('toast');if(t){t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2400)}}
  function portfolioStyles(){if($('tmdPortfolioAdminStyles'))return;const s=document.createElement('style');s.id='tmdPortfolioAdminStyles';s.textContent=`
    .tmd-portfolio-admin-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0 14px}.tmd-portfolio-admin-toolbar select{flex:1 1 260px;margin:0}.tmd-portfolio-admin-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tmd-portfolio-admin-card{border:1px solid #e5e7eb;border-radius:15px;overflow:hidden;background:#fff}.tmd-portfolio-admin-preview{aspect-ratio:4/3;background:#eef3fb;overflow:hidden;position:relative}.tmd-portfolio-admin-preview img,.tmd-portfolio-admin-preview video{width:100%;height:100%;object-fit:cover;display:block}.tmd-portfolio-admin-ba{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:100%;height:100%}.tmd-portfolio-admin-ba>div{position:relative;overflow:hidden}.tmd-portfolio-admin-ba img{width:100%;height:100%;object-fit:cover}.tmd-portfolio-admin-label{position:absolute;left:7px;top:7px;background:#111827cc;color:#fff;border-radius:7px;padding:4px 7px;font-size:10px;font-weight:800}.tmd-portfolio-admin-info{padding:11px}.tmd-portfolio-admin-info strong{display:block;color:#0757d9}.tmd-portfolio-admin-info .muted{margin-top:4px}.tmd-portfolio-admin-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.tmd-portfolio-file-note{font-size:12px;color:#6b7280;line-height:1.45;margin:-5px 0 10px}.tmd-portfolio-current{font-size:12px;color:#6b7280;background:#f4f7ff;border-radius:10px;padding:9px;margin:0 0 12px}.tmd-portfolio-mode-fields.hidden{display:none}.tmd-portfolio-admin-card.is-hidden{opacity:.62}
    @media(max-width:760px){.tmd-portfolio-admin-list{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}
  async function portfolioServices(){const r=await db.from('services').select('id,name,active,sort_order').order('sort_order').order('name');if(r.error)throw r.error;return r.data||[]}
  function ensurePortfolioUi(){
    portfolioStyles();
    const tabs=$('tabs'),settingsTab=tabs?.querySelector('[data-tab="settings"]');
    if(tabs&&!tabs.querySelector('[data-tab="portfolio"]')){const b=document.createElement('button');b.className='tab';b.dataset.tab='portfolio';b.type='button';b.textContent='Hasil Pekerjaan';settingsTab?tabs.insertBefore(b,settingsTab):tabs.appendChild(b)}
    if($('portfolio'))return;
    const main=document.querySelector('main.wrap');if(!main)return;
    const sec=document.createElement('section');sec.id='portfolio';sec.className='tabpage hidden';sec.innerHTML=`<div class="panel"><div class="head"><h2>Hasil Pekerjaan</h2><button id="addPortfolio" class="btn">+ Hasil</button></div><p class="muted">Kelola foto, video, dan before/after yang tampil di website customer.</p><div class="tmd-portfolio-admin-toolbar"><select id="portfolioFilterService" class="input"><option value="">Semua layanan</option></select></div><div id="portfolioList" class="tmd-portfolio-admin-list"><div class="loading">Memuat...</div></div><div id="portfolioEditor" class="panel editor hidden"><h3 id="portfolioTitle">Tambah hasil pekerjaan</h3><input type="hidden" id="portfolioId"><label>Layanan</label><select id="portfolioService" class="input"></select><label>Mode hasil</label><select id="portfolioDisplayMode" class="input"><option value="standard">Media biasa</option><option value="before_after">Before / After</option></select><div id="portfolioStandardFields" class="tmd-portfolio-mode-fields"><label>Jenis media</label><select id="portfolioMediaType" class="input"><option value="photo">Foto</option><option value="video">Video</option></select><label>File</label><input id="portfolioFiles" class="input" type="file" multiple accept="image/*"><div class="tmd-portfolio-file-note">Bisa pilih beberapa foto/video sekaligus. File akan disimpan sebagai hasil terpisah.</div></div><div id="portfolioBeforeAfterFields" class="tmd-portfolio-mode-fields hidden"><label>Foto BEFORE</label><input id="portfolioBefore" class="input" type="file" accept="image/*"><label>Foto AFTER</label><input id="portfolioAfter" class="input" type="file" accept="image/*"></div><div id="portfolioCurrentFile" class="tmd-portfolio-current hidden"></div><label>Judul</label><input id="portfolioName" class="input" placeholder="Contoh: Glossin Pro — NMAX"><label>Deskripsi <span class="muted">(opsional)</span></label><textarea id="portfolioDesc" class="input" rows="3" placeholder="Contoh: Hasil polishing body 3x menyeluruh."></textarea><label><input id="portfolioActive" type="checkbox" checked> Tampilkan di website</label><div class="actions"><button id="savePortfolio" class="btn">Simpan</button><button id="cancelPortfolio" class="btn gray">Batal</button></div></div></div>`;const settings=document.getElementById('settings');settings?settings.insertAdjacentElement('afterend',sec):main.appendChild(sec);portfolioLoadServices().catch(err=>console.error('[TMD portfolio]',err))
  }
  async function portfolioLoadServices(){const rows=await portfolioServices();const html='<option value="">Pilih layanan...</option>'+rows.map(s=>`<option value="${s.id}">${esc(s.name)}${s.active?'':' (Nonaktif)'}</option>`).join('');if($('portfolioService'))$('portfolioService').innerHTML=html;if($('portfolioFilterService'))$('portfolioFilterService').innerHTML='<option value="">Semua layanan</option>'+rows.filter(s=>s.active).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');return rows}
  let portfolioRows=[];
  async function loadPortfolio(){ensurePortfolioUi();if(!$('portfolioList'))return;await portfolioLoadServices();const filter=$('portfolioFilterService')?.value||'';let q=db.from('portfolio_media').select('id,service_id,media_type,display_mode,title,description,storage_path,before_path,after_path,active,sort_order,created_at,services(name)').order('sort_order').order('created_at',{ascending:false});if(filter)q=q.eq('service_id',filter);const r=await q;if(r.error)throw r.error;portfolioRows=r.data||[];$('portfolioList').innerHTML=portfolioRows.length?portfolioRows.map(x=>{const preview=x.display_mode==='before_after'?`<div class="tmd-portfolio-admin-ba"><div><img src="${esc(portfolioPublicUrl(x.before_path))}" alt="before"><span class="tmd-portfolio-admin-label">BEFORE</span></div><div><img src="${esc(portfolioPublicUrl(x.after_path))}" alt="after"><span class="tmd-portfolio-admin-label">AFTER</span></div></div>`:x.media_type==='video'?`<video src="${esc(portfolioPublicUrl(x.storage_path))}" muted playsinline preload="metadata"></video>`:`<img src="${esc(portfolioPublicUrl(x.storage_path))}" alt="${esc(x.title)}" loading="lazy">`;return `<article class="tmd-portfolio-admin-card${x.active?'':' is-hidden'}"><div class="tmd-portfolio-admin-preview">${preview}</div><div class="tmd-portfolio-admin-info"><strong>${esc(x.title)}</strong><div class="muted">${esc(x.services?.name||'Layanan')} · ${x.display_mode==='before_after'?'Before / After':x.media_type==='video'?'Video':'Foto'} · ${x.active?'Tampil':'Disembunyikan'}</div>${x.description?`<div class="muted">${esc(x.description)}</div>`:''}<div class="tmd-portfolio-admin-actions"><button class="btn small" data-portfolio="edit" data-id="${x.id}">Edit</button><button class="btn gray small" data-portfolio="toggle" data-id="${x.id}">${x.active?'Sembunyikan':'Tampilkan'}</button><button class="btn danger small" data-portfolio="delete" data-id="${x.id}">Hapus</button></div></div></article>`}).join(''):'<div class="muted" style="grid-column:1/-1">Belum ada hasil pekerjaan.</div>'}
  function syncPortfolioFields(){const mode=$('portfolioDisplayMode')?.value||'standard',type=$('portfolioMediaType')?.value||'photo',standard=$('portfolioStandardFields'),ba=$('portfolioBeforeAfterFields'),files=$('portfolioFiles');if(standard)standard.classList.toggle('hidden',mode!=='standard');if(ba)ba.classList.toggle('hidden',mode!=='before_after');if(files&&mode==='standard')files.accept=type==='video'?'video/mp4,video/webm,video/*':'image/jpeg,image/png,image/webp,image/*'}
  function clearPortfolioForm(){if(!$('portfolioEditor'))return;$('portfolioId').value='';$('portfolioTitle').textContent='Tambah hasil pekerjaan';$('portfolioService').value='';$('portfolioDisplayMode').value='standard';$('portfolioMediaType').value='photo';$('portfolioFiles').value='';$('portfolioBefore').value='';$('portfolioAfter').value='';$('portfolioCurrentFile').textContent='';$('portfolioCurrentFile').classList.add('hidden');$('portfolioName').value='';$('portfolioDesc').value='';$('portfolioActive').checked=true;$('portfolioMediaType').disabled=false;$('portfolioDisplayMode').disabled=false;$('portfolioFiles').disabled=false;$('portfolioBefore').disabled=false;$('portfolioAfter').disabled=false;syncPortfolioFields();$('portfolioEditor').classList.remove('hidden');$('portfolioEditor').scrollIntoView({behavior:'smooth'})}
  function openPortfolio(id){const x=portfolioRows.find(p=>p.id===id);if(!x)return;$('portfolioId').value=x.id;$('portfolioTitle').textContent='Edit hasil pekerjaan';$('portfolioService').value=x.service_id;$('portfolioDisplayMode').value=x.display_mode;$('portfolioMediaType').value=x.media_type;$('portfolioName').value=x.title||'';$('portfolioDesc').value=x.description||'';$('portfolioActive').checked=x.active!==false;$('portfolioMediaType').disabled=true;$('portfolioDisplayMode').disabled=true;$('portfolioFiles').value='';$('portfolioBefore').value='';$('portfolioAfter').value='';$('portfolioFiles').disabled=true;$('portfolioBefore').disabled=true;$('portfolioAfter').disabled=true;$('portfolioCurrentFile').textContent=x.display_mode==='before_after'?'File BEFORE dan AFTER tersimpan.':'File '+(x.media_type==='video'?'video':'foto')+' tersimpan.';$('portfolioCurrentFile').classList.remove('hidden');syncPortfolioFields();$('portfolioEditor').classList.remove('hidden');$('portfolioEditor').scrollIntoView({behavior:'smooth'})}
  async function uploadPortfolioFile(file,serviceId,label){if(!file)throw new Error(`${label} wajib dipilih`);const path=`portfolio/${serviceId}/${Date.now()}-${crypto.randomUUID()}-${portfolioSafeName(file.name)}`;const r=await db.storage.from('tmd-portfolio').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type||undefined});if(r.error)throw r.error;return path}
  async function savePortfolio(){const id=$('portfolioId').value||null,serviceId=$('portfolioService').value,title=$('portfolioName').value.trim(),desc=$('portfolioDesc').value.trim()||null,active=$('portfolioActive').checked;if(!serviceId||!title)return window.alert('Layanan dan judul wajib diisi');if(id){const r=await db.from('portfolio_media').update({service_id:serviceId,title,description:desc,active,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;portfolioToast('Hasil pekerjaan diperbarui');$('portfolioEditor').classList.add('hidden');await loadPortfolio();return}const mode=$('portfolioDisplayMode').value,type=$('portfolioMediaType').value,uploaded=[];try{if(mode==='before_after'){const before=$('portfolioBefore').files[0],after=$('portfolioAfter').files[0];if(!before||!after)return window.alert('Foto BEFORE dan AFTER wajib dipilih');if(!before.type.startsWith('image/')||!after.type.startsWith('image/'))return window.alert('Before / After hanya boleh foto');const beforePath=await uploadPortfolioFile(before,serviceId,'Foto BEFORE');uploaded.push(beforePath);const afterPath=await uploadPortfolioFile(after,serviceId,'Foto AFTER');uploaded.push(afterPath);const r=await db.from('portfolio_media').insert({service_id:serviceId,media_type:'photo',display_mode:'before_after',title,description:desc,before_path:beforePath,after_path:afterPath,mime_type:'image/*',file_size:(before.size||0)+(after.size||0),active,sort_order:0});if(r.error)throw r.error}else{const files=[...$('portfolioFiles').files];if(!files.length)return window.alert('Pilih minimal satu file');for(const file of files){if(type==='photo'&&!file.type.startsWith('image/'))throw new Error('Mode Foto hanya menerima file gambar');if(type==='video'&&!file.type.startsWith('video/'))throw new Error('Mode Video hanya menerima file video');const path=await uploadPortfolioFile(file,serviceId,'File media');uploaded.push(path);const r=await db.from('portfolio_media').insert({service_id:serviceId,media_type:type,display_mode:'standard',title:files.length>1?`${title} — ${file.name}`:title,description:desc,storage_path:path,mime_type:file.type||null,file_size:file.size||null,active,sort_order:0});if(r.error)throw r.error}}portfolioToast('Hasil pekerjaan berhasil ditambahkan');$('portfolioEditor').classList.add('hidden');await loadPortfolio()}catch(e){if(uploaded.length)await db.storage.from('tmd-portfolio').remove(uploaded).catch(()=>{});throw e}}
  async function deletePortfolio(id){const x=portfolioRows.find(p=>p.id===id);if(!x||!confirm(`Hapus hasil "${x.title}"?`))return;const paths=[x.storage_path,x.before_path,x.after_path].filter(Boolean);if(paths.length)await db.storage.from('tmd-portfolio').remove(paths);const r=await db.from('portfolio_media').delete().eq('id',id);if(r.error)throw r.error;portfolioToast('Hasil pekerjaan dihapus');await loadPortfolio()}
  async function togglePortfolio(id){const x=portfolioRows.find(p=>p.id===id);if(!x)return;const r=await db.from('portfolio_media').update({active:!x.active,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;portfolioToast(x.active?'Hasil disembunyikan':'Hasil ditampilkan');await loadPortfolio()}
  function portfolioHook(){
    ensurePortfolioUi();
    const tab=$('tabs')?.querySelector('[data-tab="portfolio"]');if(tab&&!tab.dataset.portfolioBound){tab.dataset.portfolioBound='1';tab.addEventListener('click',()=>setTimeout(()=>loadPortfolio().catch(e=>window.alert('Portfolio gagal dimuat: '+(e?.message||e))),0),true)}
    if($('addPortfolio')&&!$('addPortfolio').dataset.bound){$('addPortfolio').dataset.bound='1';$('addPortfolio').onclick=clearPortfolioForm}
    if($('cancelPortfolio')&&!$('cancelPortfolio').dataset.bound){$('cancelPortfolio').dataset.bound='1';$('cancelPortfolio').onclick=()=>$('portfolioEditor').classList.add('hidden')}
    if($('portfolioDisplayMode')&&!$('portfolioDisplayMode').dataset.bound){$('portfolioDisplayMode').dataset.bound='1';$('portfolioDisplayMode').onchange=syncPortfolioFields}
    if($('portfolioMediaType')&&!$('portfolioMediaType').dataset.bound){$('portfolioMediaType').dataset.bound='1';$('portfolioMediaType').onchange=syncPortfolioFields}
    if($('portfolioFilterService')&&!$('portfolioFilterService').dataset.bound){$('portfolioFilterService').dataset.bound='1';$('portfolioFilterService').onchange=()=>loadPortfolio().catch(e=>window.alert('Filter gagal: '+(e?.message||e)))}
    if($('savePortfolio')&&!$('savePortfolio').dataset.bound){$('savePortfolio').dataset.bound='1';$('savePortfolio').onclick=()=>savePortfolio().catch(e=>window.alert('Hasil pekerjaan gagal disimpan: '+(e?.message||e)))}
    if($('portfolioList')&&!$('portfolioList').dataset.bound){$('portfolioList').dataset.bound='1';$('portfolioList').onclick=e=>{const b=e.target.closest('[data-portfolio]');if(!b)return;const id=b.dataset.id;if(b.dataset.portfolio==='edit')openPortfolio(id);if(b.dataset.portfolio==='toggle')togglePortfolio(id).catch(err=>window.alert('Status gagal diubah: '+(err?.message||err)));if(b.dataset.portfolio==='delete')deletePortfolio(id).catch(err=>window.alert('Hapus gagal: '+(err?.message||err)))}}
    syncPortfolioFields();
  }
  function startPortfolioHook(){ensurePortfolioUi();portfolioHook();loadPortfolio().catch(err=>console.error('[TMD portfolio]',err));setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('portfolio')&&!document.getElementById('portfolio').classList.contains('hidden'))loadPortfolio().catch(()=>{})},10000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
  startIncomeHook();
  startPortfolioHook();
}
boot();
})();
