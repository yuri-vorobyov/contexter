import { search as gbSearch, searchPage as gbSearchPage } from "./gb-client.js";
import { search as olSearch, searchPage as olSearchPage } from "./ol-client.js";

document.querySelector("form").addEventListener("submit", handleSubmit);

const gbList = document.querySelector("#gb ul"); // DOM container for the GB search results
const olList = document.querySelector("#ol ul"); // DOM container for the OL search results

/**
 * Removes root's children one by one.
 * @param {Node} root - Parent node.
 */
function clearChildren(root) {
  while (root.lastChild) root.lastChild.remove();
}

async function loadFromGoogleBooks(search) {
  const result = await gbSearch(search);

  /* hiding loader */
  document.querySelector("#gb .loader").style.display = "none";

  result.forEach((book) => {
    const text = book.searchInfo.textSnippet;
    const parts = text.split(`<b>${search}</b>`).map((value) => value.trim());
    if (parts.length === 2) {
      const left = parts[0].split(/\s+/).slice(-4); // last 4 words
      const right = parts[1].split(/\s+/).slice(0, 4); // first 4 words
      const listItem = document.createElement("li");
      listItem.innerHTML =
        left.join(" ") +
        " <strong>" +
        search +
        "</strong>" +
        (right[0][0] !== "." && right[0][0] !== "," ? " " : "") +
        right.join(" ");
      gbList.append(listItem);
    }
  });
}

/**
 * Searches for a string using OL engine and populates the list with the search results.
 * @param {*} search - A search string.
 */
async function loadFromOpenLibrary(search) {
  const result = await olSearch(search);

  /* hiding loader */
  document.querySelector("#ol .loader").style.display = "none";

  result.forEach((book) => {
    const text = book.highlight.text; // array of text snippets containing search string

    /* for each book, several occurences of a search string may be returned */
    /* search string is enclosed into triple braces (between {{{ and }}}) */
    const searchStringPattern = /\{\{\{[^\}]+\}\}\}/;

    for (const textSnippet of text) {
      const parts = textSnippet.replace(/\n/g, " ").split(searchStringPattern);
      const left = parts[0].split(/\s+/).slice(-5); // last 4 words
      const right = parts[1].split(/\s+/).slice(0, 5); // first 4 words
      const listItem = document.createElement("li");
      listItem.innerHTML =
        left.join(" ") +
        " <strong>" +
        search +
        "</strong>" +
        (right[0][0] !== "." && right[0][0] !== "," ? " " : "") +
        right.join(" ");
      /* removing duplicates */
      if (
        !Array.from(olList.children)
          .map((element) => element.innerHTML)
          .includes(listItem.innerHTML)
      ) {
        olList.append(listItem);
      }
    }
  });
}

/**
 * Handles user's search query.
 * @param {SubmitEvent} event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const searchText = document.getElementById("search").value;

  for await (const chunk of gbSearch(searchText)) {
    console.log(chunk);
  }

  return;

  clearChildren(gbList);
  clearChildren(olList);

  /* showing loaders */
  document.querySelector("#gb .loader").style.display = "block";
  document.querySelector("#ol .loader").style.display = "block";
}
