/**
 * OAD Science Forum kiosk – mailer (Google Apps Script web app)
 * v0.2 (2026-11-25) – adds a send window (forum dates only), test addresses and a daily cap.
 *
 * Receives {email, ids[], website} from the kiosk, builds the email from its OWN content
 * (the kiosk never sends email text, so this can't be abused to send arbitrary messages),
 * sends one email, and keeps NO email addresses. Only per-flyer counts are kept (Script Properties).
 *
 * Deploy: see README. Run as: Me (the OAD account). Access: Anyone.
 * Keep CONTENT in sync with ACTIVITIES in the kiosk HTML.
 */

const SITE_URL = 'https://www.astro4dev.org';
const MAILING_LIST_URL = '';   // [to confirm]
const DISCORD_URL = '';        // [to confirm]
const PRIVACY_URL = '';        // [to confirm] optional
const SENDER_NAME = 'IAU Office of Astronomy for Development';
const SUBJECT = 'Your OAD flyers from the Science Forum';
const RESEND_BLOCK_SECONDS = 600; // same address can't be emailed again within 10 minutes

// ---- TESTING SWITCH: true = send any time, ignoring the window below. ----
// Set to false (and fill in the dates) before the forum. Daily cap and resend block still apply.
const OPEN_FOR_TESTING = true;

// ---- Send window: emails go out ONLY between these times (SA time). Empty = closed. ----
const TIMEZONE = 'Africa/Johannesburg';
const ACTIVE_FROM  = '';   // 'yyyy-MM-dd HH:mm', e.g. first forum morning   [to confirm]
const ACTIVE_UNTIL = '';   // 'yyyy-MM-dd HH:mm', e.g. last forum evening    [to confirm]
// Addresses that may send at any time, for testing before the forum. Lower case.
const TEST_EMAILS = [];    // e.g. ['your.name@example.org']
const DAILY_CAP = 300;     // max emails per day (SA time), across all addresses

const PH_SUMMARY = '[2–3 sentence summary from astro4dev.org – to confirm]';
const PH_POINTS = ['[Key fact 1 – to confirm]', '[Key fact 2 – to confirm]', '[Key fact 3 – to confirm]'];
// PLACEHOLDER content – replace with approved copy (same ids as the kiosk)
const CONTENT = {
  'flagship-1':         { title: 'Flagship 1 – Astrotourism [to confirm]', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'flagship-2':         { title: 'Flagship 2 – [title]', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'flagship-3':         { title: 'Flagship 3 – [title]', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'hub':                { title: 'The Hub', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'research-institute': { title: 'Research Institute', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'funded-projects':    { title: 'Funded Projects', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'regional-offices':   { title: 'Regional Offices', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL },
  'hack4dev':           { title: 'Hack4Dev', tagline: '[One-line tagline – to confirm]', summary: PH_SUMMARY, points: PH_POINTS, link: SITE_URL }
};

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return json_({ ok: true });                 // honeypot filled: pretend success
    const email = String(data.email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json_({ ok: false, error: 'invalid_email' });
    if (!isOpen_() && TEST_EMAILS.indexOf(email) === -1) return json_({ ok: false, error: 'closed' });
    if (sentToday_() >= DAILY_CAP) return json_({ ok: false, error: 'quota' });
    const ids = (Array.isArray(data.ids) ? data.ids : []).filter(function (id) { return CONTENT.hasOwnProperty(id); }).slice(0, 20);
    if (!ids.length) return json_({ ok: false, error: 'no_flyers' });

    const cache = CacheService.getScriptCache();
    const key = 'sent_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email));
    if (cache.get(key)) return json_({ ok: false, error: 'recently_sent' });
    if (MailApp.getRemainingDailyQuota() < 5) return json_({ ok: false, error: 'quota' });

    MailApp.sendEmail({
      to: email,
      subject: SUBJECT,
      name: SENDER_NAME,
      htmlBody: buildHtml_(ids),
      body: buildText_(ids)
      // noReply: true,   // Workspace only: send from a no-reply address
    });
    cache.put(key, '1', RESEND_BLOCK_SECONDS);
    countFlyers_(ids);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet() {
  return json_({ ok: true, service: 'oad-kiosk-mailer', open: isOpen_(), testing: OPEN_FOR_TESTING, from: ACTIVE_FROM || null, until: ACTIVE_UNTIL || null });
}

/* true only inside the configured send window; closed if either date is missing */
function isOpen_() {
  if (OPEN_FOR_TESTING) return true;
  if (!ACTIVE_FROM || !ACTIVE_UNTIL) return false;
  const now = new Date();
  const from = Utilities.parseDate(ACTIVE_FROM, TIMEZONE, 'yyyy-MM-dd HH:mm');
  const until = Utilities.parseDate(ACTIVE_UNTIL, TIMEZONE, 'yyyy-MM-dd HH:mm');
  return now >= from && now <= until;
}

function todayKey_() { return 'day_' + Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'); }
function sentToday_() { return Number(PropertiesService.getScriptProperties().getProperty(todayKey_()) || 0); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function link_(url, text) {
  return url ? '<a href="' + esc_(url) + '" style="color:#5b3fd6">' + esc_(text) + '</a>' : esc_(text);
}

function buildHtml_(ids) {
  const blocks = ids.map(function (id) {
    const a = CONTENT[id];
    return '<tr><td style="padding:16px 0;border-bottom:1px solid #e6e2f5">' +
      '<h2 style="margin:0 0 4px;font-size:20px;color:#2a1878">' + esc_(a.title) + '</h2>' +
      '<p style="margin:0 0 8px;color:#5b3fd6">' + esc_(a.tagline) + '</p>' +
      '<p style="margin:0 0 8px">' + esc_(a.summary) + '</p>' +
      '<ul style="margin:0 0 8px;padding-left:20px">' + a.points.map(function (p) { return '<li>' + esc_(p) + '</li>'; }).join('') + '</ul>' +
      '<p style="margin:0">' + link_(a.link || SITE_URL, 'Read more') + '</p></td></tr>';
  }).join('');
  const stay = (MAILING_LIST_URL || DISCORD_URL)
    ? '<p style="margin:0 0 8px;font-size:16px"><strong>Stay in touch:</strong> ' +
      [MAILING_LIST_URL && link_(MAILING_LIST_URL, 'join our mailing list'), DISCORD_URL && link_(DISCORD_URL, 'join our Discord')].filter(String).join(' or ') + '.</p>'
    : '';
  return '<!doctype html><html><body style="margin:0;background:#f4f2fb;font-family:Arial,Helvetica,sans-serif;color:#222">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">' +
    '<tr><td style="background:#2a1878;color:#fff;padding:24px"><div style="font-size:28px;font-weight:800">OAD</div>' +
    '<div style="font-size:14px;opacity:.85">IAU Office of Astronomy for Development</div></td></tr>' +
    '<tr><td style="padding:24px"><p style="margin:0 0 8px;font-size:16px">Thanks for visiting the OAD at the Science Forum. Here are the flyers you chose.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + blocks + '</table>' +
    '<p style="margin:20px 0 8px;font-size:16px"><strong>Find out more:</strong> ' + link_(SITE_URL, 'www.astro4dev.org') + '</p>' + stay +
    '</td></tr><tr><td style="padding:16px 24px;background:#f4f2fb;font-size:12px;color:#666">' +
    'You received this one-off email because you asked for it at our stand. We have not added you to any mailing list.' +
    (PRIVACY_URL ? ' ' + link_(PRIVACY_URL, 'Privacy notice') : '') +
    '</td></tr></table></td></tr></table></body></html>';
}

function buildText_(ids) {
  const parts = ['Thanks for visiting the OAD at the Science Forum. Here are the flyers you chose.', ''];
  ids.forEach(function (id) {
    const a = CONTENT[id];
    parts.push(a.title, a.tagline, a.summary);
    a.points.forEach(function (p) { parts.push('- ' + p); });
    parts.push('Read more: ' + (a.link || SITE_URL), '');
  });
  parts.push('Find out more: ' + SITE_URL);
  if (MAILING_LIST_URL) parts.push('Join our mailing list: ' + MAILING_LIST_URL);
  if (DISCORD_URL) parts.push('Join our Discord: ' + DISCORD_URL);
  parts.push('', 'You received this one-off email because you asked for it at our stand. We have not added you to any mailing list.');
  return parts.join('\n');
}

/* Per-flyer counts for M&E. No personal data. View with logCounts() in the editor. */
function countFlyers_(ids) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    ids.concat(['_emails']).forEach(function (id) {
      const k = 'count_' + id;
      props.setProperty(k, String(Number(props.getProperty(k) || 0) + 1));
    });
    const dk = todayKey_();                                   // daily cap counter
    props.setProperty(dk, String(Number(props.getProperty(dk) || 0) + 1));
  } finally { lock.releaseLock(); }
}
function logCounts() {
  const all = PropertiesService.getScriptProperties().getProperties();
  Object.keys(all).filter(function (k) { return k.indexOf('count_') === 0; }).sort()
    .forEach(function (k) { console.log(k.slice(6) + ': ' + all[k]); });
}
