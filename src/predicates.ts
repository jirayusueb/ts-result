export const isString = (val: unknown): val is string => typeof val === "string";

export const isNumber = (val: unknown): val is number => typeof val === "number";

export const isBoolean = (val: unknown): val is boolean => typeof val === "boolean";

export const isNull = (val: unknown): val is null => val === null;

export const isUndefined = (val: unknown): val is undefined => val === undefined;

export const isNil = (val: unknown): val is null | undefined => val == null;

export const isArray = Array.isArray;

export const isFunction = (val: unknown): val is (...args: never[]) => unknown =>
  typeof val === "function";

export const isObject = (val: unknown): val is object => typeof val === "object" && val !== null;

export const isPromise = (val: unknown): val is Promise<unknown> => val instanceof Promise;

export const isDate = (val: unknown): val is Date => val instanceof Date;

export const isRegExp = (val: unknown): val is RegExp => val instanceof RegExp;

export const isTruthy = (val: unknown): boolean => !!val;

export const isFalsy = (val: unknown): boolean => !val;

export const isEmpty = (val: unknown): boolean => {
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "string") return val.length === 0;
  if (val instanceof Map || val instanceof Set) return val.size === 0;
  return val == null;
};

const isOk = <_T, _E>(val: unknown): val is { isOk: () => true; _: "ok" } =>
  typeof val === "object" && val !== null && "_Ok" in val;

const isErr = <_T, _E>(val: unknown): val is { isErr: () => true; _: "err" } =>
  typeof val === "object" && val !== null && "_Err" in val;

const isSome = <_T>(val: unknown): val is { isSome: () => true; _: "some" } =>
  typeof val === "object" && val !== null && "_Some" in val;

const isNone = <_T>(val: unknown): val is { isNone: () => true; _: "none" } =>
  typeof val === "object" && val !== null && "_None" in val;

const predicates = {
  isString,
  isNumber,
  isBoolean,
  isNull,
  isUndefined,
  isNil,
  isArray,
  isFunction,
  isObject,
  isPromise,
  isDate,
  isRegExp,
  isOk: <_T, _E>(val: unknown): val is unknown =>
    typeof val === "object" &&
    val !== null &&
    typeof (val as any).isOk === "function" &&
    (val as any).isOk() === true,
  isErr: <_T, _E>(val: unknown): val is unknown =>
    typeof val === "object" &&
    val !== null &&
    typeof (val as any).isErr === "function" &&
    (val as any).isErr() === true,
  isSome: <_T>(val: unknown): val is unknown =>
    typeof val === "object" &&
    val !== null &&
    typeof (val as any).isSome === "function" &&
    (val as any).isSome() === true,
  isNone: <_T>(val: unknown): val is unknown =>
    typeof val === "object" &&
    val !== null &&
    typeof (val as any).isNone === "function" &&
    (val as any).isNone() === true,
  isTruthy,
  isFalsy,
  isEmpty
};

export type Predicates = typeof predicates;

export { predicates, isOk, isErr, isSome, isNone };
