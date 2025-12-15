import { useState, useEffect } from "react";
import { BookOpen, Pin } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Verse {
  verse: number;
  text: string;
}

interface PinnedVerse {
  reference: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  verses: Verse[];
}

interface VersesAccordionProps {
  content: string;
  selectedVerseReference: string | null;
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

// All Bible books for matching
const ALL_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Songs", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
  "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation"
];

const cleanVerseText = (text: string): string => {
  if (!text) return '';
  
  let cleaned = text
    .replace(/<S>(\d+)<\/S>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
};

export function VersesAccordion({ content, selectedVerseReference }: VersesAccordionProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [parsedReference, setParsedReference] = useState<ReturnType<typeof parseReference>>(null);
  const [pinnedVerses, setPinnedVerses] = useState<PinnedVerse[]>([]);

  // Fetch verses when selectedVerseReference changes
  useEffect(() => {
    if (selectedVerseReference) {
      console.log('VersesAccordion: selectedVerseReference changed to:', selectedVerseReference); // Debug
      const parsed = parseReference(selectedVerseReference);
      console.log('Parsed reference:', parsed); // Debug
      setParsedReference(parsed);
      if (parsed) {
        fetchVerses(parsed);
      } else {
        setVerses([]);
        setLoadingVerses(false);
      }
    } else {
      setParsedReference(null);
      setVerses([]);
    }
  }, [selectedVerseReference]);

  const parseReference = (reference: string) => {
    const sortedBooks = [...ALL_BOOKS].sort((a, b) => b.length - a.length);
    
    for (const book of sortedBooks) {
      if (reference.startsWith(book)) {
        const rest = reference.substring(book.length).trim();
        const versePattern = /^(\d+):(\d+)(?:-(\d+))?$/;
        const verseMatch = rest.match(versePattern);
        
        if (verseMatch) {
          return {
            book,
            chapter: parseInt(verseMatch[1], 10),
            verseStart: parseInt(verseMatch[2], 10),
            verseEnd: verseMatch[3] ? parseInt(verseMatch[3], 10) : undefined,
          };
        }
      }
    }
    return null;
  };


  const fetchVerses = async (reference: NonNullable<ReturnType<typeof parseReference>>) => {
    setLoadingVerses(true);
    setVerses([]);

    try {
      const bookNumber = BOOK_TO_NUMBER[reference.book];
      if (!bookNumber) {
        throw new Error('Book not found');
      }

      const response = await fetch(`https://bolls.life/get-text/KJV/${bookNumber}/${reference.chapter}/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch verses');
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        let parsedVerses: Verse[] = data.map((item: any) => ({
          verse: item.verse || item.number || 0,
          text: cleanVerseText(item.text || item.content || '')
        })).filter((v: Verse) => v.text);
        
        // Filter to selected verse range
        if (reference.verseEnd) {
          parsedVerses = parsedVerses.filter(v => 
            v.verse >= reference.verseStart && v.verse <= reference.verseEnd!
          );
        } else {
          parsedVerses = parsedVerses.filter(v => v.verse === reference.verseStart);
        }
        
        setVerses(parsedVerses);
      }
    } catch (error) {
      console.error('Error fetching verses:', error);
      setVerses([]);
    } finally {
      setLoadingVerses(false);
    }
  };

  const handlePin = () => {
    if (!parsedReference || !selectedVerseReference || verses.length === 0) return;

    // Check if already pinned
    const isPinned = pinnedVerses.some(p => p.reference === selectedVerseReference);
    
    if (isPinned) {
      // Unpin
      setPinnedVerses(prev => prev.filter(p => p.reference !== selectedVerseReference));
    } else {
      // Pin
      const pinnedVerse: PinnedVerse = {
        reference: selectedVerseReference,
        book: parsedReference.book,
        chapter: parsedReference.chapter,
        verseStart: parsedReference.verseStart,
        verseEnd: parsedReference.verseEnd,
        verses: [...verses]
      };
      setPinnedVerses(prev => [...prev, pinnedVerse]);
    }
  };

  const isPinned = parsedReference && selectedVerseReference 
    ? pinnedVerses.some(p => p.reference === selectedVerseReference)
    : false;


  return (
    <AccordionItem value="verses">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Verses</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          {selectedVerseReference && parsedReference ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  {parsedReference.book} {parsedReference.chapter}
                  {parsedReference.verseEnd 
                    ? `:${parsedReference.verseStart}-${parsedReference.verseEnd}`
                    : `:${parsedReference.verseStart}`
                  }
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handlePin}
                >
                  <Pin className={cn(
                    "h-3 w-3",
                    isPinned && "fill-current"
                  )} />
                </Button>
              </div>
              {loadingVerses ? (
                <div className="text-xs text-muted-foreground py-2">Loading verses...</div>
              ) : verses.length > 0 ? (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {verses.map((verse) => (
                    <div 
                      key={verse.verse} 
                      className="text-xs leading-relaxed border-l-2 border-muted pl-2 py-1"
                    >
                      <span className="font-semibold text-muted-foreground mr-2">
                        {verse.verse}
                      </span>
                      <span className="text-foreground">
                        {verse.text}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2">No verses found</div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              Click on a verse reference like [2 Peter 3:4-5] in the editor to view verses here.
            </div>
          )}

          {/* Pinned Verses Section */}
          {pinnedVerses.length > 0 && (
            <div className="border-t pt-3 mt-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground">
                Pinned Verses
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {pinnedVerses.map((pinned, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {pinned.book} {pinned.chapter}
                        {pinned.verseEnd 
                          ? `:${pinned.verseStart}-${pinned.verseEnd}`
                          : `:${pinned.verseStart}`
                        }
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setPinnedVerses(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Pin className="h-3 w-3 fill-current" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {pinned.verses.map((verse) => (
                        <div 
                          key={verse.verse} 
                          className="text-xs leading-relaxed border-l-2 border-muted pl-2 py-1"
                        >
                          <span className="font-semibold text-muted-foreground mr-2">
                            {verse.verse}
                          </span>
                          <span className="text-foreground">
                            {verse.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

