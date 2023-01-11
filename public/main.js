document.addEventListener('DOMContentLoaded', function() {
    // get all buttons
    const buttons = document.querySelectorAll('button');

    // attach clickAddEventListener to all buttons
    buttons.forEach(function(button) {

        button.addEventListener('click', (event) => {

            // either we perform the operation with a REST api such as
            // fetch('/cart/add/' + id, {method: 'POST'})
            // or we perform the operation with a form and submit it.
            // in this case the user will be redirected to the cart page.


        });
    });
});
