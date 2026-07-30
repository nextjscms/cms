import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export type Role = 'admin' | 'editor' | 'author' | 'subscriber';

// Define a numeric hierarchy to easily check if a role is "greater than or equal to" another
const roleHierarchy: Record<Role, number> = {
  admin: 100,
  editor: 50,
  author: 20,
  subscriber: 10,
};

/**
 * Checks if the current user has the required permission level.
 */
export async function hasPermission(requiredRole: Role): Promise<boolean> {
  // In MVP, we mock the session for demonstration if auth is not fully configured,
  // but normally we do: const session = await auth();
  const session = await auth();
  
  if (!session?.user?.role) {
    return false;
  }
  
  const userRole = session.user.role as Role;
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 100;
  
  return userLevel >= requiredLevel;
}

/**
 * Enforces a role requirement for a page. Redirects if unauthorized.
 */
export async function requireRole(role: Role) {
  const authorized = await hasPermission(role);
  if (!authorized) {
    redirect('/admin'); // Redirect back to dashboard if unauthorized
  }
}
