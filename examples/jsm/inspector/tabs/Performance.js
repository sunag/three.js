import { Tab } from '../ui/Tab.js';
import { List } from '../ui/List.js';
import { Graph } from '../ui/Graph.js';
import { Item } from '../ui/Item.js';
import { createValueSpan, setText } from '../ui/utils.js';

class Performance extends Tab {

	constructor() {

		super( 'Performance' );

		const perfList = new List( 'Name', 'CPU', 'GPU', 'Total' );
		perfList.setGridStyle( 'minmax(200px, 2fr) 80px 80px 80px' );

		//

		const graphContainer = document.createElement( 'div' );
		graphContainer.className = 'graph-container';

		const graph = new Graph();
		graph.addLine( 'fps', '--accent-color' );
		//graph.addLine( 'gpu', '--color-yellow' );
		graphContainer.append( graph.domElement );

		const label = document.createElement( 'label' );
		label.className = 'custom-checkbox';

		const checkbox = document.createElement( 'input' );
		checkbox.type = 'checkbox';

		const checkmark = document.createElement( 'span' );
		checkmark.className = 'checkmark';

		label.appendChild( checkbox );
		label.appendChild( checkmark );

		const graphStats = new Item( 'Graph Stats', label, createValueSpan(), createValueSpan( 'graph-fps-counter' ) );
		perfList.add( graphStats );

		const graphItem = new Item( graphContainer );
		graphItem.itemRow.childNodes[ 0 ].style.gridColumn = '1 / -1';
		graphStats.add( graphItem );

		graphStats.close();

		//

		const frameStats = new Item( 'Frame Stats', createValueSpan(), createValueSpan(), createValueSpan() );
		perfList.add( frameStats );

		this.content.appendChild( perfList.domElement );

		//

		this.frameStats = frameStats;
		this.graphStats = graphStats;
		this.graph = graph;

		//

		this.currentRender = null;
		this.currentItem = null;
		this.frameItems = new Map();

	}

	resolveStats( inspector, stats ) {

		const data = inspector.getStatsData( stats.uid );

		let item = data.item;

		if ( item === undefined ) {

			item = new Item( stats.name, createValueSpan(), createValueSpan(), createValueSpan() );
			this.currentItem.add( item );
			data.item = item;

		} else  {

			const statsIndex = stats.parent.children.indexOf( stats );

			if ( item.parent === null || item.parent.children.indexOf( item ) !== statsIndex ) {

				this.currentItem.add( item, statsIndex );

			}

		}

		setText( item.data[ 1 ], data.cpu.toFixed(2) );
		setText( item.data[ 2 ], data.gpu.toFixed(2) );
		setText( item.data[ 3 ], data.gpu.toFixed(2) );

		//

		const previousItem = this.currentItem;

		this.currentItem = item;

		for ( const child of stats.children ) {

			this.resolveStats( inspector, child );

		}

		this.currentItem = previousItem;

		this.frameItems.set( stats.uid, item );

	}

	updateGraph( inspector, frame ) {

		setText( 'graph-fps-counter', inspector.fps.toFixed() + ' FPS' );

		this.graph.addPoint( 'fps', inspector.fps );
		this.graph.update();

	}

	updateText( inspector, frame ) {

		const oldFrameItems = new Map( this.frameItems );

		this.frameItems.clear();
		this.currentItem = this.frameStats;

		for ( const child of frame.children ) {

			this.resolveStats( inspector, child );

		}

		// remove unused frame items

		for ( const [ uid, item ] of oldFrameItems ) {

			if ( ! this.frameItems.has( uid ) ) {

				item.parent.remove( item );
				oldFrameItems.delete( uid );

			}

		}

		//

		setText( this.frameStats.data[ 1 ], frame.cpu.toFixed(2) );
		setText( this.frameStats.data[ 2 ], frame.gpu.toFixed(2) );
		setText( this.frameStats.data[ 3 ], frame.total.toFixed(2) );

		//

		this.currentItem = null;

	}

}

export { Performance };
