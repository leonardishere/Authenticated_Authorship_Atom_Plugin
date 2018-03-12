'use babel';

export default class AuthenticatedAuthorshipView2 {

  defaultUsername: ""

  //Constructs the modal.
  constructor(){
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('authenticated-authorship');

    //declare html of form
    var html = `
    <h1 style="text-align:center;color:white;">Log into Authenticated Authorship</h1>
    <label for="aaUsername2" style="color:white;font-size:1.2em;">Username:</label><br>
    <input type="text" id="aaUsername2" class="native-key-bindings" style="width:100%;color:black;" placeholder="alice123"><br>
    <label for="aaPassword2" style="color:white;font-size:1.2em;padding-top:5px;">Password:</label><br>
    <input type="password" id="aaPassword2" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br>
    <label for="aaPrivateKey2" style="color:white;font-size:1.2em;padding-top:5px;">Password:</label><br>
    <textarea id="aaPrivateKey2" class="native-key-bindings" style="width:100%;color:black;" rows="10"></textarea><br><br>
    <button id="aaLoginButton2" style="color:black;font-size:1.2em;">Login</button>
    <button id="aaCancelButton2" style="color:black;font-size:1.2em;">Cancel</button>
    `;
    this.element.innerHTML = html;

    //the text editors without the password display
    //I dont think this will be needed
    var html2 = `
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" id="aaUsername2"></atom-text-editor>
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" id="aaPassword2"></atom-text-editor>
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" id="aaPrivateKey2"></atom-text-editor>
    <button id="aaLoginButton2" style="color:black;font-size:1.2em;">Login</button>
    <button id="aaCancelButton2" style="color:black;font-size:1.2em;">Cancel</button>
    `;
    //this.element.innerHTML = html2;
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
  getLoginButton(){
    return document.getElementById('aaLoginButton2');
  }

  //Returns the cancel button.
  getCancelButton(){
    return document.getElementById('aaCancelButton2');
  }

  //Returns the username.
  getUsername(){
    return this.getUsernameElement().value;
    //return this.getUsernameElement().getText();
  }

  //Returns the username input element.
  getUsernameElement(){
    return document.getElementById('aaUsername2');
  }

  //Returns the password.
  getPassword(){
    return this.getPasswordElement().value;
    //return this.getPasswordElement().getText();
  }

  //Returns the password input element.
  getPasswordElement(){
    return document.getElementById('aaPassword2');
  }

  //Returns the private key.
  getPrivateKey(){
    return this.getPrivateKeyElement().value;
    //return this.getPasswordElement().getText();
    //return this.getPasswordElement().innerHTML;
  }

  //Returns the private key input element.
  getPrivateKeyElement(){
    return document.getElementById('aaPrivateKey2');
  }

  //Restores the values of the form to the defaults.
  clearInput(){

    this.getUsernameElement().value = defaultUsername;
    this.getPasswordElement().value = "";
    //this.getPrivateKeyElement().value = "";
    this.getPrivateKeyElement().innerHTML = "";

    /*
    this.getUsernameElement().setText(defaultUsername);
    this.getPasswordElement().setText("");
    this.getPrivateKeyElement().setText("");
    */
  }

  //Sets the default username to autofill later.
  setDefaultUsername(username){
    defaultUsername = username;
    this.getUsernameElement().value = defaultUsername;
    //this.getUsernameElement().setText(defaultUsername);
  }

  //On open, focuses on the appropriate input element.
  open(){
    if(defaultUsername){
      this.getPasswordElement().focus();
    }else{
      this.getUsernameElement().focus();
    }
  }
}
