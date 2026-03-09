import { useState } from 'react';
import { useGetDefectsForRoom } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Plus } from 'lucide-react';
import AddDefectDialog from './AddDefectDialog';

interface DefectsListProps {
  roomId: string;
}

export default function DefectsList({ roomId }: DefectsListProps) {
  const { data: defects } = useGetDefectsForRoom(roomId);
  const [isAddDefectDialogOpen, setIsAddDefectDialogOpen] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'minor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!defects || defects.length === 0) {
    return (
      <div>
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">No defects recorded</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddDefectDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-3 w-3" />
            Add Defect
          </Button>
        </div>
        <AddDefectDialog
          roomId={roomId}
          open={isAddDefectDialogOpen}
          onOpenChange={setIsAddDefectDialogOpen}
        />
      </div>
    );
  }

  return (
    <div>
      <Separator className="my-4" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Defects</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddDefectDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
        {defects.map((defect) => (
          <div key={defect.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-medium">{defect.description}</p>
                </div>
              </div>
              <Badge variant={getSeverityColor(defect.severity)} className="text-xs">
                {defect.severity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <AddDefectDialog
        roomId={roomId}
        open={isAddDefectDialogOpen}
        onOpenChange={setIsAddDefectDialogOpen}
      />
    </div>
  );
}
