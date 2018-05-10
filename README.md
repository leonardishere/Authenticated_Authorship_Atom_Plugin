# Authenticated Authorship Atom Plugin

Authenticated Authorship seeks to authenticate the authorship of messages, increasing users’ trust of the internet. They specifically seek to tackle falsified journalism, yet build a system that can be used across sectors and mediums.

The Atom plugin is a proof of concept that a hackable text editor can be made into a tool that not only signs but also verifies articles. The plugin is the main tool for authors who wish to sign their articles. The plugin allows people to use a public/private key pair which is hosted at Keybase.io to sign an article and then have the opportunity to share the article on the Internet. A signed article can also be shared through email, personal website, or social media platform. Also the plugin is responsible for verifying articles from the Internet as well as articles sent to a user through other means.

A second software package, titled Authenticated Authorship Chrome Extension, can be used to verify articles that are published on the internet. It will be publicly available in the next few weeks. This repository and package pertain to the Atom plugin specifically, but make reference to the Chrome extension.

## Installation

* Install [Atom text editor](https://atom.io/) if you haven't already.   
* In Atom, open *Preferences* (*Settings* on Windows).
* Go to the *Install* section.
* Search for the `Authenticated Authorship` package. Once it is found, click the `Install` button to install the package.

### Manual installation

You can install the latest version of Authenticated Authorship manually from the console. Close atom, then execute the following commands:

```bash
cd ~/.atom/packages
git clone https://github.com/leonardishere/Authenticated_Authorship_Atom_Plugin.git
cd authenticated-authorship
npm install
```

## How to use

### Keybase

A Keybase account is required to use the system. Create one at [keybase.io](keybase.io) if you do not have one. Read their guide to generate and host a public/private key pair.

When necessary, retrieve your private key from Keybase via viewing your account at keybase.io/username, then clicking the buttons as shown in the images below.
<img src="https://raw.githubusercontent.com/leonardishere/Authenticated_Authorship_Atom_Plugin/9ea129d/img/keybase%20private%20key%20screenshot%201.PNG" alt="keybase private key screenshot 1">
<img src="https://raw.githubusercontent.com/leonardishere/Authenticated_Authorship_Atom_Plugin/9ea129d/img/keybase%20private%20key%20screenshot%202.PNG" alt="keybase private key screenshot 2">
<img src="https://raw.githubusercontent.com/leonardishere/Authenticated_Authorship_Atom_Plugin/9ea129d/img/keybase%20private%20key%20screenshot%203.PNG" alt="keybase private key screenshot 3">
Follow the on screen instructions. When the private key is displayed, it can be copied and pasted into Atom.



### Authenticating

Begin by writing your article in Atom. When you are finished, sign the article by using one of the following methods:  
* Ctrl-Alt-P
* Menu Bar -> Packages -> Authenticated Authorship -> Hardware Authenticate
* Context Menu -> Authenticated Authorship - Hardware Authenticate

Enter your Keybase username, password, and private key. Select the format to sign to. On success, the signed article will replace the editor text.

### Store Private Key to File

Begin by choosing any of these methods to store your private key to a file:  
* Ctrl-Alt-I
* Menu Bar -> Packages -> Authenticated Authorship -> Store Private Key to File
* Context Menu -> Authenticated Authorship - Store Private Key to File

Enter your private key and a password to sign the private key. We recommend that this password not be identical to your Keybase password. Select the name and location of the file in the next window. Keys are stored in .AAK format, which is an abbreviation of Authenticated Authorship Key.

### File Authenticating

Begin by writing your article in Atom. When you are finished, sign the article by using one of the following methods if you have your private key saved in a file:  
* Ctrl-Alt-L
* Menu Bar -> Packages -> Authenticated Authorship -> File Authenticate
* Context Menu -> Authenticated Authorship - File Authenticate

Enter your Keybase username and password, the key file, and the key password. On success, the signed article will replace the editor text.

### Verifying

Do not make any edits to the file. Edits may cause authentication to fail. Verify the article by using one of the following methods:
* Ctrl-Alt-V
* Menu Bar -> Packages -> Authenticated Authorship -> Verify
* Context Menu -> Authenticated Authorship - Verify

A status notification will appear, indicating success or failure. The editor text will also change to reflect the status.

This may be used to verify your own messages before you send them. Remember to undo any changes caused by verification before sending.

Verifying HTML articles is currently not available. You may do so by viewing them on Chrome with the Authenticated Authorship Chrome Extension installed.

### Sharing

There are numerous ways to share your article. You may post it to a site via an embedded textbox, used by sites such as Twitter. Copy the article and signature in its entirety, paste it into the textbox, and post.

You may also send it as a file, like an email attachment. Save the file, upload it, and send.

To use advanced methods, such as ftp, consult your local tech expert.

## Additional software by Authenticated Authorship

Authenticated Authorship is currently building additional software that can be used on other platforms. Check back to see what we're up to.
