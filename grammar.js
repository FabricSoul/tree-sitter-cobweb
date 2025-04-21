/**
 * @file Cobweb grammar for tree-sitter
 * @author FabricSoul (Updated by AI based on provided docs)
 * @license MIT
 * @see {@link https://github.com/UkoeHB/bevy_cobweb_ui/blob/main/docs/cob_file_organization.md}
 * @see {@link https://github.com/UkoeHB/bevy_cobweb_ui/blob/main/docs/loadables_and_fields.md}
 */
// @ts-check
/// <reference types="tree-sitter-cli/dsl" />

const PREC = {
  // Define precedence levels if needed
};

// Type Identifiers start with an uppercase letter or underscore
const TYPE_IDENTIFIER_REGEX = /[A-Z_][a-zA-Z0-9_]*/;
// Regular Identifiers (fields, aliases, etc.) start with lowercase or underscore
const IDENTIFIER_REGEX = /[a-z_][a-zA-Z0-9_]*/;

const CONST_PREFIX = "$";
// --- REMOVED JS CONSTANT FOR PATH_SEPARATOR ---
// const PATH_SEPARATOR = '::';
// Units for Val type. Source: docs/loadables_and_fields.md
const VAL_UNITS = /(px|%|vw|vh|vmin|vmax|fr)/;

module.exports = grammar({
  name: "cobweb",

  extras: ($) => [
    /\s+/, // Whitespace
    $.line_comment,
    $.block_comment,
  ],

  word: ($) => $.identifier, // Use the more specific identifier now

  conflicts: ($) => [
    // Keep these necessary conflict resolutions for nesting
    [$.scene_definition, $.scene_definition],
    [$.named_element, $.scene_definition],
    [$.named_element, $.named_element],
  ],

  rules: {
    source_file: ($) => repeat($.section),

    // === Specific Section Header Tokens ===
    _manifest_header: ($) => token(seq("#", "manifest")),
    _import_header: ($) => token(seq("#", "import")),
    _defs_header: ($) => token(seq("#", "defs")),
    _commands_header: ($) => token(seq("#", "commands")),
    _scenes_header: ($) => token(seq("#", "scenes")),

    // === Sections (using specific headers) ===
    section: ($) =>
      choice(
        // Manifest Section
        seq(
          alias($._manifest_header, $.section_header),
          field("body", repeat($.manifest_entry)),
        ),
        // Import Section
        seq(
          alias($._import_header, $.section_header),
          field("body", repeat($.import_entry)),
        ),
        // Defs Section
        seq(
          alias($._defs_header, $.section_header),
          field("body", repeat($.definition)),
        ),
        // Commands Section
        seq(
          alias($._commands_header, $.section_header),
          field("body", repeat($._command_item)),
        ),
        // Scenes Section
        seq(
          alias($._scenes_header, $.section_header),
          field("body", repeat($.scene_definition)), // Repeats scene definitions
        ),
      ),

    // --- Body definitions ---

    manifest_entry: ($) =>
      seq(
        field("path", $.string_literal),
        optional(seq($._as_keyword, field("alias", $.identifier))), // alias uses specific identifier
      ),

    import_entry: ($) =>
      seq(
        field("source", $.identifier), // source manifest key uses specific identifier
        $._as_keyword,
        field("alias", $.identifier), // alias uses specific identifier
      ),

    definition: ($) =>
      seq(
        field("name", $.constant_identifier),
        "=",
        field("value", $._expression),
      ),

    _command_item: ($) => /.+/, // Placeholder

    scene_definition: ($) =>
      seq(
        field("name", $.string_literal), // Scene name
        field("body", repeat($._scene_item)), // Scene body content
      ),

    // A scene item is a loadable or a named nested element
    _scene_item: ($) => choice($.loadable, $.named_element),

    named_element: ($) =>
      seq(
        field("name", $.string_literal), // Element name
        field("body", repeat($._scene_item)), // Element body content
      ),

    // === Loadables (Appear as Scene Items) ===
    loadable: ($) =>
      choice(
        $.struct_loadable,
        $.tuple_loadable,
        $.generic_loadable,
        $.simple_loadable,
      ),

    // TypeName{ field: value ... }
    struct_loadable: ($) =>
      seq(
        field("type", $.type_identifier), // Expects TypeName
        token.immediate("{"),
        repeat($.field),
        "}",
      ),
    field: ($) =>
      seq(
        field("name", $.identifier), // Expects fieldName (lowercase)
        ":",
        field("value", $._expression),
      ),

    // TypeName(value)
    tuple_loadable: ($) =>
      seq(
        field("type", $.type_identifier), // Expects TypeName
        token.immediate("("),
        field("value", $._expression),
        ")",
      ),

    // TypeName (e.g., MainInterface) - only as a loadable/scene item
    simple_loadable: ($) => field("type", $.type_identifier), // Expects TypeName

    // Generic<Type>{...} or Generic<Type>(...)
    generic_loadable: ($) =>
      seq(
        field("type", $.type_identifier), // Expects GenericTypeName
        token.immediate("<"),
        field("generic_type", $.type_identifier), // Expects InnerTypeName
        ">",
        choice(
          seq(token.immediate("{"), repeat($.field), "}"),
          seq(token.immediate("("), field("value", $._expression), ")"),
        ),
      ),

    // === Expressions (Values used in assignments/fields) ===
    _expression: ($) =>
      choice(
        $._literal,
        $.constant_usage,
        $.language_constant,
        $.struct_loadable,
        $.tuple_loadable,
        $.generic_loadable,
        $.type_identifier, // Allow TypeName as value (e.g., 'Column')
      ),

    // === Literals ===
    _literal: ($) => choice($.string_literal, $.number_literal, $.hex_literal),

    string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice(
            token.immediate(prec(1, /[^\\"\n]+/)),
            $.escape_sequence,
            $.line_continuation,
          ),
        ),
        '"',
      ),
    escape_sequence: ($) =>
      token.immediate(seq("\\", choice(/[ntrf"'\\]/, /u\{[0-9a-fA-F]{1,6}\}/))),
    line_continuation: ($) => token.immediate(/\\\r?\n/),

    number_literal: ($) =>
      token(
        seq(
          /-?(?:(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/,
          optional(VAL_UNITS),
        ),
      ),

    hex_literal: ($) => token(/#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?/),

    // === Identifiers and Paths ===
    // Defined at the top now
    identifier: ($) => IDENTIFIER_REGEX,
    type_identifier: ($) => TYPE_IDENTIFIER_REGEX,

    // Constant definition needs the specific regex for name part
    constant_identifier: ($) => token(seq("$", IDENTIFIER_REGEX)), // $lower_case_name

    // Constant usage uses specific identifier regex for path components
    constant_usage: ($) => seq("$", field("path", $._constant_path)),
    _constant_path: ($) =>
      seq(
        $.identifier, // first part is lowercase
        // --- MODIFICATION START ---
        // Use the aliased _path_separator rule
        repeat(seq(alias($._path_separator, $.PATH_SEPARATOR), $.identifier)),
        // --- MODIFICATION END ---
      ),

    // === Keywords & Builtins ===
    _as_keyword: ($) => alias("as", $.keyword),

    language_constant: ($) => choice("auto", "inf", "nan"),

    // === Punctuation ===
    // Define the separator as a specific rule
    _path_separator: ($) => "::",

    // === Comments ===
    line_comment: ($) => token(seq("//", /.*/)),
    block_comment: ($) => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});
