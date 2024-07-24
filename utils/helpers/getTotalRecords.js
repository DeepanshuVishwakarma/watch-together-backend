// helpers.js
const getTotalRecords = async (model) => {
  try {
    const count = await model.countDocuments();
    return count;
  } catch (error) {
    console.error("Error counting documents:", error);
    throw error;
  }
};

module.exports = { getTotalRecords };
