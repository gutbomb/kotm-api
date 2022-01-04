const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');

exports.donate_content = function(req, res) {
    let content = {};
    let submitErrors = false;
    let contentPromise = new Promise((resolve, reject) => {
        let contentQuery = `SELECT name, content FROM components WHERE name = 'donateHeadline' OR name = 'donateSubtitle' OR name = 'donateDescription' OR name = 'donateButtonText' OR name = 'donateBoilerplate' OR name = 'donateOtherWaysHeadline' OR name = 'donateOtherWaysText' OR name = 'donateImage'`;
        database.execute(contentQuery, [], function(err, rows, fields) {
            if(err) {
                console.error(err);
                reject();
            } else {
                if(rows.length) {
                    let contentCounter = 0;
                    rows.forEach((item) => {
                        contentCounter++;
                        switch(item.name) {
                            case 'donateHeadline':
                                content.headline = item.content;
                                break;
    
                            case 'donateSubtitle':
                                content.subtitle = item.content;
                                break;
    
                            case 'donateDescription':
                                content.description = item.content;
                                break;
    
                            case 'donateButtonText':
                                content.buttonText = item.content;
                                break;
    
                            case 'donateBoilerplate':
                                content.boilerplate = item.content;
                                break;
    
                            case 'donateOtherWaysHeadline':
                                content.otherWaysHeadline = item.content;
                                break;
    
                            case 'donateOtherWaysText':
                                content.otherWaysText = item.content;
                                break;

                            case 'donateImage':
                                content.image = item.content;
                                break;
                            
                        }
                        if(contentCounter === rows.length) {
                            resolve();
                        }
                    });
                } else {
                    reject();
                }
            }
        });
    });
    let programsPromise = new Promise((resolve, reject) => {
        let programsQuery = 'SELECT * FROM donate_programs ORDER BY programOrder ASC';
        database.execute(programsQuery, [], function(err, rows, fields) {
            if(err) {
                console.error(err);
                reject();
            } else {
                if(rows.length) {
                    content.programs = rows;
                    resolve();
                } else {
                    reject();
                }
            }
        });
    });
    programsPromise.then(() => {}, (e) => {
        submitErrors = true;
        console.error(e);
    })
    .then(() => {
        contentPromise.then(() => {}, (e) => {
            submitErrors = true;
            console.error(e);
        })
        .then(() => {
            if(submitErrors) {
                return res.status(500).json({'status': 'There were some problems.'});
            } else {
                return res.json(content);
            }
        });
    })  
};

exports.update_donate = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let metaPromise = new Promise((resolve, reject) => {
                let metaQuery = `UPDATE pages SET title=?, description=?, keywords=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url = '/donate'`;
                let metaValues = [
                    req.body.meta.title,
                    req.body.meta.description,
                    req.body.meta.keywords,
                    req.body.image
                ];
                database.execute(metaQuery, metaValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let headlinePromise = new Promise((resolve, reject) => {
                let headlineQuery = `UPDATE components SET content=? WHERE name=?`;
                let headlineValues = [
                    req.body.headline,
                    'donateHeadline'
                ];
                database.execute(headlineQuery, headlineValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let descriptionPromise = new Promise((resolve, reject) => {
                let descriptionQuery = `UPDATE components SET content=? WHERE name=?`;
                let descriptionValues = [
                    req.body.description,
                    'donateDescription'
                ];
                database.execute(descriptionQuery, descriptionValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let subtitlePromise = new Promise((resolve, reject) => {
                let subtitleQuery = `UPDATE components SET content=? WHERE name=?`;
                let subtitleValues = [
                    req.body.subtitle,
                    'donateSubtitle'
                ];
                database.execute(subtitleQuery, subtitleValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let buttonTextPromise = new Promise((resolve, reject) => {
                let buttonTextQuery = `UPDATE components SET content=? WHERE name=?`;
                let buttonTextValues = [
                    req.body.buttonText,
                    'donateButtonText'
                ];
                database.execute(buttonTextQuery, buttonTextValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let boilerplatePromise = new Promise((resolve, reject) => {
                let boilerplateQuery = `UPDATE components SET content=? WHERE name=?`;
                let boilerplateValues = [
                    req.body.boilerplate,
                    'donateBoilerplate'
                ];
                database.execute(boilerplateQuery, boilerplateValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let otherWaysHeadlinePromise = new Promise((resolve, reject) => {
                let otherWaysHeadlineQuery = `UPDATE components SET content=? WHERE name=?`;
                let otherWaysHeadlineValues = [
                    req.body.otherWaysHeadline,
                    'donateOtherWaysHeadline'
                ];
                database.execute(otherWaysHeadlineQuery, otherWaysHeadlineValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let otherWaysTextPromise = new Promise((resolve, reject) => {
                let otherWaysTextQuery = `UPDATE components SET content=? WHERE name=?`;
                let otherWaysTextValues = [
                    req.body.otherWaysText,
                    'donateOtherWaysText'
                ];
                database.execute(otherWaysTextQuery, otherWaysTextValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let imagePromise = new Promise((resolve, reject) => {
                let imageQuery = `UPDATE components SET content=? WHERE name=?`;
                let imageValues = [
                    req.body.image,
                    'donateImage'
                ];
                database.execute(imageQuery, imageValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let programsPromise = new Promise((resolve, reject) => {
                let programsCounter = -1;
                req.body.programs.forEach((program) => {
                    programsCounter++;
                    if (program.deleted) {
                        let programQuery = `DELETE FROM donate_programs WHERE id=?`;
                        database.execute(programQuery, [program.id], function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            }
                        });
                    } else {
                        let programQuery = `donate_programs SET title=?, programOrder=?`;
                        let programValues = [
                            program.title,
                            program.programOrder
                        ];
                        if(program.newProgram) {
                            programQuery = `INSERT INTO ${programQuery}`;
                        } else {
                            programQuery = `UPDATE ${programQuery} WHERE id=?`;
                            programValues.push(program.id);
                        }
                        database.execute(programQuery, programValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                if (programsCounter === (req.body.programs.length - 1)) {
                                    resolve();
                                }
                            }
                        });
                    }
                });
            });
            metaPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('meta problem');
            })
            .then(() => {
                headlinePromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('headline problem');
                })
            })
            .then(() => {
                descriptionPromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('description problem');
                })
            })
            .then(() => {
                subtitlePromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('subtitle problem');
                })
            })
            .then(() => {
                buttonTextPromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('buttonText problem');
                })
            })
            .then(() => {
                boilerplatePromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('boilerplate problem');
                })
            })
            .then(() => {
                otherWaysHeadlinePromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('otherWaysHeadline problem');
                })
            })
            .then(() => {
                otherWaysTextPromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('otherWaysText problem');
                })
            })
            .then(() => {
                imagePromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('image problem');
                })
            })
            .then(() => {
                programsPromise.then(() => {}, (e) => {
                    submitErrors = true;
                    console.error('members problem');
                })
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'donate page updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};