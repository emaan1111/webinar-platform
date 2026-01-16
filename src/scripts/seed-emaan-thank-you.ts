
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Registered | {{webinarTitle}}</title>
    
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

        /* ===========================
           FLYING CONFETTI STYLES
           =========================== */
        .confetti {
            position: absolute;
            /* Start position */
            top: -20px; 
            width: 6px; /* Small for "Dust" look */
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
    <header class="relative pt-12 pb-24 overflow-hidden bg-gradient-to-br from-royal-950 via-royal-900 to-rose-900">
        <!-- Subtle Pattern -->
        <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 30px 30px;"></div>

        <div class="container mx-auto px-6 relative z-10 text-center">
            <!-- Checkmark Animation -->
            <div class="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center fade-in-up">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-500 opacity-40"></span>
                <div class="relative inline-flex rounded-full bg-royal-800/40 backdrop-blur-sm border-2 border-royal-600/50 flex items-center justify-center w-full h-full shadow-glow">
                    <i class="fas fa-check text-4xl text-gold-400"></i>
                </div>
            </div>

            <!-- Elegant Typography -->
            <h1 class="text-3xl md:text-5xl font-serif font-bold text-white mb-2 leading-tight fade-in-up delay-100 drop-shadow-sm">
                You're <span class="italic text-gold-400">Registered!</span>
            </h1>
            <p class="text-royal-200 text-sm font-light tracking-wide fade-in-up delay-200">
                Your journey to raising unshakeable children begins now.
            </p>
        </div>

        <!-- Bottom Curve -->
        <div class="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 h-12">
            <svg class="relative block w-[calc(100%+1.3px)] h-[50px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" class="fill-gray-50"></path>
            </svg>
        </div>
    </header>

    <!-- MAIN CONTENT (Floating Card Layout) -->
    <main class="px-5 -mt-12 mb-12 relative z-20 max-w-lg mx-auto">
        
        <!-- CARD 1: MAIN DETAILS (Floating) -->
        <div class="bg-white/90 backdrop-blur-xl rounded-2xl shadow-glass p-6 md:p-8 border border-royal-700/30 mb-5 fade-in-up">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
                <!-- Date/Time -->
                <div class="text-left md:text-center flex-1">
                    <div class="text-[10px] font-bold text-royal-600 uppercase tracking-widest mb-1">Event Starts</div>
                    <div class="text-2xl md:text-4xl font-serif text-royal-950 font-bold mb-1 tracking-wide">
                        {{webinarDate}}
                    </div>
                    <div class="text-rose-500 text-base font-medium">
                        {{webinarTime}}
                    </div>
                </div>
                
                <!-- Decorative Divider -->
                <div class="hidden md:block w-px h-12 bg-gray-200"></div>

                <!-- PRIMARY CTA (Royal 800) -->
                <!-- Use countdownLink placeholder to go to lobby -->
                <a href="{{countdownLink}}" class="btn-shine w-full md:w-auto bg-royal-800 hover:bg-royal-700 text-white font-bold text-base md:text-lg py-4 md:py-5 px-8 rounded-full shadow-lg shadow-royal-900/20 transition transform hover:-translate-y-1 border border-royal-600 flex items-center justify-center text-center">
                    ACCESS WEBINAR LOBBY
                </a>
            </div>
            <p class="text-center text-xs text-royal-400 opacity-80 italic">Keep this link safe. Check your email for a backup copy.</p>
        </div>

        <!-- CARD 2: QUICK ACTIONS (Compact Stack) -->
        <div class="bg-white p-5 md:p-8 rounded-2xl shadow-glass border border-royal-700/20 space-y-4 fade-in-up delay-100">
            
            <!-- Action 1: Email -->
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-royal-100 text-royal-800 flex items-center justify-center shrink-0 shadow-sm">
                    <i class="fas fa-envelope text-sm"></i>
                </div>
                <div class="flex-1">
                    <h2 class="text-xl font-serif font-bold text-royal-950">Check Email</h2>
                    <p class="text-gray-500 text-xs">Confirmation sent. Check <strong>Spam Folder</strong>.</p>
                </div>
                <!-- Backup Link - use countdownLink -->
                <a href="{{countdownLink}}" class="text-rose-500 hover:text-rose-700 font-bold text-xs whitespace-nowrap flex items-center gap-1 border-b border-rose-300 pb-0.5">
                    Access Room <i class="fas fa-arrow-right text-[10px]"></i>
                </a>
            </div>

            <!-- Action 2: Calendar -->
            <div class="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div class="w-12 h-12 rounded-full bg-royal-100 text-royal-800 flex items-center justify-center shrink-0 shadow-sm">
                    <i class="fas fa-calendar-check text-sm"></i>
                </div>
                <div class="flex-1">
                    <h2 class="text-xl font-serif font-bold text-royal-950">Add to Calendar</h2>
                    <p class="text-gray-500 text-xs">Don't rely on memory.</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
                <!-- Use calendarLink placeholder -->
                <a href="{{calendarLink}}" target="_blank" class="flex items-center justify-center gap-2 p-3 rounded-lg border border-royal-200 text-royal-800 font-bold text-xs hover:bg-royal-50 transition-all group">
                    <i class="fab fa-google text-base text-royal-700 group-hover:text-royal-800 transition"></i>
                    Google
                </a>
                <a href="{{icsDownload}}" onclick="if(!'{{icsDownload}}'.startsWith('http')) { alert('ICS Download not available yet'); return false; }" class="flex items-center justify-center gap-2 p-3 rounded-lg border border-royal-200 text-royal-800 font-bold text-xs hover:bg-royal-50 transition-all group">
                    <i class="fab fa-apple text-base text-royal-700 group-hover:text-royal-800 transition"></i>
                    .ics
                </a>
            </div>

            <!-- Action 3: Share -->
            <div class="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div class="w-12 h-12 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center shrink-0 shadow-sm">
                    <i class="fas fa-gift text-sm"></i>
                </div>
                <div class="flex-1">
                    <!-- UPDATED HEADING -->
                    <h2 class="text-xl font-serif font-bold text-royal-950">Share & Earn Rewards</h2>
                    <!-- UPDATED TEXT -->
                    <p class="text-rose-500 text-xs leading-tight">Be a light for others! Invite friends to this free Masterclass.</p>
                </div>
            </div>

            <!-- Hadith Box -->
            <div class="bg-royal-900 text-white p-5 rounded-xl relative mb-4 overflow-hidden shadow-inner">
                <div class="relative z-10 flex flex-col items-center text-center">
                    <i class="fas fa-quote-left text-gold-400/50 text-2xl mb-3"></i>
                    <p class="font-serif italic text-base leading-relaxed">
                        "Whoever guides someone to goodness will have a reward like to one who did it."
                    </p>
                    <p class="text-royal-300 text-[10px] font-bold uppercase tracking-widest mt-2">— Prophet Muhammad ﷺ</p>
                </div>
            </div>

            <!-- Socials (WhatsApp & Facebook Only) -->
            <div class="flex justify-center gap-4 mb-4">
                <!-- Use referralLink placeholder -->
                <a href="https://wa.me/?text=I%20just%20registered%20for%20Rising%20Heroes%20Masterclass!%20Join%20me:%20{{referralLink}}" id="share-wa" target="_blank" class="w-12 h-12 rounded-full border-2 border-royal-200 text-royal-800 flex items-center justify-center hover:bg-royal-800 hover:text-white transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg">
                    <i class="fab fa-whatsapp text-xl"></i>
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u={{referralLink}}" id="share-fb" target="_blank" class="w-12 h-12 rounded-full border-2 border-royal-200 text-royal-800 flex items-center justify-center hover:bg-royal-800 hover:text-white transition-all transform hover:-translate-y-1 shadow-md hover:shadow-lg">
                    <i class="fab fa-facebook-f text-xl"></i>
                </a>
            </div>

            <!-- Copy Button -->
            <button onclick="copyPageLink()" class="btn-shine w-full flex items-center justify-center gap-2 bg-royal-800 hover:bg-royal-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-transform transform active:scale-95 text-sm border border-royal-600">
                <i class="far fa-copy"></i>
                Copy Registration Link
            </button>
            <div id="copy-feedback" class="text-center text-green-600 font-bold text-xs mt-2 hidden uppercase tracking-wide">Link Copied Successfully!</div>
        </div>

    </main>

    <!-- FOOTER -->
    <footer class="bg-royal-950 text-royal-200 py-8 border-t border-royal-900">
        <div class="container mx-auto px-6 text-center">
            <!-- Use organizationName placeholder -->
            <h3 class="text-xl font-serif font-bold text-white mb-1">{{organizationName}}</h3>
            <p class="text-xs opacity-60 tracking-widest uppercase">&copy; {{currentYear}} {{organizationName}}. All Rights Reserved.</p>
        </div>
    </footer>

    <!-- JAVASCRIPT -->
    <script>
        // ===========================
        // 1. FLYING CONFETTI LOGIC
        // ===========================
        function fireConfetti() {
            const colors = ['#3730a3', '#e11d48', '#fbbf24', '#ffffff']; 
            const confettiCount = 45; // Number of particles

            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                
                // Position randomly across the top
                confetti.style.left = Math.random() * 100 + '%';
                
                // CSS Variables for Physics (The "Flying" Part)
                // --tx: Random horizontal drift (-150px to 150px)
                // --r: Random rotation (-720deg to 720deg)
                const tx = (Math.random() - 0.5) * 300 + 'px';
                const r = (Math.random() - 0.5) * 1440 + 'deg';
                
                confetti.style.setProperty('--tx', tx);
                confetti.style.setProperty('--r', r);
                
                // Random duration for chaos (2s to 4.5s)
                confetti.style.animationDuration = (Math.random() * 2.5 + 2) + 's'; 
                
                // Random delay
                confetti.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                document.body.appendChild(confetti);

                // Cleanup
                setTimeout(() => {
                    confetti.remove();
                }, 6000);
            }
        }

        // ===========================
        // 2. SHARE LINK LOGIC
        // ===========================
        // Replaced with dynamic logic below but maintaining structure
        // The values are already injected in the HTML above via {{referralLink}}
        
        // ===========================
        // 3. COPY LINK FUNCTION
        // ===========================
        function copyPageLink() {
            // Use placeholder for copy logic
            const text = "{{referralLink}}"; 
            
            // Modern Clipboard API
            if (navigator && navigator.clipboard) {
                 navigator.clipboard.writeText(text).then(() => {
                     const feedback = document.getElementById('copy-feedback');
                     feedback.classList.remove('hidden');
                     setTimeout(() => { feedback.classList.add('hidden'); }, 3000);
                 });
            } else {
                // Fallback
                const dummy = document.createElement('input');
                document.body.appendChild(dummy);
                dummy.value = text;
                dummy.select();
                try {
                    document.execCommand('copy');
                    const feedback = document.getElementById('copy-feedback');
                    feedback.classList.remove('hidden');
                    setTimeout(() => {
                        feedback.classList.add('hidden');
                    }, 3000);
                } catch(e) { console.error(e); }
                document.body.removeChild(dummy);
            }
        }

        // Init
        window.onload = fireConfetti;
    </script>
</body>
</html>`;

async function main() {
  const templateName = 'Emaan Power Thank You';
  console.log('Seeding template:', templateName);
  
  // Note: Using ThankYouTemplate, not CountdownTemplate
  const template = await prisma.thankYouTemplate.upsert({
    where: { name: templateName },
    update: {
      htmlCode: htmlCode,
      description: 'Emaan Power Thank You with Confetti & Rewards',
    },
    create: {
      name: templateName,
      htmlCode: htmlCode,
      description: 'Emaan Power Thank You with Confetti & Rewards',
      isSystem: false,
    },
  });

  console.log('Template created with ID:', template.id);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
