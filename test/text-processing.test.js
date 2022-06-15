import assert from "assert";

import chai from "chai";
const should = chai.should();

import {
  LevenshteinDistance,
  normalizedLD,
  isSimilar,
  removeCrossDuplicates,
  removeDuplicates,
} from "../text-processing.js";

describe("text-processing", () => {
  describe("#LevenshteinDistance", () => {
    it("should calculate the edit distance properly", () => {
      LevenshteinDistance("cat", "cast").should.equal(1);
      assert.equal(LevenshteinDistance("snippet", "kitten"), 5);
      assert.equal(LevenshteinDistance("sitting", "kitten"), 3);
      assert.equal(LevenshteinDistance("Sunday", "Saturday"), 3);
    });

    it("should not depend on arguments order", () => {
      assert.equal(LevenshteinDistance("kitten", "snippet"), 5);
      assert.equal(LevenshteinDistance("kitten", "sitting"), 3);
      assert.equal(LevenshteinDistance("Saturday", "Sunday"), 3);
    });
  });

  describe("#isSimilar", () => {
    it("should recognize similar strings", () => {
      const task1 = ["hey brother, whatsupp", "hi brother whatsupp"];
      assert.equal(isSimilar(...task1), true);
      const task2 = [
        "1987)  326. Semistructured  messages  are  {{{surprisingly  useful}}}  for  computersupported  coordination.",
        "HCI0206  f Semistructured  messages  are {{{surprisingly  useful}}}  for computersupported coordination.  HCI0290",
      ];
      const result2 = isSimilar(...task2);
      assert.equal(result2, true, `nLD = ${normalizedLD(...task2)}`);
    });
    it("should ignore letter case", () => {
      const snippets = [
        "COLLYWOBBLES, SNOLLYGOSTERS, AND 86 OTHER {{{SURPRISINGLY USEFUL}}} TERMS WORTH RESURRECTING   Introduction 1",
        "collywobbles, snollygosters, and 86 other {{{surprisingly useful}}} terms worth resurrecting / Joe Gillard. Description:",
      ];
      assert.equal(isSimilar(...snippets), true);
    });
  });

  describe("#removeDuplicates", () => {
    it("should remove duplicates from array", () => {
      const arr1 = [];
      const result1 = removeDuplicates(arr1);
      result1.should.deep.equal([]);
      const arr2 = [
        "Hello",
        "World",
        "hey",
        "hello",
        "my",
        "world",
        "beautiful",
      ];
      const result2 = removeDuplicates(arr2);
      result2.should.deep.equal(["Hello", "World", "hey", "my", "beautiful"]);
      const arr3 = [
        "COLLYWOBBLES, SNOLLYGOSTERS, AND 86 OTHER {{{SURPRISINGLY USEFUL}}} TERMS WORTH RESURRECTING   Introduction 1",
        "collywobbles, snollygosters, and 86 other {{{surprisingly useful}}} terms worth resurrecting / Joe Gillard. Description:",
      ];
      assert.equal(removeDuplicates(arr3).length, 1);
    });
  });

  describe("#removeCrossDuplicates", () => {
    it("should remove duplicates from the first of two arrays", () => {
      const first = [
        "to moisten the pie. The Thanksgiving pie, {{{which was really}}} too dry .1>^ Perhaps she'll die. Vt .M^^",
      ];
      const second = [
        "down goes a jug of cider to moisten the pie ({{{which was really}}} too dry), then an entire squash, followed",
        "to moisten the pie, The Thanksgiving pie, {{{which was really}}} too dry. Perhaps she'll die. I know an old",
      ];
      removeCrossDuplicates(first, second);
      first.should.deep.equal([]);
      second.should.deep.equal(second);
    });
  });
});
