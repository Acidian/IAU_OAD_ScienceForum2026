# OAD Science Forum kiosk – MVP v0.1 (2026-11-25)

A touch-tablet kiosk that replaces printed flyers. Visitors spin an orbit of OAD activities, open short flyers, add them to "My flyers", and email the set to themselves. Joining the mailing list and Discord happens through separate QR codes and links. The kiosk never subscribes anyone.

## Files
- `ScienceForumKiosk_v0.1_2026-11-25.html`: the whole kiosk in one file. Works offline.
- `kiosk-mailer_v0.1_2026-11-25.gs`: Google Apps Script that sends the emails.
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
Copy any text changes into `CONTENT` in the `.gs` file too. The script builds the real email from its own copy, for security.
**All activity text is placeholder until approved.**

## Turn on real email
1. Get OK from the OAD Workspace admin to run the script on an OAD account [to confirm].
2. Signed in to that account, go to script.google.com, create a New project, and paste in the `.gs` file.
3. Fill in `MAILING_LIST_URL` and `DISCORD_URL` (and optionally `PRIVACY_URL`).
4. Choose Deploy > New deployment > Web app. Set Execute as: **Me**, and Who has access: **Anyone**. Authorise it.
5. Copy the web app URL into `CONFIG.MAILER_URL` in the HTML.
6. Test with your own address. Check Gmail and Outlook, including the spam folder.

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
