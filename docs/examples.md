# Examples

Comprehensive examples for `@ts-result` with real-world scenarios and method demonstrations.

## Table of Contents

- [Real-World Examples](#real-world-examples)
  - [REST API Client](#rest-api-client)
  - [Form Validation](#form-validation)
  - [File Operations](#file-operations)
  - [Database Operations](#database-operations)
  - [Configuration Loading](#configuration-loading)
  - [Authentication Workflow](#authentication-workflow)
  - [Caching Layer](#caching-layer)
  - [Batch Processing](#batch-processing)
- [Synthetic Examples](#synthetic-examples)
  - [Result Methods](#result-methods)
  - [Option Methods](#option-methods)
  - [Match Patterns](#match-patterns)
  - [Async Workflows](#async-workflows)
  - [Custom Predicates](#custom-predicates)

---

## Real-World Examples

### REST API Client

```typescript
import { ok, err, fromPromise } from '@ts-result'

// Define error types
type ApiError =
  | { type: 'network', message: string }
  | { type: 'parse', message: string }
  | { type: 'validation', errors: string[] }

// Fetch user with error mapping
async function fetchUser(id: string): Result<User, ApiError> {
  const response = await fromPromise(
    fetch(`/api/users/${id}`),
    error => ({ type: 'network', message: error.message })
  )

  return response
    .andThen(async (res) => {
      if (!res.ok) {
        return err({ type: 'validation', errors: ['Not found'] })
      }

      return fromPromise(
        res.json(),
        error => ({ type: 'parse', message: error.message })
      )
    })
    .andThen(validateUser)
}

// Usage
const userResult = await fetchUser('123')
userResult.match({
  ok: (user) => console.log(`Hello, ${user.name}`),
  err: (error) => console.error(`Failed: ${error.message}`)
})
```

### Form Validation

```typescript
import { ok, err, all } from '@ts-result'

type ValidationError = { field: string, message: string }

function validateEmail(email: string): Result<string, ValidationError> {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
    ? ok(email)
    : err({ field: 'email', message: 'Invalid email format' })
}

function validatePassword(password: string): Result<string, ValidationError> {
  return password.length >= 8
    ? ok(password)
    : err({ field: 'password', message: 'Must be at least 8 characters' })
}

function validateAge(age: number): Result<number, ValidationError> {
  return age >= 18 && age <= 120
    ? ok(age)
    : err({ field: 'age', message: 'Must be between 18 and 120' })
}

// Validate entire form
function validateForm(form: {
  email: string
  password: string
  age: number
}): Result<{ email: string, password: string, age: number }, ValidationError[]> {
  const results = [
    validateEmail(form.email),
    validatePassword(form.password),
    validateAge(form.age)
  ]

  return all(results).mapErr((errors) =>
    (errors as ValidationError[]).filter(e => e !== undefined)
  )
}

// Usage
const formResult = validateForm({
  email: 'user@example.com',
  password: 'secure123',
  age: 25
})

if (formResult.isOk()) {
  submitForm(formResult.value)
} else {
  displayErrors(formResult.error)
}
```

### File Operations

```typescript
import { ok, err, fromPromise, fromNullable, tryCatch } from '@ts-result'

type FsError = { type: 'not_found' | 'permission', path: string, message: string }

async function readConfig(path: string): Result<string, FsError> {
  // Check if file exists (simulate with try-catch)
  const exists = tryCatch(() => {
    const fs = require('fs')
    fs.accessSync(path)
    return true
  })

  if (exists.isErr()) {
    return err({
      type: 'not_found',
      path,
      message: 'File not found'
    })
  }

  return fromPromise(
    require('fs/promises').readFile(path, 'utf-8'),
    error => ({
      type: 'permission',
      path,
      message: error.message
    })
  )
}

async function parseConfig(content: string): Result<Config, Error> {
  return tryCatch(() => {
    const data = JSON.parse(content)
    return validateConfig(data)
  }).andThen(config => ok(config))
}

// Combined pipeline
async function loadConfig(path: string): Result<Config, FsError | Error> {
  return readConfig(path)
    .andThen(parseConfig)
    .mapErr((e: any) => {
      if (e.type) return e  // FsError
      return { type: 'permission', path, message: e.message }
    })
}

// Usage
const configResult = await loadConfig('./config.json')
configResult.match({
  ok: (config) => startServer(config),
  err: (error) => console.error(`Failed to load config: ${error.message}`)
})
```

### Database Operations

```typescript
import { ok, err, fromPromise } from '@ts-result'

type DbError = { code: string, message: string }

class UserRepository {
  async findById(id: string): Result<User, DbError> {
    return fromPromise(
      db.query('SELECT * FROM users WHERE id = ?', [id]),
      error => ({
        code: 'DB_ERROR',
        message: error.message
      })
    ).andThen(rows => {
      return rows.length > 0 ? ok(rows[0]) : err({
        code: 'NOT_FOUND',
        message: `User ${id} not found`
      })
    })
  }

  async create(user: NewUser): Result<User, DbError> {
    return fromPromise(
      db.query('INSERT INTO users SET ?', [user]),
      error => ({
        code: 'DB_ERROR',
        message: error.message
      })
    ).andThen(result => {
      return this.findById(result.insertId)
    })
  }

  async update(id: string, updates: Partial<User>): Result<User, DbError> {
    return this.findById(id)
      .andThen(async (existing) => {
        const updated = { ...existing, ...updates }
        return fromPromise(
          db.query('UPDATE users SET ? WHERE id = ?', [updates, id]),
          error => ({ code: 'DB_ERROR', message: error.message })
        ).andThen(() => ok(updated))
      })
  }
}

// Usage
const repo = new UserRepository()

const user = await repo.findById('123')
user.andThen(async (u) => {
  const updated = await repo.update(u.id, { name: 'New Name' })
  return updated
}).match({
  ok: (u) => console.log(`Updated: ${u.name}`),
  err: (e) => console.error(`Failed: ${e.message}`)
})
```

### Configuration Loading

```typescript
import { ok, err, fromNullable, all, tryCatch } from '@ts-result'

interface Config {
  apiUrl: string
  timeout: number
  retries: number
}

type ConfigError =
  | { field: string, message: string }
  | { type: 'read', message: string }

function loadFromEnv(): Result<Config, ConfigError> {
  const apiUrl = fromNullable(process.env.API_URL)
    .mapErr(() => ({ field: 'API_URL', message: 'Required' }))

  const timeout = fromNullable(process.env.TIMEOUT)
    .mapErr(() => ({ field: 'TIMEOUT', message: 'Required' }))
    .andThen(value =>
      tryCatch(() => parseInt(value)).mapErr(() =>
        ({ field: 'TIMEOUT', message: 'Must be a number' })
      )
    )

  const retries = fromNullable(process.env.RETRIES)
    .mapErr(() => ({ field: 'RETRIES', message: 'Required' }))
    .andThen(value =>
      tryCatch(() => parseInt(value)).mapErr(() =>
        ({ field: 'RETRIES', message: 'Must be a number' })
      )
    )

  return all([apiUrl, timeout, retries]).map(([u, t, r]) => ({
    apiUrl: u,
    timeout: t,
    retries: r
  }))
}

// Usage
const configResult = loadFromEnv()
if (configResult.isOk()) {
  initializeApp(configResult.value)
} else {
  const errors = configResult.error.map(e => `${e.field}: ${e.message}`)
  console.error('Invalid configuration:', errors.join(', '))
}
```

### Authentication Workflow

```typescript
import { ok, err, match, fromPromise } from '@ts-result'

type AuthError =
  | { type: 'invalid_token' }
  | { type: 'expired' }
  | { type: 'user_not_found' }

async function authenticate(token: string): Result<User, AuthError> {
  // Validate token
  const tokenResult = await fromPromise(
    validateJwt(token),
    error => ({ type: 'invalid_token' })
  )

  if (tokenResult.isErr()) {
    return err({ type: 'invalid_token' })
  }

  const payload = tokenResult.value

  // Check expiration
  if (payload.exp < Date.now()) {
    return err({ type: 'expired' })
  }

  // Fetch user
  return fromPromise(
    db.findById(payload.userId),
    error => ({ type: 'user_not_found' })
  )
}

// Match with custom logic
async function handleAuth(token: string | null) {
  return match(token)
    .when((v, p) => p.isNil(v), () => null)
    .when((v, p) => p.isString(v), async (t) => {
      const result = await authenticate(t)
      return result.isOk() ? result.value : null
    })
    .default(() => null)
}

// Usage
const user = await handleAuth(getTokenFromRequest())
if (user) {
  console.log(`Authenticated as: ${user.name}`)
} else {
  console.log('Not authenticated')
}
```

### Caching Layer

```typescript
import { ok, err, match, fromPromise } from '@ts-result'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache<T, E> {
  constructor(private store: Map<string, CacheEntry<T>>) {}

  get(key: string): Result<T, E> {
    const entry = this.store.get(key)

    if (!entry) {
      return err({ type: 'miss' } as E)
    }

    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.store.delete(key)
      return err({ type: 'expired' } as E)
    }

    return ok(entry.data)
  }

  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<Result<T, E>> {
    const cached = this.get(key)

    if (cached.isOk()) {
      return cached
    }

    const fetched = await fromPromise(
      fetcher(),
      error => ({ type: 'fetch_error', error } as E)
    )

    if (fetched.isOk()) {
      this.set(key, fetched.value, ttl)
    }

    return fetched
  }

  set(key: string, data: T, ttl: number): void {
    this.store.set(key, { data, timestamp: Date.now(), ttl })
  }
}

// Usage
const cache = new Cache<User, { type: 'miss' | 'expired' | 'fetch_error' }>()

const user = await cache.getOrFetch(
  'user:123',
  () => api.fetchUser('123'),
  60000  // 1 minute TTL
)

user.match({
  ok: (u) => renderUser(u),
  err: (e) => console.error(`Failed to load user: ${e.type}`)
})
```

### Batch Processing

```typescript
import { ok, err, all, any } from '@ts-result'

type ProcessError = { id: string, error: string }

async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R, ProcessError>>,
  options: { failFast?: boolean } = {}
): Promise<Result<R[], ProcessError[]>> {
  const results = await Promise.all(
    items.map(item => processor(item))
  )

  // Collect all errors
  const errors = results
    .filter(r => r.isErr())
    .map(r => (r as Err<R, ProcessError>).error)

  // Collect all successes
  const successes = results
    .filter(r => r.isOk())
    .map(r => (r as Ok<R, ProcessError>).value)

  if (options.failFast && errors.length > 0) {
    return err(errors)
  }

  if (errors.length === 0) {
    return ok(successes)
  }

  return err(errors)
}

// Usage
const items = [
  { id: '1', data: '...' },
  { id: '2', data: '...' },
  { id: '3', data: '...' }
]

const result = await processBatch(
  items,
  async (item) => {
    const processed = await api.process(item.data)
    return processed.ok ? ok(processed.value) : err({ id: item.id, error: processed.error })
  },
  { failFast: false }
)

result.match({
  ok: (processed) => console.log(`Processed ${processed.length} items`),
  err: (errors) => console.error(`Failed to process ${errors.length} items:`, errors)
})
```

---

## Synthetic Examples

### Result Methods

```typescript
import { ok, err } from '@ts-result'

// isOk() / isErr()
const success = ok(42)
console.log(success.isOk())  // true
console.log(success.isErr())  // false

const failure = err('failed')
console.log(failure.isOk())  // false
console.log(failure.isErr())  // true

// unwrap()
console.log(ok(42).unwrap())  // 42
console.log(err('error').unwrap())  // throws Error: error

// unwrapOr()
console.log(ok(42).unwrapOr(0))  // 42
console.log(err('error').unwrapOr(0))  // 0

// unwrapOrElse()
console.log(ok(42).unwrapOrElse(() => 0))  // 42
console.log(err('error').unwrapOrElse(() => 10))  // 10

// expect()
console.log(ok(42).expect('Should be number'))  // 42
console.log(err('error').expect('Should be number'))  // throws

// map()
ok(42).map(x => x * 2)  // ok(84)
err('error').map(x => x * 2)  // err('error')

// mapErr()
ok(42).mapErr(e => e.toUpperCase())  // ok(42)
err('error').mapErr(e => e.toUpperCase())  // err('ERROR')

// andThen()
ok(42).andThen(x => ok(x * 2))  // ok(84)
ok(42).andThen(x => err('too big'))  // err('too big')
err('error').andThen(x => ok(x * 2))  // err('error')

// orElse()
ok(42).orElse(e => ok(0))  // ok(42)
err('error').orElse(e => ok(0))  // ok(0)

// and()
ok(42).and(ok('hello'))  // ok('hello')
ok(42).and(err('error'))  // err('error')
err('error').and(ok('hello'))  // err('error')

// or()
ok(42).or(ok(0))  // ok(42)
err('error').or(ok(0))  // ok(0)

// ok() / err()
ok(42).ok()  // some(42)
err('error').err()  // some('error')

// match()
ok(42).match({
  ok: (v) => `Got: ${v}`,
  err: (e) => `Error: ${e}`
})  // "Got: 42"
```

### Option Methods

```typescript
import { some, none, fromNullable } from '@ts-result'

// isSome() / isNone()
const present = some(42)
console.log(present.isSome())  // true
console.log(present.isNone())  // false

const absent = none<number>()
console.log(absent.isSome())  // false
console.log(absent.isNone())  // true

// unwrap()
console.log(some(42).unwrap())  // 42
console.log(none().unwrap())  // throws Error: None.unwrap()

// unwrapOr()
console.log(some(42).unwrapOr(0))  // 42
console.log(none().unwrapOr(0))  // 0

// unwrapOrElse()
console.log(some(42).unwrapOrElse(() => 0))  // 42
console.log(none().unwrapOrElse(() => 10))  // 10

// map()
some(42).map(x => x * 2)  // some(84)
none().map(x => x * 2)  // none()

// mapOr()
some(42).mapOr(0, x => x * 2)  // 84
none().mapOr(0, x => x * 2)  // 0

// mapOrElse()
some(42).mapOrElse(() => 0, x => x * 2)  // 84
none().mapOrElse(() => 0, x => x * 2)  // 0

// andThen()
some(42).andThen(x => some(x * 2))  // some(84)
some(42).andThen(x => none())  // none()
none().andThen(x => some(x * 2))  // none()

// or()
some(42).or(some(0))  // some(42)
none().or(some(0))  // some(0)

// orElse()
some(42).orElse(() => some(0))  // some(42)
none().orElse(() => some(0))  // some(0)

// match()
some(42).match({
  some: (v) => `Got: ${v}`,
  none: () => 'empty'
})  // "Got: 42"

none().match({
  some: (v) => `Got: ${v}`,
  none: () => 'empty'
})  // "empty"
```

### Match Patterns

```typescript
import { match } from '@ts-result'

// Basic type matching
const result1 = match(42)
  .when((v, p) => p.isNumber(v), n => n * 2)
  .when((v, p) => p.isString(v), s => s.length)
  .default(() => 0)

// Multiple conditions
const result2 = match({ value: 42, valid: true })
  .when((v, p) => p.isObject(v) && p.isNumber(v.value), (v) => v.value * 2)
  .default(() => 0)

// Nil checks
const result3 = match(null)
  .when((v, p) => p.isNil(v), () => 'is nil')
  .default(() => 'not nil')

// Array checks
const result4 = match([1, 2, 3])
  .when((v, p) => p.isArray(v) && v.length > 0, (v) => v.length)
  .default(() => 0)

// Promise checks
const result5 = match(Promise.resolve(42))
  .when((v, p) => p.isPromise(v), () => 'is promise')
  .default(() => 'not promise')
```

### Async Workflows

```typescript
import { match, fromPromise } from '@ts-result'

// Async predicates (parallel)
const result1 = await match(userData, { execution: 'parallel' })
  .when(async (v, p) => {
    const valid = await db.userExists(v.id)
    return valid && p.isObject(v)
  }, (v) => v.id)
  .default(() => null)

// Async handlers
const result2 = await match(userId)
  .when((v, p) => p.isString(v), async (id) => {
    const user = await db.findUser(id)
    return user ? user.name : 'unknown'
  })
  .default(() => 'guest')

// Combine async predicates and handlers
const result3 = await match(input)
  .when(async (v, p) => {
    const validated = await validate(v)
    return validated.ok && p.isString(v)
  }, async (v) => {
    const processed = await process(v)
    return processed.value
  })
  .default(() => 'invalid')
```

### Custom Predicates

```typescript
import { match, predicates } from '@ts-result'

// Define custom type
interface User {
  id: number
  name: string
  email: string
}

// Add custom predicate
predicates.isUser = (v: unknown): v is User =>
  typeof v === 'object' && v !== null &&
  'id' in v && 'name' in v && 'email' in v

// Use in match
const result = match(data)
  .when((v, p) => p.isUser(v), user => user.name)
  .when((v, p) => p.isNil(v), () => 'guest')
  .default(() => 'unknown')

// Combine predicates
const isValidEmail = (v: unknown): v is string =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

predicates.isValidEmail = isValidEmail

const emailResult = match(input)
  .when((v, p) => p.isValidEmail(v), email => email.toLowerCase())
  .default(() => 'invalid')
```
