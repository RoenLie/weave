
export const Loop = <TState extends object>(
	fn: (state: TState) => boolean, state: TState,
) => {
	while (fn(state)) { /*  */ }

	return state;
};
