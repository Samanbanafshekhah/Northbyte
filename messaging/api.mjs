import { randomBytes } from 'node:crypto';
import { openStore, now, id, hash, staff, manager, passwordMatches } from './store.mjs';

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const requireValue = (condition, status, message) => { if (!condition) throw new HttpError(status, message); };
const string = (value, max, required = true) => { requireValue(typeof value === 'string' && value.length <= max && (!required || value.trim().length), 400, `Enter valid text (maximum ${max} characters).`); return value.trim(); };
const emojis = ['👍','❤️','🎉','🚀','👀','✅'];
async function body(req, limit = 262144, binary = false) {
  requireValue(!req.headers['content-length'] || Number(req.headers['content-length']) <= limit,413,'File or request is too large.');
  const data=await new Promise((resolve,reject)=>{
    const chunks=[];let length=0;
    const onData=chunk=>{length+=chunk.length;if(length>limit){req.off('data',onData);req.resume();reject(new HttpError(413,'File or request is too large.'));}else chunks.push(chunk);};
    req.on('data',onData);req.once('end',()=>resolve(Buffer.concat(chunks)));req.once('error',reject);req.once('aborted',()=>reject(new HttpError(400,'Upload interrupted.')));
  });
  if (binary) return data;
  requireValue(req.headers['content-type']?.startsWith('application/json'), 415, 'JSON required.');
  let parsed;
  try { parsed=JSON.parse(data.toString()); } catch { throw new HttpError(400, 'Invalid JSON.'); }
  requireValue(parsed && typeof parsed==='object' && !Array.isArray(parsed),400,'A JSON object is required.');
  return parsed;
}
function fileType(data, name) {
  const ext = name.split('.').at(-1).toLowerCase();
  if (ext === 'png' && data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (['jpg','jpeg'].includes(ext) && data[0] === 255 && data[1] === 216 && data[2] === 255) return 'image/jpeg';
  if (ext === 'webp' && data.toString('ascii',0,4) === 'RIFF' && data.toString('ascii',8,12) === 'WEBP') return 'image/webp';
  if (ext === 'pdf' && data.toString('ascii',0,5) === '%PDF-') return 'application/pdf';
  if (['txt','md'].includes(ext) && !data.includes(0)) { try { new TextDecoder('utf-8', { fatal: true }).decode(data); return 'text/plain'; } catch {} }
  throw new HttpError(415, 'Choose a valid PNG, JPG, WEBP, PDF, TXT or MD file.');
}

export async function createMessaging({ database = process.env.DATABASE_PATH || './private/northbyte.sqlite', origin = process.env.PUBLIC_ORIGIN || 'http://127.0.0.1:4173', demo = process.env.NODE_ENV !== 'production', secure = process.env.NODE_ENV === 'production' } = {}) {
  const store = openStore(database);
  const { run, get, all, transaction, canAccess, publicUser } = store;
  if (demo) {
    if (!get('SELECT id FROM users WHERE email=?', 'client@northbyte.dev')) await store.createUser('client@northbyte.dev', 'Demo Client', 'NorthByte2026!');
    if (!get('SELECT id FROM users WHERE email=?', 'team@northbyte.dev')) await store.createUser('team@northbyte.dev', 'NorthByte Team', 'NorthByteTeam2026!', 'admin');
  }
  const streams = new Set();
  const limits = new Map();
  const typingTimers = new Map();
  let closed = false;
  const hasAdmin = Boolean(get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_settings'"));
  function setting(key,fallback){if(!hasAdmin)return fallback;const row=get('SELECT value FROM admin_settings WHERE key=?',key);try{return row?JSON.parse(row.value):fallback;}catch{return fallback;}}
  function live(stream){const current=get('SELECT u.*,s.token FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?',stream.user.token,Date.now());if(!current||current.status&&current.status!=='active'){stream.res.end();return false;}stream.user=current;return true;}
  function rate(key, max, duration = 60000) {
    const time = Date.now(); const value = limits.get(key);
    if (!value || value.until < time) { limits.set(key, { count: 1, until: time + duration }); return; }
    requireValue(++value.count <= max, 429, 'Too many requests. Please wait and try again.');
  }
  function json(res, status, data) { res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }); res.end(JSON.stringify(data)); }
  function session(req) {
    const token = /(?:^|;\s*)nb_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    return token ? get('SELECT u.*,s.csrf,s.expires,s.token FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?', hash(token), Date.now()) : null;
  }
  function setSession(res, user, remember = false) {
    const token = randomBytes(32).toString('hex'); const csrf = randomBytes(32).toString('hex');
    const seconds = remember ? 604800 : 43200;
    run('INSERT INTO sessions VALUES(?,?,?,?)', hash(token), user.id, csrf, Date.now() + seconds * 1000);
    res.setHeader('Set-Cookie', `nb_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${seconds}${secure ? '; Secure' : ''}`);
    return csrf;
  }
  function authorize(user, conversationId) {
    const conversation = get('SELECT * FROM conversations WHERE id=?', conversationId);
    requireValue(canAccess(user, conversation), 404, 'Conversation not found.');
    return conversation;
  }
  function visibleMessage(user, messageId) {
    const message = get('SELECT * FROM messages WHERE id=?', messageId);
    requireValue(message && (!message.is_internal || staff(user)), 404, 'Message not found.');
    authorize(user, message.conversation_id);
    return message;
  }
  function emit(stream, type, data, eventId) {
    if (stream.res.writableEnded || stream.res.destroyed) return;
    if (eventId) stream.res.write(`id: ${eventId}\n`);
    stream.res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  }
  function broadcast(type, conversationId, data = {}, internal = false) {
    const conversation = get('SELECT * FROM conversations WHERE id=?', conversationId);
    for (const stream of streams) if (live(stream)&&canAccess(stream.user, conversation) && (!internal || staff(stream.user))) emit(stream, type, { conversationId, ...data });
  }
  function event(type, conversationId, internal = false, messageId = null) {
    const eventId = Number(run('INSERT INTO events(conversation_id,type,internal,created_at,message_id) VALUES(?,?,?,?,?)', conversationId, type, Number(internal), now(),messageId).lastInsertRowid);
    const conversation = get('SELECT * FROM conversations WHERE id=?', conversationId);
    for (const stream of streams) if (live(stream)&&canAccess(stream.user, conversation) && (!internal || staff(stream.user))) emit(stream, type, { conversationId,messageId }, eventId);
    if(hasAdmin&&type==='message.created'&&!internal&&messageId){const message=get('SELECT sender_id FROM messages WHERE id=?',messageId);run('INSERT INTO activity_logs(actor_id,action,target_type,target_id,changes,created_at) VALUES(?,?,?,?,?,?)',message.sender_id,'message.created',conversation.project_id?'project':'conversation',conversation.project_id||conversationId,'{}',now());}
  }
  function presence(conversation) {
    return [...new Set([...streams].filter(s => canAccess(s.user, conversation)).map(s => s.user.id))];
  }
  const maintenance = setInterval(() => {
    const time = Date.now();
    for (const [key, value] of limits) if (value.until < time) limits.delete(key);
    run('DELETE FROM sessions WHERE expires<?', time);
    run('DELETE FROM message_attachments WHERE message_id IS NULL AND created_at<?',new Date(time-86400000).toISOString());
    for (const stream of streams) {
      if (!live(stream)) continue;
      stream.res.write(': heartbeat\n\n');
    }
  }, 20000);
  maintenance.unref();

  async function handle(req, res, url) {
    if (!url.pathname.startsWith('/api/')) return false;
    try {
      const path = url.pathname.slice(4).split('/').filter(Boolean);
      const method = req.method;
      const mutation = !['GET','HEAD'].includes(method);
      if (mutation) requireValue(req.headers.origin === origin, 403, 'Request origin is not allowed.');
      const ip = req.socket.remoteAddress;
      if (path[0] === 'auth' && ['login','register'].includes(path[1]) && method === 'POST') {
        rate(`auth:${ip}`, 120, 900000);
        const data = await body(req);
        const email = string(data.email, 254).toLowerCase();
        rate(`auth-account:${email}`,15,900000);
        const password = string(data.password, 256);
        requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8, 400, 'Enter a valid email and a password of at least 8 characters.');
        if (path[1] === 'register') {
          requireValue(setting('registration_open',demo || process.env.ALLOW_REGISTRATION === 'true'), 403, 'Registration is currently closed.');
          requireValue(!get('SELECT id FROM users WHERE email=?', email), 409, 'An account with this email already exists.');
          const user = await store.createUser(email, string(data.name, 100), password);
          if(hasAdmin)run('INSERT INTO activity_logs(actor_id,action,target_type,target_id,changes,created_at) VALUES(?,?,?,?,?,?)',user.id,'client.registered','client',user.id,'{}',now());
          json(res, 201, { user: publicUser(user) }); return true;
        }
        const user = get('SELECT * FROM users WHERE email=?', email);
        // Derive a dummy hash for unknown accounts to avoid a fast account-existence signal.
        const encoded = user?.password || '00000000000000000000000000000000:' + '00'.repeat(64);
        requireValue(await passwordMatches(password, encoded) && user && (!user.status||user.status==='active'), 401, 'Email or password is incorrect.');
        const csrf = setSession(res, user, Boolean(data.remember));
        json(res, 200, { user: publicUser(user), csrf }); return true;
      }
      const user = session(req);
      requireValue(user&&(!user.status||user.status==='active'), 401, 'Please sign in.');
      if(user.role!=='client'&&user.permissions){const permissions=typeof user.permissions==='string'?JSON.parse(user.permissions):user.permissions;requireValue(user.role==='super_admin'||permissions.includes('messages'),403,'Messaging permission required.');}
      if (mutation) { requireValue(req.headers['x-csrf-token'] === user.csrf, 403, 'Session verification failed. Refresh and retry.'); rate(`user:${user.id}`, 180); }
      if (path.join('/') === 'session' && method === 'GET') { json(res,200,{ user: publicUser(user), csrf:user.csrf }); return true; }
      if (path.join('/') === 'auth/logout' && method === 'POST') {
        run('DELETE FROM sessions WHERE token=?', user.token);
        for (const stream of streams) if (stream.user.token === user.token) stream.res.end();
        res.setHeader('Set-Cookie','nb_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); json(res,200,{ ok:true }); return true;
      }
      if (path[0] === 'team' && method === 'GET') {
        // Only expose staff identity to authorized inbox users.
        requireValue(staff(user),403,'Team access required.');
        const clients = () => manager(user) ? all('SELECT id,name,email FROM users WHERE role=? ORDER BY name LIMIT 100', 'client') : all('SELECT DISTINCT u.id,u.name,u.email FROM users u JOIN conversations c ON c.client_id=u.id WHERE c.assigned_to=? OR c.assigned_to IS NULL ORDER BY u.name LIMIT 100',user.id);
        json(res,200,{ users:path[1]==='clients' ? clients() : all('SELECT id,name,role FROM users WHERE role<>?', 'client') }); return true;
      }
      if (path[0] === 'events' && method === 'GET') {
        rate(`stream:${user.id}`, 30);
        requireValue([...streams].filter(s=>s.user.id === user.id).length < 8, 429, 'Too many live connections.');
        res.writeHead(200,{ 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache, no-store', Connection:'keep-alive', 'X-Accel-Buffering':'no' });
        const stream = { user, res }; streams.add(stream);
        const since = Number(req.headers['last-event-id'] || url.searchParams.get('since') || 0);
        const latest = get('SELECT coalesce(max(id),0) AS id FROM events').id;
        // Invalidation-only events never carry message text, files, or internal notes.
        if (since) for (const row of all('SELECT * FROM events WHERE id>? ORDER BY id LIMIT 1000', since)) {
          const conversation = get('SELECT * FROM conversations WHERE id=?',row.conversation_id);
          if (canAccess(user,conversation) && (!row.internal || staff(user))) emit(stream,row.type,{ conversationId:row.conversation_id,messageId:row.message_id },row.id);
        }
        emit(stream,'ready',{ cursor:latest },latest);
        for (const conversation of all('SELECT * FROM conversations')) if (canAccess(user,conversation)) broadcast('presence.updated',conversation.id,{ online:presence(conversation) });
        res.on('close',()=>{
          streams.delete(stream);
          if (closed) return;
          for (const conversation of all('SELECT * FROM conversations')) if (canAccess(user,conversation)) broadcast('presence.updated',conversation.id,{ online:presence(conversation) });
        });
        return true;
      }
      if (path[0] === 'projects' && method === 'POST') {
        requireValue(user.role === 'client',403,'Client access required.');
        const data = await body(req);
        const projectId = string(data.id,80); const existing = get('SELECT * FROM projects WHERE id=?',projectId);
        requireValue(!existing || existing.owner_id === user.id,404,'Project not found.');
        if (!existing) run('INSERT INTO projects(id,owner_id,title,status,description,created_at) VALUES(?,?,?,?,?,?)', projectId,user.id,string(data.title,140),'New Request',string(data.description || '',10000,false),now());
        json(res,200,{ project:get('SELECT id,title,status FROM projects WHERE id=?',projectId) }); return true;
      }
      if (path[0] === 'conversations' && path.length === 1) {
        if (method === 'GET') {
          const scope=manager(user)?'1=1':user.role==='team_member'?'(c.assigned_to IS NULL OR c.assigned_to=?)':'c.client_id=?';
          const scopeArgs=manager(user)?[]:[user.id];
          const clauses=[scope];const args=[...scopeArgs];
          const search=(url.searchParams.get('search')||'').slice(0,140);
          if(search){clauses.push('(instr(lower(c.title),lower(?))>0 OR instr(lower(u.name),lower(?))>0)');args.push(search,search);}
          const filter=url.searchParams.get('filter');
          const unreadSql='EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id=c.id AND m.sender_id<>? AND m.deleted_at IS NULL AND (? OR m.is_internal=0) AND m.id>coalesce((SELECT last_read_message_id FROM conversation_participants WHERE conversation_id=c.id AND user_id=?),0))';
          if(['open','pending','resolved','closed'].includes(filter)){clauses.push('c.status=?');args.push(filter);}
          if(filter==='assigned'){clauses.push('c.assigned_to=?');args.push(user.id);}
          if(filter==='unassigned')clauses.push('c.assigned_to IS NULL');
          if(filter==='unread'){clauses.push(unreadSql);args.push(user.id,Number(staff(user)),user.id);}
          const total=get(`SELECT count(*) AS n FROM conversations c JOIN users u ON u.id=c.client_id WHERE ${clauses.join(' AND ')}`,...args).n;
          const before=url.searchParams.get('before');
          if(before){const cursor=authorize(user,before);clauses.push('(c.updated_at<? OR (c.updated_at=? AND c.id<?))');args.push(cursor.updated_at,cursor.updated_at,cursor.id);}
          const rows=all(`SELECT c.* FROM conversations c JOIN users u ON u.id=c.client_id WHERE ${clauses.join(' AND ')} ORDER BY c.updated_at DESC,c.id DESC LIMIT 51`,...args);
          const more=rows.length>50;if(more)rows.pop();
          const unreadTotal=get(`SELECT count(*) AS n FROM messages m JOIN conversations c ON c.id=m.conversation_id LEFT JOIN conversation_participants p ON p.conversation_id=c.id AND p.user_id=? WHERE ${scope} AND m.id>coalesce(p.last_read_message_id,0) AND m.sender_id<>? AND m.deleted_at IS NULL AND (? OR m.is_internal=0)`,user.id,...scopeArgs,user.id,Number(staff(user))).n;
          json(res,200,{conversations:rows.map(row=>store.conversation(user,row)),nextCursor:more?rows.at(-1).id:null,unreadTotal,total}); return true;
        }
        if (method === 'POST') {
          const data = await body(req); rate(`new:${user.id}`,15);
          const clientId = staff(user) ? string(data.clientId,80) : user.id;
          requireValue(get('SELECT id FROM users WHERE id=? AND role=?',clientId,'client'),400,'Choose a client.');
          if (user.role === 'team_member') requireValue(get('SELECT id FROM conversations WHERE client_id=? AND (assigned_to=? OR assigned_to IS NULL)',clientId,user.id),403,'This client is outside your team scope.');
          const projectId = data.projectId ? string(data.projectId,80) : null;
          if (projectId) {
            const project = get('SELECT * FROM projects WHERE id=? AND owner_id=?',projectId,clientId);
            requireValue(project,404,'Project not found.');
            const existing = get('SELECT * FROM conversations WHERE project_id=?',projectId);
            if (existing) { authorize(user,existing.id); json(res,200,{ conversation:store.conversation(user,existing) }); return true; }
          }
          const conversationId = id(); const timestamp = now();
          transaction(()=>{
            run('INSERT INTO conversations VALUES(?,?,?,?,?,?,?,?)',conversationId,string(data.title,140),projectId,clientId,'open',null,timestamp,timestamp);
            run('INSERT INTO conversation_participants(conversation_id,user_id) VALUES(?,?)',conversationId,clientId);
          });
          event('conversation.updated',conversationId);
          json(res,201,{ conversation:store.conversation(user,get('SELECT * FROM conversations WHERE id=?',conversationId)) }); return true;
        }
      }
      if (path[0] === 'attachments' && path[1] && method === 'GET') {
        const attachment = get('SELECT * FROM message_attachments WHERE id=?',path[1]);
        requireValue(attachment,404,'File not found.'); authorize(user,attachment.conversation_id);
        if (attachment.message_id) { const message = visibleMessage(user,attachment.message_id); requireValue(!message.deleted_at,404,'File not found.'); }
        else requireValue(attachment.uploader_id === user.id,404,'File not found.');
        res.writeHead(200,{ 'Content-Type':attachment.mime_type,'Content-Length':attachment.file_size,'Content-Disposition':`${attachment.mime_type.startsWith('image/') && url.searchParams.has('preview') ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(attachment.original_filename)}`,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'private, no-store' });
        res.end(Buffer.from(attachment.data)); return true;
      }
      if (path[0] === 'conversations' && path[1]) {
        const conversation = authorize(user,path[1]); const cid = conversation.id;
        if (path.length === 2 && method === 'PATCH') {
          const data = await body(req);
          requireValue(staff(user),403,'Team access required.');
          if (data.status) requireValue(['open','pending','resolved','closed'].includes(data.status),400,'Invalid status.');
          if (data.assignedTo !== undefined) {
            requireValue(manager(user) || data.assignedTo === user.id && !conversation.assigned_to,403,'Only managers can reassign conversations.');
            requireValue(data.assignedTo === null || get('SELECT id FROM users WHERE id=? AND role<>?',data.assignedTo,'client'),400,'Invalid team member.');
          }
          run('UPDATE conversations SET status=?,assigned_to=?,updated_at=? WHERE id=?',data.status || conversation.status,data.assignedTo === undefined ? conversation.assigned_to : data.assignedTo,now(),cid);
          if (data.assignedTo) run('INSERT OR IGNORE INTO conversation_participants(conversation_id,user_id) VALUES(?,?)',cid,data.assignedTo);
          event('conversation.updated',cid);
          // All authorized team inboxes refresh when an assignment changes their scope.
          for (const stream of streams) if (staff(stream.user)) emit(stream,'inbox.updated',{});
          json(res,200,{ ok:true }); return true;
        }
        if (path[2] === 'messages' && method === 'GET') {
          const before = Number(url.searchParams.get('before')) || Number.MAX_SAFE_INTEGER;
          const search=(url.searchParams.get('search')||'').slice(0,500);
          const rows = all('SELECT * FROM messages WHERE conversation_id=? AND id<? AND (? OR is_internal=0) AND instr(lower(body),lower(?))>0 ORDER BY id DESC LIMIT 41',cid,before,Number(staff(user)),search);
          const hasMore = rows.length > 40; if (hasMore) rows.pop();
          const activity=all("SELECT type,created_at,internal FROM events WHERE conversation_id=? AND (? OR internal=0) AND type IN ('conversation.updated','message.created','message.updated','message.deleted') ORDER BY id DESC LIMIT 8",cid,Number(staff(user)));
          json(res,200,{ activity,messages:rows.reverse().map(row=>store.message(user,row)),hasMore,online:presence(conversation),conversation:store.conversation(user,conversation),files:all('SELECT a.id,a.original_filename AS name,a.mime_type AS type,a.file_size AS size FROM message_attachments a JOIN messages m ON m.id=a.message_id WHERE a.conversation_id=? AND m.deleted_at IS NULL AND (? OR m.is_internal=0) ORDER BY m.id DESC LIMIT 30',cid,Number(staff(user))) }); return true;
        }
        if (path[2] === 'messages' && method === 'POST') {
          requireValue(conversation.status !== 'closed',409,'This conversation is closed. Ask the team to reopen it.');
          rate(`message:${user.id}`,45);
          const data = await body(req); const text = string(data.body || '',5000,false); const nonce = string(data.nonce,100);
          requireValue(!data.internal || staff(user),403,'Internal notes require team access.');
          const internal = Boolean(data.internal);
          const duplicate = get('SELECT * FROM messages WHERE sender_id=? AND client_nonce=?',user.id,nonce);
          if (duplicate) { requireValue(duplicate.conversation_id === cid,409,'Message key already used.'); json(res,200,{ message:store.message(user,duplicate) }); return true; }
          const attachments = data.attachments || [];
          requireValue(Array.isArray(attachments) && attachments.length <= 6 && new Set(attachments).size === attachments.length && (text || attachments.length),400,'Write a message or attach up to six files.');
          if (data.replyTo) { const reply = visibleMessage(user,Number(data.replyTo)); requireValue(reply.conversation_id === cid && !reply.deleted_at && (!reply.is_internal || internal),400,'Invalid reply.'); }
          for (const aid of attachments) requireValue(typeof aid === 'string' && get('SELECT id FROM message_attachments WHERE id=? AND conversation_id=? AND uploader_id=? AND message_id IS NULL',aid,cid,user.id),400,'Invalid attachment.');
          const messageId = transaction(()=>{
            const messageId = Number(run('INSERT INTO messages(conversation_id,sender_id,body,reply_to_id,is_internal,created_at,client_nonce) VALUES(?,?,?,?,?,?,?)',cid,user.id,text,data.replyTo || null,Number(internal),now(),nonce).lastInsertRowid);
            for (const aid of attachments) run('UPDATE message_attachments SET message_id=? WHERE id=?',messageId,aid);
            run('INSERT OR IGNORE INTO conversation_participants(conversation_id,user_id) VALUES(?,?)',cid,user.id);
            run('UPDATE conversation_participants SET last_read_message_id=? WHERE conversation_id=? AND user_id=?',messageId,cid,user.id);
            if (!internal) run('UPDATE conversations SET updated_at=? WHERE id=?',now(),cid);
            return messageId;
          });
          event('message.created',cid,internal,messageId);
          json(res,201,{ message:store.message(user,get('SELECT * FROM messages WHERE id=?',messageId)) }); return true;
        }
        if (path[2] === 'attachments' && method === 'POST') {
          requireValue(conversation.status !== 'closed',409,'This conversation is closed.');
          rate(`upload:${user.id}`,20);
          requireValue(get('SELECT count(*) AS n FROM message_attachments WHERE uploader_id=? AND message_id IS NULL',user.id).n < 30,429,'Too many pending attachments.');
          const name = string(decodeURIComponent(req.headers['x-file-name'] || ''),120).replace(/[\/\\\x00-\x1f]/g,'_');
          const data = await body(req,Math.min(10,Number(setting('attachment_mb',10))) * 1024 * 1024,true); requireValue(data.length,400,'The file is empty.');
          const type = fileType(data,name); const aid = id();
          run('INSERT INTO message_attachments VALUES(?,?,?,?,?,?,?,?,?)',aid,cid,user.id,null,name,type,data.length,data,now());
          json(res,201,{ attachment:{ id:aid,name,type,size:data.length } }); return true;
        }
        if (path[2] === 'read' && method === 'POST') {
          const data = await body(req); const target = visibleMessage(user,Number(data.messageId));
          requireValue(target.conversation_id === cid,400,'Invalid read marker.');
          run('INSERT OR IGNORE INTO conversation_participants(conversation_id,user_id) VALUES(?,?)',cid,user.id);
          run('UPDATE conversation_participants SET last_read_message_id=max(last_read_message_id,?) WHERE conversation_id=? AND user_id=?',target.id,cid,user.id);
          event('message.read',cid); json(res,200,{ ok:true }); return true;
        }
        if (path[2] === 'mute' && method === 'POST') {
          const data = await body(req);
          run('INSERT OR IGNORE INTO conversation_participants(conversation_id,user_id) VALUES(?,?)',cid,user.id);
          run('UPDATE conversation_participants SET muted=? WHERE conversation_id=? AND user_id=?',Number(Boolean(data.muted)),cid,user.id);
          json(res,200,{ ok:true }); return true;
        }
        if (path[2] === 'typing' && method === 'POST') {
          rate(`typing:${user.id}`,40);
          const data = await body(req); const key = `${cid}:${user.id}`;
          clearTimeout(typingTimers.get(key));
          broadcast(data.typing ? 'typing.started' : 'typing.stopped',cid,{ userId:user.id,name:user.name });
          if (data.typing) typingTimers.set(key,setTimeout(()=>{ broadcast('typing.stopped',cid,{userId:user.id}); typingTimers.delete(key); },5000));
          else typingTimers.delete(key);
          json(res,200,{ ok:true }); return true;
        }
      }
      if (path[0] === 'messages' && path[1]) {
        const message = visibleMessage(user,Number(path[1]));
        if (method === 'GET' && path.length === 2) { json(res,200,{message:store.message(user,message)}); return true; }
        if (method === 'PATCH' || method === 'DELETE') {
          requireValue(message.sender_id === user.id && !message.deleted_at,403,'You can only change your own messages.');
          if (method === 'PATCH') { const data = await body(req); run('UPDATE messages SET body=?,edited_at=? WHERE id=?',string(data.body,5000),now(),message.id); }
          else run('UPDATE messages SET body=?,deleted_at=? WHERE id=?','',now(),message.id);
          event(method === 'PATCH' ? 'message.updated' : 'message.deleted',message.conversation_id,Boolean(message.is_internal),message.id);
          json(res,200,{ message:store.message(user,get('SELECT * FROM messages WHERE id=?',message.id)) }); return true;
        }
        if (path[2] === 'reactions' && method === 'POST') {
          requireValue(!message.deleted_at,400,'Message was deleted.'); const data = await body(req);
          requireValue(emojis.includes(data.emoji),400,'Unsupported reaction.');
          const existing = get('SELECT * FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=?',message.id,user.id,data.emoji);
          if (existing) run('DELETE FROM message_reactions WHERE message_id=? AND user_id=? AND emoji=?',message.id,user.id,data.emoji);
          else run('INSERT INTO message_reactions VALUES(?,?,?)',message.id,user.id,data.emoji);
          event(existing ? 'reaction.removed' : 'reaction.added',message.conversation_id,Boolean(message.is_internal),message.id); json(res,200,{ ok:true }); return true;
        }
      }
      throw new HttpError(404,'Endpoint not found.');
    } catch (error) {
      if(error.status===413)req.resume();
      if(error.status===429&&!res.headersSent)res.setHeader('Retry-After','60');
      if (!res.headersSent) json(res,error.status || 500,{ error:error.status ? error.message : 'The request could not be completed.' });
      else res.end();
      if (!error.status) console.error('Messaging error:',error.message);
      return true;
    }
  }
  function close() { closed=true; clearInterval(maintenance); for (const timer of typingTimers.values()) clearTimeout(timer); for (const stream of streams) stream.res.end(); store.db.close(); }
  return { handle, close, store };
}
