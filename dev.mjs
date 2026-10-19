import {spawn,spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
if(!existsSync(new URL('./backend/vendor/autoload.php',import.meta.url))||!existsSync(new URL('./backend/.env',import.meta.url))){console.error('Complete the backend setup in ADMIN.md before starting the workspace.');process.exit(1);}
const php=process.env.PHP_BINARY||'php';
const hasZip=spawnSync(php,['-r','echo extension_loaded("zip") ? "yes" : "no";'],{encoding:'utf8',windowsHide:true});
const args=[...(hasZip.stdout?.trim()==='yes'?[]:['-d','extension=zip']),'-d','upload_max_filesize=50M','-d','post_max_size=64M','-S',`127.0.0.1:${process.env.LARAVEL_PORT||8001}`,'router.php'];
const backend=spawn(php,args,{cwd:new URL('./backend/',import.meta.url),stdio:'inherit',windowsHide:true});
const frontend=spawn(process.execPath,['server.mjs'],{cwd:root,stdio:'inherit',windowsHide:true});
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;backend.kill();frontend.kill();setTimeout(()=>process.exit(code),100).unref();}
for(const child of [backend,frontend]){child.on('error',error=>{console.error(error.message);stop(1);});child.on('exit',code=>stop(code||0));}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
