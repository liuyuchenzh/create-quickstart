function template (content, data) {
  const reg = /\/\*{{(\w+)}}\*\/[\s\S]*?\/\*end\s*{{\1}}\*\//g
  return content.replace(reg, (match, key) => {
    return data[key] ? match : ''
  })
}

module.exports = {
  template
}