import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Heart, Droplets, Flower2, Sun } from 'lucide-react';
import CycleChart from '../../components/guides/CycleChart';
import SEOHead from '../../components/SEOHead';
import { getArticleSchema, getFAQSchema, getBreadcrumbSchema } from '../../lib/schema';

// Expanded FAQ data targeting fibroid, uterine health, and ingredient searches
const hetHerWombFAQs = [
    // Fibroid & uterine health searches (what people actually search)
    {
        question: 'What are natural ways to deal with fibroids?',
        answer: 'Natural ways to support uterine health with fibroids include taking herbs like St Johns Bush (Justicia secunda), Blue Vervain, and Red Raspberry Leaf which support womb detoxification and hormonal balance. Het Her Womb PLUS Tea contains these herbs in a blend designed to support uterine wellness and menstrual comfort.'
    },
    {
        question: 'What herbs help shrink fibroids naturally?',
        answer: 'Herbs traditionally used to support uterine health with fibroids include St Johns Bush (also called Blood Bush or Justicia secunda), Blue Vervain for hormone balance, and Red Raspberry Leaf for uterine toning. Het Her Womb PLUS Tea combines these womb-supporting herbs in one formula.'
    },
    {
        question: 'What is the best herb for uterine health?',
        answer: 'St Johns Bush (Justicia secunda) is considered one of the best herbs for uterine health in Caribbean tradition. Also known as Blood Bush, it has been used for generations to support womb wellness, menstrual health, and fibroid support. Het Her Womb PLUS Tea contains St Johns Bush as its primary ingredient.'
    },
    // Ingredient-specific searches
    {
        question: 'What is St Johns Bush (Justicia secunda)?',
        answer: 'St Johns Bush (Justicia secunda), also called Blood Bush or Blood Root, is a powerful Caribbean herb exclusively grown in tropical regions. It has been traditionally used for centuries to support womb health, fibroids, menstrual issues, and uterine wellness. It is the primary ingredient in Het Her Womb PLUS Tea and Tincture.'
    },
    {
        question: 'What is Justicia secunda used for?',
        answer: 'Justicia secunda (St Johns Bush or Blood Bush) is traditionally used for uterine health, fibroid support, heavy menstrual bleeding, PMS symptoms, and womb detoxification. Het Her Womb PLUS Tea contains Justicia secunda along with Blue Vervain and Red Raspberry Leaf for comprehensive womb support.'
    },
    {
        question: 'What is Blood Bush herb good for?',
        answer: 'Blood Bush (also called St Johns Bush or Justicia secunda) is a Caribbean herb traditionally used for womb health, fibroids, heavy periods, and menstrual pain. It supports hormone balance and uterine wellness. Het Her Womb PLUS products contain this powerful herb for feminine healing.'
    },
    // PMS and menstrual searches
    {
        question: 'What herbs help with PMS and menstrual cramps?',
        answer: 'Herbs that help with PMS and menstrual cramps include St Johns Bush (Blood Bush), Blue Vervain for nervous system and hormone support, and Red Raspberry Leaf for uterine toning. Het Her Womb PLUS Tea is a herbal blend designed to support menstrual comfort and reduce PMS symptoms.'
    },
    {
        question: 'How do you do a natural womb detox?',
        answer: 'A natural womb detox involves taking uterine-supporting herbs like St Johns Bush, Blue Vervain, and Red Raspberry Leaf during the luteal phase (after ovulation through menstruation). Het Her Womb PLUS Tea can be taken for up to 30 consecutive days once per year for a complete womb detox.'
    },
    // Original product questions
    {
        question: 'What is Het Her Womb PLUS Tea?',
        answer: 'Het Her Womb PLUS Tea is a sacred herbal blend containing St Johns Bush (Justicia secunda), Blue Vervain, and Red Raspberry Leaf. It is a womb health tincture designed to support fibroids, hormonal balance, menstrual comfort, and uterine wellness. Named after Het Heru (Hathor), the Egyptian goddess of feminine energy.'
    },
    {
        question: 'When should you take Het Her Womb PLUS Tea?',
        answer: 'Take after ovulation for 14-16 days, leading up to and throughout menstruation. Steep 1-2 teaspoons in 8-10 oz of hot water for 15-30 minutes. Can be taken for 30 consecutive days only once a year for a womb detox.'
    },
    {
        question: 'Is St Johns Bush the same as St Johns Wort?',
        answer: 'No, St Johns Bush (Justicia secunda) is completely different from European St Johns Wort (Hypericum perforatum). St Johns Bush is a Caribbean herb specific to womb health and fibroids, while St Johns Wort is a European herb used for mood support. Het Her Womb products contain St Johns Bush, not St Johns Wort.'
    }
];

export default function HetHerWombPlusTeaGuide() {
    return (
        <>
            <SEOHead
                title="Het Her Womb PLUS Tea - Natural Fibroid & Uterine Health Herbs with St Johns Bush"
                description="Natural herbal tea for fibroids, uterine health, and PMS with St Johns Bush (Justicia secunda), Blood Bush, Blue Vervain, and Red Raspberry Leaf. Womb health tincture for menstrual support."
                keywords={[
                    'natural fibroid treatment',
                    'herbs for fibroids',
                    'St Johns Bush',
                    'Justicia secunda',
                    'Blood Bush herb',
                    'uterine health herbs',
                    'womb health tincture',
                    'womb detox tea',
                    'PMS tincture',
                    'menstrual cramps herbs',
                    'Het Her Womb tea',
                    'womens health herbs',
                    'herbal tincture for fibroids',
                    'hormone tincture',
                    'detox tincture',
                    'herbal medicine for uterus'
                ]}
                url="/guides/het-her-womb-plus-tea"
                schema={[
                    getArticleSchema({
                        title: 'Natural Fibroid & Uterine Health Herbs - Het Her Womb PLUS Tea',
                        slug: 'het-her-womb-plus-tea',
                        description: 'Sacred herbal tea with St Johns Bush (Justicia secunda) for fibroids, uterine health, and womb wellness.',
                        publishDate: '2024-01-01',
                        modifiedDate: '2025-01-01'
                    }),
                    getFAQSchema(hetHerWombFAQs),
                    getBreadcrumbSchema([
                        { name: 'Home', url: '/' },
                        { name: 'Healing Guides', url: '/healing-guides' },
                        { name: 'Het Her Womb PLUS Tea - Fibroid & Uterine Support', url: '/guides/het-her-womb-plus-tea' }
                    ])
                ]}
            />

            <div className="min-h-screen bg-gradient-to-b from-[#1a0a05] via-[#2d1810] to-[#1a0a05]">
                {/* Hero Section - Oshun Theme */}
                <section className="relative py-12 md:py-20 px-4 overflow-hidden">
                    {/* Golden/Pink Glow Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500/40 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-400/30 rounded-full blur-[100px]" />
                        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-amber-400/20 rounded-full blur-[150px]" />
                        <div className="absolute bottom-40 right-10 w-80 h-80 bg-pink-300/25 rounded-full blur-[110px]" />
                    </div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            to="/healing-guides"
                            className="inline-flex items-center gap-2 text-amber-300/80 hover:text-amber-200 transition-colors mb-6 md:mb-8 group text-sm md:text-base"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Healing Guides
                        </Link>

                        {/* Title */}
                        <div className="text-center mb-8 md:mb-12">
                            {/* Oshun Badge */}
                            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-amber-500/10 border border-amber-400/30 mb-4 md:mb-6">
                                <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-300" />
                                <span className="text-amber-200 text-xs md:text-sm font-medium">Blessed by Ọ̀ṣun • Divine Waters</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-amber-200 via-pink-300 to-amber-200 bg-clip-text text-transparent mb-3 md:mb-4">
                                Het Her Womb PLUS Tea
                            </h1>
                            <p className="text-lg md:text-xl text-pink-100/70 max-w-2xl mx-auto">
                                Sacred Herbal Blend for Divine Feminine Wellness
                            </p>
                        </div>

                        {/* View PDF Button */}
                        <div className="flex justify-center mb-8 md:mb-12">
                            <a
                                href="https://www.neferkalihealing.org/_files/ugd/7a4df9_eaf6e8fe6b2a4bc88d16d01e4acaa194.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50 text-sm md:text-base"
                            >
                                <Flower2 className="w-4 h-4 md:w-5 md:h-5" />
                                View PDF Guide
                            </a>
                        </div>

                        {/* Orí Yèyé O Welcome Message */}
                        <div className="bg-gradient-to-br from-amber-900/40 to-pink-950/50 border border-amber-400/20 rounded-2xl p-5 md:p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-2 right-4 text-3xl md:text-4xl opacity-20">🌻</div>
                            <div className="absolute bottom-2 left-4 text-2xl md:text-3xl opacity-15">💛</div>

                            <p className="text-xl md:text-2xl text-amber-100 font-semibold text-center mb-2 md:mb-3">
                                <span className="text-amber-300">Orí Yèyé O</span> 🙏🏾
                            </p>
                            <p className="text-pink-100/90 text-base md:text-lg leading-relaxed text-center">
                                This divine herbal formula comes from admiration and devotion to <span className="text-amber-300 font-semibold">Het Heru</span>,
                                also correlated to the heavenly body <span className="text-pink-300 font-semibold">Venus</span>, the planet that represents the divine feminine.
                            </p>
                            <p className="text-amber-200/80 text-center mt-3 md:mt-4 text-sm md:text-base">
                                Het Her Womb PLUS tea embodies the sacred rhythms of Venus, whose 584-day dance through the heavens
                                guides the cycles of divine feminine healing.
                            </p>
                            <p className="text-amber-300/70 text-center mt-3 md:mt-4 text-xs md:text-sm italic">
                                — Àṣẹ, Nefer Kali Healing
                            </p>
                        </div>
                    </div>
                </section>

                {/* Ingredients Section */}
                <section className="py-10 md:py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-pink-900/30 to-amber-950/40 border border-pink-400/20 rounded-2xl p-5 md:p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className="p-2 md:p-3 rounded-xl bg-pink-500/20">
                                    <Flower2 className="w-5 h-5 md:w-6 md:h-6 text-pink-300" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-pink-200">Sacred Ingredients</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 text-center">
                                    <p className="text-amber-300 font-semibold">St John's Bush</p>
                                    <p className="text-amber-100/60 text-sm mt-1">Organic • Caribbean Traditional</p>
                                </div>
                                <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-4 text-center">
                                    <p className="text-pink-300 font-semibold">Blue Vervain</p>
                                    <p className="text-pink-100/60 text-sm mt-1">Organic • Nervine Tonic</p>
                                </div>
                                <div className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-4 text-center">
                                    <p className="text-rose-300 font-semibold">Red Raspberry Leaf</p>
                                    <p className="text-rose-100/60 text-sm mt-1">Organic • Uterine Support</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-10 md:py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-amber-200">Healing Benefits</h2>
                            <p className="text-pink-200/60 mt-2 text-sm md:text-base">Divine support for the sacred feminine</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                            {[
                                { title: 'Womb Detoxification', icon: Droplets, color: 'pink' },
                                { title: 'Fallopian Tube Cleansing', icon: Sparkles, color: 'amber' },
                                { title: 'Menstrual Pain Relief', icon: Heart, color: 'rose' },
                                { title: 'Hormonal Balance', icon: Sun, color: 'amber' },
                                { title: 'Menopause Support', icon: Flower2, color: 'pink' },
                                { title: 'Uterine Health', icon: Heart, color: 'rose' },
                            ].map((benefit, i) => (
                                <div
                                    key={i}
                                    className={`bg-gradient-to-br from-${benefit.color}-900/30 to-${benefit.color}-950/40 border border-${benefit.color}-500/20 rounded-xl p-4 md:p-6 backdrop-blur-sm hover:border-${benefit.color}-400/40 transition-all duration-300`}
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                                        <div className={`p-1.5 md:p-2 rounded-lg bg-${benefit.color}-500/20 flex-shrink-0`}>
                                            <benefit.icon className={`w-4 h-4 md:w-5 md:h-5 text-${benefit.color}-400`} />
                                        </div>
                                        <h3 className={`text-sm md:text-lg font-semibold text-${benefit.color}-200`}>{benefit.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sacred Use Section with Cycle Chart */}
                <section className="py-10 md:py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8 md:mb-12">
                            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-pink-500/10 border border-pink-400/20 mb-3 md:mb-4">
                                <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400" />
                                <span className="text-pink-300 text-xs md:text-sm font-medium">Sacred Use Guide</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-amber-200">When to Take Het Her Womb PLUS</h2>
                            <p className="text-pink-200/70 mt-2 md:mt-3 max-w-2xl mx-auto text-sm md:text-base">
                                Take after <span className="text-amber-300 font-semibold">Ovulation</span> for 14-16 days,
                                leading up to and <span className="text-pink-300 font-semibold">throughout menstruation</span>.
                            </p>
                        </div>

                        {/* Animated Cycle Chart */}
                        <div className="bg-gradient-to-br from-slate-900/60 to-pink-950/40 border border-pink-500/20 rounded-2xl p-4 md:p-8 backdrop-blur-sm">
                            <CycleChart className="mb-4 md:mb-8" />
                        </div>

                        {/* Brewing Instructions */}
                        <div className="mt-8 lg:mt-12 grid md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/40 border border-amber-500/20 rounded-xl p-4 md:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-amber-300 mb-4">☕ Brewing Instructions</h3>
                                <ul className="space-y-3 text-amber-100/80 text-sm sm:text-base">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 flex-shrink-0">1.</span>
                                        <span>Steep <span className="text-amber-300 font-semibold whitespace-nowrap">1-2 teaspoons</span> of the herbal blend</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 flex-shrink-0">2.</span>
                                        <span>In <span className="text-amber-300 font-semibold whitespace-nowrap">8-10 oz</span> of hot water</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 flex-shrink-0">3.</span>
                                        <span>For <span className="text-amber-300 font-semibold whitespace-nowrap">15-30 minutes</span></span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-pink-900/30 to-pink-950/40 border border-pink-500/20 rounded-xl p-4 md:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-pink-300 mb-3 md:mb-4">🌸 30-Day Detox Option</h3>
                                <p className="text-pink-100/80 text-sm sm:text-base">
                                    Can be taken for <span className="text-pink-300 font-semibold whitespace-nowrap">30 days consecutively</span> for
                                    one month <span className="text-pink-300 font-semibold">only</span> if doing a womb detox.
                                </p>
                                <p className="text-pink-200/60 text-sm mt-3 italic">
                                    This should only be done once a year.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing Blessing */}
                <section className="py-10 md:py-16 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-br from-amber-900/30 to-pink-950/40 border border-amber-400/20 rounded-2xl p-5 md:p-8 backdrop-blur-sm relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-6 text-3xl opacity-20">🌻</div>
                            <div className="absolute bottom-4 right-6 text-3xl opacity-20">💛</div>

                            <Sun className="w-10 h-10 md:w-12 md:h-12 text-amber-400 mx-auto mb-3 md:mb-4" />
                            <p className="text-lg md:text-xl text-amber-200 mb-2 font-semibold">Ore Yèyé O, Ọ̀ṣun</p>
                            <p className="text-pink-100/80 mb-3 md:mb-4 text-sm md:text-base">Praise to the Mother of Sweet Waters</p>
                            <p className="text-base md:text-lg text-amber-100">May you flow in abundance, love, and divine feminine power.</p>
                            <p className="text-amber-300 font-semibold mt-3 md:mt-4">Àṣẹ 🙏🏾</p>

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
                            href="https://www.neferkalihealing.org/_files/ugd/7a4df9_eaf6e8fe6b2a4bc88d16d01e4acaa194.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 mt-6 md:mt-8 bg-gradient-to-r from-amber-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-amber-900/50 text-sm md:text-base"
                        >
                            <Flower2 className="w-4 h-4 md:w-5 md:h-5" />
                            View Full PDF Guide
                        </a>
                    </div>
                </section>

                {/* Health Disclaimer */}
                <section className="py-8 md:py-12 px-4 border-t border-amber-900/30">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-slate-900/50 border border-slate-600/30 rounded-xl p-4 md:p-6">
                            <h3 className="text-slate-300 font-semibold mb-2 md:mb-3 text-sm md:text-base">Health Disclaimer</h3>
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
