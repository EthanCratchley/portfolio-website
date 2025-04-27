# OverTheWire - Bandit Solutions & Notes

## **Table of Contents**
1. [Introduction](#introduction)
2. [Bandit Walkthrough](#bandit-walkthrough)
3. [Review](#review)

---
## **Introduction**
The Bandit wargame, hosted by OverTheWire, is an excellent introductory challenge for learning fundamental Linux command-line skills and basic security concepts. It presents a series of levels, each requiring you to exploit a specific vulnerability or use a particular command to retrieve a password for the next level. By navigating through the Bandit levels, you'll gain practical experience with file manipulation, SSH, permissions, and other aspects of the Linux environment, scripting, and cybersecurity.

***NOTE: if you have not completed or attempted bandit already the following below are spoilers. I highly reccomend trying to complete the challenge on your own first, the notes below are simply a place to refer to after having completed and helped me in explaining the process as I moved through levels.***

---

## **Bandit Walkthrough**
### **[Bandit Wargame](https://overthewire.org/wargames/bandit/)**

### **Bandit Level 0 → 1** *(02/04/25) - < 3 Minutes*
**Login:**
```
ssh bandit0@bandit.labs.overthewire.org -p 2220
Password: bandit0
```
**Solution:**
```
cat readme
```

### **Bandit Level 1 → 2** *(02/04/25) - < 3 Minutes*
**Solution:**
```
cat ./-
```

### **Bandit Level 2 → 3** *(02/04/25) - < 3 Minutes*
**Solution:**
```
cat "spaces in this filename"
```

### **Bandit Level 3 → 4** *(02/04/25) - < 3 Minutes*
**Solution:**
```
ls -la /inhere/
cat ...Hiding-From-You
```

### **Bandit Level 4 → 5** *(02/04/25) - < 3 Minutes*
**Solution:**
```
cat ./-file07
```

### **Bandit Level 5 → 6** *(02/04/25) - < 5 Minutes*
**Solution:**
```
find -type f -size 1033c ! -executable
cat maybehere07/.file2
```

### **Bandit Level 6 → 7** *(02/05/25) - < 5 Minutes*
**Solution:**
```
find / -user bandit7 -group bandit6 -size 33c 2>/dev/null
cat /var/lib/dpkg/info/bandit7.password
```

### **Bandit Level 7 → 8** *(02/05/25) - < 5 Minutes*
**Solution:**
```
grep "millionth" data.txt
```

### **Bandit Level 8 → 9** *(02/05/25) - < 5 Minutes*
**Solution:**
```
sort data.txt | uniq -u
```

### **Bandit Level 9 → 10** *(02/07/25) - < 5 Minutes*
**Solution:**
```
strings data.txt | grep "======"
```

### **Bandit Level 10 → 11** *(02/08/25) - < 5 Minutes*
**Solution:**
```
base64 -d data.txt
```

### **Bandit Level 11 → 12** *(02/08/25) - < 5 Minutes*
**Solution:**
```
cat data.txt | tr '[A-Za-z]' '[N-ZA-Mn-za-m]'
```

### **Bandit Level 12 → 13** *(02/09/25) - ~10 Minutes*
**Solution:**
1. Create Directory and Move File
```
cd /tmp
mktemp -d 
cd /tmp/tmp.W5t1vua6G9
cp ~/data.txt .
mv data.txt hexdump_data
```
2. Revert hexdump of the file
```
xxd -r hexdump_data compressed_data
```
3. Repeatedly decompress
```
bzip2, gzip, xdd, tar
```
4. Final GZIP Decompression for Password
```
xxd data8.bin
mv data8.bin data8.gz
gzip -d data8.gz
cat data8
```

### **Bandit Level 13 → 14** *(02/10/25) -  ~5 Minutes*
**Solution:**
1. Use private key to gain access to bandit14 
```
bandit13@bandit:~$ ssh -i sshkey.private -p 2220 bandit14@localhost
```
2. Cat Password in bandit14
```
cat /etc/bandit_pass/bandit14
```

### **Bandit Level 14 → 15** *(02/13/25) - ~5 Minutes*
**Solution:**
1. Use this Password
```
cat /etc/bandit_pass/bandit14
```
2. Provide password here to receive new password
```
nc localhost 30000
```

### **Bandit Level 15 → 16** *(02/13/25) - ~8 Minutes*
**Solution:**
1. Use this Password
```
cat /etc/bandit_pass/bandit15
```
2. Provide password and receive new password here
```
openssl s_client -connect localhost:30001
```

### **Bandit Level 16 → 17** *(02/15/25) - ~15 Minutes*
**Solution:**
1. Run nmap Scan for Ports
   1. Use -sV to find versioning info and -T4 to speed up 
```
nmap -sV -T4 -p 31000-32000 localhost
```
2. Connect to correct port and enter previous password to retreive RSA Private Key
```
openssl s_client -connect localhost:31790      
```
3. Create a Temp Directory and private.key which you will use to access bandit17
```
mkdir /tmp/rsa_key
cd /tmp/rsa_key
touch private.key
nano private.key (enter RSA key)
chmod 400 private.key
```
4. Use private.key to acess bandit17
```
ssh -i private.key bandit17@localhost -p 2220
```
5. Get password for bandit17
``` 
cat /etc/bandit_pass/bandit17
```
*Note: there is known to be some bugs with step 2, you may have to google for help*

### **Bandit Level 17 → 18** *(02/15/25) - < 3 Minutes*
**Solution:**
1. Use diff to find the difference between the two files
   1. the one from password.new is the correct password
```
diff password.new password.old
```

### **Bandit Level 18 → 19** *(02/15/25) - < 3 Minutes*
**Solution:**
1. Find file
```
❯ ssh -p 2220 bandit18@bandit.labs.overthewire.org 'ls -a'
```
2. Read File
```
❯ ssh -p 2220 bandit18@bandit.labs.overthewire.org 'cat readme'
```

### **Bandit Level 19 → 20** *(02/15/25) - < 5 Minutes*
**Solution:**
1. Run the setuid file and command for password
```
./bandit20-do cat /etc/bandit_pass/bandit20
```

### **Bandit Level 20 → 21** *(02/15/25) - ~8 Minutes*
**Solution:**
1. Open up two tabs/windows in terminal 
2. On one tab find setuid port
```
ls -la
```
3. Listen to port with netcat
```
nc -l -p 15604
```
4. On your second tab run the setuid on the correct port and enter the password
```
./suconnect 15604
```
5. Get new password from first port with netcat listening

### **Bandit Level 21 → 22** *(02/16/25) - ~8 Minutes*
**Solution:**
1. See what's inside the folder and file
```
ls -la /etc/cron.d
cat /etc/cron.d/cronjob_bandit22
```
2. Read output file
```
cat /usr/bin/cronjob_bandit22.
```
3. Read password file
```
cat /tmp/t7O6lds9S0RqQh9aMcz6ShpAoZKF7fgv
```

### **Bandit Level 22 → 23** *(02/16/25) - ~10 Minutes*
**Solution:**
1. See what's inside the folder and file
```
ls -la /etc/cron.d
cat /etc/cron.d/cronjob_bandit23
```
2. Read output file
```
cat /usr/bin/cronjob_bandit23.
```
3. Echo command as bandit23 user
```
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
```
4. Read tmp directory given
```
cat /tmp/8ca319486bfbbc3663ea0fbe81326349
```

### **Bandit Level 23 → 24** *(02/22/25) - ~20 Minutes*
**Solution:**
1. Started by checking what was inside the given location
```
ls /etc/cron.d/
```
2. I then read the file and read the cron file being executed and went to the directory
```
cat /etc/cron.d/cronjob_bandit24
cat /usr/bin/cronjob_bandit24.
cd /var/spool/bandit24/foo
```
- After reading the executed cron job you can see the bash code is executing scripts by bandit23 and then deleting all files in the directory every minute

1. I then made a directory in tmp and ensured correct permissions where we will send the password 
```
mkdir /tmp/b23
chmod 777 /tmp/b23
```
1. Next I build the bash script taht will be automatically executed by the cron job
```
nano get.sh
chmod +x get.sh
```
- Ensure you are using the correct bash version/location

```
!/usr/bin/bash

cat /etc/bandit_pass/bandit24 > /tmp/b23/pass.txt
chmod 400 /tmp/b23/pass.txt
```
5. Read password
```
cat /tmp/b23/pass.txt
```

### **Bandit Level 24 → 25** *(02/25/25) - ~15 Minutes*
**Solution:**
1. Listen on localhost 30002
```
nc localhost 30002
```
- The output will inform you that you need to enter the previous level password and a pin to get the next level password
- The best way to go about about this for this level requiring a brute force is to create a for loop testing all pincodes with the password
- There are multiple ways to do this, the one I use is among the more simple and maybe a little less efficient
2. Create directory and shell script
```
mkdir /tmp/b24
cd /tmp/b24
touch get.
```

3. Create brute force in shell script
```
which bash
nano get.sh
```

```
#!/usr/bin/bash 

# bash command above depends on whcih bash output

BANDIT24_PASS="PASSWORD"

for i in {0000..9999}; do # loop through all pincodes 0000-9999
	echo "$BANDIT24_PASS $i" >> list.txt; # import them and the password in list.txt
done
```
- the | (Pipe) symbol takes theoutput of the command on the left and sends it as input to the command on its right
<br><br>

4. Run cat on list.txt testing it against the port until you receive the password 
```
cat list.txt | nc localhost 30002
```

### **Bandit Level 25 → 26** *(02/25/25) - ~20 Minutes*
**Solution:**
1. We run ls to see what were working with and we see were give the private key
```
ls -la
cat bandit26.sshkey
```
2. Similar to past solutions we will use this to enter bandit26
```
mkdir /tmp/rsa_key
cd /tmp/rsa_key
touch private.key
nano private.key (enter RSA key)
chmod 400 private.key
ssh -i private.key bandit26@bandit.labs.overthewire.org -p 2220
```
3. As you will see when you try to connect like this the connection will be immedietly closed, therefore we will have to look for another solution
- You can see from the old password folder all the information about each bandit user and here we can see the shell bandit26 is using as well as the shell command
```
cat /etc/passwd | grep bandit26
cat /usr/bin/showtext
```
4. We will now exploit the more function utilized in the shell command by making the terminal extremly small and connecting to bandit26
```
#shrink terminal
ssh -i private.key bandit26@bandit.labs.overthewire.org -p 2220
```
5. Now we will exploit more by entering vim, from vim you can execute shell commands using : as seen below to retrieve the password
```
:set shell? #shows what shell we are in
:set shell=/usr/bin/bash #change shell
:shell #enter shell
cat /etc/bandit_pass/bandit26 #retrieve password
```

### **Bandit Level 26 → 27** *(02/26/25) - ~5 Minutes*
**Solution:**
1. Login to bandit26 through the previous level
2. Read the bandit27 password with the binary file given
```
ls -a
cat bandit27-do
./bandit27-do cat /etc/bandit_pass/bandit27
```

### **Bandit Level 27 → 28** *(02/26/25) - ~3 Minutes*
**Solution:**
1. Make a tmp folder to clone repo into
```
mkdir /tmp/b27
cd /tmp/b27
```
2. Clone repo on port 22220
```
git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
cd repo
```
3. Find the password
```
cd repo
cat README
```

### **Bandit Level 28 → 29** *(02/26/25) - ~8 Minutes*
**Solution:**
1. Make a tmp folder to clone repo into
```
mkdir /tmp/b28
cd /tmp/b28
```
2. Clone repo on port 22220
```
git clone ssh://bandit28-git@localhost:2220/home/bandit28-git/repo
cd repo
```
3. Check the logs for any vulnerabilities 
```
git log
git checkout <has>
```
4. Check README in the correct hash for password
```
#checkout in correct hash
cat README.md
```

### **Bandit Level 29 → 30** *(02/26/25) - ~5 Minutes*
**Solution:**
1. Make a tmp folder to clone repo into
```
mkdir /tmp/b28
cd /tmp/b28
```
2. Clone repo on port 22220
```
git clone ssh://bandit28-git@localhost:2220/home/bandit28-git/repo
cd repo
```
3. Check git branches
```
git branch -a
```
4. Look through the branches until you find the password in README
```
git checkout -b dev origin/dev
cat README.md
```

### **Bandit Level 30 → 31** *(02/27/25) - ~8 Minutes*
**Solution:**
1. Make a tmp folder to clone repo into
```
mkdir /tmp/b28
cd /tmp/b28
```
2. Clone repo on port 22220
```
git clone ssh://bandit28-git@localhost:2220/home/bandit28-git/repo
cd repo
```
3. Look through .git files until you find the secret hash in packed-refs and read it
```
ls -a
cd .git
cat packed-refs
git show <hash>
```

### **Bandit Level 31 → 32** *(02/27/25) - ~8 Minutes*
**Solution:**
1. Make a tmp folder to clone repo into
```
mkdir /tmp/b28
cd /tmp/b28
```
2. Clone repo on port 22220
```
git clone ssh://bandit28-git@localhost:2220/home/bandit28-git/repo
cd repo
```
3. ReadMe states we have to make a push
```
cat README.md
nano .gitignore # Empty it
```
4. Create file and push it for password
```
echo "May I come in?" > key.txt
cat key.txt
git add key.txt
git commit -m "Add key.txt with required content" 
git push origin master 
```

### **Bandit Level 32 → 33** *(02/27/25) - ~5 Minutes*
**Solution:**
1. Utilize positional parameters to exit the shell
```
$0
```
2. Read password
```
cat /etc/bandit_pass/bandit33
```

---

## **Review**
The Bandit wargames form OverTheWire have been a super interesting challenge and I would highly reccomend them to anyone looking to learn more about cybersecurity or even just general bash/scripting.

*Thank you to the devs and admins who built and maintain Bandit and OverTheWire.*


