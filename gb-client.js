import { Snippet } from "./snippet.js";
export { search, searchPage };

/**
 * Returns a Promise that will be resolved after delay.
 * @param {Number} delay - Delay in ms.
 * @returns {Promise}
 */
function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

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
  url.searchParams.append("startIndex", start);
  url.searchParams.append("maxResults", count);
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
 * @returns {Item[]} Array containing only those items for which "searchInfo" is defined.
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
  constructor(source) {
    super(source, /<b>(.+?)<\/b>/);
  }
}

/**
 * Parses the data returned by Google Books API and returns the result in unified format.
 * @param {object} item
 * @param { {title: string, authors: string[], publishedDate: string} } item.volumeInfo
 * @param { {textSnippet: string} } item.searchInfo
 */
function parseItem(item) {
  const out = {};
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
    return out;
  } catch (err) {
    console.log(`Error: ${err}`);
    console.log("while parsing:");
    console.log(item);
  }
}

/**
 * Convenient wrapper around fetch() function.
 *
 * @param {string} search
 * @param {number} [start=0]
 * @param {number} [count=40]
 * @returns
 */
async function searchPage(search, start = 0, count = 40) {
  const url = urlFor(search, start, count);
  // const url = "/test/mock-data/gb_giving-reasons-to.json";
  const responce = await fetch(url);
  if (responce.ok) {
    const contentType = responce.headers.get("Content-Type");
    if (contentType.match(/application\/json/)) {
      const page = await responce.json();
      const out = {};
      /* total number of results */
      out.totalItems = page.totalItems;
      /* search results in unified format */
      out.items = processPage(page).items.map(parseItem);
      /* search results must be strictly equal to the query */
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
 * The main search facility.
 * @param {string} search - Search query.
 * @returns
 */
async function search(search) {
  /* for benchmark purposes */
  const t0 = performance.now();

  /* retrieving first page to get idea about the total count of search results */
  const firstPage = await searchPage(search, 0, COUNT);
  const books = []; // preparing container for books
  books.push(...processPage(firstPage)); // saving only valid items
  console.log(`first request took ${performance.now() - t0}ms`);

  const remainingItems = 0.85 * firstPage.totalItems - firstPage.items.length; // magic number CRUTCH for broken API
  /* retrieving all the rest items if any */
  if (remainingItems > 0) {
    const promises = []; // preparing container for fetch promises
    /* making requests and saving promises */
    for (let i = 0; i < remainingItems / COUNT; i++) {
      promises.push(
        wait((i + 1) * 100).then(() =>
          searchPage(search, (i + 1) * COUNT, COUNT)
        )
      );
    }
    /* collecting fetched results */
    const results = await Promise.allSettled(promises);
    /* processing results */
    for (const element of results) {
      if (element.status === "fulfilled") {
        books.push(...processPage(element.value));
      }
    }
  }
  console.log(`total time ${performance.now() - t0}ms`);

  return books;
}
