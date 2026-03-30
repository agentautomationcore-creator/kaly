/**
 * Dev-only logging. No logs in production builds.
 */
export const log = __DEV__
  ? (...args: any[]) => console.log(...args)
  : (..._args: any[]) => {};
