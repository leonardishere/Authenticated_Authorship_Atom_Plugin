# Authenticated Authorship Atom Plugin

Authenticated Authorship seeks to authenticate the authorship of messages, increasing users’ trust of the internet. They specifically seek to tackle falsified journalism by building a system that can be used across sectors and mediums.

The Atom plugin is a proof of concept that a hackable text editor can be made to work as a tool to not only sign articles but also to verify them as well. The plugin is the main tool for authors who wish to sign their articles. The plugin allows people to use a public/private key pair which is hosted at Keybase.io to sign an article and then have the opportunity to share the article on the Internet. A signed article can also be shared through email, personal website, or social media platform. Also the plugin is responsible for verifying articles from the Internet as well as articles sent to a user through other means. 

## Installation

Install Atom text editor if you haven't already. [Atom text editor](https://atom.io/)  

Clone this repository into your atom workspace. On windows, this is likely C:\Users\\<username\>\\.atom\packages  
Open a terminal window in the authenticated-authorship folder.  
Run the following commands:  
```
npm install --save kbpgp  
apm install  
```

[ Replace this install method with a package search within Atom ]

## How to use


### Hardware Authenticating

Begin by writing your article in Atom. When you are finished, sign the article by using one of the following methods:  
* Ctrl-Alt-P
* Menu Bar -> Packages -> Authenticated Authorship -> Hardware Authenticate
* Context Menu -> Authenticated Authorship - Hardware Authenticate

### File Authenticating

Begin by writing your article in Atom. When you are finished, sign the article by using one of the following methods if you have your private key saved in a file:  
* Ctrl-Alt-L
* Menu Bar -> Packages -> Authenticated Authorship -> File Authenticate
* Context Menu -> Authenticated Authorship - File Authenticate

### Verifying

Do not make any edits to the file. Edits may cause authentication to fail. If desired, you may verify that authentication will work by using one of the following methods:
* Ctrl-Alt-V
* Menu Bar -> Packages -> Authenticated Authorship -> Verify
* Context Menu -> Authenticated Authorship - Verify

[ Insert image of verified article ]

Remember to undo any edits that verification may have caused.

### Store Private Key to File

Begin by choosing any of these methods to store your private key to a file:  
* Ctrl-Alt-I
* Menu Bar -> Packages -> Authenticated Authorship -> Store Private Key to File
* Context Menu -> Authenticated Authorship - Store Private Key to File

### Sharing

There are numerous ways to share your article. You may post it to a site via an embedded textbox, used by sites such as Twitter. Copy the article and signature in its entirety, paste it into the textbox, and post.

You may also send it as a file, like an email attachment. Save the file, upload it, and send.

To use advanced methods, such as ftp, consult your local tech expert.

## Additional software by Authenticated Authorship

Authenticated Authorship is currently building additional software that can be used on other platforms. Check back to see what we're up to.
