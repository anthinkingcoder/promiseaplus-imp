const Promise = require('../');

const promise1 = Promise.resolve(3);
const promise2 = new Promise((resolve, reject) => setTimeout(reject, 100, 'foo'));
const a = {
  name: 'normal object'
};
const promises = [promise1, promise2, a];

Promise.allSettled(promises).
then((results) => results.forEach((result) => console.log(result)));
