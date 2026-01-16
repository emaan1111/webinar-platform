
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{webinarTitle}} | Lobby</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    
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
                }
            }
        }
    </script>

    <style>
        /* Prevent body scroll to keep it compact */
        body { overflow: auto; }
        @media (min-height: 800px) {
            body { overflow: hidden; }
        }
        
        /* Shine Effect */
        .btn-shine::after {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transition: 0.5s;
        }
        .btn-shine:hover::after { left: 100%; }
    </style>
</head>
<body class="bg-royal-50 text-gray-800 font-sans min-h-screen w-full flex items-center justify-center p-4">

    <!-- Main Compact Card -->
    <div class="bg-white w-full max-w-[450px] rounded-2xl shadow-2xl shadow-royal-900/10 overflow-hidden flex flex-col relative z-10">
        
        <!-- Top Accent -->
        <div class="h-1.5 bg-gradient-to-r from-royal-900 via-rose-500 to-gold-500"></div>

        <div class="p-6 flex flex-col gap-4">
            
            <!-- 1. HEADER -->
            <div class="text-center">
                <div class="inline-block bg-royal-100 text-royal-800 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-2">
                    Masterclass Lobby
                </div>
                <!-- Replaced Title Placeholder -->
                <h1 class="text-2xl font-serif font-bold text-royal-950 leading-tight mb-1">
                    {{webinarTitle}}
                </h1>
                <!-- Replaced Date/Time Placeholders -->
                <div class="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                    <span class="bg-gray-100 px-2 py-0.5 rounded text-royal-700">{{webinarDate}}</span>
                    <span class="text-royal-300">&bull;</span>
                    <span>{{webinarTime}}</span>
                </div>
            </div>

            <!-- 2. FREE BOOK BONUS -->
            <div class="flex items-center gap-4 bg-royal-50 border border-royal-100 rounded-xl p-3 shadow-sm relative overflow-hidden group">
                <!-- Image Size Increased -->
                <div class="w-20 h-28 flex-shrink-0 relative shadow-md rounded-sm overflow-hidden transform -rotate-3 group-hover:rotate-0 transition duration-300">
                    <img src="https://emaanpowerclasses.com/api/images/serve/1768553796803-q3wwl4kkmucaztblr2pa9o.jpg" 
                         onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=60'" 
                         class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col justify-center text-left">
                    <span class="text-[10px] text-gold-600 font-bold uppercase tracking-wider leading-none mb-1">Attendee Bonus</span>
                    <h4 class="font-serif font-bold text-royal-900 text-sm leading-tight">Youth who changed History</h4>
                    <p class="text-[10px] text-gray-500 mt-0.5">FREE eBook ($37 Value)</p>
                </div>
            </div>

            <!-- 3. COUNTDOWN -->
            <div class="bg-white rounded-xl border border-royal-100 p-4 shadow-sm">
                <div class="grid grid-cols-4 gap-2 divide-x divide-royal-100">
                    <div class="flex flex-col items-center">
                        <span id="days" class="text-3xl font-serif font-bold text-royal-900 leading-none">00</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Days</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span id="hours" class="text-3xl font-serif font-bold text-royal-900 leading-none">00</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Hrs</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span id="minutes" class="text-3xl font-serif font-bold text-royal-900 leading-none">00</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Mins</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span id="seconds" class="text-3xl font-serif font-bold text-rose-500 leading-none">00</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Secs</span>
                    </div>
                </div>
            </div>

            <!-- 4. CTA BUTTON -->
            <!-- Changed to Link with Join Link Placeholder -->
            <div>
                <a href="{{joinLink}}" id="enterBtn" class="btn-shine flex justify-center items-center w-full bg-gold-500 hover:bg-gold-600 text-royal-900 font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-gold-500/20 transition transform active:scale-95 uppercase tracking-wide">
                    Enter Webinar Room
                </a>
                
                <!-- Added Calendar Link -->
                <a href="{{calendarLink}}" target="_blank" class="block w-full text-center mt-3 text-xs font-medium text-gray-500 hover:text-royal-700 transition-colors">
                    <i class="far fa-calendar-alt mr-1"></i> Add to Calendar
                </a>
            </div>

            <!-- 5. SHARE & REWARDS (UPDATED) -->
            <div class="flex flex-col gap-3">
                
                <!-- NEW MAIN HEADING -->
                <h2 class="text-center font-serif font-bold text-royal-900 text-lg leading-tight">
                    Share & Earn Rewards
                </h2>
                
                <!-- NEW SUBHEADING -->
                <p class="text-center text-gray-500 text-xs leading-snug">
                    Be a light for others! Invite friends to this free Masterclass.
                </p>

                <!-- Hadith Box (Compact) -->
                <div class="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center relative">
                    <i class="fas fa-quote-left text-rose-200 text-xl absolute top-2 left-3"></i>
                    <p class="text-[10px] font-serif italic text-royal-900 leading-relaxed">
                        "Whoever guides someone to goodness will have a reward like one who does it."
                    </p>
                    <p class="text-[9px] text-rose-600 font-bold uppercase tracking-widest mt-1">— The Prophet (ﷺ)</p>
                </div>

                <!-- Buttons -->
                <div class="flex items-center justify-between gap-2">
                    <!-- WhatsApp -->
                    <a href="https://wa.me/?text={{referralLink}}" target="_blank" class="flex-1 bg-green-50 border border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500 text-green-700 rounded-lg py-3 flex flex-col items-center justify-center transition duration-200">
                        <i class="fab fa-whatsapp text-xl mb-1"></i>
                        <span class="text-[11px] font-bold uppercase leading-none">Share</span>
                    </a>
                    <!-- Facebook -->
                    <a href="https://www.facebook.com/sharer/sharer.php?u={{referralLink}}" target="_blank" class="flex-1 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-blue-700 rounded-lg py-3 flex flex-col items-center justify-center transition duration-200">
                        <i class="fab fa-facebook-f text-xl mb-1"></i>
                        <span class="text-[11px] font-bold uppercase leading-none">Share</span>
                    </a>
                    <!-- Copy Link -->
                    <button onclick="copyLink()" class="flex-1 bg-royal-50 border border-royal-100 hover:bg-royal-900 hover:text-white text-royal-900 rounded-lg py-3 flex flex-col items-center justify-center transition duration-200">
                        <!-- Use "far" icon if "fas" fails or specific fa-link -->
                        <i class="fas fa-link text-xl mb-1"></i>
                        <span class="text-[11px] font-bold uppercase leading-none">Copy</span>
                    </button>
                </div>
            </div>

        </div>

        <!-- Tiny Footer -->
        <div class="bg-gray-50 border-t border-gray-100 py-2 text-center">
            <p class="text-[9px] text-gray-400 font-bold tracking-widest uppercase">© Emaan Power</p>
        </div>

    </div>

    <!-- Toast Notification (Compact) -->
    <div id="toast" class="fixed top-4 left-1/2 transform -translate-x-1/2 -translate-y-20 opacity-0 bg-royal-950 text-white px-5 py-3 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center gap-2 text-sm">
        <i class="fas fa-check-circle text-green-400"></i>
        <span class="font-medium">Link copied!</span>
    </div>

    <!-- SCRIPTS -->
    <script>
        // --- 1. COUNTDOWN LOGIC (Handled by System) ---
        // The system will update id="days", id="hours", etc. automatically via {{countdown}} script.

        // --- 2. COPY LINK LOGIC ---       
        function copyLink() {
            // Replaced dummy link with referral link placeholder
            const link = "{{referralLink}}"; 
            
            // Fallback for clipboard API if needed, but modern browsers support writeText
            if (navigator && navigator.clipboard) {
                navigator.clipboard.writeText(link).then(() => {
                    const toast = document.getElementById("toast");
                    toast.classList.remove('-translate-y-20', 'opacity-0');
                    setTimeout(() => { 
                        toast.classList.add('-translate-y-20', 'opacity-0'); 
                    }, 3000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            } else {
                // Fallback for unsafe contexts or older browsers
                const textArea = document.createElement("textarea");
                textArea.value = link;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    const toast = document.getElementById("toast");
                    toast.classList.remove('-translate-y-20', 'opacity-0');
                    setTimeout(() => { 
                        toast.classList.add('-translate-y-20', 'opacity-0'); 
                    }, 3000);
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textArea);
            }
        }
    </script>
    
    <!-- System Countdown Script Injection -->
    {{countdown}}
</body>
</html>`;

async function main() {
  const templateName = 'Emaan Power Lobby';
  console.log('Seeding template:', templateName);
  
  const template = await prisma.countdownTemplate.upsert({
    where: { name: templateName },
    update: {
      htmlCode: htmlCode,
      description: 'Emaan Power Lobby style with Rewards & Bonus',
    },
    create: {
      name: templateName,
      htmlCode: htmlCode,
      description: 'Emaan Power Lobby style with Rewards & Bonus',
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
