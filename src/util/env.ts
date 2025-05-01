export const getEnv = function (name: string) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return val;
};
