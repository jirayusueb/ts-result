# @ts-result

Rust-inspired `Result<T, E>` and `Option<T>` types with universal pattern matching for error handling in TypeScript.

## Installation

```bash
npm install @ts-result
bun add @ts-result
yarn add @ts-result
pnpm add @ts-result
```

## Features

- ⚡ **Result<T, E>** - Type-safe error handling (Ok / Err)
- 💎 **Option<T>** - Handle nullable values (Some / None)
- 🎯 **Universal Match** - Pattern matching for any type
- 🔄 **Async Support** - First-class async/await support
- 🛡️ **Built-in Predicates** - Type guards available in match
- 🚀 **Zero Dependencies** - Lightweight and fast

## Quick Start

### Result<T, E>

```typescript
import { ok, err, match } from '@ts-result'

// Create results
const success = ok(42)
const failure = err('Something went wrong')

// Check status
if (success.isOk()) {
  console.log(success.value)  // 42
}

// Unwrap with fallback
console.log(failure.unwrapOr(0))  // 0

// Transform values
const doubled = success.map(x => x * 2)  // ok(84)

// Chain operations
const chained = success
  .map(x => x * 2)
  .andThen(x => x > 50 ? ok(x) : err('Too small'))
  .mapErr(e => `Error: ${e}`)

// Match pattern
match(success, {
  ok: (value) => `Got: ${value}`,
  err: (error) => `Error: ${error}`
})  // "Got: 42"
```

### Option<T>

```typescript
import { some, none, fromNullable, match } from '@ts-result'

// Create options
const maybeValue = some(42)
const empty = none<number>()

// Handle nullable values
const user = fromNullable(getUser())
  .map(u => u.name)
  .unwrapOr('Anonymous')

// Match
match(maybeValue, {
  some: (value) => value * 2,
  none: () => 0
})  // 84
```

### Universal Match

```typescript
import { match } from '@ts-result'

// Basic matching
const result = match(42)
  .when((v, p) => p.isNumber(v), n => n * 2)
  .when((v, p) => p.isString(v), s => s.length)
  .default(() => 0)
// result = 84

// Custom predicates
interface User { id: number; name: string }
const isUser = (v: unknown): v is User =>
  typeof v === 'object' && v !== null && 'id' in v && 'name' in v

match(data)
  .when(isUser, user => user.name)
  .when((v, p) => p.isNil(v), () => 'guest')
  .default(() => 'unknown')
```

### Async Support

```typescript
import { match, fromPromise, tryCatch } from '@ts-result'

// Async predicates (parallel by default)
const result = await match(userData, { execution: 'parallel' })
  .when(async (v, p) => {
    const exists = await db.userExists(v.id)
    return exists && p.isObject(v)
  }, user => user.id)
  .when(async (v) => await validateEmail(v), email => email)
  .default(() => 'guest')

// Wrap Promises with error mapping
const userResult = await fromPromise(
  fetch('/api/user'),
  error => new NetworkError(error.message)
)

// Try-catch wrapper
const parsed = tryCatch(() => JSON.parse(jsonString))
```

## API Reference

### Result<T, E>

#### Methods

| Method | Return | Description |
|--------|---------|-------------|
| `isOk()` | `boolean` | Check if Ok |
| `isErr()` | `boolean` | Check if Err |
| `unwrap()` | `T` | Get value or throw |
| `unwrapOr(default: T)` | `T` | Get value or default |
| `unwrapOrElse(fn: (err: E) => T)` | `T` | Get value or compute default |
| `expect(message: string)` | `T` | Unwrap with custom error message |
| `map<U>(fn: (value: T) => U)` | `Result<U, E>` | Transform value |
| `mapErr<F>(fn: (err: E) => F)` | `Result<T, F>` | Transform error |
| `andThen<U>(fn: (value: T) => Result<U, E>)` | `Result<U, E>` | Chain with function that returns Result |
| `orElse<F>(fn: (err: E) => Result<T, F>)` | `Result<T, F>` | Chain on error |
| `and<U>(res: Result<U, E>)` | `Result<U, E>` | Combine, return second |
| `or<F>(res: Result<T, F>)` | `Result<T, F>` | Combine, return first |
| `ok()` | `Option<T>` | Convert to Option |
| `err()` | `Option<E>` | Get error as Option |
| `match(pattern)` | `U` | Pattern match |
| `asyncThen<U>(fn: (value: T) => Promise<Result<U, E>>)` | `Promise<Result<U, E>>` | Async chain on Ok |
| `asyncOrElse<F>(fn: (err: E) => Promise<Result<T, F>>)` | `Promise<Result<T, F>>` | Async chain on Err |

#### Constructor Functions

- `ok<T, E>(value: T): Result<T, E>` - Create Ok
- `err<T, E>(error: E): Result<T, E>` - Create Err

### Option<T>

#### Methods

| Method | Return | Description |
|--------|---------|-------------|
| `isSome()` | `boolean` | Check if Some |
| `isNone()` | `boolean` | Check if None |
| `unwrap()` | `T` | Get value or throw |
| `unwrapOr(default: T)` | `T` | Get value or default |
| `unwrapOrElse(fn: () => T)` | `T` | Get value or compute default |
| `expect(message: string)` | `T` | Unwrap with custom error message |
| `map<U>(fn: (value: T) => U)` | `Option<U>` | Transform value |
| `mapOr<U>(default: U, fn: (value: T) => U)` | `U` | Transform or return default |
| `mapOrElse<U>(defaultFn: () => U, fn: (value: T) => U)` | `U` | Transform or compute default |
| `andThen<U>(fn: (value: T) => Option<U>)` | `Option<U>` | Chain with function that returns Option |
| `or(opt: Option<T>)` | `Option<T>` | Combine, return first |
| `orElse(fn: () => Option<T>)` | `Option<T>` | Chain on None |
| `match(pattern)` | `U` | Pattern match |

#### Constructor Functions

- `some<T>(value: T): Option<T>` - Create Some
- `none<T>(): Option<T>` - Create None

### Match Function

#### API

```typescript
match(value)
  .when((v, p) => p.isString(v), s => s.length)
  .when((v, p) => p.isNumber(v), n => n * 2)
  .default(() => 0)
```

#### Options

```typescript
match(value, {
  execution: 'parallel' | 'sequential',  // default: 'parallel'
  predicates: { ...customPredicates }
})
```

#### Built-in Predicates

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

### Async Utilities

```typescript
// Wrap Promise with error mapping
fromPromise<T, E>(
  promise: Promise<T>,
  errorMapper: (error: unknown) => E
): Promise<Result<T, E>>

// Unwrap Result from Promise (throws if Err)
toPromise<T, E>(result: Promise<Result<T, E>>): Promise<T>

// Unwrap Result from Promise with default
toPromiseOr<T, E>(
  result: Promise<Result<T, E>>,
  defaultValue: T
): Promise<T>
```

### Utility Functions

```typescript
// Result utilities
tryCatch<T, E = Error>(fn: () => T): Result<T, E>
all<T, E>(results: Result<T, E>[]): Result<T[], E>
any<T, E>(results: Result<T, E>[]): Result<T, E>

// Option utilities
fromNullable<T>(value: T | null | undefined): Option<T>
toNullable<T>(option: Option<T>): T | null
fromArray<T>(array: T[]): Option<[T, ...T[]]>
toArray<T>(option: Option<T>): T[]
```

## Usage Examples

### API Response Handling

```typescript
async function fetchUser(id: string) {
  const response = await fromPromise(
    fetch(`/api/users/${id}`),
    error => new NetworkError(error.message)
  )

  return response
    .andThen(async (res) => {
      const data = await fromPromise(
        res.json(),
        error => new ParseError(error.message)
      )
      return data.andThen(validateUser)
    })
}

const user = await fetchUser('123')
match(user, {
  ok: (u) => console.log(`User: ${u.name}`),
  err: (e) => console.error(`Failed: ${e.message}`)
})
```

### Form Validation

```typescript
function validateEmail(email: string): Result<string, Error> {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email) ? ok(email) : err(new Error('Invalid email'))
}

function validateAge(age: number): Result<number, Error> {
  return age >= 0 && age <= 120 ? ok(age) : err(new Error('Invalid age'))
}

// Combine validations
const errors: Result<string, Error>[] = [
  validateEmail(email),
  validateAge(age)
]

const allValid = all(errors)
if (allValid.isErr()) {
  console.error('Validation failed:', allValid.error)
}
```

### Configuration Loading

```typescript
interface Config {
  apiUrl: string
  timeout: number
}

async function loadConfig(): Result<Config, Error> {
  const envVar = process.env.CONFIG_FILE
  const fileResult = fromNullable(envVar).mapErr(() => new Error('CONFIG_FILE not set'))

  return fileResult.andThen(async (path) => {
    const content = await fromPromise(
      fs.readFile(path, 'utf-8'),
      error => new Error(`Failed to read: ${error.message}`)
    )

    return content.andThen(parseConfig)
  })
}
```

### Async Workflows with Parallel Execution

```typescript
async function authenticate(token: string) {
  const result = await match(token, { execution: 'parallel' })
    .when(async (v, p) => p.isString(v) && p.isTruthy(v), async (t) => {
      // All predicates run in parallel
      const valid = await validateToken(t)
      const user = await findUser(t)
      const permissions = await checkPermissions(t)

      return valid && user ? { user, permissions } : null
    })
    .when((v, p) => p.isNil(v), () => null)
    .default(() => null)

  return result
}
```

## Migration from try/catch

### Before

```typescript
try {
  const response = await fetch('/api/data')
  const data = await response.json()
  const validated = validate(data)

  if (validated.errors) {
    throw new Error('Validation failed')
  }

  return processData(validated)
} catch (error) {
  console.error('Failed:', error)
  return null
}
```

### After

```typescript
const result = await fromPromise(
  fetch('/api/data'),
  error => new NetworkError(error.message)
)
  .asyncThen(async (res) => {
    return fromPromise(
      res.json(),
      error => new ParseError(error.message)
    )
  })
  .andThen(validate)
  .andThen(data => {
    return data.errors ? err(new Error('Validation failed')) : ok(data)
  })

return result
  .map(processData)
  .match({
    ok: (data) => data,
    err: (error) => {
      console.error('Failed:', error)
      return null
    }
  })
```

## License

MIT
