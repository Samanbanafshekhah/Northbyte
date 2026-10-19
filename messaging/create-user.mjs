import { openStore } from './store.mjs';
const [email,name,role = 'admin'] = process.argv.slice(2);
if (!email || !name || !['super_admin','admin','team_member','client'].includes(role) || !process.env.NEW_USER_PASSWORD || process.env.NEW_USER_PASSWORD.length < 12) {
  console.error('Set NEW_USER_PASSWORD (12+ characters), then run: node messaging/create-user.mjs email "Full name" admin|team_member|super_admin|client');
  process.exit(1);
}
const store = openStore(process.env.DATABASE_PATH || './private/northbyte.sqlite');
try { await store.createUser(email,name,process.env.NEW_USER_PASSWORD,role); console.log('User created.'); }
finally { store.db.close(); }
