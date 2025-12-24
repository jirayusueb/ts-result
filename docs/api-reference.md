# API Reference

Complete API documentation for `@ts-result`.

## Table of Contents

- [Result\<T, E>](#resultt-e)
- [Option\<T>](#optiont)
- [Match Function](#match-function)
- [Async Utilities](#async-utilities)
- [Utility Functions](#utility-functions)
- [Predicates](#predicates)

---

## Result\<T, E>

Type-safe error handling with Ok and Err variants.

### Classes

#### Ok\<T, E>

Represents a successful result containing a value of type `T`.

```typescript
class Ok<T, E> {
  readonly _: 'ok' = 'ok'
  constructor(public readonly value: T)
}
```

**Constructor**:
- `new Ok<T, E>(value: T): Ok<T, E>` - Creates an Ok result

#### Err\<T, E>

Represents an error containing a value of type `E`.

```typescript
class Err<T, E> {
  readonly _: 'err' = 'err'
  constructor(public readonly error: E)
}
```

**Constructor**:
- `new Err<T, E>(error: E): Err<T, E>` - Creates an Err result

#### Type Alias

```typescript
type Result<T, E> = Ok<T, E> | Err<T, E>
```

### Methods

#### isOk()

Checks if the result is Ok.

```typescript
isOk(): this is Ok<T, E>
```

**Returns**: `true` if Ok, `false` if Err

**Example**:
```typescript
const result = ok(42)
result.isOk() // true

const error = err('failed')
error.isOk() // false
```

---

#### isErr()

Checks if the result is Err.

```typescript
isErr(): this is Err<T, E>
```

**Returns**: `true` if Err, `false` if Ok

**Example**:
```typescript
const error = err('failed')
error.isErr() // true

const result = ok(42)
result.isErr() // false
```

---

#### unwrap()

Returns the contained value or throws an error.

```typescript
unwrap(): T
```

**Throws**: Error if the result is Err

**Example**:
```typescript
ok(42).unwrap() // 42
err('failed').unwrap() // throws Error: failed
```

---

#### unwrapOr()

Returns the contained value or a default.

```typescript
unwrapOr(defaultValue: T): T
```

**Parameters**:
- `defaultValue: T` - Value to return if Err

**Returns**: The value if Ok, otherwise `defaultValue`

**Example**:
```typescript
ok(42).unwrapOr(0) // 42
err('failed').unwrapOr(0) // 0
```

---

#### unwrapOrElse()

Returns the contained value or computes a default.

```typescript
unwrapOrElse(fn: (error: E) => T): T
```

**Parameters**:
- `fn: (error: E) => T` - Function to compute default value

**Returns**: The value if Ok, otherwise the computed default

**Example**:
```typescript
ok(42).unwrapOrElse(e => 0) // 42
err('failed').unwrapOrElse(e => e.length) // 6
```

---

#### expect()

Returns the contained value or throws with a custom message.

```typescript
expect(message: string): T
```

**Parameters**:
- `message: string` - Error message to throw

**Returns**: The value if Ok

**Throws**: Error with custom message if Err

**Example**:
```typescript
ok(42).expect('Expected number') // 42
err('failed').expect('Expected number') // throws Error: Expected number: failed
```

---

#### map()

Transforms the Ok value.

```typescript
map<U>(fn: (value: T) => U): Result<U, E>
```

**Parameters**:
- `fn: (value: T) => U` - Transformation function

**Returns**: New Result with transformed value, or unchanged Err

**Example**:
```typescript
ok(42).map(x => x * 2) // ok(84)
err('failed').map(x => x * 2) // err('failed')
```

---

#### mapErr()

Transforms the Err value.

```typescript
mapErr<F>(fn: (error: E) => F): Result<T, F>
```

**Parameters**:
- `fn: (error: E) => F` - Error transformation function

**Returns**: New Result with transformed error, or unchanged Ok

**Example**:
```typescript
ok(42).mapErr(e => e.toUpperCase()) // ok(42)
err('failed').mapErr(e => e.toUpperCase()) // err('FAILED')
```

---

#### andThen()

Chains a function that returns a Result.

```typescript
andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>
```

**Parameters**:
- `fn: (value: T) => Result<U, E>` - Function to chain

**Returns**: Result from the function if Ok, otherwise unchanged Err

**Example**:
```typescript
ok(42).andThen(x => ok(x * 2)) // ok(84)
ok(42).andThen(x => err('too big')) // err('too big')
err('failed').andThen(x => ok(x * 2)) // err('failed')
```

---

#### orElse()

Chains a function that returns a Result on error.

```typescript
orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F>
```

**Parameters**:
- `fn: (error: E) => Result<T, F>` - Function to chain on error

**Returns**: Result from the function if Err, otherwise unchanged Ok

**Example**:
```typescript
ok(42).orElse(e => ok(0)) // ok(42)
err('failed').orElse(e => ok(0)) // ok(0)
```

---

#### and()

Combines two Results, returns the second if both are Ok.

```typescript
and<U>(other: Result<U, E>): Result<U, E>
```

**Parameters**:
- `other: Result<U, E>` - Result to combine with

**Returns**: `other` if this is Ok, otherwise unchanged Err

**Example**:
```typescript
ok(42).and(ok('hello')) // ok('hello')
ok(42).and(err('failed')) // err('failed')
err('failed').and(ok('hello')) // err('failed')
```

---

#### or()

Combines two Results, returns the first if Ok.

```typescript
or<F>(other: Result<T, F>): Result<T, F>
```

**Parameters**:
- `other: Result<T, F>` - Result to combine with

**Returns**: This Result if Ok, otherwise `other`

**Example**:
```typescript
ok(42).or(ok(0)) // ok(42)
err('failed').or(ok(0)) // ok(0)
```

---

#### ok()

Converts to Option containing the value.

```typescript
ok(): Option<T>
```

**Returns**: `Some(value)` if Ok, `None()` if Err

**Example**:
```typescript
ok(42).ok() // some(42)
err('failed').ok() // none()
```

---

#### err()

Converts to Option containing the error.

```typescript
err(): Option<E>
```

**Returns**: `None()` if Ok, `Some(error)` if Err

**Example**:
```typescript
ok(42).err() // none()
err('failed').err() // some('failed')
```

---

#### match()

Pattern matching with Ok and Err handlers.

```typescript
match<U>(pattern: {
  ok: (value: T) => U
  err: (error: E) => U
}): U
```

**Parameters**:
- `pattern.ok`: Function to handle Ok case
- `pattern.err`: Function to handle Err case

**Returns**: Result from matching handler

**Example**:
```typescript
ok(42).match({
  ok: (value) => `Got: ${value}`,
  err: (error) => `Error: ${error}`
}) // "Got: 42"
```

---

#### asyncThen()

Async version of `andThen`.

```typescript
asyncThen<U>(fn: (value: T) => Promise<Result<U, E>>): Promise<Result<U, E>>
```

**Parameters**:
- `fn: (value: T) => Promise<Result<U, E>>` - Async function to chain

**Returns**: Promise of Result

**Example**:
```typescript
await ok(42).asyncThen(async (x) => {
  const result = await api.process(x)
  return ok(result)
})
```

---

#### asyncOrElse()

Async version of `orElse`.

```typescript
asyncOrElse<F>(fn: (error: E) => Promise<Result<T, F>>): Promise<Result<T, F>>
```

**Parameters**:
- `fn: (error: E) => Promise<Result<T, F>>` - Async function to chain on error

**Returns**: Promise of Result

**Example**:
```typescript
await err('failed').asyncOrElse(async (e) => {
  const fallback = await api.getFallback()
  return ok(fallback)
})
```

---

### Constructor Functions

```typescript
function ok<T, E = never>(value: T): Result<T, E>
function err<T = never, E>(error: E): Result<T, E>
```

---

## Option\<T>

Type-safe handling of nullable values with Some and None variants.

### Classes

#### Some\<T>

Represents a present value of type `T`.

```typescript
class Some<T> {
  readonly _: 'some' = 'some'
  constructor(public readonly value: T)
}
```

#### None\<T>

Represents the absence of a value.

```typescript
class None<T> {
  readonly _: 'none' = 'none'
}
```

#### Type Alias

```typescript
type Option<T> = Some<T> | None<T>
```

### Methods

#### isSome()

Checks if the option is Some.

```typescript
isSome(): this is Some<T>
```

#### isNone()

Checks if the option is None.

```typescript
isNone(): this is None<T>
```

#### unwrap()

Returns the contained value or throws.

```typescript
unwrap(): T
```

#### unwrapOr()

Returns the contained value or a default.

```typescript
unwrapOr(defaultValue: T): T
```

#### unwrapOrElse()

Returns the contained value or computes a default.

```typescript
unwrapOrElse(fn: () => T): T
```

#### expect()

Returns the contained value or throws with a custom message.

```typescript
expect(message: string): T
```

#### map()

Transforms the value if Some.

```typescript
map<U>(fn: (value: T) => U): Option<U>
```

#### mapOr()

Transforms the value or returns a default.

```typescript
mapOr<U>(defaultValue: U, fn: (value: T) => U): U
```

#### mapOrElse()

Transforms the value or computes a default.

```typescript
mapOrElse<U>(defaultFn: () => U, fn: (value: T) => U): U
```

#### andThen()

Chains a function that returns an Option.

```typescript
andThen<U>(fn: (value: T) => Option<U>): Option<U>
```

#### or()

Combines two Options, returns the first Some.

```typescript
or(opt: Option<T>): Option<T>
```

#### orElse()

Chains a function that returns an Option on None.

```typescript
orElse(fn: () => Option<T>): Option<T>
```

#### match()

Pattern matching with Some and None handlers.

```typescript
match<U>(pattern: {
  some: (value: T) => U
  none: () => U
}): U
```

### Constructor Functions

```typescript
function some<T>(value: T): Option<T>
function none<T>(): Option<T>
```

---

## Match Function

Universal pattern matching for any type.

### Function Signature

```typescript
function match<T>(value: T): Matcher<T>
function match<T>(value: T, options: MatchOptions): Matcher<T>
```

### Matcher Class

```typescript
class Matcher<T, R = unknown> {
  when<U extends T>(
    predicate: (value: T, p: Predicates) => boolean | Promise<boolean>,
    handler: (value: U) => R | Promise<R>
  ): this

  default(handler: (value: T) => R | Promise<R>): R | Promise<R>

  orElse(result: R): R | Promise<R>
}
```

### MatchOptions

```typescript
interface MatchOptions {
  execution?: 'parallel' | 'sequential'  // default: 'parallel'
  predicates?: Partial<Predicates>
}
```

### Usage

```typescript
// Basic matching
match(42)
  .when((v, p) => p.isNumber(v), n => n * 2)
  .default(() => 0)

// Async predicates
await match(data, { execution: 'parallel' })
  .when(async (v, p) => await validate(v), v => v)
  .default(() => null)

// Custom predicates
match(value, {
  predicates: { isCustom: (v): v is Custom => v !== null }
})
  .when((v, p) => p.isCustom(v), c => c.value)
  .default(() => 'unknown')
```

---

## Async Utilities

### fromPromise()

Wraps a Promise with error mapping.

```typescript
function fromPromise<T, E>(
  promise: Promise<T>,
  errorMapper: (error: unknown) => E
): Promise<Result<T, E>>
```

**Example**:
```typescript
const result = await fromPromise(
  fetch('/api/data'),
  error => new NetworkError(error.message)
)
```

---

### toPromise()

Unwraps a Result from Promise (throws if Err).

```typescript
function toPromise<T, E>(result: Promise<Result<T, E>>): Promise<T>
```

**Example**:
```typescript
const value = await toPromise(result)
```

---

### toPromiseOr()

Unwraps a Result from Promise with default.

```typescript
function toPromiseOr<T, E>(
  result: Promise<Result<T, E>>,
  defaultValue: T
): Promise<T>
```

**Example**:
```typescript
const value = await toPromiseOr(result, 0)
```

---

## Utility Functions

### tryCatch()

Auto-catch for sync functions.

```typescript
function tryCatch<T, E = Error>(fn: () => T): Result<T, E>
```

**Example**:
```typescript
const parsed = tryCatch(() => JSON.parse('{"valid": true}'))
```

---

### all()

Combines multiple Results, returns array or first error.

```typescript
function all<T, E>(results: Result<T, E>[]): Result<T[], E>
```

**Example**:
```typescript
const results = [ok(1), ok(2), ok(3)]
all(results) // ok([1, 2, 3])
```

---

### any()

Returns first successful Result or last error.

```typescript
function any<T, E>(results: Result<T, E>[]): Result<T, E>
```

**Example**:
```typescript
const results = [err('e1'), ok(42), err('e2')]
any(results) // ok(42)
```

---

### fromNullable()

Converts nullable value to Option.

```typescript
function fromNullable<T>(value: T | null | undefined): Option<T>
```

**Example**:
```typescript
fromNullable(getUser()) // some(user) or none()
```

---

### toNullable()

Converts Option to nullable value.

```typescript
function toNullable<T>(option: Option<T>): T | null
```

**Example**:
```typescript
toNullable(some(42)) // 42
toNullable(none()) // null
```

---

### fromArray()

Converts array to Option (None if empty).

```typescript
function fromArray<T>(array: T[]): Option<[T, ...T[]]>
```

**Example**:
```typescript
fromArray([1, 2, 3]) // some([1, 2, 3])
fromArray([]) // none()
```

---

### toArray()

Converts Option to array.

```typescript
function toArray<T>(option: Option<T>): T[]
```

**Example**:
```typescript
toArray(some(42)) // [42]
toArray(none()) // []
```

---

## Predicates

Built-in type guards for pattern matching.

### Type Guards

| Predicate | Type Guard |
|-----------|-------------|
| `p.isString(v)` | `v is string` |
| `p.isNumber(v)` | `v is number` |
| `p.isBoolean(v)` | `v is boolean` |
| `p.isNull(v)` | `v is null` |
| `p.isUndefined(v)` | `v is undefined` |
| `p.isNil(v)` | `v is null \| undefined` |
| `p.isArray(v)` | `v is unknown[]` |
| `p.isFunction(v)` | `v is (...args: never[]) => unknown` |
| `p.isObject(v)` | `v is object` |
| `p.isPromise(v)` | `v is Promise<unknown>` |
| `p.isDate(v)` | `v is Date` |
| `p.isRegExp(v)` | `v is RegExp` |
| `p.isOk(v)` | `v is Result<unknown, unknown>` |
| `p.isErr(v)` | `v is Result<unknown, unknown>` |
| `p.isSome(v)` | `v is Option<unknown>` |
| `p.isNone(v)` | `v is Option<unknown>` |
| `p.isTruthy(v)` | `boolean` |
| `p.isFalsy(v)` | `boolean` |
| `p.isEmpty(v)` | `boolean` |

### Usage

```typescript
import { match, predicates as p } from '@ts-result'

match(value)
  .when((v, p) => p.isString(v), s => s.toUpperCase())
  .when((v, p) => p.isNumber(v), n => n * 2)
  .default(() => 'unknown')
```

### Extending Predicates

```typescript
import { predicates } from '@ts-result'

interface User {
  id: number
  name: string
}

predicates.isUser = (v: unknown): v is User =>
  typeof v === 'object' && v !== null &&
  'id' in v && 'name' in v

match(data)
  .when((v, p) => p.isUser(v), user => user.name)
  .default(() => 'unknown')
```
