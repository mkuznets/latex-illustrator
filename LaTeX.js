var pdflatexexe="pdflatex.exe";  // Add full path if necessary

// determining the local temporary directory
var temppath=Folder.temp.fsName;  // path already in Windows syntax: c:\...
var i=temppath.indexOf("Temporary Internet Files");
if(i>=0) temppath=temppath.substr(0,i+4);
//temppath should now contain something like C:\Documents and Settings\<user>\Local Settings\Temp

// remember the last user input in a text file
var lastcode="$$"
var lastcodefile=File(temppath+"\\latex2illustrator_lastcode.txt");
if(lastcodefile.exists)
  {
  lastcodefile.open("r");
  lastcode=lastcodefile.read();
  lastcodefile.close();
  }

// prompt for user input
var latexcode=prompt("Please enter LaTeX code",lastcode,"LaTeX");
if(latexcode!=null)
  {
  lastcodefile.open("w");
  lastcodefile.write(latexcode);
  lastcodefile.close();

  // add latex header etc. to create a complete latex document
  var latexfile=new File(temppath+'\\latex2illustrator.tex');
  latexfile.open("w");
  latexfile.writeln("\\documentclass{standalone}");
  // add or remove additional latex packages here
  latexfile.writeln("\\usepackage{amsmath}");
  latexfile.writeln("\\usepackage{amssymb}");
  latexfile.writeln("\\usepackage{gensymb}");   // for \degree
  latexfile.writeln("\\usepackage{textcomp}");  // for \textdegree
  latexfile.writeln("\\usepackage{bm}");        // bold math
  latexfile.writeln("\\begin{document}");
  latexfile.writeln("\\pagestyle{empty}"); // no page number
  latexfile.writeln(latexcode);
  latexfile.writeln("\\end{document}");
  latexfile.close();

  var pdffile=File(temppath+"\\latex2illustrator.pdf");
  if(pdffile.exists)
     pdffile.remove();

  // create a batch file calling latex
  var batchfile=new File(temppath+'\\latex2illustrator.bat');
  batchfile.open("w");
  batchfile.writeln(pdflatexexe+' -aux-directory="'+temppath+'" -include-directory="'+temppath+'" -output-directory="'+temppath+'" "'+temppath+'\\latex2illustrator.tex"');
  //batchfile.writeln('pause');
  batchfile.writeln('del "'+temppath+'\\latex2illustrator.bat"');
  batchfile.close();
  batchfile.execute();

  for(; batchfile.exists; )
  // wait until the batch file has removed itself

  var pdffile=File(temppath+"\\latex2illustrator.pdf");
  if(pdffile.exists)
    {
    // import pdf file into the current document
    var grp=app.activeDocument.activeLayer.groupItems.createFromFile(pdffile);
    // The imported objects are grouped twice. Now move the subgroup
    // items to the main group and skip the last item which is the page frame
    for( var i=grp.pageItems[0].pageItems.length; --i>=0; )
     grp.pageItems[0].pageItems[i].move(grp,ElementPlacement.PLACEATEND);

    var last = grp.pageItems.length - 1;
    if (last >= 0 && grp.pageItems[last].typename == 'PathItem')
        grp.pageItems[last].remove();

    // Move the imported objects to the center of the current view.
    grp.translate(app.activeDocument.activeView.centerPoint[0]-grp.left, app.activeDocument.activeView.centerPoint[1]-grp.top);
    }
  else
    alert("File "+temppath+"\\"+pdffile.name+" could not be created. LaTeX error?");
  }

//grp.pageItems.removeAll();

//var targetDoc=app.activeDocument;
//var tempDoc=open(File(temppath));
//var objs=tempDoc.activeLayer.pageItems;
//for(var i=0; i<objs.length; i++)
//     objs[i].selected=true;
//var docSelected=tempDoc.selection;
//for(var i=0; i<docSelected.length; i++)
//    {
//    docSelected[i].selected=false;
//    newItem=docSelected[i].duplicate(targetDoc,ElementPlacement.PLACEATEND);
//    }
//tempDoc.saved=true;
//tempDoc.close();
