import { assert as chaiAssert } from 'chai';
import Mustache from '../mustache.js';

// The test files were written against implicit globals, so they are published explicitly here rather than threading an
// import through every assertion.
globalThis.assert = chaiAssert;
globalThis.Mustache = Mustache;
