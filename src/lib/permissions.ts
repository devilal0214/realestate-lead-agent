// Role definitions and permission checks
export type Role = 'owner' | 'admin' | 'manager' | 'member' | 'viewer'

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canManageMembers(role: Role): boolean {
  return hasRole(role, 'admin')
}

export function canManageChatbots(role: Role): boolean {
  return hasRole(role, 'manager')
}

export function canViewLeads(role: Role): boolean {
  return hasRole(role, 'viewer')
}

export function canManageLeads(role: Role): boolean {
  return hasRole(role, 'member')
}

export function canManageOrganization(role: Role): boolean {
  return hasRole(role, 'admin')
}

export function isOwner(role: Role): boolean {
  return role === 'owner'
}

export const ROLES: Role[] = ['owner', 'admin', 'manager', 'member', 'viewer']
