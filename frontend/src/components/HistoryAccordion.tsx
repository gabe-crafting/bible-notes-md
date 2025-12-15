import { Search, History, Copy } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { FileHistoryItem } from "@/hooks/useFileHistory";
import { useFilteredHistory } from "@/hooks/useFilteredHistory";
import { HistoryList } from "@/components/HistoryList";

interface HistoryAccordionProps {
  fileHistory: FileHistoryItem[];
  currentFileIndex: number;
  onFileSelect: (index: number) => void;
  onFileRemove: (index: number) => void;
  currentFilePath: string | null;
}

export function HistoryAccordion({
  fileHistory,
  currentFileIndex,
  onFileSelect,
  onFileRemove,
  currentFilePath,
}: HistoryAccordionProps) {
  const { searchQuery, setSearchQuery, filteredHistory, getFileName } =
    useFilteredHistory(fileHistory);

  const handleCopyPath = async () => {
    if (currentFilePath) {
      try {
        await navigator.clipboard.writeText(currentFilePath);
      } catch (error) {
        console.error('Failed to copy path:', error);
      }
    }
  };

  return (
    <AccordionItem value="history">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>History</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <HistoryList
            filteredHistory={filteredHistory}
            fileHistory={fileHistory}
            currentFileIndex={currentFileIndex}
            getFileName={getFileName}
            onFileSelect={onFileSelect}
            onFileRemove={onFileRemove}
          />
          {currentFilePath && (
            <div className="flex items-center gap-1 px-2 py-1">
              <div className="text-[10px] text-muted-foreground font-mono truncate flex-1 min-w-0">
                {currentFilePath}
              </div>
              <button
                onClick={handleCopyPath}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title="Copy path"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
