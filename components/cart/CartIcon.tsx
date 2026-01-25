import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';

const CartIcon: React.FC = () => {
    const { itemCount, openCart } = useCart();

    return (
        <button
            onClick={openCart}
            className="relative p-2 text-white/70 hover:text-[#D4AF37] transition-colors"
            aria-label="Open cart"
        >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </button>
    );
};

export default CartIcon;
