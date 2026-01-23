import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield } from 'lucide-react';

interface LoginOverlayProps {
  open: boolean;
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export default function LoginOverlay({ open, onLogin }: LoginOverlayProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await onLogin(username.trim(), password);
      if (success) {
        setUsername('');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Administrator Login</DialogTitle>
            <DialogDescription>
              Sign in to manage templates and data
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="loginUsername">Username</Label>
            <Input
              id="loginUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
              disabled={isLoading}
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="loginPassword">Password</Label>
            <Input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
