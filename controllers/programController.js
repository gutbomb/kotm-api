const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js'),
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig);

exports.get_program = function(req, res) {
    let program = {};
    let prevTab = -1;
    
    let programQuery = `SELECT programs.applyButtonLink, programs.applyButtonText, programs.displayApplyButton, programs.locationsTitle, programs.locationsDescription, programs.name, programs.updated, programs.id, programs.color, programs.heroId, programs.mediumDescription, programs.shortDescription, programs.homeImage, programs.aboutImage, program_tabs.id AS tabId, program_tabs.title AS tabTitle, program_tabs.slug, program_tabs.tabOrder, program_tabs.link, program_tab_sections.id AS tabSectionId, program_tab_sections.title AS sectionTitle, program_tab_sections.text, program_tab_sections.image, program_tab_sections.imagePosition, program_tab_sections.sectionOrder, program_tab_sections.buttonLink, program_tab_sections.buttonText, users.firstname, users.lastname FROM programs JOIN users ON users.id = programs.authorId JOIN program_tabs ON program_tabs.programId = programs.id LEFT JOIN program_tab_sections ON program_tab_sections.programTabId = program_tabs.id WHERE programs.link = ? ORDER BY tabOrder ASC`;  
    database.execute(programQuery, [req.params.programLink], function(err, rows, fields) {
        if(err) {
            console.error(err);

            return res.sendStatus(500);
        } else {
            if(rows.length) {
                program = {
                    id: rows[0].id,
                    name: rows[0].name,
                    color: rows[0].color,
                    heroId: rows[0].heroId,
                    tabs: [],
                    updated: rows[0].updated,
                    firstname: rows[0].firstname,
                    lastname: rows[0].lastname,
                    link: req.params.programLink,
                    locationsTitle: rows[0].locationsTitle,
                    locationsDescription: rows[0].locationsDescription,
                    displayApplyButton: rows[0].displayApplyButton,
                    applyButtonLink: rows[0].applyButtonLink,
                    applyButtonText: rows[0].applyButtonText,
                    mediumDescription: rows[0].mediumDescription,
                    shortDescription: rows[0].shortDescription,
                    homeImage: rows[0].homeImage,
                    aboutImage: rows[0].aboutImage
                };
                let newTab = {};
                for (i = 0; i < rows.length; i++) {
                    if(prevTab !== rows[i].tabId) {
                        prevTab = rows[i].tabId;
                        newTab = {
                            id: rows[i].tabId,
                            title: rows[i].tabTitle,
                            tabOrder: rows[i].tabOrder,
                            link: rows[i].link,
                            slug: rows[i].slug,
                            sections: []
                        }
                    }
                    if(rows[i].tabSectionId) {
                        newTab.sections.push({
                            id: rows[i].tabSectionId,
                            title: rows[i].sectionTitle,
                            text: rows[i].text,
                            image: rows[i].image,
                            imagePosition: rows[i].imagePosition,
                            sectionOrder: rows[i].sectionOrder,
                            buttonLink: rows[i].buttonLink,
                            buttonText: rows[i].buttonText
                        });
                    }
                    if(i !== rows.length - 1) {
                        if(rows[(i+1)].tabOrder > newTab.tabOrder) {
                            program.tabs.push(newTab);
                        }
                    } else {
                        program.tabs.push(newTab);
                    }
                }
                return res.json(program);
            } else {
                return res.sendStatus(404);
            }
        } 
    })
};

exports.get_locations = function(req, res) {
    let locationsQuery = `SELECT eventLocations.id AS id, title, description, image, locationOrder FROM eventLocations JOIN program_locations ON eventLocations.id = program_locations.locationId WHERE programId = ?`;

    database.execute(locationsQuery, [req.params.programId], function(err, rows, fields) {
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

exports.get_faqs = function(req, res) {
    let faqsQuery = `SELECT faqs.id, question, answer, questionOrder FROM program_questions JOIN faqs ON faqs.id = program_questions.questionId WHERE programId = ? ORDER BY questionOrder ASC`;

    database.execute(faqsQuery, [req.params.programId], function(err, rows, fields) {
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

exports.get_programs = function(req, res) {
    let programsQuery = `SELECT id, name, mediumDescription, shortDescription, homeImage, aboutImage, color, link FROM programs ORDER BY name ASC`;

    database.query(programsQuery, function(err, rows, fields) {
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

exports.update_program = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let programCheckQuery = `SELECT COUNT(id) as idCount FROM programs WHERE link = ? AND id != ?`;
            let checkValues = [
                req.body.link,
                req.body.id
            ];
            database.execute(programCheckQuery, checkValues, function (err, checkRows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(checkRows.length) {
                        if(checkRows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'link', error: true});
                        } else {
                            let metaPromise = new Promise((resolve, reject) => {
                                let heroImageQuery = `SELECT image FROM hero_images WHERE heroId = ? and heroOrder = 0`;
                                database.execute(heroImageQuery, [req.body.heroId], function(err, heroRows, fields) {
                                    if(err) {
                                        console.error(err);
                                        reject();
                                    } else {
                                        let metaQuery = `UPDATE pages SET title=?, description=?, keywords=?, color=?, image=?, url=?, updated=NOW(), authorId=${decodedToken.id} WHERE url = ?`;
                                        let metaValues = [
                                            req.body.meta.title,
                                            req.body.meta.description,
                                            req.body.meta.keywords,
                                            req.body.color,
                                            heroRows[0].image,
                                            `/programs/${req.body.link}`,
                                            req.body.meta.oldLink
                                        ];
                                        database.execute(metaQuery, metaValues, function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            } else {
                                                resolve();
                                            }
                                        });
                                    }
                                });
                                
                            });
                            let programPromise = new Promise((resolve, reject) => {
                                let programQuery = `UPDATE programs SET name=?, updated=NOW(), authorId=${decodedToken.id}, link=?, locationsTitle=?, locationsDescription=?, displayApplyButton=?, applyButtonLink=?, applyButtonText=?, shortDescription=?, mediumDescription=?, homeImage=?, aboutImage=?, heroId=? WHERE id = ?`;
                                let programValues = [
                                    req.body.name,
                                    req.body.link,
                                    req.body.locationsTitle,
                                    req.body.locationsDescription,
                                    req.body.displayApplyButton,
                                    req.body.applyButtonLink,
                                    req.body.applyButtonText,
                                    req.body.shortDescription,
                                    req.body.mediumDescription,
                                    req.body.homeImage,
                                    req.body.aboutImage,
                                    req.body.heroId,
                                    req.body.id
                                ];
                                database.execute(programQuery, programValues, function(err, rows, fields) {
                                    if(err) {
                                        console.error(err);
                                        reject();
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                            let tabPromise = new Promise((resolve, reject) => {
                                let tabCounter = -1;
                                req.body.tabs.forEach((tab) => {
                                    tabCounter++;
                                    if (tab.deleted) {
                                        let tabQuery = `DELETE FROM program_tabs WHERE id=?`;
                                        database.execute(tabQuery, [tab.id], function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            }
                                        });
                                    } else {
                                        let tabQuery = `program_tabs SET title=?, tabOrder=?, slug=?`;
                                        let tabValues = [
                                            tab.title,
                                            tab.tabOrder,
                                            tab.slug
                                        ];
                                        let tabInsertId = false;
                                        if(tab.newTab) {
                                            tabQuery = `INSERT INTO ${tabQuery}, programId=?`;
                                            tabValues.push(req.body.id);
                                        } else {
                                            tabQuery = `UPDATE ${tabQuery} WHERE id=?`;
                                            tabValues.push(tab.id);
                                        }
                                        database.execute(tabQuery, tabValues, function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            } else {
                                                if(tab.newTab) {
                                                    tabInsertId = rows.insertId;
                                                }
                                                let sectionCounter = -1;
                                                tab.sections.forEach((section) => {
                                                    sectionCounter++
                                                    if (section.deleted) {
                                                        let sectionQuery = `DELETE FROM program_tab_sections WHERE id=?`;
                                                        database.execute(sectionQuery, [section.id], function(err, rows, fields) {
                                                            if(err) {
                                                                console.error(err);
                                                                reject();
                                                            }
                                                        });
                                                    } else {
                                                        let sectionQuery = `program_tab_sections SET buttonLink=?, buttonText=?, image=?, imagePosition=?, sectionOrder=?, text=?, title=?`;
                                                        let sectionValues = [
                                                            section.buttonLink,
                                                            section.buttonText,
                                                            section.image,
                                                            section.imagePosition,
                                                            section.sectionOrder,
                                                            section.text,
                                                            section.title
                                                        ];
                                                        if(section.newSection) {
                                                            sectionQuery = `INSERT INTO ${sectionQuery}, programTabId=?`;
                                                            if(tab.newTab) {
                                                                sectionValues.push(tabInsertId);
                                                            } else {
                                                                sectionValues.push(tab.id);
                                                            }
                                                        } else {
                                                            sectionQuery = `UPDATE ${sectionQuery} WHERE id=?`;
                                                            sectionValues.push(section.id);
                                                        }
                                                        database.execute(sectionQuery, sectionValues, function(err, rows, fields) {
                                                            if(err) {
                                                                console.error(err);
                                                                reject();
                                                            } else {
                                                                if (tabCounter === req.body.tabs.length && sectionCounter === tab[tabCounter].sections.length) {
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
                            let locationPromise = new Promise((resolve, reject) => {
                                let locationCounter = -1;
                                req.body.locations.forEach((location) => {
                                    locationCounter++;
                                    if (location.deleted) {
                                        let locationQuery = `DELETE FROM program_locations WHERE locationId=? AND programId=?`;
                                        let locationValues = [
                                            location.id,
                                            req.body.id
                                        ];
                                        database.execute(locationQuery, locationValues, function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            }
                                        });
                                    } else {
                                        let locationQuery = `program_locations SET locationOrder=?`;
                                        let locationValues = [
                                            location.locationOrder,
                                            location.id,
                                            req.body.id
                                        ];
                                        if(location.locationNew) {
                                            locationQuery = `INSERT INTO ${locationQuery}, locationId=?, programId=?`;
                                        } else {
                                            locationQuery = `UPDATE ${locationQuery} WHERE locationId=? AND programId=?`;
                                        }
                                        database.execute(locationQuery, locationValues, function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            } else {
                                                if (locationCounter === req.body.locations.length) {
                                                    resolve();
                                                }
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
                                            let questionQuery = `DELETE FROM program_questions WHERE questionId=?`;
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
                                                questionQuery = `UPDATE program_questions, ${questionQuery}, program_questions.questionOrder=? WHERE faqs.id=? AND program_questions.questionId=?`;
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
                                                        let question2Query = "INSERT INTO program_questions SET questionId=?, questionOrder=?, programId=?";
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
                            programPromise.then(() => {}, () => {
                                submitErrors = true;
                                console.error('program problem');
                            })
                            .then(() => {
                                tabPromise.then(() => {}, () => {
                                    submitErrors = true;
                                    console.error('tab/section problem');
                                })
                            })
                            .then(() => {
                                locationPromise.then(() => {}, () => {
                                    submitErrors = true;
                                    console.error('location problem');
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
                                    let stagingQuery = `INSERT INTO staged_changes SET type=?, contentId=?, created=NOW(), userId=?, object=?, description=?, approved=1, approverUserId=?`;
                                    let stagingValues = [
                                        'program',
                                        req.body.id,
                                        decodedToken.id,
                                        req.body,
                                        req.body.revisionDescription,
                                        decodedToken.id
                                    ];
                                    database.execute(stagingQuery, stagingValues, function (stagingErr, stagingResults, stagingFields) {
                                        if (stagingErr) {
                                            return res.status(500).json({'status': 'Database error', 'errors': stagingErr});
                                        } else {
                                            return res.json({'status': 'program updated successfully'});
                                        }
                                    });
                                }
                            });
                        }
                    } else {
                        return res.status(500);
                    }
                } 
            });
        } else if (decodedToken.role === 'editor') {
            let revisionId = -1;
            let countQuery = `SELECT id FROM staged_changes WHERE type = 'program' AND contentId = ? AND userId = ? AND approved = 0`;
            database.execute(countQuery, [req.body.id, decodedToken.id], function (countErr, countResults, countFields) {
                if (countErr) {
                    return res.status(500).json({'status': 'Database error', 'errors': countErr});
                } else {
                    let stagingQuery = `staged_changes SET type=?, contentId=?, created=NOW(), userId=?, object=?, description=?`;
                    let stagingValues = [
                        'program',
                        req.body.id,
                        decodedToken.id,
                        req.body,
                        req.body.revisionDescription
                    ];
                    if (countResults.length) {
                        revisionId = countResults[0].id;
                        stagingQuery = `UPDATE ${stagingQuery} WHERE type= ? AND contentId = ? AND userId = ?`;
                        stagingValues.push('program', req.body.id, decodedToken.id);
                    } else {
                        stagingQuery = `INSERT INTO ${stagingQuery}`;
                    }
                    database.execute(stagingQuery, stagingValues, function (stagingErr, stagingResults, stagingFields) {
                        if (stagingErr) {
                            return res.status(500).json({'status': 'Database error', 'errors': stagingErr});
                        } else {
                            if(!countResults.length) {
                                revisionId = stagingResults.insertId;
                            }
                            let mailOptions = {
                                from: appConfig.mailConfig.auth.user,
                                to: appConfig.approvalEmail,
                                subject: 'KOTM.org Page Edit Approval Request',
                                text: `Hello, an edit has been submitted for your approval to the program page: "${req.body.name}".\r\n\r\nDescription: ${req.body.revisionDescription}\r\n\r\nPlease visit ${appConfig.appUrl}/admin/edit-program/${req.body.link}/${revisionId} to review the changes.`
                            };
                            transport.sendMail(mailOptions, function(){});
                            return res.json({'status': 'Program page sumbitted for approval successfully'});
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