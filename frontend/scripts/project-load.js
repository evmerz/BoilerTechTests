var classData = [];
var pinnedClasses = [];

/**
 * Loads all project data into memory on the load of the website.
 */
function loadProjectData() {
    return fetch("/frontend/content/class_data.json")
        .then((response) => response.json())
        .then((json) => {
            for (let i = 0; i < json.classes.length; i++) {
                classData[json.classes[i].id] = json.classes[i];
                console.log(classData[json.classes[i].id].name);
            }
            // After loading class data, load pinned classes

        });
}

/**
 * Loads pinned classes from localStorage and updates the UI.
 */
function loadPinnedClasses() {
    const savedPinnedClasses = JSON.parse(localStorage.getItem("pinnedClasses")) || [];
    pinnedClasses = savedPinnedClasses;

    pinnedClasses.forEach((classID) => {
        loadProject(classID, "pinned-classes");
    });
}

function loadAllClasses() {
    var userID = localStorage.getItem("userId");
    for (let classID in classData) {
        if (userID == null) {
            loadProject(classID, "homepage"); // Load unpinned classes into "homepage"
        }
        else {
            if (!pinnedClasses.includes(classID)) {
                loadProject(classID, "homepage"); // Load unpinned classes into "homepage"
            }
        }
    }
}


/**
 * Loads a specific project into a project container html object.
 *
 * @param {string} classID
 * @param {string} contentPanelName
 * @returns
 */
function loadProject(classID, contentPanelName) {
    var container;
    var galleries = document.querySelectorAll("div[panel-id]");
    for (var i = 0; i < galleries.length; i++) {
        if (galleries[i].getAttribute("panel-id") == contentPanelName) {
            container = galleries[i];
            break;
        }
    }

    if (container == null) {
        console.log("oops haha no container named " + contentPanelName + " exists");
        return;
    }

    var fade = document.createElement("div");
    fade.classList.add("fade-in");

    var panel = document.createElement("div");
    panel.classList.add("project-panel");

    var text = document.createElement("a");
    text.classList.add("caption");

    var heading = document.createElement("h3");
    heading.textContent = classData[classID].name;

    var cap = document.createElement("p");
    cap.textContent = classData[classID].caption;

    var pinButton = document.createElement("button");
    pinButton.classList.add("button");
    pinButton.textContent = pinnedClasses.includes(classID) ? "Unpin" : "Pin";

    var userID = localStorage.getItem("userId");
    text.appendChild(heading);
    text.appendChild(cap);
    console.log(userID);

    text.style = "text-decoration: none;";
    text.href = "/frontend/pages/cs240.html";

    panel.appendChild(text);

    if (userID) {
        document.getElementById("pinned-classes").style.display = "block";
        panel.appendChild(pinButton);
        pinButton.addEventListener("click", function () {
            pinClass(classID, fade, container, pinButton);
        });
    }

    fade.appendChild(panel);

    container.appendChild(fade);

    return true;
}

/**
 * Pins a class and moves it to the "Pinned Classes" section. 
 * If already pinned, it will unpin it.
 *
 * @param {string} classID
 * @param {HTMLElement} fade
 * @param {HTMLElement} container
 * @param {HTMLElement} pinButton
 */
async function pinClass(classID, fade, container, pinButton) {
    if (pinnedClasses.includes(classID)) {
        // Unpin the class
        pinnedClasses = pinnedClasses.filter(id => id !== classID); // Remove classID from pinnedClasses
        pinButton.textContent = "Pin";

        // Move the panel back to the original container
        var originalContainer = document.querySelector("[panel-id='homepage']");
        originalContainer.appendChild(fade);
    } else {
        // Pin the class
        pinnedClasses.push(classID); // Add the class ID to the pinnedClasses array
        pinButton.textContent = "Unpin";

        // Move the panel to the "Pinned Classes" section
        var pinnedContainer = document.getElementById("pinned-classes");
        pinnedContainer.getElementsByClassName("content-panel")[0].appendChild(fade);
    }

    // Save the updated pinnedClasses to localStorage
    localStorage.setItem("pinnedClasses", JSON.stringify(pinnedClasses));
    await sendPinnedClasses(localStorage.getItem("userId"), pinnedClasses);
}


async function sendPinnedClasses(userID, pinnedClasses) {
    console.log("in function");
    console.log("PL classes:", pinnedClasses);
    const url = `https://boilertechtests.com/api/pin`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userID,
                classes: pinnedClasses
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to save pinned classes.");
        }

        const data = await response.json();
        console.log("Pinned classes saved successfully:", data);
    } catch (error) {
        console.error("Error saving pinned classes:", error);
    }
}
