import { useGetOverallSummary, useGetCountOfDefectsPerSeverity } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface InspectionSummaryProps {
  inspectionId: string;
}

export default function InspectionSummary({ inspectionId }: InspectionSummaryProps) {
  const { data: summary, isLoading: summaryLoading } = useGetOverallSummary(inspectionId);
  const { data: defectsBySeverity, isLoading: defectsLoading } = useGetCountOfDefectsPerSeverity(inspectionId);

  const handleGenerateReport = () => {
    toast.info('PDF report generation is coming soon!');
  };

  if (summaryLoading || defectsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Convert bigint counts to numbers and create severity map
  const defectsMap = new Map<string, number>(
    defectsBySeverity?.map(([severity, count]) => [severity, Number(count)]) || []
  );
  
  const majorCount: number = defectsMap.get('major') || 0;
  const moderateCount: number = defectsMap.get('moderate') || 0;
  const minorCount: number = defectsMap.get('minor') || 0;
  const totalDefects: number = majorCount + moderateCount + minorCount;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inspection Summary</CardTitle>
          <CardDescription>Overview of findings and defects</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{summary || 'No summary available'}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Major Defects</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{majorCount}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Moderate Defects</CardTitle>
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{moderateCount}</div>
          </CardContent>
        </Card>

        <Card className="border-muted-foreground/50 bg-muted/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Minor Defects</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{minorCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Create a comprehensive PDF report with all inspection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold">Report will include:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Inspector and company information</li>
              <li>• Property address and details</li>
              <li>• All room photos with annotations</li>
              <li>• Defect descriptions and severity ratings</li>
              <li>• Recommendations for repairs</li>
              <li>• Executive summary</li>
            </ul>
          </div>
          <Button onClick={handleGenerateReport} className="w-full gap-2" size="lg">
            <Download className="h-4 w-4" />
            Generate PDF Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
