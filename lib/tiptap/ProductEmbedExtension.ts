import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ProductEmbedCard from '../../components/blog/ProductEmbedCard';

export interface ProductEmbedOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        productEmbed: {
            setProductEmbed: (options: {
                productId: string;
                productTitle: string;
                productImage: string;
                productPrice: number;
            }) => ReturnType;
        };
    }
}

export const ProductEmbed = Node.create<ProductEmbedOptions>({
    name: 'productEmbed',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            productId: {
                default: null,
            },
            productTitle: {
                default: null,
            },
            productImage: {
                default: null,
            },
            productPrice: {
                default: 0,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="product-embed"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'product-embed' }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ProductEmbedCard);
    },

    addCommands() {
        return {
            setProductEmbed:
                (options) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: options,
                        });
                    },
        };
    },
});

export default ProductEmbed;
