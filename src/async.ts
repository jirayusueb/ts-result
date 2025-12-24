import type { Result } from "./result.js";
import { ok, err } from "./result.js";

export async function fromPromise<T, E>(
  promise: Promise<T>,
  errorMapper: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(errorMapper(error));
  }
}

export async function toPromise<T, E>(result: Promise<Result<T, E>>): Promise<T> {
  const resolved = await result;
  return resolved.unwrap();
}

export async function toPromiseOr<T, E>(
  result: Promise<Result<T, E>>,
  defaultValue: T
): Promise<T> {
  const resolved = await result;
  return resolved.unwrapOr(defaultValue);
}
