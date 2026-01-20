'use client';

import { useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/lib/hooks/use-auth';
import { Logo, LogoIcon } from '@/components/ui/logo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  { icon: 'public', title: 'Global Timezones', desc: 'Automatically coordinate across any timezone without the manual math.' },
  { icon: 'group', title: 'Team Sync', desc: 'Sync multiple calendars for your entire team effortlessly.' },
  { icon: 'extension', title: 'Native Integrations', desc: 'Connect with Zoom, Google Meet, and more.' },
  { icon: 'bolt', title: 'Smart Workflows', desc: 'Automated reminders and follow-ups to reduce no-shows.' },
];

const steps = [
  { num: '01', title: 'Connect Calendar', desc: 'Securely connect Google, Outlook, or iCloud.', icon: 'calendar_add_on' },
  { num: '02', title: 'Set Availability', desc: 'Define your working hours and event types.', icon: 'schedule' },
  { num: '03', title: 'Share Link', desc: 'Send your booking link or embed on your site.', icon: 'share' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: 'Freelance Designer', text: 'Bookr saved me hours every week. My clients love how easy it is to schedule meetings!', avatar: 'SJ', color: '#10B981' },
  { name: 'Mike Chen', role: 'Startup Founder', text: 'The best scheduling tool I\'ve ever used. Simple, fast, and completely free!', avatar: 'MC', color: '#6366F1' },
  { name: 'Emily Davis', role: 'Consultant', text: 'No more back-and-forth emails. Bookr handles everything perfectly.', avatar: 'ED', color: '#F59E0B' },
];

const stats = [
  { value: '500K+', label: 'Meetings Booked' },
  { value: '50K+', label: 'Happy Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '0', label: 'Cost Forever' },
];

// Dashboard Preview Component
function DashboardPreview() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const bookings = [
    { name: 'Sarah Johnson', time: '9:00 AM', type: '30 min call', avatar: 'SJ', color: '#10B981' },
    { name: 'Mike Chen', time: '11:30 AM', type: 'Strategy Session', avatar: 'MC', color: '#6366F1' },
    { name: 'Emily Davis', time: '2:00 PM', type: 'Demo Call', avatar: 'ED', color: '#F59E0B' },
  ];

  return (
    <div className="dashboard-preview relative w-full max-w-5xl mx-auto">
      {/* Floating Cards */}
      <div className="floating-card-1 absolute -top-6 left-4 md:left-8 bg-white rounded-2xl shadow-xl p-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Meeting Confirmed</p>
            <p className="text-xs text-slate-500">Just now</p>
          </div>
        </div>
      </div>

      <div className="floating-card-2 absolute -top-4 right-4 md:right-8 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-2xl shadow-xl p-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-white">trending_up</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">+32% Bookings</p>
            <p className="text-xs text-white/70">This week</p>
          </div>
        </div>
      </div>

      <div className="floating-card-3 absolute bottom-8 left-4 md:left-8 bg-slate-900 rounded-2xl shadow-xl p-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-white">100% Free Forever</span>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">calendar_today</span>
            </div>
            <span className="font-bold text-slate-900">Bookr Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900">
                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-slate-400">chevron_left</span>
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-xs font-semibold text-slate-400 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => {
                const isToday = day === today.getDate();
                const hasEvent = day && [5, 12, 15, 18, 22, 25].includes(day);

                return (
                  <div key={i} className="aspect-square">
                    {day && (
                      <button
                        className={`w-full h-full rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-1 ${isToday
                          ? 'bg-gradient-to-br from-[#fbbd23] to-orange-400 text-white shadow-lg'
                          : 'text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        {day}
                        {hasEvent && !isToday && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#fbbd23]" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 mb-4">Today's Schedule</h4>
            <div className="space-y-3">
              {bookings.map((booking, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: booking.color }}
                    >
                      {booking.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{booking.name}</p>
                      <p className="text-xs text-slate-500">{booking.type}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{booking.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-400 text-slate-900 font-bold text-sm hover:shadow-lg transition-shadow">
              + New Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Process Step Component
function ProcessStep({ step, index }: { step: typeof steps[0]; index: number }) {
  return (
    <div className="process-step flex items-start gap-8 relative">
      {index < steps.length - 1 && (
        <div className="absolute left-[2.75rem] top-24 w-1 h-32 bg-gradient-to-b from-[#fbbd23] to-orange-400 rounded-full" />
      )}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fbbd23] to-orange-400 rounded-full blur-xl opacity-30 scale-125" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-full flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined text-white text-3xl">{step.icon}</span>
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          {step.num}
        </div>
      </div>
      <div className="pt-4">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{step.title}</h3>
        <p className="text-slate-500 text-lg max-w-md">{step.desc}</p>
      </div>
    </div>
  );
}

function useGsapAnimations() {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();

      heroTl
        .fromTo('.hero-badge',
          { opacity: 0, y: 30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2)' }
        )
        .fromTo('.hero-title',
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power4.out' },
          '-=0.3'
        )
        .fromTo('.hero-subtitle',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo('.hero-buttons > *',
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.15, ease: 'back.out(2)' },
          '-=0.3'
        )
        .fromTo('.dashboard-preview',
          { opacity: 0, y: 100, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' },
          '-=0.2'
        );

      gsap.to('.floating-card-1', { y: -15, duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('.floating-card-2', { y: 15, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.5 });
      gsap.to('.floating-card-3', { y: -10, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1 });

      gsap.fromTo('.feature-card',
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: '.features-grid',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.process-step',
        { opacity: 0, x: -60 },
        {
          opacity: 1, x: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.process-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.testimonial-card',
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: '.testimonials-grid',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.stat-item',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.stats-section',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo('.cta-content',
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.cta-section',
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  useGsapAnimations();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const isLoggedIn = !isLoading && user;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white text-slate-800 font-[Inter,sans-serif] min-h-screen">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur-md bg-white/80">
        <Logo size="sm" />

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('features')} className="hover:text-[#fbbd23] transition font-medium">Features</button>
          <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#fbbd23] transition font-medium">How it works</button>
          <button onClick={() => scrollToSection('testimonials')} className="hover:text-[#fbbd23] transition font-medium">Reviews</button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-6 py-2.5 bg-gradient-to-r from-[#fbbd23] to-orange-400 hover:shadow-lg hover:scale-105 transition-all text-white font-bold rounded-xl">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signup" className="px-6 py-2.5 bg-gradient-to-r from-[#fbbd23] to-orange-400 hover:shadow-lg hover:scale-105 transition-all text-white font-bold rounded-xl">
                Get Bookings
              </Link>
              <Link href="/auth/login" className="hover:bg-slate-100 transition px-6 py-2.5 rounded-xl font-bold text-slate-700">
                Login
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden active:scale-90 transition">
          <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-lg flex flex-col items-center justify-center text-lg gap-8 md:hidden">
          <button onClick={() => scrollToSection('features')} className="font-medium text-xl">Features</button>
          <button onClick={() => scrollToSection('how-it-works')} className="font-medium text-xl">How it works</button>
          <button onClick={() => scrollToSection('testimonials')} className="font-medium text-xl">Reviews</button>
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-10 py-4 bg-gradient-to-r from-[#fbbd23] to-orange-400 text-white font-bold rounded-xl text-lg">Dashboard</Link>
          ) : (
            <Link href="/auth/signup" className="px-10 py-4 bg-gradient-to-r from-[#fbbd23] to-orange-400 text-white font-bold rounded-xl text-lg">Get Bookings</Link>
          )}
          <button onClick={() => setMobileMenuOpen(false)} className="mt-4 p-4 bg-slate-100 rounded-full">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="flex flex-col items-center pt-32 pb-16 px-4 md:px-6">
        <div className="hero-badge flex items-center gap-2 rounded-full p-1.5 pr-4 text-sm font-medium text-green-700 bg-green-100">
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check</span>
            FREE
          </span>
          <span>100% Free Forever • No Credit Card</span>
        </div>

        <h1 className="hero-title text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold max-w-4xl text-slate-900 mt-8 leading-[1.1] tracking-tight">
          The fastest way to <span className="bg-gradient-to-r from-[#fbbd23] to-orange-400 bg-clip-text text-transparent">get bookings.</span>
        </h1>

        <p className="hero-subtitle text-center text-lg md:text-xl text-slate-600 max-w-2xl mt-6">
          Schedule, manage, and automate — so you can focus on what matters.
        </p>

        <div className="hero-buttons flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link href="/auth/signup" className="flex items-center gap-2 bg-gradient-to-r from-[#fbbd23] to-orange-400 hover:shadow-2xl hover:shadow-[#fbbd23]/40 text-white active:scale-95 rounded-xl px-8 h-14 text-lg font-bold transition-all">
            Get Bookings — It's Free
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <button onClick={() => scrollToSection('how-it-works')} className="active:scale-95 hover:bg-slate-100 transition text-slate-700 rounded-xl px-8 h-14 text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">play_circle</span>
            See how it works
          </button>
        </div>

        <div className="mt-16 w-full max-w-5xl px-4">
          <DashboardPreview />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-item text-center">
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#fbbd23] to-orange-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-slate-500 mt-2 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#fbbd23]/10 text-[#d97706] text-sm font-bold rounded-full mb-4">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Powerful features to manage your time effectively.</p>
          </div>

          <div className="features-grid grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="feature-card group">
                <div className="bg-white rounded-3xl p-8 h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbd23] to-orange-400 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 text-lg leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="process-section py-24 bg-gradient-to-b from-slate-50 via-[#fbbd23]/5 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#fbbd23]/10 text-[#d97706] text-sm font-bold rounded-full mb-4">Simple</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-slate-500 text-lg">Get started in less than 2 minutes</p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => (
              <ProcessStep key={step.num} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#fbbd23]/10 text-[#d97706] text-sm font-bold rounded-full mb-4">Reviews</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Loved by thousands</h2>
            <p className="text-slate-500 text-lg">See what our users are saying</p>
          </div>

          <div className="testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card bg-slate-50 rounded-3xl p-8 relative">
                <div className="absolute top-6 right-6 text-6xl text-[#fbbd23]/20 font-serif">"</div>
                <p className="text-slate-600 text-lg leading-relaxed mb-6 relative z-10">{t.text}</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section py-24 px-6">
        <div className="cta-content max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#fbbd23]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-bold mb-6">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              100% Free • No Credit Card Required
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to get bookings?</h2>
            <p className="text-slate-400 text-xl mb-10 max-w-xl mx-auto">Join over 50,000+ professionals using Bookr to save time.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="px-10 py-4 bg-gradient-to-r from-[#fbbd23] to-orange-400 text-slate-900 text-lg font-bold rounded-2xl shadow-2xl shadow-[#fbbd23]/30 hover:scale-105 transition-all">
                Get Bookings — It's Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white">calendar_today</span>
                </div>
                <span className="text-xl font-bold text-slate-900">Bookr</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Modern scheduling for everyone. Free forever.</p>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-4">Product</h5>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a className="hover:text-[#fbbd23] transition" href="#">Features</a></li>
                <li><a className="hover:text-[#fbbd23] transition" href="#">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-4">Company</h5>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a className="hover:text-[#fbbd23] transition" href="#">About</a></li>
                <li><a className="hover:text-[#fbbd23] transition" href="#">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-4">Legal</h5>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a className="hover:text-[#fbbd23] transition" href="#">Privacy</a></li>
                <li><a className="hover:text-[#fbbd23] transition" href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 text-sm text-slate-400">
            © 2026 Bookr. All rights reserved. 100% Free.
          </div>
        </div>
      </footer>
    </div>
  );
}
