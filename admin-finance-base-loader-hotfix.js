(()=>{
'use strict';
function loadExpenseCrud(){
  if(document.querySelector('script[data-tmd-expense-crud-v2]'))return;
  const s=document.createElement('script');
  s.src='./admin-expense-crud-hotfix-v2.js?v=20260817-v4';
  s.dataset.tmdExpenseCrudV2='1';
  document.head.appendChild(s);
}
function loadPaymentMethodTable(){
  if(document.querySelector('script[data-tmd-payment-method-table]'))return;
  const s=document.createElement('script');
  s.src='./admin-finance-payment-method-table.js?v=20260817-v1';
  s.dataset.tmdPaymentMethodTable='1';
  document.head.appendChild(s);
}
function loadFinal(){
  if(document.querySelector('script[data-tmd-final-finance]')){setTimeout(()=>{loadExpenseCrud();loadPaymentMethodTable()},700);return;}
  const s=document.createElement('script');
  s.src='./admin-finance-final-v2.js?v=20260817-v4';
  s.dataset.tmdFinalFinance='1';
  s.onload=()=>setTimeout(()=>{loadExpenseCrud();loadPaymentMethodTable()},700);
  document.head.appendChild(s);
}
function openFinanceEditorModal(section){
  const sec=document.getElementById(section);
  if(!sec)return;
  const editor=section==='income'
    ? document.getElementById('incomeEditor')
    : sec.querySelector('.editor');
  if(!editor)return;
  document.querySelector('.tmd-finance-form-modal')?.remove();
  const placeholder=document.createComment('tmd-finance-editor-placeholder');
  editor.parentNode.insertBefore(placeholder,editor);
  editor.classList.remove('hidden');
  editor.classList.remove('tmd-v2-hidden');
  const wrap=document.createElement('div');
  wrap.className='tmd-finance-form-modal';
  const box=document.createElement('div');
  box.className='tmd-finance-form-box';
  box.appendChild(editor);
  wrap.appendChild(box);
  document.body.appendChild(wrap);
  let closed=false;
  const close=()=>{
    if(closed)return;
    closed=true;
    try{placeholder.parentNode?.insertBefore(editor,placeholder.nextSibling)}catch(e){}
    editor.classList.add('hidden');
    editor.classList.remove('tmd-v2-hidden');
    wrap.remove();
  };
  wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  const cancel=[...editor.querySelectorAll('button')].find(b=>/^(Batal|Kembali)$/i.test(b.textContent.trim()));
  if(cancel)cancel.addEventListener('click',()=>setTimeout(close,0),{once:true});
  const save=[...editor.querySelectorAll('button')].find(b=>/^(Simpan|Simpan Pemasukan)$/i.test(b.textContent.trim()));
  if(save)save.addEventListener('click',()=>setTimeout(()=>{if(!wrap.isConnected)return; if(editor.classList.contains('hidden'))close()},0));
}
function normalizeFinanceToolbar(){
  const income=document.getElementById('income');
  const expense=document.getElementById('expenses');
  [income,expense].forEach((sec)=>{
    if(!sec)return;
    const head=sec.querySelector('.head');
    if(!head)return;
    let toolbar=head.nextElementSibling;
    if(!toolbar||!toolbar.classList.contains('tmd-finance-toolbar')){
      toolbar=document.createElement('div');
      toolbar.className='tmd-finance-toolbar';
      head.insertAdjacentElement('afterend',toolbar);
    }
    const ids=sec.id==='income'
      ? ['refreshIncome','exportIncome','tmdV2AddIncome']
      : ['downloadExpense','tmdV2AddExpense'];
    ids.forEach(id=>{
      const b=document.getElementById(id);
      if(b&&b.closest('body')&&b.closest('.tmd-finance-toolbar')!==toolbar)toolbar.appendChild(b);
      if(b&&(id==='tmdV2AddIncome'||id==='tmdV2AddExpense')){
        const key='tmdModalBound';
        if(b.dataset[key]!=='1'){
          b.dataset[key]='1';
          b.onclick=()=>openFinanceEditorModal(sec.id);
        }
      }
    });
    sec.querySelectorAll('#copyIncome,#copyExpense').forEach(b=>b.remove());
    if(!toolbar.children.length)toolbar.remove();
  });
}
function setup(){
  const styleId='tmdFinanceBaseCleanup';
  if(!document.getElementById(styleId)){
    const s=document.createElement('style');s.id=styleId;s.textContent=`
      #expenses .expense-chart-wrap{display:none!important}
      #expenses #expenseMonth{display:none!important}
      #income #incomeList{display:none!important}
      #expenses #expenseList{display:none!important}
      #expenses > .panel > .editor{display:none!important}
      .tmd-finance-toolbar{display:flex;align-items:stretch;gap:10px;width:100%;margin:12px 0 14px}
      .tmd-finance-toolbar>.btn{flex:1 1 0;min-width:0;margin:0!important;text-align:center}
      .tmd-finance-form-modal{position:fixed;inset:0;background:#0008;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
      .tmd-finance-form-box{width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 20px 60px #0004}
      .tmd-finance-form-box>.editor{margin-top:0!important;padding:18px!important;border:0!important;box-shadow:none!important}
      @media(max-width:520px){.tmd-finance-toolbar{gap:8px}.tmd-finance-toolbar>.btn{padding-left:8px;padding-right:8px;font-size:13px}.tmd-finance-form-modal{padding:0}.tmd-finance-form-box{width:100%;max-height:calc(100vh - 20px);border-radius:18px}}
    `;document.head.appendChild(s);
  }
  document.querySelectorAll('.tmd-drill-host').forEach(host=>{
    const section=host.closest('.tabpage');
    const grid=section?.querySelector('.summary-grid');
    if(grid&&host.previousElementSibling!==grid)grid.parentNode.insertBefore(host,grid.nextSibling);
  });
  if(!document.getElementById('expenses')&&!document.querySelector('script[data-tmd-expense-base]')){
    const s=document.createElement('script');s.src='./admin-income-export-expense-hotfix.js?v=20260817-financebase2';s.dataset.tmdExpenseBase='1';document.head.appendChild(s);
  }
  normalizeFinanceToolbar();
  setTimeout(normalizeFinanceToolbar,250);
  setTimeout(normalizeFinanceToolbar,900);
  setTimeout(loadFinal,350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
new MutationObserver(()=>{normalizeFinanceToolbar()}).observe(document.body,{childList:true,subtree:true});
})();

/* TMD payment-method table: kept in this existing loader so no extra JS file is needed. */
(()=>{
'use strict';
if(window.__TMD_PAYMENT_METHOD_TABLE__) return;
window.__TMD_PAYMENT_METHOD_TABLE__=true;

const SUPABASE_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const SUPABASE_KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const db=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
if(!db)return;

const money=v=>'Rp '+Number(v||0).toLocaleString('id-ID');
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};

function addCss(){
  if(document.getElementById('tmdPaymentMethodTableCss'))return;
  const s=document.createElement('style');
  s.id='tmdPaymentMethodTableCss';
  s.textContent=`
    .tmd-payment-method-host{margin-top:14px}
    .tmd-payment-method{border:1px solid #e5e7eb;border-radius:18px;background:#fff;overflow:hidden}
    .tmd-payment-method-head{padding:16px;border-bottom:1px solid #edf0f5}
    .tmd-payment-method-title{font-size:20px;font-weight:900;color:#111827}
    .tmd-payment-method-sub{color:#6b7280;font-size:13px;margin-top:4px}
    .tmd-payment-method-list{padding:12px 16px 16px}
    .tmd-payment-method-card{border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin-top:10px;background:#fff}
    .tmd-payment-method-name{font-size:18px;font-weight:900;color:#111827}
    .tmd-payment-method-line{height:14px;background:#eef2fa;border-radius:999px;margin-top:14px;overflow:hidden}
    .tmd-payment-method-fill{height:100%;background:#1769d2;border-radius:999px;min-width:0}
    .tmd-payment-method-total{margin-top:10px;text-align:right;color:#0757d9;font-size:20px;font-weight:900}
    .tmd-payment-method-empty{padding:24px 16px;text-align:center;color:#6b7280}
  `;
  document.head.appendChild(s);
}

function getDate(row,type){
  if(type==='income'){
    const d=new Date(row.paid_at);
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(d);
  }
  return String(row.expense_date||'').slice(0,10);
}

async function loadRows(type){
  if(type==='income'){
    const r=await db.from('income_records').select('paid_at,payment_method,total_amount').limit(10000);
    if(r.error)throw r.error;
    return r.data||[];
  }
  const r=await db.from('expense_records').select('expense_date,payment_method,amount').limit(10000);
  if(r.error)throw r.error;
  return r.data||[];
}

function currentMonthRows(rows,type){
  const month=today().slice(0,7);
  return rows.filter(r=>getDate(r,type).slice(0,7)===month);
}

function render(type,rows){
  const section=document.getElementById(type==='income'?'income':'expenses');
  if(!section)return;
  let host=section.querySelector('.tmd-payment-method-host');
  if(!host){
    host=document.createElement('div');
    host.className='tmd-payment-method-host';
    const v2=section.querySelector('.tmd-v2-host');
    if(v2)v2.insertAdjacentElement('afterend',host);
    else section.appendChild(host);
  }

  const monthRows=currentMonthRows(rows,type);
  const totals=new Map([['Tunai',0],['QRIS',0],['Transfer',0]]);
  monthRows.forEach(r=>{
    const method=String(r.payment_method||'Tunai').trim()||'Tunai';
    const amount=Number(type==='income'?r.total_amount:r.amount)||0;
    totals.set(method,(totals.get(method)||0)+amount);
  });
  const entries=[...totals.entries()];
  const max=Math.max(1,...entries.map(x=>x[1]));
  const title=type==='income'?'Metode pembayaran pemasukan':'Metode pembayaran pengeluaran';

  host.innerHTML='';
  const box=document.createElement('div');
  box.className='tmd-payment-method';
  box.innerHTML=`<div class="tmd-payment-method-head"><div class="tmd-payment-method-title">${title}</div><div class="tmd-payment-method-sub">Periode Bulan ini</div></div><div class="tmd-payment-method-list"></div>`;
  const list=box.querySelector('.tmd-payment-method-list');
  entries.forEach(([name,value])=>{
    const card=document.createElement('div');
    card.className='tmd-payment-method-card';
    const pct=value?Math.max(3,(value/max)*100):0;
    card.innerHTML=`<div class="tmd-payment-method-name">${name}</div><div class="tmd-payment-method-line"><div class="tmd-payment-method-fill" style="width:${pct}%"></div></div><div class="tmd-payment-method-total">${money(value)}</div>`;
    list.appendChild(card);
  });
  if(!monthRows.length){
    const empty=document.createElement('div');
    empty.className='tmd-payment-method-empty';
    empty.textContent='Belum ada transaksi pada bulan ini.';
    list.prepend(empty);
  }
  host.appendChild(box);
}

async function refresh(){
  try{
    const [income,expense]=await Promise.all([loadRows('income'),loadRows('expense')]);
    render('income',income);
    render('expense',expense);
  }catch(e){
    console.error('TMD payment method table:',e);
  }
}

function start(){
  addCss();
  refresh();
  window.addEventListener('tmd-finance-refresh',refresh);
  setTimeout(refresh,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();