import { Connection, GraphNode } from '../graph.ts';
import { debounce } from '@roenlie/core/timing';
import type { Vec2 } from '@roenlie/core/types';
import { app, assignTypes, db } from '../firebase.ts';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, signInWithPopup, type User } from 'firebase/auth';
import { query as fbQuery, orderBy, limit, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Path, type Viewport } from './graph-svg-rendering.ts';
import { css, CustomElement, signal } from './custom-element.ts';
import { html, render } from 'lit-html';
import { when } from 'lit-html/directives/when.js';
import { DetailsPanel } from './details-panel.ts';


export class Poe2Tree extends CustomElement {

	static {
		this.register('poe2-tree');
		DetailsPanel;
	}

	protected get svgWrapper() {
		return this.shadowRoot?.querySelector('.svg-wrapper') as HTMLElement;
	}

	@signal protected accessor showNodeDetails: boolean = false;
	@signal protected accessor selectedNode:  GraphNode | undefined;
	@signal protected accessor tooltip:       string = '';
	@signal protected accessor viewport:      Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	@signal protected accessor nodes:         Map<string, GraphNode> = new Map();
	@signal protected accessor connections:   Map<string, Connection> = new Map();
	@signal protected accessor currentUser:   User | null = null;
	@signal protected accessor connectionImg: string = '';
	@signal protected accessor graphUpdated = Date.now();

	protected nodeDocId: string | undefined;
	protected conDocId:  string | undefined;
	protected autosave:  boolean = false;
	protected abortCtrl: AbortController;

	protected override connectedCallback(): void {
		super.connectedCallback();

		const auth = getAuth(app);
		auth.onAuthStateChanged(user => {
			if (user) {
				this.currentUser = user;
				this.loadGraphFromStorage();
			}
			else {
				console.log('signed out');
			}
		});

		this.abortCtrl = new AbortController();
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.abortCtrl.abort();
	}

	protected override afterConnected(): void {
		const { svgWrapper } = this;

		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;

		// Align the center of the svg with the center of the parent
		const y = parentHeight / 2 - svgWrapper.offsetHeight / 2;
		const x = parentWidth / 2 - svgWrapper.offsetWidth / 2;
		svgWrapper.style.top = `${ y }px`;
		svgWrapper.style.left = `${ x }px`;

		this.updateViewport();
	}

	protected async loadGraphFromStorage() {
		const nodeQry = fbQuery(
			collection(db, 'passive-tree-nodes')
				.withConverter(assignTypes<{ nodes: GraphNode[] }>()),
			orderBy('created'),
			limit(1),
		);

		const conQry = fbQuery(
			collection(db, 'passive-tree-connections')
				.withConverter(assignTypes<{ connections: Connection[] }>()),
			orderBy('created'),
			limit(1),
		);

		const [ nodeDoc, conDoc ] = await Promise.all([
			(await getDocs(nodeQry)).docs[0],
			(await getDocs(conQry)).docs[0],
		]);

		if (!nodeDoc || !conDoc)
			return console.error('No nodes or connections found in the database');

		this.nodeDocId = nodeDoc.id;
		this.conDocId = conDoc.id;

		const nodes = nodeDoc.data().nodes;
		const connections = conDoc.data().connections;

		this.connections = new Map(connections.map(con => {
			const parsed = new Connection(con);

			return [ parsed.id, parsed ];
		}));

		this.nodes = new Map(nodes.map(node => {
			const parsed = new GraphNode(node);

			return [ parsed.id, parsed ];
		}));

		this.autosave = true;
		this.svgWrapper.inert = false;
	}

	protected getScaleFactor(element?: HTMLElement): number {
		const svgWrapper = element ?? this.svgWrapper;

		return svgWrapper ? Number(svgWrapper.style.scale) || 1 : 1;
	}

	protected getViewport(svgWrapper: HTMLElement): Viewport {
		const scale = this.getScaleFactor(svgWrapper);
		const parentRect = this.getBoundingClientRect();
		const viewableWidth = parentRect.width / scale;
		const viewableHeight = parentRect.height / scale;

		const x1 = -svgWrapper.offsetLeft / scale;
		const y1 = -svgWrapper.offsetTop / scale;
		const x2 = x1 + viewableWidth;
		const y2 = y1 + viewableHeight;

		return { x1, x2, y1, y2 };
	}

	protected updateViewport() {
		const { svgWrapper } = this;
		if (!svgWrapper)
			return;

		const newViewport = this.getViewport(svgWrapper);
		if (JSON.stringify(newViewport) !== JSON.stringify(this.viewport))
			this.viewport = newViewport;
	}

	protected onMousedownContainer(ev: MouseEvent) {
		// This functionality is only for left clicks
		if (ev.buttons !== 1)
			return;

		const capslockOn = ev.getModifierState('CapsLock');
		const path       = ev.composedPath();
		const targetEl   = path.filter(el => el instanceof SVGElement)
			.find(el => el.classList.contains('clickable'));

		// We are modifying a node or a connection
		if (targetEl) {
			const node = this.nodes.get(targetEl?.id ?? '');
			const isNodeCircle = targetEl?.classList.contains('node-circle');
			const isPathCircle = targetEl?.classList.contains('path-handle');

			// We are modifying a node
			if (isNodeCircle) {
				if (node) {
					ev.preventDefault();

					if (ev.shiftKey && this.selectedNode) {
						this.connectNodes(this.selectedNode, node);
					}
					else if (capslockOn || ev.ctrlKey || ev.metaKey) {
						this.selectedNode = node;

						const scale = this.getScaleFactor();
						const offsetX = (ev.pageX - node.x * scale);
						const offsetY = (ev.pageY - node.y * scale);

						const mousemove = (mouseEv: MouseEvent) => {
							node.x = (mouseEv.pageX - offsetX) / scale;
							node.y = (mouseEv.pageY - offsetY) / scale;

							const connections = node.connections
								.map(id => this.connections.get(id))
								.filter((con): con is Connection => !!con);

							connections.forEach(con => {
								const point = con.start.id === node.id
									? con.start : con.end;

								point.x = node.x;
								point.y = node.y;
							});

							this.graphUpdated = Date.now();
						};

						const mouseup = () => {
							window.removeEventListener('mousemove', mousemove);
							this.performAutosave();
						};

						window.addEventListener('mousemove', mousemove,
							{ signal: this.abortCtrl.signal });
						window.addEventListener('mouseup', mouseup,
							{ once: true, signal: this.abortCtrl.signal });
					}
					else if (ev.altKey) {
						this.showNodeDetails = !this.showNodeDetails;
						this.selectedNode = node;
					}
					else {
						this.selectedNode = node;
					}
				}
			}
			// We are modifying a connection
			else if (isPathCircle && (ev.ctrlKey || ev.metaKey || capslockOn)) {
				const connection = this.connections.get(targetEl!.id)!;

				const scale = this.getScaleFactor();
				const offsetX = (ev.pageX - connection.middle.x * scale);
				const offsetY = (ev.pageY - connection.middle.y * scale);

				const mousemove = (mouseEv: MouseEvent) => {
					const x = (mouseEv.pageX - offsetX) / scale;
					const y = (mouseEv.pageY - offsetY) / scale;

					connection.middle.x = x;
					connection.middle.y = y;

					this.graphUpdated = Date.now();
				};

				const mouseup = () => {
					window.removeEventListener('mousemove', mousemove);
					this.performAutosave();
				};

				window.addEventListener('mousemove', mousemove,
					{ signal: this.abortCtrl.signal });
				window.addEventListener('mouseup', mouseup,
					{ once: true, signal: this.abortCtrl.signal });
			}

			return;
		}
		// We add a new circle if you are holding the alt key
		else if (ev.altKey) {
			const x = ev.offsetX;
			const y = ev.offsetY;

			const node = new GraphNode({ x, y });
			this.nodes.set(node.id, node);

			this.graphUpdated = Date.now();
			this.performAutosave();

			return;
		}
		// We are moving the svgWrapper
		else {
			const { svgWrapper } = this;

			const offsetY = ev.pageY - svgWrapper.offsetTop;
			const offsetX = ev.pageX - svgWrapper.offsetLeft;

			const mousemove = (mouseEv: MouseEvent) => {
				svgWrapper.style.top = (mouseEv.pageY - offsetY) + 'px';
				svgWrapper.style.left = (mouseEv.pageX - offsetX) + 'px';

				this.updateViewport();
			};

			window.addEventListener('mousemove', mousemove,
				{ signal: this.abortCtrl.signal });

			window.addEventListener('mouseup', () => {
				window.removeEventListener('mousemove', mousemove);
			}, { once: true, signal: this.abortCtrl.signal });

			return;
		}
	};

	protected onMousemoveContainer(ev: MouseEvent) {
		const path = ev.composedPath();
		const circleEl = path.find(el =>
			'tagName' in el && el.tagName === 'circle') as SVGElement | undefined;

		const isNodeCircle = circleEl?.classList.contains('node-circle');

		if (isNodeCircle) {
			const node = this.nodes.get(circleEl?.id ?? '');
			this.tooltip = `Node: ${ node?.x.toFixed(2) }, ${ node?.y.toFixed(2) }`;
		}
		else {
			this.tooltip = '';
		}
	}

	protected onWheelContainer = {
		passive:     true,
		handleEvent: (ev: WheelEvent) => {
			const { svgWrapper } = this;

			const scale = this.getScaleFactor(svgWrapper);
			const zoomIntensity = 0.001; // Adjust this value to control zoom intensity
			const newScale = Math.max(0.1, scale * Math.exp(ev.deltaY * -zoomIntensity));
			svgWrapper.style.scale = '' + newScale;

			// Calculate the mouse position relative to the svgWrapper
			const rect = svgWrapper.getBoundingClientRect();
			const mouseX = ev.clientX - rect.left;
			const mouseY = ev.clientY - rect.top;

			// Calculate the new position of the svgWrapper
			const dx = (mouseX / scale) * (newScale - scale);
			const dy = (mouseY / scale) * (newScale - scale);
			const newLeft = (svgWrapper.offsetLeft - dx);
			const newTop = (svgWrapper.offsetTop - dy);

			svgWrapper.style.left = `${ newLeft }px`;
			svgWrapper.style.top = `${ newTop }px`;

			this.updateViewport();
		},
	} satisfies AddEventListenerOptions & EventListenerObject;

	protected onKeydownContainer(ev: KeyboardEvent) {
		// Remove the node from the graph
		if (this.selectedNode && ev.code === 'Delete') {
			ev.preventDefault();

			const node = this.selectedNode;
			this.nodes.delete(node.id);
			node.connections.forEach(id => this.connections.delete(id));

			this.showNodeDetails = false;
			this.selectedNode = undefined;
			this.graphUpdated = Date.now();
			this.performAutosave();
		}

		if (this.selectedNode && ev.code === 'Digit1') {
			this.selectedNode.radius = 7;
			this.graphUpdated = Date.now();
			this.performAutosave();
		}
		if (this.selectedNode && ev.code === 'Digit2') {
			this.selectedNode.radius = 10;
			this.graphUpdated = Date.now();
			this.performAutosave();
		}
		if (this.selectedNode && ev.code === 'Digit3') {
			this.selectedNode.radius = 15;
			this.graphUpdated = Date.now();
			this.performAutosave();
		}

		if (this.selectedNode && ev.code === 'Escape') {
			this.showNodeDetails = false;
			this.selectedNode = undefined;
		}
	}

	protected connectNodes(nodeA?: GraphNode, nodeB?: GraphNode) {
		if (!nodeA || !nodeB)
			return;

		const nodeHasNode = (a: GraphNode, b: GraphNode) => a.connections.some(
			n => {
				const connection = this.connections.get(n);
				if (!connection)
					return false;

				return connection.start.id === b.id || connection.end.id === b.id;
			},
		);


		const nodeAHasNodeB = nodeHasNode(nodeA, nodeB);
		if (nodeAHasNodeB)
			return;

		const nodeBHasNodeA = nodeHasNode(nodeB, nodeA);
		if (nodeBHasNodeA)
			return;

		const connection = new Connection({ start: nodeA, end: nodeB });

		this.connections.set(connection.id, connection);
		nodeA.connections.push(connection.id);
		nodeB.connections.push(connection.id);

		this.graphUpdated = Date.now();
		this.performAutosave();
	}

	protected performAutosave = debounce(async () => {
		if (!this.autosave)
			return;

		// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		//const opfsRoot   = await navigator.storage.getDirectory();
		//const fileHandle = await opfsRoot.getFileHandle('tree', { create: true });
		//const writable   = await fileHandle.createWritable({ keepExistingData: false });
		//await writable.write(JSON.stringify({ nodes, connections }));
		//await writable.close();

		await Promise.allSettled([
			updateDoc(doc(db, 'passive-tree-nodes', this.nodeDocId!), {
				updated: new Date().toISOString(),
				nodes:   this.nodes.values().map(node => node.toStorable()).toArray(),
			}),
			updateDoc(doc(db, 'passive-tree-connections', this.conDocId!), {
				updated:     new Date().toISOString(),
				connections: this.connections.values().map(con => con.toStorable()).toArray(),
			}),
		]);

		//const entries = await getDirectoryEntriesRecursive(opfsRoot);
		//Object.entries(entries).forEach(([ name, entry ]) => {
		//	console.log(name, entry);
		//	//entry.handle.remove({ recursive: true });
		//});
	}, 5000);

	protected getVisiblePercentage(): number {
		if (!this.svgWrapper)
			return 0;

		const svgWrapperRect = this.svgWrapper.getBoundingClientRect();
		const viewportRect = this.getBoundingClientRect();

		const intersectionRect = {
			top:    Math.max(svgWrapperRect.top, viewportRect.top),
			left:   Math.max(svgWrapperRect.left, viewportRect.left),
			bottom: Math.min(svgWrapperRect.bottom, viewportRect.bottom),
			right:  Math.min(svgWrapperRect.right, viewportRect.right),
		};

		const intersectionWidth = Math.max(0, intersectionRect.right - intersectionRect.left);
		const intersectionHeight = Math.max(0, intersectionRect.bottom - intersectionRect.top);
		const intersectionArea = intersectionWidth * intersectionHeight;

		const svgWrapperArea = svgWrapperRect.width * svgWrapperRect.height;

		return (intersectionArea / svgWrapperArea) * 100;
	}

	protected async login() {
		const auth = getAuth(app);
		await setPersistence(auth, browserLocalPersistence);

		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);

		this.currentUser = result.user;
	}

	protected async logout() {
		const auth = getAuth(app);
		await auth.signOut();
	}

	protected async connectionsToImg() {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx)
			return;

		const renderedSvg = this.svgWrapper.querySelector('svg')!;
		const renderedWidth = renderedSvg.width.baseVal.value;
		const renderedHeight = renderedSvg.height.baseVal.value;

		const root = render(html`
		<svg width=${ renderedWidth } height=${ renderedHeight }>
			<style>
			path.node-path {
				stroke: darkslateblue;
				stroke-width: 2;
				fill: none;
			}
			</style>
			<circle cx="1875" cy="1875" r="227" fill="transparent" stroke="rebeccapurple" stroke-width="4"></circle>
			${ this.connections.values().map(c => Path.render(this.nodes, this.viewport, c, false, false)) }
		</svg>
		`, document.createElement('div'));

		const svg = (root.parentNode as Element).querySelector('svg')!;

		for (let i = svg.childNodes.length - 1; i >= 0; i--) {
			const child = svg.childNodes[i];
			if (child instanceof Comment)
				child.remove();
		}

		const svgData = new XMLSerializer().serializeToString(svg);
		const blob = new Blob([ svgData ], { type: 'image/svg+xml' });
		const svgDataUrl = URL.createObjectURL(blob);

		const image = new Image();
		image.addEventListener('load', () => {
			console.log('image loaded');

			const width = Number(svg.getAttribute('width')) * 4;
			const height = Number(svg.getAttribute('height')) * 4;
			const canvas = document.createElement('canvas');

			canvas.setAttribute('width', '' + width);
			canvas.setAttribute('height', '' + height);

			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0, Number(width), Number(height));

			const dataUrl = canvas.toDataURL('image/png');
			this.connectionImg = dataUrl;

			//const link = document.createElement('a');
			//link.href = dataUrl;
			//link.download = 'connections.png';
			//link.click();

			//URL.revokeObjectURL(svgDataUrl);
		});

		image.src = svgDataUrl;
	}

	protected override render() {
		const skipConnections = this.getVisiblePercentage() > 40;
		const skipConnectionHandles = this.getVisiblePercentage() > 5;

		return html`
		<div class="container"
			@wheel    =${ this.onWheelContainer }
			@mousedown=${ this.onMousedownContainer }
			@mousemove=${ this.onMousemoveContainer }
		>
			<div class="controls">
				<button @click=${ this.connectionsToImg }>
					Save connections as img
				</button>

				${ when(this.currentUser, () => html`
				<button @click=${ this.logout }>
					Logout
				</button>
				`, () => html`
				<button @click=${ this.login }>
					Login
				</button>
				`) }
			</div>

			<div inert class="svg-wrapper" style="position:absolute;">
				${ when(!this.connectionImg, () => html`
				<img id="placeholder" src="/poe2-tree.png">
				`) }
				${ when(this.connectionImg, () => html`
				<img id="connections" src=${ this.connectionImg } width="3750" height="3750">
				`) }

				<passive-tree-svg
					tabindex				     = "0"
					.updated					  = ${ this.graphUpdated }
					.nodes                 = ${ this.nodes }
					.connections           = ${ this.connections }
					.viewport              = ${ this.viewport }
					.selectedNode          = ${ this.selectedNode }
					.skipConnections       = ${ skipConnections }
					.skipConnectionHandles = ${ skipConnectionHandles }
					@keydown  =${ this.onKeydownContainer }
				></passive-tree-svg>
			</div>

			${ when(this.showNodeDetails, () => html`
			<s-node-details @mousedown=${ (ev: Event) => ev.stopPropagation() }>
				<button @click=${ () => this.showNodeDetails = false }>
					Close
				</button>

				<details-panel
					.data=${ this.selectedNode?.data }
				></details-panel>
			</s-node-details>
			`) }
		</div>
		`;
	}

	public static override styles = [
		css`
		:host {
			contain: strict;
		}
		:host, .container {
			overflow: hidden;
			display: block;
			height: 100%;
		}
		.container {
			position: relative;
		}
		.svg-wrapper {
			display: grid;
			background-color: rgb(15, 16, 21);
			transform-origin: 0px 0px;
			scale: 1;

			img#placeholder {
				position: absolute;
				opacity: 0.8;
				place-self: center;
				padding-top: 33px;
				padding-left: 21px;
				z-index: -1;
				pointer-events: none;
				user-select: none;
			}
			img#connections {
				position: absolute;
				opacity: 0.8;
				place-self: center;
				z-index: -1;
				pointer-events: none;
				user-select: none;
			}
		}
		.title {
			position: fixed;
			z-index: 1;
			top: 0;
			left: 0;
			display: grid;
			background-color: grey;
			border-bottom-right-radius: 12px;
			min-width: 200px;
			min-height: 100px;
			border-right: 1px solid black;
			border-bottom: 1px solid black;
		}
		.controls {
			position: fixed;
			z-index: 1;
			top: 0;
			right: 0;
			display: grid;
			background-color: grey;
			border-bottom-left-radius: 12px;
			padding: 8px;
			min-width: 200px;
			min-height: 100px;
			border-left: 1px solid black;
			border-bottom: 1px solid black;

			button.active {
				background: blue;
			}
		}
  		`,
		css`
		s-node-details {
			z-index: 1;
			position: fixed;
			display: grid;
			bottom: 0px;
			left: 0px;
			right: 0px;
			height: 500px;
			background-color: rgb(15, 16, 21);
			border: 1px solid black;
			padding: 8px;
			border-radius: 8px;
			padding-top: 28px;
		}
		s-node-details button {
			background-color: darkgoldenrod;
			border: 1px solid black;
			border-radius: 4px;
			padding: 4px;
			position: absolute;
			top: 0;
			right: 0;
		}
		s-node-details details-panel {

		}
		`,
	];

}
