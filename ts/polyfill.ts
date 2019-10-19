// @ts-nocheck
interface Object {
  __proto__: any;
}
interface ObjectConstructor {
  getOwnPropertySymbols(o: any): Symbol[];
  assign(target: any, ...sources: any[]): any;
  assign<T, U>(target: T, source: U): T & U;
}
if ("assign" in Object) {
  Object.assign = function (target, source) {
    var a = 1;
    var b = arguments.length;
    for (a; a < b; a++) {
      Object.keys(arguments[a]).forEach(function (c) {
        target[c] = arguments[a][c];
      });
    }
    return target;
  }
}
interface Symbol {
  /** Returns a string representation of an object. */
  toString(): string;

  /** Returns the primitive value of the specified object. */
  valueOf(): symbol;
}
interface SymbolConstructor {
  /**
   * A reference to the prototype.
   */
  (name?: string): symbol;
  // @ts-ignore
  readonly prototype: symbol;
  [name: string]: symbol;
  // @ts-ignore
  toStringTag: symbol;
}
interface Symbol {
  (name?: string): symbol;
}
// @ts-ignore
var Symbol: SymbolConstructor;
if (!Symbol) {
  const Symbol = (function (Object, RegExp) {
    var ObjectPrototype = Object.create(null),
      defineProperty = Object.defineProperty,
      ObjectGetOwnPropertyNames = Object.getOwnPropertyNames,
      prefix = ("__" + Math.random() + ":symbol:").replace(".", ""),
      regexp = new RegExp("^" + prefix + "[0-9]+__$"),
      primitiveValue = prefix + "0__",
      id = 1;
    Object.prototype.__proto__ = ObjectPrototype;
    Object.getOwnPropertySymbols = function getOwnPropertySymbols(o) {
      var a = ObjectGetOwnPropertyNames(o),
        b = 0,
        c = a.length,
        d = [];
      for (b; b < c; b++) {
        if (regexp.test(a[b])) {
          d[d.length] = a[b];
        }
      }
      return d;
    };
    Object.getOwnPropertyNames = function getOwnPropertyNames(o) {
      var a = ObjectGetOwnPropertyNames(o),
        b = 0,
        c = a.length,
        d = [];
      for (b; b < c; b++) {
        if (!regexp.test(a[b])) {
          d[d.length] = a[b];
        }
      }
      return d;
    };
    defineProperty(ObjectPrototype, primitiveValue, {
      enumerable: false,
      configurable: false,
      get: undefined,
      set: function (value) {
        defineProperty(this, primitiveValue, {
          enumerable: false,
          configurable: true,
          writable: true,
          value: value
        });
      }
    });
    var Symbol = function Symbol(name?: string): void {
      if (this instanceof Symbol && Symbol.caller == Symbol) {
        var __symbol__ = prefix + id++ + "__";
        this[primitiveValue] = __symbol__;
        defineProperty(ObjectPrototype, __symbol__, {
          enumerable: false,
          configurable: false,
          get: undefined,
          set: function (value) {
            defineProperty(this, __symbol__, {
              enumerable: false,
              configurable: true,
              writable: true,
              value: value
            });
          }
        });
        return this;
      } else {
        return new Symbol(name);
      }
    };
    // @ts-ignore
    Symbol.toStringTag = Symbol("toStringTag");
    Symbol.prototype.valueOf = Symbol.prototype.toString = function () {
      return this[primitiveValue];
    }
    return <SymbolConstructor>Symbol;
  })(Object, RegExp);
}
interface Promise<T> {
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
}
interface PromiseConstructor {
  /**
   * A reference to the prototype.
   */
  readonly prototype: Promise<any>;

  /**
   * Creates a new Promise.
   * @param executor A callback used to initialize the promise. This callback is passed two arguments:
   * a resolve callback used resolve the promise with a value or the result of another promise,
   * and a reject callback used to reject the promise with a provided reason or error.
   */
  new <T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;

  resolve<T>(value?: T | PromiseLike<T>): Promise<T>
}
var Promise: PromiseConstructor;
if (!Promise) {
  const Promise = (function () {
    // @ts-ignore
    const Status: symbol = Symbol("[[Status]]");
    // @ts-ignore
    const Value: symbol = Symbol("[[Value]]");
    // @ts-ignore
    const Fullfillments: symbol = Symbol("[[Fullfillments]]");
    // @ts-ignore
    const Rejectments: symbol = Symbol("[[Rejectments]]");
    return class Promise<T> {
      static resolve<T>(value?: T | PromiseLike<T>) {
        return new this(resolve => resolve(value));
      }
      static reject<T>(reason?: any) {
        return new this((resolve, reject) => reject(reason));
      }
      constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
        this[Status] = "pending";
        this[Value] = undefined;
        this[Fullfillments] = [];
        this[Rejectments] = [];
        const resolve = (value: T) => {
          if (this[Status] != "pending") {
            return;
          }
          if (typeof value == "object" && typeof (<any>value).then == "function") {
            try {
              this[Status] = "waiting";
              (<any>value).then(value => {
                this[Status] = "resolved";
                this[Value] = value;
                // execute jobs -> fullfilled
                this._job(this[Fullfillments]);
              }, reason => {
                this[Status] = "rejected";
                this[Value] = reason;
                // execute jobs -> rejected
                this._job(this[Rejectments]);
              });
            }
            catch (e) {
              this[Status] = "rejected";
              this[Value] = e;
              // execute jobs -> rejected
              this._job(this[Rejectments]);
            }
          }
          else {
            this[Status] = "resolved";
            this[Value] = value;
            // execute jobs -> fullfilled
            this._job(this[Fullfillments]);
          }
        };
        const reject = reason => {
          if (this[Status] != "pending") {
            return;
          }
          this[Status] = "rejected";
          this[Value] = reason;
          // execute jobs -> rejected
          this._job(this[Rejectments]);
        };
        executor(resolve, reject);
      }
      private _job(list) {
        if (this[Status] == "pending" || this[Status] == "waiting") {
          return;
        }
        let fnc;
        while (fnc = list.shift()) {
          fnc(this[Value]);
        }
      }
      then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
        return new (<{ new(executor: (resolve: (value?) => void, reject: (reason?) => void) => void): any }>this.constructor)((resolve, reject) => {
          this[Fullfillments].push(value => {
            try {
              resolve(typeof onfulfilled == "function" ? onfulfilled(value) : value);
            }
            catch (e) {
              reject(e);
            }
          });
          this[Rejectments].push(reason => {
            try {
              resolve(typeof onrejected == "function" ? onrejected(reason) : undefined);
            }
            catch (e) {
              reject(e);
            }
          });
          if (this[Status] == "resolved") {
            this._job(this[Fullfillments]);
          }
          else if (this[Status] == "rejected") {
            this._job(this[Rejectments]);
          }
        });
      }
      catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
        return this.then(null, onrejected);
      }
    }
  })();
}
loadScript("keyboard.js");