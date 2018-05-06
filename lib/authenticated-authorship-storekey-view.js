'use babel';

export default class AuthenticatedAuthorshipStoreKeyView {

  //Constructs the modal.
  constructor(){
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('authenticated-authorship');

    //declare html of form
    var html = `
    <h1 style="text-align:center;color:white;">Store Authenticated Authorship Private Key to File</h1>
    <label for="aaPrivateKeyStore" style="color:white;font-size:1.2em;padding-top:5px;">Private Key:</label><br>
    <textarea id="aaPrivateKeyStore" class="native-key-bindings" style="width:100%;color:black;" rows="10"></textarea><br><br>
    <label for="aaPasswordStore" style="color:white;font-size:1.2em;padding-top:5px;">Password:</label><br>
    <input type="password" id="aaPasswordStore" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br>
    <label for="aaPasswordStoreRepeat" style="color:white;font-size:1.2em;padding-top:5px;">Repeat Password:</label><br>
    <input type="password" id="aaPasswordStoreRepeat" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br><br>
    <button id="aaStoreToFileButton" style="color:black;font-size:1.2em;">Store to File</button>
    <button id="aaCancelStoreButton" style="color:black;font-size:1.2em;">Cancel</button>
    `;
    this.element.innerHTML = html;
  }

  //Tear down any state and detach.
  destroy() {
    this.element.remove();
  }

  //Returns this element.
  getElement() {
    return this.element;
  }

  //Returns the login button.
  getStoreToFileButton(){
    return document.getElementById('aaStoreToFileButton');
  }

  //Returns the cancel button.
  getCancelStoreButton(){
    return document.getElementById('aaCancelStoreButton');
  }

  //Returns the password.
  getPasswordStore(){
    return this.getPasswordStoreElement().value;
    //return this.getPasswordElement().getText();
  }

  //Returns the password input element.
  getPasswordStoreElement(){
    return document.getElementById('aaPasswordStore');
  }

  //Returns the password.
  getPasswordStoreRepeat(){
    return this.getPasswordStoreRepeatElement().value;
    //return this.getPasswordElement().getText();
  }

  //Returns the password input element.
  getPasswordStoreRepeatElement(){
    return document.getElementById('aaPasswordStoreRepeat');
  }

  //Returns the private key.
  getPrivateKeyStore(){
    return this.getPrivateKeyStoreElement().value;
    //return this.getPasswordElement().getText();
    //return this.getPasswordElement().innerHTML;
  }

  //Returns the private key input element.
  getPrivateKeyStoreElement(){
    return document.getElementById('aaPrivateKeyStore');
  }

  //Restores the values of the form to the defaults.
  clearInput(){

    this.getPasswordStoreElement().value = "";
    this.getPasswordStoreRepeatElement().value = "";
    this.getPrivateKeyStoreElement().value = "";
    //this.getPrivateKeyElement().innerHTML = "";

    /*
    this.getUsernameElement().setText(defaultUsername);
    this.getPasswordElement().setText("");
    this.getPrivateKeyElement().setText("");
    */
  }

  // //Sets the default username to autofill later.
  // setDefaultUsername(username){
  //   defaultUsername = username;
  //   this.getUsernameElement().value = defaultUsername;
  //   //this.getUsernameElement().setText(defaultUsername);
  // }

  //On open, focuses on the appropriate input element.
  // open(){
  //   if(defaultUsername){
  //     this.getPasswordElement().focus();
  //   }else{
  //     this.getUsernameElement().focus();
  //   }
  // }
  open(){
    this.getPrivateKeyStoreElement().focus();
  }
}
