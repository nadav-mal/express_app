
exports.getImages = (req, res, next) => {
    console.log(3)

    console.log(req.body)
};

/**
 * handles the post request from the add product page.
 * redirects to the home page to show all products.
 * @param req
 * @param res
 * @param next
 */
exports.postImages = (req, res, next) => {
    try {

       // res.redirect('/admin/register-password');
    } catch (err) {
        // TO DO! we must handle the error here and generate a EJS page to display the error.
    }
};