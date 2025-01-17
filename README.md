# Ontodia Graph Explorer

Ontodia Graph Explorer can be used to explore any remote Jena Fuseki/SPARQL endpoint.

Usage:

```sh
docker run --rm \
  -p 8002:80 \
  -e ENDPOINT_URL=http://localhost:3030/geods \
  -e LUCENE_SEARCH=no \
  aksw/ontodia
```

The instance search field can be directed to Jena's Lucene index if you have it configured on your Fuseki Dataset:


```sh
... \
  -e LUCENE_SEARCH=yes \
...
```

Or with docker compose:

```yml
services:
  ontodia:
    image: aksw/ontodia
    environment:
      - ENDPOINT_URL=http://localhost:3030/geods
      - LUCENE_SEARCH=no
    ports:
      - 8002:80
```

To fill in the Ontology tree on the left, upload the ontology file(s) into the dataset.


# Technical details

## Note

the correct Node version is

`node --version`

```
v18.14.2
```

### Installation

`npm install graph-explorer`

## Building the ontodia graph explorer

```
BUNDLE_PEERS=true ./node_modules/.bin/webpack --config webpack.demo.config.js
```

the files are output to

`dist/examples`

folder.

# Original readme

## Graph Explorer
[![npm version](https://badge.fury.io/js/graph-explorer.svg)](https://www.npmjs.com/package/graph-explorer)
![CI status](https://github.com/zazuko/graph-explorer/workflows/Node.js%20CI/badge.svg)

Do you work with graph-based data and find it difficult to understand the underlying model?

Is your graph growing rapidly and you are looking for an exploratory tool to better understand how your knowledge graph is linked?

Are you looking for a way to document your schema, ontology or data for others?

Then Graph Explorer is the tool for you!

Graph Explorer is a JavaScript-based application and library that helps you visualize, navigate, and explore RDF-based knowledge graphs and data sources. It can be configured to work with one or more SPARQL endpoints, and it can load RDF resources from the web.

In short, Graph Explorer helps you, your team, and the world better access and understand linked data.

Graph Explorer is a fork of [Ontodia](https://github.com/metaphacts/ontodia), which is now part of [Metaphacts](https://metaphacts.com/). In an effort to further develop its open-source version, we decided to fork, maintain and extend the codebase where needed. Contributions from any partners are very welcome!

### Features

- Visual navigation and diagramming over large graph data sets
- Rich graph visualization and context-aware navigation features 
- Ability to store and retrieve diagrams
- User friendly - no graph query language or prior knowledge of the schema required
- Customizable user interface (by modifying templates for nodes and links) and data storage back-end

### Examples

`npm run demo` and open <http://localhost:10444/>

### Installation

`npm install graph-explorer`

### Building / Publishing

```
npm run build-all
npm run typings
<bump>
npm publish
```
