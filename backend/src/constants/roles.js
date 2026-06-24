export const ROLE_KEYS = Object.freeze({
  SUPER_ADMIN: "super_admin",
  PRINCIPAL: "principal",
  ADMINISTRATOR: "administrator",
  ACCOUNTANT: "accountant",
  TEACHER: "teacher",
});

export const SYSTEM_ROLES = Object.freeze([
  {
    name: "Super Admin",
    key: ROLE_KEYS.SUPER_ADMIN,
    description: "Full system access",
    sortOrder: 1,
  },
  {
    name: "Principal",
    key: ROLE_KEYS.PRINCIPAL,
    description: "School leadership and analytics access",
    sortOrder: 2,
  },
  {
    name: "Administrator",
    key: ROLE_KEYS.ADMINISTRATOR,
    description: "School operations access",
    sortOrder: 3,
  },
  {
    name: "Accountant",
    key: ROLE_KEYS.ACCOUNTANT,
    description: "Fee analytics access",
    sortOrder: 4,
  },
  {
    name: "Teacher",
    key: ROLE_KEYS.TEACHER,
    description: "Teacher access",
    sortOrder: 5,
  },
]); 