const fs = require("fs");
const write = (location, content) => fs.writeFileSync(location, content);
const read = location => fs.readFileSync(location, "utf-8");

module.exports = {
  write,
  read
};
