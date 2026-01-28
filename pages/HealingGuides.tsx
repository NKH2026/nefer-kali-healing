import React, { useEffect, useRef } from 'react';
import { FileText, ExternalLink, BookOpen, Download } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';

// Guide card component
interface GuideCardProps {
    title: string;
    description: string;
    pdfUrl: string;
    pdfUrl2?: string; // Optional second PDF (e.g., Spirits version)
    pdfLabel?: string; // Label for first PDF (e.g., "Glycerin")
    pdfLabel2?: string; // Label for second PDF (e.g., "Spirits")
    webUrl?: string; // Optional link to web page version
    image?: string;
}

const GuideCard: React.FC<GuideCardProps> = ({ title, description, pdfUrl, pdfUrl2, pdfLabel, pdfLabel2, webUrl, image }) => {
    return (
        <div className="guide-card group relative bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-xl border border-white/10 overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            {/* Image */}
            <div className="aspect-[4/3] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] relative overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-[#D4AF37]/30 group-hover:text-[#D4AF37]/50 transition-colors" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-lg font-display text-[#D4AF37] mb-2 group-hover:text-[#f0d77c] transition-colors">
                    {title}
                </h3>
                <p className="text-white/50 text-sm mb-4 line-clamp-2">
                    {description}
                </p>
                <div className="flex flex-wrap gap-2">
                    {webUrl && (
                        <Link
                            to={webUrl}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black text-xs uppercase tracking-widest rounded hover:bg-[#f0d77c] transition-all duration-300 font-semibold"
                        >
                            <BookOpen className="w-3 h-3" />
                            Read Online
                        </Link>
                    )}
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4AF37]/50 text-[#D4AF37] text-xs uppercase tracking-widest rounded hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
                    >
                        <Download className="w-3 h-3" />
                        {pdfLabel ? `${pdfLabel} PDF` : 'Download PDF'}
                    </a>
                    {pdfUrl2 && (
                        <a
                            href={pdfUrl2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 text-xs uppercase tracking-widest rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                        >
                            <Download className="w-3 h-3" />
                            {pdfLabel2 ? `${pdfLabel2} PDF` : 'Download PDF 2'}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

// Tab categories - Reordered with Sea Moss and Herbal Teas at the end
type TabKey = 'herbal-extracts' | 'sacred-cycle' | 'womb-care' | 'sea-moss' | 'herbal-teas';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'herbal-extracts', label: 'Herbal Extracts' },
    { key: 'sacred-cycle', label: 'Sacred Cycle Alchemy' },
    { key: 'womb-care', label: 'Womb Care Extracts' },
    { key: 'sea-moss', label: 'Sea Moss' },
    { key: 'herbal-teas', label: 'Herbal Teas' },
];

// PDF URLs from Wix
const PDF_URLS = {
    seaMoss: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_d917c9f1e11842dba8318018424f1e49.pdf',
    hetHerWombPlusTea: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_eaf6e8fe6b2a4bc88d16d01e4acaa194.pdf',
    stJohnsBush: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_fd8184afb85e44c0b9e0778a176b54f1.pdf',
    creosote: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_a75e97e472774986ab978cae62bf6354.pdf',
    dreamElixir: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_0fdb8ea3ea2f43d5b035e1e3518152ec.pdf',
    uatchet: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_5d2fb623546f4baaa385570c869e2b3d.pdf',
    gullyRoot: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_1232ffa900f842d79ec44e882b39f1eb.pdf',
    cashewBark: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_8105d848bf154b28ba3046057afce29b.pdf',
    hetHerWombPlus: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_448c90ac8399476596c95f4440fec48c.pdf',
    balance: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_8f45f898fd1e4155a4a2cd081884b2d0.pdf',
    rohini: '/guides/rohini-tincture.pdf',
    hetHerWomb: 'https://www.neferkalihealing.org/_files/ugd/7a4df9_391b2b27eb904507a7f5ec93fb5b8a7b.pdf',
};

// Guide data organized by category
const GUIDES: Record<TabKey, GuideCardProps[]> = {
    'sea-moss': [
        {
            title: 'Sea Moss Guide',
            description: 'Discover the nutrient-rich power of St. Lucian Sea Moss. Learn preparation methods, benefits of each variety, and how to incorporate this oceanic superfood into your daily wellness ritual.',
            pdfUrl: '/guides/sea-moss-guide.pdf',
            webUrl: '/guides/sea-moss',
            image: '/guides/sea-moss-product.png',
        },
    ],
    'herbal-teas': [
        {
            title: 'Het Her Womb PLUS Tea',
            description: 'A sacred blend designed to nourish and support the feminine essence. Brewing instructions and holistic benefits for womb wellness.',
            pdfUrl: PDF_URLS.hetHerWombPlusTea,
            webUrl: '/guides/het-her-womb-plus-tea',
            image: '/guides/het-her-womb-plus-tea-product.png',
        },
        {
            title: 'St. John\'s Bush Tea',
            description: 'Traditional Caribbean healing tea with centuries of medicinal wisdom. Learn the proper preparation and therapeutic uses.',
            pdfUrl: PDF_URLS.stJohnsBush,
            webUrl: '/guides/st-johns-bush-tea',
            image: '/guides/st-johns-bush-tea-product.jpg',
        },
    ],
    'herbal-extracts': [
        {
            title: 'Creosote Extract',
            description: 'Also known as Chaparral, this powerful desert plant extract carries ancient healing properties. Usage guide and dosage information.',
            pdfUrl: '/guides/creosote-bush.pdf',
            webUrl: '/guides/creosote-bush',
            image: '/guides/creosote-product.png',
        },
        {
            title: 'Dream Elixir',
            description: 'Unlock the messages of your subconscious. This mystical blend supports lucid dreaming and restful sleep patterns.',
            pdfUrl: '/guides/dream-elixir.pdf',
            webUrl: '/guides/dream-elixir',
            image: '/guides/dream-elixir-product.jpg',
        },
        {
            title: 'Uatchet Extract',
            description: 'Named after the ancient Egyptian serpent goddess of protection. A powerful herbal ally for your wellness journey.',
            pdfUrl: '/guides/uatchet-tincture.pdf',
            webUrl: '/guides/uatchet',
            image: '/guides/uatchet-product.jpg',
        },
        {
            title: 'Gully Root Extract',
            description: 'Caribbean folk medicine treasure known for its cleansing and restorative properties. Complete usage instructions.',
            pdfUrl: '/guides/gully-root.pdf',
            webUrl: '/guides/gully-root',
            image: '/guides/gully-root-product.png',
        },
        {
            title: 'Cashew Bark Extract',
            description: 'Traditional herbal remedy with powerful healing compounds. Learn safe usage and preparation methods.',
            pdfUrl: '/guides/cashew-bark.pdf',
            webUrl: '/guides/cashew-bark',
            image: '/guides/cashew-bark-product.png',
        },
    ],
    'sacred-cycle': [
        {
            title: 'Het Her Womb PLUS',
            description: 'This sacred formula channels the wisdom of Het-Heru, also known as Oshun in the Ifa tradition. Herbal support for each phase of your moon rhythm.',
            pdfUrl: PDF_URLS.hetHerWombPlus,
            webUrl: '/guides/het-her-womb-plus-extract',
            image: '/guides/sacred-cycle-collection.jpg',
        },
        {
            title: 'Balance',
            description: 'Find your equilibrium with this carefully crafted herbal formula. Supports hormonal harmony and emotional wellness.',
            pdfUrl: PDF_URLS.balance,
            webUrl: '/guides/balance-tincture',
            image: '/guides/sacred-cycle-collection.jpg',
        },
        {
            title: 'Rohini',
            description: 'Named after the lunar mansion of abundance and growth. Nurturing support for feminine vitality.',
            pdfUrl: PDF_URLS.rohini,
            webUrl: '/guides/rohini-tincture',
            image: '/guides/sacred-cycle-collection.jpg',
        },
    ],
    'womb-care': [
        {
            title: 'Het Her Womb',
            description: 'Sacred womb care formula. Choose Glycerin (alcohol-free) or Spirits base.',
            pdfUrl: '/guides/het-her-womb-glycerin.pdf',
            pdfLabel: 'Glycerin',
            pdfUrl2: '/guides/het-her-womb-spirits.pdf',
            pdfLabel2: 'Spirits',
            webUrl: '/guides/het-her-womb-tincture',
            image: '/guides/het-her-womb-product.png',
        },
        {
            title: 'Balance Extract',
            description: 'Liquid herbal support for maintaining hormonal equilibrium. Dosage and usage guide included.',
            pdfUrl: PDF_URLS.balance,
            webUrl: '/guides/balance-tincture',
            image: '/guides/balance-product.png',
        },
        {
            title: 'Rohini Extract',
            description: 'Nourishing womb care extract to support your sacred feminine energy. Complete usage instructions.',
            pdfUrl: PDF_URLS.rohini,
            webUrl: '/guides/rohini-tincture',
            image: '/guides/rohini-product.png',
        },
        {
            title: 'Het Her Womb PLUS Extract',
            description: 'Enhanced formula for deeper womb healing support. Advanced practices and ritual suggestions.',
            pdfUrl: PDF_URLS.hetHerWombPlus,
            webUrl: '/guides/het-her-womb-plus-extract',
            image: '/guides/het-her-womb-plus-product.jpg',
        },
    ],
};

const HealingGuides: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const contentRef = useRef<HTMLDivElement>(null);

    // Get active tab from URL, default to 'herbal-extracts'
    const tabFromUrl = searchParams.get('tab') as TabKey | null;
    const activeTab: TabKey = tabFromUrl && TABS.some(t => t.key === tabFromUrl)
        ? tabFromUrl
        : 'herbal-extracts';

    // Function to change tab and update URL
    const setActiveTab = (tab: TabKey) => {
        setSearchParams({ tab });
    };

    // Animate cards when tab changes
    useEffect(() => {
        if (contentRef.current) {
            const cards = contentRef.current.querySelectorAll('.guide-card');
            gsap.fromTo(cards,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
            );
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
            {/* Hero Section */}
            <div className="text-center mb-12 px-8">
                <div className="inline-block mb-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8B7322] shadow-[0_0_30px_rgba(212,175,55,0.4)]" />
                </div>
                <h1 className="text-4xl md:text-6xl font-display mb-4">
                    <span className="text-[#D4AF37]">Sacred</span>{' '}
                    <span className="text-white italic">Healing Library</span>
                </h1>
                <p className="text-white/50 text-lg max-w-2xl mx-auto">
                    Ancient Wisdom for Your Wellness Journey
                </p>
            </div>

            {/* Tab Buttons */}
            <div className="max-w-5xl mx-auto px-8 mb-12">
                <div className="flex flex-wrap justify-center gap-3">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2.5 rounded-full border text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === tab.key
                                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                                : 'bg-transparent text-white/60 border-white/20 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-8" ref={contentRef}>
                {/* Section Title */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                    <h2 className="text-2xl md:text-3xl font-display text-white tracking-wide">
                        {TABS.find(t => t.key === activeTab)?.label}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GUIDES[activeTab].map((guide, index) => (
                        <GuideCard key={index} {...guide} />
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-20 px-8">
                <div className="max-w-2xl mx-auto p-8 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-white/10">
                    <h3 className="text-xl font-display text-[#D4AF37] mb-4">
                        Need More Guidance?
                    </h3>
                    <p className="text-white/50 mb-6">
                        Our healing guides are included with your product purchase. For personalized support,
                        explore our healing sessions or reach out to our community.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="/offerings"
                            className="px-6 py-3 bg-[#D4AF37] text-black text-xs uppercase tracking-widest rounded hover:bg-[#f0d77c] transition-colors"
                        >
                            Shop Products
                        </a>
                        <a
                            href="/community"
                            className="px-6 py-3 border border-[#D4AF37]/50 text-[#D4AF37] text-xs uppercase tracking-widest rounded hover:bg-[#D4AF37]/10 transition-colors"
                        >
                            Join Community
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealingGuides;
