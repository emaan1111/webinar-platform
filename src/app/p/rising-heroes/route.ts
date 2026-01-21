import { NextResponse } from 'next/server';

const htmlContent = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rising Heroes - The Movement</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            dark: '#0f172a', // Slate 900
                            card: '#1e293b', // Slate 800
                            primary: '#3b82f6', // Blue 500
                            secondary: '#fbbf24', // Amber 400
                            accent: '#8b5cf6', // Violet 500
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Montserrat', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 5px; }
        
        /* Effects */
        .hero-glow {
            background: radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, rgba(15, 23, 42, 0) 70%);
        }
        .text-glow {
            text-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
        }
        
        /* Gradient Button */
        .btn-gradient {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .btn-gradient:hover {
            box-shadow: 0 0 25px rgba(124, 58, 237, 0.6);
            transform: translateY(-2px);
        }
        .btn-gradient::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0));
            opacity: 0;
            transition: opacity 0.3s;
        }
        .btn-gradient:hover::after {
            opacity: 1;
        }

        /* Glass Cards */
        .glass-card {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s;
        }
        .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
            border-color: rgba(59, 130, 246, 0.3);
        }

        /* Video Container */
        .video-wrapper {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 */
            height: 0;
            border-radius: 1rem;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 50px rgba(37, 99, 235, 0.15);
        }
        .video-wrapper iframe {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
        }

        /* Grid Background Pattern */
        .grid-bg {
            background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }
    </style>
</head>
<body class="bg-brand-dark text-gray-200 font-sans antialiased selection:bg-brand-primary selection:text-white">

    <!-- Navigation -->
    <nav class="fixed w-full z-50 bg-brand-dark/90 backdrop-blur-md border-b border-white/5">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <div class="font-heading font-black text-2xl tracking-tighter text-white">
                RISING<span class="text-brand-primary">HEROES</span><span class="text-brand-secondary">.</span>
            </div>
            <a href="https://emaanpowerclasses.com/f/apply-rh" class="hidden md:inline-block bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-full transition duration-300 border border-white/10">
                Apply Now
            </a>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-32 pb-24 overflow-hidden grid-bg">
        <!-- Glow Effect Behind Text -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] hero-glow pointer-events-none"></div>

        <div class="container mx-auto px-4 text-center relative z-10">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-bold uppercase tracking-wider mb-8">
                <span class="w-2 h-2 rounded-full bg-brand-secondary animate-pulse"></span>
                For Future Leaders Age 9-16
            </div>
            
            <h1 class="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
                DON'T JUST WATCH.<br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent text-glow">START RISING.</span>
            </h1>
            
            <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium">
                See how students like you are leading protests, writing books, and making global impact. No boring lectures. Just action.
            </p>

            <!-- Video Section -->
            <div class="max-w-4xl mx-auto p-1 bg-gradient-to-b from-white/10 to-transparent rounded-2xl">
                <div class="bg-brand-card rounded-xl p-1">
                    <div class="video-wrapper bg-black">
                 


<iframe width="560" height="315" src="https://www.youtube.com/embed/4M1igczVC-g?si=ZtNQ3iseo07QiHe4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


                    </div>
                </div>
            </div>

            <!-- CTA -->
            <div class="mt-12">
                <p class="text-brand-secondary text-sm mb-4 font-bold uppercase tracking-widest">Enrollment Closing Soon</p>
                <a href="https://webinar-platform-production.up.railway.app/f/apply-rh" class="btn-gradient inline-flex items-center justify-center px-10 py-5 text-xl font-heading font-black rounded-xl text-white shadow-2xl hover:shadow-brand-accent/50">
Apply NOW
                    <svg class="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>
        </div>
    </header>

    <!-- Features Section -->
    <section class="py-24 relative bg-brand-dark">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="font-heading text-3xl md:text-4xl font-bold text-white mb-4">NOT A "CLASS". <span class="text-brand-secondary">IT'S A MOVEMENT.</span></h2>
                <p class="text-gray-400 max-w-2xl mx-auto text-lg">Forget boring zoom calls. Rising Heroes make things happen in the real world.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <!-- Card 1 -->
                <div class="glass-card p-8 rounded-2xl text-left">
                    <div class="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
                        <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    </div>
                    <h3 class="font-heading text-xl font-bold text-white mb-3">Lead Real Change</h3>
                    <p class="text-gray-400 leading-relaxed">Organize virtual protests, support orphans, or launch global campaigns. Your voice actually matters here.</p>
                </div>

                <!-- Card 2 -->
                <div class="glass-card p-8 rounded-2xl text-left border-brand-secondary/30">
                    <div class="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
                        <svg class="w-7 h-7 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 class="font-heading text-xl font-bold text-white mb-3">Be a Creator</h3>
                    <p class="text-gray-400 leading-relaxed">Launch a podcast. Publish a book. Start a movement. Stop scrolling through content and start creating it.</p>
                </div>

                <!-- Card 3 -->
                <div class="glass-card p-8 rounded-2xl text-left">
                    <div class="w-14 h-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 border border-violet-500/20">
                        <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 class="font-heading text-xl font-bold text-white mb-3">Global Squad</h3>
                    <p class="text-gray-400 leading-relaxed">Connect with friends from the UK, USA, Australia, and beyond who share your values and your goals.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-24 relative overflow-hidden">
        <!-- Background Elements -->
        <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none"></div>

        <div class="container mx-auto px-4 relative z-10">
            <h2 class="font-heading text-3xl font-bold text-center text-white mb-16">IS IT BORING? <span class="text-brand-secondary">NO WAY.</span></h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <!-- Testimonial 1 -->
                <div class="glass-card p-8 rounded-2xl">
                    <p class="text-lg text-gray-300 font-medium italic mb-6">
                        "I thought I was just a really boring old child. But actually, I'm not a child. <span class="text-brand-secondary font-bold">I am an alien. That's how amazing I am!</span>"
                    </p>
                    <div class="flex items-center gap-4 border-t border-white/5 pt-4">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-secondary to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">S</div>
                        <div>
                            <p class="font-bold text-white">Sophia</p>
                            <p class="text-xs text-gray-500 uppercase tracking-wider">Rising Hero Alumni</p>
                        </div>
                    </div>
                </div>

                <!-- Testimonial 2 -->
                <div class="glass-card p-8 rounded-2xl">
                    <p class="text-lg text-gray-300 font-medium italic mb-6">
                        "Ms. Ariba is not like a normal teacher... she was like a friend instead. <span class="text-blue-400 font-bold">We laughed a lot.</span>"
                    </p>
                    <div class="flex items-center gap-4 border-t border-white/5 pt-4">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg">D</div>
                        <div>
                            <p class="font-bold text-white">Daneen</p>
                            <p class="text-xs text-gray-500 uppercase tracking-wider">Rising Hero Alumni</p>
                        </div>
                    </div>
                </div>

                 <!-- Testimonial 3 -->
                 <div class="glass-card p-8 rounded-2xl md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900">
                    <p class="text-xl text-gray-300 font-medium italic mb-6">
                        "I used to stay all day in my pajamas, playing video games... Now I realized I don't have to wait until I'm older to make a difference."
                    </p>
                    <div class="flex items-center gap-4 border-t border-white/5 pt-4">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg">N</div>
                        <div>
                            <p class="font-bold text-white">Nabeel</p>
                            <p class="text-xs text-gray-500 uppercase tracking-wider">Rising Hero Alumni</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Bottom CTA -->
    <section class="py-24 relative overflow-hidden">
        <div class="absolute inset-0 bg-brand-primary/10"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/95 to-transparent"></div>
        
        <div class="container mx-auto px-4 relative z-10 text-center">
            <h2 class="font-heading text-4xl md:text-5xl font-black text-white mb-8">READY TO LEVEL UP?</h2>
            <div class="max-w-xl mx-auto glass-card p-8 rounded-2xl border border-brand-primary/30 shadow-2xl shadow-brand-primary/20">
                <p class="text-sm mb-4 text-brand-secondary uppercase font-bold tracking-widest animate-pulse">● Enrollment Closing Soon</p>
                <a href="https://webinar-platform-production.up.railway.app/f/apply-rh" class="btn-gradient w-full block py-4 px-8 rounded-xl text-white font-heading font-black text-xl mb-4">
                    APPLY NOW
                </a>
                <p class="text-xs text-gray-400">Join the movement. No risk, all reward.</p>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-brand-dark border-t border-white/5 text-gray-500 py-10 text-center text-sm">
        <div class="container mx-auto px-4">
            <p>&copy; 2024 Emaan Power. All Rights Reserved.</p>
        </div>
    </footer>

</body>
</html>`;

export async function GET() {
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      // Add cache control if needed, but not strictly required
    },
  });
}
