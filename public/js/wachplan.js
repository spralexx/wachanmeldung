function main(){
  console.log("loaded wachplan.js")
  var table=$("#mainTable");
  //console.log(table);
  $.get("/wachplandata", function(data){
    console.log(data);
  })

}
window.addEventListener("load",main);
