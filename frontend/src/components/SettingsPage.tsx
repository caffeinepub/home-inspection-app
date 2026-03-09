import { useState } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Building2, User, Mail, Phone, Upload, Key, Info, Code } from 'lucide-react';
import StripeSetup from './StripeSetup';
import { isRentCastConfigured } from '../lib/rentcast';
import { isGooglePlacesAvailable } from '../lib/googlePlaces';
import { isBatchDataAvailable } from '../lib/batchdata';

export default function SettingsPage() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const saveProfile = useSaveCallerUserProfile();

  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [companyName, setCompanyName] = useState(userProfile?.companyName || '');
  const [contactInfo, setContactInfo] = useState(userProfile?.contactInfo || '');

  // Get API configuration status
  const apiStatus = {
    rentCast: isRentCastConfigured(),
    googlePlaces: isGooglePlacesAvailable(),
    batchData: isBatchDataAvailable(),
  };

  // Update form when profile loads
  useState(() => {
    if (userProfile) {
      setName(userProfile.name);
      setEmail(userProfile.email);
      setCompanyName(userProfile.companyName);
      setContactInfo(userProfile.contactInfo);
    }
  });

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !companyName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        contactInfo: contactInfo.trim(),
        companyLogo: userProfile?.companyLogo,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and company information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>External API integration status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${apiStatus.rentCast ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium">RentCast API</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {apiStatus.rentCast ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${apiStatus.googlePlaces ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium">Google Places API</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {apiStatus.googlePlaces ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${apiStatus.batchData ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium">BatchData MCP API</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {apiStatus.batchData ? 'Configured' : 'Not configured'}
              </span>
            </div>
          </div>

          <Alert>
            <Code className="h-4 w-4" />
            <AlertTitle>Developer Setup Instructions</AlertTitle>
            <AlertDescription className="mt-2 space-y-3 text-sm">
              <p>
                To configure API keys for local development, create a <code className="rounded bg-muted px-1.5 py-0.5 font-mono">.env</code> file in the <code className="rounded bg-muted px-1.5 py-0.5 font-mono">frontend/</code> directory with the following environment variables:
              </p>
              <div className="rounded-md bg-muted p-3 font-mono text-xs">
                <div>VITE_GOOGLE_PLACES_API_KEY=your_key_here</div>
                <div>VITE_BATCHDATA_API_KEY=your_key_here</div>
                <div>VITE_RENTCAST_API_KEY=your_key_here</div>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> After creating or modifying the <code className="rounded bg-muted px-1 py-0.5 font-mono">.env</code> file, restart the development server for changes to take effect. Do not commit the <code className="rounded bg-muted px-1 py-0.5 font-mono">.env</code> file to version control.
              </p>
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Production Deployment</AlertTitle>
            <AlertDescription className="mt-2 space-y-2 text-sm">
              <p>
                For production deployments on Caffeine, configure API keys through the dashboard:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Navigate to <strong>Secrets → Add new secret</strong> in your Caffeine dashboard</li>
                <li>Add secrets with the exact names shown above (without the <code className="rounded bg-muted px-1 py-0.5 font-mono">VITE_</code> prefix)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            This information will appear on your inspection reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ABC Home Inspections"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Phone: (555) 123-4567&#10;Address: 123 Main St, City, State"
                rows={3}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted">
                <img
                  src="/assets/generated/default-company-logo-transparent.dim_200x200.png"
                  alt="Company logo"
                  className="h-full w-full object-contain p-2"
                />
              </div>
              <Button variant="outline" className="gap-2" disabled>
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Logo upload coming soon. PNG or JPG, max 2MB
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveProfile.isPending} size="lg">
          {saveProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {isAdmin && (
        <>
          <Separator className="my-8" />
          <StripeSetup />
        </>
      )}
    </div>
  );
}
