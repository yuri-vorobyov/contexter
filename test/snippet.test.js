import chai, { expect } from "chai";
const should = chai.should();

import { Snippet } from "../snippet.js";

describe("Snippet", () => {
  describe("constructor", () => {
    it("should split source text into three parts", () => {
      let s = new Snippet("Hello, {World}!", /\{(.+?)\}/);
      s.left.should.equal("Hello, ");
      s.search.should.equal("World");
      s.right.should.equal("!");

      s = new Snippet("{Great} day!", /\{(.+?)\}/);
      s.left.should.equal("");
      s.search.should.equal("Great");
      s.right.should.equal(" day!");

      s = new Snippet("Indeed, {Sir}.", /\{(.+?)\}/);
      s.left.should.equal("Indeed, ");
      s.search.should.equal("Sir");
      s.right.should.equal(".");
    });

    it("should throw ParseError in case pattern does not match", () => {
      try {
        const s = new Snippet("Making everyone happy!", /\{(.+?)\}/);
      } catch (e) {
        e.name.should.equal("ParseError");
      }
    });

    it("should split left and right part into words", () => {
      let s = new Snippet(
        "black, {which is why} it is not that hard.",
        /\{(.+?)\}/
      );
      s.leftWords.should.deep.equal(["black,"]);
      s.rightWords.should.deep.equal(["it", "is", "not", "that", "hard."]);

      s = new Snippet(
        "Making everyone happy is {my official job}.",
        /\{(.+?)\}/
      );
      s.leftWords.should.deep.equal(["Making", "everyone", "happy", "is"]);
      s.rightWords.should.deep.equal(["."]);

      s = new Snippet("{Splitting} sentence into words.", /\{(.+?)\}/);
      s.leftWords.should.deep.equal([""]);
      s.rightWords.should.deep.equal(["sentence", "into", "words."]);

      s = new Snippet("Quick thinking is {a matter of}", /\{(.+?)\}/);
      s.leftWords.should.deep.equal(["Quick", "thinking", "is"]);
      s.rightWords.should.deep.equal([""]);
    });
  });

  describe("methods", () => {
    it("should return the word from left and right of the search string as they appear in the snippet", () => {
      const s = new Snippet("So many nice {tests} right here.", /\{(.+?)\}/);
      s.leftWords.should.deep.equal(["So", "many", "nice"]);
      s.wordFromLeft.should.equal("nice");
      s.rightWords.should.deep.equal(["right", "here."]);
      s.wordFromRight.should.equal("right");
    });

    it("should return word from left and word from right in lowercase and without punctuation", () => {
      const s = new Snippet("Which {makes it} difficult.", /\{(.+?)\}/);
      s.wordFromLeft.should.equal("which");
      s.wordFromRight.should.equal("difficult");
    });

    it("should be converted to string consistently", () => {
      const s = new Snippet(
        "Making good assumptions {does not mean} making good decisions.",
        /\{(.+?)\}/
      );
      String(s).should.equal(
        "Making good assumptions does not mean making good decisions."
      );
    });
  });
});
