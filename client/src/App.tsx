import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CameraCapture } from '@/components/CameraCapture';
import { EmailForm } from '@/components/EmailForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateUserSubmissionInput, SubmissionResponse } from '../../server/src/schema';

type AppStep = 'email' | 'camera' | 'processing' | 'success' | 'error';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Email submission
  const handleEmailSubmit = (emailValue: string) => {
    setEmail(emailValue);
    setErrorMessage('');
    setCurrentStep('camera');
  };

  // Handle camera capture
  const handleCameraCapture = async (base64Data: string) => {
    // Prepare submission data
    const submissionData: CreateUserSubmissionInput = {
      email: email.trim(),
      picture_data: base64Data,
      picture_filename: `photo_${Date.now()}.jpg`,
      picture_mime_type: 'image/jpeg'
    };

    // Submit to backend
    await submitData(submissionData);
  };

  // Handle camera errors
  const handleCameraError = (error: string) => {
    setErrorMessage(error);
    setCurrentStep('error');
  };

  // Submit data to backend
  const submitData = async (data: CreateUserSubmissionInput) => {
    setCurrentStep('processing');
    setIsLoading(true);

    try {
      const response: SubmissionResponse = await trpc.submitEmailAndPicture.mutate(data);
      
      if (response.success) {
        setSuccessMessage(response.message);
        setCurrentStep('success');
      } else {
        setErrorMessage(response.message);
        setCurrentStep('error');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setErrorMessage('Failed to submit your data. Please try again.');
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset application
  const resetApp = () => {
    setCurrentStep('email');
    setEmail('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(false);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ProgressIndicator currentStep={currentStep} />
        {/* Email Step */}
        {currentStep === 'email' && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-800" id="app-title">
                📸 Photo Submission
              </CardTitle>
              <p className="text-gray-600 text-sm" id="app-description">
                We'll take your photo and send an edited version to your email
              </p>
            </CardHeader>
            <CardContent>
              <EmailForm onSubmit={handleEmailSubmit} initialEmail={email} />
            </CardContent>
          </Card>
        )}

        {/* Camera Step */}
        {currentStep === 'camera' && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-gray-800">
                Take Your Photo
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Position yourself in the frame and take a photo
              </p>
            </CardHeader>
            <CardContent>
              <CameraCapture
                onCapture={handleCameraCapture}
                onError={handleCameraError}
                onBack={() => setCurrentStep('email')}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <LoadingSpinner size="lg" className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Processing Your Submission
                </h2>
                <p className="text-gray-600">
                  Please wait while we process your photo...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {currentStep === 'success' && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Success!
                </h2>
                <Alert className="border-green-200 bg-green-50 mb-6">
                  <AlertDescription className="text-green-700">
                    {successMessage}
                  </AlertDescription>
                </Alert>
                <p className="text-gray-600 text-sm mb-6">
                  Your photo has been submitted to <strong>{email}</strong>
                </p>
              </div>
              <Button 
                onClick={resetApp}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                Submit Another Photo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error Step */}
        {currentStep === 'error' && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <span className="text-2xl">❌</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Something Went Wrong
                </h2>
                <Alert className="border-red-200 bg-red-50 mb-6">
                  <AlertDescription className="text-red-600">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={resetApp}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => setCurrentStep('camera')}
                  variant="outline"
                  className="w-full h-12"
                >
                  Back to Camera
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;