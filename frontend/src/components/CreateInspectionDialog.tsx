import { useState } from 'react';
import { useCreateInspection } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Info, Home } from 'lucide-react';
import { SubscriptionTier, PropertyDetails } from '../backend';
import { fetchPropertyData, isRentCastConfigured } from '../lib/rentcast';

interface CreateInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInspectionCreated?: (inspectionId: string) => void;
}

export default function CreateInspectionDialog({ 
  open, 
  onOpenChange,
  onInspectionCreated 
}: CreateInspectionDialogProps) {
  const { identity } = useInternetIdentity();
  const createInspection = useCreateInspection();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [tier, setTier] = useState<SubscriptionTier>(SubscriptionTier.free);
  const [propertyData, setPropertyData] = useState<PropertyDetails | null>(null);
  const [isFetchingProperty, setIsFetchingProperty] = useState(false);

  const handleFetchPropertyData = async () => {
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      toast.error('Please fill in all address fields first');
      return;
    }

    if (!isRentCastConfigured()) {
      toast.error('RentCast API key not configured. Please add it in the Caffeine dashboard.');
      return;
    }

    setIsFetchingProperty(true);
    try {
      const fullAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}`;
      const data = await fetchPropertyData(fullAddress);

      if (data) {
        const propertyDetails: PropertyDetails = {
          bedrooms: BigInt(data.bedrooms || 0),
          bathrooms: BigInt(Math.floor((data.bathrooms || 0) * 10)), // Store as tenths (e.g., 2.5 = 25)
          squareFootage: BigInt(data.squareFootage || 0),
          yearBuilt: BigInt(data.yearBuilt || 0),
        };
        setPropertyData(propertyDetails);
        toast.success('Property data fetched successfully!');
      } else {
        toast.warning('Property data not found. You can still create the inspection.');
        setPropertyData(null);
      }
    } catch (error) {
      toast.error('Failed to fetch property data');
      console.error(error);
      setPropertyData(null);
    } finally {
      setIsFetchingProperty(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Not authenticated');
      return;
    }

    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      toast.error('Please fill in all address fields');
      return;
    }

    try {
      const inspectionId = await createInspection.mutateAsync({
        inspectorId: identity.getPrincipal(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
        },
        tier,
        propertyDetails: propertyData || undefined,
      });

      toast.success('Inspection created successfully!');
      onOpenChange(false);
      
      // Reset form
      setStreet('');
      setCity('');
      setState('');
      setZip('');
      setTier(SubscriptionTier.free);
      setPropertyData(null);

      // Notify parent component with the new inspection ID
      if (onInspectionCreated) {
        onInspectionCreated(inspectionId);
      }
    } catch (error) {
      toast.error('Failed to create inspection');
      console.error(error);
    }
  };

  const formatPropertyDisplay = (details: PropertyDetails) => {
    const parts: string[] = [];
    if (details.bedrooms > 0) parts.push(`${details.bedrooms} bed${details.bedrooms !== BigInt(1) ? 's' : ''}`);
    if (details.bathrooms > 0) parts.push(`${Number(details.bathrooms) / 10} bath${details.bathrooms !== BigInt(10) ? 's' : ''}`);
    if (details.squareFootage > 0) parts.push(`${Number(details.squareFootage).toLocaleString()} sq ft`);
    if (details.yearBuilt > 0) parts.push(`Built ${details.yearBuilt}`);
    return parts.join(' • ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Inspection</DialogTitle>
          <DialogDescription>
            Enter the property address and fetch property details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                placeholder="123 Main Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Springfield"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="IL"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                placeholder="62701"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchPropertyData}
                disabled={isFetchingProperty || !isRentCastConfigured()}
                className="w-full"
              >
                {isFetchingProperty ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Property Data...
                  </>
                ) : (
                  <>
                    <Home className="mr-2 h-4 w-4" />
                    Fetch Property Details
                  </>
                )}
              </Button>
              {!isRentCastConfigured() && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    RentCast API key not configured. Add it as a secret named <code className="rounded bg-muted px-1 py-0.5">RENTCAST_API_KEY</code> in the Caffeine dashboard.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {propertyData && (
              <Alert>
                <Home className="h-4 w-4" />
                <AlertDescription>
                  <strong>Property Details:</strong> {formatPropertyDisplay(propertyData)}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>Subscription Tier</Label>
              <RadioGroup value={tier} onValueChange={(value) => setTier(value as SubscriptionTier)}>
                <div className="flex items-center space-x-2 rounded-lg border p-3">
                  <RadioGroupItem value={SubscriptionTier.free} id="free" />
                  <Label htmlFor="free" className="flex-1 cursor-pointer">
                    <div className="font-medium">Free</div>
                    <div className="text-xs text-muted-foreground">
                      Up to 2 photos per inspection, 1 report
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3">
                  <RadioGroupItem value={SubscriptionTier.premium} id="premium" />
                  <Label htmlFor="premium" className="flex-1 cursor-pointer">
                    <div className="font-medium">Premium</div>
                    <div className="text-xs text-muted-foreground">
                      Unlimited photos and reports
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createInspection.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createInspection.isPending}>
              {createInspection.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Inspection'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
