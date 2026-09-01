const projectRef = process.env.SUPABASE_PROJECT_REF || 'kmxskknkdceviavccnpo';
export const supabaseUrl = (process.env.SUPABASE_URL || `https://${projectRef}.supabase.co`).replace(/\/$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

export interface StaffIdentity {
  userId: string;
  email?: string;
  storeId: string | null;
  fullName: string;
  role: 'owner' | 'admin' | 'manager' | 'kitchen' | 'dispatcher' | 'viewer';
}

export const isSupabaseConfigured = () => Boolean(serviceRoleKey && anonKey);

const assertConfigured = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Defina SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no servidor.');
  }
};

export async function supabaseRest<T = any>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    query?: string;
    body?: unknown;
    prefer?: string;
    accessToken?: string;
  } = {}
): Promise<T> {
  assertConfigured();
  const method = options.method || 'GET';
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${options.query ? `?${options.query}` : ''}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${options.accessToken || serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || (method === 'GET' ? 'count=none' : 'return=representation')
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${table} (${response.status}): ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function signInStaff(email: string, password: string) {
  assertConfigured();
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error_description || payload?.msg || 'E-mail ou senha inválidos.');

  const staff = await loadStaffIdentity(payload.access_token);
  if (!staff) throw new Error('Usuário autenticado, mas sem perfil ativo na equipe.');

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
    expiresAt: payload.expires_at,
    staff
  };
}

export async function loadStaffIdentity(accessToken: string): Promise<StaffIdentity | null> {
  assertConfigured();
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }
  });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();

  const profiles = await supabaseRest<any[]>('staff_profiles', {
    query: `select=user_id,store_id,full_name,role,active&user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&limit=1`
  });
  if (!profiles[0]) return null;

  return {
    userId: user.id,
    email: user.email,
    storeId: profiles[0].store_id,
    fullName: profiles[0].full_name,
    role: profiles[0].role
  };
}
