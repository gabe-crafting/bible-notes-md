import {useCallback, useEffect, useState} from 'react';
import {OpenFile, SaveFile, SaveFileAs} from "../../wailsjs/go/main/App";
import {EventsOn} from "../../wailsjs/runtime/runtime";
import { toast } from "sonner";

export function useFileOperations(
    content: string,
    setContent: (content: string | ((prev: string) => string)) => void,
    onFileOpened?: (filePath: string) => void
) {
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

    const handleOpen = useCallback(async () => {
        try {
            const result = await OpenFile();
            if (result.filePath && result.content !== undefined) {
                setCurrentFilePath(result.filePath);
                setContent(result.content);
                onFileOpened?.(result.filePath);
                toast.success("File opened", {
                    description: result.filePath,
                });
            }
        } catch (error) {
            console.error('Error opening file:', error);
            toast.error('Failed to open file', {
                description: String(error),
            });
        }
    }, [setContent, onFileOpened]);

    const handleSaveAs = useCallback(async () => {
        try {
            const filePath = await SaveFileAs(content);
            if (filePath) {
                setCurrentFilePath(filePath);
                onFileOpened?.(filePath);
                toast.success('File saved', {
                    description: filePath,
                });
            }
        } catch (error) {
            console.error('Error saving file:', error);
            toast.error('Failed to save file', {
                description: String(error),
            });
        }
    }, [content, onFileOpened]);

    const handleSave = useCallback(async () => {
        if (!currentFilePath) {
            return await handleSaveAs();
        }
        try {
            await SaveFile(currentFilePath, content);
            toast.success('File saved', {
                description: currentFilePath,
            });
        } catch (error) {
            console.error('Error saving file:', error);
            toast.error('Failed to save file', {
                description: String(error),
            });
        }
    }, [currentFilePath, content, handleSaveAs]);

    const handleNew = useCallback(() => {
        setCurrentFilePath(null);
        setContent('');
        toast.success('New file created');
    }, [setContent]);

    useEffect(() => {
        const offOpen = EventsOn("menu:file:open", handleOpen);
        const offSave = EventsOn("menu:file:save", handleSave);
        const offSaveAs = EventsOn("menu:file:saveas", handleSaveAs);
        const offNew = EventsOn("menu:file:new", handleNew);

        return () => {
            offOpen();
            offSave();
            offSaveAs();
            offNew();
        };
    }, [handleOpen, handleSave, handleSaveAs, handleNew]);

    return {
        currentFilePath,
        setCurrentFilePath,
        handleOpen,
        handleSave,
        handleSaveAs,
    };
}
