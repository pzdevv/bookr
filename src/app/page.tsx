"use client";

/**
 * REPLICATED HOME PAGE (ADAPTED)
 * 
 * Instructions:
 * Ensure dependencies are installed: npm install gsap @gsap/react lucide-react lenis split-type
 */

import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import {
  ArrowRight,
  Sparkles,
  Globe,
  Calendar,
  RefreshCw,
  CreditCard,
  Clock,
  Plug,
  Settings,
  Share2,
  User,
  Check,
  Mail,
  Send,
  Loader2
} from "lucide-react";
import { useAuth } from '@/lib/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { newsletterService } from '@/lib/appwrite/database';

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// --- SUB-COMPONENTS ---

// 1. Preloader
interface PreloaderProps {
  onComplete: () => void;
}

function Preloader({ onComplete }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(preloaderRef.current, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.6,
          ease: "power3.inOut",
          onComplete,
        });
      },
    });

    tl.fromTo(
      logoRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );

    tl.to(
      progressRef.current,
      {
        width: "100%",
        duration: 0.8,
        ease: "power2.inOut",
      },
      "-=0.1"
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={preloaderRef}
      className="preloader"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <div ref={logoRef} className="preloader-logo" style={{ opacity: 0 }}>
        Book<span>&</span>Call
      </div>
      <div className="progress-bar">
        <div ref={progressRef} className="progress-fill" />
      </div>
    </div>
  );
}

// 5. Features
const featuresData = [
  {
    id: 1,
    icon: Globe,
    title: "Smart Timezones",
    description:
      "Automatic guest timezone detection. Never schedule across timezones incorrectly again.",
  },
  {
    id: 2,
    icon: Calendar,
    title: "Multiple Events",
    description:
      "Create and manage multiple event types with custom durations, colors, and descriptions.",
  },
  {
    id: 3,
    icon: RefreshCw,
    title: "Omni-Sync",
    description:
      "Sync Google Calendar, Notion, and other tools seamlessly. All your calendars in one view.",
  },
  {
    id: 4,
    icon: CreditCard,
    title: "Instant Payments",
    description:
      "Collect payments via your own QR code before the call. Get paid before you meet.",
  },
  {
    id: 5,
    icon: Clock,
    title: "Smart Buffer Management",
    description:
      "Adaptive buffers between meetings to prevent burnout and back-to-back exhaustion.",
  },
];

function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll(".feature-item");
      if (!cards || cards.length === 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: `+=${window.innerHeight * 2.5}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progressRef.current) {
              gsap.set(progressRef.current, {
                height: `${self.progress * 100}%`,
              });
            }
          },
        },
      });

      cards.forEach((card, index) => {
        if (index === 0) {
          tl.fromTo(
            card,
            { opacity: 1, y: 0, scale: 1 },
            { opacity: 1, y: 0, scale: 1, duration: 0.3 }
          );
        } else {
          tl.to(cards[index - 1], {
            opacity: 0,
            y: -30,
            scale: 0.95,
            duration: 0.3,
          });
          tl.fromTo(
            card,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.3 },
            "-=0.15"
          );
        }
      });

      tl.to({}, { duration: 0.2 });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="bg-base">
      <div ref={triggerRef} className="min-h-screen py-20">
        <div className="container-xl h-full">
          <div className="grid lg:grid-cols-2 gap-16 h-full items-center">
            <div className="lg:sticky lg:top-1/3">
              <div className="flex gap-6">
                <div className="hidden lg:block progress-indicator h-32">
                  <div ref={progressRef} className="progress-indicator-fill" />
                </div>

                <div>
                  <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                    Core Features
                  </span>
                  <h2 className="heading-lg mb-6">
                    Everything you need.
                    <br />
                    Nothing you don&apos;t.
                  </h2>
                  <p className="body-md max-w-md">
                    Built for professionals who value their time. Every feature
                    is designed to eliminate friction and maximize focus.
                  </p>
                </div>
              </div>
            </div>

            <div ref={cardsRef} className="relative min-h-[400px]">
              {featuresData.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="feature-item absolute inset-0 flex items-center"
                    style={{ opacity: index === 0 ? 1 : 0 }}
                  >
                    <div className="feature-card w-full max-w-lg mx-auto">
                      <div className="flex items-start gap-5">
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#850000] to-[#a80000] flex items-center justify-center shadow-lg shadow-[#850000]/20">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="heading-md mb-3">{feature.title}</h3>
                          <p className="body-md">{feature.description}</p>
                        </div>
                      </div>
                      <div className="absolute top-6 right-6 text-6xl font-bold text-gray-100 select-none">
                        {String(feature.id).padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 6. HowItWorks
const stepsData = [
  {
    id: 1,
    icon: Plug,
    title: "Integrate",
    description:
      "Connect your existing calendar in seconds. We sync with Google Calendar, Outlook, and more.",
  },
  {
    id: 2,
    icon: Settings,
    title: "Configure",
    description:
      "Set your availability, create event types, and customize your booking page to match your brand.",
  },
  {
    id: 3,
    icon: Share2,
    title: "Share",
    description:
      "Share your personal booking link. Clients book directly into your available slots.",
  },
];

function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGLineElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength();

        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: 1,
          },
        });
      }

      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(card, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.7, delay: index * 0.1, scrollTrigger: { trigger: card, start: "top 85%" } });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="workflow" className="section bg-gradient-to-b from-base to-gray-50/50">
      <div className="container-lg">
        <div className="text-center mb-20">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            How It Works
          </span>
          <h2 className="heading-lg">
            Three steps to scheduling freedom
          </h2>
        </div>

        <div className="relative">
          <svg
            className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 hidden md:block"
            viewBox="0 0 32 100"
            preserveAspectRatio="none"
          >
            <line
              ref={pathRef}
              x1="16"
              y1="0"
              x2="16"
              y2="100"
              stroke="#850000"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="grid gap-24 md:gap-32 relative z-10">
            {stepsData.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 1;

              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    cardsRef.current[index] = el;
                  }}
                  className={`grid md:grid-cols-2 gap-8 items-center ${isEven ? "md:text-right" : ""
                    }`}
                >
                  <div
                    className={`${isEven ? "md:order-2 md:text-left" : ""}`}
                  >
                    <div
                      className={`feature-card inline-block ${isEven ? "md:ml-auto" : ""
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#850000] to-[#a80000] flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-primary font-semibold mb-1">
                            Step {step.id}
                          </div>
                          <h3 className="heading-md mb-2">{step.title}</h3>
                          <p className="body-md max-w-sm">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`hidden md:flex justify-center ${isEven ? "md:order-1" : ""
                      }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white border-4 border-primary flex items-center justify-center text-primary font-bold shadow-lg">
                      {step.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// 7. ScrollText
function ScrollText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !containerRef.current || !textRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(textRef.current, {
        xPercent: -50,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-20 overflow-hidden bg-surface"
    >
      <div
        ref={textRef}
        className="flex items-center gap-8 whitespace-nowrap"
        style={{ width: "fit-content" }}
      >
        <span className="text-5xl md:text-6xl lg:text-[6rem] font-bold font-heading text-secondary/10">
          Schedule smarter
        </span>
        <span className="text-primary text-3xl md:text-4xl">✦</span>
        <span className="text-5xl md:text-6xl lg:text-[6rem] font-bold font-heading text-secondary/10">
          Book instantly
        </span>
        <span className="text-primary text-3xl md:text-4xl">✦</span>
        <span className="text-5xl md:text-6xl lg:text-[6rem] font-bold font-heading text-secondary/10">
          Save hours weekly
        </span>
        <span className="text-primary text-3xl md:text-4xl">✦</span>
        <span className="text-5xl md:text-6xl lg:text-[6rem] font-bold font-heading text-secondary/10">
          Effortless meetings
        </span>
        <span className="text-primary text-3xl md:text-4xl">✦</span>
        <span className="text-5xl md:text-6xl lg:text-[6rem] font-bold font-heading text-secondary/10">
          Your time, your rules
        </span>
      </div>
    </section>
  );
}

// 8. ProductDemo
function ProductDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const elements = elementsRef.current.filter(Boolean);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "bottom 40%",
          scrub: 0.8,
        },
      });

      tl.fromTo(
        containerRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5 }
      );

      elements.forEach((el, index) => {
        tl.fromTo(
          el,
          {
            clipPath: "inset(100% 0 0 0)",
            opacity: 0,
            y: 20,
          },
          {
            clipPath: "inset(0% 0 0 0)",
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            delay: index === 0 ? -0.2 : -0.15,
          },
          index === 0 ? "-=0.2" : "-=0.15"
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section bg-base overflow-hidden">
      <div className="container-lg">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
            See It In Action
          </span>
          <h2 className="heading-lg mb-4">
            Your booking page, built beautifully
          </h2>
          <p className="body-md max-w-xl mx-auto">
            Watch how a professional booking experience comes together.
            Clean, branded, and conversion-optimized.
          </p>
        </div>

        <div
          ref={containerRef}
          className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl shadow-black/10 overflow-hidden border border-gray-100"
        >
          <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white rounded-lg px-4 py-1.5 text-sm text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200" />
                bookncall.me/you/consultation
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div
                  ref={(el) => {
                    elementsRef.current[0] = el;
                  }}
                  className="flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#850000] to-[#a80000] flex items-center justify-center text-white text-xl font-bold">
                    YN
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your Name</h3>
                    <p className="text-gray-500 text-sm">Strategy Consultant</p>
                  </div>
                </div>

                <div
                  ref={(el) => {
                    elementsRef.current[1] = el;
                  }}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                >
                  <h4 className="font-semibold text-lg mb-4">
                    Strategy Consultation
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>30 minutes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-primary" />
                      <span>1-on-1 Audio Call</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Available Mon-Fri</span>
                    </div>
                  </div>
                </div>

                <div
                  ref={(el) => {
                    elementsRef.current[2] = el;
                  }}
                >
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Book a focused strategy session to discuss your business
                    challenges. We&apos;ll dive deep into your specific situation and
                    create actionable next steps.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div
                  ref={(el) => {
                    elementsRef.current[3] = el;
                  }}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">January 2026</span>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        ‹
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        ›
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div key={d} className="text-gray-400 py-2 text-xs">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => (
                      <div
                        key={i}
                        className={`py-2 rounded-lg text-sm cursor-pointer transition-colors ${i === 22
                          ? "bg-primary text-white font-semibold"
                          : i > 20 && i < 26
                            ? "hover:bg-gray-200 text-gray-900"
                            : "text-gray-300"
                          }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={(el) => {
                    elementsRef.current[4] = el;
                  }}
                >
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Available times for Jan 23
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["9:00 AM", "10:30 AM", "2:00 PM"].map((time, i) => (
                      <button
                        key={time}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${i === 1
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={(el) => {
                    elementsRef.current[5] = el;
                  }}
                >
                  <button className="w-full btn-primary btn-shine">
                    <Check className="w-5 h-5 mr-2" />
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 9. FinalCTA
function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.children || [],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="section relative overflow-hidden"
    >
      <div className="absolute inset-0 gradient-sweep" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#850000]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#850000]/5 rounded-full blur-3xl" />

      <div className="container-lg relative z-10">
        <div
          ref={contentRef}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            No credit card required
          </span>

          <h2 className="heading-xl mb-6">
            Ready to master your schedule?
          </h2>

          <p className="body-lg mb-10 max-w-xl mx-auto">
            Join the new standard for professional meetings.
            Start scheduling smarter today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary btn-shine text-lg px-8 py-4">
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Setup in 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 10. Footer (With Brutalist Newsletter)
const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#integrations" },
  ],
  company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Terms", href: "/terms-of-service" },
    { label: "Contact", href: "/contact" },
  ],
};

function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await newsletterService.subscribe(email);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setEmail('');
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <footer className="bg-surface text-secondary border-t border-secondary/10 py-16">
      <div className="container-xl py-12">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="sm" href="/" />
            </div>
            <p className="text-secondary/60 text-sm leading-relaxed mb-4">
              The all-in-one scheduling platform for professionals who value
              intentional conversations.
            </p>
            <div className="text-secondary/50 text-sm">
              A brand under{" "}
              <span className="text-secondary font-medium">NIV Nepal</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-secondary/50 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-secondary/70 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-secondary/50 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-secondary/70 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-secondary/50 mb-4">
              Stay Updated
            </h4>

            {/* Brutalist Newsletter Form */}
            <div className="border-2 border-primary shadow-[4px_4px_0px_0px_#850000] bg-white p-1">
              {status === 'success' ? (
                <div className="py-4 text-center text-green-600 font-bold flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Joined!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex">
                  <div className="flex-1 flex items-center border-r-2 border-primary px-3 bg-gray-50">
                    <Mail className="w-5 h-5 text-primary shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full bg-transparent border-none outline-none px-2 py-3 text-sm font-medium placeholder:text-gray-400 text-primary"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-4 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </form>
              )}
            </div>
            <p className="text-xs text-secondary/40 mt-3 font-medium">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-secondary/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-secondary/50 text-sm">
            © {new Date().getFullYear()} Book&Call. All rights reserved.
          </div>
          <div className="flex gap-4">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-secondary/50 hover:text-primary transition-colors text-xs font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// 11. Main Home Component (Mixed)
export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const lenisRef = useRef<Lenis | null>(null);

  // Refs for Old Hero Animations
  const heroRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const floatingBadgesRef = useRef<HTMLDivElement>(null);

  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
    document.body.style.overflow = "auto";
  }, []);

  // Effect for Preloader & Lenis
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setIsLoading(false);
      return;
    }

    document.body.style.overflow = "hidden";

    if (!isLoading) {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      if (!isTouchDevice) {
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          smoothWheel: true,
          touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        lenis.on("scroll", ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        document.documentElement.classList.add("lenis");

        return () => {
          lenis.destroy();
          document.documentElement.classList.remove("lenis");
          gsap.ticker.remove(lenis.raf);
        };
      } else {
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
      }
    }
  }, [isLoading]);

  // Effect for Old Hero Animations (Only runs if !isLoading)
  useEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      // Hero entrance animations
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (badgeRef.current) {
        heroTl.fromTo(badgeRef.current,
          { opacity: 0, y: 30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8 }
        );
      }
      if (headingRef.current) {
        heroTl.fromTo(headingRef.current,
          { opacity: 0, y: 60, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 1 },
          '-=0.4'
        );
      }
      if (subtextRef.current) {
        heroTl.fromTo(subtextRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        );
      }
      if (ctaRef.current) {
        heroTl.fromTo(ctaRef.current,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=0.4'
        );
      }

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

        // Continuous floating animation
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
    });

    return () => ctx.revert();
  }, [isLoading]);

  const isLoggedIn = !isAuthLoading && user;

  return (
    <main className="relative">
      {/* Preloader */}
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Content Wrapper */}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        {/* 1. Original Fixed Navbar */}
        <div className="fixed top-6 left-0 right-0 z-50 px-4">
          <div className="container-xl">
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

        {/* Mobile Menu (Original) */}
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

        {/* 2. Original Hero Section */}
        <section ref={heroRef} className="relative pt-44 pb-0 bg-base overflow-x-clip">
          <div className="container-xl px-4 text-center">
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#850000]/5 text-[#850000] text-xs font-bold uppercase tracking-widest mb-8" style={{ border: '1px solid rgba(133, 0, 0, 0.1)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#850000] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#850000]"></span>
              </span>
              Now with real-time chats
            </div>
            <h1 ref={headingRef} className="heading-xl mb-8 max-w-4xl mx-auto">
              Scheduling made <span className="italic text-[#850000] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>effortless</span> for high-performers.
            </h1>
            <p ref={subtextRef} className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">
              The all-in-one platform for seamless appointments. Reclaim your focus and let <span className="text-[#850000] font-bold">Book&amp;Call</span> handle the logistics.
            </p>
            <div ref={ctaRef} className="flex flex-col items-center justify-center gap-6 mb-16">
              <Link href="/auth/signup" className="min-w-[200px] bg-[#850000] text-white text-lg font-bold h-16 px-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center">
                Start Free
              </Link>

              <div className="flex items-center justify-center gap-3 text-sm text-gray-500 mt-4">
                <span>A brand under</span>
                <span className="font-semibold text-secondary">NIV Nepal</span>
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-gray-400">bookncall.me</span>
              </div>
            </div>

            {/* Calendar Preview with Floating Badges */}
            <div ref={floatingBadgesRef} className="relative w-full max-w-4xl mx-auto mt-10 z-10">
              {/* Floating Badge - Left Top */}
              <div className="floating-badge absolute -top-6 left-2 md:left-8 bg-white rounded-2xl shadow-xl p-4 z-30 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">Meeting Confirmed</p>
                  <p className="text-xs text-slate-500">Just now</p>
                </div>
              </div>

              {/* Floating Badge - Right Top */}
              <div className="floating-badge absolute -top-4 right-2 md:right-8 bg-gradient-to-br from-[#850000] to-[#5a0000] rounded-2xl shadow-xl p-4 z-30 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">trending_up</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">+32% Bookings</p>
                  <p className="text-xs text-white/70">This week</p>
                </div>
              </div>

              {/* Floating Badge - Left Bottom */}
              <div className="floating-badge absolute bottom-36 left-2 md:left-8 bg-slate-900 rounded-2xl shadow-xl p-4 z-30 hidden sm:flex items-center gap-2">
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

        <Features />
        <HowItWorks />
        <ScrollText />
        <ProductDemo />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  );
}
