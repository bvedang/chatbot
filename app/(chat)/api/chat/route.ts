import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { Message, PrismaClient, Suggestion } from '@prisma/client';
import {
  CoreUserMessage,
  StreamData,
  convertToCoreMessages,
  streamObject,
  streamText,
} from 'ai';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import {
  getChatById,
  saveChat,
  saveMessages,
  saveSuggestions,
} from '@/lib/db/queries';
import { generateTitleFromUserMessage } from '../../actions';
import { calendar_v3, google } from 'googleapis';
import {
  CalendarEvent,
  CalendarEventResponse,
  ListCalendarEventsResponse,
  CreateCalendarEventParams,
  ListCalendarEventsParams,
  AllowedTools,
} from '../../../../types/chat-api';
import { getTools } from '@/lib/agents/tools';
import { AnswerSection } from '@/components/answer-section';

const prisma = new PrismaClient();
export const maxDuration = 60;

function getCurrentDateTime() {
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const pad = (num: number) =>
    String(Math.floor(Math.abs(num))).padStart(2, '0');

  return (
    now.getFullYear() +
    '-' +
    pad(now.getMonth() + 1) +
    '-' +
    pad(now.getDate()) +
    'T' +
    pad(now.getHours()) +
    ':' +
    pad(now.getMinutes()) +
    ':' +
    pad(now.getSeconds()) +
    sign +
    pad(offset / 60) +
    ':' +
    pad(offset % 60)
  );
}

// Utility function to add hours to a date
const addHours = (date: string, hours: number) => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate.toISOString();
};

// Date validation schema
const dateTimeSchema = z.string().refine((val) => {
  const date = new Date(val);
  const now = new Date();
  return !isNaN(date.getTime()) && date >= now;
}, 'DateTime must be valid and not in the past');

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];
const calendarTools: AllowedTools[] = [
  'createCalendarEvent',
  'listCalendarEvents',
];
const allTools: AllowedTools[] = [
  ...blocksTools,
  ...weatherTools,
  ...calendarTools,
  'search',
  'retrieve',
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export async function POST(request: Request) {
  const { id, messages, modelId } = await request.json();
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);
  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });
  if (!chat) {
    const title = await generateTitleFromUserMessage({
      message: userMessage as CoreUserMessage,
    });
    await saveChat({ id, userId, title });
  }

  const userMessageId = generateUUID();
  await saveMessages({
    messages: [
      {
        ...(userMessage as Message),
        id: userMessageId,
        createdAt: new Date(),
        chatId: id,
      },
    ],
  });

  const streamingData = new StreamData();
  streamingData.append({ type: 'user-message-id', content: userMessageId });

  const result = streamText({
    model: customModel(model.apiIdentifier),
    system: systemPrompt,
    messages: coreMessages,
    maxSteps: 5,
    experimental_activeTools: allTools,
    tools: {
      ...getTools({ streamingData, fullResponse: '' }),
      getWeather: {
        description: 'Get the current weather at a location',
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
          );
          return await response.json();
        },
      },
      createDocument: {
        description: 'Create a document for a writing activity',
        parameters: z.object({
          title: z.string(),
        }),
        execute: async ({ title }) => {
          const id = generateUUID();
          let draftText = '';

          streamingData.append({ type: 'id', content: id });
          streamingData.append({ type: 'title', content: title });
          streamingData.append({ type: 'clear', content: '' });

          const { fullStream } = streamText({
            model: customModel(model.apiIdentifier),
            system:
              'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
            prompt: title,
          });

          for await (const delta of fullStream) {
            if (delta.type === 'text-delta') {
              draftText += delta.textDelta;
              streamingData.append({
                type: 'text-delta',
                content: delta.textDelta,
              });
            }
          }

          streamingData.append({ type: 'finish', content: '' });

          await prisma.document.create({
            data: {
              id,
              title,
              content: draftText,
              userId,
              createdAt: new Date(),
            },
          });

          return {
            id,
            title,
            content: 'A document was created and is now visible to the user.',
          };
        },
      },
      updateDocument: {
        description: 'Update a document with the given description',
        parameters: z.object({
          id: z.string().describe('The ID of the document to update'),
          description: z
            .string()
            .describe('The description of changes that need to be made'),
        }),
        execute: async ({ id, description }) => {
          const document = await prisma.document.findUnique({ where: { id } });
          if (!document) {
            return { error: 'Document not found' };
          }

          let draftText = '';
          streamingData.append({ type: 'clear', content: document.title });

          const { fullStream } = streamText({
            model: customModel(model.apiIdentifier),
            system:
              'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
            experimental_providerMetadata: {
              openai: {
                prediction: { type: 'content', content: document.content },
              },
            },
            messages: [
              { role: 'user', content: description },
              { role: 'user', content: document.content },
            ],
          });

          for await (const delta of fullStream) {
            if (delta.type === 'text-delta') {
              draftText += delta.textDelta;
              streamingData.append({
                type: 'text-delta',
                content: delta.textDelta,
              });
            }
          }

          streamingData.append({ type: 'finish', content: '' });

          await prisma.document.update({
            where: { id },
            data: {
              content: draftText,
            },
          });

          return {
            id,
            title: document.title,
            content: 'The document has been updated successfully.',
          };
        },
      },
      requestSuggestions: {
        description: 'Request suggestions for a document',
        parameters: z.object({
          documentId: z
            .string()
            .describe('The ID of the document to request edits'),
        }),
        execute: async ({ documentId }) => {
          const document = await prisma.document.findUnique({
            where: { id: documentId },
          });
          if (!document || !document.content) {
            return { error: 'Document not found' };
          }

          const suggestions: Array<
            Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
          > = [];
          const { elementStream } = streamObject({
            model: customModel(model.apiIdentifier),
            system:
              'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
            prompt: document.content,
            output: 'array',
            schema: z.object({
              originalSentence: z.string().describe('The original sentence'),
              suggestedSentence: z.string().describe('The suggested sentence'),
              description: z
                .string()
                .describe('The description of the suggestion'),
            }),
          });

          for await (const element of elementStream) {
            const suggestion = {
              originalText: element.originalSentence,
              suggestedText: element.suggestedSentence,
              description: element.description,
              id: generateUUID(),
              documentId,
              isResolved: false,
            };

            streamingData.append({
              type: 'suggestion',
              content: suggestion,
            });

            suggestions.push(suggestion);
          }

          await saveSuggestions({
            suggestions: suggestions.map((suggestion) => ({
              ...suggestion,
              userId,
              createdAt: new Date(),
              documentCreatedAt: document.createdAt,
            })),
          });

          return {
            id: documentId,
            title: document.title,
            message: 'Suggestions have been added to the document',
          };
        },
      },
      createCalendarEvent: {
        description:
          'Create new events in Google Calendar - supports both single and multiple related events',
        parameters: z.object({
          summary: z.string().describe('Title of the event'),
          description: z
            .string()
            .optional()
            .describe('Description of the event'),
          startDateTime: dateTimeSchema
            .default(getCurrentDateTime)
            .describe('Start time in ISO format (defaults to current time)'),
          endDateTime: z
            .string()
            .optional()
            .describe(
              'End time in ISO format (defaults to start time + 1 hour)',
            ),
          attendees: z
            .array(z.string())
            .optional()
            .describe('List of attendee email addresses'),

          // Multiple events support
          eventPattern: z
            .enum([
              'single',
              'work-with-breaks',
              'meeting-series',
              'split-session',
            ])
            .default('single')
            .describe(
              'Pattern for event creation: single event, work session with breaks (breaks should not overlap work sessions), meeting series, or split session',
            ),

          // Work session specific parameters
          totalDuration: z
            .number()
            .optional()
            .describe(
              'Total duration in hours (required for work-with-breaks and split-session patterns)',
            ),
          breakDuration: z
            .number()
            .optional()
            .default(0.25)
            .describe('Break duration in hours (defaults to 15 minutes)'),
          workSegmentDuration: z
            .number()
            .optional()
            .default(1.25)
            .describe(
              'Duration of each work segment in hours (defaults to 75 minutes)',
            ),
        }),

        execute: async ({
          summary,
          description,
          startDateTime,
          endDateTime,
          attendees,
          eventPattern,
          totalDuration,
          breakDuration,
          workSegmentDuration,
        }) => {
          try {
            const userCalendarCreds =
              await prisma.userGoogleCalendar.findUnique({
                where: { userId },
              });

            if (!userCalendarCreds?.accessToken) {
              return {
                error:
                  'Google Calendar not connected. Please connect your calendar first.',
              };
            }

            // Set credentials
            oauth2Client.setCredentials({
              access_token: userCalendarCreds.accessToken,
              refresh_token: userCalendarCreds.refreshToken,
            });

            // Handle different event patterns
            let events: any[] = [];
            const baseStartTime = startDateTime || getCurrentDateTime();
            let currentTime = new Date(baseStartTime);
            switch (eventPattern) {
              case 'single':
                events = [
                  {
                    summary,
                    description,
                    startDateTime: baseStartTime,
                    endDateTime: endDateTime || addHours(baseStartTime, 1),
                    attendees,
                  },
                ];
                break;

              case 'work-with-breaks':
                if (!totalDuration) {
                  return {
                    error:
                      'Total duration is required for work sessions with breaks',
                  };
                }

                let remainingDuration = totalDuration;

                while (remainingDuration > 0) {
                  // Add work segment
                  const workDuration = Math.min(
                    workSegmentDuration,
                    remainingDuration,
                  );
                  events.push({
                    summary,
                    description,
                    startDateTime: currentTime.toISOString(),
                    endDateTime: addHours(
                      currentTime.toISOString(),
                      workDuration,
                    ),
                    attendees,
                  });

                  remainingDuration -= workDuration;
                  currentTime = new Date(
                    addHours(currentTime.toISOString(), workDuration),
                  );

                  // Add break if there's more work to come
                  if (remainingDuration > 0) {
                    events.push({
                      summary: 'Break',
                      startDateTime: currentTime.toISOString(),
                      endDateTime: addHours(
                        currentTime.toISOString(),
                        breakDuration,
                      ),
                    });
                    currentTime = new Date(
                      addHours(currentTime.toISOString(), breakDuration),
                    );
                  }
                }
                break;

              case 'split-session':
                if (!totalDuration) {
                  return {
                    error: 'Total duration is required for split sessions',
                  };
                }

                const segmentCount = Math.ceil(
                  totalDuration / workSegmentDuration,
                );

                for (let i = 0; i < segmentCount; i++) {
                  events.push({
                    summary: `${summary} - Part ${i + 1}`,
                    description,
                    startDateTime: currentTime.toISOString(),
                    endDateTime: addHours(
                      currentTime.toISOString(),
                      workSegmentDuration,
                    ),
                    attendees,
                  });

                  // Add break between segments if not the last segment
                  if (i < segmentCount - 1) {
                    currentTime = new Date(
                      addHours(currentTime.toISOString(), workSegmentDuration),
                    );
                    events.push({
                      summary: 'Break',
                      startDateTime: currentTime.toISOString(),
                      endDateTime: addHours(
                        currentTime.toISOString(),
                        breakDuration,
                      ),
                    });
                    currentTime = new Date(
                      addHours(currentTime.toISOString(), breakDuration),
                    );
                  }
                }
                break;
            }

            // Create all events
            const results: any[] = [];
            for (const event of events) {
              const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                  summary: event.summary,
                  description: event.description,
                  start: {
                    dateTime: event.startDateTime,
                  },
                  end: {
                    dateTime: event.endDateTime,
                  },
                  attendees: event.attendees?.map((email: string) => ({
                    email,
                  })),
                  recurrence: event.recurrence,
                },
              });

              const createdEvent = {
                id: response.data.id,
                summary: response.data.summary,
                description: response.data.description,
                start: response.data.start,
                end: response.data.end,
                link: response.data.htmlLink,
                attendees: response.data.attendees,
                recurrence: response.data.recurrence,
                status: 'created',
              };

              streamingData.append({
                type: 'calendar-event',
                content: {
                  id: createdEvent.id ?? null,
                  summary: createdEvent.summary ?? null,
                  description: createdEvent.description ?? null,
                  start: {
                    dateTime: createdEvent.start?.dateTime ?? null,
                    timeZone: createdEvent.start?.timeZone ?? null,
                  },
                  end: {
                    dateTime: createdEvent.end?.dateTime ?? null,
                    timeZone: createdEvent.end?.timeZone ?? null,
                  },
                  link: createdEvent.link ?? null,
                  attendees:
                    createdEvent.attendees?.map((attendee) => ({
                      email: attendee.email ?? null,
                      responseStatus: attendee.responseStatus ?? null,
                    })) ?? [],
                  recurrence: createdEvent.recurrence ?? [],
                },
              });

              results.push({
                eventId: createdEvent.id,
                summary: createdEvent.summary,
                description: createdEvent.description,
                start: createdEvent.start,
                end: createdEvent.end,
                link: createdEvent.link,
                attendees: createdEvent.attendees,
                recurrence: createdEvent.recurrence,
                status: 'Event created successfully',
              });
            }

            return results;
          } catch (error) {
            console.error('Failed to create calendar event:', error);
            return {
              error: `Failed to create calendar event: ${error}`,
            };
          }
        },
      },

      listCalendarEvents: {
        description:
          "List upcoming events from all of the user's Google Calendars",
        parameters: z.object({
          maxResults: z.number().optional(),
          timeMin: z.string().optional(),
          timeMax: z.string().optional(),
          showDeleted: z.boolean().optional(),
          orderBy: z.enum(['startTime', 'updated']).optional(),
          q: z.string().optional(),
        }),
        execute: async ({
          maxResults = 10,
          timeMin,
          timeMax,
          showDeleted = false,
          orderBy = 'startTime',
          q,
        }) => {
          try {
            // Retrieve user creds
            const userCalendarCreds =
              await prisma.userGoogleCalendar.findUnique({
                where: { userId },
              });

            if (!userCalendarCreds?.accessToken) {
              return {
                error:
                  'Google Calendar not connected. Please connect your calendar first.',
              };
            }

            oauth2Client.setCredentials({
              access_token: userCalendarCreds.accessToken,
              refresh_token: userCalendarCreds.refreshToken,
            });

            // Get all calendars for the user
            const calendarListResponse = await calendar.calendarList.list({
              auth: oauth2Client,
            });
            const userCalendars = calendarListResponse.data.items || [];

            let allEvents: any = [];

            for (const cal of userCalendars) {
              const response = await calendar.events.list({
                auth: oauth2Client,
                calendarId: cal.id as string,
                timeMin: timeMin || new Date().toISOString(),
                timeMax,
                maxResults,
                singleEvents: true,
                orderBy,
                showDeleted,
                q,
              });

              const events = response.data.items || [];
              const processedEvents = events.map((event) => ({
                calendarId: cal.id,
                id: event.id,
                summary: event.summary,
                description: event.description,
                start: event.start,
                end: event.end,
                location: event.location,
                creator: {
                  email: event.creator?.email,
                  displayName: event.creator?.displayName,
                },
                link: event.htmlLink,
                attendees: event.attendees?.map((attendee) => ({
                  email: attendee.email,
                  displayName: attendee.displayName,
                  responseStatus: attendee.responseStatus,
                })),
                hangoutLink: event.hangoutLink,
                conferenceData: event.conferenceData
                  ? {
                      type: event.conferenceData.conferenceSolution?.name,
                      link: event.conferenceData.entryPoints?.[0]?.uri,
                    }
                  : undefined,
                recurringEventId: event.recurringEventId,
                status: event.status,
              }));

              allEvents = [...allEvents, ...processedEvents];
            }

            // Optionally sort by start time
            allEvents.sort(
              (a: calendar_v3.Schema$Event, b: calendar_v3.Schema$Event) => {
                const aStart = new Date(
                  a.start?.dateTime || a.start?.date || 0,
                );
                const bStart = new Date(
                  b.start?.dateTime || b.start?.date || 0,
                );
                return aStart.getTime() - bStart.getTime();
              },
            );

            streamingData.append({
              type: 'calendar-events-list',
              content: allEvents,
            });

            return {
              events: allEvents,
              count: allEvents.length,
            };
          } catch (error) {
            console.error('Failed to list calendar events:', error);
            return {
              error: 'Failed to fetch calendar events',
            };
          }
        },
      },
    },
    onStepFinish: async (event) => {
      if (event.stepType === 'initial') {
        if (event.toolCalls && event.toolCalls.length > 0) {
          // Handle tool results
          event.toolResults.forEach((result) => {
            if (
              result.type === 'search-result' ||
              result.type === 'retrieval-result'
            ) {
              streamingData.append({
                type: result.type,
                content: result.result,
              });
            }
          });
        }
      }
    },

    onFinish: async ({ response }) => {
      try {
        const responseMessagesWithoutIncompleteToolCalls =
          sanitizeResponseMessages(response.messages);
        await saveMessages({
          messages: responseMessagesWithoutIncompleteToolCalls.map(
            (message) => {
              const messageId = generateUUID();

              if (message.role === 'assistant') {
                streamingData.appendMessageAnnotation({
                  messageIdFromServer: messageId,
                });
              }

              return {
                id: messageId,
                chatId: id,
                role: message.role,
                content: message.content ?? {},
                createdAt: new Date(),
              };
            },
          ) as Message[],
        });
      } catch (error) {
        console.error('Failed to save chat', error);
      }
      streamingData.close();
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({ data: streamingData });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const { userId } = await auth();

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const chat = await prisma.chat.findUnique({
    where: { id },
  });

  if (!chat || chat.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Delete in correct order to handle relations
    await prisma.$transaction([
      // First delete votes
      prisma.vote.deleteMany({
        where: { chatId: id },
      }),
      // Then delete messages
      prisma.message.deleteMany({
        where: { chatId: id },
      }),
      // Finally delete the chat
      prisma.chat.delete({
        where: { id },
      }),
    ]);

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('Failed to delete chat:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
