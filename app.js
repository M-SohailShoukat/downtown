
// Disable right-click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Disable F12, Ctrl+Shift+I/J/U/C/K, Ctrl+S
document.onkeydown = function(e) {
    if (
        e.keyCode == 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67 || e.keyCode == 75)) || // Ctrl+Shift+I/J/C/K
        (e.ctrlKey && e.keyCode == 85) || // Ctrl+U
        (e.ctrlKey && e.keyCode == 83) // Ctrl+S
    ) {
        return false;
    }
};