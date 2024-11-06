const { makeid, getKey, setkey } = require("../utils/utils");
const Player = require("../models/Player");

const {
  state,
  publicRoom,
  userSocketMap,
  tokenMiddleware,
  gameName,
  sleep,
  userLeave,
  getRoomLobbyUsers,
  getRoomUsers,
  joinRoom,
  arraymove,
  getKeyWithMinValue,
  defaultRolletValue,
} = require("./JoinRoom");
const Tournament = require("../models/Tournament");
const TambolaGame = require("../game/tomblagame");
const DragonTigerGame = require("../game/dragontiger");
const AviatorGame = require("../game/aviator");
const RolletGame = require("../game/rollet");
const TeenpattiGame = require("../game/teenpatti");
const LudoGame = require("../game/ludo");

let io;

let onConnection = (socket) => {
  console.log("contedt", socket.id);

  socket.on("associateUserId", (d) => {
    let dataParsed = d; // JSON.parse(d);
    let { userId } = dataParsed;
    // Store the mapping in the userSocketMap
    userSocketMap[userId]["socket_id"] = socket.id;
  });

  // Function to update and emit the number of clients in the room
  const updateRoomCount = () => {
    io.in(roomName).clients((error, clients) => {
      if (!error) {
        numberOfClients = clients.length;
        console.log("---------->numberOfClients", numberOfClients);
        io.to(roomName).emit("roomCount", { numberOfClients }); // Moved inside the callback
        publicRoom[lobbyId]["playerCount"] = numberOfClients; // Update player count
      }
    });
  };

  socket.on("join", async (d) => {
    try {
      console.log("join", d);
      let dataParsed = d; // JSON.parse(d);
      let { userId, lobbyId, maxp = 4, role = "player" } = dataParsed;
      let lobby = await Tournament.findById(lobbyId).lean();
      if (!lobby) {
        console.log("looby-not-found");
        return;
      }

      let roomName = "";
      // Check if the room exists with space for players; otherwise, create a new room
      if (
        publicRoom[lobbyId] &&
        publicRoom[lobbyId]["playerCount"] < maxp &&
        !publicRoom[lobbyId]["played"]
      ) {
        roomName = publicRoom[lobbyId]["roomName"];
        console.log("join-exisitng", roomName);
      } else {
        roomName = makeid(5);
        publicRoom[lobbyId] = { roomName, playerCount: 0, played: false };
        state[roomName] = {
          created: Date.now() + 600000,
          players: [],
          betList: [],
          status: "open",
          codeObj: null,
          messages: [],
        };
        console.log("create-room-", roomName);
      }

      // Check if the user is already in a room and remove them from it
      if (userSocketMap[userId]) {
        const playerRoom = userSocketMap[userId].room;
        console.log(playerRoom, roomName, userSocketMap);
        if (playerRoom === roomName) {
          console.log("not registering");
          return;
        } else {
          socket.leave(playerRoom);
          userLeave({ userId, room: playerRoom });
        }
      }

      console.log("---------->room", roomName);
      // Join the room
      joinRoom(socket, userId, roomName, dataParsed);
      socket.join(roomName);

      let numberOfClients = 0;

      // Emit the count immediately upon joining
      updateRoomCount();

     

      // Send initial data to client
      let data = {
        roomName,
        users: getRoomLobbyUsers(roomName, lobbyId),
        userId: userId,
      };
      if (state[roomName]) {
        publicRoom[lobbyId]["playerCount"] = state[roomName].players.length;
        // if (data.users.length == maxp || data.users.length == 0) {
        //   delete publicRoom[lobbyId];
        // }
      } else {
        // delete publicRoom[lobbyId];
      }
      if (d.role === "influencer") {
        // io.emit('influencer_matches', { ev: 'lobbyStat', lobbyId, 'total': publicRoom[lobbyId]['total'], 'count': publicRoom[lobbyId]['count'] });
        const validIds = Object.entries(userSocketMap)
          .filter(([playerId, user]) => user.role === "influencer")
          .map(([userId, user]) => user.lobbyId);

        let influencers = await Tournament.find({
          _id: { $in: validIds },
          tournamentType: "influencer",
        }).populate("influencerId", "displayName");

        setkey("influencer_matches", influencers);
        io.emit("influencer_matches", { influencers });
      }

      switch (lobby.mode) {
        case gameName.ludo:
          if (!state[roomName]["codeObj"]) {
            state[roomName]["codeObj"] = new LudoGame(
              io,
              roomName,
              maxp,
              lobby
            );
            state[roomName]["codeObj"].setupGame();
          }

          state[roomName]["codeObj"].syncPlayer(socket, d);
          socket.emit("join", {
            ...d,
            gameType: gameName.ludo,
            room: roomName,
            status: "success",
            numberOfClients,
          });
          state[roomName]["codeObj"].emitJoinPlayer();
          break;
        case gameName.tambola:
          if (!state[roomName]["codeObj"]) {
            state[roomName]["codeObj"] = new TambolaGame(
              io,
              roomName,
              maxp,
              lobby
            );
            //state[roomName]['codeObj'].setupGame();
          }

          state[roomName]["codeObj"].syncPlayer(socket, d);
          socket.emit("join", {
            ...d,
            gameType: gameName.tambola,
            room: roomName,
            status: "success",
            numberOfClients,
          });
          break;
        case gameName.dragon_tiger:
          if (!state[roomName]["codeObj"]) {
            state[roomName]["codeObj"] = new DragonTigerGame(
              io,
              roomName,
              maxp,
              lobby
            );
          }

          state[roomName]["codeObj"].syncPlayer(socket, d);
          socket.emit("join", {
            ...d,
            gameType: gameName.dragon_tiger,
            room: roomName,
            status: "success",
            numberOfClients,
          });
          break;
        case gameName.crash:
          if (!state[roomName]["codeObj"]) {
            state[roomName]["codeObj"] = new AviatorGame(
              io,
              roomName,
              maxp,
              lobby
            );
          }
          state[roomName]["codeObj"].syncPlayer(socket, d);
          socket.emit("join", {
            ...d,
            gameType: gameName.crash,
            room: roomName,
            status: "success",
            numberOfClients,
          });
          break;
        case gameName.rouletee:
          if (!state[roomName]["codeObj"]) {
            state[roomName]["codeObj"] = new RolletGame(
              io,
              roomName,
              maxp,
              lobby
            );
          }
          state[roomName]["codeObj"].syncPlayer(socket, d);
          socket.emit("join", {
            ...d,
            gameType: gameName.rouletee,
            room: roomName,
            status: "success",
            numberOfClients,
          });
          break;
        case gameName.teen_patti:
          io.to(roomName).emit("res", { ev: "join", data });
          if (!state[roomName]["codeObj"]) {
            state[roomName]["codeObj"] = new TeenpattiGame(
              io,
              roomName,
              maxp,
              lobby
            );
            state[roomName]["codeObj"].setupGame();
          }

          state[roomName]["codeObj"].syncPlayer(socket, d);
          socket.emit("join", {
            ...d,
            gameType: gameName.ludo,
            room: roomName,
            status: "success",
            numberOfClients,
          });
          state[roomName]["codeObj"].emitJoinPlayer();

          break;
      }
    } catch (error) {
      console.log("error-join", error);
    }
  });

  socket.on("lobbyStat", (d) => {
    let { userId, lobbyId } = d; //JSON.parse(d);
    let cnt = 0;
    let total = 0;
    if (publicRoom[lobbyId]) {
      let rn = publicRoom[lobbyId]["roomName"];
      if (state[rn]) {
        cnt = publicRoom[lobbyId]["count"] = state[rn].players.length;
      }
    }
    io.emit("res", {
      ev: "lobbyStat",
      lobbyId,
      total: total,
      count: cnt,
    });
  });
  socket.on("sendToRoom", (d) => {
    let { room, ev, data } = d; //JSON.parse(d);
    console.log("sendToRoom", data);
    io.to(room).emit("res", { ev, data });
  });
  socket.on("influencer_join", (d) => {
    let { room } = d; //JSON.parse(d);

    state[room]["codeObj"].continueGame = true;
    state[room]["codeObj"].handleInfluencerJoin(socket);
  });
  socket.on("influencer_leave", (d) => {
    let { room } = d; //JSON.parse(d);
    state[room]["codeObj"].handleInfluencerLeave(socket);
  });

  socket.on("setGameId", async (d) => {
    let { room, lobbyId } = d; //JSON.parse(d);
    if (state[room]) {
      state[room]["betList"] = defaultRolletValue();
    }

    let data = {
      gameId: makeid(5),
      lobbyId,
    };
    console.log("setGameId", data);
    io.in(room).emit("res", { ev: "setGameId", data });
  });

  //leave
  socket.on("leave", (d) => {
    try {
      let { room, userId } = d;
      userLeave(d);
      socket.leave(room);
      let data = {
        room: room,
        userId,
        users: getRoomUsers(room),
      };
      console.log("leave-", d, data);
      io.to(room).emit("res", { ev: "leave", data });
    } catch (error) {}
  });

  //chat_message
  socket.on("chat_message", (d) => {
    let { room } = d;
    console.log(d);
    if (state[room].messages.length >= 100) {
      state[room].messages.shift(); // Remove the oldest message to maintain the limit
    }
    state[room].messages.push({ firstName: d.firstName, message: d.message });
    io.in(room).emit("chat_message", d);
  });
  socket.on("gift_message", (d) => {
    let { room } = d;
    console.log("gift_message", d);
    if (state[room].messages.length >= 100) {
      state[room].messages.shift(); // Remove the oldest message to maintain the limit
    }
    state[room].messages.push({ firstName: d.firstName, message: d.message });
    io.in(room).emit("gift_message", d);
  });
  socket.on("influencer_matches", (d) => {
    const influencers = getKey("influencer_matches");
    console.log("influencer_matches", influencers);
    io.to(socket.id).emit("influencer_matches", { influencers });
  });
  socket.on("emoji_message", (d) => {
    let { room } = d;
    console.log("emoji_message", d);
    if (state[room].messages.length >= 100) {
      state[room].messages.shift(); // Remove the oldest message to maintain the limit
    }
    state[room].messages.push({ firstName: d.firstName, message: d.message });
    io.in(room).emit("emoji_message", d);
  });
  socket.on("list_message", (d) => {
    let { room } = d;
    io.in(socket.id).emit("list_message", { messages: state[room].messages });
  });

  // Track client disconnections
  socket.on("disconnect", () => {
    console.log("disconnect-event");

    try {
      let { room, userId, lobbyId } = socket;

      // Remove the user from userSocketMap
      delete userSocketMap[userId];

      // Perform necessary actions when the user leaves
      userLeave(socket);

      // Prepare data for broadcasting to the room
      const data = {
        room,
        users: getRoomUsers(room),
        userId,
      };

      console.log("disconnect-", room, userId, lobbyId);

      // Handle any game-specific leave actions
      if (state[room] && userId) {
        state[room].codeObj.handlePlayerLeave(socket, { PlayerID: userId });
      }

      // Broadcast the disconnect event to the room
      io.to(room).emit("res", { ev: "disconnect", data });

      // Update and emit the room count after the user leaves
      updateRoomCount();
    } catch (error) {
      console.log("error-disconnect", error);
    }
  });

  socket.on("error", (err) => {
    console.error("---> Socket error:", err);
  });

  // Runs when client disconnects
  socket.on("gameStart", async (d) => {
    let { room = "", lobbyId = "", userId = "" } = d;
    console.log("gameStart-", d);

    let data = {
      room: room,
      users: getRoomLobbyUsers(room, lobbyId),
      lobbyId,
      userId: userId,
    };
    //start game Withb boat
    if (publicRoom[lobbyId]) {
      let rn = publicRoom[lobbyId]["roomName"];
      if (rn == room) {
        publicRoom[lobbyId]["played"] = true;
      }
    }
    io.to(socket.room).emit("res", { ev: "gameStart", data });
  });
  //move user
  socket.on("moveuser", (d) => {
    let { room, userId, action } = d; //JSON.parse(d);
    if (state[room]) {
      const index = state[room].players.findIndex(
        (user) => user.userId === userId
      );
      let toIndex;
      if (action === "win") {
        toIndex = index - 1;
      } else {
        toIndex = index + 1;
      }
      arraymove(state[room].players, index, 1);
    }

    let data = {
      room: room,
      users: getRoomUsers(room),
    };
    io.to(room).emit("res", { ev: "moveuser", data });
  });
  //set game state
  socket.on("setGameData", (d) => {
    let { room, gameData } = d; //JSON.parse(d);
    let data = {
      room: room,
      gameData: {},
    };
    if (state[room]) {
      state[room]["gameData"] = gameData;
      data["gameData"] = gameData;
    }

    console.log("setGameData", data);
    io.to(room).emit("res", { ev: "setGameData", data });
  });
  socket.on("setWinListData", (d) => {
    let { room, WinList } = d; //JSON.parse(d);
    let data = { room: room, WinList: {} };
    if (state[room]) {
      state[room]["WinList"] = WinList;
      data["WinList"] = d;
    }

    console.log("setWinListData", data);
    io.to(room).emit("res", { ev: "setWinListData", data });
  });
};

const setupSocket = (ioInstance) => {
  io = ioInstance;
  io.use(tokenMiddleware);
  io.on("connection", onConnection);
};
module.exports = { setupSocket };
