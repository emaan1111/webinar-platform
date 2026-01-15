
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templateName = "Legacy: Thank You";
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Registered - {{webinar.title}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* =========================================
           CORE VARIABLES & RESET
           ========================================= */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --plum: #3D1F33;
            --plum-deep: #2A1523;
            --gold: #C4A44E;
            --gold-hover: #D9BC6A;
            --cream: #FAF7F2;
            --white: #FFFFFF;
            --text: #1A1A1A;
            --text-light: rgba(255,255,255,0.8);
            --radius: 8px;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--cream);
            color: var(--text);
            font-size: 16px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }

        /* =========================================
           HERO SECTION (Mobile First)
           ========================================= */
        .hero {
            padding: 60px 20px 80px; /* Extra bottom padding for button */
            background: var(--plum-deep);
            text-align: center;
            position: relative;
            min-height: auto; /* Let content determine height */
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Top Accent Line */
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--gold) 0%, #F3D690 50%, var(--gold) 100%);
        }

        .check-icon {
            width: 72px;
            height: 72px;
            background: rgba(196, 164, 78, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            border: 2px solid var(--gold);
        }

        .check-icon svg {
            width: 36px;
            height: 36px;
            fill: var(--gold);
        }

        .hero h1 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: var(--white);
            line-height: 1.2;
            margin-bottom: 16px;
        }

        .hero p {
            font-size: 17px;
            color: var(--text-light);
            max-width: 500px;
            margin-bottom: 32px;
        }

        /* Date/Time Card */
        .webinar-details {
            width: 100%;
            max-width: 400px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--gold);
            padding: 24px;
            border-radius: var(--radius);
            backdrop-filter: blur(5px);
            margin-bottom: 24px;
        }

        .webinar-date {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 700;
            color: var(--gold);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .webinar-time {
            font-family: 'Inter', sans-serif;
            font-size: 16px;
            color: var(--white);
            font-weight: 500;
        }

        /* PRIMARY CTA BUTTON */
        .btn-join-hero {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: 100%; /* Mobile Full Width */
            max-width: 320px;
            background: var(--gold);
            color: var(--plum-deep);
            padding: 18px 24px;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-decoration: none;
            border-radius: var(--radius);
            box-shadow: 0 6px 20px rgba(196, 164, 78, 0.4); /* Gold glow */
            transition: transform 0.2s ease, background 0.2s;
            border: none;
            cursor: pointer;
        }

        .btn-join-hero:hover {
            background: var(--gold-hover);
            transform: translateY(-2px);
        }

        .btn-join-hero:active {
            transform: scale(0.98);
        }

        /* =========================================
           MAIN CONTENT (Mobile First)
           ========================================= */
        .main-content {
            width: 100%;
            margin-top: -40px; /* Overlap hero slightly */
            padding: 0 20px 60px;
            position: relative;
            z-index: 2;
        }

        /* Step Cards */
        .step-card {
            background: var(--white);
            padding: 32px 24px;
            margin-bottom: 20px;
            border-radius: var(--radius);
            box-shadow: 0 4px 20px rgba(26, 26, 26, 0.08);
            border-top: 4px solid transparent;
        }

        .step-header {
            display: flex;
            align-items: baseline;
            margin-bottom: 20px;
            gap: 12px;
        }

        .step-number {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: rgba(61, 31, 51, 0.1);
            line-height: 1;
        }

        .step-title {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 600;
            color: var(--plum);
        }

        /* Specific Accents */
        .step-card.email-card { border-top-color: var(--gold); }
        .step-card.calendar-card { border-top-color: var(--gold); }
        .step-card.share-card { border-top-color: var(--plum); }

        /* Email Content */
        .email-content p {
            font-size: 16px;
            color: #555;
            margin-bottom: 12px;
        }

        .backup-link-container {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed #ddd;
            font-size: 14px;
            color: #666;
        }

        .backup-link {
            color: var(--plum);
            font-weight: 600;
            text-decoration: underline;
        }

        /* Calendar Buttons */
        .calendar-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 24px;
        }

        .btn-calendar {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            border: 2px solid var(--plum);
            color: var(--plum);
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s ease;
            border-radius: var(--radius);
            width: 100%; 
            background: transparent;
        }

        .btn-calendar:active {
            transform: scale(0.98);
            background: rgba(61, 31, 51, 0.05);
        }

        .btn-calendar svg {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            fill: currentColor;
        }

        /* Share Section */
        .hadith-box {
            background: var(--cream);
            padding: 24px;
            border-left: 4px solid var(--gold);
            margin-bottom: 24px;
            border-radius: 0 var(--radius) var(--radius) 0;
        }

        .hadith-text {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            font-size: 18px;
            color: var(--plum);
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .hadith-reference {
            font-size: 13px;
            color: #777;
            font-weight: 500;
        }

        .share-intro {
            font-size: 15px;
            color: #555;
            margin-bottom: 20px;
        }

        .share-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 20px 0 16px;
        }

        .btn-share {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 14px 16px;
            border-radius: var(--radius);
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: var(--white);
            transition: transform 0.2s ease, filter 0.2s ease;
        }

        .btn-share:active {
            transform: scale(0.98);
        }

        .btn-share svg {
            width: 18px;
            height: 18px;
            margin-right: 10px;
            fill: currentColor;
        }

        .btn-whatsapp { background: #25D366; }
        .btn-facebook { background: #1877F2; }

        /* Copy Button */
        .btn-copy {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background: var(--plum);
            color: var(--white);
            padding: 16px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: var(--radius);
        }

        .btn-copy:active {
            transform: scale(0.98);
            background: var(--plum-deep);
        }

        .btn-copy svg {
            width: 18px;
            height: 18px;
            margin-right: 10px;
            fill: currentColor;
        }

        #copy-feedback {
            display: none;
            text-align: center;
            margin-top: 12px;
            font-size: 14px;
            color: var(--plum);
            font-weight: 600;
            animation: fadeIn 0.3s ease;
        }

        /* =========================================
           FOOTER
           ========================================= */
        footer {
            padding: 40px 20px;
            background: var(--white);
            text-align: center;
            border-top: 1px solid #eee;
        }

        footer p {
            font-size: 11px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        /* =========================================
           DESKTOP OVERRIDES (Min Width 768px)
           ========================================= */
        @media (min-width: 768px) {
            .hero {
                padding: 100px 20px 120px;
            }

            .hero h1 {
                font-size: 48px;
            }

            .main-content {
                max-width: 700px;
                margin: -60px auto 0;
            }

            .step-card {
                padding: 48px;
                margin-bottom: 24px;
            }

            .step-number {
                font-size: 64px;
            }

            .step-title {
                font-size: 28px;
            }

            .calendar-buttons {
                flex-direction: row;
            }

            .btn-calendar {
                width: auto;
                flex: 1;
            }

            .btn-join-hero {
                width: auto;
                min-width: 280px;
            }
            
            .copy-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            #copy-feedback {
                margin-left: 0;
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <!-- Hero Section -->
    <section class="hero">
        <div class="check-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
        </div>

        <h1>You're In!</h1>
        <p>Your spot is reserved. Get ready to discover how to {{webinar.title}}.</p>

        <!-- Date & Time Display -->
        <div class="webinar-details">
            <!-- EDIT DATE & TIME HERE -->
            <div class="webinar-date">{{schedule.date}}</div>
            <div class="webinar-time">{{schedule.time}}</div>
        </div>

        <!-- PRIMARY WEBINAR LINK (Hero) -->
        <!-- REPLACE # BELOW WITH YOUR ZOOM/WEBINAR LINK -->
        <a href="{{joinLink}}" class="btn-join-hero">
            Go To Webinar Room
        </a>
    </section>

    <!-- Main Content Steps -->
    <div class="main-content">

        <!-- Step 1: Email -->
        <div class="step-card email-card">
            <div class="step-header">
                <span class="step-number">01</span>
                <h2 class="step-title">Check Your Email</h2>
            </div>
            <div class="email-content">
                <p>We've sent a confirmation email with all the webinar details. Please check your inbox (and <strong>spam folder</strong>).</p>
                
                <!-- BACKUP LINK -->
                <div class="backup-link-container">
                    Can't find the email? <br>
                    <a href="{{joinLink}}" class="backup-link">Click here to access the webinar room directly</a>.
                </div>
            </div>
        </div>

        <!-- Step 2: Calendar -->
        <div class="step-card calendar-card">
            <div class="step-header">
                <span class="step-number">02</span>
                <h2 class="step-title">Mark Your Calendar</h2>
            </div>
            <p style="margin-bottom: 16px; color: #555;">Don't rely on memory. Add this to your calendar.</p>
            
            <div class="calendar-buttons">
                <!-- Google Calendar -->
                <a href="{{googleCalendarLink}}" target="_blank" class="btn-calendar">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                    Add to Google
                </a>

                <!-- Apple/Download -->
                <a href="{{icsDownload}}" class="btn-calendar">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 17H5V8h14v12z"/></svg>
                    Download .ics
                </a>
            </div>
        </div>

        <!-- Step 3: Share -->
        <div class="step-card share-card">
            <div class="step-header">
                <span class="step-number">03</span>
                <h2 class="step-title">Share & Earn Rewards</h2>
            </div>
            
            <p class="share-intro">Be a light for others! Invite your friends to this free Masterclass so they can also raise strong, confident Muslims.</p>

            <div class="hadith-box">
                <p class="hadith-text">"Whoever guides someone to goodness will have a reward like the one who did it."</p>
                <p class="hadith-reference">— Prophet Muhammad ﷺ</p>
            </div>

            <div class="share-buttons">
                <a id="whatsapp-share" class="btn-share btn-whatsapp" href="{{whatsappReferralLink}}" target="_blank" rel="noopener">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.52 3.48A11.83 11.83 0 0 0 12.06 0C5.46 0 .12 5.33.12 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.33-1.66a11.86 11.86 0 0 0 5.73 1.47h.01c6.6 0 11.94-5.33 11.94-11.9 0-3.18-1.24-6.17-3.49-8.43ZM12.06 21.3h-.01a9.5 9.5 0 0 1-4.84-1.32l-.35-.2-3.76.99 1-3.66-.23-.37a9.43 9.43 0 0 1-1.46-5.02c0-5.24 4.28-9.51 9.54-9.51 2.55 0 4.94 1 6.74 2.8a9.44 9.44 0 0 1 2.79 6.72c0 5.24-4.27 9.57-9.42 9.57Zm5.23-7.08c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.18.28-.71.9-.87 1.09-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.37-1.64-1.53-1.92-.16-.28-.02-.43.12-.57.12-.12.28-.32.41-.48.14-.16.18-.28.28-.46.1-.18.05-.35-.02-.48-.07-.14-.62-1.5-.85-2.06-.23-.55-.46-.48-.62-.49h-.53c-.18 0-.48.07-.73.35-.25.28-.96.93-.96 2.27s.99 2.64 1.13 2.82c.14.18 1.94 2.96 4.7 4.14.66.28 1.17.45 1.57.58.66.21 1.27.18 1.74.11.53-.08 1.64-.67 1.87-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.18-.53-.32Z"/>
                    </svg>
                    Share on WhatsApp
                </a>
                <a id="facebook-share" class="btn-share btn-facebook" href="#" target="_blank" rel="noopener">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.68 0H1.32C.59 0 0 .59 0 1.32v21.36C0 23.41.59 24 1.32 24h11.5v-9.29H9.69V11.1h3.13V8.41c0-3.1 1.9-4.79 4.67-4.79 1.33 0 2.47.1 2.8.14v3.24h-1.92c-1.5 0-1.8.72-1.8 1.77v2.32h3.6l-.47 3.61h-3.13V24h6.13c.73 0 1.32-.59 1.32-1.32V1.32C24 .59 23.41 0 22.68 0Z"/>
                    </svg>
                    Share on Facebook
                </a>
            </div>

            <!-- Hidden Element for JS to read -->
            <div id="page-config" data-referral-link="{{referralLink}}" style="display:none;"></div>

            <div class="copy-wrapper">
                <button class="btn-copy" onclick="copyPageLink()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy Registration Link
                </button>
                <div id="copy-feedback">Link Copied Successfully!</div>
            </div>
        </div>

    </div>

    <!-- Footer -->
    <footer>
        <p>&copy; Iman Power</p>
    </footer>

    <!-- JavaScript -->
    <script>
        function copyPageLink() {
            var config = document.getElementById("page-config");
            const text = config.getAttribute("data-referral-link"); 
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    showFeedback();
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            } else {
                // Fallback for older browsers
                const dummy = document.createElement('input');
                document.body.appendChild(dummy);
                dummy.value = text;
                dummy.select();
                document.execCommand('copy');
                document.body.removeChild(dummy);
                showFeedback();
            }
        }

        function showFeedback() {
            const feedback = document.getElementById('copy-feedback');
            feedback.style.display = 'block';
            
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }

        (function initShareLinks() {
            var config = document.getElementById("page-config");
            var facebookButton = document.getElementById("facebook-share");
            if (!config || !facebookButton) return;
            var referralLink = config.getAttribute("data-referral-link");
            if (!referralLink) return;
            facebookButton.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(referralLink);
        })();
    </script>
</body>
</html>`;

  // 1. Create or Update the Template
  let template = await prisma.thankYouTemplate.findFirst({
    where: { name: templateName }
  });

  if (template) {
    console.log(`Found existing template: ${template.id}`);
    template = await prisma.thankYouTemplate.update({
      where: { id: template.id },
      data: {
        htmlCode: htmlContent,
      }
    });
    console.log('Updated existing template.');
  } else {
    // Create new
    // Note: If countdownTemplate model has required fields that are not optional, this might fail.
    // Based on schema, we should check required fields.
    template = await prisma.thankYouTemplate.create({
      data: {
        name: templateName,
        htmlCode: htmlContent,
        isSystem: true // Mark as system to prevent deletion or distinguish it
      }
    });
    console.log(`Created new template: ${template.id}`);
  }

  // 2. Assign to specific webinars
  const targetSlugs = ['strongmuslims', 'loveislam-copy-1', 'loveislam-copy-1-copy-1', 'loveislam'];
  
  for (const slug of targetSlugs) {
    const webinar = await prisma.webinar.findUnique({
      where: { slug: slug }
    });

    if (webinar) {
      await prisma.webinar.update({
        where: { id: webinar.id },
        data: { thankYouTemplateId: template.id }
      });
      console.log(`Assigned template to webinar: ${slug}`);
    } else {
      console.log(`Webinar not found: ${slug}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
