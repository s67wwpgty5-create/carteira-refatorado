export const OUTLOOK_SENDER='linhares@mtrab.com.br';
export function isAppleMobile(device=typeof navigator==='undefined'?undefined:navigator){return !!device&&(/iPhone|iPad|iPod/i.test(device.userAgent)||(device.platform==='MacIntel'&&device.maxTouchPoints>1));}
export function openOutreach(url:string){if(isAppleMobile())window.location.href=url;else window.open(url,'_blank','noopener,noreferrer');}
export function whatsappHome(){return isAppleMobile()?'whatsapp://':'https://web.whatsapp.com/';}
export function whatsappNumber(phone?:string){
 let n=(phone||'').replace(/\D/g,'');
 if(n.length===10||n.length===11)n='55'+n;
 return /^[1-9]\d{11,14}$/.test(n)?n:null;
}
export function whatsappUrl(phone:string|undefined,message:string){const n=whatsappNumber(phone);if(n&&isAppleMobile())return `whatsapp://send?phone=${n}&text=${encodeURIComponent(message)}`;return n?`https://web.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(message)}`:null;}
export function outlookUrl(email:string|undefined,message:string){
 if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return null;
 if(isAppleMobile())return `ms-outlook://compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent('Acompanhamento comercial')}&body=${encodeURIComponent(message)}`;
 // mailto opens the installed default email client; Outlook must own that association.
 return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Acompanhamento comercial')}&body=${encodeURIComponent(message)}`;
}
export function whatsappQueue<T extends {id:string}>(clients:T[],contacts:Record<string,{phone?:string}>){
 const seen=new Set<string>();const ready:T[]=[],missing:T[]=[],duplicates:T[]=[];
 for(const c of clients){const number=whatsappNumber(contacts[c.id]?.phone);if(!number){missing.push(c);continue;}if(seen.has(number)){duplicates.push(c);continue;}seen.add(number);ready.push(c);}
 return {ready,missing,duplicates};
}
