// Expo Router API Route — POST /api/auth/google/mobile
//
// Called by the native Expo app after the user completes Google sign-in via expo-auth-session.
// Accepts the Google ID token, verifies it server-side, finds or creates the user in the shared
// Postgres database, and returns:
//   • `user`  — safe user object (no password)
//   • `token` — signed JWT the mobile app stores in SecureStore and sends as Bearer token
//
// ENV VARS REQUIRED (add to examsvalley .env and EAS Secrets):
//   DATABASE_URL           — shared Postgres connection string (same as upriser-web)
//   JWT_SECRET             — random 64-char string; keep in sync with upriser-web's JWT_SECRET
//   GOOGLE_CLIENT_ID       — web client ID from Google Cloud Console
//   GOOGLE_IOS_CLIENT_ID   — iOS client ID
//   GOOGLE_ANDROID_CLIENT_ID — Android client ID
//
// UPRISER-WEB WIRING (one-time, one line):
//   Add the JWT middleware to upriser-web so its APIs accept the mobile Bearer token:
//   1. Copy  server/jwt-mobile-auth.ts  (already created alongside this file)
//   2. In upriser-web/server/index.ts (or routes.ts), add:
//        import { jwtMobileAuth } from "./jwt-mobile-auth.js";
//        app.use(jwtMobileAuth);   // before your route registrations
//   That's it — upriser-web will then recognise the same JWT and set req.session.userId.

import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

// ── In-memory rate limiter: 5 requests per IP per minute ──────────────────────
const _rl = new Map<string, { n: number; reset: number }>();
function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const entry = _rl.get(ip);
  if (!entry || now > entry.reset) {
    _rl.set(ip, { n: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.n >= 5) return false;
  entry.n++;
  return true;
}
// Clean up stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _rl) if (now > v.reset) _rl.delete(k);
}, 5 * 60_000);
import { getUserByGoogleId, getUserByEmail, createUser, updateUser } from "@/server/userStorage";
import { determineRoleFromEmail } from "@/server/role-manager";

const JWT_EXPIRY = "30d";

function getAcceptedAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[];
}

function safeUser(user: Record<string, any>) {
  const { password, emailVerificationToken, ...safe } = user;
  return safe;
}

export async function POST(request: Request) {
  // Rate limit by IP (cf-connecting-ip → x-forwarded-for → fallback)
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  if (!rateLimitOk(ip)) {
    return Response.json({ message: "Too many requests — try again in a minute" }, { status: 429 });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("[mobile-auth] JWT_SECRET not set");
    return Response.json({ message: "Server misconfigured" }, { status: 500 });
  }

  const audiences = getAcceptedAudiences();
  if (audiences.length === 0) {
    console.error("[mobile-auth] No Google client IDs configured");
    return Response.json({ message: "Google OAuth not configured on server" }, { status: 500 });
  }

  let body: { idToken?: string; accessToken?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { idToken } = body;
  if (!idToken) {
    return Response.json({ message: "idToken is required" }, { status: 400 });
  }

  // 1. Verify the Google ID token
  let googleId: string;
  let email: string;
  let name: string | undefined;
  let picture: string | undefined;

  try {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken, audience: audiences });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("Empty payload");

    googleId = payload.sub;
    email = payload.email!;
    name = payload.name;
    picture = payload.picture;

    if (!email) {
      return Response.json({ message: "Google account has no email" }, { status: 400 });
    }
  } catch (err) {
    console.error("[mobile-auth] Token verification failed:", err);
    return Response.json({ message: "Invalid Google token" }, { status: 401 });
  }

  // 2. Find or create the user (mirror of upriser-web's setupGoogleAuth logic)
  try {
    let user = await getUserByGoogleId(googleId);

    if (!user) {
      user = await getUserByEmail(email) ?? null;
      if (user) {
        // Link Google to existing email account
        user = (await updateUser(user.id, {
          googleId,
          authProvider: user.authProvider === "local" ? "both" : user.authProvider,
        })) ?? user;
      } else {
        // Brand-new user
        const role = determineRoleFromEmail(email);
        user = await createUser({
          email,
          name: name || email.split("@")[0],
          googleId,
          authProvider: "google",
          avatar: picture ?? null,
          role,
          isActive: true,
          isEmailVerified: true, // Google accounts are pre-verified
          isApproved: true,
        });
      }
    }

    if (!user) {
      return Response.json({ message: "Failed to create or retrieve user" }, { status: 500 });
    }

    if (!user.isActive) {
      return Response.json({ message: "Account is disabled" }, { status: 403 });
    }

    // 3. Issue JWT
    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      jwtSecret,
      { expiresIn: JWT_EXPIRY }
    );

    return Response.json({ user: safeUser(user as any), token }, { status: 200 });
  } catch (err) {
    console.error("[mobile-auth] Database error:", err);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
