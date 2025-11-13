import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Thank You Templates...')

  // Default System Template
  const defaultTemplate = await prisma.thankYouTemplate.upsert({
    where: { name: 'Default' },
    update: {},
    create: {
      name: 'Default',
      description: 'Clean, modern thank you page with calendar integration and countdown timer',
      isSystem: true,
      
      htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Thank You for Registering | {{webinarTitle}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b;
            --secondary: #2c7a7b;
            --accent: #d53f8c;
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
            background-color: var(--light);
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
        }

        #confetti-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        }

        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 25px 0;
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
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .thank-you-icon {
            font-size: 2.5rem;
            color: var(--gold);
            margin-bottom: 10px;
            animation: scaleIn 0.8s ease-out;
        }

        @keyframes scaleIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .title {
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 10px;
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        @keyframes fadeInUp {
            0% {
                transform: translateY(15px);
                opacity: 0;
            }
            100% {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .subtitle {
            font-size: 0.95rem;
            font-weight: 400;
            margin-bottom: 15px;
            opacity: 0.95;
            animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .webinar-datetime {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            padding: 8px 16px;
            margin: 0 auto;
            max-width: 320px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            backdrop-filter: blur(5px);
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }

        .webinar-datetime i {
            color: var(--gold);
            font-size: 1rem;
        }

        .webinar-datetime-text {
            font-size: 0.9rem;
            font-weight: 600;
        }

        .countdown-wrapper {
            margin-top: 18px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            animation: fadeInUp 0.8s ease-out 0.8s both;
        }

        .countdown-label {
            font-size: 0.8rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            opacity: 0.8;
        }

        #countdown {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--white);
        }

        .confirmation-section {
            background-color: var(--white);
            padding: 20px 0;
            text-align: center;
            animation: fadeInUp 0.8s ease-out 0.8s both;
        }

        .confirmation-message {
            font-size: 1rem;
            color: var(--dark);
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .email-info {
            background-color: var(--light);
            border-radius: 8px;
            padding: 16px;
            border-left: 4px solid var(--secondary);
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
            transition: transform 0.3s ease;
        }

        .email-info:hover {
            transform: translateY(-2px);
        }

        .email-info p {
            font-size: 0.95rem;
            color: var(--dark);
            margin-bottom: 12px;
        }

        .email-info p:last-child {
            margin-bottom: 0;
        }

        .email-info strong {
            color: var(--primary);
        }

        .webinar-link {
            background-color: var(--secondary);
            color: var(--white);
            font-size: 0.95rem;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 12px;
            transition: all 0.3s ease;
            width: 100%;
            max-width: 260px;
        }

        .webinar-link:hover {
            background-color: #236364;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(44, 122, 123, 0.3);
        }

        .bonus-section {
            background-color: var(--light);
            padding: 20px 0;
        }

        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--primary);
            text-align: center;
            margin-bottom: 20px;
            position: relative;
        }

        .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 2px;
        }

        .bonus-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }

        .bonus-image {
            width: 100%;
            max-width: 220px;
            height: auto;
            border-radius: 8px;
            border: 3px solid var(--secondary);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }

        .bonus-image:hover {
            transform: scale(1.02);
        }

        .bonus-text {
            text-align: center;
        }

        .bonus-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .bonus-description {
            font-size: 0.95rem;
            color: var(--dark);
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .value-tag {
            display: inline-block;
            background-color: var(--accent);
            color: var(--white);
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.85rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(213, 63, 140, 0.7);
            }
            70% {
                box-shadow: 0 0 0 8px rgba(213, 63, 140, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(213, 63, 140, 0);
            }
        }

        .steps-section {
            background-color: var(--white);
            padding: 20px 0;
        }

        .steps-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .step-card {
            background-color: var(--light);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-top: 4px solid var(--secondary);
        }

        .step-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }

        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: var(--primary);
            color: var(--white);
            border-radius: 50%;
            font-size: 1.2rem;
            font-weight: 700;
            margin: 0 auto 12px;
        }

        .step-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 12px;
            text-align: center;
        }

        .step-description {
            font-size: 0.95rem;
            color: var(--dark);
            line-height: 1.6;
            margin-bottom: 16px;
            text-align: center;
        }

        .step-button {
            display: block;
            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);
            color: var(--white);
            font-size: 0.95rem;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            border: none;
            width: 100%;
            max-width: 260px;
            margin: 0 auto;
        }

        .step-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(213, 63, 140, 0.3);
        }

        .share-section {
            background-color: var(--light);
            padding: 20px 0;
        }

        .share-content {
            text-align: center;
        }

        .share-description {
            font-size: 0.95rem;
            color: var(--dark);
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .share-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 260px;
            margin: 0 auto;
        }

        .share-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            transition: all 0.3s ease;
            width: 100%;
        }

        .whatsapp-button {
            background-color: #25D366;
            color: var(--white);
        }

        .whatsapp-button:hover {
            background-color: #128C7E;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(37, 211, 102, 0.3);
        }

        .facebook-button {
            background-color: #1877F2;
            color: var(--white);
        }

        .facebook-button:hover {
            background-color: #0c63d4;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(24, 119, 242, 0.3);
        }

        .footer {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 20px 0;
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
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .footer-content {
            position: relative;
        }

        .footer-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .footer-description {
            font-size: 0.9rem;
            margin-bottom: 16px;
        }

        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .contact-item i {
            color: var(--gold);
        }

        .copyright {
            font-size: 0.8rem;
            opacity: 0.8;
            margin-top: 12px;
        }

        @media (min-width: 768px) {
            .container {
                padding: 0 20px;
            }

            .header {
                padding: 35px 0;
            }

            .thank-you-icon {
                font-size: 3rem;
                margin-bottom: 15px;
            }

            .title {
                font-size: 2rem;
                margin-bottom: 15px;
            }

            .subtitle {
                font-size: 1.1rem;
                margin-bottom: 20px;
            }

            .webinar-datetime {
                max-width: 360px;
                padding: 10px 20px;
            }

            .webinar-datetime-text {
                font-size: 1rem;
            }

            .confirmation-section {
                padding: 30px 0;
            }

            .confirmation-message {
                font-size: 1.1rem;
                margin-bottom: 25px;
            }

            .email-info {
                max-width: 500px;
                margin: 0 auto;
            }

            .webinar-link {
                max-width: 300px;
            }

            .bonus-section {
                padding: 30px 0;
            }

            .section-title {
                font-size: 1.9rem;
                margin-bottom: 30px;
            }

            .section-title::after {
                width: 80px;
                height: 3px;
                bottom: -10px;
            }

            .bonus-content {
                flex-direction: row;
                gap: 30px;
                max-width: 800px;
                margin: 0 auto;
            }

            .bonus-image {
                width: 250px;
                height: 250px;
                flex: 0 0 auto;
            }

            .bonus-text {
                text-align: left;
                flex: 1;
                min-width: 200px;
            }

            .bonus-title {
                justify-content: flex-start;
            }

            .steps-section {
                padding: 30px 0;
            }

            .steps-container {
                flex-direction: row;
                gap: 25px;
                max-width: 800px;
                margin: 0 auto;
            }

            .step-card {
                flex: 1;
                min-width: 250px;
            }

            .step-number {
                margin: 0 auto 15px;
            }

            .step-title {
                text-align: left;
            }

            .step-description {
                text-align: left;
            }

            .step-button {
                max-width: 200px;
            }

            .share-section {
                padding: 30px 0;
            }

            .share-content {
                max-width: 700px;
                margin: 0 auto;
            }

            .share-description {
                font-size: 1.1rem;
                margin-bottom: 25px;
            }

            .share-buttons {
                flex-direction: row;
                max-width: none;
            }

            .footer {
                padding: 30px 0;
            }

            .footer-title {
                font-size: 1.5rem;
                margin-bottom: 15px;
            }

            .footer-description {
                font-size: 1rem;
                margin-bottom: 20px;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }

            .contact-info {
                flex-direction: row;
                gap: 25px;
                margin-bottom: 15px;
            }

            .copyright {
                margin-top: 15px;
            }
        }
    </style>
</head>
<body>
    <canvas id="confetti-canvas"></canvas>

    <header class="header">
        <div class="container">
            <div class="thank-you-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1 class="title">Thank You for Registering, {{attendeeName}}!</h1>
            <p class="subtitle">Your spot for "{{webinarTitle}}" has been reserved successfully.</p>
            <div class="webinar-datetime">
                <i class="fas fa-calendar-alt"></i>
                <span class="webinar-datetime-text">{{webinarDate}} at {{webinarTime}} ({{timeZone}})</span>
            </div>
            <div class="countdown-wrapper">
                <div id="countdown">Loading...</div>
                <div class="countdown-label">Until We Go Live</div>
            </div>
        </div>
    </header>

    <section class="confirmation-section">
        <div class="container">
            <p class="confirmation-message">
                We're excited to have you join us for this transformative masterclass, "{{webinarTitle}}". You've taken an important step toward helping your child develop a deep and lasting love for Islam.
            </p>
            <div class="email-info">
                <p><strong>Important:</strong> We've sent a confirmation email with all the webinar details to <strong>{{attendeeEmail}}</strong>. Please check your inbox (and spam folder) to ensure you receive all updates.</p>
                <a href="{{joinLink}}" class="webinar-link" target="_blank" rel="noopener">
                    <i class="fas fa-video"></i> Join the Webinar Room
                </a>
            </div>
        </div>
    </section>

    <section class="bonus-section">
        <div class="container">
            <h2 class="section-title">Your Exclusive Bonus Gift</h2>
            <div class="bonus-content">
                <img src="https://picsum.photos/seed/mothersstorybook/300/300.jpg" alt="Stories of Great Mothers Book" class="bonus-image">
                <div class="bonus-text">
                    <div class="bonus-title">
                        <i class="fas fa-gift"></i> Stories of Great Mothers Who Raised Great Men
                    </div>
                    <p class="bonus-description">
                        As promised, you'll receive this inspiring storybook after you attend "{{webinarTitle}}". It is filled with timeless wisdom and practical examples that will inspire and guide you on your journey as a Muslim mother.
                    </p>
                    <p class="bonus-description">
                        The book will arrive in your email shortly after the class. It's our gift to thank you for investing in your child's Islamic education.
                    </p>
                    <span class="value-tag">Value: $47 | Yours FREE</span>
                </div>
            </div>
        </div>
    </section>

    <section class="steps-section">
        <div class="container">
            <h2 class="section-title">What To Do Next</h2>
            <div class="steps-container">
                <div class="step-card">
                    <div class="step-number">1</div>
                    <h3 class="step-title">Mark Your Calendar</h3>
                    <p class="step-description">
                        Don't miss this life-changing masterclass on {{webinarDate}} at {{webinarTime}} ({{timeZone}}). Add it to your calendar and set a reminder 15 minutes before we start.
                    </p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <a href="{{googleCalendarLink}}" target="_blank" class="step-button" style="text-decoration: none; flex: 1; min-width: 200px;">
                            <i class="fab fa-google"></i> Add to Google Calendar
                        </a>
                        <a href="{{appleCalendarLink}}" download="webinar.ics" class="step-button" style="text-decoration: none; flex: 1; min-width: 200px;">
                            <i class="fab fa-apple"></i> Add to Apple Calendar
                        </a>
                    </div>
                </div>

                <div class="step-card">
                    <div class="step-number">2</div>
                    <h3 class="step-title">Share & Earn Rewards</h3>
                    <p class="step-description">
                        The Prophet (peace be upon him) said: "Whoever guides someone to goodness will have a reward like the one who does it." Share this free class with other mothers who might benefit and earn rewards from Allah.
                    </p>
                    <div class="share-buttons">
                        <a href="#" class="share-button whatsapp-button" onclick="shareOnWhatsApp(); return false;">
                            <i class="fab fa-whatsapp"></i> Share on WhatsApp
                        </a>
                        <a href="#" class="share-button facebook-button" onclick="shareOnFacebook(); return false;">
                            <i class="fab fa-facebook-f"></i> Share on Facebook
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="share-section">
        <div class="container">
            <div class="share-content">
                <h2 class="section-title">Help Other Mothers Benefit</h2>
                <p class="share-description">
                    Many mothers are facing the same challenges you are. By sharing this free masterclass on {{webinarDate}} at {{webinarTime}} ({{timeZone}}), you're helping another family raise children who love Islam.
                </p>
                <p class="share-description">
                    Imagine the reward you'll receive for helping even one mother strengthen her child's connection with Allah.
                </p>
                <a href="{{joinLink}}" class="webinar-link" target="_blank" rel="noopener">
                    <i class="fas fa-share-alt"></i> Share Registration Link
                </a>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <h3 class="footer-title">{{hostName}}</h3>
                <p class="footer-description">
                    Empowering Muslim families to raise children who love Islam and contribute positively to our society.
                </p>
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>{{hostEmail}}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-id-card"></i>
                        <span>Registration ID: {{registrationId}}</span>
                    </div>
                </div>
                <p class="copyright">
                    © <span id="current-year"></span> {{hostName}}. All rights reserved.
                </p>
            </div>
        </div>
    </footer>

    <script>
        {{countdown}}

        function startConfetti() {
            const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
            if (isLowEndDevice) return;

            const canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const confettiPieces = [];
            const colors = ['#4a3b6b', '#2c7a7b', '#d53f8c', '#d69e2e', '#ffffff'];

            class Confetti {
                constructor() {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height - canvas.height;
                    this.w = Math.random() * 8 + 4;
                    this.h = Math.random() * 4 + 2;
                    this.color = colors[Math.floor(Math.random() * colors.length)];
                    this.speed = Math.random() * 2 + 1;
                    this.velX = Math.random() * 1.5 - 0.75;
                    this.velY = Math.random() * 0.75 + 0.5;
                    this.angle = Math.random() * 360;
                    this.angleSpeed = Math.random() * 0.15 - 0.075;
                    this.opacity = 1;
                }

                update() {
                    this.y += this.speed;
                    this.x += this.velX;
                    this.angle += this.angleSpeed;

                    if (this.y > canvas.height) {
                        this.y = -20;
                        this.x = Math.random() * canvas.width;
                    }

                    if (this.x > canvas.width) {
                        this.x = 0;
                    } else if (this.x < 0) {
                        this.x = canvas.width;
                    }
                }

                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle * Math.PI / 180);
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
                    ctx.restore();
                }
            }

            const pieceCount = window.innerWidth < 768 ? 30 : 100;
            for (let i = 0; i < pieceCount; i++) {
                confettiPieces.push(new Confetti());
            }

            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                confettiPieces.forEach(piece => {
                    piece.update();
                    piece.draw();
                });
                requestAnimationFrame(animate);
            }

            animate();

            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }, 4000);
        }

        window.addEventListener('load', startConfetti);
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        function shareOnWhatsApp() {
            const shareText = "{{whatsappShareMessage}}";
            const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(shareText);
            window.open(whatsappUrl, '_blank');
        }

        function shareOnFacebook() {
            const shareUrl = 'https://www.facebook.com/sharer/sharer.php?u={{joinLink}}&quote={{facebookShareMessage}}';
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }

        document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img');
            images.forEach(function(img) {
                img.loading = 'lazy';
            });

            const yearEl = document.getElementById('current-year');
            if (yearEl) {
                yearEl.textContent = new Date().getFullYear();
            }
        });
    </script>
</body>
</html>`

    }
  })

  console.log('✅ Default template created:', defaultTemplate.name)

  // Minimal Template
  const minimalTemplate = await prisma.thankYouTemplate.upsert({
    where: { name: 'Minimal' },
    update: {},
    create: {
      name: 'Minimal',
      description: 'Simple, text-focused design with essential information only',
      isSystem: true,
      htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - {{webinarTitle}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 650px;
      margin: 60px auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 8px;
      color: #000;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    .details {
      background: #f5f5f5;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .details h2 {
      font-size: 20px;
      margin-bottom: 16px;
    }
    .detail-item {
      margin-bottom: 8px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #000;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-right: 12px;
      margin-bottom: 12px;
    }
    .btn-outline {
      background: white;
      color: #000;
      border: 1px solid #000;
    }
    #countdown {
      font-size: 24px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
      color: #000;
    }
  </style>
</head>
<body>
  <h1>✓ You're In!</h1>
  <p class="subtitle">Thanks for registering, {{attendeeName}}</p>
  
  <div class="details">
    <h2>{{webinarTitle}}</h2>
    <div class="detail-item"><strong>Date:</strong> {{webinarDate}}</div>
    <div class="detail-item"><strong>Time:</strong> {{webinarTime}}</div>
    <div class="detail-item"><strong>Duration:</strong> {{webinarDuration}} minutes</div>
    <div class="detail-item"><strong>Host:</strong> {{hostName}}</div>
  </div>
  
  <div id="countdown"></div>
  
  <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px;">
    <a href="{{googleCalendarLink}}" target="_blank" class="btn btn-outline" style="flex: 1; min-width: 200px;">
      <i class="fab fa-google"></i> Google Calendar
    </a>
    <a href="{{appleCalendarLink}}" download="webinar.ics" class="btn btn-outline" style="flex: 1; min-width: 200px;">
      <i class="fab fa-apple"></i> Apple Calendar
    </a>
  </div>
  <a href="{{joinLink}}" class="btn">Join Webinar</a>
  
  <p style="margin-top: 40px; font-size: 14px; color: #666;">
    A confirmation email has been sent to {{attendeeEmail}}
  </p>
  
  <script>
    {{countdown}}
  </script>
</body>
</html>`
    }
  })

  console.log('✅ Minimal template created:', minimalTemplate.name)

  // Countdown - Starting Soon Template
  const countdownTemplate = await prisma.thankYouTemplate.upsert({
    where: { name: 'Countdown - Starting Soon' },
    update: {},
    create: {
      name: 'Countdown - Starting Soon',
      description: 'Countdown-focused thank you page mirroring the upcoming masterclass design with bonus gift section',
      isSystem: true,
      htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webinar Starts Soon | Help Your Child Love Islam</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b;
            --secondary: #2c7a7b;
            --accent: #d53f8c;
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
            <h1 class="title">How to Help Your Child Love Islam Without Force</h1>
            <p class="subtitle">A transformative masterclass for Muslim mothers</p>
        </div>
    </header>
    
    <!-- Countdown Section -->
    <section class="countdown-section">
        <div class="container">
            <h2 class="countdown-title">Webinar Starts In</h2>
            <div class="webinar-date">
                <i class="fas fa-calendar-alt"></i> Friday, December 15, 2023 at 7:00 PM EST
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
                <div class="video-container">
                    <div class="video-wrapper">
                        <div class="video-placeholder" onclick="playVideo()">
                            <div class="play-button">
                                <i class="fas fa-play"></i>
                            </div>
                            <p class="video-text">Watch Ustadha Ariba Farheen's message about this masterclass</p>
                        </div>
                    </div>
                </div>
                
                <div class="bonus-card">
                    <div class="bonus-image-container">
                        <img src="https://picsum.photos/seed/mothersstorybook/140/140.jpg" alt="Stories of Great Mothers Book" class="bonus-image">
                        <div class="bonus-badge">FREE</div>
                    </div>
                    <div class="bonus-text">
                        <div class="bonus-title">
                            <i class="fas fa-gift"></i> Stories of Great Mothers
                        </div>
                        <p class="bonus-description">
                            Inspiring stories of great mothers from Islamic history who raised extraordinary children. Transform your approach to Islamic parenting.
                        </p>
                        <span class="value-tag">Value: $47 | Yours FREE</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Action Section -->
    <section class="action-section">
        <div class="container">
            <div class="action-content">
                <h2 class="action-title">Don't Miss This Masterclass</h2>
                <p class="action-description">
                    "Whoever guides someone to goodness will have a reward like the one who does it." - Prophet Muhammad (peace be upon him)
                </p>
                <div class="action-buttons">
                    <button class="action-button reminder-button" onclick="setReminder()">
                        <i class="fas fa-bell"></i> Set Reminder
                    </button>
                    <a href="#" class="action-button whatsapp-button" onclick="shareOnWhatsApp(); return false;">
                        <i class="fab fa-whatsapp"></i> Share
                    </a>
                    <a href="#" class="action-button facebook-button" onclick="shareOnFacebook(); return false;">
                        <i class="fab fa-facebook-f"></i> Share
                    </a>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <h3 class="footer-title">Emaan Power Educational Institute</h3>
                <p class="footer-description">
                    Empowering Muslim mothers worldwide. Join 114,000+ students.
                </p>
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>info@emanpower.com</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-globe"></i>
                        <span>www.emanpower.com</span>
                    </div>
                </div>
                <p class="copyright">
                    © 2023 Emaan Power Educational Institute. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
    
    <script>
        // Set the target date for the countdown (example: 7 days from now)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7);
        targetDate.setHours(19, 0, 0, 0); // Set to 7:00 PM
        
        // Countdown Timer
        function updateCountdown() {
            const now = new Date();
            const difference = targetDate - now;
            
            if (difference > 0) {
                // Calculate days, hours, minutes, seconds
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                
                // Update the DOM with leading zeros
                document.getElementById('days').textContent = days.toString().padStart(2, '0');
                document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
                document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
                document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
            } else {
                // When countdown reaches zero
                document.getElementById('days').textContent = '00';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                
                // Update status
                document.querySelector('.webinar-status').innerHTML = '<i class="fas fa-broadcast-tower"></i> LIVE NOW';
                document.querySelector('.countdown-title').textContent = 'Webinar Has Started!';
            }
        }
        
        // Update countdown immediately and then every second
        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        // Play video function
        function playVideo() {
            // In a real implementation, this would play the actual video
            alert('Video would play here. In production, replace this with your actual video player.');
        }
        
        // Share on WhatsApp function
        function shareOnWhatsApp() {
            const shareText = "{{whatsappShareMessage}}";
            const whatsappUrl = \`https://wa.me/?text=\${encodeURIComponent(shareText)}\`;
            window.open(whatsappUrl, '_blank');
        }
        
        // Share on Facebook function
        function shareOnFacebook() {
            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u={{joinLink}}&quote={{facebookShareMessage}}";
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
        
        // Set reminder function
        function setReminder() {
            // Create a calendar event with the webinar details
            const webinarTitle = "Free Class: How to Help Your Child Love Islam";
            const webinarDescription = "A transformative masterclass for Muslim mothers on nurturing a deep love for Islam in their children.";
            
            // Format date for calendar
            const startDate = targetDate.toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");
            const endDate = new Date(targetDate.getTime() + 90 * 60000).toISOString().replace(/-|:|\\.\\d\\d\\d/g, "");
            
            // Create Google Calendar link
            const googleCalendarUrl = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent(webinarTitle)}&dates=\${startDate}/\${endDate}&details=\${encodeURIComponent(webinarDescription)}&location=Online\`;
            
            // Open in new window
            window.open(googleCalendarUrl, '_blank');
        }
    </script>
</body>
</html>`
    }
  })

  console.log('✅ Countdown template created:', countdownTemplate.name)

  // Islamic Mothers Template
  const islamicTemplate = await prisma.thankYouTemplate.upsert({
    where: { name: 'Islamic Mothers - Professional' },
    update: {},
    create: {
      name: 'Islamic Mothers - Professional',
      description: 'Professional Islamic-themed design with bonus gift section, calendar integration, and social sharing',
      isSystem: true,
      htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Registering | {{webinarTitle}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b;
            --secondary: #2c7a7b;
            --accent: #d53f8c;
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
            line-height: 1.6;
            color: var(--dark);
            background-color: var(--light);
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 60px 0;
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
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .institution-name {
            font-size: 0.9rem;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .thank-you {
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 15px;
            background: var(--accent);
            display: inline-block;
            padding: 5px 20px;
            border-radius: 20px;
        }
        
        .title {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 20px;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .subtitle {
            font-size: 1.2rem;
            font-weight: 400;
            margin-bottom: 25px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            opacity: 0.95;
        }
        
        .success-animation {
            margin: 30px 0;
        }
        
        .success-icon {
            font-size: 5rem;
            color: var(--gold);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .bonus-section {
            background-color: var(--white);
            padding: 50px 0;
            border-bottom: 3px solid var(--secondary);
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 2.3rem;
            font-weight: 700;
            color: var(--primary);
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 2px;
        }
        
        .bonus-content {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 40px;
        }
        
        .bonus-text {
            flex: 1;
            min-width: 250px;
        }
        
        .bonus-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .bonus-description {
            font-size: 1.1rem;
            color: var(--dark);
            line-height: 1.7;
        }
        
        .bonus-image {
            flex: 0 0 auto;
            width: 250px;
            height: 250px;
            border-radius: 10px;
            object-fit: cover;
            border: 4px solid var(--secondary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        .next-steps-section {
            padding: 50px 0;
            background-color: var(--light);
        }
        
        .steps-container {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            margin-top: 40px;
        }
        
        .step-card {
            flex: 1;
            min-width: 280px;
            background-color: var(--white);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-top: 5px solid var(--secondary);
        }
        
        .step-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }
        
        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background-color: var(--primary);
            color: var(--white);
            border-radius: 50%;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .step-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .step-description {
            font-size: 1.1rem;
            color: var(--dark);
            line-height: 1.7;
            margin-bottom: 20px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);
            color: var(--white);
            box-shadow: 0 5px 15px rgba(213, 63, 140, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(213, 63, 140, 0.4);
        }
        
        .btn-secondary {
            background-color: var(--secondary);
            color: var(--white);
            box-shadow: 0 5px 15px rgba(44, 122, 123, 0.3);
        }
        
        .btn-secondary:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(44, 122, 123, 0.4);
        }
        
        .social-sharing {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        
        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            color: var(--white);
            font-size: 1.2rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .social-btn:hover {
            transform: translateY(-3px);
        }
        
        .whatsapp-btn {
            background-color: #25D366;
        }
        
        .facebook-btn {
            background-color: #1877F2;
        }
        
        .reward-text {
            font-style: italic;
            color: var(--gray);
            margin-top: 15px;
            font-size: 0.9rem;
        }
        
        .webinar-details {
            background-color: var(--white);
            padding: 30px;
            border-radius: 15px;
            margin-top: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .detail-item i {
            color: var(--secondary);
            margin-right: 15px;
            font-size: 1.3rem;
        }
        
        .footer {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 40px 0;
            text-align: center;
        }
        
        .footer-logo {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .footer-link {
            color: var(--white);
            text-decoration: none;
            transition: opacity 0.3s ease;
        }
        
        .footer-link:hover {
            opacity: 0.8;
        }
        
        .copyright {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
            
            .subtitle {
                font-size: 1.1rem;
            }
            
            .bonus-image {
                width: 200px;
                height: 200px;
            }
            
            .steps-container {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="institution-name">{{hostName}}</div>
            <div class="thank-you">REGISTRATION SUCCESSFUL</div>
            <h1 class="title">Thank You for Registering, {{attendeeName}}!</h1>
            <p class="subtitle">{{webinarDescription}}</p>
            
            <div class="success-animation">
                <i class="fas fa-check-circle success-icon"></i>
            </div>
        </div>
    </header>
    
    <section class="bonus-section">
        <div class="container">
            <h2 class="section-title">Your Exclusive Bonus Gift</h2>
            <div class="bonus-content">
                <div class="bonus-text">
                    <div class="bonus-title">
                        <i class="fas fa-gift"></i> FREE BONUS RESOURCE
                    </div>
                    <p class="bonus-description">As promised, you'll receive an exclusive bonus resource when you attend {{webinarTitle}}. This valuable gift will be sent to your email after the webinar.</p>
                    <p class="bonus-description">Make sure to attend to claim your gift at {{attendeeEmail}}</p>
                </div>
                <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=250&h=250&fit=crop" alt="Bonus Gift" class="bonus-image">
            </div>
        </div>
    </section>
    
    <section class="next-steps-section">
        <div class="container">
            <h2 class="section-title">What To Do Next</h2>
            
            <div class="steps-container">
                <div class="step-card">
                    <div class="step-number">1</div>
                    <h3 class="step-title">Mark Your Calendar</h3>
                    <p class="step-description">Don't miss out on this transformative session. Add it to your calendar now to ensure you don't forget.</p>
                    
                    <div class="webinar-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>{{webinarDate}}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>{{webinarTime}} ({{timeZone}})</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-hourglass-half"></i>
                            <span>Duration: {{webinarDuration}} minutes</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-laptop"></i>
                            <span>Platform: Online</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">
                        <a href="{{googleCalendarLink}}" target="_blank" class="btn btn-primary" style="flex: 1; min-width: 180px; text-decoration: none;">
                            <i class="fab fa-google"></i> Google Calendar
                        </a>
                        <a href="{{appleCalendarLink}}" download="webinar.ics" class="btn btn-primary" style="flex: 1; min-width: 180px; text-decoration: none;">
                            <i class="fab fa-apple"></i> Apple Calendar
                        </a>
                    </div>
                </div>
                
                <div class="step-card">
                    <div class="step-number">2</div>
                    <h3 class="step-title">Share & Inspire Others</h3>
                    <p class="step-description">Help others benefit from this session. Share with friends and family who might be interested.</p>
                    
                    <div class="social-sharing">
                        <a href="https://api.whatsapp.com/send?text=I just registered for {{webinarTitle}}. Join me! {{joinLink}}" target="_blank" class="social-btn whatsapp-btn">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u={{joinLink}}" target="_blank" class="social-btn facebook-btn">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                    </div>
                    
                    <p class="reward-text">"Whoever calls others to guidance will have a reward like that of those who follow it." - Hadith</p>
                    
                    <button class="btn btn-secondary" style="margin-top: 20px; width: 100%;" onclick="copyLink()">
                        <i class="fas fa-copy"></i> Copy Registration Link
                    </button>
                    
                    <a href="{{joinLink}}" class="btn btn-primary" style="margin-top: 15px; width: 100%; display: block;">
                        <i class="fas fa-video"></i> Join Webinar Room
                    </a>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);">
                <div id="countdown" style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 10px;">Loading...</div>
                <p style="color: var(--gray); font-size: 1.1rem;">Until Your Webinar Starts</p>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <div class="container">
            <div class="footer-logo">{{hostName}}</div>
            <div class="footer-links">
                <a href="#" class="footer-link">About Us</a>
                <a href="mailto:{{hostEmail}}" class="footer-link">Contact</a>
                <a href="#" class="footer-link">Privacy Policy</a>
            </div>
            <p class="copyright">© 2025 {{hostName}}. All rights reserved.</p>
            <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 10px;">Registration ID: {{registrationId}}</p>
        </div>
    </footer>
    
    <script>
        {{countdown}}
        
        function copyLink() {
            const link = '{{joinLink}}';
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = link;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Link Copied!';
            button.style.backgroundColor = '#48bb78';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.backgroundColor = '';
            }, 2000);
        }
    </script>
</body>
</html>`
    }
  })

  console.log('✅ Islamic Mothers template created:', islamicTemplate.name)

  // Islamic Mothers - Mobile Optimized Template
  const islamicMobileTemplate = await prisma.thankYouTemplate.upsert({
    where: { name: 'Islamic Mothers - Mobile Optimized' },
    update: {},
    create: {
      name: 'Islamic Mothers - Mobile Optimized',
      description: 'Mobile-first Islamic-themed design with confetti animation, bonus gift section, calendar integration, and social sharing optimized for all devices',
      isSystem: true,
      htmlCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Thank You for Registering | {{webinarTitle}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4a3b6b;
            --secondary: #2c7a7b;
            --accent: #d53f8c;
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
            background-color: var(--light);
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 15px;
        }
        
        /* Confetti Canvas - Mobile Optimized */
        #confetti-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        }
        
        /* Header Section - Compact */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 25px 0;
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
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .thank-you-icon {
            font-size: 2.5rem;
            color: var(--gold);
            margin-bottom: 10px;
            animation: scaleIn 0.8s ease-out;
        }
        
        @keyframes scaleIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .title {
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 10px;
            animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        @keyframes fadeInUp {
            0% {
                transform: translateY(15px);
                opacity: 0;
            }
            100% {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .subtitle {
            font-size: 0.95rem;
            font-weight: 400;
            margin-bottom: 15px;
            opacity: 0.95;
            animation: fadeInUp 0.8s ease-out 0.4s both;
        }
        
        .webinar-datetime {
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 25px;
            padding: 8px 16px;
            margin: 0 auto;
            max-width: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            backdrop-filter: blur(5px);
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .webinar-datetime i {
            color: var(--gold);
            font-size: 1rem;
        }
        
        .webinar-datetime-text {
            font-size: 0.9rem;
            font-weight: 600;
        }
        
        /* Confirmation Section - Compact */
        .confirmation-section {
            background-color: var(--white);
            padding: 20px 0;
            text-align: center;
            animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .confirmation-message {
            font-size: 1rem;
            color: var(--dark);
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .email-info {
            background-color: var(--light);
            border-radius: 8px;
            padding: 16px;
            border-left: 4px solid var(--secondary);
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
            transition: transform 0.3s ease;
        }
        
        .email-info:hover {
            transform: translateY(-2px);
        }
        
        .email-info p {
            font-size: 0.95rem;
            color: var(--dark);
            margin-bottom: 12px;
        }
        
        .email-info p:last-child {
            margin-bottom: 0;
        }
        
        .email-info strong {
            color: var(--primary);
        }
        
        .webinar-link {
            background-color: var(--secondary);
            color: var(--white);
            font-size: 0.95rem;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 12px;
            transition: all 0.3s ease;
            width: 100%;
            max-width: 260px;
        }
        
        .webinar-link:hover {
            background-color: #236364;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(44, 122, 123, 0.3);
        }
        
        /* Bonus Gift Section - Compact */
        .bonus-section {
            background-color: var(--light);
            padding: 20px 0;
        }
        
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--primary);
            text-align: center;
            margin-bottom: 20px;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 2px;
        }
        
        .bonus-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        
        .bonus-image {
            width: 100%;
            max-width: 220px;
            height: auto;
            border-radius: 8px;
            border: 3px solid var(--secondary);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }
        
        .bonus-image:hover {
            transform: scale(1.02);
        }
        
        .bonus-text {
            text-align: center;
        }
        
        .bonus-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .bonus-description {
            font-size: 0.95rem;
            color: var(--dark);
            line-height: 1.6;
            margin-bottom: 12px;
        }
        
        .value-tag {
            display: inline-block;
            background-color: var(--accent);
            color: var(--white);
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.85rem;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(213, 63, 140, 0.7);
            }
            70% {
                box-shadow: 0 0 0 8px rgba(213, 63, 140, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(213, 63, 140, 0);
            }
        }
        
        /* Next Steps Section - Compact */
        .steps-section {
            background-color: var(--white);
            padding: 20px 0;
        }
        
        .steps-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .step-card {
            background-color: var(--light);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border-top: 4px solid var(--secondary);
        }
        
        .step-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        
        .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: var(--primary);
            color: var(--white);
            border-radius: 50%;
            font-size: 1.2rem;
            font-weight: 700;
            margin: 0 auto 12px;
        }
        
        .step-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 12px;
            text-align: center;
        }
        
        .step-description {
            font-size: 0.95rem;
            color: var(--dark);
            line-height: 1.6;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .step-button {
            display: block;
            background: linear-gradient(135deg, var(--accent) 0%, #97266d 100%);
            color: var(--white);
            font-size: 0.95rem;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            border: none;
            width: 100%;
            max-width: 260px;
            margin: 0 auto;
        }
        
        .step-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(213, 63, 140, 0.3);
        }
        
        /* Share Section - Compact */
        .share-section {
            background-color: var(--light);
            padding: 20px 0;
        }
        
        .share-content {
            text-align: center;
        }
        
        .share-description {
            font-size: 0.95rem;
            color: var(--dark);
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .share-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 260px;
            margin: 0 auto;
        }
        
        .share-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            transition: all 0.3s ease;
            width: 100%;
        }
        
        .whatsapp-button {
            background-color: #25D366;
            color: var(--white);
        }
        
        .whatsapp-button:hover {
            background-color: #128C7E;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(37, 211, 102, 0.3);
        }
        
        .facebook-button {
            background-color: #1877F2;
            color: var(--white);
        }
        
        .facebook-button:hover {
            background-color: #0c63d4;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(24, 119, 242, 0.3);
        }
        
        /* Footer Section - Compact */
        .footer {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--white);
            padding: 20px 0;
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
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .footer-content {
            position: relative;
        }
        
        .footer-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 12px;
        }
        
        .footer-description {
            font-size: 0.9rem;
            margin-bottom: 16px;
        }
        
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .contact-item i {
            color: var(--gold);
        }
        
        .copyright {
            font-size: 0.8rem;
            opacity: 0.8;
            margin-top: 12px;
        }
        
        /* Desktop Styles - Applied After Mobile */
        @media (min-width: 768px) {
            .container {
                padding: 0 20px;
            }
            
            .header {
                padding: 35px 0;
            }
            
            .thank-you-icon {
                font-size: 3rem;
                margin-bottom: 15px;
            }
            
            .title {
                font-size: 2rem;
                margin-bottom: 15px;
            }
            
            .subtitle {
                font-size: 1.1rem;
                margin-bottom: 20px;
            }
            
            .webinar-datetime {
                max-width: 320px;
                padding: 10px 20px;
            }
            
            .webinar-datetime-text {
                font-size: 1rem;
            }
            
            .confirmation-section {
                padding: 30px 0;
            }
            
            .confirmation-message {
                font-size: 1.1rem;
                margin-bottom: 25px;
            }
            
            .email-info {
                max-width: 500px;
                margin: 0 auto;
            }
            
            .webinar-link {
                max-width: 300px;
            }
            
            .bonus-section {
                padding: 30px 0;
            }
            
            .section-title {
                font-size: 1.9rem;
                margin-bottom: 30px;
            }
            
            .section-title::after {
                width: 80px;
                height: 3px;
                bottom: -10px;
            }
            
            .bonus-content {
                flex-direction: row;
                gap: 30px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .bonus-image {
                width: 250px;
                height: 250px;
                flex: 0 0 auto;
            }
            
            .bonus-text {
                text-align: left;
                flex: 1;
                min-width: 200px;
            }
            
            .bonus-title {
                justify-content: flex-start;
            }
            
            .steps-section {
                padding: 30px 0;
            }
            
            .steps-container {
                flex-direction: row;
                gap: 25px;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .step-card {
                flex: 1;
                min-width: 250px;
            }
            
            .step-number {
                margin: 0 auto 15px;
            }
            
            .step-title {
                text-align: left;
            }
            
            .step-description {
                text-align: left;
            }
            
            .step-button {
                max-width: 200px;
            }
            
            .share-section {
                padding: 30px 0;
            }
            
            .share-content {
                max-width: 700px;
                margin: 0 auto;
            }
            
            .share-description {
                font-size: 1.1rem;
                margin-bottom: 25px;
            }
            
            .share-buttons {
                flex-direction: row;
                max-width: none;
            }
            
            .footer {
                padding: 30px 0;
            }
            
            .footer-title {
                font-size: 1.5rem;
                margin-bottom: 15px;
            }
            
            .footer-description {
                font-size: 1rem;
                margin-bottom: 20px;
                max-width: 600px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .contact-info {
                flex-direction: row;
                gap: 25px;
                margin-bottom: 15px;
            }
            
            .copyright {
                margin-top: 15px;
            }
        }
    </style>
</head>
<body>
    <!-- Confetti Canvas -->
    <canvas id="confetti-canvas"></canvas>
    
    <!-- Header Section -->
    <header class="header">
        <div class="container">
            <div class="thank-you-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1 class="title">Thank You for Registering!</h1>
            <p class="subtitle">Your spot for {{webinarTitle}} has been reserved successfully</p>
            <div class="webinar-datetime">
                <i class="fas fa-calendar-alt"></i>
                <span class="webinar-datetime-text">{{webinarDate}} at {{webinarTime}} {{timeZone}}</span>
            </div>
        </div>
    </header>
    
    <!-- Confirmation Section -->
    <section class="confirmation-section">
        <div class="container">
            <p class="confirmation-message">
                We're excited to have you join us for this transformative masterclass! You've taken an important step toward helping your child develop a deep and lasting love for Islam.
            </p>
            <div class="email-info">
                <p><strong>Important:</strong> We've sent a confirmation email with all the webinar details to your registered email address. Please check your inbox (and spam folder) to ensure you receive all the updates.</p>
                <a href="{{joinLink}}" class="webinar-link" target="_blank">
                    <i class="fas fa-video"></i> Join the Webinar
                </a>
            </div>
        </div>
    </section>
    
    <!-- Bonus Gift Section -->
    <section class="bonus-section">
        <div class="container">
            <h2 class="section-title">Your Exclusive Bonus Gift</h2>
            <div class="bonus-content">
                <img src="https://picsum.photos/seed/mothersstorybook/300/300.jpg" alt="Stories of Great Mothers Book" class="bonus-image">
                <div class="bonus-text">
                    <div class="bonus-title">
                        <i class="fas fa-gift"></i> Stories of Great Mothers Who Raised Great Men
                    </div>
                    <p class="bonus-description">
                        As promised, you'll receive this inspiring storybook for mothers sharing stories of great mothers who raised great men. This beautifully illustrated book contains timeless wisdom and practical examples that will inspire and guide you on your journey as a Muslim mother.
                    </p>
                    <p class="bonus-description">
                        The book will be sent to your email after attending the masterclass on {{webinarDate}}. It's our gift to you for investing in your child's Islamic education.
                    </p>
                    <span class="value-tag">Value: $47 | Yours FREE</span>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Next Steps Section -->
    <section class="steps-section">
        <div class="container">
            <h2 class="section-title">What To Do Next</h2>
            <div class="steps-container">
                <div class="step-card">
                    <div class="step-number">1</div>
                    <h3 class="step-title">Mark Your Calendar</h3>
                    <p class="step-description">
                        Don't miss this life-changing masterclass on {{webinarDate}} at {{webinarTime}} {{timeZone}}! Add the webinar details to your calendar so you don't forget. Set a reminder 15 minutes before the class starts to ensure you're ready to learn.
                    </p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <a href="{{googleCalendarLink}}" target="_blank" class="step-button" style="text-decoration: none; flex: 1; min-width: 200px;">
                            <i class="fab fa-google"></i> Add to Google Calendar
                        </a>
                        <a href="{{appleCalendarLink}}" download="webinar.ics" class="step-button" style="text-decoration: none; flex: 1; min-width: 200px;">
                            <i class="fab fa-apple"></i> Add to Apple Calendar
                        </a>
                    </div>
                </div>
                
                <div class="step-card">
                    <div class="step-number">2</div>
                    <h3 class="step-title">Share & Earn Rewards</h3>
                    <p class="step-description">
                        The Prophet (peace be upon him) said: "Whoever guides someone to goodness will have a reward like the one who does it." Share this free class with other mothers who might benefit and earn rewards from Allah.
                    </p>
                    <div class="share-buttons">
                        <a href="#" class="share-button whatsapp-button" onclick="shareOnWhatsApp(); return false;">
                            <i class="fab fa-whatsapp"></i> Share on WhatsApp
                        </a>
                        <a href="#" class="share-button facebook-button" onclick="shareOnFacebook(); return false;">
                            <i class="fab fa-facebook-f"></i> Share on Facebook
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Share Section -->
    <section class="share-section">
        <div class="container">
            <div class="share-content">
                <h2 class="section-title">Help Other Mothers Benefit</h2>
                <p class="share-description">
                    Many mothers are struggling with the same challenges you face. By sharing this free masterclass on {{webinarDate}} at {{webinarTime}} {{timeZone}}, you're not just helping them—you're contributing to raising a generation of children who love Islam. The Prophet (peace be upon him) said, "The best among you are those who learn the Quran and teach it." This applies to all Islamic knowledge as well.
                </p>
                <p class="share-description">
                    Imagine the reward you'll receive for helping even one mother strengthen her child's connection with Allah!
                </p>
                <a href="{{joinLink}}" class="webinar-link" target="_blank">
                    <i class="fas fa-share-alt"></i> Share Registration Link
                </a>
            </div>
        </div>
    </section>
    
    <!-- Footer Section -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <h3 class="footer-title">{{hostName}}</h3>
                <p class="footer-description">
                    Empowering Muslim mothers to raise children who love Islam and contribute positively to our society. Join our community of over 114,000 students worldwide.
                </p>
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>{{hostEmail}}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-globe"></i>
                        <span>www.{{hostName}}.com</span>
                    </div>
                </div>
                <p class="copyright">
                    © 2025 {{hostName}}. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
    
    <script>
        // Mobile-optimized Confetti Animation
        function startConfetti() {
            // Only run confetti on devices with sufficient performance
            const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
            if (isLowEndDevice) return;
            
            const canvas = document.getElementById('confetti-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const confettiPieces = [];
            const colors = ['#4a3b6b', '#2c7a7b', '#d53f8c', '#d69e2e', '#ffffff'];
            
            class Confetti {
                constructor() {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height - canvas.height;
                    this.w = Math.random() * 8 + 4;
                    this.h = Math.random() * 4 + 2;
                    this.color = colors[Math.floor(Math.random() * colors.length)];
                    this.speed = Math.random() * 2 + 1;
                    this.velX = Math.random() * 1.5 - 0.75;
                    this.velY = Math.random() * 0.75 + 0.5;
                    this.angle = Math.random() * 360;
                    this.angleSpeed = Math.random() * 0.15 - 0.075;
                    this.opacity = 1;
                }
                
                update() {
                    this.y += this.speed;
                    this.x += this.velX;
                    this.angle += this.angleSpeed;
                    
                    if (this.y > canvas.height) {
                        this.y = -20;
                        this.x = Math.random() * canvas.width;
                    }
                    
                    if (this.x > canvas.width) {
                        this.x = 0;
                    } else if (this.x < 0) {
                        this.x = canvas.width;
                    }
                }
                
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle * Math.PI / 180);
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
                    ctx.restore();
                }
            }
            
            // Create fewer confetti pieces for mobile performance
            const pieceCount = window.innerWidth < 768 ? 30 : 100;
            for (let i = 0; i < pieceCount; i++) {
                confettiPieces.push(new Confetti());
            }
            
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                confettiPieces.forEach(piece => {
                    piece.update();
                    piece.draw();
                });
                
                requestAnimationFrame(animate);
            }
            
            animate();
            
            // Stop confetti after 4 seconds
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = 'none';
            }, 4000);
        }
        
        // Start confetti when page loads
        window.addEventListener('load', startConfetti);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('confetti-canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        // Share on WhatsApp function
        function shareOnWhatsApp() {
            const shareText = "{{whatsappShareMessage}}";
            const whatsappUrl = \`https://wa.me/?text=\${encodeURIComponent(shareText)}\`;
            window.open(whatsappUrl, '_blank');
        }
        
        // Share on Facebook function
        function shareOnFacebook() {
            const shareUrl = "https://www.facebook.com/sharer/sharer.php?u={{joinLink}}&quote={{facebookShareMessage}}";
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
        
        // Optimize images for mobile
        document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                img.loading = 'lazy';
            });
        });
        
        {{countdown}}
    </script>
</body>
</html>`
    }
  })

  console.log('✅ Islamic Mothers Mobile template created:', islamicMobileTemplate.name)

  console.log('🎉 Thank You Templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
