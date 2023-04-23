const { dateTimeFieldNormaliser } = require("./utilities")

test("Date Parsing goes to Equal values", () => {
  const object = {
    dateTime: "2023-04-23T18:14:37.91Z"
  }
  expect(dateTimeFieldNormaliser(object)).toEqual({ dateTime: "2023-04-23T18:14:37.910Z" })
})