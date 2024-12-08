import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

const GoogleCalendarAuth = () => {
  const handleAuth = async () => {
    try {
      const response = await fetch("/api/auth/calendar/google");
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to initiate Google Calendar auth:", error);
    }
  };

  return (
    <Button onClick={handleAuth} className="flex items-center gap-2">
      <Calendar className="w-4 h-4" />
      Connect Google Calendar
    </Button>
  );
};

export default GoogleCalendarAuth;
