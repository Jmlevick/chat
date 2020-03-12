import React from "react";
import { shallow } from "enzyme";
import Chat from "../components/chat";

test("modal opens after click on config button", () => {
  const wrapper = shallow(<Chat />);
  const configBtn = wrapper.find("#chat-configBtn");
  const openModalMock = jest.fn();
  wrapper.instance().openModal = openModalMock;
  wrapper.update();
  configBtn.simulate("click");
  expect(openModalMock.mock.calls.length).toEqual(1);
});
