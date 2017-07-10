const rollup = require('rollup')
/*{{less}}*/
const less = require('less')
/*end {{less}}*/

const TS = /*{{ts}}*/'ts' || /*end {{ts}}*/ false
const LESS = /*{{less}}*/'less' || /*end {{less}}*/ false

const SCRIPT_NAME = TS || 'js'
const STYLE_NAME = LESS || 'css'
const pjName = require('../package.json').name

const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const debounce = require('lodash').debounce
const closure = require('google-closure-compiler-js').compile
const root = path.resolve(__dirname, '..')

function resolve (...src) {
  return path.resolve(root, ...src)
}

/**
 * write file/files
 * @param {string|string[]} files: file or files
 * @param {string} content: content of file/files
 */
function writeFiles (files, content) {
  if (Array.isArray(files)) {
    files.forEach(file => {
      fs.writeFileSync(resolve(file), content)
    })
  } else {
    fs.writeFileSync(resolve(files), content)
  }
}

/**
 *
 * @param {string} entry: entry point
 * @param {string|string[]} distLists: the destination
 * @return {Function}
 */
function bundle (entry, distLists) {
  return function (eventType) {
    /*{{ts}}*/
    console.log(`[${pjName}]: ${eventType} event happened with script files`)
    exec('tsc', () => {
      console.log(`[${pjName}]: ts -> js done`)
      /*end {{ts}}*/
      console.log(`[${pjName}]: start to bundle...`)
      // start to rollup
      rollup.rollup({
        entry: resolve(entry),
        legacy: true
      }).then(function (bundle) {
        let result = bundle.generate({
          format: 'umd',
          moduleName: 'app',
          amd: {
            id: 'app'
          },
          exports: 'default'
        })
        const namedCode = result.code
        // full js
        writeFiles(
          distLists
            .map(dist => resolve(dist))
            .filter(dist => !/\.min\.js$/.test(dist)),
          namedCode
        )
        // closure-compile
        const code = closureCompile(namedCode)
        // min js
        writeFiles(
          distLists
            .map(dist => resolve(dist))
            .filter(dist => /\.min\.js$/.test(dist)),
          code)
        console.log(`[${pjName}]: bundle done`)
      }).catch((e) => {
        console.log(e)
      })
      /*{{ts}}*/
    })
    /*end {{ts}}*/
  }
}

function closureCompile (src) {
  console.log(`[${pjName}]: start to closure compile...`)
  const flags = {
    jsCode: [{src}],
    languageIn: 'ECMASCRIPT6',
    languageOut: 'ECMASCRIPT3',
    compilationLevel: 'ADVANCED'
  }
  const out = closure(flags)
  console.log(`[${pjName}]: closure compile done`)
  return out.compiledCode
}

/**
 * compile less
 */
function lessc (entry, dist) {
  /*{{less}}*/
  console.log(`[${pjName}]: start to compile less...`)
  let lessRaw = fs.readFileSync(resolve(entry), {
    encoding: 'utf-8'
  })
  lessRaw = lessRaw.replace(/@import.*?['"](\w+\.\w+)['"]/g, (match, file) => {
    return match.replace(file, resolve('src/css', file))
  })
  less.render(lessRaw, {
    sourceMap: {
      sourceMapFileInline: true
    }
  }).then(output => {
    writeFiles(dist, output.css)
    console.log(`[${pjName}]: less compile done`)
  }, err => {
    console.log(err)
  })
  /*end {{less}}*/
  if (STYLE_NAME === 'css') {
    const cssContent = fs.readFileSync(resolve(entry))
    writeFiles(dist, cssContent)
  }
}

/**
 * is it specific type of file
 * @param {string} type
 * @return {function}
 */
function isType (type) {
  return function checkType (file) {
    return fs.statSync(file).isFile() && path.extname(file) === '.' + type
  }
}

/**
 * is it file
 * @param {string} file
 * @return {boolean}
 */
function isFile (file) {
  return fs.statSync(file).isFile()
}

/**
 * is it dir
 * @param {string} file
 * @return {boolean}
 */
function isDir (file) {
  return fs.statSync(file).isDirectory()
}

/**
 * gather files in an array
 * @param {string} src:  where to look
 * @param {string} type: type of file
 * @return {string[]}: result
 */
function gatherFile (src, type) {
  const files = fs.readdirSync(src, {
    encoding: 'utf-8'
  })
  return files.reduce((last, file) => {
    const _file = resolve(src, file)
    if (isFile(_file)) {
      isType(type)(_file) && last.push(_file)
    } else if (isDir(_file)) {
      last = last.concat(gatherFile(_file, type))
    }
    return last
  }, [])
}

/**
 * watch file
 * @param {string[]} files: file list
 * @param {function} cb: callback
 */
function watch (files, cb) {
  files.forEach(file => {
    fs.watch(file, cb)
  })
}

const _bundle = debounce(bundle('src/js/index.js', [
  'dist/js/index.js',
  'dist/js/index.min.js'
]), 500)
const _lessc = debounce(() => lessc('src/css/index.' + STYLE_NAME, [
  'dist/css/index.css'
]), 500)

const scriptFiles = gatherFile('src/js', SCRIPT_NAME)
const styleFiles = gatherFile('src/css', STYLE_NAME)

console.log(`[${pjName}]: start to watch file...`)
watch(scriptFiles, _bundle)
watch(styleFiles, _lessc)
// compile for the first time
_bundle('init')
_lessc()