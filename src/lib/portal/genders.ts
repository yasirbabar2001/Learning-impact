/** Gender options offered at sign-up and in the profile (shared by forms and validation). */
export const GENDERS = ["Female", "Male", "Prefer not to say"] as const;
export type Gender = (typeof GENDERS)[number];
