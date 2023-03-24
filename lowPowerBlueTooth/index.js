/* Pills */

document.getElementById('color').addEventListener('click', (e) => {
	document.body.classList.remove('color', 'customize', 'universal');
	document.body.classList.add('color');
});

document.getElementById('customize').addEventListener('click', (e) => {
	document.body.classList.remove('color', 'customize', 'universal');
	document.body.classList.add('customize');
});

document.getElementById('universal').addEventListener('click', (e) => {
	document.body.classList.remove('color', 'customize', 'universal');
	document.body.classList.add('universal');
});



/* Inject styles in the editor */

var style = document.getElementById('style');

function injectStyle(c) {
	if (c) {
		style.innerHTML = 
			"#bulb {\n" + 
			"    fill: " + c + ";\n" +
			"}";
	}
	else {
		style.innerHTML = '';
	}
}

/* universal swatches */

var controls = document.getElementById('universalView');

controls.addEventListener('mousedown', handleUniversalEvent);
controls.addEventListener('touchstart', handleUniversalEvent);

function handleUniversalEvent(event) {
	if (event.target.tagName != 'BUTTON') {
		return;
	}
	var message = Uint8Array.from([0xaa, 1, 0]);
	switch (event.target.dataset.value)
	{
						
		case 'onoff':
			{
				message[0] = 0x33;
				message[1] = 0x01;
				message[2] = !BluetoothBulb._ONOFF;
				BluetoothBulb.setData(message);
			break;
			};
		default:
			{
				array = hexStrToArr(event.target.dataset.value);
				if (array.length > 20)
					console.log('error ble msg data!');
				BluetoothBulb.setData(array);
				break;
			};
	}

	/* 取消事件的默认动作。 */
	event.preventDefault();
}


/* Color swatches */

var controls = document.getElementById('colorView');

controls.addEventListener('mousedown', handleMouseEvent);
controls.addEventListener('touchstart', handleMouseEvent);

function handleMouseEvent(event) {
    if (event.target.tagName != 'BUTTON') {
        return;
    }
    
    var c = event.target.dataset.value;
	injectStyle(c);

    event.preventDefault();
}




/* Watch CSS animations */

var lastColor = '#cccccc';

var bulb = document.getElementById('bulb');

function watcher() {
	color = normalizeColor(window.getComputedStyle(bulb).fill);
	
	if (color != lastColor) {
		lastColor = color;
		BluetoothBulb.color = color;
	}
}
			
window.setInterval(watcher, 100);






/* Connect to device */

document.getElementById('connect')
	.addEventListener('click', () => {
		BluetoothBulb.connect()
			.then(() => {
				document.body.classList.add('connected');
				injectStyle(BluetoothBulb.color);
				
				BluetoothBulb.addEventListener('disconnected', () => {
					document.body.classList.remove('connected');
					injectStyle();
				});
			});
	});

document.getElementById('emulate')
	.addEventListener('click', () => {
	    emulateState = true;
		document.body.classList.add('connected');

		injectStyle();
	});


	
	



/* Color format conversion */

function normalizeColor(rgb) {
	if (rgb.search("rgb") == -1) {
		return rgb;
	}
	else if (rgb == 'rgba(0, 0, 0, 0)') {
		return 'transparent';
	}
	else {
		rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
		
		function hex(x) {
		   return ("0" + parseInt(x).toString(16)).slice(-2);
		}
		
		return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]); 
	}
}  


function hexStrToArr(str) {
	// hex字符串长度通常都是2的倍数，但为了放止意外，判断一下长度，不是2的倍数就在最前面补0
	if (str.length % 2) str = "0" + str
	let arr = []
	for (let i = 0; i < str.length; i += 2) {
		let a = parseInt(str.slice(i, i + 2), 16)
		arr.push(a)
	}
	return arr
}
