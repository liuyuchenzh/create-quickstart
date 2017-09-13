function template (content, data) {
  const reg = /\/\*\s*{{(\w+)}}\s*\*\/[\s\S]*?\/\*\s*end\s*{{\1}}\s*\*\//g
  return content
    .replace(reg, (match, key) => {
      return data[key] ? match : ''
    })
    // remove useless comment
    .replace(/\/\*\s*(end\s*)?{{(\w+)}}\s*\*\/\s{,1}/g, '')
}

module.exports = {
  template
}