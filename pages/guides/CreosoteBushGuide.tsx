import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Leaf, Heart, Sparkles, Shield, Wind } from 'lucide-react';

export default function CreosoteBushGuide() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0806] via-[#1a150f] to-[#0d0a08]">
            {/* Hero Section - Kamit Theme: Black, Brown, Gold accents */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Kamit Glow Background - Earthy browns and blacks */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-amber-900/30 rounded-full blur-[120px]" />
                    <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-800/25 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-stone-700/20 rounded-full blur-[150px]" />
                    <div className="absolute bottom-40 right-10 w-80 h-80 bg-amber-800/20 rounded-full blur-[110px]" />
                </div>

                {/* Floating Leaf Animation 🌿 */}
                <div className="absolute top-32 right-16 opacity-25 animate-bounce" style={{ animationDuration: '4s' }}>
                    <span className="text-5xl">🌿</span>
                </div>

                {/* Floating Ankh Animation ☥ */}
                <div className="absolute bottom-40 left-16 opacity-20 animate-pulse" style={{ animationDuration: '3s' }}>
                    <span className="text-5xl">☥</span>
                </div>

                {/* Desert Plant Animation 🏜️ */}
                <div className="absolute top-48 left-1/4 opacity-20 animate-pulse" style={{ animationDuration: '5s' }}>
                    <span className="text-4xl">🏜️</span>
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
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent mb-4">
                            Creosote Bush Tincture
                        </h1>
                        <p className="text-xl text-amber-100/70 max-w-2xl mx-auto">
                            Chaparral • Ancient Desert Medicine
                        </p>
                    </div>

                    {/* View PDF Button */}
                    <div className="flex justify-center mb-12">
                        <a
                            href="/guides/creosote-bush.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-800 to-yellow-700 hover:from-amber-700 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View PDF Guide
                        </a>
                    </div>

                    {/* Kamit Welcome Message */}
                    <div className="bg-gradient-to-br from-stone-900/60 via-amber-950/40 to-stone-900/50 border border-amber-600/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-2 right-4 text-4xl opacity-20">☥</div>
                        <div className="absolute bottom-2 left-4 text-3xl opacity-15">🌿</div>

                        <p className="text-2xl text-amber-100 font-semibold text-center mb-3">
                            <span className="text-amber-300">Tua U</span> 🙏🏾
                        </p>
                        <p className="text-stone-200/90 text-lg leading-relaxed text-center">
                            Thank you (or in our ancient language of <span className="text-amber-300 font-semibold">Kamet</span>, Tua U) for your support.
                            Nefer Kali Healing provides high quality healing products to help aid and assist in building your life force.
                        </p>
                        <p className="text-amber-200/80 text-center mt-4">
                            Creosote Bush Tincture is an all-natural herbal supplement made from the leaves of the
                            <span className="text-amber-300 font-semibold"> Larrea P plant</span>. This tincture is traditionally used to support
                            respiratory, digestive, and skin health.
                        </p>
                        <p className="text-stone-300/70 text-center mt-4 text-sm italic">
                            — In Ancient Wisdom, Nefer Kali Healing
                        </p>
                    </div>
                </div>
            </section>

            {/* Ingredients Section */}
            <section className="py-16 px-4 relative">
                {/* Floating leaf */}
                <div className="absolute top-10 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                    <span className="text-4xl">🌿</span>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-stone-900/50 to-amber-950/40 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-amber-700/20">
                                <Leaf className="w-6 h-6 text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-amber-200">Sacred Ingredients</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-stone-800/40 border border-amber-500/20 rounded-xl p-4 text-center">
                                <p className="text-amber-300 font-semibold">Chaparral</p>
                                <p className="text-amber-100/60 text-sm mt-1">Organic Stems & Leaves</p>
                            </div>
                            <div className="bg-stone-800/40 border border-yellow-500/20 rounded-xl p-4 text-center">
                                <p className="text-yellow-300 font-semibold">Cane Spirits</p>
                                <p className="text-yellow-100/60 text-sm mt-1">190 Proof • Organic</p>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-400/20 rounded-xl p-4 text-center">
                                <p className="text-stone-200 font-semibold">Distilled Water</p>
                                <p className="text-stone-100/60 text-sm mt-1">Pure • Cleansing</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 px-4 relative">
                {/* Floating Ankh */}
                <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                    <span className="text-5xl">☥</span>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">
                            Benefits of Creosote (Chaparral) Bush
                        </h2>
                        <p className="text-amber-200/60 mt-2">When taken consistently with patience 🙏🏾</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-stone-900/50 to-stone-950/60 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-amber-600/20 group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5 text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-amber-200">Immune Boosting</h3>
                            </div>
                            <p className="text-stone-300/70 text-sm">Strengthens natural immune defenses.</p>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900/50 to-stone-950/60 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-yellow-600/20 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-yellow-200">Skin Health</h3>
                            </div>
                            <p className="text-stone-300/70 text-sm">Can help assist in the treatment of psoriasis, eczema, and acne.</p>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900/50 to-stone-950/60 border border-amber-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-amber-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-amber-500/20 group-hover:scale-110 transition-transform">
                                    <Heart className="w-5 h-5 text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-amber-200">Anti-Inflammatory</h3>
                            </div>
                            <p className="text-stone-300/70 text-sm">Reduces inflammation naturally.</p>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900/50 to-stone-950/60 border border-stone-400/20 rounded-xl p-6 backdrop-blur-sm hover:border-stone-300/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-stone-500/20 group-hover:scale-110 transition-transform">
                                    <Wind className="w-5 h-5 text-stone-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-stone-200">Respiratory Support</h3>
                            </div>
                            <p className="text-stone-300/70 text-sm">Supports healthy breathing and lung function.</p>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900/50 to-stone-950/60 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:scale-110 transition-transform">
                                    <Leaf className="w-5 h-5 text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-yellow-200">Digestive Support</h3>
                            </div>
                            <p className="text-stone-300/70 text-sm">Aids in maintaining healthy digestion.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Usage Section */}
            <section className="py-16 px-4 relative">
                {/* Floating desert */}
                <div className="absolute top-20 right-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                    <span className="text-5xl">🏜️</span>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">
                            Suggested Use
                        </h2>
                    </div>

                    {/* Usage Instructions */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-stone-900/50 to-amber-950/40 border border-amber-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-amber-300 mb-4">💧 Internal Use</h3>
                            <ul className="space-y-3 text-stone-200/80">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400">•</span>
                                    Add <span className="text-amber-300 font-semibold">10 to 30 drops</span> to a glass of water or juice
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400">•</span>
                                    Drink the mixture
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400">•</span>
                                    Can be taken <span className="text-amber-300 font-semibold">1-3 times per day</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900/50 to-yellow-950/40 border border-yellow-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-yellow-300 mb-4">🌿 External Use</h3>
                            <ul className="space-y-3 text-stone-200/80">
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    Dilute <span className="text-yellow-300 font-semibold">3 to 10 drops</span> with carrier oil
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    Use coconut or almond oil
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    Apply to <span className="text-yellow-300 font-semibold">affected area</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing Blessing */}
            <section className="py-16 px-4 relative">
                {/* Floating decorations */}
                <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                    <span className="text-5xl">☥</span>
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-stone-900/50 via-amber-950/40 to-stone-900/50 border border-amber-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-4 left-6 text-3xl opacity-20">☥</div>
                        <div className="absolute bottom-4 right-6 text-3xl opacity-20">🌿</div>

                        <Leaf className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <p className="text-xl text-amber-200 mb-2 font-semibold">Tua U, Children of Kamit</p>
                        <p className="text-stone-200/80 mb-4">Ancient wisdom for modern healing</p>
                        <p className="text-lg text-amber-100">May the medicine of the ancestors guide your journey.</p>
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
                        href="/guides/creosote-bush.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-amber-800 to-yellow-700 hover:from-amber-700 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50"
                    >
                        <Droplets className="w-5 h-5" />
                        View Full PDF Guide
                    </a>
                </div>
            </section>

            {/* Health Disclaimer */}
            <section className="py-12 px-4 border-t border-stone-800/50">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-stone-900/50 border border-stone-600/30 rounded-xl p-6">
                        <h3 className="text-stone-300 font-semibold mb-3">Health Disclaimer</h3>
                        <p className="text-stone-400 text-sm leading-relaxed">
                            The information provided on this guide is for educational and informational purposes only and is not intended as medical advice.
                            The content has not been evaluated by the Food and Drug Administration (FDA) and is not intended to diagnose, treat, cure, or prevent any disease.
                            Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
