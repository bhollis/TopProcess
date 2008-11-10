function init(){
  var numProcesses = System.Gadget.Settings.read("numProcesses");
  if (numProcesses != "") {
    document.getElementById("numProcesses").value = numProcesses;
  }
  
  var updateInterval = System.Gadget.Settings.read("updateInterval");
  if (updateInterval != "") {
    document.getElementById("updateInterval").value = updateInterval;
  }
  
  var resourceType = System.Gadget.Settings.read("resourceType");
  if (resourceType != "") {
    document.getElementById("resourceType").value = resourceType;
  }
}

System.Gadget.onSettingsClosing = SettingsClosing;
function SettingsClosing(event){
  try {
  
    if (event.closeAction == event.Action.commit) {
      try {
        var numProcesses = Number(document.getElementById("numProcesses").value);
      } 
      catch (err) {
        error.innerText = badNumProcesses;
        event.cancel = true;
        return;
      }
      if (numProcesses > 0) {
        System.Gadget.Settings.write("numProcesses", numProcesses);
      }
      else {
        error.innerText = badNumProcesses;
        event.cancel = true;
        return;
      }
      
      try {
        var updateInterval = Number(document.getElementById("updateInterval").value);
        
      } 
      catch (err) {
        error.innerText = badUpdateInterval;
        event.cancel = true;
        return;
      }
      if (updateInterval > 0) {
        System.Gadget.Settings.write("updateInterval", updateInterval);
      }
            
      System.Gadget.Settings.write("resourceType", document.getElementById("resourceType").value);
    }
    else {
      error.innerText = badUpdateInterval;
      event.cancel = true;
      return;
    }
    
    event.cancel = false;
  } 
  catch (err) {
    error.innerText += err.name + " - " + err.message;
    event.cancel = true;
  }
}
