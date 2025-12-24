import type { Option } from "./option.js";
import { none, some } from "./option.js";

export class Ok<T, E> {
  readonly _: "ok" = "ok";

  constructor(public readonly value: T) {}

  isOk(): true {
    return true;
  }

  isErr(): false {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_: T): T {
    return this.value;
  }

  unwrapOrElse(_: (err: E) => T): T {
    return this.value;
  }

  expect(_message: string): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  mapErr<F>(_: (err: E) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  orElse<F>(_: (err: E) => Result<T, F>): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  and<U>(res: Result<U, E>): Result<U, E> {
    return res;
  }

  or<F>(_res: Result<T, F>): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  ok(): Option<T> {
    return some(this.value);
  }

  err(): Option<E> {
    return none();
  }

  match<U>(pattern: { ok: (value: T) => U; err: (error: E) => U }): U {
    return pattern.ok(this.value);
  }

  asyncThen<U>(fn: (value: T) => Promise<Result<U, E>>): Promise<Result<U, E>> {
    return fn(this.value);
  }

  asyncOrElse<F>(_: (err: E) => Promise<Result<T, F>>): Promise<Result<T, F>> {
    return Promise.resolve(this as unknown as Result<T, F>);
  }
}

export class Err<T, E> {
  readonly _: "err" = "err";

  constructor(public readonly error: E) {}

  isOk(): false {
    return false;
  }

  isErr(): true {
    return true;
  }

  unwrap(): T {
    throw new Error(String(this.error));
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse(fn: (err: E) => T): T {
    return fn(this.error);
  }

  expect(message: string): T {
    throw new Error(`${message}: ${String(this.error)}`);
  }

  map<U>(_: (value: T) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return err(fn(this.error));
  }

  andThen<U>(_: (value: T) => Result<U, E>): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  orElse<F>(fn: (err: E) => Result<T, F>): Result<T, F> {
    return fn(this.error);
  }

  and<U>(_: Result<U, E>): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  or<F>(res: Result<T, F>): Result<T, F> {
    return res;
  }

  ok(): Option<T> {
    return none();
  }

  err(): Option<E> {
    return some(this.error);
  }

  match<U>(pattern: { ok: (value: T) => U; err: (error: E) => U }): U {
    return pattern.err(this.error);
  }

  asyncThen<U>(_: (value: T) => Promise<Result<U, E>>): Promise<Result<U, E>> {
    return Promise.resolve(this as unknown as Result<U, E>);
  }

  asyncOrElse<F>(fn: (err: E) => Promise<Result<T, F>>): Promise<Result<T, F>> {
    return fn(this.error);
  }
}

export type Result<T, E> = Ok<T, E> | Err<T, E>;

export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok<T, E>(value);
}

export function err<T = never, E>(error: E): Result<T, E> {
  return new Err<T, E>(error);
}
