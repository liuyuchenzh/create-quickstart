const rollup = require('rollup')
const chokidar = require('chokidar')
/*{{less}}*/
const less = require('less')
/*end {{less}}*/

const TS = /*{{ts}}*/'ts' || /*end {{ts}}*/ false
const LESS = /*{{less}}*/'less' || /*end {{less}}*/ false

const SCRIPT_NAME = TS || 'js'
const STYLE_NAME = LESS || 'css'
const WATCH_OPTION = {
  ignored: /(^|[\/\\])\../,
  persistent: true
}
const DELAY_IN_MS = 500
// mark for compiling
let isScriptCompiling = false
let isStyleCompiling = false
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
  return function () {
    if (isScriptCompiling) {
      return
    }
    isScriptCompiling = true
    /*{{ts}}*/
    exec('tsc', () => {
      console.log(`[${pjName}]: ts -> js done`)
      /*end {{ts}}*/
      console.log(`[${pjName}]: start to bundle...`)
      // start to rollup
      rollup.rollup({
        entry: resolve(entry),
        legacy: true
      }).then(function (bundle) {
        bundle.generate({
          format: 'umd',
          moduleName: 'app',
          amd: {
            id: 'app'
          },
          exports: 'default'
        }).then(res => {
          const namedCode = res.code
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
          isScriptCompiling = false
        })
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
  if (isStyleCompiling) {
    return
  }
  isStyleCompiling = true
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
    isStyleCompiling = false
  }, err => {
    console.log(err)
  })
  /*end {{less}}*/
  if (STYLE_NAME === 'css') {
    const cssContent = fs.readFileSync(resolve(entry))
    writeFiles(dist, cssContent)
    isStyleCompiling = false
  }
}

/**
 * watch file
 * @param {string[]} files: file list
 * @param {function} cb: callback
 */
function watch (files, cb) {
  const watcher = chokidar.watch(files, WATCH_OPTION)
  watcher
    .on('add', cb)
    .on('change', cb)
}

const _bundle = debounce(bundle('src/js/index.js', [
  'dist/js/index.js',
  'dist/js/index.min.js'
]), DELAY_IN_MS)
const _lessc = debounce(() => lessc('src/css/index.' + STYLE_NAME, [
  'dist/css/index.css'
]), DELAY_IN_MS)

console.log(`[${pjName}]: start to watch file...`)
watch(resolve('src/js'), _bundle)
watch(resolve('src/css'), _lessc)
// compile for the first time
_bundle('init')
_lessc()