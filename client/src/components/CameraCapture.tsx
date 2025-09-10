import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function CameraCapture({ onCapture, onError, isLoading = false }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMessage, setErrorMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera on component mount
  useEffect(() => {
    const initCamera = async () => {
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
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    };
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
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      
      // Restart with new facing mode after a short delay
      setTimeout(async () => {
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
      }, 100);
    }
  }, [currentFacingMode, isCameraActive, onError]);

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

    // Return captured data (but don't stop camera to allow multiple captures)
    onCapture(base64Data);
  }, [currentFacingMode, onCapture]);

  return (
    <div className="h-screen flex flex-col">
      {!isCameraActive ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="text-6xl mb-2">📸</div>
              <p className="text-gray-600 text-sm">
                Initializing camera...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' 
              }}
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg shadow-lg"></div>
            </div>
            {/* Camera mode indicator */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-sm">
              {currentFacingMode === 'user' ? '🤳 Front' : '📷 Back'}
            </div>
            {/* Camera controls */}
            <div className="absolute top-4 left-4">
              <Button 
                onClick={switchCamera}
                variant="outline"
                size="sm"
                className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                disabled={isLoading}
              >
                🔄 Flip
              </Button>
            </div>
          </div>
          
          {/* Bottom capture button */}
          <div className="p-6 bg-white/90 backdrop-blur-sm">
            <Button 
              onClick={capturePicture}
              className="w-full h-16 text-lg bg-red-600 hover:bg-red-700 rounded-full"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : '📸 Take Photo'}
            </Button>
          </div>
        </>
      )}
      
      {errorMessage && (
        <div className="absolute bottom-20 left-4 right-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-600">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}