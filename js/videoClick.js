var btn1 = document.getElementById("btn1");
console.log(btn1)
btn1.addEventListener("click", stopVideo1 )
function stopVideo1(){
  var video1 = document.getElementById("video1");
  console.log(video1)
     video1.pause();
     video1.currentTime = 0;
}
var btn2 = document.getElementById("btn2");
console.log(btn2)
btn2.addEventListener("click", stopVideo2 )
function stopVideo2(){
  var video = document.getElementById("video2");
  console.log(video2)
     video2.pause();
     video2.currentTime = 0;
}
var btn3 = document.getElementById("btn3");
console.log(btn3)
btn3.addEventListener("click", stopVideo3 )
function stopVideo3(){
  var video3 = document.getElementById("video3");
  console.log(video3)
     video3.pause();
     video3.currentTime = 0;
}
var btn5 = document.getElementById("btn5");
console.log(btn5)
btn5.addEventListener("click", stopVideo5 )
function stopVideo5(){
  var video5 = document.getElementById("video5");
  console.log(video5)
     video5.pause();
     video5.currentTime = 0;
}
var btn6 = document.getElementById("btn6");
console.log(btn6)
btn6.addEventListener("click", stopVideo6 )
function stopVideo6(){
  var video6 = document.getElementById("video6");
  console.log(video6)
     video6.pause();
     video6.currentTime = 0;
}
var btnafter = document.getElementById("btnafter");
console.log(btnafter)
btnafter.addEventListener("click", stopVideoafter )
function stopVideoafter(){
  var videoafter = document.getElementById("videoafter");
  console.log(videoafter)
     videoafter.pause();
     videoafter.currentTime = 0;
}