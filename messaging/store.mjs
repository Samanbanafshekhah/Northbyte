import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID, randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const derive = promisify(scrypt);
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export const hash = value => createHash('sha256').update(value).digest('hex');
export const staff = user => user.role !== 'client';
export const manager = user => ['admin', 'super_admin'].includes(user.role);
export async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${Buffer.from(await derive(password, salt, 64)).toString('hex')}`;
}
export async function passwordMatches(password, encoded) {
  if(encoded.startsWith('$2')||encoded.startsWith('$argon'))return new Promise(resolve=>{const child=spawn(process.env.PHP_BINARY||'php',[fileURLToPath(new URL('./verify-password.php',import.meta.url))],{windowsHide:true,stdio:['pipe','pipe','ignore']});let result='';const timer=setTimeout(()=>{child.kill();resolve(false);},10000);child.on('error',()=>{clearTimeout(timer);resolve(false);});child.stdout.on('data',chunk=>{result+=chunk;});child.on('close',()=>{clearTimeout(timer);resolve(result==='true');});child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({password,encoded}));});
  const [salt, expected] = encoded.split(':');
  const actual = await derive(password, salt, 64);
  return timingSafeEqual(Buffer.from(expected, 'hex'), actual);
}
export function openStore(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(readFileSync(new URL('./migrations/001.sql', import.meta.url), 'utf8'));
  db.prepare('INSERT OR IGNORE INTO schema_migrations VALUES(?,?)').run(1,now());
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=2').get()) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync(new URL('./migrations/002.sql',import.meta.url),'utf8'));
      db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(2,now());
      db.exec('COMMIT');
    } catch(error) { db.exec('ROLLBACK'); throw error; }
  }
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } };
  const canAccess = (user, conversation) => Boolean(conversation && (manager(user) || user.role === 'team_member' && (!conversation.assigned_to || conversation.assigned_to === user.id) || conversation.client_id === user.id));
  const publicUser = user => ({ id: user.id, fullName: user.name, email: user.email, role: user.role });
  async function createUser(email, name, password, role = 'client') {
    const userId = id();
    const encoded = await passwordHash(password);
    run('INSERT INTO users(id,email,name,password,role,created_at) VALUES(?,?,?,?,?,?)', userId, email.toLowerCase(), name, encoded, role, now());
    return get('SELECT * FROM users WHERE id=?', userId);
  }
  function message(user, row) {
    if (!row || row.is_internal && !staff(user)) return null;
    const sender = get('SELECT id,name,role FROM users WHERE id=?', row.sender_id);
    const attachments = row.deleted_at ? [] : all('SELECT id,original_filename AS name,mime_type AS type,file_size AS size FROM message_attachments WHERE message_id=?', row.id);
    const reactions = row.deleted_at ? [] : all('SELECT emoji,user_id FROM message_reactions WHERE message_id=?', row.id);
    const reply = row.reply_to_id ? get('SELECT m.id,m.body,m.is_internal,m.deleted_at,u.name FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?', row.reply_to_id) : null;
    return { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, sender: sender.name, role: sender.role, body: row.deleted_at ? '' : row.body, internal: Boolean(row.is_internal), editedAt: row.edited_at, deletedAt: row.deleted_at, createdAt: row.created_at, nonce: row.client_nonce, attachments, reactions, reply: reply && (!reply.is_internal || staff(user)) ? { id: reply.id, body: reply.deleted_at ? 'Message deleted' : reply.body.slice(0,160), name: reply.name } : null };
  }
  function conversation(user, row) {
    const last = get(`SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.sender_id WHERE conversation_id=? AND (? OR is_internal=0) ORDER BY id DESC LIMIT 1`, row.id, Number(staff(user)));
    const participant = get('SELECT * FROM conversation_participants WHERE conversation_id=? AND user_id=?', row.id, user.id);
    const unread = get('SELECT count(*) AS n FROM messages WHERE conversation_id=? AND id>? AND sender_id<>? AND deleted_at IS NULL AND (? OR is_internal=0)', row.id, participant?.last_read_message_id || 0, user.id, Number(staff(user))).n;
    return { id: row.id, title: row.title, projectId: row.project_id, project: row.project_id ? get('SELECT id,title,status,description FROM projects WHERE id=?', row.project_id) : null, status: row.status, assignedTo: row.assigned_to, createdAt: row.created_at, updatedAt: last?.created_at || row.created_at, unread, muted: Boolean(participant?.muted), lastMessage: last ? { body: last.deleted_at ? 'Message deleted' : last.body || 'Attachment', sender: last.name, internal: Boolean(last.is_internal) } : null, client: publicUser(get('SELECT * FROM users WHERE id=?', row.client_id)), participants: all('SELECT u.id,u.name,u.role,p.last_read_message_id AS readId FROM conversation_participants p JOIN users u ON u.id=p.user_id WHERE p.conversation_id=?', row.id) };
  }
  return { db, run, get, all, transaction, canAccess, publicUser, createUser, message, conversation };
}
