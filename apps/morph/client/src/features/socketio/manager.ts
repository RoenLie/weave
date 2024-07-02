import { Manager } from 'socket.io-client';

import { serverUrl } from '../../app/backend-url.js';

export const manager: Manager = new Manager(serverUrl);
