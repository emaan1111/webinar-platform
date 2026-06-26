
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// "You're In!" thank you page (Emaan Power Masterclass).
// Dynamic placeholders resolved at render time by src/app/thank-you/[slug]/page.tsx:
//   {{referralLink}} -> attendee's personal referral share link
// Run with: npx tsx src/scripts/seed-emaan-thank-you-youre-in.ts
const htmlCode = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You're In! — Emaan Power Masterclass</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Fraunces:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{font-family:'Mulish',sans-serif;background:#ffffff;color:#2b2335;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  @keyframes sealpop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
</style>

</head>
<body>
<div style="font-family:'Mulish',sans-serif;background:#ffffff;color:#2b2335;line-height:1.6;overflow-x:hidden;">

  <div style="background:#4B006E;color:#e7d9fb;text-align:center;font-size:0.8rem;letter-spacing:0.13em;text-transform:uppercase;padding:11px 16px;font-weight:600;border-bottom:1px solid rgba(125,31,176,0.3);">Your Seat Is Reserved&nbsp;&nbsp;·&nbsp;&nbsp;<b style="color:#fff;font-weight:700;">See You at the Masterclass</b></div>

  <header style="position:relative;background:radial-gradient(ellipse 120% 70% at 50% 0%, #f7efe2 0%, #ffffff 62%);padding:52px 0 56px;overflow:hidden;">
    <div style="max-width:680px;margin:0 auto;padding:0 22px;text-align:center;display:flex;flex-direction:column;align-items:center;">

      <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(160deg,#5e0a86,#4B006E);display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -16px rgba(54,0,79,0.5);border:3px solid #e0bb63;animation:sealpop .6s ease-out both;margin-bottom:24px;">
        <svg viewBox="0 0 48 48" style="width:46px;height:46px;"><path d="M13 25 L21 33 L35 15" fill="none" stroke="#e0bb63" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      </div>

      <div style="display:inline-flex;align-items:center;gap:10px;color:#7d1fb0;font-size:0.72rem;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;margin-bottom:14px;">
        <span style="width:28px;height:1px;background:#b98fe2;"></span> Registration Confirmed <span style="width:28px;height:1px;background:#b98fe2;"></span>
      </div>

      <h1 style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(2.4rem,7vw,3.6rem);line-height:1.04;letter-spacing:-0.01em;color:#4B006E;margin-bottom:16px;">You're In!</h1>

      <p style="font-family:'Cormorant Garamond',serif;font-size:clamp(1.18rem,3vw,1.46rem);color:#574f63;line-height:1.45;max-width:540px;margin-bottom:26px;">
        Your seat for the free masterclass is reserved, bi'idhnillah. We can't wait to see you there.
      </p>

      <div style="display:flex;align-items:flex-start;gap:14px;text-align:left;width:100%;max-width:480px;background:#fdf8ec;border:1px solid rgba(194,146,46,0.4);border-radius:14px;padding:18px 20px;">
        <svg viewBox="0 0 24 24" style="width:24px;height:24px;flex-shrink:0;margin-top:2px;fill:none;stroke:#c2922e;stroke-width:2;"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>
        <p style="font-size:0.98rem;color:#3a2f44;line-height:1.5;margin:0;">
          <b style="color:#4B006E;">Now check your email.</b> Your private access link and joining details are on the way. If you don't see it in a few minutes, look in your <b>spam or promotions</b> folder — and add us to your contacts so you never miss a reminder.
        </p>
      </div>
    </div>
  </header>

  <section style="padding:66px 0;background:#faf6ee;">
    <div style="max-width:720px;margin:0 auto;padding:0 22px;text-align:center;">
      <div style="color:#7d1fb0;font-size:0.72rem;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;margin-bottom:14px;">Multiply Your Reward</div>
      <h2 style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(1.6rem,3.8vw,2.4rem);line-height:1.16;color:#4B006E;margin-bottom:14px;">Know a mother who needs this? <em style="font-style:italic;color:#7d1fb0;">Invite her.</em></h2>

      <p style="font-size:1.05rem;color:#2b2335;max-width:560px;margin:0 auto 22px;">
        When you guide another mother to something good, her every step forward becomes <strong style="color:#a87a1e;font-weight:600;">a reward that flows back to you</strong> — long after the masterclass ends. Send this to the mothers you love.
      </p>

      <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(1.22rem,3vw,1.5rem);color:#4B006E;line-height:1.35;max-width:560px;margin:0 auto 12px;">
        “Whoever guides someone to goodness will have a reward like the one who does it.”
      </p>
      <p style="font-size:0.8rem;letter-spacing:0.14em;text-transform:uppercase;color:#a87a1e;font-weight:700;margin-bottom:30px;">— Prophet Muhammad ﷺ · Sahih Muslim</p>

      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
        <button type="button" onclick="shareWhatsApp()" style="display:inline-flex;align-items:center;gap:9px;background:linear-gradient(180deg,#7c3aed,#4B006E);color:#fff;font-family:'Mulish',sans-serif;font-weight:700;font-size:0.96rem;padding:14px 24px;border-radius:100px;border:none;cursor:pointer;box-shadow:0 12px 26px -12px rgba(75,0,110,0.6);">
          <svg viewBox="0 0 24 24" style="width:17px;height:17px;fill:#fff;"><path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.3A8 8 0 1 1 20 11.5z" fill="none" stroke="#fff" stroke-width="1.8"></path><path d="M8.5 9c.2 2.5 2 4.3 4.5 4.5.5 0 1.2-.2 1.4-.8.1-.3 0-.6-.3-.8l-1-.5c-.3-.1-.5 0-.7.2l-.3.4c-.8-.3-1.5-1-1.8-1.8l.4-.3c.2-.2.3-.5.2-.7l-.5-1c-.2-.4-.6-.5-.9-.3-.4.2-.7.8-.7 1.4z" fill="#fff"></path></svg>
          Share on WhatsApp
        </button>
        <button type="button" onclick="copyLink(this)" style="display:inline-flex;align-items:center;gap:9px;background:#ffffff;color:#4B006E;font-family:'Mulish',sans-serif;font-weight:700;font-size:0.96rem;padding:14px 24px;border-radius:100px;border:1.5px solid rgba(75,0,110,0.3);cursor:pointer;">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:#4B006E;stroke-width:2;"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>
          <span id="copy-label">Copy link</span>
        </button>
        <button type="button" onclick="shareFacebook()" style="display:inline-flex;align-items:center;gap:9px;background:#ffffff;color:#4B006E;font-family:'Mulish',sans-serif;font-weight:700;font-size:0.96rem;padding:14px 24px;border-radius:100px;border:1.5px solid rgba(75,0,110,0.3);cursor:pointer;">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#4B006E;"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9z"></path></svg>
          Facebook
        </button>
        <button type="button" onclick="shareEmail()" style="display:inline-flex;align-items:center;gap:9px;background:#ffffff;color:#4B006E;font-family:'Mulish',sans-serif;font-weight:700;font-size:0.96rem;padding:14px 24px;border-radius:100px;border:1.5px solid rgba(75,0,110,0.3);cursor:pointer;">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:#4B006E;stroke-width:2;"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>
          Email
        </button>
      </div>
    </div>
  </section>

  <section style="padding:66px 0;background:#ffffff;">
    <div style="max-width:760px;margin:0 auto;padding:0 22px;text-align:center;">
      <div style="color:#7d1fb0;font-size:0.72rem;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;margin-bottom:14px;">While You Wait</div>
      <h2 style="font-family:'Fraunces',serif;font-weight:500;font-size:clamp(1.6rem,3.8vw,2.4rem);line-height:1.16;color:#4B006E;margin-bottom:22px;">A short message before we begin</h2>

      <div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;border:1px solid rgba(75,0,110,0.18);box-shadow:0 26px 56px -26px rgba(54,0,79,0.45);background:#1a0526;">
        <video controls playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;display:block;background:#1a0526;" src="https://player.vimeo.com/progressive_redirect/playback/1114587642/rendition/1080p/file.mp4%20%281080p%29.mp4?loc=external&amp;signature=bf99e9948261ecc23fefc4c29f1c0aad9cb4a90e26e092d1e1495e4dfbf6f961">
          Your browser does not support the video tag.
        </video>
      </div>

      <div style="display:flex;align-items:center;gap:16px;text-align:left;max-width:520px;margin:24px auto 0;background:#fdf8ec;border:1px solid rgba(194,146,46,0.4);border-radius:14px;padding:16px 20px;">
        <img src="https://emaanpowerclasses.com/api/images/serve/1780641966624-2wb6y1zf4bggy4c1crp5gq.jpg" alt="Mothers Who Raise Great Men — free book" style="flex-shrink:0;width:54px;height:74px;border-radius:3px 6px 6px 3px;object-fit:cover;background:#4B006E;box-shadow:-3px 0 0 0 rgba(194,146,46,0.5);">
        <div>
          <div style="font-size:0.64rem;letter-spacing:0.16em;text-transform:uppercase;color:#a87a1e;font-weight:700;margin-bottom:4px;">Free Gift for Attendees</div>
          <p style="font-size:0.96rem;color:#3a2f44;line-height:1.45;margin:0;">Your free copy of <b style="color:#4B006E;">“Mothers Who Raise Great Men”</b> is reserved for those who attend live. Show up, and it's yours.</p>
        </div>
      </div>
    </div>
  </section>

  <footer style="background:#4B006E;color:rgba(243,236,252,0.6);text-align:center;padding:40px 22px;font-size:0.84rem;">
    <div style="font-family:'Fraunces',serif;font-size:1.3rem;color:#cda8ec;margin-bottom:10px;">Emaan<span style="color:#fff;">Power</span></div>
    <p style="max-width:540px;margin:0 auto 8px;line-height:1.5;">Helping mothers raise a generation of unshakeable Muslims.</p>
    <p style="font-size:0.72rem;opacity:0.6;margin-top:12px;max-width:560px;margin-left:auto;margin-right:auto;">© Emaan Power. All rights reserved. The hearts of our children are ultimately in the hands of Allah. We simply strive, and leave the rest to Him.</p>
  </footer>

</div>
<script>
  var SHARE_URL = '{{referralLink}}';
  var SHARE_TEXT = "I just registered for this free masterclass for Muslim mothers \u2014 'Raise a Muslim Who Loves Allah.' I thought of you. Save your seat here:";
  function shareWhatsApp(){ window.open('https://wa.me/?text=' + encodeURIComponent(SHARE_TEXT + ' ' + SHARE_URL), '_blank'); }
  function shareFacebook(){ window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SHARE_URL), '_blank'); }
  function shareEmail(){ window.location.href = 'mailto:?subject=' + encodeURIComponent('A free masterclass I thought of you for') + '&body=' + encodeURIComponent(SHARE_TEXT + ' ' + SHARE_URL); }
  function copyLink(btn){
    var label = document.getElementById('copy-label');
    function done(){ if(label){ var prev='Copy link'; label.textContent='Link copied!'; setTimeout(function(){ label.textContent=prev; },2200);} }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(SHARE_URL).then(done).catch(done); }
    else { var t=document.createElement('textarea'); t.value=SHARE_URL; document.body.appendChild(t); t.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(t); done(); }
  }
</script>

</body></html>`;

async function main() {
  const templateName = "Emaan Power Thank You \u2014 You're In";
  console.log('Seeding template:', templateName);

  const template = await prisma.thankYouTemplate.upsert({
    where: { name: templateName },
    update: {
      htmlCode: htmlCode,
      description: "Emaan Power 'You're In!' thank you — referral sharing + welcome video",
    },
    create: {
      name: templateName,
      htmlCode: htmlCode,
      description: "Emaan Power 'You're In!' thank you — referral sharing + welcome video",
      isSystem: false,
    },
  });

  console.log('Template ready with ID:', template.id);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
