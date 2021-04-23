import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import socket from "./socket";

const state = {
  isConnected: false,
  spaces: [],
  registered: false,
  name: "",
  id: -100,
  players: [],
  pName: "",
  pID: "",
  actions: null,
  gameState: "registration",
  results: {},
  bettingTiles: [],
};

const mutations = {
  UPDATE_GAME_STATE(state, payload) {
    state.gameState = payload.game_state;
  },
  UPDATE_GAME_RESULT(state, payload) {
    state.gameState = payload.game_state;
    state.results = payload.scoring;
  },
  UPDATE_SPACES(state, payload) {
    state.spaces = payload.spaces;
  },
  UPDATE_PLAYERS(state, payload) {
    state.players = payload.Players;
  },
  UPDATE_ACTIONS(state, payload) {
    state.actions = payload.action;
  },
  UPDATE_PLAYER_INFO(state, payload) {
    state.registered = payload.registered;
    state.name = payload.name;
    state.id = payload.id;
    state.bettingTiles = payload.leg_betting_tiles;
  },
  UPDATE_TILES(state, payload) {
    state.bettingTiles = payload.leg_betting_tiles;
  },
  UPDATE_ALL(state, payload) {
    state.gameState = payload.game_state;
    state.spaces = payload.spaces;
    state.registered = payload.registered;
    state.name = payload.name;
    state.bettingTiles = payload.leg_betting_tiles;
    state.players = payload.Players;
  },
};

const actions = {
  SOCKET_connect(state) {
    state.isConnected = true;
  },

  SOCKET_disconnect(state) {
    state.isConnected = false;
  },

  SOCKET_info(context, payload) {
    const type = payload.type;
    switch (type) {
      case "all":
        context.commit("UPDATE_ALL", payload);
        break;
      case "action":
        context.commit("UPDATE_ACTIONS", payload);
        break;
      case "action-error":
        console.log(payload.error);
        break;
      case "betting-tiles":
        context.commit("UPDATE_TILES", payload);
        break;
      case "board":
        context.commit("UPDATE_SPACES", payload);
        break;
      case "game-start":
        context.commit("UPDATE_GAME_STATE", payload);
        break;
      case "game-end-result":
        context.commit("UPDATE_GAME_RESULT", payload);
        break;
      case "players":
        context.commit("UPDATE_PLAYERS", payload);
        break;
      case "registration-result":
        context.commit("UPDATE_PLAYER_INFO", payload);
        break;
      default:
        console.log(type);
    }
  },

  SOCKET_notification(content) {
    console.log(content);
  },

  SOCKET_register(content) {
    console.log(content);
  },

  sendCommand({ state }, details) {
    const command = details.command;
    details.id = state.id;
    socket.emit(command, details);
  },

  performMove({ dispatch }, params) {
    const action = params.action;
    switch (action){
      case "bet-leg":
        dispatch("legBet", params.camel);
        break;
      case "dessert":
        dispatch("sendAction", [4, params.space.id - 1, -1, "blue"]);
        break;
    }
  },

  legBet({ state, dispatch }, camel_name) {
    if (! state.bettingTiles ) {
      return;
    };
    const camel = state.bettingTiles.find(camel => camel.camel == camel_name);
    console.log(camel);
    if (camel.bet == 0) {
      console.log("All cards in this tile were taken.");
      return;
    };
    dispatch("sendAction", [1, 0, 0, camel_name]);
  },

  sendAction( { dispatch }, actions) {
    dispatch("sendCommand", {"command": "action_choice",
                             "actions": actions});
  },
};

const getters = {
  isConnected: state => state.isConnected,
};

const store = createStore({
  state,
  mutations,
  actions,
  getters,
  plugins: [createPersistedState()],
});

export default store;
