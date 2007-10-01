/**
 * @author Benjamin Hollis
 * 
 * Copyright 2007 Benjamin Hollis
 * See license.txt for additional license information.
 */

/**
 * @classDescription A class to hold information about individual Processes.
 * @constructor
 * @param {Number} processId
 * @param {String} name
 * @param {Number} kernelModeTime
 * @param {Number} userModeTime
 */
function ProcessInfo(processId, name, kernelModeTime, userModeTime, workingSet) {
	this.processId = processId;
	this.name = name;
	this.kernelModeTime = Number(kernelModeTime);
	this.userModeTime = Number(userModeTime);
	this.totalTime = this.kernelModeTime + this.userModeTime;
    this.workingSet = Number(workingSet);
}

function sortProcessesById(a,b) {
	return a.processId - b.processId;
}

/**
 * Sorts processes by workingSetSize
 */
function sortProcessesByMem(a,b) {
    return b.workingSet - a.workingSet;
}

/**
 * Sorts Processes by totalTime, with the largest total time first.
 */
function sortProcessesByTotalTime(a,b) {
	return b.totalTime - a.totalTime;
}

/**
 * Gets a bunch of ProcessInfos containing the processes we're interested in.
 */
function getProcessStats() {
	try {
		var oWMI = GetObject("winmgmts://./root/cimv2");
		var cItems = oWMI.ExecQuery("Select * from Win32_Process");

		var processes = [];

		var cItem = new Enumerator(cItems);
		for (; !cItem.atEnd(); cItem.moveNext())
		{
			var processId = cItem.item().ProcessId;
			var name = cItem.item().Name;
			var kernelModeTime = cItem.item().KernelModeTime;
			var userModeTime = cItem.item().UserModeTime;
            var workingSet = cItem.item().WorkingSetSize;
			
			processes.push(new ProcessInfo(processId, name, kernelModeTime, userModeTime, workingSet));
		}
		
		processes.sort(sortProcessesById);
		
		return processes;
	}
	catch (err) {
		debug.innerHTML += "getProcessStats(): " + err.description + "<br>";
		throw err;
	}
}

function findCorrespondingProcess(process, oldProcesses, startIndex) {
	try {
		var index = startIndex;
		while(index < oldProcesses.length && process.processId != oldProcesses[index].processId) {
			index++;
		}
		
		if(index > oldProcesses.length) {
			//we didn't find a new process
			return { oldProcess: null, newIndex: startIndex };
		}
		else {
			return { oldProcess: oldProcesses[index], newIndex: index+1 };
		}
	}
	catch (err) {
		debug.innerHTML += "findCorrespondingProcess(): " + err.description + "<br>";
		throw err;
	}
}

/**
 * Gets numTop processes from the process list that have the highest CPU usage.
 */
function getTopProcessesByCPU(processes, oldProcesses, numTop) {
	try {
		var systemTotalTime = new Number(0);
		
		var topProcesses = [];
		
		var oldProcessIndex = 0;
		for(var i=0; i<processes.length; i++) {
			var process = processes[i];

			var oldInfo = findCorrespondingProcess(process, oldProcesses, oldProcessIndex);
			oldProcessIndex = oldInfo.newIndex;
			var oldProcess = oldInfo.oldProcess;
			
			if(oldProcess != null) {
				process.totalTime -= (oldProcess.kernelModeTime + oldProcess.userModeTime);
			}			
			
			systemTotalTime += process.totalTime;
			
			// ignore system processes
			if(process.processId != 0)
				topProcesses.push(process);
		}
		
		topProcesses.sort(sortProcessesByTotalTime);
		
		return { topProcesses: topProcesses.slice(0,numTop),
				 totalTime: systemTotalTime }; 
	}
	catch (err) {
		debug.innerHTML += "getTopProcessesByCPU(): " + err.description + "<br>";
		throw err;
	}
}

function fade(elementId, fadeAmount) {
	var element = document.getElementById(elementId);
	
  if(!element.style.opacity)
    element.style.opacity = 1;
  
	// clamp opacity to 0..1
	element.style.opacity = Math.min(1, Math.max(0, element.style.opacity + fadeAmount));
	element.style.filter = "alpha(opacity = " + element.style.opacity * 100 + ")";

	if(element.style.opacity === 0)
		element.parentNode.removeChild(element);
	else if(element.style.opacity === 1) {
		element.style.filter = '';

		return;
	}
	else
		window.setTimeout("fade(\"" + element.id + "\"," + fadeAmount + ");", 10);
}

function updateGadgetContent(content) {
	try {
		if(!this.updateNum)
			this.updateNum = 0;
			
		this.updateNum++;
		
		var newGadgetContent = document.createElement("div");
		newGadgetContent.id = "gadgetContent" + this.updateNum;
		newGadgetContent.className = "content";
		
		newGadgetContent.innerHTML = content;
		
    if(!window.noFade) {
        newGadgetContent.style.opacity = 0;
    }
		
		processList.appendChild(newGadgetContent);
		
		document.body.style.height = newGadgetContent.offsetHeight + 10 + 11;
		updateBackground(newGadgetContent.offsetHeight + 10 + 11);
		
		if(!window.noFade) {
        fade(newGadgetContent.id, 0.10);
    }
		
		if(newGadgetContent.previousSibling && newGadgetContent.previousSibling.className === "content") {
        if(window.noFade) {
             newGadgetContent.parentNode.removeChild(newGadgetContent.previousSibling);
        }
        else {
		         fade(newGadgetContent.previousSibling.id, -0.10);
        }
		}
	}
	catch (err) {
		debug.innerHTML += "updateGadgetContent(): " + err.description + "<br>";
		throw err;
	}
}

function updateBackground(height) {
	bg.style.height = height;
	window.middle.height = height - 11 - 10;
	
	if(window.middle.height % 2 > 0)
		window.middle.height += 1;
	
	//workaround for a bug:
	window.middle.top = 11 - (300-window.middle.height)/2;
	window.footer.top = height - 10;
}

function init() {
	LoadSettings();
	window.oldProcesses = getProcessStats();
	window.updateTimer = setTimeout("update()", 500);
	
	bg.style.height = document.body.style.height;
	bg.addImageObject("images/top.png",0,0);
	window.middle = bg.addImageObject("images/middle.png",0,11);
	window.footer = bg.addImageObject("images/bottom.png",0,55); 
}

function update() {
  // Clear any other pending "update";
  clearTimeout(window.updateTimer);

	try {
    	var processes = getProcessStats();
      
      if(window.resourceType === "cpu") {
    		var topProcessInfo = getTopProcessesByCPU(processes, window.oldProcesses, window.numProcesses);			
    		window.oldProcesses = processes;
    		
    		var topProcesses = topProcessInfo.topProcesses;
    		var totalTime = topProcessInfo.totalTime;
    		var result = "";
    		for(var i = 0; i<topProcesses.length; i++) {
    			var process = topProcesses[i];		
    			var percentUsage = 	Math.round((process.totalTime / totalTime) * 10000) / 100;
    			result += "<tr" + (percentUsage > 50 ? " class=\"hotprocess\"" : "") + "><td class=\"processName\">" + process.name + "</td><td class=\"percentage\">" + percentUsage + "%<td>";
    		}
		  }
      else if(window.resourceType === "memory") {
    		processes.sort(sortProcessesByMem);
    		
        var topProcesses = processes.slice(0,window.numProcesses);
            
        var result = "";
    		for(var i = 0; i<topProcesses.length; i++) {
    			var process = topProcesses[i];	
                var memusage = process.workingSet;	
    			result += "<tr" + (memusage > 500 ? " class=\"hotprocess\"" : "") + "><td class=\"processName\">" + process.name + "</td><td class=\"memUsage\">" + formatBytes(memusage) + "<td>";
  		}
    }
        
		updateGadgetContent("<table>" + result + "</table>");
		
		window.updateTimer = setTimeout("update()", window.updateInterval);
	}
	catch (err) {
		debug.innerHTML += "update(): " + err.description + "<br>";
		throw err;
	}
}

function formatBytes(bytes) {
    if(bytes < 1024) {
        return bytes + "B";
    }
    else if(bytes < 1024*1024) {
        return Math.round((bytes / 1024)) + "KB";
    }
    else if(bytes < 1024*1024*1024) {
        return Math.round((bytes / (1024*1024))) + "MB";
    }
    else if(bytes < 1024*1024*1024*1024) {
        return Math.round((bytes / (1024*1024*1024))) + "GB";
    }
    else 
        return "Too big";
}

/* Settings */
System.Gadget.settingsUI = "Settings.html";
System.Gadget.onSettingsClosed = function() {
  LoadSettings();
  update();
};

function LoadSettings() {
	var numProcesses = System.Gadget.Settings.read("numProcesses");
	if (numProcesses != "")
		window.numProcesses = numProcesses;
	else
		window.numProcesses = 3;
		
	var updateInterval = System.Gadget.Settings.read("updateInterval");
	if (updateInterval != "")
		window.updateInterval = updateInterval * 1000;
	else
		window.updateInterval = 5000;
        
    window.noFade = System.Gadget.Settings.read("noFade");
    
    var resourceType = System.Gadget.Settings.read("resourceType");
    if(resourceType != "")
        window.resourceType = resourceType;
    else
        window.resourceType = "cpu";
    
}