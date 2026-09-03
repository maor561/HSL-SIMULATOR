import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";

const COOKIE = "sim320_admin";
const MAX_AGE = 60 * 60 * 12; // 12 שעות

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** בודק סיסמת אדמין מול משתנה הסביבה */
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set");
  return safeEqual(input, expected);
}

export async function createSession(): Promise<void> {
  const issued = Date.now().toString();
  const value = `${issued}.${sign(issued)}`;
  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [issued, mac] = raw.split(".");
  if (!issued || !mac) return false;
  if (!safeEqual(mac, sign(issued))) return false;
  const age = Date.now() - Number(issued);
  return age >= 0 && age <= MAX_AGE * 1000;
}

/** לשימוש ב-layout/עמודי אדמין — מפנה ללוגין אם אין הרשאה */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}
