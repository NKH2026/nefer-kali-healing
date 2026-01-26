import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface CartItem {
    id: string; // product_id + variant_id
    productId: string;
    variantId?: string;
    title: string;
    variantTitle?: string;
    price: number;
    image: string;
    quantity: number;
    isSubscription: boolean;
    subscriptionFrequency?: string;
    subscriptionDiscount?: number;
    maxQuantity?: number;
}

interface AppliedCoupon {
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
}

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    itemCount: number;
    subtotal: number;
    appliedCoupon: AppliedCoupon | null;
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    toggleSubscription: (id: string, isSubscription: boolean, frequency?: string) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    setCoupon: (coupon: AppliedCoupon | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'nkh-cart';
const COUPON_STORAGE_KEY = 'nkh-coupon';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

    // Load cart and coupon from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                setItems(JSON.parse(savedCart));
            }
            const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
            if (savedCoupon) {
                setAppliedCoupon(JSON.parse(savedCoupon));
            }
        } catch (e) {
            console.warn('Could not access localStorage:', e);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            // localStorage may be blocked by browser security settings
            console.warn('Could not save to localStorage:', e);
        }
    }, [items]);

    const generateItemId = (productId: string, variantId?: string, isSubscription?: boolean): string => {
        return `${productId}-${variantId || 'default'}-${isSubscription ? 'sub' : 'once'}`;
    };

    const addItem = (newItem: Omit<CartItem, 'id'>) => {
        const id = generateItemId(newItem.productId, newItem.variantId, newItem.isSubscription);

        setItems(prev => {
            const existingIndex = prev.findIndex(item => item.id === id);

            if (existingIndex > -1) {
                // Update quantity of existing item
                const updated = [...prev];
                const maxQty = updated[existingIndex].maxQuantity || 99;
                updated[existingIndex].quantity = Math.min(
                    updated[existingIndex].quantity + newItem.quantity,
                    maxQty
                );
                return updated;
            }

            // Add new item
            return [...prev, { ...newItem, id }];
        });

        // Open cart when adding item
        setIsOpen(true);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id);
            return;
        }

        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const maxQty = item.maxQuantity || 99;
                return { ...item, quantity: Math.min(quantity, maxQty) };
            }
            return item;
        }));
    };

    const toggleSubscription = (id: string, isSubscription: boolean, frequency?: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;

            // Remove old item and add with new subscription status
            const newId = generateItemId(item.productId, item.variantId, isSubscription);
            const filtered = prev.filter(i => i.id !== id);

            // Check if the new subscription version already exists
            const existingNew = filtered.find(i => i.id === newId);
            if (existingNew) {
                // Merge quantities
                return filtered.map(i =>
                    i.id === newId
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            }

            return [...filtered, {
                ...item,
                id: newId,
                isSubscription,
                subscriptionFrequency: frequency
            }];
        });
    };

    const clearCart = () => {
        setItems([]);
        setAppliedCoupon(null);
        try { localStorage.removeItem(COUPON_STORAGE_KEY); } catch (e) { }
    };

    const setCoupon = (coupon: AppliedCoupon | null) => {
        setAppliedCoupon(coupon);
        try {
            if (coupon) {
                localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
            } else {
                localStorage.removeItem(COUPON_STORAGE_KEY);
            }
        } catch (e) { }
    };

    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal = items.reduce((sum, item) => {
        let itemPrice = item.price;
        if (item.isSubscription && item.subscriptionDiscount) {
            itemPrice = item.price * (1 - item.subscriptionDiscount / 100);
        }
        return sum + (itemPrice * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{
            items,
            isOpen,
            itemCount,
            subtotal,
            appliedCoupon,
            addItem,
            removeItem,
            updateQuantity,
            toggleSubscription,
            clearCart,
            openCart,
            closeCart,
            setCoupon,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
