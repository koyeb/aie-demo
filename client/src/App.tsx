import { Routes, Route } from 'react-router-dom';
import { CameraCapture } from '@/components/CameraCapture';
import { EmailModal } from '@/components/EmailModal';
import { SuccessModal } from '@/components/SuccessModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LogoHeader } from '@/components/LogoHeader';
import { AdminScenes } from '@/components/AdminScenes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { clientApi } from '@/services/clientApi';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CreateUserSubmissionInput, SubmissionResponse } from '@/types/schema';

function MainApp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Email and name submission
  const handleEmailSubmit = (nameValue: string, emailValue: string) => {
    setName(nameValue);
    setEmail(emailValue);
    setErrorMessage('');
    setShowEmailModal(false);
  };

  // Handle camera capture
  const handleCameraCapture = async (base64Data: string) => {
    // Prepare submission data
    const submissionData: CreateUserSubmissionInput = {
      name: name.trim(),
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
  };

  // Submit data to backend
  const submitData = async (data: CreateUserSubmissionInput) => {
    setIsLoading(true);

    try {
      const response: SubmissionResponse = await clientApi.submitEmailAndPicture.mutate(data);

      if (response.success) {
        setSuccessMessage(response.message);
        setShowSuccessModal(true);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setErrorMessage('Failed to submit your data. Please try again.');
    } finally {
      setIsLoading(false);
      setName('');
      setEmail('');
    }
  };

  // Reset application
  const resetApp = () => {
    setName('');
    setEmail('');
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(false);
    setShowEmailModal(true);
    setShowSuccessModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <LogoHeader />

      {/* Always show camera */}
      <div className="pt-8">
        <CameraCapture
          onCapture={handleCameraCapture}
          onError={handleCameraError}
          isLoading={isLoading}
        />
      </div>

      {/* Loading overlay when processing */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <LoadingSpinner size="lg" className="text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Processing Your Submission
            </h2>
            <p className="text-gray-600 text-center">
              Please wait while we process your photo...
            </p>
          </div>
        </div>
      )}

      {/* Error message overlay */}
      {errorMessage && !isLoading && (
        <div className="fixed bottom-4 left-4 right-4 z-40">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-600">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Email Modal */}
      <EmailModal
        open={showEmailModal}
        onSubmit={handleEmailSubmit}
        initialName={name}
        initialEmail={email}
      />

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        email={email}
        message={successMessage}
        onClose={resetApp}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminScenes />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
