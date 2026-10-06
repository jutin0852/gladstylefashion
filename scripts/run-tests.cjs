const { spawnSync } = require("node:child_process");
const path = require("node:path");

const preload = path.join(__dirname, "test-preload.cjs");
const existingNodeOptions = process.env.NODE_OPTIONS || "";
const preloadForNodeOptions = preload.replaceAll("\\", "/");
const nodeOptions = `${existingNodeOptions} --require=${preloadForNodeOptions}`.trim();
const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...process.argv.slice(2)],
  {
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
