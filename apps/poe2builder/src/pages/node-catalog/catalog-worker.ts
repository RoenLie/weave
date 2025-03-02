import { createClient } from '@supabase/supabase-js';


const workerStorage = new Map();


const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY,
	{
		auth: {
			detectSessionInUrl: false,
			persistSession:     true,
			storage:            {
				getItem:	   (key: string) => workerStorage.get(key),
				setItem:	   (key: string, value: string) => void workerStorage.set(key, value),
				removeItem: (key: string) => void workerStorage.delete(key),
			},
		},
	},
);


onmessage = async (ev: MessageEvent) => {
	if (ev.data.type === 'login') {
		workerStorage.set(ev.data.storageKey, JSON.parse(ev.data.session));
		const getSessionResult = await supabase.auth.getUser();
		console.log({ getSessionResult });
	}
};
