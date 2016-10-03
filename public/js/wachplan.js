function main(){
  $('#wachplancal').monthly({
    weekStart: 'Mon',
    mode: 'event',
    dataType:'json',
    jsonUrl: '/wachplandata'
  });

}
window.addEventListener("load",main);
