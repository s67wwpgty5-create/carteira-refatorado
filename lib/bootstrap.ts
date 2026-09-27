import contacts from './initial-contacts.json';
import {database} from './database';
import type {ChatGPTUser} from '@/app/chatgpt-auth';
// Copy the approved local records to the owner's authenticated cloud identity once.
export async function bootstrapContacts(user:ChatGPTUser){
 if(user.email.toLowerCase()!=='brunomunaretto88@hotmail.com')return;
 const db=database();const marker=await db.prepare("SELECT id FROM records WHERE owner=? AND kind='bootstrap' AND id='contacts-v1'").bind(user.userId).first();if(marker)return;
 const now=new Date().toISOString();const entries=Object.entries(contacts);
 for(let i=0;i<entries.length;i+=80)await db.batch(entries.slice(i,i+80).map(([id,value])=>db.prepare("INSERT INTO records (owner,kind,id,payload,updated) VALUES (?,'contact',?,?,?) ON CONFLICT(owner,kind,id) DO NOTHING").bind(user.userId,id,JSON.stringify(value),now)));
 await db.prepare("INSERT INTO records (owner,kind,id,payload,updated) VALUES (?,'bootstrap','contacts-v1','{}',?) ON CONFLICT(owner,kind,id) DO NOTHING").bind(user.userId,now).run();
}
