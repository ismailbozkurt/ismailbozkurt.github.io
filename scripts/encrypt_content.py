import sys
import base64
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes

# Usage: python encrypt_content.py <input_file> <password>
def pad(data):
    pad_len = 16 - (len(data) % 16)
    return data + bytes([pad_len] * pad_len)

def main():
    if len(sys.argv) != 3:
        print('Usage: python encrypt_content.py <input_file> <password>')
        sys.exit(1)
    infile, password = sys.argv[1], sys.argv[2]
    #if len(password) != 32:
    #    print('Password must be exactly 32 characters.')
    #    sys.exit(1)
    with open(infile, 'r', encoding='utf-8') as f:
        plaintext = f.read()
    key = SHA256.new(password.encode('utf-8')).digest()
    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded = pad(plaintext.encode('utf-8'))
    ciphertext = cipher.encrypt(padded)
    out = base64.b64encode(iv + ciphertext).decode('utf-8')
    print(out)

if __name__ == '__main__':
    main() 