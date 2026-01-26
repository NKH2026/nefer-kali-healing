// Analytics Integration Module
// Google Analytics 4 + Microsoft Clarity

// Configuration - Replace with your actual IDs
export const ANALYTICS_CONFIG = {
    // Google Analytics 4 Measurement ID
    // Get this from: https://analytics.google.com → Admin → Data Streams → Web
    GA4_MEASUREMENT_ID: 'G-L504Y40N9W',

    // Microsoft Clarity Project ID  
    // Get this from: https://clarity.microsoft.com → Settings → Overview
    CLARITY_PROJECT_ID: 'v7m3wbvq12',
};

// Initialize Google Analytics 4
export const initGA4 = () => {
    if (typeof window === 'undefined') return;
    if (ANALYTICS_CONFIG.GA4_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
        console.warn('GA4: Measurement ID not configured');
        return;
    }

    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', ANALYTICS_CONFIG.GA4_MEASUREMENT_ID, {
        page_path: window.location.pathname,
    });

    console.log('✅ GA4 Initialized');
};

// Initialize Microsoft Clarity
export const initClarity = () => {
    if (typeof window === 'undefined') return;
    if (ANALYTICS_CONFIG.CLARITY_PROJECT_ID === 'XXXXXXXXXX') {
        console.warn('Clarity: Project ID not configured');
        return;
    }

    (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", ANALYTICS_CONFIG.CLARITY_PROJECT_ID);

    console.log('✅ Clarity Initialized');
};

// Track page views (for SPA navigation)
export const trackPageView = (path: string) => {
    if (typeof window === 'undefined') return;

    // GA4 page view
    if ((window as any).gtag) {
        (window as any).gtag('config', ANALYTICS_CONFIG.GA4_MEASUREMENT_ID, {
            page_path: path,
        });
    }
};

// Track custom events
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    // GA4 event
    if ((window as any).gtag) {
        (window as any).gtag('event', eventName, params);
    }
};

// E-commerce tracking events
export const trackAddToCart = (product: { id: string; name: string; price: number; quantity: number }) => {
    trackEvent('add_to_cart', {
        currency: 'USD',
        value: product.price * product.quantity,
        items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity: product.quantity,
        }],
    });
};

export const trackPurchase = (order: { id: string; total: number; items: any[] }) => {
    trackEvent('purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: 'USD',
        items: order.items,
    });
};

export const trackNewsletterSignup = (email: string) => {
    trackEvent('newsletter_signup', {
        method: 'footer_form',
    });
};

// Initialize all analytics on app load
export const initAnalytics = () => {
    initGA4();
    initClarity();
};
