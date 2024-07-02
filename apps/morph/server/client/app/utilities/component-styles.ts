import { css } from 'lit';


export const componentStyles = css`
*, *::before, *::after {
	box-sizing: border-box;
}
@media print {
  body {
    font-size: 8pt;
  }
}
textarea,
select,
button,
input {
  font: inherit;
  letter-spacing: inherit;
  word-spacing: inherit;
}
ol, ul, li {
	all: unset;
	display: block;
}
h1,h2,h3,h4,h5,h6,p,a {
	all: unset;
	display: inline-flex;
}
h1 {
	font-size: 300%;
	font-weight: 400;
}
h2 {
	font-size: 225%;
	font-weight: 400;
}
h3 {
	font-size: 150%;
	font-weight: 500;
}
h4 {
	font-size: 115%;
	font-weight: 500;
}
h5 {
	font-size: 100%;
	font-weight: 500;
}
h6 {
	font-size: 80%;
	font-weight: 500;
}
p {
	font-size: 100%;
	font-weight: 500;
}
a {
	cursor: pointer;
}
`;
