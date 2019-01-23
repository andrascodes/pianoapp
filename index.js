const express = require("express");
const path = require("path");
const socketIO = require("socket.io");

const PORT = process.env.SERVER_PORT || process.env.PORT;

const app = express();
const server = require("http").Server(app);
const io = socketIO(server);

app.use(express.static("public"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

const KEYS = ["C", "D", "E", "F", "G", "A", "B", "C#", "D#", "F#", "G#", "A#"];

const state = {
  key: undefined,
  listening: true,
  streak: 0
};

const getRandomKey = currentKey => {
  const eligibleKeys = KEYS.filter(key => key !== currentKey);
  return eligibleKeys[Math.floor(Math.random() * eligibleKeys.length)];
};

io.on("connection", socket => {
  console.log("a user connected");
  state.key = getRandomKey(state.key);
  io.emit("prompt", { text: state.key });

  socket.on("press", data => {
    if (state.listening === true) {
      state.listening = false;

      console.log("press received", data);

      const pressedKey = data.key;
      const wrongKey = pressedKey !== state.key ? pressedKey : null;
      if (wrongKey !== null) {
        state.streak = 0;
      } else {
        state.streak++;
      }

      io.emit("press", {
        right: state.key,
        wrong: wrongKey,
        streak: `${state.streak}`
      });

      // wait a bit
      setTimeout(() => {
        state.key = getRandomKey(state.key);
        io.emit("prompt", { text: state.key });
        state.listening = true;
      }, 3000);
    }
  });
});

server.listen(PORT, () => console.log(`App is running on: ${PORT}`));
