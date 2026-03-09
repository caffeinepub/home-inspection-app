import { useState } from 'react';
import { useGetInspection } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Plus, FileText, AlertTriangle, Home } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AddRoomDialog from './AddRoomDialog';
import RoomCard from './RoomCard';
import InspectionSummary from './InspectionSummary';
import { InspectionStatus, SubscriptionTier } from '../backend';

interface InspectionDetailProps {
  inspectionId: string;
  onBack: () => void;
}

export default function InspectionDetail({ inspectionId, onBack }: InspectionDetailProps) {
  const { data: inspection, isLoading } = useGetInspection(inspectionId);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPropertyDetails = () => {
    if (!inspection?.propertyDetails) return null;
    
    const details = inspection.propertyDetails;
    const parts: string[] = [];
    
    if (details.bedrooms > 0) {
      parts.push(`${details.bedrooms} bed${details.bedrooms !== BigInt(1) ? 's' : ''}`);
    }
    if (details.bathrooms > 0) {
      const bathValue = Number(details.bathrooms) / 10;
      parts.push(`${bathValue} bath${bathValue !== 1 ? 's' : ''}`);
    }
    if (details.squareFootage > 0) {
      parts.push(`${Number(details.squareFootage).toLocaleString()} sq ft`);
    }
    if (details.yearBuilt > 0) {
      parts.push(`Built ${details.yearBuilt}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Inspection not found</p>
        <Button onClick={onBack} className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  const rooms = inspection.rooms || [];
  const isFreeUser = inspection.subscriptionTier === SubscriptionTier.free;
  const totalPhotos = rooms.reduce((sum, room) => sum + room.photos.length, 0);
  const photoLimitReached = isFreeUser && totalPhotos >= 2;
  const propertyDetailsText = formatPropertyDetails();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Inspections
        </Button>
        <Badge variant={inspection.subscriptionTier === SubscriptionTier.free ? 'secondary' : 'default'}>
          {inspection.subscriptionTier === SubscriptionTier.free ? 'Free Tier' : 'Premium'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{inspection.address.street}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {inspection.address.city}, {inspection.address.state} {inspection.address.zip}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Started: {formatDate(inspection.startTime)}
                </div>
                {propertyDetailsText && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    {propertyDetailsText}
                  </div>
                )}
              </CardDescription>
            </div>
            <Badge 
              variant={
                inspection.status === InspectionStatus.completed ? 'default' :
                inspection.status === InspectionStatus.inProgress ? 'secondary' :
                'outline'
              }
            >
              {inspection.status === InspectionStatus.draft && 'Draft'}
              {inspection.status === InspectionStatus.inProgress && 'In Progress'}
              {inspection.status === InspectionStatus.completed && 'Completed'}
              {inspection.status === InspectionStatus.reportGenerated && 'Report Generated'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {photoLimitReached && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium">Photo Limit Reached</p>
              <p className="text-sm text-muted-foreground">
                Free tier allows up to 2 photos. Upgrade to Premium for unlimited photos.
              </p>
            </div>
            <Button size="sm">Upgrade</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList>
          <TabsTrigger value="rooms">Rooms & Photos</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Rooms ({rooms.length})
            </h3>
            <Button onClick={() => setIsAddRoomDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>

          {rooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No rooms added yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Start by adding rooms to this inspection
                </p>
                <Button onClick={() => setIsAddRoomDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  inspectionId={inspectionId}
                  photoLimitReached={photoLimitReached}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <InspectionSummary inspectionId={inspectionId} />
        </TabsContent>
      </Tabs>

      <AddRoomDialog
        inspectionId={inspectionId}
        open={isAddRoomDialogOpen}
        onOpenChange={setIsAddRoomDialogOpen}
      />
    </div>
  );
}
