// @ts-check

import { search as gbSearch } from "./gb-client.js";
import { search as olSearch } from "./ol-client.js";

import { FulfilledElement, whoIsFirst } from "./asygen.js";

/**
 *
 * @param {string} search - What we search context for.
 */
export default async function* search(search) {
  /* creating generators with search results for each API */
  const generators = [gbSearch(search), olSearch(search)];

  /* array of promises, resolved with the first returned value of each generator */
  const promises = generators.map((generator) => generator.next());

  while (promises.length > 0) {
    /* getting earliest */
    const result = await whoIsFirst(promises); // {value, index}, where value is {value, done}
    /* by default, only fulfilled promises (requests with search results) are returned */
    if (result instanceof FulfilledElement) {
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
}
