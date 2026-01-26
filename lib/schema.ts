// Schema.org JSON-LD generators for SEO and LLM visibility

const SITE_URL = 'https://neferkalihealing.org';
const SITE_NAME = 'Nefer Kali Healing';

// Organization Schema (Nonprofit)
export const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'NonprofitOrganization',
    name: SITE_NAME,
    alternateName: 'Nefer Kali Healing & Spiritual Education',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/logo.png`,
    description: 'A nonprofit organization providing accessible spiritual education and natural wellness to underserved communities through Kemetic, Orisha, and Vedic wisdom.',
    foundingDate: '2024',
    address: {
        '@type': 'PostalAddress',
        postOfficeBoxNumber: '322',
        addressLocality: 'McCordsville',
        addressRegion: 'IN',
        postalCode: '46055',
        addressCountry: 'US',
    },
    contactPoint: {
        '@type': 'ContactPoint',
        email: 'info@neferkalihealing.org',
        contactType: 'customer service',
    },
    sameAs: [
        'https://www.instagram.com/neferkalihealing/',
        'https://www.youtube.com/@neferkalihealing',
        'https://www.pinterest.com/NeferKaliHealing/',
    ],
    areaServed: 'Worldwide',
    knowsAbout: [
        'Herbal Medicine',
        'Kemetic Spirituality',
        'Holistic Wellness',
        'Natural Healing',
        'Spiritual Education',
    ],
});

// Product Schema
export const getProductSchema = (product: {
    name: string;
    slug: string;
    description: string;
    price: number;
    image?: string;
    inStock?: boolean;
    rating?: number;
    reviewCount?: number;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: `${SITE_URL}/offerings/${product.slug}`,
    image: product.image || `${SITE_URL}/assets/default-product.jpg`,
    brand: {
        '@type': 'Organization',
        name: SITE_NAME,
    },
    offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: product.inStock !== false
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        seller: {
            '@type': 'Organization',
            name: SITE_NAME,
        },
    },
    ...(product.rating && product.reviewCount && {
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
        },
    }),
});

// Article/Blog Post Schema
export const getArticleSchema = (article: {
    title: string;
    slug: string;
    description: string;
    publishDate: string;
    modifiedDate?: string;
    author?: string;
    image?: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/wisdom/${article.slug}`,
    image: article.image || `${SITE_URL}/assets/default-blog.jpg`,
    datePublished: article.publishDate,
    dateModified: article.modifiedDate || article.publishDate,
    author: {
        '@type': 'Organization',
        name: SITE_NAME,
    },
    publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/assets/logo.png`,
        },
    },
    mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/wisdom/${article.slug}`,
    },
});

// FAQ Schema (great for LLM visibility)
export const getFAQSchema = (faqs: { question: string; answer: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
        },
    })),
});

// Event Schema
export const getEventSchema = (event: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    location?: string;
    isOnline?: boolean;
    image?: string;
    eventId?: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    eventAttendanceMode: event.isOnline
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.isOnline ? {
        '@type': 'VirtualLocation',
        url: `${SITE_URL}/community/events/${event.eventId}`,
    } : {
        '@type': 'Place',
        name: event.location || 'TBD',
    },
    organizer: {
        '@type': 'Organization',
        name: SITE_NAME,
    },
    image: event.image,
});

// Local Business Schema (for health/wellness)
export const getLocalBusinessSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: SITE_NAME,
    description: 'Holistic healing and spiritual wellness nonprofit offering herbal products, workshops, and spiritual education.',
    url: SITE_URL,
    priceRange: '$$',
    address: {
        '@type': 'PostalAddress',
        postOfficeBoxNumber: '322',
        addressLocality: 'McCordsville',
        addressRegion: 'IN',
        postalCode: '46055',
        addressCountry: 'US',
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: 39.8978,
        longitude: -85.8864,
    },
    openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
    },
});

// BreadcrumbList Schema
export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
});

// WebSite Schema with SearchAction (for sitelinks searchbox)
export const getWebsiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Holistic healing through Kemetic, Orisha, and Vedic wisdom. Natural herbal products and spiritual education.',
    potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/offerings?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
});

// Speakable Schema (for voice search / AI assistants)
export const getSpeakableSchema = (cssSelectors: string[]) => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: cssSelectors,
    },
});

// Helper to inject schema into page
export const injectSchema = (schema: object | object[]) => {
    const schemas = Array.isArray(schema) ? schema : [schema];
    return schemas.map(s => JSON.stringify(s)).join('\n');
};
