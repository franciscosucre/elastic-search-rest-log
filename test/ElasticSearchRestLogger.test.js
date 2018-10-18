let chai = require('chai'),
    chaiHttp = require('chai-http'),
    ElasticSearchRestLogger = require('../index'),
    LEVEL = 'LEVEL',
    MESSAGE = 'Hello World',
    logger = new ElasticSearchRestLogger({
        host: 'localhost',
        port: 9200,
        logPrefix: 'unit-test',
        logToConsole: false,
        logIndexTemplateName: 'unit-test-log-template'
    });



chai.should();
chai.use(chaiHttp);

//Our parent block
describe('ElasticSearchRestLogger', () => {

    before(async function () {
        await logger.init();
    })

    after(async function () {
        await logger.deleteIndex();
        await logger.deleteTemplate();
    });

    describe(`init`, () => {
        it('should return 200 code for the index creation and the template creation', async function () {
            const res = await logger.init();
            res.index.should.have.status(200);
            res.template.should.have.status(200);
        });
    });

    describe(`log`, () => {
        it('should create the log instance on the elastic search sending a string data', async function () {
            const res = await logger.log('LEVEL', 'Hello World');
            res.should.have.status(201);
            res._index.should.be.eql(logger.getIndexName());
            res._type.should.be.eql('logs')
            res.created.should.be.eql(true);
            const logRes = await logger.getLog(res._id);
            logRes._id.should.be.eql(res._id);
            const log = logRes._source;
            log.level.should.be.eql(LEVEL);
            log.message.should.be.eql(MESSAGE);
            log.should.have.property('timestamp');
        });

        it('should create the log instance on the elastic search sending an object data', async function () {
            const res = await logger.log('LEVEL', {
                message: 'Hello World',
                foo: 'fighters'
            });
            const logRes = await logger.getLog(res._id);
            const log = logRes._source;
            log.level.should.be.eql(LEVEL);
            log.message.should.be.eql(MESSAGE);
            log.foo.should.be.eql('fighters');
            log.should.have.property('timestamp');
        });
    });

    describe(`info`, () => {
        it('should create the log instance on the elastic search', async function () {
            const res = await logger.info('Hello World');
            const logRes = await logger.getLog(res._id);
            const log = logRes._source;
            log.level.should.be.eql(logger.INFO);
        });
    });

    describe(`warn`, () => {
        it('should create the log instance on the elastic search', async function () {
            const res = await logger.warn('Hello World');
            const logRes = await logger.getLog(res._id);
            const log = logRes._source;
            log.level.should.be.eql(logger.WARN);
        });
    });

    describe(`error`, () => {
        it('should create the log instance on the elastic search', async function () {
            const res = await logger.error('Hello World');
            const logRes = await logger.getLog(res._id);
            const log = logRes._source;
            log.level.should.be.eql(logger.ERROR);

        });
    });



});