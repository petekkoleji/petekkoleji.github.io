

var config = {
            apiKey: "AIzaSyCcb48vfQJpGlhgQUqqqhFAF-Nnv2vKlII",
    authDomain: "petek-koleji.firebaseapp.com",
    databaseURL: "https://petek-koleji.firebaseio.com",
    projectId: "petek-koleji",
    storageBucket: "petek-koleji.appspot.com",
    messagingSenderId: "128769214183"
  };
  firebase.initializeApp(config);
var frbsdb = firebase.database().ref('/');
var frbsauth = firebase.auth();

var uiConfig = {
      signInSuccessUrl: window.location.href,
      signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID
      ],
      // Terms of service url.
      tosUrl: ''
  };

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  // The start method will wait until the DOM is loaded.
  

  function initApp () {
      firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
              // User is signed in.
              var displayName = user.displayName;
              var email = user.email;
              var emailVerified = user.emailVerified;
              var photoURL = user.photoURL;
              var uid = user.uid;
              var phoneNumber = user.phoneNumber;
              var providerData = user.providerData;
              user.getIdToken().then(function (accessToken) {
                  document.getElementById('sign-in').style.display = 'none';
                  document.getElementById('account-details').innerHTML = email + ' <img src="' + photoURL + '" >';
              });
          } else {
              // User is signed out.
              document.getElementById('sign-in').style.display = 'block';
              document.getElementById('account-details').style.display = 'none';
          }
      }, function (error) {
          console.log(error);
      });
  };

  window.addEventListener('load', function () {
      ui.start('#sign-in', uiConfig);
      initApp();
  });