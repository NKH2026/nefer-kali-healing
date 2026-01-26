import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    article?: {
        publishedTime?: string;
        modifiedTime?: string;
        author?: string;
        section?: string;
        tags?: string[];
    };
    product?: {
        price?: number;
        currency?: string;
        availability?: 'instock' | 'outofstock';
    };
    noindex?: boolean;
    schema?: object | object[];
}

const SITE_NAME = 'Nefer Kali Healing';
const SITE_URL = 'https://neferkalihealing.org';
const DEFAULT_IMAGE = `${SITE_URL}/assets/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'Holistic healing through Kemetic, Orisha, and Vedic wisdom. Natural herbal products, spiritual education, and community wellness for all.';

const SEOHead: React.FC<SEOHeadProps> = ({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords = ['holistic healing', 'herbal medicine', 'spiritual wellness', 'Kemetic wisdom', 'natural remedies'],
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    article,
    product,
    noindex = false,
    schema,
}) => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <link rel="canonical" href={fullUrl} />

            {/* Robots */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            )}

            {/* Open Graph */}
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:locale" content="en_US" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Article-specific meta (for blog posts) */}
            {type === 'article' && article && (
                <>
                    {article.publishedTime && (
                        <meta property="article:published_time" content={article.publishedTime} />
                    )}
                    {article.modifiedTime && (
                        <meta property="article:modified_time" content={article.modifiedTime} />
                    )}
                    {article.author && (
                        <meta property="article:author" content={article.author} />
                    )}
                    {article.section && (
                        <meta property="article:section" content={article.section} />
                    )}
                    {article.tags?.map((tag, i) => (
                        <meta key={i} property="article:tag" content={tag} />
                    ))}
                </>
            )}

            {/* Product-specific meta */}
            {type === 'product' && product && (
                <>
                    {product.price && (
                        <>
                            <meta property="product:price:amount" content={product.price.toString()} />
                            <meta property="product:price:currency" content={product.currency || 'USD'} />
                        </>
                    )}
                    {product.availability && (
                        <meta property="product:availability" content={product.availability} />
                    )}
                </>
            )}

            {/* Schema.org JSON-LD */}
            {schema && (
                Array.isArray(schema) ? (
                    schema.map((s, i) => (
                        <script key={i} type="application/ld+json">
                            {JSON.stringify(s)}
                        </script>
                    ))
                ) : (
                    <script type="application/ld+json">
                        {JSON.stringify(schema)}
                    </script>
                )
            )}
        </Helmet>
    );
};

export default SEOHead;
