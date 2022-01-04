let newFilename = '';
const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js'),
    fs = require("fs"),
    multer = require('multer'),
    moment = require('moment'),
    gm = require('gm'),
    prefix = moment().format('YYYY-MM-DD-HH-mm-'),
    storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, appConfig.imageUploadDirectory)
        },
        filename: function (req, file, cb) {
            newFilename = `${prefix}${file.originalname}`;
            cb(null, newFilename)
        }
    }),
    upload = multer({ //multer settings
        storage: storage
    }).single('file');


exports.get_images = function(req, res) {
    let imagesQuery = `SELECT * FROM image_library ORDER BY id DESC`;

    database.query(imagesQuery, function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                return res.json(rows);
            } else {
                return res.sendStatus(404);
            }
        } 
    });
};

exports.upload_image = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            upload(req,res,function(err){
                if(err){
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end('{error_code:1,err_desc:'+err+'}');
                    return;
                } else {
                    let imageQuery = "INSERT INTO image_library SET filename = ?"
                    database.execute(imageQuery, [newFilename], function(err, rows, fields) {
                        if(err) {
                            console.error(err);
                            return res.status(500).json({'status': 'database error.'});
                        } else {
                            gm(`${appConfig.imageUploadDirectory}${newFilename}`)
                            .selectFrame(0)
                            .resize(null, 150)
                            .write(`${appConfig.thumbsUploadDirectory}${newFilename}`, function(err) {
                                if(err) {
                                    console.error(err);
                                } else {
                                    gm(`${appConfig.imageUploadDirectory}${newFilename}`)
                                    .resize(1920, null, '>')
                                    .write(`${appConfig.imageUploadDirectory}${newFilename}`, function(err) {
                                        if(err) {
                                            console.error(err);
                                        } else {
                                            res.json({error_code:0,err_desc:null,newFilename:newFilename});
                                        }
                                    });
                                }
                                
                            });
                        }
                    });   
                }
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};