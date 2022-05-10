import { search as gbSearch } from "./gb-client.js";
import { search as olSearch } from "./ol-client.js";

document.querySelector("form").addEventListener("submit", handleSubmit);

const gbList = document.querySelector("#gb ul"); // DOM container for the GB search results

function showLoader() {
  document.getElementById("loader").style.display = "block";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

function clearChildren(root) {
  while (root.lastChild) root.lastChild.remove();
}

async function loadFromGoogleBooks(search) {
  const result = await gbSearch(search);

  hideLoader();

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

async function loadFromOpenLibrary(search) {
  const result = await olSearch(search);
  console.log(result);
}

function handleSubmit(event) {
  event.preventDefault();

  clearChildren(gbList);

  showLoader();

  const searchText = document.getElementById("search").value;

  loadFromGoogleBooks(searchText);
  loadFromOpenLibrary(searchText);
}
