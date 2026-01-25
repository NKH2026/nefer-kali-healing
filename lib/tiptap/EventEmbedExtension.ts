import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import EventEmbedCard from '../../components/blog/EventEmbedCard';

export interface EventEmbedOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        eventEmbed: {
            setEventEmbed: (options: {
                eventId: string;
                eventTitle: string;
                eventImage: string;
                eventDate: string;
                eventLocation?: string;
            }) => ReturnType;
        };
    }
}

export const EventEmbed = Node.create<EventEmbedOptions>({
    name: 'eventEmbed',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            eventId: {
                default: null,
            },
            eventTitle: {
                default: null,
            },
            eventImage: {
                default: null,
            },
            eventDate: {
                default: null,
            },
            eventLocation: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="event-embed"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'event-embed' }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(EventEmbedCard);
    },

    addCommands() {
        return {
            setEventEmbed:
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

export default EventEmbed;
