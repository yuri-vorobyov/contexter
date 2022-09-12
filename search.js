// @ts-check

import { search as gbSearch } from "./gb-client.js";
import { search as olSearch } from "./ol-client.js";

import { FulfilledElement, whoIsFirst } from "./asygen.js";

import { Source } from "./source.js";

/**
 * Performs search using available full-text search APIs. Currently available are Google Books and
 * Open Library. This routine implements an asyncronous generator.
 *
 * @param {string} search - What we search context for.
 * @returns {AsyncGenerator<Source[]>}
 */
export default async function* search(search) {
  /* Creating generators with search results for each API. Any number of search engines
     is supported. */
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
