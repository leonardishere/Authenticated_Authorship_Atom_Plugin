'use babel';
import { CompositeDisposable } from 'atom';
import AuthenticatedAuthorshipView from './authenticated-authorship-view';
import AuthenticatedAuthorshipView2 from './authenticated-authorship-view2';
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
  //msgpack: require('msgpack'),
  msgpack: require('msgpack-lite'),
  mpack: require('mpack-js'),
  //typedArrays: require('crypto-js/lib-typedarrays.js'),
  base642: require('base64-js'),

  //some vars
  config: packageConfig,
  modalView: null,
  modalPanel: null,
  modalView2: null,
  modalPanel2: null,
  subscriptions: null,

  //Activates the module.
  activate(){
    var self = this;

    //modal 1 setup
    this.modalView = new AuthenticatedAuthorshipView();
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.modalView.getElement(),
      visible: false
    });
    //configure modal 1 element listeners
    var loginHandler = this.handleLoginWrapper(self);
    var cancelHandler = this.handleCancelWrapper(self);
    this.modalView.getLoginButton().onclick = loginHandler;
    this.modalView.getCancelButton().onclick = cancelHandler;
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

    //modal 2 setup
    this.modalView2 = new AuthenticatedAuthorshipView2();
    this.modalPanel2 = atom.workspace.addModalPanel({
      item: this.modalView2.getElement(),
      visible: false
    });
    //configure modal 2 element listeners
    var loginHandler2 = this.handleLoginWrapper2(self);
    var cancelHandler2 = this.handleCancelWrapper2(self);
    this.modalView2.getLoginButton().onclick = loginHandler2;
    this.modalView2.getCancelButton().onclick = cancelHandler2;
    //restore tab and enter functionality to input elements
    this.modalView2.getUsernameElement().onkeydown = function(event){
      //console.log(event);
      if(event.key === "Tab"){
        if(event.shiftKey){
          self.modalView2.getPrivateKeyElement().focus();
        }else{
          self.modalView2.getPasswordElement().focus();
        }
      }else if(event.key === "Enter"){
        loginHandler2();
      }else if(event.key === "Escape"){
        cancelHandler2();
      }
    };
    this.modalView2.getPasswordElement().onkeydown = function(event){
      //console.log(event);
      if(event.key === "Tab"){
        if(event.shiftKey){
          self.modalView2.getUsernameElement().focus();
        }else{
          self.modalView2.getPrivateKeyElement().focus();
        }
      }else if(event.key === "Enter"){
        loginHandler2();
      }else if(event.key === "Escape"){
        cancelHandler2();
      }
    };
    this.modalView2.getPrivateKeyElement().onkeydown = function(event){
      //console.log(event);
      if(event.key === "Tab"){
        if(event.shiftKey){
          self.modalView2.getPasswordElement().focus();
        }else{
          self.modalView2.getUsernameElement().focus();
        }
      }else if(event.key === "Enter"){
        loginHandler2();
      }else if(event.key === "Escape"){
        cancelHandler2();
      }
    };
    /*
    this.modalView2.getPrivateKeyElement().oninput = function(event){
      console.log(event);
      console.log(self.modalView2.getPrivateKey());
      console.log(this.innerHTML);
      console.log(this.value);
    }
    */
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register commands
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'authenticated-authorship:authenticate': () => this.authenticate(),
      'authenticated-authorship:verify': () => this.verify(),
      'authenticated-authorship:hardware-authenticate': () => this.hardwareAuthenticate()
    }));

    // Register changes in settings
    this.subscriptions.add(atom.config.onDidChange(
      'authenticated-authorship.defaultUsername', (event) => {
        if(event.newValue){
          console.log("Thank you for configuring your system, " + event.newValue + "!");
        }else{
          console.log("Default user cleared.");
        }
        self.modalView.setDefaultUsername(event.newValue);
        self.modalView2.setDefaultUsername(event.newValue);
    }));
    if(atom.config.settings['authenticated-authorship'] && atom.config.settings['authenticated-authorship'].defaultUsername) {
      self.modalView.setDefaultUsername(atom.config.settings['authenticated-authorship'].defaultUsername);
      self.modalView2.setDefaultUsername(atom.config.settings['authenticated-authorship'].defaultUsername);
    }else{
      self.modalView.setDefaultUsername('');
      self.modalView2.setDefaultUsername('');
    }
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

  hardwareAuthenticate(){
    this.displayModal2();
  },

  displayModal2(){
    this.modalPanel2.show();
    this.modalView2.open();
  },

  hideModal2(){
    this.modalPanel2.hide();
  },

  exitModal2(){
    this.modalPanel2.hide();
    this.modalView2.clearInput();
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

      self.kbLogin.login(
        {'username': username, 'passphrase': password},
        (err, res)=>{
        if(err) console.log(err);
        else{
          console.log('res:', res);
          console.log('attempting to decypt private key bundle');

          //step 1: base64 decode
          var step1 = self.base64.parse(res.me.private_keys.primary.bundle);
          console.log('step1', step1);

          //step 2: messagepack decode
          var uint8a = self.int32a_to_uint8a(step1.words);
          var step2 = self.mpack.decode(uint8a);
          console.log('step2:', step2);

          //step 3: triplesec decrypt
          var data = Buffer.from(step2.body.priv.data);
          var key = Buffer.from(password);
          self.triplesec.decrypt(
            {'key': key, 'data': data},
            (err, result)=>{
            if(err){
              console.log('err:', err);
            }else{
              console.log('result:', result);
              //console.log('result', result.toString('utf8'));
              //console.log('result', result.toString('hex'));
              //console.log('result', result.toString('ascii'));

              self.createPriKeyManager(username, result, key);
              self.createPriKeyManager(username, key, result);
            }
          });
        }
      });
    }
  },

  handleLoginWrapper2(self){
    return function(){
      var username = self.modalView2.getUsername();
      var password = self.modalView2.getPassword();
      var privateKey = self.modalView2.getPrivateKey();

      /*
      console.log("username: ", username);
      console.log("password: ", password);
      console.log("private key: ", privateKey);
      console.log("username element: ", self.modalView2.getUsernameElement());
      console.log("password element: ", self.modalView2.getPasswordElement());
      console.log("private key element: ", self.modalView2.getPrivateKeyElement());
      */

      self.modalView2.clearInput();
      self.modalPanel2.hide();

      self.createPriKeyManager(username, privateKey, password);
    }
  },

  //Converts a word array to a byte array.
  int32a_to_uint8a(arr){
    var arr2 = new Uint8Array(arr.length*4);
    for(var i = 0; i < arr.length; ++i){
      for(var j = 0; j < 4; ++j){
        var num = arr[i] << (j*8);
        //reversing the endiness causes errors
        //var num = arr[i] << (24-(j*8));
        num = num >>> 24;
        arr2[i*4+j] = num;
      }
    }
    return arr2;
  },

  /*
  uint8a_to_WordArray(arr){
    var length = Math.ceil(arr.length * 1.0 / 4);
    //var arr2 = new Int32Array(length);
    console.log(this.typedArrays);
    var arr2 = new this.typedArrays.WordArray(length);
    for(var i = 0; i < length; ++i){
      arr2[i] = 0;
    }
    for(var i = 0; i < arr.length; ++i){
      arr2[i/4] += (arr[i] << (3-(i%4) * 8));
    }
    return arr2;
  },
  */

  //Creates the function that handles canceled logins.
  //It hurts me to do it this way, but I had to thanks to JavaScript closures.
  handleCancelWrapper(self){
    return function(){
      self.exitModal();
    }
  },

  handleCancelWrapper2(self){
    return function(){
      self.exitModal2();
    }
  },

  //Creates private key manager.
  createPriKeyManager(username, key, passphrase /*,cb*/){
    console.log("Creating key manager")
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
            console.log("Loaded private key with passphrase")
            success = true;
          }
        })
      }else{
        console.log("Loaded private key without passphrase")
        success = true;
      }

      if(success){
        console.log("Successfully created key manager");
        //this.priKeyManager = self;
        //this.priKeyManagerIsLoaded = true;
        //return self;
        //cb(self, false);

        self2.sign(username, self); //sure I guess?
      }else{
        //return null;
        //cb(null, "") //already handled above
      }
    })
  },

  //Signs the message.
  sign(username, priKeyManager) {
    var self = this;
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
      /*
      var header = "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n-----Begin Authenticated Authorship Message-----\n";
      var middler = "\nVersion: 1.0.0\nHash: " + hashedArticle + "\n";
      var footer = "-----End Authenticated Authorship Message-----\n";
      var signedArticle = header + article + middler + result_string + footer;
      */
      var signedArticle = "Use the Trust Project: Authenticated Authorship plugin for Google Chrome to view this signature and validate my identity!\n"
      + "-----Begin Authenticated Authorship Message-----\n"
      + trimmedArticle + "\n"
      + "\n"
      + "Author: " + username + "\n"
      //+ "Signature: " + result_string + "\n"
      + "Signature: " + self.base642.fromByteArray(result_string) + "\n"
      + "Hash: " + hashedArticle + "\n"
      + "Version: " + "1.0.0" + "\n"
      + "-----End Authenticated Authorship Message-----\n";
      editor.setText(signedArticle);
      atom.notifications.addSuccess("Signed Article!");
    })
  },

  //The authentication data flow ends here.

  //The verification data flow begins here.
  //The verification side is still built like its trying to verify the article against multiple authors. Once the authentication side is built, then this will need to be rebuilt.

  //Verifies the message.
  verify(){
    //get message
    let editor = atom.workspace.getActiveTextEditor();
    if(!editor) {
      atom.notifications.addError("Editor does not exist. try again");
      return;
    }

    var post = editor.getText();
    var trimmedPost = post.trim();
    var messageIndex = trimmedPost.indexOf("-----Begin Authenticated Authorship Message-----");
    if(messageIndex === -1){
      atom.notifications.addError("The text doesn't contain a valid signature. Try again.");
      return;
    }

    var startIndex = messageIndex + "-----Begin Authenticated Authorship Message-----".length;
    var endIndex = trimmedPost.lastIndexOf("-----End Authenticated Authorship Message-----");

    if(startIndex === -1 || endIndex === -1 || startIndex > endIndex){
      atom.notifications.addError("The text doesn't contain a valid Authenticated Authorship Message. Try again.");
      return;
    }

    var signedArticle = trimmedPost.substring(startIndex, endIndex).trim();

    var metaIndex = signedArticle.lastIndexOf("Author:");
    if(metaIndex === -1){
      atom.notifications.addError("The text is missing metadata. Try again.");
      return;
    }

    var article = signedArticle.substring(0, metaIndex).trim();

    var metaData = signedArticle.substring(metaIndex);
    var authorIndex = metaData.lastIndexOf("Author:");
    var signatureIndex = metaData.lastIndexOf("Signature:");
    var hashIndex = metaData.lastIndexOf("Hash:");
    var versionIndex = metaData.lastIndexOf("Version:");

    if(authorIndex === -1 || signatureIndex === -1 || hashIndex === -1 || versionIndex === -1){
      atom.notifications.addError("The text is missing metadata. Try again.");
      return;
    }
    //could add more intelligent parsing, but this will work
    if(authorIndex > signatureIndex || signatureIndex > hashIndex || hashIndex > versionIndex){
      atom.notifications.addError("The metadata has been altered. Try again.")
      return;
    }

    authorIndex += "Author: ".length;
    var author = metaData.substring(authorIndex, signatureIndex).trim();
    signatureIndex += "Signature: ".length;
    var signature = metaData.substring(signatureIndex, hashIndex).trim();
    hashIndex += "Hash: ".length;
    var hash = metaData.substring(hashIndex, versionIndex).trim();
    versionIndex += "Version: ".length;
    var version = metaData.substring(versionIndex).trim();

    if(!author || !signature || !hash || !version){
      atom.notifications.addError("The text is missing metadata. Try again.");
      return;
    }


    //this.verifyAgainstAuthor(authors[i], trimmedPost, hashedArticle, pgpMessage, counter);

    //now that metadata is retrieved, verify article against author

    console.log("username: ", author);
    console.log("signature: ", signature);
    console.log("hash: ", hash);
    console.log("version: ", version);


    var getAuthorInfoUrl =


    console.log("fall through to here. implementation is incomplete");
  },

  //verifies the article against the given author
  //TODO: this should be removed
  verifyAgainstAuthor(article, author, signature, hash, version){
    var hashedArticle = this.base64.stringify(this.sha256(article));

    this.createPubKeyManager(author.pubKey, (km) => {
      //decrypt
      this.kbpgp.unbox({keyfetch: km, armored: pgpMessage}, (err, literals) => {
        if(err){
          //console.log(err)
          atom.notifications.addError("Article could not be verified. Restart and try again.");
        } else if(!literals || literals.length === 0){
          atom.notifications.addError("Article could not be verified. Restart and try again.");
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
