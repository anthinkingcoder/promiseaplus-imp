const PENDING = Symbol('pending');
const FULFILLED = Symbol('fulfilled');
const REJECTED = Symbol('rejected');
const asyncTask = require('./asyncTask');

function noop() {
}

function reject(reason, promise) {
  if (promise && promise.state === PENDING) {
    promise.state = REJECTED;
    promise.reason = reason;
    promise.onRejectedTasks.forEach(task => task());
  }
}

function resolve(value, promise) {
  if (promise && promise.state === PENDING) {
    promise.state = FULFILLED;
    promise.value = value;
    promise.onFulfilledTasks.forEach(task => task());
  }
}

const toString = Object.prototype.toString;

function isFunction(object) {
  return toString.call(object) === '[object Function]';
}

function isObject(object) {
  return toString.call(object) === '[object Object]';
}

function isPromise(object) {
  return toString.call(object) === '[object Promise]';
}


class Promise {
  constructor(resolver) {
    this.value = undefined;
    this.reason = undefined;
    this.state = PENDING;
    this.onFulfilledTasks = [];
    this.onRejectedTasks = [];
    try {
      noop !== resolver && resolver((value) => {
        resolve(value, this);
      }, (reason) => {
        reject(reason, this);
      });
    } catch (e) {
      reject(e, this);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => value;
    onRejected = isFunction(onRejected) ? onRejected : (error) => {
      throw error
    };

    let promise2 = new Promise(noop);

    const onFulfilledTask = () => {
      asyncTask(() => {
        try {
          let x = onFulfilled(this.value);
          this._procedure(promise2, x);
        } catch (e) {
          reject(e, promise2);
        }
      })
    };
    const onRejectedTask = () => {
      asyncTask(() => {
        try {
          let x = onRejected(this.reason);
          this._procedure(promise2, x);
        } catch (e) {
          reject(e, promise2);
        }
      })
    };

    switch (this.state) {
      case PENDING:
        this.onFulfilledTasks.push(onFulfilledTask);
        this.onRejectedTasks.push(onRejectedTask);
        break;
      case FULFILLED:
        onFulfilledTask();
        break;
      case REJECTED:
        onRejectedTask();
        break;
    }
    return promise2;
  }

  _procedure(promise2, x) {
    if (promise2 === x) {
      reject(new TypeError(''), promise2);
    }
    let called = false;
    if (isObject(x) || isFunction(x)) {
      try {
        let then = x.then;
        if (isFunction(then)) {
          then.call(x, (y) => {
            if (called) return;
            called = true;
            this._procedure(promise2, y);
          }, (r) => {
            if (called) return;
            called = true;
            reject(r, promise2)
          })
        } else {
          resolve(x, promise2);
        }

      } catch (e) {
        if (called) return;
        called = true;
        reject(e, promise2);
      }
    } else {
      resolve(x, promise2);
    }
  }

  catch(fn) {
    let promise = this;
    return promise.then(null, fn);
  }

  finally(fn) {
    let promise = this;
    return promise.then(value => Promise.resolve(fn()).then(() => value),
        reason => Promise.reject(fn()).then(() => {
          throw reason
        }))
  }

  static resolve(value) {
    let promise = new Promise(noop);
    resolve(value, promise);
    return promise;
  }

  static reject(reason) {
    let promise = new Promise(noop);
    reject(reason, promise);
    return promise;
  }

  static race(promises) {
    return new Promise(function (resolve, reject) {
      if ((Array.isArray(promises) && promises.length === 0)) {
      } else {
        promises.forEach(promise => {
          if (!isPromise(promise)) {
            resolve(promise);
          } else {
            promise.then((value) => {
              resolve(value);
            }, (reason) => {
              reject(reason);
            })
          }
        })
      }
    })
  };

  static all(promises) {
    let result = [], count = 0;
    return new Promise(function (resolve, reject) {
      if ((Array.isArray(promises) && !promises.length)) {
        resolve();
      } else {
        promises.forEach((promise, index) => {
          if (!isPromise(promise)) {
            result[index] = promise;
            count += 1;
            if (count === promises.length) {
              resolve(result);
            }
          } else {
            promise.then((value) => {
              result[index] = value;
              count += 1;
              if (count === promises.length) {
                resolve(result);
              }
            }, (reason) => {
              reject(reason);
            })
          }

        })
      }

    })
  }

  static allSettled(promises) {
    return new Promise(function (resolve) {
      const result = [];
      let count = 0;
      if (Array.isArray(promises) && !promises.length) {
        resolve(result);
      }else {
        promises.forEach((promise, index) => {
          if (isPromise(promise)) {
            promise.then((value) => {
              result[index] = {
                status: FULFILLED.description || 'fulfilled',
                value
              };
              count++;
              if (count === promises.length) {
                resolve(result);
              }
            }, (reason) => {
              result[index] = {
                status: REJECTED.description || 'rejected',
                reason
              };
              count++;
              if (count === promises.length) {
                resolve(result);
              }
            })
          }else {
            result[index] = {
              status: FULFILLED.description || 'fulfilled',
              value: promise
            };
            count++;
            if (count === promises.length) {
              resolve(result);
            }
          }
        })
      }
    })
  }

  get [Symbol.toStringTag]() {
    return 'Promise';
  }
}


module.exports = Promise;
