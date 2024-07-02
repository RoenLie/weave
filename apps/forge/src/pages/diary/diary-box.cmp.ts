import { Keystone, useConnected, useStyle } from 'keystone-core';
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import Quill from 'quill';
import quillBubble from 'quill/dist/quill.bubble.css' with { type: 'css' };
import quillStyle from 'quill/dist/quill.core.css' with { type: 'css' };
import quillSnow from 'quill/dist/quill.snow.css' with { type: 'css' };

import boxStyle from './diary-box.css' with { type: 'css' };
import quillCustomStyle from './quill.css' with { type: 'css' };


export const DiaryBox = Keystone<{span: number, class: string}>(props => {
	const { span = 2, children } = props;

	useStyle(boxStyle, 'diary');

	return () => html`
	<s-diary-box
		class=${ props.class }
		style=${ styleMap({ gridRow: `span ${ span }` }) }
	>
		${ children }
	</s-diary-box>
	`;
});


export const DiaryGoalBox = Keystone(_props => {
	useStyle(quillStyle, 'quill');
	useStyle(quillBubble, 'quill');
	useStyle(quillSnow, 'quill');
	useStyle(quillCustomStyle, 'quill');

	const elRef = createRef<HTMLElement>();

	useConnected(() => {
		new Quill(elRef.value!, {
			modules: {
				toolbar: [
					[ { header: [ 1, 2, false ] } ],
					[ 'bold', 'italic', 'underline' ],
					[ 'image', 'code-block' ],
				],
			},
			placeholder: 'What is your goal?',
			theme:       'snow', // or 'bubble'
		});
	});


	return () => html`
	<DiaryBox span=2 class="diary-goal-box">
		<h3>Goal!</h3>
		<s-quill>
			<div ${ ref(elRef) }></div>
		</s-quill>
	</DiaryBox>
	`;
});
