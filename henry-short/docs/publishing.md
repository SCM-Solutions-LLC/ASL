# Publishing

A short goes out as an upload **you approve**, never as an automatic public post. A wrong number
or a clipped label is cheap to fix before it is public and expensive after.

## The loop

1. **Build the kit** — `npm run kit -- <slug>` runs the lint and licence checks, renders the 9:16
   MP4, probes the file, and writes `out/<slug>/post.md` with the text for each platform. It refuses
   a short that is still drafted, a caption over a platform's limit, or a post with no sources.
2. **Review** — watch `out/<slug>/<slug>_9x16.mp4` and read `post.md`. The post text lives in
   `publish/<slug>.json`, so it is reviewed in the same pull request as the short.
3. **Upload** — in a Claude Code session with the connectors below, say "post `<slug>`". Each
   platform gets the same file and its own text:

| Platform | Through | Lands as | You then |
|---|---|---|---|
| TikTok | Higgsfield connector, `UPLOAD_TO_DRAFT` | a draft in your TikTok app | add a sound if wanted, tap Post |
| YouTube Shorts | Zapier → YouTube "Upload Video" | a **private** video | set it Public or schedule it in Studio |
| Instagram Reels | Zapier → Instagram for Business | **published immediately** | nothing — so this one is sent last, only after you say go |

Instagram's API has no draft state. That is why it is the last step and needs an explicit yes in
the session, after the other two have been looked at on a phone.

## One-time setup

None of the accounts exist yet. In this order:

1. Create the TikTok account, the YouTube channel and the Instagram account under one channel name.
2. Switch Instagram to a **Business or Creator** account and link it to a Facebook Page. The API
   cannot post to a personal account at all.
3. Connect TikTok: ask Claude to "connect TikTok" (Higgsfield returns a link; approve on TikTok).
4. Connect YouTube and Instagram for Business in Zapier (zapier.com → Apps), then ask Claude to
   enable the upload actions.

Until step 3–4 are done, the kit is still the whole of the manual path: upload the MP4 and paste
from `post.md`.

## Rules that are easy to get wrong

- **AI disclosure.** The voice is synthetic (Kokoro). Turn on TikTok's "AI-generated content" label;
  it is your declaration to make in the publish form, not something the tool sets for you.
  YouTube's altered-content disclosure is for realistic footage and does not cover drawn animation.
- **Under three minutes** is a Short on all three platforms. The kit refuses anything longer.
- **Stagger, do not blast.** Post one platform, read the first hour's comments for a factual
  challenge, then post the others. A correction is one re-render before the other two go out.
- **Music.** The MP4 ships with voice and SFX only, both licensed here. A trending sound is added
  in the TikTok app at the draft step, under TikTok's licence, and never baked into the file —
  the same file goes to YouTube and Instagram, where that licence does not apply.
