const Promise = require('../');
setTimeout(function () {
  console.log('c');
})
const promise = new Promise(function (resolve, reject) {
  resolve('b');
}).then(function (value) {
  console.log(value);
  return value;
}).then(function (value) {
  console.log(value)
  return Promise.reject(value)
}).catch(function (reason) {
  console.log(reason)
});
console.log('a');

