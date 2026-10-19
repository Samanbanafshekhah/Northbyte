import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMessaging } from '../messaging/api.mjs';
import { openStore } from '../messaging/store.mjs';

test('private messaging: two users, live events, persistence, files and permission boundaries',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'northbyte-messaging-'));
  const database=join(dir,'test.sqlite');
  let origin='http://127.0.0.1';
  const service=await createMessaging({database,origin,demo:false});
  const client=await service.store.createUser('client@example.test','A Client','ClientPass2026!');
  const outsider=await service.store.createUser('other@example.test','Another Client','ClientPass2026!');
  const admin=await service.store.createUser('team@example.test','Team Admin','TeamPass2026!','admin');
  const member=await service.store.createUser('member@example.test','Team Member','TeamPass2026!','team_member');
  const otherMember=await service.store.createUser('othermember@example.test','Other Member','TeamPass2026!','team_member');
  const server=http.createServer(async(req,res)=>{await service.handle(req,res,new URL(req.url,origin));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const controllers=[];
  t.after(async()=>{for(const controller of controllers)controller.abort();service.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});});
  async function call(session,path,method='GET',data,extra={}){
    const response=await fetch(`${base}/api/${path}`,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...extra},body:data===undefined?undefined:JSON.stringify(data)});
    return {response,status:response.status,data:await response.json()};
  }
  async function login(email,password){const result=await call(null,'auth/login','POST',{email,password});assert.equal(result.status,200);assert.match(result.response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return{...result.data,cookie:result.response.headers.get('set-cookie').split(';')[0]};}
  const a=await login(client.email,'ClientPass2026!');const b=await login(admin.email,'TeamPass2026!');const c=await login(outsider.email,'ClientPass2026!');const d=await login(member.email,'TeamPass2026!');const e=await login(otherMember.email,'TeamPass2026!');
  let cid,mid,aid,noteId;
  await t.test('session, origin and CSRF checks reject unauthenticated or forged actions',async()=>{
    assert.equal((await call(null,'conversations')).status,401);
    assert.equal((await call(a,'conversations','POST',{title:'forged'},{'X-CSRF-Token':''})).status,403);
    assert.equal((await call(a,'conversations','POST',{title:'forged'},{Origin:'https://other.test'})).status,403);
    assert.equal((await call(a,'team')).status,403);
    assert.equal((await call(a,'conversations','POST',null)).status,400);
  });
  await t.test('project conversations are persistent and deduplicated',async()=>{
    assert.equal((await call(a,'projects','POST',{id:'project-a',title:'Client portal',description:'A private project'})).status,200);
    const result=await call(a,'conversations','POST',{title:'Client portal',projectId:'project-a'});assert.equal(result.status,201);cid=result.data.conversation.id;
    assert.equal((await call(a,'conversations','POST',{title:'Again',projectId:'project-a'})).data.conversation.id,cid);
    assert.equal((await call(c,'conversations','POST',{title:'Steal',projectId:'project-a'})).status,404);
    assert.equal((await call(c,`conversations/${cid}/messages`)).status,404);
    assert.equal((await call(c,`conversations/${cid}/typing`,'POST',{typing:true})).status,404);
  });
  async function stream(session,since=0){
    const controller=new AbortController();controllers.push(controller);
    const response=await fetch(`${base}/api/events?since=${since}`,{headers:{Cookie:session.cookie},signal:controller.signal});assert.equal(response.status,200);
    const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
    async function until(type){
      const deadline=Date.now()+4000;
      while(Date.now()<deadline){let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){const chunk=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);if(chunk.includes(`event: ${type}\n`))return chunk;}
        const chunk=await Promise.race([reader.read(),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error(`Timed out waiting for ${type}`)),4000);timer.unref();})]);if(chunk.done)throw new Error('Stream ended');buffer+=decoder.decode(chunk.value,{stream:true});}
      throw new Error(`Missing ${type}`);
    }
    await until('ready');return{until,controller};
  }
  const streamA=await stream(a),streamB=await stream(b);
  await t.test('both users exchange real messages over authenticated live events, without duplicates',async()=>{
    const result=await call(a,`conversations/${cid}/messages`,'POST',{body:'Hello team <script>alert(1)</script>',nonce:'one'});assert.equal(result.status,201);mid=result.data.message.id;
    assert.match(await streamB.until('message.created'),new RegExp(cid));
    assert.equal((await call(a,`conversations/${cid}/messages`,'POST',{body:'duplicate',nonce:'one'})).data.message.id,mid);
    const results=await Promise.all([call(a,`conversations/${cid}/messages`,'POST',{body:'Client follow-up',nonce:'sim-a'}),call(b,`conversations/${cid}/messages`,'POST',{body:'We are here.',nonce:'sim-b',replyTo:mid})]);
    assert.ok(results.every(r=>r.status===201));
    const history=(await call(a,`conversations/${cid}/messages`)).data.messages;assert.equal(history.length,3);assert.deepEqual((await call(a,`conversations/${cid}/messages?search=follow-up`)).data.messages.map(m=>m.body),['Client follow-up']);assert.equal((await call(c,`conversations/${cid}/messages?search=follow-up`)).status,404);assert.equal(history.find(m=>m.nonce==='sim-b').reply.id,mid);
    assert.equal((await call(c,`conversations/${cid}/messages`,'POST',{body:'intrude',nonce:'intrude'})).status,404);
  });
  await t.test('typing and read receipts update over the live connection',async()=>{
    await call(a,`conversations/${cid}/typing`,'POST',{typing:true});assert.match(await streamB.until('typing.started'),/A Client/);
    await call(a,`conversations/${cid}/typing`,'POST',{typing:false});await streamB.until('typing.stopped');
    await call(b,`conversations/${cid}/read`,'POST',{messageId:mid});await streamA.until('message.read');
    const conversation=(await call(a,`conversations/${cid}/messages`)).data.conversation;assert.ok(conversation.participants.find(p=>p.id===admin.id).readId>=mid);
  });
  async function upload(session,name,data){const response=await fetch(`${base}/api/conversations/${cid}/attachments`,{method:'POST',headers:{Origin:origin,Cookie:session.cookie,'X-CSRF-Token':session.csrf,'X-File-Name':encodeURIComponent(name)},body:data});return{status:response.status,data:await response.json()};}
  await t.test('private files are validated, shared, and protected from other clients',async()=>{
    const pdf=await upload(a,'brief.pdf',Buffer.from('%PDF-1.7\nPrivate brief'));assert.equal(pdf.status,201);aid=pdf.data.attachment.id;
    const image=await upload(a,'reference.png',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'));assert.equal(image.status,201);
    assert.equal((await upload(a,'bad.png',Buffer.from('<script>bad</script>'))).status,415);
    assert.equal((await upload(a,'bad.html',Buffer.from('<html>bad</html>'))).status,415);
    assert.equal((await upload(a,'large.txt',Buffer.alloc(10*1024*1024+1,65))).status,413);
    await call(a,`conversations/${cid}/messages`,'POST',{body:'Brief and image',nonce:'with-files',attachments:[aid,image.data.attachment.id]});
    const allowed=await fetch(`${base}/api/attachments/${aid}`,{headers:{Cookie:b.cookie}});assert.equal(allowed.status,200);assert.equal(await allowed.text(),'%PDF-1.7\nPrivate brief');assert.match(allowed.headers.get('content-disposition'),/attachment/);
    assert.equal((await fetch(`${base}/api/attachments/${aid}`,{headers:{Cookie:c.cookie}})).status,404);
  });
  await t.test('internal notes and their attachments never reach client history, previews or APIs',async()=>{
    const file=await upload(b,'private.txt',Buffer.from('TEAM ONLY CONTENT'));assert.equal(file.status,201);
    const result=await call(b,`conversations/${cid}/messages`,'POST',{body:'TEAM ONLY SECRET',internal:true,nonce:'note',attachments:[file.data.attachment.id]});noteId=result.data.message.id;assert.equal(result.status,201);
    const clientHistory=await call(a,`conversations/${cid}/messages`);assert.ok(!JSON.stringify(clientHistory.data).includes('TEAM ONLY'));assert.ok(!JSON.stringify(clientHistory.data).includes('private.txt'));
    assert.ok(!(await call(a,'conversations')).data.conversations[0].lastMessage.internal);
    assert.equal((await fetch(`${base}/api/attachments/${file.data.attachment.id}`,{headers:{Cookie:a.cookie}})).status,404);
    assert.equal((await call(a,`messages/${noteId}`,'PATCH',{body:'steal'})).status,404);
    assert.equal((await call(a,`messages/${noteId}`)).status,404);
    assert.equal((await call(a,`conversations/${cid}/messages`,'POST',{body:'fake note',nonce:'fake-note',internal:true})).status,403);
    assert.equal((await call(a,`conversations/${cid}/messages`,'POST',{body:'leaked reply',nonce:'fake-reply',replyTo:noteId})).status,404);
    assert.equal((await call(b,`conversations/${cid}/messages`,'POST',{body:'unsafe external reply',nonce:'unsafe-reply',replyTo:noteId})).status,400);
  });
  await t.test('own-message edit, reactions, deletion and unread markers work',async()=>{
    assert.equal((await call(b,`messages/${mid}`,'PATCH',{body:'not yours'})).status,403);
    assert.equal((await call(a,`messages/${mid}`,'PATCH',{body:'Edited hello'})).status,200);
    await call(b,`messages/${mid}/reactions`,'POST',{emoji:'👍'});
    let message=(await call(a,`conversations/${cid}/messages`)).data.messages.find(m=>m.id===mid);assert.equal(message.body,'Edited hello');assert.equal(message.reactions[0].emoji,'👍');
    await call(b,`messages/${mid}/reactions`,'POST',{emoji:'👍'});
    await call(a,`messages/${mid}`,'DELETE');message=(await call(a,`conversations/${cid}/messages`)).data.messages.find(m=>m.id===mid);assert.ok(message.deletedAt);assert.equal(message.body,'');
    await call(a,`conversations/${cid}/mute`,'POST',{muted:true});assert.equal((await call(a,'conversations')).data.conversations[0].muted,true);
  });
  await t.test('assignment, status and team-member scopes are enforced',async()=>{
    assert.equal((await call(a,`conversations/${cid}`,'PATCH',{status:'resolved'})).status,403);
    assert.equal((await call(b,`conversations/${cid}`,'PATCH',{assignedTo:member.id,status:'pending'})).status,200);
    assert.equal((await call(d,`conversations/${cid}/messages`)).status,200);
    assert.equal((await call(e,`conversations/${cid}/messages`)).status,404);
    assert.equal((await call(d,`conversations/${cid}`,'PATCH',{assignedTo:otherMember.id})).status,403);
    await call(b,`conversations/${cid}`,'PATCH',{status:'closed'});
    assert.equal((await call(a,`conversations/${cid}/messages`,'POST',{body:'closed',nonce:'closed'})).status,409);
    await call(b,`conversations/${cid}`,'PATCH',{status:'open'});
  });
  await t.test('history is cursor-paginated and reconnect replays missed authorized events',async()=>{
    for(let i=0;i<39;i++)assert.equal((await call(a,`conversations/${cid}/messages`,'POST',{body:`Page ${i}`,nonce:`page-${i}`})).status,201);
    const result=await call(a,`conversations/${cid}/messages`);assert.equal(result.data.messages.length,40);assert.equal(result.data.hasMore,true);
    const older=await call(a,`conversations/${cid}/messages?before=${result.data.messages[0].id}`);assert.ok(older.data.messages.length>0);assert.ok(older.data.messages.at(-1).id<result.data.messages[0].id);
    const cursor=service.store.get('SELECT max(id) AS id FROM events').id;
    await call(b,`conversations/${cid}/messages`,'POST',{body:'While you were away',nonce:'reconnect'});
    const controller=new AbortController();controllers.push(controller);
    const replay=await fetch(`${base}/api/events?since=${cursor}`,{headers:{Cookie:a.cookie},signal:controller.signal});const chunk=await replay.body.getReader().read();const text=new TextDecoder().decode(chunk.value);assert.match(text,/message.created/);assert.ok(!text.includes('TEAM ONLY'));
  });
  await t.test('conversation pages, server-side search and filters respect user scope',async()=>{
    for(let i=0;i<55;i++)service.store.run('INSERT INTO conversations VALUES(?,?,?,?,?,?,?,?)',`page-conversation-${i}`,`Planning ${i}`,null,client.id,i%2?'resolved':'open',null,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
    const first=(await call(a,'conversations')).data;assert.equal(first.conversations.length,50);assert.ok(first.nextCursor);assert.equal(first.total,56);
    const second=(await call(a,`conversations?before=${first.nextCursor}`)).data;assert.equal(second.conversations.length,6);assert.equal(second.nextCursor,null);
    assert.ok(second.conversations.every(row=>!first.conversations.some(previous=>previous.id===row.id)));
    assert.equal((await call(a,'conversations?search=Planning%2054')).data.conversations.length,1);
    assert.equal((await call(c,'conversations?search=Planning')).data.conversations.length,0);
    assert.ok((await call(a,'conversations?filter=resolved')).data.conversations.every(row=>row.status==='resolved'));
    assert.ok((await call(a,'conversations')).data.unreadTotal>=1);
    assert.ok((await call(a,`messages/${noteId}`)).status===404);
  });
  await t.test('SQLite survives reopening and logout revokes the session',async()=>{
    const second=openStore(database);assert.ok(second.get('SELECT id FROM conversations WHERE id=?',cid));assert.ok(second.get('SELECT id FROM messages WHERE id=?',mid));second.db.close();
    await call(c,'auth/logout','POST',{});assert.equal((await call(c,'conversations')).status,401);
  });
});
