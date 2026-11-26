/**
 * OAD Science Forum kiosk – mailer (Google Apps Script web app)
 * v0.9 (2026-11-26) – optional newsletter opt-in: saves ticked sign-ups to a private Google Sheet. Matches kiosk v0.10.
 * v0.8 (2026-11-26) – updated OAD figures (250+ projects, €1.5 million+, 2 million+ reached). Matches kiosk v0.9.
 * v0.7 (2026-11-26) – draft content for all remaining activities. Matches kiosk v0.8.
 * v0.6 (2026-11-26) – SADAG 'where to get help' box (support field); tel: links. Matches kiosk v0.7.
 * v0.5 (2026-11-26) – approved Flagship 2/3 text with links ([text](url)), quote and Get involved; OAD colours;
 *   CONTENT generated from the kiosk by tools/sync-content.js. Matches kiosk v0.6.
 * v0.4 (2026-11-26) – flagship names (Astro-tourism, Astronomy for Mental Health, Hack4Dev); hack4dev id removed. Matches kiosk v0.5.
 * v0.3 (2026-11-26) – Innovation Hub (was The Hub) and Implementation Centre, matching kiosk v0.4.
 * v0.2 (2026-11-25) – adds a send window (forum dates only), test addresses and a daily cap.
 *
 * Receives {email, ids[], website} from the kiosk, builds the email from its OWN content
 * (the kiosk never sends email text, so this can't be abused to send arbitrary messages),
 * sends one email, and keeps NO email addresses – except visitors who tick the optional newsletter box,
 * whose email is saved to a private Google Sheet (NEWSLETTER_SHEET_ID) for the OAD team. Per-flyer counts are kept too.
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
// ---- Newsletter opt-ins ----
// ID of a PRIVATE Google Sheet owned by the OAD account (the long code in the sheet's URL). Empty = opt-ins are NOT saved.
const NEWSLETTER_SHEET_ID = '';   // [to confirm]
const NEWSLETTER_SOURCE = 'Science Forum South Africa 2026 – OAD kiosk';
const NEWSLETTER_CONSENT = 'Optional: also add me to the IAU OAD newsletter (news and events on astronomy for development). OAD will keep my email for this, and I can unsubscribe at any time.';   // same wording as the kiosk checkbox
const DAILY_CAP = 300;     // max emails per day (SA time), across all addresses

// <CONTENT> – generated from the kiosk's ACTIVITIES by tools/sync-content.js. Do not edit by hand.
const CONTENT = {
  "flagship-1": {
    "title": "Flagship 1 – Astrotourism",
    "tagline": "Dark skies as a resource: astronomy-based tourism that benefits rural communities.",
    "summary": "The OAD’s Astrotourism flagship helps rural communities turn their dark night skies into sustainable livelihoods. It supports local guides, small businesses and communities around observatories with free training, practical guides and a community of practice, so that more people share in the benefits of astronomy-based tourism.",
    "points": [
      "About 8 in 10 people live under light-polluted skies and cannot see the Milky Way, which makes dark skies rare and valuable",
      "A free [online course](https://astrotourism.astro4dev.org/online-course/) for guides, businesses and anyone curious about the night sky",
      "Free [guides and workbooks](https://astro4dev.org/themes/theme-1-sustainable-local-socio-economic-development-through-astronomy/flagship-project-1-resources/) for rural communities, businesses and communities around observatories",
      "OAD-funded astrotourism projects from Colombia and Guatemala to Mongolia, Malaysia and the Caribbean; in 2026 a project in Tanzania launched astrotourism tours"
    ],
    "getInvolved": [
      "Take the free [Astrotourism online course](https://astrotourism.astro4dev.org/online-course/)",
      "Follow the [step-by-step guide](https://astrotourism.astro4dev.org/step-by-step-guide-to-starting-your-own-astrotourism-initiative/) to starting your own astrotourism initiative",
      "Join the [astrotourism community of practice](https://astrotourism.astro4dev.org/community/)",
      "Contact the team: [astrotourism@astro4dev.org](mailto:astrotourism@astro4dev.org)"
    ],
    "link": "https://astrotourism.astro4dev.org/"
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
    "support": {
      "heading": "Need to talk to someone? Free South African helplines from SADAG:",
      "lines": [
        "Suicide Crisis Helpline (24 hours, toll-free): [0800 567 567](tel:0800567567)",
        "Cipla Mental Health Helpline (24 hours, toll-free): [0800 456 789](tel:0800456789), or SMS 31393",
        "WhatsApp chat (8am–5pm): [076 882 2775](https://wa.me/27768822775)",
        "More support: [sadag.org](https://www.sadag.org/)"
      ]
    },
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
    "link": "https://mentalhealth.astro4dev.org/"
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
    "title": "OAD Innovation Hub",
    "tagline": "Turning astronomy know-how into businesses and ventures.",
    "summary": "The OAD Innovation Hub, now in development, will bridge astronomy, technology and entrepreneurship. It will help ideas and skills from astronomy grow into businesses and ventures, and close the gap between academia and industry.",
    "points": [
      "Two tracks: an SME Hub (6 months to 1 year) and a Venture Hub (4 to 6 years)",
      "First phase: a call for pitches and the launch of programmes; then working groups and training from 2027",
      "Builds on 15 years in which the OAD has invested €1.5 million+ in 250+ projects around the world",
      "Formal launch at OAD@15, 15–17 February 2027"
    ],
    "getInvolved": [
      "Read more about the [Innovation Hub](https://astro4dev.org/oad-innovation-hub/)",
      "Interested in collaborating? Email [info@astro4dev.org](mailto:info@astro4dev.org)",
      "Sign up to the [OAD newsletter](https://astro4dev.org/contactus/emaillists/) to hear when the first call for pitches opens"
    ],
    "link": "https://astro4dev.org/oad-innovation-hub/"
  },
  "research-institute": {
    "title": "OAD Research Institute",
    "tagline": "Building the evidence for how astronomy contributes to development. Pre-launching at this Science Forum.",
    "summary": "The OAD Research Institute is envisioned as a distributed global network dedicated to understanding how astronomy contributes to sustainable development. It will generate evidence, share knowledge and build research capacity, drawing on the hundreds of projects the OAD has supported since 2011.",
    "points": [
      "Four focus areas: research and evidence, knowledge infrastructure, research capacity building, and global partnerships",
      "Pre-launch at Science Forum South Africa on 2 December 2026; formal launch in Cape Town, 15–17 February 2027",
      "A [Knowledge Portal](https://script.google.com/macros/s/AKfycbyRICZZdIj0xxcCtNLgTy4__jyiKfmZQA0W0PTzKkpib40U8JxOQkzpaoB3I0o0Z6kUNg/exec) of projects, data, reports, publications and people",
      "A growing network of research affiliates"
    ],
    "getInvolved": [
      "Join the research affiliates network, or share publications, project data and case studies: [research@astro4dev.org](mailto:research@astro4dev.org)",
      "Explore the [Knowledge Portal](https://script.google.com/macros/s/AKfycbyRICZZdIj0xxcCtNLgTy4__jyiKfmZQA0W0PTzKkpib40U8JxOQkzpaoB3I0o0Z6kUNg/exec)",
      "Read OAD [case studies](https://astro4dev.org/case-studies/) and [reports](https://astro4dev.org/reports/)"
    ],
    "link": "https://astro4dev.org/research/"
  },
  "implementation-centre": {
    "title": "OAD Implementation Centre",
    "tagline": "Support, coordination and learning for astronomy-for-development projects.",
    "summary": "The OAD Implementation Centre, now in development, will be a global support, coordination, monitoring, evaluation and learning infrastructure for astronomy-for-development projects and programmes.",
    "points": [
      "Coordinates the OAD Call for Proposals and special calls with other funders",
      "Monitoring, evaluation and learning across projects and programmes",
      "Pre-launch at Science Forum South Africa in December 2026; formal launch at OAD@15 in February 2027"
    ],
    "getInvolved": [
      "Read more about the [Implementation Centre](https://astro4dev.org/oad-implementation-centre/)",
      "Interested in collaborating? Email [info@astro4dev.org](mailto:info@astro4dev.org)",
      "Browse the [projects the OAD has funded](https://astro4dev.org/projects-search/)"
    ],
    "link": "https://astro4dev.org/oad-implementation-centre/"
  },
  "funded-projects": {
    "title": "OAD Funded Projects",
    "tagline": "Seed funding for projects that use astronomy for a better world.",
    "summary": "Through its annual Call for Proposals, the OAD gives seed funding to projects with high potential for positive societal impact using astronomy. The call is open to anyone, anywhere in the world (except where international sanctions prevent payments).",
    "points": [
      "250+ projects funded, €1.5 million+ invested and 2 million+ people reached, across 13 Sustainable Development Goals",
      "Grants have ranged from €1,000 to €15,000, with an average of about €5,000",
      "The call funds projects that use astronomy for societal impact, not astronomy research or activities mainly aimed at promoting astronomy",
      "Example: [Limpopo Astronomy Public Outreach](https://astro4dev.org/limpopo-astronomy-public-outreach-lapo/) in South Africa"
    ],
    "getInvolved": [
      "Browse the [funded projects database](https://astro4dev.org/projects-search/)",
      "Read the [Call for Proposals](https://astro4dev.org/cfp/) guidelines. The 2026 call has closed; watch this page for the next round",
      "Sign up to the [OAD newsletter](https://astro4dev.org/contactus/emaillists/) to hear when the next call opens"
    ],
    "link": "https://astro4dev.org/cfp/"
  },
  "regional-offices": {
    "title": "OAD Regional Offices",
    "tagline": "Astronomy for development, with a regional focus around the world.",
    "summary": "The OAD works through 11 regional offices and language expertise centres around the world. They share the OAD’s objectives with a regional focus, and each one helps select proposals from its region for the OAD Call for Proposals.",
    "points": [
      "In Africa: Southern Africa (Copperbelt University, Zambia), East Africa (Ethiopian Space Science and Technology Institute) and West Africa (Centre for Basic Space Sciences, Nigeria)",
      "Also: the Andean region, the Arab world, East Asia, Europe, North America, Portuguese-speaking countries, South East Asia, and South West and Central Asia",
      "South Africa is served by the Southern Africa office"
    ],
    "getInvolved": [
      "Find your [regional office and its contacts](https://astro4dev.org/regions/)",
      "Sign up to the [OAD newsletter](https://astro4dev.org/contactus/emaillists/)"
    ],
    "link": "https://astro4dev.org/regions/"
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
      htmlBody: buildHtml_(ids, data.newsletter === true),
      body: buildText_(ids, data.newsletter === true)
      // noReply: true,   // Workspace only: send from a no-reply address
    });
    cache.put(key, '1', RESEND_BLOCK_SECONDS);
    countFlyers_(ids);
    if (data.newsletter === true) saveSignup_(email);   // only if the visitor ticked the optional box
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet() {
  return json_({ ok: true, service: 'oad-kiosk-mailer', open: isOpen_(), testing: OPEN_FOR_TESTING, newsletterSheet: !!NEWSLETTER_SHEET_ID, from: ACTIVE_FROM || null, until: ACTIVE_UNTIL || null });
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
const LINK_RE_ = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^)\s]+)\)/g;
function link_(url, text) {
  return url ? '<a href="' + esc_(url) + '" style="' + LS_ + '">' + esc_(text) + '</a>' : esc_(text);
}
/* content text: [text](url) becomes a link in HTML, "text (url)" in plain text */
function md_(s) {
  return esc_(s).replace(LINK_RE_, function (_, t, u) { return '<a href="' + u + '" style="' + LS_ + '">' + t + '</a>'; });
}
function mdText_(s) {
  return String(s).replace(LINK_RE_, function (_, t, u) { if (/^tel:/.test(u)) return t; u = u.replace(/^mailto:/, ''); return t === u ? t : t + ' (' + u + ')'; });
}
function li_(p) { return '<li style="margin:0 0 4px">' + md_(p) + '</li>'; }

function buildHtml_(ids, newsletter) {
  const blocks = ids.map(function (id) {
    const a = CONTENT[id];
    return '<tr><td style="padding:18px 0;border-bottom:1px solid #eadfce">' +
      '<h2 style="margin:0 0 4px;font-size:20px;color:#1e3551">' + esc_(a.title) + '</h2>' +
      '<p style="margin:0 0 10px;color:#af5a4c;font-weight:bold">' + esc_(a.tagline) + '</p>' +
      '<p style="margin:0 0 10px">' + md_(a.summary) + '</p>' +
      '<ul style="margin:0 0 10px;padding-left:20px">' + (a.points || []).map(li_).join('') + '</ul>' +
      (a.quote ? '<p style="margin:0 0 10px;padding:8px 12px;border-left:4px solid #f9c434;background:#faf6ef;font-style:italic">“' +
        esc_(a.quote.text) + '”<br><span style="font-style:normal;font-size:13px;color:#666">— ' + esc_(a.quote.cite) + '</span></p>' : '') +
      (a.support ? '<div style="margin:0 0 12px;padding:10px 14px;border:2px solid #72896b;border-radius:8px;background:#f1f4ef"><p style="margin:0 0 4px;font-weight:bold;color:#1e3551">' +
        esc_(a.support.heading) + '</p><ul style="margin:0;padding-left:20px">' + a.support.lines.map(li_).join('') + '</ul></div>' : '') +
      (a.getInvolved ? '<p style="margin:0 0 4px;font-weight:bold;color:#1e3551">Get involved</p><ul style="margin:0 0 10px;padding-left:20px">' +
        a.getInvolved.map(li_).join('') + '</ul>' : '') +
      '<p style="margin:0">' + link_(a.link || SITE_URL, 'Read more →') + '</p></td></tr>';
  }).join('');
  const stay = newsletter
    ? '<p style="margin:0 0 8px;font-size:16px"><strong>Stay in touch:</strong> you’re joining our newsletter' +
      (DISCORD_URL ? ', and you can also ' + link_(DISCORD_URL, 'join our Discord') : '') + '.</p>'
    : (MAILING_LIST_URL || DISCORD_URL)
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
    (newsletter ? OPTIN_FOOT_ : ONEOFF_FOOT_) +
    (PRIVACY_URL ? ' ' + link_(PRIVACY_URL, 'Privacy notice') : '') +
    '</td></tr></table></td></tr></table></body></html>';
}

function buildText_(ids, newsletter) {
  const parts = ['Thanks for visiting the OAD at the Science Forum. Here are the flyers you chose.', ''];
  ids.forEach(function (id) {
    const a = CONTENT[id];
    parts.push(a.title.toUpperCase(), a.tagline, '', mdText_(a.summary), '');
    (a.points || []).forEach(function (p) { parts.push('- ' + mdText_(p)); });
    if (a.quote) parts.push('', '"' + a.quote.text + '" (' + a.quote.cite + ')');
    if (a.support) { parts.push('', a.support.heading); a.support.lines.forEach(function (p) { parts.push('- ' + mdText_(p)); }); }
    if (a.getInvolved) { parts.push('', 'Get involved:'); a.getInvolved.forEach(function (p) { parts.push('- ' + mdText_(p)); }); }
    parts.push('', 'Read more: ' + (a.link || SITE_URL), '', '----', '');
  });
  parts.push('Find out more: ' + SITE_URL);
  if (MAILING_LIST_URL && !newsletter) parts.push('Join our mailing list: ' + MAILING_LIST_URL);
  if (DISCORD_URL) parts.push('Join our Discord: ' + DISCORD_URL);
  parts.push('', newsletter ? OPTIN_FOOT_ : ONEOFF_FOOT_);
  return parts.join('\n');
}

const ONEOFF_FOOT_ = 'You received this one-off email because you asked for it at our stand. We have not added you to any mailing list.';
const OPTIN_FOOT_ = 'You received this email because you asked for it at our stand. You also asked to join the IAU OAD newsletter, so the OAD team will add you. You can unsubscribe at any time.';

/* Newsletter opt-in: append to the private sheet (no duplicates). Columns: timestamp, email, source, consent wording. */
function saveSignup_(email) {
  if (!NEWSLETTER_SHEET_ID) { console.warn('Newsletter opt-in not saved: NEWSLETTER_SHEET_ID is empty'); return false; }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return false;
  try {
    const ss = SpreadsheetApp.openById(NEWSLETTER_SHEET_ID);
    const sh = ss.getSheetByName('Signups') || ss.insertSheet('Signups');
    if (sh.getLastRow() === 0) sh.appendRow(['Timestamp (SA time)', 'Email', 'Source', 'Consent wording']);
    const safe = /^[=+\-@]/.test(email) ? "'" + email : email;   // stop spreadsheet formula injection
    const dup = sh.getRange('B:B').createTextFinder(safe).matchEntireCell(true).findNext();
    if (!dup) sh.appendRow([Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm'), safe, NEWSLETTER_SOURCE, NEWSLETTER_CONSENT]);
    const props = PropertiesService.getScriptProperties();
    props.setProperty('count__newsletter', String(Number(props.getProperty('count__newsletter') || 0) + 1));
    return true;
  } catch (err) { console.error('saveSignup_ failed', err); return false; }
  finally { lock.releaseLock(); }
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
