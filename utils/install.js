const execute = require("./execute");

function install(installer, pkg, mode = "-D") {
  const isNpm = installer === "npm";
  const isGlobal = mode === "-g";
  const command = isNpm ? "i" : "add";
  const preCommand = isGlobal ? (isNpm ? "" : "global") : "";
  const preCommandArr = preCommand ? [preCommand] : [];
  const flag = isNpm ? mode : "";
  const flagArr = flag ? [flag] : [];
  execute(installer, preCommandArr.concat([command], flagArr, [pkg]));
}

module.exports = install;
