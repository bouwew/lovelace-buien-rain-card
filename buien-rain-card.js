/*
Luke Vink 2020
www.lukevink.com

August 2020, Edited a bit by @spudje
Included chartjs-plugin-annotation.js version: 0.5.7 at the bottom
*/

import * as Chart from './Chart.min.js';
import * as ChartAnnotation from './chartjs-plugin-annotation.min.js';

Chart.plugins.register([ChartAnnotation]); // Global


class RainCard extends HTMLElement {

	constructor() {
		super();
		this.attachShadow({
			mode: 'open'
		});
	}
	
	
	setConfig(config) {


		const root = this.shadowRoot;
		if (root.lastChild) root.removeChild(root.lastChild);

		var cardIcon;
		const cardConfig = Object.assign({}, config);
		if (!cardConfig.icon) cardIcon = 'mdi:weather-rainy';
		if (cardConfig.icon) cardIcon = cardConfig.icon
		// Amsterdam by Default
		if (!cardConfig.long) cardConfig.long = '4.899431';
		if (!cardConfig.lat) cardConfig.lat = '52.377956';
		if (!cardConfig.fillColor) cardConfig.fillColor = "rgba(0, 150, 255, 0.21)";
		if (!cardConfig.lineColor) cardConfig.lineColor = "#0096ff";


		function hexToRgb(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}

		const animatedYet = false;
		const card = document.createElement('ha-card');
		const content = document.createElement('div');
		const style = document.createElement('style');
		const icon = document.createElement('ha-icon');
		const [prefix, type] = cardIcon.split('.', 2);
		['png', 'jpg', 'svg', 'gif'].includes(type) ? icon.src = cardIcon : icon.icon = cardIcon;

		style.textContent =	`
          ha-card {
            position: relative;
            ${cardConfig.style}
          }
          ha-icon {
            position: absolute;
            top: 15px;
            right: 40px;
          }
          #container {
            padding: 20px 30px 10px 20px;
          }
        `;
		content.id = 'container';
		card.header = cardConfig.title;
		card.appendChild(content);
		card.appendChild(style);
		if (cardConfig.icon) card.appendChild(icon);
		root.appendChild(card);
		
		this.update_interval = config.update_interval || 20;
		this.lat = config.lat;
		this.long = config.long;
		this.lineColor = config.lineColor;
		this.fillColor = config.fillColor;
		this._config = cardConfig;
		
		this.result = [];
		this.time = ["12:00", "12:05", "12:10", "12:15", "12:20", "12:25", "12:30", "12:35", "12:40", "12:45", "12:50", "12:55", "13:00", "13:05", "13:10", "13:15", "13:20", "13:25", "13:30", "13:35", "13:40", "13:45", "13:50", "13:55"];
		this.rainfall = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		this.drawGraph = true;

		// @spudje: Setting a scaleMax to make the max Y-Axis value scale more nicely
		if (typeof this.scaleMax === 'undefined') {
			this.scaleMax = 2.5;
		}
		
		// @spudje: Config extended with annotations to make the graph look more like buienalarm
		// @spudje: using suggestedMax: this.scaleMax to define max y-axis value to make it scale better
		this.initconfig = {
			type: 'line',
			data: {
				labels: this.time,
				datasets: [{
					label: "Rain",
					borderColor:  this._config.lineColor,
					backgroundColor:  this._config.fillColor,
					borderWidth: 1,
					fill: true,
					data: this.rainfall
				}]
			},
			options: {
				tooltipTemplate: "<%if (label){%><%=label %>: <%}%><%= value + ' %' %>",
				tooltips: {
					intersect: false,
					custom: function(tooltip) {
						if (!tooltip) return;
						// disable displaying the color box;
						tooltip.displayColors = false;
					},
					callbacks: {
						label: function(tooltipItem, data) {
							var label = data.datasets[tooltipItem.datasetIndex].label || '';

							if (label) {
								label += ': ';
							}
							label += tooltipItem.yLabel.toFixed(2);
							return label;
						}
					}
				},
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				legend: {
					display: false
				},
				elements: {
					point: {
						radius: 0
					}
				},
				annotation: {
					drawTime: 'afterDatasetsDraw',
					annotations: [{
							type: 'line',
							mode: 'horizontal',
							scaleID: 'y-axis-0',
							value: 25,
							borderColor: 'white',
							borderWidth: 1,
							label: {
								enabled: true,
								content: 'zwaar',
								position: 'right',
								fontSize: 10,
								xPadding: 3,
								yPadding: 3
							}
						}, 	{
							type: 'line',
							mode: 'horizontal',
							scaleID: 'y-axis-0',
							value: 5,
							borderColor: 'white',
							borderWidth: 1,
							label: {
								enabled: true,
								content: 'matig',
								position: 'right',
								fontSize: 10,
								xPadding: 3,
								yPadding: 3
							}
						}, {
							type: 'line',
							mode: 'horizontal',
							scaleID: 'y-axis-0',
							value: 0.1,
							borderColor: 'white',
							borderWidth: 1,
							label: {
								enabled: true,
								content: 'licht',
								position: 'right',
								fontSize: 10,
								xPadding: 3,
								yPadding: 3
							}
						}]
				},
				scales: {
					xAxes: [{
						gridLines: {
							display: true
						},
						ticks: {
							autoSkip: true,
							maxTicksLimit: 6,
							maxRotation: 0,
							display: "bottom",
							mirror: false,
						}
					}],
					yAxes: [{
						gridLines: {
							display: false
						},
						afterTickToLabelConversion: function(scaleInstance) {
							// set the first and last tick to null so it does not display
							// note, ticks[0] is the last tick and ticks[length - 1] is the first
							scaleInstance.ticks[scaleInstance.ticks.length - 1] = null;
							// need to do the same thing for this similiar array which is used internally
							//scaleInstance.ticksAsNumbers[scaleInstance.ticksAsNumbers.length - 1] = null;
						},
						ticks: {
							suggestedMax: this.scaleMax,
							min: 0,
							beginAtZero: true,
							stepSize: 1,
							mirror: false,
						}
					}]
				}
			}
		}

		this.style.display = 'block';
		root.getElementById('container').innerHTML = '<canvas id="rainchart"></canvas>';

		this.initGraph(root.getElementById('rainchart').getContext('2d'));
		
	}

	set hass(hass) {

		const config = this._config;
		const root = this.shadowRoot;
		

		root.lastChild.hass = hass;

	}

	initGraph(element) {

		var _this = this;

		// 			console.log(rainfall);
		// 			console.log(time);
		
		var originalLineDraw = Chart.controllers.line.prototype.draw;
		Chart.helpers.extend(Chart.controllers.line.prototype, {
			draw: function() {
				originalLineDraw.apply(this, arguments);

				var chart = this.chart;
				ctx = chart.chart.ctx;

				if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
					var activePoint = this.chart.tooltip._active[0];
					var ctx = this.chart.ctx;
					var x = activePoint.tooltipPosition().x;
					var topY = this.chart.scales['y-axis-0'].top;
					var bottomY = this.chart.scales['y-axis-0'].bottom;

					// draw line
					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, topY);
					ctx.lineTo(x, bottomY);
					ctx.lineWidth = 0.5;
					ctx.strokeStyle = '#eeeeee';
					ctx.stroke();
					ctx.restore();
				}
			}
		});
		

		if(this.drawGraph){
		
			this.ctx = element;
			this.chart = new Chart(this.ctx, this.initconfig);

			setTimeout(function() {
				_this.updateGraph();
				}, 100);
			setInterval(function() {
				_this.updateGraph();
			}, this.update_interval * 1000);
			this.drawGraph = false;
		}
		

	}



	getData() {
		
		
		var _this = this;

		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://gpsgadget.buienradar.nl/data/raintext?lat=" + this.lat + "&lon=" + this.long);
//		xhr.open("GET", "https://gpsgadget.buienradar.nl/data/raintext?lat=51.5888&lon=4.77602");
		xhr.onreadystatechange = function() {
			if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				_this.decodeString(xhr.response, "|", "\n");
			}
		}
		xhr.send();
	}
	

	decodeString(str, variable_sep, line_endings) {

		// 		console.log('Decode String');
		this.rainfall = [];
		this.time = [];

		var lines = str.split(line_endings);
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var variables = line.split(variable_sep);

			if (variables[1] != null) {
				if (variables[0] == "000") {
					this.rainfall.push(0);
				} else {
				this.rainfall.push(Math.pow(10, ((parseInt(variables[0]) - 109) / 32)));
				}
				this.time.push(variables[1]);
			}
		}

		// @spudje: Update scaleMax based on actual rain data
		if (typeof(this.rainfall) !== 'undefined') {
			this.scaleMax = Math.max(Math.max.apply(Math, this.rainfall),2.5);
		}
		else {
			this.scaleMax = 2.5;
		}
		
				
				this.chart.data = {
					labels: this.time,
					datasets: [{
						label: "Rain",
						borderColor: this.lineColor,
						backgroundColor: this.fillColor,
						fill: true,
						data: this.rainfall
					}]
				}
				this.chart.update();

		
// 			if(this.chart.data.labels != this.time){
/*
				this.chart.data.labels = this.time;
				this.chart.data.datasets[0].data = this.rainfall;
				this.chart.update();
*/
// 			}

	}


	updateGraph() {

		this.getData();

	}




	getCardSize() {
		return 1;
	}
}

customElements.define('buien-rain-forecast', RainCard);

console.info(
  `%cBUIEN-RAIN-CARD\n%cVersion: 0.0.5_bouwew`,
  "color: green; font-weight: bold;",
  ""
);
