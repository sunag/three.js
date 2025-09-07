
import { RendererInspector } from './RendererInspector.js';
import { Profiler } from './ui/Profiler.js';
import { Tab } from './ui/Tab.js';
import { List } from './ui/List.js';
import { Item } from './ui/Item.js';
import { Graph } from './ui/Graph.js';
import { Performance } from './tabs/Performance.js';
import { setText, ease } from './ui/utils.js';

class Inspector extends RendererInspector {

	constructor() {

		super();

		// init profiler

		const profiler = new Profiler();

		const performance = new Performance();
		profiler.addTab( performance );

		profiler.setActiveTab( performance.id );

		//

		this.fps = 0;	

		this.statsData = new Map();
		this.profiler = profiler;
		this.performance = performance;

		this.displayCycle = {
			text: {
				needsUpdate: false,
				duration: .25,
				time: 0
			},
			graph: {
				needsUpdate: false,
				duration: .1,
				time: 0
			}
		};

	}

	get domElement() {

		return this.profiler.domElement;

	}

	getStatsData( uid ) {

		let data = this.statsData.get( uid );

		if ( data === undefined ) {

			data = {};

			this.statsData.set( uid, data );

		}

		return data;

	}

	resolveStats( stats ) {

		const data = this.getStatsData( stats.uid );

		if ( data.initialized !== true ) {

			data.cpu = stats.cpu;
			data.gpu = stats.gpu;

			data.initialized = true;

		}

		data.cpu = ease( data.cpu, stats.cpu, this.nodeFrame.deltaTime );
		data.gpu = ease( data.gpu, stats.gpu, this.nodeFrame.deltaTime );
		data.total = data.cpu + data.gpu;

		//

		for ( const child of stats.children ) {

			this.resolveStats( child );

		}

	}

	async resolveFrame( frame ) {

		await super.resolveFrame( frame );

		const deltaTime = this.nodeFrame.deltaTime;
		const fps = 1 / deltaTime;

		this.fps = ease( this.fps, fps, deltaTime );

		this.resolveStats( frame );

		this.updateCycle( this.displayCycle.text );
		this.updateCycle( this.displayCycle.graph );

		if ( this.displayCycle.text.needsUpdate ) {

			setText( 'fps-counter', this.fps.toFixed() );

			this.performance.updateText( this, frame );

		}

		if ( this.displayCycle.graph.needsUpdate ) {

			this.performance.updateGraph( this, frame );

		}

		this.displayCycle.text.needsUpdate = false;
		this.displayCycle.graph.needsUpdate = false;

	}

	updateCycle( cycle ) {

		cycle.time += this.nodeFrame.deltaTime;

		if ( cycle.time >= cycle.duration ) {

			cycle.needsUpdate = true;
			cycle.time = 0;

		}

	}

}

export { Inspector };
