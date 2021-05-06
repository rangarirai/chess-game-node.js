function success(data) {
  const html = String.raw;
  return html`<html>
    <head>
      <title>success</title>
    </head>
    <body>
      <h2>deposit was successful</h2>
      <a href=${data.link}>go back to game page</a>
    </body>
  </html>`;
}

exports.success = success;
