# join v0.2

<h2>for defining *supergraphs* which join multiple *subgraphs*</h2>

```raw html
<table class=spec-data>
  <tr><td>Status</td><td>Draft</td>
  <tr><td>Version</td><td>0.2</td>
</table>
<link rel=stylesheet href=https://specs.apollo.dev/apollo-light.css>
<script type=module async defer src=https://specs.apollo.dev/inject-logo.js></script>
```

```mermaid diagram -- Schema joining multiple subgraphs
graph LR
  classDef bg fill:none,color:#22262E;
  s1(auth.graphql):::bg-->core(composed schema: photos.graphql)
  s2(images.graphql):::bg-->core
  s3(albums.graphql):::bg-->core
  style core fill:none,stroke:fuchsia,color:fuchsia;
```

This document defines a number of directives `join` for describing joins between subgraph types in a supergraph.

This specification provides machinery to:
- define [subgraphs](#def-subgraph) with {@graph} and the {Graph} enum
- assign fields to subgraphs with {@field}
- declare additional data required and provided by subgraph field resolvers with the `requires` and `provides` arguments to {@field}
- assign [keys](#sec-Owned-fields-on-owned-types) to types with {@type}

# How to read this document

This document uses [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) guidance regarding normative terms: MUST / MUST NOT / REQUIRED / SHALL / SHALL NOT / SHOULD / SHOULD NOT / RECOMMENDED / MAY / OPTIONAL.

## What this document isn't

This document specifies only the structure and semantics of supergraphs. It's expected that a supergraph will generally be the output of a compilation process which composes subgraphs. The mechanics of that process are not specified normatively here. Conforming implementations may choose any approach they like, so long as the result conforms to the requirements of this document.

# Example: Photo Library

*This section is non-normative.*

We'll refer to this example of a photo library throughout the document:

:::[example](./photos.graphql) -- Photos library composed schema

The meaning of the `@join__*` directives in this example is explored in the [Directives](#sec-Directives) section.

The example represents **one way** to compose three input schemas, based on [federated composition](https://www.apollographql.com/docs/federation/federation-spec/). These schemas are provided for purposes of illustration only. This spec places no normative requirements on composer input. It does not require that subgraphs use federated composition directives, and it does not place any requirements on *how* the composer builds a supergraph, except to say that the resulting schema must be a valid supergraph document.

The [auth](./auth.graphql) subgraph provides the `User` type and `Query.me`.

:::[example](auth.graphql) -- Auth schema

The [images](./images.graphql) subgraph provides the `Image` type and `URL` scalar.

:::[example](./images.graphql) -- Images schema

The [albums](./albums.graphql) subgraph provides the `Album` type and extends `User` and `Image` with album information.

:::[example](./albums.graphql) -- Albums schema


# Actors

```mermaid diagram -- Actors and roles within an example composition pipeline
flowchart TB
    classDef bg fill:#EBE6FF;
    subgraph A [subgraph A]
      schemaA([schema A]):::bg
      style schemaA color:#000
      endpointA([endpoint A]):::bg
      style endpointA color:#000
    end
    style A fill:#FCFDFF,stroke:#CAD0D8,color:#777F8E;
    subgraph B [subgraph B]
      schemaB([schema B]):::bg
      style schemaB color:#000
      endpointB([endpoint B]):::bg
      style endpointB color:#000
    end
    style B fill:#FCFDFF,stroke:#CAD0D8,color:#777F8E;
    subgraph C [subgraph C]
      schemaC([schema C]):::bg
      style schemaC color:#000
      endpointC([endpoint C]):::bg
      style endpointC color:#000
    end
    style C fill:#FCFDFF,stroke:#CAD0D8,color:#777F8E;
    subgraph producer["Producer ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀"]
      Composer
      style Composer color:#000
    end
    style producer fill:#FCFDFF,stroke:#CAD0D8,color:#777F8E;
    supergraph([Supergraph]):::bg
    style supergraph color:#000
    subgraph consumer["Consumer ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀"]
      Router
      style Router color:#000
    end
    style consumer fill:#FCFDFF,stroke:#CAD0D8,color:#777F8E;
    A-->Composer:::bg
    B-->Composer:::bg
    C-->Composer:::bg
    Composer-->supergraphSchema([Supergraph Schema]):::bg
    style supergraphSchema color:#000
    supergraphSchema-->Router:::bg
    Router-->published([Published Schema]):::bg
    style published color:#000
    published-->Clients:::bg
    style Clients color:#000
    Clients-->Router:::bg
```

<a name=def-producer>**Producers**</a> generate supergraphs. This spec places requirements on supergraph producers.

<a name=def-consumer>**Consumers**</a> consume supergraphs. This spec places requirements on supergraph consumers.

<a name=def-composer>**Composers** (or **compilers**)</a> are producers which compose subgraphs into a supergraph. This document places no particular requirements on the composition algorithm, except that it must produce a valid supergraph.

<a namme=def-router>**Routers**</a> are consumers which serve a composed schema as a GraphQL endpoint. *This definition is non-normative.*
  - Graph routers differ from standard GraphQL endpoints in that they are not expected to resolve fields or communicate with (non-GraphQL) backend services on their own. Instead, graph routers receive GraphQL requests and service them by performing additional GraphQL requests. This spec provides guidance for implementing routers, but does not require particular implementations of query separation or dispatch, nor does it attempt to normatively separate routers from other supergraph consumers.
  - Routers expose an [API schema](https://specs.apollo.dev/core/v0.1/#sec-Parts-of-a-Core-Schema) to clients that is created by transforming the supergraph schema (for example, the {Graph} enum and the directives described in this spec are removed from the API schema). The API schema is used to validate client operations and may be exposed to clients via introspection.

<a name=def-endpoint>**Endpoints**</a> are running servers which can resolve GraphQL queries against a schema. In this version of the spec, endpoints must be URLs, typically http/https URLs.

<a name=def-subgraph>**Subgraphs**</a> are GraphQL schemas which are composed to form a supergraph. Subgraph names and metadata are declared within the special {Graph} enum.

This spec does not place any requirements on subgraph schemas. Generally, they may be of any shape. In particular, subgraph schemas do not need to be supergraphs themselves or to follow this spec in any way; neither is it an error for them to do so. Composers MAY place additional requirements on subgraph schemas to aid in composition; composers SHOULD document any such requirements.

# Overview

*This section is non-normative.* It describes the motivation behind the directives defined by this specification.

A supergraph schema describes a GraphQL schema that can be served by a router. The router does not contain logic to resolve any of the schema's fields; instead, the supergraph schema contains *join directives* which tell the router which subgraph endpoint can resolve each field, as well as other information needed in order to construct subgraph operations.

Each supergraph schema contains a list of its included subgraphs. The {Graph} enum represents this list with an enum value for each subgraph. Each enum value is annotated with a {@graph} directive telling the router what endpoint can be used to reach the subgraph, and giving the subgraph a human-readable name that can be used for purposes such as query plan visualization and server logs.

To resolve a field, the router needs to know to which subgraphs it can delegate the field's resolution. One explicit way to indicate this in a supergraph schema is by annotating the field with a {@field} directive specifying which subgraph should be used to resolve that field. (There are other ways of indicating which subgraphs can resolve a field which will be described later.)

In order for the router to send an operation that resolves a given field on a parent object to a subgraph, the operation needs to first resolve the parent object itself. There are several ways to accomplish this, described below. The examples below include abbreviated versions of the supergraph schemas which do not include the `schema` definition, directive definitions, or the {Graph} definition. This specification does not require the subgraph operations to be the same as those described in these examples; this is just intended to broadly describe the meanings of the directives.

## Root fields

If a field appears at the root of the overall operation (query or mutation), then it can be placed at the root of the subgraph operation.

```graphql example -- Root fields
# Supergraph schema
type Query {
  fieldA: String @join__field(graph: A)
  fieldAlsoFromA: String @join__field(graph: A)
  fieldB: String @join__field(graph: B)
}

# Operation
{ fieldA fieldAlsoFromA fieldB }
# Generated subgraph operations
## On A:
{ fieldA fieldAlsoFromA }
## On B:
{ fieldB }
```


## Fields on the same subgraph as the parent operation

If a field's parent field will be resolved by an operation on the same subgraph, then it can be resolved as part of the same operation, by putting it in a nested selection set on the parent field's subgraph operation. Note that this example contains {@type} directives on an object type; this will be described later.

```graphql example -- Fields on the same subgraph as the parent operation
# Supergraph schema
type Query {
  fieldA: X @join__field(graph: A)
}

type X @join__type(graph: A, key: "nestedFieldA") {
  nestedFieldA: String @join__field(graph: A)
}

# Operation
{ fieldA { nestedFieldA } }
# Generated subgraph operations
## On A:
{ fieldA { nestedFieldA }}
```

## Fields provided by the parent field

Sometimes, a subgraph {G} may be capable of resolving a field that is ordinarily resolved in a different subgraph if the field's parent object was resolved in {G}. Consider an example where the `Product.priceCents: Int!` field is usually resolved by the Products subgraph, which knows the `priceCents` for every `Product` in your system. In the Marketing subgraph, there is a `Query.todaysPromotion: Product!` field. While the Marketing subgraph cannot determine the `priceCents` of every product in your system, it does know the `priceCents` of the promoted products, and so the Marketing subgraph can resolve operations like `{ todaysPromotion { priceCents } }`.

When this is the case, you can include a `provides` argument in the {@field} listing these "pre-calculated" fields. The router can now resolve these fields in the "providing" subgraph instead of in the subgraph that would usually be used to resolve those fields.

```graphql example -- Provided fields
# Supergraph schema
type Query {
  todaysPromotion: Product! @join__field(graph: MARKETING, provides: "priceCents")
  randomProduct: Product! @join__field(graph: PRODUCTS)
}

type Product @join__owner(graph: PRODUCTS) @join__type(graph: PRODUCTS, key: "id") {
  id: ID! @join__field(graph: PRODUCTS)
  priceCents: Int! @join__field(graph: PRODUCTS)
}

# Operation showing that `priceCents` is typically resolved on PRODUCTS
{ randomProduct { priceCents } }
# Generated subgraph operations
## On PRODUCTS
{ randomProduct { priceCents } }

# Operation showing that `provides` allows `priceCents` to be resolved on MARKETING
{ todaysPromotion { priceCents } }
# Generated subgraph operations
## On MARKETING
{ todaysPromotion { priceCents } }
```

## Fields on value types

Some types have the property that all of their fields can be resolved by *any* subgraph that can resolve a field returning that type. These types are called *value types*. (Imagine a type `type T { x: Int, y: String }` where every resolver for a field of type `T` actually produces an object like `{x: 1, y: "z"}`, and the resolvers for the two fields on `T` just unpack the values already in the object.)

```graphql example -- Value types
# Supergraph schema
type Query {
  fieldA: X @join__field(graph: A)
  fieldB: X @join__field(graph: B)
}

type X {
  anywhere: String
}

# Operation
{ fieldA { anywhere } }
# Generated subgraph operations
## On A
{ fieldA { anywhere } }

# Operation
{ fieldB { anywhere } }
# Generated subgraph operations
## On B
{ fieldB { anywhere } }
```

# Enums

##! Graph

Enumerate subgraphs.

:::[definition](./join-v0.2.graphql#Graph)

Documents MUST define a {Graph} enum. Each enum value describes a subgraph. Each enum value MUST have a [{@graph}](#@graph) directive applied to it.

:::[example](photos.graphql#join__Graph) -- Using join__Graph to define subgraphs and their endpoints

The {Graph} enum is used as input to the {@type} and {@field} directives.

# Directives

##! @graph

:::[definition](./join-v0.2.graphql#@graph)

Declare subgraph metadata on {Graph} enum values. 

:::[example](photos.graphql#join__Graph) -- Using {@graph} to declare subgraph metadata on {Graph} enum values.

The {@graph} directive MUST be applied to each enum value on {Graph}, and nowhere else. Each application of {@graph} MUST have a distinct value for the `name` argument; this name is an arbitrary non-empty string that can be used as a human-readable identifier which may be used for purposes such as query plan visualization and server logs. The `url` argument is an endpoint that can resolve GraphQL queries for the subgraph.

##! @type

:::[definition](./join-v0.2.graphql#@type)

Declares an entity key for a type on a subgraph.

When this directive is placed on a type `T`, it means that subgraph `graph` MUST be able to:
- Resolve selections on objects of the given type that contain the field set in `key`
- Use `Query._entities` to resolve representations of objects containing `__typename: "T"` and the fields from the field set in `key`

:::[example](photos.graphql#Image) -- Using {@type} to specify subgraph keys

##! @field

:::[definition](./join-v0.2.graphql#@field)

Specify the graph that can resolve the field.

The field's parent type MUST be annotated with a {@type} with the same value of `graph` as this directive, unless the parent type is a [root operation type](http://spec.graphql.org/draft/#sec-Root-Operation-Types).

:::[example](photos.graphql#User...Image) -- Using {@field} to join fields to subgraphs

Every field on a root operation type MUST be annotated with {@field}.

:::[example](photos.graphql#Query) -- {@field} on root fields

The `provides` argument specifies fields that can be resolved in operations run on subgraph `graph` as a nested selection under this field, even if they ordinarily can only be resolved on other subgraphs.
