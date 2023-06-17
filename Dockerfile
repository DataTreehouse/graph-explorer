FROM httpd:2.4

RUN rm -rf /usr/local/apache2/htdocs

COPY ./docker-index.html /usr/local/apache2/htdocs/index.html

COPY \
  ./dist/examples/commons.bundle.js \
  ./dist/examples/commons.bundle.js.map \
  ./logo.svg \
  /usr/local/apache2/htdocs/

COPY \
  ./dist/examples/fuseki-*.bundle.js \
  ./dist/examples/fuseki-*.bundle.js.map \
  /usr/local/apache2/htdocs/tpl/

RUN rm -rf /usr/local/apache2/htdocs/explorer.bundle.js /usr/local/apache2/htdocs/explorer.bundle.js.map

RUN chmod -R go+rX /usr/local/apache2/htdocs

COPY ./docker-start.sh /
CMD ["/docker-start.sh"]
