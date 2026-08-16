(()=>{
'use strict';
const METHODS=['Tunai','Transfer','QRIS'];
function patch(){
  document.querySelectorAll('[data-income-hotfix-price]').forEach(x=>{
    if(!x.dataset.incomePrice)x.dataset.incomePrice=x.dataset.incomeHotfixPrice||'';
    if(!x.dataset.incomePriceId)x.dataset.incomePriceId=x.dataset.incomeHotfixPrice||'';
  });
  const select=document.querySelector('#incomePaymentMethod');
  if(select){
    const current=METHODS.includes(select.value)?select.value:'Tunai';
    select.innerHTML='';
    METHODS.forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;select.appendChild(o)});
    select.value=current;
  }
  const pay=document.querySelector('#tmdPaymentBars');
  if(pay){
    pay.querySelectorAll('.tmd-pay-row').forEach(row=>{
      const label=row.querySelector('.tmd-pay-label')?.textContent.trim();
      if(label&&!METHODS.includes(label))row.remove();
    });
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
new MutationObserver(()=>{clearTimeout(window.__tmdIncomeCompatTimer);window.__tmdIncomeCompatTimer=setTimeout(patch,30)}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',patch,true);
})();
