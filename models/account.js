
/** A MODULE to manage the Product model.
 * in future examples, we will use a database to store data.
 */

module.exports = class Account {
    constructor(e, n, pw) {
        this.email = e;
        this.name = n;
        this.password = pw;
    }

    /** Save the product to a file.
     * @throws {Error} if the product already exists or if the product has no title.
     * */

    save() {
        if (!this.email || !this.name || !this.password) {
            throw new Error('Product must have a title, price and id');
        }
        if (accountList.includes(this.email)) {
            throw new Error('Product already exists');
        }
        accountList.push(this);
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

