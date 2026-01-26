import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Leaf, Shield, Heart, Sparkles, Flame } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// FAQ data for schema
const cashewBarkFAQs = [
    {
        question: 'What is Cashew Bark Extract?',
        answer: 'Cashew Bark Extract is a traditional St Lucian herbal remedy made from cashew bark in organic cane spirits and distilled water. It contains powerful healing compounds with antibacterial and anti-inflammatory properties.'
    },
    {
        question: 'What are the benefits of Cashew Bark?',
        answer: 'Benefits include antibacterial properties for fighting infections, anti-inflammatory effects for arthritis and pain, antioxidant-rich for cell protection, and gastrointestinal health support.'
    },
    {
        question: 'How do you take Cashew Bark Extract?',
        answer: 'Shake well before use. Take 4 drops or up to 0.5 mL when needed. You can increase the dose slowly as you see fit. For best results, add drops to room temperature water.'
    },
    {
        question: 'What is Cashew Bark traditionally used for?',
        answer: 'In St Lucian traditional medicine, Cashew Bark is used for treating skin infections, gastrointestinal bacterial issues, arthritis, swelling, and pain management.'
    },
    {
        question: 'Is Cashew Bark safe?',
        answer: 'Cashew Bark Extract should be taken as directed. A clean diet is preferable for boosted performance. Always consult a healthcare provider before use if you have existing conditions.'
    }
];

export default function CashewBarkGuide() {
    return (
        <>
            <SEOHead
                title="Cashew Bark Extract Guide - St Lucian Traditional Remedy"
                description="Traditional St Lucian Cashew Bark Extract with antibacterial and anti-inflammatory properties. Learn about this powerful herbal remedy for infections and inflammation."
                keywords={['Cashew Bark', 'St Lucian herbs', 'antibacterial herbs', 'anti-inflammatory herbs', 'traditional herbal remedy']}
                url="/guides/cashew-bark"
                schema={[
                    getArticleSchema({
                        title: 'Cashew Bark Extract Guide',
                        slug: 'cashew-bark',
                        description: 'Traditional St Lucian herbal remedy with antibacterial properties.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(cashewBarkFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Cashew Bark Extract', url: '/guides/cashew-bark' }
                    ])
                ]}
            />
            <div className="min-h-screen bg-gradient-to-b from-[#120a06] via-[#1f1510] to-[#120a06]">
                {/* Hero Section - Warm Earthy Theme: Browns, Ambers, Coppers */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Warm Earthy Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-800/30 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-orange-700/25 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-yellow-800/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-red-800/20 rounded-full blur-[110px]" />
                    </div>

                    {/* Floating Nut Animation 🥜 */}
                    <div className="absolute top-32 right-16 opacity-30 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-6xl">🥜</span>
                    </div>

                    {/* Floating Tree 🌴 */}
                    <div className="absolute bottom-40 left-16 opacity-25 animate-pulse" style={{ animationDuration: '3s' }}>
                        <span className="text-5xl">🌴</span>
                    </div>

                    {/* Floating Water 💧 */}
                    <div className="absolute top-48 left-1/4 opacity-20 animate-pulse" style={{ animationDuration: '5s' }}>
                        <span className="text-4xl">💧</span>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-amber-300/80 hover:text-amber-200 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent mb-4">
                                Cashew Bark Extract
                            </h1>
                            <p className="text-xl text-amber-100/70 max-w-2xl mx-auto">
                                St Lucian Traditional Remedy • Antibacterial • Anti-inflammatory
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/cashew-bark.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-600 hover:to-orange-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50"
                            >
                                <Droplets className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Welcome Message */}
                        <div className="bg-gradient-to-br from-amber-950/60 via-orange-950/40 to-yellow-950/50 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">🥜</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-15">🌴</div>

                            <p className="text-2xl text-amber-100 font-semibold text-center mb-3">
                                <span className="text-orange-300">Tua U</span> 🙏🏾
                            </p>
                            <p className="text-yellow-100/90 text-lg leading-relaxed text-center">
                                Thank you (or in our ancient language of <span className="text-amber-300 font-semibold">Kamit</span>, Tua U) for your support.
                                Nefer Kali Healing provides high quality healing products to help aid and assist in building your life force.
                            </p>
                            <p className="text-amber-200/80 text-center mt-4">
                                <span className="text-orange-300 font-semibold">Cashew Bark Extract</span> is a traditional herbal remedy with
                                <span className="text-yellow-300 font-semibold"> powerful healing compounds</span>.
                            </p>
                            <p className="text-amber-400/70 text-center mt-4 text-sm italic">
                                — In Healing & Strength, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating nut */}
                    <div className="absolute top-10 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-4xl">🥜</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/40 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-amber-600/20">
                                    <Leaf className="w-6 h-6 text-amber-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-amber-200">Sacred Ingredients</h2>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-amber-900/30 border border-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-amber-300 font-semibold">St Lucian Cashew Bark</p>
                                    <p className="text-amber-100/60 text-sm mt-1">Traditional • Healing</p>
                                </div>
                                <div className="bg-orange-900/30 border border-orange-500/20 rounded-xl p-4 text-center">
                                    <p className="text-orange-300 font-semibold">Organic Cane Spirits</p>
                                    <p className="text-orange-100/60 text-sm mt-1">Pure • Extraction</p>
                                </div>
                                <div className="bg-yellow-900/30 border border-yellow-500/20 rounded-xl p-4 text-center">
                                    <p className="text-yellow-300 font-semibold">Distilled Water</p>
                                    <p className="text-yellow-100/60 text-sm mt-1">Clean • Pure</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating palm */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🌴</span>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
                                Benefits of Cashew Bark
                            </h2>
                            <p className="text-amber-300/60 mt-2">Traditional herbal healing power 🥜</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-amber-950/50 to-amber-900/40 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-amber-600/20 group-hover:scale-110 transition-transform">
                                        <Shield className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-amber-200">Antibacterial Properties</h3>
                                </div>
                                <p className="text-amber-100/70 text-sm">Cashew bark contains compounds that exhibit antibacterial activity, making it potentially effective in combating bacterial infections. This can be particularly beneficial in treating skin infections or gastrointestinal bacterial issues.</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-950/50 to-orange-900/40 border border-orange-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-orange-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-orange-600/20 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-orange-200">Anti-inflammatory Effects</h3>
                                </div>
                                <p className="text-orange-100/70 text-sm">The bark of the cashew tree is known for its anti-inflammatory properties. It can be used to alleviate inflammation in the body, which is beneficial for conditions like arthritis, swelling, and pain management.</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/40 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-yellow-600/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-yellow-200">Antioxidant Rich</h3>
                                </div>
                                <p className="text-yellow-100/70 text-sm">Cashew bark contains antioxidants, which are compounds that fight against free radicals in the body. These antioxidants can help in preventing cell damage and reducing the risk of chronic diseases.</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-950/50 to-red-900/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20 group-hover:scale-110 transition-transform">
                                        <Flame className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">Gastrointestinal Health</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Some traditional medicinal uses of cashew bark include treating stomach and intestinal ailments. It may help in soothing digestive issues and improving overall gastrointestinal health.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Usage Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating pepper */}
                    <div className="absolute top-20 right-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🌶️</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
                                Suggested Use
                            </h2>
                        </div>

                        <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/40 border border-amber-500/20 rounded-xl p-6">
                            <ul className="space-y-4 text-amber-100/80">
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400">•</span>
                                    <span><span className="text-amber-300 font-semibold">Shake well</span> before use</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400">•</span>
                                    <span>Take <span className="text-amber-300 font-semibold">4 drops or up to 0.5 mL</span> when needed</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400">•</span>
                                    <span>You can <span className="text-orange-300 font-semibold">increase the dose slowly</span> as you see fit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400">•</span>
                                    <span>For best results, add the drops to <span className="text-yellow-300 font-semibold">room temperature water</span></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400">•</span>
                                    <span>This helps preserve the potency and ensures easier absorption</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-orange-400">🥗</span>
                                    <span><span className="text-orange-300 font-semibold">Clean diet</span> is preferable for boosted performance of this tincture</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🥜</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-amber-950/50 via-orange-950/40 to-yellow-950/50 border border-amber-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🥜</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🌴</div>

                            <Leaf className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                            <p className="text-xl text-amber-200 mb-2 font-semibold">Tua U</p>
                            <p className="text-orange-100/80 mb-4">Thank you in the ancient language of Kamit</p>
                            <p className="text-lg text-amber-100">May the healing compounds of traditional herbal medicine support your wellness journey.</p>
                            <p className="text-amber-300 font-semibold mt-4">🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-amber-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-amber-400 hover:text-amber-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* View PDF Button */}
                        <a
                            href="/guides/cashew-bark.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-600 hover:to-orange-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-12 px-4 border-t border-amber-900/30">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-slate-900/50 border border-slate-600/30 rounded-xl p-6">
                            <h3 className="text-slate-300 font-semibold mb-3">Health Disclaimer</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                The information provided on this guide is for educational and informational purposes only and is not intended as medical advice.
                                The content has not been evaluated by the Food and Drug Administration (FDA) and is not intended to diagnose, treat, cure, or prevent any disease.
                                Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
