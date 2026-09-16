({
  number: function (text, render) {
    return async function (text, render) {
      return +await render(text);
    };
  }
});
