const bodyElement = document.body;

// Function to update the scrollbar based on user preference
function updateScrollbar() {
    const isCustomScrollbarEnabled = localStorage.getItem('customScrollbar') === 'true';

    if (isCustomScrollbarEnabled) {
        bodyElement.classList.add('custom-scrollbar');
        scrollbarToggle.checked = true;
    } else {
        bodyElement.classList.remove('custom-scrollbar');
        scrollbarToggle.checked = false;
    }
}

// Function to toggle custom scrollbar and save preference to local storage
function toggleCustomScrollbar() {
    const isChecked = document.getElementById('scrollbarToggle').checked; // Get toggle state
    localStorage.setItem('customScrollbar', isChecked); // Save preference
    updateScrollbar(); // Update the scrollbar based on saved preference
}

// Event listener for the toggle checkbox (only in account.html)
if (document.getElementById('scrollbarToggle')) {
    document.getElementById('scrollbarToggle').addEventListener('change', toggleCustomScrollbar);
}

function initializeScrollbar() {
    if (localStorage.getItem('username') == null) {
        // no one logged in, use scrollbar
        bodyElement.classList.add('custom-scrollbar');
    } else {
        updateScrollbar();
    }
}
initializeScrollbar();
