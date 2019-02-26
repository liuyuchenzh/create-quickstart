// handle multi pages
// entry and all are mutually exclusive
const { multi, entry = "", all } = process.env;
const isMulti = multi === "true";
const buildAll = isMulti && all === "true";

module.exports = {
  isMulti,
  entry,
  buildAll
};
