  <article>
    <header>  
      <h1><a href="/blog/{{postId}}/">{{bodyTitle}}</a></h1>
      <time datetime="{{date.cleanDate}}" pubdate>{{date.styledDate}}</time>
      {{#empty}}
        <article>{{{body}}}</article>
      {{/empty}}
    </header>
    <section>
    </section>
  </article>
