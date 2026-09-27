import {z} from 'zod';
export const audienceSchema=z.object({name:z.string().trim().min(1).max(120),clients:z.array(z.string().regex(/^\d+$/)).min(1).max(25000).transform(v=>[...new Set(v)])});
export const scheduleSchema=z.object({audienceId:z.string().uuid(),message:z.string().trim().min(1).max(4000),due:z.string().datetime({offset:true}).refine(v=>Date.parse(v)>Date.now(),'Escolha uma data e hora futuras.'),timezone:z.literal('America/Sao_Paulo')});
export type Audience={id:string;name:string;clients:string[];created:string};
export type Schedule={id:string;audienceId:string;audienceName:string;clients:string[];message:string;due:string;timezone:string;created:string;status:'pending_manual'|'cancelled'};
