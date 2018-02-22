'use babel';

export default class AuthenticatedAuthorshipView {

  defaultUsername: ""

  //Constructs the modal.
  constructor(){
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('authenticated-authorship');

    //declare html of form
    var html = `
    <h1 style="text-align:center;color:white;">Log into Authenticated Authorship</h1>
    <label for="aaUsername" style="color:white;font-size:1.2em;">Username:</label><br>
    <input type="text" id="aaUsername" class="native-key-bindings" style="width:100%;color:black;" placeholder="alice123"><br>
    <label for="aaPassword" style="color:white;font-size:1.2em;padding-top:5px;">Password:</label><br>
    <input type="password" id="aaPassword" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br><br>
    <button id="aaLoginButton" style="color:black;font-size:1.2em;">Login</button>
    <button id="aaCancelButton" style="color:black;font-size:1.2em;">Cancel</button>
    `;
    this.element.innerHTML = html;

    //the text editors without the password display
    //I dont think this will be needed
    var html2 = `
    <!--
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" id="usernameOrEmail"></atom-text-editor>
    -->
    <!--
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" type="password" id="password2"></atom-text-editor>
    -->
    `;
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
    return document.getElementById('aaLoginButton');
  }

  //Returns the cancel button.
  getCancelButton(){
    return document.getElementById('aaCancelButton');
  }

  //Returns the username.
  getUsername(){
    return this.getUsernameElement().value;
  }

  //Returns the username input element.
  getUsernameElement(){
    return document.getElementById('aaUsername');
  }

  //Returns the password.
  getPassword(){
    return this.getPasswordElement().value;
  }

  //Returns the password input element.
  getPasswordElement(){
    return document.getElementById('aaPassword');
  }

  //Restores the values of the form to the defaults.
  clearInput(){
    this.getUsernameElement().value = defaultUsername;
    this.getPasswordElement().value = "";
  }

  //Sets the default username to autofill later.
  setDefaultUsername(username){
    defaultUsername = username;
    this.getUsernameElement().value = defaultUsername;
  }

  //On open, focuses on the appropriate input element.
  open(){
    if(defaultUsername){
      this.getPasswordElement().focus();
    }else{
      this.getUsernameOrEmailElement().focus();
    }
  }
}
