export { search };

function urlFor(search, page) {
  const url = new URL("https://openlibrary.org/search/inside.json");
  url.searchParams.append("q", `"${search}"`); // adding quotes for strict search
  if (page) url.searchParams.set("page", page); // otherwise 1st page will be returned
  return url;
}

async function searchPage(search, page) {
  const url = urlFor(search, page);
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

function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

const COUNT = 20; // OpenLibrary returns results in chunks of 20 books

/**
 * Performs search for a phrase using OpenLibrary API
 * @param {string} search - Search phrase.
 * @returns {Promise} A Promise resolved with a list of books.
 */
async function search(search) {
  const t0 = performance.now();

  /* initial request to ensure cached results */
  const firstPage = await searchPage(search);
  console.log(`[OL] request #1 finished in ${performance.now() - t0}ms`);
  console.log(`[OL] ${firstPage.hits.total} hits found`);
  console.log(`[OL] ${firstPage.hits.hits.length} items returned`);
  console.log(`[OL] cached = ${firstPage["fts-api"].cached}`);
  const books = [];
  books.push(...firstPage.hits.hits);

  /* all the rest items, if any */
  const remainingItems = firstPage.hits.total - firstPage.hits.hits.length;
  if (remainingItems > 0) {
    const promises = []; // preparing container for fetch promises
    /* making requests and saving promises 
       - maximum 10 pages (200 items) will be requested for the sake of performance
       - each request is delayed 150 ms */
    for (let i = 0; i < Math.min(remainingItems / COUNT, 10); i++) {
      promises.push(wait((i + 1) * 150).then(() => searchPage(search, i + 2)));
    }
    console.log(`[OL] ${promises.length} additional pages requested`);
    /* collecting fetched results */
    const results = await Promise.allSettled(promises);
    console.log(`total time ${performance.now() - t0}ms`);
    /* processing results */
    for (const element of results) {
      if (element.status === "fulfilled") {
        books.push(...element.value.hits.hits);
      }
    }
  }

  return books;
}
