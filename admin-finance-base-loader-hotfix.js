(()=>{
'use strict';
function loadExpenseCrud(){
  if(document.querySelector('script[data-tmd-expense-crud-v2]'))return;
  const s=document.createElement('script');
  s.src='./admin-expense-crud-hotfix-v2.js?v=20260817-v4';
  s.dataset.tmdExpenseCrudV2='1';
  document.head.appendChild(s);
}
function loadExpenseXlsx(){
  if(document.querySelector('script[data-tmd-expense-xlsx]'))return;
  const s=document.createElement('script');
  s.src='./admin-expense-xlsx-hotfix.js?v=20260821-v1';
  s.dataset.tmdExpenseXlsx='1';
  document.head.appendChild(s);
}
function loadFinal(){
  if(document.querySelector('script[data-tmd-final-finance]')){setTimeout(loadExpenseCrud,700);return;}
  const s=document.createElement('script');
  s.src='./admin-finance-final-v2.js?v=20260817-v5';
  s.dataset.tmdFinalFinance='1';
  s.onload=()=>setTimeout(loadExpenseCrud,700);
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
async function loadDetailXLSX(){
  if(window.XLSX)return window.XLSX;
  if(window.__tmdDetailXlsxPromise)return window.__tmdDetailXlsxPromise;
  window.__tmdDetailXlsxPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload=()=>window.XLSX?resolve(window.XLSX):reject(new Error('Library Excel tidak berhasil dimuat'));
    s.onerror=()=>reject(new Error('Library Excel tidak berhasil dimuat'));
    document.head.appendChild(s);
  });
  return window.__tmdDetailXlsxPromise;
}
function detailRows(root,isIncome){
  const out=[];
  root.querySelectorAll('.tmd-v2-day').forEach(day=>{
    const date=day.querySelector('.tmd-v2-dayhead span')?.textContent.trim()||'-';
    day.querySelectorAll('.tmd-v2-row').forEach(row=>{
      const name=row.querySelector('.tmd-v2-name')?.textContent.trim()||'-';
      const amount=row.querySelector('.tmd-v2-amount')?.textContent.trim()||'Rp 0';
      const metas=[...row.querySelectorAll(':scope > .tmd-v2-meta')].map(x=>x.textContent.trim()).filter(Boolean);
      const payment=metas.find(x=>/^Pembayaran:/i.test(x))?.replace(/^Pembayaran:\s*/i,'')||'Tunai';
      const notes=metas.find(x=>/^Catatan:/i.test(x))?.replace(/^Catatan:\s*/i,'')||'';
      const firstMeta=metas.find(x=>!/^Pembayaran:|^Catatan:/i.test(x))||'';
      const phone=metas.find(x=>/^\+?\d|^08\d|^62\d/.test(x))||'';
      const time=firstMeta.match(/^\d{1,2}:\d{2}/)?.[0]||'';
      const motor=firstMeta.replace(/^\d{1,2}:\d{2}\s*·\s*/,'').trim();
      const items=[...row.querySelectorAll('.tmd-v2-item')];
      if(isIncome&&items.length){
        items.forEach(item=>{
          const parts=[...item.querySelectorAll('span,b')].map(x=>x.textContent.trim());
          out.push([date,time,name,phone,motor,'',parts[0]||'Layanan',parts[1]||'Rp 0',payment,notes]);
        });
      }else if(isIncome){
        out.push([date,time,name,phone,motor,'','-',amount,payment,notes]);
      }else{
        out.push([date,name,amount,payment,notes]);
      }
    });
  });
  return out;
}
async function exportVisibleFinanceDetail(root,section){
  const XLSX=await loadDetailXLSX();
  const isIncome=section==='income';
  const rows=detailRows(root,isIncome);
  if(!rows.length){
    const t=document.getElementById('toast');
    if(t){t.textContent='Tidak ada transaksi pada detail ini.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}
    return;
  }
  const title=root.querySelector('.tmd-v2-title')?.textContent.trim()||`Detail ${isIncome?'Pemasukan':'Pengeluaran'}`;
  const aoa=[[title],[`Tanggal download`,new Date().toLocaleDateString('id-ID')],[],isIncome
    ? ['Tanggal','Jam','Nama Customer','No. HP / WhatsApp','Motor','Ukuran Motor','Treatment','Harga','Metode Pembayaran','Catatan']
    : ['Tanggal','Nama Pengeluaran','Jumlah','Metode Pembayaran','Catatan'],...rows];
  const ws=XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols']=isIncome
    ? [{wch:18},{wch:10},{wch:24},{wch:20},{wch:30},{wch:18},{wch:30},{wch:18},{wch:20},{wch:42}]
    : [{wch:18},{wch:34},{wch:18},{wch:20},{wch:42}];
  const headerRow=3;
  for(let c=0;c<(isIncome?10:5);c++){const cell=ws[XLSX.utils.encode_cell({r:headerRow,c})];if(cell)cell.s={font:{bold:true}}}
  const amountCol=isIncome?7:2;
  const range=XLSX.utils.decode_range(ws['!ref']);
  for(let r=headerRow+1;r<=range.e.r;r++){const cell=ws[XLSX.utils.encode_cell({r,c:amountCol})];if(cell&&typeof cell.v==='string')cell.z='@'}
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,isIncome?'Detail Pemasukan':'Detail Pengeluaran');
  const safe=title.replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim();
  XLSX.writeFile(wb,`${safe}.xlsx`);
  const t=document.getElementById('toast');
  if(t){t.textContent='Detail berhasil diunduh dalam Excel.';t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}
}
function normalizeDetailDownload(){
  document.querySelectorAll('.tmd-v2').forEach(root=>{
    const head=root.querySelector('.tmd-v2-head');
    const back=head?.querySelector('.tmd-v2-back');
    if(!head||!back||root.dataset.tmdDetailDownload==='1')return;
    root.dataset.tmdDetailDownload='1';
    const section=root.closest('#income')?'income':root.closest('#expenses')?'expenses':'';
    if(!section)return;
    const b=document.createElement('button');
    b.type='button';b.className='btn gray small';b.textContent='Download Excel';b.dataset.tmdDetailDownloadBtn='1';
    b.onclick=async()=>{b.disabled=true;try{await exportVisibleFinanceDetail(root,section)}catch(e){console.error(e);alert('Gagal membuat Excel: '+(e.message||e))}finally{b.disabled=false}};
    back.insertAdjacentElement('afterend',b);
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
  loadExpenseXlsx();
  normalizeFinanceToolbar();
  normalizeDetailDownload();
  setTimeout(normalizeFinanceToolbar,250);
  setTimeout(normalizeFinanceToolbar,900);
  setTimeout(normalizeDetailDownload,250);
  setTimeout(normalizeDetailDownload,900);
  setTimeout(loadFinal,350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
new MutationObserver(()=>{normalizeFinanceToolbar();normalizeDetailDownload()}).observe(document.body,{childList:true,subtree:true});
})();