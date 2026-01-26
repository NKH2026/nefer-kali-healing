import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Moon, Sparkles, Star, Heart, Eye, AlertTriangle } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// FAQ data for schema
const dreamElixirFAQs = [
    {
        question: 'What is the Dream Elixir?',
        answer: 'The Dream Elixir is a moon-blessed herbal tincture containing Bobinsana, Mugwort, Egyptian Blue Lotus, and Damiana. It is designed to enhance dreams, open the heart chakra, and support spiritual connection.'
    },
    {
        question: 'What are the benefits of Dream Elixir ingredients?',
        answer: 'Bobinsana opens the heart chakra and enhances empathy. Damiana alleviates stress and enhances mood. Egyptian Blue Lotus heightens spiritual awareness and induces vivid dreams. Mugwort aids digestive and menstrual health.'
    },
    {
        question: 'How do you take Dream Elixir?',
        answer: 'Shake well and take 11-22 drops, 1-2 times daily. Best taken 2-6 hours before bed. Can be taken under the tongue or in a room temperature drink. Take during new moon leading up to full moon for best results.'
    },
    {
        question: 'What rituals enhance Dream Elixir effects?',
        answer: 'Light ocean blue candles honoring Auset, set your intention before taking, and place moonstone or amethyst nearby during use. Take during the new moon to full moon phase.'
    },
    {
        question: 'Who should not take Dream Elixir?',
        answer: 'Dream Elixir should be avoided during pregnancy as Bobinsana and Mugwort can affect pregnancy. Consult your healthcare provider before use if you have existing health conditions or take medications.'
    }
];

export default function DreamElixirGuide() {
    return (
        <>
            <SEOHead
                title="Dream Elixir Guide - Lucid Dreams & Spiritual Enhancement"
                description="Moon-blessed herbal elixir with Bobinsana, Blue Lotus, Mugwort, and Damiana for vivid dreams, heart opening, and spiritual connection. Learn dosage and ritual use."
                keywords={['Dream Elixir', 'lucid dream herbs', 'Blue Lotus tincture', 'Bobinsana', 'Mugwort', 'dream enhancement', 'spiritual herbs']}
                url="/guides/dream-elixir"
                schema={[
                    getArticleSchema({
                        title: 'Dream Elixir Guide',
                        slug: 'dream-elixir',
                        description: 'Moon-blessed herbal elixir for vivid dreams and spiritual enhancement.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(dreamElixirFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Dream Elixir', url: '/guides/dream-elixir' }
                    ])
                ]}
            />
            <div className="min-h-screen bg-gradient-to-b from-[#050510] via-[#0d0d20] to-[#080815]">
                {/* Hero Section - Auset/Moon Theme: Deep Blues, Purples, Silver */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Mystical Moon Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-700/30 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-600/25 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-blue-800/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-violet-600/20 rounded-full blur-[110px]" />
                    </div>

                    {/* Floating Moon Animation 🌙 */}
                    <div className="absolute top-32 right-16 opacity-30 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-6xl">🌙</span>
                    </div>

                    {/* Floating Stars Animation ✨ */}
                    <div className="absolute bottom-40 left-16 opacity-25 animate-bounce" style={{ animationDuration: '3s' }}>
                        <span className="text-5xl">✨</span>
                    </div>

                    {/* Floating Lotus Animation 🪷 */}
                    <div className="absolute top-48 left-1/4 opacity-20 animate-pulse" style={{ animationDuration: '5s' }}>
                        <span className="text-4xl">🪷</span>
                    </div>

                    {/* Eye of Horus */}
                    <div className="absolute bottom-32 right-28 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">𓂀</span>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-indigo-300/80 hover:text-indigo-200 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-300 via-purple-200 to-blue-300 bg-clip-text text-transparent mb-4">
                                The Dream Elixir
                            </h1>
                            <p className="text-xl text-indigo-100/70 max-w-2xl mx-auto">
                                Sacred to Auset • Moon Mysteries • Gateway to Dreams
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/dream-elixir.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-900/50"
                            >
                                <Droplets className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Auset Welcome Message */}
                        <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-blue-950/50 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">🌙</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-15">✨</div>

                            <p className="text-2xl text-indigo-100 font-semibold text-center mb-3">
                                <span className="text-purple-300">Tua U Auset, Netjeret Nefer</span> 🙏🏾
                            </p>
                            <p className="text-blue-100/90 text-lg leading-relaxed text-center">
                                The Dream Elixir embodies the ancient wisdom of the <span className="text-purple-300 font-semibold">Moon's mysteries</span>,
                                channeling the divine feminine energy that governs our dreams, intuition, and emotional depths.
                            </p>
                            <p className="text-indigo-200/80 text-center mt-4">
                                This sacred blend, crafted in harmony with <span className="text-blue-300 font-semibold">lunar cycles</span>,
                                creates a bridge between the physical and astral realms. Each ingredient is ritually selected and
                                <span className="text-purple-300 font-semibold"> moon-blessed</span>.
                            </p>
                            <p className="text-indigo-300/70 text-center mt-4 text-sm italic">
                                — In Moonlight & Mystery, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating stars */}
                    <div className="absolute top-10 right-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-4xl">✨</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-purple-600/20">
                                    <Moon className="w-6 h-6 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-purple-200">Moon-Blessed Ingredients</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-3 text-center">
                                    <p className="text-indigo-300 font-semibold">Bobinsana</p>
                                    <p className="text-indigo-100/60 text-xs mt-1">Heart Chakra Opener</p>
                                </div>
                                <div className="bg-purple-900/30 border border-purple-500/20 rounded-xl p-3 text-center">
                                    <p className="text-purple-300 font-semibold">Mugwort</p>
                                    <p className="text-purple-100/60 text-xs mt-1">Dream Enhancer</p>
                                </div>
                                <div className="bg-blue-900/30 border border-blue-500/20 rounded-xl p-3 text-center">
                                    <p className="text-blue-300 font-semibold">Egyptian Blue Lotus</p>
                                    <p className="text-blue-100/60 text-xs mt-1">Spiritual Enlightenment</p>
                                </div>
                                <div className="bg-violet-900/30 border border-violet-500/20 rounded-xl p-3 text-center">
                                    <p className="text-violet-300 font-semibold">Damiana</p>
                                    <p className="text-violet-100/60 text-xs mt-1">Mood Enhancement</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating moon */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🌙</span>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
                                Benefits of Each Sacred Ingredient
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-indigo-950/50 to-indigo-900/40 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-indigo-600/20">
                                        <Heart className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-indigo-200">Bobinsana</h3>
                                </div>
                                <p className="text-indigo-100/70 text-sm">
                                    Sacred to indigenous healers, Bobinsana <span className="text-indigo-300 font-semibold">opens the heart chakra's ancient pathways</span>,
                                    dissolving emotional barriers and awakening the soul's innate wisdom. It fosters deep emotional healing and enhances empathy and compassion.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-violet-950/50 to-violet-900/40 border border-violet-500/20 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-violet-600/20">
                                        <Sparkles className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-violet-200">Damiana</h3>
                                </div>
                                <p className="text-violet-100/70 text-sm">
                                    Renowned for its <span className="text-violet-300 font-semibold">mood-enhancing properties</span>,
                                    helping to alleviate stress and anxiety. It's also used as a natural antidepressant, promoting mental well-being and a more balanced emotional state.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/40 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-blue-600/20">
                                        <Eye className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-blue-200">Egyptian Blue Lotus 🪷</h3>
                                </div>
                                <p className="text-blue-100/70 text-sm">
                                    A symbol of <span className="text-blue-300 font-semibold">spiritual enlightenment</span>,
                                    the Egyptian Blue Lotus heightens spiritual awareness and enhances intuitive insights. It is traditionally used in spiritual rituals to
                                    <span className="text-blue-300 font-semibold"> induce vivid dreams</span> and a deeper understanding of mystical realms.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/40 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-purple-600/20">
                                        <Moon className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-purple-200">Mugwort</h3>
                                </div>
                                <p className="text-purple-100/70 text-sm">
                                    A powerful herb for digestive health, known for its ability to soothe stomach ailments. Additionally, it's celebrated for
                                    <span className="text-purple-300 font-semibold"> aiding menstrual health</span>, helping to regulate cycles and reduce discomfort.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating lotus */}
                    <div className="absolute top-20 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🪷</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
                                Sacred Use & Ritual
                            </h2>
                        </div>

                        {/* Usage Instructions */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border border-indigo-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-indigo-300 mb-4">💧 Suggested Use</h3>
                                <ul className="space-y-3 text-indigo-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-400 flex-shrink-0">•</span>
                                        <span><span className="text-indigo-300 font-semibold">Shake well</span> before use</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-400 flex-shrink-0">•</span>
                                        <span>Take <span className="text-indigo-300 font-semibold whitespace-nowrap">11-22 drops</span>, 1 to 2 times daily</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-400 flex-shrink-0">•</span>
                                        <span>Can gradually increase as you see fit</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-400 flex-shrink-0">•</span>
                                        <span>Under the tongue or in room temperature drink</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 flex-shrink-0">🌙</span>
                                        <span>Best taken <span className="text-purple-300 font-semibold whitespace-nowrap">2-6 hours</span> before bed</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-purple-950/50 to-blue-950/40 border border-purple-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-4">✨ Ritual Enhancement</h3>
                                <ul className="space-y-3 text-purple-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 flex-shrink-0">🌑</span>
                                        <span>Take during <span className="text-purple-300 font-semibold">new moon</span> leading up to full moon</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 flex-shrink-0">🕯️</span>
                                        <span>Light <span className="text-blue-300 font-semibold">ocean blue candles</span>, honoring Auset</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 flex-shrink-0">🙏🏾</span>
                                        <span>Set your intention before taking</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-400 flex-shrink-0">💎</span>
                                        <span>Place <span className="text-indigo-300 font-semibold">moonstone</span> or <span className="text-violet-300 font-semibold">amethyst</span> nearby during use</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Important Warnings Section */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-red-950/30 to-amber-950/30 border border-red-500/30 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                <h2 className="text-xl font-bold text-red-300">Important Warning</h2>
                            </div>
                            <div className="space-y-4 text-red-100/80 text-sm">
                                <p>
                                    <span className="text-red-300 font-semibold">Please note:</span> The Dream Elixir and its ingredients, including Bobinsana, Damiana, Egyptian Blue Lotus, and Mugwort, have not been evaluated or approved by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.
                                </p>
                                <p>
                                    <span className="text-red-300 font-semibold">Consult Your Physician:</span> Before using this product, we advise consulting with your healthcare provider, especially if you have existing health conditions or are taking medications.
                                </p>
                                <p>
                                    <span className="text-red-400 font-bold">⚠️ Pregnancy Warning:</span> Special caution should be exercised if you are pregnant or planning to become pregnant. <span className="text-red-300 font-semibold">Bobinsana and Mugwort</span> are known to possess properties that could affect pregnancy. We strongly recommend <span className="text-red-400 font-semibold">avoiding the use of this product during pregnancy</span>.
                                </p>
                                <p>
                                    <span className="text-amber-300 font-semibold">Use Responsibly:</span> This product is intended for adult use only and should be kept out of reach of children.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🌙</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-indigo-950/50 via-purple-950/40 to-blue-950/50 border border-purple-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🌙</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">✨</div>

                            <Star className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            <p className="text-xl text-purple-200 mb-2 font-semibold">Tua U Auset, Netjeret Nefer</p>
                            <p className="text-indigo-100/80 mb-4">Praise to Auset, Beautiful Goddess of Magic</p>
                            <p className="text-lg text-blue-100">May your dreams be blessed with insight and your spirit awakened.</p>
                            <p className="text-purple-300 font-semibold mt-4">🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-indigo-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* View PDF Button */}
                        <a
                            href="/guides/dream-elixir.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-12 px-4 border-t border-indigo-900/30">
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
