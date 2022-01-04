'use strict';
module.exports = function(app) {
    const authController = require('../controllers/authController'),
        changePasswordController = require('../controllers/changePasswordController'),
        resetPasswordController = require('../controllers/resetPasswordController'),
        usersController = require('../controllers/usersController'),
        articlesController = require('../controllers/articlesController'),
        eventsController = require('../controllers/eventsController'),
        heroController = require('../controllers/heroController'),
        programController = require('../controllers/programController'),
        historyController = require('../controllers/historyController'),
        landingController = require('../controllers/landingController'),
        imageController = require('../controllers/imageController'),
        locationController = require('../controllers/locationController'),
        boardController = require('../controllers/boardController'),
        homeController = require('../controllers/homeController'),
        pageController = require('../controllers/pageController'),
        menuController = require('../controllers/menuController'),
        footerController = require('../controllers/footerController'),
        searchController = require('../controllers/searchController'),
        listController = require('../controllers/listController'),
        donateController = require('../controllers/donateController'),
        mediaController = require('../controllers/mediaController'),
        contactController = require('../controllers/contactController'),
        formController = require('../controllers/formController'),
        stagingController = require('../controllers/stagingController');

    app.route('/api/article')
        .post(articlesController.create_article);

    app.route('/api/article/:url')
        .get(articlesController.get_article)
        .put(articlesController.update_article)
        .delete(articlesController.delete_article);

    app.route('/api/article/:url/:id')
        .delete(articlesController.delete_article);

    app.route('/api/articles')
        .get(articlesController.get_articles);

    app.route('/api/auth')
        .post(authController.login);

    app.route('/api/board')
        .get(boardController.get_board)
        .put(boardController.update_board);

    app.route('/api/change-password')
        .put(changePasswordController.change_password);

    app.route('/api/contact')
        .post(contactController.contact);

    app.route('/api/donate')
        .get(donateController.donate_content)
        .put(donateController.update_donate);

    app.route('/api/event/:eventUrl')
        .get(eventsController.get_event);

    app.route('/api/events')
        .get(eventsController.get_events);

    app.route('/api/events/month/:year/:month')
        .get(eventsController.get_month);

    app.route('/api/events/search/:searchTerm')
        .get(eventsController.get_search);

    app.route('/api/faq/program/:programId')
        .get(programController.get_faqs);

    app.route('/api/faq/landing/:landingId')
        .get(landingController.get_faqs);

    app.route('/api/footer')
        .get(footerController.get_footer)
        .put(footerController.update_footer);

    app.route('/api/form/:formUrl')
        .get(formController.get_form)
        .put(formController.update_form)
        .post(formController.submit_form)
        .delete(formController.delete_form);

    app.route('/api/form')
        .get(formController.get_forms)
        .post(formController.create_form);

    app.route('/api/hero')
        .get(heroController.get_heroes)
        .post(heroController.create_hero);

    app.route('/api/hero/:heroId')
        .get(heroController.get_hero)
        .put(heroController.update_hero);
        
    app.route('/api/history')
        .get(historyController.get_history)
        .put(historyController.update_history);

    app.route('/api/home')
        .get(homeController.get_home)
        .put(homeController.update_home);

    app.route('/api/images')
        .get(imageController.get_images);

    app.route('/api/landing/:landingLink')
        .get(landingController.get_landing);

    app.route('/api/landing/:landingId')
        .put(landingController.update_landing);

    app.route('/api/list')
        .get(listController.get_lists)
        .post(listController.create_list);

    app.route('/api/list/:listUrl')
        .get(listController.get_list)
        .put(listController.update_list)

    app.route('/api/list/:listUrl/:id/:pageId')
        .delete(listController.delete_list);

    app.route('/api/location')
        .get(locationController.get_locations)
        .put(locationController.update_locations);

    app.route('/api/location/:locationId')
        .get(locationController.get_location);

    app.route('/api/media')
        .get(mediaController.get_media)
        .put(mediaController.update_media);

    app.route('/api/menu')
        .get(menuController.get_menu)
        .put(menuController.update_menu);

    app.route('/api/news')
        .get(articlesController.get_news);

    app.route('/api/page')
        .get(pageController.get_pages)
        .post(pageController.get_page);

    app.route('/api/program')
        .get(programController.get_programs);

    app.route('/api/program/:programLink')
        .get(programController.get_program);

    app.route('/api/program/:programId')
        .put(programController.update_program);
        
    app.route('/api/program-locations/:programId')
        .get(programController.get_locations);

    // app.route('/api/resend-validation/:userEmail')
    //     .get(usersController.resend_validation);

    app.route('/api/reset-password/:userEmail')
        .put(resetPasswordController.reset_password);

    app.route('/api/rsvp/:eventId')
        .get(eventsController.get_rsvp)
        .put(eventsController.save_rsvp)
        .post(eventsController.create_rsvp_response)
        .delete(eventsController.remove_rsvp);

    app.route('/api/search/:searchString')
        .get(searchController.search);

    // app.route('/api/sign-up')
    //     .post(usersController.sign_up);

    app.route('/api/sitemap')
        .get(pageController.update_sitemap);

    app.route('/api/revisions/:type/:id')
        .get(stagingController.get_revisions);

    app.route('/api/revision/:id')
        .get(stagingController.get_revision);

    app.route('/api/revision/:id/:action')
        .put(stagingController.action_revision);

    app.route('/api/staged/:type/:id')
        .get(stagingController.get_staged);

    app.route('/api/staged/:id')
        .delete(stagingController.remove_staged);

    app.route('/api/upload/form')
        .post(formController.upload_form);

    app.route('/api/upload/image')
        .post(imageController.upload_image);

    app.route('/api/upload/media')
        .post(mediaController.upload_media);

    app.route('/api/user')
        .post(usersController.add_user);

    app.route('/api/user/:userId')
        .get(usersController.get_user)
        .put(usersController.update_user)
        .delete(usersController.delete_user);

    app.route('/api/users')
        .get(usersController.get_users);

    // app.route('/api/validate/:userValidationString')
    //     .get(usersController.validate_user);    

};