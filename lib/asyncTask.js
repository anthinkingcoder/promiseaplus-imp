const nextTick = typeof process !== 'undefined' && process.nextTick;
const MutationObserver = typeof window !== "undefined" && window.MutationObserver;


let callbacks = []

function flushCallback() {
  for (let i = 0; i < callbacks.length; i++) {
    let callback = callbacks[i]
    callback()
  }
  callbacks = [];
}


let asyncTask = null;

if (nextTick) {
  asyncTask = (fn => {
    callbacks.push(() => {
      nextTick(fn)
    })
    flushCallback();
  })
} else if (MutationObserver) {
  const observer = new MutationObserver(flushCallback);
  let value = 0;
  const node = document.createTextNode();
  observer.observe(node);
  asyncTask = (fn) => {
    callbacks.push(fn);
    node.data = (value = (value + 1) % 2);
  }
} else {
  asyncTask = (fn => {
    callbacks.push(() => {
      setTimeout(fn, 0);
    })
    flushCallback();
  })
}

module.exports = asyncTask;