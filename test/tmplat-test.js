import './helper.js';

/**
 * Covers only the behaviour that differs from upstream mustache.js. Everything else is exercised by the inherited
 * suites, so a failure here means this fork has lost one of the reasons it exists.
 */

function render (template, view, partials, config) {
  return Mustache.render(template, view, partials, config);
}

async function rejects (promise, expected) {
  var error;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  assert.isDefined(error, 'expected the promise to reject');
  if (expected) assert.match(error.message, expected);
  return error;
}

describe('Single brace delimiters', function () {
  it('interpolates a value tag', async function () {
    assert.equal(await render('{name}', { name: 'tmplat' }), 'tmplat');
  });

  it('opens a section, an inverted section and a comment', async function () {
    assert.equal(await render('{#items}[{.}]{/items}', { items: ['a', 'b'] }), '[a][b]');
    assert.equal(await render('{^on}no{/on}', { on: false }), 'no');
    assert.equal(await render('{^on}no{/on}', { on: true }), '');
    assert.equal(await render('a{! ignored }b', {}), 'ab');
  });

  it('opens a partial', async function () {
    assert.equal(await render('{>p}', { name: 'x' }, { p: '[{name}]' }), '[x]');
  });

  it('changes the delimiters, which is how literal braces are written', async function () {
    assert.equal(await render('{=<% %>=}a { b } c <%name%>', { name: 'x' }), 'a { b } c x');
  });

  it('no longer treats a triple brace as the unescaped form', async function () {
    assert.notEqual(await render('{{{name}}}', { name: 'tmplat' }), 'tmplat');
  });

  it('keeps the parse cache keyed by the delimiters as well as the template', async function () {
    Mustache.clearCache();
    assert.equal(await render('{name}', { name: 'a' }), 'a');
    assert.equal(await render('{name}', { name: 'a' }, {}, ['{{', '}}']), '{name}');
  });
});

describe('Inverted escaping', function () {
  var view = { value: '<a href="x">&</a>' };
  var escaped = '&lt;a href&#x3D;&quot;x&quot;&gt;&amp;&lt;&#x2F;a&gt;';

  it('does not escape a value tag', async function () {
    assert.equal(await render('{value}', view), view.value);
  });

  it('escapes a double brace tag', async function () {
    assert.equal(await render('{{value}}', view), escaped);
  });

  it('escapes an ampersand tag rather than unescaping it', async function () {
    assert.equal(await render('{&value}', view), escaped);
  });
});

describe('Case-insensitive name resolution', function () {
  it('ignores the case of a value tag', async function () {
    assert.equal(await render('{Name} {NAME} {NaMe}', { name: 'tmplat' }), 'tmplat tmplat tmplat');
  });

  it('ignores the case of a section tag', async function () {
    assert.equal(await render('{#On}yes{/On}', { on: true }), 'yes');
  });

  it('ignores the case of the view property', async function () {
    assert.equal(await render('{sessionid}|{sessionId}', { sessionId: 'abc' }), 'abc|abc');
  });

  it('ignores case at every step of a dotted name', async function () {
    assert.equal(await render('{A.B}', { a: { b: 'c' } }), 'c');
  });

  it('ignores case within a pushed context', async function () {
    assert.equal(await render('{#params}{FOO}{/params}', { params: { foo: 'bar' } }), 'bar');
  });

  it('prefers an exact match over a differently cased one', async function () {
    assert.equal(await render('{name}', { Name: 'upper', name: 'exact' }), 'exact');
  });
});

describe('Value resolution', function () {
  it('joins an array with commas', async function () {
    assert.equal(await render('{items}', { items: ['a', 'b'] }), 'a,b');
    assert.equal(await render('{items}', { items: [] }), '');
  });

  it('joins the non-null own values of an object with commas', async function () {
    assert.equal(await render('{o}', { o: { a: 'x', b: null, c: 'y' } }), 'x,y');
    assert.equal(await render('{o}', { o: {} }), '');
    assert.notEqual(await render('{o}', { o: { a: 1 } }), '[object Object]');
  });

  it('collapses a value before escaping it', async function () {
    assert.equal(await render('{{o}}', { o: { a: '<b>' } }), '&lt;b&gt;');
  });

  it('still pushes an object onto the context as a section', async function () {
    assert.equal(await render('{#o}{a}-{b}{/o}', { o: { a: 'x', b: 'y' } }), 'x-y');
  });

  it('renders falsy primitives rather than dropping them', async function () {
    assert.equal(await render('{v}', { v: 0 }), '0');
    assert.equal(await render('{v}', { v: false }), 'false');
    assert.equal(await render('{v}', { v: null }), '');
    assert.equal(await render('a{unknown}b', {}), 'ab');
  });

  it('reads a property of an autoboxed primitive', async function () {
    assert.equal(await render('{a.length}', { a: '' }), '0');
  });
});

describe('Functions as values', function () {
  it('calls a function referenced as a value tag', async function () {
    assert.equal(await render('{f}', { f: function () { return 'called'; } }), 'called');
  });

  it('calls a section lambda that has been referenced as a value tag', async function () {
    assert.equal(await render('{f}', { f: function () { return function () { return 'nested'; }; } }), 'nested');
  });

  it('never renders a function as its own source code', async function () {
    var leak = function () { return function () { return function () { return 'too deep'; }; }; };
    var output = await render('{leak}', { leak: leak });

    assert.notInclude(output, 'function');
    assert.notInclude(output, '=>');
    assert.equal(output, '');
  });

  it('never renders a function source through the escaped form either', async function () {
    var self = function () { return self; };

    assert.equal(await render('{{self}}', { self: self }), '');
  });

  it('does not re-render tag-like output returned by a function', async function () {
    assert.equal(await render('{a}', { a: function () { return '{name}'; } }), '{name}');
  });
});

describe('Asynchronous rendering', function () {
  it('resolves a promise held in the view', async function () {
    assert.equal(await render('{name}', { name: Promise.resolve('tmplat') }), 'tmplat');
  });

  it('resolves a promise returned by a function', async function () {
    assert.equal(await render('{name}', { name: async function () { return 'tmplat'; } }), 'tmplat');
  });

  it('resolves promises within a section over an array', async function () {
    var view = {
      items: [{ v: Promise.resolve('a') }, { v: async function () { return 'b'; } }]
    };

    assert.equal(await render('{#items}[{v}]{/items}', view), '[a][b]');
  });

  it('awaits an asynchronous section lambda and its render callback', async function () {
    var received = [];
    var output = await render('{#upper}{name}{/upper}', {
      name: 'tmplat',
      upper: function () {
        return async function (text, renderText) {
          received.push(text);
          return (await renderText(text)).toUpperCase();
        };
      }
    });

    assert.deepEqual(received, ['{name}']);
    assert.equal(output, 'TMPLAT');
  });

  it('awaits nested asynchronous section lambdas', async function () {
    var view = {
      name: ' tmplat ',
      trim: function () {
        return async function (text, renderText) {
          return (await renderText(text)).trim();
        };
      },
      upper: function () {
        return async function (text, renderText) {
          return (await renderText(text)).toUpperCase();
        };
      }
    };

    assert.equal(await render('{#upper}{#trim}{name}{/trim}{/upper}', view), 'TMPLAT');
  });

  it('renders tokens sequentially, so observable side effects stay in template order', async function () {
    var order = [];
    var delayed = function (id, ms) {
      return async function () {
        await new Promise(function (resolve) {
          setTimeout(resolve, ms);
        });
        order.push(id);
        return id;
      };
    };

    var output = await render('{a}{b}{c}', { a: delayed('a', 30), b: delayed('b', 10), c: delayed('c', 0) });

    assert.equal(output, 'abc');
    assert.deepEqual(order, ['a', 'b', 'c']);
  });

  it('rejects when a value rejects', async function () {
    await rejects(render('{boom}', {
      boom: async function () {
        throw new Error('nope');
      }
    }), /nope/);
  });

  it('rejects an invalid template instead of throwing synchronously', async function () {
    var promise = render(42, {});

    assert.instanceOf(await rejects(promise), TypeError);
  });
});

/**
 * Upstream only resolves a lazy value at the *end* of a name lookup, so a full path into one - `{a.b}` where `a` is a
 * function or a promise - reads `b` off the unresolved value and renders nothing at all. Every entry in tmplat's
 * template context is lazy, which made dot notation unusable against any of them.
 */
describe('Lazy values part-way along a dotted path', function () {
  it('descends through a function', async function () {
    assert.equal(await render('{a.b}', { a: function () { return { b: 'c' }; } }), 'c');
  });

  it('descends through a promise', async function () {
    assert.equal(await render('{a.b}', { a: Promise.resolve({ b: 'c' }) }), 'c');
  });

  it('descends through an asynchronous function', async function () {
    assert.equal(await render('{a.b}', { a: async function () { return { b: 'c' }; } }), 'c');
  });

  it('descends through several lazy values in one path', async function () {
    var view = { a: async function () { return { b: function () { return { c: Promise.resolve({ d: 'e' }) }; } }; } };

    assert.equal(await render('{a.b.c.d}', view), 'e');
  });

  it('resolves a lazy value in a section name', async function () {
    var view = { a: async function () { return { b: true }; } };

    assert.equal(await render('{#a.b}yes{/a.b}', view), 'yes');
  });

  it('resolves a lazy value in an inverted section name', async function () {
    var view = { a: async function () { return { b: false }; } };

    assert.equal(await render('{^a.b}no{/a.b}', view), 'no');
  });

  it('calls a lazy value with the view as its receiver', async function () {
    var view = {
      name: 'tmplat',
      a: function () { return { b: this.name }; }
    };

    assert.equal(await render('{a.b}', view), 'tmplat');
  });

  /**
   * The final segment is still resolved after the loop, so a function at the end of a path keeps its higher-order
   * section behaviour rather than being called early as a plain value.
   */
  it('leaves the value at the end of the path to be resolved as a section lambda', async function () {
    var view = {
      a: function () {
        return {
          upper: function () {
            return async function (text, renderText) {
              return (await renderText(text)).toUpperCase();
            };
          }
        };
      },
      name: 'tmplat'
    };

    assert.equal(await render('{#a.upper}{name}{/a.upper}', view), 'TMPLAT');
  });

  it('falls through to a parent context when a lazy value cannot supply the property', async function () {
    var output = await render('{#items}{a.b}{/items}', {
      a: function () { return { b: 'outer' }; },
      items: [{}]
    });

    assert.equal(output, 'outer');
  });

  it('renders nothing when a lazy value resolves to nothing', async function () {
    assert.equal(await render('{a.b}', { a: async function () { return null; } }), '');
  });

  it('rejects when a lazy value part-way along the path rejects', async function () {
    await rejects(render('{a.b}', {
      a: async function () {
        throw new Error('nope');
      }
    }), /nope/);
  });
});
