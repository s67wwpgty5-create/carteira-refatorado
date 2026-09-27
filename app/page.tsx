import Portfolio from "./portfolio";
import seed from "@/lib/seed.json";
import type {Dataset} from "@/lib/portfolio";
import {requireChatGPTUser} from './chatgpt-auth';
export const dynamic="force-dynamic";
export default async function Home(){await requireChatGPTUser('/');return <Portfolio initial={seed as Dataset}/>;}
