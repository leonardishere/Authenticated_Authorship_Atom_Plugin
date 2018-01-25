'use babel';

export default class AuthenticatedAuthorshipView {

  button: null

  //constructor(serializedState) {
  constructor(){
    // Create root element

    this.element = document.createElement('div');
    this.element.classList.add('authenticated-authorship');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'The AuthenticatedAuthorship package is Alive! It\'s ALIVE!';
    message.classList.add('message');

    //create button
    //const button = message.createElement('button')
    button = document.createElement('button');
    button.textContent = 'Cool I guess';
    button.classList.add('ok-button');
    button.id = 'ok-button';

    //apparently this works, or the other works, but not at the same time
    //use the other one because it allows for more control
    /*
    button.onclick = function () {
      console.log("clicked");
    };
    */

    this.element.appendChild(message);
    this.element.appendChild(button);
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  getButton(){
    return button;
  }
}
