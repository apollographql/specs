# Validations &amp; Algorithms

This section lays out algorithms for processing core schemas.

Algorithms described in this section may produce *validation failures* if a document does not conform to the requirements core schema document. Validation failures SHOULD halt processing. Some consumers, such as authoring tools, MAY attempt to continue processing in the presence of validation failures, but their behavior in such cases is unspecified.

## Bootstrapping

Determine the name of the core specification within the document.

It is possible to [rename the core feature](#sec-Renaming-core-itself) within a document. This process determines the actual name for the core feature if one is present.

- **Fails** the *Has Schema* validation if there are no SchemaDefinitions in the document
- **Fails** the *Has Core Feature* validation if the `core` feature itself is not referenced with a {@link} directive within the document
- **Fails** the *Bootstrap Core Feature Listed First* validation if the reference to the `core` feature is not the first {@link} directive on the document's SchemaDefinition
- **Fails** the *Core Directive Incorrect Definition* validation if the {@link} directive definition does not *match* the directive as defined by this specification.

For the purposes of this algorithm, a directive's definition in a schema *matches* a definition provided in this specification if:
- Its arguments have the specified names, types, and default values (or lack thereof)
- It is defined as `repeatable` if and only if the specification's definition defines it as `repeatable`
- The set of locations it belongs to is the same set of locations in the specification's definition.

The following aspects may differ between the definition in the schema and the definition in the specification without preventing the definitions from *matching*:
- The name of the directive (due to [prefixing](#sec-Prefixing))
- The order of arguments
- The order of locations
- The directive's description string
- Argument description strings
- Directives applied to argument definitions

Bootstrap(document) :
1. Let {schema} be the only SchemaDefinition in {document}. (Note that legal GraphQL documents [must include at most one SchemaDefinition](http://spec.graphql.org/draft/#sec-Root-Operation-Types).)
  1. ...if no SchemaDefinitions are present in {document}, the ***Has Schema* validation fails**.
1. For each directive {d} on {schema},
  1. If {d} has a [`url:`](#@link/feature) argument which [parses as a feature URL](#@link/feature), *and* whose identity is {"https://specs.apollo.dev/core/"} *and* whose version is {"v0.1"}, *and either* {d} has an [`as:`](#@link/as) argument whose value is equal to {d}'s name *or* {d} does not have an [`as:`](#@link/as) argument and {d}'s name is `core`:
    - If any directive on {schema} listed before {d} has the same name as {d}, the ***Bootstrap Core Feature Listed First* validation fails**.
    - If the definition of the directive {d} does not *match* the [definition of {@link} in this specification](#@link), the ***Core Directive Incorrect Definition* validation fails**.
    - Otherwise, **Return** {d}'s name.
- If no matching directive was found, the ***Has Core Feature* validation fails**.

## Feature Collection

Collect a map of ({featureName}: `String`) -> `Directive`, where `Directive` is a {@link} Directive which introduces the feature named {featureName} into the document.

- **Fails** the *Name Uniqueness* validation if feature names are not unique within the document.
- **Fails** *Invalid Feature URL* validation for any invalid feature URLs.

CollectFeatures(document) :
  - Let {coreName} be the name of the core feature found via {Bootstrap(document)}
  - Let {features} be a map of {featureName}: `String` -> `Directive`, initially empty.
  - For each directive {d} named {coreName} on the SchemaDefinition within {document},
    - Let {specifiedFeatureName} and {version} be the result of parsing {d}'s `url:` argument according to the [specified rules for feature URLs](#@link/feature)
    - If the `url:` is not present or fails to parse:
      - The ***Invalid Feature URL* validation fails** for {d},
    - Let {featureName} be the {d}'s [`as:`](#@link/as) argument or, if the argument is not present, {specifiedFeatureName}
    - If {featureName} exists within {features}, the ***Name Uniqueness* validation fails**.
    - Insert {featureName} => {d} into {features}
  - **Return** {features}


Prefixes, whether implicit or explicit, must be unique within a document. Valid:

:::[example](prefixing.graphql#schema[0]) -- Unique prefixes

It is also valid to reference multiple versions of the same spec under different prefixes:

:::[example](prefix-uniqueness.graphql#schema[0]) -- Explicit prefixes allow multiple versions of the same spec to coexist within a Document

Without the explicit [`as:`](#@link/as), the above would be invalid:

:::[counter-example](prefix-uniqueness.graphql#schema[1]) -- Non-unique prefixes with multiple versions of the same spec

Different specs with the same prefix are also invalid:

:::[counter-example](prefix-uniqueness.graphql#schema[2]) -- Different specs with non-unique prefixes

## Assign Features

Create a map of {element}: *Any Named Element* -> {feature}: `Directive` | {null}, associating every named schema element within the document with a feature directive, or {null} if it is not associated with a feature.

AssignFeatures(document) :
  - Let {features} be the result of collecting features via {CollectFeatures(document)}
  - Let {assignments} be a map of ({element}: *Any Named Element*) -> {feature}: `Directive` | {null}, initally empty
  - For each named schema element {e} within the {document}
    - Let {name} be the name of the {e}
    - If {e} is a Directive and {name} is a key within {features},
      - Insert {e} => {features}`[`{name}`]` into {assignments}
      - **Continue** to next {e}
    - If {name} begins with {"__"},
      - Insert {e} => {null} into {assignments}
      - **Continue** to next {e}
    - If {name} contains the substring {"__"},
      - Partition {name} into `[`{prefix}, {base}`]` at the first {"__"} (that is, find the shortest {prefix} and longest {base} such that {name} = {prefix} + {"__"} + {base})
      - If {prefix} exists within {features}, insert {e} => {features}`[`{prefix}`]` into {assignments}
        - Else, insert {e} => {null} into {assignments}
      - **Continue** to next {e}
    - Insert {e} => {null} into {assignments}
  - **Return** {assignments}

## Is In API?

Determine if any schema element is included in the [API](#sec-Parts-of-a-Core-Schema) described by the core schema. A schema element is any part of a GraphQL document using type system definitions that has a [name](https://spec.graphql.org/draft/#Name).

IsInAPI(element) :
  - Let {assignments} be the result of assigning features to elements via {AssignFeatures(document)}
  - If {assignments}`[`{element}`]` is {null}, **Return** {true}
  - Else, **Return** {false}

Note: Later versions of this specification may add other ways to affect the behavior of this algorithm, but those mechanisms will only be enabled if you reference those hypothetical versions of this specification.

## Is Affected By Feature?

Determine if a schema element is *affected* by a given feature.

IsAffected(element, feature):
  - Let {assignments} be the result of assigning features to elements via {AssignFeatures(document)}
  - For each directive {d} on {element}, If {assignments}`[`{d}`]` is {feature}, **Return** {true}  
  - If {element} is a FieldDefinition,
    - Let {parent} be the parent ObjectDefinition or InterfaceDefinition for {element}
    - If {IsAffected(parent, feature)}, **Return** {true}
    - For each argument type {a} declared on {element},
      - Let {t} be the InputDefinition, EnumDefinition, or ScalarDefinition for argument {a}
      - If {IsAffected(t, feature)}, **Return** {true}
    - Let {return} be the ObjectDefinition, InterfaceDefinition, or UnionDefinition for {element}'s return type
    - If {IsAffected(return, feature)}, **Return** {true}
  - If {element} is an InputDefinition,
    - For each InputFieldDefinition {field} within {element},
      - Let {t} be the InputDefinition, EnumDefinition, or ScalarDefinition for the type of {field}
      - If {IsAffected(t, feature)}, **Return** {true}
  - If {element} is an EnumDefinition,
    - For each EnumValueDefinition {value} in {element},
      - If {IsAffected(value, feature)}, **Return** {true}