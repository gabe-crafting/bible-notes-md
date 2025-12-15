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

interface BibleVerseProps {
    editor: TipTapEditor | null;
}

// Old Testament books (39 books)
const OLD_TESTAMENT = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Songs", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi"
];

// New Testament books (27 books)
const NEW_TESTAMENT = [
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
    "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation"
];

// Standard chapter counts for each book
const BOOK_CHAPTER_COUNTS: Record<string, number> = {
    "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
    "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, "Ezra": 10,
    "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
    "Ecclesiastes": 12, "Song of Songs": 8, "Isaiah": 66, "Jeremiah": 52, "Lamentations": 5,
    "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3, "Amos": 9,
    "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3,
    "Zephaniah": 3, "Haggai": 2, "Zechariah": 14, "Malachi": 4,
    "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28,
    "Romans": 16, "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
    "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3, "1 Timothy": 6,
    "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13, "James": 5,
    "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
    "Jude": 1, "Revelation": 22
};

interface Verse {
    verse: number;
    text: string;
}

// Map book names to book numbers (1-66)
const BOOK_TO_NUMBER: Record<string, number> = {
    "Genesis": 1, "Exodus": 2, "Leviticus": 3, "Numbers": 4, "Deuteronomy": 5,
    "Joshua": 6, "Judges": 7, "Ruth": 8, "1 Samuel": 9, "2 Samuel": 10,
    "1 Kings": 11, "2 Kings": 12, "1 Chronicles": 13, "2 Chronicles": 14, "Ezra": 15,
    "Nehemiah": 16, "Esther": 17, "Job": 18, "Psalms": 19, "Proverbs": 20,
    "Ecclesiastes": 21, "Song of Songs": 22, "Isaiah": 23, "Jeremiah": 24, "Lamentations": 25,
    "Ezekiel": 26, "Daniel": 27, "Hosea": 28, "Joel": 29, "Amos": 30,
    "Obadiah": 31, "Jonah": 32, "Micah": 33, "Nahum": 34, "Habakkuk": 35,
    "Zephaniah": 36, "Haggai": 37, "Zechariah": 38, "Malachi": 39,
    "Matthew": 40, "Mark": 41, "Luke": 42, "John": 43, "Acts": 44,
    "Romans": 45, "1 Corinthians": 46, "2 Corinthians": 47, "Galatians": 48, "Ephesians": 49,
    "Philippians": 50, "Colossians": 51, "1 Thessalonians": 52, "2 Thessalonians": 53, "1 Timothy": 54,
    "2 Timothy": 55, "Titus": 56, "Philemon": 57, "Hebrews": 58, "James": 59,
    "1 Peter": 60, "2 Peter": 61, "1 John": 62, "2 John": 63, "3 John": 64,
    "Jude": 65, "Revelation": 66
};

export function BibleVerse({ editor }: BibleVerseProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<string>("");
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [chapters, setChapters] = useState<number[]>([]);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [loadingVerses, setLoadingVerses] = useState(false);
    const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

    // When a book is selected, generate chapter numbers
    useEffect(() => {
        if (selectedBook && BOOK_CHAPTER_COUNTS[selectedBook]) {
            const chapterCount = BOOK_CHAPTER_COUNTS[selectedBook];
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
    }, [selectedBook]);

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
            const bookNumber = BOOK_TO_NUMBER[book];
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
                                {OLD_TESTAMENT.map((book) => (
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
                                {NEW_TESTAMENT.map((book) => (
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

