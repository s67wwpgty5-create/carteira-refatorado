import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw Error('Banco indisponível');return env.DB;}
