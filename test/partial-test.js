import './helper.js';

describe('Partials spec', function () {
  beforeEach(function () {
    Mustache.clearCache();
  });

  
    it('The greater-than operator should expand to the named partial.', async function () {
      var template = '"{>text}"';
      var data = {};
      var partials = {'text':'from partial'};
      var expected = '"from partial"';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('The empty string should be used when the named partial is not found.', async function () {
      var template = '"{>text}"';
      var data = {};
      var partials = {};
      var expected = '""';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('The greater-than operator should operate within the current context.', async function () {
      var template = '"{>partial}"';
      var data = {'text':'content'};
      var partials = {'partial':'*{{text}}*'};
      var expected = '"*content*"';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('Inline partials should not be indented', async function () {
      var template = '    <div>{> partial}</div>';
      var data = {};
      var partials = {'partial':'This is a partial.'};
      var expected = '    <div>This is a partial.</div>';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('Inline partials should not be indented (multiline)', async function () {
      var template = '    <div>{> partial}</div>';
      var data = {};
      var partials = {'partial':'This is a\npartial.'};
      var expected = '    <div>This is a\n         partial.</div>';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('The greater-than operator should properly recurse.', async function () {
      var template = '{>node}';
      var data = {'content':'X','nodes':[{'content':'Y','nodes':[]}]};
      var partials = {'node':'{{content}}<{#nodes}{>node}{/nodes}>'};
      var expected = 'X<Y<>>';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('The greater-than operator should not alter surrounding whitespace.', async function () {
      var template = '| {>partial} |';
      var data = {};
      var partials = {'partial':'\t|\t'};
      var expected = '| \t|\t |';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('"\r\n" should be considered a newline for standalone tags.', async function () {
      var template = '|\r\n{>partial}\r\n|';
      var data = {};
      var partials = {'partial':'>'};
      var expected = '|\r\n>|';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('Standalone tags should not require a newline to precede them.', async function () {
      var template = '  {>partial}\n>';
      var data = {};
      var partials = {'partial':'>\n>'};
      var expected = '  >\n  >>';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });   
    it('Superfluous in-tag whitespace should be ignored.', async function () {
      var template = '|{> partial }|';
      var data = {'boolean':true};
      var partials = {'partial':'[]'};
      var expected = '|[]|';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });
    it('Each line of the partial should be indented before rendering.', async function () {
      var template = '\\\n {>partial}\n/\n';
      var data = {
				'content': '<\n->'
			};
      var partials =  {
				'partial': '|\n{content}\n|\n'
			};
      var expected = '\\\n |\n <\n->\n |\n/\n';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('Standalone tags should not require a newline to follow them.', async function () {
      var template = '>\n  {>partial}';
      var data = {
			
			};
      var partials =  {
				'partial': '>\n>'
			};
      var expected = '>\n  >\n  >';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('Whitespace should be left untouched.', async function () {
      var template = '  {{data}}  {> partial}\n';
      var data = {
        'data': '|'
			};
      var partials =  {
				'partial': '>\n>'
			};
      var expected = '  |  >\n>\n';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('Partial without indentation should inherit functions.', async function () {
      var template = '{> partial }';
      var data = {
        toUpperCase: function () {
              return function (label) {
                      return label.toUpperCase();
              };
        }
      };
      var partials = {partial: 'aA-{ #toUpperCase }Input{ /toUpperCase }-Aa'};
      var expected = 'aA-INPUT-Aa';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('Partial with indentation should inherit functions.', async function () {
      var template = '  {> partial }';
      var data = {
        toUpperCase: function () {
              return function (label) {
                      return label.toUpperCase();
              };
        }
      };
      var partials = {partial: 'aA-{ #toUpperCase }Input{ /toUpperCase }-Aa'};
      var expected = '  aA-INPUT-Aa';
      var renderResult = await Mustache.render(template, data, partials);
      assert.equal(renderResult, expected);
    });

    it('Nested partials should support custom delimiters.', async function () {
      var tags = ['[[', ']]'];
      var template = '[[> level1 ]]';
      var partials = {
        level1: 'partial 1\n[[> level2]]',
        level2: 'partial 2\n[[> level3]]',
        level3: 'partial 3\n[[> level4]]',
        level4: 'partial 4\n[[> level5]]',
        level5: 'partial 5',
      };
      var expected = 'partial 1\npartial 2\npartial 3\npartial 4\npartial 5';
      var renderResult = await Mustache.render(template, {}, partials, tags);
      assert.equal(renderResult, expected);
    });
});
