/* ============================================================
   SOUND — Web Audio blip
   ============================================================ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function playBlip() {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'square'; o.frequency.value = 800; g.gain.value = 0.04;
    o.start(); o.stop(audioCtx.currentTime + 0.06);
  } catch (e) {}
}

/* ============================================================
   BOOT SPLASH
   ============================================================ */
(function boot() {
  const p = document.getElementById('bootProgress');
  const n = 16;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('div');
    b.className = 'boot-block';
    p.appendChild(b);
  }
  const blocks = p.querySelectorAll('.boot-block');
  let i = 0;
  const iv = setInterval(() => {
    if (i < blocks.length) {
      blocks[i].style.opacity = '1';
      i++;
    } else {
      clearInterval(iv);
      setTimeout(() => {
        document.getElementById('bootSplash').classList.add('hidden');
        document.getElementById('desktop').style.display = 'block';
        document.getElementById('taskbar').style.display = 'flex';
      }, 300);
    }
  }, 80);
})();

/* ============================================================
   CLOCK
   ============================================================ */
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('trayClock').textContent = `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}
updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   APP STATE
   ============================================================ */
const STORAGE_KEY = 'sniplink_urls';
let basePath = window.location.pathname;
if (basePath.endsWith('index.html')) basePath = basePath.slice(0, -10);
if (!basePath.endsWith('/')) basePath += '/';
const APP_ORIGIN = window.location.origin + basePath;
const DISPLAY_ORIGIN = APP_ORIGIN.replace(/^https?:\/\//, '');

/* Redirect handler (Supports both ?s= and #) */
(function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('s') || window.location.hash.slice(1);
  const fallback = params.get('o');
  
  if (!id && !fallback) return;
  
  const links = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const match = links.find(l => l.shortId === id);
  
  if (id) {
    // Fetch from global Redis database
    fetch(`/api/getLink?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          // Update local history clicks if it happened to be created by this device
          if (match) {
            match.clicks = (match.clicks || 0) + 1;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
          }
          window.location.replace(data.url);
        } else if (fallback) {
          try { window.location.replace(decodeURIComponent(fallback)); } catch (e) {}
        } else {
          document.body.innerHTML = '<div style="padding:20px;font-family:Arial"><h2>Error 404</h2><p>This Snippit link was not found in the global database.</p></div>';
        }
      })
      .catch(() => {
        // Fallback if API fails
        if (match) window.location.replace(match.original);
        else if (fallback) try { window.location.replace(decodeURIComponent(fallback)); } catch (e) {}
      });
  } else if (fallback) {
    try { window.location.replace(decodeURIComponent(fallback)); } catch (e) {}
  }
})();

function loadLinks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveLinks(l) { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)); }

function genId(n = 4) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < n; i++) r += c[~~(Math.random() * c.length)];
  return r;
}

function isValidUrl(s) {
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const $ = id => document.getElementById(id);
const longUrlInput = $('longUrl');
const customCheck = $('customCheck');
const customRow = $('customRow');
const customNameInput = $('customName');
const shortenBtn = $('shortenBtn');
const clearBtn = $('clearBtn');
const resultPanel = $('resultPanel');
const resultUrl = $('resultUrl');
const copyResultBtn = $('copyResultBtn');
const viewQrBtn = $('viewQrBtn');
const linksBody = $('linksBody');
const emptyListview = $('emptyListview');
const statusText = $('statusText');
let lastCreatedUrl = '';
let lastDisplayUrl = '';
let lastQrUrl = '';

/* ============================================================
   CUSTOM NAME CHECKBOX
   ============================================================ */
customCheck.addEventListener('change', () => {
  customRow.style.display = customCheck.checked ? 'flex' : 'none';
  if (!customCheck.checked) customNameInput.value = '';
  playBlip();
});

/* ============================================================
   SHORTEN
   ============================================================ */
shortenBtn.addEventListener('click', async () => {
  playBlip();
  const url = longUrlInput.value.trim();
  const custom = customNameInput.value.trim().replace(/[^a-zA-Z0-9\-_]/g, '');

  if (!url) { showErrorDialog('Please enter a URL.'); return; }
  if (!isValidUrl(url)) { showErrorDialog('Invalid URL. Make sure it starts with http:// or https://'); return; }

  const shortId = custom || genId();
  shortenBtn.disabled = true;

  try {
    // Save to the global Vercel Database
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortId, url })
    });
    const data = await res.json();
    
    if (!res.ok) {
      showErrorDialog(data.error || 'Server error.');
      shortenBtn.disabled = false;
      return;
    }
    
    // Save locally to display in the user's dashboard UI
    const links = loadLinks();
    const fullUrl = `${APP_ORIGIN}?s=${shortId}`;
    const displayUrl = `${DISPLAY_ORIGIN}?s=${shortId}`;
    const qrUrl = `${APP_ORIGIN}?s=${shortId}&o=${encodeURIComponent(url)}`;
    
    links.unshift({ original: url, shortId, customName: custom || '', clicks: 0, createdAt: Date.now() });
    saveLinks(links);

    lastCreatedUrl = fullUrl;
    lastDisplayUrl = displayUrl;
    lastQrUrl = qrUrl;
    resultUrl.value = displayUrl;
    resultPanel.classList.add('active');
    statusText.textContent = `Snipped: ${shortId}`;

    renderLinks();
    showSuccessDialog();
  } catch (err) {
    showErrorDialog('Network error connecting to global database.');
  } finally {
    shortenBtn.disabled = false;
  }
});

clearBtn.addEventListener('click', () => {
  playBlip();
  longUrlInput.value = '';
  customNameInput.value = '';
  customCheck.checked = false;
  customRow.style.display = 'none';
  resultPanel.classList.remove('active');
  statusText.textContent = 'Ready';
});

/* ============================================================
   COPY
   ============================================================ */
copyResultBtn.addEventListener('click', () => { playBlip(); doCopy(resultUrl.value, copyResultBtn); });
$('tbCopy').addEventListener('click', () => { playBlip(); if (lastDisplayUrl) doCopy(lastDisplayUrl, null); });

function doCopy(text, btn) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });

  const links = loadLinks();
  const shortId = text.includes('?s=') ? text.split('?s=')[1] : text.split('#')[1];
  const idx = links.findIndex(l => l.shortId === shortId);
  if (idx !== -1) { links[idx].clicks++; saveLinks(links); renderLinks(); }

  if (btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1000);
  }
  statusText.textContent = 'Link copied to clipboard';
}

/* ============================================================
   QR CODE
   ============================================================ */
let qrInstance = null;
viewQrBtn.addEventListener('click', () => { playBlip(); showQrDialog(lastQrUrl); });

function showQrDialog(url) {
  $('qrDialogUrl').textContent = url;
  const container = $('qrCodeContainer');
  container.innerHTML = '';
  qrInstance = new QRCode(container, { text: url, width: 160, height: 160, colorDark: '#000', colorLight: '#fff' });
  $('qrDialog').classList.add('active');
}

$('qrCloseBtn').addEventListener('click', () => { playBlip(); $('qrDialog').classList.remove('active'); });
$('qrCloseX').addEventListener('click', () => { playBlip(); $('qrDialog').classList.remove('active'); });
$('qrDownloadBtn').addEventListener('click', () => {
  playBlip();
  const cv = $('qrCodeContainer').querySelector('canvas');
  const im = $('qrCodeContainer').querySelector('img');
  const a = document.createElement('a');
  a.download = 'snippit-qr.png';
  if (cv) a.href = cv.toDataURL('image/png');
  else if (im) a.href = im.src;
  a.click();
});

/* ============================================================
   DIALOGS
   ============================================================ */
function showSuccessDialog() { $('successDialog').classList.add('active'); }
function showErrorDialog(msg) { $('errorDialogText').textContent = msg; $('errorDialog').classList.add('active'); }

$('successOkBtn').addEventListener('click', () => { playBlip(); $('successDialog').classList.remove('active'); });
$('successCloseX').addEventListener('click', () => { playBlip(); $('successDialog').classList.remove('active'); });
$('errorOkBtn').addEventListener('click', () => { playBlip(); $('errorDialog').classList.remove('active'); });
$('errorCloseX').addEventListener('click', () => { playBlip(); $('errorDialog').classList.remove('active'); });

/* About */
$('tbHelp').addEventListener('click', () => { playBlip(); $('aboutDialog').classList.add('active'); });
$('aboutOkBtn').addEventListener('click', () => { playBlip(); $('aboutDialog').classList.remove('active'); });
$('aboutCloseX').addEventListener('click', () => { playBlip(); $('aboutDialog').classList.remove('active'); });

/* New */
$('tbNew').addEventListener('click', () => {
  playBlip();
  longUrlInput.value = '';
  customNameInput.value = '';
  customCheck.checked = false;
  customRow.style.display = 'none';
  resultPanel.classList.remove('active');
  longUrlInput.focus();
  statusText.textContent = 'Ready';
});

/* ============================================================
   START MENU
   ============================================================ */
const startBtn = $('startBtn');
const startMenu = $('startMenu');

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  playBlip();
  startMenu.classList.toggle('active');
  startBtn.classList.toggle('pressed');
});

$('shutdownItem').addEventListener('click', () => {
  playBlip();
  startMenu.classList.remove('active');
  startBtn.classList.remove('pressed');
  document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;color:#ff8800;font-family:Arial;font-size:18px;flex-direction:column;gap:12px"><div style="font-size:28px">✂️</div><div>It\'s now safe to turn off your computer.</div><div style="font-size:11px;color:#808080;margin-top:20px">(Refresh the page to restart)</div></div>';
});

document.addEventListener('click', (e) => {
  if (!startMenu.contains(e.target) && e.target !== startBtn) {
    startMenu.classList.remove('active');
    startBtn.classList.remove('pressed');
  }
});

/* ============================================================
   CLOSE BUTTON (fun)
   ============================================================ */
$('mainCloseBtn').addEventListener('click', () => {
  playBlip();
  showErrorDialog('Nice try! You can\'t close this window. 😄');
});

/* ============================================================
   KEYBOARD
   ============================================================ */
longUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') shortenBtn.click(); });

/* ============================================================
   RENDER LINKS TABLE
   ============================================================ */
function renderLinks() {
  const links = loadLinks();
  linksBody.innerHTML = '';

  if (!links.length) {
    emptyListview.style.display = 'block';
    return;
  }
  emptyListview.style.display = 'none';

  links.forEach((link, idx) => {
    const tr = document.createElement('tr');
    const displayUrl = `${DISPLAY_ORIGIN}?s=${link.shortId}`;
    const fullUrl = `${APP_ORIGIN}?s=${link.shortId}`;
    const qrUrl = `${APP_ORIGIN}?s=${link.shortId}&o=${encodeURIComponent(link.original)}`;
    const d = new Date(link.createdAt);
    const ds = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    tr.innerHTML = `
      <td><a href="${fullUrl}" target="_blank" style="color:#000080;text-decoration:underline;cursor:pointer">${esc(link.shortId)}</a></td>
      <td title="${esc(link.original)}">${esc(link.original)}</td>
      <td style="text-align:center">${link.clicks}</td>
      <td>${ds}</td>
      <td>
        <button class="lv-action-btn" data-action="copy" data-url="${displayUrl}">📋</button>
        <button class="lv-action-btn" data-action="qr" data-url="${qrUrl}">📱</button>
        <button class="lv-action-btn" data-action="del" data-idx="${idx}">🗑️</button>
      </td>`;
    linksBody.appendChild(tr);
  });

  linksBody.querySelectorAll('.lv-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playBlip();
      const action = btn.dataset.action;
      if (action === 'copy') doCopy(btn.dataset.url, btn);
      else if (action === 'qr') showQrDialog(btn.dataset.url);
      else if (action === 'del') {
        const l = loadLinks();
        l.splice(parseInt(btn.dataset.idx), 1);
        saveLinks(l);
        renderLinks();
        statusText.textContent = 'Link deleted';
      }
    });
  });
}

/* ============================================================
   INIT
   ============================================================ */
renderLinks();

/* Add blip to all buttons */
document.querySelectorAll('.win-btn, .win-toolbar-btn, .start-btn, .win-titlebar-btn').forEach(btn => {
  btn.addEventListener('mousedown', playBlip);
});
