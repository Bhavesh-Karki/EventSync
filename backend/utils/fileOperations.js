// ========================================
// CUSTOM MODULE - utils/fileOperations.js
// ========================================
// This demonstrates:
// 1. Custom module creation using module.exports
// 2. File System (fs) module usage
// 3. Path module usage
// 4. Callbacks, Promises, and Async/Await patterns
// 5. Error handling with try-catch
// ========================================

// Using Node.js built-in File System module for file operations
const fs = require('fs');

// Using Node.js built-in Path module for path operations
const path = require('path');

// Define data directory path using path.join
const DATA_DIR = path.join(__dirname, '../data');
const LOGS_DIR = path.join(__dirname, '../logs');

// ========================================
// CALLBACK PATTERN EXAMPLE
// ========================================
/**
 * Write data to file using CALLBACK pattern
 * Demonstrates traditional Node.js callback pattern
 * @param {string} filename - Name of the file
 * @param {object} data - Data to write
 * @param {function} callback - Callback function (err, result)
 */
function writeFileCallback(filename, data, callback) {
    // Using path.join to construct file path safely
    const filePath = path.join(DATA_DIR, filename);
    
    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2);
    
    // Using fs.writeFile with callback (demonstrates callback pattern)
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
        if (err) {
            // Error occurred during file write
            return callback(err, null);
        }
        // Success - file written
        callback(null, { success: true, path: filePath });
    });
}

// ========================================
// PROMISE PATTERN EXAMPLE
// ========================================
/**
 * Write data to file using PROMISE pattern
 * Demonstrates modern Promise-based approach
 * @param {string} filename - Name of the file
 * @param {object} data - Data to write
 * @returns {Promise} - Promise that resolves with result
 */
function writeFilePromise(filename, data) {
    // Returning a Promise (demonstrates Promise pattern)
    return new Promise((resolve, reject) => {
        const filePath = path.join(DATA_DIR, filename);
        const jsonData = JSON.stringify(data, null, 2);
        
        // Using fs.writeFile inside Promise
        fs.writeFile(filePath, jsonData, 'utf8', (err) => {
            if (err) {
                reject(err); // Reject promise on error
            } else {
                resolve({ success: true, path: filePath }); // Resolve on success
            }
        });
    });
}

// ========================================
// ASYNC/AWAIT PATTERN EXAMPLE
// ========================================
/**
 * Write data to file using ASYNC/AWAIT pattern
 * Demonstrates modern async/await approach with fs.promises
 * @param {string} filename - Name of the file
 * @param {object} data - Data to write
 * @returns {Promise} - Promise that resolves with result
 */
async function writeFileAsync(filename, data) {
    // Using try-catch for error handling (demonstrates error handling)
    try {
        const filePath = path.join(DATA_DIR, filename);
        const jsonData = JSON.stringify(data, null, 2);
        
        // Using fs.promises.writeFile with async/await (modern approach)
        await fs.promises.writeFile(filePath, jsonData, 'utf8');
        
        return { success: true, path: filePath };
    } catch (error) {
        // Catching and re-throwing error for caller to handle
        throw new Error(`Failed to write file: ${error.message}`);
    }
}

// ========================================
// READ FILE OPERATIONS
// ========================================
/**
 * Read data from file using ASYNC/AWAIT
 * @param {string} filename - Name of the file to read
 * @returns {Promise} - Promise that resolves with file data
 */
async function readFileAsync(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        
        // Check if file exists using fs.promises.access
        await fs.promises.access(filePath, fs.constants.F_OK);
        
        // Using fs.promises.readFile with async/await
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        
        // Parse JSON data
        const data = JSON.parse(fileContent);
        
        return { success: true, data };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist - return empty data
            return { success: true, data: null };
        }
        throw new Error(`Failed to read file: ${error.message}`);
    }
}

// ========================================
// LOGGING OPERATIONS
// ========================================
/**
 * Append log entry to log file
 * Demonstrates fs.appendFile for logging
 * @param {string} message - Log message
 * @returns {Promise}
 */
async function appendLog(message) {
    try {
        // Create logs directory if it doesn't exist
        await ensureDirectoryExists(LOGS_DIR);
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        const logFile = path.join(LOGS_DIR, 'app.log');
        
        // Using fs.promises.appendFile to append to log file
        await fs.promises.appendFile(logFile, logEntry, 'utf8');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to write log:', error.message);
        throw error;
    }
}

/**
 * Read log file contents
 * @returns {Promise<string>} - Log file contents
 */
async function readLogs() {
    try {
        const logFile = path.join(LOGS_DIR, 'app.log');
        
        // Check if log file exists
        await fs.promises.access(logFile, fs.constants.F_OK);
        
        // Read log file
        const logs = await fs.promises.readFile(logFile, 'utf8');
        
        return { success: true, logs };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { success: true, logs: 'No logs available yet.' };
        }
        throw new Error(`Failed to read logs: ${error.message}`);
    }
}

// ========================================
// DIRECTORY OPERATIONS
// ========================================
/**
 * Ensure directory exists, create if it doesn't
 * Demonstrates fs.mkdir with recursive option
 * @param {string} dirPath - Directory path
 * @returns {Promise}
 */
async function ensureDirectoryExists(dirPath) {
    try {
        // Using fs.promises.mkdir with recursive option
        await fs.promises.mkdir(dirPath, { recursive: true });
        return { success: true };
    } catch (error) {
        throw new Error(`Failed to create directory: ${error.message}`);
    }
}

/**
 * List all files in a directory
 * Demonstrates fs.readdir
 * @param {string} dirPath - Directory path
 * @returns {Promise<Array>} - Array of filenames
 */
async function listFiles(dirPath) {
    try {
        // Using fs.promises.readdir to list directory contents
        const files = await fs.promises.readdir(dirPath);
        
        // Filter only files (not directories)
        const fileList = [];
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.promises.stat(filePath);
            
            if (stats.isFile()) {
                fileList.push({
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    extension: path.extname(file) // Using path.extname
                });
            }
        }
        
        return { success: true, files: fileList };
    } catch (error) {
        throw new Error(`Failed to list files: ${error.message}`);
    }
}

// ========================================
// INITIALIZE DATA DIRECTORIES
// ========================================
/**
 * Initialize required directories on startup
 */
async function initializeDirectories() {
    try {
        await ensureDirectoryExists(DATA_DIR);
        await ensureDirectoryExists(LOGS_DIR);
        console.log('✅ Data directories initialized');
    } catch (error) {
        console.error('❌ Failed to initialize directories:', error.message);
    }
}

// Call initialization
initializeDirectories();

// ========================================
// MODULE EXPORTS
// ========================================
// Using module.exports to export functions (demonstrates custom module creation)
module.exports = {
    writeFileCallback,    // Callback pattern
    writeFilePromise,     // Promise pattern
    writeFileAsync,       // Async/Await pattern
    readFileAsync,
    appendLog,
    readLogs,
    ensureDirectoryExists,
    listFiles,
    DATA_DIR,
    LOGS_DIR
};
