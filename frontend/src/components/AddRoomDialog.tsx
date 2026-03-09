import { useState } from 'react';
import { useAddRoomToInspection } from '../hooks/useQueries';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddRoomDialogProps {
  inspectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddRoomDialog({ inspectionId, open, onOpenChange }: AddRoomDialogProps) {
  const addRoom = useAddRoomToInspection();
  const [roomName, setRoomName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    try {
      await addRoom.mutateAsync({
        inspectionId,
        roomId: `${inspectionId}-${Date.now()}`,
        roomName: roomName.trim(),
      });

      toast.success('Room added successfully!');
      onOpenChange(false);
      setRoomName('');
    } catch (error) {
      toast.error('Failed to add room');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
          <DialogDescription>
            Add a new room to this inspection
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="e.g., Living Room, Kitchen, Master Bedroom"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addRoom.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addRoom.isPending}>
              {addRoom.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Room'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
