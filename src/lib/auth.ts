import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const SESSION_COOKIE = "admin_crm_session";

export type SessionUser = {
  staffId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  homeTenantId: string;
  homeTenantSlug: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await readSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/** Login against staff_users in DB (any tenant). Cross-tenant CRM access after login. */
export async function authenticateStaff(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const candidates = await prisma.staffUser.findMany({
    where: { email, isActive: true },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
  });

  for (const staff of candidates) {
    const ok = await bcrypt.compare(password, staff.passwordHash);
    if (!ok) continue;
    return {
      staffId: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      homeTenantId: staff.tenantId,
      homeTenantSlug: staff.tenant.slug,
    } satisfies SessionUser;
  }
  return null;
}
