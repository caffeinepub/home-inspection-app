import { useState } from 'react';
import { useIsStripeConfigured, useSetStripeConfiguration } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';

export default function StripeSetup() {
  const { data: isConfigured, isLoading } = useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();

  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');

  const handleSave = async () => {
    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    const countryList = countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);

    if (countryList.length === 0) {
      toast.error('Please enter at least one valid country code');
      return;
    }

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countryList,
      });
      toast.success('Stripe configuration saved successfully!');
      setSecretKey('');
    } catch (error) {
      toast.error('Failed to save Stripe configuration');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Payment Configuration
            </CardTitle>
            <CardDescription>
              Configure Stripe to accept premium subscription payments
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge variant={isConfigured ? 'default' : 'secondary'} className="gap-1">
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Configured
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Not Configured
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="secretKey">Stripe Secret Key</Label>
          <Input
            id="secretKey"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="sk_test_..."
          />
          <p className="text-xs text-muted-foreground">
            Your Stripe secret key (starts with sk_test_ or sk_live_)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="countries">Allowed Countries</Label>
          <Input
            id="countries"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="US,CA,GB"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list of 2-letter country codes (e.g., US, CA, GB)
          </p>
        </div>

        <Button onClick={handleSave} disabled={setConfig.isPending} className="w-full">
          {setConfig.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
