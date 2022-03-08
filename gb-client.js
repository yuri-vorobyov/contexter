export { search };

/**
 * A book information returned by Google Books API. The concrete set of properties
 * is controlled by {@link urlFor}.
 * @typedef Item
 * @type {{volumeInfo: {title: string, authors: string[], publishedDate: string},
 *         searchInfo: {textSnippet: string}}}
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
  url.searchParams.append("langRestrict", "en");
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
    return page.items
      .filter((item) => "searchInfo" in item) // "searchInfo" must be available
      .filter((item) => item.searchInfo.textSnippet.match(/<b>.*<\/b>/)); // "textSnippet" must contain search token
  } else {
    return [];
  }
}

/**
 * Convenient wrapper around fetch() function.
 *
 * @param {string} search
 * @param {number} start
 * @param {number} count
 * @returns
 */
async function searchPage(search, start = 0, count = 10) {
  const url = urlFor(search, start, count);
  const responce = await fetch(url);
  if (responce.ok) {
    const contentType = responce.headers.get("Content-Type");
    if (contentType.match(/application\/json/)) {
      const page = await responce.json();
      return page;
    } else {
      throw new Error(`Unexpected content type "${contentType}"`);
    }
  } else {
    throw new Error(`Unexpected status ${responce.status}`);
  }
}

/**
 * Performs search using Google Books API.
 *
 * @param {string} search - Search string.
 * @returns {Item[]}
 */
async function search(search) {
  const t0 = performance.now();

  /* retrieving first page */
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
      promises.push(searchPage(search, (i + 1) * COUNT, COUNT));
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
