import express from 'express';


function greet(name: string): string {
	return `Hello, ${ name }!`;
}

console.log(greet('world'));
