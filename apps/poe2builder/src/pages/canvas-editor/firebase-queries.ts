import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import type { StorableGraphNode } from '../../app/graph/graph-node.ts';
import { asType, db } from '../../app/firebase.ts';
import type { StorableGraphConnection } from '../../app/graph/graph-connection.ts';


export interface NodeChunk {
	id:      string;
	version: string;
	updated: string;
	created: string;
	nodes:   StorableGraphNode[];
};

export interface ConnectionChunk {
	id:          string;
	version:     string;
	updated:     string;
	created:     string;
	connections: StorableGraphConnection[];
}


export const graphNodeCollection = 'passive-graph-nodes';
export const graphConnectionCollection = 'passive-graph-connections';
export const nodeDataCollection = 'passive-node-data';


export const getGraphNodes = async (version: string) =>  {
	const qry = query(
		collection(db, graphNodeCollection).withConverter(asType<NodeChunk>()),
		where('version', '==', version),
		orderBy('created'),
	);

	const result = await getDocs(qry);

	return result.docs.map(doc => doc.data());
};


export const getGraphConnections = async (version: string) => {
	const qry = query(
		collection(db, graphConnectionCollection).withConverter(asType<ConnectionChunk>()),
		where('version', '==', version),
		orderBy('created'),
	);

	const result = await getDocs(qry);

	return result.docs.map(doc => doc.data());
};
