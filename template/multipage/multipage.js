const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { NODE_ENV } = process.env;
const entry = process.argv.slice(-1)[0];
if (!fs.existsSync(path.resolve(__dirname, `src/pages/${entry}`))) {
  console.log("Please enter a proper page entry");
  console.log("Current one：");
  console.log(entry || "none");
  console.log();
  console.log("Valid options are:");
  const dirs = fs.readdirSync(path.resolve(__dirname, "src/pages"));
  dirs.forEach(dir => console.log(dir));
  process.exit(1);
}
const cli = NODE_ENV === "development" ? "webpack-dev-server" : "webpack";
spawn(
  "npx",
  ["cross-env", `NODE_ENV=${NODE_ENV}`, `entry=${entry}`, "multi=true", cli],
  {
    shell: true,
    stdio: "inherit"
  }
);
