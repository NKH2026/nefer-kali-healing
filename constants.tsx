
import React from 'react';
import { Sun, Heart, Users, Leaf, BookOpen } from 'lucide-react';
import { DestinyPath, ProductCard, BlogPost } from './types';

export const NAKSHATRAS = [
  { name: "Ashwini", symbol: "🐴", meaning: "Physicians of Gods" },
  { name: "Bharani", symbol: "♈", meaning: "The Bearer" },
  { name: "Krittika", symbol: "🔥", meaning: "The Cutter" },
  { name: "Rohini", symbol: "🚜", meaning: "The Red One" },
  { name: "Mrigashira", symbol: "🦌", meaning: "Deer Head" },
  { name: "Ardra", symbol: "💧", meaning: "The Moist One" },
  { name: "Punarvasu", symbol: "🏹", meaning: "Return of Light" },
  { name: "Pushya", symbol: "🌸", meaning: "The Nourisher" },
  { name: "Ashlesha", symbol: "🐍", meaning: "The Embracer" },
  { name: "Magha", symbol: "👑", meaning: "The Mighty" },
  { name: "Purva Phalguni", symbol: "🛋️", meaning: "Former Red One" },
  { name: "Uttara Phalguni", symbol: "🛏️", meaning: "Latter Red One" },
  { name: "Hasta", symbol: "✋", meaning: "The Hand" },
  { name: "Chitra", symbol: "💎", description: "The Bright One" },
  { name: "Swati", symbol: "🌱", meaning: "Sword/Sprout" },
  { name: "Vishakha", symbol: "⛩️", meaning: "Forked Branch" },
  { name: "Anuradha", symbol: "🌂", meaning: "Subsequent Success" },
  { name: "Jyeshtha", symbol: "💍", meaning: "The Eldest" },
  { name: "Mula", symbol: "🌳", meaning: "The Root" },
  { name: "Purva Ashadha", symbol: "🌊", meaning: "Early Victory" },
  { name: "Uttara Ashadha", symbol: "🐘", meaning: "Latter Victory" },
  { name: "Shravana", symbol: "👂", meaning: "The Ear" },
  { name: "Dhanishta", symbol: "🥁", meaning: "The Wealthiest" },
  { name: "Shatabhisha", symbol: "⭕", meaning: "Hundred Physicians" },
  { name: "Purva Bhadrapada", symbol: "⚔️", meaning: "First Blessed Feet" },
  { name: "Uttara Bhadrapada", symbol: "👥", meaning: "Latter Blessed Feet" },
  { name: "Revati", symbol: "🐟", meaning: "The Wealthy" }
];

export const DESTINY_PATHS: DestinyPath[] = [
  {
    id: 'journey',
    label: 'Nonprofit',
    subLabel: 'Our Journey',
    icon: 'journey',
    color: 'from-yellow-600/20 to-emerald-900/40',
    accent: '#D4AF37'
  },
  {
    id: 'support',
    label: 'Donate',
    subLabel: 'Support Mission',
    icon: 'support',
    color: 'from-amber-700/20 to-red-900/40',
    accent: '#ff8f00'
  },
  {
    id: 'community',
    label: 'Community',
    subLabel: 'Unity Circle',
    icon: 'community',
    color: 'from-emerald-700/20 to-blue-900/40',
    accent: '#2e7d32'
  },
  {
    id: 'wellness',
    label: 'Offerings',
    subLabel: 'Events & Products',
    icon: 'wellness',
    color: 'from-green-800/20 to-stone-900/40',
    accent: '#1b5e20'
  },
  {
    id: 'wisdom',
    label: 'Blog',
    subLabel: 'Healing Wisdom',
    icon: 'wisdom',
    color: 'from-indigo-900/20 to-purple-900/40',
    accent: '#283593'
  }
];

export const PRODUCTS: ProductCard[] = [
  {
    id: '1',
    title: 'Cashew Bark Extract',
    type: 'Product',
    description: 'Anacardium Occidentale - Ethically sourced from St. Lucia, capturing raw Caribbean healing traditions.',
    price: '$20.00',
    image: '/assets/blood_bush_tea.png', // Placeholder
    rating: 4.9,
    reviews: 15
  },
  {
    id: '2',
    title: 'Gully Root Extract',
    type: 'Product',
    description: 'Immunity Booster - Derived from Guinea Hen Weed, traditionally used to support immune system health.',
    price: '$20.00',
    image: '/assets/blood_bush_tea.png',
    rating: 5,
    reviews: 22
  },
  {
    id: '3',
    title: 'Feminine Vitality Tea',
    type: 'Product',
    description: 'Het Her Womb PLUS - A sacred poly-herbal loose leaf blend for womb health and vitality.',
    price: '$20.00',
    image: '/assets/blood_bush_tea.png',
    rating: 4.8,
    reviews: 38
  },
  {
    id: '4',
    title: 'Sacred Cycle Alchemy',
    type: 'Product',
    description: 'Holistic Uterine Care Kit - A comprehensive collection of botanical remedies for cycle alignment.',
    price: '$37.00',
    image: '/assets/womb_event.png',
    rating: 5,
    reviews: 14
  },
  {
    id: '5',
    title: 'Balance | Menstrual Relief',
    type: 'Product',
    description: 'Herbal extract designed to provide relief from menstrual discomfort and balance the cycle.',
    price: '$18.00',
    image: '/assets/blood_bush_tea.png',
    rating: 4.7,
    reviews: 29
  },
  {
    id: '6',
    title: 'Rohini | Fertility Support',
    type: 'Product',
    description: "Women's Fertility Support Tincture - Supporting reproductive health and natural fertility.",
    price: '$18.00',
    image: '/assets/blood_bush_tea.png',
    rating: 5,
    reviews: 11
  },
  {
    id: '7',
    title: "St. John's Bush Tea",
    type: 'Product',
    description: "Blood Bush Tea (Justicia Secunda) - Traditionally used for womanhood and blood health.",
    price: '$14.44',
    image: '/assets/blood_bush_tea.png',
    rating: 4.9,
    reviews: 45
  },
  {
    id: '8',
    title: 'Dream Elixir',
    type: 'Product',
    description: 'Poly Herbal Lucid Dreaming Tincture - Enhance dream recall and explore celestial transmissions.',
    price: '$18.00',
    image: '/assets/dandelion_workshop.png',
    rating: 4.8,
    reviews: 56
  },
  {
    id: '9',
    title: 'The Cosmic Dream Journal',
    type: 'Product',
    description: 'A sacred space to record celestial transmissions, dream patterns, and nocturnal insights.',
    price: '$35.00',
    image: '/assets/dandelion_workshop.png',
    rating: 5,
    reviews: 9
  },
  {
    id: '10',
    title: 'Sea Moss Trio Bundle',
    type: 'Product',
    description: 'Gold, Purple, and Green St. Lucian Sea Moss (12 oz) for full spectrum mineral support.',
    price: '$37.00',
    image: '/assets/sea_moss.png',
    rating: 5,
    reviews: 82
  },
  {
    id: '11',
    title: 'Premium Golden Sea Moss',
    type: 'Product',
    description: 'Wildcrafted superfood rich in iodine and minerals to support thyroid and skin health.',
    price: '$10.00',
    image: '/assets/sea_moss.png',
    rating: 4.9,
    reviews: 128
  },
  {
    id: '12',
    title: 'Purple Sea Moss',
    type: 'Product',
    description: 'High in antioxidants and phytonutrients for powerful immune support and mineral replenishment.',
    price: '$12.00',
    image: '/assets/sea_moss.png',
    rating: 5,
    reviews: 64
  },
  {
    id: '13',
    title: 'Green Sea Moss',
    type: 'Product',
    description: 'Rare green variety naturally dried to preserve unique chlorophyll content and mineral density.',
    price: '$12.00',
    image: '/assets/sea_moss.png',
    rating: 4.8,
    reviews: 31
  },
  {
    id: '14',
    title: 'Het Her Womb PLUS (Liquid)',
    type: 'Product',
    description: 'Poly Herbal Menstrual Support - Concentrated liquid extract for faster absorption.',
    price: '$18.00',
    image: '/assets/blood_bush_tea.png',
    rating: 5,
    reviews: 19
  },
  {
    id: '15',
    title: 'Blood Bush Extract',
    type: 'Product',
    description: "Concentrated Justicia Secunda extract, crafted for ancestral blood health benefits.",
    price: '$16.00',
    image: '/assets/blood_bush_tea.png',
    rating: 4.9,
    reviews: 24
  },
  {
    id: '16',
    title: 'Nervine Tonic | Uatchet',
    type: 'Product',
    description: 'Blue Vervain & Black Reishi - Supporting the nervous system to promote inner peace.',
    price: 'Contact Us',
    image: '/assets/dandelion_workshop.png',
    rating: 5,
    reviews: 7
  },
  {
    id: '17',
    title: 'Chaparral Tincture',
    type: 'Product',
    description: 'Powerful desert plant antioxidant known for deep cleansing properties.',
    price: '$15.00',
    image: '/assets/blood_bush_tea.png',
    rating: 4.7,
    reviews: 16
  },
  {
    id: '18',
    title: 'The Blood Cleanser',
    type: 'Product',
    description: 'Poly herbal capsules designed to support the body\'s natural purification processes.',
    price: 'Contact Us',
    image: '/assets/blood_bush_tea.png',
    rating: 5,
    reviews: 12
  }
];

export const BLOGS: BlogPost[] = [
  { id: '1', title: 'Walking with Auset', excerpt: 'Finding sovereignty in the modern wilderness...', date: 'Vernal Equinox' } as any,
  { id: '2', title: 'Jyotish for the Soul', excerpt: 'Decoding Saturn return through a Kemetic lens...', date: 'Full Moon' } as any,
  { id: '3', title: 'The Power of Orisha', excerpt: 'How Oshun heals the heart of the community...', date: 'Solstice' } as any,
  { id: '4', title: 'Djed Architecture', excerpt: 'Building a stable spiritual spine...', date: 'New Moon' } as any,
];

export const ICONS = {
  journey: <Sun className="w-6 h-6" />,
  support: <Heart className="w-6 h-6" />,
  community: <Users className="w-6 h-6" />,
  wellness: <Leaf className="w-6 h-6" />,
  wisdom: <BookOpen className="w-6 h-6" />
};

export const TESTIMONIALS: import('./types').Testimonial[] = [
  {
    id: 1,
    name: "Aysha F.",
    location: "Fishers, US-IN",
    rating: 5,
    text: "BEAUTIFUL TEA! A beautiful tea!!!!! It's so hearty and so smooth and tastes great!",
    productName: "Feminine Vitality Tea",
    date: "1 week ago",
    verified: true
  },
  {
    id: 2,
    name: "Asahi B.",
    location: "Denver, US-CO",
    rating: 5,
    text: "Highly recommend. My product came packaged with care and works great. I will buy again.",
    productName: "Blood Bush Extract",
    date: "6 months ago",
    verified: true
  },
  {
    id: 3,
    name: "Sophia",
    location: "",
    rating: 5,
    text: "First and foremost, I love the customer service. The seller shipped very quickly and the packaging was beautiful.",
    productName: "St. John's Bush Tea",
    date: "8 months ago",
    verified: true
  },
  {
    id: 4,
    name: "Myrlande",
    location: "",
    rating: 5,
    text: "Thank you so much for making these herbs available to women with womb issues. Truly a blessing.",
    productName: "Gully Root Extract",
    date: "8 months ago",
    verified: true
  },
  {
    id: 5,
    name: "Destiny H.",
    location: "",
    rating: 5,
    text: "Item came intact with a thank you card and instructions. Tinctures are dark and potent.",
    productName: "Sacred Cycle Alchemy",
    date: "8 months ago",
    verified: true
  },
  {
    id: 6,
    name: "Patricia",
    location: "",
    rating: 5,
    text: "These three products are the GOAT. Suffering with irregular periods and this helped regulate me within a month.",
    productName: "Sacred Cycle Alchemy",
    date: "9 months ago",
    verified: true
  },
  {
    id: 7,
    name: "Kathy",
    location: "",
    rating: 5,
    text: "The delivery of the items I order was top tier! Thoughtful and wonderful packaging.",
    productName: "Feminine Vitality Tea",
    date: "9 months ago",
    verified: true
  }
];
