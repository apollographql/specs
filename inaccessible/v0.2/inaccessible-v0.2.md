# inaccessible v0.2

<h2>for removing elements from a core schema</h2>

```raw html
<table class=spec-data>
  <tr><td>Status</td><td>Release</td>
  <tr><td>Version</td><td>0.2</td>
</table>
<link rel=stylesheet href=https://specs.apollo.dev/apollo-light.css>
<script type=module async defer src=https://specs.apollo.dev/inject-logo.js></script>
```

#! @inaccessible

:::[definition](./inaccessible-v0.2.graphql#@inaccessible)

Mark a location within the schema as inaccessible. Inaccessible types and fields are available internally, but not exposed through the public-facing API:

```graphql example -- input schema
extend schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://specs.apollo.dev/inaccessible/v0.2")

type Query {  
  myself: User
  allUsers: [User] @inaccessible
}

type User {
  id: ID!
  secret: String! @inaccessible
}
```

```graphql example -- API schema for input
type Query {
  myself: User
}

type User {
  id: ID!
}
```

# Definitions

This document uses [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) guidance regarding normative terms: MUST / MUST NOT / REQUIRED / SHALL / SHALL NOT / SHOULD / SHOULD NOT / RECOMMENDED / MAY / OPTIONAL.

## Processor

This specification makes references to **Processors**. Processors are described in the [Actors section of the `@core` spec](https://specs.apollo.dev/core/v0.2/#sec-Actors) as an actor which can perform transformations on a core schema. In the case of `@inaccessible`, the Processor will be expected to remove various parts of a core schema.

# Example: Sensitive User Data

*This section is non-normative.*

We'll refer to this example of a core schema with sensitive user data throughout the document:

:::[example](./schema.graphql) -- Core schema example

The schema above contains both a field (`User.id`) and type (`BankAccount`) that are marked as `@inaccessible`. These symbols should be omitted from the processed schema anywhere they would appear. When the processed schema below is generated from this core schema, notice what has been removed:
* `User.id` field
* `BankAccount` type
* `User.bankAccount` field
* `Account` union's `BankAccount` type

:::[example](./processedSchema.graphql) -- Core schema after processing

# Determining the public API

The processor implementing {@inaccessible} MUST ensure that it returns a public-facing API with all {@inaccessible} items removed:

- Field Definitions marked with `@inaccessible` MUST be excluded
- Object types marked with `@inaccessible` MUST be excluded
- Object types marked with `@inaccessible` MUST be excluded from membership in any unions
- Interfaces marked with `@inaccessible` MUST be excluded
- Interfaces marked with `@inaccessible` MUST be excluded from the `extends` clause of all other interfaces
- Union types marked with `@inaccessible` MUST be excluded
- Enum types marked with `@inaccessible` MUST be excluded
- Enum values marked with `@inaccessible` MUST be excluded and MUST not be returned to users or accepted as input

Note: Applying this process may result in an invalid schema. For example, fields which return `@inaccessible` types which are not themselves marked `@inaccessible` will now return an invalid type which is not present in the schema. This is intentional. `@inaccessible` does NOT cascade. If applying `@inaccessible` results in an invalid schema, the serving process SHOULD apply standard polices to determine whether or how to serve it. Generally, invalid schemas SHOULD NOT be served, though some server configurations—particularly those used for development—may OPTIONALLY elect to serve such schemas in a degraded mode. The semantics of such a mode are not within the scope of this spec.