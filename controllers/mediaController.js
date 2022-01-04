const database = require('../database.js'),
    appConfig = require('../appConfig'),
    Stripe = require('stripe'),
    stripe = Stripe(appConfig.stripeApiKey),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js'),
    fs = require("fs"),
    multer = require('multer'),
    moment = require('moment'),
    prefix = moment().format('YYYY-MM-DD-HH-mm-'),
    storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, appConfig.mediaUploadDirectory)
        },
        filename: function (req, file, cb) {
            cb(null, `${prefix}${file.originalname}`)
        }
    }),
    upload = multer({ //multer settings
        storage: storage
    }).single('file');


exports.get_media = function(req, res) {
    let submitErrors = false;
    let media = [
        {
            items: [],
            categoryOrder: 0
        }, {
            items: [],
            categoryOrder: 1
        }, {
            items: [],
            categoryOrder: 2
        }, {
            items: [],
            categoryOrder: 3
        }
    ];
    let contentPromise = new Promise((resolve, reject) => {
        let contentQuery = `SELECT name, content FROM components WHERE name='mediaArticlesHeadline' OR name='mediaArticlesDescription' OR name='mediaArticlesImage' OR name='pressReleasesHeadline' OR name='pressReleasesDescription' OR name='pressReleasesImage' OR name='annualReportsHeadline' OR name='annualReportsDescription' OR name='annualReportsImage' OR name='brochuresHeadline' OR name='brochuresDescription' OR name='brochuresImage'`;
        database.execute(contentQuery, [], function(err, rows, fields) {
            if(err) {
                console.error(err);
                reject();
            } else {
                let itemCounter = 0;
                rows.forEach((item) => {
                    itemCounter++;
                    switch (item.name) {
                        case 'mediaArticlesHeadline':
                            media[0].headline = item.content;
                            break;

                        case 'mediaArticlesDescription':
                            media[0].description = item.content;
                            break;

                        case 'mediaArticlesImage':
                            media[0].image = item.content;
                            break;

                        case 'pressReleasesHeadline':
                            media[1].headline = item.content;
                            break;

                        case 'pressReleasesDescription':
                            media[1].description = item.content;
                            break;

                        case 'pressReleasesImage':
                            media[1].image = item.content;
                            break;

                        case 'annualReportsHeadline':
                            media[2].headline = item.content;
                            break;

                        case 'annualReportsDescription':
                            media[2].description = item.content;
                            break;

                        case 'annualReportsImage':
                            media[2].image = item.content;
                            break;

                        case 'brochuresHeadline':
                            media[3].headline = item.content;
                            break;

                        case 'brochuresDescription':
                            media[3].description = item.content;
                            break;

                        case 'brochuresImage':
                            media[3].image = item.content;
                            break;

                    }
                    if(itemCounter === rows.length) {
                        resolve();
                    }
                });
                
            }
        });
    });
    let mediaPromise = new Promise((resolve, reject) => {
        let mediaQuery = `SELECT * FROM media ORDER BY date DESC`;
        database.execute(mediaQuery, [], function(err, rows, fields) {
            if(err) {
                console.error(err);
                reject();
            } else {
                let itemCounter = 0;
                rows.forEach((item) => {
                    itemCounter++;
                    switch (item.category) {
                        case 'media-articles':
                            media[0].items.push(item);
                            break;

                        case 'press-releases':
                            media[1].items.push(item);
                            break;

                        case 'annual-reports':
                            media[2].items.push(item);
                            break;

                        case 'brochures':
                            media[3].items.push(item);
                            break;
                    }
                    if(itemCounter === rows.length) {
                        resolve();
                    }
                });
                
            }
        });
    });
    contentPromise.then(() => {
        mediaPromise.then(() => {
            return res.json(media);
        }, (e) => {
            console.error(e)
            return res.status(500).json({'status': 'There were some problems.'});
        });
    }, (e) => {
        console.error(e);
        return res.status(500).json({'status': 'There were some problems.'});
    });
};

exports.upload_media = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            upload(req,res,function(err){
                if(err){
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end('{error_code:1,err_desc:'+err+'}');
                    return;
                }
                res.json({error_code:0,err_desc:null,prefix:prefix});
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.update_media = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let categoriesPromise = new Promise((resolve, reject) => {
                let categoryCounter = 0;
                req.body.forEach((category) => {
                    categoryCounter++;
                    let namePrefix = '';
                    let categoryName = '';
                    switch(category.categoryOrder) {
                        case 0:
                            namePrefix = 'mediaArticles';
                            categoryName = 'media-articles';
                            break;

                        case 1:
                            namePrefix = 'pressReleases';
                            categoryName = 'press-releases';
                            break;

                        case 2:
                            namePrefix = 'annualReports';
                            categoryName = 'annual-reports';
                            break;

                        case 3:
                            namePrefix = 'brochures';
                            categoryName = 'brochures';
                            break;
                    } 
                    let headlineQuery = 'UPDATE components SET content=? WHERE name=?';
                    let headlineValues = [
                        category.headline,
                        `${namePrefix}Headline`
                    ];
                    let imageQuery = 'UPDATE components SET content=? WHERE name=?';
                    let imageValues = [
                        category.image,
                        `${namePrefix}Image`
                    ];
                    let descriptionQuery = 'UPDATE components SET content=? WHERE name=?';
                    let descriptionValues = [
                        category.description,
                        `${namePrefix}Description`
                    ];
                    database.execute(headlineQuery, headlineValues, function(err, rows, fields) {
                        if(err) {
                            console.error(err);
                            reject();
                        } else {
                            database.execute(imageQuery, imageValues, function(err, rows, fields) {
                                if(err) {
                                    console.error(err);
                                    reject();
                                } else {
                                    database.execute(descriptionQuery, descriptionValues, function(err, rows, fields) {
                                        if(err) {
                                            console.error(err);
                                            reject();
                                        } else {
                                            let itemCounter = 0;
                                            category.items.forEach((item) => {
                                                itemCounter++;
                                                if(item.deleted) {
                                                    let itemQuery = 'DELETE FROM media WHERE id = ?';
                                                    let itemValues = [
                                                        item.id
                                                    ];
                                                    database.execute(itemQuery, itemValues, function(err, rows, fields) {
                                                        if(err) {
                                                            console.error(err);
                                                            reject();
                                                        }
                                                    });
                                                } else {
                                                    let itemQuery = `media SET title=?`;
                                                    let itemValues = [
                                                        item.title
                                                    ];
                                                    if(item.newItem) {
                                                        itemQuery = `INSERT INTO ${itemQuery}, filename=?, category=?`;
                                                        itemValues.push(item.filename);
                                                        itemValues.push(categoryName);
                                                    } else {
                                                        itemQuery = `UPDATE ${itemQuery} WHERE id=?`;
                                                        itemValues.push(item.id);
                                                    }
                                                    database.execute(itemQuery, itemValues, function(err, rows, fields) {
                                                        if(err) {
                                                            console.error(err);
                                                            reject();
                                                        } else {
                                                            if(categoryCounter === req.body.length && itemCounter === category.items.length) {
                                                                resolve();
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
            categoriesPromise.then(() => {
                return res.json({'status': 'media updated successfully'});
            }, () => {
                return res.status(500).json({'status': 'There were some problems.'});
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};