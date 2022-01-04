const { resolveContent } = require('nodemailer/lib/shared');

const appConfig = require('../appConfig'),
    database = require('../database.js')
    nodemailer = require('nodemailer'),
    transport = nodemailer.createTransport(appConfig.mailConfig),
    fs = require("fs"),
    multer = require('multer'),
    moment = require('moment'),
    prefix = moment().format('YYYY-MM-DD-HH-mm-'),
    storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, appConfig.formUploadDirectory)
        },
        filename: function (req, file, cb) {
            cb(null, `${prefix}${file.originalname}`)
        }
    }),
    upload = multer({ //multer settings
        storage: storage
    }).single('file'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');

exports.get_forms = function(req, res) {
    let formQuery = `SELECT * FROM forms`;
    
    database.execute(formQuery, [], function(formErr, formRows, fields) {
        if(formErr) {
            console.error(formErr);
            return res.status(500).json({'status': 'There were some problems with the forms.'});
        } else {
            if(formRows.length) {
                return res.json(formRows);
            } else {
                return res.status(404).json({'status': 'forms not found.'});
            }
        }
    });
};

exports.get_form = function(req, res) {
    let form = {};
    let prevSection = -1;
    let prevField = -1;
    let prevItem = -1;
    let formQuery = `SELECT forms.id, forms.submit, forms.title, forms.emailSubject, forms.recipients, forms.description, forms.url, forms.color, forms.successTitle, forms.successMessage, form_sections.id AS sectionId, form_sections.title AS sectionTitle, form_sections.order AS sectionOrder, form_fields.id AS fieldId, form_fields.title AS fieldTitle, form_fields.type AS fieldType, form_fields.order AS fieldOrder, form_fields.required, form_fields_items.id as itemId, form_fields_items.title AS itemTitle, form_fields_items.other, form_fields_items.order AS itemOrder FROM kotm_org.forms JOIN form_sections ON form_sections.formId = forms.id LEFT JOIN form_fields ON form_sections.id = form_fields.formSectionId LEFT JOIN form_fields_items ON form_fields_items.formFieldId = form_fields.id WHERE url=? ORDER BY sectionOrder ASC, fieldOrder ASC, itemOrder ASC;`;

    database.execute(formQuery, [req.params.formUrl], function(formErr, formRows, fields) {
        if(formErr) {
            console.error(formErr);
            return res.status(500).json({'status': 'There were some problems with the form.'});
        } else {
            if(formRows.length) {
                form = {
                    id: formRows[0].id,
                    title: formRows[0].title,
                    emailSubject: formRows[0].emailSubject,
                    recipients: formRows[0].recipients,
                    description: formRows[0].description,
                    url: formRows[0].url,
                    color: formRows[0].color,
                    success: {
                        title: formRows[0].successTitle,
                        message: formRows[0].successMessage,
                    },
                    sections: [],
                    submit: formRows[0].submit
                }
                let newSection = {};
                let newField = {};
                for (i = 0; i < formRows.length; i++) {
                    if (prevSection !== formRows[i].sectionId) {
                        prevSection = formRows[i].sectionId;
                        newSection = {
                            id: formRows[i].sectionId,
                            title: formRows[i].sectionTitle,
                            order: formRows[i].sectionOrder,
                            fields: []
                        };
                    }
                    if(formRows[i].fieldId) {
                        if(formRows[i].fieldId !== prevField) {
                            prevField = formRows[i].fieldId;
                            newField = {
                                id: formRows[i].fieldId,
                                title: formRows[i].fieldTitle,
                                value: '',
                                type: formRows[i].fieldType,
                                order: formRows[i].fieldOrder,
                                required: Boolean(formRows[i].required),
                                items: []
                            };
                            if(formRows[i].itemId) {
                                newField.items.push({
                                    id: formRows[i].itemId,
                                    title: formRows[i].itemTitle,
                                    value: false,
                                    other: Boolean(formRows[i].other),
                                    order: formRows[i].itemOrder
                                });
                                if(i !== formRows.length - 1) {
                                    if (formRows[i+1].fieldId !== formRows[i].fieldId) {
                                        newSection.fields.push(newField);
                                    }
                                } else {
                                    newSection.fields.push(newField);
                                }
                            }
                            if(i !== formRows.length - 1) {
                                if (formRows[i+1].fieldId !== formRows[i].fieldId) {
                                    newSection.fields.push(newField);
                                }
                            } else {
                                newSection.fields.push(newField);
                            }
                        } else {
                            if(formRows[i].itemId) {
                                newField.items.push({
                                    id: formRows[i].itemId,
                                    title: formRows[i].itemTitle,
                                    value: false,
                                    other: Boolean(formRows[i].other),
                                    order: formRows[i].itemOrder
                                });
                                if(i !== formRows.length - 1) {
                                    if (formRows[i+1].fieldId !== formRows[i].fieldId) {
                                        newSection.fields.push(newField);
                                    }
                                } else {
                                    newSection.fields.push(newField);
                                }
                            }
                        }
                    }
                    if(i !== formRows.length - 1) {
                        if (formRows[i+1].sectionOrder > newSection.order) {
                            form.sections.push(newSection);
                        }
                    } else {
                        form.sections.push(newSection);
                    }

                }
                return res.json(form);
            } else {
                return res.status(404).json({'status': 'form not found.'});
            }
        }
    });
};

exports.submit_form = function(req, res) {
    let attachments = [];
    let sectionCounter = 0;
    let bgcolor = '#ffffff';
    let text = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><table cellspacing="0" style="font-size:12px;line-height:135%;border-bottom:1px solid #dddddd;"><tbody>\n\r';
    req.body.sections.forEach((section) => {
        let fieldCounter = 0;
        sectionCounter++;
        section.fields.forEach((field) => {
            if(bgcolor==='#ffffff') {
                bgcolor='#eeeeee';
            } else {
                bgcolor='#ffffff';
            }
            fieldCounter++;
            if(field.type === 'checkbox') {
                text += `<tr style="background-color:${bgcolor};"><th style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.title}</th><td style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">`;
                let itemCounter = 0;
                field.items.forEach((item) => {
                    itemCounter++;
                    if (item.value === true) {
                        text += `${item.title}<br>\n\r`;
                    }
                    if(itemCounter === field.items.length) {
                        text += '</td></tr>\n\r';
                    }
                });
            } else if (field.type === 'radio') {
                text += `<tr style="background-color:${bgcolor};"><th style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.title}</th><td style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.value.title}<br>\n\r</td></tr>\n\r`;
            } else if (field.type === 'uploadFile') {
                attachments.push({
                    filename: field.value,
                    content: fs.createReadStream(`${appConfig.formUploadDirectory}${field.value}`)
                });
                text += `<tr style="background-color:${bgcolor};"><th style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.title}</th><td style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.value} - Attached</td></tr>\n\r`;
            } else {
                text += `<tr style="background-color:${bgcolor};"><th style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.title}</th><td style="text-align:left;color:#444444;padding:7px 9px;vertical-align:top;border-top:1px solid #dddddd;">${field.value}</td></tr>\n\r`;
            }
            
            if(fieldCounter === section.fields.length && sectionCounter === req.body.sections.length) {
                let mailOptions = {
                    from: appConfig.mailConfig.auth.user,
                    to: req.body.recipients,
                    subject: req.body.emailSubject,
                    html: text+'</tbody></table></body></html>\n\r'
                };
                if (attachments.length) {
                    mailOptions.attachments = attachments;
                }
                transport.sendMail(mailOptions, function (e) {
                    if (e) {
                        console.error(e);
                        return res.status(500).json({error: 'An error has occurred.  Please try again later.'});
                    } else {
                        return res.json({});
                    }
                });
                // return res.json({});
            }
        });
    }); 
};

exports.upload_form = function(req, res) {
    upload(req,res,function(err){
        if(err){
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end('{error_code:1,err_desc:'+err+'}');
            return;
        } else {
            return res.json({error_code:0,err_desc:null,prefix:prefix});
        }
    });
};

exports.update_form = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let formCheckQuery = `SELECT COUNT(id) as idCount FROM forms WHERE url = ? AND id != ?`;
            let formCheckValues = [
                req.body.url,
                req.body.id
            ];
            database.execute(formCheckQuery, formCheckValues, function (err, checkRows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(checkRows.length) {
                        if(checkRows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'url', error: true});
                        } else {
                            let formPromise = new Promise((resolve, reject) => {
                                console.log('in form promise');
                                let formQuery = `UPDATE forms SET title=?, recipients=?, emailSubject=?, description=?, url=?, color=?, successTitle=?, successMessage=?, submit=? WHERE id = ?`;
                                let formValues = [
                                    req.body.title,
                                    req.body.recipients,
                                    req.body.emailSubject,
                                    req.body.description,
                                    req.body.url,
                                    req.body.color,
                                    req.body.success.title,
                                    req.body.success.message,
                                    req.body.submit,
                                    req.body.id
                                ];
                                database.execute(formQuery, formValues, function(err, rows, fields) {
                                    if(err) {
                                        console.error(err);
                                        reject();
                                    } else {
                                        console.log('form promise resolved');
                                        resolve();
                                    }
                                });
                            });
                            let sectionPromise = new Promise((resolve, reject) => {
                                let sectionCounter = -1;
                                console.log('in section promise');
                                req.body.sections.forEach((section) => {
                                    sectionCounter++;
                                    if (section.deleted) {
                                        let sectionQuery = `DELETE FROM form_sections WHERE id=?`;
                                        database.execute(sectionQuery, [section.id], function(err, rows, fields) {
                                            if(err) {
                                                console.error(err);
                                                reject();
                                            }
                                        });
                                    } else {
                                        let sectionQuery = `form_sections SET title=?, form_sections.order=?`;
                                        let sectionValues = [
                                            section.title,
                                            section.order,
                                        ];
                                        let sectionInsertId = false;
                                        if(section.newSection) {
                                            sectionQuery = `INSERT INTO ${sectionQuery}, formId=?`;
                                            sectionValues.push(req.body.id);
                                        } else {
                                            sectionQuery = `UPDATE ${sectionQuery} WHERE id=?`;
                                            sectionValues.push(section.id);
                                        }
                                        database.execute(sectionQuery, sectionValues, function(err, rows, fields) {
                                            if(err) {
                                                console.log(sectionQuery);
                                                console.log(sectionValues);
                                                console.error(err);
                                                reject();
                                            } else {
                                                if(section.newSection) {
                                                    sectionInsertId = rows.insertId;
                                                }
                                                let fieldCounter = -1;
                                                section.fields.forEach((field) => {
                                                    fieldCounter++
                                                    if (field.deleted) {
                                                        let fieldQuery = `DELETE FROM form_fields WHERE id=?`;
                                                        database.execute(fieldQuery, [field.id], function(err, rows, fields) {
                                                            if(err) {
                                                                console.error(err);
                                                                reject();
                                                            }
                                                        });
                                                    } else {
                                                        let fieldQuery = `form_fields SET title=?, value=?, type=?, form_fields.order=?, required=?`;
                                                        let fieldValues = [
                                                            field.title,
                                                            '',
                                                            field.type,
                                                            field.order,
                                                            field.required
                                                        ];
                                                        let fieldInsertId = false;
                                                        if(field.newField) {
                                                            fieldQuery = `INSERT INTO ${fieldQuery}, formSectionId=?`;
                                                            if(section.newSection) {
                                                                fieldValues.push(sectionInsertId);
                                                            } else {
                                                                fieldValues.push(section.id);
                                                            }
                                                        } else {
                                                            fieldQuery = `UPDATE ${fieldQuery} WHERE id=?`;
                                                            fieldValues.push(field.id);
                                                        }
                                                        database.execute(fieldQuery, fieldValues, function(err, rows, fields) {
                                                            if(err) {
                                                                console.error(err);
                                                                reject();
                                                            } else {
                                                                if(field.newField) {
                                                                    fieldInsertId = rows.insertId;
                                                                }
                                                                let itemCounter = -1;
                                                                field.items.forEach((item) => {
                                                                    itemCounter++
                                                                    if (item.deleted) {
                                                                        let itemQuery = `DELETE FROM form_fields WHERE id=?`;
                                                                        database.execute(itemQuery, [item.id], function(err, rows, fields) {
                                                                            if(err) {
                                                                                console.error(err);
                                                                                reject();
                                                                            }
                                                                        });
                                                                    } else {
                                                                        let itemQuery = `form_fields_items SET title=?, other=?, form_fields_items.order=?`;
                                                                        let itemValues = [
                                                                            item.title,
                                                                            false,
                                                                            item.order
                                                                        ];
                                                                        let itemInsertId = false;
                                                                        if(item.newItem) {
                                                                            itemQuery = `INSERT INTO ${itemQuery}, formFieldId=?`;
                                                                            if(field.newField) {
                                                                                itemValues.push(fieldInsertId);
                                                                            } else {
                                                                                itemValues.push(field.id);
                                                                            }
                                                                        } else {
                                                                            itemQuery = `UPDATE ${itemQuery} WHERE id=?`;
                                                                            itemValues.push(item.id);
                                                                        }
                                                                        database.execute(itemQuery, itemValues, function(err, rows, fields) {
                                                                            if(err) {
                                                                                console.error(err);
                                                                                reject();
                                                                            } else {
                                                                                if (sectionCounter === req.body.sections.length && fieldCounter === section.fields.length && itemCounter === field.items.length) {
                                                                                    console.log('section promise resolved');
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
                                    }
                                });
                            });
                            formPromise.then(() => {}, () => {
                                submitErrors = true;
                                console.error('form problem');
                            })
                            .then(() => {
                                sectionPromise.then(() => {}, () => {
                                    submitErrors = true;
                                    console.error('section/field/item problem');
                                })
                            })
                            .then(() => {
                                if(submitErrors) {
                                    return res.status(500).json({'status': 'There were some problems.'});
                                } else {
                                    return res.json({'status': 'form updated successfully'});
                                }
                            });
                        }
                    } else {
                        return res.status(500);
                    }
                } 
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.delete_form = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let formDeleteQuery = `DELETE FROM forms WHERE url = ?`;
            database.execute(formDeleteQuery, [req.params.formUrl], function (err, checkRows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    return res.json({'status': 'form deleted successfully'});            
                } 
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};

exports.create_form = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let finalSectionIndex = req.body.sections.length - 1;
        let finalFieldIndex = req.body.sections[finalSectionIndex].fields.length -1;
        let finalItemIndex = req.body.sections[finalSectionIndex].fields[finalFieldIndex].items.length - 1;
        console.log(finalItemIndex);
        let decodedToken = jwt.decode(req.token);
        if (decodedToken.role === 'admin') {
            let formCheckQuery = `SELECT COUNT(id) as idCount FROM forms WHERE url = ?`;
            let formCheckValues = [
                req.body.url
            ];
            database.execute(formCheckQuery, formCheckValues, function (err, checkRows, fields) {
                if(err) {
                    console.error(err);
                    return res.sendStatus(500);
                } else {
                    if(checkRows.length) {
                        if(checkRows[0].idCount) {
                            return res.status(409).json({status: 'URL already exists, please select another URL', module: 'url', error: true});
                        } else {
                            let formQuery = `INSERT INTO forms SET title=?, recipients=?, emailSubject=?, description=?, url=?, color=?, successTitle=?, successMessage=?, submit=?`;
                            let formValues = [
                                req.body.title,
                                req.body.recipients,
                                req.body.emailSubject,
                                req.body.description,
                                req.body.url,
                                req.body.color,
                                req.body.success.title,
                                req.body.success.message,
                                req.body.submit
                            ];
                            database.execute(formQuery, formValues, function(err, formRows, fields) {
                                if(err) {
                                    console.error(err);
                                    return res.status(500).json({'status': 'There were some problems.'});
                                } else {
                                    let formInsertId = formRows.insertId;
                                    for (let sectionI = 0; sectionI < req.body.sections.length; sectionI++) {
                                        let sectionQuery = `INSERT INTO form_sections SET title=?, form_sections.order=?, formId=?`;
                                        let sectionValues = [
                                            req.body.sections[sectionI].title,
                                            req.body.sections[sectionI].order,
                                            formInsertId
                                        ];
                                        database.execute(sectionQuery, sectionValues, function(err, sectionRows, fields) {
                                            if(err) {
                                                console.error(err);
                                                return res.status(500).json({'status': 'There were some problems.'});
                                            } else {
                                                let sectionInsertId = sectionRows.insertId;
                                                for(let fieldI = 0; fieldI < req.body.sections[sectionI].fields.length; fieldI++) {
                                                    let fieldQuery = `INSERT INTO form_fields SET title=?, value=?, type=?, form_fields.order=?, required=?, formSectionId=?`;
                                                    let fieldValues = [
                                                        req.body.sections[sectionI].fields[fieldI].title,
                                                        '',
                                                        req.body.sections[sectionI].fields[fieldI].type,
                                                        req.body.sections[sectionI].fields[fieldI].order,
                                                        req.body.sections[sectionI].fields[fieldI].required,
                                                        sectionInsertId
                                                    ];
                                                    database.execute(fieldQuery, fieldValues, function(err, fieldRows, fields) {
                                                        if(err) {
                                                            console.error(err);
                                                            return res.status(500).json({'status': 'There were some problems.'});
                                                        } else {
                                                            let fieldInsertId = fieldRows.insertId;
                                                            if(req.body.sections[sectionI].fields[fieldI].items.length) {
                                                                for(let itemI = 0; itemI < req.body.sections[sectionI].fields[fieldI].items.length; itemI++) {
                                                                    let itemQuery = `INSERT INTO form_fields_items SET title=?, other=?, form_fields_items.order=?, formFieldId=?`;
                                                                    let itemValues = [
                                                                        req.body.sections[sectionI].fields[fieldI].items[itemI].title,
                                                                        false,
                                                                        req.body.sections[sectionI].fields[fieldI].items[itemI].order,
                                                                        fieldInsertId
                                                                    ];
                                                                    database.execute(itemQuery, itemValues, function(err, itemRows, fields) {
                                                                        if(err) {
                                                                            return res.status(500).json({'status': 'There were some problems.'});
                                                                        } else {
                                                                            if(finalItemIndex) {
                                                                                if(sectionI === finalSectionIndex && fieldI === finalFieldIndex && itemI === req.body.sections[finalSectionIndex].fields[finalFieldIndex].items.length - 1) {
                                                                                    res.json({'status': 'form created successfully'});
                                                                                }
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            } else {
                                                                if(finalItemIndex === -1) {
                                                                    if(sectionI === finalSectionIndex && fieldI === finalFieldIndex) {
                                                                        res.json({'status': 'form created successfully'});
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    } else {
                        return res.status(500);
                    }
                } 
            });
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};