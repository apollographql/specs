# inaccessible v0.1

<h2>for removing elements from a core schema</h2>

```raw html
<table class=spec-data>
  <tr><td>Status</td><td>Release</td>
  <tr><td>Version</td><td>0.1</td>
</table>
<link rel=stylesheet href=https://specs.apollo.dev/apollo-light.css>
<script type=module async defer src=https://specs.apollo.dev/inject-logo.js></script>
```

This document defines the `@inaccessible` directive, which marks schema elements which should not be accessible in the public-facing schema. This version of the spec supports Object, Interface, and Union types.

# How to read this document

This document uses [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) guidance regarding normative terms: MUST / MUST NOT / REQUIRED / SHALL / SHALL NOT / SHOULD / SHOULD NOT / RECOMMENDED / MAY / OPTIONAL.

# Definitions

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

# Overview

*This section is non-normative.* It describes the motivation behind the directives defined by this specification.

A core schema which has been processed according to the inaccessible spec is a queryable graph, intended to be served by a [Data Core](https://specs.apollo.dev/core/v0.2/#sec-Actors). Various use cases require that fields and types should not be visible to or queried for by clients. The `@inaccessible` directive fulfills this requirement, providing schema authors a mechanism to specify which fields and types should be omitted from the processed schema.

# Basic Requirements

Schemas using {@inaccessible} must be valid [core schema documents](https://specs.apollo.dev/core/v0.2) and must reference [this specification](#).

Here is an example `@core` usage:

:::[example](./coreDirectives.graphql) -- required @core directives

As described in the [core schema specification](https://specs.apollo.dev/core/v0.2/#sec-Prefixing), your schema may rename the `@inaccessible` directive by including an `as` argument to the `@core` directive which references this specification. All references to `@inaccessible` in this specification MUST be interpreted as referring to names with the appropriate prefix chosen within your schema.

##! @inaccessible

In order to use the directive described by this specification, GraphQL requires you to include the definition in your schema.

:::[definition](./inaccessible-v0.1.graphql)

## Producer Responsibilities

[Producers](https://specs.apollo.dev/core/v0.2/#sec-Actors) MUST include a definition of the directive compatible with the above definition and all usages in the document.

## Processor Responsibilities

The Processor is responsible for excluding all inaccessible elements from the API. Within the API,

- Field Definitions marked with `@inaccessible` MUST be excluded
- Object types marked with `@inaccessible` MUST be excluded
- Object types marked with `@inaccessible` MUST be excluded from membership in any unions
- Interfaces marked with `@inaccessible` MUST be excluded
- Interfaces marked with `@inaccessible` MUST be excluded from the `extends` clause of all other interfaces
- Union types marked with `@inaccessible` MUST be excluded

Note applying this process may result in an invalid schema. For example, fields which return `@inaccessible` types which are not themselves marked `@inaccessible` will now return an invalid type which is not present in the schema. This is intentional. `@inaccessible` does NOT cascade. If applying `@inaccessible` results in an invalid schema, the serving process SHOULD apply standard polices to determine whether or how to serve it. Generally, invalid schemas SHOULD NOT be served, though some server configurations—particularly those used for development—MAY OPTIONALLY elect to serve such schemas in a degraded mode. The semantics of such a mode are not within the scope of this spec.