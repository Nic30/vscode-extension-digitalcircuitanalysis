 import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
import {VcdParser} from './vcdParser';
import { setupRootSvgOnResize } from './setupRootSvgOnResize';
export declare const vscode: _vscode;


const svg = d3.select("#wave-placeholder");
setupRootSvgOnResize(svg);
const wave = new (d3 as any).WaveGraph(svg);

const zoom = d3.zoom();
zoom.on("zoom", function applyTransform(ev) {
    wave.dataG.attr("transform", ev.transform);
});

// disable zoom on doubleclick
// because it interferes with component expanding/collapsing
svg.call(zoom as any)
    .on("dblclick.zoom", null);

/**
 * Render the document in the webview.
 */
function updateContent(text: string) {
	let json;
	try {
		if (!text) {
			json = {};
		} else {
			const vcdParser = new VcdParser();
			vcdParser.parse_str(text);		
			json = vcdParser.scope?.toJson();
		}
	} catch (e) {
		svg.append("text")
	  	   .attr("transform", "translate(100, 100)")
  	       .text('Error: Document is not valid vcd ' + e)
  	       .attr('style', "fill:red;font-size:20px");
  	    console.log(e);
		throw e;
	}
	wave.bindData(json).then(
		() => {},
		(e:any) => {
			wave.setErrorText(e);
			throw e;
		});
}

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
	const message = event.data; // The json data that the extension sent
	switch (message.type) {
		case 'update': {
			const text = message.text;
			// Update our webview's content
			updateContent(text);
			// Then persist state information.
			// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
			vscode.setState({ text });
			return;
		}
	}
});

// Webviews are normally torn down when not visible and re-created when they become visible again.
// State lets us save information across these re-loads
const state = vscode.getState();
if (state) {
	updateContent(state.text);
}