const {
    format
} = require('util'), {
    head,
    put,
    post
} = require('http-request-promise-simple');

/**
 *
 *
 * @class ElasticSearchRestLogger
 */
module.exports = class ElasticSearchRestLogger {
    /**
     * Creates an instance of ElasticSearchRestWinstonTransport.
     * @param {Object} opts
     * @param {String} opts.host Host url where Elastic Search is hosted. Default: localhost
     * @param {Number} opts.port Port to use to access the Elastic Search server. Default: 9200
     * @param {String} opts.logPrefix Prefix to be inserted on the index name before the date.
     * If logPrefix is hello then the index name for the date 28-10-2018 would be 'logs-hello-28-10-2018'
     * @param {String} opts.logIndexTemplate Elastic Search Index Template used for the index creation
     * @param {String} opts.logIndexTemplateName Name of the Elastic Search Index Template
     * @memberof ElasticSearchRestWinstonTransport
     */
    constructor(opts) {
        /* We combine our options with the default ones */
        opts = Object.assign({
            host: 'localhost',
            port: 9200,
            consoleLogger: true,
            logType: 'generic'
        }, opts);
        this.host = opts.host;
        this.port = opts.port;
        this.logType = opts.logType;
        this.logIndexTemplate = opts.logIndexTemplate;
        this.logIndexTemplateName = opts.logIndexTemplateName;
        this.consoleLogger = opts.consoleLogger;
    }

    async init() {
        await this.verifyTemplateExists()
        await this.verifyIndexExists();
    }


    /**
     * Generates the index name based on the current date
     *
     * @returns
     * @memberof ElasticSearchRestWinstonTransport
     */
    getIndexName() {
        const now = new Date(),
            day = now.getDate(),
            month = now.getMonth(),
            year = now.getFullYear();
        return `log-${this.logType}-${day}-${month}-${year}`;
    }

    /**
     * Verifies if the required index template does
     * exist
     *
     * @memberof ElasticSearchRestWinstonTransport
     */
    async verifyTemplateExists() {
        try {
            await head({
                hostname: this.host,
                path: '_template/log_template',
                port: this.port,
            })
        } catch (error) {
            await this.createTemplate();
        }

    }

    /**
     * Creates a index template for the logs in the 
     * Elastic Search Server
     *
     * @memberof ElasticSearchRestWinstonTransport
     */
    async createTemplate() {
        try {
            await post({
                hostname: this.host,
                path: '_template/log_template',
                port: this.port,
                headers: {
                    "Content-Type": "application/json"
                },
            }, JSON.stringify(this.logIndexTemplate))
        } catch (err) {
            console.error(format('ERROR: Creating template: %j', err));
        }

    }

    /**
     * Verifies if the required index exists
     *
     * @memberof ElasticSearchRestWinstonTransport
     */
    async verifyIndexExists() {
        const indexName = this.getIndexName();
        try {
            await head({
                hostname: this.host,
                path: `/${indexName}`,
                port: this.port,
            })
        } catch (err) {
            await this.createIndex();
        }

    }

    /**
     * Creates the index in elastic search where we will 
     * store our logs
     *
     * @memberof ElasticSearchRestWinstonTransport
     */
    async createIndex() {
        const indexName = this.getIndexName();
        try {
            await put({
                hostname: this.host,
                path: `/${indexName}`,
                port: this.port,
                headers: {
                    "Content-Type": "application/json"
                },
            }, JSON.stringify({}))
        } catch (err) {
            console.error(format('ERROR: Creating index: %j', err));
        }

    }

    /**
     * Log implementation that stores our logs in the 
     * Elastic Search database
     *
     * @param {*} info the information to be logged by winston
     * @param {*} callback Not necesary, it has to be executed
     * for winston to work
     * @memberof ElasticSearchRestWinstonTransport
     */
    async log(level, data) {
        try {
            await this.verifyTemplateExists();
            await this.verifyIndexExists();
            let postData;
            if (typeof data === 'string') {
                postData = {
                    message: data,
                    level: level,
                    timestamp: new Date()
                }
            } else {
                postData = Object.assign(data, {
                    level: level,
                    timestamp: new Date()
                })
            }

            await post({
                hostname: this.host,
                path: `/${this.getIndexName()}/logs`,
                port: this.port,
                headers: {
                    "Content-Type": "application/json"
                },
            }, JSON.stringify(postData));
        } catch (err) {
            console.error(format('ERROR: Logging: %j', err));
        }
    }

    async info(data) {
        if (this.consoleLogger) console.info(`${new Date().toISOString()} INFO: data: ${JSON.stringify(data)}`);
        await this.log('info', data);
    }

    async warn(data) {
        if (this.consoleLogger) console.warn(`${new Date().toISOString()} WARN: data: ${JSON.stringify(data)}`);
        await this.log('warn', data);
    }

    async error(data) {
        if (this.consoleLogger) console.error(`${new Date().toISOString()} ERROR: data: ${JSON.stringify(data)}`);
        await this.log('error', data);
    }


}