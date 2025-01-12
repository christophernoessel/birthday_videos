{
 // One second import.jsx
 // Run from After Effects with no project open
 // it will create a new project, import the videos into a folder
 // and create a new comp with the videos trimmed
    function OneSecondImport() {
     var scriptName = "One Second Import";
        compHeight = 1080;
        compWidth = 1920;
        // Ask the user for a folder whose contents are to be imported.
        var targetFolder = Folder.selectDialog("Import items from folder...");
        if (targetFolder != null) {
            // If no project open, create a new project to import the files into.
            if (!app.project) {
                app.newProject();
            }
            function importSafeWithError(importOptions) {
                try {
                    var importedFile = app.project.importFile(importOptions);
                } catch (error) {
                    alert(error.toString() + importOptions.file.fsName, scriptName);
                }
                return importedFile;
            }
            function processFile(theFile) {
                try {
                    var importOptions = new ImportOptions(theFile);
                    var importedFile = importSafeWithError(importOptions);
                } catch (error) {}
                return importedFile;
            }
            var importFolder = app.project.items.addFolder("1s videos");
            var files = targetFolder.getFiles();
            var numFiles = 0;
            for (index in files) {
                if (files[index] instanceof File) {
                 if (files[index].displayName == '.DS_Store') {
                  continue;
                 }
                    var importedFile = processFile(files[index]);
                    importedFile.parentFolder = importFolder;
                    numFiles++;
                }
            }
            // create a new composition
            var OneSecondComp = app.project.items.addComp("videos as single seconds", compWidth, compHeight, 1.0, 1 * numFiles, 29.97);
            // drop footage into layers
            for (var i = 1; i <= app.project.numItems; i++) {
             thisItem = app.project.item(i);
             if (thisItem.parentFolder == importFolder) {
                    writeLn(i);
                    writeLn(thisItem);
                    var thisLayer = OneSecondComp.layers.add(thisItem);
                    writeLn(thisLayer);
                    //crop its time to one second
                    thisLayer.inPoint = 0;
                    thisLayer.outPoint = 1;
                    // scale it to screen size
                     var this_h = thisItem.height;
                     var this_w = thisItem.width ;
                     var fit_h_scale = (compHeight / this_h) * 100;
                     var fit_w_scale = (compWidth  / this_w) * 100;
                     var newScale = [0,0];
                     if (this_h > this_w){
                     newScale = [fit_h_scale, fit_h_scale];
                    } else {
                     newScale = [fit_w_scale, fit_w_scale];
                    }
                    thisLayer.property("scale").setValue(newScale);
                    // mute it
                    thisLayer.audioEnabled = false;
                    // move it to a sequential position
                    thisLayer.startTime = i;
                }
            }
        }
    }
    OneSecondImport();
}