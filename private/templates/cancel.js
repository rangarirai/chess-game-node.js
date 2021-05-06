function cancel(data) {
  const html = String.raw;
  return html`<html>
    <head>
      <title>canceled</title>
    </head>
    <body>
      <h2>deposit canceled</h2>
      <a href=${data.link}>go back to game page</a>
    </body>
  </html>`;
}
exports.cancel = cancel;
