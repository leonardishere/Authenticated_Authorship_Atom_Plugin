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
  kbLogin: require("keybase-login"),

  //some vars
  config: packageConfig,
  modalView: null,
  modalPanel: null,
  subscriptions: null,

  //Activates the module.
  activate(){
    //modal setup
    this.modalView = new AuthenticatedAuthorshipView();
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.modalView.getElement(),
      visible: false
    });
    var self = this;
    //confingure modal element listeners
    //really, javascript closures? you're going to make me do this?
    //this.modalView.getLoginButton().onclick = self.handleLogin;
    //this.modalView.getCancelButton().onclick = self.exitModal;
    var loginHandler = this.handleLoginWrapper(self);
    var cancelHandler = this.handleCancelWrapper(self);
    this.modalView.getLoginButton().onclick = loginHandler; //this was the one giving closure problems
    this.modalView.getCancelButton().onclick = cancelHandler; //this one as well
    //restore tab and enter functionality to input elements
    this.modalView.getUsernameElement().onkeydown = function(event){
      if(event.key === "Tab"){
        self.modalView.getPasswordElement().focus();
      }else if(event.key === "Enter"){
        loginHandler(); //these were okay as is but I changed them for uniformity
      }else if(event.key === "Escape"){
        cancelHandler();
      }
    };
    this.modalView.getPasswordElement().onkeydown = function(event){
      if(event.key === "Tab"){
        self.modalView.getUsernameElement().focus();
      }else if(event.key === "Enter"){
        loginHandler();
      }else if(event.key === "Escape"){
        cancelHandler();
      }
    };

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:authenticate': () => this.authenticate(),
      'authenticated-authorship:verify': () => this.verify()
    }));

    // Register changes in settings
    this.subscriptions.add(atom.config.onDidChange(
      'authenticated-authorship.defaultUsername', (event) => {
        console.log("Thank you for configuring your system, " + event.newValue + "!");
        self.modalView.setDefaultUsername(event.newValue);
    }));
    self.modalView.setDefaultUsername(atom.config.settings['authenticated-authorship'].defaultUsername);
  },

  //Deactivates the module.
  deactivate() {
    this.subscriptions.dispose();
  },

  //The authentication data flow begins here.
  //Among all the logic that needs to be worked out, we also need to figure out how our stack is going to work. At the moment, the functions are split in a logical way, but each just calls the next. There should be a better way to do this.

  //Just a thin wrapper that displays the login modal.
  authenticate(){
    this.displayModal();
  },

  //Displays the modal.
  displayModal(){
    this.modalPanel.show();
    this.modalView.open();
  },

  //Hides the modal.
  hideModal(){
    this.modalPanel.hide();
  },

  //Hides the modal and clears the inputs.
  exitModal(){
    this.modalPanel.hide();
    this.modalView.clearInput();
  },

  //Creates the function that handles logins.
  //It hurts me to do it this way, but I had to thanks to JavaScript closures.
  handleLoginWrapper(self){
    return function(){
      var username = self.modalView.getUsername();
      var password = self.modalView.getPassword();
      var passwordDisplayable = '';
      for(var i = 0; i < password.length; ++i) passwordDisplayable += '*';
      console.log("username: " + username);
      console.log("password: " + passwordDisplayable);

      self.modalView.clearInput();
      self.modalPanel.hide();

      //self.login(username, password);
      console.log(self);
      console.log(self.kbLogin);
      self.kbLogin.login({
        'username': username,
        'passphrase': password
      }, (err, res)=>{
        if(err) console.log(err);
        else{
          console.log(res);
          //console.log(self.triplesec.decrypt);
          console.log('attempt to decrypt private key with triplesec');
          var privateKey = self.triplesec.decrypt({
            //'key': self.triplesec.WordArray.from_utf8(password),
            'key': new Buffer(password),
            //'data': self.triplesec.WordArray.from_utf8(res.me.private_keys.primary.bundle)
            'data': new Buffer(res.me.private_keys.primary.bundle)
            //'data': new Buffer(res.me.private_keys.primary)
          }, (arg)=>{
            console.log("called back with ", arg);
          })
          console.log("attempt to create private key manager");
          self.createPriKeyManager(res.me.private_keys.primary.bundle, password);
        }
      });
    }
  },

  //Creates the function that handles canceled logins.
  //It hurts me to do it this way, but I had to thanks to JavaScript closures.
  handleCancelWrapper(self){
    return function(){
      self.exitModal();
    }
  },

  //Login to keybase with the given username and password
  login(username, password){
    var getSaltUrl = "https://keybase.io/_/api/1.0/getsalt.json?email_or_username=" + username;
    var self = this;
    console.log(this.https);
    this.https.get(getSaltUrl, res => {
      res.setEncoding("utf8");
      var body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        var salt = JSON.parse(body);
        console.log("salt:", salt);

        if(salt.status.code !== 0){
          console.log("Error! " + salt.status.name);
          return;
        }

        console.log(this.triplesec);
        //console.log(this.triplesec.encrypt);
        //console.log(this.triplesec.decrypt);
        //console.log(this.triplesec.scrypt);

        //TODO: replace fields
        console.log(salt.salt);
        console.log(salt['salt']);
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
        var cb = function(_arg){
          console.log("called back with:", _arg);
        };
        var scryptArg = {
          //"key": new Buffer(password),
          //"key": new this.triplesec.Encryptor(new Buffer(password)),
          //"key": new this.triplesec.Decryptor(new Buffer(password)),
          "key": this.triplesec.WordArray.from_utf8(password),
          //"salt": salt.salt,
          "salt": this.triplesec.WordArray.from_utf8(salt.salt),
          "r": 8,
          "N": Math.pow(2, 15),
          "p": 1,
          "dkLen": 256
        };
        //this.triplesec.scrypt({password, salt.salt});
        var passphraseStream = this.triplesec.scrypt(scryptArg, cb);
        console.log(passphraseStream);

        //TODO: do something with the login blob to get the private key
        console.log("here's where this should be implemented"); console.log("https://keybase.io/docs/api/1.0/call/login");
        console.log("for now, this will just throw errors");
        var privateKey = "";
        self.createPriKeyManager(privateKey, password);
      });
    });
  },

  //Creates private key manager.
  createPriKeyManager(key, passphrase /*,cb*/){
    //console.log("Creating key manager")
    var success = false;
    var self2 = this; //uhhhhh
    this.kbpgp.KeyManager.import_from_armored_pgp({armored: key}, (err, self) => {
      if(err){
        console.log("Error creating private key manager");
        //cb(null, "Error creating private key manager.");
        return;
      }
      if(self.is_pgp_locked()){
        self.unlock_pgp({passphrase: passphrase}, (err) => {
          if(err){
            console.log("Error unlocking private key manager.");
            //cb(null, "Error unlocking private key manager.");
            return;
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
        console.log("Successfully created key manager");
        //this.priKeyManager = self;
        //this.priKeyManagerIsLoaded = true;
        //return self;
        //cb(self, false);
        self2.sign(self); //sure I guess?
      }else{
        //return null;
        //cb(null, "") //already handled above
      }
    })
  },

  //Signs the message.
  sign(priKeyManager) {
    let editor = atom.workspace.getActiveTextEditor();
    if(!editor) {
      atom.notifications.addError("Editor does not exist. Try again");
      return;
    }

    var article = editor.getText();
    var trimmedArticle = article.trim();
    article += "\n\n";
    var hashedArticle = this.base64.stringify(this.sha256(trimmedArticle));

    var params = {
      msg: hashedArticle,
      sign_with: priKeyManager
    };
    this.kbpgp.box(params, (err, result_string, result_buffer) => {
      if(err){
        //console.log(err)
        atom.notifications.addError("Article could not be signed. Restart and try again.");
        return;
      }
      var header = "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n-----Begin Authenticated Authorship Message-----\n";
      var middler = "\nVersion: 1.0.0\nHash: " + hashedArticle + "\n";
      var footer = "-----End Authenticated Authorship Message-----\n";
      var signedArticle = header + article + middler + result_string + footer;
      editor.setText(signedArticle);
      atom.notifications.addSuccess("Signed Article!");
    })
  },

  //The authentication data flow ends here.

  //The verification data flow begins here.
  //The verification side is still built like its trying to verify the article against multiple authors. Once the authentication side is built, then this will need to be rebuilt.

  //Verifies the message.
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
  }

  //The verification data flow ends here.
};
