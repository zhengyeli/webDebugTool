
(function() {
	'use strict';


	const BULBS = [

		/* BLE LED control module */
		{
			'filters':	[ { namePrefix: 'ihoment' } ],
			'optionalServices': ['00010203-0405-0607-0809-0a0b0c0d1910' ],

			'primaryService':{
				"service" : ['00010203-0405-0607-0809-0a0b0c0d1910'],

				'write':	{
					'service': [ '00010203-0405-0607-0809-0a0b0c0d2b11' ],
					'format':			function(data) {
						return new Uint8Array([ 0x7e, 0x07, 0x05, 0x03, r, g, b, 0x00, 0xef ]);
					}
				},
	
				'notify': {
					'service': [ '00010203-0405-0607-0809-0a0b0c0d2b10' ],
					'descriptor': 0x2902,
					'interpret': function (buffer) {
						// return { r: buffer.getUint8(7), g: buffer.getUint8(1), b: buffer.getUint8(5) }
						console.log(buffer);
					}
				}
			}


		},
		
	]


	class BluetoothBulb {
		constructor() {
			this._EVENTS = {}
			this._SERVER = null;
			this._SERVICE = null;

			this._NOTIFY_CHAR = null;
			this._WRITE_CHAR = null;

			this._DEV = null;
			this._BULB = null;
			this._TIMER = null;

			this._ONOFF = 0;
		}

		connect() {
            console.log('Requesting Bluetooth Device...');
			
            return new Promise((resolve, reject) => {
	            navigator.bluetooth.requestDevice({
		            filters: BULBS.map(i => i.filters).reduce((a, b) => a.concat(b)),
					optionalServices: BULBS.map(i => i.optionalServices).reduce((a, b) => a.concat(b))
				})
					.then(device => {
		                console.log('Connecting to GATT Server...');
						device.addEventListener('gattserverdisconnected', this._disconnect.bind(this));
						return device.gatt.connect();
					})
					.then(async server => {
						let filteredBulbs = BULBS.filter(item => {
							return item.filters.filter(filter => filter.namePrefix && server.device.name.indexOf(filter.namePrefix) === 0).length;
		                });

						for (const bulb of filteredBulbs) {
							let match = true;

							for (const optionalservice of bulb.optionalServices) {
								try {
									await server.getPrimaryService(optionalservice);
								}
								catch {;
									match = false
								}
							}
							console.log(match);
							if (match) {
								this._BULB = bulb;
								return server;
							}
						}
		            })
					.then(server => {
						this._SERVER = server;
						this._SERVER.getPrimaryService(this._BULB.primaryService.service)
						.then(service => {
							this._SERVICE = service;
							if (this._SERVICE === null){
								console.log("this._SERVICE is null");
								reject("this._SERVICE is null");
							}

							var father = this;

							if (this._BULB.primaryService.read || this._BULB.primaryService.notify) {
								if (this._BULB.primaryService.notify) {
									console.log('notify');
									this._SERVICE.getCharacteristic(this._BULB.primaryService.notify.service)
									.then(characteristic => {
										this._NOTIFY_CHAR = characteristic;
										// characteristic.getDescriptor(this._BULB.primaryService.notify.descriptor)
										// .then(descriptor => {
										// 	console.log(descriptor);
										// })
										characteristic.addEventListener(
											'characteristicvaluechanged', event => {
												father.getData(event.target.value.buffer);
											}
										)
										characteristic.startNotifications();
									})
								}
	
								if (this._BULB.primaryService.read) {
									console.log('read');
								}
	
								if (this._BULB.primaryService.write) {
									console.log('write');
									/* Send playload to trigger status update */
									this._SERVICE.getCharacteristic(this._BULB.primaryService.write.service)
										.then(characteristic => {
											this._WRITE_CHAR = characteristic;
											this._TIMER = setInterval(function () {
												// // alert("循环定时器");
												//  characteristic.writeValue(
												//  	new Uint8Array([0xaa, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xab])
												// );
												var message = Uint8Array.from([0xaa, 1]);
												father.setData(message);
											},2000);
											resolve();
										})
										.catch(error => {
											console.log('Argh! ' + error);
										});
								}
							}
		            	})
					})
		            .catch(error => {
		                console.log('Argh! ' + error);
						reject();
		            });
			})
		}

		addEventListener(e, f) {
			this._EVENTS[e] = f;
		}

		isConnected() {
			return !! this._SERVER;
		}

		get color() {
			return this._COLOR;
		}

		set color(color) {
            if (!this._SERVER) return;

			this._COLOR = color;

		    this._SERVER.getPrimaryService(this._BULB.write.service)
		    	.then(service => {
			    	return service.getCharacteristic(this._BULB.write.characteristic)
		    	})
	            .then(characteristic => {
		            var c = parseInt(color.substring(1), 16);
				    var r = (c >> 16) & 255;
				    var g = (c >> 8) & 255;
				    var b = c & 255;

					var buffer = this._BULB.write.format(r, g, b);
	                return characteristic.writeValue(buffer);
	            })
	            .catch(error => {
	                console.log('Argh! ' + error);
	            });
		} 

		getData(arrayBuffer) {
			var message = new Uint8Array(arrayBuffer);
			var head = message[0];
			var type = message[1];
			if (head == 0xaa)
			{
				
				switch (type)
				{
					case 0x01:
						this._ONOFF = message[2];
					break;
				}
			}
		}

		
		setData(data) {
			if (!this._SERVER) return;

			this._DATA = data;

			if (this._WRITE_CHAR)
			{
				return this._WRITE_CHAR.writeValue(this._getBccCode(data));
			}

			this._SERVER.getPrimaryService(this._BULB.write.service)
				.then(service => {
					return service.getCharacteristic(this._BULB.write.characteristic)
				})
				.then(characteristic => {
					var c = parseInt(color.substring(1), 16);
					var r = (c >> 16) & 255;
					var g = (c >> 8) & 255;
					var b = c & 255;

					var buffer = this._BULB.write.format(r, g, b);
					return characteristic.writeValue(buffer);
				})
				.catch(error => {
					console.log('Argh! ' + error);
				});
		}

		_disconnect() {
            console.log('Disconnected from GATT Server...');

			this._SERVER = null;
			clearInterval(this._TIMER);

			if (this._EVENTS['disconnected']) {
				this._EVENTS['disconnected']();
			}
		}

		_retrieveColor() {
			return new Promise((resolve, reject) => {
				if (this._BULB.read) {
					this._SERVER.getPrimaryService(this._BULB.read.service)
				    	.then(service => {
					    	return service.getCharacteristic(this._BULB.read.characteristic)
				    	})
			            .then(characteristic => {
				            return characteristic.readValue()
				        })
				        .then(data => {
					        resolve(this._BULB.read.interpret(data));
						})
				}

				if (this._BULB.notify) {
					this._SERVER.getPrimaryService(this._BULB.notify.listen.service)
				    	.then(service => {
					    	return service.getCharacteristic(this._BULB.notify.listen.characteristic)
				    	})
						.then(characteristic => {
							/* Start listening for status notifications */

							characteristic.addEventListener('characteristicvaluechanged', event => {
								resolve(console.log(event.target.value));
							});

							characteristic.startNotifications();

							/* Send playload to trigger status update */

							this._SERVER.getPrimaryService(this._BULB.notify.write.service)
						    	.then(service => {
							    	return service.getCharacteristic(this._BULB.notify.write.characteristic)
						    	})
					            .then(characteristic => {
									return characteristic.writeValue(
										new Uint8Array([0xAA,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0xAB])
									);
								})
					            .catch(error => {
					                console.log('Argh! ' + error);
					            });
						})
				}
			});
		}

		_rgbToHex(red, green, blue) {
			var rgb = blue | (green << 8) | (red << 16);
			return '#' + (0x1000000 + rgb).toString(16).slice(1)
		}

		// govee 产品蓝牙发送格式
		_getBccCode(data) {
			var message = Uint8Array.from({ length: 20 }).map((item, index) => {
				return 0;
			});

			for (var num = 0; num <= data.length; num++) {
				message[num] = data[num];
			}
			
			var temp = 0;
			for (var num = 0; num <= message.length; num++) {
				temp = message[num] ^ temp;
			}

			message[19] = temp;

			// console.log(message);

			return message;
		}
	}

	window.BluetoothBulb = new BluetoothBulb();
})();


