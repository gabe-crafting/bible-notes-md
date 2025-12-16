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
import { toast } from "sonner";

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
    if (!currentFilePath) return;
    try {
      await navigator.clipboard.writeText(currentFilePath);
      toast.success("File path copied", {
        description: "Path copied to clipboard",
      });
    } catch (e) {
      console.error("Failed to copy path", e);
      toast.error("Failed to copy path");
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
        <div className="space-y-3">
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
          </div>

          {currentFilePath && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <div
                className="font-mono px-2 py-0.5 bg-muted rounded-md truncate flex-1"
                title={currentFilePath}
              >
                {currentFilePath}
              </div>
              <button
                type="button"
                aria-label="Copy file path"
                className="inline-flex h-3 w-3 items-center justify-center text-muted-foreground hover:text-foreground"
                onClick={handleCopyPath}
              >
                <Copy className="h-2 w-2" />
              </button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
