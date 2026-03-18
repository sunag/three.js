import { Extension } from 'three/addons/inspector/Extension.js';

class MyExtension extends Extension {

	constructor() {

		super( 'My Extension' );

		const div = document.createElement( 'div' );
		div.textContent = 'Hello World';

		this.content.appendChild( div );

		// center the content
		this.content.style.display = 'grid';
		this.content.style.placeItems = 'center';

	}

}

export default MyExtension;
