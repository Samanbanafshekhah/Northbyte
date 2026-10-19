const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const glyphs = { plus:'M12 5v14M5 12h14', search:'m16 16 4 4M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', send:'m3 3 19 9-19 9 4-9-4-9Zm4 9h15', paper:'m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7L13 2', info:'M12 11v6M12 7v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', back:'m14 6-6 6 6 6', close:'m6 6 12 12M6 18 18 6', chat:'M4 4h16v13H9l-5 4V4', file:'M6 2h8l4 4v16H6V2Zm8 0v5h5', smile:'M8 14s4 5 8 0M8 9h.1M16 9h.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', reply:'m9 5-6 6 6 6M3 11h10a7 7 0 0 1 7 7', lock:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4', check:'m4 12 5 5L20 6', bell:'M5 17h14l-2-5V9a5 5 0 0 0-10 0v3l-2 5ZM10 21h4' };
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${glyphs[name] || glyphs.chat}"/></svg>`;
const initials = name => String(name || 'NB').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const time = value => new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const day = value => new Date(value).toLocaleDateString([], {month:'long',day:'numeric',year:'numeric'});
const bytes = size => size > 1048576 ? `${(size/1048576).toFixed(1)} MB` : `${Math.max(1,Math.round(size/1024))} KB`;
const emojiList = ['👍','❤️','🎉','🚀','👀','✅'];

class Messages {
  user = null; csrf = ''; conversations = []; selected = null; messages = []; files = []; team = []; online = []; pending = []; drafts = new Map();
  search = ''; filter = 'all'; hasMore = false; busy = false; typing = new Map(); lastTyping = 0; source = null; connected = false; sequence = 0; lastRead = 0;
  mountRoot = null; infoOpen = !matchMedia('(max-width:1350px)').matches; reply = null; edit = null; attachments = []; uploading = 0; internal = false; notify = true; loading = false; cursor = 0;
  inboxCursor = null; selectedConversation = null; inboxSequence = 0; total = 0;
  unreadTotal = 0;
  basePath = '/dashboard/messages';
  activity = [];
  pollingTimer = null; historySearch = ''; searchOpen = false;
  configure(user,csrf,{ onUnread,toast }) {
    this.user = user; this.csrf = csrf; this.onUnread = onUnread; this.toast = toast;
    this.notify = localStorage.getItem(`nb-message-notifications:${user.id}`) !== 'off';
    this.refreshInbox().catch(()=>{});
    this.connect();
    document.addEventListener('visibilitychange',()=>{ if (!document.hidden) { this.refreshInbox().catch(()=>{}); if(this.mountRoot && this.selected) this.load().catch(()=>{}); } });
    window.addEventListener('beforeunload',()=>{this.source?.close();clearInterval(this.pollingTimer);this.releaseAttachments();});
  }
  get isStaff() { return this.user?.role !== 'client'; }
  async api(path,options={}) {
    const response = await fetch(`/api/${path}`, { credentials:'same-origin', ...options, headers:{'Content-Type':'application/json','X-CSRF-Token':this.csrf,...options.headers}, body:options.body ? JSON.stringify(options.body) : undefined });
    const data = await response.json();
    if (!response.ok) { if(response.status===401) {this.source?.close();location.assign('/login');} const error=new Error(data.error || 'The request failed.');error.status=response.status;throw error; }
    return data;
  }
  connect() {
    this.source?.close(); this.source = new EventSource(`/api/events?since=${this.cursor}`);
    this.source.addEventListener('ready',event=>{this.cursor=JSON.parse(event.data).cursor;this.connected=true;clearInterval(this.pollingTimer);this.pollingTimer=null;this.connectionLabel();this.refreshInbox().catch(()=>{});if(this.mountRoot&&this.selected)this.load().catch(()=>{});});
    this.source.onerror=()=>{this.connected=false;if(!this.pollingTimer)this.pollingTimer=setInterval(()=>{if(document.hidden)return;this.refreshInbox().catch(()=>{});if(this.mountRoot&&this.selected)this.load().catch(()=>{});},5000);this.connectionLabel();this.typing.clear();this.typingLabel();};
    for (const type of ['message.created','message.updated','message.deleted','conversation.updated','message.read','reaction.added','reaction.removed','inbox.updated']) this.source.addEventListener(type,event=>{
      if(event.lastEventId)this.cursor=Number(event.lastEventId);
      const data=JSON.parse(event.data);
      this.refreshInbox(type==='message.created' ? data.conversationId : null).catch(()=>{});
      if(this.mountRoot && (data.conversationId===this.selected||type==='inbox.updated'&&this.selected)) {
        if(data.messageId&&['message.updated','message.deleted','reaction.added','reaction.removed'].includes(type))this.refreshMessage(data.messageId).catch(error=>this.status(error.message));
        else this.load().catch(error=>{if(error.status===404){this.selected=null;this.selectedConversation=null;this.messages=[];this.renderChat();}this.status(error.message);});
      }
    });
    this.source.addEventListener('presence.updated',event=>{const data=JSON.parse(event.data);if(data.conversationId===this.selected){this.online=data.online;this.presenceLabel();}});
    this.source.addEventListener('typing.started',event=>{const data=JSON.parse(event.data);if(data.conversationId===this.selected&&data.userId!==this.user.id){this.typing.set(data.userId,{name:data.name,until:Date.now()+5500});this.typingLabel();}});
    this.source.addEventListener('typing.stopped',event=>{this.typing.delete(JSON.parse(event.data).userId);this.typingLabel();});
  }
  async refreshInbox(newMessage=null,older=false) {
    const sequence=++this.inboxSequence;
    const params=new URLSearchParams({search:this.search,filter:this.filter});if(older&&this.inboxCursor)params.set('before',this.inboxCursor);
    const data=await this.api(`conversations?${params}`);if(sequence!==this.inboxSequence)return;
    this.conversations=older?[...this.conversations,...data.conversations.filter(c=>!this.conversations.some(existing=>existing.id===c.id))]:data.conversations;
    this.inboxCursor=data.nextCursor;this.total=data.total;
    const unread=data.unreadTotal;
    this.unreadTotal=unread;
    this.onUnread?.(unread);if(this.basePath==='/dashboard/messages'||this.mountRoot)document.title=unread?`(${unread}) Messages — NorthByte`:(this.basePath.startsWith('/admin/')?'Messages — NorthByte':'NorthByte — Workspace');
    if(newMessage) {const conversation=this.conversations.find(c=>c.id===newMessage);if(conversation?.unread&&!conversation.muted&&this.notify&&this.user.notification_preferences?.in_app!==false&&(newMessage!==this.selected||document.hidden))this.toast?.(`New message in ${conversation.title}`);}
    if(this.mountRoot)this.renderList();
  }
  view() { return `<section class="messenger-page"><div class="messenger-title"><div><p class="msg-eyebrow">${this.isStaff?'TEAM INBOX':'STAY CONNECTED'}</p><h2>Good work starts with a conversation<span>.</span></h2><p>A direct line between your ideas and our team.</p></div><span class="msg-private">${svg('lock')} Private workspace</span></div><div id="messages-root" class="messenger"><div class="msg-skeleton"><i></i><i></i><i></i></div></div></section>`; }
  mount(root) {
    this.mountRoot=root;
    root.innerHTML=`<aside class="msg-inbox"><header><div><h3>${this.isStaff?'Team inbox':'Conversations'}</h3><span data-conversation-count>0</span></div><button class="msg-icon" data-new-conversation aria-label="Start a conversation" title="Start a conversation">${svg('plus')}</button></header><label class="msg-search">${svg('search')}<input type="search" data-search placeholder="Search conversations" aria-label="Search conversations" value="${escape(this.search)}"></label><div class="msg-filters" role="group" aria-label="Filter conversations">${(this.isStaff?['all','unread','assigned','unassigned','open','pending','resolved','closed']:['all','unread']).map(f=>`<button data-filter="${f}" class="${this.filter===f?'active':''}" aria-pressed="${this.filter===f}">${f==='all'?'All messages':f[0].toUpperCase()+f.slice(1)}</button>`).join('')}</div><div class="msg-conversations" data-conversations></div><footer><span class="msg-connection" data-connection></span><label title="Show notifications for new messages"><input type="checkbox" data-msg-notifications ${this.notify?'checked':''}> Notifications</label></footer></aside><section class="msg-chat" data-chat aria-label="Conversation"></section><aside class="msg-details" data-details aria-label="Conversation details"></aside>`;
    root.addEventListener('click',event=>this.click(event).catch(error=>this.status(error.message)));
    root.querySelector('[data-search]').addEventListener('input',event=>{this.search=event.target.value;clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>this.refreshInbox().catch(error=>this.status(error.message)),250);});
    root.querySelector('[data-msg-notifications]').addEventListener('change',event=>{this.notify=event.target.checked;localStorage.setItem(`nb-message-notifications:${this.user.id}`,this.notify?'on':'off');});
    this.selected=new URLSearchParams(location.search).get('conversation')||this.selected;
    this.renderList();this.renderChat();this.connectionLabel();
    this.refreshInbox().then(()=>{if(this.selected)this.select(this.selected);}).catch(error=>this.status(error.message));
  }
  unmount() { this.saveDraft();this.stopTyping();this.mountRoot=null;this.sequence++;clearTimeout(this.typingTimer);clearTimeout(this.historySearchTimer); }
  saveDraft(){const input=this.mountRoot?.querySelector('[data-compose]');if(input&&this.selected&&!this.edit)this.drafts.set(this.selected,input.value);}
  filtered(){return this.conversations.filter(c=>`${c.title} ${c.client.fullName} ${c.project?.title||''}`.toLowerCase().includes(this.search.toLowerCase())&&(this.filter==='all'||this.filter==='unread'&&c.unread||this.filter==='assigned'&&c.assignedTo===this.user.id||this.filter==='unassigned'&&!c.assignedTo||c.status===this.filter));}
  renderList(){const list=this.mountRoot?.querySelector('[data-conversations]');if(!list)return;this.mountRoot.querySelector('[data-conversation-count]').textContent=this.total;const items=this.filtered();list.innerHTML=items.map(c=>`<button class="msg-conversation ${c.id===this.selected?'active':''}" data-conversation="${escape(c.id)}" aria-pressed="${c.id===this.selected}"><span class="msg-avatar ${c.projectId?'project-avatar':''}">${c.projectId?'#':initials(this.isStaff?c.client.fullName:'NorthByte')}</span><span class="msg-conversation-copy"><span><b>${escape(c.title)}</b><time>${time(c.updatedAt)}</time></span><small>${c.lastMessage?escape(c.lastMessage.body):'Start the conversation'}</small><span class="msg-conversation-meta">${c.projectId?'PROJECT CHANNEL':'DIRECT MESSAGE'}${c.muted?' · MUTED':''}</span></span>${c.unread?`<strong class="msg-unread">${c.unread}</strong>`:''}</button>`).join('')||`<div class="msg-list-empty">${svg('chat')}<b>${this.search?'No matches found':'A little quiet here'}</b><p>${this.search?'Try another name or project.':'Your conversations will appear here.'}</p></div>`;if(this.inboxCursor)list.insertAdjacentHTML('beforeend','<button class="msg-load-older" data-more-conversations>Load more conversations</button>');}
  async select(cid){
    this.saveDraft();this.stopTyping();this.releaseAttachments();this.selected=cid;this.messages=[];this.pending=[];this.reply=null;this.edit=null;this.lastRead=0;this.typing.clear();this.internal=false;this.loading=true;
    this.selectedConversation=this.conversations.find(c=>c.id===cid)||null;
    this.historySearch='';this.searchOpen=false;
    history.replaceState({},'',`${this.basePath}?conversation=${encodeURIComponent(cid)}`);this.mountRoot?.classList.add('chat-open');this.renderList();this.renderChat();
    try {await this.load(true);}catch(error){this.status(error.message);}finally{this.loading=false;}
  }
  async load(initial=false,older=false){
    const cid=this.selected;if(!cid||!this.mountRoot)return;
    const sequence=++this.sequence;
    const params=new URLSearchParams({search:this.historySearch});if(older&&this.messages.length)params.set('before',this.messages[0].id);
    const data=await this.api(`conversations/${cid}/messages?${params}`);
    if(cid!==this.selected||sequence!==this.sequence||!this.mountRoot)return;
    const history=this.mountRoot.querySelector('[data-history]');const bottom=!history||history.scrollHeight-history.scrollTop-history.clientHeight<90;const top=history?.scrollTop||0;const height=history?.scrollHeight||0;
    if(older){this.messages=[...data.messages,...this.messages];this.hasMore=data.hasMore;}else{
      // Retain already loaded older pages while reconciling the latest server page.
      const first=data.messages[0]?.id||Infinity;this.messages=[...this.messages.filter(m=>m.id<first),...data.messages];if(initial||!this.messages.length)this.hasMore=data.hasMore;
    }
    this.pending=this.pending.filter(m=>!this.messages.some(row=>row.nonce===m.nonce));this.files=data.files;this.activity=data.activity;this.online=data.online;this.loading=false;
    this.selectedConversation=data.conversation;
    const index=this.conversations.findIndex(c=>c.id===cid);if(index>=0)this.conversations[index]=data.conversation;
    if(initial)this.renderChat();else this.renderHistory();this.renderDetails();this.renderList();this.presenceLabel();
    const next=this.mountRoot.querySelector('[data-history]');
    if(next){if(older)next.scrollTop=top+next.scrollHeight-height;else if(bottom||initial){next.scrollTop=next.scrollHeight;this.markRead();}else{next.scrollTop=top;this.mountRoot.querySelector('[data-new-messages]')?.removeAttribute('hidden');}}
  }
  current(){return this.conversations.find(c=>c.id===this.selected)||this.selectedConversation;}
  async refreshMessage(mid){const cid=this.selected;const data=await this.api(`messages/${mid}`);if(cid!==this.selected||!this.mountRoot)return;const index=this.messages.findIndex(m=>m.id===mid);if(index>=0){this.messages[index]=data.message;const area=this.mountRoot.querySelector('[data-history]');const top=area?.scrollTop||0;this.renderHistory();if(area)area.scrollTop=top;}await this.load();}
  renderChat(){
    const chat=this.mountRoot?.querySelector('[data-chat]');if(!chat)return;
    const c=this.current();this.mountRoot.classList.toggle('has-conversation',Boolean(c));this.mountRoot.classList.toggle('info-open',this.infoOpen&&Boolean(c));
    if(!c){chat.innerHTML=`<div class="msg-welcome"><div class="msg-orbit">${svg('chat')}<i></i><i></i></div><span class="msg-eyebrow">IDEAS. QUESTIONS. WHAT’S NEXT.</span><h3>Let’s build something<br><em>worth talking about.</em></h3><p>Every great project starts with a conversation.<br>Bring your ideas. We’ll take it from here.</p><button class="dash-primary" data-new-conversation>${svg('plus')}Start a Conversation</button><span class="msg-welcome-foot">${svg('lock')} Just you and your authorized NorthByte team</span></div>`;this.renderDetails();return;}
    chat.innerHTML=`<header class="msg-chat-header"><button class="msg-icon msg-mobile-back" data-chat-back aria-label="Back to conversations">${svg('back')}</button><span class="msg-avatar project-avatar">${c.projectId?'#':svg('chat')}</span><div><h3>${escape(c.title)}</h3><p data-presence>Connecting to the team…</p></div><button class="msg-icon" data-history-toggle aria-label="Search messages" aria-expanded="${this.searchOpen}">${svg('search')}</button><button class="msg-icon" data-info aria-label="Conversation details" aria-expanded="${this.infoOpen}">${svg('info')}</button></header><div class="msg-history-search" ${this.searchOpen?'':'hidden'}><input type="search" data-history-search value="${escape(this.historySearch)}" placeholder="Search messages" aria-label="Search messages"></div><div class="msg-history-wrap"><div class="msg-history" data-history role="log" aria-label="Messages" aria-live="polite"></div><button class="msg-new-messages" data-new-messages hidden>New messages ↓</button></div><div class="msg-typing" data-typing aria-live="polite"></div><div class="msg-compose-wrap"><div class="msg-context" data-compose-context hidden></div><div class="msg-attachment-tray" data-attachment-tray></div><form class="msg-composer" data-composer><textarea rows="1" data-compose maxlength="5000" placeholder="Message ${escape(c.title)}…" aria-label="Write a message" ${c.status==='closed'?'disabled':''}></textarea><div class="msg-compose-tools"><div><button class="msg-icon" type="button" data-attach aria-label="Attach files">${svg('paper')}</button><button class="msg-icon" type="button" data-emoji aria-label="Choose emoji">${svg('smile')}</button>${this.isStaff?`<button type="button" class="msg-note-toggle" data-note aria-pressed="${this.internal}">${svg('lock')} Internal note</button>`:''}</div><button class="msg-send" type="submit" aria-label="Send message" disabled>${svg('send')}</button></div><input data-attachment-input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.md" multiple hidden><div class="msg-emoji-picker" data-emoji-picker hidden>${emojiList.map(e=>`<button type="button" data-insert-emoji="${e}">${e}</button>`).join('')}</div></form><div class="msg-compose-caption"><span>${c.status==='closed'?'Conversation closed':'Enter to send · Shift + Enter for a new line'}</span><span>${svg('lock')} Private conversation</span></div><p class="msg-error" data-msg-status role="status"></p></div>`;
    const historySearch=chat.querySelector('[data-history-search]');
    historySearch.addEventListener('input',()=>{clearTimeout(this.historySearchTimer);const value=historySearch.value;this.historySearchTimer=setTimeout(async()=>{this.saveDraft();this.historySearch=value;this.messages=[];this.hasMore=false;try{await this.load(true);const next=this.mountRoot?.querySelector('[data-history-search]');next?.focus();}catch(error){this.status(error.message);}},300);});
    const input=chat.querySelector('[data-compose]');input.value=this.edit?.body||this.drafts.get(this.selected)||'';
    input.addEventListener('input',()=>{this.saveDraft();this.resizeInput();this.updateSend();this.sendTyping();});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();this.send().catch(error=>this.status(error.message));}});
    chat.querySelector('[data-composer]').addEventListener('submit',event=>{event.preventDefault();this.send().catch(error=>this.status(error.message));});
    chat.querySelector('[data-attachment-input]').addEventListener('change',event=>this.addFiles(event.target.files));
    chat.ondragover=event=>{event.preventDefault();chat.classList.add('dragging');};
    chat.ondragleave=event=>{if(!chat.contains(event.relatedTarget))chat.classList.remove('dragging');};
    chat.ondrop=event=>{event.preventDefault();chat.classList.remove('dragging');if(!this.busy)this.addFiles(event.dataTransfer.files);};
    chat.querySelector('[data-history]').addEventListener('scroll',()=>{const area=chat.querySelector('[data-history]');if(area.scrollHeight-area.scrollTop-area.clientHeight<90){chat.querySelector('[data-new-messages]').hidden=true;this.markRead();}});
    this.renderHistory();this.renderContext();this.renderAttachments();this.renderDetails();this.updateSend();this.presenceLabel();
  }
  renderHistory(){
    const history=this.mountRoot?.querySelector('[data-history]');if(!history)return;
    if(this.loading){history.innerHTML='<div class="msg-skeleton"><i></i><i></i><i></i></div>';return;}
    let lastDay='',previous=null;
    history.innerHTML=`${this.hasMore?'<button class="msg-load-older" data-load-older>Load earlier messages</button>':''}<div class="msg-channel-start"><span class="msg-avatar project-avatar">#</span><h4>This is the start of something.</h4><p>${escape(this.current()?.projectId?'A dedicated space to keep your project moving.':'Ideas, questions, and updates. All in one place.')}</p></div>`+[...this.messages,...this.pending.filter(m=>m.conversationId===this.selected)].map(m=>{
      let separator='';const date=day(m.createdAt);if(date!==lastDay){separator=`<div class="msg-date"><span>${date}</span></div>`;lastDay=date;}
      const grouped=previous&&previous.senderId===m.senderId&&previous.internal===m.internal&&!m.reply&&new Date(m.createdAt)-new Date(previous.createdAt)<300000;previous=m;
      const groups=Object.groupBy(m.reactions||[],r=>r.emoji);
      const read=this.current()?.participants.some(p=>p.id!==this.user.id&&p.readId>=m.id);
      return `${separator}<article class="msg-message ${grouped?'grouped':''} ${m.senderId===this.user.id?'own':''} ${m.internal?'internal':''} ${m.failed?'failed':''}" data-message="${escape(m.id)}"><span class="msg-avatar">${escape(initials(m.sender))}</span><div class="msg-message-main"><header><b>${escape(m.sender)}</b>${m.role!=='client'?'<span class="msg-team-tag">TEAM</span>':''}${m.internal?'<span class="msg-note-tag">INTERNAL NOTE</span>':''}<time datetime="${m.createdAt}">${time(m.createdAt)}</time></header>${m.reply?`<div class="msg-reply-preview">${svg('reply')}<b>${escape(m.reply.name)}</b><span>${escape(m.reply.body)}</span></div>`:''}<p dir="auto" class="msg-body ${m.deletedAt?'deleted':''}">${m.deletedAt?'Message deleted':escape(m.body)}</p>${(m.attachments||[]).map(a=>`<a class="msg-file" href="/api/attachments/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">${a.type.startsWith('image/')?`<img src="/api/attachments/${encodeURIComponent(a.id)}?preview" alt="${escape(a.name)}" loading="lazy">`:svg('file')}<span><b>${escape(a.name)}</b><small>${bytes(a.size)} · Download</small></span></a>`).join('')}<div class="msg-reactions">${Object.entries(groups).map(([emoji,reactions])=>`<button data-react="${emoji}" data-mid="${m.id}" class="${reactions.some(r=>r.user_id===this.user.id)?'selected':''}" aria-label="React ${emoji}">${emoji} ${reactions.length}</button>`).join('')}</div>${m.senderId===this.user.id?`<small class="msg-delivery">${m.failed?`Couldn’t send <button data-retry="${escape(m.nonce)}">Retry</button>`:m.optimistic?'Sending…':read?'Read':'Sent'}</small>`:''}</div>${!m.optimistic&&!m.deletedAt?`<div class="msg-message-actions"><button data-reply="${m.id}" title="Reply" aria-label="Reply">${svg('reply')}</button><button data-reaction-picker="${m.id}" title="React" aria-label="Choose a reaction">${svg('smile')}</button><button data-copy-message="${m.id}" title="Copy message" aria-label="Copy message">⧉</button>${m.senderId===this.user.id?`<button data-edit-message="${m.id}" title="Edit message" aria-label="Edit message">Edit</button><button data-delete-message="${m.id}" title="Delete message" aria-label="Delete message">×</button>`:''}</div>`:''}</article>`;
    }).join('');
  }
  renderDetails(){const panel=this.mountRoot?.querySelector('[data-details]');if(!panel)return;const c=this.current();panel.innerHTML=c?`<header><span>CONVERSATION DETAILS</span><button class="msg-icon" data-info aria-label="Close details">${svg('close')}</button></header><div class="msg-detail-identity"><span class="msg-avatar">${initials(this.isStaff?c.client.fullName:'NorthByte')}</span><h3>${escape(this.isStaff?c.client.fullName:'NorthByte Team')}</h3><p>${escape(this.isStaff?c.client.email:'Engineering your next chapter.')}</p></div><div class="msg-detail-block"><span class="msg-eyebrow">WORKSPACE</span><dl><div><dt>Status</dt><dd class="msg-state"><i></i>${escape(c.status)}</dd></div><div><dt>Created</dt><dd>${day(c.createdAt)}</dd></div><div><dt>Assigned to</dt><dd>${escape(c.participants.find(p=>p.id===c.assignedTo)?.name||this.team.find(p=>p.id===c.assignedTo)?.name||'NorthByte team')}</dd></div></dl>${c.project?`<a class="msg-project-link" href="${this.basePath.startsWith('/admin/')?'/admin':'/dashboard'}/projects/${encodeURIComponent(c.projectId)}" data-route>${svg('file')}<span><b>${escape(c.project.title)}</b><small>${escape(c.project.status)}</small></span>↗</a><p class="msg-muted">${escape(c.project.description)}</p>`:''}</div>${this.isStaff?`<div class="msg-detail-block"><span class="msg-eyebrow">MANAGE CONVERSATION</span><label>Status<select data-conversation-status>${['open','pending','resolved','closed'].map(s=>`<option ${s===c.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Assigned team member<select data-assignee ${this.user.role==='team_member'&&c.assignedTo?'disabled':''}><option value="">Unassigned</option>${this.team.map(u=>`<option value="${u.id}" ${u.id===c.assignedTo?'selected':''}>${escape(u.name)}</option>`).join('')}</select></label></div>`:''}<div class="msg-detail-block"><div class="msg-files-title"><span class="msg-eyebrow">SHARED FILES</span><b>${this.files.length}</b></div>${this.files.length?this.files.map(a=>`<a class="msg-shared-file" href="/api/attachments/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">${svg('file')}<span>${escape(a.name)}<small>${bytes(a.size)}</small></span>↓</a>`).join(''):'<p class="msg-muted">Files shared here will be kept with this conversation.</p>'}</div><div class="msg-detail-block"><span class="msg-eyebrow">RECENT ACTIVITY</span><ol class="msg-activity">${this.activity.map(item=>`<li><span>${escape(item.internal ? 'Internal note activity' : ({'conversation.updated':'Conversation updated','message.created':'Message shared','message.updated':'Message edited','message.deleted':'Message removed'}[item.type] || 'Conversation activity'))}</span><time>${time(item.created_at)}</time></li>`).join('')}</ol></div><button class="msg-mute" data-mute>${svg('bell')}${c.muted?'Unmute conversation':'Mute conversation'}</button><p class="msg-detail-security">${svg('lock')} Only you and authorized team members can access this conversation.</p>`:'';
    panel.querySelector('[data-conversation-status]')?.addEventListener('change',event=>this.updateConversation({status:event.target.value}));
    panel.querySelector('[data-assignee]')?.addEventListener('change',event=>this.updateConversation({assignedTo:event.target.value||null}));
    if(this.isStaff&&!this.team.length)this.api('team').then(data=>{this.team=data.users;if(this.mountRoot)this.renderDetails();}).catch(()=>{});
  }
  async updateConversation(data){try{await this.api(`conversations/${this.selected}`,{method:'PATCH',body:data});await this.refreshInbox();await this.load();this.updateSend();}catch(error){this.status(error.message);}}
  connectionLabel(){const element=this.mountRoot?.querySelector('[data-connection]');if(element){element.textContent=this.connected?'Live connection':this.pollingTimer?'Updates every 5 seconds':'Reconnecting…';element.classList.toggle('connected',this.connected);}}
  presenceLabel(){const element=this.mountRoot?.querySelector('[data-presence]');if(element){const others=this.online.filter(uid=>uid!==this.user.id);element.textContent=others.length?'A participant is online':'Team will reply when available';element.classList.toggle('online',Boolean(others.length));}}
  typingLabel(){const element=this.mountRoot?.querySelector('[data-typing]');if(!element)return;for(const [uid,value] of this.typing)if(value.until<Date.now())this.typing.delete(uid);const names=[...this.typing.values()].map(v=>v.name);element.textContent=names.length?`${names.join(', ')} ${names.length>1?'are':'is'} typing…`:'';clearTimeout(this.typingTimer);if(names.length)this.typingTimer=setTimeout(()=>this.typingLabel(),5500);}
  sendTyping(){if(this.internal||!this.selected||!this.connected||Date.now()-this.lastTyping<2500)return;this.lastTyping=Date.now();this.api(`conversations/${this.selected}/typing`,{method:'POST',body:{typing:true}}).catch(()=>{});clearTimeout(this.stopTypingTimer);this.stopTypingTimer=setTimeout(()=>this.stopTyping(),3000);}
  stopTyping(){clearTimeout(this.stopTypingTimer);if(this.selected&&this.lastTyping)this.api(`conversations/${this.selected}/typing`,{method:'POST',body:{typing:false}}).catch(()=>{});this.lastTyping=0;}
  markRead(){if(this.historySearch||document.hidden||!this.mountRoot||!this.messages.length)return;const last=this.messages.at(-1);if(last.id<=this.lastRead)return;this.lastRead=last.id;this.api(`conversations/${this.selected}/read`,{method:'POST',body:{messageId:last.id}}).then(()=>this.refreshInbox()).catch(()=>{this.lastRead=0;});}
  status(message){const element=this.mountRoot?.querySelector('[data-msg-status]');if(element)element.textContent=message;else this.toast?.(message,'error');}
  resizeInput(){const input=this.mountRoot?.querySelector('[data-compose]');if(input){input.style.height='auto';input.style.height=`${Math.min(input.scrollHeight,180)}px`;}}
  updateSend(){const input=this.mountRoot?.querySelector('[data-compose]');const button=this.mountRoot?.querySelector('.msg-send');const disabled=this.busy||this.current()?.status==='closed';if(input)input.disabled=disabled;this.mountRoot?.querySelectorAll('.msg-composer button:not(.msg-send)').forEach(control=>{control.disabled=disabled;});if(button)button.disabled=disabled||this.uploading>0||(!input?.value.trim()&&!this.attachments.some(a=>a.id));}
  renderContext(){const element=this.mountRoot?.querySelector('[data-compose-context]');if(!element)return;const message=this.edit||this.reply;element.hidden=!message;if(message)element.innerHTML=`<span>${this.edit?'Editing message':`Replying to ${escape(message.sender)}`}<small>${escape(message.body.slice(0,120))}</small></span><button class="msg-icon" type="button" data-cancel-context aria-label="Cancel">${svg('close')}</button>`;}
  releaseAttachments(){for(const attachment of this.attachments){attachment.xhr?.abort();if(attachment.preview)URL.revokeObjectURL(attachment.preview);}this.attachments=[];}
  renderAttachments(){const tray=this.mountRoot?.querySelector('[data-attachment-tray]');if(tray)tray.innerHTML=this.attachments.map(a=>`<div class="msg-pending-file">${a.preview?`<img src="${a.preview}" alt="">`:svg('file')}<span>${escape(a.name)}<small>${a.error?'Upload failed':a.id?'Ready':`Uploading ${a.progress||0}%`}</small>${!a.id&&!a.error?`<progress max="100" value="${a.progress||0}" aria-label="Upload progress"></progress>`:''}</span><button data-remove-attachment="${a.key}" type="button" aria-label="Remove attachment">×</button></div>`).join('');this.updateSend();}
  async addFiles(files){
    if(this.edit){this.status('Finish editing before attaching files.');return;}
    const cid=this.selected;
    for(const file of files){
      if(cid!==this.selected||!this.mountRoot)break;
      if(this.attachments.length>=6){this.status('Attach up to six files per message.');break;}
      if(!/\.(png|jpe?g|webp|pdf|txt|md)$/i.test(file.name)||file.size>10485760||!file.size){this.status(`${file.name}: choose a supported file up to 10 MB.`);continue;}
      const item={key:crypto.randomUUID(),name:file.name,size:file.size,preview:file.type.startsWith('image/')?URL.createObjectURL(file):null,progress:0};this.attachments.push(item);this.uploading++;this.renderAttachments();
      try{const attachment=await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();item.xhr=xhr;xhr.open('POST',`/api/conversations/${cid}/attachments`);xhr.setRequestHeader('X-CSRF-Token',this.csrf);xhr.setRequestHeader('X-File-Name',encodeURIComponent(file.name));xhr.upload.onprogress=e=>{if(e.lengthComputable){item.progress=Math.round(e.loaded/e.total*100);this.renderAttachments();}};xhr.onload=()=>{try{const data=JSON.parse(xhr.responseText);if(xhr.status>=200&&xhr.status<300)resolve(data.attachment);else reject(new Error(data.error));}catch{reject(new Error('Upload failed.'));}};xhr.onerror=()=>reject(new Error('Upload failed. Check your connection.'));xhr.onabort=()=>reject(new Error('Upload cancelled.'));xhr.send(file);});Object.assign(item,attachment);}catch(error){item.error=true;if(cid===this.selected)this.status(error.message);}finally{this.uploading--;if(cid===this.selected)this.renderAttachments();}
    }
  }
  async send(retry=null){
    const input=this.mountRoot?.querySelector('[data-compose]');if(!input||this.busy||this.uploading)return;
    if(this.current()?.status==='closed')return;
    if(this.edit){const mid=this.edit.id;const text=input.value.trim();if(!text)return;this.busy=true;this.updateSend();try{await this.api(`messages/${mid}`,{method:'PATCH',body:{body:text}});this.edit=null;input.value=this.drafts.get(this.selected)||'';this.renderContext();await this.load();}finally{this.busy=false;this.updateSend();}return;}
    const cid=this.selected;const text=retry?.body??input.value.trim();const files=retry?.attachmentIds??this.attachments.filter(a=>a.id).map(a=>a.id);
    if(!text&&!files.length)return;
    // A lost acknowledgment must reuse the original idempotency key.
    retry ||= this.pending.find(m=>m.failed&&m.conversationId===cid&&m.body===text&&JSON.stringify(m.attachmentIds)===JSON.stringify(files));
    const nonce=retry?.nonce||crypto.randomUUID();const payload={body:text,nonce,attachments:files,replyTo:retry?.replyTo??this.reply?.id??null,internal:retry?.internal??this.internal};
    const optimistic=retry||{id:`pending-${nonce}`,nonce,conversationId:cid,senderId:this.user.id,sender:this.user.fullName,role:this.user.role,body:text,internal:this.internal,createdAt:new Date().toISOString(),attachments:[],attachmentIds:files,replyTo:payload.replyTo,optimistic:true};
    optimistic.failed=false;if(!retry)this.pending.push(optimistic);this.busy=true;this.updateSend();this.status('');this.renderHistory();const area=this.mountRoot.querySelector('[data-history]');if(area)area.scrollTop=area.scrollHeight;
    try{await this.api(`conversations/${cid}/messages`,{method:'POST',body:payload});this.pending=this.pending.filter(m=>m.nonce!==nonce);if(cid===this.selected){if(!retry||input.value.trim()===text){input.value='';this.drafts.delete(cid);this.releaseAttachments();this.reply=null;this.renderContext();this.renderAttachments();this.resizeInput();}await this.load();await this.refreshInbox();}this.stopTyping();}
    catch(error){optimistic.failed=true;this.status(error.message);this.renderHistory();}
    finally{this.busy=false;this.updateSend();}
  }
  async newConversation(){
    if(document.querySelector('.msg-dialog'))return;
    const dialog=document.createElement('dialog');dialog.className='msg-dialog';
    dialog.innerHTML=`<form data-new-chat><div class="msg-dialog-heading"><span class="msg-eyebrow">A NEW BEGINNING</span><button type="button" class="msg-icon" data-close-dialog aria-label="Close">${svg('close')}</button></div><h2>What’s on your mind?</h2><p>Start a private conversation with ${this.isStaff?'a client':'the NorthByte team'}.</p>${this.isStaff?'<label>Client<select name="clientId" required><option value="">Loading clients…</option></select></label>':''}<label>Conversation name<input name="title" required maxlength="140" placeholder="e.g. Let’s talk about my next project" autofocus></label><label>Connect a project<select name="projectId"><option value="">General conversation</option></select></label><p class="msg-error" data-dialog-error role="status"></p><button type="submit" class="dash-primary">${svg('chat')}Start conversation</button></form>`;
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close-dialog]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
    const projects=this.getProjects?.()||[];const select=dialog.querySelector('[name=projectId]');for(const project of projects){const option=document.createElement('option');option.value=project.id;option.textContent=project.title;select.append(option);}
    if(this.isStaff){select.closest('label').hidden=true;try{const data=await this.api('team/clients');const clients=dialog.querySelector('[name=clientId]');clients.innerHTML='<option value="">Choose a client</option>';for(const user of data.users){const option=document.createElement('option');option.value=user.id;option.textContent=`${user.name} · ${user.email}`;clients.append(option);}}catch(error){dialog.querySelector('[data-dialog-error]').textContent=error.message;}}
    dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const button=dialog.querySelector('[type=submit]');button.disabled=true;try{const data=Object.fromEntries(new FormData(event.target));if(data.projectId){const project=projects.find(p=>p.id===data.projectId);await this.api('projects',{method:'POST',body:project});}const result=await this.api('conversations',{method:'POST',body:data});await this.refreshInbox();dialog.close();await this.select(result.conversation.id);}catch(error){dialog.querySelector('[data-dialog-error]').textContent=error.message;button.disabled=false;}};
  }
  async openProject(project){await this.api('projects',{method:'POST',body:project});const result=await this.api('conversations',{method:'POST',body:{title:project.title,projectId:project.id}});await this.refreshInbox();return `/dashboard/messages?conversation=${encodeURIComponent(result.conversation.id)}`;}
  async click(event){
    const button=event.target.closest('button');if(!button)return;
    if(this.busy&&(button.closest('[data-composer]')||button.dataset.reply||button.dataset.editMessage))return;
    if(button.hasAttribute('data-new-conversation'))return this.newConversation();
    if(button.dataset.conversation)return this.select(button.dataset.conversation);
    if(button.hasAttribute('data-more-conversations')){button.disabled=true;try{await this.refreshInbox(null,true);}finally{button.disabled=false;}}
    if(button.dataset.filter){this.filter=button.dataset.filter;this.mountRoot.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});await this.refreshInbox();}
    if(button.hasAttribute('data-history-toggle')){this.searchOpen=!this.searchOpen;const search=this.mountRoot.querySelector('.msg-history-search');search.hidden=!this.searchOpen;button.setAttribute('aria-expanded',String(this.searchOpen));if(this.searchOpen)search.querySelector('input').focus();else if(this.historySearch){this.historySearch='';this.messages=[];await this.load(true);}}
    if(button.hasAttribute('data-info')){this.infoOpen=!this.infoOpen;this.mountRoot.classList.toggle('info-open',this.infoOpen);this.mountRoot.querySelector('[data-info]')?.setAttribute('aria-expanded',String(this.infoOpen));}
    if(button.hasAttribute('data-chat-back')){this.saveDraft();this.stopTyping();this.mountRoot.classList.remove('chat-open');}
    if(button.hasAttribute('data-load-older')){button.disabled=true;try{await this.load(false,true);}finally{button.disabled=false;}}
    if(button.hasAttribute('data-new-messages')){const area=this.mountRoot.querySelector('[data-history]');area.scrollTo({top:area.scrollHeight,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});button.hidden=true;}
    const find=mid=>this.messages.find(m=>m.id===Number(mid));
    if(button.dataset.reply){this.stopTyping();this.reply=find(button.dataset.reply);this.edit=null;this.internal=this.reply.internal;this.mountRoot.querySelector('[data-note]')?.setAttribute('aria-pressed',String(this.internal));this.mountRoot.querySelector('[data-composer]').classList.toggle('is-note',this.internal);this.renderContext();this.mountRoot.querySelector('[data-compose]').focus();}
    if(button.dataset.editMessage){this.saveDraft();this.edit=find(button.dataset.editMessage);this.reply=null;const input=this.mountRoot.querySelector('[data-compose]');input.value=this.edit.body;input.focus();this.renderContext();this.resizeInput();this.updateSend();}
    if(button.dataset.deleteMessage){if(confirm('Delete this message?')){await this.api(`messages/${button.dataset.deleteMessage}`,{method:'DELETE'});await this.load();}}
    if(button.dataset.copyMessage){await navigator.clipboard.writeText(find(button.dataset.copyMessage).body);this.status('Message copied.');}
    if(button.dataset.reactionPicker){const message=button.closest('[data-message]');const existing=message.querySelector('.msg-reaction-choices');if(existing)existing.remove();else message.insertAdjacentHTML('beforeend',`<div class="msg-reaction-choices" role="group" aria-label="Choose a reaction">${emojiList.map(emoji=>`<button data-react="${emoji}" data-mid="${button.dataset.reactionPicker}" aria-label="React ${emoji}">${emoji}</button>`).join('')}</div>`);}
    if(button.dataset.react){await this.api(`messages/${button.dataset.mid}/reactions`,{method:'POST',body:{emoji:button.dataset.react}});await this.load();}
    if(button.hasAttribute('data-cancel-context')){this.edit=null;this.reply=null;this.mountRoot.querySelector('[data-compose]').value=this.drafts.get(this.selected)||'';this.renderContext();this.updateSend();}
    if(button.hasAttribute('data-note')){this.stopTyping();this.internal=!this.internal;button.setAttribute('aria-pressed',String(this.internal));this.mountRoot.querySelector('[data-composer]').classList.toggle('is-note',this.internal);}
    if(button.hasAttribute('data-mute')){const c=this.current();await this.api(`conversations/${c.id}/mute`,{method:'POST',body:{muted:!c.muted}});await this.refreshInbox();this.renderDetails();}
    if(button.hasAttribute('data-emoji')){const picker=this.mountRoot.querySelector('[data-emoji-picker]');picker.hidden=!picker.hidden;}
    if(button.dataset.insertEmoji){const input=this.mountRoot.querySelector('[data-compose]');input.setRangeText(button.dataset.insertEmoji,input.selectionStart,input.selectionEnd,'end');input.focus();this.mountRoot.querySelector('[data-emoji-picker]').hidden=true;this.saveDraft();this.updateSend();}
    if(button.hasAttribute('data-attach'))this.mountRoot.querySelector('[data-attachment-input]').click();
    if(button.dataset.removeAttachment){const index=this.attachments.findIndex(a=>a.key===button.dataset.removeAttachment);const [item]=this.attachments.splice(index,1);item.xhr?.abort();if(item.preview)URL.revokeObjectURL(item.preview);this.renderAttachments();}
    if(button.dataset.retry)return this.send(this.pending.find(m=>m.nonce===button.dataset.retry));
  }
}
export const messaging = new Messages();
