export { Ok, Err, ok, err } from "./result.js";
export type { Result } from "./result.js";

export { Some, None, some, none } from "./option.js";
export type { Option } from "./option.js";

export { match } from "./match.js";
export type { MatchOptions } from "./match.js";

export { predicates } from "./predicates.js";
export type { Predicates } from "./predicates.js";

export {
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
  isOk,
  isErr,
  isSome,
  isNone,
  isTruthy,
  isFalsy,
  isEmpty
} from "./predicates.js";

export { fromPromise, toPromise, toPromiseOr } from "./async.js";

export { tryCatch, all, any, fromNullable, toNullable, fromArray, toArray } from "./utils.js";
