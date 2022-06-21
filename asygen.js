// @ts-check

export { whoIsFirst, PromiseStatus };

/**
 * Returns a Promise that waits for a specified delay time (in ms), then
 * resolves with `undefined`.
 * @param {number} delay - Waiting delay in milliseconds.
 * @returns {Promise<undefined>}
 */
function wait(delay) {
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

/**
 * @enum {string} Represents status of a Promise.
 */
const PromiseStatus = {
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

/**
 * Being given an array of Promise objects, returns a Promise that will be resolved
 * by the result of the first resolved Promise among array elements.
 *
 * @typedef {{status: PromiseStatus; value: any; index: number}} TFulfilledResult
 * @typedef {{status: PromiseStatus; reason: any; index: number}} TRejectedResult
 *
 * @param {Promise[]} promises - Array of Promise objects. May be sparse?
 * @param {Promise[]} rest
 * @returns {Promise<TFulfilledResult | TRejectedResult>} Promise fulfilled with the
 * value (reason) and index of the first resolved (rejected) Promise from the array.
 */
function whoIsFirst(promises, ...rest) {
  promises = Array.of(promises).concat(rest).flat();
  return new Promise((resolve) => {
    promises.forEach((promise, index) =>
      Promise.resolve(promise)
        .then((value) => {
          resolve({
            status: PromiseStatus.FULFILLED,
            value: value,
            index: index,
          });
        })
        .catch((reason) => {
          resolve({
            status: PromiseStatus.REJECTED,
            reason: reason,
            index: index,
          });
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
    if (result.status === PromiseStatus.FULFILLED) {
      yield /** @type {TFulfilledResult} */ (result).value; // and returning its value
    } else {
      // do nothing
    }
  }
}
