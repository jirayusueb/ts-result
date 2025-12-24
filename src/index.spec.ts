import { describe, expect, it } from "vitest";
import {
  ok,
  err,
  match,
  fromPromise,
  tryCatch,
  all,
  any,
  some,
  none,
  fromNullable,
  toNullable,
  fromArray,
  toArray
} from "./index.js";

describe("Result<T, E>", () => {
  describe("Ok<T, E>", () => {
    it("should create Ok value", () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    it("should unwrap value", () => {
      const result = ok(42);
      expect(result.unwrap()).toBe(42);
    });

    it("should unwrapOr return value", () => {
      const result = ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it("should unwrapOrElse return value", () => {
      const result = ok(42);
      expect(result.unwrapOrElse(() => 0)).toBe(42);
    });

    it("should expect return value", () => {
      const result = ok(42);
      expect(result.expect("Failed")).toBe(42);
    });

    it("should map value", () => {
      const result = ok(42);
      const mapped = result.map((x) => x * 2);
      expect(mapped.unwrap()).toBe(84);
    });

    it("should not mapErr", () => {
      const result: Ok<number, string> = ok(42);
      const mapped = result.mapErr((e) => e.toUpperCase());
      expect(mapped.unwrap()).toBe(42);
    });

    it("should andThen", () => {
      const result = ok(42);
      const chained = result.andThen((x) => ok(x * 2));
      expect(chained.unwrap()).toBe(84);
    });

    it("should not orElse", () => {
      const result = ok(42);
      const other = ok(10);
      const chained = result.orElse(() => other);
      expect(chained.unwrap()).toBe(42);
    });

    it("should and return second", () => {
      const result = ok(42);
      const second = ok("hello");
      const combined = result.and(second);
      expect(combined.unwrap()).toBe("hello");
    });

    it("should or return first", () => {
      const result = ok(42);
      const other = err("error");
      const combined = result.or(other as any);
      expect(combined.unwrap()).toBe(42);
    });

    it("should return Some from ok()", () => {
      const result = ok(42);
      const opt = result.ok();
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap()).toBe(42);
    });

    it("should return None from err()", () => {
      const result = ok(42);
      const opt = result.err();
      expect(opt.isNone()).toBe(true);
    });

    it("should match ok case", () => {
      const result = ok(42);
      const value = result.match({
        ok: (v) => v * 2,
        err: (_e) => 0
      });
      expect(value).toBe(84);
    });
  });

  describe("Err<T, E>", () => {
    it("should create Err value", () => {
      const result = err("error");
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });

    it("should unwrap throw error", () => {
      const result = err("error");
      expect(() => result.unwrap()).toThrow();
    });

    it("should unwrapOr return default", () => {
      const result: Err<number, string> = err("error");
      expect(result.unwrapOr(42)).toBe(42);
    });

    it("should unwrapOrElse return default", () => {
      const result: Err<number, string> = err("error");
      expect(result.unwrapOrElse(() => 42)).toBe(42);
    });

    it("should expect throw error", () => {
      const result = err("error");
      expect(() => result.expect("Failed")).toThrow("Failed");
    });

    it("should not map", () => {
      const result = err("error");
      const mapped = result.map((x) => x * 2);
      expect(mapped.isErr()).toBe(true);
    });

    it("should mapErr", () => {
      const result = err("error");
      const mapped = result.mapErr((e) => e.toUpperCase());
      expect(mapped.isErr()).toBe(true);
      expect((mapped as any).error).toBe("ERROR");
    });

    it("should not andThen", () => {
      const result = err("error");
      const chained = result.andThen((x) => ok(x * 2));
      expect(chained.isErr()).toBe(true);
    });

    it("should orElse", () => {
      const result = err("error");
      const other = ok(42);
      const chained = result.orElse(() => other);
      expect(chained.unwrap()).toBe(42);
    });

    it("should not and", () => {
      const result = err("error");
      const second = ok(42);
      const combined = result.and(second as any);
      expect(combined.isErr()).toBe(true);
    });

    it("should or return second", () => {
      const result = err("error");
      const other = ok(42);
      const combined = result.or(other);
      expect(combined.unwrap()).toBe(42);
    });

    it("should return None from ok()", () => {
      const result = err("error");
      const opt = result.ok();
      expect(opt.isNone()).toBe(true);
    });

    it("should return Some from err()", () => {
      const result = err("error");
      const opt = result.err();
      expect(opt.isSome()).toBe(true);
      expect(opt.unwrap()).toBe("error");
    });

    it("should match err case", () => {
      const result = err("error");
      const value = result.match({
        ok: (v) => v * 2,
        err: (e) => `Error: ${e}`
      });
      expect(value).toBe("Error: error");
    });
  });
});

describe("Option<T>", () => {
  describe("Some<T>", () => {
    it("should create Some value", () => {
      const opt = some(42);
      expect(opt.isSome()).toBe(true);
      expect(opt.isNone()).toBe(false);
    });

    it("should unwrap value", () => {
      const opt = some(42);
      expect(opt.unwrap()).toBe(42);
    });

    it("should unwrapOr return value", () => {
      const opt = some(42);
      expect(opt.unwrapOr(0)).toBe(42);
    });

    it("should unwrapOrElse return value", () => {
      const opt = some(42);
      expect(opt.unwrapOrElse(() => 0)).toBe(42);
    });

    it("should map value", () => {
      const opt = some(42);
      const mapped = opt.map((x) => x * 2);
      expect(mapped.unwrap()).toBe(84);
    });

    it("should mapOr return mapped value", () => {
      const opt = some(42);
      const mapped = opt.mapOr(0, (x) => x * 2);
      expect(mapped).toBe(84);
    });

    it("should mapOrElse return mapped value", () => {
      const opt = some(42);
      const mapped = opt.mapOrElse(
        () => 0,
        (x) => x * 2
      );
      expect(mapped).toBe(84);
    });

    it("should andThen", () => {
      const opt = some(42);
      const chained = opt.andThen((x) => some(x * 2));
      expect(chained.unwrap()).toBe(84);
    });

    it("should or return first", () => {
      const opt = some(42);
      const other = some(10);
      const combined = opt.or(other);
      expect(combined.unwrap()).toBe(42);
    });

    it("should orElse return first", () => {
      const opt = some(42);
      const other = some(10);
      const combined = opt.orElse(() => other);
      expect(combined.unwrap()).toBe(42);
    });

    it("should match some case", () => {
      const opt = some(42);
      const value = opt.match({
        some: (v) => v * 2,
        none: () => 0
      });
      expect(value).toBe(84);
    });
  });

  describe("None<T>", () => {
    it("should create None value", () => {
      const opt = none<number>();
      expect(opt.isSome()).toBe(false);
      expect(opt.isNone()).toBe(true);
    });

    it("should unwrap throw error", () => {
      const opt = none<number>();
      expect(() => opt.unwrap()).toThrow();
    });

    it("should unwrapOr return default", () => {
      const opt = none<number>();
      expect(opt.unwrapOr(42)).toBe(42);
    });

    it("should unwrapOrElse return default", () => {
      const opt = none<number>();
      expect(opt.unwrapOrElse(() => 42)).toBe(42);
    });

    it("should not map", () => {
      const opt = none<number>();
      const mapped = opt.map((x) => x * 2);
      expect(mapped.isNone()).toBe(true);
    });

    it("should mapOr return default", () => {
      const opt = none<number>();
      const mapped = opt.mapOr(0, (x) => x * 2);
      expect(mapped).toBe(0);
    });

    it("should mapOrElse return default", () => {
      const opt = none<number>();
      const mapped = opt.mapOrElse(
        () => 0,
        (x) => x * 2
      );
      expect(mapped).toBe(0);
    });

    it("should not andThen", () => {
      const opt = none<number>();
      const chained = opt.andThen((x) => some(x * 2));
      expect(chained.isNone()).toBe(true);
    });

    it("should or return second", () => {
      const opt = none<number>();
      const other = some(42);
      const combined = opt.or(other);
      expect(combined.unwrap()).toBe(42);
    });

    it("should orElse return second", () => {
      const opt = none<number>();
      const other = some(42);
      const combined = opt.orElse(() => other);
      expect(combined.unwrap()).toBe(42);
    });

    it("should match none case", () => {
      const opt = none<number>();
      const value = opt.match({
        some: (v) => v * 2,
        none: () => 0
      });
      expect(value).toBe(0);
    });
  });
});

describe("match function", () => {
  it("should match sync predicates", () => {
    const result = match(42)
      .when(
        (v, p) => p.isNumber(v),
        (n) => n * 2
      )
      .default(() => 0);
    expect(result).toBe(84);
  });

  it("should match string", () => {
    const result = match("hello")
      .when(
        (v, p) => p.isString(v),
        (s) => s.toUpperCase()
      )
      .default(() => "unknown");
    expect(result).toBe("HELLO");
  });

  it("should use default", () => {
    const result = match(null)
      .when(
        (v, p) => p.isNumber(v),
        (n) => n * 2
      )
      .default(() => "default");
    expect(result).toBe("default");
  });

  it("should match multiple predicates", () => {
    const result = match(42)
      .when(
        (v, p) => p.isString(v),
        (s) => s.length
      )
      .when(
        (v, p) => p.isNumber(v),
        (n) => n * 2
      )
      .default(() => 0);
    expect(result).toBe(84);
  });

  it("should support async predicates", async () => {
    const result = await match(42)
      .when(
        async (v, p) => {
          await Promise.resolve();
          return p.isNumber(v);
        },
        (n) => n * 2
      )
      .default(() => 0);
    expect(result).toBe(84);
  });

  it("should support async handlers", async () => {
    const result = await match(42)
      .when(
        (v, p) => p.isNumber(v),
        async (n) => {
          await Promise.resolve();
          return n * 2;
        }
      )
      .default(() => 0);
    expect(result).toBe(84);
  });

  it("should use orElse", () => {
    const result = match(null)
      .when(
        (v, p) => p.isNumber(v),
        (n) => n * 2
      )
      .orElse("default");
    expect(result).toBe("default");
  });
});

describe("tryCatch", () => {
  it("should return Ok on success", () => {
    const result = tryCatch(() => 42);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(42);
  });

  it("should return Err on error", () => {
    const result = tryCatch(() => {
      throw new Error("test");
    });
    expect(result.isErr()).toBe(true);
    expect((result as any).error).toBeInstanceOf(Error);
  });
});

describe("all", () => {
  it("should combine Ok results", () => {
    const results = [ok(1), ok(2), ok(3)];
    const combined = all(results);
    expect(combined.isOk()).toBe(true);
    expect(combined.unwrap()).toEqual([1, 2, 3]);
  });

  it("should return first Err", () => {
    const results = [ok(1), err("error"), ok(3)];
    const combined = all(results);
    expect(combined.isErr()).toBe(true);
    expect((combined as any).error).toBe("error");
  });
});

describe("any", () => {
  it("should return first Ok", () => {
    const results = [err("e1"), ok(42), err("e2")];
    const result = any(results);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(42);
  });

  it("should return last Err if all error", () => {
    const results = [err("e1"), err("e2")];
    const result = any(results);
    expect(result.isErr()).toBe(true);
  });
});

describe("fromPromise", () => {
  it("should return Ok on success", async () => {
    const result = await fromPromise(Promise.resolve(42), (e) => String(e));
    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toBe(42);
  });

  it("should return Err on failure", async () => {
    const result = await fromPromise(Promise.reject(new Error("test")), (e) => String(e));
    expect(result.isErr()).toBe(true);
  });
});

describe("fromNullable", () => {
  it("should return Some for value", () => {
    const opt = fromNullable(42);
    expect(opt.isSome()).toBe(true);
    expect(opt.unwrap()).toBe(42);
  });

  it("should return None for null", () => {
    const opt = fromNullable(null);
    expect(opt.isNone()).toBe(true);
  });

  it("should return None for undefined", () => {
    const opt = fromNullable(undefined);
    expect(opt.isNone()).toBe(true);
  });
});

describe("toNullable", () => {
  it("should return value for Some", () => {
    const result = toNullable(some(42));
    expect(result).toBe(42);
  });

  it("should return null for None", () => {
    const result = toNullable(none());
    expect(result).toBeNull();
  });
});

describe("fromArray", () => {
  it("should return Some for non-empty array", () => {
    const opt = fromArray([1, 2, 3]);
    expect(opt.isSome()).toBe(true);
    expect(opt.unwrap()).toEqual([1, 2, 3]);
  });

  it("should return None for empty array", () => {
    const opt = fromArray([]);
    expect(opt.isNone()).toBe(true);
  });
});

describe("toArray", () => {
  it("should return array for Some", () => {
    const result = toArray(some(42));
    expect(result).toEqual([42]);
  });

  it("should return empty array for None", () => {
    const result = toArray(none());
    expect(result).toEqual([]);
  });
});
