"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  Check,
  X,
  Calendar,
  Repeat,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "./ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { EventDateTime } from "./calendar-event-list";

interface EventProps {
  eventId: string;
  summary: string | null;
  description: string | null;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  link: string;
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  recurrence?: string[];
  status: string;
}

interface Props {
  events: EventProps[] | { error: string };
}

const CalendarEvent = ({ events }: Props) => {
  const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

  if ("error" in events) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-3xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{events.error}</AlertDescription>
      </Alert>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Alert className="mx-auto max-w-3xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Events</AlertTitle>
        <AlertDescription>No calendar events found</AlertDescription>
      </Alert>
    );
  }

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <motion.div
      className="space-y-4 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {events.map((event) => (
        <motion.div
          key={event.eventId}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
              <CardTitle className="text-lg sm:text-xl font-bold break-words">
                {event.summary}
              </CardTitle>
              <div className="flex items-center space-x-2 shrink-0">
                {event.status === "Event created successfully" ? (
                  <motion.div
                    className="flex items-center text-green-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-4 sm:h-5 w-4 sm:w-5 mr-1" />
                    <span className="text-xs sm:text-sm">Created</span>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center text-red-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <X className="h-4 sm:h-5 w-4 sm:w-5 mr-1" />
                    <span className="text-xs sm:text-sm">Failed</span>
                  </motion.div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 shrink-0" />
                    <span className="break-words">
                      Start:
                      <EventDateTime dateTime={event.start} />
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 shrink-0" />
                    <span className="break-words">
                      End: <EventDateTime dateTime={event.end} />
                    </span>
                  </div>
                </div>
                {event.recurrence && event.recurrence.length > 0 && (
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Repeat className="h-4 w-4 mr-2 shrink-0" />
                    <span className="break-words">
                      Recurring: {event.recurrence.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {expandedEvents.includes(event.eventId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {event.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 break-words">
                        {event.description}
                      </p>
                    )}

                    {event.link && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block"
                      >
                        <Button size="sm" className="text-xs sm:text-sm">
                          Open Event
                        </Button>
                      </a>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="border-t mt-4 pt-4">
                        <div className="flex items-center mb-2">
                          <Users className="h-4 w-4 mr-2" />
                          <span className="text-xs sm:text-sm font-medium">
                            Attendees
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {event.attendees.map((attendee, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-xs sm:text-sm bg-gray-50 p-2 rounded-md"
                            >
                              <span className="truncate mr-2">
                                {attendee.email}
                              </span>
                              {attendee.responseStatus && (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                    attendee.responseStatus === "accepted"
                                      ? "bg-green-100 text-green-800"
                                      : attendee.responseStatus === "declined"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {attendee.responseStatus
                                    .charAt(0)
                                    .toUpperCase() +
                                    attendee.responseStatus.slice(1)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs sm:text-sm"
                onClick={() => toggleEventExpansion(event.eventId)}
              >
                {expandedEvents.includes(event.eventId) ? (
                  <ChevronUp className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                {expandedEvents.includes(event.eventId)
                  ? "Show Less"
                  : "Show More"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CalendarEvent;

export function CalendarEventSkeleton() {
  return (
    <div className="space-y-4 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto">
      {[1].map((index) => (
        <Card key={index} className="w-full">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-8 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[1, 2].map((attendee) => (
                  <Skeleton key={attendee} className="h-8 w-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
