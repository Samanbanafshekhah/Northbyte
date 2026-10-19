import { content,technologies } from '../content.js';
import { siteConfig } from '../site.config.js';
import { mkdir,writeFile } from 'node:fs/promises';
const keys=['heroLabel','heroTitle','heroText','footerStatement','servicesIntro','workIntro','techIntro','contactIntro'];
const seed={copy:Object.fromEntries(['en','fa'].map(lang=>[lang,Object.fromEntries(keys.map(key=>[key,content[lang][key]]))])),services:Object.fromEntries(['en','fa'].map(lang=>[lang,content[lang].services.map(([number,title,description,tags])=>({number,title,description,tags}))])),portfolio:Object.fromEntries(['en','fa'].map(lang=>[lang,content[lang].projects])),technologies:{items:technologies},team:{people:siteConfig.people.map(({id,name,bio})=>({id,name,bio}))}};
await mkdir(new URL('../backend/database/seed-data/',import.meta.url),{recursive:true});
await writeFile(new URL('../backend/database/seed-data/site.json',import.meta.url),JSON.stringify(seed,null,2));
