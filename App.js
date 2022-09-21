import search from "./search.js";
import { Source } from "./source.js";

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
    }
  });

  const searchText = document.getElementById("search").value;

  // displaying search string
  panels.stat.querySelector(".stat__search").innerHTML = searchText;

  const searchStatusText = document.querySelector("#progress p");
  searchStatusText.innerHTML = "Search is starting...";

  if (document.body.classList.contains("initial")) {
    document.body.classList.remove("initial");
  }

  const leftWords = new WordCounter();
  const rightWords = new WordCounter();

  // fetching search results
  let snippetsCount = 0;
  for await (const chunk of search(searchText)) {
    for (const source of chunk) {
      // updating progress bar
      snippetsCount += source.snippets.length;
      searchStatusText.textContent = `Search is in progress: ${snippetsCount} text snippets found.`;

      // updating statistics of left and right words
      for (const snippet of source.snippets) {
        leftWords.add(snippet.wordFromLeft);
        rightWords.add(snippet.wordFromRight);
      }
      leftWords.sort();
      rightWords.sort();

      const leftList = panels.stat.querySelector(".stat__left ul");
      const rightList = panels.stat.querySelector(".stat__right ul");

      updateListOfWords(leftList, leftWords);
      updateListOfWords(rightList, rightWords);
    }
  }

  leftWords.sort();
  rightWords.sort();

  searchStatusText.textContent = `Done searching: ${snippetsCount} text snippets found.`;

  console.log(leftWords);
  console.log(rightWords);
}

/**
 * When user clicks the word list item.
 * @param {MouseEvent} event
 */
function handleListClick(event) {
  if (event.target.tagName !== "LI") {
    return;
  }

  // console.log(event);
}

/**
 * Counts words.
 */
class WordCounter {
  #wordsMap;

  constructor() {
    this.#wordsMap = new Map();
  }

  /**
   * @param {String} word
   */
  add(word) {
    if (this.#wordsMap.has(word)) {
      this.#wordsMap.set(word, this.#wordsMap.get(word) + 1);
    } else {
      this.#wordsMap.set(word, 1);
    }
  }

  sort() {
    this.#wordsMap = new Map(
      [...this.#wordsMap.entries()].sort(([ak, av], [bk, bv]) => bv - av)
    );
  }

  /**
   * @returns {Iterator<[string, number]>}
   */
  [Symbol.iterator]() {
    return this.#wordsMap[Symbol.iterator]();
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
