const IS_DEV = process.env.NODE_ENV === "development";

const getAssetsPath = prefix => {
  return IS_DEV ? "[path]" : prefix;
};

module.exports = {
  getAssetsPath
};
