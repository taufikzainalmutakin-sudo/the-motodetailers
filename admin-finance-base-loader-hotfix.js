(()=>{
'use strict';
function setup(){
  const styleId='tmdFinanceBaseCleanup';
  if(!document.getElementById(styleId)){
    const s=document.createElement('style');s.id=styleId;s.textContent='#expenses .expense-chart-wrap{display:none!important}#expenses #expenseMonth{display:none!important}';document.head.appendChild(s);
  }
  if(document.getElementById('expenses'))return;
  if(document.querySelector('script[data-tmd-expense-base]'))return;
  const s=document.createElement('script');s.src='./admin-income-export-expense-hotfix.js?v=20260817-financebase1';s.dataset.tmdExpenseBase='1';document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});
})();
