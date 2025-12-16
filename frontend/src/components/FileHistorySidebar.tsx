import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Accordion } from "@/components/ui/accordion";
import { FileHistoryItem } from "@/hooks/useFileHistory";
import { HistoryAccordion } from "@/components/HistoryAccordion";
import { VersesAccordion } from "@/components/VersesAccordion";

interface FileHistorySidebarProps {
  fileHistory: FileHistoryItem[];
  currentFileIndex: number;
  onFileSelect: (index: number) => void;
  onFileRemove: (index: number) => void;
  content: string;
  selectedVerseReference: string | null;
  currentFilePath: string | null;
}

export function FileHistorySidebar({
  fileHistory,
  currentFileIndex,
  onFileSelect,
  onFileRemove,
  content,
  selectedVerseReference,
  currentFilePath,
}: FileHistorySidebarProps) {
  const [accordionValue, setAccordionValue] = React.useState<string[]>(["history"]);

  React.useEffect(() => {
    if (selectedVerseReference) {
      setAccordionValue(["history", "verses"]);
    }
  }, [selectedVerseReference]);

  return (
    <Sidebar collapsible="offcanvas" side="left">
      <SidebarHeader>
        <SidebarGroupLabel>Features</SidebarGroupLabel>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Accordion 
              type="multiple" 
              value={accordionValue}
              onValueChange={setAccordionValue}
              className="w-full"
            >
              <HistoryAccordion
                fileHistory={fileHistory}
                currentFileIndex={currentFileIndex}
                onFileSelect={onFileSelect}
                onFileRemove={onFileRemove}
                currentFilePath={currentFilePath}
              />
              <VersesAccordion content={content} selectedVerseReference={selectedVerseReference} />
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
