import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { Keystone, useStyle } from 'keystone-core';
import { html } from 'lit';

import diaryStyle from './diary.css' with { type: 'css' };
import { DiaryBox, DiaryGoalBox } from './diary-box.cmp.js';


export const DiaryPage = Keystone(props => {
	useStyle(sharedStyles);
	useStyle(diaryStyle, 'diary');

	return () => html`
	<s-diary-page>
		<s-diary-wrapper>
			<s-worklist>
				<span>
					Worklist
				</span>
			</s-worklist>
			<s-diary-container>
				<s-diary-main>
					<DiaryGoalBox></DiaryGoalBox>
					<DiaryBox></DiaryBox>
					<DiaryBox></DiaryBox>
					<DiaryBox></DiaryBox>
					<DiaryBox></DiaryBox>
				</s-diary-main>
			</s-diary-container>
		</s-diary-wrapper>
	</s-diary-page>
	`;
});
