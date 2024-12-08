import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Get a fresh token using the authorization code
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });

    if (!tokens.access_token || !tokens.expiry_date) {
      return NextResponse.json(
        { error: "Invalid token response from Google" },
        { status: 500 }
      );
    }

    // The state parameter contains the Clerk user ID
    await prisma.userGoogleCalendar.upsert({
      where: { userId: state },
      create: {
        id: crypto.randomUUID(),
        userId: state,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        tokenExpiry: new Date(tokens.expiry_date),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: new Date(tokens.expiry_date),
      },
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Error during Google Calendar authentication:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
