(()=>{
'use strict';
const SUPABASE_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const SUPABASE_KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
function boot(){
  if(!window.supabase?.createClient)return setTimeout(boot,100);
  const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const list=document.getElementById('incomeList');
  const grid=document.querySelector('.summary-grid');
  if(!list||!grid)return setTimeout(boot,100);
  const cards=[...grid.querySelectorAll('.summary-card')];
  if(cards.length<4)return setTimeout(boot,100);
  const keys=['day','week','month','year'];
  let selected=null;
  let loading=false;
  let observer=null;
  function jakartaParts(date){
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).reduce((o,x)=>(o[x.type]=x.value,o),{});
    return {year:Number(p.year),month:Number(p.month),day:Number(p.day)};
  }
  function periodKey(iso){
    const d=new Date(iso);if(Number.isNaN(d.getTime()))return null;
    const p=jakartaParts(d);const dt=new Date(Date.UTC(p.year,p.month-1,p.day));
    const day=(dt.getUTCDay()+6)%7;
    const monday=new Date(dt);monday.setUTCDate(dt.getUTCDate()-day);
    const today=jakartaParts(new Date());
    if(p.year===today.year&&p.month===today.month&&p.day===today.day)return 'day';
    if(dt>=monday&&dt<=new Date(Date.UTC(today.year,today.month-1,today.day)))return 'week';
    if(p.year===today.year&&p.month===today.month)return 'month';
    if(p.year===today.year)return 'year';
    return 'other';
  }
  async function apply(key){
    if(loading)return;
    loading=true;
    try{
      const rows=[...list.querySelectorAll('.record')];
      if(!rows.length){list.classList.add('hidden');return;}
      const ids=rows.map(r=>r.querySelector('[data-income-delete]')?.dataset.incomeDelete).filter(Boolean);
      if(!ids.length){list.classList.remove('hidden');return;}
      const r=await db.from('income_records').select('id,paid_at').in('id',ids);
      if(r.error)throw r.error;
      const map=new Map((r.data||[]).map(x=>[x.id,periodKey(x.paid_at)]));
      let visible=0;
      rows.forEach(row=>{
        const id=row.querySelector('[data-income-delete]')?.dataset.incomeDelete;
        const show=map.get(id)===key;
        row.classList.toggle('hidden',!show);
        if(show)visible++;
      });
      list.classList.remove('hidden');
      list.dataset.incomeSummaryFilter=key;
      if(!visible){
        if(!list.querySelector('[data-income-period-empty]')){
          const empty=document.createElement('div');empty.className='empty';empty.dataset.incomePeriodEmpty='1';empty.textContent='Belum ada catatan pemasukan untuk periode ini.';list.appendChild(empty);
        }
      }else{
        list.querySelector('[data-income-period-empty]')?.remove();
      }
    }catch(e){console.error('[TMD income summary filter]',e)}finally{loading=false}
  }
  function clearFilter(){
    selected=null;list.classList.add('hidden');list.dataset.incomeSummaryFilter='';
    list.querySelectorAll('.record').forEach(r=>r.classList.remove('hidden'));
    list.querySelector('[data-income-period-empty]')?.remove();
  }
  cards.forEach((card,i)=>{
    card.addEventListener('click',()=>{
      const key=keys[i];
      if(selected===key){clearFilter();return;}
      selected=key;apply(key);
    });
  });
  list.classList.add('hidden');
  observer=new MutationObserver(()=>{
    if(selected){apply(selected)}else{list.classList.add('hidden')}
  });
  observer.observe(list,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
