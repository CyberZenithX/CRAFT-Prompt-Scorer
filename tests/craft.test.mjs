import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";

const source = await readFile(new URL("../app/api/grade/craft.ts", import.meta.url), "utf8");
const { parseCraftResult, RUBRIC } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`
);
const valid = {
  score: 70,
  categoryScores: { context: 20, role: 0, action: 15, format: 20, tone: 15 },
  missing: ["Role: assign a relevant copywriter role.", "Action: request a hook.", "Tone: specify wording to avoid."]
};

test("accepts partial CRAFT scores and preserves the public response shape", () => {
  assert.deepEqual(parseCraftResult(valid), { score: 70, missing: valid.missing });
});

test("accepts both boundary totals", () => {
  for (const points of [0, 20]) {
    assert.equal(parseCraftResult({
      score: points * 5,
      categoryScores: { context: points, role: points, action: points, format: points, tone: points },
      missing: []
    }).score, points * 5);
  }
});

test("rejects a total that disagrees with the five category scores", () => {
  assert.throws(() => parseCraftResult({ ...valid, score: 100 }), /total/);
});

test("rejects missing, non-integer, out-of-range, and string category scores", () => {
  for (const score of [undefined, -1, 21, 19.5, "20", NaN]) {
    assert.throws(() => parseCraftResult({
      ...valid, categoryScores: { ...valid.categoryScores, context: score }
    }), /category score/);
  }
  assert.throws(() => parseCraftResult({ score: 70, missing: [] }), /category scores/);
});

test("rejects malformed missing requirements", () => {
  for (const missing of [undefined, "Role", [123], [" "], Array(11).fill("Role: add a role.")]) {
    assert.throws(() => parseCraftResult({ ...valid, missing }), /missing requirements/);
  }
});

test("the rubric covers CRAFT and treats the submitted prompt as untrusted data", () => {
  for (const category of ["Context (20)", "Role (20)", "Action (20)", "Format (20)", "Tone (20)"]) {
    assert.ok(RUBRIC.includes(category));
  }
  assert.ok(RUBRIC.includes("untrusted DATA"));
  assert.ok(RUBRIC.includes("not prompt length"));
});
