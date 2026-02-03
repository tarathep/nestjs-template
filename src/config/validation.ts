type Env = Record<string, any>;

function requireString(env: Env, key: string) {
  const v = env[key];
  if (!v || typeof v !== 'string' || v.trim().length === 0) {
    throw new Error(`Missing required env: ${key}`);
  }
}

function optionalNumber(env: Env, key: string) {
  const v = env[key];
  if (v === undefined) return;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Env ${key} must be a number`);
}

function optionalBool(env: Env, key: string) {
  const v = env[key];
  if (v === undefined) return;
  if (v !== 'true' && v !== 'false') throw new Error(`Env ${key} must be 'true' or 'false'`);
}

export function validateEnv(env: Env) {
  requireString(env, 'JWT_ACCESS_SECRET');
  requireString(env, 'JWT_REFRESH_SECRET');

  requireString(env, 'DB_TYPE');
  requireString(env, 'DB_HOST');
  requireString(env, 'DB_USERNAME');
  requireString(env, 'DB_NAME');
  optionalNumber(env, 'PORT');
  optionalNumber(env, 'DB_PORT');

  optionalBool(env, 'DB_SYNCHRONIZE');
  optionalBool(env, 'DB_LOGGING');

  return env;
}
