
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templateName = 'Emaan Power Lobby Premium';
  const description = 'Premium Parallax "Youth who changed History" Lobby';

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webinar Lobby | {{title}}</title>
    
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
                            950: '#1e1b4b',
                            900: '#312e81',
                        },
                        gold: {
                            400: '#fbbf24',
                            500: '#f59e0b',
                            600: '#d97706',
                            glow: 'rgba(245, 158, 11, 0.5)'
                        }
                    },
                    fontFamily: {
                        sans: ['Lato', 'sans-serif'],
                        serif: ['Playfair Display', 'serif'],
                    },
                    backgroundImage: {
                        'premium-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    }
                }
            }
        }
    </script>

    <style>
        body {
            background: radial-gradient(circle at top right, #4338ca, #1e1b4b);
            background-attachment: fixed;
        }

        .glass-card {
            background: rgba(30, 27, 75, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .text-glow {
            text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }

        .btn-shine {
            position: relative;
            overflow: hidden;
        }
        .btn-shine::after {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
            transform: skewX(-25deg);
            transition: 0.5s;
        }
        .btn-shine:hover::after { left: 150%; }
        
        @keyframes float {
            0% { transform: translateY(0px) rotate(-3deg); }
            50% { transform: translateY(-5px) rotate(-3deg); }
            100% { transform: translateY(0px) rotate(-3deg); }
        }
        .float-anim { animation: float 4s ease-in-out infinite; }
        
        /* Layout Fix for Nested Context */
        .page-container {
             display: flex;
             justify-content: center; 
             align-items: center; 
             min-height: 100vh;
             width: 100%;
             padding: 2.5rem 1rem;
        }
    </style>
</head>
<body class="text-white font-sans min-h-screen overflow-y-auto w-full">
    
    <div class="page-container">

    <!-- Ambient Background Glows -->
    <div class="fixed top-[-10%] right-[-10%] w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-40 z-0"></div>
    <div class="fixed bottom-[-10%] left-[-10%] w-64 h-64 bg-gold-500 rounded-full blur-[100px] opacity-20 z-0"></div>

    <!-- Main Premium Card -->
    <div class="glass-card w-full max-w-md rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative z-10">
        
        <!-- 1. HEADER -->
        <div class="text-center border-b border-white/10 pb-4">
            <div class="inline-block bg-white/10 backdrop-blur-sm text-gold-400 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1 rounded-full mb-3 border border-gold-400/20">
                Masterclass Lobby
            </div>
            <h1 class="text-3xl font-serif font-bold text-white leading-tight mb-2 text-glow">
                {{title}}
            </h1>
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center justify-center gap-3 text-sm text-gray-300 font-light tracking-wide">
                    <span class="flex items-center gap-1"><i class="far fa-calendar text-gold-500"></i> {{date}}</span>
                    <span class="w-1 h-1 bg-gold-500 rounded-full"></span>
                    <span class="flex items-center gap-1"><i class="far fa-clock text-gold-500"></i> {{time}}</span>
                </div>
                <!-- ADD TO CALENDAR -->
                <a href="{{calendarLink}}" target="_blank" class="flex items-center gap-2 text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors text-gold-400 font-bold uppercase tracking-wider">
                    <i class="far fa-calendar-plus"></i> Add to Calendar
                </a>
            </div>
        </div>

        <!-- 2. FREE BOOK (Elevated) -->
        <div class="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:bg-white/10 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
            
            <!-- Book Image with Glow & Animation -->
            <div class="w-20 h-28 flex-shrink-0 relative float-anim shadow-2xl rounded-sm overflow-hidden border border-white/20">
                <img src="https://emaanpowerclasses.com/api/images/serve/1768553796803-q3wwl4kkmucaztblr2pa9o.jpg" 
                     onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=60'" 
                     class="w-full h-full object-cover">
            </div>
            
            <div class="flex flex-col justify-center relative z-10">
                <span class="text-[10px] text-gold-400 font-bold uppercase tracking-wider leading-none mb-1">Exclusive Bonus</span>
                <h4 class="font-serif font-bold text-white text-sm leading-tight mb-1">Youth who changed History</h4>
                <p class="text-[10px] text-gray-400">FREE eBook for Attendees</p>
            </div>
        </div>

        <!-- 3. COUNTDOWN (Modern & Dark) -->
        <div class="grid grid-cols-4 gap-3">
            <div class="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-2 text-center">
                <span id="days" class="text-3xl font-serif font-bold text-white block leading-none">00</span>
                <span class="text-[9px] uppercase tracking-widest text-gray-500 mt-1 block">Days</span>
            </div>
            <div class="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-2 text-center">
                <span id="hours" class="text-3xl font-serif font-bold text-white block leading-none">00</span>
                <span class="text-[9px] uppercase tracking-widest text-gray-500 mt-1 block">Hrs</span>
            </div>
            <div class="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-2 text-center">
                <span id="minutes" class="text-3xl font-serif font-bold text-white block leading-none">00</span>
                <span class="text-[9px] uppercase tracking-widest text-gray-500 mt-1 block">Mins</span>
            </div>
            <div class="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-2 text-center border-gold-500/50">
                <span id="seconds" class="text-3xl font-serif font-bold text-gold-400 block leading-none drop-shadow-md">00</span>
                <span class="text-[9px] uppercase tracking-widest text-gold-400/70 mt-1 block">Secs</span>
            </div>
        </div>

        <!-- 4. CTA BUTTON (Premium Glow) -->
        <button id="enterBtn" onclick="enterWebinarRoom()" class="btn-shine group w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-royal-950 font-bold text-sm py-4 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition transform hover:-translate-y-1 uppercase tracking-widest border border-white/10">
            <span class="relative z-10 flex items-center justify-center gap-2">
                Enter Webinar Room <i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition transform translate-x-[-10px] group-hover:translate-x-0"></i>
            </span>
        </button>

        <!-- 5. SHARE SECTION (Elegant) -->
        <div class="flex flex-col gap-4">
            <div class="text-center pt-2">
                <h2 class="text-xl font-serif font-bold text-white">Share & Earn Rewards</h2>
                <p class="text-gray-400 text-xs mt-1">Be a light for others! Invite your friends.</p>
            </div>

            <!-- Hadith (Dark & Elegant) -->
            <div class="bg-white/5 border border-white/5 rounded-xl p-4 text-center relative">
                <i class="fas fa-quote-left text-gold-500/20 text-3xl absolute top-3 left-4"></i>
                <p class="text-sm font-serif italic text-gray-300 leading-relaxed relative z-10 px-2">
                    "Whoever guides someone to goodness will have a reward like one who does it."
                </p>
                <p class="text-[10px] text-gold-500 font-bold uppercase tracking-widest mt-2">— The Prophet (ﷺ)</p>
            </div>

            <!-- Buttons (Outline/Glass Style) -->
            <div class="grid grid-cols-3 gap-3">
                <a href="https://wa.me/?text=Join%20this%20masterclass!%20{{referralLink}}" target="_blank" class="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400 text-gray-300 rounded-lg py-3 transition duration-300">
                    <i class="fab fa-whatsapp text-lg"></i>
                    <span class="text-[10px] uppercase font-bold tracking-wider">WhatsApp</span>
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u={{referralLink}}" target="_blank" class="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 text-gray-300 rounded-lg py-3 transition duration-300">
                    <i class="fab fa-facebook-f text-lg"></i>
                    <span class="text-[10px] uppercase font-bold tracking-wider">Facebook</span>
                </a>
                <button onclick="copyLink()" class="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg py-3 transition duration-300">
                    <i class="fas fa-link text-lg"></i>
                    <span class="text-[10px] uppercase font-bold tracking-wider">Copy</span>
                </button>
            </div>
        </div>

    </div>

    <!-- Elegant Toast Notification -->
    <div id="toast" class="fixed top-6 left-1/2 transform -translate-x-1/2 -translate-y-20 opacity-0 bg-white/90 backdrop-blur-md text-royal-950 px-6 py-3 rounded-full shadow-2xl transition-all duration-500 z-50 flex items-center gap-3 text-xs font-bold uppercase tracking-wide border border-white/20">
        <i class="fas fa-check-circle text-green-600 text-lg"></i>
        <span>Link copied to clipboard</span>
    </div>

    <!-- SCRIPTS -->
    <script>
        // --- 1. COUNTDOWN LOGIC ---
        // Dynamically injected Target Date
        const targetDateStr = "{{targetDate}}"; 
        
        let countDownDate;
        // Check if targetDate was replaced correctly (not containing brackets)
        if (targetDateStr && !targetDateStr.includes('{{') && !isNaN(new Date(targetDateStr).getTime())) {
            countDownDate = new Date(targetDateStr).getTime();
        } else {
             // Fallback to 24h if replacement failed
            console.warn("Target date invalid or not replaced:", targetDateStr);
            countDownDate = new Date().getTime() + (24 * 60 * 60 * 1000);
        }

        const x = setInterval(function() {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            if (distance < 0) {
                 // Timer finished
                document.getElementById("days").innerText = "00";
                document.getElementById("hours").innerText = "00";
                document.getElementById("minutes").innerText = "00";
                document.getElementById("seconds").innerText = "00";
                
                clearInterval(x);
                const btn = document.getElementById("enterBtn");
                btn.innerHTML = "<span class='flex items-center justify-center gap-2'><i class='fas fa-play'></i> JOIN LIVE NOW</span>";
                btn.classList.remove('from-gold-500', 'to-gold-600', 'shadow-[0_0_30px_rgba(245,158,11,0.4)]');
                btn.classList.add('from-green-500', 'to-green-600', 'shadow-[0_0_30px_rgba(34,197,94,0.4)]');
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("days").innerText = days < 10 ? "0" + days : days;
            document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
            document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
            document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
        }, 1000);


        // --- 2. BUTTON LOGIC ---
        function enterWebinarRoom() {
            // Check if countdown is finished (distance < 0 in interval)
            // Since x interval updates every second, we can check date directly.
            const now = new Date().getTime();
            // Allow entry 15 mins before
            // But strict requirement says "not time yet". 
            // The interval above sets button to green when distance < 0.
            // We can check if dynamic button change happened or check date.
            
            // Re-calculate distance
            const targetDateStr = "{{targetDate}}"; 
            const countDownDate = targetDateStr ? new Date(targetDateStr).getTime() : new Date().getTime() + (24 * 60 * 60 * 1000); 
            const distance = countDownDate - now;
            
            // Allow 5 minutes early entry window, or strictly wait for 0?
            // User complained "able to immediately go... even though its not time yet"
            // So we block strict.
            if (distance > 0) {
                alert("The webinar hasn't started yet. Please wait for the countdown to finish.");
                return;
            }
            
            // Updated with dynamic link
            window.location.href = "{{joinLink}}";
        }

        // --- 3. COPY LINK LOGIC ---       
        function copyLink() {
            const referralLink = "{{referralLink}}"; 
            navigator.clipboard.writeText(referralLink).then(() => {
                const toast = document.getElementById("toast");
                toast.classList.remove('-translate-y-20', 'opacity-0');
                setTimeout(() => { 
                    toast.classList.add('-translate-y-20', 'opacity-0'); 
                }, 3000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert("Failed to copy link. Please manually copy: " + referralLink);
            });
        }
    </script>
</body>
</html>`;

  // Upsert the template
  const template = await prisma.countdownTemplate.upsert({
    where: { name: templateName },
    update: {
      htmlCode: htmlContent,
      description,
    },
    create: {
      name: templateName,
      description,
      htmlCode: htmlContent,
      thumbnail: 'https://placehold.co/600x400/2a2a2a/f59e0b?text=Premium+Lobby',
    },
  });

  console.log(`✅ Template seeded: ${template.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
