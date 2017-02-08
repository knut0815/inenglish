
 
window.onload = createTreeRings;

function createTreeRings() {

	d3.select(window).on('resize', resizeTreeRings);

	///////////////////////////////////////////////////////////////////////////
	//////////////////////////// Set up the SVG ///////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	var divWidth = parseInt(d3.select("#viz-tree-ring").style("width"));
	var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	var size = Math.min(divWidth, windowHeight * 0.8);

	var marginScale = d3.scaleLinear()
		.domain([320, 700])
	    .range([10, 25]);

	//Sizes of the big circle
	var marginSize = Math.round(marginScale(size));
	var margin = {
	  top: marginSize*1.25,
	  right: marginSize,
	  bottom: marginSize*3,
	  left: marginSize 
	};
	var widthBig = size - margin.left - margin.right;
	var heightBig = widthBig;

	//Radius of the big chosen language circle
	var radiusBigCircle = Math.min(300, widthBig/2);

	//Radius of the smaller language circles
	var radiusSmallCircles = round2(Math.min(45, Math.max(30, divWidth/10)));

	var marginScaleMini = d3.scaleLinear()
		.domain([30, 50])
	    .range([10, 25]);

	//Sizes of the small language circles
	var marginSizeMini = Math.round(marginScaleMini(radiusSmallCircles));
	var marginMini = {
	  top: marginSizeMini + 20,
	  right: marginSizeMini,
	  bottom: marginSizeMini,
	  left: marginSizeMini 
	};
	var widthMini = 2*radiusSmallCircles;
	var heightMini = 2*radiusSmallCircles;

	///////////////////////////////////////////////////////////////////////////
	//////////////////////// Create mappings and scales ///////////////////////
	///////////////////////////////////////////////////////////////////////////

	var languageMap = [];
	languageMap["de"] = "German";
	languageMap["es"] = "Spanish";
	languageMap["fr"] = "French";
	languageMap["it"] = "Italian";
	languageMap["ja"] = "Japanese";
	languageMap["nl"] = "Dutch";
	languageMap["pl"] = "Polish";
	languageMap["pt"] = "Portugese";
	languageMap["ru"] = "Russian";
	languageMap["tr"] = "Turkish";
	languageMap["all"] = "All languages";

	var chosenLanguage = "de";
	var spaceWidth;

	var radiusScale = d3.scaleLinear()
		.domain([1,10])
		.range([radiusBigCircle, radiusBigCircle*0.1]);

	var radiusScaleSmall = d3.scaleLinear()
		.domain([1,10])
		.range([radiusSmallCircles, radiusSmallCircles * 0.2]);

	var openScale = d3.scaleLinear()
		.domain([1,3,7,10])
		.range([5,7,15,30]);

	var paddingScale = d3.scaleLinear()
		.domain([320, 750])
		.range([1.3, 1.5]);

	var bigFontScale = d3.scaleLinear()
		.domain([320, 750])
		.range([50, 80]);

	var fontScale = d3.scaleLinear()
		.domain([320, 800])
		.range([10, 20]);

	///////////////////////////////////////////////////////////////////////////
	///////////////////////////// Read the data ///////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	d3.csv('data/top10_per_language.csv', function (error, data) {

		if (error) throw error;

		//Make numeric
		data.forEach(function(d) {
			d.rank = +d.rank;
		});

		//Nest the data on the language
		var languageData = d3.nest()
			.key(function(d) { return d.language; })
			.entries(data);

		var languageIndex = [];
		languageData.forEach(function(d,i) {
			languageIndex[d.key] = i;
		});

		///////////////////////////////////////////////////////////////////////////
		/////////////////////////// Create the SVG grids //////////////////////////
		///////////////////////////////////////////////////////////////////////////

		//SVG container for the big circle
		var svgBig = d3.select("#viz-tree-ring")
			.datum(languageData.filter(function(d) { return d.key === chosenLanguage; }))
			.append("svg")
			.attr("id", "tree-ring-svg-big")
			.attr("width", widthBig + margin.left + margin.right)
			.attr("height", heightBig + margin.top + margin.bottom)
			.append("g")
				.attr("class", "tree-ring-group")
				.attr("transform", "translate(" + (margin.left + widthBig/2) + "," + (margin.top + heightBig/2) + ")")
				.style("font-size", round2(fontScale(size)) + "px")
				.each(function(d) { d.treeID = 0; });

		//Create a separate div for the small SVGs so they can be nicely positioned with flexbox
		var divMini = d3.select("#viz-tree-ring-mini").selectAll(".tree-ring-mini-div")
			.data(languageData.filter(function(d) { return d.key !== chosenLanguage; }))
			//.data(languageData)
			.enter().append("div")
			.attr("class", "tree-ring-mini-div");
		//SVG containers for the small language circles
		var svgMini = divMini.append("svg")
			.attr("class", "tree-ring-mini")
			.attr("width", widthMini + marginMini.left + marginMini.right)
			.attr("height", heightMini + marginMini.top + marginMini.bottom)
			.on("click", switchChosenLanguage)
			.append("g")
				.attr("class", function(d,i) { return "tree-ring-group tree-group-ID-" + (i+1); })
				.attr("transform", "translate(" + (marginMini.left + widthMini/2) + "," + (marginMini.top + heightMini/2) + ")")
				.style("font-size", round2(fontScale(size)) + "px")
				.each(function(d,i) { d.treeID = i+1; });

		///////////////////////////////////////////////////////////////////////////
		///////////////////////// Create the word paths ///////////////////////////
		///////////////////////////////////////////////////////////////////////////

		//Append text for the language on top
		var ringLanguage = svgMini.append("text")
			.attr("class", "ring-center-text small noselect")
			.attr("y", -radiusScaleSmall(1)*1.6)
			.attr("dy", "0.25em")
			.style("fill", "#161616")
			.text(function(d,i) { return languageMap[d.key]; });

		//Create a group for each ring
		var ring = d3.selectAll(".tree-ring-group").selectAll(".ring")
			.data(function(d,i) { return i === 0 ? d[0].values : d.values; })
			.enter().append("g")
			.attr("class", "ring")
			.each(function(d,i) { 
				d.treeID = this.parentNode.__data__.treeID;
				d.chosen = d.treeID === 0 ? 1 : 0;
				d.ringID = i;
				//Create dummy values to be able to switch languages
				d.languageD = d.language;
				d.originalD = d.original;
				d.translationD = d.translation;
			});

		//Create the path along which the text can flow later
		var ringPath = ring.append("path")
			.attr("class", "ring-path")
			.attr("id", function(d) { return "tree-" + d.treeID + "-rank-" + d.rank; })
			//.style("stroke","#d2d2d2")
			.attr("d", function(d,i) {
				var radius = d.chosen ? radiusScale(d.rank) : radiusScaleSmall(d.rank);
				var open = d.chosen ? openScale(d.rank) : 1;
				return "M" + round2(radius*Math.cos(open*Math.PI/180 + Math.PI/2)) + "," + round2(radius*Math.sin(open*Math.PI/180 + Math.PI/2)) + 
						"A" + round2(radius) + "," + round2(radius) + " 0 1,1 " + 
						round2(radius*Math.cos(-open*Math.PI/180 + Math.PI/2)) + "," + round2(radius*Math.sin(-open*Math.PI/180 + Math.PI/2));
			});

		//Add position number to the big circle
		var ranks = svgBig.append("g")
			.attr("class", "ring-rank-group");
		ranks.selectAll(".ring-rank")
			.data(d3.range(0,11))
			.enter().append("text")
			.attr("class", "ring-rank noselect")
			.attr("y", function(d) { return radiusScale(d); })
			.attr("dy", "0.5em")
			.text(function(d) { return d === 0 ? "position" : d; });

		///////////////////////////////////////////////////////////////////////////
		///////////////////////// Draw text around path ///////////////////////////
		///////////////////////////////////////////////////////////////////////////

		//Find the width of a normal space
		var space = svgBig.append("text")
			.attr("id", "space-width")
			.attr("class", "ring-text noselect")
			.style("fill", "white")
			.text('\u00A0');
		spaceWidth = round2(space.node().getComputedTextLength());
		//space.remove();

		var textWidthBold = new Array(10);
		//Create a text element for the big bold part of the main ring
		var textRingMiddle = ring.filter(function(d) { return d.treeID === 0; })
			.append("text")
			.attr("class", function(d) { return "ring-text-bold noselect rank-" + d.rank; })
			.style("fill", "none")
			.text(function(d) { return '\u00A0\u00A0' + d.translationD + '\u00A0\u00A0'; });

		//Create an SVG text element and append a textPath element for the other parts
		var textRing = ring.append("text")
			.attr("class", function(d) { return "ring-text noselect rank-" + d.rank; })
			.style("fill", "none")
			.text(function(d) { 
				return '\u00A0\u00A0' + (d.treeID === 0 ? d.originalD : d.translationD) + '\u00A0\u00A0'; 
			});

		//Create the textPaths that run in circles
		updateTextPaths(1,0,0,0);

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Switch on click /////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		function switchChosenLanguage(d) {

			//Switch the languages
			var oldLanguage = chosenLanguage;
			chosenLanguage = d.key;
			d.key = oldLanguage;

			var svgBig = d3.select("#tree-ring-svg-big").select(".tree-ring-group");
			var svgSmall = d3.select(this).select(".tree-ring-group");

			var durationTimes = [3500, 3250 ,3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250]
			var delayTimes = [0,500,950,1350,1700,2100,2350,2550,2700,2800,2850];

			//Change the top title
			d3.select("#tree-ring-language-title")
				.transition().duration(1000)
				.style("color", "white")
				.on("end", function() {
					var text = chosenLanguage !== "all" ? languageMap[chosenLanguage] : "all 10 languages combined";
					var size = chosenLanguage !== "all" ? "1.3em" : "1.2em";
					d3.select(this)
						.style("font-size", size)
						.text(text)
						.transition().duration(500)
						.style("color", "#161616");
				});

			///////////////////////////////////////////////////////////////////////////
			////////////////////// Change the small clicked circle ////////////////////
			///////////////////////////////////////////////////////////////////////////

			//Rotate the small circle that was clicked
			svgSmall.selectAll(".ring-path")
				.transition().transition().duration(4000)
				.attrTween("transform", function() {
			      return d3.interpolateString("rotate(0)", "rotate(" + (3*360) + ")");
			    });
			//In the meantime update the data in the small circle
			svgSmall.selectAll(".ring")
				.each(function(d,i) { 
					var subsetData = languageData[languageIndex[oldLanguage]].values;
					d.languageD = subsetData[i].language;
					d.originalD = subsetData[i].original;
					d.translationD = subsetData[i].translation;
				});
			//Change the top title of the small circle
			svgSmall.select(".ring-center-text")
				.transition().duration(2000)
				.style("fill", "white")
				.on("end", function() {
					d3.select(this)
						.text(languageMap[oldLanguage])
						.transition().duration(500)
						.style("fill", "#161616");
				});
			//And then update the text paths of the small circle as well
			setTimeout(function() {
				updateTextPaths(0, 0, d.treeID, 0);
			}, 2000);

			///////////////////////////////////////////////////////////////////////////
			///////////////////////// Change the big circle ///////////////////////////
			///////////////////////////////////////////////////////////////////////////

			function rotateTransition(selector, offset, extraOffset) {
				svgBig.selectAll("." + selector)
					.transition().duration(function(c) { return durationTimes[c.ringID]; })
					.delay(function(c,i) { return delayTimes[c.ringID]; })
					.attr("startOffset", function(c) { return (c[offset] + extraOffset) + "%"; });
			}//function rotateTransition

			//Rotate the texts out
			rotateTransition("circle-front", "startOffsetFront", 120);
			rotateTransition("circle-middle", "startOffsetMiddle", 120);
			rotateTransition("circle-end", "startOffsetEnd", 120);

			//Update the texts along the paths
			setTimeout(updateText, durationTimes[durationTimes.length - 1] + delayTimes[delayTimes.length - 1]);

			function updateText() {
				//Update the data of the big circle
				svgBig.selectAll(".ring")
					.each(function(d,i) {
						var subsetData = languageData[languageIndex[chosenLanguage]].values;
						d.languageD = subsetData[i].language;
						d.originalD = subsetData[i].original;
						d.translationD = subsetData[i].translation;
					});

				//Update the textPaths
				updateTextPaths(0, 1, 0, -120);

				//Move the paths back in again
				rotateTransition("circle-front", "startOffsetFront", 0);
				rotateTransition("circle-middle", "startOffsetMiddle", 0);
				rotateTransition("circle-end", "startOffsetEnd", 0);	
			}//function updateText

		}//function switchChosenLanguage

	});//d3.csv

	///////////////////////////////////////////////////////////////////////////
	///////////////////////// Do all the textPath things //////////////////////
	///////////////////////////////////////////////////////////////////////////

	function updateTextPaths(doAll, doBig, doSmall, extraOffset) {

		if(!extraOffset) extraOffset = 0;

		if(doAll) {
			var svg = d3.selectAll(".tree-ring-group");
			//Recalculate the width of a space
			spaceWidth = round2(d3.select("#space-width").node().getComputedTextLength());
		} else if (doBig) {
			var svg = d3.select("#tree-ring-svg-big").select(".tree-ring-group");
			//Update the hidden text to get the proper text widths
			svg.selectAll(".ring-text-bold")
				.text(function(d) { return '\u00A0\u00A0' + d.translationD + '\u00A0\u00A0'; });
			svg.selectAll(".ring-text:not(#space-width)")
				.style("font-family", function(d) { return d.languageD === "ru" ? "'Cormorant Infant', serif" : null; })
				.text(function(d) { return '\u00A0\u00A0' + d.originalD + '\u00A0\u00A0'; });
		} else {
			var svg = d3.select(".tree-group-ID-" + doSmall);
			//Update the hidden text to get the proper text widths
			svg.selectAll(".ring-text")
				.style("font-family", null)
				.text(function(d) { 
					return '\u00A0\u00A0' + (d.treeID === 0 ? d.originalD : d.translationD) + '\u00A0\u00A0'; 
				});
		}//else

		//Remove all the text paths, because we need to recalculate the text lengths
		svg.selectAll(".ring").selectAll("textPath").remove();

		if(doAll || doBig) {
			//Add the curved bold middle part of the big ring back in
			var textWidthBold = new Array(10);
			d3.selectAll("#tree-ring-svg-big").selectAll(".ring").select(".ring-text-bold")
				.each(function(d,i) {
			    	var el = d3.select(this);
					textWidthBold[i] = round2(this.getComputedTextLength());

					el.append("textPath")
					  	.attr("class", "circle-middle")
					  	.attr("startOffset", function(t) {
					  		t.startOffsetMiddle = 50;
					  		return (t.startOffsetMiddle+extraOffset) + "%";
					  	})
					  	.style("text-anchor","middle")
					  	.style("fill", "#161616")
						.attr("xlink:href", "#tree-" + d.treeID + "-rank-" + d.rank)
						.text(d.translationD);
				});
		}//if

		//Add the smaller text to both sides back in & the text for the smaller circles
		svg.selectAll(".ring").select(".ring-text")
		    .each(function(d,i) {
		    	var el = d3.select(this);

				//Find and save the width of one word
	        	d.textWidth = round2(this.getComputedTextLength());
	        	//Get the length of the path
		        d.pathLength = round2(document.getElementById("tree-" + d.treeID + "-rank-" + d.rank).getTotalLength());

		        if(d.chosen) {	
		        	d.textWidthBold = textWidthBold[i];
					//The offset to start the text
					var textOffset = (d.textWidthBold/d.pathLength*100/2);
					//How often does the text fit in the remaining path
					var textFit = Math.round( ((50 - textOffset)/100 * d.pathLength) / d.textWidth ) + 1;
					//console.log(textFit, d.textWidth, textWidthBold[i], d.pathLength, ((50 - textOffset)/100 ))
					
					//Add a path for the before text
		        	el.append("textPath")
						.attr("class", "ring-text-normal circle-front")
					  	.attr("startOffset", function(t) {
					  		t.startOffsetFront = round2(50 - textOffset);
					  		return (t.startOffsetFront+extraOffset) + "%";
					  	})
					  	.style("text-anchor","end")
					  	.style("fill", "#afafaf")
						.attr("xlink:href", "#tree-" + d.treeID + "-rank-" + d.rank)
						.text(new Array(textFit).join( '\u00A0\u00A0' + d.originalD + '\u00A0\u00A0' ));
					//Add a path for the after text
		        	el.append("textPath")
						.attr("class", "ring-text-normal circle-end")
					  	.attr("startOffset", function(t) {
					  		t.startOffsetEnd = round2(50 + textOffset);
					  		return (t.startOffsetEnd+extraOffset) + "%";
					  	})
					  	.style("text-anchor","start")
					  	.style("fill", "#afafaf")
						.attr("xlink:href", "#tree-" + d.treeID + "-rank-" + d.rank)
						.text(new Array(textFit).join( '\u00A0\u00A0' + d.originalD + '\u00A0\u00A0' ));
				} else {
		        	//How often does the text fit in the remaining path
		        	var textFit = Math.round( d.pathLength / (d.textWidth - 3*spaceWidth) ) + 2;
		        	//console.log(textFit, d.textWidth, 3*spaceWidth, d.pathLength);
					el.append("textPath")
						.attr("class", "ring-text-normal")
					  	.attr("startOffset", "50%")
					  	.style("text-anchor", "middle")
					  	.style("fill", "#afafaf")
						.attr("xlink:href", "#tree-" + d.treeID + "-rank-" + d.rank)
						.text(new Array(textFit).join( d.translationD + ' ' ));
		        }//else
		    });

	}//function updateTextPaths

	///////////////////////////////////////////////////////////////////////////
	////////////////////////////// Change on resize ///////////////////////////
	///////////////////////////////////////////////////////////////////////////

	function resizeTreeRings() {
		console.log("resize tree ring");

		var svgBig = d3.select("#tree-ring-svg-big").select(".tree-ring-group");
		var svgMini = d3.select("#viz-tree-ring-mini").selectAll(".tree-ring-group");

		var divWidth = parseInt(d3.select("#viz-tree-ring").style("width"));
		var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		var size = Math.min(divWidth, windowHeight * 0.8);

		//Adjust the big circle
		var marginSize = Math.round(marginScale(size));
		var margin = {
		  top: marginSize*1.25,
		  right: marginSize,
		  bottom: marginSize*3,
		  left: marginSize 
		};
		var widthBig = size - margin.left - margin.right;
		var heightBig = widthBig;

		//Update the scales of the big circle
		var radiusBigCircle = Math.min(300, widthBig/2);
		radiusScale.range([radiusBigCircle, radiusBigCircle*0.2]);

		//Adjust SVG container of the big circle
		d3.select("#tree-ring-svg-big")
			.attr("width", widthBig + margin.left + margin.right)
			.attr("height", heightBig + margin.top + margin.bottom);
		svgBig
			.attr("transform", "translate(" + (margin.left + widthBig/2) + "," + (margin.top + heightBig/2) + ")")
			.style("font-size", round2(fontScale(size)) + "px");

		//Adjust sizes of the small circles
		var radiusSmallCircles = round2(Math.min(50, Math.max(30, divWidth/10)));
		radiusScaleSmall.range([radiusSmallCircles, radiusSmallCircles * 0.2]);

		var marginSizeMini = Math.round(marginScaleMini(radiusSmallCircles));
		var marginMini = {
		  top: marginSizeMini + 20,
		  right: marginSizeMini,
		  bottom: marginSizeMini,
		  left: marginSizeMini 
		};
		var widthMini = 2*radiusSmallCircles;
		var heightMini = 2*radiusSmallCircles;

		d3.selectAll(".tree-ring-mini")
			.attr("width", widthMini + marginMini.left + marginMini.right)
			.attr("height", heightMini + marginMini.top + marginMini.bottom)
		svgMini
			.attr("transform", "translate(" + (marginMini.left + widthMini/2) + "," + (marginMini.top + heightMini/2) + ")")
			.style("font-size", round2(fontScale(size)) + "px");

		// ------------------------ Update positions and paths --------------------------- //

		//Move the position number locations of the big circle
		svgBig.selectAll(".ring-rank").attr("y", function(d) { return radiusScale(d); });

		//Update the locations of the languages above the mini circle
		svgMini.selectAll(".ring-center-text.small").attr("y", -radiusScaleSmall(1)*1.6);

		//Update the paths of the big circle
		svgBig.selectAll(".ring-path")
			.attr("d", function(d,i) {
				var radius = radiusScale(d.rank);
				var open = openScale(d.rank);
				return  "M" + round2(radius*Math.cos(open*Math.PI/180 + Math.PI/2)) + "," + round2(radius*Math.sin(open*Math.PI/180 + Math.PI/2)) + 
						"A" + round2(radius) + "," + round2(radius) + " 0 1,1 " + 
						round2(radius*Math.cos(-open*Math.PI/180 + Math.PI/2)) + "," + round2(radius*Math.sin(-open*Math.PI/180 + Math.PI/2));
			});

		//Update the paths of the small circles
		svgMini.selectAll(".ring-path")
			.attr("d", function(d,i) {
				var radius = radiusScaleSmall(d.rank);
				var open = 1;
				return  "M" + round2(radius*Math.cos(open*Math.PI/180 + Math.PI/2)) + "," + round2(radius*Math.sin(open*Math.PI/180 + Math.PI/2)) + 
						"A" + round2(radius) + "," + round2(radius) + " 0 1,1 " + 
						round2(radius*Math.cos(-open*Math.PI/180 + Math.PI/2)) + "," + round2(radius*Math.sin(-open*Math.PI/180 + Math.PI/2));
			});

		// -------- Recalculate the number of words needed to fill all the circles ------- //

		updateTextPaths(1, 0, 0, 0);

	}//resizeTreeRings

}//function createTreeRings 

///////////////////////////////////////////////////////////////////////////
/////////////////////////// Extra functions ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

//Round number to 2 behind the decimal
function round2(num) {
	return (Math.round((num + 0.00001) * 100)/100);
}//round2

//Function to only run once after the last transition ends
function endall(transition, callback) { 
	var n = 0; 
	transition 
		.each(function() { ++n; }) 
		.each("end", function() { if (!--n) callback.apply(this, arguments); }); 
}//endall



