'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  // Refs for GSAP animations
  const heroRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingBadgesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const workflowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animations
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo(badgeRef.current,
          { opacity: 0, y: 30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8 }
        )
        .fromTo(headingRef.current,
          { opacity: 0, y: 60, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1 },
          '-=0.4'
        )
        .fromTo(subtextRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        )
        .fromTo(ctaRef.current,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=0.4'
        );

      // Floating badges animation
      if (floatingBadgesRef.current) {
        const badges = floatingBadgesRef.current.querySelectorAll('.floating-badge');
        gsap.fromTo(badges,
          { opacity: 0, scale: 0.6, y: 50, rotateZ: -5 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateZ: 0,
            duration: 0.9,
            stagger: 0.2,
            delay: 0.8,
            ease: 'back.out(1.7)'
          }
        );

        // Continuous floating animation - more noticeable
        badges.forEach((badge, i) => {
          gsap.to(badge, {
            y: '+=15',
            rotateZ: i % 2 === 0 ? '+=2' : '-=2',
            duration: 2.5 + i * 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: i * 0.3
          });
        });
      }

      // Feature cards scroll animation - More dramatic, repeatable
      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
          gsap.fromTo(card,
            { opacity: 0, y: 100, scale: 0.85, rotateX: 10 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                end: 'top 50%',
                toggleActions: 'play reverse play reverse',
                // Smooth animation that responds to scroll
              }
            }
          );
        });

        // Section header animation
        const sectionHeader = featuresRef.current.querySelector('h2');
        if (sectionHeader) {
          gsap.fromTo(sectionHeader,
            { opacity: 0, y: 50, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionHeader,
                start: 'top 80%',
                toggleActions: 'play reverse play reverse'
              }
            }
          );
        }
      }

      // Workflow steps animation - More dramatic, staggered, repeatable
      if (workflowRef.current) {
        const steps = workflowRef.current.querySelectorAll('.workflow-step');
        steps.forEach((step, index) => {
          gsap.fromTo(step,
            { opacity: 0, x: index % 2 === 0 ? -80 : 80, scale: 0.8, rotateY: index % 2 === 0 ? -15 : 15 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              rotateY: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: step,
                start: 'top 80%',
                end: 'top 50%',
                toggleActions: 'play reverse play reverse',
              }
            }
          );
        });

        // Workflow section header
        const workflowHeader = workflowRef.current.querySelector('h2');
        if (workflowHeader) {
          gsap.fromTo(workflowHeader,
            { opacity: 0, y: 40, letterSpacing: '0.1em' },
            {
              opacity: 1,
              y: 0,
              letterSpacing: '0em',
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: workflowHeader,
                start: 'top 85%',
                toggleActions: 'play reverse play reverse'
              }
            }
          );
        }
      }

      // CTA section animation
      const ctaSection = document.querySelector('#cta');
      if (ctaSection) {
        gsap.fromTo(ctaSection.querySelector('div'),
          { opacity: 0, y: 80, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ctaSection,
              start: 'top 75%',
              toggleActions: 'play reverse play reverse'
            }
          }
        );
      }

      // Companies section parallax effect
      const companiesSection = document.querySelector('section.bg-white');
      if (companiesSection) {
        gsap.fromTo(companiesSection.querySelectorAll('div > div'),
          { opacity: 0, y: 30 },
          {
            opacity: 0.3, // Keep original opacity
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: companiesSection,
              start: 'top 80%',
              toggleActions: 'play reverse play reverse'
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const isLoggedIn = !isLoading && user;

  return (
    <div className="bg-[#FDFCFB] text-slate-900 overflow-x-hidden min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="fixed top-6 left-0 right-0 z-50 px-4">
        <div className="max-w-[1100px] mx-auto">
          <header style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.4)' }} className="flex items-center justify-between px-8 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Logo size="sm" href="/" />
            <nav className="hidden md:flex items-center gap-10">
              <a className="text-slate-600 hover:text-[#850000] text-sm font-semibold transition-colors" href="#features">Features</a>
              <a className="text-slate-600 hover:text-[#850000] text-sm font-semibold transition-colors" href="#workflow">Workflow</a>
              <a className="text-slate-600 hover:text-[#850000] text-sm font-semibold transition-colors" href="#cta">Enterprise</a>
            </nav>
            <div className="hidden md:flex items-center gap-6">
              {isLoggedIn ? (
                <Link href="/dashboard" className="bg-[#850000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-slate-600 hover:text-[#850000] text-sm font-bold transition-colors">Login</Link>
                  <Link href="/auth/signup" className="bg-[#850000] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    Get Started
                  </Link>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </header>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-lg flex flex-col items-center justify-center text-lg gap-8 md:hidden">
          <a onClick={() => setMobileMenuOpen(false)} href="#features" className="font-semibold text-xl">Features</a>
          <a onClick={() => setMobileMenuOpen(false)} href="#workflow" className="font-semibold text-xl">Workflow</a>
          <a onClick={() => setMobileMenuOpen(false)} href="#cta" className="font-semibold text-xl">Enterprise</a>
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-10 py-4 bg-[#850000] text-white font-bold rounded-xl text-lg">Dashboard</Link>
          ) : (
            <Link href="/auth/signup" className="px-10 py-4 bg-[#850000] text-white font-bold rounded-xl text-lg">Get Started</Link>
          )}
          <button onClick={() => setMobileMenuOpen(false)} className="mt-4 p-4 bg-slate-100 rounded-full">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section ref={heroRef} className="relative pt-44 pb-0 overflow-hidden">
          <div className="max-w-[1100px] mx-auto px-4 text-center">
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#850000]/5 text-[#850000] text-xs font-bold uppercase tracking-widest mb-8" style={{ border: '1px solid rgba(133, 0, 0, 0.1)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#850000] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#850000]"></span>
              </span>
              Now with real-time chats
            </div>
            <h1 ref={headingRef} className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8 max-w-4xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Scheduling made <span className="italic text-[#850000] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>effortless</span> for high-performers.
            </h1>
            <p ref={subtextRef} className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12">
              The all-in-one platform for seamless appointments. Reclaim your focus and let <span className="text-[#850000] font-bold">Book&amp;Call</span> handle the logistics.
            </p>
            <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
              <Link href="/auth/signup" className="w-full sm:w-auto min-w-[200px] bg-[#850000] text-white text-lg font-bold h-16 px-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center">
                Start Free
              </Link>
            </div>

            {/* Calendar Preview with Floating Badges */}
            <div ref={floatingBadgesRef} className="relative w-full max-w-4xl mx-auto mt-10">
              {/* Floating Badge - Left Top */}
              <div className="floating-badge absolute -top-6 left-4 md:left-8 bg-white rounded-2xl shadow-xl p-4 z-30 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Meeting Confirmed</p>
                  <p className="text-xs text-slate-500">Just now</p>
                </div>
              </div>

              {/* Floating Badge - Right Top */}
              <div className="floating-badge absolute -top-4 right-4 md:right-8 bg-gradient-to-br from-[#850000] to-[#5a0000] rounded-2xl shadow-xl p-4 z-30 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">trending_up</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">+32% Bookings</p>
                  <p className="text-xs text-white/70">This week</p>
                </div>
              </div>

              {/* Floating Badge - Left Bottom */}
              <div className="floating-badge absolute bottom-36 left-4 md:left-8 bg-slate-900 rounded-2xl shadow-xl p-4 z-30 hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-white">100% Free Forever*</span>
              </div>

              {/* Calendar Modal */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderBottom: 'none'
                }}
                className="rounded-t-3xl p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] pb-32 translate-y-12"
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(226, 232, 240, 1)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400">person</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">January 2026</p>
                      <p className="text-xs text-slate-400">Your Schedule</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <span className="material-symbols-outlined text-slate-500 text-lg">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <span className="material-symbols-outlined text-slate-500 text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">{day}</div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for days before month starts (Jan 2026 starts on Thursday) */}
                  {[...Array(4)].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}

                  {/* Days of the month */}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const isSelected = day === 14;
                    const hasEvent = [5, 8, 12, 18, 22, 27].includes(day);

                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all cursor-pointer ${isSelected
                          ? 'bg-[#850000] text-white shadow-[4px_4px_0px_0px_#850000]'
                          : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700'
                          }`}
                        style={!isSelected ? { border: '1px solid rgba(226, 232, 240, 0.8)' } : {}}
                      >
                        <span>{day}</span>
                        {hasEvent && !isSelected && (
                          <div className="w-1 h-1 rounded-full bg-[#850000] mt-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Companies Section */}
        <section className="bg-white py-16 relative z-10" style={{ borderTop: '1px solid rgba(226, 232, 240, 1)', borderBottom: '1px solid rgba(226, 232, 240, 1)' }}>
          <div className="max-w-[1100px] mx-auto px-4">
            <p className="text-center text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-12">Empowering teams at world-class companies</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 grayscale contrast-150">
              <div className="h-7 w-28 bg-slate-900 rounded-sm"></div>
              <div className="h-7 w-32 bg-slate-900 rounded-sm"></div>
              <div className="h-7 w-24 bg-slate-900 rounded-sm"></div>
              <div className="h-7 w-36 bg-slate-900 rounded-sm"></div>
              <div className="h-7 w-28 bg-slate-900 rounded-sm"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} id="features" className="py-32 bg-[#FDFCFB]">
          <div className="max-w-[1100px] mx-auto px-4">
            <div className="flex flex-col gap-4 text-center items-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Powerful <span className="italic text-[#850000]" style={{ fontFamily: "'Playfair Display', serif" }}>Features</span></h2>
              <p className="text-slate-500 text-lg max-w-2xl">The most comprehensive toolset for managing professional availability.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.4)' }} className="feature-card p-10 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 hover:translate-y-[-4px] transition-transform">
                <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="material-symbols-outlined text-3xl">language</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold">Smart Timezones</h3>
                  <p className="text-slate-500 leading-relaxed">Automatic guest timezone detection ensures no one ever shows up early—or late.</p>
                </div>
              </div>
              {/* Feature Card 2 */}
              <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.4)' }} className="feature-card p-10 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 hover:translate-y-[-4px] transition-transform">
                <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="material-symbols-outlined text-3xl">brush</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold">Multiple Events</h3>
                  <p className="text-slate-500 leading-relaxed">Your events, your way. Create and manage multiple events with ease.</p>
                </div>
              </div>
              {/* Feature Card 3 */}
              <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.4)' }} className="feature-card p-10 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 hover:translate-y-[-4px] transition-transform">
                <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="material-symbols-outlined text-3xl">sync_alt</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold">Omni-Sync</h3>
                  <p className="text-slate-500 leading-relaxed">Sync Google Calendar, Notion, and other calendars simultaneously to prevent any scheduling conflicts.</p>
                </div>
              </div>
              {/* Feature Card 4 */}
              <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.4)' }} className="feature-card p-10 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 hover:translate-y-[-4px] transition-transform">
                <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="material-symbols-outlined text-3xl">payments</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-bold">Instant Payments</h3>
                  <p className="text-slate-500 leading-relaxed">Collect payments via your own QR before the meeting starts. Professional and secure.</p>
                </div>
              </div>
              {/* Feature Card 5 - Wide */}
              <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.4)' }} className="feature-card p-10 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 hover:translate-y-[-4px] transition-transform lg:col-span-2">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-[#850000] flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-3xl">psychology</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Smart Buffer Management</h3>
                    <p className="text-slate-500 leading-relaxed">Smart scheduling learns your work patterns and suggests buffer times to prevent burnout and ensure you always have time to prep between calls.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section ref={workflowRef} id="workflow" className="py-32 bg-white relative">
          <div className="max-w-[1100px] mx-auto px-4">
            <div style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(226, 232, 240, 1)' }} className="rounded-[2.5rem] p-12 md:p-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-4xl font-extrabold text-center mb-20 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>The Three-Step <span className="italic text-[#850000]" style={{ fontFamily: "'Playfair Display', serif" }}>Workflow</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                <div className="workflow-step flex flex-col items-center text-center gap-6 group">
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-[#850000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-[#850000] group-hover:text-white transition-all" style={{ border: '2px solid #850000' }}>1</div>
                  <h4 className="text-2xl font-bold">Integrate</h4>
                  <p className="text-slate-500 font-medium">Connect your favorite calendar providers.</p>
                </div>
                <div className="workflow-step flex flex-col items-center text-center gap-6 group">
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-[#850000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-[#850000] group-hover:text-white transition-all" style={{ border: '2px solid #850000' }}>2</div>
                  <h4 className="text-2xl font-bold">Configure</h4>
                  <p className="text-slate-500 font-medium">Define your boundaries, working hours, and custom meeting types.</p>
                </div>
                <div className="workflow-step flex flex-col items-center text-center gap-6 group">
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl font-black text-[#850000] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-[#850000] group-hover:text-white transition-all" style={{ border: '2px solid #850000' }}>3</div>
                  <h4 className="text-2xl font-bold">Share</h4>
                  <p className="text-slate-500 font-medium">Send your link and let the platform handle the back-and-forth.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-32">
          <div className="max-w-[1100px] mx-auto px-4">
            <div className="bg-[#850000] rounded-[2.5rem] p-16 md:p-24 text-center text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">calendar_month</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight max-w-3xl mx-auto relative z-10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ready to master your <span className="italic" style={{ fontFamily: "'Playfair Display', serif" }}>schedule?</span></h2>
              <p className="text-white/80 text-xl font-medium mb-12 max-w-xl mx-auto relative z-10">Join the new standard for professional meetings. No credit card required.</p>
              <Link href="/auth/signup" className="inline-block bg-white text-[#850000] px-12 py-5 rounded-2xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all relative z-10">
                Get Started Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-20" style={{ borderTop: '1px solid rgba(226, 232, 240, 1)' }}>
        <div className="max-w-[1100px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="flex flex-col gap-6">
              <Logo size="sm" href="/" />
              <p className="text-slate-400 font-medium max-w-xs leading-relaxed">Redefining how the world schedules meetings, one connection at a time.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
              <div className="flex flex-col gap-4">
                <h5 className="font-bold text-slate-900">Product</h5>
                <a className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="#features">Features</a>
                <a className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="#">Pricing</a>
                <a className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="#">Integrations</a>
              </div>
              <div className="flex flex-col gap-4">
                <h5 className="font-bold text-slate-900">Company</h5>
                <a className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="#">About</a>
                <a className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="#">Careers</a>
                <a className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="#">Contact</a>
              </div>
              <div className="flex flex-col gap-4">
                <h5 className="font-bold text-slate-900">Legal</h5>
                <Link className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="/privacy-policy">Privacy Policy</Link>
                <Link className="text-slate-500 hover:text-[#850000] transition-colors text-sm font-medium" href="/terms-of-service">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10" style={{ borderTop: '1px solid rgba(226, 232, 240, 1)' }}>
            <p className="text-slate-400 text-sm font-medium">© 2024 Book&amp;Call. Crafted with precision.</p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#850000] hover:border-[#850000] transition-all cursor-pointer" style={{ border: '1px solid rgba(226, 232, 240, 1)' }}>
                <span className="material-symbols-outlined text-xl">share</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#850000] hover:border-[#850000] transition-all cursor-pointer" style={{ border: '1px solid rgba(226, 232, 240, 1)' }}>
                <span className="material-symbols-outlined text-xl">language</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
