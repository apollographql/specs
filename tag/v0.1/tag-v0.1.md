# tag v0.1

<h2>for tagging GraphQL schema elements with names</h2>

```raw html
<table class=spec-data>
  <tr><td>Status</td><td>Release</td>
  <tr><td>Version</td><td>0.1</td>
</table>
<link rel=stylesheet href=https://specs.apollo.dev/apollo-light.css>
<script type=module async defer src=https://specs.apollo.dev/inject-logo.js></script>
```

This document defines a [core feature](https://specs.apollo.dev/core) named `tag` for labeling schema elements with arbitrary names (or tags).

This specification provides machinery to apply arbitrary tags to schema elements via the application of `@tag` directive usages. Tags can be applied to field, object, interface, and union definitions.

# How to read this document

This document uses [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) guidance regarding normative terms: MUST / MUST NOT / REQUIRED / SHALL / SHALL NOT / SHOULD / SHOULD NOT / RECOMMENDED / MAY / OPTIONAL.

## What this document isn't

This document specifies only the definition of the `@tag` directive. Tags have a number of useful applications including metadata and schema processing, none of which are specified within this document.

# Example: Team Ownership Metadata

The following example demonstrates how team ownership over types and fields can be declaratively expressed via inline metadata. One might imagine a CI workflow which analyzes a schema diff and uses `@tag` names to authorize or require approval for changes to parts of the graph.

:::[example](ownership-example.graphql)

# Overview

*This section is non-normative.* It describes the motivation behind the directives defined by this specification.

The `@tag` directive is, in its simplest form, a mechanism for applying arbitrary string metadata to the fields and types of a schema. This metadata is potentially useful throughout the schema's lifecycle, including, but not limited to, processing, static analysis, and documentation.

#! @tag

A schema which implements the `@tag` spec MUST provide a definition which is compatible with the definition below:

:::[definition](tag-v0.1.graphql#@tag)