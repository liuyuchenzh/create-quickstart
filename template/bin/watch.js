const rollup = require('rollup')
/*{{ts}}*/
const typescript = require('rollup-plugin-typescript2')
/*end {{ts}}*/
const chokidar = require('chokidar')
const bs = require('browser-sync').create()
const closure = require('google-closure-compiler-js').compile

/*{{less}}*/
const less = require('less')
/*end {{less}}*/

/*{{postcss}}*/
const postcss = require('postcss')
const postcssConfig = require('../postcss.config')
/*end {{postcss}}*/

const TS = /*{{ts}}*/ 'ts' || /*end {{ts}}*/ false
// only two states: less or not
const STYLE = /*{{less}}*/ 'less' || /*end {{less}}*/ false
const USE_POSTCSS = /* {{postcss}} */ true || /* end {{postcss}} */ false

const SCRIPT_NAME = TS || 'js'
const STYLE_NAME = STYLE || 'css'
const WATCH_OPTION = {
  ignored: /(^|[\/\\])\../,
  persistent: true
}
const DELAY_IN_MS = 500
// mark for compiling
let isScriptCompiling = false
let isStyleCompiling = false
// project name
const pjName = require('../package.json').name

const fs = require('fs')
const path = require('path')
const debounce = require('lodash').debounce
const root = path.resolve(__dirname, '..')

function resolve (...src) {
  return path.resolve(root, ...src)
}

// start server
bs.init({
  server: root
})

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
 * bundle script
 * @param {string} entry: entry point
 * @param {string|string[]} distLists: the destination
 * @return {Promise}
 */
function bundle (entry, distLists) {
  return new Promise((_resolve, _reject) => {
    if (isScriptCompiling) {
      _reject(false)
      return
    }
    isScriptCompiling = true
    console.log(`[${pjName}]: start to bundle...`)
    // start to rollup
    rollup
      .rollup({
        input: resolve(entry),
        /*{{ts}}*/
        plugins: [typescript()],
        /*end {{ts}}*/
        legacy: true
      })
      .then(function (bundle) {
        bundle
          .generate({
            format: 'umd',
            name: 'app',
            amd: {
              id: 'app'
            },
            exports: 'default'
          })
          .then(res => {
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
              code
            )
            console.log(`[${pjName}]: bundle done`)
            isScriptCompiling = false
            _resolve(true)
          })
      })
      .catch(e => {
        console.log(e)
        _reject(false)
      })
  })
}

/**
 * run google-closure-compiler-js
 * @param {string} src
 * @return {string}
 */
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
 * compile css
 * @param {string} entry
 * @param {string|string[]} dist
 * @return {Promise}
 */
function compileCss (entry, dist) {
  return new Promise((_resolve, _reject) => {
    if (isStyleCompiling) {
      return
    }
    isStyleCompiling = true
    /*{{less}}*/
    console.log(`[${pjName}]: start to compile less...`)
    let lessRaw = fs.readFileSync(resolve(entry), {
      encoding: 'utf-8'
    })
    lessRaw = lessRaw.replace(
      /@import.*?['"](\w+\.\w+)['"]/g,
      (match, file) => {
        return match.replace(file, resolve('src/css', file))
      }
    )
    less
      .render(lessRaw, {
        sourceMap: {
          sourceMapFileInline: true
        }
      })
      .then(
        output => {
          writeFiles(dist, output.css)
          console.log(`[${pjName}]: less compile done`)
          isStyleCompiling = false
          _resolve(true)
        },
        err => {
          console.log(err)
          _reject(false)
        }
      )
    /*end {{less}}*/
    /* {{postcss}} */
    console.log(`[${pjName}]: start to compile postcss`)
    const css = fs.readFileSync(resolve(entry), 'utf-8')
    postcss(postcssConfig)
      .process(css, {from: entry, to: dist})
      .then(
        result => {
          writeFiles(dist, result.css)
          if (result.map) {
            writeFiles(dist.map(item => item + '.map'), result.map)
          }
          _resolve(true)
          isStyleCompiling = false
          console.log(`[${pjName}]: postcss compile done`)
        },
        () => {
          _reject(false)
          console.log(`[${pjName}]: postcss compile failed`)
          isStyleCompiling = false
        }
      )
    /* end {{postcss}} */
    if (STYLE_NAME === 'css' && !USE_POSTCSS) {
      const cssContent = fs.readFileSync(resolve(entry))
      writeFiles(dist, cssContent)
      isStyleCompiling = false
      _resolve(true)
    }
  })
}

/**
 * watch file
 * @param {string[]} files: file list
 * @param {function} cb: callback
 */
function watch (files, cb) {
  const watcher = chokidar.watch(files, WATCH_OPTION)
  watcher.on('add', cb).on('change', cb)
}

// reload html
const _reload = debounce(() => {
  bs.reload(resolve('*.html'))
}, DELAY_IN_MS * 3)

// delay compile
const _bundle = debounce(() => {
  bundle('src/js/index.' + SCRIPT_NAME, [
    'dist/js/index.js',
    'dist/js/index.min.js'
  ])
    .then(() => {
      _reload()
    })
    // do nothing
    .catch(() => {})
}, DELAY_IN_MS)
const _compileCss = debounce(() => {
  compileCss('src/css/index.' + STYLE_NAME, ['dist/css/index.css'])
    .then(() => {
      _reload()
    })
    // do nothing
    .catch(() => {})
}, DELAY_IN_MS)

console.log(`[${pjName}]: start to watch file...`)
watch(resolve('src/js/**/*.' + SCRIPT_NAME), _bundle)
watch(resolve('src/css/**/*.' + STYLE_NAME), _compileCss)
// compile for the first time
_bundle('init')
_compileCss()
