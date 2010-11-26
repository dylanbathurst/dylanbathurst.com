{{#list}}
  {{#loop}}
    {{>./blog/post.html}}
  {{/loop}}
{{/list}}
{{#empty}}
  <p>Where'd my posts go?!</p>
{{/empty}}
