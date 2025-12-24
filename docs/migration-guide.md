# Migration Guide

Step-by-step guide to migrate from try/catch and other libraries to `@ts-result`.

## Table of Contents

- [From try/catch](#from-trycatch)
- [From neverthrow](#from-neverthrow)
- [From ts-results-api](#from-ts-results-api)
- [From fp-ts](#from-fp-ts)
- [Integration Strategies](#integration-strategies)
- [Testing During Migration](#testing-during-migration)

---

## From try/catch

### Step 1: Identify Error-Prone Operations

```typescript
// Before - using try/catch
try {
  const response = await fetch('/api/user')
  const data = await response.json()
  const validated = validateUser(data)
  return processUser(validated)
} catch (error) {
  console.error('Failed:', error)
  return null
}
```

**Identify**: Network errors, JSON parsing, validation, processing

### Step 2: Wrap Each Operation in Result

```typescript
// After - wrap operations
async function fetchUser(id: string): Result<Response, NetworkError> {
  return fromPromise(
    fetch(`/api/user/${id}`),
    error => ({ type: 'network', message: error.message })
  )
}

function parseUser(response: Response): Result<UserData, ParseError> {
  return tryCatch(() => JSON.parse(await response.text()))
    .mapErr(e => ({ type: 'parse', message: e.message }))
}

function validateUser(data: UserData): Result<User, ValidationError> {
  const errors = validate(data)
  return errors.length > 0
    ? err({ type: 'validation', errors })
    : ok(createUser(data))
}

function processUser(user: User): Result<Processed, Error> {
  return tryCatch(() => transform(user))
}
```

### Step 3: Chain Operations with andThen

```typescript
// After - chain operations
async function getUserAndProcess(id: string): Result<Processed, Error> {
  return fetchUser(id)
    .andThen(parseUser)
    .andThen(validateUser)
    .andThen(processUser)
}
```

### Step 4: Replace Error Handling with Match

```typescript
// Before - try/catch with error handling
try {
  const processed = await getUserAndProcess('123')
  console.log('Processed:', processed)
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network failed:', error.message)
  } else if (error instanceof ParseError) {
    console.error('Parse failed:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}

// After - match for error handling
const result = await getUserAndProcess('123')
result.match({
  ok: (processed) => console.log('Processed:', processed),
  err: (error) => {
    match(error.type)
      .whenEq('network', () => console.error('Network failed:', error.message))
      .whenEq('parse', () => console.error('Parse failed:', error.message))
      .whenEq('validation', () => console.error('Validation failed:', error.errors))
      .default(() => console.error('Unknown error:', error.message))
  }
})
```

### Complete Migration Example

```typescript
// ===== BEFORE =====
async function fetchAndDisplayUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const user = await response.json()
    if (!user || user.error) {
      throw new Error('User not found')
    }

    displayUser(user)
  } catch (error) {
    console.error('Failed to fetch user:', error.message)
    displayError(error.message)
  }
}

// ===== AFTER =====
type ApiError =
  | { type: 'network', message: string, code?: number }
  | { type: 'not_found', message: string }
  | { type: 'parse', message: string }

async function fetchAndDisplayUser(id: string): Promise<void> {
  const result = await fetchUser(id)

  result.match({
    ok: (user) => displayUser(user),
    err: (error) => {
      console.error('Failed to fetch user:', error.message)
      displayError(error.message)
    }
  })
}

function fetchUser(id: string): Promise<Result<User, ApiError>> {
  return fromPromise(
    fetch(`/api/users/${id}`),
    error => ({ type: 'network', message: error.message })
  )
    .andThen(async (response) => {
      if (!response.ok) {
        return err({
          type: 'network',
          message: `HTTP ${response.status}`,
          code: response.status
        })
      }

      return fromPromise(
        response.json(),
        error => ({ type: 'parse', message: error.message })
      )
    })
    .andThen(data => {
      if (!data || data.error) {
        return err({ type: 'not_found', message: 'User not found' })
      }

      return ok(data)
    })
}
```

---

## From neverthrow

### API Comparison

```typescript
// neverthrow
import { Result, Ok, Err } from 'neverbounce'

const ok: Ok<number> = ok(42)
const err: Err<string> = err('error')

// @ts-result
import { ok, err, Result } from '@ts-result'

const ok: Result<number, string> = ok(42)
const err: Result<number, string> = err('error')
```

### Method Mapping

| neverthrow | @ts-result |
|-----------|-------------|
| `isOk()` | `isOk()` |
| `isErr()` | `isErr()` |
| `unwrapOr()` | `unwrapOr()` |
| `map()` | `map()` |
| `mapErr()` | `mapErr()` |
| `andThen()` | `andThen()` |
| `orElse()` | `orElse()` |
| `or()` | `or()` |
| `and()` | `and()` |
| `asyncAndThen()` | `asyncThen()` |
| `asyncOrElse()` | `asyncOrElse()` |
| `unsafeUnwrap()` | `unwrap()` |

### Migration Example

```typescript
// ===== BEFORE (neverbounce) =====
import { Result } from 'neverbounce'

function fetchUser(id: string): Result<User, Error> {
  return Result.fromAsync(
    api.fetch(id),
    error => new ApiError(error.message)
  )
}

const user = fetchUser('123')
  .map(u => u.name)
  .mapErr(e => new Error(e.message))
  .unwrapOr(null)

// ===== AFTER (@ts-result) =====
import { ok, fromPromise } from '@ts-result'

function fetchUser(id: string): Result<User, Error> {
  return fromPromise(
    api.fetch(id),
    error => new ApiError(error.message)
  )
}

const user = fetchUser('123')
  .map(u => u.name)
  .mapErr(e => new Error(e.message))
  .unwrapOr(null)
```

---

## From ts-results-api

### API Comparison

```typescript
// ts-results-api
import { Ok, Err, Result } from 'ts-results-api'

const result: Result<string, number> = Ok('success')

// @ts-result
import { ok, Result } from '@ts-result'

const result: Result<string, number> = ok('success')
```

### Method Mapping

| ts-results-api | @ts-result |
|----------------|-------------|
| `isOk()` | `isOk()` |
| `isErr()` | `isErr()` |
| `unwrap()` | `unwrap()` |
| `unwrapOr()` | `unwrapOr()` |
| `unwrapOrElse()` | `unwrapOrElse()` |
| `expect()` | `expect()` |
| `map()` | `map()` |
| `mapErr()` | `mapErr()` |
| `andThen()` | `andThen()` |
| `orElse()` | `orElse()` |
| `and()` | `and()` |
| `or()` | `or()` |
| `toOption()` | `ok()` |
| `toErrOption()` | `err()` |

### Migration Example

```typescript
// ===== BEFORE (ts-results-api) =====
import { Ok, Err, Result } from 'ts-results-api'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('Division by zero')
  }
  return Ok(a / b)
}

const result = divide(10, 2)
  .map(x => x * 2)
  .andThen(x => x > 10 ? Ok(x) : Err('Too small'))
  .mapErr(e => e.toUpperCase())

// ===== AFTER (@ts-result) =====
import { ok, err } from '@ts-result'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

const result = divide(10, 2)
  .map(x => x * 2)
  .andThen(x => x > 10 ? ok(x) : err('Too small'))
  .mapErr(e => e.toUpperCase())
```

---

## From fp-ts

### Either to Result

```typescript
// fp-ts
import { Either, left, right, isLeft, isRight } from 'fp-ts/Either'

type Either<E, A> = Left<E> | Right<A>

// @ts-result
import { ok, err, Result } from '@ts-result'

type Result<T, E> = Err<T, E> | Ok<T, E>

// Migration mapping
const result: Either<string, number> = right(42)
const tsResult: Result<number, string> =
  isLeft(result) ? err(result.left) : ok(result.right)

// Helper function for migration
function fromEither<T, E>(either: Either<E, T>): Result<T, E> {
  return isLeft(either) ? err(either.left) : ok(either.right)
}
```

### Option Migration

```typescript
// fp-ts
import { Option, some, none, isSome, isNone } from 'fp-ts/Option'

// @ts-result
import { some, none, Option } from '@ts-result'

// Migration mapping
const opt: Option<string> = some('hello')
const tsOpt: Option<string> =
  isNone(opt) ? none() : some(opt.value)
```

### Migration Example

```typescript
// ===== BEFORE (fp-ts) =====
import { pipe, chain, map, mapLeft, Either, left, right } from 'fp-ts/Either'

function fetchUser(id: string): Promise<Either<string, User>> {
  return fetch(`/api/users/${id}`)
    .then(res => res.ok ? right(res.json()) : left('Not found'))
}

const result = await pipe(
  fetchUser('123'),
  chain(validateUser),
  map(processUser),
  mapLeft(e => e.toUpperCase())
)

if (isLeft(result)) {
  console.error('Error:', result.left)
} else {
  console.log('Success:', result.right)
}

// ===== AFTER (@ts-result) =====
import { fromPromise, err, ok } from '@ts-result'

function fetchUser(id: string): Promise<Result<User, string>> {
  return fromPromise(
    fetch(`/api/users/${id}`),
    error => error.message
  )
    .andThen(async (res) =>
      res.ok ? ok(res.json()) : err('Not found')
    )
}

const result = await fetchUser('123')
  .andThen(validateUser)
  .map(processUser)
  .mapErr(e => e.toUpperCase())

result.match({
  ok: (user) => console.log('Success:', user),
  err: (error) => console.error('Error:', error)
})
```

---

## Integration Strategies

### Strategy 1: Wrapper Layer

Create wrapper functions that convert existing APIs to Result.

```typescript
// Wrap existing libraries
class ApiClient {
  // Existing API
  async fetch(url: string): Promise<any> {
    const response = await fetch(url)
    return response.json()
  }

  // Wrapper that returns Result
  async safeFetch(url: string): Promise<Result<any, ApiError>> {
    return fromPromise(
      this.fetch(url),
      error => ({ type: 'network', message: error.message })
    )
  }
}

// Use wrapper
const result = await new ApiClient().safeFetch('/api/data')
```

### Strategy 2: Adapter Pattern

Create adapters that convert between Result and existing types.

```typescript
// Adapter for existing error types
interface LegacyError {
  code: number
  message: string
}

function toLegacyError(error: AppError): LegacyError {
  return {
    code: error.type === 'network' ? 500 : 400,
    message: error.message
  }
}

// Use in API boundaries
function publicApi(): Promise<LegacySuccess | LegacyError> {
  return internalOperation().match({
    ok: (data) => ({ success: true, data }),
    err: (error) => toLegacyError(error)
  })
}
```

### Strategy 3: Gradual Adoption

Migrate module by module, keeping existing tests passing.

```typescript
// Phase 1: Keep existing code, add Result versions
function getUserLegacy(id: string): User | null {
  try {
    return db.find(id)
  } catch {
    return null
  }
}

function getUserNew(id: string): Result<User, DbError> {
  return fromPromise(
    db.find(id),
    error => ({ type: 'db', message: error.message })
  )
}

// Phase 2: Migrate callers one by one
const user1 = getUserLegacy('123')  // Still using legacy
const user2 = getUserNew('456')      // Using new Result

// Phase 3: Remove legacy code
// function getUserLegacy(...) { ... }
```

### Strategy 4: Boundary Conversion

Convert at boundaries between Result and non-Result code.

```typescript
// Internal code uses Result
function processInternal(id: string): Result<User, Error> {
  // ...
}

// Boundary: convert for external API
export function process(id: string): User | null {
  return processInternal(id)
    .mapErr(() => null)  // Convert error to null
    .unwrapOr(null)
}

// Or throw for legacy error handling
export function processOrThrow(id: string): User {
  return processInternal(id)
    .unwrap()  // Throws on error
}
```

---

## Testing During Migration

### Parallel Tests

Maintain both old and new implementations with shared tests.

```typescript
// Legacy implementation
function processLegacy(input: string): string | null {
  try {
    // Old logic
  } catch {
    return null
  }
}

// New Result implementation
function processNew(input: string): Result<string, Error> {
  return tryCatch(() => {
    // New logic
  })
}

// Shared tests for both
describe('Processing', () => {
  const inputs = ['valid', 'invalid', 'edge']

  inputs.forEach(input => {
    it(`should handle "${input}" with legacy`, () => {
      const result = processLegacy(input)
      if (input === 'valid') {
        expect(result).toBeTruthy()
      } else {
        expect(result).toBeNull()
      }
    })

    it(`should handle "${input}" with new`, () => {
      const result = processNew(input)
      if (input === 'valid') {
        expect(result.isOk()).toBe(true)
      } else {
        expect(result.isErr()).toBe(true)
      }
    })
  })
})
```

### Property-Based Tests

Use property-based testing to ensure equivalence.

```typescript
import { test, expect } from 'vitest'

describe('Migration equivalence', () => {
  test('legacy and new should be equivalent', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const legacy = processLegacy(input)
        const newResult = processNew(input)

        const legacySuccess = legacy !== null
        const newSuccess = newResult.isOk()

        return legacySuccess === newSuccess
      }),
      { numRuns: 100 }
    )
  })
})
```

### Integration Tests

Test new code with existing test fixtures.

```typescript
describe('Integration tests', () => {
  it('should work with existing fixtures', async () => {
    const fixtures = loadTestFixtures()

    for (const fixture of fixtures) {
      const result = await processNew(fixture.input)
      const legacy = processLegacy(fixture.input)

      // Compare results
      if (legacy) {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toEqual(legacy)
      } else {
        expect(result.isErr()).toBe(true)
      }
    }
  })
})
```

---

## Migration Checklist

### Preparation
- [ ] Identify all error-prone operations
- [ ] Design error type hierarchy
- [ ] Create Result wrapper functions
- [ ] Update TypeScript types

### Migration
- [ ] Migrate low-level functions first
- [ ] Update function signatures to return Result
- [ ] Replace try/catch with Result methods
- [ ] Update error handling with match
- [ ] Migrate async operations

### Testing
- [ ] Keep existing tests passing
- [ ] Add new tests for Result behavior
- [ ] Test error paths explicitly
- [ ] Property-based tests for equivalence
- [ ] Integration tests with existing code

### Cleanup
- [ ] Remove legacy try/catch
- [ ] Remove old error types
- [ ] Update documentation
- [ ] Remove adapter functions

---

## Common Migration Patterns

### Exception to Result

```typescript
// Before
try {
  return riskyOperation()
} catch (error) {
  return handleError(error)
}

// After
return tryCatch(() => riskyOperation())
  .orElse(e => ok(handleError(e)))
```

### Null to Option

```typescript
// Before
const value = getValue()
if (value) {
  return process(value)
}

// After
return fromNullable(getValue()).andThen(process)
```

### Async Error Handling

```typescript
// Before
try {
  const data = await fetchData()
  const parsed = await parseData(data)
  return await validateData(parsed)
} catch (error) {
  console.error(error)
  return null
}

// After
return fromPromise(fetchData(), toNetworkError)
  .asyncThen(data => fromPromise(parseData(data), toParseError))
  .asyncThen(data => fromPromise(validateData(data), toValidationError))
```

### Conditional Error Recovery

```typescript
// Before
let result = operation1()
if (!result) {
  result = operation2()
}
if (!result) {
  result = operation3()
}

// After
const result = any([
  operation1().map(ok),
  operation2().map(ok),
  operation3().map(ok)
])
```

---

## Summary

**Migration approach**:
1. Start with wrapper/adapters around existing code
2. Design rich error types upfront
3. Migrate bottom-up: low-level functions first
4. Maintain parallel tests during migration
5. Use boundary conversion for gradual adoption
6. Remove legacy code after full migration

**Benefits of migration**:
- Type-safe error handling
- Explicit error paths
- Composable error handling
- Better testability
- Clearer code intent

Following this guide will help you safely migrate to `@ts-result` while maintaining code quality and test coverage.
