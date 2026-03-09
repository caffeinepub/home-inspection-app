import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, AlertCircle, Plus, Sparkles } from 'lucide-react';
import type { Room } from '../backend';
import PhotoUploadDialog from './PhotoUploadDialog';
import DefectsList from './DefectsList';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RoomCardProps {
  room: Room;
  inspectionId: string;
  photoLimitReached: boolean;
}

export default function RoomCard({ room, inspectionId, photoLimitReached }: RoomCardProps) {
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  const defectCount = room.defects.length;
  const photoCount = room.photos.length;
  const photosWithAI = room.photos.filter(p => p.aiAnalysisResults && p.aiAnalysisResults.length > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{room.name}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Camera className="h-3 w-3" />
                {photoCount} photo{photoCount !== 1 ? 's' : ''}
              </Badge>
              {photosWithAI > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        {photosWithAI} analyzed
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Photos with AI analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {defectCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {defectCount} defect{defectCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsPhotoDialogOpen(true)}
            disabled={photoLimitReached}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Photo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {photoCount === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {room.photos.slice(0, 4).map((photo) => {
              const imageUrl = photo.externalBlob.getDirectURL();
              const hasAIAnalysis = photo.aiAnalysisResults && photo.aiAnalysisResults.length > 0;
              return (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={imageUrl}
                    alt="Room photo"
                    className="h-full w-full object-cover"
                  />
                  {hasAIAnalysis && (
                    <div className="absolute top-2 right-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-full bg-primary/90 p-1.5">
                              <Sparkles className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI analyzed: {photo.aiAnalysisResults.length} finding{photo.aiAnalysisResults.length !== 1 ? 's' : ''}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  {photo.aiCaption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white line-clamp-2">{photo.aiCaption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DefectsList roomId={room.id} />
      </CardContent>

      <PhotoUploadDialog
        roomId={room.id}
        inspectionId={inspectionId}
        open={isPhotoDialogOpen}
        onOpenChange={setIsPhotoDialogOpen}
      />
    </Card>
  );
}
