/**
 * Utility functions.
 * @module utilities
 */
export { urlFor, processPage };

/**
 * A book information returned by Google Books API. The concrete set of properties
 * is controlled by {@link urlFor}.
 * @typedef Item
 * @type {{volumeInfo: {title: string, authors: string[], publishedDate: string},
 *         searchInfo: {textSnippet: string}}}
 */

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
  url.searchParams.append("key", "AIzaSyAxjRae-iUNy_yZuSw-O5G_6BUHdZkTxFM");
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
