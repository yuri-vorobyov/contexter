// @ts-check

import { wait, whoIsFirst, FulfilledElement } from "./asygen.js";
import { Snippet } from "./snippet.js";
import { Source } from "./source.js";
export { search, searchPage };

/**
 * A book information returned by Google Books API. The concrete set of properties
 * is controlled by {@link urlFor}.
 * @typedef Item
 * @type {{volumeInfo: {title: string, authors: string[], publishedDate: string},
 *         searchInfo: {textSnippet: string}}}
 */

/**
 * Number of results on a single page.
 * @const {Number}
 */
const COUNT = 40;

/**
 * Constructs a url for Google Books API for the specified search string.
 * @param {string} search - word or phrase to search for
 * @param {number} start - starting index (default 0)
 * @param {number} count - page size (default 10, max 40)
 * @returns {URL} A URL object
 */
function urlFor(search, start = 0, count = 10) {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", `"${search}"`); // adding quotes for strict search
  url.searchParams.append("langRestrict", "en"); // English sources only
  url.searchParams.append("startIndex", start.toFixed(0));
  url.searchParams.append("maxResults", count.toFixed(0));
  url.searchParams.append(
    "fields",
    "totalItems,items(volumeInfo(title,authors,publishedDate),searchInfo(textSnippet))"
  );
  return url;
}

/**
 * Some sanitation of the data returned by Google Books API.
 *
 * @param {Object} page - Object returned by Google Books API.
 * @param {number} page.totalItems
 * @param {Item[]} page.items
 * @returns { {totalItems: Number; items: Item[]} } Array containing only those items for which "searchInfo" is defined.
 */
function processPage(page) {
  if ("items" in page) {
    page.items = page.items
      .filter((item) => "searchInfo" in item) // "searchInfo" must be available
      .filter((item) => item.searchInfo.textSnippet.match(/<b>.*<\/b>/)); // "textSnippet" must contain search token
  } else {
    page.items = [];
  }

  return page;
}

class GBSnippet extends Snippet {
  /**
   * @param {string} source
   */
  constructor(source) {
    super(source, /<b>(.+?)<\/b>/);
  }
}

/**
 * Parses the data returned by Google Books API and returns the result in unified format.
 * @param {object} item
 * @param { {title: string, authors: string[], publishedDate: string} } item.volumeInfo
 * @param { {textSnippet: string} } item.searchInfo
 * @returns {Source}
 */
function parseItem(item) {
  const out = new Source();
  try {
    /* parsing title, authors, and year */
    out.title = item.volumeInfo.title;
    out.authors = item.volumeInfo.authors;
    out.publishedYear = new Date(item.volumeInfo.publishedDate).getFullYear();
    /* decoding HTML stuff and parsing */
    const snippetText = item.searchInfo.textSnippet
      .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(code))
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/[“”]/g, '"')
      .replace(/\s([\.,:;])/g, "$1") // removing space before some punctuation
      .replace(/(\w)(-\s+)/g, "$1-");
    const snippet = new GBSnippet(snippetText);
    out.snippets = [snippet];
  } catch (err) {
    console.log(`Error: ${err}`);
    console.log("while parsing:");
    console.log(item);
  } finally {
    return out;
  }
}

/**
 * Convenient wrapper around fetch() function.
 *
 * @param {string} search
 * @param {number} [start=0]
 * @param {number} [count=COUNT]
 * @returns {Promise<{totalItems: number, items: Source[]}>}
 */
async function searchPage(search, start = 0, count = COUNT) {
  // const url = urlFor(search, start, count);
  const url = `/test/mock-data/gb_making-it-increasingly_${(
    start / count +
    1
  ).toFixed(0)}.json`;
  const responce = await fetch(url);
  if (responce.ok) {
    const contentType = responce.headers.get("Content-Type");
    if (contentType?.match(/application\/json/)) {
      const page = await responce.json();
      const out = {};
      /* total number of results */
      out.totalItems = page.totalItems;
      /* search results in unified format */
      /* search results must be strictly equal to the query */
      /** @type {Source[]} */ out.items =
        processPage(page).items.map(parseItem);
      out.items = out.items.filter(
        (item) => item.snippets[0].search.toLowerCase() === search.toLowerCase()
      );
      return out;
    } else {
      throw new Error(`Unexpected content type "${contentType}"`);
    }
  } else {
    throw new Error(`Unexpected status ${responce.status}`);
  }
}

/**
 * The main search facility. Asyncronous generator.
 * @param {string} search - Search query.
 * @returns {AsyncGenerator<Source[]>}
 */
async function* search(search) {
  /* saving execution time for benchmark purposes */
  const t0 = performance.now();

  /* retrieving first page to get the idea about the total number of search results */
  const firstPage = await searchPage(search, 0, COUNT);
  console.log(`[GB] request #1 finished in ${performance.now() - t0}ms`);

  yield firstPage.items;

  /* Unfortunately, GB API is broken - the number of total results is incorrect. The
     row below is a magic-number-crutch to circumvent it somehow. */
  // TODO : firstPage.items.length returns the number of items AFTER processPage()
  const remainingItems = 0.85 * firstPage.totalItems - firstPage.items.length;

  /* Retrieving all the rest items if any */
  if (remainingItems > 0) {
    const promises = []; // preparing container for fetch promises
    /* Making requests and saving promises. There is a 50 ms delay between each request
    to avoid status code 429 Too Many Requests. */
    for (let i = 0; i < remainingItems / COUNT; i++) {
      promises.push(
        wait(i * 50).then(() => searchPage(search, (i + 1) * COUNT, COUNT))
      );
    }
    while (promises.length > 0) {
      const current = await whoIsFirst(promises);
      promises.splice(current.index, 1);
      if (current instanceof FulfilledElement) {
        if (current.value.items.length > 0) {
          yield current.value.items;
        }
      }
    }
  }
  console.log(`[GB] total time ${performance.now() - t0}ms`);
}
