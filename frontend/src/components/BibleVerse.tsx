import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Editor as TipTapEditor } from '@tiptap/react';
import { cn } from "@/lib/utils";
import { useBibleMetadata } from "@/hooks/useBibleMetadata";

interface BibleVerseProps {
    editor: TipTapEditor | null;
}

interface Verse {
    verse: number;
    text: string;
}

export function BibleVerse({ editor }: BibleVerseProps) {
    const { oldTestament, newTestament, bookChapterCounts, bookToNumber } = useBibleMetadata();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<string>("");
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [chapters, setChapters] = useState<number[]>([]);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [loadingVerses, setLoadingVerses] = useState(false);
    const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

    // When a book is selected, generate chapter numbers
    useEffect(() => {
        if (selectedBook && bookChapterCounts[selectedBook]) {
            const chapterCount = bookChapterCounts[selectedBook];
            setChapters(Array.from({ length: chapterCount }, (_, i) => i + 1));
            setSelectedChapter(null); // Reset chapter selection when book changes
            setVerses([]); // Clear verses when book changes
            setSelectedVerses([]); // Clear selected verses
        } else {
            setChapters([]);
            setSelectedChapter(null);
            setVerses([]);
            setSelectedVerses([]);
        }
    }, [selectedBook, bookChapterCounts]);

    // Fetch verses when chapter is selected
    useEffect(() => {
        if (selectedBook && selectedChapter) {
            fetchVerses(selectedBook, selectedChapter);
            setSelectedVerses([]); // Clear selected verses when chapter changes
        } else {
            setVerses([]);
            setSelectedVerses([]);
        }
    }, [selectedBook, selectedChapter]);

    const cleanVerseText = (text: string): string => {
        if (!text) return '';
        
        // Handle Strong's numbers - convert <S>1234</S> to superscript or remove
        // For now, we'll extract the number and show it as a superscript
        // Replace <S>number</S> with just the number as superscript, or remove entirely
        let cleaned = text
            .replace(/<S>(\d+)<\/S>/gi, '') // Remove Strong's numbers entirely (or use '$1' to keep as plain number)
            .replace(/<[^>]*>/g, '') // Remove any remaining HTML/XML tags
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim(); // Remove leading/trailing whitespace
        
        return cleaned;
    };

    const fetchVerses = async (book: string, chapter: number) => {
        setLoadingVerses(true);
        setVerses([]);

        try {
            const bookNumber = bookToNumber[book];
            if (!bookNumber) {
                throw new Error('Book not found');
            }

            // Try Bolls Life API (KJV)
            const response = await fetch(`https://bolls.life/get-text/KJV/${bookNumber}/${chapter}/`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch verses');
            }

            const data = await response.json();
            
            // Parse the response - Bolls Life API returns an array of verses
            if (Array.isArray(data)) {
                const parsedVerses: Verse[] = data.map((item: any) => ({
                    verse: item.verse || item.number || 0,
                    text: cleanVerseText(item.text || item.content || '')
                })).filter((v: Verse) => v.text); // Filter out empty verses
                setVerses(parsedVerses);
            } else if (data.verses) {
                // Alternative format
                const parsedVerses: Verse[] = data.verses.map((item: any) => ({
                    verse: item.verse || item.number || 0,
                    text: cleanVerseText(item.text || item.content || '')
                })).filter((v: Verse) => v.text);
                setVerses(parsedVerses);
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (error) {
            console.error('Error fetching verses:', error);
            setVerses([]);
        } finally {
            setLoadingVerses(false);
        }
    };

    const handleVerseClick = (verseNumber: number) => {
        setSelectedVerses(prev => {
            if (prev.length === 0) {
                // First selection
                return [verseNumber];
            } else if (prev.length === 1) {
                // Second selection - create range
                const start = prev[0];
                const end = verseNumber;
                if (end >= start) {
                    // Create range from start to end
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                } else {
                    // If clicked before start, make it the new start
                    return Array.from({ length: start - end + 1 }, (_, i) => end + i);
                }
            } else {
                // Reset and select new verse
                return [verseNumber];
            }
        });
    };

    const handleInsertText = () => {
        if (!editor || !selectedBook || !selectedChapter) return;
        
        // Build the reference string
        let reference = selectedBook;
        
        if (selectedVerses.length > 0) {
            if (selectedVerses.length === 1) {
                // Single verse: "1 John 4:5"
                reference = `${selectedBook} ${selectedChapter}:${selectedVerses[0]}`;
            } else {
                // Range: "1 John 4:5-8"
                const sorted = [...selectedVerses].sort((a, b) => a - b);
                const start = sorted[0];
                const end = sorted[sorted.length - 1];
                reference = `${selectedBook} ${selectedChapter}:${start}-${end}`;
            }
        } else {
            // No verses selected, just book and chapter
            reference = `${selectedBook} ${selectedChapter}`;
        }
        
        // Insert text at the cursor position
        editor
            .chain()
            .focus()
            .insertContent(` [${reference}] `)
            .run();
        
        // Reset and close
        setSelectedBook("");
        setSelectedChapter(null);
        setSelectedVerses([]);
        setDialogOpen(false);
    };

    return (
        <>
            <Button 
                onClick={() => setDialogOpen(true)}
                variant="ghost"
                size="icon"
            >
                <BookOpen className="h-4 w-4"/>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Select Bible Book</DialogTitle>
                        <DialogDescription>
                            Choose a book to add at the cursor position
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* Old Testament */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Old Testament</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {oldTestament.map((book) => (
                                    <Badge
                                        key={book}
                                        variant={selectedBook === book ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer py-0.5 px-2 text-xs transition-colors",
                                            selectedBook === book 
                                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                                : "hover:bg-accent"
                                        )}
                                        onClick={() => setSelectedBook(selectedBook === book ? "" : book)}
                                    >
                                        {book}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* New Testament */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">New Testament</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {newTestament.map((book) => (
                                    <Badge
                                        key={book}
                                        variant={selectedBook === book ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer py-0.5 px-2 text-xs transition-colors",
                                            selectedBook === book 
                                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                                : "hover:bg-accent"
                                        )}
                                        onClick={() => setSelectedBook(selectedBook === book ? "" : book)}
                                    >
                                        {book}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Verses Display Section */}
                    {selectedBook && selectedChapter && (
                        <div className="space-y-3 border-t pt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                {selectedBook} {selectedChapter}
                            </h3>
                            {loadingVerses ? (
                                <div className="text-sm text-muted-foreground">Loading verses...</div>
                            ) : verses.length > 0 ? (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {verses.map((verse) => {
                                        const isSelected = selectedVerses.includes(verse.verse);
                                        return (
                                            <div 
                                                key={verse.verse} 
                                                className={cn(
                                                    "text-sm leading-relaxed border-l-2 pl-3 py-1 cursor-pointer transition-colors rounded-r",
                                                    isSelected 
                                                        ? "bg-muted/50 border-primary" 
                                                        : "border-muted hover:bg-muted/30"
                                                )}
                                                onClick={() => handleVerseClick(verse.verse)}
                                            >
                                                <span className="font-semibold text-muted-foreground mr-2">
                                                    {verse.verse}
                                                </span>
                                                <span className="text-foreground">
                                                    {verse.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">No verses found</div>
                            )}
                        </div>
                    )}

                    {/* Chapters Section */}
                    {selectedBook && chapters.length > 0 && (
                        <div className="space-y-3 border-t pt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">
                                Chapters - {selectedBook}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {chapters.map((chapter) => (
                                    <Badge
                                        key={chapter}
                                        variant={selectedChapter === chapter ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer py-0.5 px-2 text-xs transition-colors",
                                            selectedChapter === chapter 
                                                ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                                : "hover:bg-accent"
                                        )}
                                        onClick={() => setSelectedChapter(selectedChapter === chapter ? null : chapter)}
                                    >
                                        {chapter}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDialogOpen(false);
                                setSelectedBook("");
                                setSelectedChapter(null);
                                setSelectedVerses([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInsertText}
                            disabled={!selectedBook || !selectedChapter}
                        >
                            Add Verse
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

