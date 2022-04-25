# link v1.0

```raw html
<table class=spec-data>
  <tr><td>Status</td><td>Draft</td>
  <tr><td>Version</td><td>1.0</td>
</table>
<link rel=stylesheet href=https://specs.apollo.dev/apollo-light.css>
<script type=module async defer src=https://specs.apollo.dev/inject-logo.js></script>
```

Core schemas provide tools for linking definitions from different GraphQL schemas together into one.

```graphql example -- linking a directive from another schema
extend schema
  #          👇🏽 first, link @link from this url
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

# Global Graph References

Within a core schema document, every top-level definition and reference (for example, every named type and directive) has a position in the global graph. This position is captured by a *global graph reference*.

A global graph reference (or *gref*) is a (*[link url](#@link/url)*, *element*) pair.

The URL may be {null}, to represent local definitions within a schema that is not bound to a URL. Otherwise it must be a [valid link url in canonical form](#@link/url).

The *element* may be:
- Directive({name}) — a directive
- Type({name}) — a named type of any kind
- Schema({name}?) — a further link to yet another schema. {name} may be {null} to indicate the schema itself.

Implementations may represent these internally in a variety of ways. They also have a canonical string form, which is used in [{Import}](#Import)

- Directive({name}) is represented with "@{name}"
- Type({name}) is simply represented with "{name}"
- Schema({name}) is represented with "{name}::"

Types and directives are separated in this way because that's how GraphQL does it—you can have a `User` type and a `@User` directive in the same schema (though GraphQL naming conventions would suggest againt it).

## URL representation

Since [link urls](#Url) explicitly cannot have fragments, we can represent global graph references as a URL with a fragment. For example, a reference to this document's {@link} directive can be rendered as `https://specs.apollo.dev/link/v1.0#@link`. A reference to this document's {Import} scalar can be rendered as `https://specs.apollo.dev/link/v1.0#Import`.

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

This attribution *does not change* if we [`import`](#@link/import) some names, even renaming them:

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

## Identifying the document's own URL

The document's own URL can be specified with the [`@id` directive](#@id):

```graphql example -- global graph references with {@id}
extend schema
# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@id
  @id(url: "https://api.example.com/myself")

# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://specs.apollo.dev/link/v1.0", import: ["@id"])

# 👇🏽 🌍 https://specs.apollo.dev/link/v1.0/#@link
  @link(url: "https://internal.example.com/admin", import: [{ name: "@adminOnly", as: "@admin" }])

#   👇🏽 🌍 https://api.example.com/myself#Query
type Query {
  #               👇🏽 🌍 https://internal.example.com/admin#@adminOnly
  allUsers: [User] @admin
  #         🖕🏽 🌍 https://api.example.com/myself#User
}
```

Using `@id` is not, strictly speaking, necessary. A URL can be associated with a document in any number of ways (for example, a processor could associate the schema with the URL where it found it. However, using [{@id}](#@id) makes the document self-describing; core-aware processors will correctly attribute definitions and references within such documents, regardless of where they were found.

# Scope

Core schemas have a document-wide *scope*. A document's scope is a map of {Element} ==> {Binding}. The scope is constructed from a document's [@link](#@link) and [@id](#@id) directives and is used to [attribute](#sec-Attribution) definitions and references within the document.

Elements are the same as in [global graph references](#sec-Global-Graph-References). When used as scope keys, they carry the following meanings:
- Schema({name}) — a schema {@link}ed from the document. {name} can be used as a [prefix](#sec-Name-Conventions) for definitions and references within the document, and {name} MUST either be a valid prefix or {null}, indicating the present schema.
- Directive({name}) — a directive [imported](#@link/import) into the document
- Type({name}) — a type [imported](#@link/import) into the document

A {Binding} contains:
- {gref}: GRef — the [global graph reference](#sec-Global-Graph-References) which is the target of the binding
- {implicit}: Bool — indicating whether the binding was explicitly imported or created implicitly. Implicit bindings are "soft"—they may be overwritten by explicit bindings and will not be formed if an explicit binding for the item alreaady exists.

Similar to a [gref](#sec-Global-Graph-References)'s elements, different types of scoped items can have the same name without conflict. For example, a scope can contain both a type and schema named "User", although this should generally be avoided if possible.

The [global graph reference](#sec-Global-Graph-References) mapped to the target MUST match the item's type—a scope cannot map a schema to a directive, for instance. The [algorithms](#sec-Algorithms) provided in this document ensure this is always the case.

## Entries added by @link

A {@link} without any imports introduces two entries into the scope:
1. an explicit binding to the foreign schema, and
2. an implicit binding to a directive with the foreign schema's own name, if its URL [has a name](#@link/url). This somewhat-blessed directive is the schema's "root directive"

```graphql example -- {@link} bringing a single schema into scope
  @link(url: "https://example.com/foreignSchema")
  # 1. foreignSchema:: -> https://example.com/foreignSchema (explicit)
  # 2. @foreignSchema  -> https://example.com/foreignSchema#@foreignSchema (implicit)
```

{@link}ing a foreign schema whose URL does not have a name will create a schema binding if and only if [`as:`](#@link/as) is specified, and will never create a root directive reference:

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

Specifying [`as:`](#@link/as) changes the names of the scope items, but not their bound grefs:

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

## Entry added by @id

[@id](#@id) adds just one entry into the scope, binding the current document to the given URL:

```graphql example -- {@id} adds a self-binding into the scope
  @id(url: "https://example.com/myself")
  # 1. Schema() -> https://example.com/myself (explicit)
```

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

#    👇🏽 🌍 #myOwn__Purpose (note, this document has no @id, so the url of this gref is null)
enum myOwn__Purpose { SECURITY EXECUTION }
```

```graphql example -- a strange local name in a document with an id
extend schema
  @id(url: "https://api.example.com")
  @link(url: "https://specs.apollo.dev/link/v1.0", import: ["@id"]

#    👇🏽 🌍 https://api.example.com#myOwn__Purpose
enum myOwn__Purpose { SECURITY EXECUTION }
```

Note: GraphQL name conventions strongly suggest against such naming. But amongst the core schema design principles is *universality*—the ability to represent and link *any arbitrary* set of GraphQL schemas, no matter how weird the names in them are.

## Bootstrapping

Documents can {@link} link itself. Indeed, if they MUST do so if they use [@link](#@link) at all and are intended to be [fully valid](#sec-Fully-Valid-Core-Schemas):

```graphql example -- bootstrapping {@link}
extend schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
```

The {@link} directive for {@link} itself—the "bootstrap"—MUST be the first {@link} in the document. Other directives may precede it, including directives which have been {@link}ed. 

```graphql example -- bootstrapping {@link} and using {@id} before doing so
extend schema
  @id(url: "https://api.example.com")
  @link(url: "https://specs.apollo.dev/link/v1.0", import: ["@id"])
```

There is otherwise nothing special or restricted about bootstraps. Documents MAY use them to rename {@link}—either with [`as:`](#@link/as) or [`import:`](#@link/import) or both:

```graphql example -- bootstrapping {@link} with a different name
extend schema
  @core(url: "https://specs.apollo.dev/link/v1.0", as: "core")
```

```graphql example -- importing {@link} with a different name
extend schema
  @core(url: "https://specs.apollo.dev/link/v1.0", import: [{ name: "@link", as: "@core" }])
```

```graphql example -- importing {@link} and other things simultaneously
extend schema
  @id(url: "https://api.example.com")
  @foo(url: "https://specs.apollo.dev/link/v1.0", import: [
    {name: "@link", as: "@core"},
    "@id"
  ])
```

# Fully Valid Core Schemas

For a document to be a fully valid core schema:

1. It MUST be a valid GraphQL schema. Amongst other things, this means that it MUST contain definitions for all types and directives it references, including those from foreign schemas
2. If it includes any {@link}s, it MUST include a [bootstrap link](#sec-Bootstrapping) which MUST precede all other {@link}s in the document
3. It MAY include an {@id}, particularly if other schemas are meant to link to it (e.g. if the document provide directives for use on other schemas)

Good news: this means that every valid GraphQL schema which *does not* use {@link} is automatically a fully valid core schema. Otherwise-valid schemas which use {@link} simply have to include a [bootstrap](#sec-Bootstrapping) to become fully valid core schemas.

Note: The bootstrap link is required in order to properly identify the [version](#sec-Versioning) of the link spec in use.

# Definitions

##! @link

```graphql definition
directive @link(url: String!, as: String, import: [Import])
```

Link a foreign schema by its URL.

###! url: String!

The foreign schema's URL.

Link URLs serve two main purposes:
  - Providing a unique identifier for the foreign schema
  - Directing human readers to documentation about the foreign schema

Link URLs SHOULD be [RFC 3986 URLs](https://tools.ietf.org/html/rfc3986). When viewed, the URL SHOULD provide schema documentation in some human-readable form—a human reader should be able to click the link and go to the correct version of the docs. This is not an absolute functional requirement—as far as the core schema machinery is concerned, the URL is simply a globally unique namespace identifier with a particular form.

Link URLs MAY contain information about the spec's [name](#sec-Name-Conventions) and [version](#sec-Versioning):

```html diagram -- Basic anatomy of a link URL
<code class=anatomy>
  <span class=pink style='--depth: 2'>https://spec.example.com/a/b/c/<span>mySchema<aside>name</aside></span><aside>identity</aside></span>/<span style='--depth: 2' class=green>v1.0<aside>version</aside></span>
</code>
```

The final two segments of the URL's [path](https://tools.ietf.org/html/rfc3986#section-3.3) MAY contain the schema's name and a [version tag](#sec-Versioning), in that order. Both are optional. To be recognized as a version tag, the final path component MUST be a valid {VersionTag}. To be recognized as a name, the penultimate path component MUST be a valid [GraphQL name](https://spec.graphql.org/draft/#Name) which does not start or end with an underscore (`_`) and which does not contain the namespace separator (`__`).

Empty final path components (that is, trailing slashes) and any URL components which have not been assigned a meaning (such as the fragment and query) MUST be ignored.

```html diagram -- Ignoring meaningless parts of a URL
<code class=anatomy>
  <span class=pink style='--depth: 2'>https://example.com/<span>exampleSchema<aside>name</aside></span><aside>identity</aside></span>/<span style='--depth: 2' class=green>v1.0<aside>version</aside></span><span class=grey>/?key=val&k2=v2#frag<aside>ignored</aside></span>
</code>
```

All of these are valid arguments to `url`, and their interpretations:

| url                                               | normalized url                             |   name   | version  |
| ------------------------------------------------- | ------------------------------------------ | -------  | -------- |
| https://spec.example.com/a/b/mySchema/v1.0/       | https://spec.example.com/a/b/mySchema/v1.0 | mySchema |  v1.0    |
| https://spec.example.com                          | https://spec.example.com                   | *(null)* | *(null)* |
| https://spec.example.com/mySchema/v0.1?q=v#frag   | https://spec.example.com/mySchema/v0.1     | mySchema |  v0.1    |
| https://spec.example.com/v1.0                     | https://spec.example.com/v1.0              | *(null)* |  v1.0    |
| https://spec.example.com/vX                       | https://spec.example.com/vX                | vX       | *(null)* |

If `name` is present, that [namespace prefix](#sec-Name-Conventions) will automatically be linked to the URL. If a `name` is not present, then elements of the foreign schema must be [`imported`](#@link/import) in order to be referenced.

###! as: String

Change the [namespace prefix](#sec-Name-Conventions) assigned to the foreign schema.
  
The name MUST be a valid GraphQL identifier, MUST NOT contain the namespace separator ({"__"}), and MUST NOT end with an underscore (which would create ambiguity between whether {"x___y"} is prefix `x_` for element `y` or prefix `x` for element `_y`).

By default, {@link} will assign a prefix based on the `name` extracted from the URL. If no `name` is present, a prefix will not be assigned.

Providing [`as:`](#@link/as) overrides the default behavior: the foreign schema will be bound to the provided name, regardless of the `name` present in the URL (or the lack of one).

```graphql example -- Using {@link}(url:, as:) to link a schema with a custom name
schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://spec.example.com/example/v1.0", as: "eg")
{
  query: Query
}

type User {
  # Specifying `as: "eg"` transforms @example into @eg
  name: String @eg(data: ITEM)
}

# Additional specified schema elements must have their prefixes set
# to the new name.
enum eg__Data {
  ITEM
}

# Name transformation must also be applied to definitions pulled in from
# specifications.
directive @eg(data: eg__Data) on FIELD_DEFINITION

directive @link(url: String!, as: String) repeatable on SCHEMA
```

###! import: [Import]

A list of names, possibly with aliases, to import from the foreign schema into the document.

See the [Import](#Import) scalar for a description of the format.

###! for: Purpose

An optional [purpose](#Purpose) for this link. This hints to consumers as to whether they can safely ignore metadata described by a foreign schema.

By default, {@link}s SHOULD fail open. This means that {@link}s to unknown schemas SHOULD NOT prevent a schema from being served or processed. Instead, consumers SHOULD ignore unknown links and serve or process the rest of the schema normally.

This behavior is different for {@link}s with a specified purpose:
  - `SECURITY` links convey metadata necessary to compute the API schema and securely resolve fields within it
  - `EXECUTION` links convey metadata necessary to correctly resolve fields within the schema

##! @id

```graphql definition
directive @id(url: String!) on SCHEMA
```

Identify the current document by its URL. The URL is interpreted identically to [`@link`'s `url:` argument](#@link/as).

##! Import

```graphql definition
scalar Import
```

An element, possibly aliased, to import into the document.

`Import` can take the form of a string:

```graphql example -- import a string name
  @link(url: "https://specs.apollo.dev/link/v1.0", import: ["@link", "Purpose"])
```

or an object with `name` and (optionally `as`):

```graphql example -- import an aliased name
  @link(url: "https://example.com/, import: [{
    name: "@example",
    as: "@eg"
  }, { name: "Purpose", as: "LinkPurpose" }])
```

`name` and `as` MUST be of the same type:

```graphql counter-example -- incorrectly importing a type as a directive
  @link(url: "https://example.com/, import: [{
    name: "SomeType",
    as: "@someDirective"
  }])
```

Imports cannot currently reference transitive schemas:

```graphql counter-example -- incorrectly importing a transitive schema reference
  @link(url: "https://example.com/, import: ["otherSchema::"])
```

Note: Future versions may support this.

##! Purpose

The role of a schema referenced with {@link}.

This is not intended to be an exhaustive list of all the purposes a foreign schema or its metadata might serve. Rather, it is intended to capture cases where the default fail-open behavior of core schema consumers is undesirable.

Note we'll refer to directives from links which are `for: SECURITY` or `for: EXECUTION` as "`SECURITY` directives" and "`EXECUTION` directives", respectively.

###! SECURITY

`SECURITY` links provide metadata necessary to securely resolve fields. For instance, a hypothetical {auth} schema may provide an {@auth} directive to flag fields which require authorization. If a data core does not support the {auth} schemas and serves those fields anyway, these fields will be accessible without authorization, compromising security.

Security-conscious consumers MUST NOT serve a field if:
  - the schema definition has **any** unsupported SECURITY directives,   
  - the field's parent type definition has **any** unsupported SECURITY directives,
  - the field's return type definition has **any** unsupported SECURITY directives, or
  - the field definition has **any** unsupported SECURITY directives

Such fields are *not securely resolvable*. Security-conscious consumers MAY serve schemas with fields which are not securely resolvable. However, they MUST remove such fields from the schema before serving it.

Less security-conscious consumers MAY choose to relax these requirements. For instance, servers may provide a development mode in which unknown SECURITY directives are ignored, perhaps with a warning. Such software may also provide a way to explicitly disable some or all SECURITY links during development.

More security-conscious consumers MAY choose to enhance these requirements. For instance, production servers MAY adopt a policy of entirely rejecting any schema which contains ANY unsupported SECURITY links, even if those links are never used to annotate the schema.

###! EXECUTION

`EXECUTION` schemas  provide metadata necessary to correctly resolve fields. For instance, a hypothetical {ts} schemas may provide a `@ts__resolvers` annotation which references a TypeScript module of field resolvers. A consumer which does not support the {ts} schemas will be unable to correctly resolve such fields.

Consumers MUST NOT serve a field if:
  - the schema's definition has **any** unsupported EXECUTION directives,
  - the field's parent type definition has **any** unsupported EXECUTION directives,
  - the field's return type definition has **any** unsupported EXECUTION directives, or
  - the field definition has **any** unsupported EXECUTION directives

Such fields are *unresolvable*. Consumers MAY attempt to serve schemas with unresolvable fields. Depending on the needs of the consumer, unresolvable fields MAY be removed from the schema prior to serving, or they MAY produce runtime errors if a query attempts to resolve them. Consumers MAY implement stricter policies, wholly refusing to serve schemas with unresolvable fields, or even refusing to serve schemas with any unsupported EXECUTION schemas, even if those schemas are never used in the schema. 

# Validations & Algorithms

## Constructing the document's scope

Visit every {@link} and {@id} within the document to construct the document's scope.

Note: This algorithm **Report**s errors. Depending on their needs, implementations MAY decide to fail immediately in the face of these errors, or may elect to continue processing the document

ConstructScope(document, baseScope) :
  1. **Let** {scope} be {baseScope} if provided. Otherwise, it begins as an empty map of {Element} ==> {Binding}
  2. **For** each schema definition or schema extension {schemaDef} in {document},
    1. **For** each directive {dir} on {schemaDef},
      1. **If** {Locate(scope, dir)} is the gref `https://specs.apollo.dev/link/v1.0#@link`...
      2. ...or {LocateBound(scope, dir)} is {null} and {IsBootstrap(dir)} **Then**
        1. **For each** ({element}, {binding}) **from** {BindingsFromLink(dir)}
          1. **If** {binding} is implicit and {element} exists in {scope} and is explicit, **Then Continue**
          2. **If** {binding} is implicit and {element} exists in {scope} and is implicit...
          3. **Or If** {binding} is explicit and {element} exists in {scope} and is explicit **Then**
            1. **Report** ❌ NameConflict
          1. **Insert** {element} ==> {binding} **into** {scope}
  2. **For** each schema definition or schema extension {schemaDef} in {document},
    1. **For** each directive {dir} on {schemaDef},
      1. **If** {Locate(scope, dir)} is the gref `https://specs.apollo.dev/link/v1.0#@id`...
        1. **If** {directive} does not have a `url` argument or its `url` argument is an [invalid URL](#@link/url)
          1. **Fail** ❌ BadId
        2. **Let** {url} be the canonical form of {directive}'s `url`
        1. **Insert** Schema() ==> Binding(gref: GRef({url}, Schema()), implicit: {false})
  3. **Return** {scope}

## Get all bindings from a @link directive

Emit all scope bindings produced by a @link directive.

Note: This algorithm is specified as a generator. This is deemed to produce the clearest psuedocode, but implementations may choose other approaches, such as collecting bindings into a list.

BindingsFromLink(directive) :
  1. **If** {directive} does not have a `url` argument or its `url` argument is an [invalid URL](#@link/url)
    1. **Fail** ❌ BadLinkUrl
  1. **Let** {url} be the canonical form of the {directive}'s `url` argument, with [all meaningless components stripped](#@link/url)    
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
  2. **Let** {url} be the canonical form of the {directive}'s `url` argument, with [all meaningless components stripped](#@link/url)
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
  3. **Let** {selfReference} be the item `Schema()`
  3. **Let** {myself} be the URL of the schema returned from {Lookup(scope, selfReference)}, or `Schema(null)` if none was found
  1. Let {name} be the name of {defOrRef}
  4. **If** {defOrRef} is a named type reference, extension, or definition, **Then**
    1. **Return** GRef(myself, Type({name}))
  5. Otherwise, **Return** GRef(myself, Directive({name}))

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
  3. **If** {node} is a Directive, **Then Return** (Schema({prefix}), Directive({base}))
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

