import {z} from 'zod';
import {validateDocument} from '@/lib/document-validation';

const measure=z.object({items:z.number().int().nonnegative().max(10000000),cents:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)});

// Document validation
const documentSchema = z.string().max(40).refine(
  (doc) => !doc || validateDocument(doc),
  'CPF ou CNPJ inválido'
);

export const datasetSchema=z.object({cutoff:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),closedThrough:z.string().regex(/^\d{4}-\d{2}$/),coverageConfirmed:z.literal(true),source:z.string().min(1).max(250),items:z.number().int().positive().max(1000000),clients:z.array(z.object({id:z.string().regex(/^\d+$/).max(30),name:z.string().min(1).max(500),document:documentSchema,contract:z.string().max(80).optional(),sector:z.string().max(150).optional(),first:z.string().max(10),last:z.string().max(10),months:z.record(z.string().regex(/^\d{4}-\d{2}$/),measure.extend({services:z.record(z.string().max(300),measure)}))})).min(1).max(25000)}).superRefine((d,ctx)=>{if(new Set(d.clients.map(c=>c.id)).size!==d.clients.length)ctx.addIssue({code:'custom',message:'Códigos repetidos'});if(d.closedThrough>=d.cutoff.slice(0,7))ctx.addIssue({code:'custom',message:'O último mês deve permanecer parcial'});const items=d.clients.reduce((s,c)=>s+Object.values(c.months).reduce((a,m)=>a+m.items,0),0);if(items!==d.items)ctx.addIssue({code:'custom',message:'Total de itens inconsistente'});for(const c of d.clients)for(const m of Object.values(c.months)){if(Object.values(m.services).reduce((s,v)=>s+v.items,0)!==m.items||Object.values(m.services).reduce((s,v)=>s+v.cents,0)!==m.cents)ctx.addIssue({code:'custom',message:'Total de serviços inconsistente'});}});
