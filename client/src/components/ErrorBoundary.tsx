import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      errorMessage: error.message || 'An unexpected error occurred' 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <span className="text-2xl">💥</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Application Error
                  </h2>
                  <Alert className="border-red-200 bg-red-50 mb-6">
                    <AlertDescription className="text-red-600">
                      {this.state.errorMessage}
                    </AlertDescription>
                  </Alert>
                  <p className="text-gray-600 text-sm mb-6">
                    Something unexpected happened. Please refresh the page to try again.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}