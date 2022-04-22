
# Renaming link

It is possible to rename {@link} with the same {@link.as} mechanism used for all links:

```graphql example -- Renaming {@link} to {@linkOther}
schema
  @linkOther(url: "https://specs.apollo.dev/link/v1.0", import: [{name: "@link", as: "@linkOther"}])
  @linkOther(url: "https://example.com/example/v1.0")
{
  query: Query
}

type SomeType {
  field: Int @example
}
```

# Prefixing

With the exception of a single root directive, core feature specifications MUST prefix all schema elements they introduce. The prefix:
  1. MUST match the name of the feature as derived from the feature's specification URL,
  2. MUST be a valid [GraphQL name](https://spec.graphql.org/draft/#Name), and
  3. MUST NOT contain the core namespace separator, which is two underscores ({"__"}), and
  4. MUST NOT end with an underscore (which would create ambiguity between whether {"x___y"} is prefix `x_` for element `y` or prefix `x` for element `_y`).

Prefixed names consist of the name of the feature, followed by two underscores, followed by the name of the element, which can be any valid [GraphQL name](https://spec.graphql.org/draft/#Name). For instance, the `core` specification (which you are currently reading) introduces an element named [{@link}](#@link), and the `join` specification introduces an element named {@join__field} (among others).

Note that both parts must be valid GraphQL names, and GraphQL names cannot start with digits, so core feature specifications cannot introduce names like `@feature__24hours`.

A feature's *root directive* is an exception to the prefixing requirements. Feature specifications MAY introduce a single directive which carries only the name of the feature, with no prefix required. For example, the `core` specification introduces a {@link} directive. This directive has the same name as the feature ("`core`"), and so requires no prefix.

```graphql example -- Using the @link directive without changing the prefix
schema
 @link(url: "https://specs.apollo.dev/link/v1.0")
 @link(url: "https://spec.example.com/example/v1.0") {
  query: Query
}

type User {
  name: String @example(data: ITEM)
}

# An enum used to provide structured data to the example spec.
# It is prefixed with the name of the spec.
enum example__Data {
  ITEM
}

directive @example(data: example__Data) on FIELD_DEFINITION

directive @link(url: String!, as: String) repeatable on SCHEMA
```

The prefix MUST NOT be elided within documentation; definitions of schema elements provided within the spec MUST include the feature's name as a prefix.

## Elements which must be prefixed

Feature specs MUST prefix the following schema elements:
  - the names of any object types, interfaces, unions, enums, or input object types defined by the feature
  - the names of any directives introduced in the schema, with the exception of the *root directive*, which must have the same name as the schema

:::[example](prefixing.graphql) -- Prefixing
