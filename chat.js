// Chat has its own requests and never writes to the score snapshot.
const tableChat = (() => {
  const el = id => document.getElementById(id);
  const dialog = el('table-chat'), log = el('chat-log'), form = el('chat-form'), input = el('chat-text');
  const sendButton = form.querySelector('button');
  let room, cursor = 0, timer, fetching = false, sending = false, retry = null;
  let readError = false, sendError = false, loaded = false;
  const time = new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit'});

  function refresh() {
    const shared = liveTable.active, ready = liveTable.shareable;
    if (room !== liveTable.roomId) {
      room = liveTable.roomId; cursor = 0; loaded = readError = sendError = false;
      retry = null; input.value = ''; log.replaceChildren();
    }
    const totals = allTotals();
    el('chat-scores').innerHTML = game().seats.map(pid =>
      '<span><small>' + esc(pname(pid)) + '</small><b>' + signed(totals[pid]) + '</b></span>').join('');
    el('chat-create').hidden = shared;
    el('chat-invite').hidden = !ready;
    form.hidden = !shared;
    sendButton.disabled = !ready || sending || !input.value.trim();
    const status = !shared ? 'Share this table to chat with friends. 共享牌桌，即可和朋友聊天。'
      : !ready ? liveTable.status()
      : sendError ? 'Couldn’t send. Tap Send to retry. 傳送失敗，請再次點選傳送。'
      : readError ? 'Reconnecting to chat… 正在重新連線…'
      : !loaded ? 'Loading messages… 正在載入訊息…'
      : !cursor ? 'Start the conversation. 傳送第一則訊息吧。' : '';
    if (el('chat-status').textContent !== status) el('chat-status').textContent = status;
  }
  function append(messages) {
    const atEnd = !cursor || log.scrollHeight - log.clientHeight - log.scrollTop < 40;
    const batch = document.createDocumentFragment();
    for (const m of messages) {
      if (m.id <= cursor) continue;
      const row = document.createElement('article'), name = document.createElement('b');
      const stamp = document.createElement('time'), body = document.createElement('p');
      name.textContent = m.sender; body.textContent = m.message;
      stamp.dateTime = new Date(m.sent_at).toISOString(); stamp.textContent = time.format(m.sent_at);
      row.append(name, stamp, body); batch.append(row); cursor = m.id;
    }
    log.append(batch);
    if (atEnd) log.scrollTop = log.scrollHeight;
  }
  async function read() {
    if (!dialog.open || document.hidden || !liveTable.shareable || fetching) return;
    fetching = true;
    try {
      const response = await fetch(liveTable.chatURL + '?after=' + cursor, {cache:'no-store', signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error();
      append((await response.json()).messages);
      loaded = true; readError = false;
    } catch { readError = true; }
    finally { fetching = false; refresh(); }
  }
  async function send(event) {
    event.preventDefault();
    const message = input.value.trim(), sender = mySeat.profile?.name;
    if (sending || !message || !sender || !liveTable.shareable) return;
    if (!retry || retry.message !== message || retry.sender !== sender) {
      retry = {sender, message, requestId:crypto.randomUUID()};
    }
    sending = true; sendError = false; input.readOnly = true; refresh();
    try {
      const response = await fetch(liveTable.chatURL, {method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(retry), signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error();
      input.value = ''; retry = null;
      log.scrollTop = log.scrollHeight;
      await read();
    } catch { sendError = true; }
    finally { sending = false; input.readOnly = false; refresh(); }
  }
  function open() {
    if (!mySeat.profile) { mySeat.show(); return; }
    dialog.showModal(); refresh(); read();
    timer = setInterval(read, 2000);
  }
  el('chat-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    clearInterval(timer);
    document.querySelector('[data-a="openChat"]')?.focus({preventScroll:true});
  });
  el('chat-create').addEventListener('click', () => { A.createLiveTable(); refresh(); read(); });
  const copyButton = el('chat-copy'), copyLabel = copyButton.textContent;
  let copyTimer;
  copyButton.addEventListener('click', async () => {
    if (await liveTable.copyLink()) {
      copyButton.textContent = 'Link copied · 已複製連結';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyButton.textContent = copyLabel; }, 1800);
    }
  });
  form.addEventListener('submit', send);
  input.addEventListener('input', () => { sendError = false; refresh(); });
  document.addEventListener('visibilitychange', read);
  window.addEventListener('online', read);
  return {open, refresh};
})();
