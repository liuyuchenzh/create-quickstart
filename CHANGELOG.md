# changelog

## 1.7.0

- Features
  - Use `nodemon` to monitor changes of build-related files and restart `webpack-dev-sever` accordingly.

## 1.6.0

- Features
  - Add an option to enable PWA when choosing Vanilla (`Use service worker?`).

## 1.5.0

- Refactor
  - Rename project's name to `create-quickstart`.

## 1.4.1

- Features
  - open specified page when running `start` script under multi-page mode.

## 1.4.0

- Features
  - support class property and dynamic import out of box.

## 1.3.4

- Fix
  - Load local assets with proper path when running `start` script.

## 1.3.3

- Chore
  - update `webpack-upload-plugin` to `0.18.0`.

## 1.3.2

- Fix

  - Add `dist` to `.gitignore`

- Refactor
  - Move multi-page related files into its own `copy` directory.

## 1.3.1

- Fix
  - Drop `types` directory when using typescript;
  - Enable `allowSyntheticDefaultImports` by default when using typescript;
  - Add `.prettierrc` to root;
  - Turn off `trailing-comma` of tslint;
  - Add file path of `.prettierrc` to `tslint.json`.

## 1.3.0

- Features
  - support `multi-pages`

## 1.2.6

- using `tslint-plugin-prettier`

## 1.2.5

- refactor: using webpack v4 now

## 0.5.0

- support postcss
- fix bug on mac os
