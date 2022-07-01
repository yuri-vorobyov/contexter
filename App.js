import search from "./search.js";

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

/**
 * Handles user's search query.
 * @param {SubmitEvent} event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const searchText = document.getElementById("search").value;

  // for await (const chunk of gbSearch(searchText)) {
  //   console.log(chunk);
  // }

  // for await (const chunk of olSearch(searchText)) {
  //   console.log(chunk);
  // }

  for await (const chunk of search(searchText)) {
    console.log(chunk);
  }

  return;

  clearChildren(gbList);
  clearChildren(olList);

  /* showing loaders */
  document.querySelector("#gb .loader").style.display = "block";
  document.querySelector("#ol .loader").style.display = "block";
}
