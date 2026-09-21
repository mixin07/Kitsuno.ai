export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
})

const ROLE_HOME_PATH = Object.freeze({
  [ROLES.STUDENT]: '/student',
  [ROLES.INSTRUCTOR]: '/instructor',
  [ROLES.ADMIN]: '/admin',
})

export function normalizeRole(role) {
  return String(role ?? '').toUpperCase()
}

export function roleHomePath(role) {
  return ROLE_HOME_PATH[normalizeRole(role)] || '/'
}

export function isRoleAllowed(userRole, allowedRoles) {
  return allowedRoles.includes(normalizeRole(userRole))
}