'use babel';
var kbpgp = require('kbpgp')
var fs = require('fs')

import AuthenticatedAuthorshipView from './authenticated-authorship-view';
import { CompositeDisposable } from 'atom';

//use https://pgpkeygen.com/ to generate a pgp key pair
/*
var pubKeyLocation = "C:\\Users\\Andrew\\Downloads\\0x2C6FF983-pub.asc"
var priKeyLocation = "C:\\Users\\Andrew\\Downloads\\0x2C6FF983-sec.asc"
var passphrase = "test test 123"
*/
/*
var pubKeyLocation = "C:\\Users\\Andrew\\Downloads\\0x434A181E-pub.asc"
var priKeyLocation = "C:\\Users\\Andrew\\Downloads\\0x434A181E-sec.asc"
var passphrase = "test test 12345"
*/

var pubKeyLocation = "C:\\Users\\Andrew\\Downloads\\0x432D2491-pub.asc"
var priKeyLocation = "C:\\Users\\Andrew\\Downloads\\0x432D2491-sec.asc"
var passphrase = "follow the yellow brick road"

var pubKeyManager = null
var priKeyManager = null
var pubKeyManagerIsLoaded = false
var priKeyManagerIsLoaded = false

export default {

  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:sign': () => this.sign(),
      'authenticated-authorship:verify': () => this.verify()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  //loads the public key manager from file
  loadPubKeyManager() {
    pubKeyManager = null
    pubKeyManagerIsLoaded = false

    //console.log("Fetching public key")
    pubKey = fs.readFileSync(pubKeyLocation)

    //console.log("Creating key manager")

    kbpgp.KeyManager.import_from_armored_pgp({
      armored: pubKey
    }, (err, self) => {
      if(err){
        //console.log("Error creating key manager")
      }else{
        //console.log("Successfully created key manager")
        pubKeyManager = self
        pubKeyManagerIsLoaded = true
      }
    })
  },

  //loads the private key manager from file
  loadPriKeyManager() {
    priKeyManager = null
    priKeyManagerIsLoaded = false

    //console.log("Fetching private key")
    priKey = fs.readFileSync(priKeyLocation)

    //console.log("Creating key manager")
    var success = false
    kbpgp.KeyManager.import_from_armored_pgp({
      armored: priKey
    }, (err, self) => {
      if(err){
        //console.log("Error creating key manager")
      }else{
        if(self.is_pgp_locked()){
          self.unlock_pgp({passphrase: passphrase}, (err) => {
            if(err){
              //console.log("Error unlocking with passphase")
            }else{
              //console.log("Loaded private key with passphrase")
              success = true
            }
          })
        }else{
          //console.log("Loaded private key without passphrase")
          success = true
        }
      }

      if(success){
        priKeyManager = self
        priKeyManagerIsLoaded = true
      }
    })
  },

  //signs the message
  sign() {
    let editor = atom.workspace.getActiveTextEditor()
    if(editor) {
      str1 = editor.getText()
      str2 = str1.trim()
      str1 += "\n\n"

      if(!priKeyManagerIsLoaded) {
        this.loadPriKeyManager()
      }
      if(priKeyManagerIsLoaded){
        var params = {
          msg: str2,
          sign_with: priKeyManager
        }
        kbpgp.box(params, (err, result_string, result_buffer) => {
          if(err){
            //console.log(err)
            atom.notifications.addError("Article could not be signed. Restart and try again.")
          }else{
            str1 += "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n"
            str1 += result_string + "\n"
            editor.setText(str1)

            atom.notifications.addSuccess("Signed Article!")
          }
        })
      }else{
        atom.notifications.addError("Article could not be signed. Restart and try again.")
      }
    }else{
      atom.notifications.addError("Text editor not read. Try again.")
    }
  },

  //verifies the message
  verify() {
    //get message
    let editor = atom.workspace.getActiveTextEditor()
    if(editor) {
      str1 = editor.getText()
      str2 = str1.trim()

      messageIndex = str2.indexOf("Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!")
      if(messageIndex === -1){
        atom.notifications.addError("The text doesn't contain a valid signature. Try again.")
        return
      }
      message = str2.substring(0, messageIndex).trim()
      startIndex = str2.indexOf("-----BEGIN PGP MESSAGE-----")
      endIndex = str2.indexOf("-----END PGP MESSAGE-----")
      if(startIndex === -1 || endIndex === -1 || startIndex > endIndex){
        atom.notifications.addError("The text doesn't contain a valid PGP message. Try again.")
      }else{
        endIndex += "-----END PGP MESSAGE-----".length
        str3 = str2.substring(startIndex, endIndex)
        /*
        lines = str3.split('\n')

        result_string = ""
        for(i = 0; i < lines.length; ++i){
          //console.log("" + i + ": " + lines[i])
          result_string += lines[i] + "\n"
        }
        console.log("str3.length: " + str3.length)
        console.log("lines.length: " + result_string.length)
        */
        if(!pubKeyManagerIsLoaded) {
          this.loadPubKeyManager()
        }
        if(pubKeyManagerIsLoaded){
          //decrypt
          kbpgp.unbox({keyfetch: pubKeyManager, armored: str3}, (err, literals) => {
            if(err){
              //console.log(err)
              atom.notifications.addError("Article could not be verified. Restart and try again.")
            }if(!literals || literals.length === 0){
              atom.notifications.addError("Article could not be verified. Restart and try again.")
            }else{
              if(literals[0].toString() !== message){
                str1 += "\nError! Original message and published message do not match.\n"
                str1 += "Original message:\n"
                str1 += literals[0].toString() + "\n"
                str1 += "Published message:\n"
                str1 += message + "\n"
                atom.notifications.addError("Messages do not match")
              }else{
                str1 += "\nDecrypted message:\n"
                str1 += literals[0].toString()
                ds = km = null
                ds = literals[0].get_data_signer()
                if(ds) {
                  //console.log(ds)
                  km = ds.get_key_manager()
                }
                if(km) {
                  //console.log(km)
                  str1 += "\n\nsigned by pgp fingerprint:\n"
                  str1 += km.get_pgp_fingerprint().toString('hex') + "\n"
                  signer = km.engines[0].key_manager.userids[0].components
                  str1 += "Name:   " + signer.username + "\n"
                  str1 += "Email:  " + signer.email + "\n"
                  if(signer.comment){
                    str1 += "Comment: " + signer.comment + "\n"
                  }
                }
                atom.notifications.addSuccess("Verified Article!")
              }

              editor.setText(str1)
            }
          })
        }else{
          atom.notifications.addError("Public key could not be found. Restart and try again.")
        }
      }
    }else{
      atom.notifications.addError("Text editor not read. Try again.")
    }
  }
};
