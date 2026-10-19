import {content,technologies} from './content.js';
import {siteConfig} from './site.config.js';
export function applyPublishedContent(data){
 if(!data||typeof data!=='object')return;
 for(const language of ['en','fa']){
  const copy=data.copy?.[language];if(copy)for(const key of ['heroLabel','heroTitle','heroText','footerStatement','servicesIntro','workIntro','techIntro','contactIntro'])if(typeof copy[key]==='string')content[language][key]=copy[key];
  const services=data.services?.[language];if(Array.isArray(services)&&services.length<=12)content[language].services=services.map(s=>[s.number,s.title,s.description,s.tags].map(value=>String(value??'')));
  const portfolio=data.portfolio?.[language];if(Array.isArray(portfolio)&&portfolio.length<=30&&portfolio.every(p=>['capabilities','tech','diagram'].every(k=>Array.isArray(p[k]))))content[language].projects=portfolio;
 }
 if(Array.isArray(data.technologies?.items))technologies.splice(0,technologies.length,...data.technologies.items.map(String).slice(0,100));
 if(Array.isArray(data.team?.people))for(const person of data.team.people){const original=siteConfig.people.find(p=>p.id===person.id);if(!original)continue;for(const lang of ['en','fa']){if(typeof person.name?.[lang]==='string')original.name[lang]=person.name[lang];if(typeof person.bio?.[lang]==='string')original.bio[lang]=person.bio[lang];}}
 if(typeof data.settings?.brand==='string'&&data.settings.brand.trim())siteConfig.brand=data.settings.brand;
 if(typeof data.settings?.contactEmail==='string'&&(!data.settings.contactEmail||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.settings.contactEmail)))siteConfig.contactEmail=data.settings.contactEmail;
}
