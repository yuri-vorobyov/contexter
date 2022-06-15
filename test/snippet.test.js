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
      s = new Snippet("Indeed, {Sir}", /\{(.+?)\}/);
      s.left.should.equal("Indeed, ");
      s.search.should.equal("Sir");
      s.right.should.equal("");
    });

    it("should throw ParseError in case pattern does not match", () => {
      try {
        const s = new Snippet("Making everyone happy!", /\{(.+?)\}/);
      } catch (e) {
        e.name.should.equal("ParseError");
      }
    });
  });

  describe("methods", () => {
    it("should return the word from left and right of the search string", () => {
      const s = new Snippet("So many nice {tests} right here.", /\{(.+?)\}/);
      s.leftWords.should.deep.equal(["So", "many", "nice"]);
      s.wordFromLeft.should.equal("nice");
      s.rightWords.should.deep.equal(["right", "here."]);
      s.wordFromRight.should.equal("right");
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
