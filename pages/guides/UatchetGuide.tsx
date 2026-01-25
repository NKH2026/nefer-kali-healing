import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Shield, Moon, Heart, Sparkles, Brain, Zap } from 'lucide-react';

export default function UatchetGuide() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505]">
            {/* Hero Section - Ketu/Uatchet Theme: Deep Blacks, Grays, with mystical accents */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Ketu Mystical Glow Background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-slate-700/30 rounded-full blur-[120px]" />
                    <div className="absolute top-40 right-20 w-72 h-72 bg-gray-600/25 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-zinc-700/20 rounded-full blur-[150px]" />
                    <div className="absolute bottom-40 right-10 w-80 h-80 bg-stone-600/20 rounded-full blur-[110px]" />
                </div>

                {/* Floating Serpent Animation 🐍 */}
                <div className="absolute top-32 right-16 opacity-30 animate-pulse" style={{ animationDuration: '4s' }}>
                    <span className="text-6xl">🐍</span>
                </div>

                {/* Floating Black Mushroom 🍄 */}
                <div className="absolute bottom-40 left-16 opacity-25 animate-bounce" style={{ animationDuration: '3s' }}>
                    <span className="text-5xl">🍄</span>
                </div>

                {/* South Node / Ketu Symbol */}
                <div className="absolute top-48 left-1/4 opacity-20 animate-pulse" style={{ animationDuration: '5s' }}>
                    <span className="text-4xl">☋</span>
                </div>

                {/* Another Serpent */}
                <div className="absolute bottom-32 right-28 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                    <span className="text-5xl">🐍</span>
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Back Button */}
                    <Link
                        to="/healing-guides"
                        className="inline-flex items-center gap-2 text-gray-300/80 hover:text-gray-200 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Healing Guides
                    </Link>

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-300 bg-clip-text text-transparent mb-4">
                            Uatchet Tincture
                        </h1>
                        <p className="text-xl text-gray-300/70 max-w-2xl mx-auto">
                            Nervine Tincture • Serpent Protection • Ketu Mysteries
                        </p>
                    </div>

                    {/* View PDF Button */}
                    <div className="flex justify-center mb-12">
                        <a
                            href="/guides/uatchet-tincture.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-slate-600 hover:from-gray-600 hover:to-slate-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-gray-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View PDF Guide
                        </a>
                    </div>

                    {/* Ganesha Welcome Message */}
                    <div className="bg-gradient-to-br from-gray-900/60 via-slate-900/40 to-zinc-900/50 border border-gray-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-2 right-4 text-4xl opacity-20">🐍</div>
                        <div className="absolute bottom-2 left-4 text-3xl opacity-15">🍄</div>

                        <p className="text-2xl text-gray-100 font-semibold text-center mb-3">
                            <span className="text-orange-400">Om Gam Ganapataye Namaha</span> 🙏🏾
                        </p>
                        <p className="text-gray-200/90 text-lg leading-relaxed text-center">
                            Peace and Light, it is amazing that you are here. Let's dive into our
                            <span className="text-gray-100 font-semibold"> Uatchet Nervine Tincture</span>.
                        </p>
                        <p className="text-slate-300/80 text-center mt-4">
                            Named after the <span className="text-gray-100 font-semibold">Kametic deity Uatchet</span>,
                            the serpent goddess who protected Lower Kamit, she embodies the mystical energy of
                            <span className="text-orange-300 font-semibold"> Ketu</span> — the South Node of shadow work and spiritual liberation.
                        </p>
                        <p className="text-gray-400/70 text-center mt-4 text-sm italic">
                            — In Protection & Healing, Nefer Kali Healing
                        </p>
                    </div>
                </div>
            </section>

            {/* Ingredients Section */}
            <section className="py-16 px-4 relative">
                {/* Floating serpent */}
                <div className="absolute top-10 right-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                    <span className="text-4xl">🐍</span>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900/50 to-slate-900/40 border border-gray-500/20 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-gray-600/20">
                                <Shield className="w-6 h-6 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-200">Sacred Ingredients</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-gray-800/40 border border-gray-500/20 rounded-xl p-3 text-center">
                                <p className="text-gray-200 font-semibold">Black Reishi 🍄</p>
                                <p className="text-gray-400 text-xs mt-1">Immune & Sleep</p>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-500/20 rounded-xl p-3 text-center">
                                <p className="text-slate-200 font-semibold">Blue Vervain</p>
                                <p className="text-slate-400 text-xs mt-1">Nervine Calming</p>
                            </div>
                            <div className="bg-zinc-800/40 border border-zinc-500/20 rounded-xl p-3 text-center">
                                <p className="text-zinc-200 font-semibold">Cane Spirits</p>
                                <p className="text-zinc-400 text-xs mt-1">200 Proof • Organic</p>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-500/20 rounded-xl p-3 text-center">
                                <p className="text-stone-200 font-semibold">Distilled Water</p>
                                <p className="text-stone-400 text-xs mt-1">Pure & Clean</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 px-4 relative">
                {/* Floating Ketu */}
                <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                    <span className="text-5xl">☋</span>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-200 bg-clip-text text-transparent">
                            Benefits of Uatchet
                        </h2>
                        <p className="text-gray-400 mt-2">Nervine support for mind, body & spirit 🐍</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-gray-900/50 to-gray-950/60 border border-gray-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-gray-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-600/20 group-hover:scale-110 transition-transform">
                                    <Heart className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-200">Anxiety Reduction</h3>
                            </div>
                            <p className="text-gray-400 text-sm">Blue Vervain is known for its calming effects, making this tincture an excellent choice for reducing anxiety and promoting a sense of tranquility.</p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/60 border border-slate-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-slate-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-purple-600/20 group-hover:scale-110 transition-transform">
                                    <Moon className="w-5 h-5 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-200">Improved Sleep Quality</h3>
                            </div>
                            <p className="text-slate-400 text-sm">Black Reishi, recognized for its sedative properties, aids in enhancing sleep quality. It can help in easing insomnia, leading to more restful and rejuvenating sleep.</p>
                        </div>

                        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/60 border border-zinc-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-zinc-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-green-600/20 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-200">Stress Relief</h3>
                            </div>
                            <p className="text-zinc-400 text-sm">Both Blue Vervain and Black Reishi have adaptogenic qualities, which means they help the body adapt to stress and exert a normalizing effect upon bodily processes.</p>
                        </div>

                        <div className="bg-gradient-to-br from-stone-900/50 to-stone-950/60 border border-stone-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-stone-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-indigo-600/20 group-hover:scale-110 transition-transform">
                                    <Brain className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-stone-200">Nervous System Support</h3>
                            </div>
                            <p className="text-stone-400 text-sm">Blue Vervain acts as a nervine, which means it helps strengthen and tone the nervous system, making it beneficial for those dealing with nervous tension or stress-related issues.</p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900/50 to-gray-950/60 border border-gray-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-gray-400/40 transition-all duration-300 group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-orange-600/20 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5 text-orange-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-200">Immune System Boost 🍄</h3>
                            </div>
                            <p className="text-gray-400 text-sm">Black Reishi is also renowned for its immune-boosting properties, helping to enhance the body's defense mechanisms against various pathogens and diseases.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Directions Section */}
            <section className="py-16 px-4 relative">
                {/* Floating mushroom */}
                <div className="absolute top-20 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                    <span className="text-5xl">🍄</span>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-200 bg-clip-text text-transparent">
                            Directions for Use
                        </h2>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900/50 to-slate-900/40 border border-gray-500/20 rounded-xl p-6">
                        <ul className="space-y-4 text-gray-200/80">
                            <li className="flex items-start gap-3">
                                <span className="text-gray-400 font-bold">1.</span>
                                <span>For optimal results, <span className="text-gray-100 font-semibold">begin with a small dose on the first day</span> to allow your body to acclimate.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-gray-400 font-bold">2.</span>
                                <span>Thereafter, use <span className="text-gray-100 font-semibold">11 drops twice daily</span>, ideally <span className="text-orange-300 font-semibold">2-3 hours before bedtime</span>.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-gray-400 font-bold">3.</span>
                                <span>As you become attuned to its effects, you may <span className="text-gray-100 font-semibold">adjust the dosage</span> as needed.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Closing Blessing */}
            <section className="py-16 px-4 relative">
                {/* Floating decorations */}
                <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                    <span className="text-5xl">🐍</span>
                </div>
                <div className="absolute top-10 right-16 opacity-15 animate-bounce" style={{ animationDuration: '5s' }}>
                    <span className="text-4xl">☋</span>
                </div>

                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-gray-900/50 via-slate-900/40 to-zinc-900/50 border border-gray-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-4 left-6 text-3xl opacity-20">🐍</div>
                        <div className="absolute bottom-4 right-6 text-3xl opacity-20">🍄</div>

                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-orange-300 mb-2 font-semibold">Om Gam Ganapataye Namaha</p>
                        <p className="text-gray-300/80 mb-4">May Ganesha remove all obstacles on your healing path</p>
                        <p className="text-lg text-gray-100">Protection of Uatchet be upon you.</p>
                        <p className="text-gray-300 font-semibold mt-4">🙏🏾</p>

                        <div className="mt-6 pt-6 border-t border-gray-500/20">
                            <a
                                href="mailto:info@neferkalihealing.org"
                                className="text-gray-400 hover:text-gray-300 transition-colors underline"
                            >
                                info@neferkalihealing.org
                            </a>
                        </div>
                    </div>

                    {/* View PDF Button */}
                    <a
                        href="/guides/uatchet-tincture.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-gray-700 to-slate-600 hover:from-gray-600 hover:to-slate-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-gray-900/50"
                    >
                        <Droplets className="w-5 h-5" />
                        View Full PDF Guide
                    </a>
                </div>
            </section>

            {/* Health Disclaimer */}
            <section className="py-12 px-4 border-t border-gray-800/50">
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
    );
}
