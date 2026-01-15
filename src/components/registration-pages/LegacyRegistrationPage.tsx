
import React, { useState } from 'react';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

const RegistrationModal = dynamic(() => import('./RegistrationModal'), { 
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"><div className="bg-white p-4 rounded-xl shadow-2xl animate-pulse">Loading registration...</div></div>,
  ssr: false 
});

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

// Hardcoded country codes for the modal (passed down)
const countryCodes = [
  { code: '+1', country: 'United States', pattern: /^\d{10}$/ },
  { code: '+44', country: 'United Kingdom', pattern: /^\d{10,11}$/ },
  { code: '+61', country: 'Australia', pattern: /^\d{9}$/ },
  { code: '+1', country: 'Canada', pattern: /^\d{10}$/ },
  { code: '+91', country: 'India', pattern: /^\d{10}$/ },
  // Add other countries as needed...
];

export default function RegistrationPage({ webinar, onRegister }: { webinar: any, onRegister: any }) {
  const [showModal, setShowModal] = useState(false);

  // If we are passing an external handler, use it, otherwise use local modal
  const handleRegisterClick = () => {
    if (onRegister) {
      onRegister();
    } else {
      setShowModal(true);
    }
  };

  // Common CTA button style
  const CTAButton = ({ text = "CLAIM MY FREE PLACE", className = "" }) => (
    <div className={`hero-cta-section ${className}`}>
        <button 
            onClick={handleRegisterClick}
            className="cta-button cursor-pointer border-none"
        >
            {text}
        </button>
        <p className="cta-note">LIMITED AVAILABILITY</p>
    </div>
  );

  return (
    <div className={`font-sans text-gray-900 ${inter.className}`}>
      {showModal && (
        <RegistrationModal 
          onClose={() => setShowModal(false)}
          webinar={webinar}
          countryCodes={countryCodes}
        />
      )}
      <style jsx global>{`
        :root {
            --plum: #3D1F33;
            --plum-deep: #2A1523;
            --gold: #C4A44E;
            --cream: #FAF7F2;
            --white: #FFFFFF;
            --text: #1A1A1A;
        }

        /* Hero */
        .hero {
            padding: 80px 20px 60px;
            background: var(--plum-deep);
            text-align: center;
        }

        .hero-label {
            display: inline-block;
            background: var(--gold);
            color: var(--plum-deep);
            padding: 10px 24px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 32px;
        }

        .hero-pre {
            font-size: 14px;
            color: rgba(255,255,255,0.6);
            margin-bottom: 24px;
        }

        .hero-pre strong {
            color: var(--gold);
        }

        .hero h1 {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 28px;
            font-weight: 600;
            line-height: 1.2;
            color: var(--white);
            margin-bottom: 16px;
        }

        .hero h1 .highlight {
            color: var(--gold);
            display: block;
            font-size: 32px;
            font-weight: 700;
            margin-top: 12px;
            font-style: italic;
        }

        /* The BIG BOLD Without Statement */
        .without-statement {
            margin: 40px 0;
            padding: 32px 20px;
            background: var(--plum);
        }

        .without-statement p {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 22px;
            font-weight: 600;
            color: var(--white);
            line-height: 1.4;
        }

        .hero-cta-section {
            padding: 40px 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .cta-button {
            display: inline-block;
            width: 100%;
            background: var(--gold);
            color: var(--plum-deep);
            padding: 20px 32px;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            text-align: center;
            transition: all 0.3s ease;
            max-width: 400px;
        }

        .cta-button:hover {
            background: #D9BC6A;
            transform: translateY(-2px);
        }

        .cta-note {
            margin-top: 16px;
            font-size: 12px;
            color: rgba(255,255,255,0.5); 
        }
        
        /* Stats Strip */
        .stats-strip {
            display: flex;
            justify-content: center;
            gap: 32px;
            padding: 32px 20px;
            background: var(--plum);
        }

        .stat-item {
            text-align: center;
        }

        .stat-number {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 32px;
            font-weight: 700;
            color: var(--gold);
            line-height: 1;
        }

        .stat-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
        }

        /* Section Styles */
        .section-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .section-header h2 {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 28px;
            font-weight: 600;
            color: var(--plum);
            line-height: 1.2;
            margin-bottom: 12px;
        }

        .section-header h2 span {
            color: var(--gold);
            font-style: italic;
        }

        .section-cta {
             display: flex;
            flex-direction: column;
            align-items: center;
        }
        .section-cta .cta-note {
             color: var(--plum);
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 11px;
        }

        /* Discover */
        .discover {
            padding: 60px 20px;
            background: var(--white);
        }

        .discover-item {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            margin-bottom: 28px;
            padding-bottom: 28px;
            border-bottom: 1px solid #eee;
        }

        .discover-num {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 20px;
            font-weight: 700;
            color: var(--gold);
            flex-shrink: 0;
        }

        /* Pain */
        .pain {
            padding: 60px 20px;
            background: var(--cream);
        }

        .pain-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 20px 0;
            border-bottom: 1px solid rgba(0,0,0,0.08);
        }

        .pain-icon {
            width: 10px;
            height: 10px;
            background: var(--gold);
            flex-shrink: 0;
            margin-top: 6px;
        }

        /* About */
        .about {
            padding: 60px 20px;
            background: var(--white);
        }

        .about-image {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            margin: 0 auto 32px;
            overflow: hidden;
            border: 3px solid var(--gold);
            position: relative;
        }

        .about-label {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--gold);
            margin-bottom: 12px;
            text-align: center;
        }

        .about-name {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 28px;
            font-weight: 600;
            color: var(--plum);
            margin-bottom: 24px;
            text-align: center;
        }

        .about-content .lead {
            font-size: 18px;
            font-weight: 600;
            color: var(--plum);
            margin-bottom: 20px;
            line-height: 1.5;
            text-align: center;
        }

        .about-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin-top: 36px;
            padding-top: 32px;
            border-top: 1px solid #ddd;
        }

        .about-stat {
            text-align: center;
        }

        .about-stat-num {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 32px;
            font-weight: 700;
            color: var(--plum);
            line-height: 1;
        }

        .about-stat-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #888;
            margin-top: 4px;
        }

        /* Testimonials */
        .testimonials {
            padding: 60px 20px;
            background: var(--cream);
        }

        .testimonial-card {
            padding: 28px 0;
            border-top: 2px solid var(--gold);
            margin-bottom: 24px;
        }

        .testimonial-card p {
            font-family: ${playfair.style.fontFamily}, serif;
            font-size: 18px;
            font-style: italic;
            color: var(--text);
            line-height: 1.5;
            margin-bottom: 16px;
        }

        .testimonial-card span {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #888;
        }

         /* Footer */
        footer {
            padding: 32px 20px;
            background: var(--plum-deep);
            text-align: center;
        }

        footer p {
            font-size: 10px;
            color: rgba(255,255,255,0.3);
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        /* Desktop Breakpoints */
        @media (min-width: 768px) {
            .hero { padding: 100px 40px 40px; }
            .hero h1 { font-size: 40px; max-width: 800px; margin: 0 auto; }
            .hero h1 .highlight { font-size: 48px; }
            .without-statement { padding: 48px 40px; }
            .without-statement p { font-size: 32px; max-width: 700px; margin: 0 auto; }
            .stats-strip { gap: 64px; }
            .stat-number { font-size: 44px; }
            .section-header h2 { font-size: 36px; }
            .about-image { width: 160px; height: 160px; }
            .about-name { font-size: 36px; }
            .about-stats { grid-template-columns: repeat(4, 1fr); }
            .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        }

        @media (min-width: 1024px) {
            .hero { padding: 120px 8% 60px; min-height: 100vh; }
            .hero h1 { font-size: 52px; max-width: 1000px; }
            .hero h1 .highlight { font-size: 64px; }
            .without-statement { padding: 56px 8%; }
            .without-statement p { font-size: 40px; max-width: 900px; }
            .stats-strip { gap: 80px; padding: 48px 8%; }
            .stat-number { font-size: 52px; }
            
            .discover { padding: 100px 8%; display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; align-items: start; }
            .discover .section-header { text-align: left; }
            .discover .section-header h2 { font-size: 44px; }

            .pain, .testimonials { padding: 100px 8%; }
            .pain-list { max-width: 650px; margin: 0 auto; }
            .pain-item p { font-size: 18px; }

            .about { padding: 120px 8%; display: grid; grid-template-columns: 1fr 1.3fr; gap: 80px; align-items: center; }
            .about-image { width: 100%; height: auto; aspect-ratio: 1; max-width: 400px; margin: 0; }
            .about-content { text-align: left; }
            .about-label, .about-name, .about-content .lead, .about-content p { text-align: left; }
            .about-name { font-size: 44px; }
            .about-stats { justify-content: flex-start; gap: 48px; text-align: left; }
            .about-stat { text-align: left; }

            .testimonials-grid { max-width: 1100px; margin: 0 auto; }
        }
      `}</style>

      {/* Hero */}
      <section className="hero">
        <div className="hero-label">Free Masterclass</div>

        <p className="hero-pre">From a <strong>former games programmer</strong> who spent 21 years & thousands of kids proving this works:</p>
        
        <h1>
          Discover how parents like you transformed their 'Unmotivated' kids wasting themselves away into PURPOSEFUL COURAGEOUS ONES Who Value Their Time, Their Deen, And Themselves So Deeply That
            <span className="highlight">No Amount Of Peer Pressure Can Shake Them</span>
        </h1>

        {/* ONE BIG BOLD STATEMENT */}
        <div className="without-statement">
            <p>Without Constant Pushing, Lecturing, Or Turning Your Home Into A Battlefield</p>
        </div>

        <CTAButton />
      </section>

      {/* Stats Strip */}
      <div className="stats-strip">
        <div className="stat-item">
            <div className="stat-number">21</div>
            <div className="stat-label">Years</div>
        </div>
        <div className="stat-item">
            <div className="stat-number">100K+</div>
            <div className="stat-label">Children</div>
        </div>
        <div className="stat-item">
            <div className="stat-number">43</div>
            <div className="stat-label">Countries</div>
        </div>
      </div>

      {/* Discover Section */}
      <section className="discover">
        <div>
            <div className="section-header">
                <h2>Inside this masterclass, you'll <span>discover</span></h2>
            </div>
            
            <div className="hidden lg:block mt-8">
                 <div className="hero-cta-section section-cta">
                    <button onClick={handleRegisterClick} className="cta-button cursor-pointer border-none">CLAIM MY FREE PLACE</button>
                    <p className="cta-note">LIMITED AVAILABILITY</p>
                </div>
            </div>
        </div>

        <div className="discover-list">
            <div className="discover-item">
                <span className="discover-num">01</span>
                <p className="discover-text">The hidden reason your child seems "unmotivated" — and why it's not their fault (or yours. Discover the Life-Changing Strategy to Boost Motivation & Passion</p>
            </div>
    <div className="discover-item">
                <span className="discover-num">02</span>
                <p className="discover-text">Discover the Formula To Transform Any Child Into A Strong Self - Confident Muslim, that Most Schools and Teachers are Overlooking

</p>
            </div>
            <div className="discover-item">
                <span className="discover-num">03</span>
                <p className="discover-text">The forgotten method that built the strongest generation of youth in history</p>
            </div>

            <div className="discover-item">
                <span className="discover-num">04</span>
                <p className="discover-text">The "switch" that replaces months of pushing with genuine inner drive</p>
            </div>
     
            <div className="lg:hidden mt-8">
                 <div className="hero-cta-section section-cta">
                    <button onClick={handleRegisterClick} className="cta-button cursor-pointer border-none">CLAIM MY FREE PLACE</button>
                    <p className="cta-note">LIMITED AVAILABILITY</p>
                </div>
            </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="pain">
        <div className="section-header">
            <h2>You're not alone in this</h2>
            <p>If any of this sounds familiar, this masterclass was made for you.</p>
        </div>

        <div className="pain-list">
            {[
                "You see potential in them they don't see in themselves",
                "You're exhausted from being the only one who seems to care",
                "They pray, but their heart doesn't seem to be in it",
                "Nothing you've tried has created lasting change",
                "You worry what happens when you're not there to push them"
            ].map((text, i) => (
                <div key={i} className="pain-item">
                    <div className="pain-icon"></div>
                    <p>{text}</p>
                </div>
            ))}
        </div>

        <div className="hero-cta-section section-cta mt-10">
            <button onClick={handleRegisterClick} className="cta-button cursor-pointer border-none">CLAIM MY FREE PLACE</button>
            <p className="cta-note">LIMITED AVAILABILITY</p>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="about-image">
            <Image 
                src="/images/ariba-profile.jpg" 
                alt="Ustadha Ariba Farheen"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 140px, (max-width: 1024px) 160px, 400px"
            />
        </div>

        <div className="about-content">
            <p className="about-label">Your Host</p>
            <h2 className="about-name">Ustadha Ariba Farheen</h2>
            
            <p className="lead">She started her career as a software engineer and games programmer — yes, she actually built video games.</p>
            
            <p>That unusual background gave her an insider's understanding of exactly how games capture our children's minds… and more importantly, how to redirect that same psychology toward building courage, purpose, and unshakeable iman.</p>
            
            <p>For the past 21 years, Ariba has worked with Muslim families across 43 countries. Her flagship program, Rising Heroes, has transformed over 100,000 children — turning shy kids into confident speakers, unmotivated gamers into self-driven strivers, and anxious youth into young Muslims who stand firm when the world tries to shake them.</p>

            <p>She is the author of books now used in Islamic schools globally and the founder of Eman Power.</p>

            <div className="about-stats">
                {[
                    { num: "21", label: "Years" },
                    { num: "43", label: "Countries" },
                    { num: "100K+", label: "Children" },
                    { num: "10+", label: "Books" }
                ].map((stat, i) => (
                    <div key={i} className="about-stat">
                        <div className="about-stat-num">{stat.num}</div>
                        <div className="about-stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>

             <div className="hero-cta-section section-cta mt-10 lg:items-start lg:pl-0">
                <button onClick={handleRegisterClick} className="cta-button cursor-pointer border-none">CLAIM MY FREE PLACE</button>
                <p className="cta-note lg:text-gray-500">LIMITED AVAILABILITY</p>
            </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-header">
            <h2>From mothers like you</h2>
        </div>

        <div className="testimonials-grid">
            {[
                {
                    text: "It was BRILLIANT and well worth the wait. My kids have very very low self esteem and are not motivated by anything. Worse, I had no idea how to help them out of this.",
                    author: "Saira"
                },
                {
                    text: "Was great eye opener to how I view myself, and how I'm leading my children to view themselves.",
                    author: "Asra Syed"
                },
                {
                    text: "Jazakum Allahu Khairan Kaseera for amazing webinar. I am medical practitioner in Melbourne. MashaAllah Allah has given you such beautiful wisdom and SubhaanAllah He has made that quality of yours for use to others...",
                    author: "Sabina Amin"
                },
                 {
                    text: "Yes, definitely!! Lots of positive perspective of how we can encourage our kids. Some pointers like the 6 pillars of self-esteem is great. I will need to look at it myself and see how I can apply it for myself to build up my own confidence level too!!",
                    author: "Sayeda Begum"
                },
                 {
                    text: "A turning point for me as it has been a major struggle of mine to realize and channel my talents as well as my kids to be able to live our purpose of serving and pleasing Allah.",
                    author: "Hadiza"
                }
            ].map((t, i) => (
                <div key={i} className="testimonial-card">
                    <p>"{t.text}"</p>
                    <span>— {t.author}</span>
                </div>
            ))}
        </div>

        <div className="hero-cta-section section-cta mt-10">
            <button onClick={handleRegisterClick} className="cta-button cursor-pointer border-none">CLAIM MY FREE PLACE</button>
            <p className="cta-note">LIMITED AVAILABILITY</p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© EMAAN POWER</p>
      </footer>
    </div>
  );
}
