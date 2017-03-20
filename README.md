# @dojo/dgrid

[![Build Status](https://travis-ci.org/dojo/dgrid.svg?branch=master)](https://travis-ci.org/dojo/dgrid)
[![codecov](https://codecov.io/gh/dojo/dgrid/branch/master/graph/badge.svg)](https://codecov.io/gh/dojo/dgrid)
[![npm version](https://badge.fury.io/js/%40dojo%2Fdgrid.svg)](http://badge.fury.io/js/%40dojo%2Fdgrid)

A reactive grid for Dojo 2 built using [(@dojo/widget-core)](https://github.com/dojo/widget-core).

**WARNING** This is *alpha* software. It is not yet production ready, so you should use at your own risk.

- [Features](#features)
- [Usage](#usage)
- [How Do I Contribute?](#how-do-i-contribute)
    - [Testing](#testing)
- [Licensing Information](#licensing-information)

## Features

- Column configuration
- Array-backed data
- Sorting

## Usage

TODO: Add appropriate usage and instruction guidelines

## How do I contribute?

We appreciate your interest!  Please see the [Dojo 2 Meta Repository](https://github.com/dojo/meta#readme) for the
Contributing Guidelines and Style Guide.

## Testing

Test cases MUST be written using [Intern](https://theintern.github.io) using the Object test interface and Assert assertion interface.

90% branch coverage MUST be provided for all code submitted to this repository, as reported by istanbul’s combined coverage results for all supported platforms.

To test locally in node run:

`grunt test`

To test against browsers with a local selenium server run:

`grunt test:local`

To test against BrowserStack or Sauce Labs run:

`grunt test:browserstack`

or

`grunt test:saucelabs`

## Licensing information

TODO: If third-party code was used to write this library, make a list of project names and licenses here

* [Third-party lib one](https//github.com/foo/bar) ([New BSD](http://opensource.org/licenses/BSD-3-Clause))

© 2017 [JS Foundation](https://js.foundation/). [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
