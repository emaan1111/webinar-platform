const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Registered | {{eventTitle}}</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- TAILWIND CONFIG -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        royal: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            200: '#c7d2fe',
                            700: '#4338ca',
                            800: '#3730a3',
                            900: '#312e81',
                            950: '#1e1b4b',
                        },
                        rose: {
                            50: '#fff1f2',
                            100: '#ffe4e6',
                            300: '#fda4af',
                            500: '#f43f5e',
                            600: '#e11d48',
                            900: '#881337',
                        },
                        gold: {
                            100: '#fef3c7',
                            400: '#fbbf24',
                            500: '#f59e0b',
                            600: '#d97706',
                        }
                    },
                    fontFamily: {
                        sans: ['Lato', 'sans-serif'],
                        serif: ['Playfair Display', 'serif'],
                    },
                    boxShadow: {
                        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                        'glow': '0 0 20px rgba(245, 158, 11, 0.4)',
                    }
                }
            }
        }
    </script>

    <style>
        /* Beautiful Animations */
        .fade-in-up {
            animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }

        @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
        }

        /* Shine Effect for Buttons */
        .btn-shine {
            position: relative;
            overflow: hidden;
        }
        .btn-shine::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: 0.6s;
        }
        .btn-shine:hover::after {
            left: 100%;
        }

        /* Flying Confetti */
        .confetti {
            position: absolute;
            top: -20px; 
            width: 6px;
            height: 6px;
            z-index: 0;
            pointer-events: none;
            border-radius: 50%;
            opacity: 0;
        }

        @keyframes fly {
            0% {
                opacity: 1;
                transform: translate(0, 0) rotate(0deg) scale(1);
            }
            20% {
                opacity: 1;
                transform: translate(calc(var(--tx) * 0.2), 50px) rotate(calc(var(--r) * 0.2)) scale(1);
            }
            100% {
                opacity: 0;
                transform: translate(var(--tx), 600px) rotate(var(--r)) scale(0.5);
            }
        }
    </style>
</head>
<body class="bg-gray-50 text-gray-800 font-sans antialiased overflow-x-hidden">

    <!-- HERO (Gradient Background) -->
    <header class="relative pt-12 pb-32 overflow-hidden bg-gradient-to-br from-royal-950 via-royal-900 to-rose-900">
        <!-- Subtle Pattern -->
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 30px 30px;"></div>

        <div class="container mx-auto px-6 relative z-10 text-center">
            <!-- Checkmark Animation -->
            <div class="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center fade-in-up">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-500 opacity-40"></span>
                <div class="relative inline-flex rounded-full bg-royal-800/40 backdrop-blur-sm border-2 border-royal-600/50 flex items-center justify-center w-full h-full shadow-glow">
                    <i class="fas fa-check text-3xl text-gold-400"></i>
                </div>
            </div>

            <!-- Elegant Typography -->
            <h1 class="text-3xl md:text-5xl font-serif font-bold text-white mb-2 leading-tight fade-in-up delay-100 drop-shadow-sm">
                You're <span class="italic text-gold-400">Registered!</span>
            </h1>
            <p class="text-royal-200 text-sm md:text-base font-light tracking-wide fade-in-up delay-200 max-w-2xl mx-auto">
                {{eventTitle}}
            </p>
        </div>

        <!-- Bottom Curve -->
        <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 h-16">
            <svg class="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" class="fill-gray-50"></path>
            </svg>
        </div>
    </header>

    <!-- MAIN CONTENT (Stacked Cards) -->
    <main class="px-5 -mt-20 mb-12 relative z-20 max-w-4xl mx-auto">
        
        <!-- TWO EVENT SCHEDULE SECTION -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 fade-in-up">
            
            <!-- 1. LIVE EVENT CARD -->
            <div class="bg-white rounded-2xl shadow-glass overflow-hidden border-t-4 border-rose-500">
                <div class="p-6">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Part 1</span>
                        <h2 class="font-serif text-lg font-bold text-royal-950">Live Event</h2>
                    </div>
                    
                    <!-- Date/Time Display -->
                    <div class="mb-5">
                        <div class="text-xl font-bold text-gray-800">{{eventDate}}</div>
                        <div class="text-rose-500 font-medium text-sm">{{eventTime}}</div>
                    </div>

                    <!-- Button -->
                    <a href="{{eventZoomLink}}" target="_blank" class="btn-shine block w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3 px-4 rounded-xl text-center transition shadow-md mb-4">
                        Join Live Room
                    </a>

                    <!-- Calendar Links -->
                    <div class="flex justify-center gap-3 border-t border-gray-100 pt-4">
                        <a href="{{googleCalendarLink}}" target="_blank" class="text-xs font-bold text-gray-500 hover:text-royal-600 flex items-center gap-1 transition">
                            <i class="fab fa-google"></i> Google Cal
                        </a>
                        <span class="text-gray-300">|</span>
                        <a href="{{appleCalendarLink}}" class="text-xs font-bold text-gray-500 hover:text-royal-600 flex items-center gap-1 transition">
                            <i class="fab fa-apple"></i> .ics File
                        </a>
                    </div>
                </div>
            </div>

            <!-- 2. WEBINAR CARD -->
            <div class="bg-white rounded-2xl shadow-glass overflow-hidden border-t-4 border-royal-600">
                <div class="p-6">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="bg-royal-100 text-royal-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Part 2</span>
                        <h2 class="font-serif text-lg font-bold text-royal-950">Bonus Webinar</h2>
                    </div>
                    
                    {{#if hasWebinarTime}}
                    <!-- Date/Time Display (when webinar time is selected) -->
                    <div class="mb-5">
                        <div class="text-xl font-bold text-gray-800">{{webinarDate}}</div>
                        <div class="text-royal-600 font-medium text-sm">{{webinarTime}}</div>
                    </div>

                    <!-- Join Button -->
                    <a href="{{webinarRoomLink}}" class="btn-shine block w-full bg-royal-800 hover:bg-royal-700 text-white font-bold text-sm py-3 px-4 rounded-xl text-center transition shadow-md mb-4">
                        Join Webinar Room
                    </a>

                    <!-- Calendar Links -->
                    <div class="flex justify-center gap-3 border-t border-gray-100 pt-4">
                        <a href="{{webinarGoogleCalendarLink}}" target="_blank" class="text-xs font-bold text-gray-500 hover:text-royal-600 flex items-center gap-1 transition">
                            <i class="fab fa-google"></i> Google Cal
                        </a>
                        <span class="text-gray-300">|</span>
                        <a href="{{webinarAppleCalendarLink}}" class="text-xs font-bold text-gray-500 hover:text-royal-600 flex items-center gap-1 transition">
                            <i class="fab fa-apple"></i> .ics File
                        </a>
                    </div>
                    {{/if}}
                    
                    {{#unless hasWebinarTime}}
                    <!-- Webinar Title & Register (when no time selected) -->
                    <div class="mb-5">
                        <div class="text-lg font-bold text-gray-800 mb-2">{{bundledWebinarTitle}}</div>
                        <p class="text-gray-500 text-sm">Register for the bonus parents webinar to complete your enrollment.</p>
                    </div>

                    <!-- Register Button -->
                    <a href="{{webinarRegistrationLink}}" class="btn-shine block w-full bg-royal-800 hover:bg-royal-700 text-white font-bold text-sm py-3 px-4 rounded-xl text-center transition shadow-md mb-4">
                        Register for Webinar
                    </a>
                    {{/unless}}
                </div>
            </div>
        </div>

        <!-- CONFIRMATION & BONUS STACK -->
        <div class="max-w-lg mx-auto space-y-5">
            
            <!-- CHECK EMAIL NOTIFICATION -->
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 fade-in-up delay-100">
                <div class="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <i class="fas fa-envelope text-sm"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 text-sm">Check Your Email</h3>
                    <p class="text-xs text-gray-500">Links for both sessions have been sent. Check Spam.</p>
                </div>
            </div>

            <!-- FREE BOOK BONUS -->
            <div class="bg-white p-5 md:p-6 rounded-2xl shadow-glass border-2 border-gold-400 fade-in-up delay-100 relative overflow-hidden group">
                <!-- Background Decoration -->
                <div class="absolute top-0 right-0 w-40 h-40 bg-gold-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -mr-10 -mt-10 transform transition duration-500 group-hover:scale-110"></div>
                
                <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <!-- Image -->
                    <div class="relative w-24 h-32 shrink-0 self-center md:self-start">
                         <div class="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                           BONUS
                         </div>
                         <img src="https://emaanpowerclasses.com/api/images/serve/1768553796803-q3wwl4kkmucaztblr2pa9o.jpg" alt="Inspiring Stories" class="w-full h-full object-cover rounded-lg shadow-lg border border-gold-200 group-hover:rotate-0 transition duration-300 rotate-[-3deg]">
                    </div>
                    
                    <!-- Text -->
                    <div class="flex-1 text-center md:text-left">
                        <h3 class="font-serif text-lg font-bold text-royal-950 mb-1">Inspiring Stories of Youth</h3>
                        <p class="text-gray-600 text-xs mb-3">Exclusive eBook ($37 Value)</p>
                        
                        <!-- "When they attend" mention -->
                        <div class="inline-flex items-center justify-center md:justify-start gap-2 bg-gold-50 px-3 py-2 rounded-lg border border-gold-200 w-full md:w-auto">
                            <i class="fas fa-gift text-rose-500 text-sm"></i>
                            <span class="text-royal-800 font-bold text-xs">Yours FREE when you attend!</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SHARE SECTION -->
            <div class="bg-white p-5 md:p-8 rounded-2xl shadow-glass border border-royal-700/20 text-center fade-in-up delay-200">
                <h2 class="text-lg font-serif font-bold text-royal-950 mb-4">Share & Earn Rewards</h2>
                
                <!-- Hadith Box -->
                <div class="bg-royal-900 text-white p-4 rounded-xl relative mb-4 text-center">
                    <p class="font-serif italic text-sm leading-relaxed opacity-90">
                        "Whoever guides someone to goodness will have a reward like to one who did it."
                    </p>
                </div>

                <!-- Socials -->
                <div class="flex justify-center gap-4 mb-4">
                    <a href="{{whatsappShareLink}}" id="share-wa" target="_blank" class="w-10 h-10 rounded-full border border-royal-200 text-royal-800 flex items-center justify-center hover:bg-royal-800 hover:text-white transition-all transform hover:-translate-y-1">
                        <i class="fab fa-whatsapp text-lg"></i>
                    </a>
                    <a href="{{facebookShareLink}}" id="share-fb" target="_blank" class="w-10 h-10 rounded-full border border-royal-200 text-royal-800 flex items-center justify-center hover:bg-royal-800 hover:text-white transition-all transform hover:-translate-y-1">
                        <i class="fab fa-facebook-f text-lg"></i>
                    </a>
                </div>

                <!-- Copy Button -->
                <button onclick="copyPageLink()" class="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-8 rounded-full transition-colors text-xs uppercase tracking-wide">
                    <i class="far fa-copy"></i> Copy Registration Link
                </button>
                <div id="copy-feedback" class="text-center text-green-600 font-bold text-xs mt-2 hidden uppercase tracking-wide">Link Copied!</div>
            </div>

        </div>
    </main>

    <!-- FOOTER -->
    <footer class="bg-royal-950 text-royal-200 py-8 border-t border-royal-900">
        <div class="container mx-auto px-6 text-center">
            <h3 class="text-xl font-serif font-bold text-white mb-1">EMAAN POWER</h3>
            <p class="text-xs opacity-60 tracking-widest uppercase">&copy; Emaan Power. All Rights Reserved.</p>
        </div>
    </footer>

    <!-- JAVASCRIPT -->
    <script>
        // Flying Confetti
        function fireConfetti() {
            const colors = ['#3730a3', '#e11d48', '#fbbf24', '#ffffff']; 
            const confettiCount = 45; 

            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                
                confetti.style.left = Math.random() * 100 + '%';
                
                const tx = (Math.random() - 0.5) * 300 + 'px';
                const r = (Math.random() - 0.5) * 1440 + 'deg';
                
                confetti.style.setProperty('--tx', tx);
                confetti.style.setProperty('--r', r);
                
                confetti.style.animationDuration = (Math.random() * 2.5 + 2) + 's'; 
                confetti.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animation = 'fly ' + confetti.style.animationDuration + ' ease-out ' + confetti.style.animationDelay + ' forwards';
                
                document.body.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 6000);
            }
        }

        // Copy Link Function
        const shareUrl = "{{eventRegistrationLink}}"; 
        
        function copyPageLink() {
            navigator.clipboard.writeText(shareUrl).then(() => {
                const feedback = document.getElementById('copy-feedback');
                feedback.classList.remove('hidden');
                setTimeout(() => {
                    feedback.classList.add('hidden');
                }, 3000);
            });
        }

        // Init
        window.onload = fireConfetti;
    </script>
</body>
</html>`;

async function main() {
  try {
    // Check if template already exists
    const existing = await prisma.thankYouTemplate.findFirst({
      where: { name: 'Event Two-Part Registration' }
    });

    if (existing) {
      // Update existing
      const updated = await prisma.thankYouTemplate.update({
        where: { id: existing.id },
        data: {
          htmlCode: templateHtml,
          description: 'Beautiful two-card layout for events with bundled webinars. Shows event and webinar times/links with calendar integration and social sharing.',
          updatedAt: new Date()
        }
      });
      console.log('✅ Template updated:', updated.id);
    } else {
      // Create new
      const created = await prisma.thankYouTemplate.create({
        data: {
          name: 'Event Two-Part Registration',
          description: 'Beautiful two-card layout for events with bundled webinars. Shows event and webinar times/links with calendar integration and social sharing.',
          htmlCode: templateHtml,
          isSystem: true
        }
      });
      console.log('✅ Template created:', created.id);
    }

    // List all templates
    const templates = await prisma.thankYouTemplate.findMany({
      select: { id: true, name: true, isSystem: true }
    });
    console.log('\n📋 All Thank You Templates:');
    templates.forEach(t => console.log(`  - ${t.name} (${t.id}) ${t.isSystem ? '[System]' : ''}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
