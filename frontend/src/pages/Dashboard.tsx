import { useState } from 'react';
import Header from '../components/Header';
import InspectionsList from '../components/InspectionsList';
import InspectionDetail from '../components/InspectionDetail';
import SettingsPage from '../components/SettingsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Settings } from 'lucide-react';

export default function Dashboard() {
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('inspections');

  const handleSelectInspection = (id: string) => {
    setSelectedInspectionId(id);
  };

  const handleBackToList = () => {
    setSelectedInspectionId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="inspections" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Inspections
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspections" className="mt-0">
            {selectedInspectionId ? (
              <InspectionDetail
                inspectionId={selectedInspectionId}
                onBack={handleBackToList}
              />
            ) : (
              <InspectionsList onSelectInspection={handleSelectInspection} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
