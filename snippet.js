/**
 * Class representing a text snippet, which is an excerpt containing a search string
 * marked in some way. The way it is marked is specified via the constructor.
 */
export class Snippet {
  #source;
  #search;
  #left;
  #right;

  /**
   * Create a Snippet.
   * @param {string} source - Snippet text with a search string marked in some way.
   * @param {RegExp} pattern - Regular expression matching to the search string in
   * the snippet text.
   */
  constructor(source, pattern) {
    this.#source = source;
    const snippetParts = source.split(pattern);
    if (snippetParts.length === 1) {
      throw new ParseError(
        `Could not find the search string /${pattern.source}/ in "${source}".`
      );
    }
    this.#left = snippetParts[0];
    this.leftWords = this.left.trim().split(/\s+/);
    this.#search = snippetParts[1];
    this.#right = snippetParts[2];
    this.rightWords = this.right.trim().split(/\s+/);
  }

  get wordFromLeft() {
    return this.leftWords[this.leftWords.length - 1];
  }

  get wordFromRight() {
    return this.rightWords[0];
  }

  get source() {
    return this.#source;
  }

  get search() {
    return this.#search;
  }

  get left() {
    return this.#left;
  }

  get right() {
    return this.#right;
  }

  toString() {
    return this.#left + this.#search + this.#right;
  }
}

class ParseError extends Error {
  get name() {
    return "ParseError";
  }
}
