var debugMode=1; //boolean to enable debugmode

function main(){
  debugLog("loaded client.js");
}


function debugLog(msg){
  if(debugMode){
    console.log(msg);
  }
}

window.addEventListener("load", main);
