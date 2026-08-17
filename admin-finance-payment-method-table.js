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
