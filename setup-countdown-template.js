
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templateName = "Legacy: Countdown";
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webinar Lobby - {{webinar.title}}</title>
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        /* --- RESET & VARIABLES --- */
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
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--cream); /* BRIGHT: Switch to light cream */
            color: var(--text);
            font-size: 15px; /* COMPACT: Slightly smaller base font */
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        /* --- LAYOUT UTILITIES --- */
        .container {
            width: 100%;
            max-width: 600px; /* COMPACT: Narrower container for focus */
            margin: 0 auto;
            padding: 20px 16px; /* COMPACT: Reduced padding */
            text-align: center;
        }

        /* --- HEADER --- */
        .lobby-header {
            padding-bottom: 16px; /* COMPACT */
        }

        .lobby-brand {
            font-family: 'Inter', sans-serif;
            color: var(--plum);
            font-size: 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 12px;
            opacity: 0.7;
        }

        .webinar-title {
            font-family: 'Playfair Display', serif;
            font-size: 26px; /* COMPACT: Smaller heading */
            font-weight: 700;
            color: var(--plum-deep);
            line-height: 1.2;
            margin-bottom: 12px;
        }

        .webinar-title span {
            color: var(--gold);
            font-style: italic;
        }

        /* --- COUNTDOWN CARD --- */
        .countdown-card {
            background: var(--white); /* BRIGHT: White card on cream background */
            border-radius: 12px;
            padding: 24px 20px; /* COMPACT: Less internal padding */
            box-shadow: 0 10px 30px rgba(61, 31, 51, 0.06); /* Soft shadow */
            border: 1px solid rgba(61, 31, 51, 0.05);
            position: relative;
            overflow: hidden;
        }

        /* Gold accent line at top */
        .countdown-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: var(--gold);
        }

        .schedule-info {
            margin-bottom: 20px; /* COMPACT */
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .schedule-date {
            font-size: 13px;
            color: var(--gold);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: rgba(196, 164, 78, 0.1);
            padding: 4px 12px;
            border-radius: 20px;
        }

        .schedule-time {
            font-size: 13px;
            color: #666;
            font-weight: 500;
        }

        /* The Timer Grid */
        .timer-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px; /* COMPACT: Tighter gap */
            margin-bottom: 24px;
        }

        .time-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--cream);
            padding: 12px 4px; /* COMPACT: Less padding */
            border-radius: 6px;
            border: 1px solid rgba(61, 31, 51, 0.05);
        }

        .time-number {
            font-family: 'Playfair Display', serif;
            font-size: 1.8rem; /* COMPACT: Smaller numbers */
            font-weight: 700;
            color: var(--plum);
            line-height: 1;
            margin-bottom: 2px;
        }

        .time-label {
            font-size: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            font-weight: 600;
        }

        /* --- CTA BUTTON --- */
        .btn-enter {
            display: inline-block;
            background: var(--plum); /* Switch to plum button for contrast on light bg */
            color: var(--white);
            padding: 16px 32px;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-radius: 6px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(61, 31, 51, 0.2);
            border: none;
            cursor: pointer;
            width: 100%;
        }

        .btn-enter:hover {
            background: var(--plum-deep);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(61, 31, 51, 0.3);
        }

        /* --- SHARE SECTION --- */
        .share-section {
            margin-top: 24px; /* COMPACT: Pull closer */
            padding: 0 10px;
            text-align: center;
        }

        .share-header h2 {
            font-family: 'Playfair Display', serif;
            font-size: 20px; /* COMPACT */
            font-weight: 700;
            color: var(--plum);
            margin-bottom: 8px;
        }

        .share-header p {
            font-size: 13px;
            color: #666;
            margin-bottom: 16px;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }

        .hadith-box {
            background: #fff;
            padding: 16px; /* COMPACT */
            border-radius: 8px;
            border-left: 3px solid var(--gold);
            margin-bottom: 20px;
            text-align: left;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .hadith-box p {
            font-family: 'Playfair Display', serif;
            font-size: 14px; /* COMPACT */
            font-style: italic;
            color: var(--plum-deep);
            line-height: 1.5;
        }

        .share-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .btn-share {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 12px; /* COMPACT */
            transition: opacity 0.3s;
            min-width: 140px;
        }

        .btn-whatsapp { background-color: #25D366; color: white; }
        .btn-facebook { background-color: #1877F2; color: white; }
        
        .btn-copy {
            background-color: white;
            border: 1px solid #ddd;
            color: var(--plum-deep);
            cursor: pointer;
        }
        
        .btn-copy:hover { background-color: #f9f9f9; }

        /* --- TOAST --- */
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: var(--plum-deep);
            color: var(--white);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 13px;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 10px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

    </style>
</head>
<body>

    <div class="container">
        
        <!-- Header -->
        <header class="lobby-header">
            <div class="lobby-brand">Iman Power Masterclass</div>
            <h1 class="webinar-title">{{webinar.title}}</h1>
        </header>

        <!-- Main Card -->
        <div class="countdown-card">
            <div class="schedule-info">
                <span class="schedule-date">{{schedule.date}}</span>
                <span class="schedule-time">{{schedule.time}}</span>
            </div>

            <!-- Countdown Timer -->
            <div class="timer-grid" id="countdown">
                <div class="time-box">
                    <span class="time-number" id="days">00</span>
                    <span class="time-label">Days</span>
                </div>
                <div class="time-box">
                    <span class="time-number" id="hours">00</span>
                    <span class="time-label">Hrs</span>
                </div>
                <div class="time-box">
                    <span class="time-number" id="minutes">00</span>
                    <span class="time-label">Min</span>
                </div>
                <div class="time-box">
                    <span class="time-number" id="seconds">00</span>
                    <span class="time-label">Sec</span>
                </div>
            </div>

            <!-- Action Button -->
            <button id="enterBtn" class="btn-enter" onclick="enterWebinarRoom()">
                Enter Webinar Room
            </button>
        </div>

        <!-- Share Section -->
        <section class="share-section">
            <div class="share-header">
                <h2>Share & Earn Rewards</h2>
                <p>Be a light for others! Invite friends to this free Masterclass.</p>
            </div>

            <div class="hadith-box">
                <p>"Whoever guides someone to goodness will have a reward like the one who does it."</p>
                <p style="text-align: right; margin-top: 8px; font-size: 11px; font-style: normal; font-family: 'Inter', sans-serif; font-weight: 600; color: var(--gold);">— Prophet (ﷺ)</p>
            </div>

            <div class="share-buttons">
                <!-- WhatsApp -->
                <a href="https://wa.me/?text=Join%20this%20amazing%20masterclass%20on%20raising%20unshakable%20children!%20%23ImanPower%20{{referralLink}}" target="_blank" class="btn-share btn-whatsapp">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    WhatsApp
                </a>

                <!-- Facebook -->
                <a href="https://www.facebook.com/sharer/sharer.php?u={{referralLink}}" target="_blank" class="btn-share btn-facebook">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    Facebook
                </a>

                <!-- Copy Link -->
                <button onclick="copyLink()" class="btn-share btn-copy">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    Copy Link
                </button>
            </div>
        </section>

    </div>

    <!-- Toast Message -->
    <div id="toast" class="toast">
        <svg width="20" height="20" fill="none" stroke="#4ade80" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
        <span>Link copied to clipboard!</span>
    </div>

    <!-- Hidden Config for JS -->
    <div id="page-config" 
         data-target-time="{{webinarStartDateTime}}"
         data-join-link="{{joinLink}}"
         data-referral-link="{{referralLink}}"
         style="display:none;"></div>

    <script>
        // --- 1. COUNTDOWN LOGIC ---
        
        // Get config
        var config = document.getElementById("page-config");
        
        // Set the date (Demo: 24 hours from now)
        // REPLACED: Use real start time via data attribute
        var targetTimeStr = config.getAttribute("data-target-time"); 
        // Fallback if not replaced or invalid (1 hour from now)
        var countDownDate = new Date(targetTimeStr).getTime() || (new Date().getTime() + 3600000);

        var x = setInterval(function() {
            var now = new Date().getTime();
            var distance = countDownDate - now;

            // Time calculations
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Display result with leading zero
            var daysEl = document.getElementById("days");
            var hoursEl = document.getElementById("hours");
            var minutesEl = document.getElementById("minutes");
            var secondsEl = document.getElementById("seconds");

            if (daysEl) daysEl.innerHTML = days < 10 ? "0" + days : days;
            if (hoursEl) hoursEl.innerHTML = hours < 10 ? "0" + hours : hours;
            if (minutesEl) minutesEl.innerHTML = minutes < 10 ? "0" + minutes : minutes;
            if (secondsEl) secondsEl.innerHTML = seconds < 10 ? "0" + seconds : seconds;

            // If countdown is finished
            if (distance < 0) {
                clearInterval(x);
                document.getElementById("countdown").innerHTML = "<div style='color:var(--gold); font-family:Playfair Display; font-size:20px; font-weight:700;'>The Masterclass is Live!</div>";
                var btn = document.getElementById("enterBtn");
                btn.innerHTML = "ENTER NOW";
                btn.style.background = "#25D366"; // Green color
            }
        }, 1000);

        // --- 2. BUTTON LOGIC ---
        function enterWebinarRoom() {
            var btn = document.getElementById("enterBtn");
            if(btn.innerHTML === "ENTER NOW") {
                // REPLACED: Redirect to actual room
                var joinUrl = config.getAttribute("data-join-link");
                if (joinUrl) window.location.href = joinUrl;
            } else {
                alert("The room opens shortly. Please wait.");
            }
        }

        // --- 3. COPY LINK LOGIC ---       
        function copyLink() {
            // REPLACED: Use actual referral link
            var dummyLink = config.getAttribute("data-referral-link"); 
            navigator.clipboard.writeText(dummyLink).then(() => {
                showToast();
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }

        function showToast() {
            var toast = document.getElementById("toast");
            toast.classList.add("show");
            setTimeout(function(){ 
                toast.classList.remove("show"); 
            }, 3000);
        }
    </script>
</body>
</html>`;

  // 1. Create or Update the Template
  let template = await prisma.countdownTemplate.findFirst({
    where: { name: templateName }
  });

  if (template) {
    console.log(`Found existing template: ${template.id}`);
    template = await prisma.countdownTemplate.update({
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
    template = await prisma.countdownTemplate.create({
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
        data: { countdownTemplateId: template.id }
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
