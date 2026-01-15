
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Updating "Legacy: Thank You" Template...')

  const newHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Registered - {{webinarTitle}}</title>
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
            --gold-light: #E8D3A6;
            --cream: #FAF7F2;
            --white: #FFFFFF;
            --text: #1A1A1A;
            --text-light: rgba(255,255,255,0.85);
            --radius: 12px; /* More modern, softer radius */
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--cream);
            color: var(--text);
            font-size: 15px; /* Increased slightly for better readability */
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }

        /* =========================================
           HERO SECTION
           ========================================= */
        .hero {
            padding: 50px 24px 70px;
            background: var(--plum-deep);
            text-align: center;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--gold) 0%, #F3D690 50%, var(--gold) 100%);
            z-index: 2;
        }

        /* Refined Confetti (Gold Circles) */
        .confetti {
            position: absolute;
            top: -20px;
            width: 10px;
            height: 10px;
            z-index: 1;
            pointer-events: none;
            border-radius: 50%; /* Circle, not square */
            opacity: 0.8;
        }

        @keyframes fall {
            0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(300px) rotate(360deg); opacity: 0; }
        }

        .check-icon {
            width: 70px;
            height: 70px;
            background: rgba(196, 164, 78, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            border: 2px solid var(--gold);
            z-index: 2;
            position: relative;
            box-shadow: 0 0 20px rgba(196, 164, 78, 0.3);
        }

        .check-icon svg {
            width: 32px;
            height: 32px;
            fill: var(--gold);
        }

        .hero h1 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: var(--white);
            line-height: 1.1;
            margin-bottom: 16px;
            position: relative;
            z-index: 2;
            letter-spacing: -0.5px;
        }

        .hero p {
            font-size: 16px;
            color: var(--text-light);
            max-width: 450px;
            margin-bottom: 32px;
            position: relative;
            z-index: 2;
        }

        /* Date/Time Card (More elegant) */
        .webinar-details {
            width: 100%;
            max-width: 350px;
            background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
            border: 1px solid rgba(196, 164, 78, 0.3);
            padding: 24px;
            border-radius: var(--radius);
            margin-bottom: 32px;
            position: relative;
            z-index: 2;
            backdrop-filter: blur(10px);
        }

        .webinar-date {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 700;
            color: var(--gold-light);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .webinar-time {
            font-family: 'Inter', sans-serif;
            font-size: 15px;
            color: var(--white);
            font-weight: 500;
            letter-spacing: 0.5px;
        }

        /* PRIMARY CTA (Gradient) */
        .btn-join-hero {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            max-width: 300px;
            background: linear-gradient(135deg, var(--gold) 0%, #A38436 100%);
            color: var(--plum-deep);
            padding: 18px 32px;
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-decoration: none;
            border-radius: 50px; /* Pill shape */
            box-shadow: 0 8px 25px rgba(196, 164, 78, 0.4);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: none;
            cursor: pointer;
            position: relative;
            z-index: 2;
        }

        .btn-join-hero:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(196, 164, 78, 0.5);
        }

        .btn-join-hero:active {
            transform: scale(0.98);
        }

        /* =========================================
           MAIN CONTENT
           ========================================= */
        .main-content {
            width: 100%;
            margin-top: -40px;
            padding: 0 20px 60px;
            position: relative;
            z-index: 2;
        }

        .step-card {
            background: var(--white);
            padding: 28px 24px;
            margin-bottom: 24px;
            border-radius: var(--radius);
            box-shadow: 0 10px 30px rgba(26, 26, 26, 0.04);
            border-top: 4px solid transparent;
            transition: transform 0.3s ease;
        }
        
        .step-card:hover {
            transform: translateY(-2px);
        }

        .step-header {
            display: flex;
            align-items: baseline;
            margin-bottom: 16px;
            gap: 12px;
        }

        .step-number {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 800;
            color: rgba(61, 31, 51, 0.08);
            line-height: 1;
        }

        .step-title {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 600;
            color: var(--plum);
        }

        .step-card.email-card { border-top-color: var(--gold); }
        .step-card.calendar-card { border-top-color: var(--gold); }
        .step-card.share-card { border-top-color: var(--plum); }

        .email-content p {
            font-size: 15px;
            color: #555;
            margin-bottom: 10px;
        }

        .backup-link-container {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed #eee;
            font-size: 13px;
            color: #777;
            text-align: center;
        }

        .backup-link {
            color: var(--plum);
            font-weight: 700;
            text-decoration: none;
            border-bottom: 1px solid var(--plum);
        }

        .calendar-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }

        .btn-calendar {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            border: 2px solid rgba(61, 31, 51, 0.1);
            color: var(--plum);
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.2s ease;
            border-radius: 8px;
            width: 100%; 
            background: #fff;
        }

        .btn-calendar:hover {
            background: var(--cream);
            border-color: var(--plum);
        }

        .btn-calendar svg {
            width: 18px;
            height: 18px;
            margin-right: 10px;
            fill: currentColor;
        }

        /* Share Section - Elegant Design */
        .hadith-box {
            background: var(--cream);
            padding: 20px;
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
            margin-bottom: 10px;
        }

        .hadith-reference {
            font-size: 12px;
            color: #888;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .share-intro {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
            text-align: center;
        }

        /* Social Grid - Gold Ring Style */
        .social-grid {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-bottom: 24px;
        }

        .btn-social {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--gold); /* Gold Icon */
            background: transparent;
            border: 2px solid var(--gold); /* Gold Border Ring */
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .btn-social svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }

        .btn-social:hover {
            background: var(--gold);
            color: var(--white);
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(196, 164, 78, 0.3);
        }
        
        .btn-social:active {
            transform: scale(0.95);
        }

        /* Copy Button */
        .btn-copy {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background: var(--plum);
            color: var(--white);
            padding: 16px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: background 0.2s ease;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(61, 31, 51, 0.2);
        }

        .btn-copy:hover {
            background: var(--plum-deep);
        }

        .btn-copy svg {
            width: 18px;
            height: 18px;
            margin-right: 8px;
            fill: currentColor;
        }

        #copy-feedback {
            display: none;
            text-align: center;
            margin-top: 10px;
            font-size: 13px;
            color: var(--gold);
            font-weight: 600;
            animation: fadeIn 0.3s ease;
        }

        /* =========================================
           FOOTER
           ========================================= */
        footer {
            padding: 30px 20px;
            background: var(--white);
            text-align: center;
            border-top: 1px solid #f0f0f0;
        }

        footer p {
            font-size: 10px;
            color: #bbb;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }

        /* =========================================
           DESKTOP
           ========================================= */
        @media (min-width: 768px) {
            body { font-size: 16px; }
            .hero { padding: 100px 20px 140px; }
            .hero h1 { font-size: 48px; }
            .check-icon { width: 90px; height: 90px; }
            .check-icon svg { width: 40px; height: 40px; }
            .main-content { max-width: 600px; margin: -70px auto 0; }
            .step-card { padding: 40px 32px; }
            .step-number { font-size: 56px; }
            .step-title { font-size: 28px; }
            .calendar-buttons { flex-direction: row; }
            .btn-calendar, .btn-join-hero { width: auto; flex: 1; padding: 18px 24px; }
            .calendar-buttons .btn-calendar:first-child { margin-right: 15px; }
            .copy-wrapper { display: flex; flex-direction: column; align-items: center; }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <!-- Hero Section -->
    <section class="hero" id="hero">
        <!-- Confetti injected via JS -->
        
        <div class="check-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
        </div>

        <h1>You're In!</h1>
        <p>Your spot is reserved. We can't wait to see you.</p>

        <!-- Date & Time Display -->
        <div class="webinar-details">
            <!-- EDIT DATE & TIME HERE -->
            <div class="webinar-date">{{webinarDate}}</div>
            <div class="webinar-time">{{webinarTime}} ({{timeZone}})</div>
        </div>

        <!-- PRIMARY WEBINAR LINK -->
        <!-- REPLACE # WITH YOUR ACTUAL LINK -->
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
                <p>We've sent a confirmation to your inbox. Please double-check your <strong>spam folder</strong> just in case.</p>
                
                <!-- BACKUP LINK -->
                <div class="backup-link-container">
                    Can't find the email? <br>
                    <a href="{{joinLink}}" class="backup-link">Click here to access the webinar room</a>.
                </div>
            </div>
        </div>

        <!-- Step 2: Calendar -->
        <div class="step-card calendar-card">
            <div class="step-header">
                <span class="step-number">02</span>
                <h2 class="step-title">Mark Your Calendar</h2>
            </div>
            <p style="margin-bottom: 16px; color: #555; font-size: 15px;">Set a reminder so you don't miss this.</p>
            
            <div class="calendar-buttons">
                <!-- Google Calendar -->
                <a href="{{googleCalendarLink}}" target="_blank" class="btn-calendar">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                    Add to Google
                </a>

                <!-- Apple/Download -->
                <a href="{{appleCalendarLink}}" class="btn-calendar">
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
            
            <p class="share-intro">Invite friends to earn rewards.</p>

            <div class="hadith-box">
                <p class="hadith-text">"Whoever guides someone to goodness will have a reward like the one who did it."</p>
                <p class="hadith-reference">— Prophet Muhammad ﷺ</p>
            </div>

            <!-- Social Buttons (Styled in Brand Colors) -->
            <div class="social-grid">
                <!-- WhatsApp -->
                <a href="#" id="share-wa" target="_blank" class="btn-social" aria-label="Share on WhatsApp">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                
                <!-- Facebook -->
                <a href="#" id="share-fb" target="_blank" class="btn-social" aria-label="Share on Facebook">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>

                <!-- Twitter / X -->
                <a href="#" id="share-tw" target="_blank" class="btn-social" aria-label="Share on X">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
            </div>

            <div class="copy-wrapper">
                <button class="btn-copy" onclick="copyPageLink()">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy Link
                </button>
                <div id="copy-feedback">Link Copied!</div>
            </div>
        </div>

    </div>

    <!-- Footer -->
    <footer>
        <p>&copy; Iman Power</p>
    </footer>

    <!-- JavaScript -->
    <script>
        // ===========================
        // 1. CONFETTI FUNCTION
        // ===========================
        function fireConfetti() {
            const hero = document.getElementById('hero');
            // Only use brand colors (Gold, White, Cream)
            const colors = ['#C4A44E', '#FFFFFF', '#FAF7F2', '#D9BC6A'];
            const confettiCount = 40; 

            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDuration = (Math.random() * 2.5 + 2) + 's'; // Slower fall
                confetti.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                hero.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }
        }

        // ===========================
        // 2. SHARE LINK LOGIC
        // ===========================
        
        // System variables
        const referralLink = '{{referralLink}}';
        const waMessage = '{{whatsappShareMessage}}';
        const fbMessage = '{{facebookShareMessage}}';
        const pageTitle = '{{webinarTitle}}';
        
        // Fallback if variables are not replaced (e.g. during preview if no data)
        const activeLink = (referralLink && referralLink.indexOf('{{') === -1) ? referralLink : window.location.href;
        const activeWaMsg = (waMessage && waMessage.indexOf('{{') === -1) ? waMessage : "I just registered for this free masterclass. You should join me!";
        const activeFbMsg = (fbMessage && fbMessage.indexOf('{{') === -1) ? fbMessage : "Check out this free masterclass!";
        const activeTwMsg = "Check out this free masterclass: " + activeLink;

        document.getElementById('share-wa').href = \`https://wa.me/?text=\${encodeURIComponent(activeWaMsg + " " + activeLink)}\`;
        document.getElementById('share-fb').href = \`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(activeLink)}&quote=\${encodeURIComponent(activeFbMsg)}\`;
        document.getElementById('share-tw').href = \`https://twitter.com/intent/tweet?text=\${encodeURIComponent(activeTwMsg)}\`;

        // ===========================
        // 3. COPY LINK FUNCTION
        // ===========================
        function copyPageLink() {
            const dummy = document.createElement('input');
            const text = activeLink; 
            
            document.body.appendChild(dummy);
            dummy.value = text;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);

            const feedback = document.getElementById('copy-feedback');
            feedback.style.display = 'block';
            
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }

        window.onload = fireConfetti;
    </script>
</body>
</html>`;

  await prisma.thankYouTemplate.upsert({
    where: { name: 'Legacy: Thank You' },
    update: {
      htmlCode: newHtml
    },
    create: {
      name: 'Legacy: Thank You',
      description: 'Legacy style thank you page with gold/plum branding',
      isSystem: true,
      htmlCode: newHtml
    }
  })

  console.log('✅ Successfully updated "Legacy: Thank You" template!')
}

main()
  .catch((e) => {
    console.error('❌ Error updating template:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
