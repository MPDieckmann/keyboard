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
    };
}
// @ts-ignore
var Symbol;
if (!Symbol) {
    var Symbol_1 = (function (Object, RegExp) {
        var ObjectPrototype = Object.create(null), defineProperty = Object.defineProperty, ObjectGetOwnPropertyNames = Object.getOwnPropertyNames, prefix = ("__" + Math.random() + ":symbol:").replace(".", ""), regexp = new RegExp("^" + prefix + "[0-9]+__$"), primitiveValue = prefix + "0__", id = 1;
        Object.prototype.__proto__ = ObjectPrototype;
        Object.getOwnPropertySymbols = function getOwnPropertySymbols(o) {
            var a = ObjectGetOwnPropertyNames(o), b = 0, c = a.length, d = [];
            for (b; b < c; b++) {
                if (regexp.test(a[b])) {
                    d[d.length] = a[b];
                }
            }
            return d;
        };
        Object.getOwnPropertyNames = function getOwnPropertyNames(o) {
            var a = ObjectGetOwnPropertyNames(o), b = 0, c = a.length, d = [];
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
        var Symbol = function Symbol(name) {
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
            }
            else {
                return new Symbol(name);
            }
        };
        // @ts-ignore
        Symbol.toStringTag = Symbol("toStringTag");
        Symbol.prototype.valueOf = Symbol.prototype.toString = function () {
            return this[primitiveValue];
        };
        return Symbol;
    })(Object, RegExp);
}
var Promise;
if (!Promise) {
    var Promise_1 = (function () {
        // @ts-ignore
        var Status = Symbol("[[Status]]");
        // @ts-ignore
        var Value = Symbol("[[Value]]");
        // @ts-ignore
        var Fullfillments = Symbol("[[Fullfillments]]");
        // @ts-ignore
        var Rejectments = Symbol("[[Rejectments]]");
        return /** @class */ (function () {
            function Promise(executor) {
                var _this = this;
                this[Status] = "pending";
                this[Value] = undefined;
                this[Fullfillments] = [];
                this[Rejectments] = [];
                var resolve = function (value) {
                    if (_this[Status] != "pending") {
                        return;
                    }
                    if (typeof value == "object" && typeof value.then == "function") {
                        try {
                            _this[Status] = "waiting";
                            value.then(function (value) {
                                _this[Status] = "resolved";
                                _this[Value] = value;
                                // execute jobs -> fullfilled
                                _this._job(_this[Fullfillments]);
                            }, function (reason) {
                                _this[Status] = "rejected";
                                _this[Value] = reason;
                                // execute jobs -> rejected
                                _this._job(_this[Rejectments]);
                            });
                        }
                        catch (e) {
                            _this[Status] = "rejected";
                            _this[Value] = e;
                            // execute jobs -> rejected
                            _this._job(_this[Rejectments]);
                        }
                    }
                    else {
                        _this[Status] = "resolved";
                        _this[Value] = value;
                        // execute jobs -> fullfilled
                        _this._job(_this[Fullfillments]);
                    }
                };
                var reject = function (reason) {
                    if (_this[Status] != "pending") {
                        return;
                    }
                    _this[Status] = "rejected";
                    _this[Value] = reason;
                    // execute jobs -> rejected
                    _this._job(_this[Rejectments]);
                };
                executor(resolve, reject);
            }
            Promise.resolve = function (value) {
                return new this(function (resolve) { return resolve(value); });
            };
            Promise.reject = function (reason) {
                return new this(function (resolve, reject) { return reject(reason); });
            };
            Promise.prototype._job = function (list) {
                if (this[Status] == "pending" || this[Status] == "waiting") {
                    return;
                }
                var fnc;
                while (fnc = list.shift()) {
                    fnc(this[Value]);
                }
            };
            Promise.prototype.then = function (onfulfilled, onrejected) {
                var _this = this;
                return new this.constructor(function (resolve, reject) {
                    _this[Fullfillments].push(function (value) {
                        try {
                            resolve(typeof onfulfilled == "function" ? onfulfilled(value) : value);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                    _this[Rejectments].push(function (reason) {
                        try {
                            resolve(typeof onrejected == "function" ? onrejected(reason) : undefined);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                    if (_this[Status] == "resolved") {
                        _this._job(_this[Fullfillments]);
                    }
                    else if (_this[Status] == "rejected") {
                        _this._job(_this[Rejectments]);
                    }
                });
            };
            Promise.prototype.catch = function (onrejected) {
                return this.then(null, onrejected);
            };
            return Promise;
        }());
    })();
}
loadScript("keyboard.js");
//# sourceMappingURL=polyfill.js.map