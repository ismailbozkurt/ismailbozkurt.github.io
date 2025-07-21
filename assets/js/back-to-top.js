// Back to Top button
(function () {
    var btn = document.createElement('div');
    btn.id = 'back-to-top';
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    btn.onclick = function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('scroll', function () {
        btn.style.display = (window.scrollY > 300) ? 'flex' : 'none';
    });
})(); 