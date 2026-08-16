(()=>{
'use strict';
const URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
if(!db)return;
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const monthNow=()=>today().slice(0,7);
const dateKey=v=>String(v).slice(0,10);
const monthName=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const weekName=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
let selected='month';
function weekStart(date){const d=new Date(`${date}T00:00:00`);const n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function addDays(date,n){const d=new Date(`${date}T00:00:00`);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function monthRange(month){const [y,m]=month.split('-').map(Number);const end=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);return {start:`${month}-01`,end}}
function inPeriod(row,key,month){const d=dateKey(row.expense_date);const now=today();if(key==='day')return d===now;if(key==='week'){const s=weekStart(now);return d>=s&&d<addDays(s,7)}if(key==='year')return d.slice(0,4)===now.slice(0,4);const r=monthRange(month);return d>=r.start&&d<r.end}
function bucket(row,key){const d=dateKey(row.expense_date);const p=d.split('-').map(Number);if(key==='day')return {label:'Hari ini',order:0};if(key==='week'){const dt=new Date(`${d}T00:00:00`);const n=(dt.getDay()+6)%7;return {label:weekName[n],order:n}}if(key==='month')return {label:String(p[2]),order:p[2]};return {label:monthName[p[1]-1],order:p[1]}}
function setMeta(key,count,month){const meta=document.getElementById('expenseChartMeta');if(meta){const label=key==='day'?'Hari ini':key==='week'?'Minggu ini':key==='year'?'Tahun ini':`${month.slice(5,7)}-${month.slice(0,4)}`;meta.textContent=`${label} · ${count} transaksi`}}
function renderChart(rows,key,month){const el=document.getElementById('expenseChart');if(!el)return;const map=new Map();rows.forEach(x=>{const b=bucket(x,key);map.set(b.order,(map.get(b.order)||0)+Number(x.amount||0))});const entries=[...map.entries()].sort((a,b)=>a[0]-b[0]).map(([order,value])=>{const sample=rows.find(x=>bucket(x,key).order===order);return {label:bucket(sample,key).label,value}});const max=Math.max(1,...entries.map(x=>x.value));setMeta(key,rows.length,month);el.innerHTML=entries.length?entries.map(x=>{const h=Math.max(4,Math.round(x.value/max*135));return `<div class="expense-bar-col"><div class="expense-bar-value">${rp(x.value)}</div><div class="expense-bar" style="height:${h}px"></div><div class="expense-bar-label">${x.label}</div></div>`}).join(''):'<div class="empty">Belum ada pengeluaran untuk periode ini.</div>'}
function renderPayments(rows,key){const sums={Tunai:0,QRIS:0,Transfer:0};rows.forEach(x=>{const raw=String(x.payment_method||'').toLowerCase();const m=raw.includes('transfer')?'Transfer':raw.includes('qris')?'QRIS':'Tunai';sums[m]+=Number(x.amount||0)});const max=Math.max(1,...Object.values(sums));const el=document.getElementById('expensePayments');if(!el)return;el.innerHTML=Object.entries(sums).map(([k,v])=>`<div class="payment-card"><b>${k}</b><div class="payment-line"><div class="payment-track"><div class="payment-fill" style="width:${Math.round(v/max*100)}%"></div></div><span class="payment-amount">${rp(v)}</span></div></div>`).join('');const sub=el.parentElement?.querySelector('.muted');if(sub)sub.textContent='Rekap '+(key==='day'?'hari ini':key==='week'?'minggu ini':key==='year'?'tahun ini':'bulan yang dipilih')}
async function render(){const month=document.getElementById('expenseMonth')?.value||monthNow();const r=await db.from('expense_records').select('item,amount,expense_date,payment_method').order('expense_date',{ascending:true}).limit(5000);if(r.error){console.error('[TMD expense period]',r.error);return}const rows=(r.data||[]).filter(x=>inPeriod(x,selected,month));renderChart(rows,selected,month);renderPayments(rows,selected)}
function wire(){const section=document.getElementById('expenses');if(!section)return setTimeout(wire,150);if(section.dataset.periodHotfix==='1')return;section.dataset.periodHotfix='1';const cards=[...section.querySelectorAll('.summary-card')];cards.forEach((card,i)=>card.addEventListener('click',()=>{selected=['day','week','month','year'][i];render()}));const month=document.getElementById('expenseMonth');if(month)month.addEventListener('change',()=>{selected='month';setTimeout(render,50)});const list=document.getElementById('expenseList');if(list)new MutationObserver(()=>{clearTimeout(window.__tmdExpensePeriodTimer);window.__tmdExpensePeriodTimer=setTimeout(render,120)}).observe(list,{childList:true,subtree:true});render()}
wire();
})();