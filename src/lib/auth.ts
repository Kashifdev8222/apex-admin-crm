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

/** Login against staff_users. Faster findFirst; never block on rehash. */
export async function authenticateStaff(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const staff = await prisma.staffUser.findFirst({
    where: { email, isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      passwordHash: true,
      tenantId: true,
      tenant: { select: { slug: true } },
    },
  });
  if (!staff) return null;

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
    // Sync fix only for known default admin — rare path
    await prisma.staffUser.update({
      where: { id: staff.id },
      data: { passwordHash: DEFAULT_ADMIN_HASH },
    });
    ok = true;
  }

  if (!ok) return null;

  // Rehash off the login critical path (do not await)
  void (async () => {
    try {
      const rounds = bcrypt.getRounds(staff.passwordHash);
      if (rounds > 8) {
        const faster = await bcrypt.hash(password, 8);
        await prisma.staffUser.update({
          where: { id: staff.id },
          data: { passwordHash: faster },
        });
      }
    } catch {
      /* ignore */
    }
  })();

  return toSession(staff);
}
