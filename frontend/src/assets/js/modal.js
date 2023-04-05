 // Get the modal
 var modal = document.getElementById('id01');
 var login = document.getElementById('login');
 var psw = document.getElementById('psw');
 login.addEventListener("click", function(){
   if(psw.value == 'ANCRAGE'){
     location.href = 'ancrage.html'
     
   }
 })
 var signup = document.getElementById('signup');
 signup.addEventListener("click", function(){
     location.href = 'https://forms.gle/eTW2ucpWURhyw74v9'
 })
 
 // When the user clicks anywhere outside of the modal, close it
 window.onclick = function(event) {
   if (event.target == modal) {
     modal.style.display = "none";
   }
 }