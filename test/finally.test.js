const Promise = require('../');

const promise = Promise.resolve('123').finally(function () {
  console.log('finally')
})

const promise1 = Promise.reject('123').finally(function () {
  console.log('finally')
})