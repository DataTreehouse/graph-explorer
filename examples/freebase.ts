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

const FreebaseSettings: SparqlDataProviderSettings = {
  ...OWLRDFSSettings,
  ...{
     filterTypePattern: `?inst <http://rdf.freebase.com/ns/type.object.type> ?class `,
     fullTextSearch: {
       prefix: ``,
       elementFirst: true,
       queryPattern: `
                 ?inst rdfs:label ?label . filter(contains(?label, "\${text}")) .
           `,
     },
     linkTypesQuery: `SELECT DISTINCT ?link ?instcount ?label WHERE {
       service <cache:> {
         \${linkTypesPattern}
         OPTIONAL {
           ?link rdfs:label ?label .
           filter(lang(?label)="en").
         }.
       }
     }`,
     linkTypesPattern: `
      ?link <http://rdf.freebase.com/ns/type.object.type> <http://rdf.freebase.com/ns/type.property> .
      BIND('' as ?instcount)
     `,
     classTreeQuery: `
       PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
       PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
       SELECT distinct ?class ?label ?parent WHERE {
         service <cache:> {
           ?class a rdfs:Class.
	   filter(!strstarts(str(?class),"http://rdf.freebase.com/ns/user.")&&!strstarts(str(?class),"http://rdf.freebase.com/ns/base.")&&!strstarts(str(?class),"http://rdf.freebase.com/ns/freebase.")&&!strstarts(str(?class),"http://rdf.freebase.com/ns/m.")&&!strstarts(str(?class),"http://rdf.freebase.com/ns/g.")&&!strends(str(?class),".topic"))
           OPTIONAL {
             ?class rdfs:label ?label .
             filter(lang(?label)="en").
           }.
           bind(if(strstarts(str(?class),"http://rdf.freebase.com/ns/"),iri(replace(str(?class),"[./][^./]+$","")),coalesce()) as ?parent).
         }
       }`
  },
};

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
        endpointUrl: 'https://skynet.coypu.org/freebase/',
        imagePropertyUris: [
          'http://xmlns.com/foaf/0.1/depiction',
          'http://xmlns.com/foaf/0.1/img',
        ],
        queryMethod: SparqlQueryMethod.POST,
      },
      {...FreebaseSettings,
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
