import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface EmailModalProps {
  open: boolean;
  onSubmit: (email: string) => void;
  initialEmail?: string;
}

export function EmailModal({ open, onSubmit, initialEmail = '' }: EmailModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter an email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setErrorMessage('');
    onSubmit(trimmedEmail);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            📸 Photo Submission
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            We'll take your photo and send an edited version to your email
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={handleEmailChange}
              required
              className="h-12 text-base"
              autoComplete="email"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send your edited photo to this email address
            </p>
          </div>
          
          {errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 transition-colors"
              disabled={!email.trim()}
            >
              Continue to Camera 📷
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}