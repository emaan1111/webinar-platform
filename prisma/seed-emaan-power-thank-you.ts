import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Emaan Power Thank You Template...')

  const emaanPowerTemplate = await prisma.thankYouTemplate.upsert({
    where: { name: 'Emaan Power' },
    update: {
      htmlCode: templateHtml,
      description: 'Elegant confirmation page with confetti, calendar buttons, and social sharing with referral links',
    },
    create: {
      name: 'Emaan Power',
      description: 'Elegant confirmation page with confetti, calendar buttons, and social sharing with referral links',
      isSystem: false,
      htmlCode: templateHtml,
    },
  })

  console.log('✅ Created/Updated Emaan Power template:', emaanPowerTemplate.id)
}

const templateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're In! | {{webinarTitle}}</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
    
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

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
                            700: '#be123c',
                            900: '#881337',
                        },
                        gold: {
                            50: '#fffbeb',
                            100: '#fef3c7',
                            200: '#fde68a',
                            300: '#fcd34d',
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
                        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                        'gold': '0 10px 25px -5px rgba(245, 158, 11, 0.3)',
                    }
                }
            }
        }
    </script>

    <style>
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
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: 0.5s;
        }
        .btn-shine:hover::after {
            left: 100%;
        }
        
        .fade-in-up {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
        }

        /* Confetti Styles */
        .confetti {
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: #f43f5e;
            animation: fall linear forwards;
            z-index: 50;
            pointer-events: none;
        }
        
        @keyframes fall {
            to {
                transform: translateY(110vh) rotate(720deg);
            }
        }
    </style>
</head>
<body class="bg-[#faf9f6] text-gray-800 font-sans antialiased overflow-x-hidden min-h-screen flex flex-col relative selection:bg-rose-100 selection:text-rose-900">

    <header class="relative flex-grow flex flex-col items-center justify-start py-8 px-4 overflow-hidden">
        <!-- Elegant Background -->
        <div class="absolute inset-0 bg-gradient-to-b from-rose-50/50 via-white to-royal-50/50 z-0"></div>
        <div class="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-bl from-royal-100/20 to-transparent skew-y-6 transform origin-top-right z-0"></div>
        
        <div class="relative z-10 w-full max-w-md text-center fade-in-up">
            
            <h1 class="text-4xl font-serif font-bold text-royal-950 mb-2 tracking-tight">You're In!</h1>
            <p class="text-sm font-medium text-gray-500 mb-6 uppercase tracking-widest">Registration Confirmed</p>

            <!-- Check Email Box (Glassmorphism) -->
            <div class="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-glass mb-5 text-left flex items-center gap-4 group hover:bg-white/80 transition duration-300">
                <div class="w-10 h-10 rounded-full bg-royal-50 text-royal-600 flex items-center justify-center shrink-0 border border-royal-100 group-hover:scale-110 transition">
                    <i class="fas fa-envelope"></i>
                </div>
                <div>
                    <h3 class="font-serif font-bold text-royal-900 text-sm">Check Your Email</h3>
                    <p class="text-xs text-gray-500 leading-snug mt-0.5">We've sent your login link & workbook.<br>Please check spam/promotions.</p>
                </div>
            </div>

            <!-- Calendar & Webinar Actions -->
            <div class="space-y-3 mb-6">
                <div class="flex gap-3">
                    <a href="{{googleCalendarLink}}" target="_blank" class="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition hover:shadow-md hover:border-royal-200">
                        <i class="fab fa-google text-royal-600 text-sm"></i> Google
                    </a>
                    <a href="{{appleCalendarLink}}" download="webinar.ics" class="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition hover:shadow-md hover:border-royal-200">
                        <i class="fab fa-apple text-gray-800 text-sm"></i> Apple/Outlook
                    </a>
                </div>

                <div class="flex justify-center pt-2 pb-1">
                    <div class="inline-flex items-center gap-2 bg-royal-50 border border-royal-100 px-4 py-1.5 rounded-full text-xs font-bold text-royal-900 shadow-sm">
                        <i class="far fa-clock text-royal-500"></i>
                        <span>{{webinarDateTime}}</span>
                    </div>
                </div>

                <div class="flex justify-center pt-1">
                    <a href="{{countdownLink}}" class="inline-flex items-center bg-white border border-royal-100 text-royal-800 hover:text-royal-900 hover:border-royal-300 font-bold text-xs px-6 py-2.5 rounded-full transition shadow-sm hover:shadow group">
                        Enter Waiting Room <i class="fas fa-arrow-right ml-2 text-[10px] opacity-60 group-hover:translate-x-1 transition"></i>
                    </a>
                </div>
            </div>

            <!-- SHARE SECTION - ELEGANT HIGHLIGHT -->
            <div class="relative w-full mt-2">
                <!-- Background Blur Glow -->
                <div class="absolute inset-0 bg-gradient-to-r from-gold-200/40 to-royal-200/40 blur-2xl rounded-3xl transform scale-90 translate-y-4"></div>
                
                <div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-gold border border-gold-100/50 p-5 relative overflow-hidden text-center w-full transform transition duration-500 hover:translate-y-[-2px]">
                    
                    <!-- Subtle Texture -->
                    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-100/30 to-transparent rounded-full -mr-10 -mt-10 blur-xl"></div>
                    
                    <div class="relative z-10">
                        <div class="inline-flex items-center gap-1.5 bg-gradient-to-r from-gold-50 to-white border border-gold-100 px-3 py-1 rounded-full shadow-sm mb-3">
                            <i class="fas fa-star text-gold-500 text-[10px]"></i>
                            <span class="text-[10px] font-bold text-gold-700 uppercase tracking-wide">Share The Khair</span>
                        </div>
                        
                        <h2 class="text-xl font-serif font-bold text-royal-950 mb-1">Be A Light For Others</h2>
                        
                        <!-- Elegant Quote Block -->
                        <div class="my-4 relative">
                            <i class="fas fa-quote-left absolute -top-2 -left-1 text-gold-200 text-xl"></i>
                            <p class="text-royal-900/80 font-serif italic text-sm leading-relaxed px-4">
                                "Whoever guides someone to goodness will have a reward like the one who does it."
                            </p>
                            <span class="block text-[10px] font-bold text-royal-400 uppercase tracking-widest mt-2">— Prophet (ﷺ)</span>
                        </div>
                        
                        <!-- Referral Actions -->
                        <div class="space-y-3">
                            <!-- Link Box -->
                            <div class="flex items-center bg-royal-50/50 border border-royal-100 rounded-xl p-1 pl-3 shadow-inner">
                                <input type="text" id="refLink" value="{{referralLink}}" class="w-full bg-transparent text-gray-500 font-mono text-xs focus:outline-none truncate" readonly>
                                <button onclick="copyLink()" class="bg-white hover:bg-royal-50 text-royal-700 border border-gray-200 hover:border-royal-200 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition shrink-0 ml-2">
                                    <span id="copyText">Copy</span>
                                </button>
                            </div>

                            <!-- Social Buttons -->
                            <div class="flex gap-2">
                                <a href="https://wa.me/?text={{whatsappShareMessage}}" target="_blank" class="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/20 py-2.5 rounded-xl font-bold text-xs transition">
                                    <i class="fab fa-whatsapp text-sm"></i> WhatsApp
                                </a>
                                <a href="https://www.facebook.com/sharer/sharer.php?u={{referralLink}}" target="_blank" class="flex-1 flex items-center justify-center gap-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/20 py-2.5 rounded-xl font-bold text-xs transition">
                                    <i class="fab fa-facebook-f text-sm"></i> Facebook
                                </a>
                                <a href="mailto:?subject=Join me for {{webinarTitle}}&body={{whatsappShareMessage}}" class="w-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 py-2.5 rounded-xl transition">
                                    <i class="fas fa-envelope text-sm"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </header>

    <!-- Footer -->
    <footer class="bg-white/50 border-t border-gray-100 text-royal-900/30 text-[10px] py-4 text-center z-10 font-medium tracking-wide">
        © 2026 {{hostName}}. All Rights Reserved.
    </footer>

    <script>
        // --- Copy Link Logic ---
        function copyLink() {
            const copyText = document.getElementById("refLink");
            
            // For mobile compatibility
            copyText.select();
            copyText.setSelectionRange(0, 99999); 

            try {
                navigator.clipboard.writeText(copyText.value).then(() => {
                   showCopiedState();
                });
            } catch (err) {
                document.execCommand('copy');
                showCopiedState();
            }
        }

        function showCopiedState() {
            const btn = document.getElementById("copyText");
            const originalText = btn.innerText;
            const linkBox = btn.parentElement;
            
            btn.innerText = "Copied!";
            btn.classList.add("text-emerald-600", "bg-emerald-50", "border-emerald-200");
            btn.classList.remove("text-royal-700");
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove("text-emerald-600", "bg-emerald-50", "border-emerald-200");
                btn.classList.add("text-royal-700");
            }, 2000);
        }

        // --- Elegant Confetti Logic ---
        window.addEventListener('load', () => {
            // Palette: Gold, Royal, Deep Rose, Cream
            const colors = ['#fbbf24', '#d97706', '#4338ca', '#be123c', '#fef3c7'];
            
            for (let i = 0; i < 150; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.top = -20 + 'px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Slower, more elegant fall
                confetti.style.animationDuration = (Math.random() * 4 + 3) + 's'; 
                
                confetti.style.opacity = Math.random() * 0.8 + 0.2;
                confetti.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
                
                // Varied shapes (squares and rectangles)
                const size = Math.random() * 6 + 4 + 'px';
                confetti.style.width = size;
                confetti.style.height = Math.random() > 0.5 ? size : (parseInt(size) * 1.5) + 'px';
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 8000);
            }
        });
    </script>
</body>
</html>`

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
