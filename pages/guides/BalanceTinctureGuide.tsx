import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Scale, Heart, Sparkles, Leaf, Feather } from 'lucide-react';
import CycleChart from '../../components/guides/CycleChart';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// Expanded FAQ data targeting fibroid, uterine care, St Johns Bush, and hormonal searches
const balanceTinctureFAQs = [
    // Fibroid & uterine health searches
    {
        question: 'What tincture helps with fibroids naturally?',
        answer: 'Balance Tincture contains St Johns Bush (Justicia secunda), known in Caribbean tradition as one of the most powerful herbs for fibroid and uterine support. Combined with adaptogens like Ashwagandha and Red Reishi, it supports hormonal balance which is key for fibroid management.'
    },
    {
        question: 'What herbs support uterine health and hormonal balance?',
        answer: 'Herbs that support uterine health include St Johns Bush (Blood Bush) for womb wellness, Red Raspberry Leaf for uterine toning, and adaptogenic herbs like Ashwagandha for stress-hormone balance. Balance Tincture combines all of these with Red Reishi Mushroom, Burdock Root, and Dandelion Root.'
    },
    {
        question: 'How does St Johns Bush help with womb health?',
        answer: 'St Johns Bush (Justicia secunda), also called Blood Bush, is a Caribbean herb traditionally used for centuries to support womb cleansing, fibroid relief, menstrual comfort, and overall uterine wellness. Balance Tincture contains St Johns Bush as a primary ingredient for womb support.'
    },
    // Ingredient-specific searches
    {
        question: 'What is Blood Bush tincture used for?',
        answer: 'Blood Bush (St Johns Bush or Justicia secunda) tincture is traditionally used for womb health, fibroid support, hormonal balance, heavy periods, and menstrual pain. Balance Tincture contains Blood Bush along with adaptogens for comprehensive feminine wellness support.'
    },
    {
        question: 'Does Ashwagandha help with hormonal balance?',
        answer: 'Yes, Ashwagandha is an adaptogenic herb that helps regulate stress hormones (cortisol), which directly impacts reproductive hormones like estrogen and progesterone. Balance Tincture contains Ashwagandha along with St Johns Bush and Red Reishi for complete hormonal support.'
    },
    {
        question: 'What is Red Reishi Mushroom good for in women?',
        answer: 'Red Reishi Mushroom supports the immune system, reduces inflammation, and helps the body adapt to stress. For women, it supports hormone balance and overall wellness. Balance Tincture combines Red Reishi with St Johns Bush and other womb-supporting herbs.'
    },
    // PMS and menstrual searches
    {
        question: 'What natural tincture helps with PMS symptoms?',
        answer: 'Balance Tincture helps with PMS symptoms by combining St Johns Bush (Blood Bush) for womb support, Ashwagandha for stress relief, Red Raspberry Leaf for uterine toning, and Holy Basil for mood balance. Take during the luteal phase (after ovulation) for best results.'
    },
    {
        question: 'What herbs help with hormone balance naturally?',
        answer: 'Herbs that help with hormone balance include St Johns Bush (Justicia secunda) for womb health, Ashwagandha for stress hormones, Burdock Root and Dandelion Root for liver detox (which processes hormones), and Holy Basil for mood. Balance Tincture contains all of these herbs.'
    },
    // Product questions
    {
        question: 'What is Balance Tincture and what does it contain?',
        answer: 'Balance Tincture is a herbal formula containing St Johns Bush (Justicia secunda), Peppermint, Red Raspberry Leaf, Holy Basil Krishna, Red Reishi Mushroom, Ashwagandha, Burdock Root, and Dandelion Root in organic cane spirits. It is designed for uterine health, fibroids, hormonal balance, and PMS support.'
    },
    {
        question: 'When should I take Balance Tincture in my cycle?',
        answer: 'Take Balance Tincture after ovulation for 14-16 days, leading up to menstruation. This is during the luteal phase. Take 0.5-2 mL daily under the tongue or in room temperature water. Should not be taken longer than 2 weeks without practitioner guidance.'
    },
    {
        question: 'Is St Johns Bush the same as St Johns Wort?',
        answer: 'No, St Johns Bush (Justicia secunda or Blood Bush) is completely different from European St Johns Wort (Hypericum perforatum). St Johns Bush is a Caribbean herb for womb health and fibroids, while St Johns Wort is used for mood. Balance Tincture contains St Johns Bush.'
    }
];

export default function BalanceTinctureGuide() {
    return (
        <>
            <SEOHead
                title="Balance Tincture - Natural Fibroid & Hormone Support with St Johns Bush"
                description="Herbal tincture for fibroids, uterine health, and hormonal balance with St Johns Bush (Justicia secunda), Blood Bush, Ashwagandha, and Red Reishi. Natural PMS and womb health support."
                keywords={[
                    'fibroid tincture',
                    'hormone balance tincture',
                    'St Johns Bush tincture',
                    'Justicia secunda',
                    'Blood Bush herb',
                    'uterine health herbs',
                    'womb health tincture',
                    'PMS tincture',
                    'Ashwagandha tincture',
                    'Red Reishi for women',
                    'Balance Tincture',
                    'womens health herbs',
                    'herbal tincture for fibroids',
                    'hormone tincture',
                    'detox tincture',
                    'adaptogenic herbs for women'
                ]}
                url="/guides/balance-tincture"
                schema={[
                    getArticleSchema({
                        title: 'Natural Fibroid & Hormone Support - Balance Tincture with St Johns Bush',
                        slug: 'balance-tincture',
                        description: 'Herbal tincture with St Johns Bush (Justicia secunda) for fibroids, hormonal balance, and womb wellness.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(balanceTinctureFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Balance Tincture - Fibroid & Hormone Support', url: '/guides/balance-tincture' }
                    ])
                ]}
            />

            <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d1a2d] to-[#0a1020]">
                {/* Hero Section - Ma'at Theme: Blue, Gold, Yellow */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Ma'at Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-400/25 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-blue-400/20 rounded-full blur-[110px]" />
                    </div>

                    {/* Floating Mushroom Animation */}
                    <div className="absolute top-32 right-16 opacity-25 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🍄</span>
                    </div>

                    {/* Floating Praying Hands Animation */}
                    <div className="absolute bottom-40 left-16 opacity-20 animate-pulse" style={{ animationDuration: '3s' }}>
                        <span className="text-5xl">🙏🏾</span>
                    </div>

                    {/* Floating Peace Sign Animation */}
                    <div className="absolute top-48 left-1/4 opacity-20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                        <span className="text-4xl">☮️</span>
                    </div>

                    {/* Feather of Ma'at */}
                    <div className="absolute bottom-32 right-28 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-6xl">🪶</span>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-blue-300/80 hover:text-blue-200 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-12">
                            {/* Ma'at Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 mb-6">
                                <Scale className="w-4 h-4 text-yellow-300" />
                                <span className="text-blue-200 text-sm font-medium">Blessed by Ma'at • Truth & Balance</span>
                                <span className="text-lg">🪶</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent mb-4">
                                Balance Tincture
                            </h1>
                            <p className="text-xl text-blue-100/70 max-w-2xl mx-auto">
                                Sacred Harmony of Ancient Plant Wisdom
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/balance-tincture.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-yellow-500 to-amber-500 hover:from-blue-500 hover:via-yellow-400 hover:to-amber-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-900/50"
                            >
                                <Droplets className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Ma'at Welcome Message */}
                        <div className="bg-gradient-to-br from-blue-900/40 via-slate-900/30 to-amber-950/40 border border-blue-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">🪶</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-20">☮️</div>
                            <div className="absolute top-1/2 right-8 opacity-15 animate-pulse">
                                <span className="text-3xl">🍄</span>
                            </div>

                            <p className="text-2xl text-yellow-100 font-semibold text-center mb-3">
                                <span className="text-yellow-300">Tua U Ma'at</span> 🙏🏾
                            </p>
                            <p className="text-blue-100/90 text-lg leading-relaxed text-center">
                                The Balance Tincture is a sacred harmony of ancient plant wisdom,
                                crafted to restore the divine rhythms of the feminine cycle.
                            </p>
                            <p className="text-yellow-200/80 text-center mt-4">
                                This blend connects with the primal energies of the womb space,
                                channeling nature's healing intelligence to bring <span className="text-yellow-300 font-semibold">equilibrium</span> to
                                both physical and energetic bodies.
                            </p>
                            <p className="text-blue-300/70 text-center mt-4 text-sm italic">
                                — In Truth & Balance, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating mushroom */}
                    <div className="absolute top-10 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-4xl">🍄</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-blue-900/30 to-amber-950/40 border border-blue-400/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-yellow-500/20">
                                    <Leaf className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-yellow-200">Sacred Ingredients</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 text-center">
                                    <p className="text-blue-300 font-semibold">St John's Bush</p>
                                    <p className="text-blue-100/60 text-sm mt-1">Inner Balance</p>
                                </div>
                                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-center">
                                    <p className="text-yellow-300 font-semibold">Peppermint</p>
                                    <p className="text-yellow-100/60 text-sm mt-1">Refreshing • Calming</p>
                                </div>
                                <div className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-4 text-center">
                                    <p className="text-rose-300 font-semibold">Red Raspberry Leaf</p>
                                    <p className="text-rose-100/60 text-sm mt-1">Uterine Tonic</p>
                                </div>
                                <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4 text-center">
                                    <p className="text-green-300 font-semibold">Holy Basil Krishna</p>
                                    <p className="text-green-100/60 text-sm mt-1">Divine Protection</p>
                                </div>
                                <div className="bg-red-900/20 border border-red-400/20 rounded-xl p-4 text-center flex flex-col items-center">
                                    <p className="text-red-300 font-semibold">Red Reishi Mushroom 🍄</p>
                                    <p className="text-red-100/60 text-sm mt-1">Spiritual Longevity</p>
                                </div>
                                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-amber-300 font-semibold">Ashwagandha</p>
                                    <p className="text-amber-100/60 text-sm mt-1">Grounding • Adaptogenic</p>
                                </div>
                                <div className="bg-yellow-900/20 border border-yellow-400/20 rounded-xl p-4 text-center">
                                    <p className="text-yellow-300 font-semibold">Burdock Root</p>
                                    <p className="text-yellow-100/60 text-sm mt-1">Deep Cleansing</p>
                                </div>
                                <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-4 text-center">
                                    <p className="text-orange-300 font-semibold">Dandelion Root</p>
                                    <p className="text-orange-100/60 text-sm mt-1">Liver Support</p>
                                </div>
                                <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4 text-center">
                                    <p className="text-cyan-300 font-semibold">Cane Spirits</p>
                                    <p className="text-cyan-100/60 text-sm mt-1">190 Proof • Organic</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intentions/Benefits Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating Peace Sign */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">☮️</span>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                                Intentions & Benefits
                            </h2>
                            <p className="text-blue-200/60 mt-2">When taken consistently with patience 🙏🏾</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/40 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-blue-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-blue-200">Body Comfort</h3>
                                </div>
                                <p className="text-blue-100/70 text-sm">Soothing support for the body's comfort.</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-950/40 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-yellow-200">Cleansing Ritual</h3>
                                </div>
                                <p className="text-yellow-100/70 text-sm">For the sacred space within.</p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/40 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-amber-500/20 group-hover:scale-110 transition-transform">
                                        <Feather className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-amber-200">Adaptogenic</h3>
                                </div>
                                <p className="text-amber-100/70 text-sm">Helps body adapt to stress.</p>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/40 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-indigo-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <Scale className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-indigo-200">Cyclical Harmony</h3>
                                </div>
                                <p className="text-indigo-100/70 text-sm">Supporting your natural rhythms.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section with Cycle Chart */}
                <section className="py-16 px-4 relative">
                    {/* Floating Praying Hands */}
                    <div className="absolute top-20 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🙏🏾</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-400/20 mb-4">
                                <Scale className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-300 text-sm font-medium">Sacred Use Guide</span>
                                <span className="text-lg">🪶</span>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                                When to Take Balance Tincture
                            </h2>
                            <p className="text-blue-200/70 mt-3 max-w-2xl mx-auto">
                                Take after <span className="text-yellow-300 font-semibold">Ovulation</span> for 14-16 days,
                                leading up to <span className="text-blue-300 font-semibold">menstruation</span>.
                            </p>
                        </div>

                        {/* Animated Cycle Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 via-blue-950/30 to-amber-950/40 border border-blue-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <CycleChart className="mb-8" productName="Balance Tincture" />
                        </div>

                        {/* Dosage Instructions */}
                        <div className="mt-12 grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/40 border border-blue-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-blue-300 mb-4">💧 Suggested Use</h3>
                                <ul className="space-y-3 text-blue-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 flex-shrink-0">•</span>
                                        <span><span className="text-blue-300 font-semibold">Shake well</span> before use</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 flex-shrink-0">•</span>
                                        <span>Take <span className="text-blue-300 font-semibold whitespace-nowrap">0.5 - 2 mL</span> daily</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 flex-shrink-0">•</span>
                                        <span>Under the tongue or in room temperature drink</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-yellow-400 flex-shrink-0">⚠️</span>
                                        <span>Should <span className="text-yellow-300 font-semibold">NOT</span> take longer than <span className="text-yellow-300 font-semibold whitespace-nowrap">2 weeks</span> at a time</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-900/30 to-amber-950/40 border border-yellow-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-yellow-300 mb-4">☮️ Important Notes</h3>
                                <p className="text-yellow-100/80 text-sm sm:text-base">
                                    Extended use should be done <span className="text-yellow-300 font-semibold">only with practitioner guidance</span>.
                                </p>
                                <p className="text-yellow-200/60 text-sm mt-3 italic">
                                    This herbal tincture is best taken during the luteal and menstrual phase.
                                </p>
                                <p className="text-blue-200/70 text-sm mt-4">
                                    🙏🏾 Take consistently with a <span className="text-blue-300 font-semibold">CLEAN diet</span> for best results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🪶</span>
                    </div>
                    <div className="absolute top-10 right-16 opacity-15 animate-bounce" style={{ animationDuration: '5s' }}>
                        <span className="text-4xl">☮️</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/30 to-amber-950/40 border border-yellow-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🪶</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🍄</div>

                            <Scale className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                            <p className="text-xl text-yellow-200 mb-2 font-semibold">Tua U Ma'at, Netjeret Nefer</p>
                            <p className="text-blue-100/80 mb-4">Praise to Ma'at, Beautiful Goddess of Truth</p>
                            <p className="text-lg text-yellow-100">May your vessel find perfect balance and harmony.</p>
                            <p className="text-yellow-300 font-semibold mt-4">🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-blue-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-blue-400 hover:text-blue-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* View PDF Button */}
                        <a
                            href="/guides/balance-tincture.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-blue-600 via-yellow-500 to-amber-500 hover:from-blue-500 hover:via-yellow-400 hover:to-amber-400 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-12 px-4 border-t border-blue-900/30">
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
