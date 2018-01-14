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

var generateNewKey = true //as opposed to using old key

export default {

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:sign': () => this.sign(),
      'authenticated-authorship:verify': () => this.verify(),
      'authenticated-authorship:generate': () => this.generateKeyPair() //remove this
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  //loads the public key from file then generates public key manager
  loadPubKey() {
    //console.log("Fetching public key")
    pubKey = fs.readFileSync(pubKeyLocation)
    createPubKeyManager(pubKey)
  },

  //creates public key manager
  createPubKeyManager(key){
    pubKeyManager = null
    pubKeyManagerIsLoaded = false

    //console.log("Creating key manager")
    kbpgp.KeyManager.import_from_armored_pgp({
      armored: key
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

  //loads the private key from file then generates private key manager
  loadPriKey() {
    //console.log("Fetching private key")
    priKey = fs.readFileSync(priKeyLocation)
    createPriKeyManager(priKey, passphrase)
  },

  //creates private key manager
  createPriKeyManager(key, passphrase){
    priKeyManager = null
    priKeyManagerIsLoaded = false

    //console.log("Creating key manager")
    var success = false
    kbpgp.KeyManager.import_from_armored_pgp({
      armored: key
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

  //generates a new public/private key pair
  generateKeyPair(){
    console.log("generating")
    //from keybase examples
    /*
    kbpgp.KeyManager.generate_rsa({ userid : "Bo Jackson <user@example.com>" }, function(err, charlie) {
      console.log(charlie)
      console.log(charlie.sign)
      charlie.sign({}, function(err) {
        console.log("done!")
      })
    })
    */

    /*
    var F = kbpgp["const"].openpgp;

    var opts = {
      userid: "User McTester (Born 1979) <user@example.com>",
      primary: {
        nbits: 4096,
        flags: F.certify_keys | F.sign_data | F.auth | F.encrypt_comm | F.encrypt_storage,
        expire_in: 0  // never expire
      },
      subkeys: [
        {
          nbits: 2048,
          flags: F.sign_data,
          expire_in: 86400 * 365 * 8 // 8 years
        }, {
          nbits: 2048,
          flags: F.encrypt_comm | F.encrypt_storage,
          expire_in: 86400 * 365 * 8
        }
      ]
    };
    */

    var self = this
    //kbpgp.KeyManager.generate(opts, function(err, alice) {
    kbpgp.KeyManager.generate_rsa({ userid : "Alice (alice's comment) <alice@example.com>" }, function(err, alice) {
      if (!err) {
        // sign alice's subkeys
        passphrase1 = 'booyeah!'
        alice.sign({}, function(err) {
          if(err) console.log("sign failed")
          console.log(alice);
          // export demo; dump the private with a passphrase
          alice.export_pgp_private ({
            passphrase: passphrase1
          }, function(err, pgp_private) {
            if(err) console.log("export pgp private failed")
            console.log("private key: ", pgp_private);
            self.createPriKeyManager(pgp_private, passphrase1)
          });
          alice.export_pgp_public({}, function(err, pgp_public) {
            if(err) console.log("export pgp public failed")
            console.log("public key: ", pgp_public);
            self.createPubKeyManager(pgp_public)
          });
        });
      }else{
        console.log("keygen failed")
      }
    });
  },

  //gets keys based on load/gen preference
  getKeys(){
    if(generateNewKey){
      this.generateKeyPair()
    }else{
      this.loadPubKey()
      this.loadPriKey()
    }
  },

  //signs the message
  sign() {
    let editor = atom.workspace.getActiveTextEditor()
    if(editor) {
      str1 = editor.getText()
      str2 = str1.trim()
      str1 += "\n\n"

      if(!priKeyManagerIsLoaded) {
        //this.loadPriKeyManager()
        this.getKeys()
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
          //this.loadPubKeyManager()
          this.getKeys()
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
