import {z} from 'zod';
import {Client,Dataset,MonthData,previousMonth} from './portfolio';
export type Contacts=Record<string,Record<string,any>>;
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s},'Data inválida');
const text=(n:number)=>z.string().trim().max(n);
const identity={id:text(30).refine(s=>!s||/^\d+$/.test(s),'Código inválido'),name:text(500),document:text(40).transform(s=>s.replace(/\D/g,'')).refine(s=>!s||[11,14].includes(s.length),'CPF/CNPJ deve ter 11 ou 14 dígitos')};
export const importInput=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('production'),source:text(200),month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),closed:z.boolean(),rows:z.array(z.object({...identity,date,service:text(300).min(1),quantity:z.number().int().min(1).max(100000),cents:z.number().int().min(0).max(100000000000)})).min(1).max(50000)}),
 z.object({kind:z.literal('leads'),source:text(200),rows:z.array(z.object({...identity,email:z.union([z.literal(''),z.string().email().max(254)]),phone:text(30).refine(s=>!s||/^\+?[\d\s()-]{8,30}$/.test(s),'Telefone inválido'),city:text(100),region:text(100),contract:z.enum(['','Contrato','Não Contrato','Não localizado','Não informado','Cancelado','Vencido']),sector:text(150),owner:text(150)})).min(1).max(25000)})]);
export type ImportInput=z.infer<typeof importInput>;
const digits=(s:string)=>s.replace(/\D/g,'');
export function mergeImport(base:Dataset,oldContacts:Contacts,input:ImportInput){
 const dataset:Dataset=structuredClone(base),contacts:Contacts=structuredClone(oldContacts),byId=new Map(dataset.clients.map(c=>[c.id,c])),byDoc=new Map<string,Client[]>();
 for(const c of dataset.clients){const doc=digits(c.document);if(doc)byDoc.set(doc,[...(byDoc.get(doc)||[]),c]);}
 let next=Math.max(0,...dataset.clients.map(c=>Number(c.id)).filter(Number.isSafeInteger))+1;
 let added=0,updated=0,changedFields=0;const touched=new Set<string>();const examples:{client:string;change:string}[]=[];
 function resolve(row:{id:string;name:string;document:string}){if(!row.id&&!row.document)throw Error('Informe código ou CPF/CNPJ em todas as linhas.');let c=row.id?byId.get(row.id):undefined;const matches=row.document?byDoc.get(row.document)||[]:[];
 if(c&&row.document&&digits(c.document)&&digits(c.document)!==row.document)throw Error(`Código ${row.id}: CPF/CNPJ diferente do cadastro. Revise o arquivo.`);
 if(c&&!digits(c.document)&&matches.some(m=>m.id!==c!.id))throw Error('Documento já vinculado a outro código.');
 if(!c&&matches.length>1)throw Error(`CPF/CNPJ ${row.document}: vários códigos existentes. Informe o código correto.`);
 if(!c&&matches.length===1){if(row.id&&row.id!==matches[0].id)throw Error(`Código ${row.id} diverge do código cadastrado para o documento.`);c=matches[0];}
 if(!c){if(!row.name)throw Error('Nome obrigatório para cliente novo.');const id=row.id||String(next++);if(!Number.isSafeInteger(Number(id)))throw Error('Código fora do limite permitido.');if(Number(id)>=next)next=Number(id)+1;c={id,name:row.name,document:row.document,contract:'Não informado',first:'',last:'',months:{}};dataset.clients.push(c);byId.set(id,c);if(row.document)byDoc.set(row.document,[...(byDoc.get(row.document)||[]),c]);added++;examples.push({client:c.name,change:'Novo cliente'});}return c;}
 let previousItems=0,previousCents=0,newItems=0,newCents=0;
 if(input.kind==='production'){
 const end=new Date(input.month+'-01T12:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);const monthEnd=end.toISOString().slice(0,10);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(input.month>today.slice(0,7))throw Error('Não é possível importar produção futura.');if(input.closed&&monthEnd>=today)throw Error('O mês só pode ser fechado depois de terminar.');
 for(const c of dataset.clients){const m=c.months[input.month];if(m){previousItems+=m.items;previousCents+=m.cents;}delete c.months[input.month];}
 const unique=new Set<string>();let last='';
 for(const [i,row] of input.rows.entries()){if(row.date.slice(0,7)!==input.month||row.date>today)throw Error(`Linha ${i+2}: data fora do mês escolhido ou no futuro.`);const c=resolve(row);const key=JSON.stringify([c.id,row.date,row.service]);if(unique.has(key))throw Error(`Linha ${i+2}: cliente, data e serviço repetidos. Agrupe quantidade e valor em uma única linha.`);unique.add(key);touched.add(c.id);const m:MonthData=c.months[input.month]??={items:0,cents:0,services:Object.create(null)};m.items+=row.quantity;m.cents+=row.cents;const service=m.services[row.service]??={items:0,cents:0};service.items+=row.quantity;service.cents+=row.cents;c.first=!c.first||row.date<c.first?row.date:c.first;c.last=row.date>c.last?row.date:c.last;last=row.date>last?row.date:last;newItems+=row.quantity;newCents+=row.cents;}
 dataset.items=dataset.clients.reduce((s,c)=>s+Object.values(c.months).reduce((n,m)=>n+m.items,0),0);dataset.cutoff=[base.cutoff,input.closed?monthEnd:last].sort().at(-1)!;dataset.monthCoverage={...base.monthCoverage};let unconfirmed=base.closedThrough;for(let i=0;i<2400&&unconfirmed<input.month;i++){const [year,num]=unconfirmed.split('-').map(Number);unconfirmed=num===12?`${year+1}-01`:`${year}-${String(num+1).padStart(2,'0')}`;if(dataset.monthCoverage[unconfirmed]===undefined)dataset.monthCoverage[unconfirmed]=false;}dataset.monthCoverage[input.month]=input.closed;if(input.closed&&input.month>dataset.closedThrough)dataset.closedThrough=input.month;else if(!input.closed&&input.month===dataset.closedThrough)dataset.closedThrough=previousMonth(input.month);updated=touched.size-added;
 }else{for(const [i,row] of input.rows.entries()){const c=resolve(row);if(touched.has(c.id))throw Error(`Linha ${i+2}: cliente repetido no arquivo de Leads.`);touched.add(c.id);let fields=0;for(const [field,value] of Object.entries({name:row.name,document:row.document,contract:row.contract,sector:row.sector})){if(value&&(c as any)[field]!==value){(c as any)[field]=value;fields++;}}if(row.document&&!byDoc.get(row.document)?.some(x=>x.id===c.id))byDoc.set(row.document,[...(byDoc.get(row.document)||[]),c]);const contact=contacts[c.id]??={phone:'',email:'',owner:'',region:''};for(const [field,value] of Object.entries({email:row.email,phone:row.phone,city:row.city,region:row.region,owner:row.owner})){if(value&&contact[field]!==value){contact[field]=value;fields++;}}if(fields){updated++;changedFields+=fields;examples.push({client:c.name,change:`${fields} campos atualizados`});contact.contactSource=input.source;}}}
 dataset.source=input.source;
 return {dataset,contacts,summary:{kind:input.kind,rows:input.rows.length,added,updated,changedFields,affected:touched.size,previousItems,previousCents,newItems,newCents,examples:examples.slice(0,30)}};
}
