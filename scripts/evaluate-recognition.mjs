import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tempDir = mkdtempSync(join(tmpdir(), "bsb-recognition-eval-"));
const outputFile = join(tempDir, "summary.json");
const args = [
  "./node_modules/vitest/vitest.mjs",
  "run",
  "test/recognition-samples.test.ts",
  "test/local-learning.test.ts",
  "test/recognition-evaluation.test.ts"
];

const result = spawnSync(process.execPath, args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    FORCE_COLOR: "0",
    BSB_RECOGNITION_EVAL_OUTPUT: "1",
    BSB_RECOGNITION_EVAL_OUTPUT_FILE: outputFile
  },
  encoding: "utf8"
});

const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
process.stdout.write(stdout);
process.stderr.write(stderr);

let summary;
try {
  summary = JSON.parse(readFileSync(outputFile, "utf8"));
} catch (error) {
  console.error("Recognition evaluation summary file not found or unreadable.");
  rmSync(tempDir, { recursive: true, force: true });
  process.exit(result.status ?? 1);
}

console.log("");
console.log("Recognition evaluation summary");
console.log(`- approved samples: ${summary.totalApproved}`);
console.log(`- passed: ${summary.totalPassed}`);
console.log(`- failed: ${summary.totalFailed}`);
console.log(`- pending traps: ${summary.pendingTrapSamples.length}`);
console.log(`- false positives: ${summary.falsePositives.length}`);
console.log(`- false negatives: ${summary.falseNegatives.length}`);
console.log(`- boundary drift: ${summary.boundaryDrift.length}`);
console.log(`- local-learning failures: ${summary.localLearningFailures.length}`);

for (const [domain, stats] of Object.entries(summary.domainStats)) {
  console.log(`- ${domain}: ${stats.passed}/${stats.total} passed`);
}

if (result.status !== 0 || summary.falsePositives.length > 0 || summary.falseNegatives.length > 0 || summary.localLearningFailures.length > 0) {
  rmSync(tempDir, { recursive: true, force: true });
  process.exit(result.status && result.status !== 0 ? result.status : 1);
}

rmSync(tempDir, { recursive: true, force: true });
