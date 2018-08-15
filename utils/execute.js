const { spawnSync } = require("child_process");
const options = {
  stdio: "inherit"
};

function execute(command, methodAndFlag = [], args = []) {
  spawnSync(command, [...methodAndFlag, ...args], options);
}

module.exports = execute;
