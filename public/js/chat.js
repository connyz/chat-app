const socket = io();

// Elements
const $messageForm = document.querySelector("#myForm");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const urlTemplate = document.querySelector("#url-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }

}

// Listen for new messages
socket.on("newMes", (message) => {
    console.dir(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.message,
        createdAt: moment(message.createdAt).format("kk:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
});

socket.on("locationMessage", (message) => {
    console.dir(message);
    const html = Mustache.render(urlTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("kk:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
});

socket.on("newConnect", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.message
    });
    $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    
    document.querySelector("#sidebar").innerHTML = html;
})

$messageForm.addEventListener("submit", function(e){
    e.preventDefault();
    $messageFormButton.setAttribute("disabled", "disabled");
    //disable form
    const input = e.target.elements.message.value;

    socket.emit("sendMessage", input, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        
        //enable form
        if(error){
            return console.log(error);
        }

        console.log("Message delivered");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if(!navigator.geolocation){
        return alert("No support for geolocation by your browser");
    }
    
    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) =>{
        //console.log(position.coords.latitude);
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute("disabled");
            console.log("Location shared!");
        });
    })
});

socket.emit("join", { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = "/"
    }
})