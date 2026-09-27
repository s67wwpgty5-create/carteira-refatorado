export type MonthData={items:number;cents:number;services:Record<string,{items:number;cents:number}>};
export type Client={id:string;name:string;document:string;contract?:string;sector?:string;first:string;last:string;months:Record<string,MonthData>};
export type Dataset={cutoff:string;closedThrough:string;coverageConfirmed:boolean;monthCoverage?:Record<string,boolean>;source:string;clients:Client[];items:number};
export const brl=(c:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
export const monthLabel=(m:string)=>new Date(m+'-02T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'});
export function previousMonth(m:string){const [y,n]=m.split('-').map(Number);return n===1?`${y-1}-12`:`${y}-${String(n-1).padStart(2,'0')}`;}
export function evaluate(c:Client,m:string){if(c.months[m]?.items)return 'normal';let seq=0,p=previousMonth(m);while(c.months[p]?.items){seq++;p=previousMonth(p);}return seq>=2?'forte':seq===1?'ausencia':'normal';}
export function classify(clients:Client[],through:string){const ranked=clients.map(c=>({id:c.id,value:Object.entries(c.months).filter(([m])=>m<=through).reduce((s,[,b])=>s+b.cents,0)})).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));const total=ranked.reduce((s,c)=>s+c.value,0);let cum=0;return new Map(ranked.map(c=>{const abc=c.value===0?'Sem valor':cum<total*.8?'A':cum<total*.95?'B':'C';cum+=c.value;return[c.id,{abc,value:c.value,cumulative:total?cum/total:0}]}));}
export function frequency(c:Client,through:string){const n=Object.keys(c.months).filter(m=>m<=through&&c.months[m].items>0).length;return {n,label:n===0?'Sem histórico':n<=2?'Eventual':n<=4?'Ocasional':n<=6?'Frequente':'Muito frequente'};}
