// Expo Router API Route — POST /api/auth/refresh
//
// Silently issues a new JWT when the current one is expiring (< 7 days remaining).
// Called by AuthContext on app launch after restoring a stored token.
// The client sends:  Authorization: Bearer <current_jwt>
// Response:          { token: <new_jwt> }
//
// ENV VARS: JWT_SECRET (same as mobile+api.ts)

import jwt from "jsonwebtoken";
import { getUser } from "@/server/userStorage";

const JWT_EXPIRY = "30d";

export async function POST(request: Request) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return Response.json({ message: "Server misconfigured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return Response.json({ message: "Missing token" }, { status: 401 });
  }
  const oldToken = auth.slice(7);

  let payload: any;
  try {
    payload = jwt.verify(oldToken, secret);
  } catch {
    return Response.json({ message: "Token invalid or expired" }, { status: 401 });
  }

  // Re-fetch user to ensure they're still active
  const user = await getUser(payload.sub).catch(() => null);
  if (!user || !user.isActive) {
    return Response.json({ message: "Account not found or disabled" }, { status: 403 });
  }

  const newToken = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn: JWT_EXPIRY }
  );

  return Response.json({ token: newToken }, { status: 200 });
}
