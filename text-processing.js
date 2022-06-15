export {
  removeDuplicates,
  removeCrossDuplicates,
  LevenshteinDistance,
  normalizedLD,
  isSimilar,
  processTextSnippet,
};

/**
 * Performs some clean-up of search results returned by APIs.
 * @param {string} textSnippet - Raw text snippet returned by some API.
 */
function processTextSnippet(textSnippet) {
  return textSnippet
    .trim()
    .replace(/[¬-]\s*/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ");
}

function initMatrix(rows, cols) {
  const out = new Array(rows);
  for (let i = 0; i < rows; i++) {
    out[i] = new Uint16Array(cols);
  }
  return out;
}

function initInt16Matrix(rows, cols) {
  const out = new Array(rows);
  for (let i = 0; i < rows; i++) {
    out[i] = new Int16Array(cols);
  }
  return out;
}

/**
 *
 * @param {string} s
 * @param {string} t
 * @param {number} threshold
 * @returns {boolean}
 */
function isSimilar(s, t, threshold = 0.22) {
  s = String(s);
  t = String(t);

  s = processTextSnippet(s).toLowerCase();
  t = processTextSnippet(t).toLowerCase();

  if (s === t) {
    return true;
  }

  const m = s.length;
  const n = t.length;
  const normLength = Math.min(m, n); // string length for LD normalization
  const falseCriterion = threshold * normLength; // max allowed operations for similar strings

  /* initialization of vectors */
  let v0 = new Uint16Array(n + 1);
  let v1 = new Uint16Array(n + 1);

  for (let i = 0; i <= n; i++) {
    v0[i] = i;
  }

  let deletionCost;
  let insertionCost;
  let substitutionCost;
  for (let i = 0; i <= m - 1; i++) {
    v1[0] = i + 1;
    for (let j = 0; j <= n - 1; j++) {
      deletionCost = v0[j + 1] + 1;
      insertionCost = v1[j] + 1;
      substitutionCost = s[i] === t[j] ? v0[j] : v0[j] + 1;
      v1[j + 1] = Math.min(deletionCost, insertionCost, substitutionCost);
    }
    if (Math.min(...v1) >= falseCriterion) {
      return false;
    }
    [v0, v1] = [v1, v0];
  }

  return v0[n] < falseCriterion;
}

function LevenshteinDistanceTwoRows(s, t) {
  const m = s.length;
  const n = t.length;

  /* initialization of vectors */
  let v0 = new Uint16Array(n + 1);
  let v1 = new Uint16Array(n + 1);

  for (let i = 0; i <= n; i++) {
    v0[i] = i;
  }

  let deletionCost;
  let insertionCost;
  let substitutionCost;
  for (let i = 0; i <= m - 1; i++) {
    v1[0] = i + 1;
    for (let j = 0; j <= n - 1; j++) {
      deletionCost = v0[j + 1] + 1;
      insertionCost = v1[j] + 1;
      substitutionCost = s[i] === t[j] ? v0[j] : v0[j] + 1;
      v1[j + 1] = Math.min(deletionCost, insertionCost, substitutionCost);
    }
    [v0, v1] = [v1, v0];
  }

  return v0[n];
}

/**
 * The Levenshtein distance between two words s and t is the minimal number of
 * insertions, deletions or substitutions that are needed to transform s into t.
 * @param {string} s - Source string.
 * @param {string} t - Traget string.
 */
function LevenshteinDistance(s, t) {
  const m = s.length;
  const n = t.length;

  /* initialization of the matrix */
  const d = initMatrix(m + 1, n + 1);

  for (let i = 1; i < m + 1; i++) {
    d[i][0] = i;
  }

  for (let j = 1; j < n + 1; j++) {
    d[0][j] = j;
  }

  let substitutionCost;
  for (let j = 1; j < n + 1; j++) {
    for (let i = 1; i < m + 1; i++) {
      substitutionCost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + substitutionCost // substitution
      );
    }
  }

  // for (const row of d) {
  //   console.log(Array.from(row));
  // }

  return d[m][n];
}

/**
 * Calculation of the Levenshtein distance between two words normalized
 * to the length of the shortest string.
 * @param {string} s - Source string.
 * @param {string} t - Target string.
 * @returns {number}
 */
function normalizedLD(s, t) {
  return LevenshteinDistance(s, t) / Math.min(s.length, t.length);
}

/**
 * Removes duplicates from an array of strings. Duplicates are obtained using
 * Levenshtein distance as similarity criterion.
 * @param {string[]} arr - Array of strings.
 * @returns {string[]}
 */
function removeDuplicates(arr) {
  if (arr.length === 0 || arr.length === 1) return arr; // no duplicates
  let out = Array.from(arr);
  let i = 0;
  let j;
  while (i < out.length) {
    j = i + 1;
    while (j < out.length) {
      if (isSimilar(out[i], out[j])) {
        out.splice(j, 1);
        continue;
      } else {
        j += 1;
      }
    }
    i += 1;
  }
  return out;
}

/**
 * Removes duplicates from an array of strings. Duplicates are obtained using
 * Levenshtein distance as similarity criterion. See {@link isSimilar}.
 * @param {Array} arr - Array to remove duplicates from.
 * @param {Function} toString - converts an array element into string.
 * @returns {string[]}
 */
function removeDuplicatesEx(arr, toString) {
  if (arr.length === 0 || arr.length === 1) return arr; // no duplicates
  let out = Array.from(arr);
  let i = 0;
  let j;
  while (i < out.length) {
    j = i + 1;
    while (j < out.length) {
      if (isSimilar(out[i], out[j])) {
        out.splice(j, 1);
        continue;
      } else {
        j += 1;
      }
    }
    i += 1;
  }
  return out;
}

/**
 * Among elements of the first array seeks those having duplicates in the second array.
 * Duplicates are removed from the first array. This function assumes that there is no duplicates
 * among each array.
 * @param {string[]} first - Array from which duplicates will be removed.
 * @param {string[]} second - Array to search for duplicates.
 */
function removeCrossDuplicates(first, second) {
  const filtered = first.filter((item) =>
    second.every((element) => !isSimilar(item, element))
  );
  first.splice(0, first.length, ...filtered);
}

/**
 * Needleman–Wunsch algorithm
 * https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
 * @param {string} s
 * @param {string} t
 */
export function NeedlemanWunsch(s, t) {
  const m = s.length;
  const n = t.length;
  const score_match = 1;
  const score_mismatch = -1;
  const score_indel = -1;

  /* initialization of the score matrix */
  const score = initInt16Matrix(m + 1, n + 1);
  score[0][0] = 0;
  for (let i = 1; i <= m; i++) score[i][0] = -i; // first column
  for (let j = 1; j <= n; j++) score[0][j] = -j; // first row

  /* row by row computation */
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      score[i + 1][j + 1] = Math.max(
        score[i][j] + (s[i] === t[j] ? score_match : score_mismatch),
        score[i][j + 1] + score_indel,
        score[i + 1][j] + score_indel
      );
    }
  }

  // for (const row of score) {
  //   console.log(Array.from(row));
  // }

  console.log(score[m][n]);
}
