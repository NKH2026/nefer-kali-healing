import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Star, Heart, Sparkles, Leaf, Moon } from 'lucide-react';
import RohiniCycleChart from '../../components/guides/RohiniCycleChart';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// Expanded FAQ data for schema - targeting fertility searches AND ingredient searches
const rohiniTinctureFAQs = [
    // Fertility-focused questions (what people actually search)
    {
        question: 'What are natural ways to increase fertility?',
        answer: 'Natural ways to increase fertility include taking fertility-supporting herbs like Shatavari, Vitex (Chasteberry), Dong Quai, Wild Yam, and Red Clover. These herbs support hormonal balance, egg quality, and healthy ovulation. Rohini Tincture combines 12 fertility-supporting herbs in one formula designed for the follicular phase of the menstrual cycle.'
    },
    {
        question: 'What herbs help with fertility and getting pregnant?',
        answer: 'Herbs that help with fertility include Shatavari (the "Queen of Herbs" for women), Vitex for hormone regulation, Dong Quai ("Female Ginseng"), Wild Yam for progesterone support, Red Clover for uterine health, and Ashwagandha for stress reduction. Rohini Tincture contains all of these plus Milk Thistle, Dandelion Root, Burdock Root, Schisandra Berry, Nettle Leaf, and Holy Basil.'
    },
    {
        question: 'How can I improve my egg quality naturally?',
        answer: 'You can improve egg quality naturally with herbs like Shatavari, Ashwagandha, and Dong Quai which support reproductive health. Liver-supporting herbs like Milk Thistle, Dandelion Root, and Burdock Root help detoxify excess hormones. Taking these during the follicular phase (Day 3 to ovulation) supports healthy egg development. Rohini Tincture combines all these herbs specifically for egg quality support.'
    },
    // Ingredient-specific questions (so people searching these find Rohini)
    {
        question: 'What is Shatavari good for?',
        answer: 'Shatavari is called the "Queen of Herbs" for women and supports female reproductive health, hormonal balance, and fertility. It helps regulate FSH and LH levels, supports healthy ovulation, and nourishes the uterus. Shatavari is a key ingredient in Rohini Tincture for follicular phase support.'
    },
    {
        question: 'What does Vitex (Chasteberry) do for fertility?',
        answer: 'Vitex (Chasteberry) helps regulate hormones by supporting the pituitary gland, which controls FSH and LH. It can help lengthen the luteal phase, support healthy progesterone levels, and promote regular ovulation. Vitex is included in Rohini Tincture along with other fertility-supporting herbs.'
    },
    {
        question: 'What is Dong Quai used for?',
        answer: 'Dong Quai is known as "Female Ginseng" and has been used for centuries to support menstrual health, fertility, and hormonal balance. It promotes healthy blood flow to the reproductive organs and supports egg quality. Dong Quai is one of the 12 herbs in Rohini Tincture.'
    },
    {
        question: 'How does Wild Yam support fertility?',
        answer: 'Wild Yam contains natural compounds that support hormone balance and progesterone production. It has been traditionally used to support fertility, ease menstrual discomfort, and nourish the reproductive system. Wild Yam is included in Rohini Tincture for follicular phase support.'
    },
    {
        question: 'What are the benefits of Red Clover for fertility?',
        answer: 'Red Clover is rich in isoflavones and supports uterine health, healthy blood flow to the reproductive organs, and hormonal balance. It has been traditionally used to support fertility and prepare the body for conception. Red Clover is one of the herbs in Rohini Tincture.'
    },
    // Original product questions
    {
        question: 'What is Rohini Tincture and what does it contain?',
        answer: 'Rohini Tincture is a sacred herbal formula containing 12 fertility-supporting herbs: Shatavari, Wild Yam, Ashwagandha, Holy Basil, Milk Thistle, Dandelion Root, Burdock Root, Red Clover, Dong Quai, Vitex, Schisandra Berry, and Nettle Leaf. It is named after the brightest star in Taurus and is designed for the follicular phase.'
    },
    {
        question: 'When should I take Rohini Tincture in my cycle?',
        answer: 'Take Rohini Tincture from Day 3 of menstruation until a few days before ovulation. This is during the follicular phase when eggs are developing. Take 0.5-1 mL daily under the tongue or in room temperature water.'
    },
    {
        question: 'What is the difference between Rohini and Balance Tinctures?',
        answer: 'Rohini Tincture is for the follicular phase (menstruation to ovulation) and supports egg development, estrogen balance, and fertility. Balance Tincture is for the luteal phase (after ovulation to menstruation) and supports progesterone and hormone balance. Using both together provides complete cycle support.'
    }
];

export default function RohiniTinctureGuide() {
    return (
        <>
            <SEOHead
                title="Rohini Tincture - Natural Fertility Herbs with Shatavari, Vitex & Dong Quai"
                description="Natural fertility support with 12 herbs including Shatavari, Vitex, Dong Quai, Wild Yam, Red Clover, and Ashwagandha. Supports egg quality, hormonal balance, and the follicular phase. Shop Rohini Tincture."
                keywords={[
                    'natural fertility herbs',
                    'increase fertility naturally',
                    'Shatavari fertility',
                    'Vitex Chasteberry fertility',
                    'Dong Quai fertility',
                    'Wild Yam fertility',
                    'Red Clover fertility',
                    'egg quality herbs',
                    'follicular phase support',
                    'Rohini Tincture',
                    'fertility tincture',
                    'herbs to get pregnant',
                    'natural conception support',
                    'Ashwagandha fertility',
                    'Milk Thistle hormones',
                    'Nettle Leaf fertility'
                ]}
                url="/guides/rohini-tincture"
                schema={[
                    getArticleSchema({
                        title: 'Natural Fertility Herbs - Rohini Tincture with Shatavari, Vitex & Dong Quai',
                        slug: 'rohini-tincture',
                        description: 'Sacred herbal formula with 12 fertility-supporting herbs for natural conception support and egg quality.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(rohiniTinctureFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Rohini Tincture - Natural Fertility Herbs', url: '/guides/rohini-tincture' }
                    ])
                ]}
            />

            <div className="min-h-screen bg-gradient-to-b from-[#1a0f1a] via-[#2d1f2a] to-[#1a1015]">
                {/* Hero Section - Taurus/Rohini Theme: Cream, Pink, Constellation */}
                <section className="relative py-20 px-4 overflow-hidden">
                    {/* Rohini/Taurus Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-400/30 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-amber-100/25 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-rose-200/20 rounded-full blur-[110px]" />
                    </div>

                    {/* Floating Cow Animation 🐄 */}
                    <div className="absolute top-32 right-16 opacity-25 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">🐄</span>
                    </div>

                    {/* Floating Taurus Animation ♉ */}
                    <div className="absolute bottom-40 left-16 opacity-20 animate-pulse" style={{ animationDuration: '3s' }}>
                        <span className="text-5xl">♉</span>
                    </div>

                    {/* Floating Stars/Constellation Animation ✨ */}
                    <div className="absolute top-48 left-1/4 opacity-25 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                        <span className="text-4xl">✨</span>
                    </div>

                    {/* Uterus Animation */}
                    <div className="absolute bottom-32 right-28 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
                            <path d="M50 80 Q50 60, 30 50 Q10 40, 20 25 Q30 10, 40 20 Q50 30, 50 50 Q50 30, 60 20 Q70 10, 80 25 Q90 40, 70 50 Q50 60, 50 80 Z"
                                fill="#f9a8d4" stroke="#f472b6" strokeWidth="2" />
                        </svg>
                    </div>

                    {/* Constellation Pattern */}
                    <div className="absolute top-20 left-1/3 opacity-10">
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                            <circle cx="20" cy="20" r="3" fill="#fef3c7" className="animate-pulse" />
                            <circle cx="50" cy="30" r="2" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                            <circle cx="70" cy="50" r="3" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '1s' }} />
                            <circle cx="40" cy="70" r="2" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                            <circle cx="80" cy="80" r="2" fill="#fef3c7" className="animate-pulse" style={{ animationDelay: '2s' }} />
                            <line x1="20" y1="20" x2="50" y2="30" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5" />
                            <line x1="50" y1="30" x2="70" y2="50" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5" />
                            <line x1="70" y1="50" x2="40" y2="70" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5" />
                            <line x1="40" y1="70" x2="80" y2="80" stroke="#fef3c7" strokeWidth="0.5" opacity="0.5" />
                        </svg>
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-pink-300/80 hover:text-pink-200 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-300 via-rose-200 to-amber-100 bg-clip-text text-transparent mb-4">
                                Rohini Tincture
                            </h1>
                            <p className="text-xl text-pink-100/70 max-w-2xl mx-auto">
                                Named After the Lunar Mansion of Abundance & Growth
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-12">
                            <a
                                href="/guides/rohini-tincture.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 hover:from-pink-400 hover:via-rose-300 hover:to-amber-200 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-pink-900/50"
                            >
                                <Droplets className="w-5 h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Prajapati Welcome Message */}
                        <div className="bg-gradient-to-br from-pink-900/40 via-rose-950/30 to-amber-950/40 border border-pink-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-4xl opacity-20">♉</div>
                            <div className="absolute bottom-2 left-4 text-3xl opacity-20">🐄</div>
                            <div className="absolute top-1/2 right-8 opacity-15 animate-pulse">
                                <span className="text-3xl">✨</span>
                            </div>

                            <p className="text-2xl text-amber-100 font-semibold text-center mb-3">
                                <span className="text-pink-300">Om Prajapataye Namaha</span> 🙏🏾
                            </p>
                            <p className="text-pink-100/90 text-lg leading-relaxed text-center">
                                <span className="text-amber-200 font-semibold">Rohini</span> — the brightest star in the Taurus constellation,
                                ruled by <span className="text-pink-300 font-semibold">Prajapati</span>, the Lord of Creation.
                            </p>
                            <p className="text-rose-200/80 text-center mt-4">
                                This sacred tincture embodies the nurturing, fertile energy of the celestial cow,
                                supporting the <span className="text-pink-300 font-semibold">follicular phase</span> when new life and new eggs are being cultivated.
                            </p>
                            <p className="text-amber-300/70 text-center mt-4 text-sm italic">
                                — In Growth & Abundance, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating cow */}
                    <div className="absolute top-10 right-10 opacity-15 animate-bounce" style={{ animationDuration: '4s' }}>
                        <span className="text-4xl">🐄</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-pink-900/30 to-amber-950/40 border border-pink-400/20 rounded-2xl p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-pink-500/20">
                                    <Leaf className="w-6 h-6 text-pink-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-pink-200">Sacred Ingredients</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-3 text-center">
                                    <p className="text-pink-300 font-semibold">Shatavari</p>
                                    <p className="text-pink-100/60 text-xs mt-1">Queen of Herbs</p>
                                </div>
                                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3 text-center">
                                    <p className="text-amber-200 font-semibold">Wild Yam</p>
                                    <p className="text-amber-100/60 text-xs mt-1">Hormone Support</p>
                                </div>
                                <div className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-3 text-center">
                                    <p className="text-rose-300 font-semibold">Ashwagandha</p>
                                    <p className="text-rose-100/60 text-xs mt-1">Adaptogenic</p>
                                </div>
                                <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-3 text-center">
                                    <p className="text-green-300 font-semibold">Holy Basil</p>
                                    <p className="text-green-100/60 text-xs mt-1">Sacred Protection</p>
                                </div>
                                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3 text-center">
                                    <p className="text-yellow-300 font-semibold">Milk Thistle</p>
                                    <p className="text-yellow-100/60 text-xs mt-1">Liver Support</p>
                                </div>
                                <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-3 text-center">
                                    <p className="text-orange-300 font-semibold">Dandelion Root</p>
                                    <p className="text-orange-100/60 text-xs mt-1">Detoxification</p>
                                </div>
                                <div className="bg-amber-900/20 border border-amber-400/20 rounded-xl p-3 text-center">
                                    <p className="text-amber-300 font-semibold">Burdock Root</p>
                                    <p className="text-amber-100/60 text-xs mt-1">Blood Purifying</p>
                                </div>
                                <div className="bg-red-900/20 border border-red-400/20 rounded-xl p-3 text-center">
                                    <p className="text-red-300 font-semibold">Red Clover</p>
                                    <p className="text-red-100/60 text-xs mt-1">Fertility Support</p>
                                </div>
                                <div className="bg-pink-900/20 border border-pink-400/20 rounded-xl p-3 text-center">
                                    <p className="text-pink-300 font-semibold">Dong Quai</p>
                                    <p className="text-pink-100/60 text-xs mt-1">Female Ginseng</p>
                                </div>
                                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 text-center">
                                    <p className="text-indigo-300 font-semibold">Vitex</p>
                                    <p className="text-indigo-100/60 text-xs mt-1">Hormone Balance</p>
                                </div>
                                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-3 text-center">
                                    <p className="text-purple-300 font-semibold">Schisandra Berry</p>
                                    <p className="text-purple-100/60 text-xs mt-1">Stress Relief</p>
                                </div>
                                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-3 text-center">
                                    <p className="text-emerald-300 font-semibold">Nettle Leaf</p>
                                    <p className="text-emerald-100/60 text-xs mt-1">Nourishing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 px-4 relative">
                    {/* Floating Taurus */}
                    <div className="absolute top-10 left-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">♉</span>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                                Benefits of Rohini
                            </h2>
                            <p className="text-pink-200/60 mt-2">Nurturing the follicular phase 🌙</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/40 border border-pink-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-pink-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-pink-500/20 group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-pink-200">Hormonal Balance</h3>
                                </div>
                                <p className="text-pink-100/70 text-sm">Shatavari and Vitex regulate FSH and LH levels for a healthy menstrual cycle.</p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/40 border border-amber-400/20 rounded-xl p-6 backdrop-blur-sm hover:border-amber-300/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-amber-400/20 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-amber-200">Egg Quality</h3>
                                </div>
                                <p className="text-amber-100/70 text-sm">Dong Quai and Ashwagandha support reproductive health and egg development.</p>
                            </div>

                            <div className="bg-gradient-to-br from-rose-900/30 to-rose-950/40 border border-rose-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-rose-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-rose-500/20 group-hover:scale-110 transition-transform">
                                        <Moon className="w-5 h-5 text-rose-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-rose-200">Fertility Enhancement</h3>
                                </div>
                                <p className="text-rose-100/70 text-sm">Wild Yam, Red Clover, and Nettle Leaf nourish the reproductive system.</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-900/30 to-green-950/40 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-green-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-green-500/20 group-hover:scale-110 transition-transform">
                                        <Leaf className="w-5 h-5 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-200">Liver Detox</h3>
                                </div>
                                <p className="text-green-100/70 text-sm">Milk Thistle, Dandelion, and Burdock Root support hormone detoxification.</p>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/40 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-sm hover:border-indigo-400/40 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/20 group-hover:scale-110 transition-transform">
                                        <Star className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-indigo-200">Stress Relief</h3>
                                </div>
                                <p className="text-indigo-100/70 text-sm">Holy Basil and Schisandra Berry maintain healthy FSH and LH levels.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section with Rohini Cycle Chart */}
                <section className="py-16 px-4 relative">
                    {/* Floating constellation */}
                    <div className="absolute top-20 right-10 opacity-15 animate-pulse" style={{ animationDuration: '4s' }}>
                        <span className="text-5xl">✨</span>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-400/20 mb-4">
                                <Moon className="w-4 h-4 text-pink-400" />
                                <span className="text-pink-300 text-sm font-medium">Sacred Use Guide</span>
                                <span className="text-lg">♉</span>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                                When to Take Rohini Tincture
                            </h2>
                            <p className="text-pink-200/70 mt-3 max-w-2xl mx-auto">
                                Take at the <span className="text-pink-300 font-semibold">beginning of menstruation</span> up until
                                a few days before <span className="text-amber-300 font-semibold">Ovulation</span>.
                            </p>
                        </div>

                        {/* Rohini Cycle Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 via-pink-950/30 to-amber-950/40 border border-pink-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <RohiniCycleChart className="mb-8" />
                        </div>

                        {/* Dosage Instructions */}
                        <div className="mt-12 grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/40 border border-pink-500/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-pink-300 mb-4">💧 Suggested Use</h3>
                                <ul className="space-y-3 text-pink-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-pink-400 flex-shrink-0">•</span>
                                        <span><span className="text-pink-300 font-semibold">Shake well</span> before use</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-pink-400 flex-shrink-0">•</span>
                                        <span>Take <span className="text-pink-300 font-semibold whitespace-nowrap">0.5 - 1 mL</span> daily</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-pink-400 flex-shrink-0">•</span>
                                        <span>Under the tongue or in room temperature drink</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/40 border border-amber-400/20 rounded-xl p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-amber-300 mb-4">🐄 Best During Follicular Phase</h3>
                                <p className="text-amber-100/80 text-sm sm:text-base">
                                    This herbal tincture is best taken during the <span className="text-amber-300 font-semibold">follicular phase</span> —
                                    from Day 3 of menstruation until a few days before ovulation.
                                </p>
                                <p className="text-pink-200/60 text-sm mt-3 italic">
                                    Supports egg development and prepares the body for ovulation.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-16 px-4 relative">
                    {/* Floating decorations */}
                    <div className="absolute bottom-10 left-10 opacity-15 animate-pulse">
                        <span className="text-5xl">🐄</span>
                    </div>
                    <div className="absolute top-10 right-16 opacity-15 animate-bounce" style={{ animationDuration: '5s' }}>
                        <span className="text-4xl">♉</span>
                    </div>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-pink-900/30 via-rose-950/30 to-amber-950/40 border border-pink-400/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">✨</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">🐄</div>

                            <Star className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                            <p className="text-xl text-pink-200 mb-2 font-semibold">Om Prajapataye Namaha</p>
                            <p className="text-amber-100/80 mb-4">Salutations to Prajapati, Lord of Creation</p>
                            <p className="text-lg text-pink-100">May your sacred vessel be nurtured with abundance and growth.</p>
                            <p className="text-amber-300 font-semibold mt-4">🙏🏾</p>

                            <div className="mt-6 pt-6 border-t border-pink-500/20">
                                <a
                                    href="mailto:info@neferkalihealing.org"
                                    className="text-pink-400 hover:text-pink-300 transition-colors underline"
                                >
                                    info@neferkalihealing.org
                                </a>
                            </div>
                        </div>

                        {/* View PDF Button */}
                        <a
                            href="/guides/rohini-tincture.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-4 mt-8 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-300 hover:from-pink-400 hover:via-rose-300 hover:to-amber-200 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-pink-900/50"
                        >
                            <Droplets className="w-5 h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-12 px-4 border-t border-pink-900/30">
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
