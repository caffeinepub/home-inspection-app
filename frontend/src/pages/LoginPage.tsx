import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Camera, FileText, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-2xl bg-primary p-3">
                <ClipboardCheck className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight">Home Inspection Pro</h1>
            <p className="text-lg text-muted-foreground">
              Professional property inspection reports with AI-powered defect detection
            </p>
          </div>

          {/* Login Card */}
          <Card className="mx-auto mb-12 max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your inspection dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                size="lg"
                className="w-full text-base font-semibold"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Sign In Securely
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Secure authentication powered by Internet Identity
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2">
              <CardHeader>
                <Camera className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Photo Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload and annotate photos with powerful markup tools. AI-assisted defect detection
                  helps identify issues automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <FileText className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Professional Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate comprehensive PDF reports with your company branding, photos, annotations,
                  and detailed findings.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <ClipboardCheck className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Smart Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organize inspections by property, track defects by severity, and manage multiple
                  projects efficiently.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center text-sm text-muted-foreground">
            <p>
              © 2025. Built with love using{' '}
              <a
                href="https://caffeine.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
