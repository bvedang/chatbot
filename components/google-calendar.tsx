import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      const response = await fetch("/api/auth/calendar/check");
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
        error: "Unable to verify calendar connection status",
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
      const response = await fetch("/api/auth/calendar/google");
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to connect to Google Calendar",
      }));
    }
  };

  return (
    <div className="space-y-4">
      {connectionStatus.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{connectionStatus.error}</AlertDescription>
        </Alert>
      )}

      {connectionStatus.isConnected ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto flex items-center gap-2 bg-secondary hover:bg-secondary/80 cursor-default border-border"
              >
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-secondary-foreground">
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
          className="w-full sm:w-auto flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={connectionStatus.isLoading}
        >
          {connectionStatus.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          {connectionStatus.isLoading
            ? "Connecting..."
            : "Connect Google Calendar"}
        </Button>
      )}
    </div>
  );
};

export default GoogleCalendarAuth;
