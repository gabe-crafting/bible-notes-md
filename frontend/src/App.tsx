import {useRef, useState} from 'react';
import {useFileOperations} from "@/hooks/useFileOperations";
import {ReadFile} from "../wailsjs/go/main/App";
import {useEditOperations} from "@/hooks/useEditOperations";
import {useTheme} from "@/hooks/useTheme";
import {useFileHistory} from "@/hooks/useFileHistory";
import {Editor} from "@/components/Editor";
import {Editor as TipTapEditor} from '@tiptap/react';
import {LinkDialog} from "@/components/LinkDialog";
import {SidebarProvider, SidebarTrigger, SidebarInset} from "@/components/ui/sidebar";
import {FileHistorySidebar} from "@/components/FileHistorySidebar";
import {FormattingMenu} from "@/components/FormattingMenu";
import {BibleVerse} from "@/components/BibleVerse";

function App() {
    useTheme(); // Initialize theme system
    const [content, setContent] = useState('');
    const [, setUpdateKey] = useState(0);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [selectedVerseReference, setSelectedVerseReference] = useState<string | null>(null);
    const editorRef = useRef<TipTapEditor | null>(null);

    const {
        fileHistory,
        currentFileIndex,
        addToHistory,
        switchToFile,
        removeFromHistory,
    } = useFileHistory();

    const {
        currentFilePath,
        setCurrentFilePath,
    } = useFileOperations(
        content,
        setContent,
        (filePath) => {
            addToHistory(filePath);
        }
    );

    const handleEditorReady = (editor: TipTapEditor) => {
        editorRef.current = editor;
        // Force re-render on selection/update changes to update button states
        editor.on('selectionUpdate', () => {
            setUpdateKey(prev => prev + 1);
        });
        editor.on('update', () => {
            setUpdateKey(prev => prev + 1);
        });
    };

    useEditOperations(editorRef);

    const applyFormatting = (format: 'p' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'bulletList' | 'orderedList') => {
        const editor = editorRef.current;
        if (!editor) return;

        switch (format) {
            case 'p':
                editor.chain().focus().setParagraph().run();
                break;
            case 'h1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
            case 'h3':
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                break;
            case 'bold':
                editor.chain().focus().toggleBold().run();
                break;
            case 'italic':
                editor.chain().focus().toggleItalic().run();
                break;
            case 'bulletList':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'orderedList':
                editor.chain().focus().toggleOrderedList().run();
                break;
        }
    };

    const isActive = (format: 'p' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'link' | 'bulletList' | 'orderedList') => {
        const editor = editorRef.current;
        if (!editor) return false;

        switch (format) {
            case 'p':
                return editor.isActive('paragraph');
            case 'h1':
                return editor.isActive('heading', { level: 1 });
            case 'h2':
                return editor.isActive('heading', { level: 2 });
            case 'h3':
                return editor.isActive('heading', { level: 3 });
            case 'bold':
                return editor.isActive('bold');
            case 'italic':
                return editor.isActive('italic');
            case 'link':
                return editor.isActive('link');
            case 'bulletList':
                return editor.isActive('bulletList');
            case 'orderedList':
                return editor.isActive('orderedList');
            default:
                return false;
        }
    };

    const handleLinkClick = () => {
        const editor = editorRef.current;
        if (!editor) return;

        if (editor.isActive('link')) {
            // If link is active, remove it
            editor.chain().focus().unsetLink().run();
        } else {
            // Open dialog to add/edit link
            setLinkDialogOpen(true);
        }
    };

    const handleFileSelect = async (index: number) => {
        // Get the file item from current history state
        if (index >= 0 && index < fileHistory.length) {
            const fileItem = fileHistory[index];
            // Update index first
            switchToFile(index);
            
            try {
                // Load content from disk
                const fileContent = await ReadFile(fileItem.filePath);
                // Update both content and file path together
                setCurrentFilePath(fileItem.filePath);
                setContent(fileContent);
            } catch (error) {
                console.error('Error loading file:', error);
                alert('Failed to load file: ' + fileItem.filePath + '\n' + error);
                // Remove from history if file doesn't exist
                removeFromHistory(index);
            }
        }
    };

    const handleFileRemove = (index: number) => {
        removeFromHistory(index);
        // If removing current file, switch to previous or clear
        if (index === currentFileIndex) {
            const newIndex = index > 0 ? index - 1 : (fileHistory.length > 1 ? 0 : -1);
            if (newIndex >= 0) {
                handleFileSelect(newIndex);
            } else {
                setContent('');
                setCurrentFilePath(null);
            }
        }
    };

    useTheme();
    
    return (
        <SidebarProvider defaultOpen={false}>
            <FileHistorySidebar
                fileHistory={fileHistory}
                currentFileIndex={currentFileIndex}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                content={content}
                selectedVerseReference={selectedVerseReference}
                currentFilePath={currentFilePath}
            />
            <SidebarInset>
                <div className="h-screen flex flex-col bg-background">
                    <div className="flex items-center gap-3 p-3 border-b border-border bg-card text-card-foreground">
                        <SidebarTrigger />
                        <FormattingMenu
                            onApplyFormatting={applyFormatting}
                            isActive={isActive}
                            onLinkClick={handleLinkClick}
                        />
                        <BibleVerse editor={editorRef.current} />
                        <LinkDialog
                    open={linkDialogOpen}
                    onOpenChange={setLinkDialogOpen}
                    editor={editorRef.current}
                />
                    </div>
                    <Editor
                        key={currentFilePath || 'new-file'}
                        content={content}
                        onChange={setContent}
                        onEditorReady={handleEditorReady}
                        onVerseClick={setSelectedVerseReference}
                        placeholder="Start typing your MDX content here..."
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default App
