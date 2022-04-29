# Core Schemas v1.0

```raw html
<h2>schemas for the global graph</h2>
<table class=spec-data>
  <tr><td>Status</td><td>Draft</td>
  <tr><td>Version</td><td>1.0</td>
</table>
<link rel=stylesheet href=/apollo-light.css>
<script type=module async defer src=/inject-logo.js></script>
```

Core schemas provide tools for linking and importing definitions from different GraphQL schemas together into one.

```graphql example -- linking a directive from another schema
extend schema
  #          👇🏽 first, link @link from its url
  @link(url: "https://specs.apollo.dev/link/v1.0")
  #          👇🏽 link other schemas by their urls
  @link(url: "https://internal.example.com/admin")

type Query {
  allUsers: [User] @admin__adminOnly # 👈🏽 remote identifier, namespaced
}
```

```graphql example -- importing a directive from another schema
extend schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  #          specific definitions can be imported 👇🏽 
  @link(url: "https://internal.example.com/admin", import: ["@adminOnly"])

type Query {
  allUsers: [User] @adminOnly # 👈🏽 remote identifier, imported
}
```

This document introduces a set of conventions for linking and namespacing within GraphQL schemas. Core schemas are not a new kind of document and do not introduce any new syntax—they are just GraphQL schemas which can be interpreted according to the conventions outlined in this doc.

Core schemas solve three main problems:

1. **[Imports](#@link).** The {@link} directive points to definitions. A compiler can insert these if they are not present, producing a [fully valid core schema](#fully-valid-core-schemas).
3. **[Foreign definitions](#sec-Name-Conventions).** Core schemas can namespace external definitions and type references which are helpful in describing the schema, but are not part of the schema's API. Such definitions may include information about how to [serve](/link/v1.0#Purpose.EXECUTION) and [secure](/link/v1.0#Purpose.SECURITY) the schema.
2. **[Attribution](#sec-Attribution).** [Fully valid core schemas](#fully-valid-core-schemas) contain all definitions they reference, as GraphQL requires. {@link}s in such documents serve to *attribute* all definitions and references in the document, associating each one with the URL it came from.

# The Global Graph

The global graph is simply the set of all GraphQL schemas in the world, each identified with a URL.

GraphQL provides no way to link between schemas. This means that absent {@link}, the global graph is certainly global, but it a *graph* only in the formal sense that any collection of disconnected points is, technically, a graph.

Core schemas introduce the {@link} directive to fill this gap. {@link} not only allows you to import definitions and types into your document, it retains the knowledge of where those definitions and types came from, creating a linking structure which can span all the schemas in the globe.

## Global Graph References

Within a core schema document, every top-level definition and reference (for example, every named type and directive) has a position in the global graph. This position is captured by a *global graph reference*. You can think of them as URLs without losing much precision (although local references [technically aren't](#note-36269)).

A global graph reference (or *gref*) is a (*[link url](#@link.url)*, *element*) pair.

The URL may be {null}, to represent local definitions within a schema that is not bound to a URL. Otherwise it must be a [a normalized link url](#@link.url).

The *element* may be:
- Directive({name}) — a directive
- Type({name}) — a named type of any kind
- Schema({name}?) — a further link to yet another schema. {name} may be {null} to indicate the schema itself.

Implementations may represent these internally in a variety of ways. They also have a canonical string form, which is used in {Import}.

- Directive({name}) is represented with "@{name}"
- Type({name}) is simply represented with "{name}"
- Schema({name}) is represented with "{name}::" (note that {Import} does not currently allow you to import an entire schema from another schema, only individual elements)

Types and directives are separated in this way because that's how GraphQL does it—you can have a `User` type and a `@User` directive in the same schema (though GraphQL naming conventions would suggest againt it).

## URL representation

Since [link urls](#Url) explicitly cannot have fragments, we can represent global graph references as a URL with a fragment. For example, a reference to {@link} from the schema `https://specs.apollo.dev/link/v1.0` can be rendered as `https://specs.apollo.dev/link/v1.0#@link`. A reference to the same spec's {Import} scalar can be rendered as `https://specs.apollo.dev/link/v1.0#Import`.

Local references—where the schema is {null}—are rendered as hrefs containing only a fragment, e.g. `#SomeType` and `#@someDirective`.

Note: Technically, `#SomeType` is not a valid URL, but rather an href. Perhaps this section should be titled "href representation", but that seemed unlikely to improve the overall readability of this document.

This is particularly convenient for providing links to documentation. We'll use this form in examples throughout this document.

# Attribution

As mentioned [previously](#sec-Global-Graph-References), core schemas connect every definition, directive usage, and named type reference with a global graph reference. Taking the example from the introduction:

```graphql example -- global graph references (shown in URL form)
extend schema
# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://specs.apollo.dev/link/v1.0")

# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://internal.example.com/admin")

#   👇🏽 🌍 #Query (note: this schema has no url, so this gref's url part is null)
type Query {
  #               👇🏽 🌍 https://internal.example.com/admin#@adminOnly
  allUsers: [User] @admin__adminOnly
  #         🖕🏽 🌍 #User
}
```

This attribution *does not change* if we [`import`](#@link.import) some names, even renaming them:

```graphql example -- global graph references with imports
extend schema
# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://specs.apollo.dev/link/v1.0")

# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://internal.example.com/admin", import: [{ name: "@adminOnly", as: "@admin" }])

#   👇🏽 🌍 #Query (note: this schema has no url, so the url part is null)
type Query {
  #               👇🏽 🌍 https://internal.example.com/admin#@adminOnly
  allUsers: [User] @admin
  #         🖕🏽 🌍 #User
}
```

This indirection is the whole point. A core-aware security layer scanning the document for fields marked with `https://internal.example.com/admin#@adminOnly` will find it, regardless of its local name within the document.

Attribution functions the same for all references and definitions within the document. For example, if we include a definition of the `@admin` directive from the example above (as we must, if the schema is to be fully valid) it too will be attributed to the foreign schema:

```graphql example -- global graph references for definitions
extend schema
# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://specs.apollo.dev/link/v1.0")

# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://internal.example.com/admin", import: [{ name: "@adminOnly", as: "@admin" }])

#   👇🏽 🌍 #Query (note: this schema has no url, so the url part is null)
type Query {
  #               👇🏽 🌍 https://internal.example.com/admin#@adminOnly
  allUsers: [User] @admin
  #         🖕🏽 🌍 #User
}

#        👇🏽 🌍 https://internal.example.com/admin#@adminOnly
directive @admin on FIELD_DEFINITION
```

# Scope

Core schemas have a document-wide *scope*. A document's scope is a map of {Element} ==> {Binding}. The scope is constructed from a document's {@link} directives and is used to [attribute](#sec-Attribution) definitions and references within the document.

Elements are the same as in [global graph references](#sec-Global-Graph-References). When used as scope keys, they carry the following meanings:
- Schema({name}) — a schema {@link}ed from the document. {name} can be used as a [prefix](#sec-Name-Conventions) for definitions and references within the document, and {name} MUST either be a valid prefix or {null}, indicating the present schema.
- Directive({name}) — a directive [imported](#@link.import) into the document
- Type({name}) — a type [imported](#@link.import) into the document

A {Binding} contains:
- {gref}: GRef — the [global graph reference](#sec-Global-Graph-References) which is the target of the binding
- {implicit}: Bool — indicating whether the binding was explicitly imported or created implicitly. Implicit bindings are "soft"—they may be overwritten by explicit bindings and will not be formed if an explicit binding for the item alreaady exists.

Similar to a [gref](#sec-Global-Graph-References)'s elements, different types of scoped items can have the same name without conflict. For example, a scope can contain both a type and schema named "User", although this should generally be avoided if possible.

The [global graph reference](#sec-Global-Graph-References) mapped to the target MUST match the item's type—a scope cannot map a schema to a directive, for instance. The [algorithms](#sec-Algorithms) provided in this document ensure this is always the case.

## Entries added by @link

A {@link} without any [imports](#@link.import) introduces two entries into the scope:
1. an explicit binding to the foreign schema, and
2. an implicit binding to a directive with the foreign schema's own name, if its URL [has a name](#@link.url). This somewhat-blessed directive is the schema's "root directive"

```graphql example -- {@link} bringing a single schema into scope
  @link(url: "https://example.com/foreignSchema")
  # 1. foreignSchema:: -> https://example.com/foreignSchema (explicit)
  # 2. @foreignSchema  -> https://example.com/foreignSchema#@foreignSchema (implicit)
```

{@link}ing a foreign schema whose URL does not have a name will create a schema binding if and only if [`as:`](#@link.as) is specified, and will never create a root directive reference:

```graphql example -- {@link} bringing a single schema into scope
  #          👇🏽 url does not have a name
  @link(url: "https://api.example.com", as: "example")
  # 1. example:: -> https://example.com#example (explicit)
```

A {@link} with imports will add these entries to the scope, in addition to entries for each import:

```graphql example -- {@link} importing items into the scope
  @link(url: "https://example.com/foreignSchema", import: ["SomeType", "@someDirective"])
  # 1. foreignSchema:: -> https://example.com/foreignSchema (explicit)
  # 2. @foreignSchema  -> https://example.com/foreignSchema#@foreignSchema (implicit)
  # 3. SomeType        -> https://example.com/foreignSchema#SomeType (explicit)
  # 4. @someDirective  -> https://example.com/foreignSchema#@someDirective (explicit)
```

Specifying [`as:`](#@link.as) changes the names of the scope items, but not their bound grefs:

```graphql example -- {@link} conflicting schema names
  @link(url: "https://example.com/foreignSchema", as: "other")
  # 1. other:: -> https://example.com/foreignSchema (explicit)
  # 2. @other  -> https://example.com/foreignSchema#@foreignSchema (implicit)
```

It is not an error to overwrite an implicit binding with an explicit one:

```graphql example -- {@link} import overriding an implicit binding
  @link(url: "https://example.com/foreignSchema")
  # 1. foreignSchema:: -> https://example.com/foreignSchema (explicit)
  # 2. @foreignSchema  -> https://example.com/foreignSchema#@foreignSchema (implicit)
  
  #   (2) will be subsequently overwritten:
  @link(url: "https://other.com/otherSchema, import: ["@foreignSchema"])
  # 3. otherSchema::  -> https://other.com/otherSchema (explicit)
  # 4. @otherSchema   -> https://other.com/otherSchema#@otherSchema (implicit)
  # 5. @foreignSchema -> https://other.com/otherSchema#@foreignSchema (explicit, overwrites (2))
```

But it is an error to overwrite an explicit binding, or for two implicit bindings to overlap:

```graphql counter-example -- {@link} conflicting schema names
  @link(url: "https://example.com/foreignSchema")
  # 1. foreignSchema:: -> https://example.com/foreignSchema (explicit)
  # 2. @foreignSchema  -> https://example.com/foreignSchema#@foreignSchema (implicit)
  
  @link(url: "https://other.com/foreignSchema")
  # ❌ foreignSchema:: -> https://other.com/foreignSchema (explicit)
  #   (error, conflicts with with (1))
  # ❌ @foreignSchema  -> https://other.com/otherSchema#otherSchema (implicit)
  #   (error, conflicts with (2))
```

Document processors MAY reject schemas with such errors outright.

Permissive processors (for example, a language server which wants to provide best-effort attribution even in the face of document errors) MAY choose to process such documents even in the face of conflicts. Such processors SHOULD include the first (in document order) binding in the scope, and reject subsequent bindings. Such processors SHOULD also provide error messages listing *all* {@link}s which are in conflict.

# Name Conventions

Within a core schema, type names and directives which begin with a valid namespace identifier followed by two underscores (`__`) will be [attributed](#sec-Attribution) to the foreign schema bound to that name in the document [scope](#sec-Scope) if one exists.

```graphql example -- using a prefixed name
extend schema
  @link(url: "https://specs.apollo.dev/link/v1.0")  
# 1. Schema("link") -> "https://specs.apollo.dev/link/v1.0" (explicit)
# 2. Directive("link") -> "https://specs.apollo.dev/link/v1.0#@link" (implicit)

#    👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#Purpose
enum link__Purpose { SECURITY EXECUTION }
```

If no schema has been linked to that name, it is interpreted as a local name:

```graphql example -- a strange local name
extend schema
  @link(url: "https://specs.apollo.dev/link/v1.0")  
# 1. Schema("link") -> "https://specs.apollo.dev/link/v1.0" (explicit)
# 2. Directive("link") -> "https://specs.apollo.dev/link/v1.0#@link" (implicit)

#    👇🏽 🌍 #myOwn__Purpose
enum myOwn__Purpose { SECURITY EXECUTION }
```

Note: GraphQL name conventions strongly suggest against such naming. But amongst the core schema design principles is *universality*—the ability to represent and link *any arbitrary* set of GraphQL schemas, no matter how weird the names in them are.

## Bootstrapping

Documents can {@link} link itself. Indeed, if they MUST do so if they use {@link} at all and are intended to be [fully valid](#sec-Fully-Valid-Core-Schemas):

```graphql example -- bootstrapping {@link}
extend schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
```

The {@link} directive for {@link} itself—the "bootstrap"—MUST be the first {@link} in the document. Other directives may precede it, including directives which have been {@link}ed. 

There is otherwise nothing special or restricted about bootstraps. Documents MAY use them to rename {@link}—either with [`as:`](#@link.as) or [`import:`](#@link.import) or both:

```graphql example -- bootstrapping {@link} with a different name
extend schema
  @core(url: "https://specs.apollo.dev/link/v1.0", as: "core")
```

```graphql example -- importing {@link} with a different name
extend schema
  @core(url: "https://specs.apollo.dev/link/v1.0", import: [{ name: "@link", as: "@core" }])
```

```graphql example -- importing the {@link} directive directly
extend schema
  @foo(url: "https://specs.apollo.dev/link/v1.0", import: [
    {name: "@link", as: "@foo"},
  ])
```

# Fully Valid Core Schemas

For a document to be a fully valid core schema:

1. It MUST be a valid GraphQL schema. Amongst other things, this means that it MUST contain definitions for all types and directives it references, including those from foreign schemas
2. If it includes any {@link}s, it MUST include a [bootstrap](#sec-Bootstrapping) which MUST precede all other {@link}s in the document

Good news: this means that every valid GraphQL schema which *does not* use {@link} is automatically a fully valid core schema. Otherwise-valid schemas which use {@link} simply have to include a [bootstrap](#sec-Bootstrapping) to become fully valid core schemas.

Note: The bootstrap link is required in order to properly identify the [version](#sec-Versioning) of the link spec in use.

## Partial Schemas

Partial schemas are schemas which use {@link} to reference definitions which they do not necessarily include. Partial schemas are invalid GraphQL, but can be turned into valid GraphQL by a [compiler](#sec-Appendix-Compilation) which inserts the appropriate definitions.

# Schema discovery

Tools (such as [compilers](#sec-Appendix-Compilation)) which want to obtain the source of a core schema via its URL SHOULD try to fetch it in the simplest protocol-appropriate way from "{url}.graphql". For example, the text of `https://specs.apollo.dev/link/v1.0` is available by issuing a `GET` request to [`https://specs.apollo.dev/link/v1.0.graphql`](https://specs.apollo.dev/link/v1.0.graphql). Publishers SHOULD put the text of their schemas in the appropriate `.graphql` location for automatic fetching by tools. `GET` requests against the unmodified URL itself SHOULD take the viewer to human-readable documentation for the schema; `POST` requests SHOULD execute GraphQL queries and return their results, if the schema has any root types.

Tools MAY try other mechanisms, such as introspection. However, introspection requires a running endpoint, which is unnecessary for some schemas ([link](/link/v1.0), for example, does not define any root types, and so has no use for an endpoint).

Note: It may seem that this is the perfect use case for the HTTP `Accept:` header, and it is. The file extension approach is deemed to be more practical for a few reasons: (1) CDNs generally have poor support for varying the response based on `Accept:`, (2) the appropriate MIME type for GraphQL schemas is surprisingly controversial, and (3) `Accept:` is HTTP/HTTPS-specific, whereas "append .graphql to the URL" works across a range of protocols.

# Validations & Algorithms

## Constructing the document's scope

Visit every {@link} within the document to construct the document's scope.

Note: This algorithm **Report**s errors. Depending on their needs, implementations MAY decide to fail immediately in the face of these errors, or may elect to continue processing the document

ConstructScope(document, baseScope) :
  1. **Let** {scope} be {baseScope} if provided. Otherwise, it begins as an empty map of {Element} ==> {Binding}
  2. **For each** SchemaDefinition or SchemaExtension {schemaDef} in {document},
    1. **For each** directive {linkCandidate} on {schemaDef},
      1. **If** {Locate(scope, linkCandidate)} is the [GRef](#sec-Url-Representation) `https://specs.apollo.dev/link/v1.0#@link`...
      2. ...or {LocateBound(scope, linkCandidate)} is {null} and {IsBootstrap(linkCandidate)} **Then**
        1. **For each** ({element}, {binding}) **from** {BindingsFromLink(linkCandidate)}
          1. **If** {binding} is implicit and {element} exists in {scope} and is explicit, **Then Continue**
          2. **If** {binding} is implicit and {element} exists in {scope} and is implicit...
          3. **Or If** {binding} is explicit and {element} exists in {scope} and is explicit **Then**
            1. **Report** ❌ NameConflict
          1. **Insert** {element} ==> {binding} **into** {scope}
  3. **Return** {scope}

## Get all bindings from a @link directive

Emit all scope bindings produced by a @link directive.

Note: This algorithm is specified as a generator. This is deemed to produce the clearest psuedocode, but implementations may choose other approaches, such as collecting bindings into a list.

BindingsFromLink(directive) :
  1. **If** {directive} does not have a `url` argument or its `url` argument is an [invalid URL](#@link.url)
    1. **Fail** ❌ BadLinkUrl
  1. **Let** {url} be the canonical form of the {directive}'s `url` argument, with [all meaningless components stripped](#@link.url)    
  2. **If** {url} does not have a name...
    2. ...and {directive} does not have an `as` argument...
    3. ...and {directive} does not have an `import` argument or `import` is an empty list **Then**
      1. **Fail** ❌ UselessLink
  2. **If** {url} has a name, **Then**
    1. **Let** {name} be the name extracted from {url}
    2. **Let** {localName} be {directive}'s `as` argument if present and valid, otherwise {name}
    2. **Emit** the schema binding (Schema({localName}), Binding(gref: GRef({url}, Schema()), implicit: {false}))
    2. **Emit** the root directive binding (Directive({localName}), Binding(gref: GRef({url}, Directive({name})), implicit: {true}))
  3. ...**Else**
    2. **Let** {localName} be {directive}'s `as` argument if present and valid
    2. **Emit** the schema binding (Schema({localName}), Binding(gref: GRef({url}, Schema()), implicit: {false}))
  4. **For each** {import} **from** {directive}'s `import` argument:
    1. **If** {import} is a string directive name starting with `@`,
      0. **Let** {name} be the name of the directive specified by {import}
      1. **Emit** (Directive({name}), Binding(gref: GRef({url}, Directive({name})), implicit: {false}))
    2. **If** {import} is an object,
      1. **If** {import} does not have a string-valued `name` field,
        1. **Report** ❌ BadImport
        2. **Continue**
      1. **Let** {name} be the `name` field from {import}
      2. **Let** {as} be the `as` field from {import}, if present, otherwise {name}
      1. **If** {name} is a string directive name starting with `@`,
        1. **If** {as} is not a directive name starting with `@`,
          1. **Report** ❌ BadImportTypeMismatch
          2. **Continue**
        2. ...**Else Emit** (Directive({as}), Binding(gref: GRef({url}, Directive({name})), implicit: {false}))
      2. ...**Else If** {name} is a valid GraphQL identifier,
        1. **If** {as} is not a valid GraphQL identifier,
          1. **Report** ❌ BadImportTypeMismatch
          2. **Continue**
        2. ...**Else Emit** (Type({as}), Binding(gref: GRef({url}, Type({name})), implicit: {false}))
        

## Detecting a bootstrap directive

Returns {true} if a directive is a [bootstrap](#sec-Bootstrapping). Otherwise, returns {false}.

IsBootstrap(directive) :
  1. **If** {directive} does not have a string-valued `url` argument, **Then Return** {false}
  2. **Let** {url} be the canonical form of the {directive}'s `url` argument, with [all meaningless components stripped](#@link.url)
  3. **If** {url} is `https://specs.apollo.dev/link/v1.0`,
    1. **Let** {testScope} be an empty map of {Element} ==> {Binding}
    2. **For each** ({element}, {binding}) **from** {BindingsFromLink(directive)}
      1. **Insert** {element} ==> {binding} **into** {testScope}
    3. **If** {Locate(testScope, directive)} is a binding with the gref `https://specs.apollo.dev/link/v1.0#@link`, **Then**
      1. **Return** {true}
  4. Otherwise, **Return** {false}

## Locating definitions and references

{Locate} a definition or reference within the document's scope, returning a global graph reference.

{defOrRef} must be one of:
- a definition node with a name
- an extension node with a name
- a directive

Locate(scope, defOrRef) :
  1. **If** {LocateBound(scope, defOrRef)} is not {null} **Then Return** {LocateBound(scope, defOrRef)}
  3. **Let** {selfReference} be the element `Schema()`
  3. **Let** {myself} be the URL of the schema returned from {Lookup(scope, selfReference)}, or {null} if none was found
  1. Let {name} be the Name of {defOrRef}
  4. **If** {defOrRef} is a Directive or DirectiveDefinition **Then**
    1. **Return** GRef(myself, Directive({name}))
  5. Otherwise, **Return** GRef(myself, Type({name}))

{LocateBound(scope, defOrRef)} returns the binding for {defOrRef} if one is specified
in {scope}, otherwise {null}. It does not resolve local names to the local document.

LocateBound(scope, defOrRef) :
  1. **Let** ({schema}, {element}) be the pair returned from {GetPath(defOrRef)}
  2. **If** {schema} is not {null} and exists in {scope}, **Then**
    1. Let {foundGraph} be the URL of the binding found by looking up {schema} in {scope}
    2. **Return** GRef({foundGraph}, {element})
  3. **If** {schema} is {null} and {element} exists in {scope}, **Then**
    1. **Let** {foundElement} be the gref of the binding found by looking up {element} in {scope},
    2. **Return** {foundElement}
  4. Otherwise, **Return** {null}

{GetPath(node)} [parses the name](#sec-Name-Conventions) of {node} and returns a (schema, element) pair.

{node} must have a name.

{schema} will be the {Schema} element parsed from the name, or {null} if {node}'s name does not have a prefix.
{element} may be any type of {Element}.

GetPath(node) :
  1. **If** {node}'s Name contains the namespace separator {"__"}, **Then**
    1. **Let** {prefix} be the part of {node}'s Name up to the first instance of the namespace separator {"__"}
    2. **Let** {base} be the part of {node}'s Name after the first instance of the namespace separator {"__"}
  2. ...**Else**,
    1. **Let** {prefix} be {null}
    2. **Let** {base} be Name
  3. **If** {node} is a Directive or DirectiveDefinition, **Then**
    1. **Return** (Schema({prefix}), Directive({base}))
  4. ...**Else Return** (Schema({prefix}), Type({base}))

# Appendix: Versioning

VersionTag : "v" Version

Version : Major "." Minor

Major : NumericIdentifier

Minor : NumericIdentifier

NumericIdentifier : "0"
  | PositiveDigit Digit*

Digit : "0" | PositiveDigit

PositiveDigit : "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

Specs are versioned with a **subset** of a [Semantic Version Number](https://semver.org/spec/v2.0.0.html) containing only the major and minor parts. Thus, specifications SHOULD provide a version of the form `v`{Major}`.`{Minor}, where both integers >= 0.

```text example -- Valid version tags
v2.2
v1.0
v1.1
v0.1
```

As specified by semver, spec authors SHOULD increment the:

{++

- MAJOR version when you make incompatible API changes,
- MINOR version when you add functionality in a backwards compatible manner

++}

Patch and pre-release qualifiers are judged to be not particularly meaningful in the context of GraphQL schemas, which are (by definition) interfaces rather than implementations. The patch component of a semver denotes a bug fix which is backwards compatible—that is, a change to the implementation which does not affect the interface. Patch-level changes in the version of a spec denote wording clarifications which do not require implementation changes. As such, it is not important to track them for the purposes of version resolution.

As with [semver](https://semver.org/spec/v2.0.0.html), the `0.x` version series is special: there is no expectation of compatibility between versions `0.x` and `0.y`. For example, a processor must not activate implementation `0.4` to satisfy a requested version of `0.2`.

## Satisfaction

Given a version {requested} by a document and an {available} version of an implementation, the following algorithm will determine if the {available} version can satisfy the {requested} version:

Satisfies(requested, available) :
  1. If {requested}.{Major} ≠ {available}.{Major}, return {false}
  2. If {requested}.{Major} = 0, return {requested}.{Minor} = {available}.{Minor}
  3. Return {requested}.{Minor} <= {available}.{Minor}

# Appendix: Compilation

A *compiler* takes a [partial schema](#sec-Partial-Schemas) and emits a [fully valid core schema](#sec-Fully-Valid-Core-Schemas) by inserting definitions from a *corpus*.

The complete implementation of a compiler is outside the scope of this spec. An approximate algorithm for the fundamental definition-fill operation follows. This 

Note: this algorithm assumes that the corpus is able to return both the definitions and the scope of those definitions; this is necessary to be able to {Locate} nodes from the corpus. An alternate approach is for the corpus to return definitions with their (and their descendants') global references attached.

Fill(document, scope, corpus) :
  1. **Let** {queue} be a queue of GRefs to process
  2. **Let** {oldDocument} be {null}
  3. **Loop Until** {oldDocument} is {document},
    1. **Set** {oldDocument} to {document}
    1. **For each** Named Type, Directive, or Import {reference} in {document},
      1. **Let** {gref} be the location of {reference} from {Locate(reference, scope)}
      2. **If** {document} does not contain a definition for {gref},
        1. **If** {corpus} contains definitions for {gref},
          1. **For each** ({definition}, {srcScope}) for {gref} in {corpus},
            1. **Let** {moved} be the result of {Move(definition, srcScope, newScope)}
            2. **Set** {document} to {document} with {moved} inserted
        2. ...**Else Report** ❌ NoDefinition for {gref} in {document} or {corpus}

{Move} takes a {subtree} and source and destination scopes and returns a ({newScope}, {newNode}) pair. {newScope} will be the same as {destScope}, but may have been expanded to include bindings necessary to support {node}. {newNode} may have been renamed to conform to existing bindings in {destScope}.

Move(subtree, srcScope, destScope) :
  1. **Let** {newNode} be a clone of {subtree}
  2. **Let** {newScope} be a clone of {destScope}
  1. **For each** Named Type, Directive, or Import {reference} in {newNode},
    1. **Let** {gref} be the result of {Locate(srcScope, reference)}
    2. **If** {newScope} contains a binding for {gref},
      1. **Set** {reference}'s Name to the binding's Element
    3. ...**Else**,
      1. **If** {newScope} does not contain a binding whose {gref} is Schema({gref}'s {url}),
        1. **Let** {name} be an arbitrary name such that Schema({name}) is not bound {newScope}
        2. **Insert** Schema({name}) ==> Binding(gref: Schema({gref}'s url), element: Schema({name})) into {newScope}
      1. **Set** {reference}'s Name to the binding's Element + {"__"} + {gref}'s Element
