export interface LocalUser {
  uid: string;
  email: string;
  displayName: string | null;
}

const AUTH_KEY = "lumio_auth";

export function getStoredUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: LocalUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export async function localSignUp(
  email: string,
  password: string,
  displayName: string
): Promise<LocalUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Signup failed");
  }
  const user: LocalUser = await res.json();
  storeUser(user);
  return user;
}

export async function localSignIn(
  email: string,
  password: string
): Promise<LocalUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Login failed");
  }
  const user: LocalUser = await res.json();
  storeUser(user);
  return user;
}

export function localSignOut() {
  storeUser(null);
}
