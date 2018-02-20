'use babel';

export default class AuthenticatedAuthorshipView {

  //button: null

  //constructor(serializedState) {
  constructor(){
    // Create root element

    this.element = document.createElement('div');
    this.element.classList.add('authenticated-authorship');
    //this.element.innerHTML = '<p>Holy crap it worked</p>';

    var html = `
      <h1 style="text-align:center">Log into Authenticated Authorship</h1>

        <label for="usernameOrEmail">Username or Email:</label><br>
        <input type="text" id="usernameOrEmail" style="width:100%"><br><br>
        <label for="password">Password:</label><br>
        <input type="password" id="password" style="width:100%;color:black;"><br><br>
        <input type="submit" value="Submit" id="submitButton">

    `;
    //this.element.innerHTML = html;
    var html2 = `
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar">
      <div style="position: relative; contain: strict; overflow: hidden; background-color: inherit; height: 27px; width: 100%;">
        <div class="scroll-view" style="position: absolute; contain: strict; overflow: hidden; top: 0px; bottom: 0px; background-color: inherit; left: 0px; width: 573px;">
          <div style="contain: strict; overflow: hidden; background-color: inherit; width: 926px; height: 27px; will-change: transform; transform: translate(-353px, 0px);">
            <div class="highlights" style="contain: strict; position: absolute; overflow: hidden; height: 27px; width: 926px;">
            </div>
            <div class="lines" style="position: absolute; contain: strict; overflow: hidden; width: 926px; height: 27px;">
              <div style="contain: layout style; position: absolute; height: 27px; width: 926px; transform: translateY(0px);">
                <div class="line" data-screen-row="0">
                  <span class="">
                    <span class="syntax--text syntax--plain syntax--null-grammar">
                      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                    </span>
                  </span>
                </div>
              </div>
              <div class="cursors" style="position: absolute; contain: strict; z-index: 1; width: 926px; height: 27px; pointer-events: none;">
                <input class="hidden-input" tabindex="-1" style="position: absolute; width: 1px; height: 27px; top: 0px; left: 918px; opacity: 0; padding: 0px; border: 0px;">
                <div class="cursor" style="height: 27px; width: 7.57813px; transform: translate(918px, 0px);"></div>
              </div>
            </div>
            <div style="contain: strict; position: absolute; visibility: hidden; width: 926px;"></div>
            <div class="line dummy" style="position: absolute; visibility: hidden;">
            <span>x</span><span>我</span><span>ﾊ</span><span>세</span>
          </div>
        </div>
      </div>
    </div>
  </atom-text-editor>`;
  //this.element.innerHTML = html2;

    var html3 = `
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" id="modalEditor"></atom-text-editor>
    <button id="submitButton">Click me</button>
    `;
    //this.element.innerHTML = html3;

    var html4 = `
    <h1 style="text-align:center;color:white;">Log into Authenticated Authorship</h1>

    <label for="usernameOrEmail" style="color:white;font-size:1.2em;">Username or Email:</label><br>
    <!--
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" id="usernameOrEmail"></atom-text-editor>
    -->
    <input type="text" id="usernameOrEmail" class="native-key-bindings" style="width:100%;color:black;" placeholder="name@domain.com"><br>
    <label for="password" style="color:white;font-size:1.2em;padding-top:5px;">Password:</label><br>
    <!--
    <atom-text-editor tabindex="-1" class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" type="password" id="password2"></atom-text-editor>
    -->
    <input type="password" id="password" class="native-key-bindings" style="width:100%;color:black;" placeholder="********"/><br><br>
    <button id="submitButton" style="color:black;font-size:1.2em;">Login</button>
    `;
    this.element.innerHTML = html4;

    //document.querySelector('div.lines')[0].addClass('password-lines');

    /*
    var field = document.createElement('atom-text-editor');
    field.id = "modalEditor";
    this.element.appendChild(field);
    button = document.createElement('button');
    button.id = "submitButton";
    button.innerHTML = "Click";
    this.element.appendChild(button);
    */

    /*
    var field = document.createElement('input');
    field.type = "text";
    this.element.appendChild(field);
    */

    /*
    // Create message element
    var message = document.createElement('div');
    message.textContent = 'The AuthenticatedAuthorship package is Alive! It\'s ALIVE!';
    message.classList.add('message');
    this.element.appendChild(message);

    //create textbox
    var usernameField = document.createElement('input');
    usernameField.type = "text";
    console.log(usernameField);
    this.element.appendChild(usernameField);

    //create break
    var lineBreak = document.createElement('br');
    this.element.appendChild(lineBreak);

    //create button
    //const button = message.createElement('button')
    button = document.createElement('button');
    button.textContent = 'Cool I guess';
    button.classList.add('ok-button');
    button.id = 'ok-button';
    this.element.appendChild(button);
    */
    //button = document.createElement('button');

    //apparently this works, or the other works, but not at the same time
    //use the other one because it allows for more control
    /*
    button.onclick = function () {
      console.log("clicked");
    };
    */

  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  getButton(){
    return document.getElementById('submitButton');
  }

  getUsernameOrEmail(){
    //return document.querySelector('#usernameOrEmail span span').innerHTML;
    return document.getElementById('usernameOrEmail').value;
  }

  getUsernameOrEmailElement(){
    return document.getElementById('usernameOrEmail');
  }

  getPassword(){
    //return document.querySelector("#password span span").innerHTML;
    return document.getElementById('password').value;
  }

  getPasswordElement(){
    return document.getElementById('password');
  }

  clearInput(){
    document.getElementById('usernameOrEmail').value = "";
    document.getElementById('password').value = "";
  }

  print(val){
    console.log(val);
  }
}
