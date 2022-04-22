Core schemas provide tools for linking definitions from different GraphQL schemas together into one.

```graphql example -- linking a directive from another schema
extend schema
  #          👇🏽 schemas are identified by a url
  @link(url: "https://internal.example.com/admin")

type Query {
  allUsers: [User] @admin__adminOnly # 👈🏽 remote identifier, namespaced
}
```

```graphql example -- importing a directive from another schema
extend schema
  #               specific definitions can be imported 👇🏽 
  @link(url: "https://internal.example.com/admin", import: ["@adminOnly"])

type Query {
  allUsers: [User] @adminOnly # 👈🏽 remote identifier, imported
}
```

This document introduces a set of conventions for linking and namespacing within GraphQL schemas. Core schemas are not a new kind of document and do not introduce any new syntax—they are just GraphQL schemas which can be interpreted according to the conventions outlined in this doc.
