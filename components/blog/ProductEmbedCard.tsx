import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';

const ProductEmbedCard: React.FC<NodeViewProps> = ({ node }) => {
    const navigate = useNavigate();
    const { productId, productTitle, productImage, productPrice } = node.attrs;

    const handleClick = () => {
        navigate(`/products/${productId}`);
    };

    return (
        <NodeViewWrapper className="product-embed my-8 not-prose">
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-br from-purple-900/20 to-black/40 border border-[#D4AF37]/30 rounded-2xl hover:border-[#D4AF37]/60 transition-all duration-300 backdrop-blur-sm">
                {/* Product Image */}
                <div className="flex-shrink-0">
                    <img
                        src={productImage}
                        alt={productTitle}
                        className="w-full sm:w-32 h-32 object-cover rounded-xl border border-white/10"
                    />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-display text-white mb-2">
                            {productTitle}
                        </h3>
                        <p className="text-2xl font-bold text-[#D4AF37]">
                            ${productPrice.toFixed(2)}
                        </p>
                    </div>

                    <button
                        onClick={handleClick}
                        className="mt-4 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4E4C1] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        Get this product
                    </button>
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export default ProductEmbedCard;
