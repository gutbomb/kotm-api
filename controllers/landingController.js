const { link } = require('fs');
const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');


exports.get_faqs = function(req, res) {
    let faqsQuery = `SELECT faqs.id, question, answer, questionOrder FROM landing_questions JOIN faqs ON faqs.id = landing_questions.questionId WHERE landingId = ? ORDER BY questionOrder ASC`;

    database.execute(faqsQuery, [req.params.landingId], function(err, rows, fields) {
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

exports.get_landing = function(req, res) {
    let landing = {};
    let prevSection = -1;
    let landingQuery = `SELECT landing_pages.faqsTitle, landing_pages.headline, landing_pages.description AS pageDescription, landing_pages.id, landing_sections.id AS landingSectionId, landing_sections.title AS sectionTitle, landing_sections.image, landing_sections.sectionOrder, landing_bullets.id AS bulletId, landing_bullets.title AS bulletTitle, landing_bullets.description AS bulletDescription, landing_bullets.icon, landing_bullets.bulletOrder, landing_bullets.link, landing_bullets.linkText FROM landing_pages JOIN users ON users.id = landing_pages.authorId JOIN landing_sections ON landing_sections.landingPageId = landing_pages.id LEFT JOIN landing_bullets ON landing_bullets.landingSectionId = landing_sections.id WHERE landing_pages.landingUrl = ? ORDER BY landingSectionId ASC, landing_bullets.bulletOrder ASC`;
    database.execute(landingQuery, [req.params.landingLink], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                landing = {
                    id: rows[0].id,
                    headline: rows[0].headline,
                    pageDescription: rows[0].pageDescription,
                    sections: [],
                    link: req.params.landingLink,
                    faqsTitle: rows[0].faqsTitle
                };
                let newSection = {};
                for (i = 0; i < rows.length; i++) {
                    if(prevSection !== rows[i].landingSectionId) {
                        prevSection = rows[i].landingSectionId;
                        newSection = {
                            id: rows[i].landingSectionId,
                            title: rows[i].sectionTitle,
                            sectionOrder: rows[i].sectionOrder,
                            image: rows[i].image,
                            bullets: []
                        }
                    }
                    if(rows[i].bulletId) {
                        newSection.bullets.push({
                            id: rows[i].bulletId,
                            title: rows[i].bulletTitle,
                            icon: rows[i].icon,
                            description: rows[i].bulletDescription,
                            bulletOrder: rows[i].bulletOrder,
                            link: rows[i].link,
                            linkText: rows[i].linkText
                        });
                    }
                    if(i !== rows.length - 1) {
                        if(rows[(i+1)].landingSectionId > newSection.id) {
                            landing.sections.push(newSection);
                        }
                    } else {
                        landing.sections.push(newSection);
                    }
                }
                return res.json(landing);                
            } else {
                return res.sendStatus(404);
            }
        }
    });
};

exports.update_landing = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let metaPromise = new Promise((resolve, reject) => {
                let metaQuery = `UPDATE pages SET title=?, description=?, keywords=?, image=?, updated=NOW(), authorId=${decodedToken.id} WHERE url = ?`;
                let metaValues = [
                    req.body.meta.title,
                    req.body.meta.description,
                    req.body.meta.keywords,
                    req.body.sections[0].image,
                    `/${req.body.link}`
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
            let landingPromise = new Promise((resolve, reject) => {
                let landingQuery = `UPDATE landing_pages SET headline=?, landingUrl=?, description=?, faqsTitle=? WHERE id = ?`;
                let landingValues = [
                    req.body.headline,
                    req.body.link,
                    req.body.pageDescription,
                    req.body.faqsTitle,
                    req.body.id
                ];
                database.execute(landingQuery, landingValues, function(err, rows, fields) {
                    if(err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
                });
            });
            let sectionPromise = new Promise((resolve, reject) => {
                let sectionCounter = -1;
                req.body.sections.forEach((section) => {
                    sectionCounter++;
                    if (section.deleted) {
                        let sectionQuery = `DELETE FROM landing_sections WHERE id=?`;
                        database.execute(sectionQuery, [section.id], function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            }
                        });
                    } else {
                        let sectionQuery = `landing_sections SET title=?, sectionOrder=?, image=?`;
                        let sectionValues = [
                            section.title,
                            section.sectionOrder,
                            section.image
                        ];
                        let sectionInsertId = false;
                        if(section.newSection) {
                            sectionQuery = `INSERT INTO ${sectionQuery}, landingPageId=?`;
                            sectionValues.push(req.body.id);
                        } else {
                            sectionQuery = `UPDATE ${sectionQuery} WHERE id=?`;
                            sectionValues.push(section.id);
                        }
                        database.execute(sectionQuery, sectionValues, function(err, rows, fields) {
                            if(err) {
                                console.error(err);
                                reject();
                            } else {
                                if(section.newSection) {
                                    sectionInsertId = rows.insertId;
                                }
                                let bulletCounter = -1;
                                section.bullets.forEach((bullet) => {
                                    bulletCounter++
                                    if (bullet.deleted) {
                                        let bulletQuery = `DELETE FROM landing_bullets WHERE id=?`;
                                        database.execute(bulletQuery, [bullet.id], function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            }
                                        });
                                    } else {
                                        let bulletQuery = `landing_bullets SET bulletOrder=?, description=?, icon=?, link=?, linkText=?, title=?`;
                                        let bulletValues = [
                                            bullet.bulletOrder,
                                            bullet.description,
                                            bullet.icon,
                                            bullet.link,
                                            bullet.linkText,
                                            bullet.title
                                        ];
                                        if(bullet.newBullet) {
                                            bulletQuery = `INSERT INTO ${bulletQuery}, landingSectionId=?`;
                                            if(section.newSection) {
                                                bulletValues.push(sectionInsertId);
                                            } else {
                                                bulletValues.push(section.id);
                                            }
                                        } else {
                                            bulletQuery = `UPDATE ${bulletQuery} WHERE id=?`;
                                            bulletValues.push(bullet.id);
                                        }
                                        database.execute(bulletQuery, bulletValues, function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            } else {
                                                if (sectionCounter === (req.body.sections.length - 1) && bulletCounter === (section.bullets.length - 1)) {
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
            });
            let questionPromise = new Promise((resolve, reject) => {
                let questionCounter = -1;
                if(req.body.questions) {
                    req.body.questions.forEach((question) => {
                        questionCounter++;
                        if (question.deleted) {
                            let questionQuery = `DELETE FROM landing_questions WHERE questionId=?`;
                            database.execute(questionQuery, [question.id], function(err, rows, fields) {
                                if(err) {
                                    console.error(err);
                                    reject();
                                }
                            });
                            let question2Query = `DELETE FROM faqs WHERE id=?`;
                            database.execute(question2Query, [question.id], function(err, rows, fields) {
                                if(err) {
                                    console.error(err);
                                    reject();
                                }
                            });
                        } else {
                            let questionQuery = `faqs SET faqs.answer=?, faqs.question=?`;
                            let questionValues = [
                                question.answer,
                                question.question
                            ];
                            if(question.newQuestion) {
                                questionQuery = `INSERT INTO ${questionQuery}`;
                            } else {
                                questionQuery = `UPDATE landing_questions, ${questionQuery}, landing_questions.questionOrder=? WHERE faqs.id=? AND landing_questions.questionId=?`;
                                questionValues.push(question.questionOrder);
                                questionValues.push(question.id);
                                questionValues.push(question.id);
                            }
                            database.execute(questionQuery, questionValues, function(err, rows, fields) {
                                if(err) {
                                    console.error(err);
                                    reject();
                                } else {
                                    if(question.newQuestion) {
                                        let question2Query = "INSERT INTO landing_questions SET questionId=?, questionOrder=?, landingId=?";
                                        let question2Values = [
                                            rows.insertId,
                                            question.questionOrder,
                                            req.body.id
                                        ];
                                        database.execute(question2Query, question2Values, function(err, q2rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            } else {
                                                if (questionCounter === req.body.questions.length) {
                                                    resolve();
                                                }
                                            }
                                        });
                                    } else {
                                        if (questionCounter === req.body.questions.length) {
                                            resolve();
                                        }
                                    }
                                }
                            });
                        }
                    });
                } else {
                    resolve();
                }
                
            });
            metaPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('meta problem');
            })
            landingPromise.then(() => {}, () => {
                submitErrors = true;
                console.error('landing problem');
            })
            .then(() => {
                sectionPromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('section/bullet problem');
                })
            })
            .then(() => {
                questionPromise.then(() => {}, () => {
                    submitErrors = true;
                    console.error('question problem');
                })
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'landing page updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};