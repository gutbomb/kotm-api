const https = require('https'),
    querystring = require('querystring'),
    appConfig = require('./appConfig'),
    mysql = require('mysql2'),
    moment = require('moment-timezone'),
    fs = require('fs'),
    gm = require('gm'),
    prefix = moment().format('YYYY-MM-DD-HH-mm-'),
    styleRegex = /<style([\S\s]*?)>([\S\s]*?)<\/style>/ig;

let Stream = require('stream').Transform;

let imageCounter = 0;

let accessToken = '';

let loginData = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: `${appConfig.sharepoint.clientId}@${appConfig.sharepoint.realm}`,
    client_secret: appConfig.sharepoint.clientSecret,
    resource: `00000003-0000-0ff1-ce00-000000000000/${appConfig.sharepoint.host}@${appConfig.sharepoint.realm}`
});

let loginOptions = {
    hostname: 'accounts.accesscontrol.windows.net',
    port: 443,
    path: `/${appConfig.sharepoint.realm}/tokens/OAuth/2`,
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type':'application/x-www-form-urlencoded',
        'Content-Length': loginData.length
    }
};

let programs = [
    {
        name: 'General Public Events',
        id: 99,
        color: 'gray'
    }, {
        name: 'Autism Center Public Events',
        id: 1,
        color: 'red'
    }, {
        name: 'Child Care Public Events',
        id: 2,
        color: 'purple'
    }, {
        name: 'Early Head Start Public Events',
        id: 3,
        color: 'green'
    }, {
        name: 'Early Intervention Public Events',
        id: 4,
        color: 'orange'
    }, {
        name: 'Mental Health Public Events',
        id: 5,
        color: 'teal'
    }, {
        name: 'Respite Care Public Events',
        id: 6,
        color: 'blue'
    }
];

programs.forEach((program) => {
    var req = https.request(loginOptions, function (res) {
        var result = '';
        res.on('data', function (chunk) {
          result += chunk;
        });
        res.on('end', function () {
            accessToken = JSON.parse(result).access_token;
            let eventsOptions = {
                host: appConfig.sharepoint.host,
                path: `/sites/EmployeeResourceCenter/_api/web/lists/getByTitle('${encodeURI(program.name)}')/items?$expand=AttachmentFiles`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json;odata=nometadata'
                }
            };
            let eventsRequest = https.request(eventsOptions, function (response) {
                let str = ''
                response.on('data', function (chunk) {
                str += chunk;
                });
            
                response.on('end', function () {
                    let processEvents = [];
                    let events = JSON.parse(str).value;
                    if (events.length === 0) {
                        addEvents(processEvents, program.id);
                    } else {
                        for (let i=0; i<events.length; i++) {
                            let newEvent = {
                                title: events[i].Title,
                                start: moment(events[i].EventDate).tz('America/Denver').format('YYYY/MM/DD HH:mm:ss'),
                                end: moment(events[i].EndDate).tz('America/Denver').format('YYYY/MM/DD HH:mm:ss'),
                                allDay: events[i].fAllDayEvent,
                                programId: program.id,
                                description: events[i].Description.replace(styleRegex, ''),
                                guid: events[i].GUID,
                                created: events[i].Created,
                                modified: events[i].Modified,
                                location: events[i].Location,
                                color: program.color,
                                url: `${encodeURI(events[i].Title.replace(/ /g, '-').toLowerCase())}-${moment(events[i].EventDate).format('YYYY-MM-DD')}`
                            };
                            
                            if(events[i].AttachmentFiles.length) {
                                newEvent.image = `${prefix}${imageCounter}-${events[i].AttachmentFiles[0].FileName.replace(' ', '-')}`;
                                newEvent.imageOptions = {
                                    host: appConfig.sharepoint.host,
                                    path: `/sites/EmployeeResourceCenter/_api/Web/GetFileByServerRelativeUrl('${encodeURI(events[i].AttachmentFiles[0].ServerRelativeUrl)}')/$value`,
                                    method: 'GET',
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                    }
                                };
                                processEvents.push(newEvent);
                                if(processEvents.length === events.length) {
                                    addEvents(processEvents, program.id);
                                }
                            } else {
                                newEvent.imageOptions = false;
                                newEvent.image = 'logo.png';
                                processEvents.push(newEvent);
                                if(processEvents.length === events.length) {
                                    addEvents(processEvents, program.id);
                                }
                            }
                        };
                    }
                    
                });
            });
    
            eventsRequest.on('error', function (err) {
                console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
            });
    
            eventsRequest.end();
        });
        res.on('error', function (err) {
            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
        })
    });
    
    req.on('error', function (err) {
        console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
    });
    
    req.write(loginData);
    req.end();
});

let processImage = function (imageOptions, newImage) {
    let imageRequest = https.request(imageOptions, (imageResponse) => {
        let imageStr = new Stream();
        imageResponse.on('data', (imageChunk) => {
            imageStr.push(imageChunk);
        });

        imageResponse.on('end', () => {
            imageCounter++;
            
            fs.writeFileSync(`${appConfig.imageUploadDirectory}${newImage}`, imageStr.read())
            gm(`${appConfig.imageUploadDirectory}${newImage}`)
            .selectFrame(0)
            .resize(null, 150)
            .write(`${appConfig.thumbsUploadDirectory}${newImage}`, function(err) {
                if(err) {
                    console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
                } else {
                    gm(`${appConfig.imageUploadDirectory}${newImage}`)
                    .resize(1920, null, '>')
                    .write(`${appConfig.imageUploadDirectory}${newImage}`, function(err) {
                        if(err) {
                            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
                        } else {
                            
                        }
                    });
                }
            });
        });
    });
    imageRequest.on('error', function (err) {
        console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
    });

    imageRequest.end();
};

let addEvents = function (events, programId) {
    let eventsQuery = `SELECT * FROM events WHERE programId = ?`;
    let database = mysql.createConnection(appConfig.dbConnect);
    database.execute(eventsQuery, [programId], function(err, rows, fields) {
        if(err) {
            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
        } else {
            if(rows.length) {
                if(events.length === 0) {
                    for(let i = 0; i < rows.length; i++) {
                        rows[i].delete = true;
                        if(i === (rows.length - 1)) {
                            deleteEvents(rows, programId);
                        }
                    }
                } else {
                    for(let i = 0; i < rows.length; i++) {
                        for(eventsI = 0; eventsI < events.length; eventsI++) {
                            if(rows[i].guid === events[eventsI].guid) {
                                events[eventsI].matched = true;
                                rows[i].matched = true;
                                rows[i].delete = false;
                                if (moment(rows[i].modified).format('YYYY/MM/DD HH:mm:ss') === moment(events[eventsI].modified).format('YYYY/MM/DD HH:mm:ss')) {
                                    events[eventsI].update = false;
                                } else {
                                    events[eventsI].update = true;
                                }
                            } else {
                                if (events[eventsI].matched !== true) {
                                    events[eventsI].matched = false;
                                }
                                if(rows[i].delete !== false) {
                                    rows[i].delete = true;
                                    rows[i].update = false;
                                    rows[i].matched = false;
                                }
                            }
                        };
                        if(i === (rows.length - 1)) {
                            deleteEvents(rows, programId);
                            for(eventsI = 0; eventsI < events.length; eventsI++) {
                                
                                if(events[eventsI].allDay) {
                                    events[eventsI].allDay = 1;
                                } else {
                                    events[eventsI].allDay = 0;
                                }
                                if(events[eventsI].matched) {
                                    if(events[eventsI].update) {
                                        updateEvent(events[eventsI]);
                                    }
                                } else {
                                    insertEvent(events[eventsI]);
                                }
                            };
                        }
                    }
                }
                
            } else {
                for(eventsI = 0; eventsI < events.length; eventsI++) {
                            
                    if(events[eventsI].allDay) {
                        events[eventsI].allDay = 1;
                    } else {
                        events[eventsI].allDay = 0;
                    }
                    insertEvent(events[eventsI]);
                };
            }
        } 
    });
    database.end();
};

let deleteEvents = function (events, programId) {
    events.forEach((event) => {
        if (event.delete && event.programId === programId) {
            console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: deleting event: ${event.title}`);
            let deleteQuery = 'DELETE FROM events WHERE guid = ?'
            let database = mysql.createConnection(appConfig.dbConnect);
            database.execute(deleteQuery, [event.guid], function(err, rows, fields) {
                if(err) {
                    console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
                } else {
                    let pageQuery = `DELETE FROM pages WHERE eventGUID = ?`;
                    let database2 = mysql.createConnection(appConfig.dbConnect);
                    database2.execute(pageQuery, [event.guid], function(err, rows, fields) {
                        if(err) {
                            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
                        }
                    });
                    database2.end();
                }
            });
            database.end();
        }
    });
};

let updateEvent = function (event) {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: updating event: ${event.title}`);
    if(event.imageOptions) {
        processImage(event.imageOptions, event.image);
    }
    let updateQuery = 'UPDATE events SET title=?, start=?, end=?, allDay=?, programId=?, description=?, image=?, eventLocationId=(SELECT id FROM eventLocations WHERE title = ?), modified=?, created=?, url=? WHERE guid = ?';
    let updateValues = [
        event.title,
        event.start,
        event.end,
        event.allDay,
        event.programId,
        event.description,
        event.image,
        event.location,
        moment(event.modified).format('YYYY/MM/DD HH:mm:ss'),
        moment(event.created).format('YYYY/MM/DD HH:mm:ss'),
        event.url,
        event.guid
    ];
    let database = mysql.createConnection(appConfig.dbConnect);
    database.execute(updateQuery, updateValues, function(err, rows, fields) {
        if(err) {
            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
        } else {
            let pageQuery = `UPDATE pages SET url=?, title=?, description=?, updated=NOW(), image=?, color=?, start=?, type='event' WHERE eventGUID = ?`;
            let pageValues = [
                `/event/${event.url}`,
                event.title,
                event.description,
                event.image,
                event.color,
                event.start,
                event.guid
            ];
            let database2 = mysql.createConnection(appConfig.dbConnect);
            database2.execute(pageQuery, pageValues, function(err, rows, fields) {
                if(err) {
                    console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
                }
            });
            database2.end();
        }
    });
    database.end();
};

let insertEvent = function (event) {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: inserting event: ${event.title}`);
    if(event.imageOptions) {
        processImage(event.imageOptions, event.image);
    }
    let insertQuery = 'INSERT INTO events SET title=?, start=?, end=?, allDay=?, programId=?, description=?, image=?, eventLocationId=(SELECT id FROM eventLocations WHERE title = ?), modified=?, created=?, url=?, guid=?';
    let insertValues = [
        event.title,
        event.start,
        event.end,
        event.allDay,
        event.programId,
        event.description,
        event.image,
        event.location,
        moment(event.modified).format('YYYY/MM/DD HH:mm:ss'),
        moment(event.created).format('YYYY/MM/DD HH:mm:ss'),
        event.url,
        event.guid
    ];
    let database = mysql.createConnection(appConfig.dbConnect);
    database.execute(insertQuery, insertValues, function(err, rows, fields) {
        if(err) {
            console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
        } else {
            let pageQuery = `INSERT INTO pages SET url=?, title=?, description=?, updated=NOW(), image=?, color=?, start=?, eventGUID=?, type='event'`;
            let pageValues = [
                `/event/${event.url}`,
                event.title,
                event.description,
                event.image,
                event.color,
                event.start,
                event.guid
            ];
            let database2 = mysql.createConnection(appConfig.dbConnect);
            database2.execute(pageQuery, pageValues, function(err, rows, fields) {
                if(err) {
                    console.error(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${err}`);
                }
            });
            database2.end();
        }
    });
    database.end();
};