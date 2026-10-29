import type { MessageKey } from '../i18n/messages/en-US';
import type { Translator } from '../i18n/translate';
import { supabase } from './client';

export type AuthField = 'email' | 'password' | 'code' | 'name';
// `key` names the message to show; the screen translates it.
export type AuthFailure = { key: MessageKey; field: AuthField | null };

const unknown: AuthFailure = { key: 'auth.error.unknown', field: null };

// Supabase error codes mapped to what the person can do about them.
const failures: Record<string, AuthFailure> = {
  invalid_credentials: { key: 'auth.error.invalid_credentials', field: null },
  email_not_confirmed: { key: 'auth.error.email_not_confirmed', field: null },
  email_address_invalid: { key: 'auth.error.email_address_invalid', field: 'email' },
  otp_expired: { key: 'auth.error.otp_expired', field: 'code' },
  weak_password: { key: 'auth.error.weak_password', field: 'password' },
  same_password: { key: 'auth.error.same_password', field: 'password' },
  signup_disabled: { key: 'auth.error.signup_disabled', field: 'email' },
  over_request_rate_limit: { key: 'auth.error.over_request_rate_limit', field: null },
  over_email_send_rate_limit: { key: 'auth.error.over_email_send_rate_limit', field: null },
};

const explain = (error: { code?: string } | null): AuthFailure | null =>
  error && ((error.code && failures[error.code]) || unknown);

export const messageFor = (t: Translator, failure: AuthFailure | null, field: AuthField) =>
  failure?.field === field ? t(failure.key) : undefined;

// Unknown emails get a new Supabase user here; it becomes an account in createAccount.
export async function sendCode(email: string): Promise<AuthFailure | null> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return explain(error);
}

export async function verifyCode(email: string, code: string): Promise<AuthFailure | null> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  return explain(error);
}

export async function signIn(email: string, password: string): Promise<AuthFailure | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return explain(error);
}

// An account is a verified user with a name. An optional password lets them skip the code next time.
export async function createAccount(name: string, password: string): Promise<AuthFailure | null> {
  if (!name) return { key: 'auth.error.name_required', field: 'name' };
  const { error } = await supabase.auth.updateUser(password ? { password, data: { name } } : { data: { name } });
  return explain(error);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
