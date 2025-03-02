import { createClient } from '@supabase/supabase-js';


export const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY,
);


const { data: { session } } = await supabase.auth.getSession();
if (!session) {
	await supabase.auth.signInWithPassword({
		email:    import.meta.env.VITE_SUPABASE_EMAIL,
		password: import.meta.env.VITE_SUPABASE_PASSWORD,
	});
}
