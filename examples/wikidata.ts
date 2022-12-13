import { createElement, ClassAttributes } from 'react';
import * as ReactDOM from 'react-dom';

import {
  Workspace,
  WorkspaceProps,
  SparqlDataProvider,
  SparqlQueryMethod,
  WikidataSettings,
  SparqlDataProviderSettings,
} from '../src/graph-explorer/index';

import {
  onPageLoad,
  tryLoadLayoutFromLocalStorage,
  saveLayoutToLocalStorage,
} from './common';

const FWikidataSettings: SparqlDataProviderSettings = {
  ...WikidataSettings,
  ...{
     fullTextSearch: {
       prefix: 'PREFIX text: <http://jena.apache.org/text#>\n',
       queryPattern: `
                 (?inst ?score) text:query (rdfs:label "\${text}").
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
     linkTypesInfoQuery: `SELECT ?link ?label WHERE {
       VALUES(?link) {\${ids}}
       OPTIONAL { ?link \${schemaLabelProperty} ?label . filter(lang(?label)="en") }
       optional { ?link ^<http://wikiba.se/ontology#directClaim>/\${schemaLabelProperty} ?label . filter(lang(?label)="en") }
     }`,
     propertyInfoQuery: `SELECT ?property ?label WHERE {
       VALUES(?property) {\${ids}}
       OPTIONAL { ?property \${schemaLabelProperty} ?label . filter(lang(?label)="en") }
       optional { ?property ^<http://wikiba.se/ontology#directClaim>/\${schemaLabelProperty} ?label . filter(lang(?label)="en") }
     }`,
     filterTypePattern: `?inst wdt:P31/wdt:P279* ?class`,
     filterAdditionalRestriction: `FILTER ISIRI(?inst) `,
     filterElementInfoPattern: `OPTIONAL {?inst wdt:P31 ?foundClass}
       BIND (coalesce(?foundClass, owl:Thing) as ?class)
       OPTIONAL {
         service <loop:> {
           select ?inst ?label {
             {
               ?inst rdfs:label ?label
               filter(lang(?label)="en")
             } union {
               ?inst rdfs:label ?label
             }
           } limit 1
         }
       }
     `,
           // select distinct ?class ?parent {
           //   {
           //     ?class wdt:P279 wd:Q35120.
           //   } UNION {
           //     ?parent wdt:P279 wd:Q35120.
           //     ?class wdt:P279 ?parent.
           //   } UNION {
           //     ?parent wdt:P279/wdt:P279 wd:Q35120.
           //     ?class wdt:P279 ?parent.
           //   }             
           // }
     classTreeQuery: `
       SELECT distinct ?class ?label ?parent WHERE {
         {
           service <cache:> {
             ?parent wdt:P279* wd:Q35120.
             ?class wdt:P279 ?parent.
           }
         }
         service <loop:> {
           optional {
             select ?class ?label {
               {
                 ?class rdfs:label ?label.
                 filter(lang(?label)="en")
               } union {
                 ?class rdfs:label ?label.
               }
             } limit 1
           }
         }
       }`,
     imageQueryPattern: `service <loop:> {
         {
           ?inst ?linkType ?fullImage
         } union {
           ?inst wdt:P163/wdt:P18 ?fullImage
         }
       }
       BIND(CONCAT("https://commons.wikimedia.org/w/thumb.php?f=",
                   STRAFTER(STR(?fullImage), "Special:FilePath/"), "&w=200") AS ?image)`,
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
        endpointUrl: 'https://skynet.coypu.org/wikidata/',
        imagePropertyUris: [
         'http://www.wikidata.org/prop/direct/P18',
         'http://www.wikidata.org/prop/direct/P154',
        ],
        queryMethod: SparqlQueryMethod.POST,
      },
      {...FWikidataSettings,
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
