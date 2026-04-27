// COPIED FROM: upriser-web/server/role-manager.ts (verbatim)
// PURPOSE:     Role determination logic for new user registration via Google OAuth.

export type UserRole = "student" | "teacher" | "admin";

export interface RoleConfig {
  adminEmails: string[];
  teacherDomains: string[];
  teacherEmailPatterns: RegExp[];
  studentDomains: string[];
  studentEmailPatterns: RegExp[];
  defaultRole: UserRole;
  requireTeacherApproval: boolean;
}

const defaultRoleConfig: RoleConfig = {
  adminEmails: [],
  teacherDomains: [],
  teacherEmailPatterns: [],
  studentDomains: [],
  studentEmailPatterns: [],
  defaultRole: "student",
  requireTeacherApproval: false,
};

export function determineRoleFromEmail(
  email: string,
  config: RoleConfig = defaultRoleConfig
): UserRole {
  const lc = email.toLowerCase();

  if (config.adminEmails.some((e) => e.toLowerCase() === lc)) return "admin";

  const isTeacher =
    config.teacherDomains.some((d) => lc.endsWith(`@${d.toLowerCase()}`)) ||
    config.teacherEmailPatterns.some((p) => p.test(lc));
  if (isTeacher) return "teacher";

  const isStudent =
    config.studentDomains.some((d) => lc.endsWith(`@${d.toLowerCase()}`)) ||
    config.studentEmailPatterns.some((p) => p.test(lc));
  if (isStudent) return "student";

  return config.defaultRole;
}
