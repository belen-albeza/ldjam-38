# Terrartisan

HTML5 game entry for [Ludum Dare #38](http://ludumdare.com), a 48-hour solo game jam.

**Play online**:

- Itch.io
- [Github Pages mirror](https://belen-albeza.github.io/ldjam-38/)

Initial scaffolding generated with [generator-gamejam](https://github.com/belen-albeza/generator-gamejam/).

## Installation

### Requirements

This games uses [gulp](http://gulpjs.com/) for building and tasks automation.

You can install gulp with npm:

```
npm install -g gulp
```

### Build

Clone this repository and install dependencies:

```
git clone belen-albeza/ldjam-38
cd ldjam-38
npm install
```

To **build** the game, run the `dist` task from the project root:

```
gulp dist
```

The `dist` folder will contain a build of the game. You can then start a local server that serves this directory statically to play the game in local:

```
npm install -g http-server
http-server dist
```

You can **clean up** the temporary files and the `dist` folder by running:

```
gulp clean
```

## Development

This project uses [Browserify](http://browserify.org) to handle JavaScript modules.

There is a task that will automatically run Browserify when a JavaScript file changes, and it will also reload the browser.

```
gulp run
```

You can deploy to **Github Pages** with the `deploy` task, which will build the project and then push the `dist` folder in the `gh-pages` branch.

```
gulp deploy
```
