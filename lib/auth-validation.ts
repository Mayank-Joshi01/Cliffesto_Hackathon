export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const FULL_NAME_MAX_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Email address is required.";
  if (normalized.length > 254) return "Email address must be 254 characters or fewer.";
  if (!EMAIL_PATTERN.test(normalized)) return "Please enter a valid email address.";
  return "";
}

export function validateFullName(value: string) {
  const normalized = value.trim();
  if (!normalized) return "Full name is required.";
  if ([...normalized].length > FULL_NAME_MAX_LENGTH) return "Name must be 100 characters or fewer.";
  return "";
}

export function validateSignupPassword(value: string) {
  if (!value) return "Password is required.";
  const length = [...value].length;
  if (length < PASSWORD_MIN_LENGTH) return "Password must be at least 8 characters long.";
  if (length > PASSWORD_MAX_LENGTH) return "Password must be 128 characters or fewer.";
  return "";
}

export function validatePasswordConfirmation(password: string, confirmation: string) {
  if (!confirmation) return "Please confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return "";
}

export function validateLoginPassword(value: string) {
  if (!value) return "Password is required.";
  if ([...value].length < PASSWORD_MIN_LENGTH) return "Password must be at least 8 characters long.";
  if ([...value].length > PASSWORD_MAX_LENGTH) return "Password must be 128 characters or fewer.";
  return "";
}

export function isValidCredentials(email: unknown, password: unknown) {
  return typeof email === "string" &&
    !validateEmail(email) &&
    typeof password === "string" &&
    !validateLoginPassword(password);
}

export type LoginInput = { email: string; password: string };
export type SignupInput = LoginInput & { fullName: string; confirmation: string };

export function getLoginInputError(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "Enter a valid sign-in request.";
  const payload = value as Record<string, unknown>;
  if (typeof payload.email !== "string") return "Email address is required.";
  const emailError = validateEmail(payload.email);
  if (emailError) return emailError;
  if (typeof payload.password !== "string") return "Password is required.";
  return validateLoginPassword(payload.password);
}

export function getSignupInputError(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "Enter a valid signup request.";
  const payload = value as Record<string, unknown>;
  if (typeof payload.fullName !== "string") return "Full name is required.";
  const fullNameError = validateFullName(payload.fullName);
  if (fullNameError) return fullNameError;
  if (typeof payload.email !== "string") return "Email address is required.";
  const emailError = validateEmail(payload.email);
  if (emailError) return emailError;
  if (typeof payload.password !== "string") return "Password is required.";
  const passwordError = validateSignupPassword(payload.password);
  if (passwordError) return passwordError;
  if (typeof payload.confirmation !== "string") return "Please confirm your password.";
  return validatePasswordConfirmation(payload.password, payload.confirmation);
}

export function isValidLoginInput(value: unknown): value is LoginInput {
  return getLoginInputError(value) === "";
}

export function isValidSignupInput(value: unknown): value is SignupInput {
  return getSignupInputError(value) === "";
}
