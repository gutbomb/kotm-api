const express = require('express'),
    https = require('https'),
    app = express(),
    fs = require('fs'),
    appConfig = require('./appConfig.js'),
    port = appConfig.appPort,
    bodyParser = require('body-parser'),
    bearerToken = require('express-bearer-token');

app.set('trust proxy', 1);
app.disable('etag');
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
app.use(bearerToken());

const routes = require('./routes/kotmApiRoutes');
routes(app);

if(appConfig.environment === 'production') {
    // https.createServer({
    //     key: fs.readFileSync(appConfig.sslOptions.key),
    //     cert: fs.readFileSync(appConfig.sslOptions.cert)
    // }, app).listen();
    // console.log('secure kotm API server started');
    app.listen();
    console.log('kotm API server started on production');
} else {
    if(appConfig.useSSL) {
        https.createServer({
            key: fs.readFileSync(appConfig.sslOptions.key),
            cert: fs.readFileSync(appConfig.sslOptions.cert)
        }, app).listen(port);
        console.log('secure kotm API server started on: ' + port);
    } else {
        app.listen(port);
        console.log('kotm API server started on: ' + port);
    }
}

