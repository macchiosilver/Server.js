/*! @license MIT ©2015-2016 Miel Vander Sande, Ghent University - imec */
/* A SummaryRdfViewExtension extends the Quad Pattern Fragments RDF view with a summary link. */

var RdfView = require('@ldf/core').views.RdfView;

var ds = 'http://semweb.mmlab.be/ns/datasummaries#';

// Creates a new SummaryRdfViewExtension
class SummaryRdfViewExtension extends RdfView {
  constructor(settings) {
    super('QuadPatternFragments:After', settings);
  }

  // Generates triples and quads by sending them to the data and/or metadata callbacks
  _generateRdf(settings, data, metadata, done) {
    // If summaries are enabled, connect the datasource to its summary
    // TODO: summary should be of/off per dataset
    if (settings.summaries) {
      // TODO: summary URL should be generated by router
      metadata(settings.datasource.url, ds + 'hasDatasetSummary',
               settings.baseURL + 'summaries' + encodeURIComponent(settings.query.datasource));
    }
    done();
  }
}

module.exports = SummaryRdfViewExtension;
