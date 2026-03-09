import { useState } from 'react';
import { useGetInspectionsByInspector } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MapPin, Calendar, AlertCircle } from 'lucide-react';
import CreateInspectionDialog from './CreateInspectionDialog';
import { InspectionStatus, SubscriptionTier } from '../backend';

interface InspectionsListProps {
  onSelectInspection: (id: string) => void;
}

export default function InspectionsList({ onSelectInspection }: InspectionsListProps) {
  const { data: inspections, isLoading } = useGetInspectionsByInspector();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleInspectionCreated = (inspectionId: string) => {
    // Automatically select the newly created inspection
    onSelectInspection(inspectionId);
  };

  const getStatusBadge = (status: InspectionStatus) => {
    const statusConfig = {
      [InspectionStatus.draft]: { label: 'Draft', variant: 'secondary' as const },
      [InspectionStatus.inProgress]: { label: 'In Progress', variant: 'default' as const },
      [InspectionStatus.completed]: { label: 'Completed', variant: 'outline' as const },
      [InspectionStatus.reportGenerated]: { label: 'Report Generated', variant: 'outline' as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Inspections</h2>
          <p className="text-muted-foreground">
            Manage and track all your property inspections
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Inspection
        </Button>
      </div>

      {!inspections || inspections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No inspections yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Get started by creating your first inspection
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Inspection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inspections.map((inspection) => (
            <Card
              key={inspection.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectInspection(inspection.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{inspection.address.street}</CardTitle>
                  {getStatusBadge(inspection.status)}
                </div>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {inspection.address.city}, {inspection.address.state} {inspection.address.zip}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {formatDate(inspection.startTime)}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {inspection.rooms.length} room{inspection.rooms.length !== 1 ? 's' : ''}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {inspection.subscriptionTier === SubscriptionTier.free ? 'Free' : 'Premium'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateInspectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onInspectionCreated={handleInspectionCreated}
      />
    </div>
  );
}
