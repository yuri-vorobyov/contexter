import { Snippet } from "./snippet.js";

/**
 * Class representing a source of text snippets. Typically it is a book so it its title,
 * year of publishing, and authors are specified.
 */
export class Source {
  #title;
  #authors;
  #publishedYear;
  #snippets;

  /**
   * @param {String} title
   */
  set title(title) {
    this.#title = title;
  }

  get title() {
    return this.#title;
  }

  /**
   * @param {String[]} authors
   */
  set authors(authors) {
    this.#authors = authors;
  }

  get authors() {
    return this.#authors;
  }

  /**
   * @param {Number} publishedYear
   */
  set publishedYear(publishedYear) {
    this.#publishedYear = publishedYear;
  }

  get publishedYear() {
    return this.#publishedYear;
  }

  /**
   * @param {Snippet[]} snippets
   */
  set snippets(snippets) {
    this.#snippets = snippets;
  }

  get snippets() {
    return this.#snippets;
  }
}
