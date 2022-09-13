// @ts-check

/**
 * Returns a Promise that waits for a specified delay time (in ms), then
 * resolves with `undefined`.
 * @param {number} delay - Waiting delay in milliseconds.
 * @returns {Promise<undefined>}
 */
export function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Returns a Promise which waits for a specified delay (in ms), then
 * resolves with a specified value.
 * @param {number} delay - Waiting delay in milliseconds.
 * @template T
 * @param {T} result - Resolution result.
 * @returns {Promise<T>} A Promise fulfilled with `result` after specified `delay`.
 */
async function waitAndReturn(delay, result) {
  await wait(delay);
  return result;
}

export class FulfilledElement {
  /**
   *
   * @param {*} value
   * @param {Number} index
   */
  constructor(value, index) {
    this.value = value;
    this.index = index;
  }
}

export class RejectedElement {
  /**
   *
   * @param {*} reason
   * @param {Number} index
   */
  constructor(reason, index) {
    this.reason = reason;
    this.index = index;
  }
}

/**
 * Being given an array of Promise objects, returns a Promise that will be resolved
 * by the result of the first resolved Promise among array elements.
 *
 * @param {Promise[]} promises - Array of Promise objects.
 * @returns {Promise<FulfilledElement | RejectedElement>} Promise fulfilled with the
 * value (reason) and index of the first fulfilled (rejected) Promise from the array.
 */
export function whoIsFirst(promises) {
  return new Promise((resolve) => {
    // forEach ignores empty elements so sparse arrays are Ok here
    promises.forEach((promise, index) =>
      Promise.resolve(promise) // "promisifying"
        .then((value) => {
          resolve(new FulfilledElement(value, index));
        })
        .catch((reason) => {
          resolve(new RejectedElement(reason, index));
        })
    );
  });
}

/**
 * Generator returning fullfillment values of Promises from the input array in
 * the order of their resolution.
 * @param {Promise[]} proms - Array of Promises.
 */
async function* contest(proms) {
  const promises = Array.from(proms);
  while (promises.length > 0) {
    const result = await whoIsFirst(promises); // waiting for a resolved Promise
    promises.splice(result.index, 1); // removing it from the array
    if (result instanceof FulfilledElement) {
      yield result.value; // and returning its value
    } else {
      // do nothing (ignore rejected Promises)
    }
  }
}

/**
 * Runs many async generator concurrently. In essence, it converts many async generators
 * to a single async generator. This generator will yield the first available value among
 * all the generators untill they all are not done.
 *
 * It should be noted here that in case there are resolved Promises available in several
 * generators they will be returned in the order in which their corresponding generators
 * presented in the input array, and not necessary in order of their resolution.
 *
 * @param {AsyncGenerator[]} geners - Array of async generators to run concurrently.
 */
async function* runAll(geners) {
  /* copy of generators array */
  const generators = Array.from(geners);
  /* array of promises, resolved with the first returned value of each generator */
  const promises = generators.map((generator) => generator.next());

  while (promises.length > 0) {
    /* getting earliest */
    const result = await whoIsFirst(promises); // {value, index}, where value is {value, done}
    if (!result.value.done) {
      /* for the earliest generator - next iteration, others are still on previous */
      promises[result.index] = generators[result.index].next();
      /* yielding result */
      yield result.value.value;
    } else {
      /* a generator is done - forget about it */
      promises.splice(result.index, 1);
      generators.splice(result.index, 1);
    }
  }
}
