import {Button} from "@/components/ui/button";
import {Bold, Heading1, Heading2, Heading3, Italic, Type, Link as LinkIcon, List, ListOrdered} from "lucide-react";

interface FormattingMenuProps {
    onApplyFormatting: (format: 'p' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'bulletList' | 'orderedList') => void;
    isActive: (format: 'p' | 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'link' | 'bulletList' | 'orderedList') => boolean;
    onLinkClick: () => void;
}

export function FormattingMenu({ onApplyFormatting, isActive, onLinkClick }: FormattingMenuProps) {
    return (
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 p-1">
            <Button 
                onClick={() => onApplyFormatting('p')} 
                variant={isActive('p') ? "secondary" : "ghost"} 
                size="icon"
            >
                <Type className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('h1')} 
                variant={isActive('h1') ? "secondary" : "ghost"} 
                size="icon"
            >
                <Heading1 className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('h2')} 
                variant={isActive('h2') ? "secondary" : "ghost"} 
                size="icon"
            >
                <Heading2 className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('h3')} 
                variant={isActive('h3') ? "secondary" : "ghost"} 
                size="icon"
            >
                <Heading3 className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('bold')} 
                variant={isActive('bold') ? "secondary" : "ghost"} 
                size="icon"
            >
                <Bold className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('italic')} 
                variant={isActive('italic') ? "secondary" : "ghost"} 
                size="icon"
            >
                <Italic className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={onLinkClick} 
                variant={isActive('link') ? "secondary" : "ghost"} 
                size="icon"
            >
                <LinkIcon className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('bulletList')} 
                variant={isActive('bulletList') ? "secondary" : "ghost"} 
                size="icon"
            >
                <List className="h-4 w-4"/>
            </Button>
            <Button 
                onClick={() => onApplyFormatting('orderedList')} 
                variant={isActive('orderedList') ? "secondary" : "ghost"} 
                size="icon"
            >
                <ListOrdered className="h-4 w-4"/>
            </Button>
        </div>
    );
}

