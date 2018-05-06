'use babel';

export default class AuthenticatedAuthorshipView3 {

  defaultUsername: ""

  //Constructs the modal.
  constructor(){
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('authenticated-authorship');

    //declare html of form
    var html = `
    <h1 style="text-align:center;color:white;">Log into Authenticated Authorship</h1>
    <label for="aaUsername3" style="color:white;font-size:1.2em;">Username:</label><br>
    <input type="text" id="aaUsername3" class="native-key-bindings" style="width:100%;color:black;" placeholder="alice123"><br>
    <label for="aaPassword3" style="color:white;font-size:1.2em;padding-top:5px;">Keybase Password:</label><br>
    <input type="password" id="aaPassword3" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br>
    <label for="aaPrivateKey3" style="color:white;font-size:1.2em;padding-top:5px;">Private Key Location:</label><br>
    <input type="file" accept=".aak" id="aaPrivateKey3" class="native-key-bindings" style="width:100%;color:white;font-size:1.2em"></input><br>
    <label for="aaPasswordPrivate3" style="color:white;font-size:1.2em;padding-top:5px;">Private Key Password:</label><br>
    <input type="password" id="aaPasswordPrivate3" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br><br>
    <!--<button id="aaLoginButton3" style="color:black;font-size:1.2em;">Login</button>-->
    <button id="aaSignToTextButton3" style="color:black;font-size:1.2em;">Sign to Text</button>
    <button id="aaSignToHtmlButton3" style="color:black;font-size:1.2em;">Sign to Html</button>
    <button id="aaCancelButton3" style="color:black;font-size:1.2em;">Cancel</button>
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
  getSignToTextButton(){
    return document.getElementById('aaSignToTextButton3');
  }

  //Returns the login button.
  getSignToHtmlButton(){
    return document.getElementById('aaSignToHtmlButton3');
  }

  //Returns the cancel button.
  getCancelButton(){
    return document.getElementById('aaCancelButton3');
  }

  //Returns the username.
  getUsername(){
    return this.getUsernameElement().value;
    //return this.getUsernameElement().getText();
  }

  //Returns the username input element.
  getUsernameElement(){
    return document.getElementById('aaUsername3');
  }

  //Returns the password.
  getPassword(){
    return this.getPasswordElement().value;
    //return this.getPasswordElement().getText();
  }

  //Returns the password input element.
  getPasswordElement(){
    return document.getElementById('aaPassword3');
  }

  //Returns the private key.
  getPrivateKey(){
    // var = privateKeyValue;
    //
    //
    //
    // function getFile(event) {
	  //    const input = event.target
    //    if ('files' in input && input.files.length > 0) {
	  //       placeFileContent(
    //         privateKeyValue,
    //         input.files[0])
    //       }
    // }
    //
    // function placeFileContent(target, file) {
	  //    readFileContent(file).then(content => {
  	//       target.value = content
    //     }).catch(error => console.log(error))
    // }
    //
    // function readFileContent(file) {
	  //     const reader = new FileReader()
    //     return new Promise((resolve, reject) => {
    //       reader.onload = event => resolve(event.target.result)
    //       reader.onerror = error => reject(error)
    //       reader.readAsText(file)
    //     })
    // }
    //
    // getFile(this.getPrivateKeyElement());

    return this.getPrivateKeyElement().files[0];
    //return this.getPasswordElement().getText();
    //return this.getPasswordElement().innerHTML;
  }

  //Returns the private key input element.
  getPrivateKeyElement(){
    return document.getElementById('aaPrivateKey3');
  }

  //Returns the password.
  getPasswordPrivate(){
    return this.getPasswordPrivateElement().value;
  }

  //Returns the password input element.
  getPasswordPrivateElement(){
    return document.getElementById('aaPasswordPrivate3');
  }

  //Restores the values of the form to the defaults.
  clearInput(){
    this.getUsernameElement().value = defaultUsername;
    this.getPasswordElement().value = "";
    this.getPrivateKeyElement().value = "";
    this.getPasswordPrivateElement().value = "";
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
