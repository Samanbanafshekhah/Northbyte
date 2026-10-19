import { passwordMatches } from './store.mjs';
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>2048)process.exit(1);}
try{const {password,encoded}=JSON.parse(input);process.stdout.write(String(await passwordMatches(password,encoded)));}catch{process.stdout.write('false');}
