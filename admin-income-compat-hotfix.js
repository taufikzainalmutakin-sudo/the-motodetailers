(()=>{
'use strict';
function patch(){
  document.querySelectorAll('[data-income-hotfix-price]').forEach(x=>{
    if(!x.dataset.incomePrice)x.dataset.incomePrice=x.dataset.incomeHotfixPrice||'';
    if(!x.dataset.incomePriceId)x.dataset.incomePriceId=x.dataset.incomeHotfixPrice||'';
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
new MutationObserver(patch).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',patch,true);
})();
