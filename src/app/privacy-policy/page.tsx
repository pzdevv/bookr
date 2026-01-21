'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#FDFCFB]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#850000]/5">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Logo size="sm" href="/" />
                    <Link
                        href="/terms-of-service"
                        className="text-sm font-medium text-[#850000] hover:underline"
                    >
                        Terms of Service →
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
                        Privacy Policy
                    </h1>
                    <p className="text-[#6b4444]">Last updated: January 2026</p>
                </div>

                <div className="prose prose-lg max-w-none">
                    {/* Section 1 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                            Introduction
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                BooknCall ("BooknCall", "we", "our", or "us") respects your privacy and is committed to protecting it.
                            </p>
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                BooknCall is a project operated from Nepal under NIV Nepal (legal registration in process). This Privacy Policy explains what information we collect, how we use it, and the choices you have.
                            </p>
                            <p className="text-[#4a2c2c] leading-relaxed">
                                If you have any questions, contact us at{' '}
                                <a href="mailto:privacy.tos@bookncall.me" className="text-[#850000] font-medium hover:underline">
                                    privacy.tos@bookncall.me
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                            Information We Collect
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                                <h3 className="text-lg font-bold text-[#1d0c0c] mb-3">2.1 Information You Provide</h3>
                                <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                    We collect the following information when you use BooknCall:
                                </p>
                                <ul className="space-y-2">
                                    {['Email address', 'Real name', 'Profile photo (only if you choose to upload one)', 'Time zone', 'Availability and scheduling data', 'Account-related metadata (such as booking timestamps and call duration)'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                            <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">check_circle</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                                <h3 className="text-lg font-bold text-[#1d0c0c] mb-3">2.2 Cookies & Session Data</h3>
                                <p className="text-[#4a2c2c] leading-relaxed">
                                    We use session and authentication cookies to keep you logged in and to operate the service securely. These cookies are stored only with user consent where required.
                                </p>
                            </div>
                            <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                                <h3 className="text-lg font-bold text-[#1d0c0c] mb-3">2.3 IP Addresses & Logs</h3>
                                <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                    We do not actively collect or monitor IP addresses.
                                </p>
                                <p className="text-[#4a2c2c] leading-relaxed">
                                    However, IP addresses may be logged automatically by our infrastructure providers. We do not access or use this data unless required to investigate suspicious or abusive activity or to comply with legal obligations.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                            Calls & Communications (WebRTC)
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <ul className="space-y-3">
                                {[
                                    'All calls on BooknCall use end-to-end encrypted WebRTC',
                                    'Calls are not recorded',
                                    'Call audio/video content is never stored',
                                    'We may process call metadata only (e.g., time, duration) to operate the service'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                        <span className="material-symbols-outlined text-green-600 text-lg mt-0.5">verified</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-green-800 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined">lock</span>
                                    BooknCall cannot access the content of your calls.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                            How We Use Your Information
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">We use your information to:</p>
                            <ul className="space-y-2 mb-6">
                                {['Create and manage your account', 'Enable appointment scheduling', 'Facilitate secure real-time calls', 'Maintain platform security', 'Improve reliability and performance'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                        <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">arrow_right</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="p-4 bg-[#850000]/5 rounded-lg border border-[#850000]/10">
                                <p className="text-[#850000] font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">block</span>
                                    We do not sell your data.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">5</span>
                            Data Sharing & Third Parties
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                We use trusted third-party infrastructure providers (for hosting, authentication, and email delivery).
                            </p>
                            <p className="text-[#4a2c2c] leading-relaxed">
                                Details of acknowledged third parties are available upon request. Contact{' '}
                                <a href="mailto:privacy.tos@bookncall.me" className="text-[#850000] font-medium hover:underline">
                                    privacy.tos@bookncall.me
                                </a>{' '}
                                for the current list.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">6</span>
                            Data Retention & Deletion
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">delete</span>
                                    You can delete your account at any time
                                </li>
                                <li className="text-[#4a2c2c]">
                                    <p className="mb-2">Upon deletion:</p>
                                    <ul className="ml-8 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#850000]">•</span>
                                            All associated personal data is removed
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#850000]">•</span>
                                            No call content is retained (as none is stored)
                                        </li>
                                    </ul>
                                </li>
                                <li className="flex items-start gap-3 text-[#4a2c2c]">
                                    <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">info</span>
                                    We do not retain deleted user data beyond what is technically required to complete deletion.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">7</span>
                            Children's Privacy
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                BooknCall is intended for users aged 13 and above.
                            </p>
                            <p className="text-[#4a2c2c] leading-relaxed">
                                If you believe a child under 13 has used the service, contact us immediately.
                            </p>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">8</span>
                            Your Rights
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                Depending on your location, you may have rights to:
                            </p>
                            <ul className="space-y-2 mb-4">
                                {['Access your data', 'Correct inaccurate data', 'Delete your data'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[#4a2c2c]">
                                        <span className="material-symbols-outlined text-[#850000] text-lg mt-0.5">gavel</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[#4a2c2c] leading-relaxed">
                                Requests can be sent to{' '}
                                <a href="mailto:privacy.tos@bookncall.me" className="text-[#850000] font-medium hover:underline">
                                    privacy.tos@bookncall.me
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#1d0c0c] mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 bg-[#850000] text-white rounded-lg flex items-center justify-center text-sm font-bold">9</span>
                            Changes to This Policy
                        </h2>
                        <div className="bg-white rounded-xl p-6 border border-[#850000]/5 shadow-sm">
                            <p className="text-[#4a2c2c] leading-relaxed mb-4">
                                We may update this Privacy Policy at any time. Changes take effect immediately upon publication.
                            </p>
                            <p className="text-[#4a2c2c] leading-relaxed">
                                Continued use of BooknCall means you accept the updated policy.
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
                        <Link href="/terms-of-service" className="text-sm text-[#850000] hover:underline">
                            Terms of Service
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
