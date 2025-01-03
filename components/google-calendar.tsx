import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const GoogleCalendarAuth = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const verifyConnection = async () => {
    try {
      const response = await fetch('/api/auth/calendar/check');
      const data = await response.json();

      setConnectionStatus({
        isConnected: data.isConnected,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        isLoading: false,
        error: 'Unable to verify calendar connection status',
      });
    }
  };

  useEffect(() => {
    verifyConnection();
  }, []);

  const handleAuth = async () => {
    try {
      setConnectionStatus((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
      const response = await fetch('/api/auth/calendar/google');
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to connect to Google Calendar',
      }));
      toast('Auth Failed', {
        description: 'Failed to connect to Google Calendar',
      });
    }
  };

  return (
    <div className="space-y-4">
      {connectionStatus.isConnected ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-background hover:bg-secondary/80 cursor-default border-border"
              >
                <CheckCircle className="size-4 text-green-500" />
                <span className="hidden sm:inline text-secondary-foreground">
                  Connected to Google Calendar
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Successfully connected to Google Calendar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          onClick={handleAuth}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={connectionStatus.isLoading}
        >
          {connectionStatus.isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Calendar className="size-4" />
          )}
          <span className="hidden sm:inline">
            {connectionStatus.isLoading
              ? 'Connecting...'
              : 'Connect Google Calendar'}
          </span>
        </Button>
      )}
    </div>
  );
};

export default GoogleCalendarAuth;
