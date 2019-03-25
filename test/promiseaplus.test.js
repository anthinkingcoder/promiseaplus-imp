const Promise = require('../')

// promises-aplus-tests promiseaplus.test.js
Promise.defer = Promise.deferred = function () {
  let dfd = {}
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd;
}


module.exports = Promise