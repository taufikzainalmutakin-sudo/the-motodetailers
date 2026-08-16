(()=>{
'use strict';
function fix(){
  const time=document.getElementById('incomeTime');
  const select=document.getElementById('incomePaymentMethod');
  if(!time||!select)return;
  let label=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()==='Metode pembayaran');
  if(!label)return;
  if(label.parentElement===select.parentElement)return;
  const oldLabel=label,oldSelect=select;
  const wrap=document.createElement('div');
  wrap.appendChild(oldLabel);
  wrap.appendChild(oldSelect);
  time.parentElement.insertAdjacentElement('afterend',wrap);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});else fix();
})();
