import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const TermsAndConditions: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <SEOHead
                title="Terms & Conditions"
                description="Terms and Conditions for Nefer Kali Healing. Health disclaimers, herbal product information, and event liability waivers."
                url="/terms"
                noindex={false}
            />

            <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-display mb-4">Terms & Conditions</h1>
                        <p className="text-white/50 text-sm">
                            Last Updated: January {currentYear}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-gold max-w-none space-y-12">

                        {/* Agreement */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Agreement to Terms</h2>
                            <p className="text-white/70 leading-relaxed">
                                By accessing or using the Nefer Kali Healing website, purchasing our products, or attending our events,
                                you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms,
                                please do not use our services.
                            </p>
                        </section>

                        {/* IMPORTANT: Health Disclaimer */}
                        <section className="bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-xl p-6">
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">⚠️ Important Health Disclaimer</h2>
                            <p className="text-white/70 leading-relaxed mb-4">
                                <strong className="text-white">Nefer Kali Healing & Spiritual Education is NOT a medical provider.</strong> We do not
                                diagnose, treat, cure, or prevent any disease or medical condition. The information and products provided
                                on this website are for educational and spiritual purposes only.
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-3 ml-4">
                                <li>
                                    <strong className="text-white">Consult a Healthcare Professional:</strong> Always consult with a qualified
                                    healthcare provider before starting any new supplement, herbal remedy, or wellness regimen, especially
                                    if you are pregnant, nursing, have a medical condition, or take medications.
                                </li>
                                <li>
                                    <strong className="text-white">Not Medical Advice:</strong> Content on this website, including blog posts,
                                    product descriptions, and educational materials, should not be considered medical advice and is not
                                    intended to replace professional medical care.
                                </li>
                                <li>
                                    <strong className="text-white">Individual Results May Vary:</strong> Herbal products and holistic practices
                                    may affect individuals differently. We make no guarantees regarding specific health outcomes.
                                </li>
                            </ul>
                        </section>

                        {/* FDA Disclaimer */}
                        <section className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">FDA Disclaimer</h2>
                            <p className="text-white/70 leading-relaxed">
                                <strong className="text-white">These statements have not been evaluated by the Food and Drug Administration (FDA).</strong>
                                Our products are not intended to diagnose, treat, cure, or prevent any disease. The products sold on this
                                website are herbal supplements and are regulated as dietary supplements under the Dietary Supplement Health
                                and Education Act (DSHEA) of 1994.
                            </p>
                        </section>

                        {/* Herbal Products */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Herbal Product Terms</h2>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Product Information</h3>
                            <p className="text-white/70 leading-relaxed">
                                We strive to provide accurate descriptions of our herbal products. However, we do not warrant that product
                                descriptions, images, or other content on this site are accurate, complete, reliable, current, or error-free.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Allergies & Sensitivities</h3>
                            <p className="text-white/70 leading-relaxed">
                                Herbal products may cause allergic reactions in some individuals. Please review all ingredients carefully
                                before use. If you experience any adverse reaction, discontinue use immediately and consult a healthcare
                                professional.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Storage & Handling</h3>
                            <p className="text-white/70 leading-relaxed">
                                Store herbal products as directed on the label. Keep out of reach of children. Improper storage may affect
                                product quality and safety.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Contraindications</h3>
                            <p className="text-white/70 leading-relaxed">
                                Some herbal products may interact with medications or be contraindicated for certain conditions. It is your
                                responsibility to research any herbal product and consult with a qualified healthcare provider before use.
                            </p>
                        </section>

                        {/* Events & Workshops */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Event & Workshop Terms</h2>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Assumption of Risk</h3>
                            <p className="text-white/70 leading-relaxed">
                                By participating in any Nefer Kali Healing event, workshop, ceremony, or gathering (whether in-person or
                                virtual), you acknowledge and accept that:
                            </p>
                            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                                <li>Participation is voluntary and at your own risk</li>
                                <li>Spiritual and wellness practices may bring up emotional responses</li>
                                <li>You are responsible for your own physical and emotional well-being</li>
                                <li>You will inform facilitators of any relevant health conditions</li>
                            </ul>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Release of Liability</h3>
                            <p className="text-white/70 leading-relaxed">
                                By registering for or attending our events, you release and hold harmless Nefer Kali Healing & Spiritual
                                Education, its founders, facilitators, and volunteers from any claims, damages, or liability arising from
                                your participation, except in cases of gross negligence or willful misconduct.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Event Conduct</h3>
                            <p className="text-white/70 leading-relaxed">
                                Participants are expected to treat all attendees and facilitators with respect. We reserve the right to
                                remove any participant whose behavior is disruptive, disrespectful, or harmful to others, without refund.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Photography & Recording</h3>
                            <p className="text-white/70 leading-relaxed">
                                Events may be photographed or recorded for promotional purposes. By attending, you consent to the use of
                                your likeness unless you notify us in writing beforehand.
                            </p>
                        </section>

                        {/* Purchases & Payments */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Purchases & Payments</h2>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Pricing</h3>
                            <p className="text-white/70 leading-relaxed">
                                All prices are listed in USD. We reserve the right to change prices at any time without notice. Prices at
                                the time of purchase will be honored.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Payment Processing</h3>
                            <p className="text-white/70 leading-relaxed">
                                All payments are processed securely through Stripe. We do not store your credit card information on our servers.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Subscriptions</h3>
                            <p className="text-white/70 leading-relaxed">
                                Subscription products will be charged according to the selected billing frequency. You may cancel at any
                                time through your account or by contacting us. Cancellations take effect at the end of the current billing period.
                            </p>
                        </section>

                        {/* Shipping & Returns */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Shipping & Returns</h2>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Shipping</h3>
                            <p className="text-white/70 leading-relaxed">
                                We ship to addresses within the United States. International shipping may be available for select products.
                                Shipping times are estimates and not guaranteed.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Returns & Refunds</h3>
                            <p className="text-white/70 leading-relaxed">
                                Due to the nature of herbal products, we cannot accept returns of opened or used items. Unopened products
                                may be returned within 14 days of receipt for a refund, minus shipping costs. Please contact us before
                                returning any items.
                            </p>

                            <h3 className="text-xl font-display text-white/90 mt-6 mb-3">Damaged or Incorrect Orders</h3>
                            <p className="text-white/70 leading-relaxed">
                                If you receive a damaged or incorrect item, please contact us within 7 days of receipt with photos of the
                                issue. We will arrange a replacement or refund.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Intellectual Property</h2>
                            <p className="text-white/70 leading-relaxed">
                                All content on this website, including text, images, logos, course materials, and educational content, is
                                the property of Nefer Kali Healing & Spiritual Education and is protected by copyright laws. You may not
                                reproduce, distribute, or create derivative works without our written permission.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Limitation of Liability</h2>
                            <p className="text-white/70 leading-relaxed">
                                To the maximum extent permitted by law, Nefer Kali Healing & Spiritual Education shall not be liable for
                                any indirect, incidental, special, consequential, or punitive damages arising from your use of our products
                                or services, regardless of the cause of action.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Changes to Terms</h2>
                            <p className="text-white/70 leading-relaxed">
                                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately
                                upon posting to this page. Your continued use of our services after changes constitutes acceptance of the
                                revised terms.
                            </p>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-2xl font-display text-[#D4AF37] mb-4">Contact Us</h2>
                            <p className="text-white/70 leading-relaxed">
                                If you have questions about these Terms and Conditions, please contact us:
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

export default TermsAndConditions;
