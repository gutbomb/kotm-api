const appConfig = {
    dbConnect: {
        host: '', // Change this to the mysql hostname
        user: '', // Change this to the mysql user
        password: '', // Change this to the mysql password
        database: '', // Change this to the mysql database
        port: 3306, // Change this to the mysql port
        multipleStatements: true // Leave this alone
    },
    mailConfig: {
        host: '', // Change this to the mail server's domain name
        port: '', // Change this to the mail server's port
        auth: {
            user: '', // Change this to the mail server username
            pass: '', // Change this to the mail server password
        },
        tls: {rejectUnauthorized: false}
    },
    jwtKey: '', // Change this to the jwt_key you wish to use
    appUrl: '', // Change this to the front end's main URL for the environment you are on
    environment: '', // Change this to 'dev' or 'production'
    useSSL: false, // change this to true to use SSL (dev only)
    appPort: 3002, // change this to whatever port you set for the api to run on (dev only)
    sslOptions: {
        key: '', // change this to the path and filename of your key file (dev only)
        cert: '' // change this to the path and filename of your certificate (dev only)
    },
    sharepoint: {
        clientId: '', // change this to the sharepoint client id
        clientSecret: '', // change this to the sharepoint client secret
        host: '', // change this to the sharepoint host
        realm: '' // change this to the sharepoint realm
    },
    mediaUploadDirectory: '', // change this to the path where media and publications files should be uploaded to
    imageUploadDirectory: '', // change this to the path where images should be uploaded to
    thumbsUploadDirectory: '', // change this to the path where images should be uploaded to
    formUploadDirectory: '', // change this to the path where form uploads should be uploaded to
    sitemapDirectory: '', // change this to the path where sitemap.xml should go
    contactUsEmail: '', // change this to the email address for contact us emails
    newsLetterEmail: '', // change this to the email address for newsletter signups
    approvalEmail: '' // change this to the email that approval notifications are supposed to go to

};
module.exports = appConfig;
