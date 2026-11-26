# OAD Science Forum kiosk – MVP v0.2 (2026-11-25)

A touch-tablet kiosk that replaces printed flyers. Visitors spin an orbit of OAD activities, open short flyers, add them to "My flyers", and email the set to themselves. Joining the mailing list and Discord happens through separate QR codes and links. The kiosk never subscribes anyone.

## Files
- `ScienceForumKiosk_v0.2_2026-11-25.html`: the whole kiosk in one file. Works offline.
- `kiosk-mailer_v0.2_2026-11-25.gs`: Google Apps Script that sends the emails.
- `mockups/`: concept images.

## Try it
Open the HTML file in Chrome or Edge. With `CONFIG.MAILER_URL` empty, the kiosk runs in **demo mode**: no email is sent, and a preview of the email appears instead.

Controls:
- **Drag or swipe** left/right to spin the orbit. A quick flick keeps it coasting, then it stops on a planet.
- **Tap any planet**: it turns to the front and its flyer opens.
- **‹ ›** buttons or the keyboard arrow keys turn the orbit one step.
- After 20 s idle, the orbit spins slowly by itself to attract visitors.
- After 90 s idle with a screen open, the kiosk clears everything and returns to the start.

## Edit content
In the HTML, edit `ACTIVITIES` (and `CONFIG` for links). Any number of activities works; the orbit spaces them evenly.
The script builds the real email from its own copy of the content, for security. Since kiosk v0.6, copy the content across automatically instead of by hand:
`node tools/sync-content.js ScienceForumKiosk_v0.6_2026-11-26.html kiosk-mailer_v0.5_2026-11-26.gs`

Links in the text: write `[text](https://…)` or `[text](mailto:…)`. They are clickable in the email. On the kiosk they show as text when `CONFIG.KIOSK_MODE` is `true` (tablet), and are clickable when it is `false` (public web page).
**Flagships 2 and 3 have approved text. All other activity text is placeholder until approved.**

## Turn on real email
1. Get OK from the OAD Workspace admin to run the script on an OAD account [to confirm].
2. Signed in to that account, go to script.google.com, create a New project, and paste in the `.gs` file.
3. Fill in `MAILING_LIST_URL` and `DISCORD_URL` (and optionally `PRIVACY_URL`).
4. While testing, leave `OPEN_FOR_TESTING = true`: emails send at any time. **Before the forum**, set it to `false` and set the send window to the forum dates in SA time, e.g. `ACTIVE_FROM = '2026-12-01 08:00'` and `ACTIVE_UNTIL = '2026-12-03 18:00'`. With testing off and the dates empty, nothing is sent.
5. Add your own address to `TEST_EMAILS` so you can test before the forum. `DAILY_CAP` (default 300) limits the emails sent each day.
5b. **Newsletter opt-ins** (from kiosk v0.10 and script v0.9): create a new Google Sheet in the OAD account and keep it private. Copy the long ID from its URL (`docs.google.com/spreadsheets/d/<ID>/edit`) into `NEWSLETTER_SHEET_ID`. When visitors tick the optional newsletter box, the script adds a row to a "Signups" tab: time, email, source and the consent wording. Duplicates are skipped. If `NEWSLETTER_SHEET_ID` is empty, opt-ins are not saved, but the flyer email is still sent. Someone in OAD comms should add these addresses to the newsletter, then delete the rows, so personal data isn't kept longer than needed [owner to confirm].
6. Choose Deploy > New deployment > Web app. Set Execute as: **Me**, and Who has access: **Anyone**. Authorise it.
7. Copy the web app URL into `CONFIG.MAILER_URL` in the tablet's copy of the HTML only. Never put it on GitHub.
8. Test with your own address. Check Gmail and Outlook, including the spam folder. Opening the web app URL shows `"open": true` or `false`, so you can check whether the window is currently open.
9. After the forum, the window closes by itself. To switch the script off completely, also go to Deploy > Manage deployments and choose **Archive**.

Outside the window, or once the daily cap is reached, the kiosk says "Email isn't available right now" and points visitors to astro4dev.org. If any sends are still saved offline after the window closes, they are dropped.

To change the dates after deploying, edit them, then choose Deploy > Manage deployments > Edit (pencil) > Version: **New version**. This keeps the same URL.

What the script stores: no email addresses. It keeps a 10-minute "recently sent" marker (a hash of the address) and per-flyer counts. To see the counts, run `logCounts()` in the editor.

If the kiosk is offline, sends are saved on the tablet and go out when the connection returns ("⏳ n waiting" appears in the header). Each saved address is deleted once sent.

## Tablet setup
- Android: open the file in Chrome, Add to Home screen, then use Screen pinning.
- iPad: open it in Safari, then use Guided Access.
- Turn off auto-lock where you can. The page also requests a screen wake lock.

## Not in the MVP yet
- Real QR codes: the QR boxes are placeholders until the links are confirmed.
- Approved texts and images.
- Hidden staff/settings panel.
- Privacy notice link.
- Testing on the actual tablet.
