const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url } = require('../helper/common');
let apiUrl = api_url + '/faqs/';

exports.faqList = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Faq', apiUrl, image_url: process.env.IMAGE_URL };
    res.render('Faq/list')
});
exports.getFaqs = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl, { ...req.body })
        .then(r => {
            // Assign value in session
            res.status(200).json(r.data);
        })
        .catch(error => {
            //   req.flash('error', 'Incorrect email or password!');
        })

});
exports.getFaq = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Faq', apiUrl, image_url: process.env.IMAGE_URL };
    axios.get(apiUrl + req.params.id)
        .then(r => {
            res.locals = { title: 'Faq' };
            res.render('Faq/edit', { row: r.data.data });
        })
        .catch(error => {

        })
});


exports.updateFaq = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Faq' };
    axios.post(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            req.flash('message', 'Data save');
            res.redirect(process.env.ADMIN_URL + '/admin/faq');
        })
        .catch(error => { req.flash('error', 'Data not updated'); })
});
exports.editFaq = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Faq', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/post' };
    axios.get(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session

            req.flash('message', 'Data save');

            res.render('Faq/edit', { row: r.data.data });
        })
        .catch(error => {

            req.flash('error', 'Data not updated');

        })
});

exports.deleteFaq = asyncHandler(async (req, res, next) => {
    callApi(req).delete(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Player-edit' };
            req.flash('success', 'Deleted');
            // res.render('Players/List',{row:r.data.data}); 

        }).catch(error => { req.flash('error', 'Data not updated'); })
    res.status(200).json({
        success: true,
        data: {}
    });
});




exports.getFaq = asyncHandler(async (req, res, next) => {

    axios.post(apiUrl, { ...req.body })
        .then(r => {
            // Assign value in session

            res.status(200).json(r.data);


        })
        .catch(error => {

            //   req.flash('error', 'Incorrect email or password!');

        })

});


exports.faqAdd = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Faq', 'apiUrl': apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/post', image_url: process.env.IMAGE_URL };

    res.render('Faq/add', { row: {} });
});


exports.createFaq = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Faq' };
    //console.log('creating-image',req.body, req.files);

    axios.post(apiUrl + 'add', req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Faq' };
            req.flash('message', 'Data save');
            res.redirect(process.env.ADMIN_URL + '/admin/faq');


        })
        .catch(error => {
            //   

            req.flash('error', 'Data not updated');

        })
});


