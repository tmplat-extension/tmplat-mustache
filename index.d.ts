/**
 * Type definitions for `tmplat-mustache`, a fork of mustache.js.
 *
 * The fork diverges from upstream mustache.js (and therefore from `@types/mustache`) in ways that are visible in the
 * type system:
 *
 * - **Rendering is asynchronous.** `render` and every `Writer`/`Context` method it uses return a `Promise`, so that a
 *   view may expose promises, `async` functions and `async` section lambdas.
 * - **Section lambdas receive an async `render` callback**, which returns `Promise<string>` rather than `string`.
 * - **The default tags are `['{', '}']`**, and `{name}` is *unescaped* while `{{name}}`/`{&name}` are *escaped* -
 *   the inverse of upstream.
 * - **Tag resolution is case-insensitive.**
 * - A `Writer.resolveValue` method is exposed, which is what collapses arrays/objects and invokes (rather than
 *   stringifies) a function referenced as a plain name tag.
 */

/**
 * A value that a view may expose for a name tag or section.
 *
 * Anything may be awaited: a plain value, a promise, a function returning either, or a section lambda.
 */
type View = any;

/**
 * Renders an arbitrary template in the current context, as passed to a section lambda.
 */
type SectionRender = (template: string) => Promise<string>;

/**
 * A higher-order section lambda.
 *
 * `text` is the raw, *unrendered* body of the section. It is `undefined` when the lambda is referenced as a plain name
 * tag (`{name}`) rather than as a section (`{#name}...{/name}`), so a lambda must tolerate being called with no
 * arguments.
 */
type SectionLambda = (text?: string, render?: SectionRender) => unknown | Promise<unknown>;

/**
 * Function responsible for escaping values from the view into the rendered output when templates have `{{value}}` or
 * `{&value}` in them.
 */
type EscapeFunction = (value: any) => string;

/**
 * An array of two strings, representing the opening and closing tags respectively, to be used in the templates being
 * rendered.
 */
type OpeningAndClosingTags = [string, string];

/**
 * Per-render configuration, which may also be given as a bare tags tuple.
 */
type RenderConfig =
  | OpeningAndClosingTags
  | {
      escape?: EscapeFunction;
      tags?: OpeningAndClosingTags;
    };

/**
 * Whenever partials are provided, it can either be an object that contains the names and templates of partials that
 * are used in templates
 *
 * -- or --
 *
 * A function that is used to load a partial template on the fly that takes a single argument: the name of the partial.
 */
type PartialsOrLookupFn = Record<string, string> | PartialLookupFn;
type PartialLookupFn = (partialName: string) => string | undefined | Promise<string | undefined>;

type RAW_VALUE = 'text';
/**
 * Note: in this fork `name` is the *unescaped* value token and `&` is the *escaped* one, which is the inverse of
 * upstream mustache.js.
 */
type UNESCAPED_VALUE = 'name';
type ESCAPED_VALUE = '&';
type SECTION = '#';
type INVERTED = '^';
type PARTIAL = '>';

type TemplateSpanType = RAW_VALUE | ESCAPED_VALUE | SECTION | UNESCAPED_VALUE | INVERTED | PARTIAL;

type TemplateSpans = Array<
  | [TemplateSpanType, string, number, number]
  | [TemplateSpanType, string, number, number, TemplateSpans, number]
  | [TemplateSpanType, string, number, number, string, number, boolean]
>;

/**
 * An overridable cache for parsed templates.
 */
interface TemplateCache {
  set(key: string, value: TemplateSpans): void;
  get(key: string): TemplateSpans | undefined;
  clear(): void;
}

/**
 * A simple string scanner that is used by the template parser to find tokens in template strings.
 */
declare class TmplatMustacheScanner {
  string: string;
  tail: string;
  pos: number;

  constructor(string: string);

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  eos(): boolean;

  /**
   * Tries to match the given regular expression at the current position, returning the matched text if it can match
   * and the empty string otherwise.
   */
  scan(re: RegExp): string;

  /**
   * Skips all text until the given regular expression can be matched, returning the skipped string - which is the
   * entire tail if no match can be made.
   */
  scanUntil(re: RegExp): string;
}

/**
 * Represents a rendering context by wrapping a view object and maintaining a reference to the parent context.
 */
declare class TmplatMustacheContext {
  view: View;
  parent: TmplatMustacheContext | undefined;

  constructor(view: View, parentContext?: TmplatMustacheContext);

  /**
   * Creates a new context using the given view with this context as the parent.
   */
  push(view: View): TmplatMustacheContext;

  /**
   * Returns the value of the given name in this context, traversing up the context hierarchy if the value is absent in
   * this context's view.
   *
   * Names are matched case-insensitively. A function found on the view is invoked, and a promise is awaited, so the
   * resolved value is returned rather than the producer of it.
   */
  lookup(name: string): Promise<any>;
}

/**
 * A Writer knows how to take a stream of tokens and render them to a `string`, given a context.
 *
 * It also maintains a cache of templates to avoid the need to parse the same template twice.
 */
declare class TmplatMustacheWriter {
  /**
   * Allows a user to override the default caching strategy, by providing an object with `set`, `get` and `clear`
   * methods. This can also be used to disable the cache by setting it to the literal `undefined`.
   */
  templateCache: TemplateCache | undefined;

  constructor();

  /**
   * Clears all cached templates in this writer.
   */
  clearCache(): void;

  /**
   * Parses and caches the given `template` and returns the array of tokens that is generated from the parse.
   */
  parse(template: string, tags?: OpeningAndClosingTags): TemplateSpans;

  /**
   * High-level method that is used to render the given `template` with the given `view`.
   */
  render(
    template: string,
    view: View | TmplatMustacheContext,
    partials?: PartialsOrLookupFn,
    config?: RenderConfig,
  ): Promise<string>;

  /**
   * Low-level method that renders the given array of `tokens` using the given `context` and `partials`.
   *
   * Tokens are rendered sequentially, so any side effects in the view occur in template order.
   */
  renderTokens(
    tokens: TemplateSpans,
    context: TmplatMustacheContext,
    partials?: PartialsOrLookupFn,
    originalTemplate?: string,
    config?: RenderConfig,
  ): Promise<string>;

  /**
   * Renders a section block.
   */
  renderSection(
    token: TemplateSpans[number],
    context: TmplatMustacheContext,
    partials?: PartialsOrLookupFn,
    originalTemplate?: string,
    config?: RenderConfig,
  ): Promise<string | undefined>;

  /**
   * Renders an inverted section block.
   */
  renderInverted(
    token: TemplateSpans[number],
    context: TmplatMustacheContext,
    partials?: PartialsOrLookupFn,
    originalTemplate?: string,
    config?: RenderConfig,
  ): Promise<string | undefined>;

  /**
   * Adds indentation to each line of the given partial.
   */
  indentPartial(partial: string, indentation: string, lineHasNonSpace: boolean): string;

  /**
   * Renders a partial.
   */
  renderPartial(
    token: TemplateSpans[number],
    context: TmplatMustacheContext,
    partials?: PartialsOrLookupFn,
    config?: RenderConfig,
  ): Promise<string | undefined>;

  /**
   * Resolves the value of a name token.
   *
   * An array is joined with a comma, a plain object is collapsed to a comma-separated list of its non-null own
   * property values, and a function is *invoked* with no arguments rather than stringified - so that a section lambda
   * referenced as a plain name tag can never render its own source code into the output.
   */
  resolveValue(token: TemplateSpans[number], context: TmplatMustacheContext): Promise<any>;

  /**
   * Renders an unescaped value, i.e. `{name}`.
   */
  unescapedValue(token: TemplateSpans[number], context: TmplatMustacheContext): Promise<string | undefined>;

  /**
   * Renders an escaped value, i.e. `{{name}}` or `{&name}`.
   */
  escapedValue(
    token: TemplateSpans[number],
    context: TmplatMustacheContext,
    config?: RenderConfig,
  ): Promise<string | undefined>;

  /**
   * Renders a raw token.
   */
  rawValue(token: TemplateSpans[number]): string;
}

/**
 * Provides the functionality to render templates with `{mustaches}`.
 */
interface TmplatMustacheStatic {
  /**
   * The name of the module.
   */
  readonly name: string;

  /**
   * The version of the module.
   */
  readonly version: string;

  /**
   * The default opening and closing tags used while parsing the templates.
   *
   * Different default tags can be overridden by setting this field. They will have effect on all subsequent calls to
   * `.render()` or `.parse()`, unless custom tags are given as arguments to those functions.
   *
   * Default value is `['{', '}']`, *not* the `['{{', '}}']` of upstream mustache.js.
   */
  tags: OpeningAndClosingTags;

  /**
   * A simple string scanner that is used by the template parser to find tokens in template strings.
   */
  Scanner: typeof TmplatMustacheScanner;

  /**
   * Represents a rendering context by wrapping a view object and maintaining a reference to the parent context.
   */
  Context: typeof TmplatMustacheContext;

  /**
   * A Writer knows how to take a stream of tokens and render them to a `string`, given a context.
   */
  Writer: typeof TmplatMustacheWriter;

  /**
   * Allows a user to override the default caching strategy for parsed templates on the default writer, or to disable
   * it by setting it to the literal `undefined`.
   */
  templateCache: TemplateCache | undefined;

  /**
   * HTML escaping, which can be overridden by setting this explicitly or by providing a `config` argument with an
   * `escape` function when invoking `render`.
   *
   * Escaping is *opt in* in this fork: `{name}` is unescaped and `{{name}}`/`{&name}` are escaped.
   */
  escape: EscapeFunction;

  /**
   * Clears all cached templates in the default writer.
   */
  clearCache(): void;

  /**
   * Parses and caches the given template in the default writer and returns the array of tokens it contains.
   *
   * Doing this ahead of time avoids the need to parse templates on the fly as they are rendered. Parsing remains
   * synchronous; only rendering is asynchronous.
   */
  parse(template: string, tags?: OpeningAndClosingTags): TemplateSpans;

  /**
   * Renders the `template` with the given `view` and `partials` using the default writer.
   *
   * The returned promise rejects - rather than throwing synchronously - if `template` is not a string, so a single
   * `catch` covers every failure mode.
   */
  render(
    template: string,
    view: View | TmplatMustacheContext,
    partials?: PartialsOrLookupFn,
    config?: RenderConfig,
  ): Promise<string>;
}

declare const TmplatMustache: TmplatMustacheStatic;

export default TmplatMustache;
