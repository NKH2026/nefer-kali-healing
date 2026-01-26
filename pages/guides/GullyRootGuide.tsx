import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Leaf, Shield, Wind, Heart, Sparkles, Zap } from 'lucide-react';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// FAQ data for schema
const gullyRootFAQs = [
    {
        question: 'What is Gully Root Extract?',
        answer: 'Gully Root Extract is a Caribbean folk medicine treasure containing Gully Root leaves and stems in organic cane spirits and structured water. It is known for its cleansing and restorative properties.'
    },
    {
        question: 'What are the benefits of Gully Root?',
        answer: 'Benefits include immune function boosting, respiratory wellness support, promoting overall vitality, healthy inflammatory response, and natural body cleansing and purification.'
    },
    {
        question: 'How do you take Gully Root Extract?',
        answer: 'Shake well before use. Take 4 drops or up to 0.5 mL when needed. You can increase the dose slowly as you see fit. For best results, add drops to room temperature water.'
    },
    {
        question: 'What is Gully Root traditionally used for?',
        answer: 'In Caribbean folk medicine, Gully Root is traditionally used to help the body maintain its natural defense system, support respiratory health, and serve as a powerful cleansing herb to refresh the body.'
    },
    {
        question: 'Where does Gully Root come from?',
        answer: 'Gully Root is a traditional Caribbean herb that has been used for centuries in folk medicine for its immune-supporting, respiratory, and cleansing properties.'
    }
];

export default function GullyRootGuide() {
    return (
        <>
            <SEOHead
                title="Gully Root Extract Guide - Caribbean Folk Medicine"
                description="Caribbean folk medicine Gully Root Extract for immune support, respiratory wellness, and natural cleansing. Learn traditional uses and dosage."
                keywords={['Gully Root', 'Caribbean herbs', 'folk medicine', 'immune support herbs', 'respiratory herbs', 'natural cleanser']}
                url="/guides/gully-root"
                schema={[
                    getArticleSchema({
                        title: 'Gully Root Extract Guide',
                        slug: 'gully-root',
                        description: 'Caribbean folk medicine for immune support and cleansing.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(gullyRootFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Gully Root Extract', url: '/guides/gully-root' }
                    ])
                ]}
            />
            <div className="min-h-screen bg-gradient-to-b from-[#0a1208] via-[#131f10] to-[#0a1208]">
                {/* Hero Section - Caribbean/Earthy Theme: Greens, Browns, Nature */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Earthy Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-800/30 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-green-700/25 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-lime-800/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-teal-700/20 rounded-full blur-[110px]" />
                    </div>

                    {/* Floating Leaf Animation 🌿 */}
                    <div className="absolute top-32 right-16 opacity-30 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-6xl">🌿</span>
                    </div>

                    {/* Floating Root Animation 🫚 */}
                    <div className="absolute bottom-40 left-16 opacity-25 animate-pulse" style={{ animationDuration: '3s' }}>
                        <span className="text-5xl">🫚</span>
                    </div>

                    {/* Floating Tree 🌳 */}
                    <div className="absolute top-48 left-1/4 opacity-20 animate-pulse" style={{ animationDuration: '5s' }}>
                        <span className="text-4xl">🌳</span>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-emerald-300/80 hover:text-emerald-200 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-200 via-green-100 to-lime-200 bg-clip-text text-transparent mb-4">
                                Gully Root Extract
                            </h1>
                            <p className="text-xl text-emerald-100/70 max-w-2xl mx-auto">
                                Caribbean Folk Medicine • Natural Cleanser • Vitality Booster
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/gully-root.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-900/50"
                            >
                                <Droplets className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Welcome Message */}
                        <div className="bg-gradient-to-br from-emerald-950/60 via-green-950/40 to-lime-950/50 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">🌿</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-15">🫚</div>

                            <p className="text-2xl text-emerald-100 font-semibold text-center mb-3">
                                <span className="text-green-300">Tua U</span> 🙏🏾
                            </p>
                            <p className="text-green-100/90 text-lg leading-relaxed text-center">
                                Thank you (or in our ancient language of <span className="text-emerald-300 font-semibold">Kamit</span>, Tua U) for your support.
                                Nefer Kali Healing provides high quality healing products to help aid and assist in building your life force.
                            </p>
                            <p className="text-emerald-200/80 text-center mt-4">
                                <span className="text-green-300 font-semibold">Gully Root</span> is a Caribbean folk medicine treasure known for its
                                <span className="text-lime-300 font-semibold"> cleansing and restorative properties</span>.
                            </p>
                            <p className="text-green-400/70 text-center mt-4 text-sm italic">
                                — In Healing & Vitality, Nefer Kali Healing
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
                        <div className="bg-gradient-to-br from-emerald-950/50 to-green-950/40 border border-emerald-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-600/20">
                                    <Leaf className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-emerald-200">Sacred Ingredients</h2>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-emerald-900/30 border border-emerald-500/20 rounded-xl p-4 text-center">
                                    <p className="text-emerald-300 font-semibold">Gully Root</p>
                                    <p className="text-emerald-100/60 text-sm mt-1">Leaves & Stems</p>
                                </div>
                                <div className="bg-green-900/30 border border-green-500/20 rounded-xl p-4 text-center">
                                    <p className="text-green-300 font-semibold">Cane Spirits</p>
                                    <p className="text-green-100/60 text-sm mt-1">190 Proof • Organic</p>
                                </div>
                                <div className="bg-lime-900/30 border border-lime-500/20 rounded-xl p-4 text-center">
                                    <p className="text-lime-300 font-semibold">Structured Water</p>
                                    <p className="text-lime-100/60 text-sm mt-1">Distilled & Purified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating Root */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🫚</span>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 via-green-100 to-lime-200 bg-clip-text text-transparent">
                                Benefits of Gully Root
                            </h2>
                            <p className="text-emerald-300/60 mt-2">Caribbean healing wisdom 🌿</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/40 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-emerald-600/20 group-hover:scale-110 transition-transform">
                                        <Shield className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-emerald-200">Boosts Immune Function</h3>
                                </div>
                                <p className="text-emerald-100/70 text-sm">Traditionally used to help the body maintain its natural defense system, making it a go-to during times when extra support is needed.</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-950/50 to-green-900/40 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-green-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-green-600/20 group-hover:scale-110 transition-transform">
                                        <Wind className="w-5 h-5 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-200">Supports Respiratory Wellness</h3>
                                </div>
                                <p className="text-green-100/70 text-sm">Known for its long history in aiding respiratory health, this herb is often turned to when you're looking to keep your breathing smooth and clear.</p>
                            </div>

                            <div className="bg-gradient-to-br from-lime-950/50 to-lime-900/40 border border-lime-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-lime-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-lime-600/20 group-hover:scale-110 transition-transform">
                                        <Zap className="w-5 h-5 text-lime-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-lime-200">Promotes Overall Vitality</h3>
                                </div>
                                <p className="text-lime-100/70 text-sm">Gully Root is cherished for its ability to help you feel your best and maintain a sense of balance and well-being.</p>
                            </div>

                            <div className="bg-gradient-to-br from-teal-950/50 to-teal-900/40 border border-teal-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-teal-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-teal-600/20 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-teal-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-teal-200">Healthy Inflammatory Response</h3>
                                </div>
                                <p className="text-teal-100/70 text-sm">This powerful herb has been used for centuries to support the body's natural response to inflammation, helping you stay in tune with your health.</p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/40 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-emerald-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-emerald-200">Natural Cleanser</h3>
                                </div>
                                <p className="text-emerald-100/70 text-sm">Revered for its purifying properties, Gully Root has a long-standing reputation as a powerful cleansing herb, often used to clear out and refresh the body.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Usage Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating tree */}
                    <div className="absolute top-20 right-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🌳</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 via-green-100 to-lime-200 bg-clip-text text-transparent">
                                Suggested Use
                            </h2>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-950/50 to-green-950/40 border border-emerald-500/20 rounded-xl p-6">
                            <ul className="space-y-4 text-emerald-100/80">
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">•</span>
                                    <span><span className="text-emerald-300 font-semibold">Shake well</span> before use</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">•</span>
                                    <span>Take <span className="text-emerald-300 font-semibold">4 drops or up to 0.5 mL</span> when needed</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">•</span>
                                    <span>You can <span className="text-green-300 font-semibold">increase the dose slowly</span> as you see fit</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">•</span>
                                    <span>For best results, add the drops to <span className="text-lime-300 font-semibold">room temperature water</span></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">•</span>
                                    <span>This helps preserve the potency and ensures easier absorption</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400">🥗</span>
                                    <span><span className="text-green-300 font-semibold">Clean diet</span> is preferable for boosted performance of this tincture</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🌿</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-emerald-950/50 via-green-950/40 to-lime-950/50 border border-emerald-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🌿</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🫚</div>

                            <Leaf className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                            <p className="text-xl text-emerald-200 mb-2 font-semibold">Tua U</p>
                            <p className="text-green-100/80 mb-4">Thank you in the ancient language of Kamit</p>
                            <p className="text-lg text-emerald-100">May the healing power of the Caribbean roots be with you.</p>
                            <p className="text-green-300 font-semibold mt-4">🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-emerald-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-emerald-400 hover:text-emerald-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* View PDF Button */}
                        <a
                            href="/guides/gully-root.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-900/50"
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
