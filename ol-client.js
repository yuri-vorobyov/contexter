import { Snippet } from "./snippet.js";
import {
  removeCrossDuplicates,
  removeDuplicates,
  isSimilar,
} from "./text-processing.js";
export { search, searchPage };
import { wait, whoIsFirst, FulfilledElement } from "./asygen.js";

function urlFor(search, page) {
  const url = new URL("https://openlibrary.org/search/inside.json");
  url.searchParams.append("q", `"${search}"`); // adding quotes for strict search
  if (page) url.searchParams.set("page", page); // otherwise 1st page will be returned
  return url;
}

class OLSnippet extends Snippet {
  constructor(source) {
    super(source, /\{\{\{(.+?)\}\}\}/);
  }
}

/**
 * Parses result returned by Open Library API and returns the data in the
 * unified format. If there are duplicated results, they will be removed.
 * @param { Object } hit - Normally, an object with several search results for a single source.
 * @param { {text: string[]} } hit.highlight
 * @param { {meta_title: string[], meta_year: number[], meta_creator: string[]} } hit.fields
 * @param { {title: string, authors: {name: string}[]} } hit.edition
 */
function parseHit(hit) {
  let out = {};
  try {
    /* parsing title, authors, and year */
    out.title = "edition" in hit ? hit.edition.title : hit.fields.meta_title[0];
    out.authors =
      "edition" in hit
        ? hit.edition.authors.map((value) => value.name)
        : hit.fields.meta_creator;
    out.publishedYear =
      "meta_year" in hit.fields ? Number(hit.fields.meta_year[0]) : NaN;
    /* getting array of snippets */
    let snippets = hit.highlight.text.map(
      (value) =>
        new OLSnippet(
          value
            .trim()
            .replace(/[¬-]\s*/g, "")
            .replace(/\n/g, " ")
            .replace(/\s+/g, " ")
        )
    );
    /* removing duplicating snippets */
    out.snippets = removeDuplicates(snippets);
    /* parsing */
    // out.snippets = snippets.map((snippet) => {
    //   const snippetParts = snippet.split(/\{\{\{(.+?)\}\}\}/);
    //   return {
    //     left: snippetParts[0],
    //     search: snippetParts[1],
    //     right: snippetParts[2],
    //   };
    // });

    return out;
  } catch (err) {
    console.log(err);
    console.log(hit);
  }
}

/**
 * Convenient wrapper around fetch() function representing a single
 * query to the Open Library API.
 *
 * @param {string} search - Search query.
 * @param {number} [page=1] - Page (a 20-book chunk) number.
 * @returns {Promise<{cached: Boolean, totalItems: Number, items: OLSnippet[]}>}
 */
async function searchPage(search, page = 1) {
  // const url = urlFor(search, page);
  const url = `/test/mock-data/ol_making-it-increasingly_${page}.json`;
  const responce = await fetch(url);
  if (responce.ok) {
    const contentType = responce.headers.get("Content-Type");
    if (contentType.match(/application\/json/)) {
      const page = await responce.json();

      /* processing of retrieved data */
      const out = {};
      /* query status - cached or not */
      if (page["fts-api"] && "cached" in page["fts-api"]) {
        out.cached = page["fts-api"].cached;
      }
      /* total number of results */
      if (page.hits?.total) {
        out.totalItems = page.hits.total;
      }
      /* results */
      if (page.hits?.hits) {
        const t0 = performance.now();
        /* parsing returned items */
        out.items = page.hits.hits.map(parseHit);

        /* removing snippets from duplicating sources */
        let i = 0;
        let j;
        while (i < out.items.length) {
          j = i + 1;
          while (j < out.items.length) {
            if (isSimilar(out.items[i].title, out.items[j].title)) {
              removeCrossDuplicates(
                out.items[j].snippets,
                out.items[i].snippets
              );
              if (out.items[j].snippets.length === 0) {
                out.items.splice(j, 1);
                continue;
              }
            }
            j += 1;
          } // while j
          i += 1;
        } // while i

        /* search results must be strictly equal to the query */
        out.items = out.items.map((item) => {
          item.snippets = item.snippets.filter(
            (snippet) => snippet.search.toLowerCase() === search.toLowerCase()
          );
          return item;
        });
        out.items = out.items.filter((item) => item.snippets.length > 0);

        /* removing duplicating snippets globally (beware of performance issues) */
        // i = 0;
        // next: while (i < out.items.length) {
        //   for (j = i + 1; j < out.items.length; j++) {
        //     removeCrossDuplicates(out.items[i].snippets, out.items[j].snippets);
        //     if (out.items[i].snippets.length === 0) {
        //       out.items.splice(i, 1);
        //       continue next;
        //     }
        //   }
        //   i += 1;
        // }

        // console.log(`parsing took ${performance.now() - t0} ms`);
      }

      return out;
    } else {
      throw new Error(`Unexpected content type "${contentType}"`);
    }
  } else {
    throw new Error(`Unexpected status ${responce.status}`);
  }
}

const COUNT = 20; // OpenLibrary returns results in chunks of 20 books

/**
 * Performs search for a phrase using OpenLibrary API
 * @param {string} search - Search phrase.
 * @returns {AsyncGenerator<OLSnippet[]>}
 */
async function* search(search) {
  const t0 = performance.now();

  /* initial request to ensure cached results */
  const firstPage = await searchPage(search);
  console.log(
    `[OL] request #1 finished in ${performance.now() - t0}ms (${
      firstPage.cached ? "cached" : "not cached"
    })`
  );

  yield firstPage.items;

  const remainingItems = firstPage.totalItems - firstPage.items.length;

  /* Retrieving all the rest items, if any */
  if (remainingItems > 0) {
    const promises = []; // preparing container for fetch promises
    /* making requests and saving promises 
       - maximum 10 pages (200 items) will be requested for the sake of performance
       - each request is delayed 50 ms */
    for (let i = 0; i < Math.min(remainingItems / COUNT, 10); i++) {
      promises.push(wait(i * 50).then(() => searchPage(search, i + 2)));
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
  console.log(`[OL] total time ${performance.now() - t0}ms`);
}
