const database = require('../database.js');

exports.search = function(req, res) {
    let searchQuery = `SELECT pages.description, pages.image, pages.color, pages.type, pages.start, pages.keywords, pages.title, pages.updated, pages.url, users.firstName, users.lastName FROM pages JOIN users ON authorId = users.id WHERE url LIKE ? OR title LIKE ? OR keywords LIKE ? OR description LIKE ? ORDER BY pages.title ASC, pages.url ASC`;
    let searchValues = [
        `%${req.params.searchString}%`,
        `%${req.params.searchString}%`,
        `%${req.params.searchString}%`,
        `%${req.params.searchString}%`
    ];
    database.execute(searchQuery, searchValues, function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.status(500).json({'status': 'There were some problems.'});
        } else {
            return res.json(rows);
        }
    });
};