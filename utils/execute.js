const { spawnSync } = require("child_process");
const options = {
  stdio: "inherit",
  shell: true
};

function execute(command, methodAndFlag = [], args = []) {
  const customArgs = [...methodAndFlag, ...args];
  const passIn = customArgs.length ? [customArgs, options] : [options];
  spawnSync(command, ...passIn);
}

module.exports = execute;
