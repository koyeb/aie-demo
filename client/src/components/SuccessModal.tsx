import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SuccessModalProps {
  open: boolean;
  email: string;
  message: string;
  onClose: () => void;
}

export function SuccessModal({ open, email, message, onClose }: SuccessModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
            <span className="text-2xl">✅</span>
          </div>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Success!
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Your photo has been submitted successfully
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">
              {message}
            </AlertDescription>
          </Alert>
          
          <p className="text-gray-600 text-sm text-center">
            Your photo has been submitted to <strong>{email}</strong>
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          >
            Submit Another Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}