export { search };

function urlFor(search, page) {
  const url = new URL("https://openlibrary.org/search/inside.json");
  url.searchParams.append("q", `"${search}"`); // adding quotes for strict search
  if (page) url.searchParams.set("page", page); // otherwise 1st page will be returned
  return url;
}

/**
 *
 * @param {string} search - Search string
 * @returns {Object[]}
 */
async function search(search) {
  const url = urlFor(search);
  /* initial time */
  const t0 = performance.now();
  /* initial request to ensure cached results */
  fetch(url)
    .then((responce) => responce.json())
    .then((result) => {
      console.log(`request #1 finished in ${performance.now() - t0}ms`);
      console.log(result["fts-api"].cached);

      /* sending other requests with 500ms interval */
      setTimeout(() => {
        for (let i = 2; i <= 10; i++) {
          url.searchParams.set("page", i);
          setTimeout(() => {
            fetch(url)
              .then((responce) => responce.json())
              .then((result) => {
                console.log(
                  `request #${i} finished in ${performance.now() - t0}ms`
                );
                console.log(result["fts-api"].cached);
              });
          }, (i - 1) * 500);
        }
      }, 1000);
    });
}
