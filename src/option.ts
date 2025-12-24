export class Some<T> {
  readonly _: "some" = "some";

  constructor(public readonly value: T) {}

  isSome(): true {
    return true;
  }

  isNone(): false {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_defaultFn: () => T): T {
    return this.value;
  }

  expect(_message: string): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return some(fn(this.value));
  }

  mapOr<U>(_defaultValue: U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  mapOrElse<U>(_defaultFn: () => U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }

  or(_opt: Option<T>): Option<T> {
    return this;
  }

  orElse(_fn: () => Option<T>): Option<T> {
    return this;
  }

  match<U>(pattern: { some: (value: T) => U; none: () => U }): U {
    return pattern.some(this.value);
  }
}

export class None<T> {
  readonly _: "none" = "none";

  isSome(): false {
    return false;
  }

  isNone(): true {
    return true;
  }

  unwrap(): T {
    throw new Error("None.unwrap()");
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse(defaultFn: () => T): T {
    return defaultFn();
  }

  expect(message: string): T {
    throw new Error(message);
  }

  map<U>(_value: (value: T) => U): Option<U> {
    return this as unknown as Option<U>;
  }

  mapOr<U>(defaultValue: U, _value: (value: T) => U): U {
    return defaultValue;
  }

  mapOrElse<U>(defaultFn: () => U, _value: (value: T) => U): U {
    return defaultFn();
  }

  andThen<U>(_value: (value: T) => Option<U>): Option<U> {
    return this as unknown as Option<U>;
  }

  or(opt: Option<T>): Option<T> {
    return opt;
  }

  orElse(defaultFn: () => Option<T>): Option<T> {
    return defaultFn();
  }

  match<U>(pattern: { some: (value: T) => U; none: () => U }): U {
    return pattern.none();
  }
}

export type Option<T> = Some<T> | None<T>;

export function some<T>(value: T): Option<T> {
  return new Some<T>(value);
}

export function none<T>(): Option<T> {
  return new None<T>();
}
