# http-request-promise-simple

Dependency-less http methods for pure nodejs. The motive for this project was for have a simple logger with elastic search without depending on any driver o special software.

# ElasticSearchRestLogger

Logger class

**Options**
----------

- **host:** Url where the elastic search server is hosted. Default: localhost.
- **port:** port throught which the elastic search server is exposed. Default: 9200.
- **logType:** Used to create the index name. It's objective is to identify the project using the logger.
- **logIndexTemplate:** The template object used to create the Elastic Search template.
- **logIndexTemplateName:** Name for the template to be created on Elastic Search.
- **consoleLogger:** Enables a console logger that prints on the console in parallel to the Elastic Search logging. Default: True.


**Methods**
----------

- **init():** Verifies that the index and the template for the logs exist

- **getIndexName():** Obtains the log index name. By default, it follows the following format `log-${this.logType}-${day}-${month}-${year}`, if it does not satisfy your requirements, this method should be overriden.

- **verifyTemplateExists():** Verifies if the template exists. If not, it calls the createTemplate() method.

- **createTemplate():** Creates the elastic Search template.

- **verifyIndexExists():** Verifies if the index exists. If not, it calls the createIndex() method.

- **createIndex():** Creates the elastic Search index.

- **log(level, data):** Makes a post call to create the log in elastic search. If data is a simple string, it will be included in the message property of the log. If not, it will merge data with the default logger object.

- **info(data):** Alias for the log method with info as the log level.

- **warn(data):** Alias for the log method with warn as the log level.

- **error(data):** Alias for the log method with error as the log level.

**Examples**
----------


**Initialization**

```javascript
const ElasticSearchRestLogger = require('elastic-search-rest-log');

const logger = new ElasticSearchRestLogger(loggerOptions);
logger.init().then(() => {
    server.listen(port);
    server.on('error', onError);
    server.on('listening', () => {
        var addr = server.address();
        var bind = typeof addr === 'string' ?
            'pipe ' + addr :
            'port ' + addr.port;
        logger.info(`Listening on ${bind}`);
    });
})
```

**Output**

If the passed to the log method was a string:
```json
{
"message": "Listening on port 3000",
"level": "info",
"timestamp": "2018-10-11T07:54:50.906Z"
}



If the passed to the log method was { "foo": "fighter", "bohemian": "rhapsody" } :
```json
{
"foo": "fighter",
"bohemian": "rhapsody",
"level": "info",
"timestamp": "2018-10-11T07:54:50.906Z"
}
```