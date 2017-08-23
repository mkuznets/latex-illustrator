var pdflatexexe = "pdflatex.exe";  // Add full path if necessary

// determining the local temporary directory
var tempPath = Folder.temp.fsName;  // path already in Windows syntax: c:\...
var i = tempPath.indexOf("Temporary Internet Files");
if (i >= 0) tempPath = tempPath.substr(0, i + 4);
//tempPath should now contain something like C:\Documents and Settings\<user>\Local Settings\Temp

// prompt for user input
var thisFile = new File($.fileName);  
var basePath = thisFile.path;  
var lastcodeFile = new File (basePath + "\\latex.tex");  
lastcodeFile.open("r");
var latexcode = lastcodeFile.read();
lastcodeFile.close();

var panel = new Window ("dialog", "latex2illustrator", undefined, { resizeable:true });
var textDlg = panel.add('edittext', [25, 25, 500, 300], latexcode, { multiline: true });
var renderDlg = panel.add('button', undefined, "render");
var cancelDlg = panel.add('button', undefined, "cancel");
renderDlg.onClick = function () {
    latexcode = textDlg.text;
    panel.close();

    if (latexcode != null) {
        lastcodeFile.open("w");
        lastcodeFile.write(latexcode);
        lastcodeFile.close();

        // add latex header etc. to create a complete latex document
        var latexfile = new File(tempPath + '\\latex2illustrator.tex');
        latexfile.open("w");

        var headerfile = new File(basePath + "\\header.tex");
        headerfile.open("r");
        latexfile.writeln(headerfile.read());
        headerfile.close();

        latexfile.writeln(latexcode);
        latexfile.writeln("\\end{document}");
        latexfile.close();

        var pdffile = File(tempPath + "\\latex2illustrator.pdf");
        if (pdffile.exists)
            pdffile.remove();

        // create a batch file calling latex
        var batchfile = new File(tempPath + '\\latex2illustrator.bat');
        batchfile.open("w");
        batchfile.writeln(pdflatexexe + ' -aux-directory="' + tempPath + '" -include-directory="' + tempPath + '" -output-directory="' + tempPath + '" "' + tempPath + '\\latex2illustrator.tex"');
        //batchfile.writeln('pause');
        batchfile.writeln('del "' + tempPath + '\\latex2illustrator.bat"');
        batchfile.close();
        batchfile.execute();

        for (; batchfile.exists;)
            // wait until the batch file has removed itself

            var pdffile = File(tempPath + "\\latex2illustrator.pdf");
        if (pdffile.exists) {
            // import pdf file into the current document
            var grp = app.activeDocument.activeLayer.groupItems.createFromFile(pdffile);
            // The imported objects are grouped twice. Now move the subgroup
            // items to the main group and skip the last item which is the page frame
            for (var i = grp.pageItems[0].pageItems.length; --i >= 0;)
                grp.pageItems[0].pageItems[i].move(grp, ElementPlacement.PLACEATEND);

            var last = grp.pageItems.length - 1;
            if (last >= 0 && grp.pageItems[last].typename == 'PathItem')
                grp.pageItems[last].remove();

            // Move the imported objects to the center of the current view.
            grp.translate(app.activeDocument.activeView.centerPoint[0] - grp.left, app.activeDocument.activeView.centerPoint[1] - grp.top);
        }
        else
            alert("File " + tempPath + "\\" + pdffile.name + " could not be created. LaTeX error?");
    }

}
cancelDlg.onClick = function () {
    panel.close();
}
panel.show();
