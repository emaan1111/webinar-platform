import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const islamicMothersCountdownHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{webinarTitle}} | Countdown</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: {{primaryColor}};
            --secondary: #2c7a7b;
            --accent: {{accentColor}};
            --gold: #d69e2e;
            --dark: #1a202c;
            --light: #f7fafc;
            --white: #ffffff;
            --gray: #718096;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            line-height: 1.5;
            color: var(--dark);
            background: var(--light);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            width: 100%;
            padding: 0 15px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        /* Header with consistent colors */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 20px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
            animation: float 20s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
        }
        
        .webinar-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--accent);
            color: var(--white);
            font-weight: 600;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.75rem;
            margin-bottom: 10px;
            box-shadow: 0 3px 10px rgba(213, 63, 140, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }
        
        .title {
            font-family: 'Playfair Display', serif;
            font-size: 1.4rem;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 8px;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .subtitle {
            font-size: 0.85rem;
            font-weight: 300;
            margin-bottom: 12px;
            opacity: 0.95;
            max-width: 350px;
            margin-left: auto;
            margin-right: auto;
        }
        
        /* Countdown with consistent colors */
        .countdown-section {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            padding: 15px 0;
            text-align: center;
            position: relative;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .countdown-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .countdown-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--white);
            margin-bottom: 8px;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .webinar-date {
            font-size: 0.8rem;
            color: var(--white);
            margin-bottom: 12px;
            background: rgba(255,255,255,0.15);
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        
        .countdown {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 5px;
            flex-wrap: wrap;
        }
        
        .countdown-item {
            background: var(--white);
            color: var(--primary);
            border-radius: 8px;
            padding: 8px 6px;
            min-width: 50px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
            border: 2px solid var(--gold);
            transition: all 0.3s ease;
        }
        
        .countdown-item:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        
        .countdown-value {
            font-size: 1.3rem;
            font-weight: 800;
            line-height: 1;
            display: block;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .countdown-label {
            font-size: 0.6rem;
            text-transform: uppercase;
            margin-top: 3px;
            color: var(--gray);
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        /* Content Section with consistent colors */
        .content-section {
            padding: 20px 0;
            background: var(--white);
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            max-width: 700px;
            margin: 0 auto;
        }
        
        .video-container {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
            position: relative;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        }
        
        .video-wrapper {
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
        }
        
        .video-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--white);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .video-placeholder:hover {
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
        }
        
        .play-button {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        .play-button:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.1);
        }
        
        .play-button i {
            font-size: 1.2rem;
            color: var(--white);
            margin-left: 2px;
        }
        
        .video-text {
            font-size: 0.85rem;
            font-weight: 500;
            text-align: center;
            max-width: 85%;
            padding: 0 10px;
            text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .bonus-card {
            background: var(--light);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 15px;
            position: relative;
            border: 2px solid var(--secondary);
        }
        
        .bonus-image-container {
            position: relative;
            width: 120px;
            height: 120px;
            flex-shrink: 0;
        }
        
        .bonus-image {
            width: 100%;
            height: 100%;
            border-radius: 10px;
            object-fit: cover;
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        }
        
        .bonus-image:hover {
            transform: translateY(-3px) rotate(2deg);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        
        .bonus-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: var(--accent);
            color: var(--white);
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.65rem;
            box-shadow: 0 3px 10px rgba(213, 63, 140, 0.3);
            transform: rotate(15deg);
        }
        
        .bonus-text {
            flex: 1;
        }
        
        .bonus-title {
            font-size: 1rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .bonus-description {
            font-size: 0.8rem;
            color: var(--dark);
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .value-tag {
            display: inline-block;
            background: var(--gold);
            color: var(--white);
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            box-shadow: 0 3px 10px rgba(214, 158, 46, 0.3);
        }
        
        /* Action Section with consistent colors */
        .action-section {
            padding: 20px 0;
            background: var(--light);
        }
        
        .action-content {
            text-align: center;
            max-width: 500px;
            margin: 0 auto;
        }
        
        .action-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 10px;
        }
        
        .action-description {
            font-size: 0.85rem;
            color: var(--dark);
            line-height: 1.4;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        
        .action-button {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 20px;
            text-decoration: none;
            transition: all 0.3s ease;
            min-width: 120px;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            border: none;
            cursor: pointer;
        }
        
        .reminder-button {
            background: var(--accent);
            color: var(--white);
        }
        
        .reminder-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(213, 63, 140, 0.3);
        }
        
        .whatsapp-button {
            background: var(--secondary);
            color: var(--white);
        }
        
        .whatsapp-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(44, 122, 123, 0.3);
        }
        
        .facebook-button {
            background: var(--primary);
            color: var(--white);
        }
        
        .facebook-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(74, 59, 107, 0.3);
        }
        
        /* Footer with consistent colors */
        .footer {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 15px 0;
            text-align: center;
            position: relative;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .footer-content {
            position: relative;
        }
        
        .footer-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .footer-description {
            font-size: 0.8rem;
            margin-bottom: 10px;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
        }
        
        .contact-item i {
            color: var(--gold);
        }
        
        .copyright {
            font-size: 0.7rem;
            opacity: 0.8;
        }
        
        /* Responsive Design */
        @media (min-width: 768px) {
            .header {
                padding: 25px 0;
            }
            
            .title {
                font-size: 1.6rem;
            }
            
            .subtitle {
                font-size: 0.9rem;
            }
            
            .countdown-section {
                padding: 20px 0;
            }
            
            .countdown-title {
                font-size: 1.2rem;
            }
            
            .webinar-date {
                font-size: 0.85rem;
                padding: 6px 15px;
            }
            
            .countdown {
                gap: 10px;
            }
            
            .countdown-item {
                min-width: 55px;
                padding: 10px 8px;
            }
            
            .countdown-value {
                font-size: 1.5rem;
            }
            
            .countdown-label {
                font-size: 0.65rem;
            }
            
            .content-section {
                padding: 25px 0;
            }
            
            .content-grid {
                grid-template-columns: 1fr 1fr;
                gap: 25px;
            }
            
            .play-button {
                width: 60px;
                height: 60px;
            }
            
            .play-button i {
                font-size: 1.5rem;
            }
            
            .video-text {
                font-size: 0.9rem;
            }
            
            .bonus-image-container {
                width: 140px;
                height: 140px;
            }
            
            .bonus-title {
                font-size: 1.1rem;
            }
            
            .bonus-description {
                font-size: 0.85rem;
            }
            
            .action-section {
                padding: 25px 0;
            }
            
            .action-title {
                font-size: 1.3rem;
            }
            
            .action-description {
                font-size: 0.9rem;
            }
            
            .action-button {
                font-size: 0.9rem;
                padding: 10px 20px;
                min-width: 130px;
            }
            
            .footer {
                padding: 20px 0;
            }
            
            .footer-title {
                font-size: 1.2rem;
            }
            
            .footer-description {
                font-size: 0.85rem;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="webinar-status">
                <i class="fas fa-clock"></i> STARTING SOON
            </div>
            <h1 class="title">{{webinarTitle}}</h1>
            <p class="subtitle">{{webinarDescription}}</p>
        </div>
    </header>
    
    <!-- Countdown Section -->
    <section class="countdown-section">
        <div class="container">
            <h2 class="countdown-title">Webinar Starts In</h2>
            <div class="webinar-date">
                <i class="fas fa-calendar-alt"></i> {{webinarDateTime}}
            </div>
            <div class="countdown">
                <div class="countdown-item">
                    <span class="countdown-value" id="days">00</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value" id="hours">00</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value" id="minutes">00</span>
                    <span class="countdown-label">Minutes</span>
                </div>
                <div class="countdown-item">
                    <span class="countdown-value" id="seconds">00</span>
                    <span class="countdown-label">Seconds</span>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Content Section -->
    <section class="content-section">
        <div class="container">
            <div class="content-grid">
                {{#if showVideo}}
                <div class="video-container">
                    <div class="video-wrapper">
                        <div class="video-placeholder" onclick="playVideo()">
                            <div class="play-button">
                                <i class="fas fa-play"></i>
                            </div>
                            <p class="video-text">{{videoPlaceholder}}</p>
                        </div>
                    </div>
                </div>
                {{/if}}
                
                {{#if showBonus}}
                <div class="bonus-card">
                    <div class="bonus-image-container">
                        <img src="{{bonusImage}}" alt="{{bonusTitle}}" class="bonus-image">
                        <div class="bonus-badge">{{bonusBadge}}</div>
                    </div>
                    <div class="bonus-text">
                        <div class="bonus-title">
                            <i class="fas fa-gift"></i> {{bonusTitle}}
                        </div>
                        <p class="bonus-description">
                            {{bonusDescription}}
                        </p>
                        <span class="value-tag">{{bonusValue}}</span>
                    </div>
                </div>
                {{/if}}
            </div>
        </div>
    </section>
    
    <!-- Action Section -->
    <section class="action-section">
        <div class="container">
            <div class="action-content">
                <h2 class="action-title">Don't Miss This Event</h2>
                <p class="action-description">
                    Mark your calendar and get ready for an amazing experience!
                </p>
                <div class="action-buttons">
                    {{#if showReminder}}
                    <button class="action-button reminder-button" onclick="setReminder()">
                        <i class="fas fa-bell"></i> Set Reminder
                    </button>
                    {{/if}}
                    {{#if showWhatsApp}}
                    <a href="#" class="action-button whatsapp-button" onclick="shareOnWhatsApp(); return false;">
                        <i class="fab fa-whatsapp"></i> Share
                    </a>
                    {{/if}}
                    {{#if showFacebook}}
                    <a href="#" class="action-button facebook-button" onclick="shareOnFacebook(); return false;">
                        <i class="fab fa-facebook-f"></i> Share
                    </a>
                    {{/if}}
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <h3 class="footer-title">{{organizationName}}</h3>
                <p class="footer-description">
                    Creating meaningful experiences and lasting impact.
                </p>
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>{{contactEmail}}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-globe"></i>
                        <span>{{websiteUrl}}</span>
                    </div>
                </div>
                <p class="copyright">
                    © {{currentYear}} {{organizationName}}. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
    
    <script>
        // Countdown Timer
        const targetDate = new Date('{{webinarStartDateTime}}');
        const joinUrl = '{{joinLink}}';
        
        function updateCountdown() {
            const now = new Date();
            const difference = targetDate - now;
            
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                
                document.getElementById('days').textContent = days.toString().padStart(2, '0');
                document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
                document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
                document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
            } else {
                document.getElementById('days').textContent = '00';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                
                document.querySelector('.webinar-status').innerHTML = '<i class="fas fa-broadcast-tower"></i> LIVE NOW';
                document.querySelector('.countdown-title').textContent = 'Webinar Has Started!';
                
                // Redirect to webinar room
                setTimeout(() => {
                    window.location.href = joinUrl;
                }, 2000);
            }
        }
        
        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        function playVideo() {
            const videoUrl = '{{videoUrl}}';
            if (videoUrl) {
                window.open(videoUrl, '_blank');
            } else {
                alert('Video will be available soon!');
            }
        }
        
        function shareOnWhatsApp() {
            const shareText = "Join me for: {{webinarTitle}}. Register here: {{registrationLink}}";
            const whatsappUrl = \`https://wa.me/?text=\${encodeURIComponent(shareText)}\`;
            window.open(whatsappUrl, '_blank');
        }
        
        function shareOnFacebook() {
            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u={{registrationLink}}";
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
        
        function setReminder() {
            const webinarTitle = "{{webinarTitle}}";
            const webinarDescription = "{{webinarDescription}}";
            
            const startDate = new Date('{{webinarStartDateTime}}').toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");
            const endDate = new Date(new Date('{{webinarStartDateTime}}').getTime() + {{webinarDuration}} * 60000).toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");
            
            const googleCalendarUrl = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent(webinarTitle)}&dates=\${startDate}/\${endDate}&details=\${encodeURIComponent(webinarDescription)}&location=Online\`;
            
            window.open(googleCalendarUrl, '_blank');
        }
    </script>
</body>
</html>`;

const defaultCountdownHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{webinarTitle}} - Countdown</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, {{primaryColor}} 0%, {{accentColor}} 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            text-align: center;
        }
        
        .container {
            max-width: 600px;
            width: 100%;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .countdown {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        
        .countdown-item {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 20px;
            min-width: 100px;
        }
        
        .countdown-value {
            font-size: 3rem;
            font-weight: 700;
            display: block;
        }
        
        .countdown-label {
            font-size: 0.9rem;
            text-transform: uppercase;
            opacity: 0.8;
            margin-top: 5px;
        }
        
        .info {
            margin: 2rem 0;
            font-size: 1.1rem;
        }
        
        .button {
            display: inline-block;
            background: white;
            color: {{primaryColor}};
            padding: 15px 30px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.2s;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }
            
            .countdown-value {
                font-size: 2rem;
            }
            
            .countdown-item {
                min-width: 80px;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{webinarTitle}}</h1>
        <p class="subtitle">{{webinarDescription}}</p>
        
        <div class="countdown">
            <div class="countdown-item">
                <span class="countdown-value" id="days">00</span>
                <span class="countdown-label">Days</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value" id="hours">00</span>
                <span class="countdown-label">Hours</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value" id="minutes">00</span>
                <span class="countdown-label">Minutes</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value" id="seconds">00</span>
                <span class="countdown-label">Seconds</span>
            </div>
        </div>
        
        <div class="info">
            <p>📅 {{webinarDateTime}}</p>
            <p>⏱️ Duration: {{webinarDuration}} minutes</p>
        </div>
        
        <a href="{{joinLink}}" class="button">Join Webinar Room</a>
    </div>
    
    <script>
        const targetDate = new Date('{{webinarStartDateTime}}');
        const joinUrl = '{{joinLink}}';
        
        function updateCountdown() {
            const now = new Date();
            const difference = targetDate - now;
            
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                
                document.getElementById('days').textContent = days.toString().padStart(2, '0');
                document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
                document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
                document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
            } else {
                window.location.href = joinUrl;
            }
        }
        
        updateCountdown();
        setInterval(updateCountdown, 1000);
    </script>
</body>
</html>`;

async function main() {
  console.log('🌱 Seeding countdown pages...');

  // Create Islamic Mothers countdown page
  const islamicPage = await prisma.countdownPage.upsert({
    where: { name: 'Islamic Mothers' },
    update: {},
    create: {
      name: 'Islamic Mothers',
      description: 'Beautiful countdown page designed for Islamic parenting webinars with elegant styling and cultural sensitivity',
      htmlCode: islamicMothersCountdownHTML,
      showVideo: true,
      videoPlaceholder: 'Watch this important message about this masterclass',
      showBonus: true,
      bonusTitle: 'Stories of Great Mothers',
      bonusDescription: 'Inspiring stories of great mothers from Islamic history who raised extraordinary children. Transform your approach to Islamic parenting.',
      bonusImage: 'https://picsum.photos/seed/mothersstorybook/140/140.jpg',
      bonusValue: 'Value: $47 | Yours FREE',
      bonusBadge: 'FREE',
      showReminder: true,
      showWhatsApp: true,
      showFacebook: true,
      organizationName: 'Emaan Power Educational Institute',
      contactEmail: 'info@emanpower.com',
      websiteUrl: 'www.emanpower.com',
      primaryColor: '#4a3b6b',
      accentColor: '#d53f8c',
      isSystem: true,
    },
  });

  console.log('✅ Created Islamic Mothers countdown page:', islamicPage.id);

  // Create Default countdown page
  const defaultPage = await prisma.countdownPage.upsert({
    where: { name: 'Default' },
    update: {},
    create: {
      name: 'Default',
      description: 'Clean and simple countdown page with gradient background',
      htmlCode: defaultCountdownHTML,
      showVideo: false,
      showBonus: false,
      showReminder: false,
      showWhatsApp: false,
      showFacebook: false,
      primaryColor: '#6366f1',
      accentColor: '#8b5cf6',
      isSystem: true,
    },
  });

  console.log('✅ Created Default countdown page:', defaultPage.id);

  console.log('🎉 Countdown pages seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding countdown pages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
