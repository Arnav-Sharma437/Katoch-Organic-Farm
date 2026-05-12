import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signAdminJwt() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminJwt(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as { role?: string };
}

export function getAdminTokenFromCookies(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value;
}

export async function assertAdminFromCookies(): Promise<boolean> {
  const token = getAdminTokenFromCookies();
  if (!token) return false;
  try {
    await verifyAdminJwt(token);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
