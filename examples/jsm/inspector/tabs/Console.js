import { Tab } from '../ui/Tab.js';
class Console extends Tab {

	constructor() {

		super( 'Console' );

		this.filters = { info: true, warn: true, error: true };
		this.filterText = '';

		this.buildHeader();

		this.logContainer = document.createElement( 'div' );
		this.logContainer.id = 'console-log';
		this.content.appendChild( this.logContainer );

	}

	buildHeader() {

		const header = document.createElement( 'div' );
		header.className = 'console-header';

		const filterInput = document.createElement( 'input' );
		filterInput.type = 'text';
		filterInput.className = 'console-filter-input';
		filterInput.placeholder = 'Filter...';
		filterInput.addEventListener( 'input', ( e ) => {

			this.filterText = e.target.value.toLowerCase();
			this.applyFilters();

		} );

		const filtersGroup = document.createElement( 'div' );
		filtersGroup.className = 'console-filters-group';

		Object.keys( this.filters ).forEach( type => {

			const label = document.createElement( 'label' );
			label.className = 'custom-checkbox';
			label.style.color = `var(--${type === 'info' ? 'text-primary' : 'color-' + ( type === 'warn' ? 'yellow' : 'red' )})`;

			const checkbox = document.createElement( 'input' );
			checkbox.type = 'checkbox';
			checkbox.checked = this.filters[ type ];
			checkbox.dataset.type = type;

			const checkmark = document.createElement( 'span' );
			checkmark.className = 'checkmark';

			label.appendChild( checkbox );
			label.appendChild( checkmark );
			label.append( type.charAt( 0 ).toUpperCase() + type.slice( 1 ) );
			filtersGroup.appendChild( label );

		} );

		filtersGroup.addEventListener( 'change', ( e ) => {

			const type = e.target.dataset.type;
			if ( type in this.filters ) {

				this.filters[ type ] = e.target.checked;
				this.applyFilters();

			}

		} );

		header.appendChild( filterInput );
		header.appendChild( filtersGroup );
		this.content.appendChild( header );

	}

	applyFilters() {

		const messages = this.logContainer.querySelectorAll( '.log-message' );
		messages.forEach( msg => {

			const type = msg.dataset.type;
			const text = msg.dataset.rawText.toLowerCase();

			const showByType = this.filters[ type ];
			const showByText = text.includes( this.filterText );

			msg.classList.toggle( 'hidden', ! ( showByType && showByText ) );

		} );

	}

	_getIcon( type, subType ) {

		let icon;

		if ( subType === 'tip' ) {

			icon = '💭';

		} else if ( subType === 'tsl' ) {

			icon = '✨';

		} else if ( type === 'warn' ) {

			icon = '⚠️';

		} else if ( type === 'error' ) {

			icon = '🔴';

		} else if ( type === 'info' ) {

			icon = 'ℹ️';

		}

		return icon;

	}

	_formatMessage( type, text ) {

		const fragment = document.createDocumentFragment();
		const prefixMatch = text.match( /^([A-Z\.]+:\s)/ );
		let content = text;

		if ( prefixMatch ) {

			const fullPrefix = prefixMatch[ 0 ];
			const parts = fullPrefix.slice( 0, - 2 ).split( '.' );
			const shortPrefix = ( parts.length > 1 ? parts[ parts.length - 1 ] : parts[ 0 ] ) + ':';

			const icon = this._getIcon( type, shortPrefix.split( ':' )[ 0 ].toLowerCase() );

			fragment.appendChild( document.createTextNode( icon + ' ' ) );

			const prefixSpan = document.createElement( 'span' );
			prefixSpan.className = 'log-prefix';
			prefixSpan.textContent = shortPrefix;
			fragment.appendChild( prefixSpan );
			content = text.substring( fullPrefix.length );

		}

		const parts = content.split( '"' );
		parts.forEach( ( part, index ) => {

			if ( index % 2 === 1 ) {

				const codeSpan = document.createElement( 'span' );
				codeSpan.className = 'log-code';
				codeSpan.textContent = part;
				fragment.appendChild( codeSpan );

			} else {

				fragment.appendChild( document.createTextNode( part ) );

			}

		} );

		return fragment;

	}

	addMessage( type, text ) {

		const msg = document.createElement( 'div' );
		msg.className = `log-message ${type}`;
		msg.dataset.type = type;
		msg.dataset.rawText = text;

		msg.appendChild( this._formatMessage( type, text ) );

		const showByType = this.filters[ type ];
		const showByText = text.toLowerCase().includes( this.filterText );
		msg.classList.toggle( 'hidden', ! ( showByType && showByText ) );

		this.logContainer.appendChild( msg );
		this.logContainer.scrollTop = this.logContainer.scrollHeight;
		if ( this.logContainer.children.length > 200 ) {

			this.logContainer.removeChild( this.logContainer.firstChild );

		}

	}

}

export { Console };
