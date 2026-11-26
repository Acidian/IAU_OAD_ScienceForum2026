/**
 * OAD Science Forum kiosk – mailer (Google Apps Script web app)
 * v0.5 (2026-11-26) – approved Flagship 2/3 text with links ([text](url)), quote and Get involved; OAD colours;
 *   CONTENT generated from the kiosk by tools/sync-content.js. Matches kiosk v0.6.
 * v0.4 (2026-11-26) – flagship names (Astro-tourism, Astronomy for Mental Health, Hack4Dev); hack4dev id removed. Matches kiosk v0.5.
 * v0.3 (2026-11-26) – Innovation Hub (was The Hub) and Implementation Centre, matching kiosk v0.4.
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
const MAILING_LIST_URL = 'https://astro4dev.org/contactus/emaillists/';   // IAU OAD Newsletter signup page
const DISCORD_URL = 'https://discord.gg/TZXWg72Wf';   // Astro4dev Discord. NOTE: invite expires 2026-12-26 – replace with a non-expiring invite
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

// <CONTENT> – generated from the kiosk's ACTIVITIES by tools/sync-content.js. Do not edit by hand.
const CONTENT = {
  "flagship-1": {
    "title": "Flagship 1 – Astrotourism",
    "tagline": "[One-line tagline – to confirm]",
    "summary": "[2–3 sentence summary from astro4dev.org – to confirm]",
    "points": [
      "[Key fact 1 – to confirm]",
      "[Key fact 2 – to confirm]",
      "[Key fact 3 – to confirm]"
    ],
    "link": "https://www.astro4dev.org"
  },
  "flagship-2": {
    "title": "Flagship 2 – Astronomy for Mental Health",
    "tagline": "Looking up together: the night sky for calm, perspective and connection.",
    "summary": "Since 2020, the OAD’s Astronomy for Mental Health flagship has used simple, low-cost stargazing activities to support wellbeing in communities. Guided experiences under the night sky help people find calm, a new sense of perspective and connection with others. It supports wellbeing and is not therapy.",
    "points": [
      "Open [guidelines](https://astro4dev.org/astronomy-for-mental-health-guidelines/), free for anyone to use (v1 2023, v2 2025)",
      "Facilitator training, including a free [online course](https://acidian.github.io/AMH-Facilitator-Course/), and a global community of practice",
      "Peer-reviewed findings with [Stellenbosch University](https://www.su.ac.za/en/news/under-southern-skies-how-stargazing-shaping-mental-health-research-south-africa) ([IJERPH, 2026](https://www.mdpi.com/1660-4601/23/8/1016)), among 9 publications so far",
      "Dark-sky retreats, including in Sutherland",
      "Wellbeing, not therapy: this is not counselling, assessment, diagnosis, treatment or crisis support, and it does not replace them."
    ],
    "quote": {
      "text": "I wanna take back the calmness Sutherland has.",
      "cite": "Participant, Sutherland dark-sky retreat"
    },
    "getInvolved": [
      "Read the open [Astronomy for Mental Health Guidelines](https://astro4dev.org/astronomy-for-mental-health-guidelines/)",
      "Take the free [online facilitator course](https://acidian.github.io/AMH-Facilitator-Course/) (live version, updated regularly)",
      "Read the peer-reviewed study in [IJERPH (2026)](https://www.mdpi.com/1660-4601/23/8/1016)",
      "Explore [activities](https://astro4dev.org/themes/theme-2-celebrating-our-common-humanity-through-astronomy/flagship-project-2-activities/) and [resources](https://astro4dev.org/themes/theme-2-celebrating-our-common-humanity-through-astronomy/flagship-project-2-resources/)",
      "Visit the [Astronomy for Mental Health website](https://mentalhealth.astro4dev.org/)",
      "Contact the team: [mentalhealth@astro4dev.org](mailto:mentalhealth@astro4dev.org)"
    ],
    "link": "https://astro4dev.org/themes/theme-2-celebrating-our-common-humanity-through-astronomy/astronomy-mental-health/"
  },
  "flagship-3": {
    "title": "Flagship 3 – Astro 4 Skills: Hack4Dev",
    "tagline": "Turning young talent into data-science opportunity.",
    "summary": "Hack4Dev runs hands-on data science hackathons. Teams of students and young professionals use astronomy-grade data skills to tackle real development challenges. Trained local organisers run 4-day hackathons at their own institutions, so each cycle trains the people who run the next.",
    "points": [
      "Launched in 2022 by the OAD with [IDIA](https://www.idia.ac.za/), [DARA](https://www.dara-project.org/), [AfAS](https://www.afasociety.org/) and BRICS partners",
      "350+ participants selected and trained from about 2,000 applications",
      "Women’s participation up from under 20% to 41%",
      "2026: 22 hackathons in 13 countries, with open challenges on [GitHub](https://github.com/Hack4Dev)"
    ],
    "quote": {
      "text": "Astronomy has always been a data science.",
      "cite": "Hack4Dev"
    },
    "getInvolved": [
      "See how the [Data Science Hackathon Programme](https://hack4dev.org/ds-hackathon/) works, and watch [hack4dev.org](https://hack4dev.org/) for the next call for participants",
      "Want to host a hackathon at your institution? Read the [organisers call](https://hack4dev.org/dshp-organisers-call/) and [get in touch](https://hack4dev.org/contact/)",
      "Try the open challenges on [GitHub](https://github.com/Hack4Dev)"
    ],
    "link": "https://hack4dev.org/"
  },
  "innovation-hub": {
    "title": "Innovation Hub",
    "tagline": "[One-line tagline – to confirm]",
    "summary": "[2–3 sentence summary from astro4dev.org – to confirm]",
    "points": [
      "[Key fact 1 – to confirm]",
      "[Key fact 2 – to confirm]",
      "[Key fact 3 – to confirm]"
    ],
    "link": "https://www.astro4dev.org"
  },
  "research-institute": {
    "title": "Research Institute",
    "tagline": "[One-line tagline – to confirm]",
    "summary": "[2–3 sentence summary from astro4dev.org – to confirm]",
    "points": [
      "[Key fact 1 – to confirm]",
      "[Key fact 2 – to confirm]",
      "[Key fact 3 – to confirm]"
    ],
    "link": "https://www.astro4dev.org"
  },
  "implementation-centre": {
    "title": "Implementation Centre",
    "tagline": "[One-line tagline – to confirm]",
    "summary": "[2–3 sentence summary from astro4dev.org – to confirm]",
    "points": [
      "[Key fact 1 – to confirm]",
      "[Key fact 2 – to confirm]",
      "[Key fact 3 – to confirm]"
    ],
    "link": "https://www.astro4dev.org"
  },
  "funded-projects": {
    "title": "Funded Projects",
    "tagline": "[One-line tagline – to confirm]",
    "summary": "[2–3 sentence summary from astro4dev.org – to confirm]",
    "points": [
      "[Key fact 1 – to confirm]",
      "[Key fact 2 – to confirm]",
      "[Key fact 3 – to confirm]"
    ],
    "link": "https://www.astro4dev.org"
  },
  "regional-offices": {
    "title": "Regional Offices",
    "tagline": "[One-line tagline – to confirm]",
    "summary": "[2–3 sentence summary from astro4dev.org – to confirm]",
    "points": [
      "[Key fact 1 – to confirm]",
      "[Key fact 2 – to confirm]",
      "[Key fact 3 – to confirm]"
    ],
    "link": "https://www.astro4dev.org"
  }
};
// </CONTENT>

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
const LS_ = 'color:#1a524b;font-weight:bold';   // OAD teal links
const LINK_RE_ = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g;
function link_(url, text) {
  return url ? '<a href="' + esc_(url) + '" style="' + LS_ + '">' + esc_(text) + '</a>' : esc_(text);
}
/* content text: [text](url) becomes a link in HTML, "text (url)" in plain text */
function md_(s) {
  return esc_(s).replace(LINK_RE_, function (_, t, u) { return '<a href="' + u + '" style="' + LS_ + '">' + t + '</a>'; });
}
function mdText_(s) {
  return String(s).replace(LINK_RE_, function (_, t, u) { u = u.replace(/^mailto:/, ''); return t === u ? t : t + ' (' + u + ')'; });
}
function li_(p) { return '<li style="margin:0 0 4px">' + md_(p) + '</li>'; }

function buildHtml_(ids) {
  const blocks = ids.map(function (id) {
    const a = CONTENT[id];
    return '<tr><td style="padding:18px 0;border-bottom:1px solid #eadfce">' +
      '<h2 style="margin:0 0 4px;font-size:20px;color:#1e3551">' + esc_(a.title) + '</h2>' +
      '<p style="margin:0 0 10px;color:#af5a4c;font-weight:bold">' + esc_(a.tagline) + '</p>' +
      '<p style="margin:0 0 10px">' + md_(a.summary) + '</p>' +
      '<ul style="margin:0 0 10px;padding-left:20px">' + (a.points || []).map(li_).join('') + '</ul>' +
      (a.quote ? '<p style="margin:0 0 10px;padding:8px 12px;border-left:4px solid #f9c434;background:#faf6ef;font-style:italic">“' +
        esc_(a.quote.text) + '”<br><span style="font-style:normal;font-size:13px;color:#666">— ' + esc_(a.quote.cite) + '</span></p>' : '') +
      (a.getInvolved ? '<p style="margin:0 0 4px;font-weight:bold;color:#1e3551">Get involved</p><ul style="margin:0 0 10px;padding-left:20px">' +
        a.getInvolved.map(li_).join('') + '</ul>' : '') +
      '<p style="margin:0">' + link_(a.link || SITE_URL, 'Read more →') + '</p></td></tr>';
  }).join('');
  const stay = (MAILING_LIST_URL || DISCORD_URL)
    ? '<p style="margin:0 0 8px;font-size:16px"><strong>Stay in touch:</strong> ' +
      [MAILING_LIST_URL && link_(MAILING_LIST_URL, 'join our mailing list'), DISCORD_URL && link_(DISCORD_URL, 'join our Discord')].filter(String).join(' or ') + '.</p>'
    : '';
  return '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#f5efe6;font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.45">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">' +
    '<tr><td style="background:#1e3551;color:#fff;padding:24px"><div style="font-size:28px;font-weight:800">OAD</div>' +
    '<div style="font-size:14px;opacity:.85">IAU Office of Astronomy for Development</div></td></tr>' +
    '<tr><td style="padding:24px"><p style="margin:0 0 8px;font-size:16px">Thanks for visiting the OAD at the Science Forum. Here are the flyers you chose.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + blocks + '</table>' +
    '<p style="margin:20px 0 8px;font-size:16px"><strong>Find out more:</strong> ' + link_(SITE_URL, 'www.astro4dev.org') + '</p>' + stay +
    '</td></tr><tr><td style="padding:16px 24px;background:#f5efe6;font-size:12px;color:#666">' +
    'You received this one-off email because you asked for it at our stand. We have not added you to any mailing list.' +
    (PRIVACY_URL ? ' ' + link_(PRIVACY_URL, 'Privacy notice') : '') +
    '</td></tr></table></td></tr></table></body></html>';
}

function buildText_(ids) {
  const parts = ['Thanks for visiting the OAD at the Science Forum. Here are the flyers you chose.', ''];
  ids.forEach(function (id) {
    const a = CONTENT[id];
    parts.push(a.title.toUpperCase(), a.tagline, '', mdText_(a.summary), '');
    (a.points || []).forEach(function (p) { parts.push('- ' + mdText_(p)); });
    if (a.quote) parts.push('', '"' + a.quote.text + '" (' + a.quote.cite + ')');
    if (a.getInvolved) { parts.push('', 'Get involved:'); a.getInvolved.forEach(function (p) { parts.push('- ' + mdText_(p)); }); }
    parts.push('', 'Read more: ' + (a.link || SITE_URL), '', '----', '');
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
