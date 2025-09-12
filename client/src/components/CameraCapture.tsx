import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function CameraCapture({ onCapture, onError, isLoading = false }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera on component mount
  useLayoutEffect(() => {
    let stream: MediaStream;
    const initCamera = async () => {
      try {
        setErrorMessage('');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraActive(false);
    };
  }, []);

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

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = imageDataUrl.split(',')[1];

    // Return captured data (but don't stop camera to allow multiple captures)
    onCapture(base64Data);
  }, [onCapture]);

  return (
    <div className="h-screen flex flex-col">
      <div hidden={isCameraActive} className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-6xl mb-2">📸</div>
            <p className="text-gray-600 text-sm">
              Initializing camera...
            </p>
          </div>
        </div>
      </div>

      <div hidden={!isCameraActive}
        className='flex flex-col gap-4 w-full'
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="flex max-h-8/10 aspect-video object-contain"
          style={{
            transform: 'scaleX(-1)'
          }}
        />

        {/* Bottom capture button */}
        <div className="flex justify-items-center justify-center">
          <Button
            onClick={capturePicture}
            className="w-48 h-16 text-lg bg-blue-600 hover:bg-blue-700 rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : '📸 Take Photo'}
          </Button>
        </div>
      </div>

      {
        errorMessage && (
          <div className="absolute bottom-20 left-4 right-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )
      }

      {/* Hidden canvas for image capture */}
      < canvas
        ref={canvasRef}
        className="hidden"
      />
    </div >
  );
}
