# incremental v0.1

# Usage

## HTTP header

In order for the server to know that the client can parse the incremental delivery response format, the HTTP request must include the following header:

### Accept

`multipart/mixed;deferSpec=20220824`

## GraphQL directive

```graphql
"""
Used to imply de-prioritization, that causes the fragment to be omitted in the initial response, and delivered as a subsequent response afterward.

Arguments:
* `if: Boolean`
  * When `true` fragment may be deferred, if omitted defaults to `true`.
* `label: String`
  * A unique label across all `@defer` and `@stream` directives in an operation.
  * This `label` should be used by GraphQL clients to identify the data from patch responses and associate it with the correct fragment.
  * If provided, the GraphQL Server must add it to the payload.
"""
directive @defer(
  label: String
  if: Boolean! = true
) on FRAGMENT_SPREAD | INLINE_FRAGMENT

"""
This directive may be provided for a field of `List` type so that the backend can leverage technology such asynchronous iterators to provide a partial list in the initial response, and additional list items in subsequent responses.

Arguments:
* `if: Boolean`
  * When `true` field may be streamed, if omitted defaults to `true`.
* `label: String`
  * A unique label across all `@defer` and `@stream` directives in an operation.
  * This `label` should be used by GraphQL clients to identify the data from patch responses and associate it with the correct fragments.
  * If provided, the GraphQL Server must add it to the payload.
* `initialCount: Int`
  * The number of list items the server should return as part of the initial response.
"""
directive @stream(
  label: String
  if: Boolean! = true
  initialCount: Int = 0
) on FIELD
```

# GraphQL specification

Note: This document is a snapshot of the GraphQL specification used for reference purposes. It is based on a [commit](https://github.com/apollographql/graphql-spec/blob/48cf7263a71a683fab03d45d309fd42d8d9a6659/spec/GraphQL.md) that was used for the implementation of the feature in Apollo Router. The specification refers to both the `@defer` and `@stream` directives but Apollo Router only implemented the `@defer` directive.
