'use babel';
import { CompositeDisposable } from 'atom';
import AuthenticatedAuthorshipView from './authenticated-authorship-view';
import packageConfig from './config-schema.json';

/**
Define the Authenticated Authorship module.
*/
export default {
  //imports
  kbpgp: require('kbpgp'),
  fs: require('fs'),
  sha256: require("crypto-js/sha256"),
  base64: require("crypto-js/enc-base64"),

  //some vars
  config: packageConfig,
  modalView: null,
  modalPanel: null,
  subscriptions: null,
  button: null,

  //vars pertaining to keys
  pubKeyLocation: "C:\\Users\\Andrew\\Downloads\\0x432D2491-pub.asc",
  priKeyLocation: "C:\\Users\\Andrew\\Downloads\\0x432D2491-sec.asc",
  passphrase: "follow the yellow brick road",
  pubKeyManager: null,
  priKeyManager: null,
  pubKeyManagerIsLoaded: false,
  priKeyManagerIsLoaded: false,
  generateNewKey: false, //as opposed to using old key

  /**
  Activates the module.
  */
  activate(){
    this.modalView = new AuthenticatedAuthorshipView();
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.modalView.getElement(),
      visible: false
    });
    this.button = this.modalView.getButton();
    this.button.onclick = function () {
      console.log("clicked");
    };

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:sign': () => this.sign(),
      'authenticated-authorship:verify': () => this.verify(),
      'authenticated-authorship:generate': () => this.generateKeyPair(), //remove this later
      'authenticated-authorship:modal': () => this.modalToggle() // and this
    }));

    // Register changes in settings
    this.subscriptions.add(atom.config.onDidChange(
      'authenticated-authorship.activateHyperMode', (event) => {
      if(event.newValue){
        console.log("WE'RE GOING INTO HYPER MODE AHHHHHHHHHHHHHHHH");
      }else{
        console.log("nope we're done with that");
      }
    }));
  },

  /**
  Deactivates the module.
  */
  deactivate() {
    this.subscriptions.dispose();
  },

  /**
  Loads the public key from file then generates public key manager.
  */
  loadPubKey() {
    //console.log("Fetching public key")
    var pubKey = this.fs.readFileSync(this.pubKeyLocation);
    this.createPubKeyManager(pubKey);
  },

  /**
  Creates public key manager.
  */
  createPubKeyManager(key){
    this.pubKeyManager = null
    this.pubKeyManagerIsLoaded = false

    //console.log("Creating key manager")
    this.kbpgp.KeyManager.import_from_armored_pgp({armored: key}, (err, self) => {
      if(err){
        //console.log("Error creating key manager")
      }else{
        //console.log("Successfully created key manager")
        this.pubKeyManager = self;
        this.pubKeyManagerIsLoaded = true;
      }
    });
  },

  /**
  Loads the private key from file then generates private key manager.
  */
  loadPriKey() {
    //console.log("Fetching private key")
    var priKey = this.fs.readFileSync(this.priKeyLocation);
    this.createPriKeyManager(priKey, this.passphrase);
  },

  /**
  Creates private key manager.
  */
  createPriKeyManager(key, passphrase){
    this.priKeyManager = null;
    this.priKeyManagerIsLoaded = false;

    //console.log("Creating key manager")
    var success = false;
    this.kbpgp.KeyManager.import_from_armored_pgp({armored: key}, (err, self) => {
      if(err){
        //console.log("Error creating key manager")
      }else{
        if(self.is_pgp_locked()){
          self.unlock_pgp({passphrase: passphrase}, (err) => {
            if(err){
              //console.log("Error unlocking with passphase")
            }else{
              //console.log("Loaded private key with passphrase")
              success = true;
            }
          })
        }else{
          //console.log("Loaded private key without passphrase")
          success = true;
        }
      }

      if(success){
        this.priKeyManager = self;
        this.priKeyManagerIsLoaded = true;
      }
    })
  },

  /**
  Generates a new public/private key pair.
  */
  generateKeyPair(){
    console.log("generating");
    //from keybase examples
    /*
    this.kbpgp.KeyManager.generate_rsa({ userid : "Bo Jackson <user@example.com>" }, function(err, charlie) {
      console.log(charlie)
      console.log(charlie.sign)
      charlie.sign({}, function(err) {
        console.log("done!")
      })
    })
    */

    /*
    var F = this.kbpgp["const"].openpgp;

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
    var F = this.kbpgp["const"].openpgp;

    var opts = {
      userid: "User McTester (Born 1979) <user@example.com>",
      primary: {
        nbits: 4096,
        flags: F.certify_keys | F.sign_data | F.auth | F.encrypt_comm | F.encrypt_storage,
        expire_in: 0  // never expire
      },
      subkeys: []
    };

    var self = this;
    this.kbpgp.KeyManager.generate(opts, function(err, alice) {
    //this.kbpgp.KeyManager.generate_rsa({ userid : "Alice (alice's comment) <alice@example.com>" }, function(err, alice) {
      if (!err) {
        // sign alice's subkeys
        passphrase1 = 'booyeah!';
        alice.sign({}, function(err) {
          if(err) console.log("sign failed");
          console.log(alice);
          // export demo; dump the private with a passphrase
          alice.export_pgp_private (
            {passphrase: passphrase1}, function(err, pgp_private) {
            if(err) console.log("export pgp private failed");
            console.log("private key: ", pgp_private);
            self.createPriKeyManager(pgp_private, passphrase1);
          });
          alice.export_pgp_public({}, function(err, pgp_public) {
            if(err) console.log("export pgp public failed");
            console.log("public key: ", pgp_public);
            self.createPubKeyManager(pgp_public);
          });
        });
      }else{
        console.log("keygen failed");
      }
    });
  },

  /**
  Gets keys based on load/gen preference.
  */
  getKeys(){
    if(this.generateNewKey){
      this.generateKeyPair();
    }else{
      this.loadPubKey();
      this.loadPriKey();
    }
  },

  /**
  Signs the message.
  */
  sign() {
    let editor = atom.workspace.getActiveTextEditor();
    if(editor) {
      var article = editor.getText();
      var trimmedArticle = article.trim();
      article += "\n\n";
      var hashedArticle = this.base64.stringify(this.sha256(trimmedArticle));

      if(!this.priKeyManagerIsLoaded) {
        //this.loadPriKeyManager()
        this.getKeys();
      }
      if(this.priKeyManagerIsLoaded){
        var params = {
          msg: hashedArticle,
          sign_with: this.priKeyManager
        };
        this.kbpgp.box(params, (err, result_string, result_buffer) => {
          if(err){
            //console.log(err)
            atom.notifications.addError("Article could not be signed. Restart and try again.");
          }else{
            article += "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n";
            article += result_string + "\n";
            editor.setText(article);
            atom.notifications.addSuccess("Signed Article!");
          }
        })
      }else{
        atom.notifications.addError("Article could not be signed. Restart and try again.");
      }
    }else{
      atom.notifications.addError("Text editor not read. Try again.");
    }
  },

  /**
  Verifies the message.
  */
  verify() {
    //get message
    let editor = atom.workspace.getActiveTextEditor();
    if(editor) {
      var post = editor.getText();
      var trimmedPost = post.trim();

      var messageIndex = trimmedPost.indexOf("Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!");
      if(messageIndex === -1){
        atom.notifications.addError("The text doesn't contain a valid signature. Try again.");
        return;
      }
      var trimmedArticle = trimmedPost.substring(0, messageIndex).trim();
      var hashedArticle = this.base64.stringify(this.sha256(trimmedArticle));

      var startIndex = trimmedPost.indexOf("-----BEGIN PGP MESSAGE-----");
      var endIndex = trimmedPost.indexOf("-----END PGP MESSAGE-----");
      if(startIndex === -1 || endIndex === -1 || startIndex > endIndex){
        atom.notifications.addError("The text doesn't contain a valid PGP message. Try again.");
      }else{
        endIndex += "-----END PGP MESSAGE-----".length;
        var pgpMessage = trimmedPost.substring(startIndex, endIndex);
        //totally forgot what this was supposed to do
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
        if(!this.pubKeyManagerIsLoaded) {
          //this.loadPubKeyManager()
          this.getKeys();
        }
        if(this.pubKeyManagerIsLoaded){
          //decrypt
          this.kbpgp.unbox(
            {keyfetch: this.pubKeyManager, armored: pgpMessage}, (err, literals) => {
            if(err){
              //console.log(err)
              atom.notifications.addError("Article could not be verified. Restart and try again.");
            }if(!literals || literals.length === 0){
              atom.notifications.addError("Article could not be verified. Restart and try again.");
            }else{
              var originalHashedArticle = literals[0].toString();
              if(originalHashedArticle !== hashedArticle){
                trimmedPost += "\n\nError! Original hash and published hash do not match.\n";
                trimmedPost += "Original hash:\n";
                trimmedPost += originalHashedArticle + "\n";
                trimmedPost += "Published hash:\n";
                trimmedPost += hashedArticle + "\n";
                atom.notifications.addError("Messages do not match");
              }else{
                //trimmedArticle += "\nDecrypted message:\n";
                //trimmedArticle += literals[0].toString();
                var km = null; //key manager
                var ds = literals[0].get_data_signer(); //data signer
                if(ds) {
                  //console.log(ds)
                  km = ds.get_key_manager();
                }
                if(km) {
                  //console.log(km)
                  trimmedPost += "\n\nsigned by pgp fingerprint:\n";
                  trimmedPost += km.get_pgp_fingerprint().toString('hex') + "\n";
                  var signer = km.engines[0].key_manager.userids[0].components;
                  trimmedPost += "Name:   " + signer.username + "\n";
                  trimmedPost += "Email:  " + signer.email + "\n";
                  if(signer.comment){
                    trimmedPost += "Comment: " + signer.comment + "\n";
                  }
                  trimmedPost += "Hash: " + hashedArticle + "\n";
                }
                atom.notifications.addSuccess("Verified Article!");
              }

              editor.setText(trimmedPost);
            }
          })
        }else{
          atom.notifications.addError("Public key could not be found. Restart and try again.");
        }
      }
    }else{
      atom.notifications.addError("Text editor not read. Try again.");
    }
  },

  /**
  Toggles the modal.
  */
  modalToggle(){
    this.modalPanel.isVisible() ? this.modalPanel.hide() : this.modalPanel.show();

    //some tests of the capabilities of modals
    //it looks like we won't be using them in the final product, but I'm leaving the tests here
    /*
    console.log(this.modalPanel);
    console.log(this.modalPanel.getItem());
    console.log(this.modalPanel.getItem().getElementsByClassName('ok-button')[0]);
    */
    /*
    this.modalPanel.getItem().getElementsByClassName('ok-button')[0].onclick = function () {
      console.log("clicked 2");
    };
    */

    //console.log(this.modalPanel.getItem().getElementById('ok-button'));
    //console.log(this.modalPanel.getElementById('ok-button'));
    //console.log(this.modalPanel.getElementsByName('ok-button'));
    //console.log(typeof this.modalPanel.getItem());
    //console.log(this.modalView.getElement());

    /*
    if(this.modalPanel.isVisible()){
      this.modalPanel.
    }
    */
    /*
    atom.confirm({
      message: 'How you feeling?',
      detailedMessage: 'Be honest.',
      buttons: {
        Good: function() {
          return window.alert('good to hear');
        },
        Bad: function() {
          return window.alert('bummer');
        }
      }
    });
    */
  }

};
