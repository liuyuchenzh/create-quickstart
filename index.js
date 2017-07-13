const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const exec = require('child_process').exec
const https = require('https')
const inquirer = require('inquirer')
const semver = require('semver')
const {template} = require('./script/template')
const root = __dirname
const TS = 'ts'
const LESS = 'less'
const DIST = 'dist'
const NPM_HOST = 'https://www.npmjs.com/'
const PJ_NAME = require('./package.json').name
const TPL_PATH = path.resolve(root, 'template')
const TPL_PKG_PATH = path.resolve(root, './template/package.json')
const pkg = require(TPL_PKG_PATH)
const G_PKG_LIST = pkg.globalDependencies
const TS_DEP = pkg.tsDependencies
const LESS_DEP = pkg.lessDependencies
const ANS_MAP = {
  'y': true,
  'n': false
}
const TYPE_MAP = {
  'ts': 'js',
  'less': 'css'
}
const PKG_NAME_MAP = {
  'typescript': 'ts'
}
const FILTER_OUT_DIR = ['.idea', '.vscode', '.gitignore', 'node_modules']

function getMeaningFromAns (ans) {
  return ANS_MAP[ans]
}

/**
 * core function
 */
function yCli () {
  if (!isValidNode()) {
    console.log('please update your node to the latest first')
    return
  }
  inquirer
    .prompt([
      {
        type: 'input',
        name: TS,
        message: 'Use typescript?(y/n)',
        default: 'y'
      }, {
        type: 'input',
        name: LESS,
        message: 'Use less?(y/n)',
        default: 'y'
      }, {
        type: 'input',
        name: DIST,
        message: 'type the name of project directory: ',
        default: 'my-app'
      }
    ])
    .then(ans => {
      // string -> boolean
      const preferredAns = convertAns(ans)
      // where to init the project
      const dist = path.resolve(ans[DIST])
      // get global package list
      const gList = updateGList(G_PKG_LIST, preferredAns)
      // generate new package content
      const _pkg = Object.entries(ans)
        .reduce((last, entry) => {
          last = updatePkgGivenUsage(entry[0], getMeaningFromAns(entry[1]), last)
          return last
        }, pkg)
      console.log(`[${PJ_NAME}]: rewrite package.json done`)
      // start the core function
      init(dist, TPL_PATH, _pkg, gList)
        .then(() => {
          const _dist = process.cwd()
          // rename file if necessary
          Object.entries(ans)
            .forEach(entry => {
              updateFile(entry[0], getMeaningFromAns(entry[1]), path.resolve(_dist, 'src'))
            })
          console.log(`[${PJ_NAME}]: rewrite file ext name done`)
          // rewrite watch.js if given the answer
          rewriteWatchFile(path.resolve(_dist, 'bin/watch.js'), preferredAns)
          console.log(`[${PJ_NAME}]: rewrite watch.js done`)
          // remove tsconfig.json
          if (!preferredAns.ts) {
            removeTsConfig(_dist)
            console.log(`[${PJ_NAME}]: remove tsconfig.json done`)
          }
          console.log(`[${PJ_NAME}]: init success`)
        })
    })
}

/**
 * convert answer into preferred format
 * @param {object} ans
 * @return {object}
 */
function convertAns (ans) {
  let ret = {}
  for (let key in ans) {
    ret[key] = getMeaningFromAns(ans[key])
  }
  return ret
}

/**
 * update package.json
 * @param {string} usageName
 * @param {boolean} toUse
 * @param {JSON} _package
 * @return {JSON}
 */
function updatePkgGivenUsage (usageName, toUse, _package = pkg) {
  switch (usageName) {
    case TS:
      !toUse && TS_DEP.forEach(dep => deleteUsageInPkg(dep, _package))
      return _package
    case LESS:
      !toUse && LESS_DEP.forEach(dep => deleteUsageInPkg(dep, _package))
      return _package
    default:
      return _package
  }
}

/**
 * delete devDependencies in package.json
 * @param {string} name
 * @param {JSON} _package
 */
function deleteUsageInPkg (name, _package = pkg) {
  try {
    delete _package.devDependencies[name]
  } catch (e) {}
}

/**
 * timeout function
 * @param {number} timeInMs
 * @return {Promise<string>}
 */
function timeout (timeInMs) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('timeout')
    }, timeInMs)
  })
}

/**
 * try to connect to npmjs.com
 * @return {Promise}
 */
function tryConnectNPM () {
  return new Promise((resolve, reject) => {
    https.get(NPM_HOST, (res) => {
      const {statusCode} = res
      if (statusCode !== 200) {
        reject('fail')
      }
      res.on('end', () => {
        resolve('success')
      })
    }).on('error', () => {
      reject('fail')
    })
  })
}

/**
 * is using case within *wall*
 * @return {Promise<boolean>}
 */
function isWithinWall () {
  return Promise.race([tryConnectNPM(), timeout(500)])
    .then(() => {
      return false
    })
    .catch(() => {
      return true
    })
}

/**
 * is valid node version
 * @return {boolean}
 */
function isValidNode () {
  const v = process.version
  return semver.satisfies(v, '>=7.4.0')
}

/**
 * toggle package.json content
 * @param {string} packagePath
 * @param {string} packageContent
 */
function adjustPkg (packagePath, packageContent) {
  fs.writeFileSync(packagePath, packageContent)
}

/**
 * copy file/dir
 * @param {string} tplSrc
 * @param {string} dist
 */
function copyTemplate (tplSrc, dist) {
  return fse.copy(tplSrc, dist)
}

/**
 * rename file
 * @param {string} oldPath
 * @param {string} newPath
 */
function rename (oldPath, newPath) {
  fs.renameSync(oldPath, newPath)
}

/**
 * rename the ext name based on the answer
 * @param {string} usageName: ts | less
 * @param {boolean} toUse
 * @param {string} src: where files lies in
 */
function updateFile (usageName, toUse, src) {
  if (!toUse || !TYPE_MAP[usageName]) {
    return
  }
  // original ext name: TYPE_MAP[usageName]
  // target ext name: usageName
  const list = gatherFileIn(src)(TYPE_MAP[usageName])
  const reg = new RegExp(TYPE_MAP[usageName] + '$')
  list.forEach(file => {
    // rename file ext name
    rename(file, file.replace(reg, usageName))
  })
}

/**
 * based on answer, rewrite watch file
 * @param {string} filePath
 * @param {object} data
 */
function rewriteWatchFile (filePath, data) {
  const src = path.resolve(filePath)
  const watchFile = fs.readFileSync(src, 'utf-8')
  fs.writeFileSync(src, template(watchFile, data))
}

/**
 * remove tsconfig.json
 * @param {string} filePath
 */
function removeTsConfig (filePath) {
  fs.unlinkSync(path.resolve(filePath, 'tsconfig.json'))
}

/**
 * gather specific file type within directory provided
 * 1. provide range to search: src
 * 2. provide the type of file to search: type
 * @param {string} src: directory to search
 * @return {function}
 */
function gatherFileIn (src) {
  return function gatherFileType (type) {
    return fs.readdirSync(src)
      .reduce((last, file) => {
        const filePath = path.resolve(src, file)
        if (isFile(filePath)) {
          path.extname(file) === `.${type}` && last.push(path.normalize(filePath))
        } else if (isFilterOutDir(file)) {
          // do nothing
        } else if (isDir(filePath)) {
          last = last.concat(gatherFileIn(filePath)(type))
        }
        return last
      }, [])
  }
}

function isFile (input) {
  return fs.statSync(input).isFile()
}

function isDir (input) {
  return fs.statSync(input).isDirectory()
}

function isFilterOutDir (input) {
  return FILTER_OUT_DIR.includes(input)
}

/**
 * init
 * @param {string} dist: where to create the project
 * @param {string} tplSrc: where to find template
 * @param {string} pkgContent: package.json for project
 * @param {string[]}gList: global package list
 * @return {Promise}
 */
async function init (dist, tplSrc, pkgContent, gList) {
  // copy template
  await copyTemplate(tplSrc, dist)
  // cd to the dist dir
  const wd = process.cwd()
  const abDist = path.resolve(wd, dist)
  process.chdir(abDist)
  console.log(`[${PJ_NAME}]: cd to ${abDist}`)
  // adjust package.json
  adjustPkg(path.resolve(abDist, 'package.json'), JSON.stringify(pkgContent))
  
  return isWithinWall()
    .then((isIn) => {
      console.log(`[${PJ_NAME}]: ${isIn ? 'in the wall' : 'out of the wall'}`)
      // install locally and globally
      return Promise.all([
        install(isIn, {
          type: 'local'
        }),
        install(isIn, {
          type: 'global',
          list: gList
        })
      ])
    })
}

/**
 * update global package list
 * @param {string[]} oldList
 * @param {object} preferredAns
 */
function updateGList (oldList, preferredAns) {
  return oldList
    .filter(pkgName => {
      switch (pkgName) {
        case 'rollup':
          return true
        default:
          const questionName = PKG_NAME_MAP[pkgName]
          return preferredAns[questionName]
      }
    })
}

/**
 * install package
 * @param {boolean} withInWall
 * @param {object} option
 * @return {Promise}
 */
function install (withInWall, option) {
  const type = option.type
  const list = option.list
  return new Promise((resolve, reject) => {
    let command = withInWall ? 'npm install --registry=https://registry.npm.taobao.org' : 'npm install'
    // generate command based on type
    command = type === 'global' ? command + ' -g ' + list.join(' ') : command
    console.log(`[${PJ_NAME}]: start to install ${type} package, please be patient`)
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.log(`[${PJ_NAME}]: something went wrong when installing ${type} packages`)
        console.error(err)
        reject(`error occurred during ${type} package installation`)
      }
      console.log(`[${PJ_NAME}]: result of ${type} package installation: ${stdout}`)
      console.log(`[${PJ_NAME}]: notice of ${type} package installation: ${stderr}`)
      resolve('success')
    })
  })
}

module.exports = {
  yCli
}