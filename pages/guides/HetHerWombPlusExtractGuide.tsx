import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Sun, Heart, Sparkles, Leaf } from 'lucide-react';
import CycleChart from '../../components/guides/CycleChart';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// Expanded FAQ data targeting fibroid, uterine health, and ingredient searches
const hetHerWombExtractFAQs = [
    // Fibroid & uterine health searches
    {
        question: 'What is the best tincture for fibroids?',
        answer: 'Het Her Womb PLUS Extract contains St Johns Bush (Justicia secunda), a Caribbean herb traditionally used for centuries to support uterine health and fibroid wellness. Combined with Blue Vervain and Red Raspberry Leaf, it provides comprehensive womb support.'
    },
    {
        question: 'What herbs help with uterine fibroids naturally?',
        answer: 'Herbs traditionally used for fibroid support include St Johns Bush (Blood Bush or Justicia secunda), Blue Vervain for hormonal balance, and Red Raspberry Leaf for uterine toning. Het Her Womb PLUS Extract contains all three of these powerful womb-supporting herbs.'
    },
    {
        question: 'What is St Johns Bush extract good for?',
        answer: 'St Johns Bush (Justicia secunda) extract is traditionally used for fibroids, heavy periods, menstrual cramps, womb detoxification, and overall uterine health. Het Her Womb PLUS Extract contains St Johns Bush along with Blue Vervain and Red Raspberry Leaf for complete womb support.'
    },
    // Ingredient-specific searches
    {
        question: 'What is Justicia secunda and what is it used for?',
        answer: 'Justicia secunda (commonly called St Johns Bush, Blood Bush, or Blood Root) is a Caribbean herb traditionally used for womb health, fibroids, menstrual issues, and hormonal balance. Het Her Womb PLUS Extract contains Justicia secunda as its primary healing ingredient.'
    },
    {
        question: 'What is Blood Bush herb and does it help with fibroids?',
        answer: 'Blood Bush (also called St Johns Bush or Justicia secunda) is a powerful Caribbean herb used for generations to support womb health and fibroid wellness. It helps with hormone balance, heavy bleeding, and uterine detoxification. Het Her Womb products contain this traditional herb.'
    },
    // Womb wellness searches
    {
        question: 'How do you naturally support womb health?',
        answer: 'Natural womb support includes taking herbs like St Johns Bush (Justicia secunda), Blue Vervain, and Red Raspberry Leaf during the luteal phase. Het Her Womb PLUS Extract combines these herbs in a tincture form for easy absorption and fast results.'
    },
    {
        question: 'What is the best herbal extract for hormone balance?',
        answer: 'Het Her Womb PLUS Extract supports hormone balance through St Johns Bush, Blue Vervain (which calms the nervous system and regulates hormones), and Red Raspberry Leaf for uterine toning. It is available in both glycerin and spirits formulas.'
    },
    // Product questions
    {
        question: 'What is Het Her Womb PLUS Extract?',
        answer: 'Het Her Womb PLUS Extract is a womb health tincture containing St Johns Bush (Justicia secunda), Blue Vervain, Red Raspberry Leaf, vegetable glycerin, and cane spirits. It supports fibroids, hormonal balance, menstrual comfort, and womb detoxification. Named after Het-Heru (Hathor).'
    },
    {
        question: 'When should you take Het Her Womb PLUS Extract?',
        answer: 'Take after ovulation for 14-16 days, leading up to and throughout menstruation. Take 0.5-2 mL daily under the tongue or in room temperature water. Can be taken for 30 consecutive days once a year for a complete womb detox.'
    },
    {
        question: 'Is St Johns Bush the same as St Johns Wort?',
        answer: 'No, St Johns Bush (Justicia secunda) is completely different from European St Johns Wort (Hypericum perforatum). St Johns Bush is a Caribbean herb for womb health and fibroids, while St Johns Wort is used for mood. Het Her Womb products contain St Johns Bush, not St Johns Wort.'
    }
];

export default function HetHerWombPlusExtractGuide() {
    return (
        <>
            <SEOHead
                title="Het Her Womb PLUS Extract - Fibroid & Uterine Support with St Johns Bush"
                description="Natural tincture for fibroids and uterine health with St Johns Bush (Justicia secunda), Blood Bush, Blue Vervain, and Red Raspberry Leaf. Womb detox and hormone balance support."
                keywords={[
                    'fibroid tincture',
                    'St Johns Bush extract',
                    'Justicia secunda',
                    'Blood Bush tincture',
                    'uterine health herbs',
                    'womb detox tincture',
                    'herbal extract for fibroids',
                    'hormone balance herbs',
                    'Het Her Womb extract',
                    'womb health tincture',
                    'womens health herbs',
                    'menstrual support tincture',
                    'PMS herbs',
                    'natural fibroid remedy',
                    'Caribbean womb herbs'
                ]}
                url="/guides/het-her-womb-plus-extract"
                schema={[
                    getArticleSchema({
                        title: 'Fibroid & Uterine Support - Het Her Womb PLUS Extract with St Johns Bush',
                        slug: 'het-her-womb-plus-extract',
                        description: 'Natural tincture with St Johns Bush (Justicia secunda) for fibroids and uterine health.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(hetHerWombExtractFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Het Her Womb PLUS Extract - Fibroid Support', url: '/guides/het-her-womb-plus-extract' }
                    ])
                ]}
            />

            <div className="min-h-screen bg-gradient-to-b from-[#0a1a0a] via-[#1a2d1a] to-[#0a1510]">
                {/* Hero Section - Oshun Theme with Green/Pink/Gold */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Oshun Glow Background - Green, Pink, Gold */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500/30 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-400/25 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-amber-400/20 rounded-full blur-[110px]" />
                    </div>

                    {/* Floating Uterus Animation */}
                    <div className="absolute top-32 right-20 opacity-20 animate-pulse">
                        <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                            <path d="M50 80 Q50 60, 30 50 Q10 40, 20 25 Q30 10, 40 20 Q50 30, 50 50 Q50 30, 60 20 Q70 10, 80 25 Q90 40, 70 50 Q50 60, 50 80 Z"
                                fill="#f472b6" stroke="#ec4899" strokeWidth="2" />
                            <circle cx="25" cy="20" r="8" fill="#fbbf24" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
                            <circle cx="75" cy="20" r="8" fill="#fbbf24" className="animate-bounce" style={{ animationDelay: '0.8s' }} />
                        </svg>
                    </div>

                    {/* Floating Honey Pot Animation */}
                    <div className="absolute bottom-40 left-16 opacity-25 animate-bounce" style={{ animationDuration: '3s' }}>
                        <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
                            <ellipse cx="30" cy="55" rx="25" ry="12" fill="#f59e0b" />
                            <rect x="10" y="25" width="40" height="30" rx="5" fill="#fbbf24" />
                            <rect x="15" y="15" width="30" height="15" rx="3" fill="#d97706" />
                            <text x="30" y="45" textAnchor="middle" fill="#fff" fontSize="12">🍯</text>
                        </svg>
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
                            {/* Oshun Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 mb-6">
                                <Sun className="w-4 h-4 text-amber-300" />
                                <span className="text-amber-200 text-sm font-medium">Blessed by Ọ̀ṣun • Divine Feminine</span>
                                <span className="text-lg">🍯</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-300 via-pink-300 to-amber-200 bg-clip-text text-transparent mb-4">
                                Het Her Womb PLUS
                            </h1>
                            <p className="text-xl text-emerald-100/70 max-w-2xl mx-auto">
                                Sacred Tincture for Divine Feminine Restoration
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/het-her-womb-plus-extract.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 via-amber-600 to-pink-600 hover:from-emerald-500 hover:via-amber-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50"
                            >
                                <Droplets className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Orí Yèyé O Welcome Message */}
                        <div className="bg-gradient-to-br from-emerald-900/40 via-amber-950/30 to-pink-950/40 border border-amber-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">🌻</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-20">🍯</div>
                            <div className="absolute top-1/2 right-8 opacity-15 animate-pulse">
                                <svg width="50" height="50" viewBox="0 0 100 100" fill="none">
                                    <path d="M50 80 Q50 60, 30 50 Q10 40, 20 25 Q30 10, 40 20 Q50 30, 50 50 Q50 30, 60 20 Q70 10, 80 25 Q90 40, 70 50 Q50 60, 50 80 Z"
                                        fill="#10b981" stroke="#34d399" strokeWidth="2" />
                                </svg>
                            </div>

                            <p className="text-2xl text-amber-100 font-semibold text-center mb-3">
                                <span className="text-amber-300">Orí Yèyé O</span> 🙏🏾
                            </p>
                            <p className="text-pink-100/90 text-lg leading-relaxed text-center">
                                This divine tincture channels the sacred wisdom of <span className="text-amber-300 font-semibold">Het-Heru</span>,
                                also known as <span className="text-amber-300 font-semibold">Oshun</span> in the Ifa tradition.
                            </p>
                            <p className="text-amber-200/80 text-center mt-4">
                                Each herb carries her vibrational signature of joyful energy,
                                working in harmony to restore sacred balance to the divine feminine vessel.
                            </p>
                            <p className="text-pink-300/70 text-center mt-4 text-sm italic">
                                — Àṣẹ, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-emerald-900/30 to-amber-950/40 border border-emerald-400/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-500/20">
                                    <Leaf className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-emerald-200">Sacred Ingredients</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 text-center">
                                    <p className="text-emerald-300 font-semibold">St John's Bush</p>
                                    <p className="text-emerald-100/60 text-sm mt-1">Organic • Caribbean</p>
                                </div>
                                <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-4 text-center">
                                    <p className="text-pink-300 font-semibold">Blue Vervain</p>
                                    <p className="text-pink-100/60 text-sm mt-1">Organic • Nervine</p>
                                </div>
                                <div className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-4 text-center">
                                    <p className="text-rose-300 font-semibold">Red Raspberry Leaf</p>
                                    <p className="text-rose-100/60 text-sm mt-1">Organic • Uterine Tonic</p>
                                </div>
                                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-amber-300 font-semibold">Vegetable Glycerin</p>
                                    <p className="text-amber-100/60 text-sm mt-1">Palm Derived • Organic</p>
                                </div>
                                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-center">
                                    <p className="text-yellow-300 font-semibold">Cane Spirits</p>
                                    <p className="text-yellow-100/60 text-sm mt-1">200 Proof • Organic</p>
                                </div>
                                <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4 text-center">
                                    <p className="text-cyan-300 font-semibold">Distilled Water</p>
                                    <p className="text-cyan-100/60 text-sm mt-1">Pure • Cleansing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section with Uterus Animation */}
                <section className="py-16 px-4 relative">
                    {/* Floating Uterus */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                            <path d="M50 80 Q50 60, 30 50 Q10 40, 20 25 Q30 10, 40 20 Q50 30, 50 50 Q50 30, 60 20 Q70 10, 80 25 Q90 40, 70 50 Q50 60, 50 80 Z"
                                fill="#f472b6" stroke="#ec4899" strokeWidth="2" />
                        </svg>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                                Benefits of Het Her Womb PLUS
                            </h2>
                            <p className="text-emerald-200/60 mt-2">When taken consistently with patience 🍯</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/40 border border-pink-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-pink-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-pink-500/20 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-pink-200">Anti-Inflammatory</h3>
                                </div>
                                <p className="text-pink-100/70 text-sm">Reduces inflammation and supports comfort.</p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/40 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-emerald-200">Womb Detoxifying</h3>
                                </div>
                                <p className="text-emerald-100/70 text-sm">Deep cleansing for the sacred feminine vessel.</p>
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

                            <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/40 border border-rose-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-rose-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-rose-500/20 group-hover:scale-110 transition-transform">
                                        <Sun className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-rose-200">Hormone Balance</h3>
                                </div>
                                <p className="text-rose-100/70 text-sm">Promotes natural hormonal harmony.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section with Cycle Chart */}
                <section className="py-16 px-4 relative">
                    {/* Honey Pot Decoration */}
                    <div className="absolute top-20 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-6xl">🍯</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-400/20 mb-4">
                                <Heart className="w-4 h-4 text-pink-400" />
                                <span className="text-pink-300 text-sm font-medium">Sacred Use Guide</span>
                                <span className="text-lg">🍯</span>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                                When to Take Het Her Womb PLUS
                            </h2>
                            <p className="text-pink-200/70 mt-3 max-w-2xl mx-auto">
                                Take after <span className="text-amber-300 font-semibold">Ovulation</span> for 14-16 days,
                                leading up to and <span className="text-pink-300 font-semibold">throughout menstruation</span>.
                            </p>
                        </div>

                        {/* Animated Cycle Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 via-emerald-950/30 to-pink-950/40 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <CycleChart className="mb-8" productName="Het Her Womb PLUS Extract" />
                        </div>

                        {/* Dosage Instructions */}
                        <div className="mt-12 grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/40 border border-emerald-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-emerald-300 mb-4">💧 Suggested Use</h3>
                                <ul className="space-y-3 text-emerald-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-400 flex-shrink-0">•</span>
                                        <span><span className="text-emerald-300 font-semibold">Shake well</span> before use</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-400 flex-shrink-0">•</span>
                                        <span>Take <span className="text-emerald-300 font-semibold whitespace-nowrap">0.5 - 2 mL</span> daily</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-400 flex-shrink-0">•</span>
                                        <span>Under the tongue or in room temperature drink</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 flex-shrink-0">⚠️</span>
                                        <span>Should <span className="text-amber-300 font-semibold">NOT</span> take longer than <span className="text-amber-300 font-semibold whitespace-nowrap">2 weeks</span> at a time</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/40 border border-pink-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-pink-300 mb-4">🌸 30-Day Detox Option</h3>
                                <p className="text-pink-100/80 text-sm sm:text-base">
                                    Can be taken for <span className="text-pink-300 font-semibold whitespace-nowrap">30 days consecutively</span> for
                                    one month <span className="text-pink-300 font-semibold">only</span> if doing a womb detox.
                                </p>
                                <p className="text-pink-200/60 text-sm mt-3 italic">
                                    This should only be done once a year.
                                </p>
                                <p className="text-amber-200/70 text-sm mt-4">
                                    🍯 Take consistently with a <span className="text-amber-300 font-semibold">CLEAN diet</span> for best results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🌻</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-amber-900/30 via-emerald-950/30 to-pink-950/40 border border-amber-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🌻</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🍯</div>

                            <Sun className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                            <p className="text-xl text-amber-200 mb-2 font-semibold">Ore Yèyé O, Ọ̀ṣun</p>
                            <p className="text-pink-100/80 mb-4">Praise to the Mother of Sweet Waters</p>
                            <p className="text-lg text-emerald-100">May your womb be blessed, nourished, and restored.</p>
                            <p className="text-amber-300 font-semibold mt-4">Àṣẹ 🙏🏾</p>

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
                            href="/guides/het-her-womb-plus-extract.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-emerald-600 via-amber-600 to-pink-600 hover:from-emerald-500 hover:via-amber-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-12 px-4 border-t border-emerald-900/30">
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
