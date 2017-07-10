## Intro
Cli for personal project<br>
Use `rollup` + `google-closure-compiler-js` [+ `typescript`] [+ `less`] <br>
Still under development

## installation
```shell
npm i -g y-cli
```

## Usage
Run `y-cli` in your shell
```shell
y-cli
```
Then answer 3 questions<br>
*1* Use typescript(y/n)<br>
*2* Use less(y/n)<br>
*3* type the name of project directory: (my-app)<br>

Based on your answer, a `my-app` (or any name you choose) directory will be created with new project located in

```shell
cd my-app
npm run watch
```
Open the `index.html` in browser

Notice: for the time being, no hot reload feature is included, which means you have to manually refresh the page

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Yuchen Liu