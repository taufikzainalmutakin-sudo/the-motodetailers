(()=>{
'use strict';
const SUPA_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const sb=window.supabase?.createClient(SUPA_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
if(!sb)return;
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const toast=msg=>{const t=$('toast');if(t){t.textContent=msg;t.classList.remove('hidden');clearTimeout(window.__tmdFinanceCrudToast);window.__tmdFinanceCrudToast=setTimeout(()=>t.classList.add('hidden'),2400)}};
function styles(){
 if($('tmdFinanceCrudStyles'))return;
 const s=document.createElement('style');s.id='tmdFinanceCrudStyles';s.textContent=`
#income .tmd-finance-head-actions,#expenses .tmd-finance-head-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#income #addIncome,#expenses #addExpenseTop{white-space:nowrap}
#income .tmd-drill-host .tmd-record-actions,#expenses .tmd-drill-host .tmd-record-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;padding-top:8px;border-top:1px solid #edf0f5}
#income .tmd-drill-host .tmd-record-actions .btn,#expenses .tmd-drill-host .tmd-record-actions .btn{min-width:72px}
#income .tmd-drill-host .tmd-record-actions .btn.danger,#expenses .tmd-drill-host .tmd-record-actions .btn.danger{background:#dc2626;color:#fff}
#income .tmd-finance-editor-hidden,#expenses .tmd-finance-editor-hidden{display:none!important}
@media(max-width:520px){#income .tmd-finance-head-actions,#expenses .tmd-finance-head-actions{width:100%}#income .tmd-finance-head-actions .btn,#expenses .tmd-finance-head-actions .btn{flex:1}}
`;
 document.head.appendChild(s);
}
function moveIncomeForm(){
 const sec=$('income');if(!sec)return false;
 const head=sec.querySelector('.head');const add=$('addIncome');const editor=$('incomeEditor');
 if(head&&add&&!add.dataset.tmdMoved){
   let actions=head.querySelector('.tmd-finance-head-actions');
   if(!actions){actions=document.createElement('div');actions.className='tmd-finance-head-actions';head.appendChild(actions)}
   actions.prepend(add);add.textContent='+ Pemasukan';add.classList.add('btn');add.dataset.tmdMoved='1';
 }
 if(editor&&!editor.dataset.tmdCrud){editor.dataset.tmdCrud='1';editor.classList.add('tmd-finance-editor-hidden');}
 if(add&&!add.dataset.tmdCrudBound){
   add.addEventListener('click',()=>{editor?.classList.remove('tmd-finance-editor-hidden');setTimeout(()=>editor?.scrollIntoView({behavior:'smooth',block:'start'}),0)},true);
   add.dataset.tmdCrudBound='1';
 }
 const cancel=$('cancelIncome');if(cancel&&!cancel.dataset.tmdCrudBound){cancel.addEventListener('click',()=>editor?.classList.add('tmd-finance-editor-hidden'),true);cancel.dataset.tmdCrudBound='1'}
 return true;
}
function moveExpenseForm(){
 const sec=$('expenses');if(!sec)return false;
 const head=sec.querySelector('.head');const editor=sec.querySelector('.editor');if(!head||!editor)return false;
 if(!editor.dataset.tmdCrud){editor.dataset.tmdCrud='1';editor.classList.add('tmd-finance-editor-hidden')}
 let actions=head.querySelector('.tmd-finance-head-actions');
 if(!actions){actions=document.createElement('div');actions.className='tmd-finance-head-actions';head.appendChild(actions)}
 let add=$('addExpenseTop');
 if(!add){add=document.createElement('button');add.id='addExpenseTop';add.type='button';add.className='btn';add.textContent='+ Pengeluaran';actions.prepend(add)}
 if(!add.dataset.tmdCrudBound){
   add.addEventListener('click',()=>{editor.classList.remove('tmd-finance-editor-hidden');const date=$('expenseDate');if(date&&!date.value)date.value=today();setTimeout(()=>editor.scrollIntoView({behavior:'smooth',block:'start'}),0)});
   add.dataset.tmdCrudBound='1';
 }
 const cancel=$('cancelExpense');if(cancel&&!cancel.dataset.tmdCrudBound){cancel.addEventListener('click',()=>editor.classList.add('tmd-finance-editor-hidden'),true);cancel.dataset.tmdCrudBound='1'}
 const list=$('expenseList');if(list&&!list.dataset.tmdCrudEditBound){list.addEventListener('click',e=>{if(e.target.closest('[data-edit-expense]'))setTimeout(()=>editor.classList.remove('tmd-finance-editor-hidden'),0)},true);list.dataset.tmdCrudEditBound='1'}
 return true;
}
let incomeRows=null,expenseRows=null,fetching=null;
async function loadRows(){
 if(fetching)return fetching;
 fetching=(async()=>{
  const [ir,er]=await Promise.all([
   sb.from('income_records').select('id,paid_at').order('paid_at',{ascending:true}).limit(10000),
   sb.from('expense_records').select('id,expense_date').order('expense_date',{ascending:true}).order('created_at',{ascending:true}).limit(10000)
  ]);
  if(!ir.error)incomeRows=ir.data||[];
  if(!er.error)expenseRows=er.data||[];
  fetching=null;
 })().catch(e=>{fetching=null;console.error('[TMD finance crud]',e)});
 return fetching;
}
function incomeDate(iso){const d=new Date(iso);return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function parseDayTitle(text){
 const m=String(text||'').trim().match(/^(\d{2})\s+([A-Za-z]+)\s+(\d{4})$/);if(!m)return null;
 const names={Januari:'01',Februari:'02',Maret:'03',April:'04',Mei:'05',Juni:'06',Juli:'07',Agustus:'08',September:'09',Oktober:'10',November:'11',Desember:'12'};
 const mon=names[m[2]];return mon?`${m[3]}-${mon}-${m[1]}`:null;
}
function addActions(section,record,id){
 if(!id||record.querySelector('.tmd-record-actions'))return;
 const box=document.createElement('div');box.className='tmd-record-actions';
 const edit=document.createElement('button');edit.type='button';edit.className='btn small';edit.textContent='Edit';edit.dataset.tmdFinanceEdit=id;
 const del=document.createElement('button');del.type='button';del.className='btn danger small';del.textContent='Hapus';del.dataset.tmdFinanceDelete=id;
 box.append(edit,del);record.appendChild(box);
}
function decorate(section,rows){
 const host=$(section)?.querySelector('.tmd-drill-host');if(!host||!rows)return;
 const byDate=new Map();
 for(const r of rows){const d=section==='income'?incomeDate(r.paid_at):String(r.expense_date).slice(0,10);if(!byDate.has(d))byDate.set(d,[]);byDate.get(d).push(r)}
 host.querySelectorAll('.tmd-day-group').forEach(group=>{
   const date=parseDayTitle(group.querySelector('.tmd-day-title')?.textContent);if(!date)return;
   const list=byDate.get(date)||[];const records=[...group.querySelectorAll('.tmd-record')];records.forEach((record,i)=>addActions(section,record,list[i]?.id));
 });
}
async function refreshAndDecorate(){await loadRows();decorate('income',incomeRows);decorate('expenses',expenseRows)}
function proxyListButton(section,type,id){
 const selector=section==='income'
   ? (type==='edit'?`#incomeList [data-income-edit="${CSS.escape(id)}"]`:`#incomeList [data-income-delete="${CSS.escape(id)}"]`)
   : (type==='edit'?`#expenseList [data-edit-expense="${CSS.escape(id)}"]`:`#expenseList [data-delete-expense="${CSS.escape(id)}"]`);
 const b=document.querySelector(selector);if(b){b.click();return true}return false;
}
async function handleAction(e){
 const b=e.target.closest('[data-tmd-finance-edit],[data-tmd-finance-delete]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const section=b.closest('#income')?'income':'expenses';const type=b.hasAttribute('data-tmd-finance-edit')?'edit':'delete';const id=b.dataset.tmdFinanceEdit||b.dataset.tmdFinanceDelete;
 if(type==='delete'){
   if(!confirm(section==='income'?'Hapus catatan pemasukan ini?':'Hapus catatan pengeluaran ini?'))return;
   if(section==='income'){
     const r=await sb.rpc('admin_delete_income_record',{p_income_id:id});if(r.error)return toast(r.error.message);toast('Pemasukan dihapus.');
     $('refreshIncome')?.click();
   }else{
     const r=await sb.from('expense_records').delete().eq('id',id);if(r.error)return toast(r.error.message);toast('Pengeluaran dihapus.');
     $('expenseMonth')?.dispatchEvent(new Event('change'));
   }
   setTimeout(refreshAndDecorate,450);return;
 }
 if(!proxyListButton(section,'edit',id))toast('Form edit belum siap. Coba sekali lagi.');
 else{
   const editor=section==='income'?$('incomeEditor'):$('expenses')?.querySelector('.editor');editor?.classList.remove('tmd-finance-editor-hidden');setTimeout(()=>editor?.scrollIntoView({behavior:'smooth',block:'start'}),0);
 }
}
function observeHost(section){
 const sec=$(section);if(!sec)return false;
 const host=sec.querySelector('.tmd-drill-host');if(!host||host.dataset.tmdCrudObserved)return false;
 host.dataset.tmdCrudObserved='1';
 new MutationObserver(()=>{clearTimeout(host.__tmdDecorTimer);host.__tmdDecorTimer=setTimeout(()=>decorate(section,section==='income'?incomeRows:expenseRows),20)}).observe(host,{childList:true,subtree:true});
 host.addEventListener('click',handleAction,true);
 return true;
}
function watch(){
 styles();moveIncomeForm();moveExpenseForm();observeHost('income');observeHost('expenses');
 if(!$('income')||!$('expenses'))return;
 if(!incomeRows||!expenseRows)loadRows().then(refreshAndDecorate);
 else refreshAndDecorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
new MutationObserver(()=>{moveIncomeForm();moveExpenseForm();observeHost('income');observeHost('expenses')}).observe(document.body,{childList:true,subtree:true});
})();
