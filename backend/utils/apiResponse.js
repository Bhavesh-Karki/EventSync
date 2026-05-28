// ========================================
// API RESPONSE NORMALIZER - utils/apiResponse.js
// ========================================
// Ensures API responses always include `id` (string) for MongoDB documents
// so the frontend can use .id consistently (works with both file storage and MongoDB)
// ========================================

/**
 * Normalize a single document for API response (add id from _id)
 * @param {object} doc - Mongoose document or plain object
 * @returns {object} - Plain object with id field
 */
function normalizeDoc(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id != null && obj.id == null) {
    obj.id = obj._id.toString ? obj._id.toString() : String(obj._id);
  }
  return obj;
}

/**
 * Normalize an array of documents for API response
 * @param {Array} arr - Array of Mongoose documents or plain objects
 * @returns {Array} - Array of plain objects with id field
 */
function normalizeList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeDoc);
}

module.exports = { normalizeDoc, normalizeList };
