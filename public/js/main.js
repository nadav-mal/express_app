/** Client side. */

    /** DOMContentLoaded listener. */
    document.addEventListener("DOMContentLoaded", function () {
        console.log("loaded");
        const manager = webManagement.manager
        const display = displayManagement.display
        // Sets the default date to today.
        document.getElementById("endDate").value = manager.getToday()
        const modal = document.getElementById("exampleModal");
        modal.addEventListener("hidden.bs.modal", (ev) => {
            const modalImg = document.getElementById('modalImage');
            const id =  document.getElementsByClassName("dynamicId")[0].id
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

    /** Display Management. */
    let displayManagement = {};
    (function displayFunctions(display) {
        const batchSize = 3; // Size of the images batch.
        let displayIndex = 0 // Index of the display.

        /***
         * Function to display images from nasa.
         * @param event - submit of the date.
         */
        const displayImagesFromURL = (event) => {
            event.preventDefault()
            let isValid = true
            let endDate = new Date(document.getElementById("endDate").value)
            fetch(getUrl(endDate))
                .then(response => {
                    if (response.ok)
                        document.getElementById("badRequest").setAttribute("hidden", "hidden")
                    else
                        isValid = false
                    return response.json()
                })
                .then(function (response) {
                        document.getElementById("imagesList").innerHTML = "";
                        if (isValid) {
                            displayImagesBatch(response)
                            createScrollEvent(endDate)
                        } else {
                            document.getElementById("badRequest").removeAttribute("hidden")
                            if (response.hasOwnProperty('msg'))
                                document.getElementById("errorcode").innerHTML = `Message from nasa api: <br> ${response.msg}`
                        }
                    }
                )
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
                    let className =  'row rounded mb-4';
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
                    const messagesCol = getMessagesCol(imgId);
                    console.log(messagesCol.messagesCol);
                    console.log(messagesCol.intervalId);
                    modalComments.append(messagesCol.messagesCol);
                    document.getElementsByClassName("dynamicId").id = messagesCol.intervalId
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
            let intervalId = messagesManager.setMessagesTimer(id)
            messagesCol.append(messagesManager.createMsgArea(id, messagesCol))
            messagesCol.style.marginTop = "18px"
            return { messagesCol: messagesCol,
                    intervalId : intervalId}
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
                    fetch(getUrl(endDate)).then(response =>
                        response.json()).then(response => displayImagesBatch(response))
                    setTimeout(function() {} , 3000)
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

    /** Web Management. */
    let webManagement = {};
    (function managementFunctions(management) {
        /***
         * Function to get the date of today.
         * @returns {Date} - today's date.
         */
        const getToday = () => {
            let today = new Date()
            let dd = String(today.getDate()).padStart(2, '0')
            let mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
            let yyyy = today.getFullYear()
            today = yyyy + '-' + mm + '-' + dd
            return today
        }
        /***
         * Function to validate the submitted name of the user.
         * @param event - submit event of the name.
         */
        const validateName = (event) => {
            console.log("validating name")
            event.preventDefault()
            name = document.getElementById("name").value.trim()

            if (name.length <= 24 && name.length > 0 && !(/\W/.test(name)))
                toggleHid("preLogin", "afterLogin", "invalidName")
            else
                document.getElementById("invalidName").removeAttribute("hidden")
        }
        /***
         * Function to toggle the 'hidden' attribute.
         * @param id - id of the element.
         */
        const toggleHid = (...id) => {
            id.forEach(elem => {
                let element = document.getElementById(elem);
                let hidden = element.getAttribute("hidden");
                if (hidden)
                    element.removeAttribute("hidden");
                else
                    element.setAttribute("hidden", "hidden");
            })
        }

        management.manager = {getToday, validateName};
    }(webManagement));

    /** Messages Management. */
    let messagesManagement = {};
    (function messagesFunctions(messageManager) {
        // Timestamps for the updates of the comments on the images.
        // Key : ID (date of the image), Value : Last update time.
        const idUpdateStamps = new Map()

        /***
         * Get request.
         * @param imgDate - the date of the image to start fetching from.
         */
        function loadComments(imgDate) {
            let timer = idUpdateStamps.get(imgDate)
            fetch(`/admin/messages/${imgDate}/${timer}`)
                .then(function (response) {
                    //Checking the status of what the server returned.
                    if (response.ok)
                        return response.json()
                    else if (response.status === 300 || response.status === 325)//No messages
                        return null
                    else
                        throw new Error("Unexpected error from server")
                })
                .then(messages => {
                    if (messages){
                        updateComments(imgDate, messages)
                    }

                })
                .catch(error => {
                    if (error === "No new messages")
                        return null;
                    console.log(error);
                });
        }
        /***
         * Post request.
         * @param id - of the image of post on.
         * @param message - the submitted message.
         * @param username - username of submitter.
         * @param errorDisplay - error if any.
         */
        const postComment = (id, message, errorDisplay) => {
            let isValid = true
            fetch(`/admin/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({id: id, message: message})
            })
                .then(function (response) {
                    if (response.ok)
                        return response.json()
                    else //Displaying the error message
                    {
                        isValid = false
                        return response.json()
                    }
                })
                .then(response => {
                    if (isValid) {
                        loadComments(id)

                    }
                    displayResponse(errorDisplay, response.message, isValid)
                })
        }
        /***
         * Delete request.
         * @param id - of the image on which the comment is posted.
         * @param index - of the comment to delete.
         */
        const deleteComment = (id, email, createdAt) => {
            let displayBtn = document.getElementById(`errorBtn${id}`)
            let isValid = true
            fetch(`/admin/deleteMessage`, {
                method: 'DELETE',
                body: JSON.stringify({id: id, email: email, createdAt: createdAt}),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (!response.ok)
                    isValid = false
                return response.json()
            }).then((response) => {
                if (isValid)
                    loadComments(id)
                displayResponse(displayBtn, response.message, isValid)
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
         * @param isValid - boolean which tells valid/invalid.
         */
        const displayResponse = (infoBtn, message, isValid = false) => {
            infoBtn.innerHTML = message
            infoBtn.className = isValid ? 'btn btn-success' : 'btn btn-danger'
            infoBtn.removeAttribute('hidden')
            setTimeout(function () {
                infoBtn.setAttribute('hidden', 'hidden')
            }, 2000)
        }
        /***
         * Function to create the message area.
         * @param id - id of the image which we want to add a message area to.
         * @returns {*} - the message area element.
         */
        const createMsgArea = (id) => {
            let message = ""
            let messageBox = getTextArea(id, 5, 33, false, "What's on your mind? (up to 128 characters)")
            let errorDisplay = createElement('div', 'btn btn-danger disabled')
            errorDisplay.id = `errorBtn${id}`
            errorDisplay.setAttribute('hidden', 'hidden')
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
            let setPollingBtn = createElement('button',' btn btn-primary','Turn polling on');
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
         * @param index - index of the comment.
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
                console.log("its equal");
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
         */
        const setMessagesTimer = (id) => {
            const intervalId = setInterval(function () {
                loadComments(id)
                idUpdateStamps.set(id, Date.now())
            }, 15000)
            return intervalId;
        }

        messageManager.messagesCol = {idUpdateStamps, loadComments, createMsgArea, setMessagesTimer};
    }(messagesManagement));

    //-------------------------------------------//

