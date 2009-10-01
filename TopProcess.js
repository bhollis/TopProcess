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
	this.kernelModeTime = Number(kernelModeTime || 0) ;
	this.userModeTime = Number(userModeTime || 0);
	this.totalTime = this.kernelModeTime + this.userModeTime;
  this.workingSet = Number(workingSet || 0);
}

function sortProcessesById(a,b) {
  try {
    var aVal = a ? a.processId : -100;
    var bVal = b ? b.processId : -100;
    return aVal - bVal;
  } catch (e) {
    var message = '';
    if (a)
      message += 'a:' + a.name + ' - ';
      
    if (b)
      message += 'b:' + b.name + ' - ';
   
    
    log("sortProcessesById: " + message + e.message);  
      
    throw message + e.message;
  }
}

/**
 * Sorts processes by workingSetSize
 */
function sortProcessesByMem(a,b) {
  try {
    var aVal = a ? a.workingSet : -100;
    var bVal = b ? b.workingSet : -100;
    return bVal - aVal;
  } catch (e) {
    var message = '';
    if (a)
      message += 'a:' + a.name + ' - ';
      
    if (b)
      message += 'b:' + b.name + ' - ';
      
    log("sortProcessesByMem: " + message + e.message);
    
    throw message + e.message;
  }
}

/**
 * Sorts Processes by totalTime, with the largest total time first.
 */
function sortProcessesByTotalTime(a,b) {
	try {
    var aVal = a ? a.totalTime : -100;
    var bVal = b ? b.totalTime : -100;
    return bVal - aVal;
  } catch (e) {
    var message = '';
    if (a)
      message += 'a:' + a.name + ' - ';
      
    if (b)
      message += 'b:' + b.name + ' - ';
      
    log("sortProcessesByTotalTime: " + message + e.message);
    
    throw message + e.message;
  }
}

function log(content) {
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var s = fso.OpenTextFile(System.Gadget.path + "\\gadget.log", 8, true);

  s.WriteLine(new Date() + ": " + content);
  s.Close();
}


/**
 * Gets a bunch of ProcessInfos containing the processes we're interested in.
 */
function getProcessStats() {
	try {
    var oWMI = GetObject("winmgmts://./root/cimv2");
		var cItems = oWMI.ExecQuery("Select processid, name, kernelmodetime, usermodetime, workingsetsize from Win32_Process");

		var processes = [];

		var cItem = new Enumerator(cItems);
		for (; !cItem.atEnd(); cItem.moveNext())
		{
      var item = cItem.item();
			var processId = item.ProcessId;
      
      if (!processId && processId !== 0) {
        processId = -1;
      }
      
			var name = item.Name;
			var kernelModeTime = item.KernelModeTime;
			var userModeTime = item.UserModeTime;
      var workingSet = item.WorkingSetSize;
			
      processes.push(new ProcessInfo(processId, name, kernelModeTime, userModeTime, workingSet));
		}
		
		return processes;
	}
	catch (err) {
    log("getProcessStats: " + err);
		throw err;
	}
}

// I'm using "startIndex" to search the array in spurts, instead of re-scanning over and over
// BUG: 'processId' is null or not an object getTopProcessesbycpu
function findCorrespondingProcess(process, oldProcesses, startIndex) {
	try {
		var index = startIndex;
		while(index < oldProcesses.length && oldProcesses[index] && process.processId != oldProcesses[index].processId) {
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
    log("findCorrespondingProcess: " + err);
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

      if ( !process || process.processId == null || process.totalTime == null) {
        continue;
      }

      var oldInfo;
      try {
		    oldInfo = findCorrespondingProcess(process, oldProcesses, oldProcessIndex);
	    }
      catch(ex) {        
        log("findCorrespondingProcess cpu: " + err);
		    throw err;
      }
      
      oldProcessIndex = oldInfo.newIndex;
			var oldProcess = oldInfo.oldProcess;
			
			if(oldProcess && oldProcess.kernelModeTime != null && oldProcess.userModeTime != null) {
        // Find the delta in time since the last sample (don't use totalTime on oldProcess, it's already been deltafied)
				process.totalTime -= (oldProcess.kernelModeTime + oldProcess.userModeTime);
			}			
			
			systemTotalTime += process.totalTime;
			
			// ignore system processes
			if( process.processId )
				topProcesses.push(process);
		}
		
    try {
      topProcesses.sort(sortProcessesByTotalTime);
    }
    catch(ex) {
      log("sortProcessesByTotalTime(): " + err);
		  throw err;
    }
		
    // TODO: Replace sort / slice with more efficient thing? http://en.wikipedia.org/wiki/Selection_algorithm#
		return { topProcesses: topProcesses.slice(0,numTop),
				 totalTime: systemTotalTime }; 
	}
	catch (err) {
    log("getTopProcessesByCPU(): " + err);
		throw err;
	}
}

// TODO: Maybe this can be made faster?
function updateGadgetContent(content) {
	try {
		if(!this.updateNum)
			this.updateNum = 0;
			
		this.updateNum++;
		
		var newGadgetContent = document.createElement("div");
		newGadgetContent.id = "gadgetContent" + this.updateNum;
		newGadgetContent.className = "content";
		
		newGadgetContent.innerHTML = content;
		
		processList.appendChild(newGadgetContent);
		
		document.body.style.height = newGadgetContent.offsetHeight + 10 + 11;
		updateBackground(newGadgetContent.offsetHeight + 10 + 11);
		
		if(newGadgetContent.previousSibling && newGadgetContent.previousSibling.className === "content") {
      newGadgetContent.parentNode.removeChild(newGadgetContent.previousSibling);
		}
	}
	catch (err) {
    log("updateGadgetContent(): " + err);
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
  log("Starting");
	LoadSettings();
	window.oldProcesses = getProcessStats();
  window.oldProcesses.sort(sortProcessesById);
	window.updateTimer = setTimeout("update()", 500);
	
	bg.style.height = document.body.style.height;
	bg.addImageObject("images/top.png",0,0);
	window.middle = bg.addImageObject("images/middle.png",0,11);
	window.footer = bg.addImageObject("images/bottom.png",0,55); 
}

function reset() {
  log("RESETTING");
	window.oldProcesses = getProcessStats();
  window.oldProcesses.sort(sortProcessesById);
	window.updateTimer = setTimeout("update()", 500);
}

function update() {
  // Clear any other pending "update";
  clearTimeout(window.updateTimer);

  var result = "";
  try {
    var processes = getProcessStats();
    
    if(!processes) {
      log("processes was null from getProcessStats");
      throw "processes was null from getProcessStats"
    }    
    
    if (window.resourceType === "cpu") {
      try {
        processes.sort(sortProcessesById);
      } 
      catch (prob) {
        log("failed sorting by id: " + prob);
        throw "sorting: " + prob;
      }
      var topProcessInfo = getTopProcessesByCPU(processes, window.oldProcesses, window.numProcesses);
      window.oldProcesses = processes;
      
      try {
        var topProcesses = topProcessInfo.topProcesses || [];
        var totalTime = topProcessInfo.totalTime;
        for (var i = 0; i < topProcesses.length; i++) {
          var process = topProcesses[i];
          if ( !process || process.processId == null) {
            continue;
          }
          var percentUsage = Math.round((process.totalTime / totalTime) * 10000) / 100;
          result += '<tr><td class="processName">' + process.name + '</td><td class="percentage">' + percentUsage.toFixed(2) + "%<td>";
        }
      } catch (prob) {
        log("failed getting process time: " + prob.message);
        throw "output: " + prob.message;
      }
    }
    else 
      if (window.resourceType === "memory") {
        try {
          processes.sort(sortProcessesByMem);
        } 
        catch (prob) {
          log("failed sorting memory: " + prob.message);
          throw "sorting: " + prob.message;
        }
        
        var topProcesses = processes.slice(0, window.numProcesses);
        
        try {
          for (var i = 0; i < topProcesses.length; i++) {
            var process = topProcesses[i];
            if ( !process || process.processId == null) {
              continue;
            }
            var memusage = process.workingSet;
            result += '<tr><td class="processName">' + process.name + '</td><td class="memUsage">' + formatBytes(memusage) + "<td>";
          }
        } catch (prob) {
          log("failed getting working set: " + prob.message);
          throw "output: " + prob.message;
        }
      }
    
    updateGadgetContent("<table>" + result + "</table>");
    
    window.updateTimer = setTimeout("update()", window.updateInterval);
  } 
  catch (err) {
    log("update: " + err);
    reset();
  }
}

function formatBytes(bytes) {
    if(bytes < 1024) {
        return bytes + "B";
    }
    else if(bytes < 1048576 /*1024*1024*/) {
        return Math.round(bytes / 1024) + "KB";
    }
    else if(bytes < 1073741824 /*1024*1024*1024*/) {
        return Math.round(bytes / 1048576) + "MB";
    }
    else if(bytes < 1099511627776 /*1024*1024*1024*1024*/) {
        return Math.round(bytes / 1073741824) + "GB";
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
	window.numProcesses = numProcesses || 3;
	log("numProcesses: " + window.numProcesses);	
    
	var updateInterval = System.Gadget.Settings.read("updateInterval");
	window.updateInterval = Math.max((updateInterval || 0) * 1000, 3000);
	log("updateInterval: " + window.updateInterval);	
    
  var resourceType = System.Gadget.Settings.read("resourceType");
  window.resourceType = resourceType || "cpu";
	log("resourceType: " + window.resourceType);	
}