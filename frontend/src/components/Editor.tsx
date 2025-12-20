import { useEditor, EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { useEffect, useRef, useState } from 'react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: TipTapEditor) => void;
  onVerseClick?: (reference: string) => void;
  key?: string | number; // Add key prop to force remount when file changes
}

export type { TipTapEditor };

export function Editor({ content, onChange, placeholder = 'Start typing your MDX content here...', onEditorReady, onVerseClick }: EditorProps) {
  const contentRef = useRef(content);
  const isInternalUpdate = useRef(false);
  const editorRef = useRef<TipTapEditor | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown,
    ],
    content: content,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: `${isDark ? 'prose-invert' : 'prose'} prose-sm max-w-none focus:outline-none p-4 min-h-full text-sm leading-snug prose-headings:text-foreground prose-headings:leading-tight prose-headings:my-1 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-sm prose-p:leading-snug prose-p:my-1 prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-ul:text-foreground prose-ol:text-foreground prose-li:text-sm prose-li:leading-snug prose-li:my-0.5 prose-li:text-foreground`,
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        const linkElement = target.closest('a');
        
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            event.preventDefault();
            event.stopPropagation();
            BrowserOpenURL(href);
            return true; // Indicates we handled it
          }
        }

      },
      handleKeyDown: (view, event) => {
        const editor = editorRef.current;
        if (!editor) return false;

        // Handle Enter key to exit lists when current item is empty
        if (event.key === 'Enter' && !event.shiftKey) {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          
          // Check if we're in a list (bullet or ordered)
          if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
            // Find the list item node by searching up the node tree
            let listItemNode = null;
            
            for (let depth = $from.depth; depth > 0; depth--) {
              const node = $from.node(depth);
              if (node.type.name === 'listItem') {
                listItemNode = node;
                break;
              }
            }
            
            // Check if the current list item is empty (only whitespace or empty)
            if (listItemNode && listItemNode.textContent.trim() === '') {
              event.preventDefault();
              
              // Exit the list and create a new paragraph
              if (editor.isActive('bulletList')) {
                editor.chain().focus().toggleBulletList().setParagraph().run();
              } else if (editor.isActive('orderedList')) {
                editor.chain().focus().toggleOrderedList().setParagraph().run();
              }
              
              return true;
            }
          }
        }

        // Handle Tab for indenting lists
        if (event.key === 'Tab' && !event.shiftKey) {
          if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
            event.preventDefault();
            editor.chain().focus().sinkListItem('listItem').run();
            return true;
          }
        }
        // Handle Shift+Tab for outdenting lists
        if (event.key === 'Tab' && event.shiftKey) {
          if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
            event.preventDefault();
            editor.chain().focus().liftListItem('listItem').run();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const markdown = editor.getMarkdown();
      contentRef.current = markdown;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      if (onEditorReady) {
        onEditorReady(editor);
      }
    }
  }, [editor, onEditorReady]);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Update editor classes when theme changes
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom;
      if (editorElement) {
        const proseClass = isDark ? 'prose-invert' : 'prose';
        const currentClass = editorElement.getAttribute('class') || '';
        const newClass = currentClass.replace(/prose-invert|prose(?=\s|$)/g, proseClass);
        editorElement.setAttribute('class', newClass);
      }
    }
  }, [editor, isDark]);


  useEffect(() => {
    if (!editor || isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    // Only update if content has changed externally (like file load)
    if (content !== contentRef.current) {
      editor.commands.setContent(content, { contentType: 'markdown' });
      contentRef.current = content;
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }


  // Use event delegation to handle verse reference clicks and hover
  useEffect(() => {
    if (!editor || !onVerseClick) return;

    const editorDom = editor.view.dom;
    if (!editorDom) return;

    const handleClick = (e: MouseEvent) => {
      // Get the editor's text content and click position
      const { state } = editor.view;
      const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!coords) return;

      const pos = coords.pos;
      const docText = state.doc.textContent;
      
      // Find verse references - collect all matches first, then find the best one
      const versePattern = /\[([A-Za-z0-9\s]+)\s+(\d+):(\d+)(?:-(\d+))?\]/g;
      const matches: Array<{ start: number; end: number; text: string; center: number }> = [];
      let match;
      
      // Collect all verse references with their positions
      while ((match = versePattern.exec(docText)) !== null) {
        if (!match[0] || match.index === undefined) continue;
        
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const center = matchStart + (matchEnd - matchStart) / 2;
        
        matches.push({
          start: matchStart,
          end: matchEnd,
          text: match[0],
          center
        });
      }
      
      // Find the verse reference that contains the click position
      // If multiple contain it, prefer the one where the click is closest to center
      let clickedMatch: { start: number; end: number; text: string } | null = null;
      let bestMatch: { start: number; end: number; text: string; centerDistance: number } | null = null;
      
      for (const m of matches) {
        if (pos >= m.start && pos <= m.end) {
          const centerDistance = Math.abs(pos - m.center);
          if (!bestMatch || centerDistance < bestMatch.centerDistance) {
            bestMatch = {
              start: m.start,
              end: m.end,
              text: m.text,
              centerDistance
            };
          }
        }
      }
      
      // If we found a match that contains the click position, use it
      if (bestMatch) {
        clickedMatch = {
          start: bestMatch.start,
          end: bestMatch.end,
          text: bestMatch.text
        };
      }
      
      if (clickedMatch) {
        e.preventDefault();
        e.stopPropagation();
        const reference = clickedMatch.text.slice(1, -1);
        console.log('Verse reference clicked:', reference);
        onVerseClick(reference);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { view } = editor;
      if (!view) return;

      const coords = view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!coords) {
        (editorDom as HTMLElement).style.cursor = 'text';
        return;
      }

      const pos = coords.pos;
      const docText = view.state.doc.textContent;
      const versePattern = /\[([A-Za-z0-9\s]+)\s+(\d+):(\d+)(?:-(\d+))?\]/g;
      
      let match;
      while ((match = versePattern.exec(docText)) !== null) {
        if (!match[0] || match.index === undefined) continue;
        
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        if (pos >= matchStart && pos <= matchEnd) {
          (editorDom as HTMLElement).style.cursor = 'pointer';
          return;
        }
      }
      
      (editorDom as HTMLElement).style.cursor = 'text';
    };

    // Use capture phase to catch before TipTap handles it
    editorDom.addEventListener('click', handleClick, true);
    editorDom.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      editorDom.removeEventListener('click', handleClick, true);
      editorDom.removeEventListener('mousemove', handleMouseMove);
    };
  }, [editor, onVerseClick]);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <style>{`
        .ProseMirror ol li::marker {
          color: ${isDark ? 'white' : 'black'} !important;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}

