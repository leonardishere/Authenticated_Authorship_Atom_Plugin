'use babel';
import { CompositeDisposable } from 'atom';
import AuthenticatedAuthorshipView from './authenticated-authorship-view';
import packageConfig from './config-schema.json';

/**
Define the Authenticated Authorship module.
*/
export default {
  //imports. importing inside the export because it keeps them more (but not completely) hidden
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
  //default empty values to be set later
  pubKeyLocation: "",
  priKeyLocation: "",
  passphase: "",

  //keymanagers
  //pubKeyManager: null,
  priKeyManager: null,
  //pubKeyManagerIsLoaded: false,
  priKeyManagerIsLoaded: false,
  generateNewKey: false, //as opposed to using old key

  //where to store known author data
  packagePath: "",
  authorRepositoryFilepath: "/data/authors.json",

  //Activates the module.
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
    this.subscriptions.add(atom.config.onDidChange(
      'authenticated-authorship.signWith', (event) => {
        this.changeAuthor(event.newValue);
      }
    ));

    //get package location
    this.packagePath = atom.configDirPath + "/packages/authenticated-authorship";
    //console.log(this.packagePath);

    //read settings
    this.changeAuthor(atom.config.settings['authenticated-authorship'].signWith);
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

  //Generates a new public/private key pair.
  //TODO: have this input user info from modal, generate keys, and upload to blockchain
  //or just have them sign up for keybase and input info into settings?
  generateKeyPair(){
    console.log("generating");
    //from keybase examples
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
      if (!err) {
        // sign alice's subkeys
        passphrase1 = 'booyeah!';
        alice.sign({}, function(err) {
          if(err) console.log("sign failed");
          console.log(alice);
          alice.export_pgp_private (
            {passphrase: passphrase1}, function(err, pgp_private) {
            if(err) console.log("export pgp private failed");
            //console.log("private key: ", pgp_private);
            self.createPriKeyManager(pgp_private, passphrase1);
          });
          //return alice;
        });
      }else{
        console.log("keygen failed");
      }
      //console.log("inside");
    });
    //console.log("outside")
  },

  //Gets keys based on load/gen preference.
  getKeys(){
    if(this.generateNewKey){
      this.generateKeyPair();
    }else{
      //this.loadPubKey();
      this.loadPriKey();
    }
  },

  //Signs the message.
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
      this.getKeys();
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
  },

  //Writes some dummy authors to file.
  writeAuthors(){
    /*
    fs.open(this.authorRepositoryFilepath, 'wx', (err, fd) => {
      if (err) {
        if (err.code === 'EEXIST') {
          console.error('myfile already exists');
          return;
        }

        throw err;
      }

      console.log(fd);
      //fd.write('[]');
      fs.writeFileSync()
      //writeMyData(fd);
    });
    */

    //write authors to authors.json
    var authorAndrew = {
      "id": 0,
      "name": "Andrew Leonard",
      "bio": "Andrew Leonard is a senior at Santa Clara University, pursuing a Bachelor of Science in Computer Science and Engineering. View me on LinkedIn:  https://www.linkedin.com/in/andrewjohnleonard/",
      "priKey": this.fs.readFileSync(this.packagePath + this.priKeyLocation).toString(),
      "pubKey": this.fs.readFileSync(this.packagePath + this.pubKeyLocation).toString()
    };
    var mikhailPubKeyLocation = this.packagePath + "/data//0xBE039871-sec.asc";
    var mikhailPriKeyLocation = this.packagePath + "/data//0xBE039871-pub.asc";
    var authorMikhail = {
      "id": 1,
      "name": "Mikahil Smelik",
      "bio": "Mikhail is just another dude",
      "priKey": this.fs.readFileSync(mikhailPriKeyLocation).toString(),
      "pubKey": this.fs.readFileSync(mikhailPubKeyLocation).toString()
    };
    var authors1 = [authorAndrew, authorMikhail];
    var authors2 = JSON.stringify(authors1);
    //this.fs.writeFileSync(path, '[{"name": "Andrew","pubKey": "12345"}, {"name": "Mikhail","pubKey": "54321"}]');
    var path = packagePath + this.authorRepositoryFilepath;
    this.fs.writeFileSync(path, authors2);
  },

  //Reads the known authors from file.
  readAuthors(){
    var path = this.packagePath + this.authorRepositoryFilepath;
    var authorsJson = this.fs.readFileSync(path);
    //console.log("authors: " + authorsJson);
    var authors3 = JSON.parse(authorsJson);
    //console.log(authors3);
    return authors3;
  },

  //Changes the signing author.
  changeAuthor(authorNum){
    if(authorNum === 0){
      console.log("Now signing with Andrew's main pgpkeygen key");
      console.log("This public key is stored in authors.json");
      this.pubKeyLocation = this.packagePath + "/data/0x432D2491-pub.asc";
      this.priKeyLocation = this.packagePath + "/data/0x432D2491-sec.asc";
      this.passphrase = "follow the yellow brick road";
    } else if(authorNum === 1){
      console.log("Now signing with Mikhail's pgpkeygen key");
      console.log("This public key is stored in authors.json");
      this.pubKeyLocation = this.packagePath + "/data/0xBE039871-pub.asc";
      this.priKeyLocation = this.packagePath + "/data/0xBE039871-sec.asc";
      this.passphrase = "12345";
    } else if(authorNum === 2){
      console.log("Now signing with Andrew's other pgpkeygen key");
      console.log("This public key is NOT stored in authors.json");
      this.pubKeyLocation = this.packagePath + "/data/0x2C6FF983-pub.asc";
      this.priKeyLocation = this.packagePath + "/data/0x2C6FF983-sec.asc";
      this.passphrase = "test test 123";
    } else {
      console.log("Now signing with Andrew's other other pgpkeygen key");
      console.log("This public key is NOT stored in authors.json");
      this.pubKeyLocation = this.packagePath + "/data/0x434A181E-pub.asc";
      this.priKeyLocation = this.packagePath + "/data/0x434A181E-sec.asc";
      this.passphrase = "test test 12345";
    }

    //this.loadPubKey();
    this.loadPriKey();
  }

};

//A CountUntil object will count it reaches the target number, at which point it calls the function.
function CountUntil(number, func){
  this.curr = 0;
  this.max = number;
  this.foo = func;

  this.inc = function(){
    ++this.curr;
    if(this.curr === this.max){
      this.foo();
    }
  }
}
