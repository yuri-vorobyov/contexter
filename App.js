/**
 * Constructs a url for Google Books API for the specified search string.
 * @param {string} search - word or phrase to search for
 * @returns {URL} A URL object
 */
function urlFor(search) {
  const start = 0;
  const count = 10;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.append("q", `"${search}"`); // quotes for strict search
  url.searchParams.append("langRestrict", "en");
  url.searchParams.append("startIndex", start);
  url.searchParams.append("maxResults", count); // default 10, max 40
  url.searchParams.append(
    "fields",
    "totalItems,items(volumeInfo(title,authors,publishedDate),searchInfo/textSnippet)"
  );
  return url;
}

document.querySelector("form").addEventListener("submit", handleSubmit);
function handleSubmit(event) {
  event.preventDefault();
  let url = urlFor(document.getElementById("search").value);
  // url = "mock_data.json"; // request for local json file instead of Google Books API

  const list = document.getElementById("book-list");
  Array.from(list.children).forEach((child) => child.remove());
  const t0 = performance.now();
  fetch(url)
    .then((responce) => responce.json())
    .then((books) => {
      console.log(`request took ${performance.now() - t0}ms`);
      books.items.forEach((item) => {
        if (item.searchInfo?.textSnippet) {
          const listItem = document.createElement("li");
          listItem.innerHTML = item.searchInfo.textSnippet;
          list.append(listItem);
        }
      });
    });
}
