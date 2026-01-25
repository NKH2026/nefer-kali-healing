import { Link } from 'react-router-dom';
import { Download, ArrowLeft, Sparkles, Leaf, Droplets, Heart, Zap, Waves } from 'lucide-react';

export default function SeaMossGuide() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#030a12] via-[#0a1628] to-[#030a12]">
            {/* Hero Section - Yemoja Ocean Theme */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Ocean Wave Background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/40 rounded-full blur-[120px]" />
                    <div className="absolute top-40 right-20 w-72 h-72 bg-blue-400/30 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[150px]" />
                    <div className="absolute bottom-40 right-10 w-80 h-80 bg-sky-400/25 rounded-full blur-[110px]" />
                </div>

                {/* Animated Wave Lines */}
                <div className="absolute inset-0 overflow-hidden opacity-10">
                    <svg className="absolute bottom-0 w-full h-40" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" className="text-cyan-400" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Back Button */}
                    <Link
                        to="/healing-guides"
                        className="inline-flex items-center gap-2 text-cyan-300/80 hover:text-cyan-200 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Healing Guides
                    </Link>

                    {/* Title */}
                    <div className="text-center mb-12">
                        {/* Yemoja Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/30 mb-6">
                            <Waves className="w-4 h-4 text-cyan-300" />
                            <span className="text-cyan-200 text-sm font-medium">Blessed by Yemọja • Sacred Waters</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-200 via-white to-cyan-200 bg-clip-text text-transparent mb-4">
                            Sea Moss Guide
                        </h1>
                        <p className="text-xl text-blue-100/70 max-w-2xl mx-auto">
                            Full Spectrum Trio Pack — Golden, Green, and Purple St. Lucian Sea Moss
                        </p>
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-center mb-12">
                        <a
                            href="/guides/sea-moss-guide.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-cyan-900/50"
                        >
                            <Download className="w-5 h-5" />
                            View PDF Guide
                        </a>
                    </div>

                    {/* Alafia Welcome Message */}
                    <div className="bg-gradient-to-br from-cyan-900/40 to-blue-950/50 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                        {/* Decorative shells/waves */}
                        <div className="absolute top-2 right-4 text-4xl opacity-20">🐚</div>
                        <div className="absolute bottom-2 left-4 text-3xl opacity-15">🌊</div>

                        <p className="text-2xl text-cyan-100 font-semibold text-center mb-3">
                            <span className="text-cyan-300">Aláàfíà</span> 🙏🏾
                        </p>
                        <p className="text-blue-100/90 text-lg leading-relaxed text-center">
                            Welcome to the healing waters of <span className="text-cyan-300 font-semibold">Yemọja</span>, Mother of the Ocean.
                            May the sacred gifts of the sea bring restoration, vitality, and abundant blessings to your body and spirit.
                        </p>
                        <p className="text-cyan-200/70 text-center mt-4 text-sm italic">
                            — Àṣẹ, Nefer Kali Healing
                        </p>
                    </div>
                </div>
            </section>

            {/* Sea Moss Info Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-teal-900/30 to-cyan-950/40 border border-teal-400/20 rounded-2xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-teal-500/20">
                                <Waves className="w-6 h-6 text-teal-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-teal-200">The Sacred Gift of the Sea</h2>
                        </div>
                        <p className="text-blue-100/80 text-lg leading-relaxed">
                            Harvested from the pristine Caribbean waters of <span className="text-cyan-300 font-semibold">St. Lucia</span>, this powerhouse algae is
                            <span className="text-white font-semibold"> 100% natural</span> and does not contain any additives or preservatives.
                            Sea moss carries the essence of <span className="text-cyan-300">Yemọja's</span> healing energy — trace minerals and vitamins that
                            help boost immunity, promote good health, and restore the body to its natural state of harmony.
                        </p>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-cyan-100">Gifts from the Ocean Depths</h2>
                        <p className="text-blue-200/60 mt-2">Each variety carries unique healing properties</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Golden Sea Moss */}
                        <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-amber-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-amber-500/20">
                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-300">Golden Sea Moss</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Boosts immunity',
                                    'Provides 92 of the 102 vitamins and minerals the body needs',
                                    'Supports thyroid function',
                                    'Bone health',
                                    'Anti inflammatory — helping with muscle recovery',
                                    'Supports the health of hair, skin and nails',
                                    'Promotes good digestion',
                                    'Improves libido',
                                    'Improves metabolism',
                                    'Helps maintain a healthy weight'
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-amber-100/80">
                                        <span className="text-amber-400 mt-1.5">•</span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Green Sea Moss */}
                        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-emerald-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-500/20">
                                    <Leaf className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-300">Green Sea Moss</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Supports thyroid function',
                                    'Supports bone health',
                                    'High in Chlorophyll',
                                    'Supports the health of hair, skin and nails',
                                    'Detoxifying',
                                    'Deodorizing'
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-emerald-100/80">
                                        <span className="text-emerald-400 mt-1.5">•</span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Purple Sea Moss */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-purple-500/20">
                                    <Zap className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-purple-300">Purple Sea Moss</h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'High in antioxidants (especially anthocyanin)',
                                    'Supports energy levels',
                                    'Anti inflammatory',
                                    'Supports eye health',
                                    'Promotes good digestion',
                                    'Anti Cancer'
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-purple-100/80">
                                        <span className="text-purple-400 mt-1.5">•</span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Preparation Instructions */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-4">
                            <Droplets className="w-4 h-4 text-cyan-400" />
                            <span className="text-cyan-300 text-sm font-medium">Preparation Ritual</span>
                        </div>
                        <h2 className="text-3xl font-bold text-cyan-100">How to Prepare Sea Moss Gel</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="bg-gradient-to-br from-slate-900/50 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <span className="text-cyan-300 font-bold">1</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-cyan-200 mb-2">Rinse & Soak</h3>
                                    <p className="text-blue-100/80">
                                        Rinse and clean the dried sea moss under cool water. After the sea moss is cleaned, thoroughly soak it
                                        in spring water for <span className="text-cyan-300 font-semibold">6 to 12 hours</span>. (I add key limes to water to neutralize taste,
                                        and water-friendly crystals to bring great energy to the moss.)
                                    </p>
                                    <div className="mt-4 bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-4">
                                        <p className="text-cyan-300 text-sm">
                                            <span className="font-semibold">🐚 TIP:</span> A little goes a long way — 1 OZ of dried sea moss can make one 16oz jar of gel!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-gradient-to-br from-slate-900/50 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <span className="text-cyan-300 font-bold">2</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-cyan-200 mb-2">Wash & Transfer</h3>
                                    <p className="text-blue-100/80">
                                        Remove the sea moss from soaking water, wash it again, and place it in a blender.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-gradient-to-br from-slate-900/50 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <span className="text-cyan-300 font-bold">3</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-cyan-200 mb-2">Blend</h3>
                                    <p className="text-blue-100/80">
                                        Fill the blender with enough fresh <span className="text-cyan-300 font-semibold underline">warm</span> water to cover the sea moss,
                                        then blend until it makes a smooth paste.
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-4">
                                            <p className="text-cyan-300 text-sm">
                                                <span className="font-semibold">🌊 TIP:</span> Warm water makes for a better consistency when blending the sea moss.
                                                <span className="font-bold"> The hotter the water, the smoother the gel will come out.</span>
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-purple-500/10 border border-slate-500/20 rounded-xl p-4">
                                            <p className="text-blue-100/80 text-sm">
                                                <span className="text-amber-300">Gold</span> sea moss blends the easiest.
                                                <span className="text-purple-300"> Purple</span> and <span className="text-emerald-300">green</span> moss will need to be blended
                                                just a few seconds longer to get smooth gel consistency.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-gradient-to-br from-slate-900/50 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <span className="text-cyan-300 font-bold">4</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-cyan-200 mb-2">Add Flavors (Optional)</h3>
                                    <p className="text-blue-100/80">
                                        At this point, you can get creative and add other flavors if desired — things like fruits or herbs like
                                        <span className="text-cyan-300"> turmeric, ginger, burdock root</span> etc. Add any additional ingredients to the gel and blend.
                                    </p>
                                    <div className="mt-4 bg-teal-500/10 border border-teal-400/20 rounded-xl p-4">
                                        <p className="text-teal-300 text-sm">
                                            <span className="font-semibold">🌿 TIP:</span> Adding herbs will <span className="underline">not</span> decrease shelf life,
                                            while adding fresh fruits <span className="underline">will</span> decrease shelf life.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-gradient-to-br from-slate-900/50 to-cyan-950/30 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <span className="text-cyan-300 font-bold">5</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-cyan-200 mb-2">Store</h3>
                                    <p className="text-blue-100/80">
                                        Store in a clean glass jar and refrigerate for <span className="text-cyan-300 font-semibold">up to three weeks</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing Blessing */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-cyan-900/30 to-blue-950/40 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur-sm mb-8 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-4 left-6 text-3xl opacity-20">🌊</div>
                        <div className="absolute bottom-4 right-6 text-3xl opacity-20">🐚</div>

                        <Waves className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                        <p className="text-xl text-cyan-200 mb-2 font-semibold">Modúpé Yemọja</p>
                        <p className="text-blue-100/80 mb-4">We give thanks for the ocean's healing gifts</p>
                        <p className="text-lg text-cyan-100">May you walk in health and harmony.</p>
                        <p className="text-cyan-300 font-semibold mt-4">Àṣẹ 🙏🏾</p>

                        <div className="mt-6 pt-6 border-t border-cyan-500/20">
                            <a
                                href="mailto:info@neferkalihealing.org"
                                className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
                            >
                                info@neferkalihealing.org
                            </a>
                        </div>
                    </div>

                    {/* Download Button */}
                    <a
                        href="/guides/sea-moss-guide.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-cyan-900/50"
                    >
                        <Download className="w-5 h-5" />
                        View Full PDF Guide
                    </a>
                </div>
            </section>

            {/* Health Disclaimer */}
            <section className="py-12 px-4 border-t border-cyan-900/30">
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
    );
}
