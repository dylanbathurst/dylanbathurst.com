<!doctype html>
<html lang="en">
<head>
	<title>weblog</title>
	
	<link rel="stylesheet" href="/css/reset.css" type="text/css" media="screen,projection" />
	<link rel="stylesheet" href="/css/style.css" type="text/css" media="screen,projection" />
	
</head>
<body>
  <header id="branding">
    <a href="/" id="logo"><img src="/imgs/logo.png" /></a>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about/">About</a></li>
        <li><a href="/blog/">Blog</a></li>
      </ul>
    </nav>
  </header>
  <section id="content">
    {{{content}}}
  </section>
  <footer>
    <p>Awesomely Powered by <a class="nodeSmall" href="http://www.nodejs.com/">NodeJS</a></p>
    <ul id="onlinePresence">
      <li><a href="http://www.twitter.com/dylanbathurst">twitter</a></li>
      <li><a href="http://www.flickr.com/dylanbathurst">flickr</a></li>
      <li><a href="http://www.facebook.com/dylanbathurst">facebook</a></li>
      <li><a href="http://www.linkedin.com/in/dylanbathurst">linkedin</a></li>
    </ul>
  </footer>
  {{#jsFile}}
    <script type="text/javascript" src="/js/{{file}}.js"></script>
  {{/jsFile}}
</body>
</html>
