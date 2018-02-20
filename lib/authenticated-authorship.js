'use babel';
import { CompositeDisposable } from 'atom';
import AuthenticatedAuthorshipView from './authenticated-authorship-view';
import packageConfig from './config-schema.json';

/**
Define the Authenticated Authorship module.
*/
export default {
  //npm imports. importing inside the export because it keeps them more (but not completely) hidden
  kbpgp: require('kbpgp'),
  fs: require('fs'),
  sha256: require("crypto-js/sha256"),
  base64: require("crypto-js/enc-base64"),
  https: require("https"),
  triplesec: require('triplesec'),

  //some vars
  config: packageConfig,
  modalView: null,
  modalPanel: null,
  subscriptions: null,
  button: null,

  //vars pertaining to keys
  //default empty values to be set later
  pubKeyLocation: "",
  priKeyLocation: "",
  passphase: "",

  //keymanagers
  //pubKeyManager: null,
  priKeyManager: null,
  //pubKeyManagerIsLoaded: false,
  priKeyManagerIsLoaded: false,

  //the location of the package. almost certain it isnt needed
  packagePath: "",

  //Activates the module.
  activate(){
    //modal setup
    this.modalView = new AuthenticatedAuthorshipView();
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.modalView.getElement(),
      visible: false
    });
    this.button = this.modalView.getButton();
    var self = this;
    var handleLogin = function () {
      console.log("clicked");
      var usernameOrEmail = self.modalView.getUsernameOrEmail();
      var password = self.modalView.getPassword();
      var passwordDisplayable = '';
      for(var i = 0; i < password.length; ++i) passwordDisplayable += '*';
      console.log("username or email: " + usernameOrEmail);
      console.log("password: " + passwordDisplayable);
      //console.log(document.getElementById('password2').value);
      //document.getElementById('password2').value = "";
      self.modalView.clearInput();
      self.modalPanel.hide();
    };
    this.button.onclick = handleLogin;
    this.modalView.getUsernameOrEmailElement().onkeydown = function(event){
      if(event.key === "Tab"){
        /*
        if(event.shiftKey){
          self.button.focus();
        }else{
          self.modalView.getPasswordElement().focus();
        }
        */
        self.modalView.getPasswordElement().focus();
      }else if(event.key === "Enter"){
        //self.button.onKeyDown();
        handleLogin();
      }
    };

    this.modalView.getPasswordElement().onkeydown = function(event){
      //console.log(event);
      if(event.key === "Tab"){
        /*
        if(event.shiftKey){
          self.modalView.getUsernameOrEmailElement().focus();
        }else{
          self.button.focus();
        }
        */
        self.modalView.getUsernameOrEmailElement().focus();
      }else if(event.key === "Enter"){
        //self.button.onKeyDown();
        handleLogin();
      }
    };
    this.button.onKeyDown = function(event){
      if(event){
        console.log(event);
        if(event.key === "Tab"){
          if(event.shiftKey){
          self.modalView.getPasswordElement().focus();
          }else{
            self.modalView.getUsernameOrEmailElement().focus();
          }
        }
      }
    };
    /*
    console.log(document.querySelector("#password2"));
    this.modalPanel.onDidChangeVisible(function(visible) {
      console.log("new visibility: " + visible);
      console.log(document.querySelector("#password2 span"));
      var innerspan = document.querySelector("#password2 span");
      if(innerspan){
        innerspan.style.visibility = "hidden";
      }
    });
    document.querySelector("#password2 span").onkeydown = function(event){
      document.querySelector("#password2 span").style.visibility = "hidden";
    };
    //document.querySelector("#password2 span span").visibility = false;
    */

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:sign': () => this.sign(),
      'authenticated-authorship:verify': () => this.verify(),
      //'authenticated-authorship:generate': () => this.generateKeyPair(), //remove this later
      'authenticated-authorship:generate': () => this.login(), //remove this later
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
    this.subscriptions.add(atom.config.onDidChange(
      'authenticated-authorship.signWith', (event) => {
        //this.changeAuthor(event.newValue);
      }
    ));

    //get package location
    this.packagePath = atom.configDirPath + "/packages/authenticated-authorship";
    //console.log(this.packagePath);

    //read settings
    //this.changeAuthor(atom.config.settings['authenticated-authorship'].signWith);
    //console.log(this.config); //this doesnt do us anything because it doesnt hold the values
  },

  //Deactivates the module.
  deactivate() {
    this.subscriptions.dispose();
  },

  //Loads the public key from file then generates public key manager.
  /*
  loadPubKey() {
    //console.log("Fetching public key")
    var pubKey = this.fs.readFileSync(this.pubKeyLocation);
    this.createPubKeyManager(pubKey);
  },
  */

  //Creates public key manager.
  createPubKeyManager(key, callback){
    //this.pubKeyManager = null
    //this.pubKeyManagerIsLoaded = false

    //console.log("Creating key manager")
    var km = null;
    this.kbpgp.KeyManager.import_from_armored_pgp({armored: key}, (err, self) => {
      //console.log("inside");
      if(err){
        console.log("Error creating key manager");
        //km = null;
      }else{
        //km = self;
        callback(self);
      }
    });
    //console.log("outside");
    //console.log(km);
    /*
    if(!km) console.log("createPubKeyManager(): km == null");
    while(!km){
      //lets see if busy waiting solves this problem
      for(var i = 0; i < 100; ++i){}
    }
    return km;
    */
  },

  //Loads the private key from file then generates private key manager.
  loadPriKey() {
    //console.log("Fetching private key")
    var priKey = this.fs.readFileSync(this.priKeyLocation);
    this.createPriKeyManager(priKey, this.passphrase);
  },

  //Creates private key manager.
  createPriKeyManager(key, passphrase){
    //this.priKeyManager = null;
    //this.priKeyManagerIsLoaded = false;

    //console.log("Creating key manager")
    var success = false;
    this.kbpgp.KeyManager.import_from_armored_pgp({armored: key}, (err, self) => {
      if(err){
        console.log("Error creating private key manager");
        return;
      }
      if(self.is_pgp_locked()){
        self.unlock_pgp({passphrase: passphrase}, (err) => {
          if(err){
            console.log("Error unlocking private key manager.");
          }else{
            //console.log("Loaded private key with passphrase")
            success = true;
          }
        })
      }else{
        //console.log("Loaded private key without passphrase")
        success = true;
      }

      if(success){
        this.priKeyManager = self;
        this.priKeyManagerIsLoaded = true;
        //return self;
      }else{
        //return null;
      }
    })
  },

  //Signs the message.
  //TODO: this needs to be changed
  sign() {
    let editor = atom.workspace.getActiveTextEditor();
    if(!editor) {
      atom.notifications.addError("Editor does not exist. try again");
      return;
    }

    var article = editor.getText();
    var trimmedArticle = article.trim();
    article += "\n\n";
    var hashedArticle = this.base64.stringify(this.sha256(trimmedArticle));

    if(!this.priKeyManagerIsLoaded) {
      this.loadPriKey();
      if(!this.priKeyManagerIsLoaded){
        atom.notifications.addError("Could not construct a private key manager. Try again.");
        return;
      }
    }
    var params = {
      msg: hashedArticle,
      sign_with: this.priKeyManager
    };
    this.kbpgp.box(params, (err, result_string, result_buffer) => {
      if(err){
        //console.log(err)
        atom.notifications.addError("Article could not be signed. Restart and try again.");
        return;
      }
      var signedArticle = article + "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n" + result_string + "\n";
      editor.setText(signedArticle);
      atom.notifications.addSuccess("Signed Article!");
    })
  },

  //Verifies the message versus all known authors (Andrew and Mikhail).
  //TODO: this needs to be changed
  verify(){
    var authors = this.readAuthors();

    //get message
    let editor = atom.workspace.getActiveTextEditor();
    if(!editor) {
      atom.notifications.addError("Editor does not exist. try again");
      return;
    }

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
      return;
    }

    endIndex += "-----END PGP MESSAGE-----".length;
    var pgpMessage = trimmedPost.substring(startIndex, endIndex);

    var found = false;
    //count the number of authors that dont verify
    var counter = new CountUntil(authors.length, function(){
      atom.notifications.addError("The article could not be verified by any authors. Try again.");
    })
    for(var i = 0; i < authors.length && !found; ++i){
      //var worked = this.verifyAgainstAuthor(trimmedPost, hashedArticle, pgpMessage, authors[i]);
      //if(worked) found = true;
      this.verifyAgainstAuthor(authors[i], trimmedPost, hashedArticle, pgpMessage, counter);
    }

    if(!found){
      //console.log("article could not be verified by any author");
      //atom.notifications.addError("The article could not be verified by any author. Try again.");
    }
  },

  //verifies the article against the given author
  //TODO: this should be removed
  verifyAgainstAuthor(author, trimmedPost, hashedArticle, pgpMessage, counter){
    console.log("attempting to verify article against author: " + author.name);
    //var km = this.createPubKeyManager(author.pubKey);
    //console.log(km);
    this.createPubKeyManager(author.pubKey, (km) => {
      //decrypt
      this.kbpgp.unbox({keyfetch: km, armored: pgpMessage}, (err, literals) => {
        if(err){
          //console.log(err)
          //atom.notifications.addError("Article could not be verified. Restart and try again.");
          console.log("Article could not be verified by author " + author.name);
          counter.inc();
        } else if(!literals || literals.length === 0){
          //atom.notifications.addError("Article could not be verified. Restart and try again.");
          console.log("Article could not be verified by author " + author.name);
          counter.inc();
        }else{
          found = true;
          var originalHashedArticle = literals[0].toString();
          if(originalHashedArticle !== hashedArticle){
            //console.log("Signature created by " + author.name + " but article was edited.");
            atom.notifications.addError("Signature created by " + author.name + " but article was edited.");
            trimmedPost += "\n\nError! Original hash and published hash do not match.\n";
            trimmedPost += "Original hash:\n";
            trimmedPost += originalHashedArticle + "\n";
            trimmedPost += "Published hash:\n";
            trimmedPost += hashedArticle + "\n";
            atom.notifications.addError("Messages do not match");
          }else{
            console.log("Article was signed by " + author.name);
            //trimmedArticle += "\nDecrypted message:\n";
            //trimmedArticle += literals[0].toString();
            var km2 = null; //key manager. do we need a km and km2?
            var ds = literals[0].get_data_signer(); //data signer
            if(ds) {
              //console.log(ds)
              km2 = ds.get_key_manager();
            }
            if(km2) {
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

          let editor = atom.workspace.getActiveTextEditor();
          if(editor) {
            editor.setText(trimmedPost);
          }else{
            atom.notifications("Editor could not be read. Try again.");
          }
        }
      });
    });
  },

  //Toggles the modal.
  modalToggle(){
    if(this.modalPanel.isVisible()){
      this.modalPanel.hide();
      this.modalView.clearInput();
    }else{
      this.modalPanel.show();
      this.modalView.getUsernameOrEmailElement().focus();
    }
  },

  login(){
    console.log("hostile takeover of generate() calls login()");
    var email_or_username = "msmelik"; //TODO: not hardcode this
    var getSaltUrl = "https://keybase.io/_/api/1.0/getsalt.json?email_or_username=" + email_or_username;
    this.https.get(getSaltUrl, res => {
      res.setEncoding("utf8");
      var body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        var salt = JSON.parse(body);
        console.log(salt);

        if(salt.status.code !== 0){
          console.log("Error! " + salt.status.name);
          return;
        }

        console.log(this.triplesec);
        console.log(this.triplesec.encrypt);
        console.log(this.triplesec.decrypt);

        //TODO: replace fields
        var loginBlob = {
          "body": {
            "auth": {
              "nonce": "ab68b24b6bcff3dc6e0cdc558e3e043c",
              "session": salt.login_session
            },
            "key": {
              "host": "keybase.io",
              "kid": "0120fffa77faf7c189edbb82a942c5feef831335ced44e2fd3155673b023314719070a",
              "username": "u5c7d0817"
            },
            "type": "auth",
            "version": 1
          },
          "ctime": 1476733025,
          "expire_in": 157680000,
          "tag": "signature"
        };

      });
    });
  }

};
