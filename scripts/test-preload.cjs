// Node 24 can fail to resolve the current Windows user while tsx creates its
// temporary directory. Keep the test launcher usable in constrained runners;
// normal applications never load this file.
const os = require("node:os");

try {
  os.userInfo = () => ({
    username: process.env.USERNAME || "test-runner",
    uid: -1,
    gid: -1,
    shell: null,
    homedir: process.env.USERPROFILE || process.cwd(),
  });
} catch {
  // If the runtime exposes a read-only os.userInfo, tsx will use its normal path.
}
