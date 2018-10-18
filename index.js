const {
    format
} = require('util'), {
    head,
    get,
    put,
    post,
    deleteRequest
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
     * @param {String} opts.logType Prefix to be inserted on the index name before the date.
     * If logPrefix is hello then the index name for the date 28-10-2018 would be 'logs-hello-28-10-2018'
     * @param {String} opts.logIndexTemplate Elastic Search Index Template used for the index creation
     * @param {String} opts.logIndexTemplateName Name of the Elastic Search Index Template
     * @param {Boolean} opts.logToConsole Defines if the logger should print to the console in parallel to elastic search
     * @param {Boolean} opts.console logger object with the info, warn and error methods. The user is given the option so 
     * it can override the default console
     * @memberof ElasticSearchRestWinstonTransport
     */
    constructor(opts) {
        /* We combine our options with the default ones */
        opts = Object.assign({
            host: 'localhost',
            port: 9200,
            console: console,
            logToConsole: true,
            logType: 'generic',
            logIndexTemplateName: 'log_template',
            logIndexTemplate: {
                "order": 1,
                "template": "logs-*",
                "settings": {
                    "index": {
                        "number_of_shards": "5",
                        "number_of_replicas": "3"
                    }
                },
                "mappings": {
                    "logs": {
                        "properties": {
                            "level": {
                                "type": "text"
                            },
                            "message": {
                                "type": "text"
                            },
                            "timestamp": {
                                "type": "date"
                            }
                        }
                    }
                },
                "aliases": {}
            }
        }, opts);
        this.host = opts.host;
        this.port = opts.port;
        this.logType = opts.logType;
        this.logIndexTemplate = opts.logIndexTemplate;
        this.logIndexTemplateName = opts.logIndexTemplateName;
        this.console = opts.console;
        this.logToConsole = opts.logToConsole;
    }

    async init() {
        const template = await this.verifyTemplateExists()
        const index = await this.verifyIndexExists();
        return {
            template,
            index
        }
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
        return `logs-${this.logType}-${day}-${month + 1}-${year}`;
    }

    /**
     * Verifies if the required index template does
     * exist
     *
     * @memberof ElasticSearchRestWinstonTransport
     */
    async verifyTemplateExists() {
        try {
            return await head({
                hostname: this.host,
                path: `_template/${this.logIndexTemplateName}`,
                port: this.port,
            })
        } catch (error) {
            return await this.createTemplate();
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
            return await post({
                hostname: this.host,
                path: `_template/${this.logIndexTemplateName}`,
                port: this.port,
                headers: {
                    "Content-Type": "application/json"
                },
            }, JSON.stringify(this.logIndexTemplate))
        } catch (err) {
            this.console.error(format('ERROR: Creating template: %j', err));
        }
    }

    async deleteTemplate() {
        return await deleteRequest({
            hostname: this.host,
            path: `_template/${this.logIndexTemplateName}`,
            port: this.port,
            headers: {
                "Content-Type": "application/json"
            },
        })
    }

    /**
     * Verifies if the required index exists
     *
     * @memberof ElasticSearchRestWinstonTransport
     */
    async verifyIndexExists() {
        const indexName = this.getIndexName();
        try {
            return await head({
                hostname: this.host,
                path: `/${indexName}`,
                port: this.port,
            })
        } catch (err) {
            return await this.createIndex();
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
            return await put({
                hostname: this.host,
                path: `/${indexName}`,
                port: this.port,
                headers: {
                    "Content-Type": "application/json"
                },
            }, JSON.stringify({}))
        } catch (err) {
            this.console.error(format('ERROR: Creating index: %j', err));
        }
    }

    async deleteIndex() {
        return await deleteRequest({
            hostname: this.host,
            path: `/${this.getIndexName()}`,
            port: this.port,
            headers: {
                "Content-Type": "application/json"
            },
        });
    }


    /**
     * Obtains logs
     *
     * @param {String} filter Elastic search 'q' parameter to filter results
     * @returns
     */
    async getLogs(filter) {
        const indexName = this.getIndexName();
        const path = filter ? `/${indexName}/logs/_search/?q=${filter}` : `/${indexName}/logs/_search/`;
        return await get({
            hostname: this.host,
            path: path,
            port: this.port,
            headers: {
                "Content-Type": "application/json"
            },
        })
    }

    /**
     * Obtains a particular log
     *
     * @param {String} id
     * @returns
     */
    async getLog(id) {
        const indexName = this.getIndexName();
        return await get({
            hostname: this.host,
            path: `/${indexName}/logs/${id}`,
            port: this.port,
            headers: {
                "Content-Type": "application/json"
            },
        })
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

            return await post({
                hostname: this.host,
                path: `/${this.getIndexName()}/logs`,
                port: this.port,
                headers: {
                    "Content-Type": "application/json"
                },
            }, JSON.stringify(postData));
        } catch (err) {
            this.console.error(format('ERROR: Logging: %j', err));
        }
    }

    get INFO() {
        return 'INFO';
    }

    get WARN() {
        return 'WARN';
    }

    get ERROR() {
        return 'ERROR';
    }

    /**
     * Obtains the logger used for the console output
     *
     * @readonly
     */
    get logConsole() {
        return console;
    }

    /**
     * Prints the data in a speciefied format to the console with info level
     *
     * @param {*} data
     * @returns
     */
    consoleLogInfo(data) {
        this.console.info(`${new Date().toISOString()} ${this.INFO}: data: ${JSON.stringify(data)}`);
    }

    /**
     * Prints the data in a speciefied format to the console with warn level
     *
     * @param {*} data
     * @returns
     */
    consoleLogWarn(data) {
        this.console.warn(`${new Date().toISOString()} ${this.WARN}: data: ${JSON.stringify(data)}`);
    }

    /**
     * Prints the data in a speciefied format to the console with error level
     *
     * @param {*} data
     * @returns
     */
    consoleLogError(data) {
        this.console.error(`${new Date().toISOString()} ${this.ERROR}: data: ${JSON.stringify(data)}`);
    }
    
    /**
     * Alias for the log method with a info level
     *
     * @param {*} data
     * @returns
     */
    async info(data) {
        if (this.console) this.consoleLogInfo(data);
        return await this.log(this.INFO, data);
    }

    /**
     * Alias for the log method with a info level
     *
     * @param {*} data
     * @returns
     */
    async warn(data) {
        if (this.logToConsole) this.consoleLogWarn(data);
        return await this.log(this.WARN, data);
    }

    /**
     * Alias for the log method with a info level
     *
     * @param {*} data
     * @returns
     */
    async error(data) {
        if (this.logToConsole) this.consoleLogError(data);
        return await this.log(this.ERROR, data);
    }


}