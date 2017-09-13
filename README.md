## Intro
Cli for personal project<br>
Use `rollup` + `google-closure-compiler-js` [+ `typescript`] [+ `less`] [+ `postcss`] <br>
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
*2* Choose a css pre-processor: less or postcss<br>
*3* type the name of project directory: (my-app)<br>

Based on your answer, a `my-app` (or any name you choose) directory will be created with new project located in

```shell
cd my-app
npm run watch
```
Now `y-cli` support hot reload : )

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, Yuchen Liu