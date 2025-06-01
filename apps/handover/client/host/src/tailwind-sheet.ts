import './index.css';


const headStyles = [ ...document.querySelectorAll('head > style') ];
const tailwind = headStyles.find(style => style.innerHTML.includes('tailwindcss'));

if (tailwind) {
	const stylesheet = new CSSStyleSheet();
	stylesheet.replaceSync(tailwind.innerHTML);
	(window as any).tailwind = stylesheet;
}
