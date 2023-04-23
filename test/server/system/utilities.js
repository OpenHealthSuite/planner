

const dateFields = ["dateTime"]
const dateTimeFieldNormaliser = (object) => {
  // We do this because Go's ISO string for dates
  // Drops the trailing zero if there is one
  // leading to inconsistent tests
  const internalObject = structuredClone(object);
  dateFields.forEach(field => {
    if (!!internalObject[field]) {
      internalObject[field] = new Date(internalObject[field]).toISOString()
    }
  })
  return internalObject;
}

exports.dateTimeFieldNormaliser = dateTimeFieldNormaliser
