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
  onPageLoad,
  tryLoadLayoutFromLocalStorage,
  saveLayoutToLocalStorage,
} from './common';

const CoyPuSettings: SparqlDataProviderSettings = {
  ...OWLRDFSSettings,
  ...{
     // filterTypePattern: `?instType rdfs:subClassOf* ?class . ?inst a ?instType `,
     filterTypePattern: `?inst a/rdfs:subClassOf* ?class `,
     fullTextSearch: {
       prefix: 'PREFIX text: <http://jena.apache.org/text#>\n',
       queryPattern: `
                 (?inst ?score) text:query (rdfs:label "\${text}").
           `,
     },
     classTreeQuery: `
       PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
       PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
       PREFIX owl:  <http://www.w3.org/2002/07/owl#>
     
       SELECT distinct ?class ?label ?parent WHERE {
         ?class a owl:Class.
         OPTIONAL {?class rdfs:label ?label}.
         OPTIONAL { ?class rdfs:subClassOf ?parent_. filter(!isblank(?parent_)). }.
	 MINUS { ?class rdfs:subClassOf* <https://schema.coypu.org/world-port-index#EnumerationClass> }
         BIND(coalesce(?parent_, if(strstarts(str(?class),"https://schema.coypu.org/metadata"), <https://schema.coypu.org/metadata-template#MetaThing>, owl:Thing)) as ?parent).
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
    credentials: 'include',
    mode: 'cors',
    cache: 'default',
    headers: params.headers,
  });
}

function onWorkspaceMounted(workspace: Workspace) {
  if (!workspace) {
    return;
  }

  const diagram = tryLoadLayoutFromLocalStorage();
  workspace.getModel().importLayout({
    diagram,
    validateLinks: true,
    dataProvider: new SparqlDataProvider(
      {
        endpointUrl: 'https://skynet.coypu.org/coypu-internal/',
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
    ),
  });
}

const props: WorkspaceProps & ClassAttributes<Workspace> = {
  ref: onWorkspaceMounted,
  onSaveDiagram: (workspace) => {
    const diagram = workspace.getModel().exportLayout();
    window.location.hash = saveLayoutToLocalStorage(diagram);
    window.location.reload();
  },
  viewOptions: {
    onIriClick: ({ iri }) => window.open(iri),
  },
};

onPageLoad((container) => {
  ReactDOM.render(createElement(Workspace, props), container);
});
