import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Loader2, Image as ImageIcon, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useUploadPhoto, generateSimulatedAICaption } from '../hooks/useQueries';
import type { AIAnalysisResult } from '../backend';

interface PhotoUploadDialogProps {
  roomId: string;
  inspectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhotoUploadDialog({
  roomId,
  inspectionId,
  open,
  onOpenChange,
}: PhotoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadPhoto = useUploadPhoto();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to allow dialog close animation
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setDescription('');
        setAiAnalysisResult(null);
        setAiCaption(null);
        setUploadProgress(0);
        setIsAnalyzing(false);
        setUploadComplete(false);
      }, 300);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setAiAnalysisResult(null);
      setAiCaption(null);
      setUploadComplete(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo');
      return;
    }

    setUploadProgress(0);
    setIsAnalyzing(false);
    setUploadComplete(false);

    try {
      const result = await uploadPhoto.mutateAsync({
        file: selectedFile,
        roomId,
        inspectionId,
        description: description || undefined,
        onProgress: (percentage) => {
          setUploadProgress(percentage);
          // Switch to analyzing state when upload completes
          if (percentage === 100 && !isAnalyzing) {
            setIsAnalyzing(true);
          }
        },
      });

      // Show AI analysis result and generate caption
      setAiAnalysisResult(result.aiAnalysisResult);
      setAiCaption(generateSimulatedAICaption());
      setIsAnalyzing(false);
      setUploadComplete(true);
      
      toast.success('Photo uploaded and analyzed successfully!', {
        description: 'The photo has been added to the room with AI analysis.',
        duration: 4000,
      });
      
      // Close dialog after showing results briefly
      setTimeout(() => {
        onOpenChange(false);
      }, 2500);
    } catch (error: any) {
      setIsAnalyzing(false);
      setUploadComplete(false);
      const errorMessage = error?.message || 'Failed to upload photo';
      toast.error('Upload Failed', {
        description: errorMessage,
        duration: 5000,
      });
      console.error('Photo upload error:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'major':
      case 'critical':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'minor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Photo</DialogTitle>
          <DialogDescription className="text-base">
            Add a photo to this room. AI will automatically analyze for defects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Photo</Label>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary min-h-[200px]"
              onClick={() => !uploadPhoto.isPending && fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative w-full">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-80 rounded-lg object-contain mx-auto"
                  />
                  {uploadComplete && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="mt-3 text-base font-medium text-muted-foreground">
                    Click to select a photo
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadPhoto.isPending}
            />
          </div>

          {uploadPhoto.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2 font-medium text-muted-foreground">
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                      Scanning with AI...
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  )}
                </span>
                <span className="font-bold text-lg">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-3" />
            </div>
          )}

          {uploadComplete && aiCaption && (
            <div className="space-y-2 rounded-lg border-2 border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-base">Upload Complete</h4>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-base">AI Generated Caption</h4>
              </div>
              <p className="text-base leading-relaxed">{aiCaption}</p>
            </div>
          )}

          {aiAnalysisResult && uploadComplete && (
            <div className="space-y-4 rounded-lg border-2 bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-base">AI Detected Defect</h4>
              </div>
              <div className="rounded-md border-2 bg-background p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-base">{aiAnalysisResult.defectType}</span>
                  </div>
                  <Badge variant={getSeverityColor(aiAnalysisResult.severityRating)} className="text-sm px-3 py-1">
                    {aiAnalysisResult.severityRating}
                  </Badge>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {aiAnalysisResult.description}
                </p>
                <div className="text-sm font-medium text-muted-foreground">
                  Confidence: {aiAnalysisResult.confidence}
                </div>
              </div>
            </div>
          )}

          {!uploadComplete && (
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add notes about this photo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-base resize-none"
                disabled={uploadPhoto.isPending}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadPhoto.isPending}
            className="h-12 min-w-[120px] text-base"
          >
            {uploadComplete ? 'Close' : 'Cancel'}
          </Button>
          {!uploadComplete && (
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploadPhoto.isPending}
              className="h-12 min-w-[120px] text-base"
            >
              {uploadPhoto.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isAnalyzing ? 'Analyzing...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Photo
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
