import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered,
    Quote, Image as ImageIcon, Link as LinkIcon, Save, ArrowLeft, Loader2,
    Eye, Upload, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Code, FileCode, Minus, Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
    IndentIncrease, IndentDecrease, Highlighter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface BlogEditorProps {
    initialData?: any; // For editing existing posts
    onSave: () => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            // Ideally show a loading state here, but for now we'll just upload
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `content/${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('blog-images')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Supabase Storage Error:', uploadError);
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from('blog-images')
                    .getPublicUrl(filePath);

                editor.chain().focus().setImage({ src: data.publicUrl }).run();
            } catch (error: any) {
                console.error('Error uploading inline image:', error);
                alert(`Failed to upload image: ${error.message || error.error_description || 'Unknown error'}`);
            }
        };
        input.click();
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap gap-2 p-4 bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('bold') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('italic') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('underline') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Underline"
            >
                <UnderlineIcon size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('strike') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Strikethrough"
            >
                <Strikethrough size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('code') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Inline Code"
            >
                <Code size={18} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Heading 1"
            >
                <Heading1 size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Heading 2"
            >
                <Heading2 size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Heading 3"
            >
                <Heading3 size={18} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('bulletList') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('orderedList') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Ordered List"
            >
                <ListOrdered size={18} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 self-center" />
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('blockquote') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Quote"
            >
                <Quote size={18} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center" />

            {/* Color Picker */}
            <div className="flex items-center gap-1">
                <button
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor('#D4AF37').run(); }}
                    className={`w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform ${editor.isActive('textStyle', { color: '#D4AF37' }) ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: '#D4AF37' }}
                    title="Gold"
                />
                <button
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor('#c084fc').run(); }}
                    className={`w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform ${editor.isActive('textStyle', { color: '#c084fc' }) ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: '#c084fc' }}
                    title="Purple"
                />
                <button
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor('#f87171').run(); }}
                    className={`w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform ${editor.isActive('textStyle', { color: '#f87171' }) ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: '#f87171' }}
                    title="Red"
                />
                <button
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
                    className="p-2 rounded hover:bg-white/10 text-gray-400"
                    title="Reset Color"
                >
                    <Palette size={18} />
                </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 self-center" />

            {/* Text Alignment */}
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive({ textAlign: 'left' }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Align Left"
            >
                <AlignLeft size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive({ textAlign: 'center' }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Align Center"
            >
                <AlignCenter size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive({ textAlign: 'right' }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Align Right"
            >
                <AlignRight size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Justify"
            >
                <AlignJustify size={18} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 self-center" />

            {/* Special Formatting */}
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('codeBlock') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Code Block"
            >
                <FileCode size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="p-2 rounded hover:bg-white/10 text-gray-400"
                title="Horizontal Rule"
            >
                <Minus size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('subscript') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Subscript"
            >
                <SubscriptIcon size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('superscript') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Superscript"
            >
                <SuperscriptIcon size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('highlight') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Highlight"
            >
                <Highlighter size={18} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 self-center" />

            <button
                onClick={setLink}
                className={`p-2 rounded hover:bg-white/10 ${editor.isActive('link') ? 'bg-purple-900/50 text-purple-300' : 'text-gray-400'}`}
                title="Link"
            >
                <LinkIcon size={18} />
            </button>
            <button
                onClick={addImage}
                className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                title="Upload Image"
            >
                <ImageIcon size={18} />
            </button>


        </div>
    );
};

export const BlogEditor = ({ postId, onBack }: { postId?: string, onBack: () => void }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [category, setCategory] = useState('Astrology');
    const [author, setAuthor] = useState("Y'Marii Shango Bunmi Balewa");
    const [isPublished, setIsPublished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);


    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // Disable default code block to use CodeBlockLowlight
                horizontalRule: false, // Disable to use our separate HorizontalRule extension
            }),
            BubbleMenuExtension,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            Underline,
            Subscript,
            Superscript,
            HorizontalRule,
            CodeBlockLowlight.configure({
                lowlight: createLowlight(common),
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),

            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: '100%',
                            parseHTML: element => element.style.width,
                        },
                        layout: {
                            default: 'center', // left, right, center
                            parseHTML: element => {
                                if (element.style.float === 'left') return 'left';
                                if (element.style.float === 'right') return 'right';
                                return 'center';
                            },
                        },
                    }
                },
                renderHTML({ HTMLAttributes }) {
                    const { width, layout, style, ...rest } = HTMLAttributes;
                    let css = `width: ${width};`;

                    if (layout === 'left') {
                        css += ' float: left; margin: 0 1rem 1rem 0; display: inline;';
                    } else if (layout === 'right') {
                        css += ' float: right; margin: 0 0 1rem 1rem; display: inline;';
                    } else {
                        css += ' float: none; margin: 1rem auto; display: block;';
                    }

                    return ['img', { ...rest, style: css }];
                }
            }).configure({
                HTMLAttributes: {
                    class: 'rounded-lg border border-white/10',
                },
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-purple-400 underline cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder: 'Write your wisdom here...',
            }),
            Typography,
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6 text-white font-urbanist',
            },
        },
    });

    useEffect(() => {
        if (postId) {
            fetchPost();
        }
    }, [postId]);

    const fetchPost = async () => {
        if (!postId) return;
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) {
            console.error('Error fetching post:', error);
            return;
        }

        if (data) {
            setTitle(data.title);
            setSlug(data.slug);
            setExcerpt(data.excerpt || '');
            setCoverImage(data.cover_image_url || '');
            setCategory(data.category || 'Astrology');
            setAuthor(data.author || "Y'Marii Shango BunMi");
            setIsPublished(data.published);
            editor?.commands.setContent(data.content);
        }
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploadingImage(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('blog-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('blog-images')
                .getPublicUrl(filePath);

            setCoverImage(data.publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!title || !editor) {
            alert('Please enter a title and content.');
            return;
        }

        setIsSaving(true);
        try {
            const content = editor.getHTML();
            const postData = {
                title,
                slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                excerpt,
                content,
                cover_image_url: coverImage,
                category,
                author,
                published: isPublished,
            };

            let error;
            if (postId) {
                const { error: updateError } = await supabase
                    .from('blog_posts')
                    .update(postData)
                    .eq('id', postId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('blog_posts')
                    .insert([postData]);
                error = insertError;
            }

            if (error) throw error;
            onBack();
        } catch (error: any) {
            console.error('Error saving post:', error);
            alert(`Error saving post: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-[#050505] rounded-xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Post Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent text-xl font-cinzel font-bold text-white placeholder-gray-600 focus:outline-none w-full md:w-[400px]"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-transparent text-purple-600 focus:ring-purple-500"
                        />
                        Publish
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Editor */}
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
                    <MenuBar editor={editor} />

                    {editor && (
                        <BubbleMenu
                            editor={editor}
                            tippyOptions={{ duration: 100 }}
                            shouldShow={({ editor }) => editor.isActive('image')}
                            className="bg-black/90 border border-white/20 rounded-lg shadow-xl p-3 flex items-center gap-4 backdrop-blur-md z-50 text-white"
                        >
                            <span className="text-xs font-medium text-gray-400 whitespace-nowrap">Image Width</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">25%</span>
                                <input
                                    type="range"
                                    min="25"
                                    max="100"
                                    defaultValue="100"
                                    onChange={(e) => {
                                        editor.chain().focus().updateAttributes('image', {
                                            width: `${e.target.value}%`
                                        }).run();
                                    }}
                                    className="w-32 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                                <span className="text-xs text-gray-500">100%</span>
                            </div>
                            <div className="w-px h-6 bg-white/20 mx-2 self-center" />

                            <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => editor.chain().focus().updateAttributes('image', { layout: 'left' }).run()}
                                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('image', { layout: 'left' }) ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                                    title="Align Left"
                                >
                                    <AlignLeft size={16} />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().updateAttributes('image', { layout: 'center' }).run()}
                                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('image', { layout: 'center' }) ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                                    title="Align Center"
                                >
                                    <AlignCenter size={16} />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().updateAttributes('image', { layout: 'right' }).run()}
                                    className={`p-1.5 rounded hover:bg-white/10 transition-colors ${editor.isActive('image', { layout: 'right' }) ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                                    title="Align Right"
                                >
                                    <AlignRight size={16} />
                                </button>
                            </div>
                        </BubbleMenu>
                    )}

                    <EditorContent editor={editor} className="flex-1" />
                </div>

                {/* Sidebar Settings */}
                <div className="w-80 border-l border-white/10 p-6 bg-black/20 overflow-y-auto hidden lg:block">
                    <h3 className="text-sm font-urbanist font-bold text-gray-400 uppercase tracking-widest mb-6">Post Settings</h3>

                    <div className="space-y-6">
                        {/* Cover Image */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Cover Image</label>
                            <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center hover:border-purple-500/30 transition-colors relative group">
                                {coverImage ? (
                                    <div className="relative aspect-video rounded-md overflow-hidden mb-2">
                                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setCoverImage('')}
                                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors"
                                        >
                                            <Upload size={14} className="rotate-45" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Click to upload cover</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploadingImage}
                                />
                                {uploadingImage && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">URL Slug</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="my-post-slug"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600"
                            />
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Excerpt</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                rows={4}
                                placeholder="Short summary for cards..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none placeholder-gray-600 resize-none"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none"
                            >
                                <option value="Astrology">Astrology</option>
                                <option value="Womb Health">Womb Health</option>
                                <option value="Holistic Healing">Holistic Healing</option>
                                <option value="Spirituality">Spirituality</option>
                            </select>
                        </div>

                        {/* Author */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Author</label>
                            <select
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none"
                            >
                                <option value="Y'Marii Shango Bunmi Balewa">Y'Marii Shango Bunmi Balewa</option>
                                <option value="Ogun Keyede Balewa">Ogun Keyede Balewa</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default BlogEditor;
