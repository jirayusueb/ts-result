import type { Result } from "./result.js";
import type { Option } from "./option.js";
import { ok, err } from "./result.js";
import { some, none } from "./option.js";

export function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error as E);
  }
}

export function all<T, E>(results: Array<Result<T, E>>): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (result.isErr()) {
      return err(result.error);
    }
    values.push(result.value);
  }
  return ok(values);
}

export function any<T, E>(results: Array<Result<T, E>>): Result<T, E> {
  for (const result of results) {
    if (result.isOk()) {
      return result;
    }
  }
  return err(results[0]?.error ?? (undefined as E));
}

export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value == null ? none() : some(value);
}

export function toNullable<T>(option: Option<T>): T | null {
  return option.isNone() ? null : option.unwrap();
}

export function fromArray<T>(array: T[]): Option<[T, ...T[]]> {
  return array.length === 0 ? none() : some(array as [T, ...T[]]);
}

export function toArray<T>(option: Option<T>): T[] {
  return option.isNone() ? [] : [option.unwrap()];
}
