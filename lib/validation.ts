const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateLoginFields(email: string, password: string): string | null {
  if (!isNonEmpty(email)) return 'Email is required';
  if (!isValidEmail(email)) return 'Enter a valid email address';
  if (!isNonEmpty(password)) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateSignupFields(email: string, password: string, name: string): string | null {
  const base = validateLoginFields(email, password);
  if (base) return base;
  if (!isNonEmpty(name)) return 'Name is required';
  return null;
}
