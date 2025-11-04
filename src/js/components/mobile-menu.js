export function initMenu() {
    const menuElement = document.getElementById("mobile-menu");
    const openbtnElement = document.getElementById("menu-button");
    const closebtnElement = document.getElementById("close-btn");

    if (menuElement && openbtnElement && closebtnElement) {
        openbtnElement.addEventListener('click', function() {
            menuElement.style.display = "flex";
        });
        closebtnElement.addEventListener('click', function() {
            menuElement.style.display = "none";
        });
    }
}