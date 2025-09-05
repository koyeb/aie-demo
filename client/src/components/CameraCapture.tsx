import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function CameraCapture({ onCapture, onError, onBack, isLoading = false }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMessage, setErrorMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: currentFacingMode }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      const errorMsg = 'Unable to access camera. Please ensure you have granted camera permissions.';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    }
  }, [currentFacingMode, onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Switch camera (front/back)
  const switchCamera = async () => {
    if (!isCameraActive) return;
    
    stopCamera();
    setCurrentFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    
    // Small delay to ensure cleanup
    setTimeout(() => {
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      setCurrentFacingMode(newFacingMode);
    }, 100);
  };

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (isCameraActive && streamRef.current) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [currentFacingMode, startCamera, stopCamera, isCameraActive]);

  // Capture picture
  const capturePicture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas (flip if front camera)
    if (currentFacingMode === 'user') {
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Convert to base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = imageDataUrl.split(',')[1];

    // Stop camera
    stopCamera();

    // Return captured data
    onCapture(base64Data);
  }, [currentFacingMode, onCapture, stopCamera]);

  return (
    <div className="space-y-4">
      {!isCameraActive ? (
        <div className="text-center">
          <div className="mb-4 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-6xl mb-2">📸</div>
            <p className="text-gray-600 text-sm">
              Click the button below to activate your camera
            </p>
          </div>
          <Button 
            onClick={startCamera} 
            disabled={isLoading}
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Starting Camera...' : 'Start Camera'}
          </Button>
        </div>
      ) : (
        <div>
          <div className="relative mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg border-2 border-gray-200"
              style={{ 
                transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' 
              }}
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg shadow-lg"></div>
            </div>
            {/* Camera mode indicator */}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {currentFacingMode === 'user' ? '🤳 Front' : '📷 Back'}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={switchCamera}
              variant="outline"
              className="flex-1 h-12"
              disabled={isLoading}
            >
              🔄 Flip
            </Button>
            <Button 
              onClick={capturePicture}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              📸 Capture
            </Button>
          </div>
          <Button 
            onClick={onBack}
            variant="ghost"
            className="w-full mt-2"
            disabled={isLoading}
          >
            ← Back to Email
          </Button>
        </div>
      )}
      
      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-600">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Hidden canvas for image capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}