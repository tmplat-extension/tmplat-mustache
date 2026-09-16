# tmplat-mustache

[![Build Status](https://img.shields.io/github/actions/workflow/status/tmplat-extension/tmplat-mustache/ci.yml?style=for-the-badge)](https://github.com/tmplat-extension/tmplat-mustache/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/tmplat-extension/tmplat-mustache?style=for-the-badge)](https://github.com/tmplat-extension/tmplat-mustache)
[![License](https://img.shields.io/github/license/tmplat-extension/tmplat-mustache?style=for-the-badge)](https://github.com/tmplat-extension/tmplat-mustache/blob/main/LICENSE)

A fork of [mustache.js](https://github.com/janl/mustache.js) for the [tmplat](https://tmplat.com) browser extension.

## Install

Install using `npm`:

```bash
npm install tmplat-mustache
```

## Usage

Rendering is asynchronous, so `render` returns a promise:

```js
import TmplatMustache from 'tmplat-mustache';

const output = await TmplatMustache.render('Hello, {name}!', { name: 'Luke' });
```

[tmplat-mustache](https://github.com/tmplat-extension/tmplat-mustache) is very similar to
[mustache.js](https://github.com/janl/mustache.js) with the following differences:

* Uses `{unescaped}` instead of `{{{unescaped}}}`
* Comments, partials, sections (incl. inverted), and custom delimiters now use single curly braces
* `{&name}` is used to escape instead of unescape, as is `{{name}}`
* Treats a lone `{` in text as the start of a tag, so literal braces need custom delimiters
* Ignores case when looking up view properties
* Arrays are rendered as a comma-separated list based on their contents
* Objects are rendered as a comma-separated list based on their property values
* Functions are always called, so one can never be rendered as its own source code
* On a more technical note; the rendering is entirely asynchronous to support promises in the template context

It is published as an ESM-only package with TypeScript types included, and has no command line tool.

These changes make it perfect for usage within the [tmplat](https://tmplat.com) browser extension.

## Bugs

If you have any problems with this fork or would like to see changes currently in development you can do so
[here](https://github.com/tmplat-extension/tmplat-mustache/issues). Upstream features and issues are maintained
separately [here](https://github.com/janl/mustache.js/issues).

## License

See [LICENSE](LICENSE) for more information on our MIT license.
