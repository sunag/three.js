import puppeteer from 'puppeteer';
import { createServer } from './utils/server.js';

const server = createServer();
const port = await new Promise( ( resolve ) => {
	server.listen( 0, () => resolve( server.address().port ) );
} );

const flags = [
	'--hide-scrollbars',
	'--enable-unsafe-webgpu',
	'--enable-features=Vulkan',
	'--disable-vulkan-surface',
	'--ignore-gpu-blocklist',
	'--disable-gpu-driver-bug-workarounds',
	'--disable-gpu-watchdog',
	'--use-angle=swiftshader',
	'--no-sandbox'
];

const browser = await puppeteer.launch( { headless: true, args: flags } );
const page = await browser.newPage();

page.on( 'console', msg => {
	console.log( 'PAGE:', msg.text() );
} );
page.on( 'pageerror', err => {
	console.log( 'PAGEERROR:', err.message, err.stack );
} );

const target = process.argv[ 2 ] || 'webgpu_skinning';

await page.goto( `http://localhost:${port}/examples/${target}.html`, { waitUntil: 'networkidle0' } );

await new Promise( r => setTimeout( r, 6000 ) );

await browser.close();
server.close();
process.exit( 0 );
