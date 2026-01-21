'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#FDFCFB]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#850000]/5">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Logo size="sm" href="/" />
                    <Link
                        href="/privacy-policy"
                        className="text-sm font-medium text-[#850000] hover:underline"
                    >
                        ← Privacy Policy
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-12">
                    <span className="inline-block px-3 py-1 bg-[#850000]/10 text-[#850000] text-xs font-bold rounded-full mb-4">
                        LEGAL
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#1d0c0c] mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-[#6b4444]">Last updated: January 2026</p>
                </div>

                <div className="prose prose-lg max-w-none">
                    {/* Section 1 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                            Acceptance of Terms
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                By accessing or using BooknCall, you agree to these Terms of Service ("Terms").
                            </p>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-amber-800 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    If you do not agree, do not use the service.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                            Description of Service
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">BooknCall provides tools for:</p>
                            <ul className="space-y-2 mb-4">
                                {['Scheduling appointments', 'Initiating real-time calls using WebRTC'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                        <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">check_circle</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-800 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined">celebration</span>
                                    The service is currently provided free of charge.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                            User Responsibilities
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">You are solely responsible for:</p>
                            <ul className="space-y-2 mb-4">
                                {['Who you schedule calls with', 'When and why you schedule appointments', 'What you say or share during calls', 'Complying with applicable laws'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                        <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">person</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[#4a2c2c] leading-relaxed italic">
                                BooknCall does not moderate or monitor call content.
                            </p>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                            Prohibited Use
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">You agree not to use BooknCall for:</p>
                            <ul className="space-y-2 mb-4">
                                {['Illegal activities', 'Harassment, abuse, or harm', 'Fraud, impersonation, or deception', 'Circumventing security or encryption'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                        <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">block</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-red-800 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined">gavel</span>
                                    We reserve the right to suspend or terminate accounts that violate these Terms.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                            No Liability
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">To the maximum extent permitted by law:</p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">info</span>
                                    BooknCall is provided "as is" and "as available"
                                </li>
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">info</span>
                                    We make no guarantees about uptime, reliability, or suitability
                                </li>
                            </ul>
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">We are not liable for:</p>
                            <ul className="space-y-2 mb-4 ml-4">
                                {['Missed appointments', 'Failed calls', 'Data loss', 'User behavior or interactions', 'Any direct, indirect, or consequential damages'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[#4a2c2c]">
                                        <span className="text-[#850000]">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-amber-800 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    Use of BooknCall is entirely at your own risk.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                            No Professional Advice
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                BooknCall does not provide legal, medical, financial, or professional advice.
                            </p>
                            <p className="text-[#4a2c2c] leading-relaxed">
                                Any interactions facilitated through the platform are strictly between users.
                            </p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                            Account Termination
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">person_remove</span>
                                    You may delete your account at any time
                                </li>
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">security</span>
                                    We may suspend or terminate access without notice if required for security or legal reasons
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                            Changes to the Service & Terms
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">We may:</p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">build</span>
                                    Modify or discontinue features
                                </li>
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">edit_document</span>
                                    Update these Terms without prior notice
                                </li>
                            </ul>
                            <p className="text-[#4a2c2c] leading-relaxed italic">
                                Continued use of BooknCall constitutes acceptance of the updated Terms.
                            </p>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                            Governing Law
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">balance</span>
                                These Terms are governed by the laws of Nepal, without regard to conflict-of-law principles.
                            </p>
                        </div>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">10</span>
                            Contact
                        </h2>
                        <div className="bg-gradient-to-br from-[#850000] to-[#5a0000] rounded-xl p-6 text-white">
                            <p className="flex items-center gap-3 text-lg">
                                <span className="material-symbols-outlined text-2xl">mail</span>
                                <a href="mailto:privacy.tos@bookncall.me" className="font-medium hover:underline">
                                    privacy.tos@bookncall.me
                                </a>
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-[#850000]/5 py-8">
                <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[#6b4444]">© 2026 BooknCall. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy-policy" className="text-sm text-[#850000] hover:underline">
                            Privacy Policy
                        </Link>
                        <Link href="/" className="text-sm text-[#6b4444] hover:text-[#850000]">
                            Home
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
