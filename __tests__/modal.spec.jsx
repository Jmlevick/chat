import React from "react";
import { shallow } from "enzyme";
import Modal from "../components/modal";
import PouchDBClient from "../pouchdb.client";

let wrapper = null;


beforeEach(() => {
  wrapper = shallow(<Modal />);
  const PouchClient = new PouchDBClient();
  wrapper.instance().pouchDB = PouchClient;
});

test("modal closes after click on close button", (done) => {
  const closeBtn = wrapper.find("#modal-closeBtn");
  const closeModalMock = jest.fn();
  wrapper.instance().closeModal = closeModalMock;
  wrapper.update();
  closeBtn.simulate("click");
  expect(closeModalMock.mock.calls.length).toEqual(1);
  done();
});

test("input changes trigger inputEvtHandler method", () => {
  const sampleInput = wrapper.find("#modal-username");
  const changeMock = jest.fn();
  wrapper.instance().inputEvtHandler = changeMock;
  wrapper.update();
  sampleInput.simulate("change");
  expect(changeMock.mock.calls.length).toEqual(1);
});


test("submit triggers sendData", () => {
  const submitBtn = wrapper.find("#modal-component__form");
  const submitMock = jest.fn();
  wrapper.instance().sendData = submitMock;
  wrapper.update();
  submitBtn.simulate("submit");
  expect(submitMock.mock.calls.length).toEqual(1);
});
