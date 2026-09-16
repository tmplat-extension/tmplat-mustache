import globals from 'globals';

export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'func-names': 2,
      'no-mixed-spaces-and-tabs': 2,
      quotes: [2, 'single', 'avoid-escape'],
      semi: 2,
      'keyword-spacing': 2,
      'space-before-function-paren': 2
    }
  },
  {
    files: ['test/**/*.js', 'test/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        assert: 'readonly',
        Mustache: 'readonly'
      }
    },
    rules: {
      // Specs and view fixtures are full of anonymous callbacks and lambdas, which is idiomatic here.
      'func-names': 0
    }
  }
];
