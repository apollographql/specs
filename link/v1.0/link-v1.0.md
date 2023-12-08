# link v1.0

```raw html
<h2>for linking schemas together</h2>
<table class=spec-data>
  <tr><td>Status</td><td>Draft</td>
  <tr><td>Version</td><td>1.0</td>
</table>
<link rel=stylesheet href=/apollo-light.css>
<script type=module async defer src=/inject-logo.js></script>
```

{@link} other schemas by their URL and [`import:`](#@link.import) definitions from them.

#! @link

:::[definition](./link-v1.0.graphql#@link)

Link a foreign schema and optionally import definitions.

```graphql example -- {@link} usage
extend schema
  @link(url: "https://example.com/otherSchema",
    # @link infers a name from the URL 👆
    #   (use as: to set it explicitly)
    import: ["SomeType", "@someDirective", {
      name: "@someRenamedDirective",
      as: "@renamed"
    }])

type Query
  # 👇🏽 imported definitions are available by their name
  @someDirective
  @renamed
  # 👇🏽 non-imported definitions are available with prefixes
  @otherSchema__nonImportedDirective
```

##! url: String!

The foreign schema's URL.

Link URLs serve two main purposes:
  - Providing a unique identifier for the foreign schema
  - Directing human readers to documentation about the foreign schema

Link URLs SHOULD be [RFC 3986 URLs](https://tools.ietf.org/html/rfc3986). When viewed, the URL SHOULD provide schema documentation in some human-readable form—a human reader should be able to click the link and go to the correct version of the docs. This is not an absolute functional requirement—as far as the core schema machinery is concerned, the URL is simply a globally unique namespace identifier with a particular form.

If [`url:`](#@link.url) is not a valid [RFC 3986](https://tools.ietf.org/html/rfc3986) url, then it MUST be treated as an opaque identifier for the foreign schema. Such non-URL inputs to [`url:`](#@link.url) SHOULD NOT have [name](#Name-Conventions) and [version](#Versioning) information extracted from them—both are {null}.

Link URLs which *are* [valid urls](https://tools.ietf.org/html/rfc3986) MAY contain information about the spec's [name](#Name-Conventions) and [version](#Versioning):

```html diagram -- Basic anatomy of a link URL
<code class=anatomy>
  <span class=pink style='--depth: 2'>https://spec.example.com/a/b/c/<span>mySchema<aside>name</aside></span><aside>identity</aside></span>/<span style='--depth: 2' class=green>v1.0<aside>version</aside></span>
</code>
```

The final two segments of the URL's [path](https://tools.ietf.org/html/rfc3986#section-3.3) MAY contain the schema's name and a [version tag](#Versioning), in that order. Both are optional. To be recognized as a version tag, the final path component MUST be a valid {VersionTag}. To be recognized as a name, the penultimate path component MUST be a valid [GraphQL name](https://spec.graphql.org/draft/#Name) which does not start or end with an underscore (`_`) and which does not contain the namespace separator (`__`).

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

If `name` is present, that [namespace prefix](#core/Name-Conventions) will automatically be linked to the URL. If a `name` is not present, then elements of the foreign schema must be [`imported`](#@link.import) in order to be referenced.

##! as: String

Change the [namespace prefix](#Name-Conventions) assigned to the foreign schema.
  
The name MUST be a valid GraphQL identifier, MUST NOT contain the namespace separator ({"__"}), and MUST NOT end with an underscore (which would create ambiguity between whether {"x___y"} is prefix `x_` for element `y` or prefix `x` for element `_y`).

By default, {@link} will assign a prefix based on the `name` extracted from the URL. If no `name` is present, a prefix will not be assigned.

Providing [`as:`](#@link.as) overrides the default behavior: the foreign schema will be bound to the provided name, regardless of the `name` present in the URL (or the lack of one).

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

##! import: [Import]

A list of elements, possibly with aliases, to import from the foreign schema into the document.

Importing an element gives it a local, non-namespaced name.

See the [Import](#Import) scalar for a description of the argument format.

##! for: Purpose

An optional [purpose](#Purpose) for this link. This hints to consumers as to whether they can safely ignore metadata described by a foreign schema.

By default, {@link}s SHOULD fail open. This means that {@link}s to unknown schemas SHOULD NOT prevent a schema from being served or processed. Instead, consumers SHOULD ignore unknown links and serve or process the rest of the schema normally.

This behavior is different for {@link}s with a specified purpose:
  - `SECURITY` links convey metadata necessary to compute the API schema and securely resolve fields within it
  - `EXECUTION` links convey metadata necessary to correctly resolve fields within the schema

#! Import

```graphql definition
scalar Import
```

An element, possibly aliased, to import into the document.

{Import} can take the form of a string:

```graphql example -- import a string name
  @link(url: "https://specs.apollo.dev/link/v1.0", import: ["@link", "Purpose"])
```

or an object with `name` and (optionally `as`):

```graphql example -- import an aliased name
  @link(url: "https://example.com/", import: [{
    name: "@example",
    as: "@eg"
  }, { name: "Purpose", as: "LinkPurpose" }])
```

`name` and `as` MUST be of the same type:

```graphql counter-example -- incorrectly importing a type as a directive
  @link(url: "https://example.com/", import: [{
    name: "SomeType",
    as: "@someDirective"
  }])
```

Imports cannot currently reference transitive schemas:

```graphql counter-example -- incorrectly importing a transitive schema reference
  @link(url: "https://example.com/", import: ["otherSchema::"])
```

Note: Future versions may support this.

#! Purpose

The role of a {@link}ed schema.

This is not intended to be an exhaustive list of all the purposes a foreign schema or its metadata might serve. Rather, it is intended to capture cases where the default fail-open behavior of core schema consumers is undesirable.

Note we'll refer to directives from links which are `for: SECURITY` or `for: EXECUTION` as "`SECURITY` directives" and "`EXECUTION` directives", respectively.

##! SECURITY

`SECURITY` links provide metadata necessary to securely resolve fields. For instance, a hypothetical {auth} schema may provide an {@auth} directive to flag fields which require authorization. If a data core does not support the {auth} schemas and serves those fields anyway, these fields will be accessible without authorization, compromising security.

Security-conscious consumers MUST NOT serve a field if:
  - the schema definition has **any** unsupported SECURITY directives,   
  - the field's parent type definition has **any** unsupported SECURITY directives,
  - the field's return type definition has **any** unsupported SECURITY directives, or
  - the field definition has **any** unsupported SECURITY directives

Such fields are *not securely resolvable*. Security-conscious consumers MAY serve schemas with fields which are not securely resolvable. However, they MUST remove such fields from the schema before serving it.

Less security-conscious consumers MAY choose to relax these requirements. For instance, servers may provide a development mode in which unknown SECURITY directives are ignored, perhaps with a warning. Such software may also provide a way to explicitly disable some or all SECURITY links during development.

More security-conscious consumers MAY choose to enhance these requirements. For instance, production servers MAY adopt a policy of entirely rejecting any schema which contains ANY unsupported SECURITY links, even if those links are never used to annotate the schema.

##! EXECUTION

`EXECUTION` schemas  provide metadata necessary to correctly resolve fields. For instance, a hypothetical {ts} schemas may provide a `@ts__resolvers` annotation which references a TypeScript module of field resolvers. A consumer which does not support the {ts} schemas will be unable to correctly resolve such fields.

Consumers MUST NOT serve a field if:
  - the schema's definition has **any** unsupported EXECUTION directives,
  - the field's parent type definition has **any** unsupported EXECUTION directives,
  - the field's return type definition has **any** unsupported EXECUTION directives, or
  - the field definition has **any** unsupported EXECUTION directives

Such fields are *unresolvable*. Consumers MAY attempt to serve schemas with unresolvable fields. Depending on the needs of the consumer, unresolvable fields MAY be removed from the schema prior to serving, or they MAY produce runtime errors if a query attempts to resolve them. Consumers MAY implement stricter policies, wholly refusing to serve schemas with unresolvable fields, or even refusing to serve schemas with any unsupported EXECUTION schemas, even if those schemas are never used in the schema. 
