/*! @license MIT ©2015-2016 Ruben Verborgh, Ghent University - imec */
var CompositeDatasource = require('../../').datasources.CompositeDatasource;

var Datasource = require('@ldf/core').datasources.Datasource,
    HdtDatasource = require('@ldf/datasource-hdt').datasources.HdtDatasource,
    N3Datasource = require('@ldf/datasource-n3').datasources.N3Datasource,
    path = require('path');

var exampleHdtFile = path.join(__dirname, '../../../../test/assets/test.hdt');
var exampleHdtFileWithBlanks = path.join(__dirname, '../../../../test/assets/test-blank.hdt');
var exampleTurtleUrl = 'file://' + path.join(__dirname, '../../../../test/assets/test.ttl');
var exampleTrigUrl = 'file://' + path.join(__dirname, '../../../../test/assets/test.trig');

describe('CompositeDatasource', function () {
  var references = {
    data0: { settings: { file: exampleHdtFile }, datasourceType: HdtDatasource, size: 132 },
    data1: { settings: { file: exampleHdtFileWithBlanks, graph: 'http://example.org/graph0' }, datasourceType: HdtDatasource, size: 6 },
    data2: { settings: { url: exampleTurtleUrl }, datasourceType: N3Datasource, size: 132 },
    data3: { settings: { url: exampleTrigUrl }, datasourceType: N3Datasource, size: 7 },
  };
  Object.keys(references).forEach(function (datasourceId) {
    var datasource = references[datasourceId];
    var DatasourceType = datasource.datasourceType;
    var size = references[datasourceId].size;
    references[datasourceId] = new DatasourceType(datasource.settings);
    references[datasourceId].size = size;
    references[datasourceId].initialize();
  });
  var totalSize = Object.keys(references).reduce(function (acc, key) {
    return acc + references[key].size;
  }, 0);

  describe('The CompositeDatasource module', function () {
    it('should be a function', function () {
      CompositeDatasource.should.be.a('function');
    });

    it('should be an CompositeDatasource constructor', function (done) {
      var instance = new CompositeDatasource({ references: references });
      instance.should.be.an.instanceof(CompositeDatasource);
      instance.close(done);
    });

    it('should create CompositeDatasource objects', function (done) {
      var instance = new CompositeDatasource({ references: references });
      instance.should.be.an.instanceof(CompositeDatasource);
      instance.close(done);
    });

    it('should create Datasource objects', function (done) {
      var instance = new CompositeDatasource({ references: references });
      instance.should.be.an.instanceof(Datasource);
      instance.close(done);
    });
  });

  describe('A CompositeDatasource instance for 4 Datasources', function () {
    var datasource;
    function getDatasource() { return datasource; }
    before(function (done) {
      datasource = new CompositeDatasource({ references: references });
      datasource.initialize();
      datasource.on('initialized', done);
    });
    after(function (done) {
      datasource.close(done);
    });

    itShouldExecute(getDatasource,
      'the empty query',
      { features: { triplePattern: true } },
      totalSize, totalSize);

    itShouldExecute(getDatasource,
      'the empty quad query',
      { features: { quadPattern: true } },
      totalSize, totalSize);

    itShouldExecute(getDatasource,
      'the empty query with a limit',
      { limit: 10, features: { triplePattern: true, limit: true } },
      10, totalSize);

    itShouldExecute(getDatasource,
      'the empty query with an offset of 10',
      { offset: 10, features: { triplePattern: true, offset: true } },
      totalSize - 10, totalSize);

    itShouldExecute(getDatasource,
      'the empty query with an offset of 100',
      { offset: 100, features: { triplePattern: true, offset: true } },
      totalSize - 100, totalSize);

    itShouldExecute(getDatasource,
      'the empty query with an offset of 200',
      { offset: 200, features: { triplePattern: true, offset: true } },
      totalSize - 200, totalSize);

    itShouldExecute(getDatasource,
      'a query for an existing subject',
      { subject: 'http://example.org/s1',   limit: 10, features: { triplePattern: true, limit: true } },
      10, 200);

    itShouldExecute(getDatasource,
      'a query for a non-existing subject',
      { subject: 'http://example.org/p1',   limit: 10, features: { triplePattern: true, limit: true } },
      0, 0);

    itShouldExecute(getDatasource,
      'a query for an existing predicate',
      { predicate: 'http://example.org/p1', limit: 10, features: { triplePattern: true, limit: true } },
      10, 220);

    itShouldExecute(getDatasource,
      'a query for a non-existing predicate',
      { predicate: 'http://example.org/s1', limit: 10, features: { triplePattern: true, limit: true } },
      0, 0);

    itShouldExecute(getDatasource,
      'a query for an existing object',
      { object: 'http://example.org/o001',  limit: 10, features: { triplePattern: true, limit: true } },
      6, 6);

    itShouldExecute(getDatasource,
      'a query for a non-existing object',
      { object: 'http://example.org/s1',    limit: 10, features: { triplePattern: true, limit: true } },
      0, 0);

    itShouldExecute(getDatasource,
      'a query for an existing graph',
      { graph: 'http://example.org/bob',    limit: 10, features: { quadPattern: true, limit: true } },
      3, 3);

    itShouldExecute(getDatasource,
      'a query for a non-existing graph',
      { graph: 'http://example.org/notbob', limit: 10, features: { quadPattern: true, limit: true } },
      0, 0);

    itShouldExecute(getDatasource,
      'a query for the default graph',
      { graph: '',                          limit: 10, features: { quadPattern: true, limit: true } },
      10, 266);

    itShouldExecute(getDatasource,
      'a query for the default graph without a limit',
      { graph: '',                          features: { quadPattern: true, limit: true } },
      266, 266);

    itShouldExecute(getDatasource,
      'a query for graph0',
      { graph: 'http://example.org/graph0', limit: 10, features: { quadPattern: true, limit: true } },
      6, 6);
  });
});

function itShouldExecute(getDatasource, name, query,
                         expectedResultsCount, expectedTotalCount, expectedTriples) {
  describe('executing ' + name, function () {
    var resultsCount = 0, totalCount, triples = [];
    before(function (done) {
      var result = getDatasource().select(query);
      result.getProperty('metadata', function (metadata) { totalCount = metadata.totalCount; });
      result.on('data', function (triple) { resultsCount++; expectedTriples && triples.push(triple); });
      result.on('end', done);
    });

    it('should return the expected number of triples', function () {
      expect(resultsCount).to.equal(expectedResultsCount);
    });

    it('should emit the expected total number of triples', function () {
      expect(totalCount).to.equal(expectedTotalCount);
    });

    if (expectedTriples) {
      it('should emit the expected triples', function () {
        expect(triples.length).to.equal(expectedTriples.length);
        for (var i = 0; i < expectedTriples.length; i++)
          triples[i].should.deep.equal(expectedTriples[i]);
      });
    }
  });
}
