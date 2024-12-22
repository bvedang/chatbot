'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MapPin, Pencil, Users, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface ConferenceData {
  type?: string;
  link?: string;
}

interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
}

interface Creator {
  email?: string;
  displayName?: string;
}

interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: EventDateTime;
  end: EventDateTime;
  location?: string;
  creator?: Creator;
  link?: string;
  attendees?: Attendee[];
  hangoutLink?: string;
  conferenceData?: ConferenceData;
  recurringEventId?: string;
  status?: string;
}

interface Props {
  events?: CalendarEvent[];
}

export const EventDateTime: React.FC<{ dateTime: EventDateTime }> = ({
  dateTime,
}) => {
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    if (!dateTime.dateTime && !dateTime.date) {
      setFormattedDate('No date specified');
      return;
    }

    const date = new Date(dateTime.dateTime || dateTime.date || '');
    const dateOptions: Intl.DateTimeFormatOptions = isSmallScreen
      ? {
          dateStyle: 'short',
          timeStyle: dateTime.dateTime ? 'short' : undefined,
        }
      : {
          dateStyle: 'medium',
          timeStyle: dateTime.dateTime ? 'short' : undefined,
        };

    setFormattedDate(date.toLocaleString('en-US', dateOptions));
  }, [isSmallScreen, dateTime]);

  return <span>{formattedDate}</span>;
};

export default function CalendarEventsList({ events }: Props) {
  if (events?.length === 0) {
    return <div className="text-gray-500 p-4 text-center">No events found</div>;
  }

  return (
    <div className="space-y-4">
      {events?.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {event.summary}
            </CardTitle>
            <div className="text-sm text-gray-500">
              <EventDateTime dateTime={event.start} /> -{' '}
              <EventDateTime dateTime={event.end} />
            </div>
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block"
              >
                <Button size="sm" className="text-xs sm:text-sm mb-2">
                  <Pencil className="size-4" /> Edit Event
                </Button>
              </a>
            )}
          </CardHeader>
          <CardContent>
            {event.description && (
              <p className="text-sm mb-2">{event.description}</p>
            )}

            <div className="space-y-2">
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {(event.conferenceData?.link || event.hangoutLink) && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="size-4" />
                  <a
                    href={event.conferenceData?.link || event.hangoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Join meeting
                  </a>
                </div>
              )}

              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Users className="size-4 mt-1" />
                  <div className="flex flex-wrap gap-1">
                    {event.attendees.map((attendee, index) => (
                      <span
                        key={attendee.email}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:text-gray-900"
                        title={`${attendee.email} (${
                          attendee.responseStatus || 'No response'
                        })`}
                      >
                        {attendee.displayName || attendee.email.split('@')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
