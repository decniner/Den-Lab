(function(root){
'use strict';
function reasonForMonth(place,month){
 if(!place||!Array.isArray(place.months)||!place.months.includes(month))return null;
 const reason=place.monthReasons?.[month];
 return typeof reason==='string'&&reason.trim()?reason.trim():null;
}
function picksForMonth(places,month){
 if(!Number.isInteger(month)||month<1||month>12)return [];
 return (places||[]).flatMap(place=>{
  const reason=reasonForMonth(place,month);
  return reason?[{place,reason}]:[];
 });
}
const api=Object.freeze({reasonForMonth,picksForMonth});
root.JapanSeasonalEligibility=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
