//const Cookies = require('cookies')
/** A MODULE to manage the Product model.
 * in future examples, we will use a database to store data.
 */
const cookieLifetime = 30
module.exports = class Account {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }
//kop
    /** Save the product to a file.
     * @throws {Error} if the product already exists or if the product has no title.
     * */

    save() {


        if(!this.req.cookie && this.req.body.email && this.req.body.firstname && this.req.body.lastname) {
            const email = this.req.body.email
            const firstname = this.req.body.firstname
            const lastname = this.req.body.lastname
            const toSave = {email: email, firstname: firstname, lastname: lastname}
            const cookieExpiry = new Date(Date.now() + cookieLifetime) //30 sec lifetime
            this.res.cookie("user", toSave, {expires: cookieExpiry, httpOnly:true})
        }
        else{

        }

    }

    /** Fetch all products from the file.
     * @returns {Array} an array of products.
     */
    static fetchAll() {
        return (accountList);
    }

    static getLength() {
        return accountList.length;
    }
};

/*
 this example stores the model in memory. Ideally these should be stored
 persistently in a database.
 */
let accountList = [];

