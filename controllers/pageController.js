const appConfig = require('../appConfig.js'),
    database = require('../database.js'),
    moment = require('moment'),
    fs = require('fs');

exports.get_page = function(req, res) {
    let pageQuery = `SELECT pages.id, pages.description, pages.image, pages.color, pages.type, pages.start, pages.keywords, pages.title, pages.updated, pages.url, users.firstName, users.lastName FROM pages JOIN users ON authorId = users.id WHERE url = ?`;
    database.execute(pageQuery, [req.body.pageUrl], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.status(500).json({'status': 'There were some problems.'});
        } else {
            return res.json(rows[0]);
        }
    });
};

exports.get_pages = function(req, res) {
    let pagesQuery = `SELECT pages.id, pages.description, pages.image, pages.color, pages.type, pages.start, pages.keywords, pages.title, pages.updated, pages.url, users.firstName, users.lastName FROM pages JOIN users ON authorId = users.id ORDER BY pages.title ASC, pages.url ASC`;
    database.execute(pagesQuery, [], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.status(500).json({'status': 'There were some problems.'});
        } else {
            return res.json(rows);
        }
    });
};

exports.update_sitemap = function(req, res) {
    let sitemap = `<?xml version='1.0' encoding='UTF-8'?>\n\r<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\r`;
    sitemap += `    <url>\n\r       <loc>https://kotm.org/</loc>\n\r       <lastmod>${moment().format('YYYY-MM-DD')}</lastmod>\n\r    </url>\n\r`
    let sitemapQuery = `SELECT url, updated FROM pages ORDER BY url ASC`;
    let programPages = [];
    let sitemapPromise = new Promise((resolve, reject) => {
        console.log('mainSiteMap started')
        database.execute(sitemapQuery, [], function(err, rows, fields) {
            if(err) {
                console.error(err);
                return res.status(500).json({'status': 'There were some problems.'});
            } else {
                let pageCounter = 0;
                rows.forEach((page) => {
                    pageCounter++;
                    if (page.url==='/article/donation-complete') {
                        // do nothing
                    } else if(page.url==='/home') {
                        sitemap += `    <url>\n\r       <loc>https://kotm.org${page.url}</loc>\n\r       <lastmod>${moment().format('YYYY-MM-DD')}</lastmod>\n\r    </url>\n\r`;
                    } else if(page.url.includes('/programs/')){
                        sitemap += `    <url>\n\r       <loc>https://kotm.org${page.url}</loc>\n\r       <lastmod>${moment(page.updated).format('YYYY-MM-DD')}</lastmod>\n\r    </url>\n\r`;
                        programPages.push(page);
                    } else {
                        sitemap += `    <url>\n\r       <loc>https://kotm.org${page.url}</loc>\n\r       <lastmod>${moment(page.updated).format('YYYY-MM-DD')}</lastmod>\n\r    </url>\n\r`;
                    }
                    if(pageCounter === rows.length) {
                        resolve();
                    }
                })
            }
        });
    });
    sitemapPromise.then(() => {
        console.log('mainSiteMap done');
    })
    .then(() => {
        let programsPromise = new Promise((resolve, reject) => {
            console.log('starting programsPromise');
            for (let i = 0; i<programPages.length; i++) {
                programQuery = `SELECT * FROM programs JOIN program_tabs ON program_tabs.programId = programs.id WHERE programs.link = ? ORDER BY tabOrder`;
                database.execute(programQuery, [programPages[i].url.replace('/programs/', '')], function(programErr, programRows, programFields) {
                    if (programErr) {
                        console.error(programErr);
                    } else {
                        for (let r = 0; r<programRows.length; r++) {
                            if(programRows[r].tabOrder !== 0) {
                                console.log(`adding program tab ${programPages[i].url}/${programRows[r].slug}`);
                                sitemap += `    <url>\n\r       <loc>https://kotm.org${programPages[i].url}/${programRows[r].slug}</loc>\n\r       <lastmod>${moment(programPages[i].updated).format('YYYY-MM-DD')}</lastmod>\n\r    </url>\n\r`;
                            }
                            if(i === (programPages.length - 1) && r === (programRows.length - 1)) {
                                resolve();
                            }
                        };
                    }
                });
            }
        });
        programsPromise.then(() => {
            console.log('done');
            sitemap += `</urlset>`;
            fs.writeFile(`${appConfig.sitemapDirectory}sitemap.xml`, sitemap, (e) => {
                if (e) {
                    console.error(e);
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'sitemap updated'});
                }
            })
        });
    });
}