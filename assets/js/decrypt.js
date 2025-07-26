document.addEventListener('DOMContentLoaded', function () {
    function showDecryptionUI(block) {
        block.innerHTML = `
      <label style="display:block;margin-bottom:0.5em;font-weight:500;">🔒 This content is password-protected:</label>
      <div style="display:flex;align-items:center;gap:0.5em;">
        <input type="password" placeholder="Enter password" style="flex:1;"/>
        <button>Decrypt</button>
        <input type="checkbox" id="show-pw" style="margin-left:0.5em;" title="Show password"/>
        <label for="show-pw" style="font-size:1.1em;cursor:pointer;">👁️</label>
      </div>
      <div class="decrypt-error" style="color:red;margin-top:8px;display:none;"></div>
    `;
        var input = block.querySelector('input[type="password"]');
        var button = block.querySelector('button');
        var error = block.querySelector('.decrypt-error');
        var showPw = block.querySelector('#show-pw');
        showPw.onchange = function () {
            input.type = this.checked ? 'text' : 'password';
        };
        button.onclick = function () {
            var password = input.value;
            var ciphertext_b64 = block.getAttribute('data-encrypted');
            try {
                var ciphertext = CryptoJS.enc.Base64.parse(ciphertext_b64);
                var iv = CryptoJS.lib.WordArray.create(ciphertext.words.slice(0, 4), 16);
                var actualCiphertext = CryptoJS.lib.WordArray.create(ciphertext.words.slice(4), ciphertext.sigBytes - 16);
                var key = CryptoJS.SHA256(password);
                var bytes = CryptoJS.AES.decrypt({ ciphertext: actualCiphertext }, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
                var plaintext = bytes.toString(CryptoJS.enc.Utf8);
                if (!plaintext) throw new Error('Incorrect password or corrupt data');
                // Obsidian-style: ![[image.png]] => ![](/assets/images/image.png)
                plaintext = plaintext.replace(/!\[\[(.*?)\]\]/g, function (match, p1) {
                    var src = p1.match(/^\//) ? p1 : '/assets/images/' + p1;
                    return '![](' + src + ')';
                });
                // Obsidian-style: [[Note Name]] => [Note Name](/note-name)
                plaintext = plaintext.replace(/\[\[(.*?)\]\]/g, function (match, p1) {
                    var href = '/' + p1.trim().replace(/\s+/g, '-').toLowerCase();
                    return '[' + p1 + '](' + href + ')';
                });
                if (window.marked) {
                    block.innerHTML = '<div class="post-content">' + marked.parse(plaintext) + '</div>';
                } else {
                    block.innerHTML = '<pre>' + plaintext + '</pre>';
                }
            } catch (e) {
                let msg = '';
                if (e.message && e.message.match(/utf-?8/i)) {
                    msg = 'Decryption failed';
                } else {
                    msg = '❌ ' + (e.message || 'Incorrect password or corrupt data');
                }
                error.textContent = msg;
                error.style.display = 'block';
            }
        };
    }
    document.querySelectorAll('.encrypted-content').forEach(showDecryptionUI);
});