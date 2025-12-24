# Best Practices

Guidelines and patterns for using `@ts-result` effectively.

## Table of Contents

- [When to Use Result vs Option](#when-to-use-result-vs-option)
- [Error Type Design](#error-type-design)
- [Naming Conventions](#naming-conventions)
- [Composition Patterns](#composition-patterns)
- [Handling Nested Results/Options](#handling-nested-resultsoptions)
- [Testing Strategies](#testing-strategies)
- [TypeScript Type Inference Tips](#typescript-type-inference-tips)
- [Performance Optimization](#performance-optimization)
- [Interop with Existing Code](#interop-with-existing-code)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## When to Use Result vs Option

### Result\<T, E>

Use Result when:
- **Operations can fail** with recoverable errors
- **Error handling is important** for correct program flow
- **Different error types** provide useful information
- **You want to explicitly handle** failure cases

**Good use cases**:
```typescript
// API calls - network errors, parse errors
fetchUser(id): Result<User, ApiError>

// File I/O - missing files, permission errors
readFile(path): Result<string, FsError>

// Database operations - connection errors, not found
findUser(email): Result<User, DbError>

// Validation - multiple validation rules
validateForm(form): Result<ValidForm, ValidationError[]>
```

### Option\<T>

Use Option when:
- **Values are optionally present** (null/undefined)
- **Absence is a valid state**, not an error
- **"No value" and "error"** have different meanings

**Good use cases**:
```typescript
// Nullable properties
user.email(): Option<string>  // user might not have email
user.age(): Option<number>    // age might not be set

// Optional configuration
config.timeout(): Option<number>  // timeout might not be configured

// Lookups that return nothing
map.get(key): Option<Value>  // key might not exist
array.find(predicate): Option<T>  // nothing found
```

### When Both Are Appropriate

```typescript
// Result contains Option for nested optional data
function findUserById(id: string): Result<Option<User>, NotFoundError>

// Option contains Result for potential errors in optional path
function getOptionalConfig(): Option<Result<Config, ParseError>>
```

---

## Error Type Design

### Use Discriminated Unions

```typescript
// ❌ Bad - string errors don't provide structure
type BadError = string

// ✅ Good - discriminated unions provide structure
type GoodError =
  | { type: 'network', message: string, code?: number }
  | { type: 'validation', fields: string[] }
  | { type: 'database', table: string, reason: string }
```

### Include Context in Errors

```typescript
// ❌ Bad - minimal error information
function fetchData(): Result<Data, string> {
  return err('failed')
}

// ✅ Good - rich error context
function fetchData(): Result<Data, FetchError> {
  return err({
    type: 'network',
    url: '/api/data',
    statusCode: 500,
    message: 'Internal server error',
    timestamp: Date.now()
  })
}
```

### Create Error Type Hierarchies

```typescript
// Base error type
interface ApiError {
  type: string
  message: string
  timestamp: number
}

// Specific error types
type NetworkError = ApiError & {
  type: 'network'
  statusCode: number
  url: string
}

type ValidationError = ApiError & {
  type: 'validation'
  fields: Array<{ path: string, message: string }>
}

type NotFoundError = ApiError & {
  type: 'not_found'
  resource: string
  id: string
}

// Combined error type
type AppError = NetworkError | ValidationError | NotFoundError
```

---

## Naming Conventions

### Method Chaining

```typescript
// ✅ Good - clear variable names
const processedData = fetchUser(id)
  .andThen(validateUser)
  .andThen(transformUser)
  .map(u => u.name)

// ❌ Avoid - unclear names
const a = fetchUser(id).andThen(b).andThen(c).map(d => d)
```

### Error Variables

```typescript
// ✅ Good - descriptive error names
userResult.match({
  ok: (user) => console.log(user.name),
  err: (validationError) => console.error(validationError.fields)
})

// ❌ Avoid - generic error names
userResult.match({
  ok: (user) => console.log(user.name),
  err: (e) => console.error(e)
})
```

### Type Parameters

```typescript
// ✅ Good - meaningful type parameter names
function fetchResult<T>(id: string): Result<T, ApiError>

// ❌ Avoid - generic type parameters
function fetchResult<V>(id: string): Result<V, ApiError>
```

---

## Composition Patterns

### Pipeline Pattern

```typescript
// ✅ Good - clean pipeline
const result = ok(rawData)
  .map(parseData)
  .andThen(validateData)
  .map(transformData)
  .andThen(saveData)

// ❌ Avoid - manual error checking
const parsed = parseData(rawData)
if (!parsed.ok) return err(parsed.error)
const validated = validateData(parsed.value)
if (!validated.ok) return err(validated.error)
const transformed = transformData(validated.value)
if (!transformed.ok) return err(transformed.error)
return saveData(transformed.value)
```

### Branching Composition

```typescript
// ✅ Good - use orElse for fallbacks
const user = fetchUser(id)
  .orElse(() => fetchFromCache(id))
  .orElse(() => createGuestUser(id))

// ✅ Good - use andThen for conditional logic
const result = ok(user)
  .andThen(u => u.isActive() ? ok(u) : err('User inactive'))

// ❌ Avoid - manual branching
let user = fetchUser(id)
if (user.isErr()) {
  user = fetchFromCache(id)
}
if (user.isErr()) {
  user = createGuestUser(id)
}
```

### Combining Multiple Operations

```typescript
// ✅ Good - use all() for dependent operations
const result = all([
  validateName(form.name),
  validateEmail(form.email),
  validateAge(form.age)
])

// ✅ Good - use any() for alternative sources
const data = any([
  fetchFromPrimary(key),
  fetchFromSecondary(key),
  fetchFromCache(key)
])
```

---

## Handling Nested Results/Options

### Flatten Nested Options

```typescript
// ❌ Bad - nested Option<Option<T>>
function getNestedValue(): Option<Option<T>> {
  const outer = getOuter()
  return outer.map(getInner)
}

// ✅ Good - use andThen to flatten
function getNestedValue(): Option<T> {
  return getOuter().andThen(getInner)
}
```

### Combine Result and Option

```typescript
// ✅ Good - convert Option to Result with error
function optionalToRequired<T>(
  opt: Option<T>,
  error: string
): Result<T, string> {
  return opt.mapOrElse(() => err(error))
}

// Usage
const result = optionalToRequired(
  getUserOption(),
  'User is required'
)
```

### Handle Nested Results

```typescript
// ✅ Good - flatten nested Results with andThen
function fetchAndValidate(id: string): Result<User, Error> {
  return fetchUser(id)
    .andThen(validateUser)
}

// ✅ Good - use orElse for alternatives
function fetchWithFallback(id: string): Result<User, Error> {
  return fetchFromPrimary(id)
    .orElse(() => fetchFromSecondary(id))
}
```

---

## Testing Strategies

### Test All Paths

```typescript
import { ok, err } from '@ts-result'
import { expect, it, describe } from 'vitest'

describe('processUser', () => {
  it('should process valid user', () => {
    const input = { name: 'John', age: 30 }
    const result = processUser(input)
    expect(result.isOk()).toBe(true)
    expect(result.unwrap().processedName).toBe('JOHN')
  })

  it('should reject invalid age', () => {
    const input = { name: 'John', age: 200 }
    const result = processUser(input)
    expect(result.isErr()).toBe(true)
    expect(result.error).toEqual({ type: 'invalid_age' })
  })

  it('should handle missing name', () => {
    const input = { age: 30 }
    const result = processUser(input)
    expect(result.isErr()).toBe(true)
  })
})
```

### Test Error Cases

```typescript
describe('API Client', () => {
  it('should return network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const result = await fetchUser('123')
    expect(result.isErr()).toBe(true)
    expect(result.error.type).toBe('network')
  })

  it('should return parse error', async () => {
    mockFetch.mockResolvedValue({ invalid: 'json' })
    const result = await fetchUser('123')
    expect(result.isErr()).toBe(true)
    expect(result.error.type).toBe('parse')
  })
})
```

### Test Match Patterns

```typescript
describe('Match Patterns', () => {
  it('should match strings', () => {
    const result = match('hello')
      .when((v, p) => p.isString(v), s => s.length)
      .default(() => 0)
    expect(result).toBe(5)
  })

  it('should match numbers', () => {
    const result = match(42)
      .when((v, p) => p.isNumber(v), n => n * 2)
      .default(() => 0)
    expect(result).toBe(84)
  })
})
```

---

## TypeScript Type Inference Tips

### Avoid Explicit Type Annotations

```typescript
// ❌ Avoid - redundant type annotations
const result: Result<number, string> = fetchNumber()

// ✅ Good - let TypeScript infer
const result = fetchNumber()
```

### Use Type Guards for Narrowing

```typescript
// ✅ Good - type guards provide narrowing
result.match({
  ok: (user) => {
    // TypeScript knows user is User here
    console.log(user.name)
  },
  err: (error) => {
    // TypeScript knows error is AppError here
    console.error(error.message)
  }
})
```

### Leverage Discriminated Unions

```typescript
// ✅ Good - discriminated unions enable pattern matching
type Error =
  | { type: 'network', code: number }
  | { type: 'validation', fields: string[] }

function handleError(error: Error) {
  match(error.type)
    .whenEq('network', () => console.log('Network error'))
    .whenEq('validation', () => console.log('Validation error'))
}
```

### Generic Functions with Type Constraints

```typescript
// ✅ Good - use type constraints for generic functions
function validate<T extends { id: string }>(
  item: T
): Result<T, ValidationError> {
  return item.id ? ok(item) : err({ field: 'id', message: 'Required' })
}
```

---

## Performance Optimization

### Avoid Unnecessary Wrapping

```typescript
// ❌ Avoid - unnecessary wrapping
const result = ok(ok(data))
const unwrapped = result.unwrap().unwrap()

// ✅ Good - direct Ok
const result = ok(data)
const unwrapped = result.unwrap()
```

### Use Lazy Evaluation

```typescript
// ❌ Avoid - eager evaluation of defaults
const result = ok(value).unwrapOr(computeExpensiveDefault())

// ✅ Good - lazy evaluation with unwrapOrElse
const result = ok(value).unwrapOrElse(() => computeExpensiveDefault())
```

### Batch Operations

```typescript
// ❌ Avoid - multiple async operations in series
for (const id of ids) {
  await fetchUser(id)  // sequential
}

// ✅ Good - use Promise.all with all()
const results = await Promise.all(ids.map(id => fetchUser(id)))
const combined = all(results)
```

### Memoize Expensive Computations

```typescript
// ✅ Good - memoize predicate results
const expensiveCheck = (() => {
  let cache = new Map<string, boolean>()
  return (input: string) => {
    if (cache.has(input)) return cache.get(input)!
    const result = computeExpensiveCheck(input)
    cache.set(input, result)
    return result
  }
})()

match(input)
  .when((v) => expensiveCheck(v), handler)
  .default(() => null)
```

---

## Interop with Existing Code

### Wrap Third-Party Libraries

```typescript
// Wrap libraries that throw exceptions
import axios from 'axios'

async function safeFetch(url: string): Result<Response, ApiError> {
  return fromPromise(
    axios.get(url),
    error => ({
      type: 'network',
      message: error.message,
      code: error.response?.status
    })
  )
}
```

### Gradual Migration

```typescript
// ✅ Good - migrate incrementally
function oldCode(): User | null {
  // Legacy code that returns null
}

function newCode(): Option<User> {
  return fromNullable(oldCode())
}

// Use both during migration
function getUser(): Result<User, Error> {
  const user = newCode()
  return user.mapOrElse(() => err('User not found'))
}
```

### Error Boundary Wrapping

```typescript
// Wrap external APIs in Result
class ExternalApiWrapper {
  async get(url: string): Result<Response, ExternalError> {
    return fromPromise(
      fetch(url),
      error => ({
        type: 'external',
        service: 'external-api',
        message: error.message
      })
    )
  }
}
```

---

## Anti-Patterns to Avoid

### Don't Unwrap Without Checking

```typescript
// ❌ Bad - will throw on Err
const value = someFunction().unwrap()

// ✅ Good - handle both cases
someFunction().match({
  ok: (value) => useValue(value),
  err: (error) => handleError(error)
})
```

### Don't Ignore Errors Silently

```typescript
// ❌ Bad - ignores errors silently
function processData(data: string): Result<Processed, Error> {
  const parsed = tryParse(data)
  return parsed.isErr() ? ok(defaultValue) : parsed
}

// ✅ Good - handle or propagate errors
function processData(data: string): Result<Processed, Error> {
  return tryParse(data).andThen(validateParsed)
}
```

### Don't Use Type Assertions

```typescript
// ❌ Bad - unsafe type assertion
const result = data as Result<User, Error>

// ✅ Good - use Result constructors
const result = ok(data) as Result<User, Error>
```

### Don't Create Nested Unwrapping

```typescript
// ❌ Bad - deeply nested unwrap calls
const value = result1
  .unwrap()
  .unwrap()
  .unwrap()

// ✅ Good - use match or chain operations
const value = match(result1)
  .when((v) => v !== null, (v) => v)
  .default(() => defaultValue)
```

### Don't Overuse orElse

```typescript
// ❌ Bad - orElse chain creates unreadable code
const result = operation1()
  .orElse(() => operation2())
  .orElse(() => operation3())
  .orElse(() => operation4())

// ✅ Good - use any() for alternatives
const result = any([
  operation1(),
  operation2(),
  operation3(),
  operation4()
])
```

### Don't Mix Result and Option Incorrectly

```typescript
// ❌ Bad - inconsistent error handling
function getUser(): Result<User | null, Error> {
  // Mix of Result and Option concepts
}

// ✅ Good - use Result for errors, Option for null
function getUser(): Result<Option<User>, NotFoundError> {
  // Clear separation of concerns
}
```

---

## Summary

**Key principles**:
1. Use Result for errors, Option for absence
2. Design rich, discriminated error types
3. Leverage method chaining over manual checking
4. Test all code paths (Ok and Err)
5. Let TypeScript infer types when possible
6. Avoid unsafe operations (unwrap without checking)
7. Migrate gradually from existing code
8. Keep error handling explicit and visible

Following these patterns will help you write more robust, maintainable, and type-safe code with `@ts-result`.
