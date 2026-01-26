import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Wind, Heart, Sparkles, Leaf, Flame } from 'lucide-react';
import CycleChart from '../../components/guides/CycleChart';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// Expanded FAQ data targeting fibroid, uterine health, and ingredient searches
const hetHerWombTinctureFAQs = [
    // Fibroid & uterine health searches
    {
        question: 'What is the best natural remedy for fibroids?',
        answer: 'Het Her Womb Tincture contains St Johns Bush (Justicia secunda), a Caribbean herb traditionally used for centuries to support uterine health and fibroid wellness. It is available in both glycerin (alcohol-free) and spirits formulas for different preferences.'
    },
    {
        question: 'What tincture helps shrink fibroids naturally?',
        answer: 'Het Her Womb Tincture contains St Johns Bush (also called Blood Bush or Blood Root), which has been traditionally used in Caribbean medicine for fibroid support, heavy periods, and uterine health. Take during the luteal phase for best results.'
    },
    {
        question: 'What is the strongest herb for uterine fibroids?',
        answer: 'St Johns Bush (Justicia secunda) is considered one of the most powerful Caribbean herbs for fibroid and uterine support. Het Her Womb Tincture contains concentrated St Johns Bush extract designed specifically for womb health and fibroid wellness.'
    },
    // Ingredient-specific searches
    {
        question: 'What is St Johns Bush (Justicia secunda)?',
        answer: 'St Johns Bush (Justicia secunda), also called Blood Bush or Blood Root, is a powerful Caribbean herb exclusively grown in tropical regions. It has been used for generations to support womb health, fibroids, heavy bleeding, and menstrual issues. Het Her Womb Tincture contains this traditional herb.'
    },
    {
        question: 'What is Blood Root tincture used for?',
        answer: 'Blood Root (also called St Johns Bush or Justicia secunda) tincture is traditionally used for fibroid support, womb detoxification, heavy periods, menstrual cramps, and overall uterine wellness. Het Her Womb Tincture contains Blood Root in both glycerin and spirits formulas.'
    },
    {
        question: 'Is St Johns Bush the same as St Johns Wort?',
        answer: 'No, St Johns Bush (Justicia secunda or Blood Bush) is completely different from European St Johns Wort (Hypericum perforatum). St Johns Bush is a Caribbean herb specific to womb health and fibroids, while St Johns Wort is used for mood support. Het Her Womb contains St Johns Bush.'
    },
    // Product comparison
    {
        question: 'What is the difference between glycerin and spirits tincture?',
        answer: 'The Glycerin formula is alcohol-free (great for those avoiding alcohol) with dosage of 1-2 mL daily. The Spirits formula uses 190 proof organic cane spirits (stronger extraction) with dosage of 0.5-1 mL daily. Both contain organic St Johns Bush for fibroid and womb support.'
    },
    {
        question: 'Which Het Her Womb formula is better for fibroids?',
        answer: 'Both the Glycerin and Spirits formulas contain St Johns Bush (Justicia secunda) and support fibroid wellness. The Spirits formula offers stronger extraction, while Glycerin is alcohol-free. Choose based on your preference - both are effective for womb health.'
    },
    // Product questions
    {
        question: 'What is Het Her Womb Tincture?',
        answer: 'Het Her Womb Tincture is a Caribbean womb healing formula made with St Johns Bush (Justicia secunda or Blood Root). It is specifically designed for fibroids, menstrual health, hormonal balance, and womb detoxification. Available in both glycerin and spirits formulas.'
    },
    {
        question: 'When should you take Het Her Womb Tincture?',
        answer: 'Take after ovulation for 14-16 days, leading up to and throughout menstruation. Glycerin: 1-2 mL daily. Spirits: 0.5-1 mL daily. Can be taken for 30 days only once a year for a complete womb detox.'
    }
];

export default function HetHerWombTinctureGuide() {
    return (
        <>
            <SEOHead
                title="Het Her Womb Tincture - Best Natural Remedy for Fibroids with St Johns Bush"
                description="Caribbean womb healing tincture for fibroids with St Johns Bush (Justicia secunda), Blood Root, Blood Bush. Available in glycerin and spirits formulas. Natural fibroid and uterine health support."
                keywords={[
                    'fibroids natural remedy',
                    'fibroid tincture',
                    'St Johns Bush for fibroids',
                    'Justicia secunda',
                    'Blood Root tincture',
                    'Blood Bush herb',
                    'uterine fibroids herbs',
                    'womb health tincture',
                    'Het Her Womb tincture',
                    'Caribbean womb herbs',
                    'natural fibroid treatment',
                    'heavy period herbs',
                    'womb detox tincture',
                    'hormone balance herbs',
                    'menstrual health herbs'
                ]}
                url="/guides/het-her-womb-tincture"
                schema={[
                    getArticleSchema({
                        title: 'Natural Fibroid Remedy - Het Her Womb Tincture with St Johns Bush',
                        slug: 'het-her-womb-tincture',
                        description: 'Caribbean womb healing tincture with St Johns Bush (Justicia secunda) for fibroids and uterine health.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(hetHerWombTinctureFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Het Her Womb Tincture - Fibroid Support', url: '/guides/het-her-womb-tincture' }
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

                    {/* Floating Wind Animation 🌪️ */}
                    <div className="absolute top-32 right-16 opacity-25 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🌪️</span>
                    </div>

                    {/* Floating Leaf Animation 🍂 */}
                    <div className="absolute bottom-40 left-16 opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
                        <span className="text-5xl">🍂</span>
                    </div>

                    {/* Uterus Animation */}
                    <div className="absolute top-48 left-1/4 opacity-15 animate-pulse" style={{ animationDuration: '5s' }}>
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
                            <path d="M50 80 Q50 60, 30 50 Q10 40, 20 25 Q30 10, 40 20 Q50 30, 50 50 Q50 30, 60 20 Q70 10, 80 25 Q90 40, 70 50 Q50 60, 50 80 Z"
                                fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
                        </svg>
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
                                Het Her Womb Tincture
                            </h1>
                            <p className="text-xl text-red-100/70 max-w-2xl mx-auto">
                                Blood Bush • Sacred Caribbean Womb Healing
                            </p>
                        </div>

                        {/* TWO PDF Buttons - Glycerin & Spirits */}
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            <a
                                href="/guides/het-her-womb-glycerin.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-900/50"
                            >
                                <Leaf className="w-5 h-5" />
                                Glycerin PDF Guide
                            </a>
                            <a
                                href="/guides/het-her-womb-spirits.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-900/50"
                            >
                                <Flame className="w-5 h-5" />
                                Spirits PDF Guide
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
                                This divine and most gentle tincture, <span className="text-red-300 font-semibold">Het-Her Womb</span>,
                                comes from my admiration and devotion to the heavenly body Venus, the planet that represents women.
                            </p>
                            <p className="text-red-200/80 text-center mt-4">
                                Het Her Womb is made using <span className="text-red-400 font-semibold">St John's Bush</span> (Blood Root),
                                a high-power herb exclusively grown in the Caribbean. It is best used for improving
                                <span className="text-rose-300 font-semibold"> Fibroids</span> and <span className="text-rose-300 font-semibold">Menstrual health</span>.
                            </p>
                            <p className="text-red-300/70 text-center mt-4 text-sm italic">
                                — Àṣẹ, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Two Formula Options */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-red-200 text-center mb-8">Choose Your Formula</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Glycerin Option */}
                            <div className="bg-gradient-to-br from-emerald-900/30 to-green-950/40 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 rounded-xl bg-emerald-600/20">
                                        <Leaf className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-200">Glycerin Formula</h3>
                                        <p className="text-emerald-100/60 text-sm">Alcohol-Free Option</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 mb-4">
                                    <p className="text-emerald-300 font-semibold text-sm">Ingredients:</p>
                                    <p className="text-emerald-100/70 text-sm mt-1">
                                        Organic St Johns Bush, Organic Vegetable Palm Glycerin, Distilled Water
                                    </p>
                                </div>
                                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
                                    <p className="text-emerald-300 font-semibold text-sm">Dosage:</p>
                                    <p className="text-emerald-100/70 text-sm mt-1">
                                        Take <span className="text-emerald-300 font-semibold">1 to 2 mL daily</span>
                                    </p>
                                </div>
                            </div>

                            {/* Spirits Option */}
                            <div className="bg-gradient-to-br from-red-900/30 to-rose-950/40 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 rounded-xl bg-red-600/20">
                                        <Flame className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-red-200">Spirits Formula</h3>
                                        <p className="text-red-100/60 text-sm">Alcohol-Based Option</p>
                                    </div>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4 mb-4">
                                    <p className="text-red-300 font-semibold text-sm">Ingredients:</p>
                                    <p className="text-red-100/70 text-sm mt-1">
                                        Organic St Johns Bush, Organic 190 Proof Cane Spirits, Distilled & Structured Water
                                    </p>
                                </div>
                                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-300 font-semibold text-sm">Dosage:</p>
                                    <p className="text-red-100/70 text-sm mt-1">
                                        Take <span className="text-red-300 font-semibold">0.5 to 1 mL daily</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating Wind */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🌪️</span>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-red-200">Benefits of St John's Bush</h2>
                            <p className="text-rose-200/60 mt-2">When taken consistently with patience 🙏🏾</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-red-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-red-600/20 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-red-200">Anti-Inflammatory</h3>
                                </div>
                                <p className="text-red-100/70 text-sm">Reduces inflammation and supports comfort.</p>
                            </div>

                            <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/40 border border-rose-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-rose-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-rose-600/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-rose-200">Womb Detoxifying</h3>
                                </div>
                                <p className="text-rose-100/70 text-sm">Deep cleansing for the sacred feminine vessel.</p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/40 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-amber-500/20 group-hover:scale-110 transition-transform">
                                        <Droplets className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-amber-200">Iron Rich</h3>
                                </div>
                                <p className="text-amber-100/70 text-sm">Replenishes vital minerals for strength.</p>
                            </div>

                            <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/40 border border-pink-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-pink-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-pink-500/20 group-hover:scale-110 transition-transform">
                                        <Wind className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-pink-200">Hormone Balance</h3>
                                </div>
                                <p className="text-pink-100/70 text-sm">Promotes natural hormonal harmony.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section with Cycle Chart */}
                <section className="py-16 px-4 relative">
                    {/* Floating Leaf */}
                    <div className="absolute top-20 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🍂</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-400/20 mb-4">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="text-red-300 text-sm font-medium">Sacred Use Guide</span>
                            </div>
                            <h2 className="text-3xl font-bold text-red-200">When to Take Het Her Womb</h2>
                            <p className="text-rose-200/70 mt-3 max-w-2xl mx-auto">
                                Take after <span className="text-red-300 font-semibold">Ovulation</span> for 14-16 days,
                                leading up to and <span className="text-rose-300 font-semibold">throughout menstruation</span>.
                            </p>
                        </div>

                        {/* Animated Cycle Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 to-red-950/40 border border-red-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <CycleChart className="mb-8" />
                        </div>

                        {/* Usage Instructions */}
                        <div className="mt-12 grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-red-900/30 to-red-950/40 border border-red-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-red-300 mb-4">💧 Usage Instructions</h3>
                                <ul className="space-y-3 text-red-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 flex-shrink-0">•</span>
                                        <span><span className="text-red-300 font-semibold">Shake well</span> before use</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 flex-shrink-0">•</span>
                                        <span>Under the tongue or in room temperature drink</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 flex-shrink-0">⚠️</span>
                                        <span>Should <span className="text-amber-300 font-semibold">NOT</span> take longer than <span className="text-amber-300 font-semibold whitespace-nowrap">2 weeks</span> at a time</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/40 border border-rose-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-rose-300 mb-4">🌸 30-Day Detox Option</h3>
                                <p className="text-rose-100/80 text-sm sm:text-base">
                                    Can be taken for <span className="text-rose-300 font-semibold whitespace-nowrap">30 days consecutively</span> for
                                    one month <span className="text-rose-300 font-semibold">only</span> if doing a womb detox.
                                </p>
                                <p className="text-rose-200/60 text-sm mt-3 italic">
                                    This should only be done once a year.
                                </p>
                                <p className="text-amber-200/70 text-sm mt-4">
                                    🍂 Take consistently with a <span className="text-amber-300 font-semibold">CLEAN diet</span> for best results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🌪️</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-red-900/30 to-rose-950/40 border border-red-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🌪️</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🍂</div>

                            <Wind className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-xl text-red-200 mb-2 font-semibold">Ẹ̀pà Ọya, Ìyá wa!</p>
                            <p className="text-rose-100/80 mb-4">Praise to Oya, our Mother of Transformation</p>
                            <p className="text-lg text-red-100">May you be cleared, renewed, and empowered.</p>
                            <p className="text-red-300 font-semibold mt-4">🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-red-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-red-400 hover:text-red-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* Two PDF Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            <a
                                href="/guides/het-her-womb-glycerin.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-900/50"
                            >
                                <Leaf className="w-5 h-5" />
                                Glycerin PDF
                            </a>
                            <a
                                href="/guides/het-her-womb-spirits.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-red-900/50"
                            >
                                <Flame className="w-5 h-5" />
                                Spirits PDF
                            </a>
                        </div>
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
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
