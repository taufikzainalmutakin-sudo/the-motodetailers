(()=>{
'use strict';
function loadFinal(){
  if(document.querySelector('script[data-tmd-final-finance]'))return;
  const s=document.createElement('script');
  s.src='./admin-finance-final-v2.js?v=20260817-v2';
  s.dataset.tmdFinalFinance='1';
  document.head.appendChild(s);
}
function setup(){
  const styleId='tmdFinanceBaseCleanup';
  if(!document.getElementById(styleId)){
    const s=document.createElement('style');s.id=styleId;s.textContent='#expenses .expense-chart-wrap{display:none!important}#expenses #expenseMonth{display:none!important}';document.head.appendChild(s);
  }
  document.querySelectorAll('.tmd-drill-host').forEach(host=>{
    const section=host.closest('.tabpage');
    const grid=section?.querySelector('.summary-grid');
    if(grid&&host.previousElementSibling!==grid)grid.parentNode.insertBefore(host,grid.nextSibling);
  });
  if(!document.getElementById('expenses')&&!document.querySelector('script[data-tmd-expense-base]')){
    const s=document.createElement('script');s.src='./admin-income-export-expense-hotfix.js?v=20260817-financebase1';s.dataset.tmdExpenseBase='1';document.head.appendChild(s);
  }
  setTimeout(loadFinal,350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});
})();
