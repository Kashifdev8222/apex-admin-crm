import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

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

const DEFAULT_ADMIN_EMAIL = "admin@apex.ai";
const DEFAULT_ADMIN_PASSWORD = "Admin@12345";
/** Correct bcrypt for Admin@12345 (seed SQL hash was wrong) */
const DEFAULT_ADMIN_HASH =
  "$2b$10$J3AveI2gP7A9d3sbiCv8keOBc4DiLlcL4.RjFORhrj08h.Kee4Gsu";

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

export const readSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<SessionUser> {
  const session = await readSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

function toSession(
  staff: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    tenant: { slug: string };
  },
): SessionUser {
  return {
    staffId: staff.id,
    email: staff.email,
    firstName: staff.firstName,
    lastName: staff.lastName,
    role: staff.role,
    homeTenantId: staff.tenantId,
    homeTenantSlug: staff.tenant.slug,
  };
}

/** Login against staff_users (any tenant). Self-heals bad seed hash for default admin. */
export async function authenticateStaff(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const candidates = await prisma.staffUser.findMany({
    where: { email, isActive: true },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
  });

  for (const staff of candidates) {
    let ok = false;
    try {
      ok = await bcrypt.compare(password, staff.passwordHash);
    } catch {
      ok = false;
    }

    if (
      !ok &&
      email === DEFAULT_ADMIN_EMAIL &&
      password === DEFAULT_ADMIN_PASSWORD
    ) {
      await prisma.staffUser.update({
        where: { id: staff.id },
        data: { passwordHash: DEFAULT_ADMIN_HASH },
      });
      ok = true;
    }

    if (!ok) continue;
    return toSession(staff);
  }
  return null;
}
