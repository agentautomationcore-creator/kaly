/**
 * Dev-only logging. No logs in production builds.
 */
export const log = __DEV__
  ? (...args: unknown[]) => console.log(...args)
  : (..._args: unknown[]) => {};
