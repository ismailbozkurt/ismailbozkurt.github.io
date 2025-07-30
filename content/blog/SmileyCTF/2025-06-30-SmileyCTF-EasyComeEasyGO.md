+++
title="SmileyCTF EasyComeEasyGO - Go Reverse Challange"
date="2025-06-01"
categories=["CTF", "Writeup"]
tags=["smileyctf", "reverse", "go"]
description="Reverse engineering and solving the SmileyCTF EasyComeEasyGO challenge binary. Includes Go decompilation, channel logic, and flag calculation."
image="/images/SmileyCTF/SmileyCTF-Babyrop-2/smileyCTF_pic.png"
[extra]
cover.image="/images/SmileyCTF/SmileyCTF-Babyrop-2/smileyCTF_pic.png"
cover.alt="Reverse engineering and solving the SmileyCTF EasyComeEasyGO challenge binary. Includes Go decompilation, channel logic, and flag calculation."
+++

# Challange binary - chal

## Binary Analysis

`main function`

```go
void main.main(void)

{
  
  ...
  ...
  ...
  USER_INPUT = extraout_RAX_04;

// print ">"
fmt.Fprint(go:itab.*os.File,io.Writer,os.Stdout,&local_20,1,1);
  poVar3 = (os.file *)os.Stdin;
                    /* ./chal.go:17 */
  readed_string = &datatype.Ptr.*[]uint8;
  local_28 = USER_INPUT;
                    /* fmt/scan.go:81 */
  pcVar2 = "%s";
```

```go
// taking input here.
fmt.Fscanf(go:itab.*os.File,io.Reader,os.Stdin,"%s",2,&readed_string,1,1);
     if (poVar3 == (os.file *)0x0) {
                    /* ./chal.go:23 */
    if (*(long *)(USER_INPUT + 8) != 0x18) {
      local_60 = &datatype.String.string;
      local_58 = &incorrent_string;
      fmt.Fprintln(go:itab.*os.File,io.Writer,os.Stdout,&local_60,1,1);
                    /* ./chal.go:25 */
      return;
    }
```


```go
	// // FUNC1: this one is the created channels. one for receive and one for send.
                    /* ./chal.go:29 */
    runtime.newobject(&DAT_004b5bc0);
    *ret_func1 = main.main.func1;
    puVar1 = ret_func1;
    if (runtime.writeBarrier._0_4_ != 0) {
      runtime.gcWriteBarrier2();
      *in_R11 = local_88;
      in_R11[1] = local_98;
      puVar1 = extraout_RAX_05;
    }

	// FUNC2: this one is the created channels. one for receive and one for send.
    puVar1[1] = local_88;
    puVar1[2] = local_98;
    runtime.newproc(puVar1);
                    /* ./chal.go:45 */
    runtime.newobject(&DAT_004b5c60);
    *ret_func2 = main.main.func2;
    puVar1 = ret_func2;
    if (runtime.writeBarrier._0_4_ != 0) {
      runtime.gcWriteBarrier2();
      *in_R11 = local_90;
      in_R11[1] = local_a0;
      puVar1 = extraout_RAX_06;
    }
    puVar1[1] = local_90;
    puVar1[2] = local_a0;
    runtime.newproc(puVar1);
```

```go    
	// FUNC3: this one is the decompiler addition to main.main.func3. giving channels and the user input.
	
    runtime.newobject(&DAT_004bb720);
    *ret_func3 = main.main.func3;
    puVar1 = ret_func3;

	// This is go garbage collector think i believe, 
	if (runtime.writeBarrier._0_4_ != 0) {
      runtime.gcWriteBarrier6();
      *in_R11 = USER_INPUT;
      in_R11[1] = local_88;
      in_R11[2] = local_98;
      in_R11[3] = local_90;
      in_R11[4] = local_a0;
      in_R11[5] = local_a8;
      puVar1 = extraout_RAX_07;
    }

	// these are the channel informations and user input to main.main.func3.
    puVar1[1] = USER_INPUT;
    puVar1[2] = local_88;
    puVar1[3] = local_98;
    puVar1[4] = local_90;
    puVar1[5] = local_a0;
    puVar1[6] = local_a8;
    
	// Here we are starting the execution main.main.func3
	runtime.newproc(puVar1);
    
	null_byte = '\0';
    runtime.chanrecv1(local_a8,&null_byte);
    
	if (null_byte == '\0') {
      local_80 = &datatype.String.string;
      local_78 = &incorrent_string;
    
```

```go
	// Here we control the output of the main.main.func3. If everything goes well, gives correct. if panic called, gives incorrect.
	  fmt.Fprintln(go:itab.*os.File,io.Writer,os.Stdout,&local_80,1,1);
    }
    else {
      local_70 = &datatype.String.string;
      local_68 = &CORRECT_string;
      fmt.Fprintln(go:itab.*os.File,io.Writer,os.Stdout,&local_70,1,1);
    }
    return;
  }
  local_50 = &datatype.String.string;
  ppuStack_48 = &goss_err:__4eb180;
  if (poVar3 != (os.file *)0x0) {
    poVar3 = ((os.File *)((long)poVar3 + 8))->file;
  }
  local_40 = poVar3;
  pcStack_38 = pcVar2;
  fmt.Fprintln(go:itab.*os.File,io.Writer,os.Stdout,&local_50,2,2);
  return;
}
```


## main.main.func3

```go
// Function: main.main.func3 (The Validator and Orchestrator)
// This function runs as a Go Goroutine and is the central piece for flag validation.
// It interacts with func1 (to get leaked/processed data) and func2 (to perform XOR transformations).
// It loads hardcoded permutation and expected values.
// Its core logic involves a sequence of channel receives/sends, XOR operations,
// and a final comparison to determine if the provided input (the flag candidate) is correct.

void main.main.func3(
    // Parameters: (Pointers to Go channels and the user input slice)
    // These are passed via the Goroutine's closure context by the Go runtime.
    // They represent the communication channels and the flag candidate.
)
{
    // --- Prologue and Stack Setup ---
    // (Typical Go runtime boilerplate for stack validation and setup.
    //  Decompiler adds temporary variable declarations and register manipulations.)
    // (Your comment on func1's prologue: "Above code is just the prologue, decompiler additions.")
    // Similar boilerplate exists here for func3.
    // Variables like puVar5, puVar6, plVar2, uVar3, uVar8, lVar9, lVar7, unaff_R14
    // are involved in handling function arguments and stack frame setup.

    // --- Hardcoded Data Initialization ---

    // 1. Hardcoded Permutation Map Initialization (24 QWORDs, each holding an index from 0 to 23)
    // These values are loaded onto the Goroutine's stack at specific offsets.
    // This map defines the reordering or permutation of bytes during the validation.
    *(undefined8 *)((long)register0x00000020 + -0x100) = 0x15; // Index 0 maps to 21
    *(undefined8 *)((long)register00000020 + -0xf8) = 0x17;  // Index 1 maps to 23
    *(undefined8 *)((long)register00000020 + -0xf0) = 0x1;   // Index 2 maps to 1
    *(undefined8 *)((long)register00000020 + -0xe8) = 0x3;   // Index 3 maps to 3
    *(undefined8 *)((long)register00000020 + -0xe0) = 0xe;   // Index 4 maps to 14
    *(undefined8 *)((long)register00000020 + -0xd8) = 0x12;  // Index 5 maps to 18
    *(undefined8 *)((long)register00000020 + -0xd0) = 0xd;   // Index 6 maps to 13
    *(undefined8 *)((long)register00000020 + -200) = 0x0;   // Index 7 maps to 0 (Note: -200 is -0xC8)
    *(undefined8 *)((long)register00000020 + -0xc0) = 0x14;  // Index 8 maps to 20
    *(undefined8 *)((long)register00000020 + -0xb8) = 0xa;   // Index 9 maps to 10
    *(undefined8 *)((long)register00000020 + -0xb0) = 0x6;   // Index 10 maps to 6
    *(undefined8 *)((long)register00000020 + -0xa8) = 0xb;   // Index 11 maps to 11
    *(undefined8 *)((long)register00000020 + -0xa0) = 0x11;  // Index 12 maps to 17
    *(undefined8 *)((long)register00000020 + -0x98) = 0x2;   // Index 13 maps to 2
    *(undefined8 *)((long)register00000020 + -0x90) = 0xf;   // Index 14 maps to 15
    *(undefined8 *)((long)register00000020 + -0x88) = 0x8;   // Index 15 maps to 8
    *(undefined8 *)((long)register00000020 + -0x80) = 0x9;   // Index 16 maps to 9
    *(undefined8 *)((long)register00000020 + -0x78) = 0xc;   // Index 17 maps to 12
    *(undefined8 *)((long)register00000020 + -0x70) = 0x10;  // Index 18 maps to 16
    *(undefined8 *)((long)register00000020 + -0x68) = 0x4;   // Index 19 maps to 4
    *(undefined8 *)((long)register00000020 + -0x60) = 0x16;  // Index 20 maps to 22
    *(undefined8 *)((long)register00000020 + -0x58) = 0x7;   // Index 21 maps to 7
    *(undefined8 *)((long)register00000020 + -0x50) = 0x5;   // Index 22 maps to 5
    *(undefined8 *)((long)register00000020 + -0x48) = 0x13;  // Index 23 maps to 19

    // 2. Hardcoded Expected Value Array Initialization (3 QWORDs, total 24 bytes)
    // This is the target value that the transformed input must match for validation to pass.
    *(undefined8 *)((long)register00000020 + -0x120) = 0x58c4d6920d33ef5c;
    *(undefined8 *)((long)register00000020 + -0x118) = 0x77250476f61923ac;
    *(undefined8 *)((long)register00000020 + -0x110) = 0xf5903c93901fdbd0;

    // --- User Input (Flag Candidate) Handling ---

    // Get pointer and length of the user-provided input slice (flag candidate).
    lVar9 = *plVar2;   // Base address of the user input byte array
    lVar7 = plVar2[1]; // Length of the user input byte array (expected to be 24)
    // These values are stored on the stack for later use within the loop.
    *(long *)((long)register00000020 + -0x10) = lVar9; // User input array pointer
    *(long *)((long)register00000020 + -0x40) = lVar7; // User input array length

    ulong current_index = 0; // Initialize loop counter (current byte index, starts at 0)

    // --- Main Validation Loop (Iterates 24 times for each byte of the input) ---
    while (true) {
        // 1. Loop Termination Condition (Input Length Check)
        // If the current_index is equal to or exceeds the input length (lVar7),
        // it means all bytes have been processed. If no mismatches occurred, validation succeeds.
        if (lVar7 <= (long)current_index) {
            // Send success signal via a channel and return from the function.
            // This is the success path of the flag validation.
            *(undefined8 *)((long)register00000020 + -0x140) = 0x49f0a6; // Return address / boilerplate
            runtime.chansend1(uVar3,&runtime.gcbits.*); // uVar3 is pointer to the success channel
            return;
        }

        // 2. Get Current Byte from User Input
        // Read the byte at the current_index from the user's input string.
        uVar1 = *(undefined1 *)(lVar9 + current_index); // lVar9: user input base address

        // 3. Early Exit / Panic for Invalid Index (Index out of bounds for the 24-byte block)
        // If the current_index exceeds 23 (i.e., is 24 or more),
        // it means an unexpected index was somehow reached within the 24-byte block logic.
        if (0x17 < current_index) break; // If current_index > 23, jump to panic block

        // Store current_index and current_user_input_byte on stack for operations.
        *(ulong *)((long)register00000020 + -0x108) = current_index;
        *(undefined1 *)((long)register00000020 + -0x122) = uVar1; // Stores the current user input byte

        // 4. Interaction with func1: Request and Receive Data (First XOR Operand)
        // Send a specific value (derived from the permutation map based on current_index)
        // to func1's input channel. func1 will return a byte from its hardcoded data.
        *(undefined8 *)((long)register00000020 + -0x140) = 0x49f015; // Return address / boilerplate
        runtime.chansend1(uVar8,(undefined1 *)((long)register00000020 + current_index * 8 + -0x100)); // uVar8 is func1's request channel. The data sent is a value from the perm_map.

        // Receive the byte leaked/processed by func1 from its output channel.
        // This is the first operand for the initial XOR.
        // Your observation implies this is where the '0xcc' comes from for index 0.
        *(undefined1 *)((long)register00000020 + -0x121) = 0; // Initialize receive buffer
        *(undefined8 *)((long)register00000020 + -0x140) = 0x49f02c; // Return address / boilerplate
        runtime.chanrecv1(*(undefined8 *)((long)register00000020 + -0x28), // func1's output channel
                            (undefined1 *)((long)register00000020 + -0x121)); // Destination for received byte

        // 5. First XOR Operation: (User Input Byte XOR Byte from func1)
        // Perform an XOR operation between the current user input byte and the byte received from func1.
        // The result of this XOR (XOR_RESULT1) is stored back into the receive buffer.
        // Disassembly breakdown:
        // 0x000000000049f02c: movzx ecx,BYTE PTR [rsp+0x17] -> (func1_result_byte) is moved to ecx
        // 0x000000000049f031: movzx edx,BYTE PTR [rsp+0x16] -> (current_user_input_byte) is moved to edx
        // 0x000000000049f036: xor edx,ecx                  -> edx = edx XOR ecx (current_user_input_byte XOR func1_result_byte)
        // 0x000000000049f038: mov BYTE PTR [rsp+0x17],dl   -> The result is saved back to rsp+0x17 (your 0x121 offset)
        *(byte *)((long)register00000020 + -0x121) =
            *(byte *)((long)register00000020 + -0x122) ^ // current_user_input_byte
            *(byte *)((long)register00000020 + -0x121);   // byte_from_func1

        // 6. Interaction with func2: Send XOR_RESULT1 and Receive Processed Data
        // Send the result of the first XOR (XOR_RESULT1) to func2's input channel.
        *(undefined8 *)((long)register00000020 + -0x140) = 0x49f04e; // Return address / boilerplate
        runtime.chansend1(*(undefined8 *)((long)register00000020 + -0x20), // func2's input channel
                            (undefined1 *)((long)register00000020 + -0x121)); // The XOR_RESULT1

        // Receive the final processed byte from func2's output channel.
        // This byte is (XOR_RESULT1 XOR FUNC2_XOR_KEY[current_index]).
        *(undefined1 *)((long)register00000020 + -0x121) = 0; // Initialize receive buffer
        *(undefined8 *)((long)register00000020 + -0x140) = 0x49f065; // Return address / boilerplate
        runtime.chanrecv1(*(undefined8 *)((long)register00000020 + -0x30), // func2's output channel
                            (undefined1 *)((long)register00000020 + -0x121)); // Destination for received byte (VALUE_FROM_FUNC2)

        // 7. Final Comparison for Validation
        // Compare the byte received from func2 (VALUE_FROM_FUNC2)
        // with the corresponding byte from the hardcoded expected values,
        // using the permutation map for indexing.
        // Disassembly breakdown:
        // 0x000000000049f065: movzx ecx,BYTE PTR [rsp+0x17] -> (VALUE_FROM_FUNC2) to ecx
        // 0x000000000049f06a: mov rdx,QWORD PTR [rsp+0x30]  -> (current_index) to rdx
        // 0x000000000049f06f: movzx esi,BYTE PTR [rsp+rdx*1+0x18] -> Get Expected_Value[Permutation_Map[current_index]] to esi
        // 0x000000000049f074: cmp sil,cl                   -> Compare (Expected) vs (VALUE_FROM_FUNC2)
        if (*(char *)((long)register00000020 + // Base of expected value array (variable offset)
                        *(long *)((long)register00000020 + -0x108) + // current_index
                        -0x120) // Base offset for expected values
            != *(char *)((long)register00000020 + -0x121)) // VALUE_FROM_FUNC2
        {
            // If mismatch, validation fails.
            // Send an error signal via a channel and return from the function.
            *(undefined8 *)((long)register00000020 + -0x140) = 0x49f091; // Return address / boilerplate
            runtime.chansend1(*(undefined8 *)((long)register00000020 + -0x38),&runtime.egcbss); // Send error signal
            return; // Validation failed, exit
        }

        // 8. Increment Index for Next Iteration
        current_index++; // uVar4 = uVar4 + 1;
        // Remaining lines in loop update channel pointers and other boilerplate.
    }

    // --- Error Handling and Stack Management (Outside Main Loop) ---

    // Panic Trigger for Index Out of Bounds (LAB_0049f0af)
    // This block is reached if the loop's 'if (0x17 < uVar4) break;' condition
    // is met, indicating an index >= 24 was reached within the processing.
    // This is an unexpected state leading to a Go runtime panic.
LAB_0049f0af: // This label should actually be LAB_0049f24d in the previous func1 context, but given as 0x49f0af here.
    *(undefined8 *)((long)register00000020 + -0x140) = 0x49f0bc; // Return address / boilerplate
    runtime.panicIndex(*(undefined8 *)((long)register00000020 + -0x138),
                        *(undefined8 *)((long)register00000020 + -0x130));

    // Stack Re-alignment / More Stack (LAB_0049f09a)
    // This section handles Go's dynamic stack growth.
    // If the Goroutine runs out of stack space, runtime.morestack is called
    // to allocate a larger stack. The function then jumps back to its beginning
    // to retry execution with the larger stack.
LAB_0049f09a: // This label is for the success return path or a jump from an early check.
    *(undefined8 *)(puVar5 + -8) = 0x49f0c5; // Likely return address / boilerplate
    runtime.morestack();
    in_RDX = extraout_RDX;
    register0x00000020 = (BADSPACEBASE *)puVar5;
    unaff_RBP = puVar6;
    goto code_r0x0049ee00; // Jumps back to the start of func3.
}
```


## main.main.func1

```go
  if (*(undefined1 **)(index + 0x10) < register0x00000020) {
    puVar4 = (undefined1 *)((long)register0x00000020 + -8);
    *(undefined1 **)((long)register0x00000020 + -8) = unaff_RBP;
    puVar3 = (undefined1 *)((long)register0x00000020 + -0x48);
    *(undefined8 *)((long)register0x00000020 + -0x18) = *(undefined8 *)(in_RDX + 0x10);
    uVar2 = *(undefined8 *)(in_RDX + 8);
    *(undefined8 *)((long)register0x00000020 + -0x10) = uVar2;

	// Above code is just the prologue, decompiler additions.

```

```go
	// The below part is the important. 
	// This is datas func1 responsiple. 
	// The logic and purpose of this data will be explaining in the func3. 
	
    *(undefined8 *)((long)register0x00000020 + -0x38) = 0x47300fc1f251843e;
    *(undefined8 *)((long)register0x00000020 + -0x30) = 0x6c1ab14c445d2d6f;
    *(undefined8 *)((long)register0x00000020 + -0x28) = 0x257cc82ac421251;
```

```go
	// This is the do while loop, purpose of this code is simple. Take index and return the value defined above. Details below.
	
	do {
      // compiler additions nothing interesting here.
	  
	  *(undefined8 *)((long)register0x00000020 + -0x50) = 0x49f205;

	  // Here we are taking index number via channel, which is stored into uVar1 value defined below.
	  
      runtime.chanrecv2(uVar2,(undefined1 *)((long)register0x00000020 + -0x20));


	  // checking the channel receive operation is the success or not. if null return notin.
	  // This is really confusing
	  
      if (extraout_AL == '\0') {
        return;
      }

	  // Decompiler confused here again, checking the value uVar1 is below than 0x18(24) byte. 
	  
	  uVar1 = *(ulong *)((long)register0x00000020 + -0x20);
      
	  *(undefined8 *)((long)register0x00000020 + -0x20) = 0x18;
      if ((long)uVar1 < 0x18) {
	  
	  // this is the re-control probably decompiler garbage.
	  
        if (0x17 < uVar1) goto LAB_0049f24d;
        
		// decompiler trash addition.
		*(undefined8 *)((long)register0x00000020 + -0x50) = 0x49f22e;

		/* Here we are literally sending register0x00000020[uVar1], 
		register0x00000020 is the data we pushed to the stack
		uVar1 is the index.
		After getting value sending value via channel to caller. main.main.func3 is the orchestrator. this is it's mess. 
	*/
		runtime.chansend1(*(undefined8 *)((long)register0x00000020 + -0x18),
                          (undefined1 *)((long)register0x00000020 + (uVar1 - 0x38)));
      }
	  
	  // What does is else block no idea.
      
	  else {
        *(undefined8 *)((long)register0x00000020 + -0x50) = 0x49f245;
        runtime.chansend1(*(undefined8 *)((long)register0x00000020 + -0x18),&runtime.egcbss);
      }
      uVar2 = *(undefined8 *)((long)register0x00000020 + -0x10);
        } while( true );
  }
  goto LAB_0049f258;
```

```go
  // this this is panic triggerring if the value of uVar1 is the bigger than 0x17
  
LAB_0049f24d:
                    
  *(undefined8 *)((long)register0x00000020 + -0x50) = 0x49f257;
  runtime.panicIndex(*(undefined8 *)((long)register0x00000020 + -0x48),
                     *(undefined8 *)((long)register0x00000020 + -0x40));
```

```go
// This only exist from decompiler, Checking in the prologue routine if the stack size is not enough, getting more stack, no affect to the logic.

LAB_0049f258:
                    
  *(undefined8 *)(puVar3 + -8) = 0x49f25d;
  runtime.morestack();
  in_RDX = extraout_RDX;
  register0x00000020 = (BADSPACEBASE *)puVar3;
  unaff_RBP = puVar4;
  goto code_r0x0049f1a0;
}
```


## main.main.func2

```go
...
...
...
	  /*
	  This is a little bir interesting. Everytime func2 is called, the loop started from 0. the loop iterates 24 times. 
	  */
	  *(long *)((long)register0x00000020 + -0x20) = lVar2;
	  
	  // Pushing datas to stack. The purpose of these datas are the used for xoring operation. simply this function does getting data with index via channel, xor with it and than return it.
	  
	  *(undefined8 *)((long)register0x00000020 + -0x39) = 0x912efa6c49bd6be;
      *(undefined8 *)((long)register0x00000020 + -0x31) = 0x6a163b0583444d46;
      *(undefined8 *)((long)register0x00000020 + -0x29) = 0x24e61ff4643ea395;
   
```

```go
	  lVar2 = 0;
   /*
   lVar2 is the index of the loop which stored in the $rsp-0x20.
   */                 
      while( true ) {
                    
        *(long *)((long)register0x00000020 + -0x20) = lVar2;

		// Getting 24 bytes long data via channel
		
        runtime.chanrecv2(uVar1,(undefined1 *)((long)register0x00000020 + -0x21));
        
		
		// same control data received successfully or not.            
        if (extraout_AL == '\0') {
          return;
        }
```

```go
		/* Controlling the length its greater than 0x17. if its go to panic. 
		
		if not, simple xor (received_data[i])^(data[i])
		*/
		if (0x17 < *(ulong *)((long)register0x00000020 + -0x20)) break;
        /*
		Here the xor operation executed. xor every single byte sent via channel.
		*/
		*(byte *)((long)register0x00000020 + -0x21) =
             *(byte *)((long)register0x00000020 + -0x21) ^
             *(byte *)((long)register0x00000020 +
                      (*(ulong *)((long)register0x00000020 + -0x20) - 0x39));

		/*
		Sending that 24 byte long data via channel.
		*/
        runtime.chansend1(*(undefined8 *)((long)register0x00000020 + -0x18),
                          (undefined1 *)((long)register0x00000020 + -0x21));
        
		lVar2 = *(long *)((long)register0x00000020 + -0x20) + 1;
        uVar1 = *(undefined8 *)((long)register0x00000020 + -0x10);
      }
...
...
...
```


## The Resolve Script

```python
# from IPython import embed # Commented out as it's not used in the final script
from pwn import *

# --- Constants ---
# Local binary path
LOCAL_FILE = "./chal"

# Function addresses (for GDB breakpoints or reference)
BFUNC1 = 0x49f1a0
BFUNC2 = 0x49f0e0
BFUNC3 = 0x49ee00

# Specific instruction addresses within functions (for GDB breakpoints)
BFUNC3_XOR_CHECK = 0x49f038
BFUNC3_WHILE_ENTRY = 0x49eff8
BFUNC3_STACK_SETUP = 0x49efe6
BFUNC3_CHECK = 0x49f074
BFUNC2_XOR_OPR = 0x49f13f
BFUNC2_RECEIVE_CHAN = 0x49f161

# GDB script for debugging
GDBSCRIPT = f"""
set follow-fork-mode child
b *{BFUNC3_XOR_CHECK:#x}
"""

# Hardcoded data extracted from main.main.func3 (Expected values)
# These are the expected output bytes after all transformations.
FUNC3_HARDCODED_DATA = [
    0x5c, 0xef, 0x33, 0x0d, 0x92, 0xd6, 0xc4, 0x58,
    0xac, 0x23, 0x19, 0xf6, 0x76, 0x04, 0x25, 0x77,
    0xd0, 0xdb, 0x1f, 0x90, 0x93, 0x3c, 0x90, 0xf5
]

# Hardcoded data extracted from main.main.func2 (XOR Key / Mask)
# This is the key used by func2 for its XOR operation.
FUNC2_HARDCODED_DATA = [
    0xbe, 0xd6, 0x9b, 0xc4, 0xa6, 0xef, 0x12, 0x09,
    0x46, 0x4d, 0x44, 0x83, 0x05, 0x3b, 0x16, 0x6a,
    0x95, 0xa3, 0x3e, 0x64, 0xf4, 0x1f, 0xe6, 0x24
]

# Permutation map / indices extracted from main.main.func3
# This map defines the reordering of elements for func1's data access.
INDICES = [
    0x15, 0x17, 0x01, 0x03, 0x0e, 0x12, 0x0d, 0x00,
    0x14, 0x0a, 0x06, 0x0b, 0x11, 0x02, 0x0f, 0x08,
    0x09, 0x0c, 0x10, 0x04, 0x16, 0x07, 0x05, 0x13
]

# Hardcoded data extracted from main.main.func1 (Leaked data / First XOR operand source)
# This is the data block that func1 provides based on indices.
# (Note: Based on analysis, this data is XORed with user input
#  before being passed to func2 for its XOR operation).
FUNC1_HARDCODED_DATA = [
    0x3e, 0x84, 0x51, 0xf2, 0xc1, 0x0f, 0x30, 0x47,
    0x6f, 0x2d, 0x5d, 0x44, 0x4c, 0xb1, 0x1a, 0x6c,
    0x51, 0x12, 0x42, 0xac, 0x82, 0xcc, 0x57, 0x02
]


def calculate_flag() -> bytes:
    """
    Calculates the correct flag by reversing the triple XOR and permutation logic
    observed in main.main.func3, main.main.func2, and main.main.func1.

    The validation logic in the binary is:
    Expected_Result[i] == ( (User_Input[i] XOR Value_From_Func1[i]) XOR Key_From_Func2[i] )

    To find User_Input[i] (the flag byte):
    User_Input[i] = Expected_Result[i] XOR Key_From_Func2[i] XOR Value_From_Func1[i]

    Where:
    - Expected_Result[i]: func3_hardcoded_data[i]
    - Key_From_Func2[i]: func2_hardcoded_data[i]
    - Value_From_Func1[i]: func1_hardcoded_data[INDICES[i]] (due to permutation)
    """
    xored_flag_list = [0] * len(INDICES)

    for i, idx in enumerate(INDICES):
        # Value from func1's internal data (after permutation)
        value_from_func1 = FUNC1_HARDCODED_DATA[idx]

        # Key byte from func2's hardcoded XOR key
        key_from_func2 = FUNC2_HARDCODED_DATA[i]

        # Expected result byte from func3's hardcoded data
        expected_result = FUNC3_HARDCODED_DATA[i]

        # Apply the triple XOR in reverse
        xored_flag_list[i] = expected_result ^ key_from_func2 ^ value_from_func1

    # Convert the list of integers to a bytes object
    flag_bytes = bytes(xored_flag_list)
    return flag_bytes


def main():
    """
    Main function to orchestrate the exploit:
    Calculates the flag, connects to the target, sends credentials,
    and submits the calculated flag.
    """
    # --- Configuration ---
    # Set to True for local execution, False for remote connection
    IS_LOCAL = True

    if IS_LOCAL:
        # Start the program locally with GDB attached (if needed)
        # Remove gdbscript if not debugging
        proc = gdb.debug(LOCAL_FILE, gdbscript=GDBSCRIPT)
        info(f"Starting locally: {LOCAL_FILE}")
    else:
        # Remote connection details
        REMOTE_HOST = 'challenge.example.com'  # Target IP or hostname
        REMOTE_PORT = 1337                   # Target port
        proc = remote(REMOTE_HOST, REMOTE_PORT)
        info(f"Connecting remotely: {REMOTE_HOST}:{REMOTE_PORT}")

    # Calculate the flag
    calculated_flag = calculate_flag()
    success(f"Calculated Flag (Hex): {calculated_flag.hex()}")
    success(f"Calculated Flag (ASCII): {calculated_flag.decode('ascii', errors='ignore')}")

    try:
        # Receive and send Username
        proc.recvuntil(b'Username: ')
        proc.sendline(b'testuser')
        info("Username sent.")

        # Receive and send Password
        proc.recvuntil(b'Password: ')
        proc.sendline(b'testpass')
        info("Password sent.")

        # Receive "Input your string:" prompt and send the calculated flag
        proc.recvuntil(b'Input your string: ')
        proc.sendline(calculated_flag)
        success("Calculated flag sent!")

        # Wait for the program's final output (success or failure message)
        output = proc.recvuntil(b'string.', timeout=5)

        if b'Correct string.' in output:
            success("Flag ACCEPTED! Program said 'Correct string.'.")
        elif b'Incorrect string.' in output:
            warn("Flag REJECTED. Program said 'Incorrect string.'.")
        else:
            warn("Unexpected output received. Program behaved differently.")
            print(output.decode(errors='ignore')) # Print whatever was received

    except EOFError:
        error("Connection closed unexpectedly.")
    except Exception as e:
        error(f"An error occurred: {e}")
    finally:
        proc.close() # Ensure the connection is closed


if __name__ == "__main__":
    main()


```

# My Original Code

```python
#from IPython import embed
from pwn import *

local_file = "./chal"

#set follow-fork-mode child
#b *0x49eb40





after_func1 = 0x49ec10
after_func2 = 0x49ec5e
after_func3 = 0x49ecea
bprnt = 0x49eaed

bfunc1 = "0x49f1a0"
bfunc2 = "0x49f0e0"
bfunc3 = "0x49ee00"

b_sendchan2 = "0x000000000049f049"

func3_xor_check = "0x000000000049f038" #"0x000000000049f036"
func3_while_entry = "0x49eff8"
func3_stacksetup = "0x000000000049efe6"

func3_check = "0x49f074"



#b *{func3_stacksetup}
#b *{b_sendchan2}
#b *{func3_xor_check}

#b *{func3_xor_check}
#b *{func3_check}

func2_xor_opr = "0x49f13f"
func2_receive_chan = "0x49f161"

gdbscript=f"""
set follow-fork-mode child
b *{func2_receive_chan}
b *{func2_xor_opr}
b *{func3_xor_check}
"""
#for i, idx in enumerate(indices):
#	result[i] = (xor_keylist[i]^validation_list[i])^(func1_list[idx])

validation_list=[
    0x5c, 0xef, 0x33, 0x0d, 0x92, 0xd6, 0xc4, 0x58,
    0xac, 0x23, 0x19, 0xf6, 0x76, 0x04, 0x25, 0x77,
    0xd0, 0xdb, 0x1f, 0x90, 0x93, 0x3c, 0x90, 0xf5
]


xor_keylist = [
    0xbe, 0xd6, 0x9b, 0xc4, 0xa6, 0xef, 0x12, 0x09,
    0x46, 0x4d, 0x44, 0x83, 0x05, 0x3b, 0x16, 0x6a,
    0x95, 0xa3, 0x3e, 0x64, 0xf4, 0x1f, 0xe6, 0x24
]

indices = [
    0x15,  # at -0x100
    0x17,  # at -0xf8
    0x01,     # at -0xf0
    0x03,   # at -0xe0 (decimal 14)
    0x0e,  # at -0xd8 (decimal 18)
    0x12,   # at -0xd0 (decimal 13)
    0x0d,
    0x00, # at -200 (which is -0xc8, if 8-byte aligned)
    0x14,  # at -0xc0 (decimal 20)
    0x0a,    # at -0xb8
    0x06,     # at -0xb0
    0x0b,   # at -0xa8 (decimal 11)
    0x11,  # at -0xa0 (decimal 17)
    0x02,     # at -0x98
    0x0f,   # at -0x90 (decimal 15)
    0x08,     # at -0x88
    0x09,     # at -0x80
    0x0c,   # at -0x78 (decimal 12)
    0x10,  # at -0x70 (decimal 16)
    0x04,     # at -0x68
    0x16,  # at -0x60 (decimal 22)
    0x07,     # at -0x58
    0x05,     # at -0x50
    0x13   # at -0x48 (decimal 19)
]


func1_list = [
    0x3e, 0x84, 0x51, 0xf2, 0xc1, 0x0f, 0x30, 0x47,
    0x6f, 0x2d, 0x5d, 0x44, 0x4c, 0xb1, 0x1a, 0x6c,
    0x51, 0x12, 0x42, 0xac, 0x82, 0xcc, 0x57, 0x02
]


xored_flag = [0] * len(indices)
for i, idx in enumerate(indices):
    xored_flag[i] = (xor_keylist[i]^validation_list[i])^(func1_list[idx])



#b *0x49f1f1

payload = b""

for i in xored_flag:
	payload+=p8(i)


#p = gdb.debug(local_file, gdbscript=gdbscript)
p = process(local_file)

print(p.recv().decode())
text = b""
text += payload
p.sendline(text)

#embed()
log.info(''.join([chr(i) for i in xored_flag]))
p.interactive()

```

