function LinesToLabels() {
    // Check if there's an active composition
    var activeComp = app.project.activeItem;
    if (!activeComp || !(activeComp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    // Check for Globals layer or create it
    var globalsLayer = activeComp.layer("Globals");
    if (!globalsLayer) {
        // Create new adjustment layer named "Globals"
        globalsLayer = activeComp.layers.addSolid([0,0,0], "Globals", activeComp.width, activeComp.height, 1);
        globalsLayer.adjustmentLayer = true;
    }

    // Add or verify required effects
    var effects = {
        "opacityMax": 100,
        "fadeInDuration": 0.50,
        "fadeOutDuration": 0.50,
        "millisPerCharacter": 50
    };

    for (var effectName in effects) {
        var effect = globalsLayer.effect(effectName);
        if (!effect) {
            var newEffect = globalsLayer.Effects.addProperty("ADBE Slider Control");
            newEffect.name = effectName;
            newEffect.property("Slider").setValue(effects[effectName]);
        }
    }

    // Prompt user to select a text file
    var textFile = File.openDialog("Select a text file", "*.txt");
    if (!textFile) return;

    // Open and read the file
    textFile.open("r");
    var fileContent = textFile.read();
    textFile.close();

    // Check if this might be an RTF file
    if (fileContent.indexOf("\\rtf1") !== -1) {
        alert("Please use a plain text (.txt) file, not an RTF file.");
        return;
    }

    // Split into lines and clean them
    var lines = fileContent.split(/\r?\n/);  // Split on newline, handling both Unix and Windows
    var cleanLines = [];
    
    // Process lines
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s+|\s+$/g, ''); // Trim
        if (line) {
            cleanLines.push(line);
        }
    }

    // Create a new text layer
    var textLayer = activeComp.layers.addText("Captions");
    
    // Process each line, adding empty markers in between
    for (var i = 0; i < cleanLines.length; i++) {
        // Add commented marker at i*3 seconds (0, 3, 6, etc.)
        var marker = new MarkerValue(cleanLines[i]);
        textLayer.marker.setValueAtTime(i * 3, marker);
        
        // Add empty marker 2 seconds after each commented marker
        var emptyMarker = new MarkerValue("");
        textLayer.marker.setValueAtTime((i * 3) + 2, emptyMarker);
    }

    // Add the expression to the Source Text property
    var sourceTextExpression = 'txt = \'\';\nn = 0;\nif (marker.numKeys > 0){\n  n = marker.nearestKey(time).index;\n  if (marker.key(n).time > time) n--;\n  if (n > 0) txt = marker.key(n).comment;\n}\ntxt';
    textLayer.sourceText.expression = sourceTextExpression;

    // Add the opacity expression
var opacityExpression = 
'var myOpacity = 0;\n' +
'try {\n' +
'    var debug = false;\n' +
'    var currentTime = time;\n' +
'    var numMarkers = thisLayer.marker.numKeys;\n' +
'    \n' +
'    // Get globals\n' +
'    var globalsLayer = thisComp.layer("Globals");\n' +
'    var opacityMax = globalsLayer.effect("opacityMax")("Slider").value;\n' +
'    var fadeInDuration = globalsLayer.effect("fadeInDuration")("Slider").value;\n' +
'    var fadeOutDuration = globalsLayer.effect("fadeOutDuration")("Slider").value;\n' +
'    var millisPerCharacter = globalsLayer.effect("millisPerCharacter")("Slider").value;\n' +
'    \n' +
'    // Find current marker\n' +
'    var markerTime = 0;\n' +
'    var priorMarkerStart = 0;\n' +
'    var currentMarkerIndex = 0;\n' +
'    \n' +
'    for (var i = 1; i <= numMarkers; i++) {\n' +
'        var thisMarkerTime = thisLayer.marker.key(i).time;\n' +
'        if (thisMarkerTime <= currentTime) {\n' +
'            markerTime = thisMarkerTime;\n' +
'            currentMarkerIndex = i;\n' +
'            if (i > 1) {\n' +
'                priorMarkerStart = thisLayer.marker.key(i - 1).time;\n' +
'            }\n' +
'        } else break;\n' +
'    }\n' +
'    \n' +
'    // Calculate timing\n' +
'    var timeInMarker = currentTime - markerTime;\n' +
'    var fullyInBy = fadeInDuration;\n' +
'    var numberOfCharacters = thisLayer.text.sourceText.length;\n' +
'    var dynamicDisplayLength = numberOfCharacters * (millisPerCharacter/1000);\n' +
'    var displayAtMaxUntil = fullyInBy + dynamicDisplayLength;\n' +
'    var fullyOutBy = displayAtMaxUntil + fadeOutDuration;\n' +
'    \n' +
'    // Calculate opacity\n' +
'    if (currentTime < thisLayer.marker.key(1).time) {\n' +
'        myOpacity = 0;\n' +
'    } else if (timeInMarker >= 0 && timeInMarker < fadeInDuration) {\n' +
'        var percentageToFull = timeInMarker/fullyInBy;\n' +
'        myOpacity = opacityMax * percentageToFull;\n' +
'    } else if (timeInMarker < displayAtMaxUntil) {\n' +
'        myOpacity = opacityMax;\n' +
'    } else if (timeInMarker >= displayAtMaxUntil && timeInMarker < fullyOutBy) {\n' +
'        var percentageToFull = 1 - ((timeInMarker-displayAtMaxUntil)/fadeOutDuration);\n' +
'        myOpacity = opacityMax * percentageToFull;\n' +
'    }\n' +
'} catch(err) {\n' +
'    //do nothing. I know this probably ought to do more, but meh. \n' +
'}\n' +
'myOpacity;\n';
    
    textLayer.transform.opacity.expression = opacityExpression;
}

// Run the function
LinesToLabels();