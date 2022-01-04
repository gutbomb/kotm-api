const { link } = require('fs');
const database = require('../database.js'),
    appConfig = require('../appConfig'),
    jwt = require('jsonwebtoken'),
    verifyToken = require('../verifyToken.js');


exports.get_footer = function(req, res) {
    let footer = [];
    let prevMenu = -1;
    let menuQuery = 'SELECT footer_menus.id as menuId, footer_menus.title as menuTitle, footer_menus.footerOrder, footer_menu_items.id as itemId, footer_menu_items.title as itemTitle, footer_menu_items.url, footer_menu_items.itemOrder FROM footer_menus JOIN footer_menu_items ON footer_menus.id = footer_menu_items.footerMenuId ORDER BY footer_menus.footerOrder ASC, footer_menu_items.itemOrder ASC';
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
                            menuOrder: rows[i].footerOrder,
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
                            footer.push(newMenu);
                        }
                    } else {
                        footer.push(newMenu);
                    }
                }
                return res.json(footer);                
            } else {
                return res.sendStatus(404);
            }
        }
    });
};

exports.update_footer = function(req, res) {
    if(verifyToken(req.token, appConfig.jwtKey)) {
        let decodedToken = jwt.decode(req.token);
        let submitErrors = false;
        if (decodedToken.role === 'admin') {
            let menuPromise = new Promise((resolve, reject) => {
                let menuCounter = -1;
                req.body.footer.forEach((menu) => {
                    menuCounter++;
                    let menuQuery = `UPDATE footer_menus SET title=? WHERE id=?`;
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
                                    let itemQuery = `DELETE FROM footer_menu_items WHERE id=?`;
                                    database.execute(itemQuery, [item.id], function(err, rows, fields) {
                                        if(err) {
                                            console.error(err);
                                            reject();
                                        }
                                    });
                                } else {
                                    let itemQuery = `footer_menu_items SET itemOrder=?, title=?, url=?`;
                                    let itemValues = [
                                        item.itemOrder,
                                        item.title,
                                        item.url
                                    ];
                                    if(item.newItem) {
                                        itemQuery = `INSERT INTO ${itemQuery}, footerMenuId=?`;
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
                                            if (menuCounter === (req.body.footer.length - 1) && itemCounter === (menu.items.length - 1)) {
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
                    return res.json({'status': 'footer menu updated successfully'});
                }
            })
        } else {
            return res.status(403).json({'status': 'Permission denied.'});
        }
    } else {
        return res.status(401).json({'status': 'Invalid token.'});
    }
};