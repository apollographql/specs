document.write(`
  <style>
    body {
      background: rgb(6, 15, 47);
      color: rgb(178, 185, 195);
      font-size: 18px;
    }

    main[markdown] {
      white-space: pre-line;
      font-family: monospace;
      max-width: 920px;
      margin: auto;
    }

    #view {
      display: flex;
      justify-content: center;
      flex-flow: row nowrap;
    }
  </style>
  <style id=__curtain__>
    body {
      opacity: 0;
      transition: opacity 1s;
    }
  </style>  
  <script async defer type=module src=/main.js></script>
`)

setTimeout(() => __curtain__.remove(), 200)