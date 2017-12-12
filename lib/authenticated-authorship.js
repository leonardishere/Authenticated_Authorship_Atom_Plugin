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

  authenticatedAuthorshipView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.authenticatedAuthorshipView = new AuthenticatedAuthorshipView(state.authenticatedAuthorshipViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.authenticatedAuthorshipView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:sign': () => this.sign()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.authenticatedAuthorshipView.destroy();
  },

  serialize() {
    return {
      authenticatedAuthorshipViewState: this.authenticatedAuthorshipView.serialize()
    };
  },

  loadPubKeyManager() {
    pubKeyManager = null
    pubKeyManagerIsLoaded = false

    console.log("Fetching public key")
    pubKey = fs.readFileSync(pubKeyLocation)

    console.log("Creating key manager")

    kbpgp.KeyManager.import_from_armored_pgp({
      armored: pubKey
    }, (err, self) => {
      if(err){
        console.log("Error creating key manager")
      }else{
        console.log("Successfully created key manager")
        pubKeyManager = self
        pubKeyManagerIsLoaded = true
      }
    })
  },

  loadPriKeyManager() {
    priKeyManager = null
    priKeyManagerIsLoaded = false

    console.log("Fetching private key")
    priKey = fs.readFileSync(priKeyLocation)

    console.log("Creating key manager")
    var success = false
    kbpgp.KeyManager.import_from_armored_pgp({
      armored: priKey
    }, (err, self) => {
      if(err){
        console.log("Error creating key manager")
      }else{
        if(self.is_pgp_locked()){
          self.unlock_pgp({passphrase: passphrase}, (err) => {
            if(err){
              console.log("Error unlocking with passphase")
            }else{
              console.log("Loaded private key with passphrase")
              success = true
            }
          })
        }else{
          console.log("Loaded private key without passphrase")
          success = true
        }
      }

      if(success){
        priKeyManager = self
        priKeyManagerIsLoaded = true
      }
    })
  },

  //toggles the modal panel
  sign_old1() {
    console.log('AuthenticatedAuthorship was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },

  //parses the text editor
  sign_old2() {
    let editor
    if(editor = atom.workspace.getActiveTextEditor()) {
      var str1 = editor.getText()
      str1 = str1.trim()
      var str2 = str1 + "\n\n"
      str2 += "The sum of all characters in the article is: "
      var num = 0
      for(var i = 0; i < str1.length; ++i) {
        num += str1.charCodeAt(i)
      }
      str2 += num

      editor.setText(str2)
    }
    atom.notifications.addSuccess("Signed Article!\n(Article signing not yet implemented.)")
  },

  //signs and encrypts the message
  sign() {
    let editor
    if(editor = atom.workspace.getActiveTextEditor()) {
      str1 = editor.getText()
      str2 = str1.trim()
      str1 += "\n\n"

      if(!priKeyManagerIsLoaded) {
        this.loadPriKeyManager()
      }
      if(!pubKeyManagerIsLoaded) {
        this.loadPubKeyManager()
      }
      if(priKeyManagerIsLoaded && pubKeyManagerIsLoaded){
        var params = {
          msg: str2,
          sign_with: priKeyManager
        }
        kbpgp.box(params, (err, result_string, result_buffer) => {
          if(err){
            console.log(err)
            atom.notifications.addError("Article could not be signed. Restart and try again.")
          }else{
            str1 += "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n"
            str1 += result_string + "\n"
            editor.setText(str1)

            atom.notifications.addSuccess("Signed Article!")

            //decrypt
            kbpgp.unbox({keyfetch: pubKeyManager, armored: result_string}, (err, literals) => {
              if(err){
                console.log(err)
                atom.notifications.addError("Article could not be verified. Restart and try again.")
              }else{
                str1 += "\nDecrypted message:\n"
                str1 += literals[0].toString()
                ds = km = null
                ds = literals[0].get_data_signer()
                if(ds) {
                  console.log(ds)
                  km = ds.get_key_manager()
                }
                if(km) {
                  console.log(km)
                  str1 += "\n\nsigned by pgp fingerprint:\n"
                  str1 += km.get_pgp_fingerprint().toString('hex') + "\n"
                  signer = km.engines[0].key_manager.userids[0].components
                  str1 += "Name:   " + signer.username + "\n"
                  str1 += "Email:  " + signer.email + "\n"
                  if(signer.comment){
                    str1 += "Comment: " + signer.comment + "\n"
                  }
                }

                editor.setText(str1)
                atom.notifications.addSuccess("Verified Article!")
              }
            })

          }
        })
      }else{
        atom.notifications.addError("Article could not be signed. Restart and try again.")
      }
    }else{
      atom.notifications.addError("Text editor not read. Try again.")
    }
  }

};
