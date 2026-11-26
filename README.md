# IAU OAD – Science Forum 2026 kiosk

A touch-screen kiosk that replaces printed flyers for the IAU Office of Astronomy for Development (OAD). Visitors spin an orbit of OAD activities and open short flyers. They can email their chosen flyers to themselves, opt in to the OAD newsletter, or scan QR codes to open pages, join the mailing list or join Discord.

**Live page:** https://acidian.github.io/IAU_OAD_ScienceForum2026/

Status: v0.10 (2026-11-26), team review build. Email runs in demo mode (a preview, nothing is sent). Flagships 2 and 3 have approved text. The other flyers are drafts from astro4dev.org.

- Kiosk: `ScienceForumKiosk_v0.10_2026-11-26.html` (one self-contained file that works offline)
- Email script (Google Apps Script): `kiosk-mailer_v0.9_2026-11-26.gs`
- Keep content in sync: `node tools/sync-content.js <kiosk.html> <mailer.gs>`
- Setup, editing and email details: [README_v0.2_2026-11-25.md](README_v0.2_2026-11-25.md)

Logo: official OAD logo symbol from the OAD Corporate Identity 2021 manual. Font: Barlow (SIL Open Font License). QR codes: qrcode-generator by Kazuhiko Arase (MIT).
