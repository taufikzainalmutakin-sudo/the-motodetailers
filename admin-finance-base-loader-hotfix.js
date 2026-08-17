(()=>{
'use strict';
function loadExpenseCrud(){
  if(document.querySelector('script[data-tmd-expense-crud-v2]'))return;
  const s=document.createElement('script');
  s.src='./admin-expense-crud-hotfix-v2.js?v=20260817-v4';
  s.dataset.tmdExpenseCrudV2='1';
  document.head.appendChild(s);
}
function loadFinal(){
  if(document.querySelector('script[data-tmd-final-finance]')){setTimeout(loadExpenseCrud,700);return;}
  const s=document.createElement('script');
  s.src='./admin-finance-final-v2.js?v=20260817-v4';
  s.dataset.tmdFinalFinance='1';
  s.onload=()=>setTimeout(loadExpenseCrud,700);
  document.head.appendChild(s);
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
    ids.forEach(id=>{const b=document.getElementById(id);if(b&&b.closest('body')&&b.closest('.tmd-finance-toolbar')!==toolbar)toolbar.appendChild(b)});
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
      @media(max-width:520px){.tmd-finance-toolbar{gap:8px}.tmd-finance-toolbar>.btn{padding-left:8px;padding-right:8px;font-size:13px}}
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
