	var divWidth = parseInt(d3.select("#viz-word-snake").style("width"));
	var margin = {
	  top: 10,
	  right: 10,
	  bottom: 10,
	  left: 10 
	};
	var width = divWidth - margin.left - margin.right;
	var height = width;

	//SVG container for the big circle
	var svg = d3.select("#viz-word-snake").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")");

	var darkgrey = "#161616",
		middlegrey = "#a7a7a7",
		lightgrey = "#afafaf";

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

	///////////////////////////////////////////////////////////////////////////
	//////////////////////////// Read in the data /////////////////////////////
	///////////////////////////////////////////////////////////////////////////

	d3.queue() 
	  .defer(d3.csv, "data/top1_per_language_English_combined.csv")
	  .defer(d3.csv, "data/top100_overall.csv")
	  .await(drawWordSnake);

	function drawWordSnake(error, top1, top100Overall) {

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Final data prep /////////////////////////////
		///////////////////////////////////////////////////////////////////////////
		
		if (error) throw error;
		
		var wordDummy = svg.append("text")
			.attr("id", "word-length-dummy")
			.attr("class", "circle-path-text noselect")
			.style("position","absolute")
			.style("fill", "white")
			.text("");

		top100Overall.forEach(function(d,i) {
			d.rank = +d.rank;
			//d.totalWord = (i+1) + " " + d.translation + "\u00A0\u00A0";
			d.totalWord = d.translation + "\u00A0\u00A0";
			//Need to know the width of each word
			wordDummy.text(d.totalWord);
			d.textLength = round2(document.getElementById("word-length-dummy").getComputedTextLength());
		});

		top1.forEach(function(d) {
			d.frequency = +d.frequency;
		});

		var rScale = d3.scaleSqrt()
			.domain(d3.extent(top1, function(d) { return d.frequency; }))
			.range([50,70]);

		///////////////////////////////////////////////////////////////////////////
		////////////////////////////// Create nodes ///////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		//How many circles fir in one "row"
		var angle = 35 * Math.PI/180;
		var radius = 70;
		var numCircle = Math.round(width / (2*radius));
		//If it's not an exact fit, make it so
		radius = round2( ( width/(numCircle + 0.5) )/2 );
		//Save the x-locations if each circle

		var xLoc = new Array(numCircle + 2);
		for(var i = 0; i<=numCircle; i++){
			xLoc[i] = round2( radius + i * radius); 
		}//for i
		
		var xLoc = new Array(numCircle);
		for(var i = 0; i<numCircle; i++){
			xLoc[i] = round2( (1 + 2*i) * radius * Math.cos(angle)); 
		}//for i
		var xLocArc = new Array(numCircle+1);
		for(var i = 0; i<=numCircle; i++){
			xLocArc[i] = round2(2*i * radius * Math.cos(angle)); 
		}//for i


		var nodes = [];

		top1.forEach(function(d,i) {
			//Are there more original words for this translation?
			var words = d.original.split(" | ");
			nodes.push({
				rank: i,
				frequency: d.frequency,
				radius: radius,
				translation: d.translation,
				original: d.original,
				language: languageMap[d.language],
				originalMore: words.length > 1,
				counter: 0,
				originalSeparate: words
			})
		});

		///////////////////////////////////////////////////////////////////////////
		///////////////////////////// Create the nodes ////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		var nodeWrapper = svg.append("g").attr("class", "node-wrapper");

		//Create a group for each circle
		var pos = 0, add = 1;
	  	var node = nodeWrapper.selectAll(".node")
			.data(nodes)
	    	.enter().append("g")
	        .attr("class", "node")
	        .attr("transform", function(d,i) { 
	        	//Save the locations
	        	d.x = xLoc[pos];
        		d.y = (1 + 2*i) * radius * Math.sin(angle);

        		//Figure out which position of the xLoc to use on the next one
        		if(pos === numCircle-1) {
	        		add = -1;
	        	} else if (pos === 0) {
	        		add = 1;
	        	}
	        	pos = pos + add;

        		return "translate(" + d.x + "," + d.y + ")";
        	});

		///////////////////////////////////////////////////////////////////////////
		//////////////////////// Create the central words /////////////////////////
		///////////////////////////////////////////////////////////////////////////

	    //Attach center words to each group
		var originalText = node.append("text")
	    	.attr("class", "circle-center-original")
	    	.attr("y", 0)
	    	.attr("dy", "0.35em")
	    	.style("fill", darkgrey)
	    	.style("font-family", function(d) { return d.language === "Russian" ? "'Cormorant Infant', serif" : null; })
	    	.text(function(d) { return d.originalSeparate[0]; });
	   	node.append("text")
	    	.attr("class", "circle-center-translation")
	    	.attr("y", 22)
	    	.attr("dy", "0.35em")
	    	.style("fill", "#787878")
	    	.text(function(d) { return d.translation; });
	    node.append("text")
	    	.attr("class", "circle-center-language")
	    	.attr("dy", "0.35em")
	    	.attr("y", -25)
	    	.style("fill", lightgrey)
	    	.text(function(d) { return d.language; });

		var t = d3.interval(loopWords, 4500);
		function loopWords() {
			//For the languages that have multiple variants in the original, loop through the words
	   		originalText.filter(function(d) { return d.originalMore; })
	   			.transition().duration(500).delay(function(d) { return Math.random() * 800; })
	   			.style("opacity", 0)
	   			.on("end", function() {
	   				d3.select(this)
		   			.text(function(d) { 
		   				d.counter = (d.counter + 1) % d.originalSeparate.length;
		   				return d.originalSeparate[d.counter]; 
		   			})
		   			.transition().duration(1500 + Math.random()*500)
	   				.style("opacity", 1);
	   			});

		}//loopWords

		///////////////////////////////////////////////////////////////////////////
		////////////////////// Create the outer circular paths ////////////////////
		///////////////////////////////////////////////////////////////////////////

		var xLocArc = new Array(numCircle+1);
		for(var i = 0; i<=numCircle; i++){
			xLocArc[i] = round2(2*i * radius * Math.cos(angle)); 
		}//for i

	    //Create path
	    var pos = 0, add = 1, finalY;
	    svg.append("path")
	    	.attr("class", "circle-path")
	    	.attr("id", "circle-word-path")
	    	//.style("stroke", "#d2d2d2")
	    	.style("fill", "none")
	    	.attr("d", function(d) {

	    		var path = "M" + 0 + ",0 ";

	    		var xOld = 0, 
	    			yOld = 0,
	    			sweep = 0,
	    			largeArc = 0;

	    		for(var i = 1; i <= nodes.length; i++) {
	    			//Figure out which position of the xLocArc to use on the next one
	        		if(pos === numCircle) { add = -1; } 
	        		else if (pos === 0) { add = 1; }
		        	pos = pos + add;
		        	x = xLocArc[pos];

		        	y = yOld + round2( 2 * radius * Math.sin(angle) );

	    			path = path + " A" + radius + "," + radius + " 0 0," + sweep + " " + x + "," + y + " ";
	    			xOld = x;
	    			yOld = y;
	    			sweep = sweep ? 0 : 1;

	    			//For when the direction needs to change
		        	if(i !== 1 && (i-1)%(numCircle-1) === 0) {
		        		sweep = sweep ? 0 : 1;
		        		if(numCircle%2 === 1) largeArc = largeArc ? 0 : 1; //3 or 5 circles in a row

		        		//Figure out which position of the xLocArc to use on the next one
		        		if(pos === numCircle) { add = -1; } 
		        		else if (pos === 0) { add = 1; }
			        	pos = pos + add;
			        	x = xLocArc[pos];

		        		y = yOld;
			        	path = path + " A" + radius + "," + radius + " 0 " + largeArc + "," + sweep + " " + x + "," + y + " ";
		    			xOld = x;
		    			yOld = y;
		    			sweep = sweep ? 0 : 1;
		        	}//if

	    		}//for i

	    		finalY = yOld;

	    		return path;
	    	});

		//Adjust the height of the SVG
		height = finalY;
		d3.select("#viz-word-snake svg").attr("height", height + margin.top + margin.bottom);
		
	   	//Create text on path
	    svg.append("text")
			.attr("class", "circle-path-text noselect")
			.style("fill", "none")
			.append("textPath")
			  	.style("text-anchor","start")
			  	.style("fill", lightgrey)
				.attr("xlink:href", "#circle-word-path")
				.text(top100Overall.map(function(d){ return d.translation; }).join("\u00A0\u00A0"));

	};//function drawWordSnake

