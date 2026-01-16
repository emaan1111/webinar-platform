
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{webinarTitle}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            gold: '#D4AF37',
                            light: '#E2E8F0',
                            dark: '#0B0F19'
                        }
                    },
                    fontFamily: {
                        serif: ['Playfair Display', 'serif'],
                        sans: ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, .font-serif { font-family: 'Playfair Display', serif; }
        .glass-panel {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body class="bg-brand-dark text-white min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
    
    <!-- Background -->
    <div class="absolute inset-0 z-0">
         <div class="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-black/90 z-10"></div>
         <!-- Optional background image if available in user provided code, relying on gradient for now -->
    </div>

    <div class="relative z-10 w-full max-w-3xl flex flex-col items-center text-center">
        
        <!-- Header -->
        <h1 class="text-3xl md:text-5xl font-serif font-bold text-white mb-2 tracking-wide">{{webinarTitle}}</h1>
        <p class="text-xl text-brand-gold/80 mb-10 font-light">You Are Confirmed!</p>

        <!-- Main Card -->
        <div class="glass-panel rounded-2xl p-8 md:p-12 w-full shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-brand-gold/50"></div>
            
            <div class="text-brand-gold text-xs font-bold tracking-[0.2em] uppercase mb-6">Event Starts In</div>

            <!-- Date & Time -->
            <div class="mb-8">
                <div class="text-3xl md:text-5xl font-serif text-white font-bold mb-2" id="webinar-date">
                    {{webinarDate}}
                </div>
                <div class="text-brand-light text-base md:text-xl font-medium opacity-80" id="webinar-time">
                    {{webinarTime}}
                </div>
            </div>

            <!-- Countdown Timer -->
            <!-- The script looks for #countdown inner content or individual IDs -->
            <div id="countdown-wrapper" class="grid grid-cols-4 gap-4 max-w-lg mx-auto mb-10">
                <div class="bg-black/40 rounded-lg p-3 border border-white/5">
                    <div id="days" class="text-3xl md:text-4xl font-bold text-brand-gold font-serif">00</div>
                    <div class="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Days</div>
                </div>
                <div class="bg-black/40 rounded-lg p-3 border border-white/5">
                    <div id="hours" class="text-3xl md:text-4xl font-bold text-brand-gold font-serif">00</div>
                    <div class="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Hours</div>
                </div>
                <div class="bg-black/40 rounded-lg p-3 border border-white/5">
                    <div id="minutes" class="text-3xl md:text-4xl font-bold text-brand-gold font-serif">00</div>
                    <div class="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Mins</div>
                </div>
                <div class="bg-black/40 rounded-lg p-3 border border-white/5">
                    <div id="seconds" class="text-3xl md:text-4xl font-bold text-brand-gold font-serif">00</div>
                    <div class="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Secs</div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col md:flex-row gap-4 justify-center items-center">
                <a href="{{calendarLink}}" target="_blank" class="w-full md:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-3 group">
                    <svg class="w-5 h-5 text-brand-gold group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span>Add to Calendar</span>
                </a>
                
                <a href="#" class="w-full md:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 group">
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    <span>Join WhatsApp Group</span>
                </a>
            </div>

            <div class="mt-8 text-xs text-gray-500 font-light">
                <p>Check your email for access details.</p>
            </div>
        </div>

        <div class="mt-8 opacity-40 text-xs">
            &copy; {{currentYear}} {{organizationName}}.
        </div>
    </div>
    
    {{countdown}}
</body>
</html>`;

async function main() {
  const templateName = 'Rising Heroes Masterclass';
  console.log('Seeding template:', templateName);
  
  const template = await prisma.countdownTemplate.upsert({
    where: { name: templateName },
    update: {
      htmlCode: htmlCode,
      description: 'Custom Gold/Dark template for Rising Heroes',
    },
    create: {
      name: templateName,
      htmlCode: htmlCode,
      description: 'Custom Gold/Dark template for Rising Heroes',
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
