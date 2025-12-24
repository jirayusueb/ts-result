import type { Predicates } from "./predicates.js";
import { predicates } from "./predicates.js";

export interface MatchOptions {
  execution?: "parallel" | "sequential";
  predicates?: Partial<Predicates>;
}

class Matcher<T, R = unknown> {
  private hasMatch = false;
  private result?: R;
  private predicates: Predicates;
  private execution: "parallel" | "sequential";
  private isAsync = false;

  constructor(
    private value: T,
    options: MatchOptions = {}
  ) {
    this.predicates = { ...predicates, ...options.predicates };
    this.execution = options.execution ?? "parallel";
  }

  when<U extends T>(
    predicate: (value: T, p: Predicates) => boolean | Promise<boolean>,
    handler: (value: U) => R | Promise<R>
  ): this {
    if (this.hasMatch) return this;

    const predicateResult = predicate(this.value, this.predicates);

    if (predicateResult instanceof Promise) {
      this.isAsync = true;
      predicateResult.then((isMatch) => {
        if (isMatch && !this.hasMatch) {
          this.hasMatch = true;
          const handlerResult = handler(this.value as U);
          if (handlerResult instanceof Promise) {
            handlerResult.then((r) => {
              this.result = r as R;
            });
          } else {
            this.result = handlerResult as R;
          }
        }
      });
    } else if (predicateResult) {
      this.hasMatch = true;
      const handlerResult = handler(this.value as U);
      if (handlerResult instanceof Promise) {
        this.isAsync = true;
        handlerResult.then((r) => {
          this.result = r as R;
        });
      } else {
        this.result = handlerResult as R;
      }
    }

    return this;
  }

  default(handler: (value: T) => R | Promise<R>): R | Promise<R> {
    if (this.isAsync) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (!this.hasMatch) {
            const handlerResult = handler(this.value);
            if (handlerResult instanceof Promise) {
              handlerResult.then((r) => resolve(r));
            } else {
              resolve(handlerResult);
            }
          } else {
            resolve(this.result! as unknown as R);
          }
        }, 0);
      });
    }

    return this.hasMatch ? (this.result! as R) : handler(this.value);
  }

  orElse(result: R): R | Promise<R> {
    if (this.isAsync) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.hasMatch ? (this.result! as unknown as R) : result);
        }, 0);
      });
    }

    return this.hasMatch ? (this.result! as R) : result;
  }
}

export function match<T>(value: T): Matcher<T>;
export function match<T>(value: T, options: MatchOptions): Matcher<T>;
export function match<T>(value: T, options?: MatchOptions): Matcher<T> {
  return new Matcher(value, options);
}
