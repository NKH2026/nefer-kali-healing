import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const PrivacyPolicy: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <SEOHead
                title="Privacy Policy"
                description="Privacy Policy for Nefer Kali Healing & Spiritual Education. Learn how we collect, use, and protect your personal information."
                url="/privacy-policy"
                noindex={false}
            />

            <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-display mb-4">Privacy Policy</h1>
                        <p className="text-white/50 text-sm">
                            Last Updated: January {currentYear}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-gold max-w-none space-y-12">

                        {/* Introduction */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Introduction</h2>
                            <p className="text-white/70 leading-relaxed">
                                Nefer Kali Healing & Spiritual Education ("we," "us," or "our") is committed to protecting your privacy.
                                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit
                                our website <span className="text-[#D4AF37]">neferkalihealing.org</span>, including any other media form,
                                media channel, mobile website, or mobile application related or connected thereto.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Information We Collect</h2>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Personal Information</h3>
                            <p className="text-white/70 leading-relaxed">
                                We may collect personal information that you voluntarily provide when:
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                                <li>Making a purchase or donation</li>
                                <li>Subscribing to our newsletter</li>
                                <li>Registering for events or workshops</li>
                                <li>Contacting us with inquiries</li>
                                <li>Leaving product reviews</li>
                            </ul>
                            <p className="text-white/70 leading-relaxed mt-4">
                                This information may include: name, email address, shipping address, phone number, and payment information.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Automatically Collected Information</h3>
                            <p className="text-white/70 leading-relaxed">
                                When you visit our site, we automatically collect certain information, including:
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                                <li>Device type and browser information</li>
                                <li>IP address and approximate location</li>
                                <li>Pages visited and time spent on site</li>
                                <li>Referring website or source</li>
                                <li>Click patterns and interactions</li>
                            </ul>
                        </section>

                        {/* Analytics */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Analytics Services</h2>
                            <p className="text-white/70 leading-relaxed">
                                We use the following analytics services to understand how visitors interact with our website:
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Google Analytics 4</h3>
                            <p className="text-white/70 leading-relaxed">
                                We use Google Analytics to analyze website traffic and improve user experience. Google Analytics uses cookies
                                to collect anonymous information about your visit. You can opt out by installing the
                                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline ml-1">
                                    Google Analytics Opt-out Browser Add-on
                                </a>.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Microsoft Clarity</h3>
                            <p className="text-white/70 leading-relaxed">
                                We use Microsoft Clarity to understand user behavior through session recordings and heatmaps.
                                Clarity does not collect personally identifiable information.
                                <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline ml-1">
                                    Learn more about Microsoft's privacy practices
                                </a>.
                            </p>
                        </section>

                        {/* How We Use Information */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">How We Use Your Information</h2>
                            <p className="text-white/70 leading-relaxed">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                                <li>Process and fulfill your orders</li>
                                <li>Send order confirmations and shipping updates</li>
                                <li>Respond to your inquiries and provide customer support</li>
                                <li>Send newsletters and promotional communications (with your consent)</li>
                                <li>Improve our website and user experience</li>
                                <li>Prevent fraudulent transactions</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        {/* Sharing Information */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Sharing Your Information</h2>
                            <p className="text-white/70 leading-relaxed">
                                We do not sell, trade, or rent your personal information. We may share your information with:
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                                <li><strong className="text-white/90">Payment Processors:</strong> Stripe, to process secure payments</li>
                                <li><strong className="text-white/90">Shipping Providers:</strong> To fulfill and deliver your orders</li>
                                <li><strong className="text-white/90">Email Services:</strong> To send transactional and marketing emails</li>
                                <li><strong className="text-white/90">Analytics Providers:</strong> Google and Microsoft, for website analytics</li>
                            </ul>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Your Rights</h2>
                            <p className="text-white/70 leading-relaxed">
                                Depending on your location, you may have certain rights regarding your personal information:
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                                <li>Access and receive a copy of your personal data</li>
                                <li>Request correction of inaccurate information</li>
                                <li>Request deletion of your personal data</li>
                                <li>Opt out of marketing communications</li>
                                <li>Withdraw consent at any time</li>
                            </ul>
                            <p className="text-white/70 leading-relaxed mt-4">
                                To exercise these rights, contact us at <span className="text-[#D4AF37]">info@neferkalihealing.org</span>.
                            </p>
                        </section>

                        {/* Cookies */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Cookies</h2>
                            <p className="text-white/70 leading-relaxed">
                                We use cookies and similar tracking technologies to enhance your browsing experience.
                                You can control cookies through your browser settings. Please note that disabling cookies
                                may affect the functionality of certain features on our website.
                            </p>
                        </section>

                        {/* Data Security */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Data Security</h2>
                            <p className="text-white/70 leading-relaxed">
                                We implement appropriate technical and organizational measures to protect your personal information
                                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
                                over the Internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Children's Privacy</h2>
                            <p className="text-white/70 leading-relaxed">
                                Our website is not intended for children under 13 years of age. We do not knowingly collect
                                personal information from children under 13. If you believe we have collected information from
                                a child under 13, please contact us immediately.
                            </p>
                        </section>

                        {/* Changes to Policy */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Changes to This Policy</h2>
                            <p className="text-white/70 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by
                                posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage
                                you to review this Privacy Policy periodically.
                            </p>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Contact Us</h2>
                            <p className="text-white/70 leading-relaxed">
                                If you have questions or concerns about this Privacy Policy, please contact us:
                            </p>
                            <div className="mt-4 text-white/70 space-y-1">
                                <p><strong className="text-white/90">Nefer Kali Healing & Spiritual Education</strong></p>
                                <p>PO Box 322</p>
                                <p>McCordsville, IN 46055</p>
                                <p>Email: <span className="text-[#D4AF37]">info@neferkalihealing.org</span></p>
                            </div>
                        </section>

                    </div>

                    {/* Back Link */}
                    <div className="mt-16 text-center">
                        <Link
                            to="/"
                            className="inline-block text-[#D4AF37] hover:text-white transition-colors text-sm uppercase tracking-widest"
                        >
                            ← Return Home
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;
