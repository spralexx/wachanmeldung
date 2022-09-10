// Wait for the DOM to be ready
$(function() {
  // Initialize form validation on the registration form.
  // It has the name attribute "registration"
  $("#username").on("focus", function(){
      $("#taken").text("");
    });
  $("form[id='registerForm']").validate({
    // Specify validation rules
    rules: {
      username: "required",
      /*
      email: {
        required: true,
        // Specify that email should be validated
        // by the built-in "email" rule
        email: true
      },
      */
      password: {
        required: true,
        minlength: 5
      }
    },
    state:"required",
    // Specify validation error messages
    messages: {
      username: "Bitte gib deine Name an.",
      password: {
        required: "Bitte gib ein Passwort an.",
        minlength: "Dein Passwort muss mindestens 5 Zeichen lang sein."
      },
//      email: "Bitte gib eine gültige E-Mail-Adresse an",
      state: "Bist du Wachhelfer oder Wachgänger?"
    },
    // Make sure the form is submitted to the destination defined
    // in the "action" attribute of the form when valid
    submitHandler: function(form) {
      form.submit();
    }
  });
});
