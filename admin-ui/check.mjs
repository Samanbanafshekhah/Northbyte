import {spawnSync} from 'node:child_process';
const result=spawnSync(process.env.PHP_BINARY||'php',['-d','extension=zip','vendor/phpunit/phpunit/phpunit','--testdox'],{cwd:new URL('../backend/',import.meta.url),stdio:'inherit',windowsHide:true});process.exit(result.status??1);
