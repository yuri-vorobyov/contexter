// @ts-check

/**
 * Class representing a text snippet, which is an excerpt containing a search string
 * marked in some way. The way it is marked is specified via the constructor. This class
 * is intended to be a base class for API-dependent classes, which differ in a way the search
 * string is marked. For example, Google Books API encloses the search string in <b></b> tags.
 * Therefore, we may define the subclass as:
 *
 *   class GBSnippet extends Snippet {
 *     constructor(source) {
 *       super(source, /<b>(.+?)<\/b>/);
 *     }
 *   }
 */
export class Snippet {
  #source;
  #search;
  #left;
  #right;

  /**
   * Create a Snippet. Performs parsing of the snippet text, throws error if something goes wrong.
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

  /**
   * @param {String} s
   */
  static #parseWord(s) {
    if (s) {
      const m = s.match(/\w+/);
      if (m) {
        return m[0].toLowerCase();
      } else {
        throw new ParseError(`"${s}" is not a word.`);
      }
    } else {
      throw new ParseError("Nothing to parse.");
    }
  }

  get wordFromLeft() {
    /** @type {String} */ let out = "";
    try {
      out = Snippet.#parseWord(this.leftWords[this.leftWords.length - 1]);
    } catch {
      out = "";
    } finally {
      return out;
    }
  }

  get wordFromRight() {
    /** @type {String} */ let out = "";
    try {
      out = Snippet.#parseWord(this.rightWords[0]);
    } catch {
      out = "";
    } finally {
      return out;
    }
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
