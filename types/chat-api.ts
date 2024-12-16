// Base types for dates and times
export type ISO8601DateTime = string;

// Calendar Event Types
export interface CalendarEventDateTime {
  dateTime: string | null;
  timeZone: string | null;
}

export interface CalendarEventAttendee {
  email: string | null;
  displayName?: string | null;
  responseStatus: string | null;
}

export interface CalendarConferenceData {
  type: string;
  link: string;
}

export interface CalendarEventCreator {
  email: string;
  displayName?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string | null;
  description: string | null;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  location?: string;
  creator?: CalendarEventCreator;
  attendees?: CalendarEventAttendee[];
  hangoutLink?: string;
  conferenceData?: CalendarConferenceData;
  recurringEventId?: string;
  status: string;
  link?: string;
}

// Tool Parameter Types
export type EventPattern =
  | "single"
  | "work-with-breaks"
  | "meeting-series"
  | "split-session";
export type CalendarOrderBy = "startTime" | "updated";

export interface CreateCalendarEventParams {
  summary: string;
  description?: string;
  startDateTime: ISO8601DateTime;
  endDateTime?: ISO8601DateTime;
  attendees?: string[];
  eventPattern: EventPattern;
  totalDuration?: number;
  breakDuration?: number;
  workSegmentDuration?: number | undefined;
}

export interface ListCalendarEventsParams {
  maxResults?: number;
  timeMin?: ISO8601DateTime;
  timeMax?: ISO8601DateTime;
  showDeleted?: boolean;
  calendarId?: string;
  orderBy?: CalendarOrderBy;
  q?: string;
}

// Response Types
export interface CalendarEventResponse {
  eventId: string;
  summary: string;
  description?: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  link?: string;
  attendees?: CalendarEventAttendee[];
  recurrence?: string[];
  status: string;
}

export interface ListCalendarEventsResponse {
  events?: CalendarEvent[];
  count: number;
  nextPageToken?: string;
  error?: string;
}

// Stream Data Types
export interface StreamDataContent {
  type:
    | "calendar-event"
    | "calendar-events-list"
    | "user-message-id"
    | "id"
    | "title"
    | "clear"
    | "text-delta"
    | "finish"
    | "suggestion";
  content: any;
}

// Tool Types
export type AllowedTools =
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "getWeather"
  | "createCalendarEvent"
  | "listCalendarEvents"
  | "search"
  | "retrieve";

// Message Types
export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

// Tool Function Response Types
export interface WeatherResponse {
  temperature_2m: number;
  sunrise: string;
  sunset: string;
}

export interface DocumentResponse {
  id: string;
  title: string;
  content: string;
  error?: string;
}

export interface SuggestionResponse {
  id: string;
  title: string;
  message: string;
  error?: string;
}
