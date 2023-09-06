import { createElement, ClassAttributes } from 'react';
import * as ReactDOM from 'react-dom';

import {
  Workspace,
  WorkspaceProps,
  SparqlDataProvider,
  SparqlQueryMethod,
  OWLRDFSSettings,
  SparqlDataProviderSettings,
} from '../src/graph-explorer/index';

import {
  ElementIri
} from '../src/graph-explorer/data/model';

import {
  onPageLoad,
  tryLoadLayoutFromLocalStorage,
  tryLoadFromNamedResources,
  saveLayoutToLocalStorage,
} from './common';

const CoyPuSettings: SparqlDataProviderSettings = {
  ...OWLRDFSSettings,
  ...{
     // filterTypePattern: `?instType rdfs:subClassOf* ?class . ?inst a ?instType `,
     defaultPrefix: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl:  <http://www.w3.org/2002/07/owl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
     `,
     dataLabelProperty: 'rdfs:label|skos:prefLabel',
     filterTypePattern: `?inst a/rdfs:subClassOf* ?class `,
     fullTextSearch: {
       prefix: 'PREFIX text: <http://jena.apache.org/text#>\n',
       queryPattern: `
                 (?inst ?score) text:query "\${text}".
           `,
     },
     classTreeQuery: `
       PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
       PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
       PREFIX owl:  <http://www.w3.org/2002/07/owl#>
       PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
     
       SELECT distinct ?class ?label ?parent WHERE {
         {
           ?class a owl:Class .
           OPTIONAL { ?class rdfs:label ?label } .
           OPTIONAL { ?class rdfs:subClassOf ?parent_ . filter(!isblank(?parent_)) . } .
           BIND(coalesce(?parent_, if(contains(str(?class),"/meta"), owl:MetaThing, owl:Thing)) AS ?parent) .
	 } UNION {
	   ?class a skos:Concept ;
	          skos:inScheme ?scheme .
           OPTIONAL { ?class skos:prefLabel ?label } .
           OPTIONAL { ?class skos:broader ?parent_ . filter(!isblank(?parent_)) . } .
	   BIND(coalesce(?parent_, ?scheme) AS ?parent) .
	 } UNION {
	   { SELECT ?class SAMPLE(?label) {
	       [] skos:inScheme ?class .
	       OPTIONAL { ?class skos:prefLabel|rdfs:label ?label }
	     } GROUP BY ?class } .
	   BIND(skos:ConceptScheme AS ?parent) .
	 }
       }`
  },
};

function queryInternalCoypu(params: {
  url: string;
  body?: string;
  headers: any;
  method: string;
}) {
  return fetch(params.url, {
    method: params.method,
    body: params.body,
    // @ts-expect-error
    credentials: '@FETCH_CREDENTIALS@',
    mode: 'cors',
    cache: 'default',
    headers: params.headers,
  });
}

function onWorkspaceMounted(workspace: Workspace) {
  if (!workspace) {
    return;
  }

  const dataProvider = new SparqlDataProvider(
    {
      endpointUrl: '@ENDPOINT_URL@',
      queryFunction: queryInternalCoypu,
      imagePropertyUris: [
        'http://xmlns.com/foaf/0.1/depiction',
        'http://xmlns.com/foaf/0.1/img',
      ],
      queryMethod: SparqlQueryMethod.POST,
    },
    {...CoyPuSettings,
     ...{
     }
    }
  );

  const localDiagram = tryLoadLayoutFromLocalStorage();
  let next;
  if (!localDiagram && window.location.hash.length > 2 && window.location.hash.slice(0, 2) === '#!') {
    const remote = window.location.hash.slice(2);
    next = fetch('https://diagramstore.aksw.org/' + remote)
      .then((res) => res.json());
  } else {
    next = Promise.resolve(localDiagram);
  }
  next.then((diagram) => {
    workspace.getModel().importLayout({
      diagram,
      validateLinks: true,
      dataProvider
    });
    if (!diagram) {
      tryLoadFromNamedResources(workspace);
    }
  });
}

const props: WorkspaceProps & ClassAttributes<Workspace> = {
  ref: onWorkspaceMounted,
  onSaveDiagram: (workspace) => {
    const diagram = workspace.getModel().exportLayout();
    window.location.hash = saveLayoutToLocalStorage(diagram);
    fetch(
      'https://diagramstore.aksw.org', {
	method: 'POST',
	body: JSON.stringify(diagram)
      })
      .then((res) => res.json())
      .then((json) => {
	window.location.hash = '!' + json.data.frag;
      })
      .finally(() => {
	window.location.reload();
      });
  },
  viewOptions: {
    onIriClick: ({ iri }) => window.open(iri),
  },
};

onPageLoad((container) => {
  ReactDOM.render(createElement(Workspace, props), container);
});
