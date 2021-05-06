process.on("uncaughtException", function (error, origin) {
  // Handle the error safely
  console.log(`${error.stack}\n${error.message}`);
});
process.on("unhandledRejection", function (error, promise) {
  // Handle the error safely
  console.log(`${error.name}\n ${error.message}`);
});

test2();
function test() {
  console.log("a");
  throw "a";
  console.log("b");
}
function test2() {
  setTimeout(() => {
    console.log("d");
  }, 5000);
  test();
  console.log("c");
}

