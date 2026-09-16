import assert from 'assert';
import mustache from 'tmplat-mustache';

const view = {
  title: 'Joe',
  calc: () => 2 + 4
};

assert.strictEqual(
  await mustache.render('{title} spends {calc}', view),
  'Joe spends 6'
);
