// ========================================
// CUSTOM MODULE - utils/systemInfo.js
// ========================================
// This demonstrates:
// 1. OS module usage for system information
// 2. Custom module creation
// 3. Various OS module methods
// ========================================

// Using Node.js built-in OS module
const os = require('os');

// ========================================
// SYSTEM INFORMATION FUNCTIONS
// ========================================

/**
 * Get basic system information
 * Demonstrates various os module methods
 * @returns {object} - System information object
 */
function getSystemInfo() {
    return {
        // Using os.platform() to get operating system platform
        platform: os.platform(),
        
        // Using os.type() to get operating system name
        type: os.type(),
        
        // Using os.arch() to get CPU architecture
        architecture: os.arch(),
        
        // Using os.hostname() to get system hostname
        hostname: os.hostname(),
        
        // Using os.release() to get OS release version
        release: os.release(),
        
        // Using os.uptime() to get system uptime in seconds
        uptime: formatUptime(os.uptime()),
        
        // Using os.totalmem() to get total system memory
        totalMemory: formatBytes(os.totalmem()),
        
        // Using os.freemem() to get free system memory
        freeMemory: formatBytes(os.freemem()),
        
        // Calculate memory usage percentage
        memoryUsage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%',
        
        // Using os.cpus() to get CPU information
        cpuCount: os.cpus().length,
        cpuModel: os.cpus()[0].model,
        
        // Using os.networkInterfaces() to get network interfaces
        networkInterfaces: Object.keys(os.networkInterfaces()),
        
        // Using os.homedir() to get user home directory
        homeDirectory: os.homedir(),
        
        // Using os.tmpdir() to get temporary directory
        tempDirectory: os.tmpdir(),
        
        // Node.js process information
        nodeVersion: process.version,
        pid: process.pid
    };
}

/**
 * Get detailed CPU information
 * Demonstrates os.cpus() method
 * @returns {Array} - Array of CPU information
 */
function getCPUInfo() {
    // Using os.cpus() to get detailed CPU information
    const cpus = os.cpus();
    
    return cpus.map((cpu, index) => ({
        core: index + 1,
        model: cpu.model,
        speed: `${cpu.speed} MHz`,
        times: {
            user: cpu.times.user,
            nice: cpu.times.nice,
            sys: cpu.times.sys,
            idle: cpu.times.idle,
            irq: cpu.times.irq
        }
    }));
}

/**
 * Get memory statistics
 * Demonstrates os.totalmem() and os.freemem()
 * @returns {object} - Memory statistics
 */
function getMemoryStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
        total: formatBytes(totalMem),
        free: formatBytes(freeMem),
        used: formatBytes(usedMem),
        usagePercentage: ((usedMem / totalMem) * 100).toFixed(2) + '%',
        totalBytes: totalMem,
        freeBytes: freeMem,
        usedBytes: usedMem
    };
}

/**
 * Get network interface information
 * Demonstrates os.networkInterfaces()
 * @returns {object} - Network interfaces information
 */
function getNetworkInfo() {
    // Using os.networkInterfaces() to get network information
    const interfaces = os.networkInterfaces();
    const result = {};
    
    for (const [name, addresses] of Object.entries(interfaces)) {
        result[name] = addresses.map(addr => ({
            address: addr.address,
            family: addr.family,
            internal: addr.internal,
            mac: addr.mac
        }));
    }
    
    return result;
}

/**
 * Get user information
 * Demonstrates os.userInfo()
 * @returns {object} - User information
 */
function getUserInfo() {
    // Using os.userInfo() to get current user information
    const userInfo = os.userInfo();
    
    return {
        username: userInfo.username,
        uid: userInfo.uid,
        gid: userInfo.gid,
        shell: userInfo.shell,
        homedir: userInfo.homedir
    };
}

/**
 * Get load average (Unix systems only)
 * Demonstrates os.loadavg()
 * @returns {Array|null} - Load average or null on Windows
 */
function getLoadAverage() {
    // Using os.loadavg() to get system load average
    // Returns [1, 5, 15] minute load averages
    const loadAvg = os.loadavg();
    
    if (os.platform() === 'win32') {
        return null; // Not available on Windows
    }
    
    return {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2)
    };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format uptime to human-readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} - Formatted uptime
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

/**
 * Get comprehensive system report
 * Combines all system information
 * @returns {object} - Complete system report
 */
function getSystemReport() {
    return {
        timestamp: new Date().toISOString(),
        basic: getSystemInfo(),
        memory: getMemoryStats(),
        cpu: getCPUInfo(),
        network: getNetworkInfo(),
        user: getUserInfo(),
        loadAverage: getLoadAverage()
    };
}

// ========================================
// MODULE EXPORTS
// ========================================
// Using module.exports to export functions
module.exports = {
    getSystemInfo,
    getCPUInfo,
    getMemoryStats,
    getNetworkInfo,
    getUserInfo,
    getLoadAverage,
    getSystemReport,
    formatBytes,
    formatUptime
};
