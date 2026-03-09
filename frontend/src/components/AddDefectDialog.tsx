import { useState } from 'react';
import { useAddDefect } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import VoiceInput from './VoiceInput';
import AIRefinementModal from './AIRefinementModal';

interface AddDefectDialogProps {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddDefectDialog({ roomId, open, onOpenChange }: AddDefectDialogProps) {
  const addDefect = useAddDefect();
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');
  const [recommendations, setRecommendations] = useState('');
  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [refinementTarget, setRefinementTarget] = useState<'description' | 'recommendations'>('description');

  const handleVoiceTranscript = (transcript: string, target: 'description' | 'recommendations') => {
    if (target === 'description') {
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    } else {
      setRecommendations((prev) => (prev ? `${prev} ${transcript}` : transcript));
    }
    toast.success('Voice input added');
  };

  const handleRefine = (target: 'description' | 'recommendations') => {
    const text = target === 'description' ? description : recommendations;
    if (!text.trim()) {
      toast.error('Please enter some text first');
      return;
    }
    setRefinementTarget(target);
    setShowRefinementModal(true);
  };

  const handleAcceptRefinement = (refinedText: string) => {
    if (refinementTarget === 'description') {
      setDescription(refinedText);
    } else {
      setRecommendations(refinedText);
    }
    toast.success('Text refined successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a defect description');
      return;
    }

    try {
      await addDefect.mutateAsync({
        roomId,
        defect: {
          id: `defect-${Date.now()}`,
          description: description.trim(),
          severity,
          imageId: '',
          recommendations: recommendations.trim() ? [recommendations.trim()] : [],
        },
      });

      toast.success('Defect added successfully!');
      onOpenChange(false);
      setDescription('');
      setSeverity('minor');
      setRecommendations('');
    } catch (error) {
      toast.error('Failed to add defect');
      console.error(error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Defect</DialogTitle>
            <DialogDescription>
              Record a defect found during the inspection
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="description"
                    placeholder="e.g., Water damage on ceiling"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="h-12 text-base"
                  />
                  <VoiceInput
                    onTranscript={(text) => handleVoiceTranscript(text, 'description')}
                    disabled={addDefect.isPending}
                  />
                  {description.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRefine('description')}
                      disabled={addDefect.isPending}
                      className="h-12 w-12 shrink-0"
                      title="Refine with AI"
                    >
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="severity" className="text-base font-semibold">
                  Severity
                </Label>
                <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor" className="text-base py-3">Minor</SelectItem>
                    <SelectItem value="moderate" className="text-base py-3">Moderate</SelectItem>
                    <SelectItem value="major" className="text-base py-3">Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="recommendations" className="text-base font-semibold">
                  Recommendations (Optional)
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      id="recommendations"
                      placeholder="Suggested actions to address this defect..."
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      rows={4}
                      className="text-base resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <VoiceInput
                      onTranscript={(text) => handleVoiceTranscript(text, 'recommendations')}
                      disabled={addDefect.isPending}
                    />
                    {recommendations.trim() && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRefine('recommendations')}
                        disabled={addDefect.isPending}
                        className="h-12 w-12 shrink-0"
                        title="Refine with AI"
                      >
                        <Sparkles className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={addDefect.isPending}
                className="h-12 min-w-[120px] text-base"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addDefect.isPending}
                className="h-12 min-w-[120px] text-base"
              >
                {addDefect.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Defect'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AIRefinementModal
        open={showRefinementModal}
        onOpenChange={setShowRefinementModal}
        originalText={refinementTarget === 'description' ? description : recommendations}
        onAccept={handleAcceptRefinement}
      />
    </>
  );
}
