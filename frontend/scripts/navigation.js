$("#navbar-load").load("/frontend/templates/navbar.html");

/**
 * Activates the website's sidebar.
 * 
 * Called whenever the user presses the menu icon on a small screen.
 */
function show() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("shadow").classList.toggle("active");

  // Freeze the body of the page when sidebar is active
  let body = document.body;
  if (!body.classList.contains("active")) {
    console.log("hello");
    body.style.setProperty('--st', -(document.documentElement.scrollTop) + "px");
    body.classList.toggle("active");
  } else {
    body.classList.toggle("active");
    let scrollString = body.style.getPropertyValue("--st");
    document.documentElement.scrollTop = -scrollString.substring(0, scrollString.length - 2);
  }

  let toggle = document.getElementById("toggle");
  toggle.classList.toggle("active");

  let bars = toggle.getElementsByTagName("span");

  for (bar of bars) {
    bar.classList.toggle("active");
  }
}

/**
 * Delays how quickly a link redirects the user after clicking it.
 * 
 * @param {link} URL The link that the user will be redirected to
 * @param {integer} time Time which the link is delayed (in milliseconds)
 */
function delay(URL, time) {
  setTimeout(function() { window.location = URL }, time);
}

/**
 * Checks if an element is within the viewport.
 * 
 * @param {element} el - Element to check.
 * @returns {boolean} Whether el is viewable (in viewport).
 */
function isElementInViewport (el) {
  var rect = el.getBoundingClientRect();

  var tolerance = 30;

  return (
      // not including first line so that if you have scrolled already then everything above where you are will have appeared
      // rect.top + tolerance >= 0 &&

      rect.left  + tolerance >= 0 &&
      rect.bottom  - tolerance <= (window.innerHeight || document.documentElement.clientHeight) && /* or $(window).height() */
      rect.right  - tolerance <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
  );
}

/**
 * Fades in all elements with "fade-in" class attribute once they have
 * entered the viewport. 
 */
function fadeScroll() {
  objects = document.getElementsByClassName("fade-in");

  for (obj of objects) {
    if (isElementInViewport(obj)) {
      obj.classList.add('is-visible');
    }
  }
}

$(document).ready(function() {
  // Called once when document is loaded
  fadeScroll();
  
  $(window).resize(function() {
    // Called whenever the window is resized
    fadeScroll();
  });

  $(window).scroll(function() {
    // Called whenever the user scrolls (after document is loaded)
    fadeScroll();
  });
});