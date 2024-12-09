// app/api/google-calendar/verify/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const prisma = new PrismaClient();

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export async function GET() {
  const { userId } = await auth();
  try {
    // Get the current session

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's Google Calendar credentials
    const userGoogleCalendar = await prisma.userGoogleCalendar.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!userGoogleCalendar) {
      return NextResponse.json({
        isConnected: false,
        message: "No Google Calendar connection found",
      });
    }

    // Check if token is expired
    const isTokenExpired = new Date() > userGoogleCalendar.tokenExpiry;

    if (isTokenExpired) {
      try {
        // Set the refresh token
        oauth2Client.setCredentials({
          refresh_token: userGoogleCalendar.refreshToken,
        });

        // Get new access token
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update the database with new tokens
        await prisma.userGoogleCalendar.update({
          where: {
            userId: userId,
          },
          data: {
            accessToken: credentials.access_token!,
            refreshToken:
              credentials.refresh_token || userGoogleCalendar.refreshToken,
            tokenExpiry: new Date(credentials.expiry_date!),
          },
        });

        return NextResponse.json({
          isConnected: true,
          message: "Connected with refreshed token",
        });
      } catch (error) {
        console.error("Error refreshing token:", error);
        return NextResponse.json({
          isConnected: false,
          message: "Token refresh failed",
        });
      }
    }

    // Test the connection by making a simple API call
    oauth2Client.setCredentials({
      access_token: userGoogleCalendar.accessToken,
      refresh_token: userGoogleCalendar.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Try to list calendars (minimal request to verify access)
    await calendar.calendarList.list({
      maxResults: 1,
    });

    return NextResponse.json({
      isConnected: true,
      message: "Successfully connected to Google Calendar",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        isConnected: false,
        message: "Failed to verify Google Calendar connection",
      },
      { status: 500 }
    );
  }
}
