import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, Flame, Wind, Heart, Shield, Sparkles } from 'lucide-react';
import CycleChart from '../../components/guides/CycleChart';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// FAQ data for schema
const stJohnsBushFAQs = [
    {
        question: 'What is St Johns Bush Tea?',
        answer: 'St Johns Bush (Justicia secunda) is a sacred Caribbean herb used for transformation and healing. It is different from European St Johns Wort and has powerful anti-inflammatory, antimicrobial, and hormone-balancing properties.'
    },
    {
        question: 'What are the benefits of St Johns Bush?',
        answer: 'Benefits include anti-inflammatory support for arthritis and muscle pain, antimicrobial properties, menstrual relief and cycle regulation, high flavonoid content with antioxidants, and menopause symptom support.'
    },
    {
        question: 'How do you prepare St Johns Bush Tea?',
        answer: 'Use 2 tablespoons of the herb, steep in 1-2 cups of boiling water, simmer for 15-20 minutes, then strain and enhance with agave or lemon.'
    },
    {
        question: 'When should you take St Johns Bush Tea?',
        answer: 'Begin consuming 2 weeks before your expected menstrual cycle. Take no longer than 2 weeks at a time. Can also be taken for pre-menopause and menopause symptoms.'
    },
    {
        question: 'Is St Johns Bush the same as St Johns Wort?',
        answer: 'No, St Johns Bush (Justicia secunda) is a Caribbean plant different from European St Johns Wort (Hypericum perforatum). They have different properties and uses.'
    }
];

export default function StJohnsBushTeaGuide() {
    return (
        <>
            <SEOHead
                title="St Johns Bush Tea Guide - Caribbean Healing Herb"
                description="Complete guide to St Johns Bush (Justicia secunda), a sacred Caribbean herb for menstrual support, anti-inflammatory benefits, and transformation. Learn dosage and benefits."
                keywords={['St Johns Bush', 'Justicia secunda', 'Caribbean herbs', 'menstrual support tea', 'anti-inflammatory herbs', 'womens health herbs']}
                url="/guides/st-johns-bush-tea"
                schema={[
                    getArticleSchema({
                        title: 'St Johns Bush Tea Guide',
                        slug: 'st-johns-bush-tea',
                        description: 'Sacred Caribbean herb for transformation and healing.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(stJohnsBushFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'St Johns Bush Tea', url: '/guides/st-johns-bush-tea' }
                    ])
                ]}
            />
            <div className="min-h-screen bg-gradient-to-b from-[#1a0505] via-[#2d1010] to-[#1a0505]">
                {/* Hero Section - Oya Theme */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Deep Red Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-red-800/40 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-rose-700/30 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-maroon-500/25 rounded-full blur-[110px]" />
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-red-300/80 hover:text-red-200 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-12">
                            {/* Oya Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-800/20 border border-red-500/30 mb-6">
                                <Wind className="w-4 h-4 text-red-400" />
                                <span className="text-red-200 text-sm font-medium">Blessed by Ọya • Winds of Change</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-300 via-rose-400 to-red-300 bg-clip-text text-transparent mb-4">
                                St John's Bush Tea
                            </h1>
                            <p className="text-xl text-red-100/70 max-w-2xl mx-auto">
                                Sacred Caribbean Herb for Transformation & Healing
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/st-johns-bush-guide.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-900/50"
                            >
                                <Leaf className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Iba Oya Welcome Message */}
                        <div className="bg-gradient-to-br from-red-900/40 to-rose-950/50 border border-red-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">🌪️</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-15">🍂</div>

                            <p className="text-2xl text-red-100 font-semibold text-center mb-3">
                                <span className="text-red-400">Ìbà Ọya!</span> 🙏🏾
                            </p>
                            <p className="text-rose-100/90 text-lg leading-relaxed text-center">
                                Thank you for your support. Nefer Kali Healing provides high quality healing products to help aid and assist in building your life force.
                            </p>
                            <p className="text-red-200/80 text-center mt-4">
                                St John's Bush carries the transformative energy of <span className="text-red-400 font-semibold">Ọya</span>,
                                Òrìṣà of winds, storms, and transitions — clearing what no longer serves and ushering in powerful change.
                            </p>
                            <p className="text-red-300/70 text-center mt-4 text-sm italic">
                                — Àṣẹ, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-red-900/30 to-rose-950/40 border border-red-400/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-red-600/20">
                                    <Leaf className="w-6 h-6 text-red-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-red-200">Sacred Ingredients</h2>
                            </div>
                            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6 text-center">
                                <p className="text-red-300 font-semibold text-lg">Organic St Lucian St John's Bush</p>
                                <p className="text-red-100/60 text-sm mt-1">Leaves and Stems • Caribbean Traditional Medicine</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-red-200">Benefits of St John's Bush</h2>
                            <p className="text-rose-200/60 mt-2">Powerful Caribbean healing tradition</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20">
                                        <Shield className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">Anti-Inflammatory</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Known for reducing inflammation, beneficial for arthritis and muscular discomfort.</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20">
                                        <Sparkles className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">Antimicrobial</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Traditionally used to combat bacterial and fungal infections.</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20">
                                        <Heart className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">Menstrual Relief</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Helps alleviate menstrual discomfort and regulate menstrual cycles.</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20">
                                        <Flame className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">High Flavonoid Content</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Rich in antioxidants — the red pigment indicates potent health benefits.</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20">
                                        <Wind className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">Menopause Support</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Helps manage symptoms like hormonal fluctuations and hot flashes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section with Cycle Chart */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-400/20 mb-4">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="text-red-300 text-sm font-medium">Sacred Use Guide</span>
                            </div>
                            <h2 className="text-3xl font-bold text-red-200">When to Take St John's Bush Tea</h2>
                            <p className="text-rose-200/70 mt-3 max-w-2xl mx-auto">
                                Begin consuming <span className="text-red-300 font-semibold">2 weeks before</span> you expect your menstrual cycle to begin.
                            </p>
                        </div>

                        {/* Animated Cycle Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 to-red-950/40 border border-red-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <CycleChart className="mb-8" />
                        </div>

                        {/* Brewing Instructions */}
                        <div className="mt-12 grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-red-300 mb-4">☕ Brewing Instructions</h3>
                                <ul className="space-y-3 text-red-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 flex-shrink-0">1.</span>
                                        <span>Use <span className="text-red-300 font-semibold whitespace-nowrap">2 tablespoons</span> of the herb</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 flex-shrink-0">2.</span>
                                        <span>Steep in <span className="text-red-300 font-semibold whitespace-nowrap">1-2 cups</span> of boiling water</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 flex-shrink-0">3.</span>
                                        <span>Simmer for <span className="text-red-300 font-semibold whitespace-nowrap">15-20 minutes</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 flex-shrink-0">4.</span>
                                        <span>Strain and enhance with Agave or lemon</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/40 border border-rose-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-rose-300 mb-4">⚠️ Important Note</h3>
                                <p className="text-rose-100/80 text-sm sm:text-base">
                                    <span className="text-rose-300 font-semibold">Take no longer than <span className="whitespace-nowrap">2 weeks</span> at a time.</span>
                                </p>
                                <p className="text-rose-200/60 text-sm mt-3">
                                    This tea can also be taken when noticing an onset of pre-menopause and menopause signs and symptoms.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-red-900/30 to-rose-950/40 border border-red-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🌪️</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🍂</div>

                            <Wind className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-xl text-red-200 mb-2 font-semibold">Ẹ̀pà Ọya, Ìyá wa!</p>
                            <p className="text-rose-100/80 mb-4">Praise to Oya, our Mother of Transformation</p>
                            <p className="text-lg text-red-100">May you be cleared, renewed, and empowered.</p>
                            <p className="text-red-300 font-semibold mt-4">Àṣẹ 🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-red-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-red-400 hover:text-red-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* View PDF Button */}
                        <a
                            href="/guides/st-johns-bush-guide.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-900/50"
                        >
                            <Leaf className="w-5 h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-12 px-4 border-t border-red-900/30">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-slate-900/50 border border-slate-600/30 rounded-xl p-6">
                            <h3 className="text-slate-300 font-semibold mb-3">Health Disclaimer</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                The information provided on this guide is for educational and informational purposes only and is not intended as medical advice.
                                The content has not been evaluated by the Food and Drug Administration (FDA) and is not intended to diagnose, treat, cure, or prevent any disease.
                                Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
                                Never disregard professional medical advice or delay in seeking it because of something you have read on this guide.
                                If you think you may have a medical emergency, call your doctor or emergency services immediately.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
