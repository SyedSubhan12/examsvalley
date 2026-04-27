// Module-level singleton so queryClient can read the JWT synchronously.
// AuthContext calls setAccessToken after login/restore; queryClient reads it on every request.

let _token: string | null = null;

export function setAccessToken(token: string | null) {
  _token = token;
}

export function getAccessToken(): string | null {
  return _token;
}
