document.addEventListener('DOMContentLoaded', function() {
    console.log("dom content loaded")
    let nextPage = document.getElementById('nextPage')
    nextPage.addEventListener('click', function(){
        let cookiesUtils = cookiesManagement.handleInput;
        let inputs = document.getElementsByClassName('inputTypes')
        let cookieInfo = {};
        inputs.forEach(input =>{
            cookieInfo.set(input.name, input.value)
        })
        cookiesUtils.setCookie('registerInfo',cookieInfo, 30);
    })

});



let cookiesManagement = {};
(function cookiesUtils(util){

    const setCookie = (cName, cVal, exSeconds) =>{
        let date = new Date();
        date.setTime(date.getTime() + (exSeconds * 1000));
        let expires = "expires" + date.toUTCString();
        document.cookie = cName + "=" + cVal + ";" + expires + ";path=/";
        console.log("in here")
    }

    const getCookie = (cName) => {
        let name = cName + "=";
        let ca = document.cookie.split(';');
        for(let i =0; i< ca.length; i++) {
            let c= ca[i]
            while(c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if(c.indexOf(cName) ===0){
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
util.handleInput = {setCookie, getCookie};
}(cookiesManagement));