function main(){
  $('#wachplancal').monthly({
    weekStart: 'Mon',
    mode: 'event',
    dataType:'json',
    jsonUrl: '/wachplandata',
    monthNames:["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
    dayNames:["So","Mo","Di","Mi","Do","Fr","Sa","So"],
    eventList:false
  });

}
window.addEventListener("load",main);
