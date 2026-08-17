(()=>{
'use strict';
const SUPA_URL='https://nbsmkxarkpesjiftmbwm.supabase.co';
const KEY='sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const sb=window.supabase?.createClient(SUPA_URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
if(!sb)return;
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const fmtDate=s=>{const [y,m,d]=String(s).slice(0,10).split('-');return `${d}-${m}-${y}`};
const monthNames=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const longDate=s=>{const [y,m,d]=String(s).slice(0,10).split('-').map(Number);return `${d} ${monthNames[m-1]} ${y}`};
function toast(msg){const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2600)}else alert(msg)}
async function loadXLSX(){
 if(window.XLSX)return window.XLSX;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 if(!window.XLSX)throw new Error('Library Excel tidak berhasil dimuat');
 return window.XLSX;
}
async function getRows(){
 const {data:rows,error}=await sb.from('income_records').select('id,paid_at,motor_brand,motor_model,motor_size_name,payment_method').order('paid_at',{ascending:true});
 if(error)throw error;
 const ids=(rows||[]).map(x=>x.id);let items=[];
 if(ids.length){const r=await sb.from('income_items').select('income_id,treatment_name,price').in('income_id',ids);if(r.error)throw r.error;items=r.data||[]}
 const byId=new Map();for(const i of items){if(!byId.has(i.income_id))byId.set(i.income_id,[]);byId.get(i.income_id).push(i)}
 const detail=[];
 for(const r of rows||[]){
   const d=new Date(r.paid_at).toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
   const motor=r.motor_brand&&r.motor_model?`${r.motor_brand} ${r.motor_model}`:r.motor_model||r.motor_brand||'-';
   const its=byId.get(r.id)||[{treatment_name:'-',price:0}];
   for(const i of its)detail.push({date:d,motor,treatment:i.treatment_name||'-',size:r.motor_size_name||'-',price:Number(i.price||0),payment:r.payment_method||'Tunai'});
 }
 return detail;
}
function styleSheet(XLSX,ws,headerRows=[]){
 ws['!cols']=ws['!cols']||[];
 for(const r of headerRows){for(let c=0;c<10;c++){const cell=ws[XLSX.utils.encode_cell({r,c})];if(cell)cell.s={font:{bold:true},fill:{fgColor:{rgb:'EAF1FF'}}}}}
}
async function exportExcel(){
 const XLSX=await loadXLSX();
 const detail=await getRows();
 if(!detail.length){toast('Belum ada data pemasukan untuk diunduh.');return}
 const byDate=new Map();
 for(const x of detail){if(!byDate.has(x.date))byDate.set(x.date,[]);byDate.get(x.date).push(x)}
 const summary=[];
 for(const [date,items] of byDate){
   const total=items.reduce((a,x)=>a+Number(x.price||0),0);
   const pay={Tunai:0,QRIS:0,Transfer:0};
   for(const x of items){const k=Object.hasOwn(pay,x.payment)?x.payment:'Tunai';pay[k]+=Number(x.price||0)}
   summary.push([fmtDate(date),items.length,total,pay.Tunai,pay.QRIS,pay.Transfer]);
 }
 const total=detail.reduce((a,x)=>a+Number(x.price||0),0);
 const wb=XLSX.utils.book_new();
 const wsSummary=XLSX.utils.aoa_to_sheet([
   ['REKAP PEMASUKAN — THE MOTODETAILERS'],
   ['Tanggal download',longDate(today())],
   ['Keterangan','Semua transaksi pemasukan'],
   [],
   ['Tanggal','Jumlah Item','Total Pemasukan','Tunai','QRIS','Transfer'],
   ...summary,
   [],
   ['TOTAL','',total,summary.reduce((a,x)=>a+x[3],0),summary.reduce((a,x)=>a+x[4],0),summary.reduce((a,x)=>a+x[5],0)]
 ]);
 wsSummary['!cols']=[{wch:18},{wch:14},{wch:20},{wch:18},{wch:18},{wch:18}];
 wsSummary['!freeze']={xSplit:0,ySplit:5};
 wsSummary['!autofilter']={ref:`A5:F${4+summary.length}`};
 wsSummary['!merges']=[{s:{r:0,c:0},e:{r:0,c:5}}];
 styleSheet(XLSX,wsSummary,[4]);
 const detailRows=[['DETAIL PEMASUKAN — THE MOTODETAILERS'],['Semua transaksi pemasukan'],[],['Tanggal','Nama Motor','Jenis Layanan','Ukuran Motor','Harga','Metode Pembayaran']];
 for(const [date,items] of byDate){
   detailRows.push([`TANGGAL ${longDate(date)}`,'','','','','']);
   for(const x of items)detailRows.push([fmtDate(x.date),x.motor,x.treatment,x.size,x.price,x.payment]);
 }
 const wsDetail=XLSX.utils.aoa_to_sheet(detailRows);
 wsDetail['!cols']=[{wch:18},{wch:34},{wch:30},{wch:18},{wch:16},{wch:20}];
 wsDetail['!freeze']={xSplit:0,ySplit:4};
 wsDetail['!merges']=[{s:{r:0,c:0},e:{r:0,c:5}}];
 styleSheet(XLSX,wsDetail,[3]);
 const range=XLSX.utils.decode_range(wsDetail['!ref']);
 for(let r=0;r<=range.e.r;r++){
   const first=wsDetail[XLSX.utils.encode_cell({r,c:0})];
   if(first&&String(first.v).startsWith('TANGGAL ')){for(let c=0;c<=5;c++){const cell=wsDetail[XLSX.utils.encode_cell({r,c})];if(cell)cell.s={font:{bold:true},fill:{fgColor:{rgb:'F4F7FF'}}}}}
   const price=wsDetail[XLSX.utils.encode_cell({r,c:4})];if(price&&typeof price.v==='number')price.z='Rp #,##0';
 }
 XLSX.utils.book_append_sheet(wb,wsSummary,'Ringkasan');
 XLSX.utils.book_append_sheet(wb,wsDetail,'Detail Pemasukan');
 const fileName=`Rekap ${longDate(today())}.xlsx`;
 XLSX.writeFile(wb,fileName);
 toast(`Rekap Excel berhasil diunduh: ${fileName}`);
}
function install(){
 const old=document.getElementById('exportIncome');
 if(!old){setTimeout(install,300);return}
 if(old.dataset.excelPatched==='1')return;
 const btn=old.cloneNode(true);btn.id='exportIncome';btn.textContent='Download Excel';btn.dataset.excelPatched='1';old.replaceWith(btn);
 btn.addEventListener('click',async()=>{btn.disabled=true;try{await exportExcel()}catch(e){console.error(e);toast('Gagal membuat Excel: '+(e.message||e))}finally{btn.disabled=false}});
 const copy=document.getElementById('copyIncome');if(copy)copy.textContent='Copy Data';
}
install();
})();
