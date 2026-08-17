(()=>{
'use strict';
const SUPA_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const MONTHS=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const monthNow=()=>today().slice(0,7);
const longMonth=m=>{const [y,mo]=String(m).slice(0,7).split('-').map(Number);return `${MONTHS[mo-1]} ${y}`};
const longDate=s=>{const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return `${d} ${MONTHS[m-1]} ${y}`};
const fmtDate=s=>{const [y,m,d]=String(s).slice(0,10).split('-');return `${d}-${m}-${y}`};
function toast(msg){const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2600)}else alert(msg)}
async function loadXLSX(){if(window.XLSX)return window.XLSX;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});if(!window.XLSX)throw new Error('Library Excel tidak berhasil dimuat');return window.XLSX}
async function getRows(month){
 const sb=window.supabase?.createClient(SUPA_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 if(!sb)throw new Error('Supabase belum siap');
 const start=`${month}-01`;
 const [y,m]=month.split('-').map(Number);
 const end=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
 const {data,error}=await sb.from('expense_records').select('id,item,amount,expense_date,payment_method,notes').gte('expense_date',start).lt('expense_date',end).order('expense_date',{ascending:true}).order('created_at',{ascending:true});
 if(error)throw error;
 return data||[];
}
function styleHeader(XLSX,ws,row,maxCol){for(let c=0;c<=maxCol;c++){const cell=ws[XLSX.utils.encode_cell({r:row,c})];if(cell)cell.s={font:{bold:true},fill:{fgColor:{rgb:'EAF1FF'}}}}}
async function exportExpenseExcel(){
 const XLSX=await loadXLSX();
 const month=document.getElementById('expenseMonth')?.value||monthNow();
 const rows=await getRows(month);
 if(!rows.length){toast(`Belum ada data pengeluaran untuk ${longMonth(month)}.`);return}
 const totals={Tunai:0,QRIS:0,Transfer:0};
 let total=0;
 for(const x of rows){const a=Number(x.amount||0);total+=a;if(Object.hasOwn(totals,x.payment_method))totals[x.payment_method]+=a}
 const wb=XLSX.utils.book_new();
 const summary=XLSX.utils.aoa_to_sheet([
  ['REKAP PENGELUARAN — THE MOTODETAILERS'],
  ['Periode',longMonth(month)],
  ['Tanggal download',longDate(today())],
  [],
  ['Jumlah Transaksi',rows.length],
  ['Total Pengeluaran',total],
  [],
  ['Metode Pembayaran','Total'],
  ['Tunai',totals.Tunai],
  ['QRIS',totals.QRIS],
  ['Transfer',totals.Transfer],
  [],
  ['TOTAL','',total]
 ]);
 summary['!cols']=[{wch:24},{wch:24},{wch:22}];
 summary['!merges']=[{s:{r:0,c:0},e:{r:0,c:2}}];
 summary['!freeze']={xSplit:0,ySplit:4};
 styleHeader(XLSX,summary,7,1);
 for(const addr of ['B6','B9','B10','B11','C13'])if(summary[addr])summary[addr].z='Rp #,##0';
 XLSX.utils.book_append_sheet(wb,summary,'Ringkasan');
 const detail=[
  ['DETAIL PENGELUARAN — THE MOTODETAILERS'],
  [`Periode ${longMonth(month)}`],
  [],
  ['Tanggal','Nama Pengeluaran','Jumlah','Metode Pembayaran','Catatan']
 ];
 for(const x of rows)detail.push([fmtDate(x.expense_date),x.item||'-',Number(x.amount||0),x.payment_method||'Tunai',x.notes||'-']);
 detail.push([]);detail.push(['TOTAL','',total,'','']);
 const ws=XLSX.utils.aoa_to_sheet(detail);
 ws['!cols']=[{wch:16},{wch:34},{wch:18},{wch:22},{wch:42}];
 ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:4}}];
 ws['!freeze']={xSplit:0,ySplit:4};
 styleHeader(XLSX,ws,3,4);
 const range=XLSX.utils.decode_range(ws['!ref']);
 for(let r=4;r<=range.e.r;r++){const cell=ws[XLSX.utils.encode_cell({r,c:2})];if(cell&&typeof cell.v==='number')cell.z='Rp #,##0'}
 const totalRow=4+rows.length+1;
 if(ws[XLSX.utils.encode_cell({r:totalRow,c:2})])ws[XLSX.utils.encode_cell({r:totalRow,c:2})].z='Rp #,##0';
 XLSX.utils.book_append_sheet(wb,ws,'Detail Pengeluaran');
 const fileName=`Rekap Pengeluaran ${longMonth(month)}.xlsx`;
 XLSX.writeFile(wb,fileName);
 toast(`Rekap Excel berhasil diunduh: ${fileName}`);
}
function patch(){
 const old=document.getElementById('downloadExpense');
 if(!old||old.dataset.xlsxExpense==='1')return;
 const btn=old.cloneNode(true);
 btn.id='downloadExpense';
 btn.dataset.xlsxExpense='1';
 btn.textContent='Download Excel';
 btn.removeAttribute('onclick');
 old.replaceWith(btn);
 btn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();btn.disabled=true;try{await exportExpenseExcel()}catch(err){console.error(err);toast('Gagal membuat Excel pengeluaran: '+(err.message||err))}finally{btn.disabled=false}},true);
}
function install(){patch();const mo=new MutationObserver(patch);mo.observe(document.body,{childList:true,subtree:true});[100,500,1500,3000,5000].forEach(ms=>setTimeout(patch,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
