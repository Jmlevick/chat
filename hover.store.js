import Hover from "hover";

const actions = {
  toggleModal: (state, input) => {
    const newState = { ...state };
    newState.showModal = input;
    return newState;
  },
  setData: (state, type, data) => {
    const newState = { ...state };
    newState[`${type}`] = data;
    return newState;
  },
};

const initialState = {
  showModal: true,
  username: "",
  flash: null
};

export default new Hover(actions, initialState);
