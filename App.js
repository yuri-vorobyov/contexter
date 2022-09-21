import search from "./search.js";
import { Snippet } from "./snippet.js";
import { Source } from "./source.js";
import { WordCounter } from "./WordCounter.js";

const STATE = {
  searchText: "",
  leftWords: new WordCounter(),
  rightWords: new WordCounter(),
  /** @type {Snippet[]} */
  snippets: [],
};

const panels = {
  form: document.querySelector("form"),
  progress: document.getElementById("progress"),
  stat: document.getElementById("stat"),
};

panels.form.addEventListener("submit", handleSubmit);
panels.stat
  .querySelectorAll(".stat__list") // two lists will be found
  .forEach((v) => v.addEventListener("click", handleListClick));

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

  // showing panels if hidden
  requestAnimationFrame(() => {
    if (document.body.classList.contains("initial")) {
      panels.progress.classList.remove("progress--invisible");
      panels.stat.classList.remove("stat--invisible");
      document.body.classList.remove("initial");
    }
  });

  STATE.searchText = document.getElementById("search").value;

  // displaying search string
  panels.stat.querySelector(".stat__search").innerHTML = STATE.searchText;

  const searchStatusText = document.querySelector("#progress p");
  searchStatusText.innerHTML = "Search is starting...";

  // fetching search results
  for await (const chunk of search(STATE.searchText)) {
    for (const source of chunk) {
      // saving text snippets
      STATE.snippets.push(...source.snippets);

      // updating progress bar
      searchStatusText.textContent = `Search is in progress: ${STATE.snippets.length} text snippets found.`;

      // updating statistics of left and right words
      for (const snippet of source.snippets) {
        STATE.leftWords.add(snippet.wordFromLeft);
        STATE.rightWords.add(snippet.wordFromRight);
      }
      STATE.leftWords.sort();
      STATE.rightWords.sort();

      const leftList = panels.stat.querySelector(".stat__left ul");
      const rightList = panels.stat.querySelector(".stat__right ul");

      updateListOfWords(leftList, STATE.leftWords);
      updateListOfWords(rightList, STATE.rightWords);
    }
  }

  searchStatusText.textContent = `Done searching: ${STATE.snippets.length} text snippets found.`;
}

/**
 * When user clicks the word list item.
 * @param {MouseEvent} event
 */
function handleListClick(event) {
  if (event.target.tagName !== "LI") {
    return;
  }

  const word = event.target.innerText;

  let snippets;

  if (event.target.parentNode.parentNode.classList.contains("stat__left")) {
    snippets = STATE.snippets.filter((value) =>
      value.wordFromLeft ? value.wordFromLeft === word : word === "..."
    );
  } else if (
    event.target.parentNode.parentNode.classList.contains("stat__right")
  ) {
    snippets = STATE.snippets.filter((value) =>
      value.wordFromRight ? value.wordFromRight === word : word === "..."
    );
  }

  const snippetsList = panels.stat.querySelector(".stat__snippets > UL");
  clearChildren(snippetsList);

  for (const snippet of snippets) {
    const li = document.createElement("LI");
    li.innerHTML = snippet.toHTMLString();
    snippetsList.append(li);
  }
}

/**
 *
 * @param {HTMLUListElement} list
 * @param {WordCounter} words
 */
function updateListOfWords(list, words) {
  clearChildren(list);

  for (const [word, count] of words) {
    const li = document.createElement("li");
    if (word !== "") {
      li.innerHTML = word;
    } else {
      li.innerHTML = "...";
    }
    list.append(li);
  }
}
