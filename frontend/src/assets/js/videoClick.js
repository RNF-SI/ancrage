for (let i=1;i<=6;i++){
  var btn = document.getElementById("btn"+i);

  btn.addEventListener("click", stopVideo(i) );
  function stopVideo(i){
    var video = document.getElementById("video"+i);

    video.pause();
    video.currentTime = 0;
  }
}

var btnafter = document.getElementById("btnafter");

btnafter.addEventListener("click", stopVideoafter )
function stopVideoafter(){
  var videoafter = document.getElementById("videoafter");

     videoafter.pause();
     videoafter.currentTime = 0;
}