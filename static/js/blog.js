(function setupDateColorRandomizer() {
  var dates = document.getElementsByTagName('time')
      len = dates.length;

  for (var i = 0; i < len; i++) {
    var randNum1 = Math.floor(Math.random() * 256);
    var randNum2 = Math.floor(Math.random() * 256);
    var randNum3 = Math.floor(Math.random() * 256);
    dates[i].style.color = 'rgb(' + randNum1 + ',' + randNum2 + ',' + randNum3 + ')';
  }
  console.log('blog.js');
})();
