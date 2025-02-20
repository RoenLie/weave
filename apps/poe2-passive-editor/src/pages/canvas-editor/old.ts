
// We only care about left clicks
if (downEv.buttons !== 1)
	return;

downEv.preventDefault();
this.focus();

const { connections } = this.dataManager;

const rect = this.getBoundingClientRect();
const deltaY = rect.top;
const deltaX = rect.left;

// Get the offset from the corner of the current view to the mouse position
const viewOffsetX = downEv.offsetX - this.mainView.position.x;
const viewOffsetY = downEv.offsetY - this.mainView.position.y;

// Get the mouse position in relation to the current view
const scale = this.mainView.scale;
const realX = viewOffsetX / scale;
const realY = viewOffsetY / scale;

const vec = { x: downEv.offsetX, y: downEv.offsetY };
// Try to find a node or connection at the mouse position
const nodeOrVec = this.getGraphNode(vec) ?? this.getConnectionHandle(vec);

// If we found a node or a connection, we want to move it
if (nodeOrVec) {
	// We setup the mousemove and mouseup events
	// For moving the node or connection
	const mouseOffsetX = (realX - nodeOrVec.x) * scale;
	const mouseOffsetY = (realY - nodeOrVec.y) * scale;

	let mousemove: (ev: MouseEvent) => void = () => {};
	const mouseup = () => {
		removeEventListener('mousemove', mousemove);
		removeEventListener('mouseup', mouseup);
	};

	// We are clicking on a node
	if (GraphNode.isGraphNode(nodeOrVec)) {
		const node = nodeOrVec;

		if (downEv.shiftKey && this.editingFeatures.connectNodes) {
			this.dataManager.connectNodes(this.selectedNode, node);
		}
		else {
			if (this.selectedNode?.path) {
				const node = this.selectedNode;
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}

			this.selectedNode = node;
			node.path = this.createNodePath2D(node);
		}

		this.drawMain();

		this.editingFeatures.moveNode && (mousemove = (ev: MouseEvent) => {
			const scale = this.mainView.scale;
			const x = ev.offsetX - deltaX - this.mainView.position.x - mouseOffsetX;
			const y = ev.offsetY - deltaY - this.mainView.position.y - mouseOffsetY;

			this.dataManager.moveNode(node, { x: x / scale, y: y / scale });
			this.drawMain();
		});
	}
	else {
		const vec = nodeOrVec;
		const con = connections.values().find(c => c.m1 === vec || c.m2 === vec);
		if (!con)
			return;

		this.editingFeatures.moveConnections && (mousemove = (ev: MouseEvent) => {
			const scale = this.mainView.scale;

			const x = ev.offsetX - deltaX - this.mainView.position.x - mouseOffsetX;
			const y = ev.offsetY - deltaY - this.mainView.position.y - mouseOffsetY;

			this.dataManager.moveConnection(con, vec, { x: x / scale, y: y / scale });
			this.drawMain();
		});
	}

	addEventListener('mousemove', mousemove);
	addEventListener('mouseup', mouseup);
}
// If we didn't find a node or a connection, we want to pan the view
// and create a node if alt/cmd is pressed
else {
	// We are holding alt or double clicking the canvas
	// so we want to create a new node
	if (this.editingFeatures.createNode && (downEv.detail === 2 || downEv.altKey || downEv.metaKey)) {
		const node = this.dataManager.addNode({ x: realX, y: realY });

		if (this.selectedNode?.path) {
			const node = this.selectedNode;
			this.selectedNode = undefined;
			node.path = this.createNodePath2D(node);
		}

		this.selectedNode = node;
		this.drawMain();
	}
}
