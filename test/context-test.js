import './helper.js';
var Context = Mustache.Context;

describe('A new Mustache.Context', function () {
  var context;
  beforeEach(function () {
    context = new Context({ name: 'parent', message: 'hi', a: { b: 'b' } });
  });

  it('is able to lookup properties of its own view', async function () {
    assert.equal(await context.lookup('name'), 'parent');
  });

  it('is able to lookup nested properties of its own view', async function () {
    assert.equal(await context.lookup('a.b'), 'b');
  });

  describe('when pushed', function () {
    beforeEach(function () {
      context = context.push({ name: 'child', c: { d: 'd' } });
    });

    it('returns the child context', function () {
      assert.equal(context.view.name, 'child');
      assert.equal(context.parent.view.name, 'parent');
    });

    it('is able to lookup properties of its own view', async function () {
      assert.equal(await context.lookup('name'), 'child');
    });

    it("is able to lookup properties of the parent context's view", async function () {
      assert.equal(await context.lookup('message'), 'hi');
    });

    it('is able to lookup nested properties of its own view', async function () {
      assert.equal(await context.lookup('c.d'), 'd');
    });

    it('is able to lookup nested properties of its parent view', async function () {
      assert.equal(await context.lookup('a.b'), 'b');
    });
  });
});

describe('A Mustache.Context', function () {
  var context;

  describe('with an empty string in the lookup chain', function () {
    var context;
    beforeEach(function () {
      context = new Context({ a: '' });
    });

    it('resolves a nested property to undefined instead of throwing', async function () {
      assert.equal(await context.lookup('a.b'), undefined);
    });

    it('is still able to lookup a property of the primitive itself', async function () {
      assert.equal(await context.lookup('a.length'), 0);
    });
  });
});
