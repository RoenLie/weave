import { css, html, LitElement, svg, type PropertyValues } from 'lit';
import { map } from 'lit/directives/map.js';
import { query, state } from 'lit/decorators.js';
import { Connection, GraphNode } from './graph.ts';
import { classMap } from 'lit/directives/class-map.js';
import { debounce } from '@roenlie/core/timing';
import type { Vec2 } from '@roenlie/core/types';
import { app, assignTypes, db } from './firebase.ts';
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, signInWithPopup, type User } from 'firebase/auth';
import { when } from 'lit/directives/when.js';
import { query as fbQuery, orderBy, limit, collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';


interface Viewport { x1: number, x2: number, y1: number, y2: number }


export class Poe2Tree extends LitElement {

	public static tagName = 'poe2-tree';
	static { queueMicrotask(() => customElements.define(this.tagName, this)); }

	@query('.svg-wrapper')   protected svgWrapper:   HTMLElement;
	@query('.center-circle') protected centerCircle: SVGElement;

	@state() protected selectedNode?: GraphNode = undefined;
	@state() protected tooltip:       string = '';
	@state() protected viewport:      Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	@state() protected nodes:         Map<string, GraphNode> = new Map();
	@state() protected connections:   Map<string, Connection> = new Map();
	@state() protected currentUser:   User | null = null;

	protected nodeDocId: string | undefined;
	protected conDocId:  string | undefined;
	protected autosave:  boolean = false;
	protected abortCtrl: AbortController;

	public override connectedCallback(): void {
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
		this.updateComplete.then(() => this.afterConnectedCallback());
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.abortCtrl.abort();
	}

	public afterConnectedCallback(): void {
		const { svgWrapper } = this;

		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;

		// Align the center of the svg with the center of the parent
		const y = parentHeight / 2 - svgWrapper.offsetHeight / 2;
		const x = parentWidth / 2 - svgWrapper.offsetWidth / 2;
		svgWrapper.style.top = `${ y }px`;
		svgWrapper.style.left = `${ x }px`;

		this.centerCircle.setAttribute('cy', `${ svgWrapper.offsetHeight / 2 }`);
		this.centerCircle.setAttribute('cx', `${ svgWrapper.offsetWidth / 2 }`);

		this.viewport = this.getViewport(svgWrapper);
	}

	protected async loadGraphFromStorage() {
		const nodeCol = collection(db, 'passive-tree-nodes')
			.withConverter(assignTypes<{ nodes: GraphNode[] }>());
		const nodeQry = fbQuery(nodeCol, orderBy('created'), limit(1));

		const conCol = collection(db, 'passive-tree-connections')
			.withConverter(assignTypes<{ connections: Connection[] }>());
		const conQry = fbQuery(conCol, orderBy('created'), limit(1));

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

	protected override updated(_changedProperties: PropertyValues): void {
		super.updated(_changedProperties);

		this.performAutosave();
	}

	protected getScaleFactor(element?: HTMLElement): number {
		const svgWrapper = element ?? this.svgWrapper;
		const scaleMatch = svgWrapper?.style.transform.match(/scale\((\d+(\.\d+)?)\)/);

		return scaleMatch ? Number(scaleMatch[1]) : 1;
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

	protected onMousedownContainer(ev: MouseEvent) {
		// This functionality is only for left clicks
		if (ev.buttons !== 1)
			return;

		const capslockOn = ev.getModifierState('CapsLock');
		const path = ev.composedPath();
		const targetEl = path.filter(el => el instanceof SVGElement)
			.find(el => el.classList.contains('clickable'));

		if (targetEl) {
			const node = this.nodes.get(targetEl?.id ?? '');
			const isNodeCircle = targetEl?.classList.contains('node-circle');
			const isPathCircle = targetEl?.classList.contains('path-handle');

			if (isNodeCircle) {
				if (node) {
					if (ev.shiftKey && this.selectedNode) {
						this.connectNodes(this.selectedNode, node);
					}
					else if (capslockOn || ev.ctrlKey || ev.metaKey) {
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

							this.requestUpdate();
						};

						const mouseup = () =>
							window.removeEventListener('mousemove', mousemove);

						window.addEventListener('mousemove', mousemove,
							{ signal: this.abortCtrl.signal });
						window.addEventListener('mouseup', mouseup,
							{ once: true, signal: this.abortCtrl.signal });
					}
					else {
						this.selectedNode = node;
					}
				}
			}
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

					this.requestUpdate();
				};

				const mouseup = () =>
					window.removeEventListener('mousemove', mousemove);

				window.addEventListener('mousemove', mousemove,
					{ signal: this.abortCtrl.signal });
				window.addEventListener('mouseup', mouseup,
					{ once: true, signal: this.abortCtrl.signal });
			}

			return;
		}
		else if (ev.altKey) {
			// We add a new circle if you are holding the alt key
			const x = ev.offsetX;
			const y = ev.offsetY;

			const node = new GraphNode({ x, y });
			this.nodes.set(node.id, node);

			this.requestUpdate();
		}
		else {
			const { svgWrapper } = this;

			const offsetY = ev.pageY - svgWrapper.offsetTop;
			const offsetX = ev.pageX - svgWrapper.offsetLeft;

			const mousemove = (mouseEv: MouseEvent) => {
				svgWrapper.style.top = (mouseEv.pageY - offsetY) + 'px';
				svgWrapper.style.left = (mouseEv.pageX - offsetX) + 'px';

				this.viewport = this.getViewport(svgWrapper);
			};

			window.addEventListener('mousemove', mousemove,
				{ signal: this.abortCtrl.signal });

			window.addEventListener('mouseup', () => {
				window.removeEventListener('mousemove', mousemove);
			}, { once: true, signal: this.abortCtrl.signal });

			this.selectedNode = undefined;
			this.requestUpdate();
		}
	};

	protected onWheelContainer = {
		passive:     true,
		handleEvent: (ev: WheelEvent) => {
			const { svgWrapper } = this;

			const scale = this.getScaleFactor(svgWrapper);
			const zoomIntensity = 0.001; // Adjust this value to control zoom intensity
			const newScale = Math.max(0.1, scale * Math.exp(ev.deltaY * -zoomIntensity));
			svgWrapper.style.transform = `scale(${ newScale })`;

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

			this.viewport = this.getViewport(svgWrapper);
		},
	} satisfies AddEventListenerOptions & EventListenerObject;

	protected onKeydownContainer(ev: KeyboardEvent) {
		// Remove the node from the graph
		if (this.selectedNode && ev.code === 'Delete') {
			ev.preventDefault();

			const node = this.selectedNode;
			this.nodes.delete(node.id);
			node.connections.forEach(id => this.connections.delete(id));

			this.requestUpdate();
		}

		if (this.selectedNode && ev.code === 'Digit1') {
			this.selectedNode.radius = 7;
			this.requestUpdate();
		}
		if (this.selectedNode && ev.code === 'Digit2') {
			this.selectedNode.radius = 10;
			this.requestUpdate();
		}
		if (this.selectedNode && ev.code === 'Digit3') {
			this.selectedNode.radius = 15;
			this.requestUpdate();
		}
	}

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

		this.requestUpdate();
	}

	protected performAutosave = debounce(async () => {
		if (!this.autosave)
			return;

		// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('tree', {
			create: true,
		});

		const writable = await fileHandle.createWritable({ keepExistingData: false });
		const nodes = Array.from(structuredClone(this.nodes).values());
		const connections = Array.from(structuredClone(this.connections).values());

		await writable.write(JSON.stringify({ nodes, connections }));
		await writable.close();

		const nodeQry = fbQuery(collection(db, 'passive-tree-nodes'), orderBy('created'), limit(1));
		const nodeDoc = (await getDocs(nodeQry)).docs[0];
		if (nodeDoc) {
			await updateDoc(doc(db, 'passive-tree-nodes', nodeDoc.id), {
				updated: new Date().toISOString(),
				nodes,
			});
		}
		else {
			await addDoc(collection(db, 'passive-tree-nodes'), {
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				nodes,
			});
		}

		const conQry = fbQuery(collection(db, 'passive-tree-connections'), orderBy('created'), limit(1));
		const conDoc = (await getDocs(conQry)).docs[0];
		if (conDoc) {
			await updateDoc(doc(db, 'passive-tree-connections', conDoc.id), {
				updated: new Date().toISOString(),
				connections,
			});
		}
		else {
			await addDoc(collection(db, 'passive-tree-connections'), {
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
				connections,
			});
		}

		//const entries = await getDirectoryEntriesRecursive(opfsRoot);
		//Object.entries(entries).forEach(([ name, entry ]) => {
		//	console.log(name, entry);
		//	//entry.handle.remove({ recursive: true });
		//});
	}, 1000);

	protected isOutsideViewport(node: Vec2, padding = 0): boolean {
		const outsideX1 = node.x < (this.viewport.x1 - padding);
		const outsideX2 = node.x > (this.viewport.x2 + padding);
		const outsideY1 = node.y < (this.viewport.y1 - padding);
		const outsideY2 = node.y > (this.viewport.y2 + padding);

		return outsideX1 || outsideX2 || outsideY1 || outsideY2;
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

	protected renderConnectionPath(con: Connection) {
		// TODO, this should rather be based on how much of the svg is visible
		if (this.getScaleFactor() < 0.3)
			return;
		if (this.isOutsideViewport(con.start) && this.isOutsideViewport(con.end))
			return;

		// Assuming you have start and end coordinates
		let startX = con.start.x;
		let startY = con.start.y;
		let stopX  = con.end.x;
		let stopY  = con.end.y;
		const midX = con.middle.x;
		const midY = con.middle.y;

		// Calculate the direction vector
		const dxStart = midX - startX;
		const dyStart = midY - startY;
		const dxStop  = stopX - midX;
		const dyStop  = stopY - midY;

		const getReduction = (radius: number, a: number, b: number) => {
			// Calculate the length of the direction vector
			const lengthStart = Math.sqrt(a * a + b * b);

			// Normalize the direction vector
			const nxStart = a / lengthStart;
			const nyStart = b / lengthStart;

			// Scale the normalized vector by the radius
			const reductionXStart = nxStart * radius;
			const reductionYStart = nyStart * radius;

			return [ reductionXStart, reductionYStart ] as const;
		};

		const startRadius = this.nodes.get(con.start.id)?.radius ?? 7;
		const startReduction = getReduction(startRadius, dxStart, dyStart);
		startX += startReduction[0];
		startY += startReduction[1];

		const stopRadius = this.nodes.get(con.end.id)?.radius ?? 7;
		const endReduction = getReduction(stopRadius, dxStop, dyStop);
		stopX -= endReduction[0];
		stopY -= endReduction[1];

		const d = `M${ startX } ${ startY } `
			+ `Q${ midX } ${ midY } ${ stopX } ${ stopY }`;

		return svg`<path class="node-path" d=${ d }></path>`;
	}

	protected renderConnectionHandle(con: Connection) {
		// TODO, this should rather be based on how much of the svg is visible
		if (this.getScaleFactor() < 0.5)
			return;
		if (this.isOutsideViewport(con.middle, 2))
			return;

		const calculatePathAngle = (start: Vec2, end: Vec2) => {
			const deltaX = end.x - start.x;
			const deltaY = end.y - start.y;
			const angleInRadians = Math.atan2(deltaY, deltaX);
			const angleInDegrees = angleInRadians * (180 / Math.PI);

			return angleInDegrees;
		};

		const rotatePoint = (point: Vec2, angleInDegrees: number, origin = { x: 0, y: 0 }) => {
			const angleInRadians = angleInDegrees * (Math.PI / 180);
			const cosAngle = Math.cos(angleInRadians);
			const sinAngle = Math.sin(angleInRadians);

			const translatedX = point.x - origin.x;
			const translatedY = point.y - origin.y;

			const rotatedX = translatedX * cosAngle - translatedY * sinAngle;
			const rotatedY = translatedX * sinAngle + translatedY * cosAngle;

			return {
				x: rotatedX + origin.x,
				y: rotatedY + origin.y,
			};
		};

		const rotateVertices = (vertices: Vec2[], angleInDegrees: number, origin = { x: 0, y: 0 }) => {
			return vertices.map(vertex => rotatePoint(vertex, angleInDegrees, origin));
		};

		const length = 2;
		const rawPoints = [
			{ x: con.middle.x - length, y: con.middle.y },
			{ x: con.middle.x, y: con.middle.y - length },
			{ x: con.middle.x + length, y: con.middle.y },
			{ x: con.middle.x, y: con.middle.y + length },
		];

		const rotated = rotateVertices(rawPoints,
			calculatePathAngle(con.start, con.end), con.middle);

		const points = rotated.map(p => `${ p.x },${ p.y }`).join(' ');

		return svg`
		<polygon
			id=${ con.id }
			class="clickable path-handle"
			points=${ points }
		></polygon>
		`;
	}

	protected renderNode(node: GraphNode): unknown {
		if (this.isOutsideViewport(node, node.radius))
			return;

		return svg`
		<circle
			id   =${ node.id }
			cx   =${ node.x }
			cy   =${ node.y }
			r    =${ node.radius }
			class=${ classMap({
				'clickable':   true,
				'node-circle': true,
				active:        this.selectedNode?.id === node.id,
			}) }
		></circle>
		`;
	}

	protected override render() {
		return html`
		<div class="container"
			tabindex  ="0"
			@wheel    =${ this.onWheelContainer }
			@keydown  =${ this.onKeydownContainer }
			@mousedown=${ this.onMousedownContainer }
			@mousemove=${ this.onMousemoveContainer }
		>
			<div class="title">
				${ this.tooltip }
			</div>
			<div class="controls">
				${ when(this.currentUser, () => html`
				<button @click=${ this.logout }>Logout</button>
				`, () => html`
				<button @click=${ this.login }>Login</button>
				`) }
			</div>

			<div inert class="svg-wrapper" style="position:absolute;">
				<img src="/poe2-tree.png">
				<svg class="tree" width="3750" height="3750">
					<circle class="center-circle" r="227"></circle>

					${ map(this.connections.values(), c => this.renderConnectionPath(c)) }
					${ map(this.nodes.values(),       n => this.renderNode(n)) }
					${ map(this.connections.values(), c => this.renderConnectionHandle(c)) }
				</svg>
			</div>
		</div>
		`;
	}

	public static override styles = css`
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

			img {
				position: absolute;
				opacity: 0.8;
				place-self: center;
				padding-top: 40px;
				padding-left: 25px;
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
		svg.tree {
			pointer-events: none;
		}
		path, circle, polygon {
			pointer-events: auto;
		}
		path {
			z-index: 0;
		}
		path.node-path {
			opacity: 0.5;
			stroke: darkslateblue;
			stroke-width: 2;
			fill: none;
		}
		circle {
			z-index: 1;
		}
		circle.center-circle {
			stroke: rebeccapurple;
			stroke-width: 4px;
			fill: rgb(15 16 21 / 20%);
		}
		circle.node-circle {
			fill: transparent;
			stroke: silver;
			stroke-width: 1;

			&.active {
				fill: rgb(192 192 192 / 30%);
			}
		}
		circle.path-circle {
			fill: transparent;
			stroke: silver;
			stroke-width: 1;
		}
		.path-handle {
			fill: rgb(240 240 240 / 50%);
		}
  	`;

}
