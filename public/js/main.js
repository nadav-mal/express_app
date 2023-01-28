/** Client side. */

/** DOMContentLoaded listener. */
document.addEventListener("DOMContentLoaded", function () {
    const display = displayManagement.display
    // Sets the default date to today.
    document.getElementById("endDate").value = getToday()
    const modal = document.getElementById("exampleModal");
    modal.addEventListener("hidden.bs.modal", () => {
        let id = document.querySelector(".dynamicId").id
        clearInterval(id);
    });
    // Displays the images from the submitted date and onward.
    const form = document.getElementById("commentAddition");
    form.addEventListener("click", display.displayImagesFromURL);
});

/** General functions which are in vast use. */
//-------------------------------------------//

/***
 * Generic function to create an element.
 * @param tagName - tag name.
 * @param classname - class name.
 * @param innerHtml - the inner html content.
 * @returns an element by the given params.
 */
const createElement = (tagName, classname = "", innerHtml = "") => {
    let elem = document.createElement(tagName)
    elem.className = classname
    elem.innerHTML = innerHtml
    return elem
};
/***
 * Generic function to create an element with appended data.
 * @param className - class name.
 * @param data - the data which is to be appended.
 * @returns an element with the data appended to it.
 */
const appendMultiple = (className, ...data) => {
    let div = createElement('div', className)
    data.forEach(elem => {
        div.append(elem)
    })
    return div
};
//-------------------------------------------//
let errorDisplay = createElement('div', 'btn btn-danger disabled')
/** Display Management. */
let displayManagement = {};
(function displayFunctions(display) {

    const batchSize = 3; // Size of the images batch.
    let displayIndex = 0 // Index of the display.

    /***
     * This function makes fetches to the NASA API.
     * @param isFirst a boolean value that indicate whether this is the first time the function is being called.
     * @param endDate a date value that represents the end date for the date range of the images being fetched.
     */
    const fetchFromNasa = (isFirst, endDate) => {
        let isValid = true
        let spinner = animatedGif("images-fetch-spinner");
        fetch(getUrl(endDate))
            .then(response => {
                if (response.ok)
                    document.getElementById("badRequest").setAttribute("hidden", "hidden")
                else
                    isValid = false
                return response.json()
            })
            .then(function (response) {
                if (isValid) {
                    if (isFirst) {
                        document.getElementById("imagesList").innerHTML = "";
                        createScrollEvent(endDate)
                    }
                    displayImagesBatch(response)
                } else {
                    if (response.hasOwnProperty('msg'))
                        throw new Error(`Message from NASA API: <br> ${response.msg}`);
                    else
                        throw new Error("Unexpected error from NASA API.");
                }
            }).catch((error) => {
            document.getElementById("badRequest").removeAttribute("hidden")
            document.getElementById("errorcode").innerHTML = error.message;
        }).finally(() => {
            setTimeout(() => {
                spinner.classList.add('d-none');
            }, 1000)
        });
    }
    /***
     * Function to display images from nasa.
     * @param event - submit of the date.
     */
    const displayImagesFromURL = (event) => {
        event.preventDefault()
        let endDate = new Date(document.getElementById("endDate").value)
        fetchFromNasa(true, endDate);
    }

    /***
     * Function to display batch number of images when needed.
     * @param data - the data of the images.
     */
    function displayImagesBatch(data) {
        let currBatch = document.createElement('div')
        for (let i = 0; i < batchSize; i++) {
            if (data[i] !== undefined && data[i]) //For tricky dates like 06/20/1995 in which nasa's response is inconsistent
            {
                let opacity = (displayIndex % 2 === 0) ? "0.5" : "0.75";
                let className = 'row rounded mb-4';
                let listItem = {
                    row: appendMultiple(className, getMediaCol(data[i]), getImageInfo(data[i])),
                    item: createElement('li', 'list-group-item')
                };
                listItem.row.style.backgroundColor = `rgba(105, 105, 105, ${opacity})`;
                listItem.row.style.border = "1px solid black";
                listItem.item.append(listItem.row);
                currBatch.prepend(listItem.row);
                displayIndex++;
            }
        }
        document.getElementById("imagesList").append(currBatch)
    }

    /***
     * Function to assert if a media element is video/image.
     * @param elem - video/image element.
     * @returns {*} - video/image col element.
     */
    const getMediaCol = (elem) => {
        let col = createElement('div', 'col-lg-4 col-md-6 col-sm-12 p-4')
        let row = createElement('div', 'row')
        if (elem && elem.hasOwnProperty('media_type')) {
            if (elem['media_type'] === 'image')
                row.append(getMediaElement(elem['url'], true, elem['date']));
            else if (elem['media_type'] === 'video')
                row.append(getMediaElement(elem['url'], false, elem['date']));
            col.append(row)
        }

        return col
    }
    /***
     * Function to get a media element.
     * @param url - of the media.
     * @param isImage - boolean which states image/video.
     * @param imgId - the date of the given image
     * @returns {*} - media element.
     */
    const getMediaElement = (url, isImage, imgId) => {
        let media = isImage ? createElement('img', 'img-thumbnail') : createElement('iframe', 'video')
        isImage ? media.setAttribute('data-image', url) : media.setAttribute('data-video', url)
        media.src = url
        media.style.maxHeight = "400px";
        media.style.maxWidth = "400px";
        if (isImage) {
            media.addEventListener('click', function () {
                const modalImg = document.getElementById('modalImage');
                modalImg.src = media.src
                modalImg.style.cursor = "default"
                document.getElementById("modalBtn").click()
                const modalComments = document.getElementById("commentModalSection");
                modalComments.removeChild(modalComments.firstChild);
                modalComments.append(getMessagesCol(imgId));
            })
        }
        return media
    }
    /***
     * Function to get the info of the media as an element.
     * @param elem - description details.
     * @returns {*} - col element with the info appended to it.
     */
    const getImageInfo = (elem) => {
        let col = createElement('div', 'col-lg-8 col-md-6 col-sm-12')
        col.style.marginTop = "10px"
        let desc = getDescriptionRow(elem)
        desc.style.border = "1px solid black";
        col.append(desc)
        return col
    }
    /***
     * Function to get the description row.
     * @param elem - description element.
     * @returns {*} - description row.
     */
    const getDescriptionRow = (elem) => {
        let paragraphs = getDescription(elem)
        let hideDescriptionBtn = getHideButton(paragraphs.explanation)
        return appendMultiple('row bg-dark text-white bg-opacity-50 my-3 ',
            paragraphs.date, paragraphs.header, paragraphs.explanation, hideDescriptionBtn, paragraphs.copyright)
    }
    /***
     * Function to get the description of media as an element.
     * @param elem - the element data.
     * @returns {{date: HTMLParagraphElement, copyright: HTMLParagraphElement, header: HTMLHeadingElement, explanation: *}}
     */
    const getDescription = (elem) => {
        let paragraphs = {
            date: document.createElement('p'),
            header: document.createElement('h5'),
            explanation: createElement('div', 'scroll'),
            copyright: document.createElement('p')
        }
        paragraphs.date.innerHTML = `Date: ${elem['date']}`
        paragraphs.date.style.marginTop = "5px"
        paragraphs.header.innerHTML = `${elem['title']}`
        paragraphs.explanation.innerHTML = `${elem['explanation']}`
        paragraphs.explanation.setAttribute('hidden', 'hidden')
        paragraphs.explanation.style.maxHeight = "150px"
        paragraphs.explanation.style.overflowY = "scroll"
        paragraphs.copyright.innerHTML = elem['copyright'] !== undefined ? `Copyright: ${elem['copyright']}` : "Copyright: Unknown"
        return paragraphs
    }
    /***
     * Function to get the hide button as an element.
     * @param paragraphs - the paragraphs which are displayed with the hide button.
     * @returns {*} - the button as an element.
     */
    const getHideButton = (paragraphs) => {
        let hideButton = createElement('button', 'btn', "Show more")
        hideButton.style.backgroundColor = "#bc9753"
        hideButton.style.marginBottom = "30px"
        hideButton.style.transform = "scale(0.95)"
        hideButton.style.margin = "auto"
        hideButton.style.border = "1px solid black";
        hideButton.addEventListener('click', function (event) {
            event.preventDefault()
            changeDisplay(hideButton, paragraphs)
        })

        return hideButton
    }
    /***
     * Function to change the display settings.
     * @param button - show more or show less.
     * @param paragraphs - the elements to hide or show.
     */
    const changeDisplay = (button, ...paragraphs) => {
        paragraphs.forEach(paragraph => {
            if (paragraph.getAttribute('hidden') === null)
                paragraph.setAttribute('hidden', 'hidden')
            else
                paragraph.removeAttribute('hidden')
        })
        if (button.innerHTML === "Show less")
            button.innerHTML = "Show more"
        else
            button.innerHTML = "Show less"
    }
    /***
     * Function to create the messages col element.
     * @param id - id of the image (the date of it).
     * @returns {*} - the messages col element.
     */
    const getMessagesCol = (id) => {
        const messagesManager = messagesManagement.messagesCol
        let messagesCol = createElement('div', 'col-lg-12 col-md-12 p-2')
        messagesManager.idUpdateStamps.set(id, 0)
        messagesCol.append(createCommentSection(id))
        messagesManager.loadComments(id)
        messagesManager.idUpdateStamps.set(id, Date.now())
        messagesCol.append(messagesManager.createMsgArea(id, messagesCol))

        messagesCol.style.marginTop = "18px"
        return messagesCol;
    }
    /***
     * Function to create the scrolling event listener.
     * @param endDate - the end date.
     */
    const createScrollEvent = (endDate) => {
        window.addEventListener("scroll", function (event) {
            event.preventDefault()
            //if communication is poor with api increase '2'
            const scrollY = window.scrollY + window.innerHeight + 2;
            const bodyScroll = document.body.offsetHeight;
            if (scrollY >= bodyScroll) {
                endDate.setDate(endDate.getDate() - batchSize)
                fetchFromNasa(false, endDate);
                setTimeout(function () {
                }, 500)
            }
        })
    }
    /***
     * Function to create the comment section.
     * @param id - id of the image.
     * @returns {*} - the comment section as an element.
     */
    const createCommentSection = (id) => {
        let messagesList = createElement('div', 'list-group overflow-auto')
        messagesList.id = id
        messagesList.style.maxHeight = "200px"
        messagesList.style.height = "200px"
        messagesList.style.backgroundColor = "#7f8c8d";
        return messagesList
    }
    /***
     * Function to receive the url of the request from NASA with our key and the date.
     * @param currDate - the date of the image which we wish to request.
     * @returns {`https://api.nasa.gov/planetary/apod?api_key=gqRjbR1ocVYMPviB9JoPqsVnLihxTOBKZLMGDdEm&start_date=${string}&end_date=${string}`}
     */
    const getUrl = (currDate) => {
        let nasaApiUrl = "https://api.nasa.gov/planetary/apod?api_key=gqRjbR1ocVYMPviB9JoPqsVnLihxTOBKZLMGDdEm"
        let temp = new Date(currDate)
        temp.setDate(temp.getDate() - 2)
        return `${nasaApiUrl}&start_date=${toNasaFormat(temp)}&end_date=${toNasaFormat(currDate)}`//&end_date=${startDate + 3}
    }
    /***
     * Function to convert date to the format of NASA.
     * @param date - the date to convert.
     * @returns {`${string}-${string}-${string}`} - desired format.
     */
    const toNasaFormat = (date) => {
        date = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).split('/')
        return `${date[2]}-${date[0]}-${date[1]}`
    }

    display.display = {displayImagesFromURL}
}(displayManagement));

/***
 * Returns the date of today.
 * @returns {Date} of today.
 */
const getToday = () => {
    let today = new Date()
    let dd = String(today.getDate()).padStart(2, '0')
    let mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
    let yyyy = today.getFullYear()
    today = yyyy + '-' + mm + '-' + dd
    return today
}

/** Messages Management. */
let messagesManagement = {};
(function messagesFunctions(messageManager) {
    // Timestamps for the updates of the comments on the images.
    // Key : ID (date of the image), Value : Last update time.
    const idUpdateStamps = new Map()
    let isValid = true;

    /***
     * Handles special error message.
     * @param msg - the error message.
     * @returns {string|*} - a string as the message.
     */
    function handleErrMsg(msg) {
        isValid = false;
        return (msg === 'Failed to fetch') ? 'Internal server error' : msg;
    }

    /***
     * Middleware to validate or throw errors.
     * @param id - of the image.
     * @param dynamicMsg - the element which the message is displayed on.
     * @param response - the response from the API.
     */
    function validateOrThrow(id, dynamicMsg, response) {

        if (isValid) {
            displayResponse(dynamicMsg, response.message)
            loadComments(id, dynamicMsg)
        }
        else throw new Error(response.message);
    }

    /***
     * Generic middleware to handle responses.
     * @param response - from the API.
     * @returns {*} response as json.
     */
    function handleResponse(response) {

        isValid = true;
        if (response.ok) {
            return response.json();
        } else {
            isValid = false;
            if (response.status === 369) {
                location.href = "/";
            } else {
                return response.json();
            }
        }
    }

    /***
     * Get request.
     * @param dynamicMsg - The area in which we display dynamic messages.
     * @param imgDate - the date of the image to start fetching from.
     */
    function loadComments(imgDate, dynamicMsg) {
        let timer = idUpdateStamps.get(imgDate);
        let spinner = animatedGif('loading-spinner');

        fetch(`/admin/messages/${imgDate}/${timer}`)
            .then(handleResponse)
            .then(response => {
                if (isValid)
                    updateComments(imgDate, response);
                else throw new Error(response.message);
            }).catch(error => {
                displayResponse(dynamicMsg, handleErrMsg(error.message));
            }).finally(() => {
                setTimeout(() => {
                    spinner.classList.add('d-none');
                }, 500)
        })
    }

    /***
     * Post request.
     * @param id - of the image of post on.
     * @param message - the submitted message.
     * @param errorDisplay - error if any.
     */
    const postComment = (id, message, errorDisplay) => {
        let spinner = animatedGif('loading-spinner');
        fetch(`/admin/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: id, message: message})
        })
            .then(handleResponse)
            .then(response => { validateOrThrow(id, errorDisplay, response); })
            .catch((error)=>{
                displayResponse(errorDisplay, handleErrMsg(error.message));
            })
            .finally(() => {
                setTimeout(() => {
                    spinner.classList.add('d-none');
                }, 500)
        })
    }
    /***
     * Delete request.
     * @param id - of the image on which the comment is posted.
     * @param email - the email of the user who added this comment
     * @param createdAt - The timestamp in which the comment was added to the db
     */
    const deleteComment = (id, email, createdAt) => {
        let spinner = animatedGif('loading-spinner');
        fetch(`/admin/deleteMessage`, {
            method: 'DELETE',
            body: JSON.stringify({id: id, email: email, createdAt: createdAt}),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(handleResponse)
            .then(response => { validateOrThrow(id, errorDisplay, response); })
            .catch((err)=>{
                displayResponse(errorDisplay, handleErrMsg(err.message));
            })
            .finally(() => {
            setTimeout(() => {
                spinner.classList.add('d-none');
            }, 500)
        })
    }

    /***
     * Function to update the comments on an image.
     * @param id - of the image.
     * @param messages - the update.
     */
    const updateComments = (id, messages) => {
        let comments = createElement('div')
        idUpdateStamps.set(id, Date.now())
        for (let i = 0; i < messages.length; i++)
            comments.append(makeMessageGrid(messages[i], id))

        displayComments(comments, id)
    }
    /***
     * Function to display the updated comments.
     * @param comments - the comments to display.
     * @param id - of the image on which to display.
     */
    let displayComments = (comments, id) => {
        let messagesList = document.getElementById(id)
        if (comments !== null) {
            document.getElementById(id).innerHTML = "";
            messagesList.append(comments)
        }
    }
    /***
     * Function to display the response to the user.
     * @param infoBtn - info regarding the state.
     * @param message - the response message.
     */
    const displayResponse = (infoBtn, message) => {
        if(!(infoBtn && message))
            return;
            infoBtn.innerHTML = message
        infoBtn.className = isValid ? 'btn btn-success' : 'btn btn-danger'
        infoBtn.removeAttribute('hidden')
        setTimeout(function () {
            infoBtn.setAttribute('hidden', 'hidden')
        }, 2500)
    }
    /***
     * Function to create the message area.
     * @param id - id of the image which we want to add a message area to.
     * @returns {*} - the message area element.
     */
    const createMsgArea = (id) => {
        let message = ""
        let messageBox = getTextArea(id, 5, 33, false, "What's on your mind? (up to 128 characters)")
        errorDisplay.setAttribute('hidden', 'hidden')
        const intervalID = setMessagesTimer(id, errorDisplay);
        document.querySelector(".dynamicId").id = intervalID.toString();
        messageBox.addEventListener('input', function (event) {
            message = event.target.value
        })

        //----------------------------------
        let addMessageBtn = createElement('button', 'btn btn-secondary', 'Add message')
        addMessageBtn.id = `button${id}`
        addMessageBtn.style.border = "1px solid black";
        addMessageBtn.addEventListener('click', function () {
            if (message.trim().length > 0 || true) {
                errorDisplay.setAttribute('hidden', 'hidden')
                postComment(id, message, errorDisplay)
                message = ""
                document.getElementById(`textBox${id}`).value = ""
            } else
                displayResponse(errorDisplay, 'Comments contains spaces only')
        });
        let setPollingBtn = createElement('button', ' btn btn-primary', 'Turn polling on');
        setPollingBtn.id = `Polling${id}`;
        let addMessageCol = appendMultiple('col-4', addMessageBtn)
        let displayErrorCol = appendMultiple('col-8', errorDisplay)
        displayErrorCol.append(errorDisplay)
        let row = appendMultiple('row', addMessageCol, displayErrorCol)
        return appendMultiple('div', messageBox, row);
    }
    /***
     * Function to get the text area on which the user write comments before posted.
     * @param id - of the image of which the text area belongs.
     * @param rowsLength - size info.
     * @param colsLength - size info.
     * @param readOnly - if readOnly or enable write.
     * @param placeHolder - placeholder of textarea.
     * @returns {*} - text area element.
     */
    const getTextArea = (id, rowsLength, colsLength, readOnly, placeHolder = "") => {
        let textBox = createElement('textarea', 'form-control')
        textBox.id = `textBox${id}`
        textBox.maxLength = 128
        let div = createElement("div", "form-group")
        div.append(textBox)
        textBox.placeholder = placeHolder
        textBox.readOnly = readOnly
        return div
    }
    /**
     * Function to make a message grid.
     * @param message - the message content.
     * @param id - id of the image.
     * @returns {*} - a list item element.
     */
    const makeMessageGrid = (message, id) => {
        let listItem = {
            item: createElement('li', 'list-group-item'),
            row: createElement('div', 'row')
        }
        listItem.item.style.backgroundColor = "#f2be73"
        let secondRow = appendMultiple("row", createElement('p', '', message.content))
        let areaForUsername = appendMultiple("col-10", createElement('h5', '', message.email))
        listItem.row.append(areaForUsername)
        const userMail = document.getElementById('userMail').innerHTML.trim();
        const createdAt = message.createdAt;
        if (message.email === userMail) { //document.getElementById("name").value
            let deleteBtn = createElement('button', "btn btn-outline-danger", 'x')
            deleteBtn.addEventListener('click', function () {
                deleteComment(id, userMail, createdAt)
            })
            let areaForDelete = appendMultiple("col-2", deleteBtn)
            listItem.row.append(areaForDelete)
        }
        listItem.item.append(listItem.row)
        listItem.item.append(secondRow)
        return listItem.item
    }
    /***
     * Function to set the timer on the messages (15 seconds).
     * @param id - of the image.
     * @param  dynamicMsg - The area in which we display dynamic messages to the user
     */
    const setMessagesTimer = (id, dynamicMsg) => {
        return setInterval(function () {
            loadComments(id, dynamicMsg)
            idUpdateStamps.set(id, Date.now())
        }, 15000)
    }
    messageManager.messagesCol = {idUpdateStamps, loadComments, createMsgArea, setMessagesTimer};
}(messagesManagement));

//-------------------------------------------//
/***
 *
 * @param id
 * @returns {HTMLElement}
 */
function animatedGif(id) {
    let spinner = document.getElementById(id);
    spinner.classList.remove('d-none');
    return spinner;
}