const path = require("path");
const fs = require("fs");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const merge = require("lodash/merge");
const execute = require("./utils/execute");
const install = require("./utils/install");
const { write, read } = require("./utils/io");
let packageJson = require("./template/package.json");

const renameExt = (targetExt, newExt) => location => {
  const reg = new RegExp(`${targetExt}$`);
  fs.renameSync(location, location.replace(reg, newExt));
};

const resolve = (...args) => path.resolve(__dirname, ...args);
const formatJSON = json => JSON.stringify(json, null, 2);

const OFFICIAL_CLI = {
  react: "create-react-app",
  vue: "@vue/cli",
  angular: "@angular/cli",
  preact: "preact-cli"
};

const OFFICIAL_CLI_COMMAND = {
  react: "create-react-app",
  vue: "vue create",
  angular: "ng new",
  preact: "preact create default"
};

const STYLE_EXT = {
  less: "less",
  sass: "scss",
  stylus: "styl",
  postcss: "css"
};

const usingVanilla = ({ framework }) => framework === "vanilla";
const usingCdn = ({ cdn }) => cdn;

const questions = [
  {
    name: "directory",
    message: "where to init? (provide a directory)",
    default: "new-project"
  },
  {
    name: "framework",
    message: "Choose your framework",
    type: "list",
    choices: [
      {
        name: "Vanilla JavaScript",
        value: "vanilla"
      },
      {
        name: "React",
        value: "react"
      },
      {
        name: "Vue",
        value: "vue"
      },
      {
        name: "Angular",
        value: "angular"
      },
      {
        name: "Preact",
        value: "preact"
      }
    ]
  },
  {
    name: "typescript",
    message: "Use TypeScript?",
    type: "confirm",
    default: false,
    when: usingVanilla
  },
  {
    name: "css",
    message: "Choose css pre-processor",
    type: "list",
    when: usingVanilla,
    default: "postcss",
    choices: [
      {
        name: "PostCss",
        value: "postcss"
      },
      {
        name: "Less",
        value: "less"
      },
      {
        name: "Sass",
        value: "sass"
      },
      {
        name: "Stylus",
        value: "stylus"
      }
    ]
  },
  {
    name: "cdn",
    message: "Use cdn service?",
    type: "confirm",
    default: false,
    when: usingVanilla
  },
  {
    name: "cdnProvider",
    message: "Type in cdn provider(package name):",
    validate(input) {
      if (!input) {
        return "Please enter the name of your cdn provider!";
      }
      return true;
    },
    when: usingCdn
  },
  {
    name: "installer",
    message: "Use npm or yarn?",
    choices: ["npm", "yarn"],
    type: "list",
    default: "npm"
  },
  {
    name: "registry",
    message: "Type your npm registry (or you can just hit enter):",
    default: "registry=https://registry.npm.taobao.org",
    when: usingVanilla
  }
];

// if use official cli
// install cli and execute
// else cd to directory
// copy template then install
function init() {
  inquirer.prompt(questions).then(answer => {
    const {
      directory,
      framework,
      typescript,
      css,
      cdn,
      cdnProvider,
      installer,
      registry
    } = answer;
    if (!usingVanilla(answer)) {
      // use official cli
      const cli = OFFICIAL_CLI[framework];
      const command = OFFICIAL_CLI_COMMAND[framework];
      console.log(`installing ${cli}...`);
      install(installer, cli, "-g");
      console.log(`using ${cli} to init the project`);
      execute("npx", command.split(" ").concat(directory));
      return;
    }
    // copy template so it will be left untouched
    const tempLocation = resolve("temp");
    fse.copySync(resolve("template"), tempLocation);
    const indexJsLocation = resolve("temp/src/index.js");
    const copyList = [
      "build/",
      "webpack/",
      "index.html",
      "src/",
      "package.json",
      "README.md",
      ".editorconfig",
      ".gitignore"
    ];
    // merge package.json
    // update package.json
    // copy eslint/tslint files to template root
    // copy template to given directory
    // clean template
    // cd to given directory
    // run npm install or yarn

    // use typescript or javascript
    let scriptCopyLocation = resolve("template/jsconfig/copy/");
    if (typescript) {
      const tsPackage = require("./template/tsconfig/package.json");
      packageJson = merge(packageJson, tsPackage);
      scriptCopyLocation = resolve("template/tsconfig/copy/");
      // update jsloader.json
      const loader = require("./template/webpack/loader/jsloader.json");
      loader.test = "\\.tsx?$";
      loader.use = "ts-loader";
      loader.ext = "ts";
      const jsloaderLocation = resolve("temp/webpack/loader/jsloader.json");
      write(jsloaderLocation, JSON.stringify(loader, null, 2));
    } else {
      const jsPackage = require("./template/jsconfig/package.json");
      packageJson = merge(packageJson, jsPackage);
    }
    // copy lint files etc
    fse.copySync(scriptCopyLocation, tempLocation);
    copyList.push(...fs.readdirSync(scriptCopyLocation));

    const styleExt = STYLE_EXT[css];
    // update style file extension
    // style reference
    // as well as webpack loader
    if (css !== "postcss") {
      // update extension
      const cssLocation = resolve("temp/src/index.css");
      const cssLoaderLocation = resolve("temp/webpack/loader/cssloader.json");
      renameExt("css", styleExt)(cssLocation);
      // update reference in index.js
      const indexJs = read(indexJsLocation);
      const newJsContent = indexJs.replace(/(index)\.css/, `$1.${styleExt}`);
      write(indexJsLocation, newJsContent);
      // update loader info
      const cssLoader = require("./template/webpack/loader/cssloader.json");
      cssLoader.use = `${css}-loader`;
      cssLoader.test = `\\.${styleExt}$`;
      write(cssLoaderLocation, formatJSON(cssLoader));
    } else {
      copyList.push("postcss.config.js");
    }
    // merge css package.json
    packageJson = merge(
      packageJson,
      require(`./template/cssconfig/package.${css}.json`)
    );
    // using cdn service
    if (cdn) {
      const cdnPackageJson = require("./template/webpack/plugins/package.json");
      if (!cdnPackageJson.devDependencies) {
        cdnPackageJson.devDependencies = {};
      }
      // add cdn provider to package.json
      cdnPackageJson.devDependencies[cdnProvider] = "latest";
      const pluginJson = require("./template/webpack/plugins/plugins.json");
      // update plugin json
      pluginJson.plugins = pluginJson.plugins.map(item => {
        if (item.key === "cdn") {
          return Object.assign(item, {
            name: cdnProvider,
            version: "latest"
          });
        }
        return item;
      });
      // write plugin json
      write(
        resolve("temp/webpack/plugins/plugins.json"),
        formatJSON(pluginJson)
      );
      // update project package.json
      merge(packageJson, cdnPackageJson);
    }
    // update package.json
    write(resolve("temp/package.json"), formatJSON(packageJson));

    // only update .js -> .ts here since css reference may needs to be updated too
    if (typescript) {
      renameExt("js", "ts")(indexJsLocation);
    }

    // create .npmrc
    if (registry && registry.trim()) {
      const content =
        registry.trim().indexOf("registry=") === 0
          ? registry
          : `registry=${registry}`;
      write(resolve("temp/.npmrc"), content);
      copyList.push(".npmrc");
    }
    const ws = process.cwd();
    const dist = path.resolve(ws, directory || "");
    // copy files to dist
    copyList.forEach(file =>
      fse.copySync(resolve(`temp/${file}`), path.resolve(dist, file))
    );
    // clean temp directory and package.jon in webpack/plugins
    const deleteLocations = [
      tempLocation,
      path.resolve(dist, "webpack/plugins/package.json")
    ];
    deleteLocations.forEach(loc => {
      try {
        fse.removeSync(loc);
      } catch (e) {
        console.log(e);
      }
    });
    // cd to dist and install all dependencies
    process.chdir(dist);
    const method = "install";
    console.log("installing...");
    execute(installer, [method]);
    console.log("all done");
    console.log("please enter following command:");
    console.log(`- cd ${directory}`);
    console.log(`- npm run start`);
  });
}

module.exports = init;
