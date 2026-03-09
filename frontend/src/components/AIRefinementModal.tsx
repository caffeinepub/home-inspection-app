import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIRefinementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalText: string;
  onAccept: (refinedText: string) => void;
}

export default function AIRefinementModal({
  open,
  onOpenChange,
  originalText,
  onAccept,
}: AIRefinementModalProps) {
  const [refinedText, setRefinedText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Simulate AI refinement when modal opens
  useState(() => {
    if (open && originalText) {
      setIsRefining(true);
      // Simulate API call delay
      setTimeout(() => {
        const refined = simulateAIRefinement(originalText);
        setRefinedText(refined);
        setIsRefining(false);
      }, 1500);
    }
  });

  const handleAccept = () => {
    onAccept(refinedText);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Refined Observation
          </DialogTitle>
          <DialogDescription>
            Review the AI-refined professional inspection note
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Original Text:</h4>
            <ScrollArea className="h-24 rounded-md border bg-muted/50 p-4">
              <p className="text-sm">{originalText}</p>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Refined Text:</h4>
            {isRefining ? (
              <div className="flex h-32 items-center justify-center rounded-md border bg-muted/50">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Refining with AI...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-32 rounded-md border bg-background p-4">
                <p className="text-sm leading-relaxed">{refinedText}</p>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRefining}
            className="h-12 min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isRefining}
            className="h-12 min-w-[100px]"
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simulate AI refinement of text into professional inspection format
function simulateAIRefinement(text: string): string {
  // Extract key information from the text
  const lowerText = text.toLowerCase();
  
  // Detect component/location
  let component = 'Component';
  if (lowerText.includes('ceiling') || lowerText.includes('roof')) component = 'Ceiling';
  else if (lowerText.includes('wall')) component = 'Wall';
  else if (lowerText.includes('floor')) component = 'Floor';
  else if (lowerText.includes('window')) component = 'Window';
  else if (lowerText.includes('door')) component = 'Door';
  else if (lowerText.includes('electrical') || lowerText.includes('outlet') || lowerText.includes('wiring')) component = 'Electrical System';
  else if (lowerText.includes('plumbing') || lowerText.includes('pipe') || lowerText.includes('faucet')) component = 'Plumbing System';
  else if (lowerText.includes('hvac') || lowerText.includes('heating') || lowerText.includes('cooling')) component = 'HVAC System';
  
  // Detect defect type
  let defect = 'defect observed';
  if (lowerText.includes('crack')) defect = 'structural crack identified';
  else if (lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('moisture')) defect = 'water damage and moisture intrusion detected';
  else if (lowerText.includes('mold') || lowerText.includes('mildew')) defect = 'mold growth and biological contamination present';
  else if (lowerText.includes('damage')) defect = 'physical damage observed';
  else if (lowerText.includes('stain') || lowerText.includes('discolor')) defect = 'discoloration and staining evident';
  else if (lowerText.includes('loose') || lowerText.includes('unstable')) defect = 'structural instability noted';
  else if (lowerText.includes('exposed') || lowerText.includes('bare')) defect = 'exposed components creating safety hazard';
  
  // Generate professional recommendation
  let recommendation = 'Further evaluation by a qualified specialist is recommended.';
  if (lowerText.includes('water') || lowerText.includes('leak')) {
    recommendation = 'Immediate repair by licensed plumber required. Recommend moisture testing and mold inspection.';
  } else if (lowerText.includes('electrical')) {
    recommendation = 'Immediate evaluation by licensed electrician required for safety compliance.';
  } else if (lowerText.includes('crack') || lowerText.includes('structural')) {
    recommendation = 'Structural engineer evaluation recommended to assess load-bearing capacity and safety.';
  } else if (lowerText.includes('mold')) {
    recommendation = 'Professional mold remediation required. Air quality testing recommended.';
  }
  
  return `**Component:** ${component}\n\n**Defect:** ${component} exhibits ${defect}. This condition may compromise the structural integrity and/or functionality of the affected area.\n\n**Recommendation:** ${recommendation} Document all repairs and obtain appropriate permits as required by local building codes.`;
}
