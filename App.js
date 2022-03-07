import { search as gbSearch } from "./gb-client.js";

document.querySelector("form").addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  const list = document.getElementById("book-list"); // DOM container for the search results
  while (list.lastChild) list.lastChild.remove(); // clearing results

  const searchText = document.getElementById("search").value;
  const result = await gbSearch(searchText);
  result.forEach((book) => {
    const text = book.searchInfo.textSnippet;
    const parts = text
      .split(`<b>${searchText}</b>`)
      .map((value) => value.trim());
    if (parts.length === 2) {
      const left = parts[0].split(/\s+/).slice(-4); // last 4 words
      // console.log(left);
      const right = parts[1].split(/\s+/).slice(0, 4); // first 4 words
      // console.log(right);
      const listItem = document.createElement("li");
      const innerHTML =
        left.join(" ") +
        " <strong>" +
        searchText +
        "</strong>" +
        (right[0][0] !== "." && right[0][0] !== "," ? " " : "") +
        right.join(" ");
      listItem.innerHTML = innerHTML;
      list.append(listItem);
    }
  });
}
