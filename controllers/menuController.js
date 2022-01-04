const { link } = require('fs');
const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');


exports.get_menu = function(req, res) {
    let menuBar = [];
    let prevMenu = -1;
    let menuQuery = 'SELECT menus.id as menuId, menus.title as menuTitle, menus.internalTitle, menus.menuOrder, menu_items.id as itemId, menu_items.title as itemTitle, menu_items.url, menu_items.itemOrder FROM menus JOIN menu_items ON menus.id = menu_items.menuId ORDER BY menus.menuOrder ASC, menu_items.itemOrder ASC';
    database.execute(menuQuery, [], function(err, rows, fields) {
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        } else {
            if(rows.length) {
                for (i = 0; i < rows.length; i++) {
                    if(prevMenu !== rows[i].menuId) {
                        prevMenu = rows[i].menuId;
                        newMenu = {
                            id: rows[i].menuId,
                            title: rows[i].menuTitle,
                            internalTitle: rows[i].internalTitle,
                            menuOrder: rows[i].menuOrder,
                            items: []
                        };
                    }
                    newMenu.items.push({
                        id: rows[i].itemId,
                        title: rows[i].itemTitle,
                        url: rows[i].url,
                        itemOrder: rows[i].itemOrder
                    });
                    if(i !== rows.length - 1) {
                        if(rows[(i+1)].menuId > newMenu.id) {
                            menuBar.push(newMenu);
                        }
                    } else {
                        menuBar.push(newMenu);
                    }
                }
                return res.json(menuBar);                
            } else {
                return res.sendStatus(404);
            }
        }
    });
};

exports.update_menu = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let menuPromise = new Promise((resolve, reject) => {
                let menuCounter = -1;
                req.body.menu.forEach((menu) => {
                    menuCounter++;
                    let menuQuery = `UPDATE menus SET title=? WHERE id=?`;
                    let menuValues = [
                        menu.title,
                        menu.id
                    ];
                    database.execute(menuQuery, menuValues, function(err, rows, fields) {
                        if(err) {
                            console.error(err);
                            reject();
                        } else {
                            let itemCounter = -1;
                            menu.items.forEach((item) => {
                                itemCounter++
                                if (item.deleted) {
                                    let itemQuery = `DELETE FROM menu_items WHERE id=?`;
                                    database.execute(itemQuery, [item.id], function(err, rows, fields) {
                                        if(err) {
                                            console.error(err);
                                            reject();
                                        }
                                    });
                                } else {
                                    let itemQuery = `menu_items SET itemOrder=?, title=?, url=?`;
                                    let itemValues = [
                                        item.itemOrder,
                                        item.title,
                                        item.url
                                    ];
                                    if(item.newItem) {
                                        itemQuery = `INSERT INTO ${itemQuery}, menuId=?`;
                                        itemValues.push(menu.id);
                                    } else {
                                        itemQuery = `UPDATE ${itemQuery} WHERE id=?`;
                                        itemValues.push(item.id);
                                    }
                                    database.execute(itemQuery, itemValues, function(err, rows, fields) {
                                        if(err) {
                                            console.error(err);
                                            reject();
                                        } else {
                                            if (menuCounter === (req.body.menu.length - 1) && itemCounter === (menu.items.length - 1)) {
                                                resolve();
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
            menuPromise.then(() => {}, (e) => {
                submitErrors = true;
                console.error(e);
            })
            .then(() => {
                if(submitErrors) {
                    return res.status(500).json({'status': 'There were some problems.'});
                } else {
                    return res.json({'status': 'header menu updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};