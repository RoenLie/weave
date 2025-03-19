export const createStyleVariables = (options: {
	prefix: string;
}): Record<string, string> => {
	const { prefix } = options;

	const accordianVars: Record<string, string> = {
		'accordion-padding-y':                 `1rem;`,
		'accordion-padding-x':                 `1.25rem;`,
		'accordion-color':                     `var(--${ prefix }body-color);`,
		'accordion-bg':                        `var(--${ prefix }body-bg);`,
		'accordion-border-width':              `var(--${ prefix }border-width);`,
		'accordion-border-color':              `var(--${ prefix }border-color);`,
		'accordion-border-radius':             `var(--${ prefix }border-radius);`,
		'accordion-inner-border-radius':       `subtract($accordion-border-radius, $accordion-border-width);`,
		'accordion-body-padding-y':            `$accordion-padding-y;`,
		'accordion-body-padding-x':            `$accordion-padding-x;`,
		'accordion-button-padding-y':          `$accordion-padding-y;`,
		'accordion-button-padding-x':          `$accordion-padding-x;`,
		'accordion-button-color':              `var(--${ prefix }body-color);`,
		'accordion-button-bg':                 `var(--${ prefix }accordion-bg);`,
		'accordion-transition':                `$btn-transition, border-radius .15s ease;`,
		'accordion-button-active-bg':          `var(--${ prefix }primary-bg-subtle);`,
		'accordion-button-active-color':       `var(--${ prefix }primary-text-emphasis);`,
		'accordion-button-focus-border-color': `$input-focus-border-color;`,
		'accordion-button-focus-box-shadow':   `$btn-focus-box-shadow;`,
		'accordion-icon-width':                `1.25rem;`,
		'accordion-icon-color':                `$body-color;`,
		'accordion-icon-active-color':         `$primary-text-emphasis;`,
		'accordion-icon-transition':           `transform .2s ease-in-out;`,
		'accordion-icon-transform':            `rotate(-180deg);`,
		'accordion-button-icon':               `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='#{$accordion-icon-color}' stroke-linecap='round' stroke-linejoin='round'><path d='m2 5 6 6 6-6'/></svg>");`,
		'accordion-button-active-icon':        `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='#{$accordion-icon-active-color}' stroke-linecap='round' stroke-linejoin='round'><path d='m2 5 6 6 6-6'/></svg>");`,
	};

	const vars = { ...accordianVars };

	for (const key of Object.keys(vars)) {
		vars[key] = vars[key]!.replace(
			/\$([a-z]+)/g,
			(match, name) => vars[name] ?? vars[key]!,
		);
	}

	console.log(vars);

	return vars;
};


export const styleVariables = createStyleVariables({ prefix: 'bs-' });
