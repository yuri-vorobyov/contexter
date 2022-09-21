/**
 * Counts words.
 */
export class WordCounter {
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
