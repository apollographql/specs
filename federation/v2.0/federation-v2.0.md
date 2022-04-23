# federation v2.0

```raw html
<table class=spec-data>
  <tr><td>Status</td><td>Release</td>
  <tr><td>Version</td><td>2.0</td>
</table>
<link rel=stylesheet href=/apollo-light.css>
<script type=module async defer src=/inject-logo.js></script>
```

#! @key

```graphql definition
directive @key(fields: FieldSet!) repeatable on OBJECT | INTERFACE
```

The `@key` directive is used to indicate a combination of fields that can be used to uniquely identify and fetch an object or interface.

```graphql example -- using {@key}
type Product @key(fields: "upc") {
  upc: UPC!
  name: String
}
```

Multiple keys can be defined on a single object type:

```graphql example -- defining multiple {@key}s
type Product @key(fields: "upc") @key(fields: "sku") {
  upc: UPC!
  sku: SKU!
  name: String
}
```

Note: Repeated directives (in this case, `@key`, used multiple times) require support by the underlying GraphQL implementation.


#! @provides

```graphql definition
directive @provides(fields: FieldSet!) on FIELD_DEFINITION
```

The `@provides` directive is used to annotate the expected returned fieldset from a field on a base type that is guaranteed to be selectable by the gateway. Given the following example:

```graphql example -- using {@provides}
type Review @key(fields: "id") {
  product: Product @provides(fields: "name")
}

extend type Product @key(fields: "upc") {
  upc: String @external
  name: String @external
}
```

When fetching `Review.product` from the Reviews service, it is possible to request the `name` with the expectation that the Reviews service can provide it when going from review to product. `Product.name` is an external field on an external type which is why the local type extension of `Product` and annotation of `name` is required.
"""

#! @requires

```graphql definition
directive @requires(fields: FieldSet!) on FIELD_DEFINITION
```

The `@requires` directive is used to annotate the required input fieldset from a base type for a resolver. It is used to develop a query plan where the required fields may not be needed by the client, but the service may need additional information from other services. For example:

```graphql example -- using {@requires}
# extended from the Users service
extend type User @key(fields: "id") {
  id: ID! @external
  email: String @external
  reviews: [Review] @requires(fields: "email")
}
```

In this case, the Reviews service adds new capabilities to the `User` type by providing a list of `reviews` related to a user. In order to fetch these reviews, the Reviews service needs to know the `email` of the `User` from the Users service in order to look up the reviews. This means the `reviews` field / resolver *requires* the `email` field from the base `User` type.

#! @external

```graphql definition
directive @external on FIELD_DEFINITION
```

The `@external` directive is used to mark a field as owned by another service. This allows service A to use fields from service B while also knowing at runtime the types of that field. For example:

```graphql example -- using {@external}
# extended from the Users service
extend type User @key(fields: "email") {
  email: String @external
  reviews: [Review]
}
```

This type extension in the Reviews service extends the `User` type from the Users service. It extends it for the purpose of adding a new field called `reviews`, which returns a list of `Review`s.

#! FieldSet

```graphql definition
scalar FieldSet
```

A set of fields. 

```graphql example -- Using `FieldSet` with a single field in a `@key`
type User @key(fields: "id") {
  id: ID! @external
}
```

```graphql example -- Using `FieldSet` with a multiple fields
type User @key(fields: "uid realm") {
  uid: String
  realm: String
}
```

Deeply nested fields are supported with standard GraphQL syntax

```graphql example -- `FieldSet` with nested fields
type User @key(fields: "contact { email }") {
  contact: Contact
}

type Contact {
  email: String
}
```

Field arguments are not supported.

```graphql counter-example -- `FieldSet` does not support field arguments
type User @key(fields: "emails(first: 1)") {
  emails(first: Int): [String]
}
```