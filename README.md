# http-request-promise-simple

Dependency-less http methods for pure nodejs

# ElasticSearchRestLogger

sdadsf

**Options**

**Methods**



**Example - Initialization**

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
    }));
})

```