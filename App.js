// @ts-check

import search from "./search.js";
import { Source } from "./source.js";

document.querySelector("form")?.addEventListener("submit", handleSubmit);

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

  if (document.body.classList.contains("initial")) {
    document.body.classList.remove("initial");
  }

  const para = document.querySelector("#stat p");

  const searchText = document.getElementById("search").value;

  const leftWords = new WordCounter();
  const rightWords = new WordCounter();

  let snippetsCount = 0;

  for await (const chunk of search(searchText)) {
    // console.log(chunk);
    for (const source of chunk) {
      snippetsCount += source.snippets.length;
      para.textContent = `Search is in process: ${snippetsCount} text snippets found.`;
      for (const snippet of source.snippets) {
        leftWords.add(snippet.wordFromLeft);
        rightWords.add(snippet.wordFromRight);
      }
    }
  }

  para.textContent = `Done searching: ${snippetsCount} text snippets found.`;

  console.log(leftWords);
  console.log(rightWords);
}

/**
 * A Map subclass which can count words.
 */
class WordCounter extends Map {
  /**
   * @param {String} word
   */
  add(word) {
    if (this.has(word)) {
      this.set(word, this.get(word) + 1);
    } else {
      this.set(word, 1);
    }
  }
}
